import { Link, NavLink } from "react-router-dom";
import { LogoMark, LogoWord } from "./Logo";

const NAV = [
  { to: "/", label: "lessons", end: true },
  { to: "/type", label: "type", end: false },
  { to: "/progress", label: "progress", end: false },
  { to: "/settings", label: "settings", end: false },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-lg px-3 py-1.5 text-sm transition-colors ${
    isActive ? "bg-line text-ink" : "text-dim hover:text-ink"
  }`;
}

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <Link to="/" aria-label="staqtype: lessons" className="flex items-center gap-[11px]">
        <LogoMark className="size-8 shrink-0" />
        <LogoWord />
      </Link>
      <nav
        aria-label="Main"
        className="flex gap-0.5 rounded-xl border border-line bg-surface p-1"
      >
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
