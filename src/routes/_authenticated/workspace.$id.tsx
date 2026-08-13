import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { hasBookingConflict, type Workspace } from "@/lib/booking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/workspace/$id")({
  head: () => ({
    meta: [
      { title: "Workspace details — UrbanOffice" },
      { name: "description", content: "Workspace details and hourly booking form." },
      { property: "og:title", content: "Workspace details — UrbanOffice" },
      { property: "og:description", content: "Check availability and book this workspace." },
    ],
  }),
  component: WorkspaceDetailPage,
});

function WorkspaceDetailPage() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setWorkspace(data as Workspace | null));
  }, [id]);

  async function handleBooking(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!session?.user) return;
    if (endTime <= startTime) {
      setError("The end time must be after the start time.");
      return;
    }

    setBusy(true);
    try {
      // STEP 1: Ask the database whether this workspace is already booked for an
      // overlapping time range on the same date (see hasBookingConflict).
      const conflict = await hasBookingConflict(id, date, startTime, endTime);

      // STEP 2: If there is an overlap, stop here — no booking is created.
      if (conflict) {
        setError(
          "That time slot overlaps an existing confirmed booking for this workspace. Please pick another time.",
        );
        setBusy(false);
        return;
      }

      // STEP 3: No overlap, so save the booking as confirmed.
      const { error: insertError } = await supabase.from("bookings").insert({
        workspace_id: id,
        user_id: session.user.id,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        status: "confirmed",
      });

      if (insertError) setError(insertError.message);
      else setSuccess(`Booked for ${date} from ${startTime} to ${endTime}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
    setBusy(false);
  }

  if (!workspace) {
    return <p className="text-sm text-muted-foreground">Loading workspace…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <img
          src={workspace.image_url ?? ""}
          alt={`${workspace.name} in ${workspace.location}`}
          className="h-64 w-full rounded-xl object-cover"
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <Badge variant="secondary">{workspace.category}</Badge>
        </div>
        <p className="mt-3 flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4" /> {workspace.location}
          <span className="mx-1">·</span>
          <Users className="size-4" /> Up to {workspace.capacity} people
        </p>
        <p className="mt-4 leading-relaxed">{workspace.description}</p>
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Amenities
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(workspace.amenities ?? "")
              .split(",")
              .map((amenity) => amenity.trim())
              .filter(Boolean)
              .map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      <Card className="h-fit p-6">
        <p className="text-2xl font-bold">
          ¥{workspace.price_per_hour}
          <span className="text-sm font-normal text-muted-foreground"> / hour</span>
        </p>

        <form onSubmit={handleBooking} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {success && <p className="text-sm font-medium text-accent-foreground">{success}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Checking availability…" : "Confirm booking"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
