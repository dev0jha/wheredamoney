package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
)

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Ping(ctx context.Context) error {
	return s.pool.Ping(ctx)
}

const userColumns = `id::text, email, name, currency, timezone, month_start_day, email_verified_at is not null, created_at`

const userColumnsQualified = `u.id::text, u.email, u.name, u.currency, u.timezone, u.month_start_day, u.email_verified_at is not null, u.created_at`

func scanUser(row pgx.Row) (models.User, error) {
	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Currency,
		&user.Timezone,
		&user.MonthStartDay,
		&user.EmailVerified,
		&user.CreatedAt,
	)
	return user, err
}

func (s *Store) CreateUser(ctx context.Context, email, passwordHash, name string) (models.User, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return models.User{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	row := tx.QueryRow(ctx, `
		insert into users (email, password_hash, name)
		values ($1, $2, $3)
		returning `+userColumns,
		email, passwordHash, name,
	)
	user, err := scanUser(row)
	if err != nil {
		if isUniqueViolation(err) {
			return models.User{}, ErrConflict
		}
		return models.User{}, fmt.Errorf("insert user: %w", err)
	}

	if err := seedDefaultCategories(ctx, tx, user.ID); err != nil {
		return models.User{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return models.User{}, err
	}
	return user, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (models.User, string, error) {
	var passwordHash string
	row := s.pool.QueryRow(ctx, `
		select `+userColumns+`, password_hash
		from users where email = $1`, email)
	user, err := scanUserWithHash(row, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.User{}, "", ErrNotFound
	}
	return user, passwordHash, err
}

func (s *Store) GetUserByID(ctx context.Context, id string) (models.User, error) {
	row := s.pool.QueryRow(ctx, `select `+userColumns+` from users where id = $1`, id)
	user, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.User{}, ErrNotFound
	}
	return user, err
}

func (s *Store) UpdateUserProfile(ctx context.Context, userID, name, currency, timezone string, monthStartDay int) (models.User, error) {
	row := s.pool.QueryRow(ctx, `
		update users
		set name = $2, currency = $3, timezone = $4, month_start_day = $5, updated_at = now()
		where id = $1
		returning `+userColumns,
		userID, name, currency, timezone, monthStartDay,
	)
	user, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.User{}, ErrNotFound
	}
	return user, err
}

func (s *Store) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	tag, err := s.pool.Exec(ctx, `
		update users set password_hash = $2, updated_at = now() where id = $1`,
		userID, passwordHash)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time, userAgent string) error {
	_, err := s.pool.Exec(ctx, `
		insert into sessions (user_id, token_hash, expires_at, user_agent)
		values ($1, $2, $3, $4)`,
		userID, tokenHash, expiresAt, nullIfEmpty(userAgent))
	return err
}

func (s *Store) GetSession(ctx context.Context, tokenHash string) (models.User, string, error) {
	row := s.pool.QueryRow(ctx, `
		select s.id::text, `+userColumnsQualified+`
		from sessions s
		join users u on u.id = s.user_id
		where s.token_hash = $1 and s.expires_at > now()`,
		tokenHash)

	var sessionID string
	var user models.User
	err := row.Scan(
		&sessionID,
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Currency,
		&user.Timezone,
		&user.MonthStartDay,
		&user.EmailVerified,
		&user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.User{}, "", ErrNotFound
	}
	if err != nil {
		return models.User{}, "", err
	}
	return user, sessionID, nil
}

func (s *Store) TouchSession(ctx context.Context, sessionID string) error {
	_, err := s.pool.Exec(ctx, `update sessions set last_used_at = now() where id = $1`, sessionID)
	return err
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.pool.Exec(ctx, `delete from sessions where token_hash = $1`, tokenHash)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) (int64, error) {
	tag, err := s.pool.Exec(ctx, `delete from sessions where expires_at <= now()`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *Store) CreateEmailVerificationToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := s.pool.Exec(ctx, `
		insert into email_verification_tokens (user_id, token_hash, expires_at)
		values ($1, $2, $3)`, userID, tokenHash, expiresAt)
	return err
}

func (s *Store) ConsumeEmailVerificationToken(ctx context.Context, tokenHash string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var userID string
	err = tx.QueryRow(ctx, `
		update email_verification_tokens
		set used_at = now()
		where token_hash = $1 and used_at is null and expires_at > now()
		returning user_id::text`, tokenHash).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		update users set email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
		where id = $1`, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Store) CreatePasswordResetToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := s.pool.Exec(ctx, `
		insert into password_reset_tokens (user_id, token_hash, expires_at)
		values ($1, $2, $3)`, userID, tokenHash, expiresAt)
	return err
}

func (s *Store) ConsumePasswordResetToken(ctx context.Context, tokenHash, passwordHash string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var userID string
	err = tx.QueryRow(ctx, `
		update password_reset_tokens
		set used_at = now()
		where token_hash = $1 and used_at is null and expires_at > now()
		returning user_id::text`, tokenHash).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		update users set password_hash = $2, updated_at = now() where id = $1`,
		userID, passwordHash); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `delete from sessions where user_id = $1`, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func scanUserWithHash(row pgx.Row, passwordHash *string) (models.User, error) {
	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Currency,
		&user.Timezone,
		&user.MonthStartDay,
		&user.EmailVerified,
		&user.CreatedAt,
		passwordHash,
	)
	return user, err
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func nullIfEmpty(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func textOrNil(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func parseDate(value string) (time.Time, error) {
	return time.Parse("2006-01-02", value)
}

type defaultCategory struct {
	Name  string
	Type  string
	Color string
	Icon  string
}

var defaultCategories = []defaultCategory{
	{"Food", "expense", "#f97316", "utensils"},
	{"Rent", "expense", "#6366f1", "home"},
	{"Transport", "expense", "#06b6d4", "car"},
	{"Bills", "expense", "#eab308", "receipt"},
	{"Health", "expense", "#ef4444", "heart-pulse"},
	{"Shopping", "expense", "#ec4899", "shopping-bag"},
	{"Education", "expense", "#8b5cf6", "graduation-cap"},
	{"Entertainment", "expense", "#14b8a6", "clapperboard"},
	{"Other", "expense", "#71717a", "circle"},
	{"Salary", "income", "#22c55e", "briefcase"},
	{"Freelance", "income", "#10b981", "laptop"},
	{"Business", "income", "#0ea5e9", "store"},
	{"Gift", "income", "#f43f5e", "gift"},
	{"Other", "income", "#71717a", "circle"},
}

func seedDefaultCategories(ctx context.Context, tx pgx.Tx, userID string) error {
	for _, category := range defaultCategories {
		if _, err := tx.Exec(ctx, `
			insert into categories (user_id, name, type, color, icon, is_default)
			values ($1, $2, $3, $4, $5, true)`,
			userID, category.Name, category.Type, category.Color, category.Icon); err != nil {
			return fmt.Errorf("seed categories: %w", err)
		}
	}
	return nil
}
