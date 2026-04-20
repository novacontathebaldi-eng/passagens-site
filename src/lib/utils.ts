/** Format a CPF string with mask: 000.000.000-00, supporting partial inputs */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Validate a CPF using the official mathematical algorithm */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length !== 11) return false;
  
  // Reject known invalid sequences (e.g., 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let d1 = remainder === 10 || remainder === 11 ? 0 : remainder;
  
  if (d1 !== parseInt(digits.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let d2 = remainder === 10 || remainder === 11 ? 0 : remainder;
  
  if (d2 !== parseInt(digits.charAt(10))) return false;
  
  return true;
}

/** Format a phone number: (00) 00000-0000 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

/** Format currency as BRL: R$ 1.234,56 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Format a date in pt-BR locale */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** Format a date as short: 19/04/2026 */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/** Format a datetime: 19/04/2026 às 14:30 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/** Readable status labels in PT-BR */
export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  PENDING_PIX: "Aguardando PIX",
  AWAITING_MANUAL_CHECK: "Em análise",
  APPROVED: "Aprovada",
  REFUNDED: "Reembolsada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

export const EXCURSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  SOLD_OUT: "Esgotada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  PROMOTER: "Promotor",
  DRIVER: "Motorista",
  CLIENT: "Cliente",
};
