import { supabase } from "@/integrations/supabase/client";

export type Workspace = {
  id: string;
  name: string;
  category: string;
  location: string;
  capacity: number;
  price_per_hour: number;
  amenities: string | null;
  image_url: string | null;
  description: string | null;
};

export type Booking = {
  id: string;
  workspace_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

export const CATEGORIES = ["Desk Space", "Meeting Room", "Event Space"] as const;

/** "09:00:00" -> "09:00" */
export function formatTime(time: string) {
  return time.slice(0, 5);
}

export function isUpcoming(booking: Booking) {
  const today = new Date().toISOString().slice(0, 10);
  return booking.booking_date >= today;
}

/**
 * BOOKING CONFLICT CHECK — the core rule of the app.
 *
 * Two time ranges on the same workspace and the same date overlap when:
 *     existing.start_time < new_end_time  AND  existing.end_time > new_start_time
 *
 * The check runs in the database (function `has_booking_conflict`) because row
 * level security hides other people's bookings from the browser. The function
 * looks only at CONFIRMED bookings for that workspace + date and applies exactly
 * the two comparisons above, so a cancelled booking frees its slot again.
 *
 * Returns true when the requested slot is already taken.
 */
export async function hasBookingConflict(
  workspaceId: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
) {
  const { data, error } = await supabase.rpc("has_booking_conflict", {
    p_workspace_id: workspaceId,
    p_booking_date: bookingDate,
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) throw error;
  return data === true;
}

