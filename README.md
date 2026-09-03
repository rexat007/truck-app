# Fleet & Truck Movement Management System

نظام عربي لإدارة حركة الشاحنات والأسطول، الرحلات، الأوزان، الوقود، الصيانة، والعهدة النقدية، مع لوحة تشغيل للسائق والإدارة.

## المتطلبات

- Node.js 20 أو أحدث
- مفتاح Gemini اختياري لتفعيل تدقيق الأسطول بالذكاء الاصطناعي

## التشغيل المحلي

```bash
npm install
copy .env.example .env.local
npm run dev
```

يفتح الخادم على `http://localhost:3000`. يعمل تدقيق الأسطول بمحرك قواعد محلي إذا لم يتم ضبط `GEMINI_API_KEY`.

## إعداد البيئة

ضع القيم في `.env.local` أو في متغيرات بيئة منصة الاستضافة. لا ترفع هذا الملف إلى GitHub؛ ملف `.gitignore` يستثني ملفات `.env`، و`.env.example` هو القالب الآمن.

## فحوصات وبناء الإنتاج

```bash
npm run lint
npm run build
set NODE_ENV=production && npm start
```

يتحقق `lint` من TypeScript، وينشئ `build` ملفات الواجهة داخل `dist` ويجمع خادم Express الإنتاجي. نقطة فحص الخادم متاحة عبر `GET /api/health`.

## النشر على GitHub

ارفع ملفات المصدر و`package-lock.json` فقط. لا ترفع `node_modules` أو `dist` أو أي ملف بيئة. بعد استنساخ المشروع، نفّذ `npm install` ثم `npm run build`، واضبط `GEMINI_API_KEY` كمتغير سري في منصة الاستضافة، وشغّل `npm start`.

## ملاحظات التشغيل

- بيانات التطبيق الحالية محفوظة محليًا في `localStorage` داخل المتصفح وليست قاعدة بيانات مشتركة.
- تحديد الموقع الجغرافي يحتاج HTTPS في بيئة الإنتاج (باستثناء `localhost`).
- محرك المسارات يستخدم fallback محليًا عند تعذر مزود المرور الخارجي.
