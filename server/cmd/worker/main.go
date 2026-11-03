package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/wheredamoney/wheredamoney/server/internal/config"
	"github.com/wheredamoney/wheredamoney/server/internal/db"
	"github.com/wheredamoney/wheredamoney/server/internal/store"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(log)

	cfg, err := config.Load()
	if err != nil {
		log.Error("load config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	st := store.New(pool)
	log.Info("worker started")

	// Email delivery, slip generation, and recurring entries will be added in
	// later phases. For now the worker keeps the session table tidy.
	cleanup := time.NewTicker(5 * time.Minute)
	defer cleanup.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Info("worker stopped")
			return
		case <-cleanup.C:
			deleted, err := st.DeleteExpiredSessions(ctx)
			if err != nil {
				log.Error("cleanup sessions", "error", err)
				continue
			}
			if deleted > 0 {
				log.Info("cleaned up expired sessions", "count", deleted)
			}
		}
	}
}
