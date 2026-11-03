package store

import (
	"context"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

func (s *Store) DashboardSummary(ctx context.Context, userID, from, to string) (models.DashboardSummary, error) {
	var summary models.DashboardSummary
	summary.From = from
	summary.To = to

	err := s.pool.QueryRow(ctx, `
		select
			coalesce(sum(case when kind = 'income' then amount_minor else 0 end), 0)::bigint,
			coalesce(sum(case when kind = 'expense' then amount_minor else 0 end), 0)::bigint,
			count(*) filter (where kind = 'income'),
			count(*) filter (where kind = 'expense')
		from (
			select 'income' as kind, amount_minor from incomes
			where user_id = $1 and date >= $2::date and date <= $3::date
			union all
			select 'expense' as kind, amount_minor from expenses
			where user_id = $1 and date >= $2::date and date <= $3::date
		) t`, userID, from, to).Scan(
		&summary.TotalIncomeMinor,
		&summary.TotalExpensesMinor,
		&summary.IncomeCount,
		&summary.ExpenseCount,
	)
	if err != nil {
		return models.DashboardSummary{}, err
	}
	summary.NetMinor = summary.TotalIncomeMinor - summary.TotalExpensesMinor
	if summary.TotalIncomeMinor > 0 {
		summary.SavingsRate = float64(summary.NetMinor) / float64(summary.TotalIncomeMinor) * 100
	}
	return summary, nil
}

func (s *Store) DashboardTrends(ctx context.Context, userID, from string, months int) ([]models.TrendPoint, error) {
	rows, err := s.pool.Query(ctx, `
		with months as (
			select to_char(d, 'YYYY-MM') as month, d::date as start_date
			from generate_series(
				date_trunc('month', $2::date),
				date_trunc('month', $2::date) + ($3::int - 1) * interval '1 month',
				interval '1 month'
			) d
		)
		select
			m.month,
			coalesce((
				select sum(i.amount_minor) from incomes i
				where i.user_id = $1 and i.date >= m.start_date
				  and i.date < m.start_date + interval '1 month'
			), 0)::bigint,
			coalesce((
				select sum(e.amount_minor) from expenses e
				where e.user_id = $1 and e.date >= m.start_date
				  and e.date < m.start_date + interval '1 month'
			), 0)::bigint
		from months m
		order by m.start_date`, userID, from, months)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]models.TrendPoint, 0, months)
	for rows.Next() {
		var point models.TrendPoint
		if err := rows.Scan(&point.Month, &point.IncomeMinor, &point.ExpenseMinor); err != nil {
			return nil, err
		}
		points = append(points, point)
	}
	return points, rows.Err()
}

func (s *Store) CategoryBreakdown(ctx context.Context, userID, from, to, kind string) ([]models.CategoryTotal, error) {
	table := "expenses"
	if kind == "income" {
		table = "incomes"
	}
	rows, err := s.pool.Query(ctx, `
		select coalesce(c.id::text, ''), coalesce(c.name, 'Uncategorized'), coalesce(c.color, '#71717a'),
		       coalesce(sum(t.amount_minor), 0)::bigint, count(*)::bigint
		from `+table+` t
		left join categories c on c.id = t.category_id
		where t.user_id = $1 and t.date >= $2::date and t.date <= $3::date
		group by c.id, c.name, c.color
		order by 4 desc`, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	totals := make([]models.CategoryTotal, 0)
	var sum int64
	for rows.Next() {
		var total models.CategoryTotal
		var categoryID string
		if err := rows.Scan(&categoryID, &total.Name, &total.Color, &total.TotalMinor, &total.Count); err != nil {
			return nil, err
		}
		total.CategoryID = textOrNil(categoryID)
		totals = append(totals, total)
		sum += total.TotalMinor
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if sum > 0 {
		for index := range totals {
			totals[index].Percent = float64(totals[index].TotalMinor) / float64(sum) * 100
		}
	}
	return totals, nil
}

func (s *Store) TopPayees(ctx context.Context, userID, from, to string, limit int) ([]models.PayeeTotal, error) {
	rows, err := s.pool.Query(ctx, `
		select p.id::text, p.name, coalesce(sum(e.amount_minor), 0)::bigint, count(*)::bigint
		from expenses e
		join payees p on p.id = e.payee_id
		where e.user_id = $1 and e.date >= $2::date and e.date <= $3::date
		group by p.id, p.name
		order by 3 desc
		limit $4`, userID, from, to, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	payees := make([]models.PayeeTotal, 0)
	for rows.Next() {
		var payee models.PayeeTotal
		if err := rows.Scan(&payee.PayeeID, &payee.Name, &payee.TotalMinor, &payee.Count); err != nil {
			return nil, err
		}
		payees = append(payees, payee)
	}
	return payees, rows.Err()
}
