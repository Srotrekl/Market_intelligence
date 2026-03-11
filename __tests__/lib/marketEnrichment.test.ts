import { getFearGreedIndex, getNewsHeadlines, formatNewsContext } from "@/lib/marketEnrichment"

const mockFetch = jest.fn()
global.fetch = mockFetch

const OLD_ENV = process.env

beforeEach(() => {
  mockFetch.mockReset()
  process.env = { ...OLD_ENV, ALPHA_VANTAGE_API_KEY: "test-key" }
})

afterAll(() => {
  process.env = OLD_ENV
})

describe("getFearGreedIndex", () => {
  it("returns FearGreedData when API responds correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ value: "45", value_classification: "Fear", timestamp: "1234567890" }] }),
    })
    const result = await getFearGreedIndex()
    expect(result).toEqual({ value: 45, classification: "Fear" })
  })

  it("parses value as integer not string", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ value: "72", value_classification: "Greed" }] }),
    })
    const result = await getFearGreedIndex()
    expect(typeof result?.value).toBe("number")
    expect(result?.value).toBe(72)
  })

  it("returns null when API returns non-200", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getFearGreedIndex()).toBeNull()
  })

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"))
    expect(await getFearGreedIndex()).toBeNull()
  })

  it("returns null when data array is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })
    expect(await getFearGreedIndex()).toBeNull()
  })

  it("returns null when value is not a valid number", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ value: "abc", value_classification: "Unknown" }] }),
    })
    expect(await getFearGreedIndex()).toBeNull()
  })
})

describe("getNewsHeadlines - crypto", () => {
  it("returns array of titles for BTC from CryptoPanic", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { title: "Bitcoin hits new ATH" },
          { title: "BTC adoption grows" },
          { title: "Crypto market bullish" },
        ],
      }),
    })
    const result = await getNewsHeadlines("BTC", "crypto")
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe("Bitcoin hits new ATH")
  })

  it("limits headlines to 5 when more are returned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: Array.from({ length: 10 }, (_, i) => ({ title: `Headline ${i}` })),
      }),
    })
    const result = await getNewsHeadlines("BTC", "crypto")
    expect(result).toHaveLength(5)
  })

  it("returns empty array on non-200", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getNewsHeadlines("BTC", "crypto")).toEqual([])
  })

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"))
    expect(await getNewsHeadlines("BTC", "crypto")).toEqual([])
  })

  it("returns empty array when results key is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })
    expect(await getNewsHeadlines("BTC", "crypto")).toEqual([])
  })
})

describe("getNewsHeadlines - stock", () => {
  it("returns array of titles from Alpha Vantage NEWS_SENTIMENT", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feed: [
          { title: "Apple earnings beat", overall_sentiment_label: "Bullish" },
          { title: "iPhone sales strong", overall_sentiment_label: "Somewhat-Bullish" },
        ],
      }),
    })
    const result = await getNewsHeadlines("AAPL", "stock")
    expect(result).toHaveLength(2)
    expect(result[0]).toContain("Apple earnings beat")
    expect(result[0]).toContain("Bullish")
  })

  it("returns empty array when ALPHA_VANTAGE_API_KEY is undefined", async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY
    const result = await getNewsHeadlines("AAPL", "stock")
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns empty array when feed key is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })
    expect(await getNewsHeadlines("AAPL", "stock")).toEqual([])
  })

  it("returns empty array on non-200", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getNewsHeadlines("AAPL", "stock")).toEqual([])
  })
})

describe("formatNewsContext", () => {
  it("returns empty string for empty array", () => {
    expect(formatNewsContext([])).toBe("")
  })

  it("formats headlines with numbered list", () => {
    const result = formatNewsContext(["Headline one", "Headline two"])
    expect(result).toContain("1. Headline one")
    expect(result).toContain("2. Headline two")
    expect(result).toContain("Recent news")
  })

  it("limits output to 5 headlines", () => {
    const headlines = Array.from({ length: 10 }, (_, i) => `Headline ${i}`)
    const result = formatNewsContext(headlines)
    expect(result).toContain("5. Headline 4")
    expect(result).not.toContain("6.")
  })
})
