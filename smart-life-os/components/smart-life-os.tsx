"use client";

import { DashboardGrid } from "@/components/dashboard-grid";
import { OnboardingQuiz } from "@/components/onboarding-quiz";
import { useDashboardStore } from "@/store/dashboard-store";

export function SmartLifeOS() {
  const done = useDashboardStore((state) => state.onboardingCompleted);
  return done ? <DashboardGrid /> : <OnboardingQuiz />;
}
