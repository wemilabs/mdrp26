import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  const visible = needRefresh || offlineReady;
  if (!visible) return null;

  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  const title = needRefresh ? "New version available" : "Ready for offline use";
  const body = needRefresh
    ? "Reload to get the latest version of PRISM."
    : "PRISM is now installed and works offline.";
  const action = needRefresh ? (
    <button
      type="button"
      onClick={() => updateServiceWorker(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-prism-mint px-3 py-1.5 text-xs font-semibold text-prism-dark transition-colors hover:bg-prism-seafoam"
    >
      <RefreshCw className="size-3.5" />
      Reload
    </button>
  ) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-72 items-start gap-3 rounded-xl border border-prism-border bg-white p-3 shadow-lg"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-prism-text">{title}</p>
        <p className="mt-0.5 text-xs text-prism-muted">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={close}
        className="rounded-md p-1 text-prism-muted-2 transition-colors hover:bg-prism-card hover:text-prism-text"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
