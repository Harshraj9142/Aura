'use client';

import React, { useState } from 'react';
import { WizardAnswers } from '@/lib/grievance/types';
import { calculateEntitlement } from '@/lib/grievance/grievance-rules';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';

interface ComplaintDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  answers: WizardAnswers;
}

export function ComplaintDraftModal({
  isOpen,
  onClose,
  answers,
}: ComplaintDraftModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const airline = answers.airlineId ? AIRLINE_DIRECTORY[answers.airlineId] : AIRLINE_DIRECTORY.indigo;
  const entitlement = calculateEntitlement(answers);

  const passenger = answers.passengerName || '[Passenger Full Name]';
  const pnr = answers.pnr || '[PNR NUMBER]';
  const flight = answers.flightNumber || '[FLIGHT NUMBER]';
  const travelDate = answers.travelDate || '[DATE OF TRAVEL]';
  const route = answers.origin ? `${answers.origin}` : '[ORIGIN - DESTINATION]';
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const complaintDraft = `DATE: ${today}

TO:
The Nodal Grievance Officer,
${airline.name},
Email: ${airline.nodalOfficer.email}
Address: ${airline.nodalOfficer.address}

SUBJECT: FORMAL COMPLAINT & LEGAL DEMAND NOTICE FOR COMPENSATION UNDER DGCA CAR SECTION 3, SERIES M, PART IV
PNR: ${pnr} | FLIGHT: ${flight} | DATE: ${travelDate}

Dear Sir/Madam,

I am writing this formal grievance to place on record a serious deficiency of service and violation of civil aviation regulations in respect of my travel booked with ${airline.name}.

1. PARTICULARS OF TRAVEL:
- Passenger Name: ${passenger}
- PNR / Booking Reference: ${pnr}
- Flight Number: ${flight}
- Sector / Route: ${route}
- Scheduled Date of Travel: ${travelDate}
${answers.ticketFare ? `- Ticket Fare Paid: ₹${answers.ticketFare}` : ''}

2. FACTS OF THE GRIEVANCE:
On the date of travel, I experienced the following grievance:
- Nature of Disruption: ${entitlement.headline}
- Governing Regulation: ${entitlement.dgcaClause}
- Pertinent Airline Policy: ${airline.name} Conditions of Carriage & Passenger Charter

3. STATUTORY ENTITLEMENTS & LEGAL PROVISIONS:
As per the Directorate General of Civil Aviation (DGCA) Civil Aviation Requirements (CAR) Section 3, Series M, Part IV and the statutory Ministry of Civil Aviation Passenger Charter of Rights, I am legally entitled to:
- Statutory Compensation / Remedy: ${entitlement.compensationAmount}
- Details: ${entitlement.compensationBasis}
- Refund Rights: ${entitlement.refundRights}
- Care & Facilities: ${entitlement.freeServices.join(', ')}

4. FORMAL DEMAND:
In view of the aforementioned facts and clear statutory mandates, I hereby call upon ${airline.name} to:
a) Remit the statutory compensation of ${entitlement.compensationAmount} directly to my bank account / original payment mode within 10 business days of this notice.
b) Issue an unconditional apology and confirm resolution in writing to my email address.

5. NOTICE OF LEGAL INTENT (15 DAYS NOTICE):
Please note that in the event ${airline.name} fails to resolve this grievance and disburse the lawful compensation within 15 (fifteen) calendar days from receipt of this notice, I shall be constrained to initiate formal proceedings against your airline without any further notice, including:
i) Lodging a statutory grievance before the Ministry of Civil Aviation via the AirSewa Portal;
ii) Escalating the matter to the Directorate General of Civil Aviation (DGCA) Enforcement Directorate;
iii) Filing a formal Consumer Complaint before the Hon'ble District Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019 for deficiency of service, unfair trade practice, and seeking damages for mental agony, harassment, and litigation costs.

I trust good sense will prevail and this matter will be resolved promptly within the statutory 10-day timeline.

Yours sincerely,

${passenger}
Contact Email: [Your Email]
Contact Phone: [Your Mobile Number]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaintDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([complaintDraft], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Legal_Notice_${airline.code}_${pnr}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pre-filled Formal Legal Notice & Demand Letter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ready to send directly to the Nodal Officer of {airline.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
            💡 <strong>How to use this notice:</strong> Copy the text below, fill in your email and phone at the bottom, and send an email directly to{' '}
            <span className="font-bold underline">{airline.nodalOfficer.email}</span> with CC to your own email address. Airlines take formal notices citing DGCA CAR with extreme priority.
          </div>

          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {complaintDraft}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span>Download .TXT</span>
            <span>💾</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <span>{copied ? 'Copied to Clipboard! ✓' : 'Copy Notice Text'}</span>
              <span>📋</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
