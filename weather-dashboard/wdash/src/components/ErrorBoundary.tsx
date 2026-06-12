import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors from MapLibre, Recharts, or any child
 * and shows a recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-4 text-center">
        <AlertTriangle size={28} className="text-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-300">
            {this.props.fallbackLabel ?? 'Something went wrong'}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-[11px] bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded px-3 py-1.5 transition-colors"
          onClick={() => this.setState({ hasError: false, error: null })}
        >
          <RefreshCw size={12} />
          Try again
        </button>
      </div>
    );
  }
}
