import { NextResponse } from "next/server";

function normalizeMac(input: string) {
  const hex = input.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (hex.length !== 12) {
    throw new Error("MAC address must contain 12 hex characters");
  }
  return hex.match(/.{1,2}/g)?.join(":") ?? hex;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { mac?: string };
    const normalized = normalizeMac(body.mac ?? "");
    const groups = normalized.split(":");
    const cisco = `${groups[0]}${groups[1]}.${groups[2]}${groups[3]}.${groups[4]}${groups[5]}`;
    const ruckus = groups.join("");

    return NextResponse.json({ normalized, cisco, ruckus });
  } catch (error) {
    return NextResponse.json(
      { normalized: "", cisco: "", ruckus: "", error: error instanceof Error ? error.message : "Invalid MAC" },
      { status: 400 }
    );
  }
}
