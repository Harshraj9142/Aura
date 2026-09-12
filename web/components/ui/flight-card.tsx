import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FlightCardProps {
  airline: {
    name: string;
    logo: string;
    flightNumber: string;
  };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency?: string;
  offer?: string;
  refundableType: string;
  onBook?: () => void;
  onFlightDetails?: () => void;
  className?: string;
}

const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const FlightCard: React.FC<FlightCardProps> = ({
  airline,
  departureTime,
  arrivalTime,
  duration,
  stops,
  price,
  currency = "INR",
  offer,
  refundableType,
  onBook,
  onFlightDetails,
  className,
}) => {
  const stopText = stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`;

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 shadow-sm hover:border-slate-700 transition-all p-5",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 text-[11px]">
          {refundableType}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 md:gap-x-6 items-center">
        {/* Airline Info */}
        <div className="md:col-span-4 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
              <img src={airline.logo} alt={`${airline.name} logo`} className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">{airline.name}</p>
              <p className="text-xs text-slate-400 font-mono">{airline.flightNumber}</p>
            </div>
          </div>
          <button
            type="button"
            className="text-left text-xs text-emerald-400 hover:text-emerald-300 mt-2 font-medium"
            onClick={onFlightDetails}
          >
            Flight Details
          </button>
        </div>

        {/* Timeline */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="text-center">
            <p className="font-bold text-lg text-slate-100 font-mono">{departureTime}</p>
          </div>
          <div className="flex-grow text-center">
            <p className="text-xs text-slate-400">{duration}</p>
            <div className="relative w-full h-px bg-slate-800 my-1">
              <div className="absolute top-1/2 left-0 w-full h-px flex items-center justify-center -translate-y-1/2">
                {stops > 0 && <div className="w-2 h-2 rounded-full bg-emerald-400 border border-slate-950"></div>}
              </div>
            </div>
            <p className="text-[11px] font-medium text-emerald-400">{stopText}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-slate-100 font-mono">{arrivalTime}</p>
          </div>
        </div>

        {/* Pricing and Booking */}
        <div className="md:col-span-4 flex flex-col md:items-end gap-1.5">
          <p className="text-2xl font-black text-slate-100 font-mono">{formatCurrency(price, currency)}</p>
          {offer && <p className="text-xs text-emerald-400 font-medium text-right">{offer}</p>}
          <Button onClick={onBook} className="w-full md:w-auto mt-1" size="sm">
            Book Flight
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
