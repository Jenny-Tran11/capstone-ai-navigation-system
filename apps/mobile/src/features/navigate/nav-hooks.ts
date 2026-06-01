import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

// ─── Battery warning ──────────────────────────────────────────────────────────

export function useBatteryWarning(
  active: boolean,
  speechRate: number,
  speechLanguage: string,
): boolean {
  const [lowBattery, setLowBattery] = useState(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const subs: { remove(): void }[] = [];

    const check = async (level: number, state: Battery.BatteryState) => {
      if (cancelled || level < 0) return;
      const charging =
        state === Battery.BatteryState.CHARGING ||
        state === Battery.BatteryState.FULL;
      if (charging || level >= 0.2) return;
      setLowBattery(true);
      if (warnedRef.current) return;
      warnedRef.current = true;
      Speech.stop();
      Speech.speak(
        'Battery is low. Consider ending navigation to save power.',
        { rate: speechRate, language: speechLanguage },
      );
    };

    const run = async () => {
      try {
        const ps = await Battery.getPowerStateAsync();
        if (!cancelled) await check(ps.batteryLevel, ps.batteryState);
      } catch { /* simulator / unavailable */ }
    };

    void run();
    subs.push(
      Battery.addBatteryLevelListener((e) => {
        void (async () => {
          try {
            const st = await Battery.getBatteryStateAsync();
            if (!cancelled) await check(e.batteryLevel, st);
          } catch { /* ignore */ }
        })();
      }),
    );
    subs.push(Battery.addBatteryStateListener(() => void run()));

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
    };
  }, [active, speechLanguage, speechRate]);

  return lowBattery;
}

// ─── GPS quality warning ──────────────────────────────────────────────────────

const GPS_LOW_ACCURACY_M = 30;
const GPS_WARN_COOLDOWN_MS = 60_000;

export function useGpsQuality(
  accuracy: number | null,
  active: boolean,
  speechRate: number,
): boolean {
  const lastWarnAt = useRef(0);
  const isLow =
    active &&
    typeof accuracy === 'number' &&
    Number.isFinite(accuracy) &&
    accuracy > GPS_LOW_ACCURACY_M;

  useEffect(() => {
    if (!isLow) return;
    const now = Date.now();
    if (now - lastWarnAt.current < GPS_WARN_COOLDOWN_MS) return;
    lastWarnAt.current = now;
    Speech.speak('GPS accuracy is low.', { rate: speechRate, language: 'en' });
  }, [isLow, speechRate]);

  return isLow;
}

// ─── Heading / compass ────────────────────────────────────────────────────────

const HEADING_CHANGE_DEG = 30;
const HEADING_DEBOUNCE_MS = 10_000;

const CARDINALS = [
  'north', 'northeast', 'east', 'southeast',
  'south', 'southwest', 'west', 'northwest',
] as const;

function degreesToCardinal(deg: number): string {
  return CARDINALS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

export function useHeading(active: boolean): string | null {
  const [label, setLabel] = useState<string | null>(null);
  const lastDeg = useRef<number | null>(null);
  const lastAt = useRef(0);

  useEffect(() => {
    if (!active) { setLabel(null); return; }
    let sub: Location.LocationSubscription | null = null;
    let mounted = true;

    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;
        sub = await Location.watchHeadingAsync((h) => {
          if (!mounted) return;
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (!Number.isFinite(deg)) return;
          const now = Date.now();
          const prev = lastDeg.current;
          const changed = prev == null || Math.abs(deg - prev) >= HEADING_CHANGE_DEG;
          const elapsed = now - lastAt.current >= HEADING_DEBOUNCE_MS;
          if (changed || elapsed) {
            lastDeg.current = deg;
            lastAt.current = now;
            setLabel(`Facing ${degreesToCardinal(deg)}`);
          }
        });
      } catch { /* compass unavailable */ }
    })();

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, [active]);

  return label;
}
