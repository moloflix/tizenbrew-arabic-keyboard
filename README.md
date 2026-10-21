# Arabic Keyboard for TizenBrew | كيبورد عربي لـ TizenBrew

[العربية](#العربية) · [English](#english)

---

## العربية

كيبورد عربي على الشاشة لمتصفح تلفزيون Samsung (Tizen)، يُتحكم فيه بالريموت. موديول من نوع `mods` لـ [TizenBrew](https://github.com/reisxd/TizenBrew).

> **المطوّر:** [moloflix](https://github.com/moloflix)
>
> **تنبيه:** المشروع في مرحلة التجربة على التلفزيون (انظر [ما لم يُختبر](#ما-لم-يُختبر)).

### المزايا
- فتح تلقائي عند التركيز على حقل نص، أو بزر OK على الحقل.
- تخطيط عربي / إنجليزي / أرقام ورموز، مع تذكّر آخر لغة (لكل موقع).
- صف تشكيل اختياري (فتحة، ضمة، كسرة، سكون، شدة، تنوين) بمفتاح «تشكيل».
- اتجاه RTL للحقل أثناء الكتابة بالعربية.
- **وضع مؤشر ماوس** بالريموت (للنقر على الأزرار مثل الموافقة على الكوكيز): أحد الأزرار الملونة (أحمر/أخضر/أصفر/أزرق)، أو ضغطة طويلة (حوالي ثانية) على OK.
- أسهم ← → لتحريك المؤشر داخل النص، وسطر معاينة يُظهر النص وموضع المؤشر.
- تحجيم تلقائي حسب الشاشة (1080p و4K).
- زر Back (`10009`) يغلق الكيبورد فقط دون الخروج من المتصفح.
- ملف JS واحد، بدون تبعيات، بصياغة ES5.

### التركيب
1. افتح **TizenBrew** على التلفزيون ← **Module Manager**.
2. اختر **Add GitHub module** (أو ما يقابلها) وأدخل:
   ```
   gh/<user>/<repo>
   ```
   مثال: `gh/moloflix/tizenbrew-arabic-keyboard`
3. لتثبيت نسخة محددة استخدم الوسم: `gh/<user>/<repo>@v1.4.1`
   (jsDelivr يخزّن `main` مؤقتاً لساعات، لذلك الوسم أضمن).
4. شغّل الموديول **Arabic Keyboard** من القائمة. يفتح `websiteURL` (الافتراضي Google)؛ غيّره في `package.json` إن أردت.

### الاستخدام
| الزر | الفعل |
|---|---|
| أسهم | التنقل بين المفاتيح |
| OK | كتابة المفتاح / فتح الكيبورد على حقل نص |
| Back | إغلاق الكيبورد / الخروج من وضع المؤشر |
| أحمر (أو OK مطوّلة) | تشغيل/إيقاف وضع المؤشر: الأسهم تحرّك، OK تنقر، وعند حافة الشاشة تمرّر الصفحة |
| مفتاح «إدخال» | يرسل Enter للحقل ويرسل النموذج، ثم يغلق (في textarea يضيف سطراً) |

### الإعدادات
في أعلى `arabic-keyboard.js` الكائن `CONFIG`:
- `autoOpen`: الفتح التلقائي (افتراضي `true`).
- `refocusFallback`: إن ظهر **كيبورد التلفزيون الأصلي** فوق كيبوردنا، جرّب `true` (يعمل blur/focus بعد تجهيز الحقل).
- `suppressMs`: مدة منع إعادة الفتح التلقائي بعد الإغلاق.

### إنشاء إصدار (release tag)
```bash
# 1) حدّث "version" في package.json، ثم:
git add -A
git commit -m "release: v1.4.1"
git tag v1.4.1
git push origin main --tags
# 2) (اختياري) أنشئ Release من صفحة GitHub أو: gh release create v1.4.1 --generate-notes
```
بعد النشر استخدم `gh/<user>/<repo>@v1.4.1` في TizenBrew. إن لم يظهر التحديث، أضف وسماً جديداً (لا تعد استخدام نفس الوسم) أو أفرغ كاش jsDelivr من `https://www.jsdelivr.com/tools/purge`.

### ما لم يُختبر
- ظهور/عدم ظهور الكيبورد الأصلي على Tizen (الحل يعتمد على `inputmode="none"` و`readonly`).
- أرقام مفاتيح الريموت الفعلية (Back = 10009).
- الحقن داخل iframes: يعمل كل iframe بنسخة مستقلة، وقد يكون الكيبورد صغيراً في الإطارات الصغيرة.
- سلوك المواقع المحددة (YouTube، Google، إلخ) والمواقع التي تستمع لـ `keyup` فقط.
- شكل الخط العربي والتشكيل على خطوط التلفزيون.

---

## English

An on-screen Arabic keyboard for the Samsung (Tizen) TV browser, driven by the remote. A `mods`-type module for [TizenBrew](https://github.com/reisxd/TizenBrew).

> **Author:** [moloflix](https://github.com/moloflix)
>
> **Note:** Still being tested on real TVs (see [Not tested](#not-tested)).

### Features
- Auto-opens on text-field focus, or with OK on the field.
- Arabic / English / numbers-symbols layouts; remembers the last language (per site).
- Optional diacritics row (fatha, damma, kasra, sukun, shadda, tanween).
- RTL direction on the field while typing Arabic.
- **Virtual mouse pointer** (to click buttons like cookie consent): Red button, or long-press OK (~1s).
- ← → keys to move the caret, plus a preview line showing the text and caret.
- Auto-scaling for 1080p and 4K.
- Back (`10009`) closes only the keyboard, not the browser.
- Single JS file, zero dependencies, ES5.

### Install
1. Open **TizenBrew** → **Module Manager**.
2. Add a GitHub module and enter `gh/<user>/<repo>` (e.g. `gh/moloflix/tizenbrew-arabic-keyboard`).
3. To pin a version use a tag: `gh/<user>/<repo>@v1.4.1` (jsDelivr caches `main`).
4. Launch **Arabic Keyboard**. It opens `websiteURL` (Google by default); edit it in `package.json`.

### Controls
Arrows move, OK types / opens the keyboard on a field, Back closes the keyboard. The Enter key sends Enter and submits the form, then closes (inserts a newline in a textarea).

### Configuration
`CONFIG` at the top of `arabic-keyboard.js`: `autoOpen`, `refocusFallback` (set `true` if the native TV keyboard still appears), `suppressMs`.

### Release
```bash
git add -A && git commit -m "release: v1.4.1"
git tag v1.4.1
git push origin main --tags
gh release create v1.4.1 --generate-notes   # optional
```
Then use `gh/<user>/<repo>@v1.4.1`. If an update doesn't show, use a new tag or purge jsDelivr's cache.

### Not tested
Native keyboard suppression on real Tizen, actual remote key codes, iframe behavior, site-specific behavior (YouTube, etc.), and Arabic font rendering on TV fonts.

## License
[MIT](LICENSE)
