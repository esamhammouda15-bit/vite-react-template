// ANTHROPIC_API_KEY is a Worker secret (set via `wrangler secret put`), so it
// is not emitted by `wrangler types`. Declare it here. Optional on purpose:
// when unset, the Claude client falls back to deterministic mock output.
declare namespace Cloudflare {
	interface Env {
		ANTHROPIC_API_KEY?: string;
	}
}
