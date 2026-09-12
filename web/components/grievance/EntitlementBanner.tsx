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
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-6 items-center justify-center rounded px-2 text-xs font-bold text-white ${airline.logoBg}`}>
              {airline.code}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
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

      {/* Direct Clause Mention Badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Statutory Clauses Applicable:
        </span>
        {entitlement.primaryClauses.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300"
          >
            <span>📜</span>
            <span>{item.name} — {item.clause}</span>
            <span>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
