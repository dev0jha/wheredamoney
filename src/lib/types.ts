export type User = {
  id: string;
  email: string;
  name: string;
  currency: string;
  timezone: string;
  month_start_day: number;
  email_verified: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
};

export type Income = {
  id: string;
  amount_minor: number;
  currency: string;
  source: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  date: string;
  notes: string | null;
  client_id: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  amount_minor: number;
  currency: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  payee_id: string | null;
  payee_name: string | null;
  date: string;
  payment_method: string;
  notes: string | null;
  notify_payee: boolean;
  client_id: string | null;
  created_at: string;
};

export type DashboardSummary = {
  from: string;
  to: string;
  total_income_minor: number;
  total_expenses_minor: number;
  net_minor: number;
  savings_rate: number;
  income_count: number;
  expense_count: number;
};

export type TrendPoint = {
  month: string;
  income_minor: number;
  expense_minor: number;
};

export type CategoryTotal = {
  category_id: string | null;
  name: string;
  color: string;
  total_minor: number;
  count: number;
  percent: number;
};

export type PayeeTotal = {
  payee_id: string;
  name: string;
  total_minor: number;
  count: number;
};

export type RecentTransaction = {
  id: string;
  kind: "income" | "expense";
  title: string;
  amount_minor: number;
  currency: string;
  category_name: string | null;
  category_color: string | null;
  date: string;
  payment_method: string | null;
};

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type ApiErrorPayload = {
  error?: { code?: string; message?: string };
};

export type ActionState = {
  error?: string;
  success?: string;
};
