'use client';

import React from 'react';
import { AirlineId, GrievanceCategory } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { PROBLEM_LIST } from '@/lib/grievance/grievance-rules';

export interface QuestionWizardProps {
  currentQuestion: number; // 1 to 5
  airlineId: AirlineId | null;
  category: GrievanceCategory | null;
  durationOption: string | null;
  flightTimeOption: '<1hr' | '1-2hr' | '>2hr' | null;
  assistanceOption: 'none' | 'refreshments' | 'hotel_alternate' | null;
  onSelectAirline: (id: AirlineId) => void;
  onSelectCategory: (cat: GrievanceCategory) => void;
  onSelectDuration: (dur: string) => void;
  onSelectFlightTime: (time: '<1hr' | '1-2hr' | '>2hr') => void;
  onSelectAssistance: (ast: 'none' | 'refreshments' | 'hotel_alternate') => void;
  onBack: () => void;
}

export function QuestionWizard({
  currentQuestion,
  airlineId,
  category,
  durationOption,
  flightTimeOption,
  assistanceOption,
  onSelectAirline,
  onSelectCategory,
  onSelectDuration,
  onSelectFlightTime,
  onSelectAssistance,
  onBack,
}: QuestionWizardProps) {
  const airline = airlineId ? AIRLINE_DIRECTORY[airlineId] : null;

  // Helper for dynamic Duration options in Question 3
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
    // refund
    return [
      { id: 'pending_7_30', title: 'Pending 7 to 30 Days', hint: 'Breach of 7-day card refund rule' },
      { id: 'pending_over_30', title: 'Pending Over 30 Days', hint: 'Direct regulatory non-compliance' },
      { id: 'tax_deducted', title: 'Airline Deducted Airport Taxes', hint: 'Illegal deduction under DGCA CAR' },
    ];
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top Breadcrumb & Progress Bar */}
      <div className="flex items-center justify-between">
        {currentQuestion > 1 ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* QUESTION 1: AIRLINE */}
      {currentQuestion === 1 && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Which airline did you fly with?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Select carrier to apply their exact Conditions of Carriage and Nodal contacts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(AIRLINE_DIRECTORY).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectAirline(item.id)}
                className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <span
                  className={`inline-flex h-6 px-2 min-w-9 w-auto items-center justify-center rounded text-[10px] font-black text-white ${item.logoBg}`}
                >
                  {item.code}
                </span>
                <span className="mt-2.5 text-sm font-extrabold text-slate-950">
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

      {/* QUESTION 2: WHAT HAPPENED */}
      {currentQuestion === 2 && (
        <div className="space-y-5 text-center animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              What problem occurred?
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Select what went wrong with your flight with {airline?.shortName}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PROBLEM_LIST.map((problem) => (
              <button
                key={problem.id}
                onClick={() => onSelectCategory(problem.id)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <span className="text-2xl">{problem.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-950">
                    {problem.title}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    {problem.badge}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION 3: DURATION EXTRA */}
      {currentQuestion === 3 && (
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

      {/* QUESTION 4: SCHEDULED FLIGHT DURATION (BLOCK TIME) */}
      {currentQuestion === 4 && (
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
                icon: '⚡',
                title: 'Under 1 Hour',
                desc: 'Short domestic routes (e.g., Mumbai to Pune / Delhi to Jaipur)',
                comp: '₹5,000 Statutory Tier',
              },
              {
                id: '1-2hr' as const,
                icon: '✈️',
                title: '1 to 2 Hours',
                desc: 'Standard domestic routes (e.g., Delhi to Mumbai / Bangalore to Hyderabad)',
                comp: '₹7,500 Statutory Tier',
              },
              {
                id: '>2hr' as const,
                icon: '🌐',
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
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
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

      {/* QUESTION 5: ASSISTANCE PROVIDED */}
      {currentQuestion === 5 && (
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
                icon: '❌',
                title: 'No assistance provided (Left stranded)',
                desc: 'Airline offered no meals, hotel stay, or acceptable alternate flight.',
              },
              {
                id: 'refreshments' as const,
                icon: '🥪',
                title: 'Light snacks or beverages only',
                desc: 'Provided small water bottle or biscuit pack, but no full meal or stay.',
              },
              {
                id: 'hotel_alternate' as const,
                icon: '🏨',
                title: 'Hotel or alternate flight offered',
                desc: 'Airline arranged accommodation or rebooked onto another flight.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectAssistance(opt.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-indigo-500 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
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
