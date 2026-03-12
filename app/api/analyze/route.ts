import { NextRequest, NextResponse } from "next/server"
import { runBullAgent, runBearAgent, runMacroAgent, runJudgeAgent } from "@/lib/agents"
import { getMarketData, formatMarketContext } from "@/lib/marketData"
import { getFearGreedIndex, getNewsHeadlines, formatNewsContext } from "@/lib/marketEnrichment"

const ASSET_REGEX = /^[A-Z0-9\-]{1,20}$/

export async function POST(req: NextRequest) {
  try {
    const { asset } = await req.json()
    if (!asset || typeof asset !== "string") {
      return NextResponse.json({ error: "Asset name required." }, { status: 400 })
    }

    const symbol = asset.trim().toUpperCase()

    if (!ASSET_REGEX.test(symbol)) {
      return NextResponse.json({ error: "Invalid asset symbol. Use only letters, numbers, or hyphens (max 20 chars)." }, { status: 400 })
    }

    // Fetch live market data (CoinGecko for crypto, Alpha Vantage for stocks)
    const marketData = await getMarketData(symbol)

    // Fetch enrichment data in parallel — all optional, failures return null/[]
    const [fearGreed, headlines] = await Promise.all([
      getFearGreedIndex(),
      getNewsHeadlines(symbol, marketData?.type ?? "stock"),
    ])

    // Build enriched market context string for AI agents
    const marketContext =
      formatMarketContext(marketData, symbol) +
      (fearGreed ? ` | Fear & Greed: ${fearGreed.value}/100 (${fearGreed.classification})` : "") +
      formatNewsContext(headlines)

    // Run 3 analyst agents in parallel
    const [bull, bear, macro] = await Promise.all([
      runBullAgent(symbol, marketContext),
      runBearAgent(symbol, marketContext),
      runMacroAgent(symbol, marketContext),
    ])

    // Judge synthesizes after all 3 are done
    const verdict = await runJudgeAgent(symbol, bull, bear, macro, marketData?.price ?? undefined)

    return NextResponse.json({
      asset: symbol,
      marketData,
      fearGreed,
      headlines,
      marketContext,
      bull,
      bear,
      macro,
      verdict,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[analyze]", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
