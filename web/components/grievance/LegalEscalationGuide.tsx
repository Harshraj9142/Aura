'use client';

import React from 'react';
import { AirlineId } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY, EXTERNAL_AUTHORITIES } from '@/lib/grievance/airline-contacts';

interface LegalEscalationGuideProps {
  airlineId: AirlineId;
}

export function LegalEscalationGuide({ airlineId }: LegalEscalationGuideProps) {
  const airline = AIRLINE_DIRECTORY[airlineId] || AIRLINE_DIRECTORY.indigo;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            4-Tier Legal Escalation Roadmap
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          How to legally handle your dispute step-by-step to recover the compensation and damages you deserve under Indian law.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tier 1: Customer Care & Station Manager */}
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              1
            </div>
            <div className="h-full w-0.5 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tier 1: Airport Station Manager & Customer Care
              </h4>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Turnaround: 48 Hours
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Always start by lodging a written complaint to obtain an official Ticket / Reference Number.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Customer Helpline:</span>{' '}
                <span className="text-slate-900 dark:text-white font-mono">{airline.customerCare.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Support Email:</span>{' '}
                <a href={`mailto:${airline.customerCare.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {airline.customerCare.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Airline Nodal Officer */}
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              2
            </div>
            <div className="h-full w-0.5 bg-indigo-200 dark:bg-indigo-900" />
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tier 2: Airline Nodal Grievance Officer
              </h4>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Statutory Limit: 10 Days
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Under DGCA CAR, every scheduled airline must appoint a Nodal Officer to resolve escalated grievances within 10 days.
            </p>
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Designation:</span>{' '}
                  <span className="text-slate-900 dark:text-white">{airline.nodalOfficer.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Official Email:</span>{' '}
                  <a href={`mailto:${airline.nodalOfficer.email}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {airline.nodalOfficer.email}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phone:</span>{' '}
                  <span className="font-mono text-slate-900 dark:text-white">{airline.nodalOfficer.phone}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Office Address:</span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">{airline.nodalOfficer.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3: Appellate Authority */}
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              3
            </div>
            <div className="h-full w-0.5 bg-purple-200 dark:bg-purple-900" />
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tier 3: Internal Appellate Authority
              </h4>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Final Internal Appeal: 30 Days
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              If the Nodal Officer does not respond within 10 days or rejects your valid claim, file an appeal to the Appellate Authority.
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Authority:</span>{' '}
                  <span className="text-slate-900 dark:text-white">{airline.appellateAuthority.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Appeal Email:</span>{' '}
                  <a href={`mailto:${airline.appellateAuthority.email}`} className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                    {airline.appellateAuthority.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 4: External Statutory Redressal */}
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              4
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tier 4: Government & Legal Action (AirSewa & Consumer Court)
              </h4>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Binding Statutory Remedy
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              If the airline refuses compliance, initiate external legal action:
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* AirSewa */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">1. AirSewa (MoCA)</span>
                  <a href={EXTERNAL_AUTHORITIES.airSewa.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400">↗</a>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Direct government escalation monitored by DGCA & Ministry of Civil Aviation officers.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  Toll-Free: {EXTERNAL_AUTHORITIES.airSewa.tollFree}
                </div>
              </div>

              {/* National Consumer Helpline */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">2. Consumer Helpline</span>
                  <a href={EXTERNAL_AUTHORITIES.nch.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400">↗</a>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Dept of Consumer Affairs pre-litigation mediation for unfair trade practices.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  Call: {EXTERNAL_AUTHORITIES.nch.tollFree}
                </div>
              </div>

              {/* e-Daakhil / Consumer Forum */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">3. Consumer Court (e-Daakhil)</span>
                  <a href={EXTERNAL_AUTHORITIES.edaakhil.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400">↗</a>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  File a legal claim online under Consumer Protection Act 2019 for deficiency of service + mental harassment without a lawyer.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Zero Lawyer Required
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
