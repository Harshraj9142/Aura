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
  | 'other';

export interface GrievanceAnswers {
  airlineId: AirlineId;
  category: GrievanceCategory;
  durationOption?: string | null;
  flightTimeOption?: '<1hr' | '1-2hr' | '>2hr' | null;
  assistanceOption?: 'none' | 'refreshments' | 'hotel_alternate' | null;
  customIssueText?: string;
  pnr?: string;
  flightNumber?: string;
  travelDate?: string;
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
    exactText?: string;
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
    exactText: string;
    url: string;
  }[];
  steps: ActionStep[];
  compensationBasis?: string;
  refundSummary?: string;
  freeCareSummary?: string;
  isAiCurated?: boolean;
  aiProviderUsed?: 'gemini' | 'groq' | 'template';
  customDraftNotice?: string;
}

export interface AirlineInfo {
  id: AirlineId;
  name: string;
  shortName: string;
  code: string;
  tagline: string;
  logoBg: string;
  logoUrl: string;
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
