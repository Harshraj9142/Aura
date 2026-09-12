'use client';

import React, { useState } from 'react';
import { AirlineId } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';

export function AirlineQuickDirectory() {
  const [selectedAirline, setSelectedAirline] = useState<AirlineId>('indigo');
  const airline = AIRLINE_DIRECTORY[selectedAirline];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Airline Directory & Grievance Contacts
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Verified official legal contacts, Conditions of Carriage documents, and Nodal escalation details for all major Indian carriers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {Object.values(AIRLINE_DIRECTORY).map((item) => {
          const isActive = selectedAirline === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedAirline(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white ${item.logoBg}`}>
                {item.code.slice(0, 2)}
              </span>
              <span>{item.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Details Card */}
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Basic Info & Documents */}
        <div className="space-y-4 md:col-span-1">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-6 items-center justify-center rounded px-2 text-xs font-bold text-white ${airline.logoBg}`}>
                {airline.code}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {airline.name}
              </h4>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {airline.tagline}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Official Legal Documents
            </span>
            <div className="mt-2.5 space-y-2">
              <a
                href={airline.officialCocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm hover:text-indigo-800 dark:bg-slate-900 dark:text-indigo-400"
              >
                <span>Conditions of Carriage</span>
                <span>↗</span>
              </a>
              <a
                href={airline.officialCharterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm hover:text-indigo-800 dark:bg-slate-900 dark:text-indigo-400"
              >
                <span>Passenger Charter / Rights</span>
                <span>↗</span>
              </a>
              <a
                href={airline.officialSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm hover:text-indigo-800 dark:bg-slate-900 dark:text-indigo-400"
              >
                <span>Support & Grievance Portal</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Nodal Officer & Appellate Authority */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nodal Officer */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between">
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  Level 2 Escalation
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {airline.nodalOfficer.turnaround}
                </span>
              </div>
              <h5 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                Nodal Grievance Officer
              </h5>
              <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Email:</strong>{' '}
                  <a href={`mailto:${airline.nodalOfficer.email}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {airline.nodalOfficer.email}
                  </a>
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Phone:</strong> {airline.nodalOfficer.phone}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Address:</strong> {airline.nodalOfficer.address}
                </p>
              </div>
            </div>

            {/* Appellate Authority */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Level 3 Escalation
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {airline.appellateAuthority.turnaround}
                </span>
              </div>
              <h5 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                Appellate Authority
              </h5>
              <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Email:</strong>{' '}
                  <a href={`mailto:${airline.appellateAuthority.email}`} className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                    {airline.appellateAuthority.email}
                  </a>
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Scope:</strong> Direct appeal if Nodal Officer fails to provide satisfactory relief within 10 days.
                </p>
              </div>
            </div>
          </div>

          {/* Level 1 Customer Service */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="font-bold text-slate-800 dark:text-slate-200">Level 1 Customer Care: </span>
            <span className="text-slate-600 dark:text-slate-400">Phone: </span>
            <span className="font-mono text-slate-900 dark:text-white">{airline.customerCare.phone}</span>
            <span className="mx-2 text-slate-400">•</span>
            <span className="text-slate-600 dark:text-slate-400">Email: </span>
            <a href={`mailto:${airline.customerCare.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {airline.customerCare.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
