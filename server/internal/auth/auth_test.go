package auth

import "testing"

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatal(err)
	}
	ok, err := VerifyPassword("correct horse battery staple", hash)
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected password to match")
	}

	ok, err = VerifyPassword("wrong", hash)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected password not to match")
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T) {
	if _, err := VerifyPassword("x", "not-a-hash"); err == nil {
		t.Fatal("expected an error")
	}
}

func TestTokenRoundTrip(t *testing.T) {
	token, err := NewToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(token) < 40 {
		t.Fatalf("token too short: %d", len(token))
	}
	if HashToken(token) != HashToken(token) {
		t.Fatal("token hash must be deterministic")
	}
	other, _ := NewToken()
	if token == other {
		t.Fatal("tokens must be unique")
	}
	if HashToken(token) == HashToken(other) {
		t.Fatal("token hashes must differ")
	}
}
