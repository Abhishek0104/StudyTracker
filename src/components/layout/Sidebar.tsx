import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListTree, Library, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncStatus } from "@/components/SyncStatus";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/curriculum", label: "Curriculum", icon: ListTree, end: false },
  { to: "/resources", label: "Resources", icon: Library, end: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, end: false },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-2 border-r border-border px-4 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}
        >
          <span className="text-lg font-bold">S</span>
        </div>
        <div className="leading-tight">
          <div className="font-semibold">StudyTracker</div>
          <div className="text-xs text-muted-foreground">ML Eng cockpit</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-3">
        <SyncStatus />
      </div>
    </aside>
  );
}

/** Mobile top nav shown below md breakpoint. */
export function MobileNav() {
  return (
    <nav className="sticky top-0 z-10 flex gap-1 border-b border-border bg-background/80 px-3 py-2 backdrop-blur md:hidden">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground",
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
