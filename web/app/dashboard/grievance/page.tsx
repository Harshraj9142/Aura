'use client';

import React, { useState } from 'react';
import { AirlineId, GrievanceCategory, GrievanceAnswers } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { getStraightSolution } from '@/lib/grievance/grievance-rules';
import { QuestionWizard } from '@/components/grievance/QuestionWizard';
import { StraightSolutionView } from '@/components/grievance/StraightSolutionView';
import { ComplaintDraftModal } from '@/components/grievance/ComplaintDraftModal';

export default function GrievanceDashboardPage() {
  // Questions 1 to 5, or 6 for Solution
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [airlineId, setAirlineId] = useState<AirlineId | null>(null);
  const [category, setCategory] = useState<GrievanceCategory | null>(null);
  const [durationOption, setDurationOption] = useState<string | null>(null);
  const [flightTimeOption, setFlightTimeOption] = useState<'<1hr' | '1-2hr' | '>2hr' | null>(null);
  const [assistanceOption, setAssistanceOption] = useState<'none' | 'refreshments' | 'hotel_alternate' | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState<boolean>(false);

  // Handlers for each question
  const handleSelectAirline = (id: AirlineId) => {
    setAirlineId(id);
    setCurrentQuestion(2);
  };

  const handleSelectCategory = (cat: GrievanceCategory) => {
    setCategory(cat);
    setCurrentQuestion(3);
  };

  const handleSelectDuration = (dur: string) => {
    setDurationOption(dur);
    setCurrentQuestion(4);
  };

  const handleSelectFlightTime = (time: '<1hr' | '1-2hr' | '>2hr') => {
    setFlightTimeOption(time);
    setCurrentQuestion(5);
  };

  const handleSelectAssistance = (ast: 'none' | 'refreshments' | 'hotel_alternate') => {
    setAssistanceOption(ast);
    setCurrentQuestion(6); // 6 is the Straight Solution!
  };

  const handleBack = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(1);
    setAirlineId(null);
    setCategory(null);
    setDurationOption(null);
    setFlightTimeOption(null);
    setAssistanceOption(null);
  };

  const isSolutionReady =
    currentQuestion === 6 &&
    airlineId &&
    category &&
    durationOption &&
    flightTimeOption &&
    assistanceOption;

  const answers: GrievanceAnswers | null = isSolutionReady
    ? {
        airlineId,
        category,
        durationOption,
        flightTimeOption,
        assistanceOption,
      }
    : null;

  const entitlement = answers ? getStraightSolution(answers) : null;
  const activeAirline = airlineId ? AIRLINE_DIRECTORY[airlineId] : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white shadow-sm">
              ⚖️
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Customer Grievance & Passenger Rights
            </h1>
            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
              DGCA Protected
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            Answer 5 quick questions to get an exact statutory solution and step-by-step enforcement plan.
          </p>
        </div>

        {currentQuestion < 6 && (
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-600">
              Step {currentQuestion} of 5
            </span>
          </div>
        )}
      </div>

      {/* 1 TO 5: ONLY ONE QUESTION IS SHOWN AT A TIME */}
      {currentQuestion <= 5 && (
        <QuestionWizard
          currentQuestion={currentQuestion}
          airlineId={airlineId}
          category={category}
          durationOption={durationOption}
          flightTimeOption={flightTimeOption}
          assistanceOption={assistanceOption}
          onSelectAirline={handleSelectAirline}
          onSelectCategory={handleSelectCategory}
          onSelectDuration={handleSelectDuration}
          onSelectFlightTime={handleSelectFlightTime}
          onSelectAssistance={handleSelectAssistance}
          onBack={handleBack}
        />
      )}

      {/* 6: STRAIGHT SOLUTION (NO WALLS OF TEXT, CLEAR STEPS GRAPHIC + CLAUSE LINKS) */}
      {currentQuestion === 6 && entitlement && activeAirline && answers && (
        <>
          <StraightSolutionView
            entitlement={entitlement}
            airline={activeAirline}
            answers={answers}
            onOpenDraftModal={() => setIsDraftModalOpen(true)}
            onReset={handleReset}
          />

          <ComplaintDraftModal
            isOpen={isDraftModalOpen}
            onClose={() => setIsDraftModalOpen(false)}
            airlineId={activeAirline.id}
            category={answers.category}
          />
        </>
      )}
    </div>
  );
}
