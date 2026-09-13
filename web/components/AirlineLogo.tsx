import React from 'react';

interface AirlineMeta {
  id: string;
  name: string;
  code: string;
  logo: string;
  alt: string;
}

const AIRLINE_MAP: Record<string, AirlineMeta> = {
  indigo: {
    id: 'indigo',
    name: 'IndiGo',
    code: '6E',
    logo: '/airlines/indigo.png',
    alt: 'IndiGo Logo',
  },
  airindia: {
    id: 'airindia',
    name: 'Air India',
    code: 'AI',
    logo: '/airlines/airindia.png',
    alt: 'Air India Logo',
  },
  vistara: {
    id: 'vistara',
    name: 'Vistara',
    code: 'UK',
    logo: '/airlines/vistara.png',
    alt: 'Vistara Logo',
  },
  akasa: {
    id: 'akasa',
    name: 'Akasa Air',
    code: 'QP',
    logo: '/airlines/akasa.png',
    alt: 'Akasa Air Logo',
  },
  spicejet: {
    id: 'spicejet',
    name: 'SpiceJet',
    code: 'SG',
    logo: '/airlines/spicejet.png',
    alt: 'SpiceJet Logo',
  },
  aix: {
    id: 'aix',
    name: 'Air India Express',
    code: 'IX',
    logo: '/airlines/aix.png',
    alt: 'Air India Express Logo',
  },
};

export function resolveAirline(
  carrier?: string | null,
  flightNumber?: string | null
): AirlineMeta | null {
  const c = (carrier || '').trim().toLowerCase();
  const f = (flightNumber || '').trim().toUpperCase();

  // 1. Explicit ID matches
  if (c === 'indigo' || c === '6e' || f.startsWith('6E')) return AIRLINE_MAP.indigo;
  if (c.includes('express') || c === 'aix' || c === 'ix' || f.startsWith('IX')) return AIRLINE_MAP.aix;
  if (c === 'air india' || c === 'airindia' || c === 'ai' || f.startsWith('AI')) return AIRLINE_MAP.airindia;
  if (c === 'vistara' || c === 'uk' || f.startsWith('UK')) return AIRLINE_MAP.vistara;
  if (c.includes('akasa') || c === 'qp' || f.startsWith('QP')) return AIRLINE_MAP.akasa;
  if (c.includes('spice') || c === 'sg' || f.startsWith('SG')) return AIRLINE_MAP.spicejet;

  // 2. Partial substring search
  if (c.includes('indi') || c.includes('go')) return AIRLINE_MAP.indigo;
  if (c.includes('vistar')) return AIRLINE_MAP.vistara;
  if (c.includes('india')) return AIRLINE_MAP.airindia;

  return null;
}

export interface AirlineLogoProps {
  airline?: string | null;
  flightNumber?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

const SIZE_CLASSES = {
  xs: {
    box: 'w-6 h-6 min-w-[24px] rounded-md p-0.5',
    img: 'max-h-full max-w-full',
    text: 'text-[10px]',
  },
  sm: {
    box: 'w-9 h-9 min-w-[36px] rounded-lg p-0.5',
    img: 'max-h-full max-w-full',
    text: 'text-xs',
  },
  md: {
    box: 'w-12 h-12 min-w-[48px] rounded-xl p-1',
    img: 'max-h-full max-w-full',
    text: 'text-sm font-semibold',
  },
  lg: {
    box: 'w-14 h-14 min-w-[56px] rounded-xl p-1',
    img: 'max-h-full max-w-full',
    text: 'text-base font-bold',
  },
  xl: {
    box: 'w-20 h-20 min-w-[80px] rounded-2xl p-1.5',
    img: 'max-h-full max-w-full',
    text: 'text-lg font-bold',
  },
};

export default function AirlineLogo({
  airline,
  flightNumber,
  size = 'md',
  className = '',
  showName = false,
}: AirlineLogoProps) {
  const meta = resolveAirline(airline, flightNumber);
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const logoNode = meta ? (
    <div
      className={`inline-flex items-center justify-center bg-transparent flex-shrink-0 ${sizeConfig.box} ${className}`}
      title={`${meta.name} (${meta.code})`}
    >
      <img
        src={meta.logo}
        alt={meta.alt}
        className={`w-full h-full object-contain mix-blend-multiply pointer-events-none select-none ${sizeConfig.img}`}
        loading="eager"
      />
    </div>
  ) : (
    <div
      className={`inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold border border-slate-200 flex-shrink-0 uppercase ${sizeConfig.box} ${className}`}
      title={airline || flightNumber || 'Flight'}
    >
      <span className="text-xs leading-none tracking-tight truncate">
        {(airline || flightNumber || 'FL').slice(0, 2).toUpperCase()}
      </span>
    </div>
  );

  if (showName) {
    return (
      <div className="inline-flex items-center gap-2.5">
        {logoNode}
        <span className={`text-slate-900 font-bold ${sizeConfig.text}`}>
          {meta ? meta.name : airline || flightNumber || 'Airline'}
        </span>
      </div>
    );
  }

  return logoNode;
}
