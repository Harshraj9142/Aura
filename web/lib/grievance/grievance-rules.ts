import { AirlineId, GrievanceCategory, StatutoryEntitlement, GrievanceAnswers } from './types';
import { AIRLINE_DIRECTORY } from './airline-contacts';

export interface ProblemOption {
  id: GrievanceCategory;
  title: string;
  badge: string;
  icon: string;
  quickDescription: string;
}

export const PROBLEM_LIST: ProblemOption[] = [
  {
    id: 'delay',
    title: 'Flight Delayed',
    badge: 'Meals, Hotel & Refund',
    icon: '⏳',
    quickDescription: 'Tarmac delay, long gate wait, or missed connection',
  },
  {
    id: 'cancellation',
    title: 'Flight Cancelled',
    badge: 'Up to ₹10,000 + 100% Refund',
    icon: '🚫',
    quickDescription: 'Cancelled <24h prior, at airport, or no alternate flight',
  },
  {
    id: 'denied_boarding',
    title: 'Denied Boarding (Overbooking)',
    badge: 'Up to ₹20,000 (400% Fare)',
    icon: '💺',
    quickDescription: 'Seat given away or bumped despite confirmed ticket',
  },
  {
    id: 'baggage',
    title: 'Baggage Lost or Damaged',
    badge: 'Up to ₹20,000 / 1,288 SDR',
    icon: '🧳',
    quickDescription: 'Cracked trolley, missing bag on arrival, or delay',
  },
  {
    id: 'refund',
    title: 'Delayed Refund or Fee Deduction',
    badge: '7-Day Rule + 100% Taxes',
    icon: '💳',
    quickDescription: 'Refund pending >7 days or airline deducted airport taxes',
  },
];

export function getStatutoryEntitlement(
  airlineId: AirlineId,
  category: GrievanceCategory
): StatutoryEntitlement {
  return getStraightSolution({
    airlineId,
    category,
    durationOption: '4-6hr',
    flightTimeOption: '1-2hr',
    assistanceOption: 'none',
  });
}

export function getStraightSolution(answers: GrievanceAnswers): StatutoryEntitlement {
  const res = calculateEntitlement(answers);
  return {
    ...res,
    compensationBasis: res.compensationBasis || res.cashHighlight,
    refundSummary: res.refundSummary || res.refundHighlight,
    freeCareSummary: res.freeCareSummary || res.careHighlight,
  };
}

function calculateEntitlement(answers: GrievanceAnswers): StatutoryEntitlement {
  const airline = AIRLINE_DIRECTORY[answers.airlineId] || AIRLINE_DIRECTORY.indigo;
  const { category, durationOption, flightTimeOption, assistanceOption } = answers;

  // Compute block-time statutory cash tier
  const blockCash =
    flightTimeOption === '<1hr'
      ? '₹5,000'
      : flightTimeOption === '1-2hr'
      ? '₹7,500'
      : '₹10,000';

  // 1. FLIGHT DELAY
  if (category === 'delay') {
    const isOvernight = durationOption === '>6hr';
    const isLongDelay = durationOption === '4-6hr' || isOvernight;

    const headline = isOvernight
      ? `Free Hotel Room + Meals + Option for Full 100% Refund`
      : isLongDelay
      ? `Free Warm Meals + Free Reschedule or 100% Refund`
      : `Mandatory Free Refreshments & Care`;

    return {
      headline,
      compensationAmount: isOvernight
        ? `Free Hotel Accommodation + ${blockCash} (If flight departs next day)`
        : isLongDelay
        ? `Free Warm Meals + 100% Refund Right`
        : `Free Snacks & Refreshments`,
      cashHighlight: isOvernight
        ? `Overnight delay entitles you to free hotel accommodation, cab transfers, or ${blockCash} cash compensation under DGCA CAR Section 3.`
        : isLongDelay
        ? `Option to cancel your journey with 100% refund with zero deduction, or take an alternate flight free of charge.`
        : `Free meals and refreshments mandated for delays exceeding 2 hours.`,
      careHighlight: isOvernight
        ? `Mandatory free hotel stay with round-trip airport transfers.`
        : `Free refreshments and beverages provided at the departure terminal.`,
      refundHighlight: isLongDelay
        ? `100% refund of basic fare, fuel surcharge, and all airport taxes (UDF/PSF).`
        : `Full refund applicable if you decline the delayed departure.`,
      primaryClauses: [
        {
          name: 'DGCA CAR Series M Part IV',
          clause: 'Clause 3.4 (Facilities for Delays) & Clause 3.5 (Hotel Stay)',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.2 (Delays)' : 'Section 7 (Flight Disruptions)',
          url: airline.officialCocUrl,
        },
        {
          name: 'MoCA Passenger Charter',
          clause: 'Section A (Flight Delays Entitlements)',
          url: 'https://airsewa.gov.in',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          stage: 'Airport Counter (Immediate)',
          timeframe: 'Right Now',
          icon: '📍',
          title: 'Demand Signed Delay Certificate & Meal/Hotel Voucher',
          shortAction: `Request a written, stamped Delay Certificate with the exact departure delay timestamp from the ${airline.shortName} Duty Manager.`,
          clauseCitation: {
            label: 'DGCA CAR Clause 3.4 (Duty of Care)',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA Civil Aviation Requirements',
          },
          contactInfo: {
            label: `${airline.shortName} Airport Duty Manager`,
            phone: airline.customerCare.phone,
          },
        },
        {
          stepNumber: 2,
          stage: 'Notice to Nodal Officer',
          timeframe: 'Within 24 Hours',
          icon: '✉️',
          title: 'Send Pre-Filled Legal Claim to Airline Nodal Officer',
          shortAction: `Email ${airline.nodalOfficer.email} citing DGCA CAR Clause 3.4/3.5 demanding reimbursement with a statutory 10-day ultimatum.`,
          clauseCitation: {
            label: `${airline.shortName} CoC Grievance Clause`,
            url: airline.officialCharterUrl,
            docName: `${airline.shortName} Charter`,
          },
          contactInfo: {
            label: `Nodal Officer (${airline.shortName})`,
            email: airline.nodalOfficer.email,
            phone: airline.nodalOfficer.phone,
          },
        },
        {
          stepNumber: 3,
          stage: 'Appellate Escalation',
          timeframe: 'Day 11 (If Unresolved)',
          icon: '⚖️',
          title: 'Escalate to Airline Appellate Authority',
          shortAction: `If the Nodal Officer does not resolve within 10 days, escalate directly to ${airline.appellateAuthority.email}.`,
          clauseCitation: {
            label: 'DGCA Appellate Resolution Timeline',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Enforcement Regulations',
          },
          contactInfo: {
            label: `Appellate Authority`,
            email: airline.appellateAuthority.email,
          },
        },
        {
          stepNumber: 4,
          stage: 'Government Order & Court',
          timeframe: 'Day 16+',
          icon: '🏛️',
          title: 'Submit Grievance on AirSewa or Consumer Court (e-Daakhil)',
          shortAction: 'Log a formal dispute on Ministry AirSewa portal for immediate regulatory intervention, or file on e-Daakhil without lawyer fees.',
          clauseCitation: {
            label: 'AirSewa Grievance Redressal Mechanism',
            url: 'https://airsewa.gov.in',
            docName: 'Ministry of Civil Aviation',
          },
          contactInfo: {
            label: 'AirSewa Portal (MoCA)',
            url: 'https://airsewa.gov.in',
          },
        },
      ],
    };
  }

  // 2. FLIGHT CANCELLATION
  if (category === 'cancellation') {
    const isLateNotice = durationOption === '<24hr' || durationOption === 'at_airport';
    const compText = isLateNotice
      ? `${blockCash} Cash Compensation + 100% Immediate Refund`
      : `100% Full Refund or Free Alternate Flight`;

    return {
      headline: compText,
      compensationAmount: isLateNotice ? blockCash : 'Full 100% Refund',
      cashHighlight: isLateNotice
        ? `Under DGCA CAR Series M Part IV Clause 3.3.2, cancellations with <24h notice require mandatory cash compensation of ${blockCash}.`
        : `Full refund of all components with zero cancellation fees.`,
      careHighlight: 'Free meals/refreshments while waiting for alternate flights + hotel if next day.',
      refundHighlight: 'Immediate refund processed to original payment method within 7 working days.',
      primaryClauses: [
        {
          name: 'DGCA CAR Series M Part IV',
          clause: 'Clause 3.3.2 (Compensation for Cancellations)',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.1 (Cancellation)' : 'Section 7 (Cancellations)',
          url: airline.officialCocUrl,
        },
        {
          name: 'MoCA Passenger Charter',
          clause: 'Section B (Flight Cancellations)',
          url: 'https://airsewa.gov.in',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          stage: 'Airport Counter (Immediate)',
          timeframe: 'Right Now',
          icon: '📍',
          title: 'Obtain Signed Flight Cancellation Certificate',
          shortAction: `Demand a written, signed Cancellation Certificate with reason & timestamp from the ${airline.shortName} Duty Manager.`,
          clauseCitation: {
            label: 'DGCA CAR Clause 3.3.1 (Duty of Care)',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA Civil Aviation Requirements',
          },
          contactInfo: {
            label: `${airline.shortName} Airport Counter`,
            phone: airline.customerCare.phone,
          },
        },
        {
          stepNumber: 2,
          stage: 'Notice to Nodal Officer',
          timeframe: 'Within 24 Hours',
          icon: '✉️',
          title: `Submit Statutory Claim of ${blockCash} to Nodal Officer`,
          shortAction: `Email ${airline.nodalOfficer.email} demanding ${blockCash} under DGCA CAR Clause 3.3.2 within 10 days.`,
          clauseCitation: {
            label: `${airline.shortName} CoC Grievance Clause`,
            url: airline.officialCharterUrl,
            docName: `${airline.shortName} Charter`,
          },
          contactInfo: {
            label: `Nodal Officer (${airline.shortName})`,
            email: airline.nodalOfficer.email,
            phone: airline.nodalOfficer.phone,
          },
        },
        {
          stepNumber: 3,
          stage: 'Appellate Escalation',
          timeframe: 'Day 11 (If Unresolved)',
          icon: '⚖️',
          title: 'Escalate to Airline Appellate Authority',
          shortAction: `Forward notice to ${airline.appellateAuthority.email} citing non-compliance with the statutory 10-day turnaround.`,
          clauseCitation: {
            label: 'DGCA Appellate Procedure',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Enforcement Regulations',
          },
          contactInfo: {
            label: `Appellate Authority`,
            email: airline.appellateAuthority.email,
          },
        },
        {
          stepNumber: 4,
          stage: 'Government Order & Court',
          timeframe: 'Day 16+',
          icon: '🏛️',
          title: 'File Case on AirSewa and National Consumer Court (e-Daakhil)',
          shortAction: 'Submit complaint on AirSewa for instant DGCA notice, or file an e-Daakhil consumer petition for damages + mental agony.',
          clauseCitation: {
            label: 'Consumer Protection Act, 2019',
            url: 'https://edaakhil.nic.in',
            docName: 'National Consumer Disputes Redressal',
          },
          contactInfo: {
            label: 'e-Daakhil Portal',
            url: 'https://edaakhil.nic.in',
          },
        },
      ],
    };
  }

  // 3. DENIED BOARDING
  if (category === 'denied_boarding') {
    return {
      headline: `Up to ₹20,000 Cash (400% Base Fare) + 100% Refund`,
      compensationAmount: `400% of Base Fare + Fuel Surcharge (Up to ₹20,000)`,
      cashHighlight: `Under DGCA CAR Series M Part IV Clause 3.2, involuntary denied boarding without alternate flight within 24 hours entitles you to 400% of one-way basic fare + fuel charge (capped at ₹20,000).`,
      careHighlight: `Mandatory free hotel stay and airport meals until alternate flight departs.`,
      refundHighlight: `100% refund of original ticket if you decline alternate flight.`,
      primaryClauses: [
        {
          name: 'DGCA CAR Series M Part IV',
          clause: 'Clause 3.2 (Denied Boarding Compensation)',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.3 (Denied Boarding)' : 'Section 6 (Overbooking)',
          url: airline.officialCocUrl,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          stage: 'Boarding Gate (Immediate)',
          timeframe: 'Right Now',
          icon: '📍',
          title: 'Refuse Voluntary Voucher & Demand Involuntary Bump Certificate',
          shortAction: `Do not accept airline travel vouchers. Demand an official "Involuntary Denied Boarding Certificate" signed by the Duty Manager.`,
          clauseCitation: {
            label: 'DGCA CAR Clause 3.2.1',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA CAR Series M Part IV',
          },
        },
        {
          stepNumber: 2,
          stage: 'Notice to Nodal Officer',
          timeframe: 'Within 24 Hours',
          icon: '✉️',
          title: 'Demand Immediate 400% Base Fare Statutory Payout',
          shortAction: `Email ${airline.nodalOfficer.email} with your boarding pass and PNR demanding payout within 10 days.`,
          clauseCitation: {
            label: 'DGCA CAR Clause 3.2.2',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA CAR Series M Part IV',
          },
          contactInfo: {
            label: `Nodal Officer`,
            email: airline.nodalOfficer.email,
          },
        },
        {
          stepNumber: 3,
          stage: 'Appellate Escalation',
          timeframe: 'Day 11 (If Unresolved)',
          icon: '⚖️',
          title: 'Escalate to Airline Appellate Authority',
          shortAction: `Escalate to ${airline.appellateAuthority.email} for failure to disburse denied boarding compensation.`,
          clauseCitation: {
            label: 'DGCA Appellate Guidelines',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Regulations',
          },
        },
        {
          stepNumber: 4,
          stage: 'Government Order & Court',
          timeframe: 'Day 16+',
          icon: '🏛️',
          title: 'File Dispute on AirSewa & e-Daakhil',
          shortAction: 'Submit on AirSewa and claim ₹50,000+ punitive damages for harassment on e-Daakhil.',
          clauseCitation: {
            label: 'AirSewa Portal',
            url: 'https://airsewa.gov.in',
            docName: 'AirSewa',
          },
        },
      ],
    };
  }

  // 4. BAGGAGE
  if (category === 'baggage') {
    return {
      headline: `Full Repair / Replacement (Up to ₹20,000 / 1,288 SDR)`,
      compensationAmount: `Up to ₹20,000 (Domestic) / 1,288 SDR (~₹1.4 Lakh International)`,
      cashHighlight: `Under Carriage by Air Act, 1972 & Montreal Convention (Articles 17 & 22), the airline is strictly liable for damage or loss to checked baggage.`,
      careHighlight: `Emergency toiletries and clothing allowance + free doorstep delivery for delayed baggage.`,
      refundHighlight: `Reimbursement of bag replacement or repair bill upon invoice submission.`,
      primaryClauses: [
        {
          name: 'Carriage by Air Act, 1972',
          clause: 'Montreal Convention Article 17 & 22 (Baggage Liability)',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: 'Baggage Liability Clause',
          url: airline.officialCocUrl,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          stage: 'Baggage Belt (Critical)',
          timeframe: 'Before Leaving Airport',
          icon: '📍',
          title: 'File Property Irregularity Report (PIR) Before Exit',
          shortAction: `Never leave the baggage claim hall without filing a Property Irregularity Report (PIR) and getting a printed copy with reference number.`,
          clauseCitation: {
            label: 'Carriage by Air Act, Section 4',
            url: 'https://www.civilaviation.gov.in',
            docName: 'Carriage by Air Act',
          },
        },
        {
          stepNumber: 2,
          stage: 'Formal Written Notice',
          timeframe: 'Within 7 Days (Damage) / 21 Days (Delay)',
          icon: '✉️',
          title: 'Submit Written Claim with Bag Invoice & Photos',
          shortAction: `Email ${airline.nodalOfficer.email} with clear photos of the damaged bag, original purchase receipt, baggage tag, and PIR number.`,
          clauseCitation: {
            label: 'Montreal Convention Article 31',
            url: 'https://www.civilaviation.gov.in',
            docName: 'Montreal Convention Notice Rules',
          },
          contactInfo: {
            label: `Baggage Claims / Nodal`,
            email: airline.nodalOfficer.email,
          },
        },
        {
          stepNumber: 3,
          stage: 'Appellate Escalation',
          timeframe: 'Day 11 (If Unresolved)',
          icon: '⚖️',
          title: 'Escalate to Airline Appellate Authority',
          shortAction: `If ${airline.shortName} offers lowball repair credits, escalate to ${airline.appellateAuthority.email} demanding full replacement cost.`,
          clauseCitation: {
            label: 'DGCA Passenger Charter',
            url: 'https://airsewa.gov.in',
            docName: 'Charter of Rights',
          },
        },
        {
          stepNumber: 4,
          stage: 'Consumer Court',
          timeframe: 'Day 16+',
          icon: '🏛️',
          title: 'File Petition on e-Daakhil for Property Replacement',
          shortAction: 'File on e-Daakhil for full bag replacement + travel inconvenience compensation.',
          clauseCitation: {
            label: 'Consumer Protection Act, 2019',
            url: 'https://edaakhil.nic.in',
            docName: 'e-Daakhil',
          },
        },
      ],
    };
  }

  // 5. REFUND
  return {
    headline: `100% Full Refund + Zero Cancellation Fee Deduction`,
    compensationAmount: `100% Ticket Fare + 100% Taxes (UDF, PSF, ASF)`,
    cashHighlight: `Under DGCA CAR Section 3 Series M Part II, all airport taxes (User Development Fee, Passenger Service Fee) must be refunded in full even on non-refundable tickets, within 7 days for card payments.`,
    careHighlight: 'Zero processing fee or deduction permitted when flight is disrupted.',
    refundHighlight: 'Immediate refund credit to source bank account within 7 business days.',
    primaryClauses: [
      {
        name: 'DGCA CAR Series M Part II',
        clause: 'Clause 3.1 & 3.3 (Refund of Airline Tickets)',
        url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
      },
      {
        name: `${airline.shortName} Conditions of Carriage`,
        clause: 'Refund Procedures',
        url: airline.officialCocUrl,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        stage: 'Initial Claim (Day 1)',
        timeframe: 'Immediate',
        icon: '📍',
        title: 'Check Refund Status & Demand Itemized Tax Breakdown',
        shortAction: `Verify that ${airline.shortName} did not deduct UDF, PSF, or convenience fees from your refund.`,
        clauseCitation: {
          label: 'DGCA CAR Series M Part II, Clause 3.3',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA CAR Series M Part II',
        },
      },
      {
        stepNumber: 2,
        stage: 'Formal Notice to Nodal Officer',
        timeframe: 'After 7 Days',
        icon: '✉️',
        title: 'Email Legal Demand to Airline Nodal Officer',
        shortAction: `Email ${airline.nodalOfficer.email} citing the statutory 7-day refund mandate under DGCA regulations.`,
        clauseCitation: {
          label: 'DGCA 7-Day Refund Mandate',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA CAR Series M Part II',
        },
        contactInfo: {
          label: `Nodal Officer`,
          email: airline.nodalOfficer.email,
        },
      },
      {
        stepNumber: 3,
        stage: 'Appellate Escalation',
        timeframe: 'Day 15',
        icon: '⚖️',
        title: 'Escalate to Airline Appellate Authority',
        shortAction: `Send formal escalation to ${airline.appellateAuthority.email} demanding immediate refund plus interest.`,
        clauseCitation: {
          label: 'Statutory Redressal Timelines',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA Guidelines',
        },
      },
      {
        stepNumber: 4,
        stage: 'AirSewa & Consumer Court',
        timeframe: 'Day 20+',
        icon: '🏛️',
        title: 'File Regulatory Complaint on AirSewa Portal',
        shortAction: 'Log dispute on AirSewa. MoCA officers will issue a direct enforcement query to the airline finance team.',
        clauseCitation: {
          label: 'AirSewa Portal',
          url: 'https://airsewa.gov.in',
          docName: 'Ministry of Civil Aviation',
        },
      },
    ],
  };
}
