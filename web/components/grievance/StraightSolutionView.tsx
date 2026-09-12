'use client';

import React from 'react';
import { StatutoryEntitlement, AirlineInfo, GrievanceAnswers } from '@/lib/grievance/types';
import {
  RotateCcw,
  FileText,
  Coins,
  Coffee,
  CreditCard,
  Scale,
  Clock,
  Phone,
  Mail,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface StraightSolutionViewProps {
  entitlement: StatutoryEntitlement;
  airline: AirlineInfo;
  answers: GrievanceAnswers;
  onOpenDraftModal: () => void;
  onReset: () => void;
}

export function StraightSolutionView({
  entitlement,
  airline,
  answers,
  onOpenDraftModal,
  onReset,
}: StraightSolutionViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300">
      {/* Top Claim Summary & Retake Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Assessed Claim:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs">
            <div className="h-5 w-5 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={airline.logoUrl} alt={airline.shortName} className="max-h-full max-w-full object-contain" />
            </div>
            <span>{airline.shortName}</span>
          </span>
          <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-800">
            {answers.flightTimeOption === '<1hr'
              ? '< 1 Hr Flight'
              : answers.flightTimeOption === '1-2hr'
              ? '1–2 Hr Flight'
              : '> 2 Hr Flight'}
          </span>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
          <span>Retake Quiz</span>
        </button>
      </div>

      {/* STRAIGHT SOLUTION HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
                STATUTORY ENTITLEMENT
              </span>
              <span className="text-xs font-bold text-slate-600">
                Under DGCA CAR Rules
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {entitlement.headline}
            </h2>
          </div>

          <button
            onClick={onOpenDraftModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <span>Copy Pre-Filled Legal Notice</span>
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 3 Crisp Entitlement Highlights (No wall of text) */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-white/90 p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-emerald-700" />
              Cash Compensation
            </span>
            <p className="mt-1 text-xs font-bold text-slate-900">
              {entitlement.cashHighlight}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-white/90 p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-indigo-700" />
              Duty of Care
            </span>
            <p className="mt-1 text-xs font-bold text-slate-900">
              {entitlement.careHighlight}
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-white/90 p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-purple-700" />
              100% Refund Right
            </span>
            <p className="mt-1 text-xs font-bold text-slate-900">
              {entitlement.refundHighlight}
            </p>
          </div>
        </div>

        {/* Exact Statutory Clauses & Mandates Quoted Verbatim */}
        <div className="mt-5 pt-4 border-t border-indigo-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
              <span>📜</span> Exact Statutory Provisions Applicable
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              DGCA & Carrier Contract Excerpts
            </span>
          </div>

          <div className="space-y-2.5">
            {entitlement.primaryClauses.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-indigo-100 bg-white/95 p-3.5 shadow-xs transition hover:border-indigo-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-50 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-[10px] font-black text-indigo-700">
                      §{idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-slate-950">
                      {item.name} — <span className="text-indigo-900 font-bold">{item.clause}</span>
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                    title={`Source: ${item.name}`}
                  >
                    <span>Citation Source</span>
                    <span>↗</span>
                  </a>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-mono bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
                  “{item.exactText}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VISUAL STEPS GRAPHIC: WHAT TO DO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-950">
              What You Need To Do (Step-by-Step)
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 font-medium">
              Follow these sequential steps to legally claim your money from {airline.shortName}.
            </p>
          </div>
        </div>

        {/* Vertical Connected Stepper Flow */}
        <div className="space-y-4">
          {entitlement.steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-4">
              {/* Connector line and number circle */}
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm">
                  {step.stepNumber}
                </div>
                {idx < entitlement.steps.length - 1 && (
                  <div className="my-1.5 h-full w-0.5 bg-slate-200" />
                )}
              </div>

              {/* Step Card Content */}
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-800">
                    {step.stage}
                  </span>
                  <span className="rounded-full bg-slate-200/80 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{step.timeframe}</span>
                  </span>
                </div>

                <h4 className="mt-2 text-sm font-extrabold text-slate-950">
                  {step.title}
                </h4>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
                  {step.shortAction}
                </p>

                {/* Exact Statutory Mandate Supporting this Step */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-950 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-indigo-900" />
                      <span>Statutory Mandate ({step.clauseCitation.label})</span>
                    </span>
                    <a
                      href={step.clauseCitation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
                    >
                      Citation Link ↗
                    </a>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-mono bg-slate-50 p-2 rounded border border-slate-200/70">
                    “{step.clauseCitation.exactText || step.clauseCitation.label}”
                  </p>
                </div>

                {/* Contact information badges */}
                {(step.contactInfo?.email || step.contactInfo?.phone || step.contactInfo?.url) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                    {step.contactInfo?.label && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {step.contactInfo.label}:
                      </span>
                    )}
                    {step.contactInfo?.phone && (
                      <a
                        href={`tel:${step.contactInfo.phone}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 hover:text-indigo-700"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{step.contactInfo.phone}</span>
                      </a>
                    )}
                    {step.contactInfo?.email && (
                      <a
                        href={`mailto:${step.contactInfo.email}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 hover:text-indigo-700"
                      >
                        <Mail className="h-3 w-3" />
                        <span>{step.contactInfo.email}</span>
                      </a>
                    )}
                    {step.contactInfo?.url && (
                      <a
                        href={step.contactInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 hover:text-indigo-700"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Portal ↗</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
