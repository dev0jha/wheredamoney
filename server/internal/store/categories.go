package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

const categoryColumns = `id::text, name, type::text, color, icon, is_default, created_at`

func scanCategory(row pgx.Row) (models.Category, error) {
	var category models.Category
	err := row.Scan(
		&category.ID,
		&category.Name,
		&category.Type,
		&category.Color,
		&category.Icon,
		&category.IsDefault,
		&category.CreatedAt,
	)
	return category, err
}

func (s *Store) ListCategories(ctx context.Context, userID, categoryType string) ([]models.Category, error) {
	query := `select ` + categoryColumns + ` from categories where user_id = $1`
	args := []any{userID}
	if categoryType != "" {
		query += ` and type = $2`
		args = append(args, categoryType)
	}
	query += ` order by type, name`

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := make([]models.Category, 0)
	for rows.Next() {
		category, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, rows.Err()
}

func (s *Store) CreateCategory(ctx context.Context, userID, name, categoryType, color, icon string) (models.Category, error) {
	row := s.pool.QueryRow(ctx, `
		insert into categories (user_id, name, type, color, icon)
		values ($1, $2, $3, $4, $5)
		returning `+categoryColumns,
		userID, name, categoryType, color, icon)
	category, err := scanCategory(row)
	if isUniqueViolation(err) {
		return models.Category{}, ErrConflict
	}
	return category, err
}

func (s *Store) UpdateCategory(ctx context.Context, userID, categoryID, name, color, icon string) (models.Category, error) {
	row := s.pool.QueryRow(ctx, `
		update categories
		set name = $3, color = $4, icon = $5, updated_at = now()
		where id = $1 and user_id = $2
		returning `+categoryColumns,
		userID, categoryID, name, color, icon)
	category, err := scanCategory(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Category{}, ErrNotFound
	}
	if isUniqueViolation(err) {
		return models.Category{}, ErrConflict
	}
	return category, err
}

func (s *Store) DeleteCategory(ctx context.Context, userID, categoryID string) error {
	tag, err := s.pool.Exec(ctx, `delete from categories where id = $1 and user_id = $2`, categoryID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) categoryBelongsToUser(ctx context.Context, userID, categoryID string) (bool, error) {
	if categoryID == "" {
		return true, nil
	}
	var exists bool
	err := s.pool.QueryRow(ctx, `
		select exists(select 1 from categories where id = $1 and user_id = $2)`,
		categoryID, userID).Scan(&exists)
	return exists, err
}

func (s *Store) payeeBelongsToUser(ctx context.Context, userID, payeeID string) (bool, error) {
	if payeeID == "" {
		return true, nil
	}
	var exists bool
	err := s.pool.QueryRow(ctx, `
		select exists(select 1 from payees where id = $1 and user_id = $2)`,
		payeeID, userID).Scan(&exists)
	return exists, err
}

func validateCategoryOwnership(ctx context.Context, s *Store, userID, categoryID string) error {
	ok, err := s.categoryBelongsToUser(ctx, userID, categoryID)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("%w: category does not belong to user", ErrNotFound)
	}
	return nil
}
