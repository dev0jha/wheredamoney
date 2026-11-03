package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/wheredamoney/wheredamoney/server/internal/store"
)

type categoryRequest struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

func (s *Server) handleListCategories(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	categoryType := strings.TrimSpace(r.URL.Query().Get("type"))
	if categoryType != "" {
		if err := validateCategoryType(categoryType); err != nil {
			writeError(w, http.StatusBadRequest, "validation_error", err.Error())
			return
		}
	}

	categories, err := s.store.ListCategories(r.Context(), user.ID, categoryType)
	if err != nil {
		s.log.Error("list categories", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not load categories.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": categories})
}

func (s *Server) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request categoryRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	request.Name = strings.TrimSpace(request.Name)
	request.Color = strings.TrimSpace(request.Color)
	request.Icon = strings.TrimSpace(request.Icon)
	if request.Color == "" {
		request.Color = "#6366f1"
	}
	if request.Icon == "" {
		request.Icon = "circle"
	}
	if request.Name == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Category name is required.")
		return
	}
	if err := validateCategoryType(request.Type); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateColor(request.Color); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateIcon(request.Icon); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	category, err := s.store.CreateCategory(r.Context(), user.ID, request.Name, request.Type, request.Color, request.Icon)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "category_exists", "A category with that name already exists.")
		return
	}
	if err != nil {
		s.log.Error("create category", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create the category.")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"category": category})
}

func (s *Server) handleUpdateCategory(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	var request categoryRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	request.Name = strings.TrimSpace(request.Name)
	request.Color = strings.TrimSpace(request.Color)
	request.Icon = strings.TrimSpace(request.Icon)
	if request.Color == "" {
		request.Color = "#6366f1"
	}
	if request.Icon == "" {
		request.Icon = "circle"
	}
	if request.Name == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Category name is required.")
		return
	}
	if err := validateColor(request.Color); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	if err := validateIcon(request.Icon); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	category, err := s.store.UpdateCategory(r.Context(), user.ID, chi.URLParam(r, "id"), request.Name, request.Color, request.Icon)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Category not found.")
		return
	}
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "category_exists", "A category with that name already exists.")
		return
	}
	if err != nil {
		s.log.Error("update category", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not update the category.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"category": category})
}

func (s *Server) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	user, _ := userFrom(r.Context())
	err := s.store.DeleteCategory(r.Context(), user.ID, chi.URLParam(r, "id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Category not found.")
		return
	}
	if err != nil {
		s.log.Error("delete category", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not delete the category.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
