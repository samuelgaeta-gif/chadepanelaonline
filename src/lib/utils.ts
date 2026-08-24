import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateBR(dateString: string | undefined): string {
  if (!dateString) return '';
  // Handling YYYY-MM-DD
  if (dateString.includes('-')) {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  // Try to parse as Date object
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  return dateString;
}

export function formatPhone(value: string) {
  if (!value) return "";
  const phone = value.replace(/\D/g, "");
  if (phone.length <= 2) return `(${phone}`;
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
}
