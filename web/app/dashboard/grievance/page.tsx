'use client';

import React, { useState } from 'react';
import { WizardAnswers } from '@/lib/grievance/types';
import { GrievanceWizard } from '@/components/grievance/GrievanceWizard';
import { EntitlementResults } from '@/components/grievance/EntitlementResults';
import { LegalEscalationGuide } from '@/components/grievance/LegalEscalationGuide';
import { ComplaintDraftModal } from '@/components/grievance/ComplaintDraftModal';
import { AirlineQuickDirectory } from '@/components/grievance/AirlineQuickDirectory';
import { DGCACharterReference } from '@/components/grievance/DGCACharterReference';

export default function GrievanceDashboardPage() {
  const [completedAnswers, setCompletedAnswers] = useState<WizardAnswers | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const handleWizardComplete = (answers: WizardAnswers) => {
    setCompletedAnswers(answers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setCompletedAnswers(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white shadow-sm">
              ⚖️
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Passenger Rights & Grievance Engine
            </h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-500/20 dark:text-indigo-400">
              DGCA Compliant
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Diagnose your airline dispute, verify exact compensation and refund entitlements under Indian civil aviation law, access official policy links, and generate formal legal notices.
          </p>
        </div>
      </div>

      {/* Main Interactive Flow */}
      {completedAnswers ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Entitlement Assessment Results */}
          <EntitlementResults
            answers={completedAnswers}
            onReset={handleReset}
            onOpenDraftModal={() => setIsDraftModalOpen(true)}
          />

          {/* 4-Tier Legal Escalation Roadmap */}
          <LegalEscalationGuide airlineId={completedAnswers.airlineId || 'indigo'} />
        </div>
      ) : (
        /* MCQ Diagnostic Wizard */
        <GrievanceWizard onComplete={handleWizardComplete} />
      )}

      {/* Statutory Legal Cheatsheet */}
      <DGCACharterReference />

      {/* Full 6-Airline Official Directory */}
      <AirlineQuickDirectory />

      {/* Legal Notice Draft Modal */}
      {completedAnswers && (
        <ComplaintDraftModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          answers={completedAnswers}
        />
      )}
    </div>
  );
}
