// ======================================================================
// CONFIG: PAGE TRANSITION (.5s minimum)
// ======================================================================
const TRANSITION_MIN_MS = 350; // .5 seconds minimum
const TRANSITION_KEY = "pt_start";

// Show/hide helpers
function showPageTransition() {
	const overlay = document.getElementById("page-transition");
	const wrap = document.querySelector(".page-wrap");
	if (overlay) overlay.classList.add("is-active");
	if (wrap) wrap.classList.add("is-loading");
}

function hidePageTransition() {
	const overlay = document.getElementById("page-transition");
	const wrap = document.querySelector(".page-wrap");
	if (overlay) overlay.classList.remove("is-active");
	if (wrap) wrap.classList.remove("is-loading");
}

// Intercept internal HTML navigations so we can show loader BEFORE leaving
document.addEventListener("click", (e) => {
	const a = e.target.closest("a");
	if (!a) return;

	const href = a.getAttribute("href");
	if (!href) return;

	// ignore new tab / downloads
	if (a.target === "_blank" || a.hasAttribute("download")) return;

	// ignore hash-only, mailto, tel
	if (
		href.startsWith("#") ||
		href.startsWith("mailto:") ||
		href.startsWith("tel:")
	)
		return;

	// ignore absolute external links
	if (/^https?:\/\//i.test(href)) return;

	// only handle your internal page navigations (.html)
	if (!href.toLowerCase().endsWith(".html")) return;

	// If they click the current page, do nothing
	const current = window.location.pathname.split("/").pop() || "index.html";
	const target = href.split("#")[0];
	if (target === current) return;

	e.preventDefault();

	// Store start time so next page can enforce min duration
	sessionStorage.setItem(TRANSITION_KEY, String(Date.now()));

	// Show loader immediately
	showPageTransition();

	// navigate shortly after (so overlay visibly appears)
	setTimeout(() => {
		window.location.href = href;
	}, 60);
});

// On page load, keep loader up until at least TRANSITION_MIN_MS has passed
document.addEventListener("DOMContentLoaded", () => {
	// If page has loader markup, manage it
	const overlay = document.getElementById("page-transition");
	if (overlay) {
		showPageTransition();

		const start = Number(sessionStorage.getItem(TRANSITION_KEY) || "0");
		const elapsed = start ? Date.now() - start : 0;
		const remaining = Math.max(0, TRANSITION_MIN_MS - elapsed);

		// Clear so refresh doesn't keep delaying
		sessionStorage.removeItem(TRANSITION_KEY);

		setTimeout(() => {
			hidePageTransition();
		}, remaining);
	}

	// Initialize Uses tabs safely (so clicking works even if you refresh on /uses.html)
	initUsesTabsIfPresent();
});

// ======================================================================
// USES TABS (safe + keeps your existing onclick working)
// ======================================================================
function showTab(tabId) {
	// Hide all tab contents
	document.querySelectorAll(".tab-content").forEach((content) => {
		content.classList.remove("active");
	});

	// Remove active class from all tab buttons
	document.querySelectorAll(".tab-btn").forEach((btn) => {
		btn.classList.remove("active");
	});

	// Show selected tab
	const tab = document.getElementById(tabId);
	if (tab) tab.classList.add("active");

	// Add active class to clicked button if available
	if (typeof event !== "undefined" && event && event.target) {
		event.target.classList.add("active");
	}
}

// Optional: make tabs robust on refresh + allow deep links like uses.html#hardware
function initUsesTabsIfPresent() {
	const tabs = document.querySelector(".uses-tabs");
	if (!tabs) return;

	const hash = (window.location.hash || "").replace("#", "").trim();
	const validIds = new Set(["all", "editor", "hardware", "software", "other"]);

	// if URL has a valid hash, activate it
	if (hash && validIds.has(hash)) {
		// activate content
		document
			.querySelectorAll(".tab-content")
			.forEach((c) => c.classList.remove("active"));
		const tab = document.getElementById(hash);
		if (tab) tab.classList.add("active");

		// activate button
		document
			.querySelectorAll(".tab-btn")
			.forEach((b) => b.classList.remove("active"));
		const btn = Array.from(document.querySelectorAll(".tab-btn")).find((b) =>
			(b.getAttribute("onclick") || "").includes(`showTab('${hash}')`),
		);
		if (btn) btn.classList.add("active");
	}
}

// ======================================================================
// PROJECT FILTER
// ======================================================================
function filterProjects() {
	const select = document.getElementById("project-select");
	if (!select) return;

	const category = select.value;
	const projects = document.querySelectorAll("#projects-list .card");

	projects.forEach((project) => {
		if (category === "all" || project.dataset.category === category) {
			project.style.display = "block";
		} else {
			project.style.display = "none";
		}
	});
}
