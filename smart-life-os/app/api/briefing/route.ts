import { NextResponse } from "next/server";
import { cacheTtl, cachedJson } from "@/lib/cache";
import type { WidgetId } from "@/lib/types";

export const dynamic = "force-dynamic";

type BriefingRequest = {
  activeWidgets?: WidgetId[];
};

type ClaudeResponse = {
  content?: Array<{ type: string; text?: string }>;
};

function fallbackLines(activeWidgets: WidgetId[]): string[] {
  const hasWeather = activeWidgets.includes("weather");
  const hasMarket = activeWidgets.includes("market");

  return [
    hasWeather ? "วันนี้เริ่มจากเช็คฝน PM2.5 และเส้นทางก่อนออกจากบ้าน" : "วันนี้ dashboard พร้อมสรุปงานสำคัญจาก widget ที่เปิดไว้",
    hasMarket ? "ตลาดและต้นทุนเฉลี่ยควรถูกใช้เพื่อดูภาพรวม ไม่ใช่คำแนะนำซื้อขาย" : "เปิด widget ที่ใช้บ่อยไว้บนสุดเพื่อให้เริ่มวันได้เร็วขึ้น"
  ];
}

async function callClaude(activeWidgets: WidgetId[]): Promise<string[] | null> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 160,
      messages: [
        {
          role: "user",
          content: `สรุป dashboard ภาษาไทย 2 บรรทัด กระชับ สำหรับ widgets: ${activeWidgets.join(", ")}`
        }
      ]
    })
  });

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content?.find((item) => item.type === "text")?.text;
  if (!text) return null;

  return text
    .split("\n")
    .map((line) => line.replace(/^[-\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 2);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BriefingRequest;
  const activeWidgets = body.activeWidgets?.length ? body.activeWidgets : ["weather", "food", "market", "tech"];
  const cacheKey = `briefing:${activeWidgets.join("-")}`;

  const payload = await cachedJson<{ lines: string[] }>(cacheKey, cacheTtl.briefing, async () => {
    try {
      const claudeLines = await callClaude(activeWidgets);
      return { lines: claudeLines?.length ? claudeLines : fallbackLines(activeWidgets) };
    } catch {
      return { lines: fallbackLines(activeWidgets) };
    }
  });

  return NextResponse.json(payload);
}
