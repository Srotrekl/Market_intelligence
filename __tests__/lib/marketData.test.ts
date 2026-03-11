import { getMarketData, formatMarketContext } from "@/lib/marketData"

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => mockFetch.mockReset())

describe("getMarketData - crypto", () => {
  it("returns MarketData for BTC when CoinGecko responds correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 95000, usd_24h_change: 2.5, usd_market_cap: 1800000000000, usd_24h_vol: 30000000000 } }),
    })
    const result = await getMarketData("BTC")
    expect(result).toMatchObject({ symbol: "BTC", price: 95000, type: "crypto" })
    expect(result?.change24h).toBe(2.5)
  })

  it("returns null when CoinGecko returns non-200", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("returns null when coin key is missing from response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"))
    expect(await getMarketData("BTC")).toBeNull()
  })

  it("sets change24h to null when field is not a number", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 95000, usd_24h_change: null } }),
    })
    const result = await getMarketData("BTC")
    expect(result?.change24h).toBeNull()
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "Global Quote": {
          "05. price": "182.50",
          "10. change percent": "1.25%",
          "06. volume": "55000000",
        },
      }),
    })
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
    const result = formatMarketContext({ symbol: "AAPL", price: 0, change24h: null, marketCap: null, volume24h: null, type: "stock" }, "AAPL")
    expect(result).toContain("unavailable")
  })

  it("formats all fields correctly when complete data is provided", () => {
    const result = formatMarketContext({ symbol: "BTC", price: 95000, change24h: 2.5, marketCap: 1800000000000, volume24h: 30000000000, type: "crypto" }, "BTC")
    expect(result).toContain("95,000")
    expect(result).toContain("2.50%")
    expect(result).toContain("1800.00B")
  })

  it("omits absent optional fields gracefully", () => {
    const result = formatMarketContext({ symbol: "BTC", price: 95000, change24h: null, marketCap: null, volume24h: null, type: "crypto" }, "BTC")
    expect(result).toContain("95,000")
    expect(result).not.toContain("change")
  })
})
