/* =========================================================
   Colton Phass — portfolio
   Theme toggle, contact form, footer year. Nothing else.
   ========================================================= */
(function () {
	"use strict";

	document.addEventListener("DOMContentLoaded", function () {
		initTheme();
		initContactForm();
		initYear();
	});

	/* ---------- Theme ---------- */
	function initTheme() {
		var btn = document.getElementById("theme-toggle");
		if (!btn) return;

		var query = window.matchMedia
			? window.matchMedia("(prefers-color-scheme: dark)")
			: null;

		// What the reader is actually looking at right now: an explicit
		// choice if they made one, otherwise whatever the OS reports.
		function current() {
			var forced = document.documentElement.getAttribute("data-theme");
			if (forced === "light" || forced === "dark") return forced;
			return query && query.matches ? "dark" : "light";
		}

		function describe() {
			var next = current() === "dark" ? "light" : "dark";
			btn.setAttribute("aria-label", "Switch to " + next + " theme");
		}

		btn.addEventListener("click", function () {
			var next = current() === "dark" ? "light" : "dark";
			document.documentElement.setAttribute("data-theme", next);
			try {
				localStorage.setItem("theme", next);
			} catch (e) {
				// Private mode or blocked storage: the choice just won't persist.
			}
			describe();
		});

		// Follow the OS while the reader hasn't overridden it.
		if (query && query.addEventListener) {
			query.addEventListener("change", describe);
		}

		describe();
	}

	/* ---------- Contact form (Netlify, submitted over fetch) ---------- */
	function initContactForm() {
		var form = document.getElementById("contact-form");
		var status = document.getElementById("form-status");
		if (!form) return;

		form.addEventListener("submit", function (e) {
			e.preventDefault();

			var body = new URLSearchParams(new FormData(form)).toString();
			var btn = form.querySelector('button[type="submit"]');
			if (btn) btn.disabled = true;
			if (status) {
				status.className = "form-status";
				status.textContent = "Sending…";
			}

			// Netlify intercepts form posts on any path of the deployed site.
			fetch(window.location.pathname || "/", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body,
			})
				.then(function (res) {
					if (!res.ok) throw new Error("HTTP " + res.status);
					form.reset();
					if (status) {
						status.className = "form-status ok";
						status.textContent = "Sent — I'll reply within a day or so.";
					}
				})
				.catch(function (err) {
					// A 404 here usually means Netlify hasn't picked the form up yet
					// (redeploy with form detection on), or you're testing locally.
					console.error("[contact] submit failed:", err && err.message);
					if (status) {
						status.className = "form-status err";
						status.textContent = "Didn't send — try LinkedIn or GitHub.";
					}
				})
				.then(function () {
					if (btn) btn.disabled = false;
				});
		});
	}

	/* ---------- Footer year ---------- */
	function initYear() {
		var el = document.getElementById("year");
		if (el) el.textContent = new Date().getFullYear();
	}
})();
