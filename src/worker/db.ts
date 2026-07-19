// D1 access layer for gigs. Thin, typed helpers over prepared statements.

import type {
	Gig,
	GigStatus,
	MatchedSector,
	NewGigInput,
	Platform,
	ScoreResult,
	Source,
} from "../shared/types";

// Shape as stored in D1 (SQLite has no boolean/enum; everything is text/int).
interface GigRow {
	id: string;
	platform: string;
	title: string | null;
	brief_text: string;
	client_context: string | null;
	url: string | null;
	source: string;
	score: number | null;
	matched_sector: string | null;
	score_reason: string | null;
	status: string;
	proposal: string | null;
	created_at: string;
	updated_at: string;
}

function rowToGig(r: GigRow): Gig {
	return {
		id: r.id,
		platform: r.platform as Platform,
		title: r.title,
		brief_text: r.brief_text,
		client_context: r.client_context,
		url: r.url,
		source: r.source as Source,
		score: r.score,
		matched_sector: r.matched_sector as MatchedSector | null,
		score_reason: r.score_reason,
		status: r.status as GigStatus,
		proposal: r.proposal,
		created_at: r.created_at,
		updated_at: r.updated_at,
	};
}

export async function createGig(
	db: D1Database,
	input: NewGigInput,
): Promise<Gig> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO gigs (id, platform, title, brief_text, client_context, url, source, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
		)
		.bind(
			id,
			input.platform,
			input.title ?? null,
			input.brief_text,
			input.client_context ?? null,
			input.url ?? null,
			input.source ?? "paste",
			now,
			now,
		)
		.run();
	const gig = await getGig(db, id);
	if (!gig) throw new Error("Failed to read back created gig");
	return gig;
}

export async function getGig(db: D1Database, id: string): Promise<Gig | null> {
	const row = await db
		.prepare(`SELECT * FROM gigs WHERE id = ?`)
		.bind(id)
		.first<GigRow>();
	return row ? rowToGig(row) : null;
}

export async function listGigs(
	db: D1Database,
	status?: GigStatus,
): Promise<Gig[]> {
	// Order by decision-usefulness: highest score first, newest as tiebreak.
	const stmt = status
		? db
				.prepare(
					`SELECT * FROM gigs WHERE status = ? ORDER BY score DESC NULLS LAST, created_at DESC`,
				)
				.bind(status)
		: db.prepare(
				`SELECT * FROM gigs ORDER BY score DESC NULLS LAST, created_at DESC`,
			);
	const { results } = await stmt.all<GigRow>();
	return (results ?? []).map(rowToGig);
}

export async function saveScore(
	db: D1Database,
	id: string,
	score: ScoreResult,
): Promise<Gig | null> {
	await db
		.prepare(
			`UPDATE gigs SET score = ?, matched_sector = ?, score_reason = ?,
			 status = CASE WHEN status = 'new' THEN 'scored' ELSE status END,
			 updated_at = ? WHERE id = ?`,
		)
		.bind(score.score, score.matched_sector, score.reason, new Date().toISOString(), id)
		.run();
	return getGig(db, id);
}

export async function setStatus(
	db: D1Database,
	id: string,
	status: GigStatus,
): Promise<Gig | null> {
	await db
		.prepare(`UPDATE gigs SET status = ?, updated_at = ? WHERE id = ?`)
		.bind(status, new Date().toISOString(), id)
		.run();
	return getGig(db, id);
}

export async function saveProposal(
	db: D1Database,
	id: string,
	proposal: string,
): Promise<Gig | null> {
	await db
		.prepare(
			`UPDATE gigs SET proposal = ?, status = 'drafted', updated_at = ? WHERE id = ?`,
		)
		.bind(proposal, new Date().toISOString(), id)
		.run();
	return getGig(db, id);
}
