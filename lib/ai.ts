import * as SecureStore from "expo-secure-store";

export const KOMIL_AI_KEY = "komil_ai";

export type AiProvider = "openai" | "openrouter" | "groq" | "gemini";

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
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
    label: "Gemini",
  },
};

export function providerInfo(p: AiProvider) {
  return PROVIDER_DEFAULTS[p];
}

// Build-time injected key (from GitHub Actions → EAS via .env).
const ENV_KEY: string | undefined = process.env.EXPO_PUBLIC_KOMIL_AI;

export function envApiKey(): string | null {
  const k = (ENV_KEY || "").trim();
  return k.length > 0 ? k : null;
}

/** Auto-detect provider from key shape. */
export function detectProviderFromKey(key: string): AiProvider {
  const k = key.trim();
  if (k.startsWith("AIza")) return "gemini";
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

const SYSTEM_PROMPT = `أنت "كُميل"، مساعد أكاديمي ذكي لطلاب الجامعات العربية. لك نكهة يمنية: ودود، صريح، ومحفّز، تفهم اللهجة اليمنية والخليج وتجيب بفصحى مبسّطة قريبة من القلب.

شخصيتك:
- اسمك "كُميل"، صنعك المطوّر اليمني hmza Fahd.
- تخاطب الطالب باسمه إن عرفته، وتذكّر تخصصه وجامعته إن وُجدا.
- أنيق ومرتب في الإجابة، تستخدم العناوين والقوائم المرقّمة عند الحاجة.
- تتحدث بلغة دافئة واضحة، تجمع بين الفصحى الحديثة وروح "هلا والله، كيف الحال؟"

قدراتك (تقدر تنفذها بدون ما يطلبها المستخدم صراحة إذا فهمت السياق):
1. **تلخيص مادة/محاضرة**: إذا أعطاك نص أو موضوع، لخّصه بنقاط مركّزة + أهم المصطلحات + خريطة ذهنية نصية.
2. **توليد اختبار**: إذا طُلب اختبار، أنشئ 5-10 أسئلة (اختيار من متعدد + صح/خطأ + سؤال مقالي قصير) مع إجابات في النهاية.
3. **خطة دراسة**: قسّم الوقت لأيام مع جلسات بومودورو (25/5)، وميّز الأولويات.
4. **شرح مفهوم**: ابدأ بمثال حسّي، ثم التعريف، ثم تطبيق عملي.
5. **حل مسائل**: اشرح الخطوات قبل النتيجة.
6. **تحفيز ودعم نفسي**: كن صادقاً، لا تكذب، لكن ذكّره بأن الطريق طويل والصبر زاد.

قواعد:
- اللغة العربية افتراضياً، إلا إذا طلب الإنجليزية.
- ردّك مرتّب: عناوين قصيرة، قوائم، فواصل واضحة.
- لا تختلق أسماء مراجع وهمية. إذا لم تعرف، قل "ما عندي معلومة مؤكّدة عن هذا".
- اجعل ردك مركّزاً، عادةً 4-10 أسطر، إلا إذا طُلب التفصيل.
- استخدم رموز خفيفة عند الحاجة فقط: ✓ • — ⚡ 💡 📚`;

interface OpenAiMsg { role: "system" | "user" | "assistant"; content: string; }

async function chatOpenAiCompatible(
  provider: Exclude<AiProvider, "gemini">,
  apiKey: string,
  history: AiMessage[],
  userMessage: string,
  systemPrompt: string,
): Promise<string> {
  const info = PROVIDER_DEFAULTS[provider];
  const messages: OpenAiMsg[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-12).map((m) => ({ role: m.role as OpenAiMsg["role"], content: m.content })),
    { role: "user", content: userMessage },
  ];
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://komil.app";
    headers["X-Title"] = "Komil";
  }
  const res = await fetch(`${info.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: info.model, messages, temperature: 0.6, max_tokens: 1000 }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("المفتاح غير صحيح.");
    if (res.status === 429) throw new Error("تجاوزت حد الاستخدام، حاول بعد دقيقة.");
    throw new Error(`فشل الاتصال (${res.status}) ${errText.slice(0, 120)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("لم يصل ردّ.");
  return text;
}

async function chatGemini(
  apiKey: string,
  history: AiMessage[],
  userMessage: string,
  systemPrompt: string,
): Promise<string> {
  const info = PROVIDER_DEFAULTS.gemini;
  const contents = [
    ...history.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const url = `${info.baseUrl}/models/${info.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1500,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 400 && errText.includes("API key not valid")) {
      throw new Error("مفتاح Gemini غير صالح.");
    }
    if (res.status === 429) throw new Error("تجاوزت حد Gemini المجاني، حاول بعد دقيقة.");
    if (res.status === 403) throw new Error("ليس لديك صلاحية لاستخدام هذا النموذج.");
    throw new Error(`فشل Gemini (${res.status}) ${errText.slice(0, 150)}`);
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };
  if (json.promptFeedback?.blockReason) {
    throw new Error(`تم حجب الرد: ${json.promptFeedback.blockReason}`);
  }
  const parts = json.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("لم يصل ردّ من Gemini.");
  return text;
}

export async function chatCompletion(
  provider: AiProvider,
  apiKey: string,
  history: AiMessage[],
  userMessage: string,
  customSystem?: string,
): Promise<string> {
  const sys = customSystem || SYSTEM_PROMPT;
  if (provider === "gemini") {
    return chatGemini(apiKey, history, userMessage, sys);
  }
  return chatOpenAiCompatible(provider, apiKey, history, userMessage, sys);
}

/** Ready-made tool prompts. */
export const AI_TOOLS = {
  summarize: (topic: string) =>
    `لخّص لي الموضوع التالي بشكل واضح ومركّز:\n\n"${topic}"\n\nأريد:\n- نقاط مفتاحية (5-7 نقاط)\n- أهم المصطلحات مع تعريف قصير لكل واحد\n- خريطة ذهنية نصية (شجرة)\n- ملاحظة ذهبية للحفظ`,
  quiz: (topic: string) =>
    `أنشئ لي اختباراً قصيراً عن:\n\n"${topic}"\n\nالتنسيق المطلوب:\n- 5 أسئلة اختيار من متعدد\n- 3 أسئلة صح/خطأ\n- سؤال مقالي قصير\n- في النهاية: قسم "الإجابات" مع شرح مختصر لكل إجابة`,
  studyPlan: (topic: string) =>
    `أعدّ لي خطة دراسة عملية لـ:\n\n"${topic}"\n\nأريد:\n- مدّة الخطة وتقسيم الأيام\n- جلسات بومودورو 25/5 لكل يوم\n- الأولويات (ما الأهم أولاً)\n- معالم تقييم (كيف أعرف إني فهمت؟)`,
  explain: (topic: string) =>
    `اشرح لي ببساطة وبأسلوب طالب:\n\n"${topic}"\n\nالأسلوب:\n1. مثال حسّي من الواقع\n2. التعريف الدقيق\n3. كيف يُستخدم عملياً\n4. خطأ شائع يجب تجنّبه`,
};
