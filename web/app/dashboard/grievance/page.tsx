'use client';

import React, { useState } from 'react';
import { AirlineId, GrievanceCategory, GrievanceAnswers, StatutoryEntitlement } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { getStraightSolution } from '@/lib/grievance/grievance-rules';
import { QuestionWizard } from '@/components/grievance/QuestionWizard';
import { StraightSolutionView } from '@/components/grievance/StraightSolutionView';
import { ComplaintDraftModal } from '@/components/grievance/ComplaintDraftModal';
import { Scale } from 'lucide-react';

export default function GrievanceDashboardPage() {
  // Questions 1 to 5, or 6 for Solution
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [airlineId, setAirlineId] = useState<AirlineId | null>(null);
  const [category, setCategory] = useState<GrievanceCategory | null>(null);
  const [durationOption, setDurationOption] = useState<string | null>(null);
  const [flightTimeOption, setFlightTimeOption] = useState<'<1hr' | '1-2hr' | '>2hr' | null>(null);
  const [assistanceOption, setAssistanceOption] = useState<'none' | 'refreshments' | 'hotel_alternate' | null>(null);

  // Custom issue state
  const [customIssueText, setCustomIssueText] = useState<string>('');
  const [pnr, setPnr] = useState<string>('');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [customEntitlement, setCustomEntitlement] = useState<StatutoryEntitlement | null>(null);

  const [isDraftModalOpen, setIsDraftModalOpen] = useState<boolean>(false);

  // Handlers for question flow
  const handleSelectAirline = (id: AirlineId) => {
    setAirlineId(id);
    setCurrentQuestion(2);
  };

  const handleSelectCategory = (cat: GrievanceCategory) => {
    setCategory(cat);
    if (cat === 'other') {
      // For "Other", stay on Question 2 view which displays the full description screen
      // Do not show Question 3, 4, 5
    } else {
      setCurrentQuestion(3);
    }
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

  const handleUpdateCustomField = (
    field: 'customIssueText' | 'pnr' | 'flightNumber' | 'travelDate',
    val: string
  ) => {
    if (field === 'customIssueText') setCustomIssueText(val);
    else if (field === 'pnr') setPnr(val);
    else if (field === 'flightNumber') setFlightNumber(val);
    else if (field === 'travelDate') setTravelDate(val);
  };

  const handleSubmitCustomIssue = async () => {
    if (!airlineId || !customIssueText.trim()) return;

    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/grievance/ai-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airlineId,
          userDescription: customIssueText.trim(),
          pnr: pnr.trim(),
          flightNumber: flightNumber.trim(),
          travelDate: travelDate.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data?.entitlement) {
        setCustomEntitlement(data.entitlement);
        setCurrentQuestion(6);
      }
    } catch (err) {
      console.error('Failed to curate AI solution, using statutory fallback:', err);
      // Fall back gracefully to local rule generator
      const fallback = getStraightSolution({
        airlineId,
        category: 'other',
        customIssueText,
        pnr,
        flightNumber,
        travelDate,
      });
      setCustomEntitlement(fallback);
      setCurrentQuestion(6);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleBack = () => {
    if (category === 'other' && currentQuestion === 2) {
      // Step back from "Other" description view to problem selection
      setCategory(null);
      return;
    }

    if (currentQuestion > 1) {
      if (currentQuestion === 3) {
        setCategory(null);
      }
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
    setCustomIssueText('');
    setPnr('');
    setFlightNumber('');
    setTravelDate('');
    setCustomEntitlement(null);
  };

  // Check if standard solution is ready OR custom AI solution is ready
  const isStandardReady =
    currentQuestion === 6 &&
    airlineId &&
    category &&
    category !== 'other' &&
    durationOption &&
    flightTimeOption &&
    assistanceOption;

  const isCustomReady =
    currentQuestion === 6 &&
    airlineId &&
    category === 'other' &&
    customEntitlement;

  const answers: GrievanceAnswers | null = isStandardReady
    ? {
        airlineId: airlineId!,
        category: category!,
        durationOption,
        flightTimeOption,
        assistanceOption,
      }
    : isCustomReady
    ? {
        airlineId: airlineId!,
        category: 'other',
        customIssueText,
        pnr,
        flightNumber,
        travelDate,
      }
    : null;

  const entitlement: StatutoryEntitlement | null =
    category === 'other' && customEntitlement
      ? customEntitlement
      : answers
      ? getStraightSolution(answers)
      : null;

  const activeAirline = airlineId ? AIRLINE_DIRECTORY[airlineId] : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Scale className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Customer Grievance & Passenger Rights
            </h1>
            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
              DGCA Protected
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            {category === 'other'
              ? 'AI-powered legal dispute synthesis enforcing DGCA CAR & Consumer Protection Act 2019.'
              : 'Answer quick questions or explain your issue to get an exact statutory solution and step-by-step enforcement plan.'}
          </p>
        </div>

        {currentQuestion < 6 && (
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-600">
              {category === 'other' ? 'AI Legal Assessment' : `Step ${currentQuestion} of 5`}
            </span>
          </div>
        )}
      </div>

      {/* 1 TO 5: QUESTION WIZARD (MCQ OR DEDICATED OTHER VIEW) */}
      {currentQuestion <= 5 && (
        <QuestionWizard
          currentQuestion={currentQuestion}
          airlineId={airlineId}
          category={category}
          durationOption={durationOption}
          flightTimeOption={flightTimeOption}
          assistanceOption={assistanceOption}
          customIssueText={customIssueText}
          pnr={pnr}
          flightNumber={flightNumber}
          travelDate={travelDate}
          isLoadingAi={isLoadingAi}
          onUpdateCustomField={handleUpdateCustomField}
          onSubmitCustomIssue={handleSubmitCustomIssue}
          onSelectAirline={handleSelectAirline}
          onSelectCategory={handleSelectCategory}
          onSelectDuration={handleSelectDuration}
          onSelectFlightTime={handleSelectFlightTime}
          onSelectAssistance={handleSelectAssistance}
          onBack={handleBack}
        />
      )}

      {/* 6: STRAIGHT SOLUTION (STATUTORY ENTITLEMENT + VISUAL STEPS + PRE-FILLED NOTICE) */}
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
            entitlement={entitlement}
            initialPnr={pnr}
            initialFlightNumber={flightNumber}
            initialTravelDate={travelDate}
            customIssueText={customIssueText}
          />
        </>
      )}
    </div>
  );
}
