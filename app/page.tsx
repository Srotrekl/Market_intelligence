"use client"
import { useState, useEffect } from "react"
import { AgentCard } from "@/components/AgentCard"
import { JudgeVerdict } from "@/components/JudgeVerdict"
import { AssetSelector } from "@/components/AssetSelector"
import { AnalysisHistory, type HistoryEntry } from "@/components/AnalysisHistory"
import type { MarketData } from "@/lib/marketData"
import type { JudgeVerdict as Verdict } from "@/lib/agents"

interface Analysis {
  asset: string
  marketData: MarketData | null
  marketContext: string
  bull: string
  bear: string
  macro: string
  verdict: Verdict
  timestamp: string
}

const STAGES = [
  "Fetching live market data...",
  "Running Bull Agent 🐂",
  "Running Bear Agent 🐻",
  "Running Macro Agent 🔭",
  "Running 3 agents in parallel...",
  "Judge Agent synthesizing verdict ⚖️",
  "Finalizing analysis...",
]

export default function HomePage() {
  const [selected, setSelected] = useState("BTC")
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mia_history")
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setStage(s => (s + 1) % STAGES.length), 1200)
    return () => clearInterval(id)
  }, [loading])

  async function analyze() {
    if (!selected) return
    setLoading(true)
    setError("")
    setResult(null)
    setStage(0)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Analysis failed")

      setResult(data)

      // Save to history (last 5)
      const entry: HistoryEntry = {
        asset: data.asset,
        signal: data.verdict.signal,
        bullScore: data.verdict.bullScore,
        timestamp: data.timestamp,
      }
      setHistory(prev => {
        const next = [entry, ...prev.filter(h => h.asset !== data.asset)].slice(0, 5)
        try { localStorage.setItem("mia_history", JSON.stringify(next)) } catch {}
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const changeColor = result?.marketData?.change24h != null
    ? result.marketData.change24h >= 0 ? "text-bull" : "text-bear"
    : "text-muted"

  return (
    <div className="min-h-screen bg-terminal text-gray-200 flex flex-col">

      {/* Top bar */}
      <header className="border-b border-card-border bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-judge font-bold text-sm tracking-widest">⚡ MARKET INTELLIGENCE AGENT</span>
            <span className="text-dim text-xs hidden sm:block">v1.0 · Powered by Google Gemini</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {result?.marketData && result.marketData.price > 0 && (
              <div className="hidden sm:flex items-center gap-2 font-mono">
                <span className="text-muted">{result.asset}</span>
                <span className="text-gray-200">${result.marketData.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                {result.marketData.change24h != null && (
                  <span className={changeColor}>
                    {result.marketData.change24h >= 0 ? "▲" : "▼"} {Math.abs(result.marketData.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
              <span className="text-bull text-xs">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Control panel */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <AssetSelector selected={selected} onSelect={setSelected} disabled={loading} />

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={analyze}
              disabled={loading || !selected}
              className="flex items-center gap-2 bg-judge hover:bg-amber-500 disabled:opacity-40 text-black font-bold px-8 py-2.5 rounded text-sm tracking-widest transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  ANALYZING...
                </>
              ) : (
                "▶ RUN ANALYSIS"
              )}
            </button>

            {loading && (
              <span className="text-xs text-muted animate-pulse cursor-blink">{STAGES[stage]}</span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-bear/10 border border-bear/30 rounded-lg px-5 py-3 text-bear text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Loading skeleton — agent cards */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AgentCard role="bull" content="" loading />
            <AgentCard role="bear" content="" loading />
            <AgentCard role="macro" content="" loading />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Market data bar */}
            {result.marketData && result.marketData.price > 0 && (
              <div className="bg-card border border-card-border rounded-lg px-5 py-3 flex flex-wrap gap-6 text-xs font-mono">
                <div>
                  <span className="text-muted">PRICE </span>
                  <span className="text-gray-200 font-bold">${result.marketData.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                </div>
                {result.marketData.change24h != null && (
                  <div>
                    <span className="text-muted">24H </span>
                    <span className={changeColor}>{result.marketData.change24h >= 0 ? "+" : ""}{result.marketData.change24h.toFixed(2)}%</span>
                  </div>
                )}
                {result.marketData.marketCap && (
                  <div>
                    <span className="text-muted">MCAP </span>
                    <span className="text-gray-200">${(result.marketData.marketCap / 1e9).toFixed(2)}B</span>
                  </div>
                )}
                {result.marketData.volume24h && (
                  <div>
                    <span className="text-muted">VOL </span>
                    <span className="text-gray-200">${(result.marketData.volume24h / 1e9).toFixed(2)}B</span>
                  </div>
                )}
                <div className="ml-auto text-dim">{new Date(result.timestamp).toLocaleTimeString()}</div>
              </div>
            )}

            {/* 3 Agent cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AgentCard role="bull" content={result.bull} />
              <AgentCard role="bear" content={result.bear} />
              <AgentCard role="macro" content={result.macro} />
            </div>

            {/* Judge verdict */}
            <JudgeVerdict verdict={result.verdict} asset={result.asset} />
          </>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="border border-dashed border-card-border rounded-lg py-20 text-center text-muted">
            <div className="text-4xl mb-4">⚡</div>
            <div className="text-sm tracking-widest">SELECT AN ASSET AND RUN ANALYSIS</div>
            <div className="text-xs mt-2 opacity-60">3 AI agents will debate in parallel · Judge synthesizes verdict</div>
          </div>
        )}

        {/* History */}
        <AnalysisHistory history={history} onSelect={a => { setSelected(a); }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border bg-card/50 py-3 px-4 text-center">
        <p className="text-xs text-dim">
          ⚠️ NOT FINANCIAL ADVICE — FOR EDUCATIONAL PURPOSES ONLY ·
          AI analysis may be inaccurate · Always do your own research ·
          Powered by <span className="text-judge">Google Gemini 1.5 Flash</span> (Free)
        </p>
      </footer>
    </div>
  )
}
