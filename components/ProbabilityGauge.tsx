"use client"

interface Props {
  bullScore: number
  bearScore: number
}

export function ProbabilityGauge({ bullScore, bearScore }: Props) {
  // SVG semicircle gauge
  const radius = 70
  const cx = 100
  const cy = 100
  const startAngle = 180
  const endAngle = 0

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function arcPath(startDeg: number, endDeg: number) {
    const s = polarToCartesian(startDeg)
    const e = polarToCartesian(endDeg)
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  // Score 0-100 → angle 180 to 0 (left to right)
  const needleAngle = 180 - bullScore * 1.8
  const needle = polarToCartesian(needleAngle)

  const bullColor = bullScore >= 60 ? "#00ff88" : bullScore >= 40 ? "#f7931a" : "#ff4444"

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-52 h-28">
        {/* Background arc */}
        <path d={arcPath(180, 0)} fill="none" stroke="#1e2030" strokeWidth="12" strokeLinecap="round" />
        {/* Bear zone (left, red) */}
        <path d={arcPath(180, 120)} fill="none" stroke="#ff4444" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Neutral zone (middle, orange) */}
        <path d={arcPath(120, 60)} fill="none" stroke="#f7931a" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Bull zone (right, green) */}
        <path d={arcPath(60, 0)} fill="none" stroke="#00ff88" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={bullColor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={bullColor} />
      </svg>

      <div className="text-center -mt-2">
        <div className="text-4xl font-bold" style={{ color: bullColor }}>{bullScore}%</div>
        <div className="text-xs text-muted mt-1">BULLISH CONVICTION</div>
      </div>

      <div className="flex gap-6 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-bull" />
          <span className="text-muted">BULL {bullScore}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-bear" />
          <span className="text-muted">BEAR {bearScore}</span>
        </div>
      </div>
    </div>
  )
}
