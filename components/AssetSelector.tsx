"use client"
import { useState } from "react"

const PRESETS = [
  { symbol: "BTC", label: "Bitcoin", type: "crypto" },
  { symbol: "ETH", label: "Ethereum", type: "crypto" },
  { symbol: "SOL", label: "Solana", type: "crypto" },
  { symbol: "AAPL", label: "Apple", type: "stock" },
  { symbol: "NVDA", label: "NVIDIA", type: "stock" },
  { symbol: "TSLA", label: "Tesla", type: "stock" },
]

interface Props {
  selected: string
  onSelect: (symbol: string) => void
  disabled?: boolean
}

export function AssetSelector({ selected, onSelect, disabled }: Props) {
  const [custom, setCustom] = useState("")

  function submitCustom(e: React.FormEvent) {
    e.preventDefault()
    if (custom.trim()) {
      onSelect(custom.trim().toUpperCase())
      setCustom("")
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted tracking-widest mb-2">SELECT ASSET</div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.symbol}
            onClick={() => onSelect(p.symbol)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
              selected === p.symbol
                ? p.type === "crypto"
                  ? "bg-bull/20 border-bull text-bull"
                  : "bg-macro/20 border-macro text-macro"
                : "bg-card-border/30 border-card-border text-muted hover:border-dim hover:text-gray-300"
            } disabled:opacity-40`}
          >
            {p.symbol}
            <span className="ml-1 text-[10px] opacity-60">{p.type === "crypto" ? "●" : "◆"}</span>
          </button>
        ))}

        {/* Custom input */}
        <form onSubmit={submitCustom} className="flex gap-1">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value.toUpperCase())}
            placeholder="CUSTOM..."
            maxLength={10}
            disabled={disabled}
            className="bg-card border border-card-border rounded px-3 py-1.5 text-xs text-gray-300 placeholder-muted focus:outline-none focus:border-dim w-28 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={disabled || !custom.trim()}
            className="px-3 py-1.5 bg-dim/30 border border-dim rounded text-xs text-gray-300 hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            ADD
          </button>
        </form>
      </div>

      {selected && (
        <div className="text-xs text-muted">
          Selected: <span className="text-gray-200 font-bold">{selected}</span>
          <span className="ml-2 opacity-50">
            {PRESETS.find(p => p.symbol === selected)?.type === "crypto"
              ? "● Live CoinGecko data"
              : "◆ AI knowledge (add ALPHA_VANTAGE_API_KEY for live stock data)"}
          </span>
        </div>
      )}
    </div>
  )
}
