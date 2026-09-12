'use client';

import React from 'react';
import { AirlineInfo, GrievanceCategory } from '@/lib/grievance/types';
import { PROBLEM_LIST } from '@/lib/grievance/grievance-rules';

interface ProblemQuestionViewProps {
  airline: AirlineInfo;
  selectedCategory: GrievanceCategory | null;
  onSelectCategory: (category: GrievanceCategory) => void;
  onBack: () => void;
}

export function ProblemQuestionView({
  airline,
  selectedCategory,
  onSelectCategory,
  onBack,
}: ProblemQuestionViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          <span>←</span>
          <span>Back to Airlines</span>
        </button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className={`inline-flex h-3.5 w-6 items-center justify-center rounded text-[9px] font-black text-white ${airline.logoBg}`}>
            {airline.code.slice(0, 2)}
          </span>
          <span>{airline.shortName}</span>
        </div>
      </div>

      {/* Question Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
          <span>Step 2 of 2</span>
          <span>•</span>
          <span>Incident Classification</span>
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          What problem did you face?
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Select what occurred to instantly view your legal entitlement and a step-by-step roadmap to get your compensation.
        </p>
      </div>

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEM_LIST.map((problem) => {
          const isSelected = selectedCategory === problem.id;
          return (
            <button
              key={problem.id}
              onClick={() => onSelectCategory(problem.id)}
              className={`group flex flex-col items-start justify-between rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl">{problem.icon}</span>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    View Solution →
                  </span>
                </div>
                <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
                  {problem.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {problem.quickDescription}
                </p>
              </div>

              <div className="mt-4 w-full border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <span className="inline-block rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {problem.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
