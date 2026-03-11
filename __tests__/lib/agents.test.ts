import { runBullAgent, runBearAgent, runMacroAgent, runJudgeAgent } from "@/lib/agents"

const mockFetch = jest.fn()
global.fetch = mockFetch

const OLD_ENV = process.env

beforeEach(() => {
  mockFetch.mockReset()
  process.env = { ...OLD_ENV, GEMINI_API_KEY: "test-key" }
})

afterAll(() => {
  process.env = OLD_ENV
})

function geminiOkResponse(text: string) {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  }
}

describe("runBullAgent / runBearAgent / runMacroAgent", () => {
  it("runBullAgent returns string response from Gemini", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse("• Bullish reason 1\n• Bullish reason 2"))
    const result = await runBullAgent("BTC", "price: $95000")
    expect(typeof result).toBe("string")
    expect(result).toContain("Bullish")
  })

  it("runBearAgent returns string response from Gemini", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse("• Bearish reason 1\n• Bearish reason 2"))
    const result = await runBearAgent("BTC", "price: $95000")
    expect(typeof result).toBe("string")
  })

  it("runMacroAgent returns string response from Gemini", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse("• Macro factor 1\n• Macro factor 2"))
    const result = await runMacroAgent("BTC", "price: $95000")
    expect(typeof result).toBe("string")
  })

  it("throws when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY
    await expect(runBullAgent("BTC", "ctx")).rejects.toThrow("GEMINI_API_KEY")
  })

  it("throws descriptive error when Gemini returns 429", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, text: async () => "quota exceeded" })
    await expect(runBullAgent("BTC", "ctx")).rejects.toThrow("429")
  })

  it("throws descriptive error when Gemini returns 500", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "internal error" })
    await expect(runBullAgent("BTC", "ctx")).rejects.toThrow("500")
  })
})

describe("runJudgeAgent", () => {
  const validVerdict = JSON.stringify({
    bullScore: 70,
    bearScore: 30,
    signal: "BUY",
    confidence: "MEDIUM",
    verdict: "Overall bullish",
    strongestBullArg: "Strong momentum",
    strongestBearArg: "Regulatory risk",
    priceTarget: "+10% to $104,500",
  })

  it("returns valid JudgeVerdict from clean JSON response", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse(validVerdict))
    const result = await runJudgeAgent("BTC", "bull", "bear", "macro")
    expect(result.signal).toBe("BUY")
    expect(result.bullScore).toBe(70)
    expect(typeof result.verdict).toBe("string")
  })

  it("extracts JSON when Gemini wraps it in markdown fences", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse(`\`\`\`json\n${validVerdict}\n\`\`\``))
    const result = await runJudgeAgent("BTC", "bull", "bear", "macro")
    expect(result.signal).toBe("BUY")
  })

  it("throws when Gemini returns completely non-JSON text", async () => {
    mockFetch.mockResolvedValueOnce(geminiOkResponse("I cannot provide this analysis."))
    await expect(runJudgeAgent("BTC", "bull", "bear", "macro")).rejects.toThrow()
  })

  it("throws when verdict is missing required fields", async () => {
    const badVerdict = JSON.stringify({ bullScore: 70 })
    mockFetch.mockResolvedValueOnce(geminiOkResponse(badVerdict))
    await expect(runJudgeAgent("BTC", "bull", "bear", "macro")).rejects.toThrow("malformed")
  })
})
