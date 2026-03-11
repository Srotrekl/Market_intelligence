"use client"

export interface HistoryEntry {
  asset: string
  signal: string
  bullScore: number
  timestamp: string
}

const SIGNAL_COLOR: Record<string, string> = {
  "STRONG BUY": "text-bull",
  "BUY": "text-bull",
  "HOLD": "text-judge",
  "SELL": "text-bear",
  "STRONG SELL": "text-bear",
}

interface Props {
  history: HistoryEntry[]
  onSelect: (asset: string) => void
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  return `${Math.round(diff / 3600)}h ago`
}

export function AnalysisHistory({ history, onSelect }: Props) {
  if (history.length === 0) return null

  return (
    <div className="bg-card border border-card-border rounded-lg p-4">
      <div className="text-xs text-muted tracking-widest mb-3">RECENT ANALYSES</div>
      <div className="flex flex-wrap gap-2">
        {history.map((h, i) => (
          <button
            key={i}
            onClick={() => onSelect(h.asset)}
            className="flex items-center gap-2 bg-terminal border border-card-border rounded px-3 py-1.5 hover:border-dim transition-colors group"
          >
            <span className="text-xs font-bold text-gray-200 group-hover:text-white">{h.asset}</span>
            <span className={`text-xs font-bold ${SIGNAL_COLOR[h.signal] ?? "text-muted"}`}>{h.signal}</span>
            <span className="text-xs text-muted">{h.bullScore}%</span>
            <span className="text-xs text-dim">{timeAgo(h.timestamp)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
