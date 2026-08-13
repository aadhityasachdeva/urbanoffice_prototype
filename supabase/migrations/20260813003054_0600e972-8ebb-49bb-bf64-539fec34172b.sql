-- Returns true when a CONFIRMED booking already overlaps the requested slot.
-- Overlap rule: existing.start_time < new_end AND existing.end_time > new_start
CREATE OR REPLACE FUNCTION public.has_booking_conflict(
  p_workspace_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE workspace_id = p_workspace_id
      AND booking_date = p_booking_date
      AND status = 'confirmed'
      AND start_time < p_end_time
      AND end_time > p_start_time
  );
$$;

REVOKE ALL ON FUNCTION public.has_booking_conflict(uuid, date, time, time) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_booking_conflict(uuid, date, time, time) TO authenticated;