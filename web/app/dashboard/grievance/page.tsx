'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AirlineId, GrievanceCategory, GrievanceAnswers, StatutoryEntitlement } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { getStraightSolution } from '@/lib/grievance/grievance-rules';
import { QuestionWizard } from '@/components/grievance/QuestionWizard';
import { StraightSolutionView } from '@/components/grievance/StraightSolutionView';
import { ComplaintDraftModal } from '@/components/grievance/ComplaintDraftModal';
import { TwitterEscalationModal } from '@/components/grievance/TwitterEscalationModal';
import { DashboardClosingBanner } from '@/components/DashboardClosingBanner';

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
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState<boolean>(false);
  const [twitterDetails, setTwitterDetails] = useState<{
    pnr?: string;
    flightNumber?: string;
    travelDate?: string;
  }>({});

  // Handlers for question flow
  const handleSelectAirline = (id: AirlineId) => {
    setAirlineId(id);
    setCurrentQuestion(2);
  };

  const handleSelectCategory = (cat: GrievanceCategory) => {
    setCategory(cat);
    if (cat === 'other') {
      // For "Other", stay on Question 2 view which displays the full description screen
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
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Identical layout & typography across all tabs)
        - Wide-angle cinematic airport customer service image (/dashboard/grievance_hero.jpg)
        ========================================================================
      */}
      <div className="relative w-full min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex flex-col justify-between pt-36 sm:pt-40 lg:pt-44 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        
        {/* Masked Panorama Background Image */}
        <div
          className="absolute inset-0 z-0 bg-slate-950 pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
          }}
        >
          <Image
            src="/dashboard/grievance_hero.jpg"
            alt="Customer Grievance & Passenger Rights Panorama"
            fill
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-10" />

          {/* Left Dark Vignette Layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10" />

          {/* Right Dark Vignette Layer */}
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-4 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              Passenger <span className="font-serif italic font-normal text-white">Rights</span> & Grievance.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Instant statutory entitlement calculation, DGCA rule enforcement, pre-drafted legal notices & social escalation.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>DGCA CAR PROTECTED • CONSUMER PROTECTION ACT 2019</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp Vertical Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>CIVIL AVIATION</div>
              <div>STATUTORY RIGHTS</div>
              <div>LEGAL NOTICE</div>
              <div>DGCA ENFORCE</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        2. FLOATING CONTENT SECTION (Outer container rectangle removed)
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-8 pb-16">
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
              onOpenTwitterModal={() => setIsTwitterModalOpen(true)}
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
              onOpenTwitterModal={(details) => {
                setTwitterDetails(details);
                setIsTwitterModalOpen(true);
              }}
            />

            <TwitterEscalationModal
              isOpen={isTwitterModalOpen}
              onClose={() => setIsTwitterModalOpen(false)}
              airlineId={activeAirline.id}
              category={answers.category}
              initialPnr={twitterDetails.pnr || pnr}
              initialFlightNumber={twitterDetails.flightNumber || flightNumber}
              initialTravelDate={twitterDetails.travelDate || travelDate}
            />
          </>
        )}

        {/* Closing Quote Banner */}
        <DashboardClosingBanner quote="EVERY FARE HAS A STORY. EVERY COMPLAINT HAS A SIGNAL." />
      </div>
    </div>
  );
}

