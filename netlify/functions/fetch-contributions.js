// netlify/functions/fetch-contributions.js

// --- FIX: Explicitly require node-fetch for maximum compatibility ---
const fetch = require('node-fetch');
// -------------------------------------------------------------------

const { GITHUB_PAT } = process.env;
const GITHUB_USERNAME = 'coltonphass'; // <--- Check this is correct
const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

// The GraphQL query to fetch the contribution calendar for the past year
const contributionsQuery = `
query {
  user(login: "${GITHUB_USERNAME}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}
`;

exports.handler = async (event, context) => {
  if (!GITHUB_PAT) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GitHub PAT not configured on Netlify.' }),
    };
  }

  try {
    // 1. Make the secure server-side call to GitHub's GraphQL API
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The token is only used here on the server
        Authorization: `bearer ${GITHUB_PAT}`,
      },
      body: JSON.stringify({ query: contributionsQuery }),
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API responded with status ${
          response.status
        }: ${await response.text()}`
      );
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GitHub GraphQL error occurred.' }),
      };
    }

    // 2. Flatten the data structure
    const contributionDays =
      result.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
        (week) => week.contributionDays
      );

    // 3. Return the SAFE public data to the client's browser
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
      body: JSON.stringify(contributionDays),
    };
  } catch (error) {
    console.error('GitHub Fetch Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch contribution data due to server error.',
      }),
    };
  }
};
