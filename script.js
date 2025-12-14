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
 * @param {Array<Object>} contributionDays - Array of contribution day objects (date, contributionCount, color).
 * @param {string} containerId - The ID of the HTML element to render the graph into.
 */
function renderContributionGraph(contributionDays, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear loading text and previous content
  container.innerHTML = '';

  // Slice for about a year's worth of data, then group into 7-day columns (weeks)
  const days = contributionDays.slice(-371);
  const weeks = [];

  // Group days into columns of 7 (a week)
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Create the main container for all weeks
  const weeksContainer = document.createElement('div');
  weeksContainer.className = 'github-weeks-container';

  // Map over weeks
  weeks.forEach((week) => {
    // Create the container for a single week (column)
    const weekDiv = document.createElement('div');
    weekDiv.className = 'github-week';

    // Map over days in the week
    week.forEach((day) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'github-day';

      // Set the color and title attribute
      dayDiv.style.backgroundColor = day.color;
      dayDiv.title = `${day.date}: ${day.contributionCount} contributions`;

      weekDiv.appendChild(dayDiv);
    });

    weeksContainer.appendChild(weekDiv);
  });

  container.appendChild(weeksContainer);
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
