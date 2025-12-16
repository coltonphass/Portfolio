// ======================================================================
// CONFIG: PAGE TRANSITION (.5s minimum)
// ======================================================================
const TRANSITION_MIN_MS = 350; // .5 seconds minimum
const TRANSITION_KEY = 'pt_start';

// Show/hide helpers
function showPageTransition() {
  const overlay = document.getElementById('page-transition');
  const wrap = document.querySelector('.page-wrap');
  if (overlay) overlay.classList.add('is-active');
  if (wrap) wrap.classList.add('is-loading');
}

function hidePageTransition() {
  const overlay = document.getElementById('page-transition');
  const wrap = document.querySelector('.page-wrap');
  if (overlay) overlay.classList.remove('is-active');
  if (wrap) wrap.classList.remove('is-loading');
}

// Intercept internal HTML navigations so we can show loader BEFORE leaving
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;

  const href = a.getAttribute('href');
  if (!href) return;

  // ignore new tab / downloads
  if (a.target === '_blank' || a.hasAttribute('download')) return;

  // ignore hash-only, mailto, tel
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
    return;

  // ignore absolute external links
  if (/^https?:\/\//i.test(href)) return;

  // only handle your internal page navigations (.html)
  if (!href.toLowerCase().endsWith('.html')) return;

  // If they click the current page, do nothing
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const target = href.split('#')[0];
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
document.addEventListener('DOMContentLoaded', () => {
  // If page has loader markup, manage it
  const overlay = document.getElementById('page-transition');
  if (overlay) {
    showPageTransition();

    const start = Number(sessionStorage.getItem(TRANSITION_KEY) || '0');
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

  // Render GitHub graph only when the graph containers exist (home page)
  if (document.getElementById('github-graph-desktop')) {
    fetchAndRenderContributions();
  }
});

// ======================================================================
// USES TABS (safe + keeps your existing onclick working)
// ======================================================================
function showTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.remove('active');
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');

  // Add active class to clicked button if available
  if (typeof event !== 'undefined' && event && event.target) {
    event.target.classList.add('active');
  }
}

// Optional: make tabs robust on refresh + allow deep links like uses.html#hardware
function initUsesTabsIfPresent() {
  const tabs = document.querySelector('.uses-tabs');
  if (!tabs) return;

  const hash = (window.location.hash || '').replace('#', '').trim();
  const validIds = new Set(['all', 'editor', 'hardware', 'software', 'other']);

  // if URL has a valid hash, activate it
  if (hash && validIds.has(hash)) {
    // activate content
    document
      .querySelectorAll('.tab-content')
      .forEach((c) => c.classList.remove('active'));
    const tab = document.getElementById(hash);
    if (tab) tab.classList.add('active');

    // activate button
    document
      .querySelectorAll('.tab-btn')
      .forEach((b) => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.tab-btn')).find((b) =>
      (b.getAttribute('onclick') || '').includes(`showTab('${hash}')`)
    );
    if (btn) btn.classList.add('active');
  }
}

// ======================================================================
// PROJECT FILTER
// ======================================================================
function filterProjects() {
  const select = document.getElementById('project-select');
  if (!select) return;

  const category = select.value;
  const projects = document.querySelectorAll('#projects-list .card');

  projects.forEach((project) => {
    if (category === 'all' || project.dataset.category === category) {
      project.style.display = 'block';
    } else {
      project.style.display = 'none';
    }
  });
}

// ======================================================================
// GITHUB CONTRIBUTION GRAPH LOGIC
// ======================================================================
function renderContributionGraph(contributionDays, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = contributionDays.slice(-364);
  const weeks = [];
  const monthPositions = {};
  const total = days.reduce(
    (sum, day) => sum + (day?.contributionCount || 0),
    0
  );

  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);

    const weekColumnIndex = i / 7;

    const firstNonNullDay = week.find((d) => d);
    if (weekColumnIndex === 0 && firstNonNullDay) {
      const firstDate = new Date(firstNonNullDay.date);
      const firstMonthIndex = firstDate.getMonth();
      if (monthPositions[firstMonthIndex] === undefined) {
        monthPositions[firstMonthIndex] = weekColumnIndex;
      }
    }

    for (const d of week) {
      if (!d) continue;
      const dt = new Date(d.date);
      const m = dt.getMonth();
      if (dt.getDate() === 1 && monthPositions[m] === undefined) {
        monthPositions[m] = weekColumnIndex;
      }
    }
  }

  const totalDiv = document.createElement('div');
  totalDiv.className = 'github-total-contributions';
  totalDiv.textContent = `Total contributions in the last year: ${total}`;
  container.appendChild(totalDiv);

  const wrapper = document.createElement('div');
  wrapper.className = 'github-graph-wrapper';

  const gridContainer = document.createElement('div');
  gridContainer.className = 'github-calendar-grid';

  const dayLabelsColumn = document.createElement('div');
  dayLabelsColumn.className = 'github-day-labels';
  dayLabels.forEach((label, index) => {
    const labelDiv = document.createElement('span');
    labelDiv.className = 'day-label';
    if (index === 1 || index === 3 || index === 5)
      labelDiv.textContent = label.charAt(0);
    dayLabelsColumn.appendChild(labelDiv);
  });
  gridContainer.appendChild(dayLabelsColumn);

  const graphArea = document.createElement('div');
  graphArea.style.display = 'flex';
  graphArea.style.flexDirection = 'column';

  const monthLabelsContainer = document.createElement('div');
  monthLabelsContainer.className = 'github-month-labels';

  let lastPositionIndex = -99;

  for (let m = 0; m < 12; m++) {
    const positionIndex =
      monthPositions[m] !== undefined ? monthPositions[m] : -1;
    const leftOffset = positionIndex * 12 + 20 + 6;

    if (positionIndex !== -1 && positionIndex > lastPositionIndex + 2) {
      const labelDiv = document.createElement('span');
      labelDiv.className = 'month-label';
      labelDiv.textContent = monthNames[m];
      labelDiv.style.left = `${leftOffset}px`;
      monthLabelsContainer.appendChild(labelDiv);
      lastPositionIndex = positionIndex;
    }
  }

  graphArea.appendChild(monthLabelsContainer);

  const weeksContainer = document.createElement('div');
  weeksContainer.className = 'github-weeks-container';

  weeks.forEach((week) => {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'github-week';

    week.forEach((day) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'github-day';

      if (day) {
        dayDiv.style.backgroundColor = day.color;
        dayDiv.title = `${day.date}: ${day.contributionCount} contributions`;
      } else {
        dayDiv.style.backgroundColor = '#ebedf0';
      }

      weekDiv.appendChild(dayDiv);
    });

    weeksContainer.appendChild(weekDiv);
  });

  graphArea.appendChild(weeksContainer);
  gridContainer.appendChild(graphArea);
  wrapper.appendChild(gridContainer);
  container.appendChild(wrapper);
}

async function fetchAndRenderContributions() {
  const desktopContainer = document.getElementById('github-graph-desktop');
  const mobileContainer = document.getElementById('github-graph-mobile');

  const loadingHTML =
    '<p class="loading-text">Loading contribution data...</p>';
  if (desktopContainer) desktopContainer.innerHTML = loadingHTML;
  if (mobileContainer) mobileContainer.innerHTML = loadingHTML;

  try {
    const response = await fetch('/.netlify/functions/fetch-contributions', {
      cache: 'no-store',
    });

    if (!response.ok)
      throw new Error(`Netlify Function failed. Status: ${response.status}`);

    const contributionDays = await response.json();

    renderContributionGraph(contributionDays, 'github-graph-desktop');
    renderContributionGraph(contributionDays, 'github-graph-mobile');
  } catch (error) {
    console.error('Error rendering GitHub graph:', error);

    const msg = error && error.message ? error.message : 'Unknown error';
    const errorHTML = `<p class="loading-text" style="color:#ef4444;">Error loading graph: ${msg}<br/>Open DevTools Console + Network to see why.</p>`;

    if (desktopContainer) desktopContainer.innerHTML = errorHTML;
    if (mobileContainer) mobileContainer.innerHTML = errorHTML;
  }
}
