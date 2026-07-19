// Anthropic client for scoring and proposal writing, plus a deterministic
// keyless fallback so the whole pipeline runs in local dev without an API key.
// The fallback is clearly heuristic and is only used when ANTHROPIC_API_KEY is
// absent, so `wrangler dev` and the verify pass work out of the box.

import type { MatchedSector, Platform, ScoreResult } from "../shared/types";
import {
	FIT_SCORE_SYSTEM,
	PROPOSAL_SYSTEM,
	buildProposalUserPrompt,
	buildScoreUserPrompt,
} from "./profile";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Sensible defaults: a fast, cheap model for scoring and a stronger one for the
// proposal. Override per-deployment via wrangler vars if desired.
const DEFAULT_SCORING_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_PROPOSAL_MODEL = "claude-sonnet-5";

interface ClaudeEnv {
	ANTHROPIC_API_KEY?: string;
	SCORING_MODEL?: string;
	PROPOSAL_MODEL?: string;
}

async function callClaude(
	env: ClaudeEnv,
	model: string,
	system: string,
	user: string,
	maxTokens: number,
): Promise<string> {
	const res = await fetch(ANTHROPIC_URL, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-api-key": env.ANTHROPIC_API_KEY as string,
			"anthropic-version": ANTHROPIC_VERSION,
		},
		body: JSON.stringify({
			model,
			max_tokens: maxTokens,
			system,
			messages: [{ role: "user", content: user }],
		}),
	});

	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 500)}`);
	}

	const data = (await res.json()) as {
		content?: Array<{ type: string; text?: string }>;
	};
	const text = (data.content ?? [])
		.filter((b) => b.type === "text")
		.map((b) => b.text ?? "")
		.join("")
		.trim();
	if (!text) throw new Error("Anthropic API returned empty content");
	return text;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
export async function scoreGig(
	env: ClaudeEnv,
	briefText: string,
): Promise<ScoreResult> {
	if (!env.ANTHROPIC_API_KEY) return mockScore(briefText);

	const raw = await callClaude(
		env,
		env.SCORING_MODEL || DEFAULT_SCORING_MODEL,
		FIT_SCORE_SYSTEM,
		buildScoreUserPrompt(briefText),
		300,
	);
	return parseScore(raw);
}

function parseScore(raw: string): ScoreResult {
	// The prompt asks for bare JSON, but be defensive about stray prose/fences.
	const match = raw.match(/\{[\s\S]*\}/);
	if (!match) throw new Error(`Score response was not JSON: ${raw.slice(0, 200)}`);
	const parsed = JSON.parse(match[0]) as Partial<ScoreResult>;
	const score = clampScore(parsed.score);
	return {
		score,
		reason: typeof parsed.reason === "string" ? parsed.reason : "",
		matched_sector: normalizeSector(parsed.matched_sector),
	};
}

function clampScore(n: unknown): number {
	const v = typeof n === "number" ? n : Number(n);
	if (!Number.isFinite(v)) return 0;
	return Math.max(0, Math.min(100, Math.round(v)));
}

const SECTORS: MatchedSector[] = [
	"sovereign_credit",
	"trade_finance",
	"fintech",
	"market_entry",
	"general_strategy",
	"islamic_finance",
	"none",
];

function normalizeSector(s: unknown): MatchedSector {
	return SECTORS.includes(s as MatchedSector) ? (s as MatchedSector) : "none";
}

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------
export async function writeProposal(
	env: ClaudeEnv,
	args: {
		platform: Platform;
		fitScore: number | null;
		briefText: string;
		clientContext: string | null;
	},
): Promise<string> {
	if (!env.ANTHROPIC_API_KEY) return mockProposal(args);

	return callClaude(
		env,
		env.PROPOSAL_MODEL || DEFAULT_PROPOSAL_MODEL,
		PROPOSAL_SYSTEM,
		buildProposalUserPrompt(args),
		1200,
	);
}

// ---------------------------------------------------------------------------
// Keyless fallbacks (local dev only)
// ---------------------------------------------------------------------------
interface SectorRule {
	sector: MatchedSector;
	weight: number;
	keywords: string[];
}

const SECTOR_RULES: SectorRule[] = [
	{
		sector: "sovereign_credit",
		weight: 90,
		keywords: ["sovereign", "country risk", "credit rating", "ratings", "fitch", "moody", "debt management", "default risk"],
	},
	{
		sector: "trade_finance",
		weight: 88,
		keywords: ["trade finance", "export finance", "letter of credit", "structured finance", "cross-border credit", "afreximbank"],
	},
	{
		sector: "fintech",
		weight: 82,
		keywords: ["fintech", "regtech", "payments", "tokeniz", "blockchain", "digital assets", "dlt", "smart contract"],
	},
	{
		sector: "market_entry",
		weight: 85,
		keywords: ["market entry", "gcc", "mena", "saudi", "uae", "go-to-market", "expansion", "market sizing"],
	},
	{
		sector: "islamic_finance",
		weight: 80,
		keywords: ["islamic finance", "sukuk", "sharia", "shariah"],
	},
	{
		sector: "general_strategy",
		weight: 62,
		keywords: ["strategy", "due diligence", "financial model", "business case", "research", "commercial", "valuation"],
	},
];

const POOR_FIT_KEYWORDS = ["logo", "design", "wordpress", "frontend", "react app", "mobile app", "seo", "video edit", "copywriting"];

function mockScore(briefText: string): ScoreResult {
	const text = briefText.toLowerCase();
	let best: SectorRule | null = null;
	for (const rule of SECTOR_RULES) {
		const hits = rule.keywords.filter((k) => text.includes(k)).length;
		if (hits > 0) {
			const score = Math.min(rule.weight + (hits - 1) * 3, 98);
			if (!best || score > best.weight) best = { ...rule, weight: score };
		}
	}
	const poor = POOR_FIT_KEYWORDS.some((k) => text.includes(k));
	if (poor && (!best || best.weight < 70)) {
		return {
			score: 20,
			reason: "[mock] Reads as design/dev/marketing work outside the strategy-finance profile.",
			matched_sector: "none",
		};
	}
	if (!best) {
		return {
			score: 35,
			reason: "[mock] No clear match to sovereign credit, trade finance, FinTech, or MENA market entry.",
			matched_sector: "none",
		};
	}
	return {
		score: best.weight,
		reason: `[mock] Matches ${best.sector.replace(/_/g, " ")} language in the brief.`,
		matched_sector: best.sector,
	};
}

const CREDENTIAL_BY_SECTOR: Record<MatchedSector, string> = {
	sovereign_credit:
		"This maps directly to my sovereign credit rating work at IIRA in Bahrain and recent advisory to Egypt's Ministry of Finance Debt Management Unit using the Fitch, Moody's, and LSEG frameworks.",
	trade_finance:
		"This is close to my trade finance research at Afreximbank and my MSc FinTech dissertation on cross-border credit infrastructure for EU and GCC markets.",
	fintech:
		"This sits in my MSc FinTech track at Dublin Business School, including tokenized letters of credit and DLT-based credit infrastructure across Ireland and the GCC.",
	market_entry:
		"This is close to my market-entry research across GCC and MENA for a top-3 strategy firm at Infomineo, with bilingual Arabic/English context on the ground.",
	general_strategy:
		"This draws on my institutional research background at IIRA, Afreximbank, and Infomineo, applied as hands-on advisory for GCC, MENA, and EU clients.",
	islamic_finance:
		"This maps to my IIRA background at an Islamic rating agency and the Islamic finance focus in my DBA work.",
	none: "This draws on my institutional research background at IIRA, Afreximbank, and Infomineo, applied as hands-on advisory for GCC, MENA, and EU clients.",
};

function mockProposal(args: {
	platform: Platform;
	fitScore: number | null;
	briefText: string;
	clientContext: string | null;
}): string {
	const sector = mockScore(args.briefText).matched_sector;
	const firstLine = args.briefText.trim().split(/\n/)[0]?.slice(0, 140) || "your brief";
	const proof = CREDENTIAL_BY_SECTOR[sector];
	return [
		`[MOCK DRAFT, no API key set] The core of "${firstLine}" is a decision problem, not a research errand: you need the answer framed before the data, not after.`,
		"",
		"My read is that the real constraint is getting to a defensible recommendation fast, and the path is to structure the question, pressure-test it against evidence, and return a one-page call you can act on.",
		"",
		"I would run this in three parts: (1) frame the core question and the decision it feeds, (2) gather and stress-test the evidence that moves the answer, (3) return a one-page recommendation with the key number and the main risk quantified.",
		"",
		proof,
		"",
		"The outcome is a decision you can defend to whoever signs off, with the downside sized.",
		"",
		"Fifteen minutes this week to confirm scope?",
	].join("\n");
}
