import React from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarUrl?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  className,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl bg-[#F3F6F7] p-8 text-[#08080D] transition-all duration-300 hover:shadow-md border border-black/5",
        className
      )}
    >
      <div>
        <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#08080D] text-white">
          <Quote className="h-5 w-5 fill-current" />
        </div>
        <p className="font-body text-base md:text-lg text-[#08080D]/90 font-normal leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={author}
            className="h-11 w-11 rounded-full object-cover border border-black/10"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#08080D] text-sm font-bold text-white uppercase">
            {author.charAt(0)}
          </div>
        )}
        <div>
          <h4 className="font-heading text-sm font-bold text-[#08080D]">
            {author}
          </h4>
          <p className="text-xs text-[#08080D]/60 font-medium">{role}</p>
        </div>
      </div>
    </div>
  );
}
