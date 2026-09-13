"use client";

import React from "react";
import Image from "next/image";
import { Fare } from "@/types/fare";
import AirlineLogo, { resolveAirline } from "@/components/AirlineLogo";
import { Luggage, Clock, CheckCircle2, ChevronRight } from "lucide-react";

// City code to full name mapping
const CITY_NAMES: Record<string, string> = {
  BOM: "MUMBAI",
  BLR: "BENGALURU",
  DEL: "NEW DELHI",
  CCU: "KOLKATA",
  HYD: "HYDERABAD",
  MAA: "CHENNAI",
  AMD: "AHMEDABAD",
  PNQ: "PUNE",
  GOI: "GOA",
  COK: "KOCHI",
  JAI: "JAIPUR",
  TRV: "THIRUVANANTHAPURAM",
  GAU: "GUWAHATI",
  IXC: "CHANDIGARH",
};

interface CarrierConfig {
  name: string;
  codePrefix: string;
  aircraftModel: string;
  image: string;
  brandColor: string;
  badgeStyle: string;
  cabinBg: string;
  checkInAllowance: string;
  seatNumber: string;
}

const CARRIER_CONFIGS: Record<string, CarrierConfig> = {
  indigo: {
    name: "IndiGo",
    codePrefix: "6E",
    aircraftModel: "AIRBUS A320NEO",
    image: "/planes/indigo_plane.jpg",
    brandColor: "#001B94",
    badgeStyle: "bg-blue-50 text-blue-800 border-blue-200",
    cabinBg: "7 kg cabin",
    checkInAllowance: "15 kg check-in",
    seatNumber: "18A",
  },
  airindia: {
    name: "Air India",
    codePrefix: "AI",
    aircraftModel: "BOEING 787 DREAMLINER",
    image: "/planes/airindia_plane.jpg",
    brandColor: "#D91C1C",
    badgeStyle: "bg-red-50 text-red-800 border-red-200",
    cabinBg: "7 kg cabin",
    checkInAllowance: "25 kg check-in",
    seatNumber: "12F",
  },
  aix: {
    name: "Air India Express",
    codePrefix: "IX",
    aircraftModel: "BOEING 737 MAX 8",
    image: "/planes/aix_plane.jpg",
    brandColor: "#FF5B00",
    badgeStyle: "bg-orange-50 text-orange-800 border-orange-200",
    cabinBg: "7 kg cabin",
    checkInAllowance: "15 kg check-in",
    seatNumber: "22C",
  },
  akasa: {
    name: "Akasa Air",
    codePrefix: "QP",
    aircraftModel: "BOEING 737 MAX 8",
    image: "/planes/akasa_plane.jpg",
    brandColor: "#7E22CE",
    badgeStyle: "bg-purple-50 text-purple-800 border-purple-200",
    cabinBg: "7 kg cabin",
    checkInAllowance: "15 kg check-in",
    seatNumber: "14D",
  },
  spicejet: {
    name: "SpiceJet",
    codePrefix: "SG",
    aircraftModel: "BOEING 737-800",
    image: "/planes/spicejet_plane.jpg",
    brandColor: "#C8102E",
    badgeStyle: "bg-rose-50 text-rose-800 border-rose-200",
    cabinBg: "7 kg cabin",
    checkInAllowance: "15 kg check-in",
    seatNumber: "09B",
  },
  vistara: {
    name: "Vistara",
    codePrefix: "UK",
    aircraftModel: "AIRBUS A321NEO",
    image: "/planes/vistara_plane.jpg",
    brandColor: "#4C1D95",
    badgeStyle: "bg-purple-100 text-purple-900 border-purple-300",
    cabinBg: "7 kg cabin",
    checkInAllowance: "15 kg check-in",
    seatNumber: "04A",
  },
};

interface BoardingPassFareCardProps {
  fare: Fare;
  onViewDetails?: (fare: Fare) => void;
}

export function BoardingPassFareCard({ fare, onViewDetails }: BoardingPassFareCardProps) {
  const airlineMeta = resolveAirline(fare.carrier, fare.flight_number);
  const airlineId = airlineMeta?.id || "indigo";
  const config = CARRIER_CONFIGS[airlineId] || CARRIER_CONFIGS.indigo;

  // Calculate flight timing details based on fare id
  const hash = (fare.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const depHour = 6 + (hash % 14);
  const depMin = (hash % 4) * 15;
  const durationMins = 120 + (hash % 90);

  const depDate = new Date(fare.travel_date || Date.now());
  depDate.setHours(depHour, depMin);
  const arrDate = new Date(depDate.getTime() + durationMins * 60000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const formatDateStr = (d: Date) =>
    d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const durationStr = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
  const origName = CITY_NAMES[fare.route_origin] || fare.route_origin;
  const destName = CITY_NAMES[fare.route_destination] || fare.route_destination;

  const baseFareCalculated = fare.base_fare || Math.round(fare.total_fare * 0.82);
  const flightCodeFormatted = fare.flight_number || `${config.codePrefix}-${400 + (hash % 500)}`;

  return (
    <div className="group relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row items-stretch select-none">
      
      {/* ── LEFT TICKET BODY (Main Boarding Pass Body) ────────────────────────── */}
      <div className="flex-1 p-6 flex flex-col justify-between space-y-5 bg-white relative">
        
        {/* 1. Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
              <AirlineLogo airline={fare.carrier} flightNumber={fare.flight_number} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-950">{config.name}</span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {flightCodeFormatted}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DOMESTIC FLIGHT PASS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase border bg-slate-50 text-slate-700 border-slate-200">
              BOARDING PASS
            </span>
            {fare.is_outlier ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Outlier
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* 2. Middle Row: Aircraft Photo + Model & Baggage Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          
          {/* Aircraft Photo Frame (Reference 1 Match) */}
          <div className="relative w-full sm:w-36 h-32 rounded-2xl overflow-hidden border border-slate-200/80 shrink-0 bg-slate-100 shadow-xs">
            <Image
              src={config.image}
              alt={`${config.name} Aircraft`}
              fill
              sizes="(max-width: 640px) 100vw, 150px"
              className="object-cover object-center"
            />
          </div>

          {/* Aircraft Model & Baggage Info Stack */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Aircraft Model</span>
                <h3 className="text-lg font-black text-slate-950 tracking-tight uppercase">
                  {config.aircraftModel}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badgeStyle}`}>
                  {config.name.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Baggage & Advance Booking Badges (Reference 1 Match) */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Luggage className="w-4 h-4 text-slate-500" />
                <span>{config.cabinBg}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Luggage className="w-4 h-4 text-slate-500" />
                <span>{config.checkInAllowance}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Advance: <strong className="text-slate-900 font-bold">{fare.advance_purchase_days} days</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Route Details Line (MUMBAI BOM ── ✈ ── BENGALURU BLR) */}
        <div className="flex items-center justify-between pt-2">
          
          {/* Origin */}
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">{origName}</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 tracking-tight">{fare.route_origin}</span>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{formatTime(depDate)}</div>
            <div className="text-[10px] font-semibold text-slate-400">{formatDateStr(depDate)}</div>
          </div>

          {/* Flight Path Graphic */}
          <div className="flex-1 px-6 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center gap-1">
              <div className="h-[2px] flex-1 bg-slate-300 rounded-full relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300 shadow-xs flex items-center justify-center text-slate-800">
                  <svg className="w-3.5 h-3.5 transform rotate-90 fill-current" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-700 mt-2 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200">
              {durationStr}
            </span>
          </div>

          {/* Destination */}
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">{destName}</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 tracking-tight">{fare.route_destination}</span>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{formatTime(arrDate)}</div>
            <div className="text-[10px] font-semibold text-slate-400">{formatDateStr(arrDate)}</div>
          </div>

        </div>

      </div>

      {/* ── DOTTED PERFORATED TEAR LINE WITH PHYSICAL PUNCH HOLES ─────────────── */}
      <div className="hidden lg:block relative w-0 border-r-2 border-dashed border-slate-200">
        <div className="absolute -top-3.5 -left-[11px] w-6 h-6 rounded-full bg-[#08080D] border border-slate-800 z-30" />
        <div className="absolute -bottom-3.5 -left-[11px] w-6 h-6 rounded-full bg-[#08080D] border border-slate-800 z-30" />
      </div>

      {/* ── RIGHT PERFORATED TEAR STUB (FARES & BARCODE) ───────────────────────── */}
      <div className="p-6 bg-slate-50/70 flex flex-col justify-between space-y-4 w-full lg:w-64 shrink-0 relative select-none">
        
        {/* Top Seat & Flight Info */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase block">FLIGHT</span>
            <span className="text-xs font-black font-mono text-slate-950">{flightCodeFormatted}</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase block">SEAT</span>
            <span className="text-xs font-black font-mono text-slate-950">{config.seatNumber}</span>
          </div>
        </div>

        {/* Price & Base Breakdown */}
        <div className="space-y-1 my-auto">
          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">TOTAL FARE</span>
          <div className="text-3xl font-black font-mono text-slate-950 tracking-tight">
            ₹{Number(fare.total_fare).toLocaleString("en-IN")}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Base: ₹{Number(baseFareCalculated).toLocaleString("en-IN")}
          </div>
        </div>

        {/* SVG PDF417 2D Barcode */}
        <div className="space-y-3 pt-1">
          <div className="w-full h-11 bg-slate-900 rounded-xl p-1.5 flex items-center justify-between opacity-95">
            <svg viewBox="0 0 200 40" className="w-full h-full text-white fill-current">
              <rect x="0" y="0" width="4" height="40" />
              <rect x="6" y="0" width="2" height="40" />
              <rect x="10" y="0" width="8" height="40" />
              <rect x="20" y="0" width="2" height="40" />
              <rect x="24" y="0" width="6" height="40" />
              <rect x="32" y="0" width="4" height="40" />
              <rect x="38" y="0" width="2" height="40" />
              <rect x="42" y="0" width="10" height="40" />
              <rect x="54" y="0" width="2" height="40" />
              <rect x="58" y="0" width="6" height="40" />
              <rect x="66" y="0" width="4" height="40" />
              <rect x="72" y="0" width="8" height="40" />
              <rect x="82" y="0" width="2" height="40" />
              <rect x="86" y="0" width="6" height="40" />
              <rect x="94" y="0" width="4" height="40" />
              <rect x="100" y="0" width="2" height="40" />
              <rect x="104" y="0" width="10" height="40" />
              <rect x="116" y="0" width="2" height="40" />
              <rect x="120" y="0" width="6" height="40" />
              <rect x="128" y="0" width="4" height="40" />
              <rect x="134" y="0" width="8" height="40" />
              <rect x="144" y="0" width="2" height="40" />
              <rect x="148" y="0" width="6" height="40" />
              <rect x="156" y="0" width="4" height="40" />
              <rect x="162" y="0" width="2" height="40" />
              <rect x="166" y="0" width="10" height="40" />
              <rect x="178" y="0" width="4" height="40" />
              <rect x="184" y="0" width="2" height="40" />
              <rect x="188" y="0" width="8" height="40" />
              <rect x="198" y="0" width="2" height="40" />
            </svg>
          </div>

          <button
            onClick={() => onViewDetails?.(fare)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

      </div>

    </div>
  );
}
