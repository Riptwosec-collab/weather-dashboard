import { NextResponse } from "next/server";

function ipToNumber(ip: string) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function numberToIp(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function parseCidr(cidr: string) {
  const [ip, prefixText] = cidr.split("/");
  const prefix = Number(prefixText);
  if (!ip || Number.isNaN(prefix) || prefix < 1 || prefix > 30) {
    throw new Error("Use CIDR like 192.168.10.0/24, prefix 1-30");
  }

  const ipNumber = ipToNumber(ip);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const network = ipNumber & mask;
  const broadcast = network | (~mask >>> 0);
  const firstUsable = network + 1;
  const lastUsable = broadcast - 1;
  const usableHosts = Math.max(0, broadcast - network - 1);

  return {
    network: numberToIp(network),
    firstUsable: numberToIp(firstUsable),
    lastUsable: numberToIp(lastUsable),
    broadcast: numberToIp(broadcast),
    usableHosts
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cidr?: string };
    const result = parseCidr(body.cidr ?? "");

    return NextResponse.json({
      ...result,
      summary: `${result.network} usable ${result.firstUsable} - ${result.lastUsable}, broadcast ${result.broadcast}, hosts ${result.usableHosts}`
    });
  } catch (error) {
    return NextResponse.json(
      { summary: error instanceof Error ? error.message : "Invalid CIDR" },
      { status: 400 }
    );
  }
}
