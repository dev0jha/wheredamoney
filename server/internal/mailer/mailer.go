package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

type Mailer struct {
	addr      string
	from      string
	resendKey string
	client    *http.Client
	log       *slog.Logger
}

func New(addr, from, resendKey string, log *slog.Logger) *Mailer {
	return &Mailer{
		addr:      addr,
		from:      from,
		resendKey: resendKey,
		client:    &http.Client{Timeout: 10 * time.Second},
		log:       log,
	}
}

func (m *Mailer) Send(ctx context.Context, to, subject, textBody, htmlBody string) error {
	if m.resendKey != "" {
		return m.sendResend(ctx, to, subject, textBody, htmlBody)
	}
	if m.addr != "" {
		return m.sendSMTP(to, subject, htmlBody)
	}
	m.log.Info("email skipped (no provider configured)", "to", to, "subject", subject)
	return nil
}

func (m *Mailer) sendSMTP(to, subject, htmlBody string) error {
	fromAddress, err := mail.ParseAddress(m.from)
	if err != nil {
		return fmt.Errorf("parse from address: %w", err)
	}
	headers := []string{
		"From: " + m.from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
	}
	message := strings.Join(headers, "\r\n") + "\r\n\r\n" + htmlBody
	return smtp.SendMail(m.addr, nil, fromAddress.Address, []string{to}, []byte(message))
}

func (m *Mailer) sendResend(ctx context.Context, to, subject, textBody, htmlBody string) error {
	payload := map[string]any{
		"from":    m.from,
		"to":      []string{to},
		"subject": subject,
		"text":    textBody,
		"html":    htmlBody,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.resendKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}
	return nil
}

func (m *Mailer) SendVerification(ctx context.Context, to, name, link string) error {
	subject := "Verify your WhereDaMoney email"
	text := fmt.Sprintf("Hi %s,\n\nConfirm your email to finish setting up WhereDaMoney:\n%s\n\nThis link expires in 24 hours.", name, link)
	html := emailLayout("Verify your email", fmt.Sprintf(
		"Hi %s, confirm your email to finish setting up WhereDaMoney.", name),
		"Verify email", link, "This link expires in 24 hours.")
	return m.Send(ctx, to, subject, text, html)
}

func (m *Mailer) SendPasswordReset(ctx context.Context, to, name, link string) error {
	subject := "Reset your WhereDaMoney password"
	text := fmt.Sprintf("Hi %s,\n\nReset your password with this link:\n%s\n\nThis link expires in 1 hour. If you did not request this, ignore this email.", name, link)
	html := emailLayout("Reset your password", fmt.Sprintf(
		"Hi %s, use the button below to choose a new password.", name),
		"Reset password", link, "This link expires in 1 hour. If you did not request this, ignore this email.")
	return m.Send(ctx, to, subject, text, html)
}

func emailLayout(title, intro, buttonLabel, link, footnote string) string {
	return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#6366f1">WhereDaMoney</p>
      <h1 style="margin:0 0 16px;font-size:22px">` + title + `</h1>
      <p style="margin:0 0 24px;line-height:1.6">` + intro + `</p>
      <a href="` + link + `" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">` + buttonLabel + `</a>
      <p style="margin:24px 0 0;font-size:13px;color:#71717a">` + footnote + `</p>
    </div>
  </body>
</html>`
}
