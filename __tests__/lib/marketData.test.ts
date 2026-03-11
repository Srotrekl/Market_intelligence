import { getMarketData, formatMarketContext } from "@/lib/marketData"

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => mockFetch.mockReset())

// 30 daily price points: starts at 80000, ends at 94500
const mockPriceHistory = Array.from({ length: 30 }, (_, i) => [
  Date.now() - (29 - i) * 86400000,
  80000 + i * 500,
]) as [number, number][]

const mockHistoryOk = {
  ok: true,
  json: async () => ({ prices: mockPriceHistory }),
}

describe("getMarketData - crypto", () => {
  it("returns MarketData for BTC when CoinGecko responds correctly", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 95000, usd_24h_change: 2.5, usd_market_cap: 1800000000000, usd_24h_vol: 30000000000 } }),
      })
      .mockResolvedValueOnce(mockHistoryOk) // market_chart
    const result = await getMarketData("BTC")
    expect(result).toMatchObject({ symbol: "BTC", price: 95000, type: "crypto" })
    expect(result?.change24h).toBe(2.5)
    expect(typeof result?.change7d).toBe("number")
    expect(typeof result?.change30d).toBe("number")
  })

  it("returns null when CoinGecko returns non-200", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    // history fetch is NOT called when price fails — no second mock needed
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("returns null when coin key is missing from response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    // history fetch is NOT called when coin missing — no second mock needed
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"))
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("sets change24h to null when field is not a number", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 95000, usd_24h_change: null } }),
      })
      .mockResolvedValueOnce(mockHistoryOk)
    const result = await getMarketData("BTC")
    expect(result?.change24h).toBeNull()
  })

  it("sets change7d and change30d to null when history fetch fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 95000, usd_24h_change: 2.5, usd_market_cap: 1e12, usd_24h_vol: 3e10 } }),
      })
      .mockResolvedValueOnce({ ok: false }) // history fails gracefully
    const result = await getMarketData("BTC")
    expect(result?.change7d).toBeNull()
    expect(result?.change30d).toBeNull()
  })
})

describe("getMarketData - stocks", () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV, ALPHA_VANTAGE_API_KEY: "test-key" }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it("returns MarketData for AAPL with correct parseFloat values", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "Global Quote": {
            "05. price": "182.50",
            "10. change percent": "1.25%",
            "06. volume": "55000000",
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false }) // TIME_SERIES_DAILY fails gracefully
    const result = await getMarketData("AAPL")
    expect(result?.price).toBe(182.5)
    expect(result?.type).toBe("stock")
  })

  it("returns price 0 and null fields when parseFloat returns NaN", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "Global Quote": {
          "05. price": "",
          "10. change percent": "",
          "06. volume": "",
        },
      }),
    })
    // Empty price string — Global Quote check for "05. price" will catch empty string
    // and return null before parseFloat
    const result = await getMarketData("AAPL")
    expect(result).toBeNull()
  })

  it("returns fallback object when ALPHA_VANTAGE_API_KEY is undefined", async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY
    const result = await getMarketData("AAPL")
    expect(result).toMatchObject({ symbol: "AAPL", price: 0, type: "stock" })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns null when Global Quote is empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ "Global Quote": {} }),
    })
    expect(await getMarketData("AAPL")).toBeNull()
  })

  it("URL-encodes the symbol to prevent injection", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ "Global Quote": {} }) })
    await getMarketData("AAPL%26fake")
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).not.toContain("&fake")
  })
})

describe("formatMarketContext", () => {
  it("returns fallback string when data is null", () => {
    const result = formatMarketContext(null, "BTC")
    expect(result).toContain("BTC")
    expect(result).toContain("unavailable")
  })

  it("returns fallback string when price is 0", () => {
    const result = formatMarketContext({ symbol: "AAPL", price: 0, change24h: null, change7d: null, change30d: null, marketCap: null, volume24h: null, type: "stock" }, "AAPL")
    expect(result).toContain("unavailable")
  })

  it("formats all fields correctly when complete data is provided", () => {
    const result = formatMarketContext({ symbol: "BTC", price: 95000, change24h: 2.5, change7d: 5.1, change30d: 12.3, marketCap: 1800000000000, volume24h: 30000000000, type: "crypto" }, "BTC")
    expect(result).toContain("95,000")
    expect(result).toContain("2.50%")
    expect(result).toContain("1800.00B")
    expect(result).toContain("7d change: 5.10%")
    expect(result).toContain("30d change: 12.30%")
  })

  it("omits absent optional fields gracefully", () => {
    const result = formatMarketContext({ symbol: "BTC", price: 95000, change24h: null, change7d: null, change30d: null, marketCap: null, volume24h: null, type: "crypto" }, "BTC")
    expect(result).toContain("95,000")
    expect(result).not.toContain("change")
  })
})
