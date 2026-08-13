import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { CATEGORIES, formatTime, type Booking, type Workspace } from "@/lib/booking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — UrbanOffice" },
      { name: "description", content: "Manage workspaces, bookings and users in UrbanOffice." },
      { property: "og:title", content: "Admin Dashboard — UrbanOffice" },
      { property: "og:description", content: "Workspace, booking and user management." },
    ],
  }),
  component: AdminPage,
});

type BookingRow = Booking & { workspaces: Workspace | null; profiles: Profile | null };

const emptyForm = {
  name: "",
  category: CATEGORIES[0] as string,
  location: "",
  capacity: 1,
  price_per_hour: 0,
  amenities: "",
  image_url: "",
  description: "",
};

function AdminPage() {
  const { isAdmin, profile } = useAuth();

  if (!profile) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isAdmin) {
    return (
      <Card className="p-6">
        <h1 className="text-lg font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have admin access.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <Tabs defaultValue="workspaces" className="mt-6">
        <TabsList>
          <TabsTrigger value="workspaces">Manage Workspaces</TabsTrigger>
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="workspaces" className="mt-6">
          <ManageWorkspaces />
        </TabsContent>
        <TabsContent value="bookings" className="mt-6">
          <AllBookings />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <AllUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManageWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadWorkspaces = useCallback(async () => {
    const { data } = await supabase.from("workspaces").select("*").order("name");
    setWorkspaces((data as Workspace[]) ?? []);
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  async function saveWorkspace(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      price_per_hour: Number(form.price_per_hour),
    };

    const { error } = editingId
      ? await supabase.from("workspaces").update(payload).eq("id", editingId)
      : await supabase.from("workspaces").insert(payload);

    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    loadWorkspaces();
  }

  async function deleteWorkspace(id: string) {
    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (error) setMessage(error.message);
    loadWorkspaces();
  }

  function startEditing(workspace: Workspace) {
    setEditingId(workspace.id);
    setForm({
      name: workspace.name,
      category: workspace.category,
      location: workspace.location,
      capacity: workspace.capacity,
      price_per_hour: Number(workspace.price_per_hour),
      amenities: workspace.amenities ?? "",
      image_url: workspace.image_url ?? "",
      description: workspace.description ?? "",
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <Card className="h-fit p-6">
        <h2 className="font-semibold">{editingId ? "Edit workspace" : "Add workspace"}</h2>
        <form onSubmit={saveWorkspace} className="mt-4 space-y-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Category">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity">
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </Field>
            <Field label="Price / hour">
              <Input
                type="number"
                min={0}
                value={form.price_per_hour}
                onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Amenities (comma separated)">
            <Input
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            />
          </Field>
          <Field label="Image URL">
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          {message && <p className="text-sm text-destructive">{message}</p>}

          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Save changes" : "Add workspace"}</Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{workspace.name}</p>
              <p className="text-sm text-muted-foreground">
                {workspace.category} · {workspace.location} · ¥{workspace.price_per_hour}/h ·{" "}
                {workspace.capacity} people
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEditing(workspace)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteWorkspace(workspace.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AllBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("*, workspaces(*), profiles(*)")
      .order("booking_date", { ascending: false })
      .then(({ data }) => setRows((data as BookingRow[]) ?? []));
  }, []);

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <Th>Workspace</Th>
            <Th>User</Th>
            <Th>Date</Th>
            <Th>Time</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <Td>{row.workspaces?.name}</Td>
              <Td>{row.profiles?.full_name || row.profiles?.email}</Td>
              <Td>{row.booking_date}</Td>
              <Td>
                {formatTime(row.start_time)}–{formatTime(row.end_time)}
              </Td>
              <Td>
                <Badge variant={row.status === "confirmed" ? "default" : "secondary"}>
                  {row.status}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function AllUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .then(({ data }) => setProfiles((data as Profile[]) ?? []));
  }, []);

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((item) => (
            <tr key={item.id} className="border-t border-border">
              <Td>{item.full_name || "—"}</Td>
              <Td>{item.email}</Td>
              <Td>
                <Badge variant={item.role === "admin" ? "default" : "secondary"}>{item.role}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
