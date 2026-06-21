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

/** Slim top header shown below md breakpoint (brand + sync status). */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}
        >
          <span className="text-sm font-bold">S</span>
        </div>
        <span className="font-semibold">StudyTracker</span>
      </div>
      <SyncStatus compact />
    </header>
  );
}

/** Bottom tab bar shown below md breakpoint — fits all items on a phone. */
export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground",
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
