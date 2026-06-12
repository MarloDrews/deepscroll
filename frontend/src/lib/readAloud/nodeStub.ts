// Empty stand-in for Node's "fs" module. The WASM glue inside vits-web
// references fs behind a Node-only guard that never runs in the browser,
// but the bundler still needs the import to resolve (see next.config.ts).
const empty = {}
export default empty
