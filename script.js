// ===========================================================
// Utility: Format a date into YYYY-MM-DD
// ===========================================================
function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===========================================================
// Fetch Contribution Data from GitHub
// Uses the official GitHub GraphQL API.
// ===========================================================
async function fetchContributionData(username, githubToken) {
  const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const variables = { userName: username };

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error(data.errors);
    throw new Error('GraphQL errors occurred while fetching data.');
  }

  const weeks =
    data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ||
    [];

  // Flatten days into a single array
  const contributionDays = weeks.flatMap((w) => w.contributionDays);

  return contributionDays;
}

// ===========================================================
// Render Graph
// ===========================================================
function renderContributionGraph(contributionDays, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';

  // --- Prepare Data ---
  // FIX: Use the last 364 days (52 full weeks)
  const days = contributionDays.slice(-364);
  const weeks = [];
  const monthPositions = {};
  const total = days.reduce((sum, day) => sum + day.contributionCount, 0);

  // Group days into columns of 7 and track month starts
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    weeks.push(week);

    const weekColumnIndex = i / 7;

    // Always record the month for the very first visible column (so you get a label at the start)
    const firstNonNullDay = week.find((d) => d);
    if (weekColumnIndex === 0 && firstNonNullDay) {
      const firstDate = new Date(firstNonNullDay.date);
      const firstMonthIndex = firstDate.getMonth();
      if (monthPositions[firstMonthIndex] === undefined) {
        monthPositions[firstMonthIndex] = weekColumnIndex;
      }
    }

    // Record a month label when the 1st of that month appears anywhere in this column
    for (const d of week) {
      if (!d) continue;
      const date = new Date(d.date);
      const monthIndex = date.getMonth();

      if (date.getDate() === 1 && monthPositions[monthIndex] === undefined) {
        monthPositions[monthIndex] = weekColumnIndex;
      }
    }
  }

  // --- Build Components ---

  // 1. Total contributions label
  const totalLabel = document.createElement('div');
  totalLabel.classList.add('github-total');
  totalLabel.textContent = `${total} contributions in the last year`;
  container.appendChild(totalLabel);

  // 2. Graph wrapper (contains months row + grid)
  const graphWrapper = document.createElement('div');
  graphWrapper.classList.add('github-graph-wrapper');
  container.appendChild(graphWrapper);

  // 3. Month labels row
  const monthLabels = document.createElement('div');
  monthLabels.classList.add('github-month-labels');

  // We'll show up to 12 month labels, but avoid overlapping
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

  // Sort recorded positions by column index
  const entries = Object.entries(monthPositions)
    .map(([m, pos]) => ({ monthIndex: parseInt(m, 10), pos }))
    .sort((a, b) => a.pos - b.pos);

  let lastPositionIndex = -Infinity;
  entries.forEach(({ monthIndex, pos }) => {
    // Avoid placing labels too close together (2 columns apart)
    if (pos > lastPositionIndex + 2) {
      const label = document.createElement('span');
      label.textContent = monthNames[monthIndex];
      label.style.left = `${pos * 14}px`; // Each column width roughly 14px
      monthLabels.appendChild(label);
      lastPositionIndex = pos;
    }
  });

  graphWrapper.appendChild(monthLabels);

  // 4. Actual graph grid
  const graph = document.createElement('div');
  graph.classList.add('github-graph');
  graphWrapper.appendChild(graph);

  // 5. Day labels (vertical) on the left
  const dayLabels = document.createElement('div');
  dayLabels.classList.add('github-day-labels');

  // GitHub uses labels for Mon, Wed, Fri (or similar)
  const labelDays = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  labelDays.forEach((d) => {
    const span = document.createElement('span');
    span.textContent = d;
    dayLabels.appendChild(span);
  });

  // Wrap day labels + grid
  const gridWrapper = document.createElement('div');
  gridWrapper.classList.add('github-grid-wrapper');

  gridWrapper.appendChild(dayLabels);

  // Create the grid columns
  const grid = document.createElement('div');
  grid.classList.add('github-grid');

  weeks.forEach((week) => {
    const col = document.createElement('div');
    col.classList.add('github-week');

    week.forEach((day) => {
      const cell = document.createElement('div');
      cell.classList.add('github-day');

      if (day) {
        cell.style.backgroundColor = day.color;
        cell.title = `${day.contributionCount} contributions on ${day.date}`;
      } else {
        cell.style.backgroundColor = '#ebedf0';
      }

      col.appendChild(cell);
    });

    grid.appendChild(col);
  });

  gridWrapper.appendChild(grid);
  graphWrapper.appendChild(gridWrapper);

  // 6. Legend
  const legend = document.createElement('div');
  legend.classList.add('github-legend');

  const less = document.createElement('span');
  less.textContent = 'Less';
  legend.appendChild(less);

  // GitHub-like colors (approx)
  const legendColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  legendColors.forEach((c) => {
    const box = document.createElement('span');
    box.classList.add('legend-box');
    box.style.backgroundColor = c;
    legend.appendChild(box);
  });

  const more = document.createElement('span');
  more.textContent = 'More';
  legend.appendChild(more);

  container.appendChild(legend);
}

// ===========================================================
// Page/App Logic
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Simple page switching logic
  document.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').replace('#', '');

      document.querySelectorAll('.page').forEach((page) => {
        page.classList.remove('active');
      });

      document.getElementById(target)?.classList.add('active');
    });
  });

  // Defaults
  const usernameInput = document.getElementById('github-username');
  const tokenInput = document.getElementById('github-token');
  const loadBtn = document.getElementById('github-load-btn');

  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const username = usernameInput?.value?.trim();
      const token = tokenInput?.value?.trim();

      if (!username || !token) {
        alert(
          'Please enter both a GitHub username and a Personal Access Token.'
        );
        return;
      }

      try {
        loadBtn.disabled = true;
        loadBtn.textContent = 'Loading...';

        const days = await fetchContributionData(username, token);
        renderContributionGraph(days, 'github-graph-container');
      } catch (err) {
        console.error(err);
        alert(
          'Failed to load GitHub contributions. Check console for details.'
        );
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load';
      }
    });
  }
});
