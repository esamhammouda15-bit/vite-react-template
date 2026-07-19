-- Gigs captured from any source (pasted, email-alert, open-source poll),
-- scored, and optionally drafted into an MBB-style proposal.
CREATE TABLE IF NOT EXISTS gigs (
	id            TEXT PRIMARY KEY,
	platform      TEXT NOT NULL,
	title         TEXT,
	brief_text    TEXT NOT NULL,
	client_context TEXT,
	url           TEXT,
	source        TEXT NOT NULL DEFAULT 'paste',
	score         INTEGER,
	matched_sector TEXT,
	score_reason  TEXT,
	status        TEXT NOT NULL DEFAULT 'new',
	proposal      TEXT,
	created_at    TEXT NOT NULL,
	updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs (status);
CREATE INDEX IF NOT EXISTS idx_gigs_score ON gigs (score DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_created ON gigs (created_at DESC);
