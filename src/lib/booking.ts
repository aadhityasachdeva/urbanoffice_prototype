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
 * We ask the database for any CONFIRMED booking on that workspace/date matching
 * those two conditions. If at least one row comes back, the slot is taken and we
 * must NOT create the booking. Cancelled bookings are ignored, so a cancelled
 * slot becomes free again.
 */
export async function findConflictingBooking(
  workspaceId: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_time, end_time")
    .eq("workspace_id", workspaceId)
    .eq("booking_date", bookingDate)
    .eq("status", "confirmed")
    .lt("start_time", endTime) // existing starts before the new booking ends
    .gt("end_time", startTime) // existing ends after the new booking starts
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
