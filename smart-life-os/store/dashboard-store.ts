"use client";

import { create } from "zustand";
import type { Language, LifestyleRole, OnboardingAnswer, WidgetConfig, WidgetId } from "@/lib/types";

const baseWidgets: WidgetConfig[] = [
  {
    id: "weather",
    title: "Weather & Map",
    description: "เรดาร์ฝน ลม PM2.5 และแผนที่สำหรับวางแผนทริป",
    enabled: true,
    order: 0
  },
  {
    id: "food",
    title: "Food Radar",
    description: "หาร้านชาบู ยากินิกุ อีสาน บุฟเฟต์ พร้อมโปรบัตร",
    enabled: true,
    order: 1
  },
  {
    id: "market",
    title: "Market & Wealth",
    description: "หุ้น คริปโต ทอง และตัวคำนวณ average cost",
    enabled: true,
    order: 2
  }
];

const roleOrder: Record<LifestyleRole, WidgetId[]> = {
  traveler: ["weather", "food", "market"],
  investor: ["market", "weather", "food"],
  "tech-worker": ["weather", "market", "food"],
  foodie: ["food", "weather", "market"],
  balanced: ["weather", "food", "market"]
};

type DashboardState = {
  language: Language;
  onboardingCompleted: boolean;
  profile: OnboardingAnswer | null;
  widgets: WidgetConfig[];
  setLanguage: (language: Language) => void;
  completeOnboarding: (answer: OnboardingAnswer) => void;
  toggleWidget: (widgetId: WidgetId) => void;
  reorderWidget: (widgetId: WidgetId, direction: "up" | "down") => void;
  setWidgetOrder: (widgetIds: WidgetId[]) => void;
  resetDashboard: () => void;
};

function arrangeWidgets(role: LifestyleRole): WidgetConfig[] {
  const order = roleOrder[role] ?? roleOrder.balanced;
  return baseWidgets.map((widget) => ({
    ...widget,
    enabled: true,
    order: order.indexOf(widget.id)
  }));
}

export const useDashboardStore = create<DashboardState>((set) => ({
  language: "th",
  onboardingCompleted: false,
  profile: null,
  widgets: baseWidgets,
  setLanguage: (language) => set({ language }),
  completeOnboarding: (answer) =>
    set({
      onboardingCompleted: true,
      profile: answer,
      widgets: arrangeWidgets(answer.role)
    }),
  toggleWidget: (widgetId) =>
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
      )
    })),
  reorderWidget: (widgetId, direction) =>
    set((state) => {
      const ordered = [...state.widgets].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((widget) => widget.id === widgetId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
        return state;
      }

      [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
      return {
        widgets: ordered.map((widget, order) => ({ ...widget, order }))
      };
    }),
  setWidgetOrder: (widgetIds) =>
    set((state) => ({
      widgets: state.widgets.map((widget) => ({
        ...widget,
        order: widgetIds.indexOf(widget.id) >= 0 ? widgetIds.indexOf(widget.id) : widget.order
      }))
    })),
  resetDashboard: () =>
    set({
      onboardingCompleted: false,
      profile: null,
      widgets: baseWidgets,
      language: "th"
    })
}));