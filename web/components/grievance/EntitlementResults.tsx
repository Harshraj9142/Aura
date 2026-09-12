'use client';

import React from 'react';
import { WizardAnswers } from '@/lib/grievance/types';
import { calculateEntitlement } from '@/lib/grievance/grievance-rules';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';

interface EntitlementResultsProps {
  answers: WizardAnswers;
  onReset: () => void;
  onOpenDraftModal: () => void;
}

export function EntitlementResults({
  answers,
  onReset,
  onOpenDraftModal,
}: EntitlementResultsProps) {
  const airline = answers.airlineId ? AIRLINE_DIRECTORY[answers.airlineId] : AIRLINE_DIRECTORY.indigo;
  const entitlement = calculateEntitlement(answers);

  return (
    <div className="space-y-6">
      {/* Top Banner: Guaranteed Statutory Rights */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-6 items-center justify-center rounded px-2 text-xs font-bold text-white ${airline.logoBg}`}>
                {airline.code}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                {airline.name} • Legal Entitlement Assessment
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {entitlement.headline}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Governed by {entitlement.dgcaClause}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenDraftModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <span>Generate Legal Complaint Draft</span>
              <span>📝</span>
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>New Search</span>
              <span>🔄</span>
            </button>
          </div>
        </div>

        {/* Highlighted Compensation Figure */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-indigo-100 bg-white/80 p-4 backdrop-blur dark:border-indigo-900/40 dark:bg-slate-900/80 sm:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mandatory Compensation Payable
            </span>
            <div className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {entitlement.compensationAmount}
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {entitlement.compensationBasis}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Refund & Ticket Rights
            </span>
            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {entitlement.refundRights}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Airlines are barred from deducting airport taxes (UDF, PSF, ASF) even on non-refundable tickets.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Free Services & Immediate Airport Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Free Care & Facilities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="text-lg">🛎️</span>
            <span>Free Services Mandated by Law</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            The airline must provide these at zero extra cost to you:
          </p>
          <ul className="mt-3 space-y-2.5">
            {entitlement.freeServices.map((service, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Legal Note: </span>
            {entitlement.legalRightsSummary}
          </div>
        </div>

        {/* Immediate Airport Actions Checklist */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
            <span className="text-lg">⚠️</span>
            <span>Immediate Actions to Take At The Airport</span>
          </div>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Protect your legal claim before leaving the airport terminal:
          </p>
          <ul className="mt-3 space-y-2.5">
            {entitlement.immediateAirportActions.map((action, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-white/70 p-3 text-xs text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Airline Specific Advice: </span>
            {entitlement.airlinePolicyNotes}
          </div>
        </div>
      </div>

      {/* Official Documentation & Policy Links */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="text-lg">📑</span>
            <span>Official Policy Documents & Authority Links</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Verified official portals
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Use these official links when filing written complaints to quote the exact contractual clauses:
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entitlement.officialReferenceUrls.map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-950 dark:text-indigo-400 dark:hover:border-indigo-700"
            >
              <span className="truncate">{ref.title}</span>
              <span className="ml-2 shrink-0">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
