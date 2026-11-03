package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Addr                string
	DatabaseURL         string
	AppOrigin           string
	SessionCookieSecure bool
	SessionTTL          time.Duration
	RedisURL            string
	SMTPAddr            string
	SMTPFrom            string
	ResendAPIKey        string
}

func Load() (Config, error) {
	_ = godotenv.Load(".env", "../.env", "../../.env")

	cfg := Config{
		Addr:         env("API_ADDR", ":8080"),
		DatabaseURL:  env("DATABASE_URL", "postgres://wheredamoney:wheredamoney@localhost:5433/wheredamoney"),
		AppOrigin:    env("APP_ORIGIN", "http://localhost:3000"),
		RedisURL:     env("REDIS_URL", "redis://localhost:6379"),
		SMTPAddr:     env("SMTP_ADDR", ""),
		SMTPFrom:     env("SMTP_FROM", "WhereDaMoney <hello@wheredamoney.local>"),
		ResendAPIKey: env("RESEND_API_KEY", ""),
	}

	secure, err := strconv.ParseBool(env("SESSION_COOKIE_SECURE", "false"))
	if err != nil {
		return Config{}, fmt.Errorf("parse SESSION_COOKIE_SECURE: %w", err)
	}
	cfg.SessionCookieSecure = secure

	hours, err := strconv.Atoi(env("SESSION_TTL_HOURS", "168"))
	if err != nil || hours <= 0 {
		return Config{}, fmt.Errorf("SESSION_TTL_HOURS must be a positive integer")
	}
	cfg.SessionTTL = time.Duration(hours) * time.Hour

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
