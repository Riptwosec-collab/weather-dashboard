"use client";

import { useState } from "react";

type MacResult = {
  normalized: string;
  cisco: string;
  ruckus: string;
};

const flashcards = [
  { q: "CIA Triad", a: "Confidentiality, Integrity, Availability" },
  { q: "802.1X", a: "Port-based network access control using supplicant, authenticator, and RADIUS" },
  { q: "DHCP DORA", a: "Discover, Offer, Request, Acknowledge" }
];

export function TechUtilitiesWidget() {
  const [mac, setMac] = useState("001122AABBCC");
  const [macResult, setMacResult] = useState<MacResult | null>(null);
  const [cidr, setCidr] = useState("192.168.10.0/24");
  const [dhcpResult, setDhcpResult] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);

  async function convertMac() {
    const response = await fetch("/api/tech/mac", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mac })
    });
    const data = (await response.json()) as MacResult;
    setMacResult(data);
  }

  async function checkDhcp() {
    const response = await fetch("/api/tech/dhcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cidr })
    });
    const data = (await response.json()) as { summary: string };
    setDhcpResult(data.summary);
  }

  const card = flashcards[cardIndex];

  return (
    <div className="grid gap-4">
      <div className="metric-card rounded-lg p-4">
        <p className="font-semibold text-white">MAC Address Converter</p>
        <div className="mt-3 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
          />
          <button className="sharp-button px-3 py-2 text-sm font-bold transition" onClick={convertMac} type="button">
            แปลง
          </button>
        </div>
        {macResult ? (
          <div className="mt-3 grid gap-2 text-xs text-slate-300">
            <p>Normal: {macResult.normalized}</p>
            <p>Cisco: {macResult.cisco}</p>
            <p>Ruckus: {macResult.ruckus}</p>
          </div>
        ) : null}
      </div>

      <div className="metric-card rounded-lg p-4">
        <p className="font-semibold text-white">DHCP Pool Checker</p>
        <div className="mt-3 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
            value={cidr}
            onChange={(event) => setCidr(event.target.value)}
          />
          <button className="sharp-button px-3 py-2 text-sm font-bold transition" onClick={checkDhcp} type="button">
            เช็ค
          </button>
        </div>
        {dhcpResult ? <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200">{dhcpResult}</p> : null}
      </div>

      <div className="metric-card rounded-lg p-4">
        <p className="text-xs font-semibold uppercase text-amber-200">Flashcard</p>
        <p className="mt-2 text-lg font-bold text-white">{card.q}</p>
        <p className="mt-2 text-sm text-slate-300">{card.a}</p>
        <button
          className="ghost-button mt-3 px-3 py-2 text-xs font-semibold transition"
          type="button"
          onClick={() => setCardIndex((index) => (index + 1) % flashcards.length)}
        >
          ใบถัดไป
        </button>
      </div>
    </div>
  );
}
