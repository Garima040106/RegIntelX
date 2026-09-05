
# RegIntelX Frontend

This directory contains the Next.js workspace for RegIntelX, the regulatory intelligence and compliance tracking application.

## Requirements

- Node.js 20 or newer
- npm
- Access to the RegIntelX API, or a backend running locally

## Install and Run Locally

From this directory:

```bash
npm install
npm run dev
```

Run `npm install` only on the first local setup or after `package.json` or `package-lock.json` changes. Then open `http://localhost:3000`.

Available commands:

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run start    # Serve the production build
```

The normal demo path is:

`Overview -> Changes -> Actions -> Regulations -> Open intelligence -> Sources -> Overview`

## API Connection

The frontend currently uses the deployed API at:

`https://regintelx-backend.onrender.com`

This URL is defined in `src/lib/regintelx/api.ts`. The deployed backend currently allows the production Vercel origin through CORS. When running the frontend locally, the browser may show an unavailable API state because `localhost` and `127.0.0.1` are not in that allowlist. Use the deployed frontend for the live demo, or add the local origin to the backend CORS configuration when developing against the deployed API.

## Production Deployment

Build and serve the frontend with:

```bash
npm install
npm run build
npm run start
```

The frontend can be deployed to Vercel or another Node-compatible host. The current production origin referenced by the backend CORS configuration is `https://reg-intel-x.vercel.app`.

First, run the development server:

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
