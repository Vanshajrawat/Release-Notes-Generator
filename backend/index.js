require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchCommits } = require('./services/github');
const { summarizeCommits } = require('./ai/summarizer');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// POST /api/generate-notes
// body: { owner, repo, base, head, format, language }
app.post('/api/generate-notes', async (req, res) => {
  try {
    const { owner, repo, base = 'main', head = 'HEAD', format = 'markdown', language = 'en' } = req.body;
    if (!owner || !repo) return res.status(400).json({ error: 'owner and repo required' });

    const token = process.env.GITHUB_TOKEN;
    const commits = await fetchCommits({ owner, repo, base, head, token });

    const summary = await summarizeCommits(commits, { language, format });

    res.json({ summary, meta: { commits: commits.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Release notes backend listening on ${port}`));
