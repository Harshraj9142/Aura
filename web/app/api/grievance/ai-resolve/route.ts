import { NextRequest, NextResponse } from 'next/server';
import { AirlineId, StatutoryEntitlement } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY } from '@/lib/grievance/airline-contacts';
import { getStraightSolution } from '@/lib/grievance/grievance-rules';

interface AiResolveRequest {
  airlineId: AirlineId;
  userDescription: string;
  pnr?: string;
  flightNumber?: string;
  travelDate?: string;
}

const SYSTEM_PROMPT = `You are the Lead Legal Counsel & Regulatory Enforcement Officer specializing in Indian Civil Aviation Law and Passenger Rights.
Your role is to analyze a passenger's dispute with an Indian commercial airline and output a rigorous, legally sound, step-by-step statutory enforcement plan under Indian civil aviation regulations.

REGULATORY KNOWLEDGE BASE YOU MUST ENFORCE:
1. DGCA Civil Aviation Requirements (CAR), Section 3 - Air Transport:
   - Series M, Part I: Carriage by Air of Persons with Disabilities and/or Reduced Mobility (free wheelchair, no discriminatory charges, accessible assistance).
   - Series M, Part II: Refund of Airline Tickets to Passengers (Clause 3.3: 7-day card refund rule; Clause 3.4: 100% statutory tax refund including UDF/PSF/ADF even on zero-refund tickets; Clause 3.5: credit shell only on passenger consent; prohibition on excessive cancellation charges).
   - Series M, Part IV: Facilities to be provided by airlines due to Denied Boarding, Cancellation, and Delays:
     - Denied Boarding (Clause 3.2): 200% base fare up to ₹10,000 (alternate <24h) or 400% base fare up to ₹20,000 (alternate >24h or refund).
     - Cancellation (Clause 3.3): 2-week notice rule; <24h notice mandates ₹5,000 (<1h block time), ₹7,500 (1-2h block time), or ₹10,000 (>2h block time) compensation + 100% refund.
     - Delays (Clause 3.4): Free meals/refreshments for delays >2h; >6h delay mandates 100% refund option; overnight delay mandates free hotel accommodation + airport transfers.
     - Redressal Timeline (Clause 3.9): Mandatory 10-day resolution by Airline Nodal Officer.
   - Series M, Part V: Facilitation to be provided to passengers in case of cancellation/delay (unbundled services, seat selection/web check-in clarity).
2. The Carriage by Air Act, 1972 & The Montreal Convention (1999):
   - Checked baggage loss/damage (Article 17 & 22): Domestic liability up to ₹20,000; International liability up to 1,288 SDRs (~₹1.4 Lakh).
   - Article 31 notice deadlines: 7 days for damage, 21 days for baggage delay.
3. Consumer Protection Act, 2019 (Section 2(11) Deficiency of Service & Section 2(47) Unfair Trade Practice; Section 35 e-Daakhil filing for mental agony and punitive compensation).
4. Ministry of Civil Aviation AirSewa Grievance Redressal Portal.

INSTRUCTIONS:
You will receive the passenger's dispute, chosen airline, and travel details.
You must return a strictly valid JSON object matching the StatutoryEntitlement format below.
Do not wrap your response in markdown fences (\`\`\`json). Output pure JSON.

JSON SCHEMA:
{
  "headline": "Short, powerful entitlement headline (e.g. Full Restitution of ₹3,500 Unlawful Fee + Statutory Redressal)",
  "compensationAmount": "Exact statutory remedy or reimbursement demand",
  "cashHighlight": "Specific financial restitution rights citing DGCA or Consumer Protection Act",
  "careHighlight": "Duty of care, assistance, or operational relief mandated",
  "refundHighlight": "Refund rights for disputed amounts, tickets, or illegal deductions",
  "primaryClauses": [
    {
      "name": "Act or CAR Regulation Name",
      "clause": "Specific Section / Clause Number",
      "exactText": "Verbatim or precise legal text explaining why the airline breached regulations",
      "url": "Official URL (e.g. https://www.civilaviation.gov.in/ministry-documents/passenger-charter-of-rights or airline CoC)"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "stage": "Immediate Action / Counter / Documentation",
      "timeframe": "Immediate / Day 1",
      "icon": "📍",
      "title": "Clear action title",
      "shortAction": "Concrete instructions on what evidence to gather or notice to submit",
      "clauseCitation": {
        "label": "DGCA CAR Citation",
        "url": "https://www.civilaviation.gov.in",
        "docName": "Statutory Document Name",
        "exactText": "Supporting statutory rule"
      },
      "contactInfo": {
        "label": "Contact Name",
        "email": "airline nodal/support email",
        "phone": "phone number if available"
      }
    },
    {
      "stepNumber": 2,
      "stage": "Notice to Nodal Officer",
      "timeframe": "Within 24-48 Hours",
      "icon": "✉️",
      "title": "Serve Formal Notice to Nodal Officer",
      "shortAction": "Send formal demand with 10-day statutory countdown",
      "clauseCitation": {
        "label": "DGCA CAR Series M Part IV Clause 3.9.1",
        "url": "https://www.civilaviation.gov.in",
        "docName": "DGCA Passenger Redressal Mandate",
        "exactText": "Statutory 10-day resolution obligation"
      },
      "contactInfo": {
        "label": "Nodal Officer",
        "email": "nodal email"
      }
    },
    {
      "stepNumber": 3,
      "stage": "Appellate Escalation",
      "timeframe": "Day 11 (If Unresolved)",
      "icon": "⚖️",
      "title": "Escalate to Airline Appellate Authority",
      "shortAction": "Forward unresolved claim to Appellate Authority",
      "clauseCitation": {
        "label": "DGCA CAR Section 3",
        "url": "https://www.civilaviation.gov.in",
        "docName": "DGCA Regulations",
        "exactText": "Appellate redressal mechanism"
      },
      "contactInfo": {
        "label": "Appellate Authority",
        "email": "appellate email"
      }
    },
    {
      "stepNumber": 4,
      "stage": "Government & Consumer Court",
      "timeframe": "Day 16+",
      "icon": "🏛️",
      "title": "Lodge Complaint on AirSewa & e-Daakhil",
      "shortAction": "File complaint on Ministry AirSewa portal and submit petition on e-Daakhil for deficiency of service and compensation.",
      "clauseCitation": {
        "label": "Consumer Protection Act 2019 Section 35",
        "url": "https://edaakhil.nic.in",
        "docName": "National Consumer Disputes Redressal",
        "exactText": "Remedy for deficiency of service and mental agony without advocate fees"
      },
      "contactInfo": {
        "label": "AirSewa Portal",
        "url": "https://airsewa.gov.in"
      }
    }
  ],
  "customDraftNotice": "A complete, formal, pre-drafted legal notice text ready to email to the airline Nodal Officer with date, PNR, flight number, precise grievance facts, exact cited statutory clauses, 10-day ultimatum, and warning of AirSewa / e-Daakhil proceedings."
}`;

/**
 * Call Google Gemini API (Primary)
 */
async function callGemini(promptText: string, apiKey: string): Promise<StatutoryEntitlement | null> {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUSER DISPUTE INPUT:\n${promptText}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(15000), // 15s timeout
        }
      );

      if (!response.ok) {
        console.warn(`Gemini (${model}) failed with status ${response.status}: ${await response.text()}`);
        continue;
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned) as StatutoryEntitlement;
        parsed.isAiCurated = true;
        parsed.aiProviderUsed = 'gemini';
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini (${model}) error:`, err);
    }
  }

  return null;
}

/**
 * Call Groq API (Backup Failover)
 */
async function callGroq(promptText: string, apiKey: string): Promise<StatutoryEntitlement | null> {
  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound-mini'];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `USER DISPUTE INPUT:\n${promptText}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.warn(`Groq (${model}) failed with status ${response.status}: ${await response.text()}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned) as StatutoryEntitlement;
        parsed.isAiCurated = true;
        parsed.aiProviderUsed = 'groq';
        return parsed;
      }
    } catch (err) {
      console.warn(`Groq (${model}) error:`, err);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body: AiResolveRequest = await req.json();
    const { airlineId, userDescription, pnr, flightNumber, travelDate } = body;

    if (!airlineId || !userDescription?.trim()) {
      return NextResponse.json(
        { error: 'Airline and issue description are required.' },
        { status: 400 }
      );
    }

    const airline = AIRLINE_DIRECTORY[airlineId] || AIRLINE_DIRECTORY.indigo;

    const userPrompt = `AIRLINE DETAILS:
- Name: ${airline.name} (${airline.code})
- Nodal Officer Email: ${airline.nodalOfficer.email}
- Nodal Officer Phone: ${airline.nodalOfficer.phone}
- Nodal Officer Address: ${airline.nodalOfficer.address}
- Appellate Authority Email: ${airline.appellateAuthority.email}
- Customer Care Phone: ${airline.customerCare.phone}
- Official Conditions of Carriage URL: ${airline.officialCocUrl}

PASSENGER DISPUTE STATEMENT:
"${userDescription.trim()}"

TRAVEL PARTICULARS:
- PNR / Booking Reference: ${pnr?.trim() || '[PNR NUMBER]'}
- Flight Number: ${flightNumber?.trim() || '[FLIGHT NUMBER]'}
- Travel Date: ${travelDate?.trim() || '[TRAVEL DATE]'}

Please formulate the complete statutory entitlement, quoted DGCA clauses, 4-step action stepper, and customized pre-filled legal notice letter for this passenger.`;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const groqKey = (process.env.GROQ_API_KEY || process.env.BROCK_API_KEY)?.trim();

    // 1. Try Gemini (Primary)
    if (geminiKey) {
      const geminiResult = await callGemini(userPrompt, geminiKey);
      if (geminiResult) {
        return NextResponse.json({
          success: true,
          provider: 'gemini',
          entitlement: geminiResult,
        });
      }
    }

    // 2. Try Groq (Backup Failover)
    if (groqKey) {
      const groqResult = await callGroq(userPrompt, groqKey);
      if (groqResult) {
        return NextResponse.json({
          success: true,
          provider: 'groq',
          entitlement: groqResult,
        });
      }
    }

    // 3. Graceful Fallback if keys are not yet configured or APIs are unreachable
    const fallbackEntitlement = getStraightSolution({
      airlineId,
      category: 'other',
      customIssueText: userDescription,
      pnr,
      flightNumber,
      travelDate,
    });

    return NextResponse.json({
      success: true,
      provider: 'template',
      keysConfigured: Boolean(geminiKey || groqKey),
      message:
        !geminiKey && !groqKey
          ? 'API keys (GEMINI_API_KEY / GROQ_API_KEY) are not yet configured in .env.local. Showing statutory baseline template.'
          : 'AI service temporarily unavailable. Showing statutory baseline template.',
      entitlement: {
        ...fallbackEntitlement,
        isAiCurated: false,
        aiProviderUsed: 'template',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/grievance/ai-resolve:', err);
    return NextResponse.json(
      { error: 'Failed to process dispute', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
