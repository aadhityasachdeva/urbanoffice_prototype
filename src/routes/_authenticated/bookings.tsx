import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, isUpcoming, type Booking, type Workspace } from "@/lib/booking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — UrbanOffice" },
      { name: "description", content: "Review and cancel your UrbanOffice workspace bookings." },
      { property: "og:title", content: "My Bookings — UrbanOffice" },
      { property: "og:description", content: "Your upcoming and past workspace bookings." },
    ],
  }),
  component: MyBookingsPage,
});

type BookingWithWorkspace = Booking & { workspaces: Workspace | null };

function MyBookingsPage() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<BookingWithWorkspace[]>([]);

  const loadBookings = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, workspaces(*)")
      .eq("user_id", session.user.id)
      .order("booking_date", { ascending: false });
    setBookings((data as BookingWithWorkspace[]) ?? []);
  }, [session?.user?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Cancelling keeps the row for history — it only flips the status.
  async function cancelBooking(bookingId: string) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    loadBookings();
  }

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((booking) => !isUpcoming(booking));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">My bookings</h1>
        <p className="mt-2 text-muted-foreground">Cancelled bookings stay here for your records.</p>
      </div>

      <BookingSection title="Upcoming" bookings={upcoming} onCancel={cancelBooking} />
      <BookingSection title="Past" bookings={past} />
    </div>
  );
}

function BookingSection({
  title,
  bookings,
  onCancel,
}: {
  title: string;
  bookings: BookingWithWorkspace[];
  onCancel?: (bookingId: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {bookings.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Nothing to show.</Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{booking.workspaces?.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.workspaces?.location} · {booking.booking_date} ·{" "}
                  {formatTime(booking.start_time)}–{formatTime(booking.end_time)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                  {booking.status}
                </Badge>
                {onCancel && booking.status === "confirmed" && (
                  <Button variant="outline" size="sm" onClick={() => onCancel(booking.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
