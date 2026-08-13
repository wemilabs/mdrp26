const PRISM_LOGO_URL = "/prism-logo.svg";

export type TabKey = "calculator" | "dashboard";

interface TopBarProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function TopBar({ tab, onTabChange }: TopBarProps) {
  return (
    <header className="bg-prism-dark">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
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
        </div>

        <nav className="flex gap-1 rounded-xl bg-white/8 p-1">
          <TabButton
            active={tab === "calculator"}
            onClick={() => onTabChange("calculator")}
          >
            Refract
          </TabButton>
          <TabButton
            active={tab === "dashboard"}
            onClick={() => onTabChange("dashboard")}
          >
            Spectrum
          </TabButton>
        </nav>
      </div>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-prism-mint text-prism-dark shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
