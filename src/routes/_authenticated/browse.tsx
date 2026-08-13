import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Workspace } from "@/lib/booking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/browse")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Browse Workspaces — UrbanOffice" },
      {
        name: "description",
        content: "Browse desk spaces, meeting rooms and event spaces across Shanghai.",
      },
      { property: "og:title", content: "Browse Workspaces — UrbanOffice" },
      { property: "og:description", content: "Desks, meeting rooms and event spaces by the hour." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { category } = Route.useSearch();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeCategory, setActiveCategory] = useState(category);

  useEffect(() => {
    setActiveCategory(category);
  }, [category]);

  useEffect(() => {
    supabase
      .from("workspaces")
      .select("*")
      .order("name")
      .then(({ data }) => setWorkspaces((data as Workspace[]) ?? []));
  }, []);

  const visible = activeCategory
    ? workspaces.filter((workspace) => workspace.category === activeCategory)
    : workspaces;

  return (
    <div>
      <h1 className="text-3xl font-bold">Browse workspaces</h1>
      <p className="mt-2 text-muted-foreground">Pick a category and reserve by the hour.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant={activeCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("")}
        >
          All
        </Button>
        {CATEGORIES.map((item) => (
          <Button
            key={item}
            variant={activeCategory === item ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((workspace) => (
          <Link
            key={workspace.id}
            to="/workspace/$id"
            params={{ id: workspace.id }}
            className="block"
          >
            <Card className="h-full overflow-hidden p-0 transition hover:border-accent hover:shadow-md">
              <img
                src={workspace.image_url ?? ""}
                alt={`${workspace.name} in ${workspace.location}`}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-tight">{workspace.name}</h2>
                  <Badge variant="secondary">{workspace.category}</Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {workspace.location}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="size-4" /> {workspace.capacity} people
                  </span>
                  <span className="font-semibold">¥{workspace.price_per_hour}/hour</span>
                </div>
                <p className="text-xs text-muted-foreground">{workspace.amenities}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No workspaces in this category yet.</p>
      )}
    </div>
  );
}
