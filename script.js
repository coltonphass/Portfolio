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

  // --- Month Names Array (Starts with January for lookup) ---
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

  // --- Prepare Data ---
  // Use the last 371 days (approx. 53 full weeks) for a full year display
  const days = contributionDays.slice(-371);
  const weeks = [];
  const monthPositions = {}; // To store the starting position for each month label

  // Group days into columns of 7 (a week)
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);

    // Check the first day of the week to see if it's the start of a new month
    const firstDay = week[0];
    if (firstDay) {
      const date = new Date(firstDay.date);
      const monthIndex = date.getMonth(); // 0 (Jan) - 11 (Dec)

      // If the month hasn't been recorded yet, record its position
      if (!monthPositions[monthIndex] && i > 0) {
        // i > 0 prevents labeling the first week if it's mid-month
        // Position is based on the column index (i / 7)
        monthPositions[monthIndex] = i / 7;
      }
    }
  }

  // --- Build Components ---

  // 1. Main Wrapper (handles overall layout and scroll)
  const wrapper = document.createElement('div');
  wrapper.className = 'github-graph-wrapper';

  // 2. Month Labels Row
  const monthLabelsContainer = document.createElement('div');
  monthLabelsContainer.className = 'github-month-labels';

  // Calculate the total number of weeks to determine the width scale

  let lastPosition = 0;
  const today = new Date();
  const currentMonthIndex = today.getMonth(); // Get the current month index

  // Loop through all 12 months (or fewer, if the dataset is shorter than a year)
  for (let m = 0; m < 12; m++) {
    // Find the index of the column where this month starts
    let positionIndex = -1;
    for (const index in monthPositions) {
      if (parseInt(index) === m) {
        positionIndex = monthPositions[index];
        break;
      }
    }

    // We calculate the left offset for the label
    // The formula is: column_index * (square_width + week_gap)
    const leftOffset = positionIndex * 14;

    // Render a label if the position is recorded OR if it's the current month (to guarantee a recent label)
    if (positionIndex !== -1 || m === currentMonthIndex) {
      // Only render a label if it's visually spaced apart from the last one
      // Use 30px as a rough minimum gap to prevent label overlap
      if (
        leftOffset > lastPosition + 30 ||
        m === new Date(days[0].date).getMonth()
      ) {
        // Get the starting month of the data set to correctly align the very first label
        const startDayDate = new Date(days[0].date);
        const startMonthIndex = startDayDate.getMonth();

        // Adjust positionIndex if the dataset starts on this month
        let effectivePositionIndex = positionIndex;
        if (m === startMonthIndex && positionIndex === -1) {
          effectivePositionIndex = 0;
        }

        if (effectivePositionIndex !== -1) {
          const labelDiv = document.createElement('span');
          labelDiv.className = 'month-label';
          labelDiv.textContent = monthNames[m];
          labelDiv.style.left = `${effectivePositionIndex * 14}px`;
          monthLabelsContainer.appendChild(labelDiv);
          lastPosition = effectivePositionIndex * 14;
        }
      }
    }
  }

  wrapper.appendChild(monthLabelsContainer);

  // 3. Contribution Grid
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

  wrapper.appendChild(weeksContainer);

  // 4. Total Contributions Counter
  const total = contributionDays.reduce(
    (sum, day) => sum + day.contributionCount,
    0
  );
  const totalDiv = document.createElement('div');
  totalDiv.className = 'github-total-contributions';
  totalDiv.textContent = `Total contributions in the last year: ${total}`;

  container.appendChild(totalDiv);
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
