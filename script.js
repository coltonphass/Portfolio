// ======================================================================
// CORE NAVIGATION AND UTILITIES
// ======================================================================

/**
 * Handles single-page application navigation by toggling the 'active' class on pages.
 * @param {string} pageId - The ID of the page element to show (e.g., 'home', 'about').
 */
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active');
  });

  // Remove active class from all nav links
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.classList.remove('active');
  });

  // Show selected page
  document.getElementById(pageId).classList.add('active');

  // Add active class to clicked nav link
  document.getElementById('nav-' + pageId).classList.add('active');

  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * Handles tabbed content (e.g., in the About page)
 * @param {string} tabId - The ID of the tab content element to show.
 */
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
  document.getElementById(tabId).classList.add('active');

  // The event object is passed implicitly in the onclick attribute.
  // We use event.target to reference the button that was clicked.
  if (event.target) {
    event.target.classList.add('active');
  }
}

/**
 * Filters the project list based on the selected category.
 */
function filterProjects() {
  const select = document.getElementById('project-select');
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

/**
 * Renders the GitHub contribution calendar grid into a specified container.
 * @param {Array<Object>} contributionDays - Array of contribution day objects.
 * @param {string} containerId - The ID of the HTML element to render the graph into.
 */
function renderContributionGraph(contributionDays, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';

  // --- Configuration ---
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

  // --- Prepare Data ---
  // Use the last 364 days (52 full weeks)
  const days = contributionDays.slice(-364);
  const weeks = [];
  const monthPositions = {};
  const total = days.reduce(
    (sum, day) => sum + (day?.contributionCount || 0),
    0
  );

  // Group days into columns of 7 and track month starts
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);

    const weekColumnIndex = i / 7;

    // Record the month for the first visible column so the left side has a label
    const firstNonNullDay = week.find((d) => d);
    if (weekColumnIndex === 0 && firstNonNullDay) {
      const firstDate = new Date(firstNonNullDay.date);
      const firstMonthIndex = firstDate.getMonth();
      if (monthPositions[firstMonthIndex] === undefined) {
        monthPositions[firstMonthIndex] = weekColumnIndex;
      }
    }

    // ✅ FIX: Look at *every* day in the column (not just week[0])
    // so months don't disappear depending on alignment.
    for (const d of week) {
      if (!d) continue;
      const dt = new Date(d.date);
      const m = dt.getMonth();

      if (dt.getDate() === 1 && monthPositions[m] === undefined) {
        monthPositions[m] = weekColumnIndex;
      }
    }
  }

  // --- Build Components ---

  // 1. Total Contributions Counter
  const totalDiv = document.createElement('div');
  totalDiv.className = 'github-total-contributions';
  totalDiv.textContent = `Total contributions in the last year: ${total}`;
  container.appendChild(totalDiv);

  // 2. Main Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'github-graph-wrapper';

  // 3. Calendar Grid (day labels + graph area)
  const gridContainer = document.createElement('div');
  gridContainer.className = 'github-calendar-grid';

  // 4. Day Labels Column
  const dayLabelsColumn = document.createElement('div');
  dayLabelsColumn.className = 'github-day-labels';
  dayLabels.forEach((label, index) => {
    const labelDiv = document.createElement('span');
    labelDiv.className = 'day-label';
    if (index === 1 || index === 3 || index === 5) {
      labelDiv.textContent = label.charAt(0);
    } else {
      labelDiv.textContent = '';
    }
    dayLabelsColumn.appendChild(labelDiv);
  });
  gridContainer.appendChild(dayLabelsColumn);

  // 5. Graph Area Container (Month Labels + Weeks Grid)
  const graphArea = document.createElement('div');
  graphArea.style.display = 'flex';
  graphArea.style.flexDirection = 'column';

  // 6. Month Labels Row
  const monthLabelsContainer = document.createElement('div');
  monthLabelsContainer.className = 'github-month-labels';

  let lastPositionIndex = -99;

  for (let m = 0; m < 12; m++) {
    const positionIndex =
      monthPositions[m] !== undefined ? monthPositions[m] : -1;

    // Keep your existing pixel math
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

  // 7. Contribution Weeks Grid
  const weeksContainer = document.createElement('div');
  weeksContainer.className = 'github-weeks-container';

  weeks.forEach((week) => {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'github-week';

    week.forEach((day) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'github-day';

      // Guard just in case
      if (day) {
        dayDiv.style.backgroundColor = day.color;
        dayDiv.title = `${day.date}: ${day.contributionCount} contributions`;
      } else {
        dayDiv.style.backgroundColor = '#ebedf0';
        dayDiv.title = '';
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

/**
 * Fetches contribution data securely via Netlify Function and initiates rendering.
 */
async function fetchAndRenderContributions() {
  const desktopContainer = document.getElementById('github-graph-desktop');
  const mobileContainer = document.getElementById('github-graph-mobile');

  // Display loading state
  const loadingHTML =
    '<p class="loading-text">Loading contribution data...</p>';
  if (desktopContainer) desktopContainer.innerHTML = loadingHTML;
  if (mobileContainer) mobileContainer.innerHTML = loadingHTML;

  try {
    // Netlify Function endpoint
    const response = await fetch('/.netlify/functions/fetch-contributions', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Netlify Function failed. Status: ${response.status}`);
    }

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

// ======================================================================
// ENHANCED NAVIGATION / INITIALIZATION
// ======================================================================

const originalShowPage = showPage;

showPage = function (pageId) {
  originalShowPage(pageId);
  if (pageId === 'home') {
    fetchAndRenderContributions();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (
    document.getElementById('github-graph-desktop') &&
    document.getElementById('home').classList.contains('active')
  ) {
    fetchAndRenderContributions();
  }
});
