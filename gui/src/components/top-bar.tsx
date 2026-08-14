import { Link, NavLink } from "react-router";

const PRISM_LOGO_URL = "/prism-logo.svg";

export function TopBar() {
  return (
    <header className="bg-prism-dark">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={PRISM_LOGO_URL}
            alt="PRISM logo"
            className="size-10 rounded-xl ring-1 ring-white/10"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold text-white">
                PRISM
              </span>
            </div>
          </div>
        </Link>

        <nav className="flex gap-1 rounded-xl bg-white/8 p-1">
          <TabLink to="/refract">Refract</TabLink>
          <TabLink to="/spectrum">Spectrum</TabLink>
          <TabLink to="/batch">Batch</TabLink>
        </nav>
      </div>
    </header>
  );
}

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
          isActive
            ? "bg-prism-mint text-prism-dark shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
