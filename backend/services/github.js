const GITHUB_API = 'https://api.github.com';

async function fetchOnce(url, token) {
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchCommits({ owner, repo, base, head, token }) {
  // Use compare endpoint when base..head provided; fallback to list commits
  try {
    const compareUrl = `${GITHUB_API}/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`;
    const data = await fetchOnce(compareUrl, token);
    const commits = (data.commits || []).map(c => ({ sha: c.sha, message: c.commit.message, author: c.commit.author }));
    return commits;
  } catch (err) {
    // Fallback: list commits on head
    const listUrl = `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(head)}&per_page=100`;
    const list = await fetchOnce(listUrl, token);
    return (list || []).map(c => ({ sha: c.sha, message: c.commit.message, author: c.commit.author }));
  }
}

module.exports = { fetchCommits };
