"use client";

import { AppHeader } from "@/components/app-header";
import { DashboardGrid } from "@/components/dashboard-grid";
import { OnboardingQuiz } from "@/components/onboarding-quiz";
import { useDashboardStore } from "@/store/dashboard-store";

export function SmartLifeOS() {
  const done = useDashboardStore((state) => state.onboardingCompleted);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-4">
        <AppHeader />
        {done ? <DashboardGrid /> : <OnboardingQuiz />}
      </section>
    </main>
  );
}
