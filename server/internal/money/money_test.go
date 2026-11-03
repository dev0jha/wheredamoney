package money

import "testing"

func TestParse(t *testing.T) {
	tests := []struct {
		input   string
		want    int64
		wantErr bool
	}{
		{"10", 1000, false},
		{"10.5", 1050, false},
		{"10.50", 1050, false},
		{"0.01", 1, false},
		{"1,250.75", 125075, false},
		{".5", 50, false},
		{"", 0, true},
		{"-1", 0, true},
		{"1.234", 0, true},
		{"abc", 0, true},
	}
	for _, test := range tests {
		got, err := Parse(test.input)
		if test.wantErr {
			if err == nil {
				t.Fatalf("Parse(%q) expected error", test.input)
			}
			continue
		}
		if err != nil {
			t.Fatalf("Parse(%q) unexpected error: %v", test.input, err)
		}
		if got != test.want {
			t.Fatalf("Parse(%q) = %d, want %d", test.input, got, test.want)
		}
	}
}

func TestFormat(t *testing.T) {
	if got := Format(125075); got != "1250.75" {
		t.Fatalf("Format = %q", got)
	}
	if got := Format(-5); got != "-0.05" {
		t.Fatalf("Format = %q", got)
	}
}
