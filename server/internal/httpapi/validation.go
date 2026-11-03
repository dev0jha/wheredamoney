package httpapi

import (
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/wheredamoney/wheredamoney/server/internal/money"
)

var colorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
var iconPattern = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func validateEmail(value string) error {
	if len(value) > 254 {
		return fmt.Errorf("email is too long")
	}
	if _, err := mail.ParseAddress(value); err != nil {
		return fmt.Errorf("enter a valid email address")
	}
	return nil
}

func validatePassword(value string) error {
	if len(value) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	if len(value) > 200 {
		return fmt.Errorf("password is too long")
	}
	return nil
}

func validateName(value string) error {
	length := len(strings.TrimSpace(value))
	if length == 0 {
		return fmt.Errorf("name is required")
	}
	if length > 120 {
		return fmt.Errorf("name is too long")
	}
	return nil
}

func validateCurrency(value string) error {
	if len(value) != 3 {
		return fmt.Errorf("currency must be a 3-letter code")
	}
	for _, char := range value {
		if char < 'A' || char > 'Z' {
			return fmt.Errorf("currency must be uppercase letters")
		}
	}
	return nil
}

func validateTimezone(value string) error {
	if _, err := time.LoadLocation(value); err != nil {
		return fmt.Errorf("timezone is not recognized")
	}
	return nil
}

func validateMonthStartDay(day int) error {
	if day < 1 || day > 28 {
		return fmt.Errorf("month start day must be between 1 and 28")
	}
	return nil
}

func validateAmount(value string) (int64, error) {
	amount, err := money.Parse(value)
	if err != nil {
		return 0, err
	}
	if amount <= 0 {
		return 0, fmt.Errorf("amount must be greater than zero")
	}
	return amount, nil
}

func validateDate(value string) error {
	if _, err := time.Parse("2006-01-02", value); err != nil {
		return fmt.Errorf("enter a valid date")
	}
	return nil
}

func validateMonth(value string) error {
	if value == "" {
		return nil
	}
	if _, err := time.Parse("2006-01", value); err != nil {
		return fmt.Errorf("month must use YYYY-MM format")
	}
	return nil
}

func validatePaymentMethod(value string) error {
	switch value {
	case "cash", "upi", "card", "bank", "other":
		return nil
	}
	return fmt.Errorf("invalid payment method")
}

func validateCategoryType(value string) error {
	switch value {
	case "income", "expense":
		return nil
	}
	return fmt.Errorf("category type must be income or expense")
}

func validateColor(value string) error {
	if !colorPattern.MatchString(value) {
		return fmt.Errorf("color must be a hex value like #6366f1")
	}
	return nil
}

func validateIcon(value string) error {
	if !iconPattern.MatchString(value) {
		return fmt.Errorf("icon name is not valid")
	}
	return nil
}
