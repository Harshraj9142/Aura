'use client';

import React from 'react';
import { AirlineId } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { Landmark } from 'lucide-react';

interface AirlineQuestionViewProps {
  selectedAirline: AirlineId | null;
  onSelectAirline: (airline: AirlineId) => void;
}

export function AirlineQuestionView({
  selectedAirline,
  onSelectAirline,
}: AirlineQuestionViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300">
      {/* Progress & Question Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
          <span>Step 1 of 2</span>
          <span>•</span>
          <span>Carrier Identification</span>
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Which airline did you fly with?
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Select your airline to load their specific Conditions of Carriage, Nodal Officer email, and statutory timelines.
        </p>
      </div>

      {/* Airline Selection Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(AIRLINE_DIRECTORY).map((airline) => {
          const isSelected = selectedAirline === airline.id;
          return (
            <button
              key={airline.id}
              onClick={() => onSelectAirline(airline.id)}
              className={`group flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 shadow-xs p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={airline.logoUrl}
                      alt={airline.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {airline.code}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Select →
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {airline.shortName}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {airline.name}
                </p>
              </div>

              <div className="mt-4 w-full border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Landmark className="h-3.5 w-3.5 text-slate-400" />
                  <span>Nodal: {airline.nodalOfficer.email.split('@')[0]}@...</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
