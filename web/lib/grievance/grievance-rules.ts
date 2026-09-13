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
  {
    id: 'other',
    title: 'Other / Explain Your Issue',
    badge: 'Custom Dispute Resolution',
    icon: '✨',
    quickDescription: 'Flight schedule change, unfair charges, medical, disability, or custom grievance',
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
  const { category, durationOption, flightTimeOption } = answers;

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
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.4.1 & Clause 3.8.1 (Meals & Refreshments)',
          exactText:
            'Para 3.4.1: The airlines shall provide facilities in accordance with Para 3.8.1 (a) (free meals and refreshments in relation to waiting time) if the passenger has checked in on time and the airline expects a delay beyond original scheduled departure of: (a) 2 hours or more for flights having block time up to 2.5 hours; (b) 3 hours or more for flights having block time >2.5 to 5 hours; (c) 4 hours or more for all other flights.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.4.2 & Clause 3.4.3 (Full Refund & Overnight Hotel Accommodation)',
          exactText:
            'Para 3.4.2: When domestic flight is expected to be delayed for more than 6 hrs from the published scheduled time of departure... airlines shall offer an option of either an alternate flight within a period of 6 hours or full refund of ticket to the passenger. Para 3.4.3: When total delay is more than 24 hrs from published departure, or more than 6 hrs for flights scheduled between 20:00 and 03:00 hrs, passenger shall be offered free hotel accommodation including airport transfers.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.2 (Delays)' : 'Section 7 (Flight Disruptions & Care)',
          exactText:
            `${airline.shortName}'s liability in respect of delays & cancellation of flights will be as per DGCA CAR, Section 3, Series M, Part IV. Meals, refreshments and hotel accommodation with ground transport shall be provided to passengers in accordance with statutory regulations.`,
          url: airline.officialCocUrl,
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
            label: 'DGCA CAR Clause 3.4.1 & Clause 3.4.5',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA Civil Aviation Requirements',
            exactText:
              'Para 3.4.5: The burden of proof concerning the questions as to whether and when the passenger has been informed of the delay of the flight shall rest with the operating airline. The airline shall issue a stamped certificate verifying the delay timestamp.',
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
            label: 'DGCA CAR Issue I, Para 3.9.1',
            url: airline.officialCharterUrl,
            docName: `${airline.shortName} Charter`,
            exactText:
              'Para 3.9.1: When affected by a long delay or disruption, the passenger may complain directly to the airline nodal officer in the event the airline has not provided the compensation and/or reasonable facilities as specified in this CAR.',
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
            label: 'DGCA Enforcement Regulations Section 3',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Enforcement Regulations',
            exactText:
              'Airline designated redressal officers shall resolve passenger claims within a statutory period of 10 days, failing which the passenger has immediate recourse to the Airline Appellate Authority.',
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
            label: 'DGCA CAR Para 3.9.2 & Consumer Protection Act 2019',
            url: 'https://airsewa.gov.in',
            docName: 'Ministry of Civil Aviation',
            exactText:
              'Para 3.9.2 & 3.9.3: The passenger may file the grievance on AirSewa App or Portal. If not satisfied, the passenger has liberty to complain to any statutory consumer court setup under the Consumer Protection Act, 2019.',
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
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.3.1 (Cancellation Notice & Alternate Flight)',
          exactText:
            'Para 3.3.1: In order to reduce inconvenience caused to passengers as a result of flight cancellations, airline shall inform the passenger at least two weeks before scheduled departure and arrange alternate flight/refund. If informed less than two weeks and up to 24 hours before departure, airline shall offer alternate flight or refund the ticket, as acceptable to the passenger.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.3.2 (Mandatory Financial Compensation Tiers)',
          exactText:
            'Para 3.3.2: Passengers who have not been informed as per Para 3.3.1, or missed connecting flight booked on same ticket, the airlines shall either provide alternate flight or provide compensation in addition to full refund of ticket: (a) INR 5,000 or booked one-way basic fare + fuel charge (whichever is less) for block time up to 1 hr; (b) INR 7,500 or basic fare + fuel charge for block time 1–2 hrs; (c) INR 10,000 or basic fare + fuel charge for block time >2 hrs.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.1 (Cancellation)' : 'Section 7 (Cancellations)',
          exactText:
            `In the event of cancellation without requisite notice under DGCA rules, ${airline.shortName} shall provide alternate flight or refund the full ticket amount plus statutory financial compensation prescribed by DGCA CAR Section 3 Series M Part IV.`,
          url: airline.officialCocUrl,
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
            label: 'DGCA CAR Clause 3.3.2 (Duty of Care)',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA Civil Aviation Requirements',
            exactText:
              'Para 3.3.2: Additionally, the airline shall provide them facilities at the airport in accordance with Para 3.8.1 (a) (meals/refreshments) in the event they have already reported for their original flight and whilst they are waiting for alternate flight.',
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
            label: 'DGCA CAR Clause 3.7.1 (Mode of Compensation)',
            url: airline.officialCharterUrl,
            docName: `${airline.shortName} Charter`,
            exactText:
              'Para 3.7.1: The compensation referred to in Para 3.2.2 and 3.3.2 shall be paid in cash, by bank transfer or with signed agreement of the passenger in form of travel vouchers.',
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
            label: 'DGCA CAR Issue I, Section 3',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Enforcement Regulations',
            exactText:
              'Failure of airline Nodal Officer to disburse statutory cancellation compensation within 10 days triggers immediate escalation to Airline Appellate Authority.',
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
            label: 'Consumer Protection Act, 2019 Section 35',
            url: 'https://edaakhil.nic.in',
            docName: 'National Consumer Disputes Redressal',
            exactText:
              'Section 35: A consumer may file a complaint before the District Commission electronically via e-Daakhil for deficiency in service and unfair trade practice seeking compensation and litigation costs without legal representation.',
          },
          contactInfo: {
            label: 'e-Daakhil Portal',
            url: 'https://edaakhil.nic.in',
          },
        },
      ],
    };
  }

  // 3. DENIED BOARDING (OVERBOOKING)
  if (category === 'denied_boarding') {
    return {
      headline: `Up to ₹20,000 Cash (400% Base Fare) + 100% Refund`,
      compensationAmount: `400% of Base Fare + Fuel Surcharge (Up to ₹20,000)`,
      cashHighlight: `Under DGCA CAR Series M Part IV Clause 3.2, involuntary denied boarding without alternate flight within 24 hours entitles you to 400% of one-way basic fare + fuel charge (capped at ₹20,000).`,
      careHighlight: `Mandatory free hotel stay and airport meals until alternate flight departs.`,
      refundHighlight: `100% refund of original ticket if you decline alternate flight.`,
      primaryClauses: [
        {
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.2.1 & Clause 3.2.2 (Denied Boarding Compensation Tiers)',
          exactText:
            'Para 3.2.1: When number of passengers with confirmed bookings exceed seats available, airline must first call for volunteers to surrender seats. Para 3.2.2: If boarding is denied against passenger will: (a) 200% of booked one-way basic fare + fuel charge, max INR 10,000, if alternate flight departs within 24 hrs; (b) 400% of booked one-way basic fare + fuel charge, max INR 20,000, if alternate departs >24 hrs; (c) If passenger declines alternate: full ticket refund + 400% compensation up to INR 20,000.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: airline.id === 'airindia' ? 'Article 10.3 (Denied Boarding)' : 'Section 6 (Overbooking & Bump)',
          exactText:
            `${airline.shortName} will pay compensation to customers who are denied boarding by ${airline.shortName} in accordance with Para 3.2 of DGCA CAR - Section 3, Series M, Part IV, Issue I, with immediate hotel accommodation and duty of care.`,
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
            label: 'DGCA CAR Clause 3.2.1 & Clause 2.6',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA CAR Series M Part IV',
            exactText:
              'Para 2.6: Denied Boarding means refusal to carry a passenger holding confirmed ticket who reported within specified time. Airline cannot compel acceptance of travel vouchers in lieu of statutory cash compensation.',
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
            label: 'DGCA CAR Clause 3.2.2 (c)',
            url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
            docName: 'DGCA CAR Series M Part IV',
            exactText:
              'Para 3.2.2 (c): In case passenger does not opt for alternate flight, refund of full value of ticket and compensation equal to 400% of booked one-way basic fare plus airline fuel charge, subject to maximum of INR 20,000.',
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
            label: 'DGCA Enforcement Circular Section 3',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Regulations',
            exactText:
              'Airlines operating in India are bound under the Aircraft Rules, 1937 to execute appellate redressal within statutory deadlines on failure of voluntary compensation payout.',
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
            label: 'Consumer Protection Act 2019 Section 35 & AirSewa',
            url: 'https://airsewa.gov.in',
            docName: 'AirSewa',
            exactText:
              'Overbooking and bumping a passenger holding a confirmed ticket is recognized as an unfair trade practice and severe deficiency in service, actionable before consumer forums.',
          },
        },
      ],
    };
  }

  // 4. BAGGAGE (LOST / DAMAGED)
  if (category === 'baggage') {
    return {
      headline: `Full Repair / Replacement (Up to ₹20,000 / 1,288 SDR)`,
      compensationAmount: `Up to ₹20,000 (Domestic) / 1,288 SDR (~₹1.4 Lakh International)`,
      cashHighlight: `Under Carriage by Air Act, 1972 & Montreal Convention (Articles 17 & 22), the airline is strictly liable for damage or loss to checked baggage.`,
      careHighlight: `Emergency toiletries and clothing allowance + free doorstep delivery for delayed baggage.`,
      refundHighlight: `Reimbursement of bag replacement or repair bill upon invoice submission.`,
      primaryClauses: [
        {
          name: 'Carriage by Air Act, 1972 & Carrier Conditions of Carriage',
          clause: 'Rule 22 / Article 17.3 (Baggage Liability Ceiling)',
          exactText:
            'Domestic Flights: Under the Carriage by Air Act, 1972 and Carrier Conditions of Carriage (Article 17.3.4), the Carrier limit of liability for lost, delayed or damaged checked baggage is up to Rupees Twenty Thousand (INR 20,000) to Twenty-Five Thousand (INR 25,000) per passenger. International Flights: Under Montreal Convention Article 22, the liability for lost, damaged or delayed baggage is limited to 1,288 SDRs (approx. INR 1,45,000) per passenger.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: 'Montreal Convention Article 31 & DGCA Passenger Charter',
          clause: 'Article 31 (Notice Timelines for Damage & Delay)',
          exactText:
            'Article 31(2): In the case of damage, the person entitled to delivery must complain to the carrier forthwith after discovery of damage, and, at latest, within seven (7) days from date of receipt. In the case of delay, the complaint must be made at latest within twenty-one (21) days from date on which baggage was placed at disposal. A Property Irregularity Report (PIR) must be lodged at the arrival airport.',
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
            label: 'Carriage by Air Act Rule 31',
            url: 'https://www.civilaviation.gov.in',
            docName: 'Carriage by Air Act',
            exactText:
              'Missing or damaged baggage must be officially reported before leaving the arrival terminal via a Property Irregularity Report (PIR) signed by carrier staff.',
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
            label: 'Montreal Convention Article 31(2)',
            url: 'https://www.civilaviation.gov.in',
            docName: 'Montreal Convention Notice Rules',
            exactText:
              'Article 31(2): Every complaint must be made in writing and given or dispatched within the times aforesaid (7 days for damage, 21 days for delay), failing which no action shall lie against carrier.',
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
            label: 'DGCA Passenger Charter Section 8',
            url: 'https://airsewa.gov.in',
            docName: 'Charter of Rights',
            exactText:
              'Airlines are obligated to compensate for actual demonstrated loss or repair charges up to statutory ceiling rather than unilaterally issuing generic travel discount vouchers.',
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
            label: 'Consumer Protection Act, 2019 Section 35',
            url: 'https://edaakhil.nic.in',
            docName: 'e-Daakhil',
            exactText:
              'Inability to trace checked baggage within 21 days constitutes permanent loss of property, obligating the carrier to disburse the full statutory liability ceiling plus interim relief.',
          },
        },
      ],
    };
  }

  // 5. OTHER / CUSTOM GRIEVANCE (FALLBACK IF AI IS OFFLINE OR KEYS PENDING)
  if (category === 'other') {
    const issueSummary = answers.customIssueText
      ? answers.customIssueText.length > 80
        ? answers.customIssueText.slice(0, 77) + '...'
        : answers.customIssueText
      : 'Custom Aviation Dispute & Deficiency in Service';

    return {
      headline: `Statutory Dispute: ${issueSummary}`,
      compensationAmount: `Full Restitution + Statutory Relief under Consumer Protection Act`,
      cashHighlight: `Under DGCA CAR Section 3 and the Consumer Protection Act 2019, passengers are entitled to full restitution for unauthorized charges or service deficiencies.`,
      careHighlight: `Airlines are obligated to provide courteous service, transparent disclosures, and prompt grievance resolution.`,
      refundHighlight: `Disputed fees or unjustified deductions must be remitted back to the passenger's original payment mode.`,
      isAiCurated: false,
      aiProviderUsed: 'template',
      primaryClauses: [
        {
          name: 'DGCA CAR Section 3, Series M, Part IV',
          clause: 'Clause 3.9 (Passenger Grievance Redressal Mechanism)',
          exactText:
            'Para 3.9.1: Each airline shall have an Internal Grievance Redressal Mechanism with an appointed Nodal Officer and Appellate Authority to address all passenger grievances related to deficient service, arbitrary changes, or dispute resolution.',
          url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
        },
        {
          name: 'Consumer Protection Act, 2019',
          clause: 'Section 2(11) & Section 35 (Deficiency in Service & Unfair Trade Practice)',
          exactText:
            'Deficiency means any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance which is required to be maintained by or under any law for the time being in force or has been undertaken to be performed by a person in pursuance of a contract or otherwise in relation to any service.',
          url: 'https://edaakhil.nic.in',
        },
        {
          name: `${airline.shortName} Conditions of Carriage`,
          clause: 'General Conditions & Passenger Redressal',
          exactText:
            `${airline.shortName} is governed by statutory civil aviation regulations and must resolve passenger complaints through its designated Nodal Officer within statutory timeframes.`,
          url: airline.officialCocUrl,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          stage: 'Documentation (Immediate)',
          timeframe: 'Day 1',
          icon: '📍',
          title: 'Preserve Booking Evidence & Incident Record',
          shortAction: `Compile your PNR, ticket copy, payment receipt, and written communications with ${airline.shortName}.`,
          clauseCitation: {
            label: 'DGCA CAR Series M Part IV',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Enforcement Regulations',
            exactText:
              'Passengers shall preserve all electronic and documentary records of booking, payment receipts, and communications with airline personnel to substantiate claims.',
          },
          contactInfo: {
            label: `${airline.shortName} Customer Care`,
            phone: airline.customerCare.phone,
            email: airline.customerCare.email,
          },
        },
        {
          stepNumber: 2,
          stage: 'Notice to Nodal Officer',
          timeframe: 'Within 48 Hours',
          icon: '✉️',
          title: `Serve Formal Grievance Notice to ${airline.shortName} Nodal Officer`,
          shortAction: `Email ${airline.nodalOfficer.email} with your detailed issue statement and demand written redressal within 10 days.`,
          clauseCitation: {
            label: 'DGCA CAR Clause 3.9.1 (Nodal Mechanism)',
            url: airline.officialCharterUrl,
            docName: `${airline.shortName} Charter`,
            exactText:
              'Airlines are obligated to designate a Nodal Officer to whom passengers can submit formal grievances, with a statutory resolution timeframe.',
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
          shortAction: `Forward the unaddressed notice to ${airline.appellateAuthority.email} requesting executive intervention.`,
          clauseCitation: {
            label: 'DGCA CAR Issue I, Section 3',
            url: 'https://www.civilaviation.gov.in',
            docName: 'DGCA Regulations',
            exactText:
              'If the Nodal Officer fails to resolve the grievance within 10 days, the passenger may escalate to the Airline Appellate Authority.',
          },
          contactInfo: {
            label: `Appellate Authority`,
            email: airline.appellateAuthority.email,
          },
        },
        {
          stepNumber: 4,
          stage: 'Regulatory Intervention & Court',
          timeframe: 'Day 16+',
          icon: '🏛️',
          title: 'Lodge on Ministry AirSewa & National Consumer Court (e-Daakhil)',
          shortAction: 'Submit complaint on AirSewa for direct MoCA oversight, or file on e-Daakhil for compensation and compensation for mental agony.',
          clauseCitation: {
            label: 'Consumer Protection Act 2019 Section 35 & AirSewa',
            url: 'https://airsewa.gov.in',
            docName: 'Ministry of Civil Aviation',
            exactText:
              'AirSewa connects passengers directly to civil aviation regulatory authorities for prompt escalation against non-responsive airline management.',
          },
          contactInfo: {
            label: 'AirSewa Portal (MoCA)',
            url: 'https://airsewa.gov.in',
          },
        },
      ],
    };
  }

  // 6. REFUND
  return {
    headline: `100% Full Refund + Zero Cancellation Fee Deduction`,
    compensationAmount: `100% Ticket Fare + 100% Taxes (UDF, PSF, ASF)`,
    cashHighlight: `Under DGCA CAR Section 3 Series M Part II, all airport taxes (User Development Fee, Passenger Service Fee) must be refunded in full even on non-refundable tickets, within 7 days for card payments.`,
    careHighlight: 'Zero processing fee or deduction permitted when flight is disrupted.',
    refundHighlight: 'Immediate refund credit to source bank account within 7 business days.',
    primaryClauses: [
      {
        name: 'DGCA CAR Section 3, Series M, Part II',
        clause: 'Clause 3.1 & Clause 3.3 (Refund Turnaround & Mode)',
        exactText:
          'Para 3.3: In case of purchase of ticket through credit card, refund shall be made by the airline within 7 days of the cancellation. In case of cash purchase, refund shall be made immediately across the counter. The refund process shall be completed by airlines without administrative delay or arbitrary processing charges.',
        url: 'https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights',
      },
      {
        name: 'DGCA CAR Section 3, Series M, Part II & MoCA Charter',
        clause: 'Clause 3.4 & Clause 3.5 (100% Airport Tax Refund & Credit Shell Prohibition)',
        exactText:
          'Para 3.4: Under no circumstances shall airlines levy cancellation charges more than basic fare plus fuel surcharge. Airlines must refund all statutory taxes and User Development Fee (UDF), Passenger Service Fee (PSF), Airport Development Fee (ADF) even on non-refundable tickets. Para 3.5: Option of holding refund in credit shell is strictly passenger prerogative and not default practice.',
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
          label: 'DGCA CAR Series M Part II, Clause 3.4',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA CAR Series M Part II',
          exactText:
            'Para 3.4: Airport charges (PSF, UDF, ASF) are statutory government fees collected on behalf of the airport operator and must be remitted back in full to the passenger even on zero-refund promotional fares.',
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
          label: 'DGCA 7-Day Refund Mandate Para 3.3',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA CAR Series M Part II',
          exactText:
            'Para 3.3: The airline is legally bound to initiate the credit card refund within seven (7) days of booking cancellation, with zero processing deduction.',
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
          label: 'DGCA Redressal Circular Series M Part II',
          url: 'https://www.civilaviation.gov.in',
          docName: 'DGCA Guidelines',
          exactText:
            'Failure to remit full tax components or holding passenger money in unsolicited credit shells violates regulatory directives, attracting immediate escalation to the Appellate Authority.',
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
          label: 'Consumer Protection Act 2019 & AirSewa',
          url: 'https://airsewa.gov.in',
          docName: 'Ministry of Civil Aviation',
          exactText:
            'Unauthorized retention of passenger funds beyond statutory timelines constitutes illegal enrichment and unfair trade practice subject to statutory interest and compensation.',
        },
      },
    ],
  };
}
