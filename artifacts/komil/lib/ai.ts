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

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KOMIL_AI_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function loadApiKey(): Promise<string | null> {
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

const SYSTEM_PROMPT = `أنت "كُميل"، مستشار أكاديمي ذكي للطلاب يتحدث العربية بطلاقة.
- أجب بالعربية الفصحى المبسّطة، ودود ومركّز.
- ساعد الطالب في تنظيم مهامه، شرح المفاهيم، تفكيك المهام الكبيرة، التحضير للامتحانات، وإدارة الضغط الدراسي.
- إذا طُلب منك خطة، قدّمها بخطوات مرقمة قصيرة وعملية.
- لا تختلق معلومات؛ إذا لم تعرف فاطلب توضيحاً.
- اجعل ردودك مختصرة ومباشرة (3-6 جمل عادةً)، إلا إذا طُلب شرح موسع.`;

export async function chatCompletion(
  provider: AiProvider,
  apiKey: string,
  history: AiMessage[],
  userMessage: string,
): Promise<string> {
  const info = PROVIDER_DEFAULTS[provider];
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const res = await fetch(`${info.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: info.model,
      messages,
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("المفتاح غير صحيح. تحقّق من المفتاح المخزّن.");
    }
    if (res.status === 429) {
      throw new Error("تجاوزت حد الاستخدام. حاول لاحقاً أو راجع رصيد حسابك.");
    }
    throw new Error(`فشل الاتصال (${res.status}). ${errText.slice(0, 120)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("لم يصل رد من النموذج. حاول مجدداً.");
  return text;
}
