import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function OfflineIndicator() {
  const online = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => true, // server snapshot — assume online
  );

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-prism-amber/15 px-4 py-1.5 text-xs font-medium text-prism-amber"
    >
      <WifiOff className="size-3.5" />
      You are offline — cached data is being used
    </div>
  );
}
