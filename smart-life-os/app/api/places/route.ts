import { NextResponse } from "next/server";
import { cacheTtl, cachedJson } from "@/lib/cache";
import { mockFoodPlaces } from "@/lib/mock-data";
import type { FoodPlace } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const cacheKey = `places:${type ?? "all"}`;

  const payload = await cachedJson<{ places: FoodPlace[] }>(cacheKey, cacheTtl.places, async () => {
    const places = type ? mockFoodPlaces.filter((place) => place.type.toLowerCase() === type.toLowerCase()) : mockFoodPlaces;
    return { places };
  });

  return NextResponse.json(payload);
}
