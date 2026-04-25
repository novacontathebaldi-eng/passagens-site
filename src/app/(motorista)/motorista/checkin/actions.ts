"use server";

/**
 * Server Action for the driver check-in system.
 *
 * Orchestrates: auth check → data fetch → validation → mutation → response.
 * All business logic is delegated to checkin-logic.ts (pure) and
 * data access to checkin-data.ts (isolated).
 *
 * OFFLINE-READY: In offline mode, this Server Action will NOT be called.
 * Instead, a local function in the Service Worker will orchestrate the same
 * flow using checkin-data.offline.ts + checkin-logic.ts (unchanged).
 */

import { createClient } from "@/lib/supabase/server";
import type { CheckInResult } from "./checkin-types";
import { validateTicket } from "./checkin-logic";
import {
  findTicketByIdentifier,
  markTicketAsCheckedIn,
  getExcursionCheckinCount,
} from "./checkin-data";

interface PerformCheckinParams {
  identifier: string;
  excursion_id: string;
}

export async function performCheckin(
  params: PerformCheckinParams
): Promise<CheckInResult> {
  const { identifier, excursion_id } = params;

  // 1. Authenticate and authorize
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "DRIVER" && profile?.role !== "ADMIN") {
    return { success: false, error: "UNAUTHORIZED" };
  }

  // 2. Fetch the ticket from the database
  const ticket = await findTicketByIdentifier(supabase, identifier, excursion_id);

  // 3. Validate using the pure logic function
  const result = validateTicket(ticket, excursion_id);

  if (!result.success) {
    return result;
  }

  // 4. Mark as checked-in (ticket is guaranteed non-null here)
  const updated = await markTicketAsCheckedIn(supabase, ticket!.id);

  if (!updated) {
    // Extremely rare — RLS or DB issue
    return { success: false, error: "UNAUTHORIZED" };
  }

  // 5. Return passenger info for the success toast
  return result;
}

/**
 * Fetches the current check-in count for real-time counter initialization.
 */
export async function fetchCheckinCount(
  excursionId: string
): Promise<{ total: number; boarded: number }> {
  const supabase = await createClient();
  return getExcursionCheckinCount(supabase, excursionId);
}
