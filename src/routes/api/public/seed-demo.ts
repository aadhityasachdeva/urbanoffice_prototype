import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY one-off demo seeding endpoint (removed after seeding).
export const Route = createFileRoute("/api/public/seed-demo")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const demoUsers = [
          { email: "admin@urbanoffice.demo", name: "Alice Chen", role: "admin" },
          { email: "ben@urbanoffice.demo", name: "Ben Zhao", role: "user" },
          { email: "mei@urbanoffice.demo", name: "Mei Lin", role: "user" },
        ];

        const ids: string[] = [];
        for (const user of demoUsers) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: "demo1234",
            email_confirm: true,
            user_metadata: { full_name: user.name },
          });
          if (error && !error.message.includes("already")) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
          }
          let id = data?.user?.id;
          if (!id) {
            const { data: list } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("email", user.email)
              .maybeSingle();
            id = list?.id;
          }
          if (!id) continue;
          ids.push(id);
          await supabaseAdmin
            .from("profiles")
            .update({ full_name: user.name, email: user.email, role: user.role })
            .eq("id", id);
        }

        const { data: workspaces } = await supabaseAdmin
          .from("workspaces")
          .select("id")
          .order("name");
        if (!workspaces || ids.length === 0) {
          return new Response(JSON.stringify({ error: "missing data" }), { status: 500 });
        }

        const day = (offset: number) =>
          new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

        const bookings = [
          { workspace_id: workspaces[0]!.id, user_id: ids[0]!, booking_date: day(1), start_time: "09:00", end_time: "12:00" },
          { workspace_id: workspaces[3]!.id, user_id: ids[1]!, booking_date: day(2), start_time: "13:00", end_time: "15:00" },
          { workspace_id: workspaces[5]!.id, user_id: ids[2]!, booking_date: day(3), start_time: "10:00", end_time: "11:30" },
          { workspace_id: workspaces[6]!.id, user_id: ids[0]!, booking_date: day(5), start_time: "14:00", end_time: "18:00" },
          { workspace_id: workspaces[1]!.id, user_id: ids[1]!, booking_date: day(-6), start_time: "09:30", end_time: "11:00" },
          { workspace_id: workspaces[7]!.id, user_id: ids[2]!, booking_date: day(-3), start_time: "16:00", end_time: "20:00" },
        ];

        const { error: insertError } = await supabaseAdmin.from("bookings").insert(bookings);
        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true, users: ids.length }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
