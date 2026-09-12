import {
  AirlineId,
  GrievanceCategory,
  OptionChoice,
  QuestionStep,
  StatutoryEntitlement,
  WizardAnswers,
} from './types';
import { AIRLINE_DIRECTORY } from './airline-contacts';

export const GRIEVANCE_CATEGORIES: {
  id: GrievanceCategory;
  title: string;
  description: string;
  icon: string;
  badge: string;
}[] = [
  {
    id: 'cancellation',
    title: 'Flight Cancelled',
    description: 'Airline cancelled your flight or informed you at the last minute.',
    icon: '🚫',
    badge: 'Up to ₹10,000 + Refund',
  },
  {
    id: 'delay',
    title: 'Flight Delayed',
    description: 'Tarmac delay, delayed departure, missed connection, or overnight wait.',
    icon: '⏳',
    badge: 'Free Meals, Hotel & Refund',
  },
  {
    id: 'denied_boarding',
    title: 'Denied Boarding (Overbooking)',
    description: 'Arrived with confirmed ticket on time but denied seat due to overbooking.',
    icon: '💺',
    badge: 'Up to ₹20,000 + 400% Fare',
  },
  {
    id: 'baggage',
    title: 'Baggage Lost / Damaged / Delayed',
    description: 'Broken trolley, torn suitcase, missing luggage, or delayed arrival.',
    icon: '🧳',
    badge: 'Up to ₹20,000 / 1,288 SDR',
  },
  {
    id: 'refund',
    title: 'Refund Delays & Illegal Deductions',
    description: 'Airline or OTA not refunding within 7 days or deducting airport taxes.',
    icon: '💳',
    badge: '100% Tax Refund & 7-Day Rule',
  },
  {
    id: 'downgrade',
    title: 'Involuntary Class Downgrade',
    description: 'Downgraded from Business/Premium to Economy without consent.',
    icon: '📉',
    badge: '75% Fare Refund',
  },
  {
    id: 'medical_prm',
    title: 'Medical / Wheelchair / PRM Issue',
    description: 'Wheelchair denied, disability harassment, or pregnancy/medical emergency.',
    icon: '♿',
    badge: 'DGCA Special Care Violation',
  },
];

export function getCategoryQuestions(category: GrievanceCategory): QuestionStep[] {
  switch (category) {
    case 'cancellation':
      return [
        {
          id: 'timing',
          title: 'When did the airline notify you of the cancellation?',
          subtitle: 'Statutory compensation depends strictly on when intimation was given.',
          options: [
            {
              id: 'less_than_24h',
              label: 'Less than 24 hours before or at the airport',
              description: 'You received notice on day of travel or reached airport without prior SMS/email.',
              badge: 'Highest Compensation Eligible',
            },
            {
              id: 'between_24h_2w',
              label: 'Between 24 hours and 2 weeks prior',
              description: 'Airline informed you 1 to 14 days before your scheduled departure.',
            },
            {
              id: 'more_than_2w',
              label: 'More than 2 weeks prior to departure',
              description: 'Informed well in advance with ample time to reschedule.',
            },
          ],
        },
        {
          id: 'alternateFlight',
          title: 'Was an acceptable alternate flight provided?',
          subtitle: 'Whether the airline arranged alternative transport.',
          options: [
            {
              id: 'none',
              label: 'No alternate flight offered',
              description: 'You were stranded or left to book another flight at your own cost.',
            },
            {
              id: 'unreasonable',
              label: 'Offered, but departure delayed by more than 2 hours',
              description: 'Alternate was scheduled many hours or days later.',
            },
            {
              id: 'acceptable',
              label: 'Offered within 2 hours and accepted',
              description: 'You flew on the alternate arrangement.',
            },
          ],
        },
      ];

    case 'delay':
      return [
        {
          id: 'delayDuration',
          title: 'How long was your total flight delay?',
          subtitle: 'Calculated from scheduled departure time.',
          options: [
            {
              id: 'over_6h_or_night',
              label: 'More than 6 hours OR overnight delay',
              description: 'Flight delayed beyond 6 hours or scheduled night flight pushed to next day.',
              badge: 'Hotel + Free Reschedule',
            },
            {
              id: 'between_4_6h',
              label: 'Between 4 to 6 hours',
              description: 'Extensive waiting at the airport gate or terminal.',
              badge: 'Free Meals + Refreshments',
            },
            {
              id: 'between_2_4h',
              label: 'Between 2 to 4 hours',
              description: 'Moderate delay past scheduled departure.',
            },
            {
              id: 'less_than_2h',
              label: 'Under 2 hours',
              description: 'Minor delay considered normal operating variance.',
            },
          ],
        },
        {
          id: 'mealsOffered',
          title: 'Did the airline provide free meals and refreshments?',
          subtitle: 'Airlines are legally required to provide care during waiting intervals.',
          options: [
            {
              id: 'no',
              label: 'No meals or water offered',
              description: 'Staff ignored passengers or refused to provide refreshment coupons.',
            },
            {
              id: 'yes',
              label: 'Yes, meals/snacks were provided',
              description: 'Airline distributed refreshments or food vouchers at airport.',
            },
          ],
        },
      ];

    case 'denied_boarding':
      return [
        {
          id: 'volunteerDenied',
          title: 'Did you voluntarily surrender your seat?',
          subtitle: 'Under DGCA rules, voluntary and involuntary denied boarding have different compensation.',
          options: [
            {
              id: 'involuntary',
              label: 'Involuntary — I had confirmed ticket and reached on time',
              description: 'Airline staff offloaded or denied boarding against my will due to overbooking.',
              badge: 'Full Statutory Penalty Due',
            },
            {
              id: 'voluntary',
              label: 'Voluntary — I agreed to airline benefits',
              description: 'Agreed to take alternate flight or vouchers voluntarily offered by airline.',
            },
          ],
        },
        {
          id: 'alternateFlight',
          title: 'When did the airline offer an alternate flight?',
          subtitle: 'Compensation tier doubles if alternate flight is delayed beyond 24 hours.',
          options: [
            {
              id: 'over_24h_or_declined',
              label: 'More than 24 hours later OR declined alternate',
              description: 'No same-day flight offered, or I had to cancel my trip entirely.',
              badge: '400% Basic Fare (Max ₹20,000)',
            },
            {
              id: 'within_24h',
              label: 'Within 24 hours of scheduled departure',
              description: 'Put on a later flight within 24 hours.',
              badge: '200% Basic Fare (Max ₹10,000)',
            },
            {
              id: 'within_1h',
              label: 'Within 1 hour of scheduled departure',
              description: 'Immediate replacement flight arranged within 60 minutes.',
            },
          ],
        },
      ];

    case 'baggage':
      return [
        {
          id: 'baggageIssueType',
          title: 'What specific issue occurred with your baggage?',
          subtitle: 'Select the primary damage or loss condition.',
          options: [
            {
              id: 'damaged',
              label: 'Damaged Baggage (Broken wheel, ripped, torn, contents broken)',
              description: 'Suitcase arrived damaged or cracked upon retrieval from carousel.',
            },
            {
              id: 'lost_permanent',
              label: 'Lost Baggage (Missing for more than 21 days)',
              description: 'Airline unable to trace baggage after 21 calendar days.',
              badge: 'Declared Lost — Full Claim',
            },
            {
              id: 'delayed',
              label: 'Delayed Baggage (Missing for under 21 days)',
              description: 'Landed without bags; delivered later or still in transit.',
            },
            {
              id: 'pilferage',
              label: 'Pilferage / Theft of items from inside bag',
              description: 'Zip tampered with and valuable items stolen in transit.',
            },
          ],
        },
        {
          id: 'pirFiled',
          title: 'Did you file a Property Irregularity Report (PIR) before leaving airport?',
          subtitle: 'The PIR is the single most critical legal evidentiary document.',
          options: [
            {
              id: 'yes_pir',
              label: 'Yes, I have a PIR receipt number from baggage counter',
              description: 'Reported immediately to airline ground staff at baggage belt.',
              badge: 'Valid Legal Proof',
            },
            {
              id: 'no_pir',
              label: 'No, I left the airport without filing PIR',
              description: 'Discovered damage/loss after reaching hotel or home.',
              badge: 'Must Report Within 7 Days',
            },
          ],
        },
      ];

    case 'refund':
      return [
        {
          id: 'bookingChannel',
          title: 'Where did you book your flight ticket?',
          subtitle: 'DGCA holds airlines strictly responsible for passenger refunds regardless of OTA.',
          options: [
            {
              id: 'direct',
              label: 'Direct on Airline Official Website / App',
              description: 'Booked directly with credit/debit card or UPI.',
            },
            {
              id: 'ota',
              label: 'Through Online Travel Agent (MakeMyTrip, EaseMyTrip, Yatra, etc.)',
              description: 'Booked through third-party aggregator or travel agent.',
            },
          ],
        },
        {
          id: 'refundDays',
          title: 'How many days have passed since the refund was triggered?',
          subtitle: 'Statutory mandate requires completion within 7 working days.',
          options: [
            {
              id: 'over_30d',
              label: 'More than 30 days',
              description: 'Extremely delinquent refund, violation of consumer regulations.',
              badge: 'Deficiency of Service',
            },
            {
              id: 'between_8_30d',
              label: 'Between 8 to 30 days',
              description: 'Exceeded statutory 7-day banking window.',
            },
            {
              id: 'under_7d',
              label: 'Within 7 working days',
              description: 'Still within normal banking processing window.',
            },
          ],
        },
      ];

    case 'downgrade':
      return [
        {
          id: 'downgradeType',
          title: 'What was your involuntary class downgrade?',
          subtitle: 'DGCA rules updated in 2023 mandate strict refunds for seat downgrades.',
          options: [
            {
              id: 'domestic_downgrade',
              label: 'Domestic Flight Downgrade (Business / Premium Economy to Economy)',
              description: 'Booked higher class on domestic route, forced into economy seat.',
              badge: '75% Ticket Fare Refund',
            },
            {
              id: 'international_downgrade',
              label: 'International Flight Downgrade',
              description: 'Downgraded on long-haul or regional international sector.',
              badge: '30% to 75% Sector Fare Refund',
            },
          ],
        },
      ];

    case 'medical_prm':
      return [
        {
          id: 'timing',
          title: 'What special assistance violation occurred?',
          subtitle: 'Governed by DGCA CAR Section 3, Series M, Part I for PRM passengers.',
          options: [
            {
              id: 'wheelchair_denied',
              label: 'Wheelchair assistance denied or charged extra',
              description: 'Free wheelchair assistance was refused or extra money demanded.',
              badge: 'Illegal under DGCA Rules',
            },
            {
              id: 'medical_denial',
              label: 'Boarding denied with valid medical clearance / Fit to Fly',
              description: 'Passenger had proper medical certificate but airline ground staff arbitrarily refused.',
            },
            {
              id: 'blind_deaf_harassment',
              label: 'Harassment of passenger with visual, hearing or loco-motor disability',
              description: 'Denied seating or escorted off aircraft without valid safety reason.',
            },
          ],
        },
      ];

    default:
      return [];
  }
}

export function calculateEntitlement(answers: WizardAnswers): StatutoryEntitlement {
  const airline = answers.airlineId ? AIRLINE_DIRECTORY[answers.airlineId] : AIRLINE_DIRECTORY.indigo;
  const category = answers.category || 'cancellation';

  // 1. CANCELLATION
  if (category === 'cancellation') {
    if (answers.timing === 'less_than_24h') {
      return {
        headline: 'Full Refund / Alternate Flight + Up to ₹10,000 Cash Compensation',
        compensationAmount: '₹5,000 to ₹10,000 (Based on Flight Block Time) OR 100% Basic Fare + Fuel Surcharge',
        compensationBasis:
          'Under DGCA CAR Section 3, Series M, Part IV, when informed less than 24 hours before departure or upon reaching airport: Flight block time ≤1 hr = ₹5,000; 1 to 2 hrs = ₹7,500; >2 hrs = ₹10,000 (or one-way basic fare + fuel charge, whichever is lower).',
        freeServices: [
          'Free meals and refreshments matching waiting time at airport',
          'Free hotel accommodation with transfers if alternate flight departs next day',
          'Free telephone call / SMS to notify relatives',
        ],
        refundRights: 'Immediate 100% full refund of ticket price if passenger declines alternate flight.',
        dgcaClause: 'DGCA CAR Section 3, Series M, Part IV (Rev. 2021) - Facilities for Flight Cancellations',
        legalRightsSummary: `Under both DGCA statutory regulations and ${airline.name}'s Conditions of Carriage, the airline cannot unilaterally cancel your flight without providing immediate remedy. Unless the airline proves extraordinary circumstances (e.g. airport closure, cyclone) that could not have been avoided, you are entitled to mandatory financial compensation.`,
        immediateAirportActions: [
          'Demand a written Flight Cancellation Slip / Certificate from the Duty Manager with reason and timestamp.',
          'Request meal and beverage vouchers at the airport boarding counter immediately.',
          'Do NOT accept airline credit shell/vouchers without written agreement if you prefer an immediate bank refund.',
        ],
        airlinePolicyNotes: `According to ${airline.name}'s official policy, refunds must be credited to your original payment mode. Contact the Station Manager on ground before exiting.`,
        officialReferenceUrls: [
          { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
          { title: `${airline.name} Passenger Charter`, url: airline.officialCharterUrl },
          { title: 'Ministry of Civil Aviation AirSewa Portal', url: 'https://airsewa.gov.in' },
        ],
      };
    }

    if (answers.timing === 'between_24h_2w') {
      return {
        headline: 'Choice of Alternate Flight OR 100% Full Refund',
        compensationAmount: 'No Cash Compensation (If notified 24h–2 weeks prior & alternate within 2 hours)',
        compensationBasis:
          'If airline notified you between 24 hours and 2 weeks prior, they are legally required to offer an alternate flight departing within 2 hours of original schedule, or issue a 100% full refund.',
        freeServices: [
          'Free booking re-accommodation on next available flight',
          'Zero cancellation or rescheduling fees',
        ],
        refundRights: '100% full refund of all components (Base Fare + Taxes + Ancillary Services).',
        dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.3.1',
        legalRightsSummary: `Because you received advance notification between 1 and 14 days prior, statutory cash compensation is exempted provided the airline gives you an alternate flight or a full refund without deduction.`,
        immediateAirportActions: [
          'Verify if the proposed alternate timing matches your travel purpose.',
          'If unacceptable, demand instant cancellation with full refund to original payment source.',
        ],
        airlinePolicyNotes: `${airline.name} allows one-time free change on date/time within a 7-day window.`,
        officialReferenceUrls: [
          { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
          { title: 'AirSewa Grievance Portal', url: 'https://airsewa.gov.in' },
        ],
      };
    }

    return {
      headline: 'Full Refund OR Alternate Flight (Advance Notice > 2 Weeks)',
      compensationAmount: '100% Full Refund (Zero Cancellation Deduction)',
      compensationBasis: 'Informed more than 2 weeks prior. Airline is exempt from financial penalty but must refund full amount.',
      freeServices: ['Free rescheduling to alternate date/flight of passenger choice subject to seat availability'],
      refundRights: 'Full refund within 7 working days to original payment method.',
      dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.3.2',
      legalRightsSummary: 'Advance schedule changes notified >14 days prior allow passengers to choose between an alternate flight or a 100% refund without any cancellation fee.',
      immediateAirportActions: ['Initiate refund through airline manage booking portal.'],
      airlinePolicyNotes: `${airline.name} policy strictly prohibits retaining PSF/UDF when flight is cancelled.`,
      officialReferenceUrls: [
        { title: `${airline.name} Official Website`, url: airline.officialCocUrl },
      ],
    };
  }

  // 2. DELAY
  if (category === 'delay') {
    if (answers.delayDuration === 'over_6h_or_night') {
      return {
        headline: 'Free Hotel Accommodation, Transfers, Meals & Full Refund Option',
        compensationAmount: 'Free Hotel Room + Full Refund Right (If Passenger Chooses Not to Fly)',
        compensationBasis:
          'Under DGCA CAR Section 3, Series M, Part IV, Clause 3.5: For delays exceeding 24 hours OR delays over 6 hours on flights scheduled between 20:00 and 03:00 hours, airline MUST provide free hotel accommodation and ground transport.',
        freeServices: [
          'Free hotel accommodation at airport or designated city hotel',
          'Free airport-to-hotel ground transport (both ways)',
          'Free meals, beverages, and snacks matching delay duration',
          'Free telephone / communication facilities',
        ],
        refundRights: 'Passenger can choose to cancel trip and receive 100% full refund without any penalty.',
        dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.5.1 to 3.5.3',
        legalRightsSummary: `${airline.name} is legally mandated to accommodate you in a hotel if your flight delay crosses into overnight hours or extends beyond 6 hours for late-night departures. Ground staff cannot ask you to sleep on airport chairs.`,
        immediateAirportActions: [
          'Locate the Airline Duty Manager / Station Manager at the departure gate.',
          'Demand immediate issuance of a Hotel Stay Voucher and boarding passes for transfers.',
          'If ground staff refuses, immediately take video/photo evidence and tweet/tag @MoCA_GoI and @airsewa.',
        ],
        airlinePolicyNotes: `${airline.name}'s Conditions of Carriage specifically commits to care and hotel arrangements during technical or operational delays.`,
        officialReferenceUrls: [
          { title: `${airline.name} Passenger Charter`, url: airline.officialCharterUrl },
          { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
          { title: 'AirSewa Portal (MoCA)', url: 'https://airsewa.gov.in' },
        ],
      };
    }

    if (answers.delayDuration === 'between_4_6h') {
      return {
        headline: 'Mandatory Free Meals & Refreshments + Full Refund Right (>6h)',
        compensationAmount: 'Free Meals & Drinks + Right to Cancel Without Penalty',
        compensationBasis: 'Delays exceeding 2 to 4 hours legally mandate provision of free meals and beverages matching the waiting time.',
        freeServices: [
          'Free warm meals, snacks, and water bottles at the gate',
          'Access to airline lounge or refreshment coupon',
        ],
        refundRights: 'If delay exceeds 6 hours, option for 100% full refund without deduction.',
        dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.4.1',
        legalRightsSummary: 'The airline must provide food and drinks proportionate to the waiting time. Failure to provide meals is a direct violation of DGCA passenger charter.',
        immediateAirportActions: [
          'Approach airline gate counter and present boarding pass for meal coupon.',
          'Ask for exact updated Estimated Time of Departure (ETD) in writing or via SMS.',
        ],
        airlinePolicyNotes: `${airline.name} ground staff are authorized to distribute food boxes or food court coupons.`,
        officialReferenceUrls: [
          { title: `${airline.name} Passenger Charter`, url: airline.officialCharterUrl },
        ],
      };
    }

    return {
      headline: 'Free Refreshments & Priority Updates',
      compensationAmount: 'Free Water & Beverages',
      compensationBasis: 'Airlines are required to provide regular 30-minute status updates and drinking water for moderate delays.',
      freeServices: ['Drinking water and light refreshments', 'Periodic announcements every 30 minutes'],
      refundRights: 'Standard fare rules apply unless delay exceeds threshold.',
      dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.4',
      legalRightsSummary: 'Airlines must keep passengers informed and maintain hydration and comfort at the terminal.',
      immediateAirportActions: ['Stay near gate area and monitor airport display screens.'],
      airlinePolicyNotes: `${airline.name} provides notifications via registered mobile number.`,
      officialReferenceUrls: [
        { title: `${airline.name} Website`, url: airline.officialSupportUrl },
      ],
    };
  }

  // 3. DENIED BOARDING
  if (category === 'denied_boarding') {
    if (answers.alternateFlight === 'over_24h_or_declined') {
      return {
        headline: 'Full Refund of Ticket + 400% Basic Fare Compensation (Up to ₹20,000)',
        compensationAmount: '400% of Booked One-Way Basic Fare + Fuel Charge (Max ₹20,000) + Full Refund',
        compensationBasis:
          'Under DGCA CAR Section 3, Series M, Part IV, Clause 3.2.2(c): When alternate flight is not provided within 24 hours, or passenger declines alternate flight, airline MUST pay 400% basic fare (up to ₹20,000) plus 100% refund of booked ticket.',
        freeServices: [
          'Free meals and refreshments at airport',
          'Free hotel stay if passenger needs overnight accommodation before refund journey',
        ],
        refundRights: 'Immediate 100% ticket refund in addition to the statutory compensation.',
        dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.2 (Denied Boarding)',
        legalRightsSummary: `Overbooking is an intentional airline commercial practice. If you arrived with a confirmed ticket before check-in closure and were bumped off against your will, ${airline.name} is legally penalized by DGCA up to ₹20,000 cash compensation.`,
        immediateAirportActions: [
          'Refuse to sign voluntary offload waivers.',
          'Demand a signed Denied Boarding Certificate from the Airline Airport Station Manager.',
          'Demand instant payout or written commitment with PNR for ₹20,000 compensation.',
        ],
        airlinePolicyNotes: `${airline.name}'s Conditions of Carriage specifically mirrors the DGCA Denied Boarding compensation scheme.`,
        officialReferenceUrls: [
          { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
          { title: `${airline.name} Passenger Charter`, url: airline.officialCharterUrl },
          { title: 'DGCA Official Portal', url: 'https://www.civilaviation.gov.in' },
        ],
      };
    }

    return {
      headline: 'Alternate Flight Within 24h + 200% Basic Fare Compensation (Up to ₹10,000)',
      compensationAmount: '200% of Booked One-Way Basic Fare + Fuel Charge (Max ₹10,000)',
      compensationBasis:
        'Under DGCA CAR Section 3, Series M, Part IV, Clause 3.2.2(b): If airline provides alternate flight departing within 24 hours of original schedule, passenger is entitled to 200% basic fare (max ₹10,000).',
      freeServices: [
        'Confirmed seat on replacement flight',
        'Free food, drinks, and airport transfers during waiting period',
      ],
      refundRights: 'Replacement ticket provided with zero fare difference.',
      dgcaClause: 'DGCA CAR Section 3, Series M, Part IV, Clause 3.2.2',
      legalRightsSummary: 'Even though an alternate flight was arranged, the airline must still pay you financial compensation for the disruption caused by overbooking.',
      immediateAirportActions: [
        'Collect confirmed boarding pass for the replacement flight.',
        'Collect written compensation voucher from the duty counter.',
      ],
      airlinePolicyNotes: `${airline.name} must process statutory compensation within 48 hours.`,
      officialReferenceUrls: [
        { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
      ],
    };
  }

  // 4. BAGGAGE
  if (category === 'baggage') {
    if (answers.baggageIssueType === 'damaged') {
      return {
        headline: 'Baggage Damage Compensation (Up to ₹20,000 Domestic / 1,288 SDR Int’l)',
        compensationAmount: 'Repair Cost OR Replacement of Equivalent Value Bag (Up to ₹20,000)',
        compensationBasis:
          'Under Carriage by Air Act, 1972 & Airline Conditions of Carriage: Airline is strictly liable for damage to checked baggage in their custody.',
        freeServices: ['Free repair through airline authorized vendor OR cash compensation for replacement'],
        refundRights: 'Reimbursement of damaged luggage value upon presenting invoice / purchase proof.',
        dgcaClause: 'Carriage by Air Act, 1972 (Montreal Convention / Warsaw System) & DGCA CAR Section 3, Series M',
        legalRightsSummary: `${airline.name} is legally responsible for delivering your baggage in the same condition it was checked in. The airline cannot disclaim liability by claiming wear and tear on broken handles, wheels, or crushed bags.`,
        immediateAirportActions: [
          'CRITICAL: Do NOT leave the baggage carousel area. Go directly to the Airline Baggage Services Counter.',
          'Insist on filing a Property Irregularity Report (PIR) and obtain the printed PIR Reference Number.',
          'Take clear high-resolution photos and video of the damaged bag with the baggage tag attached.',
        ],
        airlinePolicyNotes: `${airline.name} requires formal notice in writing within 7 calendar days of receipt of damaged baggage.`,
        officialReferenceUrls: [
          { title: `${airline.name} Conditions of Carriage (Baggage Section)`, url: airline.officialCocUrl },
          { title: `${airline.name} Support & Baggage Claims`, url: airline.officialSupportUrl },
        ],
      };
    }

    if (answers.baggageIssueType === 'lost_permanent') {
      return {
        headline: 'Lost Baggage Full Settlement (Up to ₹20,000 Domestic / 1,288 SDR Int’l)',
        compensationAmount: 'Up to ₹20,000 Domestic (Per Passenger) or ~₹1,40,000 (1,288 SDR International)',
        compensationBasis:
          'If checked baggage is not traced and delivered within 21 calendar days, it is legally deemed Lost. Airline must settle full value of bag and contents up to statutory ceiling.',
        freeServices: ['Interim emergency relief allowance already paid is not deductible'],
        refundRights: 'Full monetary payout via bank transfer or cheque.',
        dgcaClause: 'Montreal Convention Article 17 & 22 / DGCA CAR Series M Part IV',
        legalRightsSummary: `Once 21 days have elapsed, ${airline.name} cannot keep delaying claim resolution under the pretext of ongoing searches. You are legally entitled to file for final monetary loss.`,
        immediateAirportActions: [
          'Submit the final claim form with original PIR, boarding pass, and baggage tag.',
          'Provide itemized inventory of contents with estimated values.',
        ],
        airlinePolicyNotes: `${airline.name} claims team must settle verified claims within 15 to 30 business days.`,
        officialReferenceUrls: [
          { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
          { title: 'AirSewa Lost Luggage Dispute', url: 'https://airsewa.gov.in' },
        ],
      };
    }

    return {
      headline: 'Delayed Baggage: Emergency Expense Allowance & Expedited Delivery',
      compensationAmount: 'Emergency Purchase Allowance (₹3,000 to ₹5,000 for Toiletries/Clothes) + Free Home Delivery',
      compensationBasis: 'Airline must reimburse reasonable interim expenses incurred while away from home without clothing and essentials.',
      freeServices: [
        'Free door-to-door courier delivery of delayed bags to your hotel or residence',
        'Real-time WorldTracer baggage tracking updates',
      ],
      refundRights: 'Reimbursement of essential daily emergency purchases upon presentation of receipts.',
      dgcaClause: 'DGCA Passenger Charter (Baggage Delay Provisions)',
      legalRightsSummary: 'The airline must locate and deliver delayed bags at their own expense and reimburse necessary basic clothing/toiletries while you wait.',
      immediateAirportActions: [
        'File PIR immediately and write down your local delivery address and active phone number.',
        'Keep all purchase receipts for basic toiletries and emergency change of clothes.',
      ],
      airlinePolicyNotes: `${airline.name} uses global WorldTracer system to route missing luggage on the next inbound flight.`,
      officialReferenceUrls: [
        { title: `${airline.name} Baggage Services`, url: airline.officialSupportUrl },
      ],
    };
  }

  // 5. REFUND
  if (category === 'refund') {
    return {
      headline: '100% Airport Tax Refund & Mandatory 7-Day Processing Rule',
      compensationAmount: 'Full Ticket Refund + 100% of All Airport Taxes (PSF, UDF, Security Fee)',
      compensationBasis:
        'Under DGCA Circular on Refund of Airline Tickets: Credit card refunds must be completed within 7 working days. In cash bookings, refund is immediate. Furthermore, airport taxes (UDF, PSF, ASF) MUST ALWAYS be refunded even on non-refundable "zero-refund" tickets.',
      freeServices: ['Zero administrative deduction on statutory government taxes'],
      refundRights: 'Strictly 7 working days to original payment method.',
      dgcaClause: 'DGCA CAR Section 3, Series M, Part II (Refund of Airline Tickets) & MoCA Passenger Charter',
      legalRightsSummary: `Airlines and Online Travel Agents (MakeMyTrip, EaseMyTrip, etc.) frequently engage in unfair trade practices by claiming tickets are "non-refundable". Under Indian law, an airline CANNOT withhold Passenger Service Fee (PSF), User Development Fee (UDF), or fuel surcharges when you do not fly. If booked via OTA, DGCA rules mandate the airline is directly answerable.`,
      immediateAirportActions: [
        'Email the Airline Nodal Officer citing DGCA CAR Series M Part II.',
        'Demand a breakdown of refundable taxes (PSF, UDF, ASF) if the base fare was non-refundable.',
        'If delay exceeds 30 days, register complaint on National Consumer Helpline (1915) for interest on delayed refund.',
      ],
      airlinePolicyNotes: `${airline.name}'s policy states refunds are credited to the original instrument (Bank / Card / UPI).`,
      officialReferenceUrls: [
        { title: `${airline.name} Conditions of Carriage (Refunds)`, url: airline.officialCocUrl },
        { title: 'National Consumer Helpline (NCH)', url: 'https://consumerhelpline.gov.in' },
        { title: 'AirSewa Portal', url: 'https://airsewa.gov.in' },
      ],
    };
  }

  // 6. DOWNGRADE
  if (category === 'downgrade') {
    return {
      headline: '75% Fare Refund for Involuntary Class Downgrade',
      compensationAmount: '75% of Ticket Price (Including Taxes) for Domestic Sectors',
      compensationBasis:
        'Under DGCA revised CAR amendment (February 2023): If an airline involuntarily downgrades a passenger from Business / Premium Economy to Economy, the airline must refund 75% of the ticket cost including taxes, and the passenger flies in the lower class.',
      freeServices: ['Free seat on the flight in the available lower class'],
      refundRights: '75% refund of ticket price within 7 days.',
      dgcaClause: 'DGCA CAR Section 3, Series M, Part IV (Amendment Feb 2023 - Seat Downgrade)',
      legalRightsSummary: 'Airlines previously only refunded the difference between fares. DGCA revised the rule to enforce a punitive 75% refund of the total ticket price to prevent arbitrary downgrades.',
      immediateAirportActions: [
        'Do not accept informal downgrade without a written Downgrade Slip from the check-in supervisor.',
        'Submit written claim to airline nodal officer citing the Feb 2023 DGCA 75% rule.',
      ],
      airlinePolicyNotes: `${airline.name} is bound by DGCA CAR amendment on involuntary downgrading.`,
      officialReferenceUrls: [
        { title: 'DGCA Official CAR Notification', url: 'https://www.civilaviation.gov.in' },
        { title: `${airline.name} Conditions of Carriage`, url: airline.officialCocUrl },
      ],
    };
  }

  // 7. MEDICAL / PRM
  return {
    headline: 'Zero Extra Charges for Disability Assistance & Protected Travel Rights',
    compensationAmount: 'Full Reimbursement of Illegal Fees + Statutory Investigation for Discrimination',
    compensationBasis:
      'Under DGCA CAR Section 3, Series M, Part I: Airlines cannot charge any fee for wheelchair assistance, cannot refuse carriage to a passenger with disability who has Fit to Fly clearance, and must provide priority boarding.',
    freeServices: [
      'Free wheelchair assistance from curb to aircraft cabin seat',
      'Free carriage of guide dog / assistive mobility equipment (canes, crutches, wheelchair)',
      'Dedicated aisle wheelchair for boarding and deplaning',
    ],
    refundRights: 'Full refund if boarding is unlawfully denied.',
    dgcaClause: 'DGCA CAR Section 3, Series M, Part I (Carriage of Persons with Disabilities / Reduced Mobility)',
    legalRightsSummary: 'Refusing boarding or charging fees for wheelchair/disability services is a grave violation of the Rights of Persons with Disabilities Act, 2016 and DGCA safety circulars.',
    immediateAirportActions: [
      'Demand to speak with the Airline Chief Grievance Officer on duty.',
      'File an immediate written complaint with the Airport Director (AAI / Private Operator).',
      'Lodge a priority complaint on AirSewa under Category: Disability Grievance.',
    ],
    airlinePolicyNotes: `${airline.name} mandates pre-booking of wheelchair 48 hours in advance, but emergency assistance cannot be turned away.`,
    officialReferenceUrls: [
      { title: `${airline.name} Special Assistance Policy`, url: airline.officialSupportUrl },
      { title: 'AirSewa Disability Portal', url: 'https://airsewa.gov.in' },
    ],
  };
}
