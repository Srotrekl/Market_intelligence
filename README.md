# ⚡ Market Intelligence Agent

Multi-agent AI market analysis dashboard. 3 AI analysts debate in parallel — Bull vs Bear vs Macro — then a Judge synthesizes a probability score.

**Celý stack je ZDARMA.**

---

## Tech Stack

| | Technologie | Cena |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind | Zdarma |
| AI Agenti | Google Gemini 1.5 Flash | Zdarma (1500 req/den) |
| Krypto data | CoinGecko Public API | Zdarma |
| Akciová data | Alpha Vantage (volitelné) | Zdarma (500 req/den) |

---

## Spuštění (3 kroky)

```bash
# 1. Nainstaluj závislosti
npm install

# 2. Přidej API klíč do .env.local
# (viz sekce níže)

# 3. Spusť
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000)

---

## API klíče

### Google Gemini (POVINNÝ)
1. Jdi na **aistudio.google.com/app/apikey**
2. Klikni **"Create API key"** — zdarma, žádná karta
3. Vlož do `.env.local`:
```
GEMINI_API_KEY="AIza..."
```

### Alpha Vantage (VOLITELNÝ — pro akcie)
- Bez klíče: AAPL, NVDA, TSLA fungují, ale AI použije znalosti z tréninku
- S klíčem: živé akciové ceny
1. Registruj se na **alphavantage.co**
2. Zkopíruj free API klíč
3. Vlož do `.env.local`:
```
ALPHA_VANTAGE_API_KEY="..."
```

---

## Jak to funguje

```
Uživatel vybere asset (BTC, ETH, AAPL...)
          ↓
Načtou se živá tržní data (CoinGecko / Alpha Vantage)
          ↓
3 agenti běží PARALELNĚ:
  🐂 Bull Agent    → hledá důvody ke koupi
  🐻 Bear Agent    → hledá důvody k prodeji
  🔭 Macro Agent   → analyzuje makro kontext
          ↓
⚖️ Judge Agent syntetizuje verdikt:
  - Bull Score 0-100%
  - Signál: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
  - Confidence: LOW / MEDIUM / HIGH
  - Price Target (30 dní)
          ↓
Výsledek uložen do localStorage (posledních 5 analýz)
```

---

## Podporované assety

| Typ | Symboly | Data |
|---|---|---|
| Krypto | BTC, ETH, SOL (+ další) | CoinGecko live |
| Akcie | AAPL, NVDA, TSLA (+ vlastní) | Alpha Vantage nebo AI knowledge |

⚠️ NOT FINANCIAL ADVICE — FOR EDUCATIONAL PURPOSES ONLY
