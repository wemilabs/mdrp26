import { Printer, X } from "lucide-react";
import { useRef } from "react";

interface ReportModalProps {
  html: string;
  onClose: () => void;
}

export function ReportModal({ html, onClose }: ReportModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-prism-dark/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-prism-border px-5 py-3.5">
          <div className="font-display text-base font-semibold text-prism-text">
            Report Preview
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => iframeRef.current?.contentWindow?.print()}
              className="flex items-center gap-1.5 rounded-lg border border-prism-teal/40 px-3.5 py-1.5 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white"
            >
              <Printer className="size-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-prism-muted-2/40 px-2 py-1.5 text-xs font-semibold text-prism-muted transition-colors hover:bg-prism-card"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="report-preview"
          className="min-h-[60vh] flex-1 border-none"
        />
      </div>
    </div>
  );
}
