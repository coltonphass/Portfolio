/* =========================================================
   Colton Phass — Portfolio
   Dot-nav scroll-spy, project filter, reveal-on-scroll,
   Run Profile console, and the draggable skills sphere.
   Vanilla, no dependencies. Safe to load on any page.
   ========================================================= */
(function () {
	"use strict";

	document.documentElement.classList.remove("no-js");
	document.documentElement.classList.add("js");

	document.addEventListener("DOMContentLoaded", function () {
		initScrollSpy();
		initProjectFilter();
		initReveal();
		initRunProfile();
		initSphere();
		initContactForm();
		initGitGraph();
	});

	/* ---------- Dot-nav scroll-spy ---------- */
	function initScrollSpy() {
		var links = Array.prototype.slice.call(
			document.querySelectorAll('.dot-nav a[href^="#"]'),
		);
		if (!links.length || !("IntersectionObserver" in window)) return;

		var map = {};
		var sections = [];
		links.forEach(function (link) {
			var id = link.getAttribute("href").slice(1);
			var section = document.getElementById(id);
			if (section) {
				map[id] = link;
				sections.push(section);
			}
		});

		function setActive(id) {
			links.forEach(function (l) {
				l.classList.toggle("active", l === map[id]);
			});
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) setActive(entry.target.id);
				});
			},
			{ rootMargin: "-45% 0px -50% 0px", threshold: 0 },
		);

		sections.forEach(function (s) {
			observer.observe(s);
		});
	}

	/* ---------- Project category filter ---------- */
	function initProjectFilter() {
		var btns = Array.prototype.slice.call(
			document.querySelectorAll(".filter-btn"),
		);
		var cards = Array.prototype.slice.call(
			document.querySelectorAll("#projects-list .card"),
		);
		if (!btns.length || !cards.length) return;

		btns.forEach(function (btn) {
			btn.addEventListener("click", function () {
				var category = btn.dataset.filter;
				btns.forEach(function (b) {
					b.classList.toggle("active", b === btn);
				});
				cards.forEach(function (card) {
					var show =
						category === "all" || card.dataset.category === category;
					card.style.display = show ? "" : "none";
				});
			});
		});
	}

	/* ---------- Reveal on scroll ---------- */
	function initReveal() {
		var items = Array.prototype.slice.call(
			document.querySelectorAll(".reveal"),
		);
		if (!items.length) return;

		if (!("IntersectionObserver" in window)) {
			items.forEach(function (el) {
				el.classList.add("is-visible");
			});
			return;
		}

		var observer = new IntersectionObserver(
			function (entries, obs) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						obs.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
		);

		items.forEach(function (el) {
			observer.observe(el);
		});
	}

	/* ---------- "Run Profile" mini console ---------- */
	function initRunProfile() {
		var btn = document.getElementById("run-profile");
		var box = document.getElementById("code-console");
		if (!btn || !box) return;

		var lines = Array.prototype.slice.call(box.querySelectorAll(".cline"));
		var played = false;

		btn.addEventListener("click", function () {
			if (played) {
				// second click: jump to the About section
				var about = document.getElementById("about");
				if (about) about.scrollIntoView();
				return;
			}
			played = true;
			box.classList.add("open");
			lines.forEach(function (line, i) {
				setTimeout(
					function () {
						line.classList.add("show");
						box.scrollTop = box.scrollHeight;
					},
					180 * (i + 1),
				);
			});
		});
	}

	/* ---------- Git-graph: draw the line + light nodes on scroll ---------- */
	function initGitGraph() {
		var graph = document.querySelector(".git-graph");
		var fill = document.getElementById("git-line-fill");
		if (!graph || !fill) return;

		var nodes = Array.prototype.slice.call(
			graph.querySelectorAll(".git-node"),
		);
		var reduce =
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		function update() {
			var rect = graph.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;
			var total = graph.offsetHeight;
			// the "draw head" sits ~55% down the viewport
			var filled = vh * 0.55 - rect.top;
			filled = Math.max(0, Math.min(total, filled));
			if (reduce) filled = total;

			fill.style.height = filled + "px";

			nodes.forEach(function (n) {
				var ny = n.getBoundingClientRect().top - rect.top + 9;
				n.classList.toggle("reached", ny <= filled);
			});
		}

		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
	}

	/* ---------- Contact form (Netlify) with AJAX success ---------- */
	function initContactForm() {
		var form = document.getElementById("contact-form");
		var status = document.getElementById("form-status");
		if (!form) return;

		form.addEventListener("submit", function (e) {
			e.preventDefault();

			var data = new URLSearchParams(new FormData(form)).toString();
			var btn = form.querySelector('button[type="submit"]');
			if (btn) btn.disabled = true;
			if (status) {
				status.className = "form-status";
				status.textContent = "> sending...";
				status.style.display = "block";
				status.style.color = "var(--text-dim)";
			}

			// Post to the current page path; Netlify intercepts form posts on any path.
			fetch(window.location.pathname || "/", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: data,
			})
				.then(function (res) {
					if (!res.ok) throw new Error("HTTP " + res.status);
					form.reset();
					if (status) {
						status.className = "form-status ok";
						status.textContent = "✓ message sent — I'll reply within 24h.";
					}
				})
				.catch(function (err) {
					// Surface the real reason in the console for debugging.
					// "HTTP 404" here usually means Netlify hasn't detected the form yet
					// (redeploy after enabling form detection), or you're testing locally.
					console.error("[contact form] submit failed:", err && err.message);
					if (status) {
						status.className = "form-status err";
						status.textContent =
							"✗ couldn't send — reach me on LinkedIn or GitHub.";
					}
				})
				.finally(function () {
					if (btn) btn.disabled = false;
				});
		});
	}

	/* ---------- Skills universe (draggable 3D tag sphere) ---------- */
	function initSphere() {
		var stage = document.getElementById("sphere-stage");
		var wrap = document.getElementById("universe");
		if (!stage || !wrap) return;

		var nodes = Array.prototype.slice.call(stage.querySelectorAll(".tech-node"));
		if (!nodes.length) return;

		// Hide nodes whose logo fails to load (keeps the sphere clean).
		nodes.forEach(function (n) {
			var img = n.querySelector("img");
			if (img) {
				img.addEventListener("error", function () {
					n.style.display = "none";
				});
			}
		});

		var N = nodes.length;
		var pts = [];
		var golden = Math.PI * (3 - Math.sqrt(5));
		for (var i = 0; i < N; i++) {
			var y = 1 - (i / (N - 1)) * 2; // 1 .. -1
			var r = Math.sqrt(1 - y * y);
			var theta = golden * i;
			pts.push({ x: Math.cos(theta) * r, y: y, z: Math.sin(theta) * r });
		}

		var rotX = -0.2;
		var rotY = 0;
		var velY = 0.0032; // idle auto-spin speed
		var velX = 0;
		var dragging = false;
		var lastX = 0;
		var lastY = 0;

		function radius() {
			return Math.min(wrap.clientWidth, wrap.clientHeight) / 2 - 46;
		}

		function frame() {
			if (!dragging) {
				rotY += velY;
				rotX += velX;
				velX *= 0.95; // ease vertical drift back to flat
			}
			var cx = wrap.clientWidth / 2;
			var cy = wrap.clientHeight / 2;
			var rad = radius();
			var cosY = Math.cos(rotY),
				sinY = Math.sin(rotY);
			var cosX = Math.cos(rotX),
				sinX = Math.sin(rotX);

			for (var i = 0; i < N; i++) {
				var p = pts[i];
				// rotate around Y
				var x1 = p.x * cosY - p.z * sinY;
				var z1 = p.x * sinY + p.z * cosY;
				var y1 = p.y;
				// rotate around X
				var y2 = y1 * cosX - z1 * sinX;
				var z2 = y1 * sinX + z1 * cosX;
				var x2 = x1;

				var depth = (z2 + 1) / 2; // 0 (back) .. 1 (front)
				var scale = 0.55 + depth * 0.6;
				var sx = cx + x2 * rad;
				var sy = cy + y2 * rad;

				var el = nodes[i];
				el.style.transform =
					"translate(" +
					sx +
					"px," +
					sy +
					"px) translate(-50%,-50%) scale(" +
					scale.toFixed(3) +
					")";
				el.style.opacity = (0.35 + depth * 0.65).toFixed(3);
				el.style.zIndex = Math.round(depth * 100);
			}
			requestAnimationFrame(frame);
		}

		function pointerDown(e) {
			dragging = true;
			var pt = e.touches ? e.touches[0] : e;
			lastX = pt.clientX;
			lastY = pt.clientY;
		}
		function pointerMove(e) {
			if (!dragging) return;
			var pt = e.touches ? e.touches[0] : e;
			var dx = pt.clientX - lastX;
			var dy = pt.clientY - lastY;
			lastX = pt.clientX;
			lastY = pt.clientY;
			rotY += dx * 0.006;
			rotX += dy * 0.006;
			// clamp vertical tilt so it never flips upside down
			rotX = Math.max(-1.1, Math.min(1.1, rotX));
			velY = dx * 0.0006 || velY;
		}
		function pointerUp() {
			dragging = false;
		}

		wrap.addEventListener("mousedown", pointerDown);
		window.addEventListener("mousemove", pointerMove);
		window.addEventListener("mouseup", pointerUp);
		wrap.addEventListener("touchstart", pointerDown, { passive: true });
		wrap.addEventListener("touchmove", pointerMove, { passive: true });
		wrap.addEventListener("touchend", pointerUp);

		requestAnimationFrame(frame);
	}
})();
