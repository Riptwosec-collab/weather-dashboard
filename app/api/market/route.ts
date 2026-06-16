import { NextResponse } from "next/server";
import { cacheTtl, cachedJson } from "@/lib/cache";
import { mockMarkets } from "@/lib/mock-data";
import type { MarketAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

type YahooQuote = {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  currency?: string;
};

async function loadBinance(symbols: string[]): Promise<MarketAsset[]> {
  const cryptoSymbols = symbols.filter((symbol) => symbol.endsWith("USDT"));
  if (!cryptoSymbols.length) return [];

  const results = await Promise.all(
    cryptoSymbols.map(async (symbol) => {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = (await response.json()) as BinanceTicker;
      return {
        symbol: data.symbol,
        name: data.symbol.replace("USDT", ""),
        price: Number(data.lastPrice),
        changePercent: Number(data.priceChangePercent),
        currency: "USD"
      } satisfies MarketAsset;
    })
  );

  return results;
}

async function loadYahoo(symbols: string[]): Promise<MarketAsset[]> {
  const stockSymbols = symbols.filter((symbol) => !symbol.endsWith("USDT"));
  if (!stockSymbols.length) return [];

  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", stockSymbols.join(","));

  const response = await fetch(url);
  const data = (await response.json()) as { quoteResponse?: { result?: YahooQuote[] } };

  return (data.quoteResponse?.result ?? []).map((quote) => ({
    symbol: quote.symbol,
    name: quote.shortName ?? quote.symbol,
    price: quote.regularMarketPrice ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    currency: quote.currency ?? "USD"
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get("symbols") ?? "BTCUSDT,ETHUSDT,NVDA,VOO")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
  const cacheKey = `market:${symbols.join("-")}`;

  const payload = await cachedJson<{ assets: MarketAsset[] }>(cacheKey, cacheTtl.market, async () => {
    try {
      const [crypto, stocks] = await Promise.all([loadBinance(symbols), loadYahoo(symbols)]);
      const assets = [...crypto, ...stocks];
      return { assets: assets.length ? assets : mockMarkets };
    } catch {
      return { assets: mockMarkets };
    }
  });

  return NextResponse.json(payload);
}
