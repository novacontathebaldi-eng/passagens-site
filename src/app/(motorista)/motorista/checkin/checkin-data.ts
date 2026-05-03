/**
 * Data access layer for the check-in system.
 *
 * All Supabase interactions are isolated here behind named functions.
 * Each function receives the Supabase client as a parameter (dependency injection)
 * to make future offline substitution straightforward.
 *
 * OFFLINE-READY: In offline mode, a parallel file `checkin-data.offline.ts`
 * will export functions with the same signatures, but reading/writing from
 * IndexedDB instead of Supabase. The swap will happen in a single import point.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketData } from "./checkin-types";

/** UUID v4 pattern: 8-4-4-4-12 hex chars */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Detects whether the identifier is a short_code (6 alphanumeric chars)
 * or a qr_code_token (UUID format) and queries the appropriate column.
 *
 * OFFLINE-READY: In offline mode, this function will search IndexedDB
 * instead of Supabase. See PLAN-motorista-offline.md when implementing.
 */
export async function findTicketByIdentifier(
  supabase: SupabaseClient,
  identifier: string,
  _excursionId: string
): Promise<TicketData | null> {
  const isUUID = UUID_REGEX.test(identifier);
  const column = isUUID ? "qr_code_token" : "short_code";
  const value = isUUID ? identifier : identifier.toUpperCase();

  const { data, error } = await supabase
    .from("passenger_tickets")
    .select(
      `
      id,
      excursion_id,
      seat_code,
      full_name,
      short_code,
      check_in_status,
      checked_in_at,
      reservations!inner ( status )
    `
    )
    .eq(column, value)
    .single();

  if (error || !data) {
    return null;
  }

  // Flatten the reservation status into the ticket shape
  const reservationStatus = Array.isArray(data.reservations)
    ? (data.reservations as any)[0]?.status
    : (data.reservations as any)?.status;

  return {
    id: data.id,
    excursion_id: data.excursion_id,
    seat_code: data.seat_code,
    full_name: data.full_name,
    short_code: data.short_code,
    check_in_status: data.check_in_status,
    checked_in_at: data.checked_in_at,
    payment_status: reservationStatus ?? "UNKNOWN",
  };
}

/**
 * Marks a ticket as checked-in by setting check_in_status = true
 * and recording the current timestamp.
 *
 * Uses { count: 'exact' } to confirm the UPDATE actually affected a row.
 * Supabase RLS can silently block UPDATEs, returning no error but 0 rows.
 *
 * OFFLINE-READY: In offline mode, this will write to IndexedDB and
 * enqueue the mutation for background sync. See PLAN-motorista-offline.md.
 */
export async function markTicketAsCheckedIn(
  supabase: SupabaseClient,
  ticketId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("passenger_tickets")
    .update({
      check_in_status: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("id")
    .single();

  // If RLS blocks the UPDATE, data will be null and error will be set
  return !error && !!data;
}

/**
 * Returns the total number of approved tickets and how many have been checked in
 * for a given excursion.
 *
 * OFFLINE-READY: In offline mode, this will be computed from local IndexedDB
 * records plus any pending sync queue entries. See PLAN-motorista-offline.md.
 */
export async function getExcursionCheckinCount(
  supabase: SupabaseClient,
  excursionId: string
): Promise<{ total: number; boarded: number }> {
  const { data, error } = await supabase
    .from("passenger_tickets")
    .select("id, check_in_status, reservations!inner ( status )")
    .eq("excursion_id", excursionId)
    .eq("reservations.status", "APPROVED");

  if (error || !data) {
    return { total: 0, boarded: 0 };
  }

  return {
    total: data.length,
    boarded: data.filter((t) => t.check_in_status === true).length,
  };
}
