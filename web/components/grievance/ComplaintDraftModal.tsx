'use client';

import React, { useState, useEffect } from 'react';
import { AirlineId, GrievanceCategory, StatutoryEntitlement } from '@/lib/grievance/types';
import { getStatutoryEntitlement } from '@/lib/grievance/grievance-rules';
import { AIRLINE_DIRECTORY, AUTHORITY_TWITTER_HANDLES } from '@/lib/grievance/airline-contacts';

interface ComplaintDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  airlineId: AirlineId;
  category: GrievanceCategory;
  entitlement?: StatutoryEntitlement | null;
  initialPnr?: string;
  initialFlightNumber?: string;
  initialTravelDate?: string;
  customIssueText?: string;
  onOpenTwitterModal?: (details: { pnr: string; flightNumber: string; travelDate: string }) => void;
}

export function ComplaintDraftModal({
  isOpen,
  onClose,
  airlineId,
  category,
  entitlement: providedEntitlement,
  initialPnr = '',
  initialFlightNumber = '',
  initialTravelDate = '',
  customIssueText = '',
  onOpenTwitterModal,
}: ComplaintDraftModalProps) {
  const [copied, setCopied] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [pnr, setPnr] = useState(initialPnr);
  const [flightNumber, setFlightNumber] = useState(initialFlightNumber);
  const [travelDate, setTravelDate] = useState(initialTravelDate);

  // Keep synced if initial props change
  useEffect(() => {
    if (initialPnr) setPnr(initialPnr);
    if (initialFlightNumber) setFlightNumber(initialFlightNumber);
    if (initialTravelDate) setTravelDate(initialTravelDate);
  }, [initialPnr, initialFlightNumber, initialTravelDate]);

  if (!isOpen) return null;

  const airline = AIRLINE_DIRECTORY[airlineId] || AIRLINE_DIRECTORY.indigo;
  const entitlement = providedEntitlement || getStatutoryEntitlement(airlineId, category);

  const passenger = passengerName.trim() || '[Passenger Name]';
  const pnrText = pnr.trim().toUpperCase() || '[PNR NUMBER]';
  const flightText = flightNumber.trim().toUpperCase() || '[FLIGHT NUMBER]';
  const dateText = travelDate || '[DATE OF TRAVEL]';

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // If AI generated a dedicated draft notice, customize it with passenger fields
  let complaintDraft = '';
  if (entitlement.customDraftNotice?.trim()) {
    complaintDraft = entitlement.customDraftNotice
      .replace(/\[Passenger Name\]/gi, passenger)
      .replace(/\[PNR NUMBER\]|\[PNR\]/gi, pnrText)
      .replace(/\[FLIGHT NUMBER\]|\[Flight\]/gi, flightText)
      .replace(/\[DATE OF TRAVEL\]|\[TRAVEL DATE\]/gi, dateText);
  } else {
    complaintDraft = `DATE: ${today}

TO:
The Nodal Grievance Officer,
${airline.name},
Email: ${airline.nodalOfficer.email}
Address: ${airline.nodalOfficer.address}

SUBJECT: FORMAL COMPLAINT & LEGAL DEMAND NOTICE FOR COMPENSATION UNDER DGCA CAR SECTION 3, SERIES M, PART IV
PNR: ${pnrText} | FLIGHT: ${flightText} | DATE: ${dateText}

Dear Sir/Madam,

I am writing this formal grievance to place on record a serious deficiency of service and violation of civil aviation regulations in respect of my travel booked with ${airline.name}.

1. PARTICULARS OF TRAVEL:
- Passenger Name: ${passenger}
- PNR / Booking Reference: ${pnrText}
- Flight Number: ${flightText}
- Scheduled Date of Travel: ${dateText}

2. FACTS OF THE GRIEVANCE:
On the date of travel, I experienced the following grievance:
- Nature of Disruption: ${entitlement.headline}${customIssueText ? `\n- Detailed Statement of Facts: ${customIssueText}` : ''}
- Governing Regulation: ${entitlement.primaryClauses.map((c) => `${c.name} (${c.clause})`).join(', ')}
- Pertinent Airline Contract: ${airline.name} Conditions of Carriage & Passenger Charter

3. STATUTORY ENTITLEMENTS & LEGAL PROVISIONS:
As per the Directorate General of Civil Aviation (DGCA) Civil Aviation Requirements (CAR) and statutory airline contracts:
- Statutory Remedy / Demand: ${entitlement.compensationAmount}
- Legal Basis: ${entitlement.compensationBasis || entitlement.cashHighlight}
- Refund Rights: ${entitlement.refundSummary || entitlement.refundHighlight}
- Care & Facilities Mandate: ${entitlement.freeCareSummary || entitlement.careHighlight}

EXACT STATUTORY PROVISIONS QUOTED:
${entitlement.primaryClauses.map((c) => `• ${c.name} [${c.clause}]:\n  "${c.exactText}"`).join('\n\n')}

4. FORMAL DEMAND:
In view of the aforementioned facts and clear statutory mandates, I hereby call upon ${airline.name} to:
a) Remit the statutory compensation/restitution of ${entitlement.compensationAmount} directly to my bank account / original payment mode within 10 business days of this notice.
b) Confirm resolution in writing to my email address.

5. NOTICE OF LEGAL INTENT (15 DAYS NOTICE):
Please take notice that in the event ${airline.name} fails to resolve this grievance and disburse the lawful compensation within 15 (fifteen) calendar days from receipt of this notice, I shall be constrained to initiate formal proceedings against your airline without any further notice, including:
i) Lodging a statutory grievance before the Ministry of Civil Aviation via the AirSewa Portal (airsewa.gov.in);
ii) Escalating the matter to the Directorate General of Civil Aviation (DGCA) Enforcement Directorate;
iii) Filing a formal Consumer Complaint before the Hon'ble District Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019 for deficiency of service, unfair trade practice, and seeking damages for mental agony, harassment, and litigation costs.

I trust this matter will be resolved promptly within the statutory 10-day timeline.

Yours sincerely,

${passenger}
Contact Email: [Your Email]
Contact Phone: [Your Mobile Number]`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(complaintDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([complaintDraft], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Legal_Notice_${airline.code}_${pnrText}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
              <img src={airline.logoUrl} alt={airline.shortName} className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Pre-filled Formal Legal Notice & Demand Letter
              </h3>
              <p className="text-xs text-slate-600">
                Ready to send directly to the Nodal Officer of {airline.name} ({airline.nodalOfficer.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        {/* Quick customization fields */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              PNR Number
            </label>
            <input
              type="text"
              placeholder="e.g. W9Q7KL"
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs uppercase text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Flight Number
            </label>
            <input
              type="text"
              placeholder="e.g. 6E 502"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs uppercase text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Travel Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-900 shadow-xs">
            {complaintDraft}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs"
            >
              <span>Download .TXT</span>
              <span>💾</span>
            </button>

            {onOpenTwitterModal && (
              <button
                onClick={() => {
                  onOpenTwitterModal({ pnr, flightNumber, travelDate });
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 px-3 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Escalate on X ({AUTHORITY_TWITTER_HANDLES.advocacy})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
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
