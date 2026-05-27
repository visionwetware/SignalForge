import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Scan, LineChart, BookOpen, FileText, Settings, Shield, LayoutDashboard, Lock, LogOut, Mic, Images, PenTool } from "lucide-react";
import { hasFeature, TIERS } from "@/lib/tiers";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, feature: null },
  { to: "/scan", label: "Scan", icon: Scan, feature: "scan" },
  { to: "/topics", label: "Topics", icon: LineChart, feature: "topics_basic" },
  { to: "/learn", label: "Learn", icon: BookOpen, feature: "learn_basic" },
  { to: "/reports", label: "Reports", icon: FileText, feature: "reports_md" },
  { to: "/curio", label: "Curio", icon: Mic, feature: null },
  { to: "/handwriting", label: "Handwriting", icon: PenTool, feature: null },
  { to: "/pokedex", label: "Pokedex", icon: Images, feature: null },
  { to: "/settings", label: "Settings", icon: Settings, feature: null },
];

export default function Layout() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const tierLabel = user?.tier ? TIERS[user.tier]?.label : "Free";

  return (
    <div className="min-h-screen bg-[#080A18] text-[#E6F7FF] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#E6F7FF]/8 bg-[#0D1026] sticky top-0 h-screen">
        <div className="px-7 pt-8 pb-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-sm bg-[#E6F7FF] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#00F5FF] rounded-full" />
            </div>
            <div>
              <div className="font-serif text-xl tracking-tight leading-none">Curio</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50 mt-1">Intelligence Suite</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-0.5">
          {NAV.map((item) => {
            const locked = item.feature && !hasFeature(user, item.feature);
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                  active ? "bg-[#E6F7FF] text-[#080A18]" : "text-[#E6F7FF]/70 hover:bg-[#E6F7FF]/5 hover:text-[#E6F7FF]",
                  locked && "opacity-60"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="w-3 h-3" strokeWidth={2} />}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all mt-4",
                location.pathname.startsWith("/admin") ? "bg-[#E6F7FF] text-[#080A18]" : "text-[#E6F7FF]/70 hover:bg-[#E6F7FF]/5"
              )}
            >
              <Shield className="w-4 h-4" strokeWidth={1.75} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-[#E6F7FF]/8">
          <div className="px-3 py-3 rounded-md bg-[#080A18]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">Plan</div>
            <div className="flex items-center justify-between mt-1">
              <div className="font-serif text-base">{tierLabel}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00F5FF]" />
            </div>
            <div className="text-xs text-[#E6F7FF]/60 mt-1.5 truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-xs text-[#E6F7FF]/60 hover:text-[#E6F7FF] transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#0D1026]/95 backdrop-blur border-b border-[#E6F7FF]/8 px-5 py-3 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg">Curio</Link>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/60">{tierLabel}</div>
      </div>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <Outlet context={{ user, refreshUser: () => base44.auth.me().then(setUser).catch(() => {}) }} />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0D1026]/95 backdrop-blur border-t border-[#E6F7FF]/8 flex justify-start overflow-x-auto px-2 py-2">
        {NAV.map((item) => {
          const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md", active ? "text-[#E6F7FF]" : "text-[#E6F7FF]/50")}>
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}