package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"golang.org/x/time/rate"

	"github.com/wheredamoney/wheredamoney/server/internal/auth"
	"github.com/wheredamoney/wheredamoney/server/internal/config"
	"github.com/wheredamoney/wheredamoney/server/internal/mailer"
	"github.com/wheredamoney/wheredamoney/server/internal/models"
	"github.com/wheredamoney/wheredamoney/server/internal/store"
)

const sessionCookieName = "wdm_session"

type Server struct {
	cfg       config.Config
	store     *store.Store
	mailer    *mailer.Mailer
	log       *slog.Logger
	limiter   *ipLimiter
	dummyHash string
}

func New(cfg config.Config, st *store.Store, mail *mailer.Mailer, log *slog.Logger) (*Server, error) {
	dummy, err := auth.HashPassword("wheredamoney-dummy-password")
	if err != nil {
		return nil, err
	}
	return &Server{
		cfg:       cfg,
		store:     st,
		mailer:    mail,
		log:       log,
		limiter:   newIPLimiter(rate.Every(12*time.Second), 5),
		dummyHash: dummy,
	}, nil
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(s.recoverer)
	r.Use(s.requestLogger)
	r.Use(s.cors)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(s.authenticate)

	r.Get("/healthz", s.handleHealth)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.With(s.rateLimit).Post("/register", s.handleRegister)
			r.With(s.rateLimit).Post("/login", s.handleLogin)
			r.Post("/logout", s.handleLogout)
			r.Get("/me", s.handleMe)
			r.With(s.rateLimit).Post("/forgot", s.handleForgotPassword)
			r.With(s.rateLimit).Post("/reset", s.handleResetPassword)
			r.Get("/verify", s.handleVerifyEmail)
		})

		r.Group(func(r chi.Router) {
			r.Use(s.requireAuth)

			r.Get("/categories", s.handleListCategories)
			r.Post("/categories", s.handleCreateCategory)
			r.Put("/categories/{id}", s.handleUpdateCategory)
			r.Delete("/categories/{id}", s.handleDeleteCategory)

			r.Get("/incomes", s.handleListIncomes)
			r.Post("/incomes", s.handleCreateIncome)
			r.Get("/incomes/{id}", s.handleGetIncome)
			r.Put("/incomes/{id}", s.handleUpdateIncome)
			r.Delete("/incomes/{id}", s.handleDeleteIncome)

			r.Get("/expenses", s.handleListExpenses)
			r.Post("/expenses", s.handleCreateExpense)
			r.Get("/expenses/{id}", s.handleGetExpense)
			r.Put("/expenses/{id}", s.handleUpdateExpense)
			r.Delete("/expenses/{id}", s.handleDeleteExpense)

			r.Get("/dashboard/summary", s.handleDashboardSummary)
			r.Get("/dashboard/trends", s.handleDashboardTrends)
			r.Get("/dashboard/categories", s.handleDashboardCategories)
			r.Get("/dashboard/recent", s.handleDashboardRecent)
			r.Get("/dashboard/top-payees", s.handleDashboardTopPayees)

			r.Get("/settings/profile", s.handleGetProfile)
			r.Put("/settings/profile", s.handleUpdateProfile)
		})
	})

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := s.store.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "unavailable", "database is unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type contextKey string

const (
	userContextKey    contextKey = "user"
	sessionContextKey contextKey = "session"
)

func userFrom(ctx context.Context) (models.User, bool) {
	user, ok := ctx.Value(userContextKey).(models.User)
	return user, ok
}

func sessionFrom(ctx context.Context) (string, bool) {
	session, ok := ctx.Value(sessionContextKey).(string)
	return session, ok
}

func (s *Server) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookieName)
		if err != nil || cookie.Value == "" {
			next.ServeHTTP(w, r)
			return
		}
		user, sessionID, err := s.store.GetSession(r.Context(), auth.HashToken(cookie.Value))
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		_ = s.store.TouchSession(r.Context(), sessionID)
		ctx := context.WithValue(r.Context(), userContextKey, user)
		ctx = context.WithValue(ctx, sessionContextKey, sessionID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := userFrom(r.Context()); !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized", "You need to sign in to do that.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && origin == s.cfg.AppOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if isMutating(r.Method) {
			if origin != "" && origin != s.cfg.AppOrigin {
				writeError(w, http.StatusForbidden, "forbidden", "Request origin is not allowed.")
				return
			}
			if referer := r.Header.Get("Referer"); referer != "" && !strings.HasPrefix(referer, s.cfg.AppOrigin) {
				writeError(w, http.StatusForbidden, "forbidden", "Request origin is not allowed.")
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) rateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !s.limiter.allow(ip) {
			writeError(w, http.StatusTooManyRequests, "rate_limited", "Too many attempts. Try again in a minute.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				s.log.Error("panic recovered", "error", recovered, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "internal_error", "Something went wrong.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (s *Server) requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wrapped, r)
		s.log.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.status,
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", middleware.GetReqID(r.Context()),
			"ip", clientIP(r),
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (w *responseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func isMutating(method string) bool {
	return method != http.MethodGet && method != http.MethodHead && method != http.MethodOptions
}

type ipLimiter struct {
	mu       sync.Mutex
	limit    rate.Limit
	burst    int
	visitors map[string]*rate.Limiter
}

func newIPLimiter(limit rate.Limit, burst int) *ipLimiter {
	return &ipLimiter{
		limit:    limit,
		burst:    burst,
		visitors: make(map[string]*rate.Limiter),
	}
}

func (l *ipLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	limiter, ok := l.visitors[ip]
	if !ok {
		limiter = rate.NewLimiter(l.limit, l.burst)
		l.visitors[ip] = limiter
	}
	return limiter.Allow()
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Default().Error("encode response", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{
		"error": map[string]string{"code": code, "message": message},
	})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		if errors.Is(err, io.EOF) {
			return fmt.Errorf("request body is required")
		}
		return fmt.Errorf("invalid request body")
	}
	if decoder.More() {
		return fmt.Errorf("invalid request body")
	}
	return nil
}
