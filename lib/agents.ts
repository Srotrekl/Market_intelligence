
const GEMINI_MODEL = "gemini-2.5-flash-lite"
const API_BASE = "https://generativelanguage.googleapis.com/v1"

async function geminiRequest(prompt: string, temperature: number, jsonMode = false): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY není nastaven v .env.local")
  const url = `${API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${key}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: jsonMode ? 512 : 600,
    },
  }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""
}

export interface JudgeVerdict {
  bullScore: number
  bearScore: number
  signal: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  verdict: string
  strongestBullArg: string
  strongestBearArg: string
  priceTarget: string
}

export interface AnalysisResult {
  asset: string
  bull: string
  bear: string
  macro: string
  verdict: JudgeVerdict
  marketContext: string
  timestamp: string
}

async function callAgent(prompt: string, temperature = 0.75): Promise<string> {
  return geminiRequest(prompt, temperature, false)
}

export async function runBullAgent(asset: string, marketContext: string): Promise<string> {
  return callAgent(
    `You are an aggressive bull investor analyzing ${asset}.
Market data: ${marketContext}

Your job: Find EVERY compelling reason ${asset} is a great BUY right now.
Consider: price momentum, technical breakouts, institutional adoption, fundamental value, growth catalysts, upcoming catalysts, positive sentiment.

Format your response as EXACTLY 4 bullet points. Each starts with "• " and contains ONE specific argument with a concrete data point or reasoning. Be direct and confident. No intro, no outro.`,
    0.8
  )
}

export async function runBearAgent(asset: string, marketContext: string): Promise<string> {
  return callAgent(
    `You are a hardcore bear investor and short-seller analyzing ${asset}.
Market data: ${marketContext}

Your job: Find EVERY compelling reason ${asset} is overvalued or about to DROP.
Consider: overvaluation, regulatory risks, technical breakdown, competition threats, macro headwinds, insider selling, liquidity risks, negative catalysts.

Format your response as EXACTLY 4 bullet points. Each starts with "• " and contains ONE specific risk or bearish argument with concrete reasoning. Be direct and skeptical. No intro, no outro.`,
    0.8
  )
}

export async function runMacroAgent(asset: string, marketContext: string): Promise<string> {
  return callAgent(
    `You are a senior macro economist and cross-asset strategist analyzing ${asset}.
Market data: ${marketContext}

Your job: Analyze ${asset} in the context of the broader macroeconomic environment.
Consider: Federal Reserve policy & interest rates, US Dollar strength (DXY), global risk sentiment, sector rotation, correlation with other assets, geopolitical risks, inflation/deflation dynamics.

Format your response as EXACTLY 4 bullet points. Each starts with "• " and contains ONE specific macro factor affecting ${asset}. Be analytical and data-driven. No intro, no outro.`,
    0.6
  )
}

export async function runJudgeAgent(
  asset: string,
  bull: string,
  bear: string,
  macro: string
): Promise<JudgeVerdict> {
  const prompt = `You are an unbiased senior portfolio manager synthesizing a multi-agent debate about ${asset}.

BULL ANALYST ARGUMENTS:
${bull}

BEAR ANALYST ARGUMENTS:
${bear}

MACRO ANALYST FACTORS:
${macro}

Synthesize all arguments objectively. Output ONLY valid JSON matching this exact schema:
{
  "bullScore": <integer 0-100, overall bullish conviction>,
  "bearScore": <integer 0-100, overall bearish conviction>,
  "signal": <"STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL">,
  "confidence": <"LOW" | "MEDIUM" | "HIGH">,
  "verdict": "<2-3 sentence balanced synthesis of the debate>",
  "strongestBullArg": "<single strongest bull argument in one sentence>",
  "strongestBearArg": "<single strongest bear argument in one sentence>",
  "priceTarget": "<rough 30-day outlook, e.g. '+12% to $108,000' or '-8% to $88,000'>"
}`

  const text = await geminiRequest(prompt, 0.3, true)

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Judge returned invalid JSON")
    parsed = JSON.parse(match[0])
  }
  if (
    typeof parsed !== "object" || parsed === null ||
    typeof (parsed as Record<string, unknown>).bullScore !== "number" ||
    typeof (parsed as Record<string, unknown>).signal !== "string" ||
    typeof (parsed as Record<string, unknown>).verdict !== "string"
  ) {
    throw new Error("Judge returned malformed verdict")
  }
  return parsed as JudgeVerdict
}
