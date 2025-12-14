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
  // We only display the first letter (S, M, T, W, T, F, S)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Prepare Data ---
  // Use the last 371 days (approx. 53 full weeks) for a full year display
  const days = contributionDays.slice(-371);
  const weeks = [];
  const monthPositions = {};
  const total = days.reduce((sum, day) => sum + day.contributionCount, 0);

  // Group days into columns of 7 and track month starts
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);

    // Track where each month starts within the week columns
    const startDay = week[0];
    if (startDay) {
      const date = new Date(startDay.date);
      const monthIndex = date.getMonth();

      // Record position if it's the start of a month AND the position hasn't been recorded
      if (!monthPositions[monthIndex] && i > 0) {
        monthPositions[monthIndex] = i / 7;
      }
    }
  }

  // --- Build Components ---

  // 1. Total Contributions Counter
  const totalDiv = document.createElement('div');
  totalDiv.className = 'github-total-contributions';
  totalDiv.textContent = `Total contributions in the last year: ${total}`;
  container.appendChild(totalDiv);

  // 2. Main Wrapper (handles overall layout and scroll)
  const wrapper = document.createElement('div');
  wrapper.className = 'github-graph-wrapper';

  // 3. Calendar Grid (holds day labels + graph area)
  const gridContainer = document.createElement('div');
  gridContainer.className = 'github-calendar-grid';

  // 4. Day Labels Column (Sun, Mon, Tue...)
  const dayLabelsColumn = document.createElement('div');
  dayLabelsColumn.className = 'github-day-labels';
  dayLabels.forEach((label, index) => {
    const labelDiv = document.createElement('span');
    labelDiv.className = 'day-label';
    // Only display labels for Mon, Wed, Fri (index 1, 3, 5) to match GitHub style
    if (index % 2 !== 0) {
      labelDiv.textContent = label.charAt(0);
    } else {
      labelDiv.textContent = ''; // Empty string for Sun, Tue, Thu, Sat
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

  let lastPosition = 0;

  // Loop through all 12 months
  for (let m = 0; m < 12; m++) {
    let positionIndex = -1;

    // Find the column index where this month starts
    if (monthPositions[m] !== undefined) {
      positionIndex = monthPositions[m];
    }

    const leftOffset = positionIndex * 14;

    // Render a label if the position is recorded
    if (positionIndex !== -1) {
      // Heuristic: Only render a label if it's visually spaced far enough from the last one (3 columns/42px)
      if (leftOffset > lastPosition + 42) {
        const labelDiv = document.createElement('span');
        labelDiv.className = 'month-label';
        labelDiv.textContent = monthNames[m];
        labelDiv.style.left = `${leftOffset}px`;
        monthLabelsContainer.appendChild(labelDiv);
        lastPosition = leftOffset;
      }
    }
  }

  graphArea.appendChild(monthLabelsContainer);

  // 7. Contribution Weeks Grid
  const weeksContainer = document.createElement('div');
  weeksContainer.className = 'github-weeks-container';

  weeks.forEach((week) => {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'github-week';

    // Render the 7 days we got for the column
    week.forEach((day) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'github-day';

      // Set color and tooltip
      dayDiv.style.backgroundColor = day.color;
      dayDiv.title = `${day.date}: ${day.contributionCount} contributions`;

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
    // This endpoint maps to the netlify/functions/fetch-contributions.js file
    const response = await fetch('/.netlify/functions/fetch-contributions');

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from Netlify Function. Status: ${response.status}`
      );
    }

    const contributionDays = await response.json();

    // Render the graph in both desktop and mobile containers
    renderContributionGraph(contributionDays, 'github-graph-desktop');
    renderContributionGraph(contributionDays, 'github-graph-mobile');
  } catch (error) {
    console.error('Error rendering GitHub graph:', error);
    const errorHTML =
      '<p class="loading-text" style="color: #ef4444;">Error loading graph. See console for details.</p>';
    if (desktopContainer) desktopContainer.innerHTML = errorHTML;
    if (mobileContainer) mobileContainer.innerHTML = errorHTML;
  }
}

// ======================================================================
// ENHANCED NAVIGATION / INITIALIZATION
// ======================================================================

// Store a reference to the original showPage function
const originalShowPage = showPage;

/**
 * Overrides the global showPage function to run the original navigation
 * AND trigger the GitHub graph render when the 'home' page is selected.
 */
showPage = function (pageId) {
  originalShowPage(pageId); // Execute the original navigation logic

  if (pageId === 'home') {
    fetchAndRenderContributions(); // Fetch and render when 'home' page is active
  }
};

// Run the contribution fetch on initial page load if 'home' is the default active page
document.addEventListener('DOMContentLoaded', () => {
  // Only fetch if the desktop or mobile container for the graph exists
  if (
    document.getElementById('github-graph-desktop') &&
    document.getElementById('home').classList.contains('active')
  ) {
    fetchAndRenderContributions();
  }
});
