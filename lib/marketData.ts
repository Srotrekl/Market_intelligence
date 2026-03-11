export interface MarketData {
  symbol: string
  price: number
  change24h: number | null
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

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  const upper = symbol.toUpperCase()
  const coinId = CRYPTO_IDS[upper]

  if (coinId) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { cache: "no-store" }
      )
      if (!res.ok) return null
      const data = await res.json()
      const coin = data[coinId]
      if (!coin || typeof coin.usd !== "number") return null
      return {
        symbol: upper,
        price: coin.usd,
        change24h: typeof coin.usd_24h_change === "number" ? coin.usd_24h_change : null,
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
    return { symbol: upper, price: 0, change24h: null, marketCap: null, volume24h: null, type: "stock" }
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
    return {
      symbol: upper,
      price: isNaN(price) ? 0 : price,
      change24h: isNaN(change) ? null : change,
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
  if (data.marketCap) parts.push(`Market cap: $${(data.marketCap / 1e9).toFixed(2)}B`)
  if (data.volume24h) parts.push(`24h volume: $${(data.volume24h / 1e9).toFixed(2)}B`)
  return parts.join(" | ")
}
