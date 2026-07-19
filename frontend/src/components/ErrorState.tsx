import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: 'alert' | 'error' | 'warning';
}

export function ErrorState({ title = 'Error', message, onRetry, icon = 'alert' }: ErrorStateProps) {
  const iconMap = {
    alert: '⚠️',
    error: '❌',
    warning: '⚡',
  };

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
      <div className="flex gap-4">
        <div className="text-2xl">{iconMap[icon]}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="mt-2 text-sm text-red-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
