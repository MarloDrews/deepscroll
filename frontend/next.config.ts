import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools badge sits bottom-right at phone width, exactly
  // over the comment send button — hide it so dev matches what users see.
  devIndicators: false,

  // The read-aloud TTS engine (vits-web) ships WASM glue with a Node-only
  // require("fs") branch that never runs in the browser; alias fs to an
  // empty stub so the bundler can resolve it.
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/lib/readAloud/nodeStub.ts" },
    },
  },
};

export default nextConfig;
