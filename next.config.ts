import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory makes Turbopack's
  // workspace-root inference ambiguous, so pin the root to this folder.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
