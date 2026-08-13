import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UrbanOffice Workspace Booking" },
      {
        name: "description",
        content:
          "Sign in or create an UrbanOffice account to book desks, meeting rooms and event spaces in Shanghai.",
      },
      { property: "og:title", content: "Sign in — UrbanOffice" },
      { property: "og:description", content: "Access your UrbanOffice workspace bookings." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Once signed in, go straight to the dashboard.
  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      // New accounts get role 'user' automatically (database default).
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) setMessage(error.message);
    }

    setBusy(false);
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <Link to="/" className="text-xl font-bold">
          Urban<span className="text-accent">Office</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Smart workspace booking for modern teams.
          </h2>
          <p className="mt-3 max-w-sm opacity-80">
            Desks, meeting rooms and event spaces across Shanghai — reserved in seconds.
          </p>
        </div>
        <p className="text-sm opacity-60">© UrbanOffice</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in with your email and password."
              : "Sign up to start booking workspaces."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {message && <p className="text-sm text-destructive">{message}</p>}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <button
            className="mt-4 text-sm text-muted-foreground underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
