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
      return <Clock className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" />;
    case 'cancellation':
      return <Ban className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" />;
    case 'denied_boarding':
      return <UserX className="h-6 w-6 text-slate-900 group-hover:text-white transition-colors" />;
    case 'baggage':
      return <Luggage className="h-6 w-6 text-amber-700 group-hover:text-white transition-colors" />;
    case 'refund':
      return <CreditCard className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />;
    case 'other':
      return <Sparkles className="h-6 w-6 text-slate-900 group-hover:text-white transition-colors" />;
    default:
      return <AlertCircle className="h-6 w-6 text-slate-900 group-hover:text-white transition-colors" />;
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
    <div className="w-full space-y-8">
      {/* Top Header Step Pill Bar */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {currentQuestion > 1 || isOtherFlow ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              disabled={isLoadingAi}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 shadow-xs hover:bg-white hover:border-slate-950 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>← Back</span>
            </button>
            {airline && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 shadow-xs">
                <div className="h-5 w-5 rounded bg-white p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={airline.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <span>{airline.shortName}</span>
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#08080D] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md">
          {isOtherFlow ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Legal Assessment</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Step {currentQuestion} of 5</span>
            </>
          )}
        </div>
      </div>

      {/* QUESTION 1: AIRLINE SELECTION */}
      {currentQuestion === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              Which airline did you <span className="font-serif italic font-normal text-slate-950">fly</span> with?
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Select carrier to apply their exact Conditions of Carriage and statutory Nodal contacts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {Object.values(AIRLINE_DIRECTORY).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectAirline(item.id)}
                className="group relative flex flex-col items-start justify-between rounded-[28px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 hover:border-slate-950 hover:-translate-y-1.5 cursor-pointer"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-2 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={item.logoUrl}
                      alt={item.shortName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-200">
                    {item.code}
                  </span>
                </div>

                <div className="mt-6 w-full">
                  <span className="text-lg sm:text-xl font-heading font-bold text-slate-950 tracking-tight block">
                    {item.shortName}
                  </span>
                  <span className="mt-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-950 flex items-center gap-1 transition-colors">
                    Select Carrier →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 2: WHAT PROBLEM OCCURRED */}
      {currentQuestion === 2 && !isOtherFlow && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              What <span className="font-serif italic font-normal text-slate-950">problem</span> occurred?
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Select your grievance with {airline?.shortName}, or choose Custom Issue to describe any specific incident.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {PROBLEM_LIST.map((problem) => {
              const isOther = problem.id === 'other';
              return (
                <button
                  key={problem.id}
                  onClick={() => onSelectCategory(problem.id)}
                  className="group relative flex items-center gap-5 rounded-[28px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 hover:border-slate-950 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-100/90 shadow-xs transition-colors group-hover:bg-slate-950 group-hover:border-slate-950">
                    {getCategoryIcon(problem.id)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-heading font-bold text-slate-950 tracking-tight truncate">
                        {problem.title}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {problem.badge}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {problem.quickDescription}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-400 group-hover:text-slate-950 transition-colors group-hover:translate-x-1">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DEDICATED OTHER / EXPLAIN YOUR ENTIRE ISSUE SCREEN */}
      {isOtherFlow && (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              Describe your <span className="font-serif italic font-normal text-slate-950">incident</span> in detail
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Provide complete details. Our engine will analyze DGCA Civil Aviation Requirements, verify airline liability, calculate compensation, and draft your legal notice.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-6">
            {/* Quick Inspiration Chips */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-4 w-4" />
                <span>Click a topic to auto-fill, or write your own below:</span>
              </label>
              <div className="flex flex-wrap gap-2">
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
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-950 hover:bg-slate-100 hover:text-slate-950 transition text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-950">
                  What happened? (Detailed Explanation) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-slate-400">
                  {customIssueText.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={customIssueText}
                onChange={(e) => onUpdateCustomField('customIssueText', e.target.value)}
                placeholder="Explain what occurred in detail. For example: 'On 12th Oct, my flight was rescheduled 8 hours earlier without any prior notification. When I reached the airport, airline refused rebooking, demanded ₹4,000 date change fee, and declined refund...'"
                className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-xs sm:text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:outline-none"
              />
            </div>

            {/* Optional particulars */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Optional Travel Particulars (Pre-fills Legal Notice)
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">PNR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E8XYZ"
                    value={pnr}
                    onChange={(e) => onUpdateCustomField('pnr', e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Flight Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E 402"
                    value={flightNumber}
                    onChange={(e) => onUpdateCustomField('flightNumber', e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => onUpdateCustomField('travelDate', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons & AI Trigger */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Analyzed under DGCA CAR & Consumer Protection Act 2019</span>
              </div>

              <button
                type="button"
                disabled={isLoadingAi || !customIssueText.trim()}
                onClick={onSubmitCustomIssue}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#08080D] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Curating Statutory Legal Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Statutory Rights & Solution →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION 3: DURATION EXTRA */}
      {currentQuestion === 3 && !isOtherFlow && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              {category === 'delay'
                ? <>How long was your flight <span className="font-serif italic font-normal text-slate-950">delayed</span>?</>
                : category === 'cancellation'
                ? <>When did the airline <span className="font-serif italic font-normal text-slate-950">notify</span> you?</>
                : category === 'baggage'
                ? <>What is the status of your <span className="font-serif italic font-normal text-slate-950">luggage</span>?</>
                : category === 'denied_boarding'
                ? <>What happened at the <span className="font-serif italic font-normal text-slate-950">boarding gate</span>?</>
                : <>How long has the refund been <span className="font-serif italic font-normal text-slate-950">delayed</span>?</>}
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              DGCA statutory entitlement depends strictly on this timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {getDurationOptions().map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectDuration(opt.id)}
                className="flex items-center justify-between rounded-[24px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 hover:border-slate-950 hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="text-base sm:text-lg font-heading font-bold text-slate-950 tracking-tight">
                    {opt.title}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    {opt.hint}
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-950">
                  Select →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 4: SCHEDULED FLIGHT DURATION */}
      {currentQuestion === 4 && !isOtherFlow && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              What was your scheduled <span className="font-serif italic font-normal text-slate-950">flight</span> duration?
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Under DGCA CAR Section 3, cash compensation brackets are determined by flight block time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {[
              {
                id: '<1hr' as const,
                icon: <Zap className="h-6 w-6 text-amber-500" />,
                title: 'Under 1 Hour',
                desc: 'Short domestic routes (e.g., Mumbai to Pune / Delhi to Jaipur)',
                comp: '₹5,000 Statutory Tier',
              },
              {
                id: '1-2hr' as const,
                icon: <Plane className="h-6 w-6 text-slate-900" />,
                title: '1 to 2 Hours',
                desc: 'Standard domestic routes (e.g., Delhi to Mumbai / Bangalore to Hyderabad)',
                comp: '₹7,500 Statutory Tier',
              },
              {
                id: '>2hr' as const,
                icon: <Globe className="h-6 w-6 text-slate-900" />,
                title: 'Over 2 Hours',
                desc: 'Long domestic / Cross-country (e.g., Delhi to Bangalore / Kolkata to Mumbai)',
                comp: '₹10,000 Statutory Tier',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectFlightTime(opt.id)}
                className="flex items-center justify-between rounded-[24px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 hover:border-slate-950 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 shadow-xs">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-heading font-bold text-slate-950 tracking-tight">
                      {opt.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-900">
                  {opt.comp}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 5: ASSISTANCE PROVIDED */}
      {currentQuestion === 5 && !isOtherFlow && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              Did the airline provide <span className="font-serif italic font-normal text-slate-950">care</span> or assistance?
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Airlines failing to provide mandated meals or accommodation face strict statutory penalties.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {[
              {
                id: 'none' as const,
                icon: <XCircle className="h-6 w-6 text-rose-600" />,
                title: 'No assistance provided (Left stranded)',
                desc: 'Airline offered no meals, hotel stay, or acceptable alternate flight.',
              },
              {
                id: 'refreshments' as const,
                icon: <Coffee className="h-6 w-6 text-amber-600" />,
                title: 'Light snacks or beverages only',
                desc: 'Provided small water bottle or biscuit pack, but no full meal or stay.',
              },
              {
                id: 'hotel_alternate' as const,
                icon: <Building2 className="h-6 w-6 text-slate-900" />,
                title: 'Hotel or alternate flight offered',
                desc: 'Airline arranged accommodation or rebooked onto another flight.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectAssistance(opt.id)}
                className="flex items-center justify-between rounded-[24px] border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 hover:border-slate-950 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 shadow-xs">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-heading font-bold text-slate-950 tracking-tight">
                      {opt.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-950">
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
