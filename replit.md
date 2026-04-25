# Komil | كُميل

نظام تشغيل أكاديمي معرفي للطلاب — يعمل أوفلاين-أولاً، بهوية أحادية اللون داكنة فاخرة.

## الهوية

- **الاسم**: Komil | كُميل
- **التصميم**: Monochrome dark (`#0A0A0A` خلفية، `#FAFAFA` نص)
- **الخط العربي**: IBM Plex Sans Arabic (Regular/Medium/SemiBold/Bold)
- **التوقيع**: hmza Fahd

## التقنية

- **Framework**: Expo SDK 54 + React Native + TypeScript
- **Navigation**: Expo Router (file-based)
- **Storage**: AsyncStorage (offline-first، بدون قواعد بيانات سحابية)
- **State**: React Context (`store/AppContext.tsx`)
- **UI**: React Native StyleSheet + Feather Icons + react-native-svg

## بنية المشروع

```
artifacts/komil/
├── app/
│   ├── _layout.tsx              # Root: providers + splash + font loading
│   └── (tabs)/
│       ├── _layout.tsx          # 5 tabs مع BlurView على iOS
│       ├── index.tsx            # اليوم — Hero + Next Best Task + Timeline + Stress
│       ├── tasks.tsx            # المهام والجدول والمواد
│       ├── voice.tsx            # المسجل الصوتي
│       ├── ai.tsx               # مركز الذكاء — أزمات + تنبؤات + Inbox
│       └── profile.tsx          # الملف الشخصي
├── components/
│   ├── Logo.tsx                 # SVG K monogram + signature
│   ├── SplashOverlay.tsx        # شاشة بداية متحركة
│   ├── HeroCard.tsx             # درجة اليوم + actions
│   ├── NextBestTaskCard.tsx     # محرك القرار
│   ├── Timeline.tsx             # خط زمني لليوم
│   ├── StressMeter.tsx          # مقياس الإجهاد المرئي
│   ├── TaskRow.tsx              # صف مهمة بالحالة الكاملة
│   ├── AddTaskSheet.tsx         # bottom sheet لإضافة مهمة
│   ├── AddSubjectSheet.tsx      # إضافة مادة
│   ├── AddEventSheet.tsx        # إضافة حدث جدول
│   ├── FocusModal.tsx           # وضع التركيز مع مؤقت
│   ├── ScreenHeader.tsx         # رأس صفحة موحد
│   ├── EmptyState.tsx           # حالة فارغة
│   └── FAB.tsx                  # زر عائم للإضافة
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── storage.ts               # AsyncStorage helpers
│   └── decision.ts              # nextBestTask, stressLevel, todayScore
├── store/
│   └── AppContext.tsx           # State كامل + AsyncStorage + بيانات seed
├── constants/
│   ├── colors.ts                # palette داكن
│   └── typography.ts            # خطوط + spacing
└── assets/images/icon.png       # K monogram أيقونة
```

## محرك القرار (Decision Engine)

موجود في `lib/decision.ts`:

- **`nextBestTask()`**: يختار أهم مهمة بناءً على:
  - الموعد النهائي (overdue=100, <24h=80, <72h=50)
  - الأولوية (critical=40, high=25, normal=10)
  - عدد مرات التأجيل (×8)
  - المهام السريعة (≤30 دقيقة) +10
- **`stressLevel()`**: 4 مستويات (مستقر/محمّل/مرهَق/حرج)
- **`todayScore()`**: نسبة إنجاز مهام اليوم

## الحالات

- المهام: inbox / planned / done / archived
- الأولويات: low / normal / high / critical
- أنواع الأحداث: محاضرة / امتحان / إجازة (مع تكرار أسبوعي)

## بيانات Seed

- 3 مواد: تفاضل، تشفير ما بعد الكوانتم، تعلم الآلة
- 4 مهام بأولويات مختلفة
- 3 أحداث جدول (محاضرتان متكررتان + امتحان)

## Workflow

- **Workflow**: `artifacts/komil: expo` (port 20132)
- **Restart**: عند تغيير الحزم فقط — Hot Reload يعمل تلقائياً للكود

## Publishing

- **iOS**: متاح عبر Replit Expo Launch (Publish button)
- **Android APK**: غير مدعوم رسمياً عبر Replit؛ يحتاج EAS Build على حساب Expo شخصي
- **اختبار فوري**: مسح QR code عبر تطبيق Expo Go على الهاتف
