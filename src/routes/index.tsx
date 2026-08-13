import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UrbanOffice — Smart Workspace Booking in Shanghai" },
      {
        name: "description",
        content:
          "Book desks, meeting rooms and event spaces across Shanghai by the hour with UrbanOffice.",
      },
      { property: "og:title", content: "UrbanOffice — Smart Workspace Booking" },
      {
        property: "og:description",
        content: "Desks, meeting rooms and event spaces across Shanghai, bookable by the hour.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold">
            Urban<span className="text-accent">Office</span>
          </span>
          <Link to="/auth">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Smart workspace booking for teams in Shanghai.
          </h1>
          <p className="mt-4 max-w-xl text-lg opacity-80">
            Reserve a desk, a meeting room or a full event space by the hour — with real-time
            availability checks.
          </p>
          <Link to="/auth" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">Three ways to work</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Card key={category} className="p-6">
              <h3 className="font-semibold">{category}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {category === "Desk Space"
                  ? "Hot desks with Wi-Fi, coffee and charging points."
                  : category === "Meeting Room"
                    ? "Private rooms with projectors and whiteboards."
                    : "Large halls for launches, panels and workshops."}
              </p>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © UrbanOffice — student demo project
      </footer>
    </div>
  );
}
