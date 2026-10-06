/* =========================================================
   Colton Phass portfolio

   Tab management, command palette and a working terminal.
   All of it is enhancement: the hiding rule is scoped to
   [data-app="on"], an attribute that appears nowhere in the
   served HTML and is set below only once JS is demonstrably
   running. If this file never loads, the page is a plain
   scrollable document with every file visible.
   ========================================================= */
(function () {
	"use strict";

	var FILES = [
		{ id: "about", name: "Overview", lang: "Overview" },
		{ id: "experience", name: "Experience", lang: "Experience" },
		{ id: "education", name: "Education", lang: "Education" },
		{ id: "certifications", name: "Certifications", lang: "Certifications" },
		{ id: "toolkit", name: "Skills & Tools", lang: "Skills & Tools" },
		{ id: "listening", name: "Listening", lang: "Listening" },
		{ id: "contact", name: "Contact", lang: "Contact" },
		{ id: "p-ezee", name: "ezee-budget", lang: "Project" },
		{ id: "p-daovien", name: "dao-vien", lang: "Project" },
		{ id: "p-genesis", name: "genesis-alphabetizer", lang: "Project" },
		{ id: "p-shooter", name: "space-shooter", lang: "Project" },
		{ id: "p-homelab", name: "homelab", lang: "Project" },
		{ id: "p-blackjack", name: "blackjack", lang: "Project" },
		{ id: "resume", name: "Résumé", lang: "PDF" },
	];
	var byId = {};
	FILES.forEach(function (f) {
		byId[f.id] = f;
	});

	var open = ["about"];
	var active = "about";
	var els = {};

	document.addEventListener("DOMContentLoaded", function () {
		els = {
			tabs: document.getElementById("tabs"),
			pane: document.getElementById("pane"),
			crumb: document.getElementById("breadcrumb"),
			lang: document.getElementById("st-lang"),
			openCount: document.getElementById("st-open"),
		};

		// Independent steps: one throwing must not skip the others.
		[
			initWorkbench,
			initDrawer,
			initPanels,
			initPreviews,
			initDeck,
			initPalette,
			initTerminal,
			initContactForm,
		].forEach(
			function (fn) {
				try {
					fn();
				} catch (e) {
					console.error("[init] " + fn.name + " failed:", e && e.message);
				}
			},
		);
	});

	/* ---------------- workbench: tabs + tree ---------------- */
	function initWorkbench() {
		if (!els.tabs || !els.pane) return;

		// Safe to start hiding only now.
		document.documentElement.setAttribute("data-app", "on");

		document.querySelectorAll("[data-file]").forEach(function (el) {
			el.addEventListener("click", function (e) {
				e.preventDefault();
				openFile(el.dataset.file);
			});
		});

		// every [data-folder] collapses the [data-tree] with a matching name,
		// so adding a folder in the markup needs no change here
		[].slice.call(document.querySelectorAll(".folder[data-folder]")).forEach(
			function (folder) {
				bindFolder(folder, document.querySelector(
					'.tree[data-tree="' + folder.dataset.folder + '"]',
				));
			},
		);

		render();
	}

	function bindFolder(folder, tree) {
		if (folder && tree) {
			var toggle = function () {
				folder.classList.toggle("collapsed");
				tree.classList.toggle("collapsed");
			};
			folder.addEventListener("click", toggle);
			folder.addEventListener("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggle();
				}
			});
		}
	}

	function render() {
		els.tabs.innerHTML = "";
		open.forEach(function (id) {
			var f = byId[id];
			var tab = document.createElement("span");
			tab.className = "tab" + (id === active ? " is-active" : "");
			tab.appendChild(document.createTextNode(f.name));

			var x = document.createElement("span");
			x.className = "x";
			x.textContent = "×";
			x.title = "Close " + f.name;
			x.addEventListener("click", function (e) {
				e.stopPropagation();
				closeFile(id);
			});
			tab.appendChild(x);
			tab.addEventListener("click", function () {
				openFile(id);
			});
			els.tabs.appendChild(tab);
		});

		FILES.forEach(function (f) {
			var sec = document.getElementById(f.id);
			if (sec) sec.classList.toggle("is-open", f.id === active);
		});

		document.querySelectorAll(".tree a").forEach(function (a) {
			a.classList.toggle("is-active", a.dataset.file === active);
		});

		var f = byId[active];
		if (f) {
			if (els.crumb) {
				els.crumb.innerHTML =
					'Colton Phass<span class="sep">›</span>' + f.name;
			}
			if (els.lang) els.lang.textContent = f.lang;
		}
		if (els.openCount) els.openCount.textContent = open.length + " open";
		els.pane.scrollTop = 0;

		var at = els.tabs.querySelector(".tab.is-active");
		if (at && at.scrollIntoView) {
			at.scrollIntoView({ block: "nearest", inline: "nearest" });
		}
	}

	function openFile(id) {
		if (!byId[id]) return false;
		if (open.indexOf(id) === -1) open.push(id);
		active = id;
		render();
		syncPreviews(id);
		try {
			document.dispatchEvent(new CustomEvent("portfolio:filechange"));
		} catch (e) {}
		return true;
	}

	// A project page is about one project, so its demo just plays. Anything
	// off-screen is paused so a hidden tab is not decoding video in the
	// background.
	function syncPreviews(id) {
		[].slice.call(document.querySelectorAll(".preview[data-src]")).forEach(
			function (box) {
				var inActive = box.closest(".file") &&
					box.closest(".file").id === id;
				if (inActive && box.dataset.autoplay !== "off") {
					if (box._start) box._start();
				} else if (box._stop) {
					box._stop();
				}
			},
		);
	}

	function closeFile(id) {
		var i = open.indexOf(id);
		if (i === -1) return;
		open.splice(i, 1);
		if (!open.length) {
			open = ["about"];
			active = "about";
		} else if (active === id) {
			active = open[Math.max(0, i - 1)];
		}
		render();
	}

	/* ---------------- project previews ----------------
	   The four clips total roughly 24MB, so nothing is fetched up front:
	   each preview carries its URL in data-src and only loads on hover,
	   focus or tap. That keeps the first view cheap for someone skimming
	   on mobile data, and makes the hover actually worth something.
	   -------------------------------------------------- */
	function initPreviews() {
		var previews = [].slice.call(
			document.querySelectorAll(".preview[data-src]"),
		);
		if (!previews.length) return;

		previews.forEach(function (box) {
			var kind = box.dataset.media;
			var url = box.dataset.src;
			var el = box.querySelector(kind === "gif" ? "img" : "video");
			if (!el) return;
			var loaded = false;

			function start() {
				if (!loaded) {
					loaded = true;
					if (kind === "gif") {
						el.addEventListener("load", function () {
							box.classList.add("is-playing");
						});
						el.src = url;
						return;
					}
					el.src = url;
				}
				if (kind === "gif") {
					box.classList.add("is-playing");
					return;
				}
				var played = el.play();
				// Autoplay can still be refused; don't let the rejection surface
				// as an unhandled error, just leave the placeholder showing.
				if (played && played.catch) {
					played
						.then(function () {
							box.classList.add("is-playing");
						})
						.catch(function () {});
				} else {
					box.classList.add("is-playing");
				}
			}

			function stop() {
				if (kind === "gif") return; // a GIF can't be paused; leave it
				if (el.pause) el.pause();
			}

			box._start = start;
			box._stop = stop;

			box.addEventListener("mouseenter", start);
			box.addEventListener("mouseleave", stop);
			// touch and keyboard users get it too
			box.addEventListener("click", start);
			var card = box.closest(".card");
			if (card) {
				card.addEventListener("focusin", start);
				card.addEventListener("focusout", stop);
			}
		});
	}


	/* ---------------- explorer drawer ----------------
	   Under 950px the explorer is off-canvas. Without this the tab strip
	   is the only navigation, and it starts with a single open file, so a
	   phone had no way to reach any other section.
	   -------------------------------------------------- */
	function initDrawer() {
		var nav = document.getElementById("explorer");
		var btn = document.getElementById("menu-btn");
		var back = document.getElementById("explorer-backdrop");
		if (!nav || !btn) return;

		function open() {
			nav.classList.add("is-open");
			btn.setAttribute("aria-expanded", "true");
			if (back) back.hidden = false;
		}
		function close() {
			nav.classList.remove("is-open");
			btn.setAttribute("aria-expanded", "false");
			if (back) back.hidden = true;
		}

		btn.addEventListener("click", function () {
			if (nav.classList.contains("is-open")) close();
			else open();
		});
		if (back) back.addEventListener("click", close);

		nav.addEventListener("click", function (e) {
			if (e.target.closest("a[data-file]")) close();
		});

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") close();
		});

		if (window.matchMedia) {
			var mq = window.matchMedia("(min-width: 951px)");
			var onChange = function (ev) {
				if (ev.matches) close();
			};
			if (mq.addEventListener) mq.addEventListener("change", onChange);
		}
	}

	/* ---------------- terminal panels ----------------
	   Output and Problems report real measurements taken from this page,
	   not canned text: timings come from the Performance API and the
	   problem list is a live DOM audit.
	   -------------------------------------------------- */
	function initPanels() {
		var tabs = [].slice.call(document.querySelectorAll(".term-tab"));
		var bodies = [].slice.call(document.querySelectorAll(".term-body"));
		if (!tabs.length) return;

		tabs.forEach(function (t) {
			t.addEventListener("click", function () {
				var want = t.dataset.panel;
				tabs.forEach(function (o) {
					o.classList.toggle("is-on", o === t);
				});
				bodies.forEach(function (b) {
					b.hidden = b.dataset.panel !== want;
				});
				var term = document.getElementById("term");
				if (term) term.classList.remove("collapsed");
			});
		});

		fillOutput();
		fillProblems();
	}

	function row(k, v, cls) {
		return (
			'<p class="out-row"><span class="out-key">' + k +
			'</span><span class="out-val' + (cls ? " " + cls : "") + '">' + v +
			"</span></p>"
		);
	}

	function fillOutput() {
		var el = document.getElementById("output-body");
		if (!el) return;

		function render() {
			var out = [];
			try {
				var nav = performance.getEntriesByType("navigation")[0];
				if (nav) {
					out.push(row("dom content loaded", Math.round(nav.domContentLoadedEventEnd) + " ms"));
					out.push(row("load complete", Math.round(nav.loadEventEnd || nav.duration) + " ms"));
					out.push(row("transfer size", Math.round((nav.transferSize || 0) / 1024) + " KB"));
				}
				var res = performance.getEntriesByType("resource");
				var bytes = res.reduce(function (a, r) {
					return a + (r.transferSize || 0);
				}, 0);
				out.push(row("resources fetched", res.length));
				out.push(row("resource weight", Math.round(bytes / 1024) + " KB"));
			} catch (e) {
				out.push(row("timings", "unavailable in this browser", "dim"));
			}
			out.push(row("sections", document.querySelectorAll(".file").length));
			out.push(row("viewport", window.innerWidth + " x " + window.innerHeight));
			out.push(
				row(
					"reduced motion",
					window.matchMedia &&
						window.matchMedia("(prefers-reduced-motion: reduce)").matches
						? "respected, animation off"
						: "not requested",
				),
			);
			el.innerHTML = out.join("");
		}

		if (document.readyState === "complete") render();
		else window.addEventListener("load", function () { setTimeout(render, 0); });

		window.addEventListener("resize", function () {
			if (!el.hidden) render();
		});
	}

	function fillProblems() {
		var el = document.getElementById("problems-body");
		var badge = document.getElementById("prob-badge");
		if (!el) return;

		function audit() {
			var found = [];

			var imgs = [].slice.call(document.querySelectorAll("img"));
			var noAlt = imgs.filter(function (i) {
				return !i.hasAttribute("alt");
			});
			if (noAlt.length) found.push(noAlt.length + " image(s) missing alt text");

			var links = [].slice.call(document.querySelectorAll("a"));
			var empty = links.filter(function (a) {
				return (
					!a.textContent.trim() &&
					!a.getAttribute("aria-label") &&
					!a.querySelector("[aria-label], title")
				);
			});
			if (empty.length) found.push(empty.length + " link(s) with no accessible name");

			var inputs = [].slice.call(document.querySelectorAll("input, textarea, select"));
			var unlabelled = inputs.filter(function (i) {
				if (i.type === "hidden") return false;
				if (i.getAttribute("aria-label")) return false;
				if (i.id && document.querySelector('label[for="' + i.id + '"]')) return false;
				return !i.closest("label");
			});
			if (unlabelled.length) found.push(unlabelled.length + " form field(s) without a label");

			var buttons = [].slice.call(document.querySelectorAll("button"));
			var nameless = buttons.filter(function (b) {
				return !b.textContent.trim() && !b.getAttribute("aria-label");
			});
			if (nameless.length) found.push(nameless.length + " button(s) with no accessible name");

			if (!document.querySelector("h1")) found.push("no h1 on the open section");

			var checks = [
				imgs.length + " images checked for alt text",
				links.length + " links checked for an accessible name",
				inputs.length + " form controls checked for labels",
				buttons.length + " buttons checked for an accessible name",
			];

			var html = "";
			if (!found.length) {
				html += '<p class="term-line ok-line">No problems found.</p>';
			} else {
				found.forEach(function (f) {
					html += '<p class="term-line err">' + f + "</p>";
				});
			}
			html += '<p class="term-line dim">&nbsp;</p>';
			checks.forEach(function (c) {
				html += '<p class="term-line dim">' + c + "</p>";
			});
			html += '<p class="term-line dim">Audit runs live against the open section.</p>';
			el.innerHTML = html;

			if (badge) {
				badge.textContent = found.length;
				badge.classList.toggle("has-problems", found.length > 0);
			}
		}

		audit();
		document.addEventListener("portfolio:filechange", audit);
	}

	/* ---------------- listening ----------------
	   YouTube rather than Spotify, because Spotify's embed exposes no
	   volume control and this needs to start quiet. Nothing is hosted
	   here and nothing autoplays: the iframe is cued, never played, and
	   picking a track uses cueVideoById so it loads paused.
	   -------------------------------------------------- */
	var VOLUME = 15;
	var yt = null;

	function initDeck() {
		var list = document.getElementById("tracklist");
		var frame = document.getElementById("yt-player");
		if (!list || !frame) return;

		var buttons = [].slice.call(list.querySelectorAll("button"));

		buttons.forEach(function (b) {
			b.addEventListener("click", function () {
				buttons.forEach(function (o) {
					o.classList.toggle("is-current", o === b);
				});
				if (yt && yt.cueVideoById) {
					// cue, not load: it must not start on its own
					yt.cueVideoById(b.dataset.vid);
					yt.setVolume(VOLUME);
				} else {
					frame.src =
						"https://www.youtube.com/embed/" +
						b.dataset.vid +
						"?enablejsapi=1&rel=0&modestbranding=1";
				}
			});
		});

		// The API attaches to the existing iframe because it carries
		// enablejsapi=1, so the player keeps working if this never loads.
		window.onYouTubeIframeAPIReady = function () {
			try {
				yt = new YT.Player("yt-player", {
					events: {
						onReady: function (e) {
							e.target.setVolume(VOLUME);
						},
						onError: function () {
							var note = document.getElementById("player-note");
							if (note) {
								note.textContent =
									"That track will not embed. Open it on YouTube instead.";
							}
						},
					},
				});
			} catch (e) {
				console.error("[listening] player init failed:", e && e.message);
			}
		};

		var tag = document.createElement("script");
		tag.src = "https://www.youtube.com/iframe_api";
		tag.async = true;
		document.head.appendChild(tag);
	}

	/* ---------------- command palette ---------------- */
	function initPalette() {
		var pal = document.getElementById("palette");
		var back = document.getElementById("pal-backdrop");
		var input = document.getElementById("pal-input");
		var list = document.getElementById("pal-list");
		if (!pal || !input || !list) return;

		var sel = 0;
		var shown = [];

		// subsequence match, the way a real quick-open behaves
		function matches(q, s) {
			if (!q) return true;
			q = q.toLowerCase();
			s = s.toLowerCase();
			var i = 0;
			for (var j = 0; j < s.length && i < q.length; j++) {
				if (s[j] === q[i]) i++;
			}
			return i === q.length;
		}

		function draw() {
			var q = input.value.trim();
			shown = FILES.filter(function (f) {
				return matches(q, f.name);
			});
			list.innerHTML = "";
			if (!shown.length) {
				var li = document.createElement("li");
				li.className = "empty";
				li.textContent = "No matching files";
				list.appendChild(li);
				return;
			}
			if (sel >= shown.length) sel = 0;
			shown.forEach(function (f, i) {
				var li = document.createElement("li");
				if (i === sel) li.className = "sel";
				li.textContent = f.name;
				var h = document.createElement("span");
				h.className = "hint";
				h.textContent = f.lang;
				li.appendChild(h);
				li.addEventListener("click", function () {
					openFile(f.id);
					hide();
				});
				list.appendChild(li);
			});
		}

		function show() {
			pal.hidden = false;
			back.hidden = false;
			input.value = "";
			sel = 0;
			draw();
			input.focus();
		}
		function hide() {
			pal.hidden = true;
			back.hidden = true;
		}

		if (back) back.addEventListener("click", hide);
		input.addEventListener("input", function () {
			sel = 0;
			draw();
		});

		document.addEventListener("keydown", function (e) {
			var k = (e.key || "").toLowerCase();
			if ((e.ctrlKey || e.metaKey) && (k === "k" || k === "p")) {
				e.preventDefault();
				show();
				return;
			}
			if (pal.hidden) return;
			if (e.key === "Escape") return hide();
			if (e.key === "ArrowDown") {
				e.preventDefault();
				sel = Math.min(sel + 1, shown.length - 1);
				draw();
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				sel = Math.max(sel - 1, 0);
				draw();
			} else if (e.key === "Enter" && shown[sel]) {
				e.preventDefault();
				openFile(shown[sel].id);
				hide();
			}
		});
	}

	/* ---------------- integrated terminal ---------------- */
	function initTerminal() {
		var body = document.getElementById("term-body");
		var input = document.getElementById("term-input");
		var term = document.getElementById("term");
		var toggle = document.getElementById("term-toggle");
		if (!body || !input) return;
		var row = input.parentNode;

		function esc(s) {
			return String(s).replace(/[&<>]/g, function (c) {
				return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
			});
		}

		function out(html, cls) {
			var p = document.createElement("p");
			p.className = "term-line" + (cls ? " " + cls : "");
			p.innerHTML = html;
			body.insertBefore(p, row);
			body.scrollTop = body.scrollHeight;
		}

		function echo(cmd) {
			out(
				'<span class="ps1">colton<span class="at">@</span>portfolio</span>' +
					'<span class="dim">:~$</span> <span class="cmd">' +
					esc(cmd) +
					"</span>",
			);
		}

		var CMDS = {
			help: function () {
				out(
					"  <span class='hi'>ls</span>            list sections\n" +
						"  <span class='hi'>open</span> &lt;name&gt;   open a section\n" +
						"  <span class='hi'>cat</span> &lt;name&gt;    same as open\n" +
						"  <span class='hi'>whoami</span>        the short version\n" +
						"  <span class='hi'>stack</span>         languages and tools\n" +
						"  <span class='hi'>contact</span>       how to get in touch\n" +
						"  <span class='hi'>resume</span>        open the PDF here\n" +
						"  <span class='hi'>clear</span>         clear the terminal\n" +
						"<span class='dim'>Tab completes · ↑↓ history · Ctrl+K jump to section</span>",
				);
			},
			ls: function () {
				out(
					FILES.map(function (f) {
						return "<span class='hi'>" + f.name + "</span>";
					}).join("   "),
				);
			},
			whoami: function () {
				out(
					"Colton Phass, Software Engineer I at Kreative Technologies.\n" +
						"Defense Health Agency case management: data integrity,\n" +
						"workflow automation, Section 508 accessibility.\n" +
						"Maryland, USA · Active Public Trust",
				);
			},
			stack: function () {
				out(
					"<span class='hi'>languages</span>  Python · JavaScript · TypeScript · SQL · C++ · Java\n" +
						"<span class='hi'>platforms</span>  OpenText Process Automation · SQL Server · React\n" +
						"<span class='hi'>practice</span>   BPM · XML/SOAP · Section 508 / WCAG · Agile",
				);
			},
			contact: function () {
				out("opening <span class='hi'>Contact</span> …");
				openFile("contact");
			},
			resume: function () {
				out("opening <span class='hi'>Résumé</span>. view it here, or download it from the bar above.");
				openFile("resume");
			},
			clear: function () {
				[].slice.call(body.querySelectorAll(".term-line")).forEach(function (n) {
					n.remove();
				});
			},
		};

		function resolve(arg) {
			if (!arg) return null;
			arg = arg.toLowerCase();
			for (var i = 0; i < FILES.length; i++) {
				if (FILES[i].id === arg || FILES[i].name.toLowerCase() === arg) {
					return FILES[i];
				}
			}
			for (var j = 0; j < FILES.length; j++) {
				if (FILES[j].name.toLowerCase().indexOf(arg) === 0) return FILES[j];
			}
			return null;
		}

		function run(line) {
			var parts = line.trim().split(/\s+/);
			var cmd = (parts[0] || "").toLowerCase();
			if (!cmd) return;

			if (["open", "cat", "vim", "code", "less"].indexOf(cmd) !== -1) {
				var f = resolve(parts[1]);
				if (!f) {
					out(
						cmd +
							": " +
							(parts[1] ? esc(parts[1]) + ": no such section" : "missing operand"),
						"err",
					);
					return;
				}
				openFile(f.id);
				out("opened <span class='hi'>" + f.name + "</span>");
				return;
			}
			if (CMDS[cmd]) return CMDS[cmd]();
			out(
				"command not found: " +
					esc(cmd) +
					" . try <span class='hi'>help</span>",
				"err",
			);
		}

		var history = [];
		var hpos = 0;

		input.addEventListener("keydown", function (e) {
			if (e.key === "Enter") {
				var v = input.value;
				echo(v);
				if (v.trim()) {
					history.push(v);
					hpos = history.length;
				}
				input.value = "";
				run(v);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				if (hpos > 0) {
					hpos--;
					input.value = history[hpos] || "";
				}
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				if (hpos < history.length - 1) {
					hpos++;
					input.value = history[hpos] || "";
				} else {
					hpos = history.length;
					input.value = "";
				}
			} else if (e.key === "Tab") {
				e.preventDefault();
				var cur = input.value.split(/\s+/);
				if (cur.length >= 2) {
					var m = FILES.filter(function (f) {
						return f.name.toLowerCase().indexOf(cur[1].toLowerCase()) === 0;
					});
					if (m.length === 1) input.value = cur[0] + " " + m[0].name;
				} else {
					var c = Object.keys(CMDS)
						.concat(["open", "cat"])
						.filter(function (k) {
							return k.indexOf(cur[0].toLowerCase()) === 0;
						});
					if (c.length === 1) input.value = c[0] + " ";
				}
			}
		});

		body.addEventListener("click", function (e) {
			if (e.target.tagName !== "A") input.focus();
		});

		if (toggle && term) {
			toggle.addEventListener("click", function () {
				term.classList.toggle("collapsed");
				toggle.textContent = term.classList.contains("collapsed") ? "▴" : "▾";
			});
		}

		out(
			"<span class='dim'>portfolio shell. type <span class='hi'>help</span> for commands.</span>",
		);
	}

	/* ---------------- contact form (Netlify) ---------------- */
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
				status.textContent = "sending…";
			}

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
						status.textContent = "sent. I will reply within a day or so.";
					}
				})
				.catch(function (err) {
					console.error("[contact] submit failed:", err && err.message);
					if (status) {
						status.className = "form-status err";
						status.textContent = "did not send. try LinkedIn or GitHub.";
					}
				})
				.then(function () {
					if (btn) btn.disabled = false;
				});
		});
	}
})();
