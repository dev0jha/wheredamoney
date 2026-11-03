import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const categoryType = pgEnum("category_type", ["income", "expense"]);
export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "upi",
  "card",
  "bank",
  "other",
]);
export const notificationType = pgEnum("notification_type", [
  "receipt",
  "correction",
  "cancellation",
]);
export const notificationStatus = pgEnum("notification_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);
export const recurringFrequency = pgEnum("recurring_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    currency: text("currency").default("INR").notNull(),
    timezone: text("timezone").default("Asia/Kolkata").notNull(),
    monthStartDay: smallint("month_start_day").default(1).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_hash_unique").on(table.tokenHash),
    index("email_verification_tokens_user_idx").on(table.userId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: categoryType("type").notNull(),
    color: text("color").default("#6366f1").notNull(),
    icon: text("icon").default("circle").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("categories_user_type_name_unique").on(
      table.userId,
      table.type,
      table.name,
    ),
    index("categories_user_idx").on(table.userId),
  ],
);

export const payees = pgTable(
  "payees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    tag: text("tag"),
    autoNotify: boolean("auto_notify").default(true).notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("payees_user_idx").on(table.userId)],
);

export const recurringRules = pgTable(
  "recurring_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: categoryType("kind").notNull(),
    templateJson: jsonb("template_json").notNull(),
    frequency: recurringFrequency("frequency").notNull(),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("recurring_rules_next_run_idx").on(table.nextRunAt)],
);

export const incomes = pgTable(
  "incomes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").default("INR").notNull(),
    source: text("source").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    notes: text("notes"),
    recurringId: uuid("recurring_id").references(() => recurringRules.id, {
      onDelete: "set null",
    }),
    clientId: text("client_id"),
    ...timestamps,
  },
  (table) => [
    index("incomes_user_date_idx").on(table.userId, table.date),
    uniqueIndex("incomes_user_client_unique").on(table.userId, table.clientId),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").default("INR").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    payeeId: uuid("payee_id").references(() => payees.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    paymentMethod: paymentMethod("payment_method").default("cash").notNull(),
    notes: text("notes"),
    receiptUrl: text("receipt_url"),
    referenceNo: text("reference_no"),
    notifyPayee: boolean("notify_payee").default(false).notNull(),
    recurringId: uuid("recurring_id").references(() => recurringRules.id, {
      onDelete: "set null",
    }),
    clientId: text("client_id"),
    ...timestamps,
  },
  (table) => [
    index("expenses_user_date_idx").on(table.userId, table.date),
    index("expenses_user_payee_idx").on(table.userId, table.payeeId),
    uniqueIndex("expenses_user_client_unique").on(table.userId, table.clientId),
  ],
);

export const emailNotifications = pgTable(
  "email_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    payeeId: uuid("payee_id").references(() => payees.id, {
      onDelete: "set null",
    }),
    expenseId: uuid("expense_id").references(() => expenses.id, {
      onDelete: "set null",
    }),
    type: notificationType("type").notNull(),
    status: notificationStatus("status").default("queued").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("email_notifications_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const monthlySlips = pgTable(
  "monthly_slips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    version: integer("version").default(1).notNull(),
    summaryJson: jsonb("summary_json").notNull(),
    pdfUrl: text("pdf_url"),
    aiSummary: text("ai_summary"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("monthly_slips_user_month_version_unique").on(
      table.userId,
      table.month,
      table.version,
    ),
  ],
);

export const userAiSettings = pgTable(
  "user_ai_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    encryptedGroqKey: text("encrypted_groq_key"),
    keyLast4: text("key_last4"),
    model: text("model").default("llama-3.3-70b-versatile").notNull(),
    detailedAnalysisEnabled: boolean("detailed_analysis_enabled")
      .default(false)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_ai_settings_user_unique").on(table.userId)],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    limitAmountMinor: bigint("limit_amount_minor", { mode: "number" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("budgets_user_category_month_unique").on(
      table.userId,
      table.categoryId,
      table.month,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("audit_logs_user_created_idx").on(table.userId, table.createdAt)],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("push_subscriptions_endpoint_unique").on(table.endpoint)],
);

export const offlineSyncLog = pgTable(
  "offline_sync_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    entity: text("entity").notNull(),
    status: text("status").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("offline_sync_log_user_client_unique").on(
      table.userId,
      table.clientId,
    ),
  ],
);
