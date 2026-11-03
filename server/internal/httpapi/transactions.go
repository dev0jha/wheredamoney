package httpapi

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/wheredamoney/wheredamoney/server/internal/store"
)

type incomeRequest struct {
	Amount     string `json:"amount"`
	Source     string `json:"source"`
	CategoryID string `json:"category_id"`
	Date       string `json:"date"`
	Notes      string `json:"notes"`
	ClientID   string `json:"client_id"`
}

type expenseRequest struct {
	Amount        string `json:"amount"`
	CategoryID    string `json:"category_id"`
	PayeeID       string `json:"payee_id"`
	Date          string `json:"date"`
	PaymentMethod string `json:"payment_method"`
	Notes         string `json:"notes"`
	NotifyPayee   bool   `json:"notify_payee"`
	ClientID      string `json:"client_id"`
}

func parseListFilter(r *http.Request) (store.ListFilter, error) {
	query := r.URL.Query()
	filter := store.ListFilter{
		From:       strings.TrimSpace(query.Get("from")),
		To:         strings.TrimSpace(query.Get("to")),
		CategoryID: strings.TrimSpace(query.Get("category_id")),
		Query:      strings.TrimSpace(query.Get("q")),
		Limit:      50,
		Offset:     0,
	}
	if filter.From != "" {
		if err := validateDate(filter.From); err != nil {
			return filter, fmt.Errorf("invalid from date")
		}
	}
	if filter.To != "" {
		if err := validateDate(filter.To); err != nil {
			return filter, fmt.Errorf("invalid to date")
		}
	}
	if filter.From != "" && filter.To != "" && filter.From > filter.To {
		return filter, fmt.Errorf("from date must be before to date")
	}
	if value := query.Get("limit"); value != "" {
		limit, err := strconv.Atoi(value)
		if err != nil || limit < 1 || limit > 100 {
			return filter, fmt.Errorf("limit must be between 1 and 100")
		}
		filter.Limit = limit
	}
	if value := query.Get("offset"); value != "" {
		offset, err := strconv.Atoi(value)
		if err != nil || offset < 0 {
			return filter, fmt.Errorf("offset must be zero or greater")
		}
		filter.Offset = offset
	}
	return filter, nil
}

func (s *Server) handleListIncomes(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	filter, err := parseListFilter(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	incomes, total, err := s.store.ListIncomes(r.Context(), user.ID, filter)
	if err != nil {
		s.log.Error("list incomes", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load income entries.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"incomes": incomes,
		"pagination": map[string]int{
			"limit":  filter.Limit,
			"offset": filter.Offset,
			"total":  int(total),
		},
	})
}

func (s *Server) handleCreateIncome(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request incomeRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	input, err := incomeInputFrom(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	input.Currency = user.Currency

	income, err := s.store.CreateIncome(r.Context(), user.ID, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_category", "Choose a category that belongs to you.")
		return
	}
	if err != nil {
		s.log.Error("create income", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not save the income.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"income": income})
}

func (s *Server) handleGetIncome(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	income, err := s.store.GetIncome(r.Context(), user.ID, chi.URLParam(r, "id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Income not found.")
		return
	}
	if err != nil {
		s.log.Error("get income", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load the income.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"income": income})
}

func (s *Server) handleUpdateIncome(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request incomeRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	input, err := incomeInputFrom(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	input.Currency = user.Currency

	income, err := s.store.UpdateIncome(r.Context(), user.ID, chi.URLParam(r, "id"), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Income not found.")
		return
	}
	if err != nil {
		s.log.Error("update income", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update the income.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"income": income})
}

func (s *Server) handleDeleteIncome(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	err := s.store.DeleteIncome(r.Context(), user.ID, chi.URLParam(r, "id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Income not found.")
		return
	}
	if err != nil {
		s.log.Error("delete income", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete the income.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleListExpenses(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	filter, err := parseListFilter(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	expenses, total, err := s.store.ListExpenses(r.Context(), user.ID, filter)
	if err != nil {
		s.log.Error("list expenses", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load expenses.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"expenses": expenses,
		"pagination": map[string]int{
			"limit":  filter.Limit,
			"offset": filter.Offset,
			"total":  int(total),
		},
	})
}

func (s *Server) handleCreateExpense(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request expenseRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	input, err := expenseInputFrom(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	input.Currency = user.Currency

	expense, err := s.store.CreateExpense(r.Context(), user.ID, input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusBadRequest, "invalid_reference", "Choose a category or payee that belongs to you.")
		return
	}
	if err != nil {
		s.log.Error("create expense", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not save the expense.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"expense": expense})
}

func (s *Server) handleGetExpense(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	expense, err := s.store.GetExpense(r.Context(), user.ID, chi.URLParam(r, "id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Expense not found.")
		return
	}
	if err != nil {
		s.log.Error("get expense", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load the expense.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"expense": expense})
}

func (s *Server) handleUpdateExpense(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request expenseRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	input, err := expenseInputFrom(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	input.Currency = user.Currency

	expense, err := s.store.UpdateExpense(r.Context(), user.ID, chi.URLParam(r, "id"), input)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Expense not found.")
		return
	}
	if err != nil {
		s.log.Error("update expense", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update the expense.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"expense": expense})
}

func (s *Server) handleDeleteExpense(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	err := s.store.DeleteExpense(r.Context(), user.ID, chi.URLParam(r, "id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Expense not found.")
		return
	}
	if err != nil {
		s.log.Error("delete expense", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete the expense.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func incomeInputFrom(request incomeRequest) (store.IncomeInput, error) {
	amount, err := validateAmount(request.Amount)
	if err != nil {
		return store.IncomeInput{}, err
	}
	request.Source = strings.TrimSpace(request.Source)
	if request.Source == "" {
		return store.IncomeInput{}, fmt.Errorf("source is required")
	}
	if len(request.Source) > 160 {
		return store.IncomeInput{}, fmt.Errorf("source is too long")
	}
	if err := validateDate(request.Date); err != nil {
		return store.IncomeInput{}, err
	}
	if len(request.Notes) > 2000 {
		return store.IncomeInput{}, fmt.Errorf("notes are too long")
	}
	if len(request.ClientID) > 100 {
		return store.IncomeInput{}, fmt.Errorf("client id is too long")
	}
	return store.IncomeInput{
		AmountMinor: amount,
		Source:      request.Source,
		CategoryID:  strings.TrimSpace(request.CategoryID),
		Date:        request.Date,
		Notes:       strings.TrimSpace(request.Notes),
		ClientID:    strings.TrimSpace(request.ClientID),
	}, nil
}

func expenseInputFrom(request expenseRequest) (store.ExpenseInput, error) {
	amount, err := validateAmount(request.Amount)
	if err != nil {
		return store.ExpenseInput{}, err
	}
	if err := validateDate(request.Date); err != nil {
		return store.ExpenseInput{}, err
	}
	paymentMethod := strings.TrimSpace(request.PaymentMethod)
	if paymentMethod == "" {
		paymentMethod = "cash"
	}
	if err := validatePaymentMethod(paymentMethod); err != nil {
		return store.ExpenseInput{}, err
	}
	if len(request.Notes) > 2000 {
		return store.ExpenseInput{}, fmt.Errorf("notes are too long")
	}
	if len(request.ClientID) > 100 {
		return store.ExpenseInput{}, fmt.Errorf("client id is too long")
	}
	return store.ExpenseInput{
		AmountMinor:   amount,
		CategoryID:    strings.TrimSpace(request.CategoryID),
		PayeeID:       strings.TrimSpace(request.PayeeID),
		Date:          request.Date,
		PaymentMethod: paymentMethod,
		Notes:         strings.TrimSpace(request.Notes),
		NotifyPayee:   request.NotifyPayee,
		ClientID:      strings.TrimSpace(request.ClientID),
	}, nil
}
