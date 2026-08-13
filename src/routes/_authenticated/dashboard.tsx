import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, formatTime, type Booking, type Workspace } from "@/lib/booking";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — UrbanOffice" },
      { name: "description", content: "Your UrbanOffice workspace dashboard and upcoming bookings." },
      { property: "og:title", content: "Dashboard — UrbanOffice" },
      { property: "og:description", content: "See your upcoming workspace bookings." },
    ],
  }),
  component: DashboardPage,
});

type BookingWithWorkspace = Booking & { workspaces: Workspace | null };

function DashboardPage() {
  const { session, profile } = useAuth();
  const [upcoming, setUpcoming] = useState<BookingWithWorkspace[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    const today = new Date().toISOString().slice(0, 10);

    supabase
      .from("bookings")
      .select("*, workspaces(*)")
      .eq("user_id", session.user.id)
      .eq("status", "confirmed")
      .gte("booking_date", today)
      .order("booking_date")
      .limit(5)
      .then(({ data }) => setUpcoming((data as BookingWithWorkspace[]) ?? []));
  }, [session?.user?.id]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find a workspace that fits the way you work today.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Browse by category</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link key={category} to="/browse" search={{ category }}>
              <Card className="h-full p-6 transition hover:border-accent hover:shadow-md">
                <p className="text-base font-semibold">{category}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category === "Desk Space"
                    ? "Focused solo work by the hour."
                    : category === "Meeting Room"
                      ? "Private rooms for team sessions."
                      : "Big rooms for launches and events."}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Your upcoming bookings</h2>
        {upcoming.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No upcoming bookings yet.{" "}
            <Link to="/browse" className="text-primary underline">
              Browse workspaces
            </Link>
            .
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{booking.workspaces?.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {booking.workspaces?.location}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {booking.booking_date} · {formatTime(booking.start_time)}–
                  {formatTime(booking.end_time)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
