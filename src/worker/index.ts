import { Hono } from "hono";
import type { GigStatus, NewGigInput, Platform, Source } from "../shared/types";
import { scoreGig, writeProposal } from "./claude";
import {
	createGig,
	getGig,
	listGigs,
	saveProposal,
	saveScore,
	setStatus,
} from "./db";

const app = new Hono<{ Bindings: Env }>();

const VALID_PLATFORMS: Platform[] = [
	"catalant",
	"btg",
	"high5",
	"upwork",
	"toptal",
	"malt",
	"comatch",
	"fintalent",
	"talmix",
	"10eqs",
	"open-source",
	"direct",
	"other",
];
const VALID_STATUS: GigStatus[] = [
	"new",
	"scored",
	"approved",
	"rejected",
	"drafted",
	"applied",
];

app.get("/api/health", (c) =>
	c.json({ ok: true, mock: !c.env.ANTHROPIC_API_KEY }),
);

// List gigs, optionally filtered by ?status=
app.get("/api/gigs", async (c) => {
	const status = c.req.query("status") as GigStatus | undefined;
	if (status && !VALID_STATUS.includes(status)) {
		return c.json({ error: "invalid status" }, 400);
	}
	const gigs = await listGigs(c.env.DB, status);
	return c.json({ gigs });
});

app.get("/api/gigs/:id", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	return gig ? c.json({ gig }) : c.json({ error: "not found" }, 404);
});

// Capture a new gig and score it immediately.
app.post("/api/gigs", async (c) => {
	const body = await c.req.json<Partial<NewGigInput>>().catch(() => null);
	if (!body || !body.brief_text || !body.brief_text.trim()) {
		return c.json({ error: "brief_text is required" }, 400);
	}
	const platform: Platform = VALID_PLATFORMS.includes(body.platform as Platform)
		? (body.platform as Platform)
		: "other";
	const source: Source = body.source ?? "paste";

	let gig = await createGig(c.env.DB, {
		platform,
		title: body.title?.trim() || undefined,
		brief_text: body.brief_text.trim(),
		client_context: body.client_context?.trim() || undefined,
		url: body.url?.trim() || undefined,
		source,
	});

	try {
		const score = await scoreGig(c.env, gig.brief_text);
		gig = (await saveScore(c.env.DB, gig.id, score)) ?? gig;
	} catch (err) {
		return c.json(
			{ gig, warning: `scoring failed: ${(err as Error).message}` },
			200,
		);
	}
	return c.json({ gig });
});

// Re-score an existing gig.
app.post("/api/gigs/:id/score", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	if (!gig) return c.json({ error: "not found" }, 404);
	try {
		const score = await scoreGig(c.env, gig.brief_text);
		const updated = await saveScore(c.env.DB, gig.id, score);
		return c.json({ gig: updated });
	} catch (err) {
		return c.json({ error: (err as Error).message }, 502);
	}
});

// Approve a gig, then draft the MBB proposal for it.
app.post("/api/gigs/:id/approve", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	if (!gig) return c.json({ error: "not found" }, 404);

	await setStatus(c.env.DB, gig.id, "approved");
	try {
		const proposal = await writeProposal(c.env, {
			platform: gig.platform,
			fitScore: gig.score,
			briefText: gig.brief_text,
			clientContext: gig.client_context,
		});
		const updated = await saveProposal(c.env.DB, gig.id, proposal);
		return c.json({ gig: updated });
	} catch (err) {
		// Keep it approved so you can retry the draft without re-approving.
		const current = await getGig(c.env.DB, gig.id);
		return c.json(
			{ gig: current, warning: `proposal failed: ${(err as Error).message}` },
			200,
		);
	}
});

// Reject a gig (no proposal drafted).
app.post("/api/gigs/:id/reject", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	if (!gig) return c.json({ error: "not found" }, 404);
	const updated = await setStatus(c.env.DB, gig.id, "rejected");
	return c.json({ gig: updated });
});

// (Re)generate the proposal for an already-approved/drafted gig.
app.post("/api/gigs/:id/proposal", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	if (!gig) return c.json({ error: "not found" }, 404);
	try {
		const proposal = await writeProposal(c.env, {
			platform: gig.platform,
			fitScore: gig.score,
			briefText: gig.brief_text,
			clientContext: gig.client_context,
		});
		const updated = await saveProposal(c.env.DB, gig.id, proposal);
		return c.json({ gig: updated });
	} catch (err) {
		return c.json({ error: (err as Error).message }, 502);
	}
});

// Mark a drafted gig as submitted/applied.
app.post("/api/gigs/:id/applied", async (c) => {
	const gig = await getGig(c.env.DB, c.req.param("id"));
	if (!gig) return c.json({ error: "not found" }, 404);
	const updated = await setStatus(c.env.DB, gig.id, "applied");
	return c.json({ gig: updated });
});

export default app;
