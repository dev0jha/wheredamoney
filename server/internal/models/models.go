package models

import "time"

type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Currency      string    `json:"currency"`
	Timezone      string    `json:"timezone"`
	MonthStartDay int       `json:"month_start_day"`
	EmailVerified bool      `json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
}

type Category struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
}

type Income struct {
	ID            string    `json:"id"`
	AmountMinor   int64     `json:"amount_minor"`
	Currency      string    `json:"currency"`
	Source        string    `json:"source"`
	CategoryID    *string   `json:"category_id"`
	CategoryName  *string   `json:"category_name"`
	CategoryColor *string   `json:"category_color"`
	Date          string    `json:"date"`
	Notes         *string   `json:"notes"`
	ClientID      *string   `json:"client_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type Expense struct {
	ID            string    `json:"id"`
	AmountMinor   int64     `json:"amount_minor"`
	Currency      string    `json:"currency"`
	CategoryID    *string   `json:"category_id"`
	CategoryName  *string   `json:"category_name"`
	CategoryColor *string   `json:"category_color"`
	PayeeID       *string   `json:"payee_id"`
	PayeeName     *string   `json:"payee_name"`
	Date          string    `json:"date"`
	PaymentMethod string    `json:"payment_method"`
	Notes         *string   `json:"notes"`
	NotifyPayee   bool      `json:"notify_payee"`
	ClientID      *string   `json:"client_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type DashboardSummary struct {
	From               string  `json:"from"`
	To                 string  `json:"to"`
	TotalIncomeMinor   int64   `json:"total_income_minor"`
	TotalExpensesMinor int64   `json:"total_expenses_minor"`
	NetMinor           int64   `json:"net_minor"`
	SavingsRate        float64 `json:"savings_rate"`
	IncomeCount        int64   `json:"income_count"`
	ExpenseCount       int64   `json:"expense_count"`
}

type TrendPoint struct {
	Month        string `json:"month"`
	IncomeMinor  int64  `json:"income_minor"`
	ExpenseMinor int64  `json:"expense_minor"`
}

type CategoryTotal struct {
	CategoryID *string `json:"category_id"`
	Name       string  `json:"name"`
	Color      string  `json:"color"`
	TotalMinor int64   `json:"total_minor"`
	Count      int64   `json:"count"`
	Percent    float64 `json:"percent"`
}

type PayeeTotal struct {
	PayeeID    string `json:"payee_id"`
	Name       string `json:"name"`
	TotalMinor int64  `json:"total_minor"`
	Count      int64  `json:"count"`
}

type RecentTransaction struct {
	ID            string  `json:"id"`
	Kind          string  `json:"kind"`
	Title         string  `json:"title"`
	AmountMinor   int64   `json:"amount_minor"`
	Currency      string  `json:"currency"`
	CategoryName  *string `json:"category_name"`
	CategoryColor *string `json:"category_color"`
	Date          string  `json:"date"`
	PaymentMethod *string `json:"payment_method"`
}
