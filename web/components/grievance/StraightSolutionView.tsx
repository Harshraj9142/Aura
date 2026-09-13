'use client';

import React from 'react';
import { StatutoryEntitlement, AirlineInfo, GrievanceAnswers } from '@/lib/grievance/types';
import { AUTHORITY_TWITTER_HANDLES } from '@/lib/grievance/airline-contacts';
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
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface StraightSolutionViewProps {
  entitlement: StatutoryEntitlement;
  airline: AirlineInfo;
  answers: GrievanceAnswers;
  onOpenDraftModal: () => void;
  onOpenTwitterModal: () => void;
  onReset: () => void;
}

export function StraightSolutionView({
  entitlement,
  airline,
  answers,
  onOpenDraftModal,
  onOpenTwitterModal,
  onReset,
}: StraightSolutionViewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-300">
      {/* Top Claim Summary & Retake Button Bar (Borderless Glass Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/40 backdrop-blur-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Assessed Claim:
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1 text-xs font-bold text-slate-950 shadow-xs">
            <div className="h-5 w-5 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
              <img src={airline.logoUrl} alt={airline.shortName} className="max-h-full max-w-full object-contain" />
            </div>
            <span>{airline.name}</span>
          </span>
          {answers.category === 'other' ? (
            <span className="rounded-full bg-slate-950 text-white px-3.5 py-1 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Custom Issue Redressal</span>
            </span>
          ) : answers.flightTimeOption ? (
            <span className="rounded-full bg-slate-100 border border-slate-300/80 px-3 py-1 text-xs font-bold text-slate-900">
              {answers.flightTimeOption === '<1hr'
                ? '< 1 Hr Flight'
                : answers.flightTimeOption === '1-2hr'
                ? '1–2 Hr Flight'
                : '> 2 Hr Flight'}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 border border-slate-300/80 px-3 py-1 text-xs font-semibold text-slate-900 capitalize">
              {answers.category.replace('_', ' ')}
            </span>
          )}
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-white/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-950 hover:text-white hover:border-slate-950 transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Main Solution Glass Container (No heavy white rectangle box!) */}
      <div className="rounded-[32px] border border-white/90 bg-white/60 backdrop-blur-2xl p-7 sm:p-10 shadow-xl space-y-8">
        
        {/* Header & Main Headline Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-950/10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                <Scale className="h-3.5 w-3.5" />
                Legally Mandated
              </span>
              {entitlement.isAiCurated ? (
                <span className="rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Custom Legal Assessment</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-600 tracking-wide">
                  Under DGCA CAR Regulations
                </span>
              )}
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 leading-[1.1]">
              {entitlement.headline}
            </h2>

            {answers.customIssueText && (
              <div className="mt-3 pl-4 border-l-3 border-slate-950 py-1 text-sm sm:text-base text-slate-700 italic font-medium">
                <span className="font-bold text-slate-950 not-italic">Dispute Summary: </span>
                &ldquo;{answers.customIssueText}&rdquo;
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 lg:pt-1">
            <button
              onClick={onOpenTwitterModal}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-black px-5 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Escalate on X</span>
            </button>

            <button
              onClick={onOpenDraftModal}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 px-5 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <span>Legal Notice</span>
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Public Escalation via X (Dark Contrast Banner) */}
        <div className="rounded-2xl bg-slate-950 text-white p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                Public Escalation via {AUTHORITY_TWITTER_HANDLES.advocacy}
              </h4>
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                Tag <span className="font-bold text-white">{airline.twitterHandle || airline.name}</span>, <span className="font-mono text-slate-200 font-bold">@DGCAIndia</span> & <span className="font-mono text-slate-200 font-bold">@MoCA_GoI</span> publicly on X to trigger rapid response.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTwitterModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white text-slate-950 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>Preview Tweet</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-950" />
          </button>
        </div>

        {/* 3 Entitlement Highlights (Spacious 3-Column Layout with Vertical Accent Bars, NO White Boxes!) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="border-l-3 border-emerald-600 pl-4 py-1 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-700" />
              Cash Compensation
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-950 leading-snug">
              {entitlement.cashHighlight}
            </p>
          </div>

          <div className="border-l-3 border-amber-600 pl-4 py-1 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-amber-700" />
              Duty of Care
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-950 leading-snug">
              {entitlement.careHighlight}
            </p>
          </div>

          <div className="border-l-3 border-blue-600 pl-4 py-1 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-blue-700" />
              100% Refund Right
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-950 leading-snug">
              {entitlement.refundHighlight}
            </p>
          </div>
        </div>

        {/* Exact Statutory Provisions Quoted Verbatim */}
        <div className="pt-6 border-t border-slate-950/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-950 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-950" />
              Exact Statutory Provisions Applicable
            </span>
            <span className="text-xs font-bold text-slate-500">
              DGCA & Carrier Contract Excerpts
            </span>
          </div>

          <div className="space-y-6">
            {entitlement.primaryClauses.map((item, idx) => (
              <div key={idx} className="border-l-4 border-slate-950 pl-5 py-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white">
                      §{idx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-950">
                      {item.name} — <span className="text-slate-800 font-bold">{item.clause}</span>
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-black hover:underline"
                    title={`Source: ${item.name}`}
                  >
                    <span>Citation Source</span>
                    <span>↗</span>
                  </a>
                </div>

                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans italic bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  “{item.exactText}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VISUAL STEPS GRAPHIC: WHAT TO DO (Clean Glass Container) */}
      <div className="rounded-[32px] border border-white/90 bg-white/60 backdrop-blur-2xl p-7 sm:p-10 shadow-xl space-y-8">
        <div>
          <h3 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            What You Need To Do (Step-by-Step)
          </h3>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Follow these sequential steps to legally claim your money from {airline.shortName}.
          </p>
        </div>

        {/* Vertical Connected Stepper Flow */}
        <div className="space-y-6">
          {entitlement.steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-5 sm:gap-6">
              {/* Connector line and number circle */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-bold text-white shadow-md">
                  {step.stepNumber}
                </div>
                {idx < entitlement.steps.length - 1 && (
                  <div className="my-2 h-full w-0.5 bg-slate-300/80" />
                )}
              </div>

              {/* Step Content (Clean, Open, Borderless Spacing) */}
              <div className="flex-1 space-y-3 pt-1 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-950/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-950">
                    {step.stage}
                  </span>
                  <span className="rounded-full bg-slate-100 border border-slate-300/80 px-3 py-0.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-700" />
                    <span>{step.timeframe}</span>
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-slate-950">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {step.shortAction}
                </p>

                {/* Statutory Mandate Citation */}
                <div className="border-l-3 border-slate-800 pl-4 py-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-950 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-slate-900" />
                      <span>Statutory Mandate ({step.clauseCitation.label})</span>
                    </span>
                    <a
                      href={step.clauseCitation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-900 hover:text-black hover:underline shrink-0"
                    >
                      Citation Link ↗
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans italic">
                    “{step.clauseCitation.exactText || step.clauseCitation.label}”
                  </p>
                </div>

                {/* Contact information badges */}
                {(step.contactInfo?.email || step.contactInfo?.phone || step.contactInfo?.url) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {step.contactInfo?.label && (
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {step.contactInfo.label}:
                      </span>
                    )}
                    {step.contactInfo?.phone && (
                      <a
                        href={`tel:${step.contactInfo.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-950 hover:text-white hover:border-slate-950 transition"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{step.contactInfo.phone}</span>
                      </a>
                    )}
                    {step.contactInfo?.email && (
                      <a
                        href={`mailto:${step.contactInfo.email}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-950 hover:text-white hover:border-slate-950 transition"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{step.contactInfo.email}</span>
                      </a>
                    )}
                    {step.contactInfo?.url && (
                      <a
                        href={step.contactInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-950 hover:text-white hover:border-slate-950 transition"
                      >
                        <Globe className="h-3.5 w-3.5" />
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
