import "./App.css";

const CONTACT_EMAIL = "esam.hammouda.15@gmail.com";
const MAILTO =
	`mailto:${CONTACT_EMAIL}` +
	`?subject=${encodeURIComponent("Nabka — Sidr Fruit Sugar & Caramel")}` +
	`&body=${encodeURIComponent("Hi Nabka team,\n\nI'd like to learn more about:\n")}`;

function App() {
	return (
		<>
			<header className="nav">
				<div className="nav-inner">
					<a className="brand" href="#top">
						<span className="brand-mark" aria-hidden="true" />
						Nabka
					</a>
					<nav className="nav-links">
						<a href="#fruit">The Fruit</a>
						<a href="#products">Products</a>
						<a href="#market">Why Now</a>
						<a href="#impact">Impact</a>
						<a href="#invest">Investors</a>
					</nav>
					<a className="btn btn-primary nav-cta" href="#invest">
						Investor Overview
					</a>
				</div>
			</header>

			<main id="top">
				<section className="hero">
					<div className="hero-inner">
						<span className="badge">Made in Egypt 🇪🇬 · Pre-seed</span>
						<h1>
							The sweetness Egypt <em>overlooked</em>.
						</h1>
						<p className="lede">
							Nabka (نبق) turns the wild, uncommercialized Sidr fruit into
							premium natural sugar and caramel — unlocking a second income
							stream from trees Egyptian and Gulf farmers already grow, mostly
							for honey.
						</p>
						<div className="hero-actions">
							<a className="btn btn-primary" href={MAILTO}>
								Partner With Us
							</a>
							<a className="btn btn-ghost" href="#fruit">
								Discover Sidr ↓
							</a>
						</div>
					</div>
				</section>

				<section id="fruit" className="section">
					<div className="section-inner">
						<h2 className="eyebrow">The Untapped Fruit</h2>
						<h3>Famous for its honey. Ignored for its fruit.</h3>
						<div className="split">
							<div>
								<p>
									<strong>Sidr</strong> (<em>Ziziphus spina-christi</em>), known
									locally as <em>nabk</em>, is a drought-resistant tree grown
									across Egypt's Sinai, Upper Egypt and desert oases, and widely
									across the Gulf peninsula — Saudi Arabia, Yemen, Oman and the
									UAE.
								</p>
								<p>
									Sidr honey is among the most prized and expensive honeys in
									the world. But the fruit itself — sweet, date-like, and
									nutrient-dense — is left to ripen, drop, and rot under the
									same trees. No commercial supply chain exists for it today.
								</p>
								<p>
									That's the opportunity: millions of established trees, a
									fruit harvest already happening in nature, and almost zero
									commercial use of it.
								</p>
							</div>
							<ul className="fact-list">
								<li>
									<span className="fact-num">0</span>
									<span>new land or irrigation required</span>
								</li>
								<li>
									<span className="fact-num">2</span>
									<span>revenue streams from one tree — honey and fruit</span>
								</li>
								<li>
									<span className="fact-num">EG + Gulf</span>
									<span>region already growing Sidr at scale</span>
								</li>
							</ul>
						</div>
					</div>
				</section>

				<section id="products" className="section section-alt">
					<div className="section-inner">
						<h2 className="eyebrow">From Orchard to Pantry</h2>
						<h3>Two products, one overlooked fruit.</h3>
						<div className="product-grid">
							<article className="product-card">
								<div className="product-icon" aria-hidden="true">
									🟤
								</div>
								<h4>Sidr Sugar</h4>
								<p>
									Ripe Sidr fruit, sun-dried and milled into a fine, minimally
									processed natural sweetener — a clean-label alternative to
									date sugar or coconut sugar, with a warm, caramel-like taste.
								</p>
								<ul>
									<li>Single ingredient, no refining</li>
									<li>Naturally sweet — no added sugar needed</li>
									<li>Targets health-food, bakery &amp; specialty retail</li>
								</ul>
							</article>
							<article className="product-card">
								<div className="product-icon" aria-hidden="true">
									🍯
								</div>
								<h4>Sidr Caramel</h4>
								<p>
									Ripe Sidr fruit slow-cooked down into a rich, spreadable
									caramel — no refined sugar or corn syrup required to get that
									deep, date-like flavor.
								</p>
								<ul>
									<li>Confectionery &amp; bakery ingredient</li>
									<li>Retail jars for gifting and direct sale</li>
									<li>Private-label potential for Gulf specialty grocers</li>
								</ul>
							</article>
						</div>
					</div>
				</section>

				<section id="market" className="section">
					<div className="section-inner">
						<h2 className="eyebrow">Why Now</h2>
						<h3>A clean-label ingredient story, ready to tell.</h3>
						<div className="split">
							<ul className="check-list">
								<li>
									Global demand for natural, single-ingredient sweeteners
									(date, coconut, monk fruit) is rising as consumers move away
									from refined sugar.
								</li>
								<li>
									Sidr has no commercial competitor today — it is a genuinely
									new ingredient category, not a crowded one.
								</li>
								<li>
									Egypt's agricultural export channels into the Gulf and Europe
									already exist for dates, honey and dried fruit — Sidr can
									travel the same routes.
								</li>
								<li>
									The "heritage ingredient" and "upcycled crop" positioning
									appeals to both specialty food buyers and impact investors.
								</li>
							</ul>
							<div className="note-card">
								<strong>Note for investors:</strong>
								<p>
									Market-size figures (TAM/SAM/SOM), pricing and unit economics
									are being finalized with primary data before this deck is
									submitted to funding platforms — placeholders below should be
									replaced with verified numbers, not left as estimates.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section id="model" className="section section-alt">
					<div className="section-inner">
						<h2 className="eyebrow">Business Model</h2>
						<h3>Three ways Sidr becomes revenue.</h3>
						<div className="model-grid">
							<div className="model-card">
								<h4>B2B Ingredient</h4>
								<p>
									Wholesale Sidr sugar and caramel to bakeries, chocolatiers and
									clean-label food brands.
								</p>
							</div>
							<div className="model-card">
								<h4>Direct-to-Consumer</h4>
								<p>
									Branded retail jars sold online and through specialty grocers
									— positioned as an Egyptian heritage product for gifting.
								</p>
							</div>
							<div className="model-card">
								<h4>Export &amp; Private Label</h4>
								<p>
									Bulk and white-label supply into Gulf and EU specialty-food
									import channels, alongside existing date and honey trade
									routes.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section id="impact" className="section">
					<div className="section-inner">
						<h2 className="eyebrow">Impact</h2>
						<h3>Value from waste, without new land.</h3>
						<div className="split">
							<ul className="check-list">
								<li>
									New income for smallholder farmers from fruit that already
									falls and rots today — no new planting required.
								</li>
								<li>
									Sidr trees are drought-tolerant and already established, so
									the model adds zero incremental water or land footprint.
								</li>
								<li>
									Reduces post-harvest fruit waste on farms across Egypt's rural
									and desert communities.
								</li>
								<li>
									Preserves and modernizes a heritage crop shared across Egypt
									and the Gulf.
								</li>
							</ul>
						</div>
					</div>
				</section>

				<section id="invest" className="section section-dark">
					<div className="section-inner">
						<h2 className="eyebrow eyebrow-light">For Investors &amp; Partners</h2>
						<h3 className="invest-title">Building Sidr into Egypt's next export ingredient.</h3>
						<div className="split">
							<div>
								<p>
									Nabka is at the pre-seed / idea validation stage. We are
									preparing our application for funding and incubation support
									through Egypt's startup ecosystem, including{" "}
									<strong>Startup Gate Egypt</strong>.
								</p>
								<p className="placeholder-line">
									Funding ask: <span>[amount — to confirm]</span> · Stage:{" "}
									<span>[pre-seed / idea]</span>
								</p>
								<p>Planned use of funds:</p>
								<ul className="check-list check-list-light">
									<li>Pilot drying &amp; milling line for Sidr sugar</li>
									<li>Food-safety testing and packaging for first batches</li>
									<li>
										Farmer partnerships in an initial set of Sidr-growing
										villages/oases
									</li>
									<li>Market testing with bakeries and specialty retailers</li>
								</ul>
							</div>
							<div className="invest-card">
								<h4>Get in touch</h4>
								<p>
									Founder, farmer partner, distributor, or investor — reach out
									directly.
								</p>
								<a className="btn btn-primary" href={MAILTO}>
									Email {CONTACT_EMAIL}
								</a>
								<p className="invest-location">Based in Egypt</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="footer">
				<p>© 2026 Nabka — Sidr Fruit Sugar &amp; Caramel. Made in Egypt.</p>
			</footer>
		</>
	);
}

export default App;
