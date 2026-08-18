import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("PRISM view error:", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl rounded-2xl border border-prism-red/40 bg-prism-red/5 p-8 text-center">
          <p className="font-display text-lg font-semibold text-prism-text">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-prism-muted">
            {this.state.message || "An unexpected error occurred while rendering this view."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="mt-5 rounded-lg bg-prism-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-prism-dark"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
