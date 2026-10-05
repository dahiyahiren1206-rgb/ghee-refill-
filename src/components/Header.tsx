import { Link, NavLink } from "react-router-dom";
import { FileText, Home, MessageCircle, Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Home", icon: Home, testid: "header-nav-home" },
  { to: "/search", label: "Ek Video", icon: Search, testid: "header-nav-search" },
  { to: "/papers", label: "PYQs & Papers", icon: FileText, testid: "header-nav-papers" },
  { to: "/contribute", label: "Daan Karo", icon: Upload, testid: "header-nav-contribute" },
  { to: "/chat", label: "Ghee Guru", icon: MessageCircle, testid: "header-nav-chat" },
];

export default function Header() {
  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 border-b border-amber-200/60 bg-white/90 shadow-xs backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" data-testid="header-brand" className="flex shrink-0 items-center gap-2">
          <img
            src="/ghee-jar.png"
            alt="Ghee jar — Ghee Khatam brand"
            className="h-9 w-9 rounded-lg border border-amber-200 object-cover"
          />
          <span className="font-heading text-xl font-black tracking-tight">
            Ghee Khatam <span className="text-amber-600">🧈</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map(({ to, label, icon: Icon, testid }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={testid}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-amber-100 text-amber-900"
                    : "text-zinc-600 hover:bg-amber-50 hover:text-amber-900",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
