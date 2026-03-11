"use client"
import { ProbabilityGauge } from "./ProbabilityGauge"
import type { JudgeVerdict as Verdict } from "@/lib/agents"

const SIGNAL_STYLE: Record<string, string> = {
  "STRONG BUY":  "bg-bull/20 text-bull border border-bull/50",
  "BUY":         "bg-bull/10 text-bull border border-bull/30",
  "HOLD":        "bg-judge/10 text-judge border border-judge/30",
  "SELL":        "bg-bear/10 text-bear border border-bear/30",
  "STRONG SELL": "bg-bear/20 text-bear border border-bear/50",
}

const CONFIDENCE_STYLE: Record<string, string> = {
  HIGH:   "text-bull",
  MEDIUM: "text-judge",
  LOW:    "text-muted",
}

interface Props { verdict: Verdict; asset: string }

export function JudgeVerdict({ verdict, asset }: Props) {
  return (
    <div className="bg-card border border-judge/30 shadow-[0_0_30px_rgba(247,147,26,0.1)] rounded-lg p-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">⚖️</span>
        <div>
          <div className="text-xs font-bold tracking-widest text-judge">JUDGE VERDICT</div>
          <div className="text-xs text-muted">Senior Portfolio Manager · {asset}</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-sm font-bold px-3 py-1 rounded ${SIGNAL_STYLE[verdict.signal] ?? ""}`}>
            {verdict.signal}
          </span>
          <span className={`text-xs font-bold ${CONFIDENCE_STYLE[verdict.confidence]}`}>
            {verdict.confidence} CONFIDENCE
          </span>
        </div>
      </div>

      <div className="h-px bg-judge/20 mb-5" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: gauge */}
        <div className="flex flex-col items-center justify-center">
          <ProbabilityGauge bullScore={verdict.bullScore} bearScore={verdict.bearScore} />
          <div className="mt-4 text-center">
            <div className="text-xs text-muted mb-1">30-DAY PRICE TARGET</div>
            <div className="text-lg font-bold text-judge">{verdict.priceTarget}</div>
          </div>
        </div>

        {/* Right: text */}
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted mb-2 tracking-widest">SYNTHESIS</div>
            <p className="text-sm text-gray-300 leading-relaxed">{verdict.verdict}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-bull/5 border border-bull/20 rounded p-3">
              <div className="text-xs text-bull mb-1 font-bold">STRONGEST BULL ARG</div>
              <p className="text-xs text-gray-400 leading-relaxed">{verdict.strongestBullArg}</p>
            </div>
            <div className="bg-bear/5 border border-bear/20 rounded p-3">
              <div className="text-xs text-bear mb-1 font-bold">STRONGEST BEAR ARG</div>
              <p className="text-xs text-gray-400 leading-relaxed">{verdict.strongestBearArg}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
