export interface FearGreedData {
  value: number
  classification: string
}

export async function getFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const entry = data?.data?.[0]
    if (!entry) return null
    const value = parseInt(entry.value, 10)
    if (isNaN(value)) return null
    return { value, classification: entry.value_classification ?? "Unknown" }
  } catch {
    return null
  }
}

export async function getNewsHeadlines(symbol: string, type: "crypto" | "stock"): Promise<string[]> {
  if (type === "crypto") {
    try {
      const res = await fetch(
        `https://cryptopanic.com/api/free/v1/posts/?currencies=${encodeURIComponent(symbol)}&public=true`,
        { cache: "no-store", signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) return []
      const data = await res.json()
      const results: { title: string }[] = data?.results ?? []
      return results.slice(0, 5).map((r) => r.title).filter(Boolean)
    } catch {
      return []
    }
  }

  // Stocks via Alpha Vantage NEWS_SENTIMENT
  const avKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!avKey) return []
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&limit=5&apikey=${avKey}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const feed: { title: string; overall_sentiment_label?: string }[] = data?.feed ?? []
    return feed.slice(0, 5).map((item) => {
      const label = item.overall_sentiment_label ? ` [${item.overall_sentiment_label}]` : ""
      return `${item.title}${label}`
    }).filter(Boolean)
  } catch {
    return []
  }
}

export function formatNewsContext(headlines: string[]): string {
  if (headlines.length === 0) return ""
  return " | Recent news: " + headlines.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("; ")
}
