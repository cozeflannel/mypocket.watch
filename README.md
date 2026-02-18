**MyPocketWatch** — Workforce time-tracking & payroll management for small businesses.

Workers clock in/out via SMS, WhatsApp, Telegram, or Messenger. Admins manage schedules, payroll, and live status from a web dashboard.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4
- **Backend:** Supabase (Postgres + Auth + Realtime)
- **Messaging:** Twilio (SMS/WhatsApp), Telegram Bot API, Facebook Messenger
- **Deployment:** Vercel (recommended)

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your keys
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project
3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
