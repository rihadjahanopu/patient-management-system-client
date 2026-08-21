'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md text-center border border-slate-700">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong!</h2>
          <p className="text-xs text-slate-400 mb-6">{error.message || 'An unexpected application error occurred.'}</p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
