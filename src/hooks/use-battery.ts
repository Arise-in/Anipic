"use client";

import { useState, useEffect } from "react";

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export function useBattery() {
  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
    isLow: boolean;
    supported: boolean;
  }>({
    level: 1,
    charging: true,
    isLow: false,
    supported: false,
  });

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;
    if (!nav.getBattery) {
      return;
    }

    let batteryManager: BatteryManager;

    const updateBattery = () => {
      setBattery({
        level: batteryManager.level,
        charging: batteryManager.charging,
        isLow: batteryManager.level <= 0.2 && !batteryManager.charging,
        supported: true,
      });
    };

    nav.getBattery().then((bm) => {
      batteryManager = bm;
      updateBattery();
      bm.addEventListener("levelchange", updateBattery);
      bm.addEventListener("chargingchange", updateBattery);
    });

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", updateBattery);
        batteryManager.removeEventListener("chargingchange", updateBattery);
      }
    };
  }, []);

  return battery;
}
