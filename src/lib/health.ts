import { Platform } from "react-native";

// react-native-health is a native module — it only exists in a custom dev
// client / EAS build, never in Expo Go. Guard every call so the app still
// runs fine before that build exists, or on Android (this app is iOS-only).
let AppleHealthKit: typeof import("react-native-health").default | null = null;
if (Platform.OS === "ios") {
  try {
    AppleHealthKit = require("react-native-health").default;
  } catch {
    AppleHealthKit = null;
  }
}

export type HealthSnapshot = {
  available: boolean;
  steps: number | null;
  heartRateBpm: number | null;
  workoutMinutesToday: number | null;
  lastNightSleepHours: number | null;
};

const EMPTY: HealthSnapshot = {
  available: false,
  steps: null,
  heartRateBpm: null,
  workoutMinutesToday: null,
  lastNightSleepHours: null,
};

let permissionsGranted = false;

export function requestHealthPermissions(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!AppleHealthKit) return resolve(false);
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.Workout,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
        ],
        write: [],
      },
    };
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      permissionsGranted = !error;
      resolve(permissionsGranted);
    });
  });
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  if (!AppleHealthKit) return EMPTY;
  if (!permissionsGranted) {
    const ok = await requestHealthPermissions();
    if (!ok) return EMPTY;
  }

  const since = startOfToday().toISOString();
  const now = new Date().toISOString();

  const [steps, heartRate, workouts, sleep] = await Promise.all([
    new Promise<number | null>((resolve) => {
      AppleHealthKit!.getStepCount({ date: now }, (err, results) => {
        resolve(err ? null : Math.round(results?.value ?? 0));
      });
    }),
    new Promise<number | null>((resolve) => {
      AppleHealthKit!.getHeartRateSamples(
        { startDate: since, endDate: now, limit: 1, ascending: false },
        (err, results) => {
          resolve(err || !results?.length ? null : Math.round(results[0].value));
        }
      );
    }),
    new Promise<number | null>((resolve) => {
      AppleHealthKit!.getSamples(
        { startDate: since, endDate: now, type: "Workout" as never },
        (err, results: any[]) => {
          if (err || !results) return resolve(null);
          const totalMs = results.reduce(
            (sum, r) => sum + (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()),
            0
          );
          resolve(Math.round(totalMs / 60000));
        }
      );
    }),
    new Promise<number | null>((resolve) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      AppleHealthKit!.getSleepSamples(
        { startDate: yesterday.toISOString(), endDate: now },
        (err, results) => {
          if (err || !results?.length) return resolve(null);
          const totalMs = results.reduce(
            (sum, r) => sum + (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()),
            0
          );
          resolve(Math.round((totalMs / 3_600_000) * 10) / 10);
        }
      );
    }),
  ]);

  return { available: true, steps, heartRateBpm: heartRate, workoutMinutesToday: workouts, lastNightSleepHours: sleep };
}
