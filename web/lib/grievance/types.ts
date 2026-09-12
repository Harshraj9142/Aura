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
  | 'downgrade';

export interface GrievanceAnswers {
  airlineId: AirlineId;
  category: GrievanceCategory;
  durationOption: string;
  flightTimeOption: '<1hr' | '1-2hr' | '>2hr';
  assistanceOption: 'none' | 'refreshments' | 'hotel_alternate';
}

export interface ActionStep {
  stepNumber: number;
  stage: string;
  timeframe: string;
  title: string;
  shortAction: string;
  description?: string;
  bulletPoints?: string[];
  icon: string;
  clauseCitation: {
    label: string;
    url: string;
    docName: string;
  };
  contactInfo?: {
    label: string;
    email?: string;
    phone?: string;
    url?: string;
  };
}

export interface StatutoryEntitlement {
  headline: string;
  compensationAmount: string;
  cashHighlight: string;
  careHighlight: string;
  refundHighlight: string;
  primaryClauses: {
    name: string;
    clause: string;
    url: string;
  }[];
  steps: ActionStep[];
  compensationBasis?: string;
  refundSummary?: string;
  freeCareSummary?: string;
}

export interface AirlineInfo {
  id: AirlineId;
  name: string;
  shortName: string;
  code: string;
  tagline: string;
  logoBg: string;
  officialCocUrl: string;
  officialCharterUrl: string;
  officialSupportUrl: string;
  nodalOfficer: {
    email: string;
    phone: string;
    address: string;
  };
  appellateAuthority: {
    email: string;
  };
  customerCare: {
    phone: string;
    email: string;
  };
}
