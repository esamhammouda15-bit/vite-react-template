import { useCallback, useEffect, useMemo, useState } from "react";
import {
	FIT_THRESHOLD,
	PLATFORM_LABELS,
	type Gig,
	type GigStatus,
	type Platform,
} from "../shared/types";
import "./App.css";

type Filter = "queue" | "approved" | "rejected" | "all";

const FILTER_TABS: { key: Filter; label: string }[] = [
	{ key: "queue", label: "Review queue" },
	{ key: "approved", label: "Drafted" },
	{ key: "rejected", label: "Rejected" },
	{ key: "all", label: "All" },
];

const PLATFORM_OPTIONS: Platform[] = [
	"catalant",
	"btg",
	"high5",
	"upwork",
	"open-source",
	"direct",
	"other",
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
	});
	const data = (await res.json()) as T & { error?: string };
	if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
	return data;
}

function scoreBand(score: number | null): string {
	if (score === null) return "band-none";
	if (score >= 80) return "band-core";
	if (score >= FIT_THRESHOLD) return "band-fit";
	if (score >= 50) return "band-adjacent";
	return "band-poor";
}

function App() {
	const [gigs, setGigs] = useState<Gig[]>([]);
	const [filter, setFilter] = useState<Filter>("queue");
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mock, setMock] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const { gigs } = await api<{ gigs: Gig[] }>("/api/gigs");
			setGigs(gigs);
			setError(null);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
		api<{ mock: boolean }>("/api/health")
			.then((h) => setMock(h.mock))
			.catch(() => {});
	}, [load]);

	const patch = useCallback((gig: Gig) => {
		setGigs((prev) => prev.map((g) => (g.id === gig.id ? gig : g)));
	}, []);

	const act = useCallback(
		async (id: string, path: string) => {
			setBusyId(id);
			setError(null);
			try {
				const { gig, warning } = await api<{ gig: Gig; warning?: string }>(
					`/api/gigs/${id}/${path}`,
					{ method: "POST" },
				);
				if (gig) patch(gig);
				if (warning) setError(warning);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setBusyId(null);
			}
		},
		[patch],
	);

	const visible = useMemo(() => {
		switch (filter) {
			case "queue":
				return gigs.filter((g) => g.status === "new" || g.status === "scored");
			case "approved":
				return gigs.filter(
					(g) =>
						g.status === "approved" ||
						g.status === "drafted" ||
						g.status === "applied",
				);
			case "rejected":
				return gigs.filter((g) => g.status === "rejected");
			default:
				return gigs;
		}
	}, [gigs, filter]);

	const counts = useMemo(
		() => ({
			queue: gigs.filter((g) => g.status === "new" || g.status === "scored")
				.length,
			recommended: gigs.filter(
				(g) =>
					(g.status === "new" || g.status === "scored") &&
					(g.score ?? 0) >= FIT_THRESHOLD,
			).length,
		}),
		[gigs],
	);

	return (
		<div className="app">
			<header className="topbar">
				<div>
					<h1>Avaris Gig Radar</h1>
					<p className="sub">
						Scored strategy and research briefs, MBB-style proposals on approval.
					</p>
				</div>
				<div className="topbar-meta">
					<span className="pill">{counts.queue} in queue</span>
					<span className="pill pill-accent">
						{counts.recommended} recommended
					</span>
					{mock && (
						<span className="pill pill-warn" title="No ANTHROPIC_API_KEY set">
							mock mode
						</span>
					)}
				</div>
			</header>

			<AddGig onAdded={(g) => setGigs((prev) => [g, ...prev])} />

			<nav className="tabs">
				{FILTER_TABS.map((t) => (
					<button
						key={t.key}
						className={filter === t.key ? "tab tab-active" : "tab"}
						onClick={() => setFilter(t.key)}
					>
						{t.label}
					</button>
				))}
				<button className="tab tab-ghost" onClick={load} disabled={loading}>
					{loading ? "…" : "Refresh"}
				</button>
			</nav>

			{error && <div className="banner banner-error">{error}</div>}

			{visible.length === 0 && !loading ? (
				<div className="empty">
					Nothing here yet. Paste a brief above to score it.
				</div>
			) : (
				<div className="cards">
					{visible.map((gig) => (
						<GigCard
							key={gig.id}
							gig={gig}
							busy={busyId === gig.id}
							onApprove={() => act(gig.id, "approve")}
							onReject={() => act(gig.id, "reject")}
							onRedraft={() => act(gig.id, "proposal")}
							onRescore={() => act(gig.id, "score")}
							onApplied={() => act(gig.id, "applied")}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function AddGig({ onAdded }: { onAdded: (g: Gig) => void }) {
	const [open, setOpen] = useState(false);
	const [platform, setPlatform] = useState<Platform>("upwork");
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [brief, setBrief] = useState("");
	const [context, setContext] = useState("");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const submit = async () => {
		if (!brief.trim()) {
			setErr("Paste the brief text first.");
			return;
		}
		setBusy(true);
		setErr(null);
		try {
			const { gig } = await api<{ gig: Gig }>("/api/gigs", {
				method: "POST",
				body: JSON.stringify({
					platform,
					title: title.trim() || undefined,
					url: url.trim() || undefined,
					brief_text: brief.trim(),
					client_context: context.trim() || undefined,
				}),
			});
			onAdded(gig);
			setTitle("");
			setUrl("");
			setBrief("");
			setContext("");
			setOpen(false);
		} catch (e) {
			setErr((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	if (!open) {
		return (
			<button className="add-toggle" onClick={() => setOpen(true)}>
				+ Paste a brief to score
			</button>
		);
	}

	return (
		<div className="add-panel">
			<div className="add-row">
				<label>
					Platform
					<select
						value={platform}
						onChange={(e) => setPlatform(e.target.value as Platform)}
					>
						{PLATFORM_OPTIONS.map((p) => (
							<option key={p} value={p}>
								{PLATFORM_LABELS[p]}
							</option>
						))}
					</select>
				</label>
				<label className="grow">
					Title (optional)
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. GCC market-entry unit economics"
					/>
				</label>
			</div>
			<label>
				Link (optional)
				<input
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://…"
				/>
			</label>
			<label>
				Brief text
				<textarea
					value={brief}
					onChange={(e) => setBrief(e.target.value)}
					rows={5}
					placeholder="Paste the full gig / RFP text here."
				/>
			</label>
			<label>
				Client / sector context (optional)
				<textarea
					value={context}
					onChange={(e) => setContext(e.target.value)}
					rows={2}
					placeholder="Anything you already know about the client or sector."
				/>
			</label>
			{err && <div className="banner banner-error">{err}</div>}
			<div className="add-actions">
				<button className="btn btn-ghost" onClick={() => setOpen(false)}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={submit} disabled={busy}>
					{busy ? "Scoring…" : "Score it"}
				</button>
			</div>
		</div>
	);
}

const STATUS_LABEL: Record<GigStatus, string> = {
	new: "New",
	scored: "Scored",
	approved: "Approved",
	rejected: "Rejected",
	drafted: "Drafted",
	applied: "Applied",
};

function GigCard({
	gig,
	busy,
	onApprove,
	onReject,
	onRedraft,
	onRescore,
	onApplied,
}: {
	gig: Gig;
	busy: boolean;
	onApprove: () => void;
	onReject: () => void;
	onRedraft: () => void;
	onRescore: () => void;
	onApplied: () => void;
}) {
	const [showProposal, setShowProposal] = useState(false);
	const [copied, setCopied] = useState(false);
	const inQueue = gig.status === "new" || gig.status === "scored";

	const copy = async () => {
		if (!gig.proposal) return;
		await navigator.clipboard.writeText(gig.proposal);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<article className="card">
			<div className="card-head">
				<span className={`score ${scoreBand(gig.score)}`}>
					{gig.score ?? "—"}
				</span>
				<div className="card-title">
					<div className="card-title-row">
						<span className="platform">{PLATFORM_LABELS[gig.platform]}</span>
						<span className="status-chip">{STATUS_LABEL[gig.status]}</span>
						{gig.matched_sector && gig.matched_sector !== "none" && (
							<span className="sector">
								{gig.matched_sector.replace(/_/g, " ")}
							</span>
						)}
					</div>
					<h3>
						{gig.url ? (
							<a href={gig.url} target="_blank" rel="noreferrer">
								{gig.title || firstLine(gig.brief_text)}
							</a>
						) : (
							gig.title || firstLine(gig.brief_text)
						)}
					</h3>
				</div>
			</div>

			{gig.score_reason && <p className="reason">{gig.score_reason}</p>}
			<p className="brief">{gig.brief_text}</p>

			<div className="card-actions">
				{inQueue && (
					<>
						<button
							className="btn btn-primary"
							onClick={onApprove}
							disabled={busy}
						>
							{busy ? "Drafting…" : "Approve + draft"}
						</button>
						<button className="btn btn-ghost" onClick={onReject} disabled={busy}>
							Reject
						</button>
						<button className="btn btn-ghost" onClick={onRescore} disabled={busy}>
							Re-score
						</button>
					</>
				)}
				{gig.proposal && (
					<button
						className="btn btn-ghost"
						onClick={() => setShowProposal((v) => !v)}
					>
						{showProposal ? "Hide proposal" : "View proposal"}
					</button>
				)}
				{gig.status === "drafted" && (
					<button className="btn btn-ghost" onClick={onApplied} disabled={busy}>
						Mark applied
					</button>
				)}
			</div>

			{showProposal && gig.proposal && (
				<div className="proposal">
					<div className="proposal-tools">
						<button className="btn btn-mini" onClick={copy}>
							{copied ? "Copied" : "Copy"}
						</button>
						<button
							className="btn btn-mini"
							onClick={onRedraft}
							disabled={busy}
						>
							{busy ? "…" : "Regenerate"}
						</button>
					</div>
					<pre>{gig.proposal}</pre>
				</div>
			)}
		</article>
	);
}

function firstLine(text: string): string {
	const line = text.trim().split(/\n/)[0] ?? "";
	return line.length > 90 ? `${line.slice(0, 90)}…` : line;
}

export default App;
