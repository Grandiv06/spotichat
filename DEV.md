# راه‌اندازی محیط توسعه / Development Setup

## پیش‌نیاز

- **Docker Desktop** را نصب کن و اجرا کن (Docker daemon باید روشن باشد).
- Node.js و npm نصب باشند.

## مراحل (همه‌چیز درست کار کند)

### ۱. استارت MongoDB

با Docker از ریشهٔ پروژه:

```bash
npm run mongo:up
```

یا مستقیم:

```bash
docker-compose up -d
```

چند ثانیه صبر کن تا کانتینر بالا بیاید.

### ۲. استارت بک‌اند

```bash
npm run server
```

یا:

```bash
cd server && npm run start:dev
```

بک‌اند روی **http://localhost:3001** بالا می‌آید.

### ۳. استارت فرانت‌اند (ترمینال دیگر)

```bash
npm run dev
```

فرانت روی **http://localhost:5173** (یا ۵۱۷۴ در صورت اشغال بودن) بالا می‌آید.

---

## خلاصهٔ دستورات

| کار | دستور |
|-----|--------|
| بالا آوردن MongoDB | `npm run mongo:up` |
| پایین آوردن MongoDB | `npm run mongo:down` |
| بک‌اند | `npm run server` |
| فرانت | `npm run dev` |

اگر خطای اتصال به MongoDB دیدی، اول Docker Desktop را باز کن و بعد `npm run mongo:up` را بزن.
