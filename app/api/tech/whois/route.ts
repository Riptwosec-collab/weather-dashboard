import { NextResponse } from "next/server";
import { cacheTtl, cachedJson } from "@/lib/cache";

export const dynamic = "force-dynamic";

type RdapResponse = {
  objectClassName?: string;
  handle?: string;
  ldhName?: string;
  name?: string;
  events?: Array<{ eventAction?: string; eventDate?: string }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const payload = await cachedJson(`whois:${domain}`, cacheTtl.tech, async () => {
    try {
      const response = await fetch(`https://rdap.org/domain/${domain}`);
      const data = (await response.json()) as RdapResponse;
      return {
        domain,
        type: data.objectClassName ?? "domain",
        handle: data.handle ?? "unknown",
        name: data.ldhName ?? data.name ?? domain,
        events: data.events ?? []
      };
    } catch {
      return { domain, type: "domain", handle: "unavailable", name: domain, events: [] };
    }
  });

  return NextResponse.json(payload);
}
