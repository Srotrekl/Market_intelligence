"use client"

interface Props {
  role: "bull" | "bear" | "macro"
  content: string
  loading?: boolean
}

const CONFIG = {
  bull: {
    label: "BULL ANALYST",
    emoji: "🐂",
    color: "text-bull",
    border: "border-bull/30",
    glow: "shadow-[0_0_20px_rgba(0,255,136,0.08)]",
    badge: "bg-bull/10 text-bull border border-bull/30",
    dot: "bg-bull",
  },
  bear: {
    label: "BEAR ANALYST",
    emoji: "🐻",
    color: "text-bear",
    border: "border-bear/30",
    glow: "shadow-[0_0_20px_rgba(255,68,68,0.08)]",
    badge: "bg-bear/10 text-bear border border-bear/30",
    dot: "bg-bear",
  },
  macro: {
    label: "MACRO ANALYST",
    emoji: "🔭",
    color: "text-macro",
    border: "border-macro/30",
    glow: "shadow-[0_0_20px_rgba(77,158,255,0.08)]",
    badge: "bg-macro/10 text-macro border border-macro/30",
    dot: "bg-macro",
  },
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .filter(l => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*"))
    .map(l => l.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean)
}

export function AgentCard({ role, content, loading }: Props) {
  const c = CONFIG[role]
  const bullets = parseBullets(content)
  const lines = bullets.length > 0 ? bullets : content.split("\n").filter(Boolean)

  return (
    <div className={`bg-card border ${c.border} ${c.glow} rounded-lg p-5 flex flex-col gap-4 animate-in`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{c.emoji}</span>
          <span className={`text-xs font-bold tracking-widest ${c.color}`}>{c.label}</span>
        </div>
        {loading ? (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded ${c.badge}`}>COMPLETE</span>
        )}
      </div>

      {/* Divider */}
      <div className={`h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${c.color}`} />

      {/* Content */}
      <div className="space-y-3 flex-1">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 flex-shrink-0 opacity-30`} />
                <div className="h-3 bg-white/5 rounded animate-pulse flex-1" style={{ width: `${70 + i * 7}%` }} />
              </div>
            ))}
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
              <p className="text-xs text-gray-300 leading-relaxed">{line}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
