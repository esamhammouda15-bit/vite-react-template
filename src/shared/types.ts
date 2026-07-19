// Shared types used by both the Worker API and the React dashboard.

export type Platform =
	| "catalant"
	| "btg"
	| "high5"
	| "upwork"
	| "open-source"
	| "direct"
	| "other";

// Where the gig text came into the system. Kept separate from Platform so we
// can later distinguish an email-alert-sourced Catalant gig from a pasted one.
export type Source = "paste" | "email" | "open-source";

export type MatchedSector =
	| "sovereign_credit"
	| "trade_finance"
	| "fintech"
	| "market_entry"
	| "general_strategy"
	| "islamic_finance"
	| "none";

export type GigStatus =
	| "new" // just captured, not yet scored
	| "scored" // scored, awaiting your decision
	| "approved" // you approved it
	| "rejected" // you rejected it
	| "drafted" // proposal has been written
	| "applied"; // you submitted the proposal

export interface Gig {
	id: string;
	platform: Platform;
	title: string | null;
	brief_text: string;
	client_context: string | null;
	url: string | null;
	source: Source;
	score: number | null;
	matched_sector: MatchedSector | null;
	score_reason: string | null;
	status: GigStatus;
	proposal: string | null;
	created_at: string;
	updated_at: string;
}

export interface ScoreResult {
	score: number;
	reason: string;
	matched_sector: MatchedSector;
}

export interface NewGigInput {
	platform: Platform;
	title?: string;
	brief_text: string;
	client_context?: string;
	url?: string;
	source?: Source;
}

// Score at or above this is worth surfacing / drafting a proposal for.
export const FIT_THRESHOLD = 60;

export const PLATFORM_LABELS: Record<Platform, string> = {
	catalant: "Catalant",
	btg: "BTG",
	high5: "High5",
	upwork: "Upwork",
	"open-source": "Open source",
	direct: "Direct",
	other: "Other",
};
