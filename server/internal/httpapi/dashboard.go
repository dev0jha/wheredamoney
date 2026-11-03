package httpapi

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

func (s *Server) handleDashboardSummary(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	from, to, err := resolvePeriod(r, user)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	summary, err := s.store.DashboardSummary(r.Context(), user.ID, from, to)
	if err != nil {
		s.log.Error("dashboard summary", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load your summary.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"summary": summary})
}

func (s *Server) handleDashboardTrends(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	months := 6
	if value := r.URL.Query().Get("months"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 24 {
			writeError(w, http.StatusBadRequest, "validation_error", "months must be between 1 and 24.")
			return
		}
		months = parsed
	}
	points, err := s.store.DashboardTrends(r.Context(), user.ID, trendsStart(user, months), months)
	if err != nil {
		s.log.Error("dashboard trends", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load your trends.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"trends": points})
}

func (s *Server) handleDashboardCategories(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	from, to, err := resolvePeriod(r, user)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	kind := strings.TrimSpace(r.URL.Query().Get("type"))
	if kind == "" {
		kind = "expense"
	}
	if err := validateCategoryType(kind); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	categories, err := s.store.CategoryBreakdown(r.Context(), user.ID, from, to, kind)
	if err != nil {
		s.log.Error("dashboard categories", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load your categories.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": categories})
}

func (s *Server) handleDashboardRecent(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	limit := 8
	if value := r.URL.Query().Get("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 50 {
			writeError(w, http.StatusBadRequest, "validation_error", "limit must be between 1 and 50.")
			return
		}
		limit = parsed
	}
	transactions, err := s.store.ListRecentTransactions(r.Context(), user.ID, limit)
	if err != nil {
		s.log.Error("dashboard recent", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load recent transactions.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"transactions": transactions})
}

func (s *Server) handleDashboardTopPayees(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	from, to, err := resolvePeriod(r, user)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	limit := 5
	if value := r.URL.Query().Get("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 20 {
			writeError(w, http.StatusBadRequest, "validation_error", "limit must be between 1 and 20.")
			return
		}
		limit = parsed
	}
	payees, err := s.store.TopPayees(r.Context(), user.ID, from, to, limit)
	if err != nil {
		s.log.Error("dashboard top payees", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load payees.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"payees": payees})
}

func resolvePeriod(r *http.Request, user models.User) (string, string, error) {
	query := r.URL.Query()
	from := strings.TrimSpace(query.Get("from"))
	to := strings.TrimSpace(query.Get("to"))
	if from != "" || to != "" {
		if from == "" || to == "" {
			return "", "", fmt.Errorf("from and to dates are required together")
		}
		if err := validateDate(from); err != nil {
			return "", "", fmt.Errorf("invalid from date")
		}
		if err := validateDate(to); err != nil {
			return "", "", fmt.Errorf("invalid to date")
		}
		if from > to {
			return "", "", fmt.Errorf("from date must be before to date")
		}
		return from, to, nil
	}
	month := strings.TrimSpace(query.Get("month"))
	if err := validateMonth(month); err != nil {
		return "", "", err
	}
	return periodForMonth(user, month)
}
