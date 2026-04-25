/**
 * Pure validation logic for the check-in system.
 *
 * OFFLINE-READY: This function is pure (no network, no side effects) and will
 * be reused without modification in the offline check-in flow. It only receives
 * data and returns a result — it doesn't care where the data came from.
 */

import type { TicketData, CheckInResult } from "./checkin-types";

/**
 * Validates whether a ticket can be checked in for the given excursion.
 *
 * Validation order matters — each check is progressively more specific
 * to give the driver the most helpful error message.
 */
export function validateTicket(
  ticket: TicketData | null,
  excursionId: string
): CheckInResult {
  // 1. Ticket not found in DB (or IndexedDB in offline mode)
  if (!ticket) {
    return { success: false, error: "NOT_FOUND" };
  }

  // 2. Ticket belongs to a different excursion
  if (ticket.excursion_id !== excursionId) {
    return { success: false, error: "WRONG_EXCURSION" };
  }

  // 3. Reservation is not approved (e.g. still PENDING_PIX or EXPIRED)
  if (ticket.payment_status !== "APPROVED") {
    return { success: false, error: "INVALID_RESERVATION" };
  }

  // 4. Passenger already boarded
  if (ticket.check_in_status === true) {
    return { success: false, error: "ALREADY_CHECKED_IN" };
  }

  // 5. All checks passed — passenger is clear to board
  return {
    success: true,
    passenger: {
      full_name: ticket.full_name,
      seat_code: ticket.seat_code,
      short_code: ticket.short_code,
    },
  };
}
