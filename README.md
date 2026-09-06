# BASE Entertainment website

Responsive business website for proposals, celebrations, photography, and videography.

Built with [Next.js](https://nextjs.org) 16 (App Router), React 19, and Tailwind CSS 4.

## Run locally

From this folder, run `npm install` once, then `npm run dev -- --port 3001`.
Open http://localhost:3001. Keep the terminal running while using the website.

## Maintain the website

- `app/page.tsx`: services, FAQs, navigation, email and telephone links.
- `app/globals.css`: colors, typography, layout, and mobile styles.
- `app/layout.tsx`: page title and search description.
- `public/images/`: photographs reused from the supplied business website.

## Validation

- `npm run build`: production build.
- `npm start`: serve the production build (`next start`).
- `npx tsc --noEmit`: type checks.
- `npx oxlint app`: application checks.
- The starter's full `npm run lint` also inspects bundled components; those include pre-existing warnings unrelated to this page.

## Contact and publishing

Inquiries open the visitor's email application with a prepared message. The website does not automatically send messages, accept payments, reserve dates, or store visitor submissions.

Contact details come from the original business website's Services page. The source website has inconsistent email addresses and placeholder addresses on other pages; confirm the preferred email and phone numbers before promoting this website publicly. No placeholder street addresses, expired promotions, invented prices, or customer testimonials were included.

The existing private hosted version is https://base-entertainment-fl.sefo.chatgpt.site. Local changes do not automatically update that version. The original business domain has not been changed.

This project previously ran on vinext (Next.js APIs on Vite) and deployed to Cloudflare Workers via Wrangler. It now uses Next.js directly, so that Workers deployment path no longer applies; deploy it as a standard Next.js application.
