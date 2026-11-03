package httpapi

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/wheredamoney/wheredamoney/server/internal/auth"
	"github.com/wheredamoney/wheredamoney/server/internal/models"
	"github.com/wheredamoney/wheredamoney/server/internal/store"
)

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type forgotRequest struct {
	Email string `json:"email"`
}

type resetRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var request registerRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Email = normalizeEmail(request.Email)
	if err := validateName(request.Name); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateEmail(request.Email); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validatePassword(request.Password); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	passwordHash, err := auth.HashPassword(request.Password)
	if err != nil {
		s.log.Error("hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create your account.")
		return
	}

	user, err := s.store.CreateUser(r.Context(), request.Email, passwordHash, request.Name)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "email_taken", "An account with that email already exists.")
		return
	}
	if err != nil {
		s.log.Error("create user", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create your account.")
		return
	}

	s.sendVerificationEmail(user)

	if err := s.startSession(w, r, user.ID); err != nil {
		s.log.Error("create session", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not start your session.")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"user": user})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var request loginRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	email := normalizeEmail(request.Email)
	user, passwordHash, err := s.store.GetUserByEmail(r.Context(), email)
	if errors.Is(err, store.ErrNotFound) {
		_, _ = auth.VerifyPassword(request.Password, s.dummyHash)
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.")
		return
	}
	if err != nil {
		s.log.Error("lookup user", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not sign you in.")
		return
	}

	ok, err := auth.VerifyPassword(request.Password, passwordHash)
	if err != nil || !ok {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.")
		return
	}

	if err := s.startSession(w, r, user.ID); err != nil {
		s.log.Error("create session", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not start your session.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookieName); err == nil && cookie.Value != "" {
		if err := s.store.DeleteSession(r.Context(), auth.HashToken(cookie.Value)); err != nil {
			s.log.Error("delete session", "error", err)
		}
	}
	s.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "You are not signed in.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	var request forgotRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	email := normalizeEmail(request.Email)
	if err := validateEmail(email); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	user, _, err := s.store.GetUserByEmail(r.Context(), email)
	if err == nil {
		token, tokenErr := auth.NewToken()
		if tokenErr == nil {
			expiresAt := time.Now().Add(time.Hour)
			if tokenErr = s.store.CreatePasswordResetToken(r.Context(), user.ID, auth.HashToken(token), expiresAt); tokenErr == nil {
				link := s.cfg.AppOrigin + "/reset-password?token=" + url.QueryEscape(token)
				go func() {
					ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
					defer cancel()
					if sendErr := s.mailer.SendPasswordReset(ctx, user.Email, user.Name, link); sendErr != nil {
						s.log.Error("send password reset email", "error", sendErr, "user_id", user.ID)
					}
				}()
			}
		}
		if tokenErr != nil {
			s.log.Error("create password reset token", "error", tokenErr, "user_id", user.ID)
		}
	}

	writeJSON(w, http.StatusAccepted, map[string]string{
		"message": "If that email is registered, a reset link is on its way.",
	})
}

func (s *Server) handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var request resetRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	if strings.TrimSpace(request.Token) == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Reset token is required.")
		return
	}
	if err := validatePassword(request.Password); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	passwordHash, err := auth.HashPassword(request.Password)
	if err != nil {
		s.log.Error("hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not reset your password.")
		return
	}

	err = s.store.ConsumePasswordResetToken(r.Context(), auth.HashToken(request.Token), passwordHash)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_token", "This reset link is invalid or has expired.")
		return
	}
	if err != nil {
		s.log.Error("consume reset token", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not reset your password.")
		return
	}

	s.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Redirect(w, r, s.cfg.AppOrigin+"/login?verified=0", http.StatusSeeOther)
		return
	}
	if err := s.store.ConsumeEmailVerificationToken(r.Context(), auth.HashToken(token)); err != nil {
		http.Redirect(w, r, s.cfg.AppOrigin+"/login?verified=0", http.StatusSeeOther)
		return
	}
	http.Redirect(w, r, s.cfg.AppOrigin+"/login?verified=1", http.StatusSeeOther)
}

func (s *Server) handleGetProfile(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request struct {
		Name          string `json:"name"`
		Currency      string `json:"currency"`
		Timezone      string `json:"timezone"`
		MonthStartDay int    `json:"month_start_day"`
	}
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	request.Name = strings.TrimSpace(request.Name)
	request.Currency = strings.ToUpper(strings.TrimSpace(request.Currency))
	if err := validateName(request.Name); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateCurrency(request.Currency); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateTimezone(request.Timezone); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateMonthStartDay(request.MonthStartDay); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	updated, err := s.store.UpdateUserProfile(r.Context(), user.ID, request.Name, request.Currency, request.Timezone, request.MonthStartDay)
	if err != nil {
		s.log.Error("update profile", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update your profile.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": updated})
}

func (s *Server) startSession(w http.ResponseWriter, r *http.Request, userID string) error {
	token, err := auth.NewToken()
	if err != nil {
		return err
	}
	expiresAt := time.Now().Add(s.cfg.SessionTTL)
	if err := s.store.CreateSession(r.Context(), userID, auth.HashToken(token), expiresAt, r.UserAgent()); err != nil {
		return err
	}
	s.setSessionCookie(w, token, expiresAt)
	return nil
}

func (s *Server) setSessionCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   s.cfg.SessionCookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})
}

func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.cfg.SessionCookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func (s *Server) sendVerificationEmail(user models.User) {
	token, err := auth.NewToken()
	if err != nil {
		s.log.Error("create verification token", "error", err)
		return
	}
	expiresAt := time.Now().Add(24 * time.Hour)
	if err := s.store.CreateEmailVerificationToken(context.Background(), user.ID, auth.HashToken(token), expiresAt); err != nil {
		s.log.Error("store verification token", "error", err)
		return
	}
	link := s.cfg.AppOrigin + "/api/v1/auth/verify?token=" + url.QueryEscape(token)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := s.mailer.SendVerification(ctx, user.Email, user.Name, link); err != nil {
			s.log.Error("send verification email", "error", err, "user_id", user.ID)
		}
	}()
}
