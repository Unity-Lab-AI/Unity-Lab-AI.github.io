/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * contact@unityailab.com
 * Version: v2.1.5
 */

/**
 * About Page JavaScript
 * Handles GitHub stats fetching and counter animations
 */

// GitHub organization/user
const GITHUB_ORG = 'Unity-Lab-AI';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Detect testing environment
    const isTesting = navigator.webdriver ||
                      (window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('HeadlessChrome'));

    if (isTesting) {
        console.log('Testing mode - skipping GitHub API calls');
        // Set fallback values immediately for tests
        animateCounter('commits-count', 500);
        animateCounter('stars-count', 150);
        animateCounter('forks-count', 45);
        return;
    }

    fetchGitHubStats();
});

/**
 * Grab stats from GitHub API - stars, forks, commits
 */
async function fetchAllOrgRepos(org) {
    const out = [];
    for (let page = 1; page <= 10; page++) {
        const r = await fetch(
            `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&type=public`,
            { headers: { Accept: 'application/vnd.github+json' } }
        );
        if (!r.ok) throw new Error(`org repos: ${r.status}`);
        const batch = await r.json();
        if (!Array.isArray(batch) || batch.length === 0) break;
        out.push(...batch);
        if (batch.length < 100) break;
    }
    return out;
}

async function fetchGitHubStats() {
    try {
        // Fetch every page of public org repos.
        const allRepos = await fetchAllOrgRepos(GITHUB_ORG);
        const repos = allRepos.filter(r => !r.private && !r.fork);

        // Calculate total stars and forks across every public repo.
        let totalStars = 0;
        let totalForks = 0;

        repos.forEach(repo => {
            totalStars += repo.stargazers_count || 0;
            totalForks += repo.forks_count || 0;
        });

        // Total commits across every public repo, in parallel.
        const totalCommits = await fetchTotalCommits(repos);

        // Animate counters
        animateCounter('commits-count', totalCommits);
        animateCounter('stars-count', totalStars);
        animateCounter('forks-count', totalForks);

    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        // Use fallback values
        animateCounter('commits-count', 500);
        animateCounter('stars-count', 150);
        animateCounter('forks-count', 45);
    }
}

/**
 * Pull commit counts from repos (limited to avoid rate limits)
 * @param {Array} repos - Array of repository objects
 * @returns {Promise<number>} Total commits count
 */
async function fetchRepoCommitCount(owner, repo) {
    const r = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!r.ok) return 0;
    const link = r.headers.get('Link') || '';
    const m = link.match(/[?&]page=(\d+)>; rel="last"/);
    if (m) return parseInt(m[1], 10) || 0;
    const body = await r.json().catch(() => []);
    return Array.isArray(body) ? body.length : 0;
}

async function fetchTotalCommits(repos) {
    // All repos in parallel — one cheap call each.
    const counts = await Promise.all(
        repos.map(repo =>
            fetchRepoCommitCount(GITHUB_ORG, repo.name).catch(err => {
                console.warn(`Failed to fetch commits for ${repo.name}:`, err);
                return 0;
            })
        )
    );
    const total = counts.reduce((a, b) => a + b, 0);
    return total > 0 ? total : 500;
}

/**
 * Count-up animation for stat numbers
 * @param {string} elementId - ID of the counter element
 * @param {number} targetValue - Target value to count to
 */
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const startValue = 0;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }

    requestAnimationFrame(updateCounter);
}
