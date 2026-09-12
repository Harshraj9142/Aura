'use client';

import React from 'react';

export function DGCACharterReference() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            DGCA Civil Aviation Requirements (CAR) — Quick Legal Cheatsheet
          </h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Statutory Law in India
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cancellation */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
            <span>🚫</span>
            <span>Flight Cancellation</span>
          </div>
          <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
            ₹5,000 – ₹10,000
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Payable if informed &lt;24 hours before flight, plus full refund or alternate flight with free refreshments.
          </p>
        </div>

        {/* Card 2: Denied Boarding */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>💺</span>
            <span>Denied Boarding</span>
          </div>
          <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
            200% – 400% Basic Fare
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Up to ₹20,000 max compensation if alternate flight is &gt;24 hours later or if passenger declines alternate.
          </p>
        </div>

        {/* Card 3: Baggage */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>🧳</span>
            <span>Baggage Loss / Damage</span>
          </div>
          <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
            Up to ₹20,000 / 1,288 SDR
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Must file Property Irregularity Report (PIR) before leaving airport. Bags missing &gt;21 days deemed lost.
          </p>
        </div>

        {/* Card 4: Refunds */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>💳</span>
            <span>Refunds & Taxes</span>
          </div>
          <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
            7 Working Days Strict
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            All airport taxes (PSF, UDF, ASF) MUST be 100% refunded even on non-refundable tickets.
          </p>
        </div>
      </div>
    </div>
  );
}
