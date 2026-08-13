import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/** Shared shell with the top navigation for all signed-in pages. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/browse", label: "Browse" },
    { to: "/bookings", label: "My Bookings" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-lg font-bold tracking-tight">
            Urban<span className="text-accent">Office</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-md px-3 py-2 text-sm font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100"
                activeProps={{ className: "bg-white/15 opacity-100" }}
              >
                {link.label}
              </Link>
            ))}
            <span className="ml-3 text-sm opacity-70">{profile?.full_name || profile?.email}</span>
            <Button variant="secondary" size="sm" className="ml-2" onClick={handleSignOut}>
              Sign out
            </Button>
          </nav>

          <button
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 md:hidden">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium opacity-90"
              >
                {link.label}
              </Link>
            ))}
            <Button variant="secondary" size="sm" className="mt-2" onClick={handleSignOut}>
              Sign out
            </Button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
