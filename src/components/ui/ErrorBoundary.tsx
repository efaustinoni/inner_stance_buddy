// Created: 2026-04-07
// Last Updated: 2026-04-07

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
          <div className="bg-navy-800 border border-status-error/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <div className="p-3 bg-status-error/10 rounded-full">
                <AlertTriangle size={32} className="text-status-error" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-content-inverse">Something went wrong</h1>
            <p className="text-sm text-content-muted">
              An unexpected error occurred. Your data is safe — please reload the page to continue.
            </p>
            {this.state.message && (
              <p className="text-xs text-content-muted/60 font-mono break-words bg-navy-900 rounded-lg px-3 py-2">
                {this.state.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-blue text-white rounded-pill font-medium hover:bg-accent-blue-hover transition-colors shadow-button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
