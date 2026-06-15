"use client";

import { useState } from "react";
import type { LifestyleRole } from "@/lib/types";
import { useDashboardStore } from "@/store/dashboard-store";

type VisibleRole = Extract<LifestyleRole, "traveler" | "foodie" | "balanced">;

const roles: Array<{ id: VisibleRole; label: string; detail: string }> = [
  { id: "traveler", label: "Traveler", detail: "เน้นฝน แผนที่ และร้านใกล้ตัว" },
  { id: "foodie", label: "Foodie", detail: "เน้นร้านอาหารและโปรโมชัน" },
  { id: "balanced", label: "Balanced", detail: "ใช้งานอากาศและร้านอาหารแบบสมดุล" }
];

export function OnboardingQuiz() {
  const completeOnboarding = useDashboardStore((state) => state.completeOnboarding);
  const [role, setRole] = useState<VisibleRole>("balanced");
  const [province, setProvince] = useState("กรุงเทพฯ");
  const [budgetFocus, setBudgetFocus] = useState<"saving" | "balanced" | "premium">("balanced");

  return (
    <section className="glass-panel rounded-[2rem] p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Onboarding Quiz</p>
        <h2 className="mt-2 text-2xl font-bold text-white">จัดหน้า Dashboard ให้เข้ากับไลฟ์สไตล์</h2>
        <p className="mt-2 text-sm text-slate-300">ตอบสั้น ๆ แล้วระบบจะเรียง widget ให้เหมาะกับคุณ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRole(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              role === item.id ? "border-cyan-300 bg-cyan-300/10" : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
            }`}
          >
            <p className="font-semibold text-white">{item.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">จังหวัดหลัก</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-200">สไตล์แนะนำร้าน</span>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
            value={budgetFocus}
            onChange={(event) => setBudgetFocus(event.target.value as "saving" | "balanced" | "premium")}
          >
            <option value="saving">ประหยัด</option>
            <option value="balanced">สมดุล</option>
            <option value="premium">พรีเมียม</option>
          </select>
        </label>
      </div>

      <button
        className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 sm:w-auto"
        type="button"
        onClick={() => completeOnboarding({ role, province, budgetFocus, goals: [role] })}
      >
        สร้าง Dashboard ของฉัน
      </button>
    </section>
  );
}
