'use client';

import React from 'react';
import { StatutoryEntitlement, AirlineInfo } from '@/lib/grievance/types';

interface EntitlementBannerProps {
  entitlement: StatutoryEntitlement;
  airline: AirlineInfo;
  onOpenDraftModal: () => void;
}

export function EntitlementBanner({
  entitlement,
  airline,
  onOpenDraftModal,
}: EntitlementBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
              <img src={airline.logoUrl} alt={airline.shortName} className="max-h-full max-w-full object-contain" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {airline.name} • Your Legal Entitlement
            </span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {entitlement.headline}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenDraftModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <span>Generate Formal Legal Notice</span>
            <span>📝</span>
          </button>
          <a
            href={airline.officialCocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>Official CoC Document</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Compensation & Rights Metric Cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-indigo-100 bg-white/90 p-4 backdrop-blur dark:border-indigo-900/40 dark:bg-slate-900/80 sm:grid-cols-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mandatory Cash Compensation
          </span>
          <div className="mt-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {entitlement.compensationAmount}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {entitlement.compensationBasis}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Refund Rights
          </span>
          <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
            {entitlement.refundSummary}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Airport taxes (UDF, PSF, ASF) are 100% refundable by law even on non-refundable tickets.
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Free Airport Care Mandated
          </span>
          <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
            {entitlement.freeCareSummary}
          </div>
        </div>
      </div>

      {/* Exact Statutory Clauses & Mandates */}
      <div className="mt-5 pt-4 border-t border-indigo-100 dark:border-indigo-900/50 space-y-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
          <span>📜</span> Exact Statutory Clauses Applicable
        </span>
        <div className="space-y-2">
          {entitlement.primaryClauses.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-indigo-100 bg-white/95 p-3 shadow-xs dark:border-indigo-900/60 dark:bg-slate-900/90"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-50 dark:border-indigo-950 pb-1.5 mb-1.5">
                <span className="text-xs font-extrabold text-slate-950 dark:text-white">
                  {item.name} — <span className="text-indigo-800 dark:text-indigo-300 font-bold">{item.clause}</span>
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline dark:text-indigo-400"
                >
                  <span>Citation Link</span>
                  <span>↗</span>
                </a>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200/70 dark:border-slate-800">
                “{item.exactText}”
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
