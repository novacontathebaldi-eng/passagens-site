/**
 * Shared types for the Driver Check-in System.
 *
 * OFFLINE-READY: These types are transport-agnostic and will be reused
 * without modification in the offline check-in flow.
 */

/** Error codes returned when a check-in validation fails. */
export type CheckInErrorCode =
  | "NOT_FOUND"
  | "WRONG_EXCURSION"
  | "ALREADY_CHECKED_IN"
  | "INVALID_RESERVATION"
  | "UNAUTHORIZED";

/** The data shape of a ticket fetched from the database (or IndexedDB in the future). */
export interface TicketData {
  id: string;
  excursion_id: string;
  seat_code: string;
  full_name: string;
  short_code: string;
  check_in_status: boolean;
  checked_in_at: string | null;
  payment_status: string; // from reservation JOIN
}

/** Result of a check-in attempt — either success with passenger info, or failure with error code. */
export type CheckInResult =
  | {
      success: true;
      passenger: {
        full_name: string;
        seat_code: string;
        short_code: string;
      };
    }
  | {
      success: false;
      error: CheckInErrorCode;
    };
