"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-rose-950/80 p-3 text-rose-400 border border-rose-800/60">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-100">Something went wrong!</h2>
      <p className="max-w-md text-xs text-slate-400">
        {error.message || "An unexpected error occurred while fetching dashboard data."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
      >
        Try again
      </button>
    </div>
  );
}
