package money

import (
	"fmt"
	"strconv"
	"strings"
)

// Parse converts a decimal amount such as "1250.50" into minor units.
// It rejects negative values and more than two decimal places.
func Parse(value string) (int64, error) {
	value = strings.TrimSpace(value)
	value = strings.ReplaceAll(value, ",", "")
	if value == "" {
		return 0, fmt.Errorf("amount is required")
	}
	if strings.HasPrefix(value, "-") {
		return 0, fmt.Errorf("amount must be positive")
	}

	parts := strings.Split(value, ".")
	if len(parts) > 2 {
		return 0, fmt.Errorf("amount is not a valid number")
	}

	whole := parts[0]
	if whole == "" {
		whole = "0"
	}
	if len(whole) > 15 {
		return 0, fmt.Errorf("amount is too large")
	}

	fraction := "00"
	if len(parts) == 2 {
		if len(parts[1]) > 2 {
			return 0, fmt.Errorf("amount supports at most 2 decimal places")
		}
		fraction = parts[1] + strings.Repeat("0", 2-len(parts[1]))
	}

	major, err := strconv.ParseInt(whole, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("amount is not a valid number")
	}
	minor, err := strconv.ParseInt(fraction, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("amount is not a valid number")
	}
	return major*100 + minor, nil
}

// Format renders minor units as a decimal string.
func Format(minor int64) string {
	sign := ""
	if minor < 0 {
		sign = "-"
		minor = -minor
	}
	return fmt.Sprintf("%s%d.%02d", sign, minor/100, minor%100)
}
