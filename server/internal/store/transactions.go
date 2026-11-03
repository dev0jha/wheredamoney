package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

type ListFilter struct {
	From       string
	To         string
	CategoryID string
	Query      string
	Limit      int
	Offset     int
}

type IncomeInput struct {
	AmountMinor int64
	Currency    string
	Source      string
	CategoryID  string
	Date        string
	Notes       string
	ClientID    string
}

type ExpenseInput struct {
	AmountMinor   int64
	Currency      string
	CategoryID    string
	PayeeID       string
	Date          string
	PaymentMethod string
	Notes         string
	NotifyPayee   bool
	ClientID      string
}

const incomeSelect = `
	select i.id::text, i.amount_minor, i.currency, i.source,
	       coalesce(i.category_id::text, ''), coalesce(c.name, ''), coalesce(c.color, ''),
	       i.date::text, coalesce(i.notes, ''), coalesce(i.client_id, ''), i.created_at
	from incomes i
	left join categories c on c.id = i.category_id`

const expenseSelect = `
	select e.id::text, e.amount_minor, e.currency,
	       coalesce(e.category_id::text, ''), coalesce(c.name, ''), coalesce(c.color, ''),
	       coalesce(e.payee_id::text, ''), coalesce(p.name, ''),
	       e.date::text, e.payment_method::text, coalesce(e.notes, ''),
	       e.notify_payee, coalesce(e.client_id, ''), e.created_at
	from expenses e
	left join categories c on c.id = e.category_id
	left join payees p on p.id = e.payee_id`

func scanIncome(row pgx.Row) (models.Income, error) {
	var income models.Income
	var categoryID, categoryName, categoryColor, notes, clientID string
	err := row.Scan(
		&income.ID,
		&income.AmountMinor,
		&income.Currency,
		&income.Source,
		&categoryID,
		&categoryName,
		&categoryColor,
		&income.Date,
		&notes,
		&clientID,
		&income.CreatedAt,
	)
	if err != nil {
		return models.Income{}, err
	}
	income.CategoryID = textOrNil(categoryID)
	income.CategoryName = textOrNil(categoryName)
	income.CategoryColor = textOrNil(categoryColor)
	income.Notes = textOrNil(notes)
	income.ClientID = textOrNil(clientID)
	return income, nil
}

func scanExpense(row pgx.Row) (models.Expense, error) {
	var expense models.Expense
	var categoryID, categoryName, categoryColor, payeeID, payeeName, notes, clientID string
	err := row.Scan(
		&expense.ID,
		&expense.AmountMinor,
		&expense.Currency,
		&categoryID,
		&categoryName,
		&categoryColor,
		&payeeID,
		&payeeName,
		&expense.Date,
		&expense.PaymentMethod,
		&notes,
		&expense.NotifyPayee,
		&clientID,
		&expense.CreatedAt,
	)
	if err != nil {
		return models.Expense{}, err
	}
	expense.CategoryID = textOrNil(categoryID)
	expense.CategoryName = textOrNil(categoryName)
	expense.CategoryColor = textOrNil(categoryColor)
	expense.PayeeID = textOrNil(payeeID)
	expense.PayeeName = textOrNil(payeeName)
	expense.Notes = textOrNil(notes)
	expense.ClientID = textOrNil(clientID)
	return expense, nil
}

func (s *Store) ListIncomes(ctx context.Context, userID string, filter ListFilter) ([]models.Income, int64, error) {
	where, args := transactionWhere("i", userID, filter)
	var total int64
	if err := s.pool.QueryRow(ctx, `
		select count(*) from incomes i left join categories c on c.id = i.category_id where `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := incomeSelect + ` where ` + where + ` order by i.date desc, i.created_at desc limit $` + fmt.Sprint(len(args)+1) + ` offset $` + fmt.Sprint(len(args)+2)
	args = append(args, filter.Limit, filter.Offset)
	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	incomes := make([]models.Income, 0)
	for rows.Next() {
		income, err := scanIncome(rows)
		if err != nil {
			return nil, 0, err
		}
		incomes = append(incomes, income)
	}
	return incomes, total, rows.Err()
}

func (s *Store) GetIncome(ctx context.Context, userID, incomeID string) (models.Income, error) {
	row := s.pool.QueryRow(ctx, incomeSelect+` where i.id = $1 and i.user_id = $2`, incomeID, userID)
	income, err := scanIncome(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Income{}, ErrNotFound
	}
	return income, err
}

func (s *Store) CreateIncome(ctx context.Context, userID string, input IncomeInput) (models.Income, error) {
	if err := validateCategoryOwnership(ctx, s, userID, input.CategoryID); err != nil {
		return models.Income{}, err
	}
	var id string
	err := s.pool.QueryRow(ctx, `
		insert into incomes (user_id, amount_minor, currency, source, category_id, date, notes, client_id)
		values ($1, $2, $3, $4, nullif($5, '')::uuid, $6::date, nullif($7, ''), nullif($8, ''))
		on conflict (user_id, client_id) do nothing
		returning id::text`,
		userID, input.AmountMinor, input.Currency, input.Source, input.CategoryID,
		input.Date, input.Notes, input.ClientID).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) && input.ClientID != "" {
		return s.getIncomeByClientID(ctx, userID, input.ClientID)
	}
	if err != nil {
		return models.Income{}, err
	}
	return s.GetIncome(ctx, userID, id)
}

func (s *Store) getIncomeByClientID(ctx context.Context, userID, clientID string) (models.Income, error) {
	row := s.pool.QueryRow(ctx, incomeSelect+` where i.user_id = $1 and i.client_id = $2`, userID, clientID)
	income, err := scanIncome(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Income{}, ErrNotFound
	}
	return income, err
}

func (s *Store) UpdateIncome(ctx context.Context, userID, incomeID string, input IncomeInput) (models.Income, error) {
	if err := validateCategoryOwnership(ctx, s, userID, input.CategoryID); err != nil {
		return models.Income{}, err
	}
	tag, err := s.pool.Exec(ctx, `
		update incomes
		set amount_minor = $3, source = $4, category_id = nullif($5, '')::uuid,
		    date = $6::date, notes = nullif($7, ''), updated_at = now()
		where id = $1 and user_id = $2`,
		incomeID, userID, input.AmountMinor, input.Source, input.CategoryID, input.Date, input.Notes)
	if err != nil {
		return models.Income{}, err
	}
	if tag.RowsAffected() == 0 {
		return models.Income{}, ErrNotFound
	}
	return s.GetIncome(ctx, userID, incomeID)
}

func (s *Store) DeleteIncome(ctx context.Context, userID, incomeID string) error {
	tag, err := s.pool.Exec(ctx, `delete from incomes where id = $1 and user_id = $2`, incomeID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListExpenses(ctx context.Context, userID string, filter ListFilter) ([]models.Expense, int64, error) {
	where, args := transactionWhere("e", userID, filter)
	var total int64
	if err := s.pool.QueryRow(ctx, `
		select count(*) from expenses e left join categories c on c.id = e.category_id where `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := expenseSelect + ` where ` + where + ` order by e.date desc, e.created_at desc limit $` + fmt.Sprint(len(args)+1) + ` offset $` + fmt.Sprint(len(args)+2)
	args = append(args, filter.Limit, filter.Offset)
	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	expenses := make([]models.Expense, 0)
	for rows.Next() {
		expense, err := scanExpense(rows)
		if err != nil {
			return nil, 0, err
		}
		expenses = append(expenses, expense)
	}
	return expenses, total, rows.Err()
}

func (s *Store) GetExpense(ctx context.Context, userID, expenseID string) (models.Expense, error) {
	row := s.pool.QueryRow(ctx, expenseSelect+` where e.id = $1 and e.user_id = $2`, expenseID, userID)
	expense, err := scanExpense(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Expense{}, ErrNotFound
	}
	return expense, err
}

func (s *Store) CreateExpense(ctx context.Context, userID string, input ExpenseInput) (models.Expense, error) {
	if err := validateCategoryOwnership(ctx, s, userID, input.CategoryID); err != nil {
		return models.Expense{}, err
	}
	if ok, err := s.payeeBelongsToUser(ctx, userID, input.PayeeID); err != nil {
		return models.Expense{}, err
	} else if !ok {
		return models.Expense{}, ErrNotFound
	}

	var id string
	err := s.pool.QueryRow(ctx, `
		insert into expenses (user_id, amount_minor, currency, category_id, payee_id, date, payment_method, notes, notify_payee, client_id)
		values ($1, $2, $3, nullif($4, '')::uuid, nullif($5, '')::uuid, $6::date, $7, nullif($8, ''), $9, nullif($10, ''))
		on conflict (user_id, client_id) do nothing
		returning id::text`,
		userID, input.AmountMinor, input.Currency, input.CategoryID, input.PayeeID,
		input.Date, input.PaymentMethod, input.Notes, input.NotifyPayee, input.ClientID).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) && input.ClientID != "" {
		return s.getExpenseByClientID(ctx, userID, input.ClientID)
	}
	if err != nil {
		return models.Expense{}, err
	}
	return s.GetExpense(ctx, userID, id)
}

func (s *Store) getExpenseByClientID(ctx context.Context, userID, clientID string) (models.Expense, error) {
	row := s.pool.QueryRow(ctx, expenseSelect+` where e.user_id = $1 and e.client_id = $2`, userID, clientID)
	expense, err := scanExpense(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Expense{}, ErrNotFound
	}
	return expense, err
}

func (s *Store) UpdateExpense(ctx context.Context, userID, expenseID string, input ExpenseInput) (models.Expense, error) {
	if err := validateCategoryOwnership(ctx, s, userID, input.CategoryID); err != nil {
		return models.Expense{}, err
	}
	if ok, err := s.payeeBelongsToUser(ctx, userID, input.PayeeID); err != nil {
		return models.Expense{}, err
	} else if !ok {
		return models.Expense{}, ErrNotFound
	}

	tag, err := s.pool.Exec(ctx, `
		update expenses
		set amount_minor = $3, category_id = nullif($4, '')::uuid, payee_id = nullif($5, '')::uuid,
		    date = $6::date, payment_method = $7, notes = nullif($8, ''),
		    notify_payee = $9, updated_at = now()
		where id = $1 and user_id = $2`,
		expenseID, userID, input.AmountMinor, input.CategoryID, input.PayeeID,
		input.Date, input.PaymentMethod, input.Notes, input.NotifyPayee)
	if err != nil {
		return models.Expense{}, err
	}
	if tag.RowsAffected() == 0 {
		return models.Expense{}, ErrNotFound
	}
	return s.GetExpense(ctx, userID, expenseID)
}

func (s *Store) DeleteExpense(ctx context.Context, userID, expenseID string) error {
	tag, err := s.pool.Exec(ctx, `delete from expenses where id = $1 and user_id = $2`, expenseID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListRecentTransactions(ctx context.Context, userID string, limit int) ([]models.RecentTransaction, error) {
	rows, err := s.pool.Query(ctx, `
		select id, kind, title, amount_minor, currency, category_name, category_color, date, payment_method
		from (
			select i.id::text as id, 'income' as kind, i.source as title, i.amount_minor, i.currency,
			       coalesce(c.name, '') as category_name, coalesce(c.color, '') as category_color,
			       i.date::text as date, '' as payment_method, i.created_at
			from incomes i left join categories c on c.id = i.category_id
			where i.user_id = $1
			union all
			select e.id::text, 'expense', coalesce(nullif(e.notes, ''), c.name, 'Expense'), e.amount_minor, e.currency,
			       coalesce(c.name, ''), coalesce(c.color, ''), e.date::text, e.payment_method::text, e.created_at
			from expenses e left join categories c on c.id = e.category_id
			where e.user_id = $1
		) t
		order by created_at desc
		limit $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := make([]models.RecentTransaction, 0)
	for rows.Next() {
		var transaction models.RecentTransaction
		var categoryName, categoryColor, paymentMethod string
		if err := rows.Scan(
			&transaction.ID,
			&transaction.Kind,
			&transaction.Title,
			&transaction.AmountMinor,
			&transaction.Currency,
			&categoryName,
			&categoryColor,
			&transaction.Date,
			&paymentMethod,
		); err != nil {
			return nil, err
		}
		transaction.CategoryName = textOrNil(categoryName)
		transaction.CategoryColor = textOrNil(categoryColor)
		transaction.PaymentMethod = textOrNil(paymentMethod)
		transactions = append(transactions, transaction)
	}
	return transactions, rows.Err()
}

func transactionWhere(alias, userID string, filter ListFilter) (string, []any) {
	clauses := []string{alias + ".user_id = $1"}
	args := []any{userID}

	if filter.From != "" {
		args = append(args, filter.From)
		clauses = append(clauses, fmt.Sprintf("%s.date >= $%d::date", alias, len(args)))
	}
	if filter.To != "" {
		args = append(args, filter.To)
		clauses = append(clauses, fmt.Sprintf("%s.date <= $%d::date", alias, len(args)))
	}
	if filter.CategoryID != "" {
		args = append(args, filter.CategoryID)
		clauses = append(clauses, fmt.Sprintf("%s.category_id = $%d", alias, len(args)))
	}
	if strings.TrimSpace(filter.Query) != "" {
		args = append(args, "%"+strings.TrimSpace(filter.Query)+"%")
		pattern := "$" + fmt.Sprint(len(args))
		clauses = append(clauses, fmt.Sprintf(
			"(%[1]s.notes ilike %[2]s or c.name ilike %[2]s or %[3]s ilike %[2]s)",
			alias, pattern, searchColumn(alias),
		))
	}
	return strings.Join(clauses, " and "), args
}

func searchColumn(alias string) string {
	if alias == "i" {
		return "i.source"
	}
	return "coalesce(" + alias + ".notes, '')"
}
