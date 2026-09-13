'use client';

import React from 'react';
import { AirlineId, GrievanceCategory } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { PROBLEM_LIST } from '@/lib/grievance/grievance-rules';
import {
  Clock,
  Ban,
  UserX,
  Luggage,
  CreditCard,
  AlertCircle,
  Zap,
  Plane,
  Globe,
  XCircle,
  Coffee,
  Building2,
  Sparkles,
  Loader2,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export function getCategoryIcon(id: GrievanceCategory) {
  switch (id) {
    case 'delay':
      return <Clock className="h-5 w-5 text-amber-600" />;
    case 'cancellation':
      return <Ban className="h-5 w-5 text-rose-600" />;
    case 'denied_boarding':
      return <UserX className="h-5 w-5 text-indigo-600" />;
    case 'baggage':
      return <Luggage className="h-5 w-5 text-amber-700" />;
    case 'refund':
      return <CreditCard className="h-5 w-5 text-emerald-600" />;
    case 'other':
      return <Sparkles className="h-5 w-5 text-purple-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-indigo-600" />;
  }
}

export interface QuestionWizardProps {
  currentQuestion: number; // 1 to 5
  airlineId: AirlineId | null;
  category: GrievanceCategory | null;
  durationOption: string | null;
  flightTimeOption: '<1hr' | '1-2hr' | '>2hr' | null;
  assistanceOption: 'none' | 'refreshments' | 'hotel_alternate' | null;
  // Custom issue state
  customIssueText: string;
  pnr: string;
  flightNumber: string;
  travelDate: string;
  isLoadingAi: boolean;
  onUpdateCustomField: (field: 'customIssueText' | 'pnr' | 'flightNumber' | 'travelDate', val: string) => void;
  onSubmitCustomIssue: () => void;
  // Standard handlers
  onSelectAirline: (id: AirlineId) => void;
  onSelectCategory: (cat: GrievanceCategory) => void;
  onSelectDuration: (dur: string) => void;
  onSelectFlightTime: (time: '<1hr' | '1-2hr' | '>2hr') => void;
  onSelectAssistance: (ast: 'none' | 'refreshments' | 'hotel_alternate') => void;
  onBack: () => void;
}

const COMMON_ISSUE_CHIPS = [
  'Flight rescheduled / preponed arbitrarily without consent',
  'Forced fee for mandatory web check-in seat selection',
  'Wheelchair / special assistance refused or extra charged',
  'Medical emergency cancellation with doctor note refused refund',
  'Tarmac delay exceeding 2 hours with no air conditioning',
  'Excess baggage fee charged despite baggage allowance receipt',
  'Lost personal item inside cabin not investigated by crew',
];

export function QuestionWizard({
  currentQuestion,
  airlineId,
  category,
  durationOption,
  flightTimeOption,
  assistanceOption,
  customIssueText,
  pnr,
  flightNumber,
  travelDate,
  isLoadingAi,
  onUpdateCustomField,
  onSubmitCustomIssue,
  onSelectAirline,
  onSelectCategory,
  onSelectDuration,
  onSelectFlightTime,
  onSelectAssistance,
  onBack,
}: QuestionWizardProps) {
  const airline = airlineId ? AIRLINE_DIRECTORY[airlineId] : null;

  // Dynamic Duration options for Question 3 (standard flow only)
  const getDurationOptions = () => {
    if (category === 'delay') {
      return [
        { id: '<2hr', title: 'Under 2 Hours', hint: 'Tarmac or gate delay' },
        { id: '2-4hr', title: '2 to 4 Hours', hint: 'Mandates free refreshments & drinks' },
        { id: '4-6hr', title: '4 to 6 Hours', hint: 'Mandates free warm meals + refund right' },
        { id: '>6hr', title: 'Over 6 Hours / Overnight', hint: 'Mandatory free hotel stay + cash comp' },
      ];
    }
    if (category === 'cancellation') {
      return [
        { id: '<24hr', title: 'Less than 24 Hours / At Airport', hint: 'Mandatory cash compensation up to ₹10k' },
        { id: '24h-7d', title: '24 Hours to 7 Days Prior', hint: 'Free alternate flight or 100% refund' },
        { id: '>7d', title: 'More than 7 Days in Advance', hint: 'Full 100% refund within 7 days' },
      ];
    }
    if (category === 'baggage') {
      return [
        { id: 'damaged', title: 'Arrived Damaged or Torn', hint: 'Up to ₹20,000 repair or replacement' },
        { id: 'delayed', title: 'Delayed Over 24 Hours', hint: 'Doorstep delivery + emergency allowance' },
        { id: 'lost', title: 'Lost Permanently (> 21 Days)', hint: 'Up to 1,288 SDR (~₹1.4 Lakh)' },
      ];
    }
    if (category === 'denied_boarding') {
      return [
        { id: 'involuntary', title: 'Involuntarily Bumped (Against Will)', hint: '400% of base fare (up to ₹20,000)' },
        { id: 'alternate_long', title: 'Alternate Flight Delayed > 4 Hours', hint: '400% base fare + hotel' },
        { id: 'alternate_quick', title: 'Alternate Flight Within 1 Hour', hint: 'Care provided, zero penalty' },
      ];
    }
    return [
      { id: 'pending_7_30', title: 'Pending 7 to 30 Days', hint: 'Breach of 7-day card refund rule' },
      { id: 'pending_over_30', title: 'Pending Over 30 Days', hint: 'Direct regulatory non-compliance' },
      { id: 'tax_deducted', title: 'Airline Deducted Airport Taxes', hint: 'Illegal deduction under DGCA CAR' },
    ];
  };

  const isOtherFlow = category === 'other';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top Breadcrumb & Progress Bar */}
      <div className="flex items-center justify-between">
        {currentQuestion > 1 || isOtherFlow ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              disabled={isLoadingAi}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            {airline && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs">
                <div className="h-4 w-4 rounded bg-white p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={airline.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <span>{airline.shortName}</span>
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {isOtherFlow ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-purple-700">
                AI Dispute Curation
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                Gemini + Groq
              </span>
            </div>
          ) : (
            <>
              <span className="text-xs font-extrabold text-indigo-700">
                Question {currentQuestion} of 5
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((q) => (
                  <div
                    key={q}
                    className={`h-1.5 w-6 rounded-full transition-all ${
                      q === currentQuestion
                        ? 'bg-indigo-600'
                        : q < currentQuestion
                        ? 'bg-emerald-600'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* QUESTION 1: AIRLINE SELECTION */}
      {currentQuestion === 1 && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Which airline did you fly with?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Select carrier to apply their exact Conditions of Carriage and statutory Nodal contacts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(AIRLINE_DIRECTORY).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectAirline(item.id)}
                className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-2xs p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={item.logoUrl}
                      alt={item.shortName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {item.code}
                  </span>
                </div>
                <span className="mt-3 text-sm font-extrabold text-slate-950">
                  {item.shortName}
                </span>
                <span className="mt-1 text-[10px] font-bold text-slate-500 group-hover:text-indigo-600">
                  Select →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 2: WHAT PROBLEM OCCURRED (MCQ SECTION WITH "OTHER / EXPLAIN YOUR ISSUE") */}
      {currentQuestion === 2 && !isOtherFlow && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              What problem occurred?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Select your grievance with {airline?.shortName}, or choose &ldquo;Other&rdquo; to describe any custom issue.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PROBLEM_LIST.map((problem) => {
              const isOther = problem.id === 'other';
              return (
                <button
                  key={problem.id}
                  onClick={() => onSelectCategory(problem.id)}
                  className={`group flex items-center gap-3.5 rounded-xl border p-4 text-left shadow-xs transition-all ${
                    isOther
                      ? 'border-purple-300 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 hover:border-purple-500 hover:shadow-md sm:col-span-2'
                      : 'border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-colors ${
                      isOther
                        ? 'bg-purple-100/80 border-purple-200 group-hover:bg-purple-200/80'
                        : 'bg-slate-100 border-slate-200/80 group-hover:bg-indigo-50 group-hover:border-indigo-200'
                    }`}
                  >
                    {getCategoryIcon(problem.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-950 truncate">
                        {problem.title}
                      </span>
                      {isOther && (
                        <span className="rounded-full bg-purple-600 px-2 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                          AI Powered
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        isOther ? 'text-purple-700' : 'text-emerald-700'
                      }`}
                    >
                      {problem.badge}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {problem.quickDescription}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold transition-all group-hover:translate-x-0.5 ${
                      isOther
                        ? 'text-purple-700 group-hover:text-purple-900'
                        : 'text-slate-400 group-hover:text-indigo-600'
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DEDICATED OTHER / EXPLAIN YOUR ENTIRE ISSUE SCREEN (SKIPS Q3, Q4, Q5) */}
      {isOtherFlow && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-900 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-700" />
              <span>Full Issue Legal Assessment</span>
            </div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Describe your entire issue with {airline?.shortName}
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium max-w-lg mx-auto">
              Provide complete details. Our AI will analyze DGCA Civil Aviation Requirements, verify airline liability, calculate compensation, and draft your legal notice.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            {/* Quick Inspiration Chips */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Click a topic to auto-fill, or write your own below:</span>
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMMON_ISSUE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const updated = customIssueText
                        ? `${customIssueText}\n• ${chip}`
                        : `• ${chip}: `;
                      onUpdateCustomField('customIssueText', updated);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-purple-400 hover:bg-purple-50/60 hover:text-purple-900 transition text-left"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-900">
                  What happened? (Detailed Explanation) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {customIssueText.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={customIssueText}
                onChange={(e) => onUpdateCustomField('customIssueText', e.target.value)}
                placeholder="Explain what occurred in detail. For example: 'On 12th Oct, my flight was rescheduled 8 hours earlier without any prior notification. When I reached the airport, airline refused rebooking, demanded ₹4,000 date change fee, and declined refund...'"
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
            </div>

            {/* Optional particulars to enrich legal notice */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Optional Travel Particulars (Pre-fills Legal Notice)
              </span>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">PNR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E8XYZ"
                    value={pnr}
                    onChange={(e) => onUpdateCustomField('pnr', e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs uppercase text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Flight Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E 402"
                    value={flightNumber}
                    onChange={(e) => onUpdateCustomField('flightNumber', e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs uppercase text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => onUpdateCustomField('travelDate', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons & AI Trigger */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Analyzed under DGCA CAR & Consumer Protection Act 2019</span>
              </div>

              <button
                type="button"
                disabled={isLoadingAi || !customIssueText.trim()}
                onClick={onSubmitCustomIssue}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-black text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Curating Statutory Legal Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Curate Statutory Solution with AI →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION 3: DURATION EXTRA (Standard flow only) */}
      {currentQuestion === 3 && !isOtherFlow && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              {category === 'delay'
                ? 'How long was your flight delayed?'
                : category === 'cancellation'
                ? 'When did the airline notify you?'
                : category === 'baggage'
                ? 'What is the status of your luggage?'
                : category === 'denied_boarding'
                ? 'What happened at the boarding gate?'
                : 'How long has the refund been delayed?'}
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              DGCA statutory entitlement depends strictly on this timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {getDurationOptions().map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectDuration(opt.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <div>
                  <div className="text-sm font-extrabold text-slate-950">
                    {opt.title}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {opt.hint}
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700">
                  Select →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 4: SCHEDULED FLIGHT DURATION (Standard flow only) */}
      {currentQuestion === 4 && !isOtherFlow && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              What was your scheduled flight duration?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Under DGCA CAR Section 3, cash compensation brackets are determined by flight block time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                id: '<1hr' as const,
                icon: <Zap className="h-5 w-5 text-amber-500" />,
                title: 'Under 1 Hour',
                desc: 'Short domestic routes (e.g., Mumbai to Pune / Delhi to Jaipur)',
                comp: '₹5,000 Statutory Tier',
              },
              {
                id: '1-2hr' as const,
                icon: <Plane className="h-5 w-5 text-indigo-500" />,
                title: '1 to 2 Hours',
                desc: 'Standard domestic routes (e.g., Delhi to Mumbai / Bangalore to Hyderabad)',
                comp: '₹7,500 Statutory Tier',
              },
              {
                id: '>2hr' as const,
                icon: <Globe className="h-5 w-5 text-blue-500" />,
                title: 'Over 2 Hours',
                desc: 'Long domestic / Cross-country (e.g., Delhi to Bangalore / Kolkata to Mumbai)',
                comp: '₹10,000 Statutory Tier',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectFlightTime(opt.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950">
                      {opt.title}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-black text-emerald-900">
                  {opt.comp}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 5: ASSISTANCE PROVIDED (Standard flow only) */}
      {currentQuestion === 5 && !isOtherFlow && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Did the airline provide food, hotel, or alternate flight?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Airlines that fail to provide mandated duty-of-care face statutory penalties.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                id: 'none' as const,
                icon: <XCircle className="h-5 w-5 text-rose-600" />,
                title: 'No assistance provided (Left stranded)',
                desc: 'Airline offered no meals, hotel stay, or acceptable alternate flight.',
              },
              {
                id: 'refreshments' as const,
                icon: <Coffee className="h-5 w-5 text-amber-600" />,
                title: 'Light snacks or beverages only',
                desc: 'Provided small water bottle or biscuit pack, but no full meal or stay.',
              },
              {
                id: 'hotel_alternate' as const,
                icon: <Building2 className="h-5 w-5 text-indigo-600" />,
                title: 'Hotel or alternate flight offered',
                desc: 'Airline arranged accommodation or rebooked onto another flight.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectAssistance(opt.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950">
                      {opt.title}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700">
                  See Solution →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
