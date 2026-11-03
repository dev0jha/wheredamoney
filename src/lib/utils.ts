import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatCompactMoney(amountMinor: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountMinor / 100);
}

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseISODate(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(parseISODate(value));
}

export function monthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}

export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

function isoDate(year: number, monthIndex: number, day: number): string {
  const value = new Date(year, monthIndex, day);
  const resolvedYear = value.getFullYear();
  const resolvedMonth = String(value.getMonth() + 1).padStart(2, "0");
  const resolvedDay = String(value.getDate()).padStart(2, "0");
  return `${resolvedYear}-${resolvedMonth}-${resolvedDay}`;
}

export function monthRange(month: string, startDay = 1): { from: string; to: string } {
  const [year, monthIndex] = month.split("-").map(Number);
  const day = Math.min(Math.max(startDay, 1), 31);
  const from = isoDate(year, monthIndex - 1, day);
  const to = isoDate(year, monthIndex, day - 1);
  return { from, to };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const value = new Date(year, monthIndex - 1 + delta, 1);
  const resolvedYear = value.getFullYear();
  const resolvedMonth = String(value.getMonth() + 1).padStart(2, "0");
  return `${resolvedYear}-${resolvedMonth}`;
}

export function percent(fraction: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(fraction);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
