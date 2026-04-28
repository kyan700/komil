import * as FileSystem from "expo-file-system/legacy";

export const RECORDINGS_ROOT =
  (FileSystem.documentDirectory ?? "") + "komil/recordings/";

export const UNCATEGORIZED_FOLDER = "_uncategorized";

/** Replace characters that aren't safe for file paths. */
export function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned.length ? cleaned : "تسجيل";
}

function folderForSubject(subjectId?: string): string {
  return RECORDINGS_ROOT + (subjectId ?? UNCATEGORIZED_FOLDER) + "/";
}

async function ensureDir(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
    }
  } catch {
    // best effort
  }
}

/** Move a freshly recorded file into the organized subject folder. */
export async function persistRecording(
  tempUri: string,
  subjectId: string | undefined,
  rawName: string,
): Promise<{ uri: string; sizeBytes: number }> {
  const folder = folderForSubject(subjectId);
  await ensureDir(RECORDINGS_ROOT);
  await ensureDir(folder);

  const base = safeFileName(rawName);
  const stamp = Date.now().toString(36);
  // Try to keep the original extension (m4a/mp4/wav/...).
  const m = tempUri.match(/\.([a-zA-Z0-9]{1,5})(?:\?|$)/);
  const ext = (m?.[1] || "m4a").toLowerCase();
  const target = `${folder}${base}-${stamp}.${ext}`;

  await FileSystem.moveAsync({ from: tempUri, to: target });

  let sizeBytes = 0;
  try {
    const info = await FileSystem.getInfoAsync(target, { size: true } as any);
    if (info.exists && typeof (info as any).size === "number") {
      sizeBytes = (info as any).size;
    }
  } catch {
    // ignore
  }
  return { uri: target, sizeBytes };
}

/** Move a recording to a different subject folder (when reassigned). */
export async function moveRecordingToSubject(
  currentUri: string,
  newSubjectId: string | undefined,
  name: string,
): Promise<string> {
  const folder = folderForSubject(newSubjectId);
  await ensureDir(folder);
  const m = currentUri.match(/\.([a-zA-Z0-9]{1,5})(?:\?|$)/);
  const ext = (m?.[1] || "m4a").toLowerCase();
  const stamp = Date.now().toString(36);
  const target = `${folder}${safeFileName(name)}-${stamp}.${ext}`;
  try {
    await FileSystem.moveAsync({ from: currentUri, to: target });
    return target;
  } catch {
    return currentUri;
  }
}

export async function deleteRecordingFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export function formatBytes(b: number): string {
  if (!b || b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}
