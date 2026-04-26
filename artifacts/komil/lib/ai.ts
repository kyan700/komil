import * as SecureStore from "expo-secure-store";

export const KOMIL_AI_KEY = "komil_ai";

export type AiProvider = "openai" | "openrouter" | "groq";

export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

const PROVIDER_DEFAULTS: Record<AiProvider, { baseUrl: string; model: string; label: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    label: "OpenAI",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    label: "OpenRouter",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    label: "Groq",
  },
};

export function providerInfo(p: AiProvider) {
  return PROVIDER_DEFAULTS[p];
}

// Build-time injected key (from GitHub Actions → EAS via .env).
// When present, the user does not need to enter a key — the app "just works".
const ENV_KEY: string | undefined = process.env.EXPO_PUBLIC_KOMIL_AI;

export function envApiKey(): string | null {
  const k = (ENV_KEY || "").trim();
  return k.length > 0 ? k : null;
}

/** Auto-detect provider from key shape. */
export function detectProviderFromKey(key: string): AiProvider {
  const k = key.trim();
  if (k.startsWith("sk-or-")) return "openrouter";
  if (k.startsWith("gsk_")) return "groq";
  return "openai";
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KOMIL_AI_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function loadApiKey(): Promise<string | null> {
  const env = envApiKey();
  if (env) return env;
  try {
    return await SecureStore.getItemAsync(KOMIL_AI_KEY);
  } catch {
    return null;
  }
}

export async function clearApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KOMIL_AI_KEY);
  } catch {
    // ignore
  }
}

export function isEnvKey(): boolean {
  return envApiKey() !== null;
}

const SYSTEM_PROMPT = `أنت "كُميل"، مساعد أكاديمي ذكي لطلاب الجامعة. تتحدث العربية الفصحى المبسّطة بطلاقة.

قواعدك:
- أجب باللغة العربية الفصحى ما لم يطلب المستخدم لغة أخرى.
- كن مركّزاً ومباشراً، ودوداً ومحفّزاً.
- ساعد في: تنظيم المهام، شرح المفاهيم الدراسية، تفكيك المهام الكبيرة، التحضير للاختبارات، تلخيص المحاضرات، حل المسائل، وإدارة الضغط.
- إذا طُلبت خطة قدّمها بخطوات مرقّمة قصيرة وعملية.
- إذا لم تعرف، فاعترف واطلب توضيحاً بدلاً من اختلاق المعلومات.
- اجعل ردّك مختصراً (3-7 جمل) إلا إذا طُلب الشرح المطوّل.
- استخدم رموز ✓ ⚡ 📚 💡 باعتدال عند الحاجة فقط.`;

export async function chatCompletion(
  provider: AiProvider,
  apiKey: string,
  history: AiMessage[],
  userMessage: string,
): Promise<string> {
  const info = PROVIDER_DEFAULTS[provider];
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://komil.app";
    headers["X-Title"] = "Komil";
  }

  const res = await fetch(`${info.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: info.model,
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("المفتاح غير صحيح. تواصل مع المطوّر لتحديث المفتاح.");
    }
    if (res.status === 429) {
      throw new Error("تجاوزت حدّ الاستخدام مؤقتاً. حاول بعد دقيقة.");
    }
    throw new Error(`فشل الاتصال (${res.status}). ${errText.slice(0, 120)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("لم يصل ردّ من النموذج. حاول مجدّداً.");
  return text;
}
