'use client';

import React from 'react';
import { AirlineId, GrievanceCategory } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { PROBLEM_LIST } from '@/lib/grievance/grievance-rules';

interface QuickProblemSelectorProps {
  selectedAirline: AirlineId;
  selectedCategory: GrievanceCategory;
  onSelectAirline: (airline: AirlineId) => void;
  onSelectCategory: (category: GrievanceCategory) => void;
}

export function QuickProblemSelector({
  selectedAirline,
  selectedCategory,
  onSelectAirline,
  onSelectCategory,
}: QuickProblemSelectorProps) {
  return (
    <div className="space-y-4">
      {/* 1. Airline Selector Pills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Step 1: Select Airline
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="h-4 w-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={AIRLINE_DIRECTORY[selectedAirline].logoUrl} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <span>{AIRLINE_DIRECTORY[selectedAirline].name}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.values(AIRLINE_DIRECTORY).map((airline) => {
            const isSelected = selectedAirline === airline.id;
            return (
              <button
                key={airline.id}
                onClick={() => onSelectAirline(airline.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/30 dark:bg-indigo-500'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="h-5 w-5 rounded bg-white border border-slate-200/80 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                  <img
                    src={airline.logoUrl}
                    alt={airline.shortName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span>{airline.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Problem Selector Grid */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Step 2: What problem did you face?
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PROBLEM_LIST.map((problem) => {
            const isSelected = selectedCategory === problem.id;
            return (
              <button
                key={problem.id}
                onClick={() => onSelectCategory(problem.id)}
                className={`flex flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-2xl">{problem.icon}</span>
                  <h4 className="mt-2 text-xs font-extrabold text-slate-900 dark:text-white">
                    {problem.title}
                  </h4>
                </div>
                <span className="mt-3 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                  {problem.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
