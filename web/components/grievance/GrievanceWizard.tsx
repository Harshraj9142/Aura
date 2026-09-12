'use client';

import React, { useState } from 'react';
import { AirlineId, GrievanceCategory, WizardAnswers } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { GRIEVANCE_CATEGORIES, getCategoryQuestions } from '@/lib/grievance/grievance-rules';

interface GrievanceWizardProps {
  onComplete: (answers: WizardAnswers) => void;
}

export function GrievanceWizard({ onComplete }: GrievanceWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<WizardAnswers>({
    airlineId: 'indigo',
    category: 'cancellation',
  });

  const handleSelectAirline = (airlineId: AirlineId) => {
    setAnswers((prev) => ({ ...prev, airlineId }));
    setStep(2);
  };

  const handleSelectCategory = (category: GrievanceCategory) => {
    setAnswers((prev) => ({ ...prev, category }));
    setStep(3);
  };

  const questions = answers.category ? getCategoryQuestions(answers.category) : [];

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFinishWizard = () => {
    onComplete(answers);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Progress Bar & Steps Indicator */}
      <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span className={step >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            1. Select Airline
          </span>
          <span>→</span>
          <span className={step >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            2. Problem Category
          </span>
          <span>→</span>
          <span className={step >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            3. Situation Diagnostics
          </span>
          <span>→</span>
          <span className={step >= 4 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            4. Passenger Details (Optional)
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Select Airline */}
      {step === 1 && (
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Which Airline Was Involved?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select your airline to load its specific Conditions of Carriage, Passenger Charter, and verified Nodal Officer contacts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(AIRLINE_DIRECTORY).map((airline) => {
              const isSelected = answers.airlineId === airline.id;
              return (
                <button
                  key={airline.id}
                  onClick={() => handleSelectAirline(airline.id)}
                  className={`group flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-bold text-white ${airline.logoBg}`}>
                      {airline.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:text-slate-500">
                      Select →
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    {airline.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {airline.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Select Issue Category */}
      {step === 2 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              ← Back to Airlines
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Selected: {AIRLINE_DIRECTORY[answers.airlineId || 'indigo'].name}
            </span>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              What Problem Are You Facing?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select the option matching your situation to trigger precise legal entitlement rules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GRIEVANCE_CATEGORIES.map((cat) => {
              const isSelected = answers.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Context Questions (MCQ Diagnostics) */}
      {step === 3 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              ← Back to Categories
            </button>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {AIRLINE_DIRECTORY[answers.airlineId || 'indigo'].name}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {GRIEVANCE_CATEGORIES.find((c) => c.id === answers.category)?.title}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Answer A Few Specific Questions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Airlines are governed by exact statutory criteria. Select the choices that describe what happened.
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {qIndex + 1}. {q.title}
                </h4>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  {q.subtitle}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isPicked = (answers as any)[q.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleOptionSelect(q.id, opt.id)}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                          isPicked
                            ? 'border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-500 dark:border-indigo-500 dark:bg-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isPicked}
                          onChange={() => handleOptionSelect(q.id, opt.id)}
                          className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setStep(4)}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Continue to Passenger Details →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Passenger / PNR Details (Optional for legal draft) */}
      {step === 4 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              ← Back to Diagnostics
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Flight & Travel Details (Optional)
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Entering your PNR and flight number lets us pre-generate a formal legal notice letter ready to send to the airline Nodal Officer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Passenger Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={answers.passengerName || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, passengerName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                PNR / Booking Reference
              </label>
              <input
                type="text"
                placeholder="e.g. W9Q7KL"
                value={answers.pnr || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, pnr: e.target.value.toUpperCase() }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Flight Number
              </label>
              <input
                type="text"
                placeholder="e.g. 6E 204 or AI 803"
                value={answers.flightNumber || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, flightNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date of Travel
              </label>
              <input
                type="date"
                value={answers.travelDate || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, travelDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Route (Origin → Destination)
              </label>
              <input
                type="text"
                placeholder="e.g. DEL → BOM"
                value={answers.origin || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, origin: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ticket Fare Paid (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 6500"
                value={answers.ticketFare || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, ticketFare: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              onClick={handleFinishWizard}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              Skip flight details & calculate rights →
            </button>
            <button
              onClick={handleFinishWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <span>View Entitlements & Solution</span>
              <span>⚡</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
