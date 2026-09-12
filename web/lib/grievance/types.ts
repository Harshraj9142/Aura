export type AirlineId =
  | 'indigo'
  | 'airindia'
  | 'vistara'
  | 'akasa'
  | 'aix'
  | 'spicejet';

export type GrievanceCategory =
  | 'cancellation'
  | 'delay'
  | 'denied_boarding'
  | 'baggage'
  | 'refund'
  | 'downgrade'
  | 'medical_prm';

export interface AirlineInfo {
  id: AirlineId;
  name: string;
  code: string;
  tagline: string;
  logoBg: string;
  brandColor: string;
  officialCocUrl: string;
  officialCharterUrl: string;
  officialSupportUrl: string;
  nodalOfficer: {
    name?: string;
    email: string;
    phone: string;
    address: string;
    turnaround: string;
  };
  appellateAuthority: {
    name?: string;
    email: string;
    phone?: string;
    turnaround: string;
  };
  customerCare: {
    phone: string;
    email: string;
    chatUrl?: string;
  };
}

export interface OptionChoice {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

export interface QuestionStep {
  id: string;
  title: string;
  subtitle: string;
  options: OptionChoice[];
}

export interface WizardAnswers {
  airlineId?: AirlineId;
  category?: GrievanceCategory;
  flightType?: 'domestic' | 'international';
  // Context questions
  timing?: string;
  alternateFlight?: string;
  delayDuration?: string;
  mealsOffered?: string;
  volunteerDenied?: string;
  baggageIssueType?: string;
  pirFiled?: string;
  bookingChannel?: string;
  refundDays?: string;
  downgradeType?: string;
  // Passenger flight details for draft
  passengerName?: string;
  pnr?: string;
  flightNumber?: string;
  travelDate?: string;
  origin?: string;
  destination?: string;
  ticketFare?: string;
}

export interface StatutoryEntitlement {
  headline: string;
  compensationAmount: string;
  compensationBasis: string;
  freeServices: string[];
  refundRights: string;
  dgcaClause: string;
  legalRightsSummary: string;
  immediateAirportActions: string[];
  airlinePolicyNotes: string;
  officialReferenceUrls: {
    title: string;
    url: string;
  }[];
}
