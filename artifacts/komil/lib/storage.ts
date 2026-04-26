import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  tasks: "komil:tasks:v1",
  subjects: "komil:subjects:v1",
  schedule: "komil:schedule:v1",
  inbox: "komil:inbox:v1",
  settings: "komil:settings:v1",
  onboarded: "komil:onboarded:v1",
  focusSessions: "komil:focusSessions:v1",
  streak: "komil:streak:v1",
  userName: "komil:userName:v1",
  aiMessages: "komil:aiMessages:v1",
  aiProvider: "komil:aiProvider:v1",
} as const;

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail - offline-first
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
