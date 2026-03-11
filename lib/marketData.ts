export interface MarketData {
  symbol: string
  price: number
  change24h: number | null
  change7d: number | null
  change30d: number | null
  marketCap: number | null
  volume24h: number | null
  type: "crypto" | "stock"
}

const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  LINK: "chainlink",
}

function computeHistoricalChanges(prices: [number, number][]): { change7d: number | null; change30d: number | null } {
  if (!Array.isArray(prices) || prices.length < 2) return { change7d: null, change30d: null }
  const last = prices[prices.length - 1][1]
  const idx7d = prices.length >= 8 ? prices.length - 8 : null
  const change7d = idx7d !== null ? ((last - prices[idx7d][1]) / prices[idx7d][1]) * 100 : null
  const change30d = ((last - prices[0][1]) / prices[0][1]) * 100
  return { change7d, change30d }
}

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  const upper = symbol.toUpperCase()
  const coinId = CRYPTO_IDS[upper]

  if (coinId) {
    try {
      // Fetch live price
      const priceRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { cache: "no-store" }
      )
      if (!priceRes.ok) return null
      const data = await priceRes.json()
      const coin = data[coinId]
      if (!coin || typeof coin.usd !== "number") return null

      // Fetch historical price data (optional — failure returns null fields)
      let change7d: number | null = null
      let change30d: number | null = null
      try {
        const histRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`,
          { cache: "no-store", signal: AbortSignal.timeout(8000) }
        )
        if (histRes.ok) {
          const histData = await histRes.json()
          const computed = computeHistoricalChanges(histData.prices)
          change7d = computed.change7d
          change30d = computed.change30d
        }
      } catch {
        // historical data is optional — silently ignore
      }

      return {
        symbol: upper,
        price: coin.usd,
        change24h: typeof coin.usd_24h_change === "number" ? coin.usd_24h_change : null,
        change7d,
        change30d,
        marketCap: typeof coin.usd_market_cap === "number" ? coin.usd_market_cap : null,
        volume24h: typeof coin.usd_24h_vol === "number" ? coin.usd_24h_vol : null,
        type: "crypto",
      }
    } catch {
      return null
    }
  }

  // Stocks via Alpha Vantage
  const avKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!avKey) {
    return { symbol: upper, price: 0, change24h: null, change7d: null, change30d: null, marketCap: null, volume24h: null, type: "stock" }
  }

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(upper)}&apikey=${avKey}`,
      { cache: "no-store" }
    )
    const data = await res.json()
    const q = data["Global Quote"]
    if (!q || !q["05. price"]) return null
    const price = parseFloat(q["05. price"])
    const change = parseFloat(q["10. change percent"])
    const volume = parseFloat(q["06. volume"])

    // Fetch historical data sequentially (Alpha Vantage rate limit: 5 req/min)
    let change7d: number | null = null
    let change30d: number | null = null
    try {
      const tsRes = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(upper)}&outputsize=compact&apikey=${avKey}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      )
      if (tsRes.ok) {
        const tsData = await tsRes.json()
        const series = tsData["Time Series (Daily)"]
        if (series) {
          const dates = Object.keys(series).sort((a, b) => b.localeCompare(a)) // descending
          const todayPrice = parseFloat(series[dates[0]]?.["4. close"])
          if (!isNaN(todayPrice)) {
            if (dates[5]) {
              const p = parseFloat(series[dates[5]]["4. close"])
              if (!isNaN(p) && p !== 0) change7d = ((todayPrice - p) / p) * 100
            }
            if (dates[21]) {
              const p = parseFloat(series[dates[21]]["4. close"])
              if (!isNaN(p) && p !== 0) change30d = ((todayPrice - p) / p) * 100
            }
          }
        }
      }
    } catch {
      // historical data is optional — silently ignore
    }

    return {
      symbol: upper,
      price: isNaN(price) ? 0 : price,
      change24h: isNaN(change) ? null : change,
      change7d,
      change30d,
      marketCap: null,
      volume24h: isNaN(volume) ? null : volume,
      type: "stock",
    }
  } catch {
    return null
  }
}

export function formatMarketContext(data: MarketData | null, symbol: string): string {
  if (!data || data.price === 0) {
    return `Asset: ${symbol}. Live market data unavailable — use your training knowledge with today's approximate values.`
  }
  const parts = [`Current price: $${data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`]
  if (data.change24h != null) parts.push(`24h change: ${data.change24h.toFixed(2)}%`)
  if (data.change7d != null) parts.push(`7d change: ${data.change7d.toFixed(2)}%`)
  if (data.change30d != null) parts.push(`30d change: ${data.change30d.toFixed(2)}%`)
  if (data.marketCap) parts.push(`Market cap: $${(data.marketCap / 1e9).toFixed(2)}B`)
  if (data.volume24h) parts.push(`24h volume: $${(data.volume24h / 1e9).toFixed(2)}B`)
  return parts.join(" | ")
}
