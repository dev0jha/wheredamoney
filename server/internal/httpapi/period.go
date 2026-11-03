package httpapi

import (
	"fmt"
	"time"

	"github.com/wheredamoney/wheredamoney/server/internal/models"
)

// periodForMonth returns the inclusive date range for a user's month.
// month is optional and uses YYYY-MM; empty means the current period.
func periodForMonth(user models.User, month string) (string, string, error) {
	location, err := time.LoadLocation(user.Timezone)
	if err != nil {
		location = time.UTC
	}
	now := time.Now().In(location)

	var year int
	var monthNumber time.Month
	if month != "" {
		parsed, err := time.Parse("2006-01", month)
		if err != nil {
			return "", "", fmt.Errorf("month must use YYYY-MM format")
		}
		year = parsed.Year()
		monthNumber = parsed.Month()
	} else {
		year = now.Year()
		monthNumber = now.Month()
		if now.Day() < user.MonthStartDay {
			previous := time.Date(year, monthNumber, 1, 0, 0, 0, 0, location).AddDate(0, -1, 0)
			year = previous.Year()
			monthNumber = previous.Month()
		}
	}

	start := time.Date(year, monthNumber, user.MonthStartDay, 0, 0, 0, 0, location)
	end := start.AddDate(0, 1, -1)
	return start.Format("2006-01-02"), end.Format("2006-01-02"), nil
}

// trendsStart returns the first day of the calendar month months-1 before now.
func trendsStart(user models.User, months int) string {
	location, err := time.LoadLocation(user.Timezone)
	if err != nil {
		location = time.UTC
	}
	now := time.Now().In(location)
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, location).AddDate(0, -(months - 1), 0)
	return start.Format("2006-01-02")
}
