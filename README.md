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

## The setup catalog (/admin)

`/build-your-setup` shows the 3D pieces you upload in the admin panel: what each
one costs and the exact spot it takes when a customer picks it. Customers choose
pieces; they cannot move them.

One-time setup:

1. Put your Supabase project URL and publishable key in `.env.local` (see
   `.env.example`), then restart `npm run dev`.
2. Supabase dashboard -> SQL Editor -> New query -> paste all of
   `supabase/schema.sql` -> Run. This creates the `setup_items` table, the
   public `models` storage bucket and the security policies. Safe to re-run.
3. Supabase dashboard -> Authentication -> Users -> Add user, with
   "Auto Confirm User" ticked. That account is the only way into `/admin`;
   there is no sign-up anywhere on the site.
4. Open `/admin`, sign in, and upload a `.glb`. Give it a price, drag it across
   the floor to place it, then save.

Several of one model: select it, set **Make copies** to how many more you want,
and press Add. The copies point at the same upload — nothing is uploaded twice —
and land beside the original so none hides inside another. Drag each one where
it belongs and save it. They share a **Group name** (the model's name by
default), which is what makes customers see a single entry: one click brings
every copy in, each at the spot you gave it, priced at what they come to
together.

Different models can share a group too — put the same Group name on each, and
they appear together on one click, an arch with its candles and rug.

Height is the one thing dragging cannot set — the drag moves a piece across the
floor — so use the Height slider to hang, float or raise a piece.

Re-run `supabase/schema.sql` after pulling changes: it is idempotent, adds later
columns (such as `package`) to an existing table, and reloads Supabase's REST
schema cache. If the admin reports a column it cannot find, run
`supabase/schema.sql` again in the Supabase SQL editor, then retry.

Sign-ups: the write policies give any signed-in user full control of the
catalog, so new sign-ups must be switched off in Supabase under Authentication
-> Sign In / Providers -> Email. Your own account, created by hand, keeps
working.
Until a piece has been uploaded, `/build-your-setup` falls back to the built-in
shapes in `app/build-your-setup/catalog.ts`, whose prices are placeholders.

On Vercel, add the same two `NEXT_PUBLIC_SUPABASE_*` variables under Project ->
Settings -> Environment Variables, otherwise the live site keeps showing the
fallback shapes.

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
