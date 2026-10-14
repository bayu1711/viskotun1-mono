import React, { Component, type ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render errors in a view so the shell and navigation stay usable. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('View crashed', error, info.componentStack);
  }

  private handleRetry = () => this.setState({ error: null });

  render() {
    if (this.state.error) return <ErrorFallback onRetry={this.handleRetry} />;
    return this.props.children;
  }
}