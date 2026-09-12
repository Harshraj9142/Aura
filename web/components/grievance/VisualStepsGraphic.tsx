'use client';

import React from 'react';
import { ActionStep } from '@/lib/grievance/types';

interface VisualStepsGraphicProps {
  steps: ActionStep[];
  airlineShortName: string;
  onOpenDraftModal: () => void;
}

export function VisualStepsGraphic({
  steps,
  airlineShortName,
  onOpenDraftModal,
}: VisualStepsGraphicProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
              🗺️
            </span>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Action Plan: What You Need To Do (Step-by-Step)
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Follow these sequential legal steps to enforce your compensation rights against {airlineShortName}.
          </p>
        </div>

        <button
          onClick={onOpenDraftModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <span>Copy Pre-Filled Notice</span>
          <span>📋</span>
        </button>
      </div>

      {/* Visual Connected Stepper Flow */}
      <div className="relative">
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-4">
              {/* Connector Line & Icon */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-base shadow-sm ring-4 ring-white dark:bg-indigo-950/80 dark:ring-slate-900">
                  <span>{step.icon}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="my-2 h-full w-0.5 bg-gradient-to-b from-indigo-500 via-slate-200 to-slate-200 dark:from-indigo-500 dark:via-slate-800 dark:to-slate-800" />
                )}
              </div>

              {/* Step Card Content */}
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-200 hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white dark:bg-white dark:text-slate-900">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      {step.stage}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    ⏱️ {step.timeframe}
                  </span>
                </div>

                <h4 className="mt-2.5 text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
                  {step.title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {step.shortAction || step.description}
                </p>

                {/* Bullet Points if present */}
                {step.bulletPoints && step.bulletPoints.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {step.bulletPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-emerald-600 font-bold dark:text-emerald-400">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Exact Statutory Mandate for this Step */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                      <span>⚖️</span> Statutory Mandate: {step.clauseCitation.label}
                    </span>
                    <a
                      href={step.clauseCitation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 shrink-0"
                    >
                      Citation Link ↗
                    </a>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-mono bg-slate-50 p-2 rounded border border-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    “{step.clauseCitation.exactText || step.clauseCitation.label}”
                  </p>
                </div>

                {/* Contact Info (if applicable) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  {step.contactInfo && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {step.contactInfo.label}:
                      </span>
                      {step.contactInfo.email && (
                        <a
                          href={`mailto:${step.contactInfo.email}`}
                          className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {step.contactInfo.email}
                        </a>
                      )}
                      {step.contactInfo.phone && (
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {step.contactInfo.phone}
                        </span>
                      )}
                      {step.contactInfo.url && (
                        <a
                          href={step.contactInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Open Portal ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
