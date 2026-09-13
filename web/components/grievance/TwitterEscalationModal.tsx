'use client';

import React, { useState, useEffect } from 'react';
import { AirlineId, GrievanceCategory } from '@/lib/grievance/types';
import { AIRLINE_DIRECTORY, AUTHORITY_TWITTER_HANDLES } from '@/lib/grievance/airline-contacts';
import { buildGrievanceTweet, buildTwitterIntentUrl } from '@/lib/grievance/twitter-format';
import {
  X,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface TwitterEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  airlineId: AirlineId;
  category: GrievanceCategory;
  initialPnr?: string;
  initialFlightNumber?: string;
  initialTravelDate?: string;
}

export function TwitterEscalationModal({
  isOpen,
  onClose,
  airlineId,
  category,
  initialPnr = '',
  initialFlightNumber = '',
  initialTravelDate = '',
}: TwitterEscalationModalProps) {
  const [pnr, setPnr] = useState(initialPnr);
  const [flightNumber, setFlightNumber] = useState(initialFlightNumber);
  const [travelDate, setTravelDate] = useState(initialTravelDate);
  const [maskPnr, setMaskPnr] = useState(false);

  const [tweetText, setTweetText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diagnosticMsg, setDiagnosticMsg] = useState<string | null>(null);

  const airline = AIRLINE_DIRECTORY[airlineId] || AIRLINE_DIRECTORY.indigo;

  // Re-generate tweet when parameters change (unless user manually customized)
  useEffect(() => {
    if (!isEditing) {
      const generated = buildGrievanceTweet({
        airlineId,
        category,
        pnr,
        flightNumber,
        travelDate,
        maskPnr,
      });
      setTweetText(generated);
    }
  }, [airlineId, category, pnr, flightNumber, travelDate, maskPnr, isEditing]);

  if (!isOpen) return null;

  const charCount = tweetText.length;
  const isOverLimit = charCount > 280;
  const intentUrl = buildTwitterIntentUrl(tweetText);

  const handlePublish = async () => {
    setLoading(true);
    setErrorMsg(null);
    setDiagnosticMsg(null);

    try {
      const res = await fetch('/api/grievance/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airlineId,
          category,
          pnr,
          flightNumber,
          travelDate,
          maskPnr,
          customTweetText: tweetText,
        }),
      });

      const data = await res.json();

      if (data.success && data.tweetUrl) {
        setPublishedUrl(data.tweetUrl);
      } else {
        setErrorMsg(data.error || 'Twitter API rejected the tweet');
        if (data.diagnostic) {
          setDiagnosticMsg(data.diagnostic);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to communicate with Twitter API');
      setDiagnosticMsg('Network or configuration error connecting to api.twitter.com');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tweetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Public Escalation on X (Twitter)
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  {AUTHORITY_TWITTER_HANDLES.advocacy}
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Hold <span className="text-neutral-200 font-semibold">{airline.name}</span> publicly accountable before regulators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful Tweet Card */}
        {publishedUrl ? (
          <div className="my-6 p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-semibold text-emerald-300">
                Grievance Published Successfully!
              </h4>
              <p className="text-xs text-emerald-200/80">
                The tweet is live from {AUTHORITY_TWITTER_HANDLES.advocacy} tagging {airline.twitterHandle} and civil aviation authorities.
              </p>
            </div>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-900/30"
            >
              View Live Tweet on X
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-5 my-4">
            {/* Passenger Flight Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Flight Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6E-204"
                  value={flightNumber}
                  onChange={(e) => {
                    setFlightNumber(e.target.value);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-700/70 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  PNR Reference
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. ABC123"
                    value={pnr}
                    onChange={(e) => {
                      setPnr(e.target.value);
                      setIsEditing(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-700/70 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 pr-8"
                  />
                  {pnr && (
                    <button
                      type="button"
                      onClick={() => setMaskPnr(!maskPnr)}
                      title={maskPnr ? "Unmask PNR" : "Mask PNR for privacy"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {maskPnr ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Travel Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 Sep"
                  value={travelDate}
                  onChange={(e) => {
                    setTravelDate(e.target.value);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-700/70 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Tagged Authorities pill badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-neutral-400 text-[11px]">Tagged Entities:</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]">
                {airline.twitterHandle || airline.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                {AUTHORITY_TWITTER_HANDLES.dgca}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                {AUTHORITY_TWITTER_HANDLES.moca}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[11px]">
                {AUTHORITY_TWITTER_HANDLES.airsewa}
              </span>
            </div>

            {/* Live Tweet Editor / Preview Box */}
            <div className="relative rounded-xl bg-neutral-950 border border-neutral-800 p-4 focus-within:border-sky-500/60 transition">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Structured Post Preview
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs ${
                      isOverLimit ? 'text-red-400 font-bold' : charCount > 250 ? 'text-amber-400' : 'text-neutral-400'
                    }`}
                  >
                    {charCount}/280
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-neutral-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={tweetText}
                onChange={(e) => {
                  setTweetText(e.target.value);
                  setIsEditing(true);
                }}
                className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed font-sans"
              />
            </div>

            {/* Error or API Diagnostic Notice if any */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs space-y-1 text-red-200">
                <div className="flex items-center gap-2 font-semibold text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>API Notice: {errorMsg}</span>
                </div>
                {diagnosticMsg && <p className="text-[11px] text-neutral-300 pl-6">{diagnosticMsg}</p>}
                <p className="text-[11px] text-neutral-400 pl-6 pt-1">
                  💡 You can still post immediately using the <strong className="text-white">"Post on X from My Account"</strong> button below!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            Close
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            {/* Fallback Intent Button */}
            <a
              href={intentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium transition"
            >
              Post from My Personal X Account
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Direct Automated Publish Button */}
            <button
              onClick={handlePublish}
              disabled={loading || isOverLimit || Boolean(publishedUrl)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition shadow-lg ${
                loading || isOverLimit || Boolean(publishedUrl)
                  ? 'bg-sky-600/50 text-sky-200/50 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 text-neutral-950 shadow-sky-500/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Publishing via {AUTHORITY_TWITTER_HANDLES.advocacy}...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Post Publicly via {AUTHORITY_TWITTER_HANDLES.advocacy}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
