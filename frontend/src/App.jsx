import React, { useState } from 'react'

function parseRepositoryInput(owner, repo) {
  const raw = `${owner || ''} ${repo || ''}`.trim();
  const githubUrlMatch = raw.match(/github\.com\/(.+?)\/(.+?)(?:\/|$)/i);
  if (githubUrlMatch) {
    return { owner: githubUrlMatch[1], repo: githubUrlMatch[2] };
  }

  const slashMatch = raw.match(/([^\s/]+)\/([^\s/]+)/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }

  return { owner: owner?.trim() || '', repo: repo?.trim() || '' };
}

export default function App() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessages([]);
    try {
      const { owner: parsedOwner, repo: parsedRepo } = parseRepositoryInput(owner, repo);
      if (!parsedOwner || !parsedRepo) {
        throw new Error('Enter a GitHub owner and repository, or paste a GitHub URL like https://github.com/owner/repo');
      }

      const res = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: parsedOwner, repo: parsedRepo })
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { summary: text || 'No response received from the server.' };
      }

      if (!res.ok) {
        throw new Error(data.error || `Request failed with ${res.status}`);
      }

      setMessages(prev => [...prev, { from: 'bot', text: data.summary || JSON.stringify(data) }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h2>Release Notes Chatbot</h2>
      <div className="controls">
        <input placeholder="GitHub owner or full URL" value={owner} onChange={e=>setOwner(e.target.value)} />
        <input placeholder="repo" value={repo} onChange={e=>setRepo(e.target.value)} />
        <button onClick={generate} disabled={loading || !owner || !repo}>{loading ? 'Generating...' : 'Generate'}</button>
      </div>
      <p className="hint">You can enter values like microsoft/vscode or paste a full GitHub URL.</p>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.from}`}>
            <pre>{m.text}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
