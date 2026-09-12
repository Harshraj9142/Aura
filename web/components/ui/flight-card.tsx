import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AirlineLogo from "@/components/AirlineLogo";

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
        "w-full rounded-2xl border border-black/5 bg-white text-[#08080D] shadow-xs hover:shadow-md transition-all p-6",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className="bg-[#F3F6F7] border-black/5 text-[#08080D]/70 text-[11px] font-medium rounded-full px-3 py-0.5">
          {refundableType}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 md:gap-x-6 items-center">
        {/* Airline Info */}
        <div className="md:col-span-4 flex flex-col">
          <div className="flex items-center gap-3">
            <AirlineLogo airline={airline.name} flightNumber={airline.flightNumber} size="lg" />
            <div>
              <p className="font-heading text-base font-bold text-[#08080D]">{airline.name}</p>
              <p className="text-xs text-[#08080D]/60 font-mono">{airline.flightNumber}</p>
            </div>
          </div>
          <button
            type="button"
            className="text-left text-xs text-[#08080D] hover:underline mt-2 font-medium"
            onClick={onFlightDetails}
          >
            Flight Details
          </button>
        </div>

        {/* Timeline */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="text-center">
            <p className="font-bold text-xl text-[#08080D] font-mono">{departureTime}</p>
          </div>
          <div className="flex-grow text-center">
            <p className="text-xs text-[#08080D]/60 font-medium">{duration}</p>
            <div className="relative w-full h-px bg-slate-200 my-1.5">
              <div className="absolute top-1/2 left-0 w-full h-px flex items-center justify-center -translate-y-1/2">
                {stops > 0 && <div className="w-2.5 h-2.5 rounded-full bg-[#08080D] border-2 border-white"></div>}
              </div>
            </div>
            <p className="text-[11px] font-semibold text-[#08080D]">{stopText}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-[#08080D] font-mono">{arrivalTime}</p>
          </div>
        </div>

        {/* Pricing and Booking */}
        <div className="md:col-span-4 flex flex-col md:items-end gap-1.5">
          <p className="text-2xl font-black text-[#08080D] font-mono">{formatCurrency(price, currency)}</p>
          {offer && <p className="text-xs text-emerald-700 font-medium text-right">{offer}</p>}
          <Button variant="darkPill" onClick={onBook} className="w-full md:w-auto mt-2" size="sm">
            <span>Book Flight</span>
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
