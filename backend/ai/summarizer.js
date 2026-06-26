const { OpenAI } = require('openai');

function categorizeMessage(message) {
  const m = message.toLowerCase();
  if (m.startsWith('feat') || m.includes('feature')) return 'Features';
  if (m.startsWith('fix') || m.includes('bugfix') || m.includes('fixes')) return 'Fixes';
  if (m.includes('security') || m.includes('vuln')) return 'Security';
  if (m.startsWith('perf') || m.includes('performance')) return 'Performance';
  if (m.startsWith('docs') || m.includes('readme')) return 'Docs';
  return 'Other';
}

function buildHeuristicSummary(commits = [], opts = {}) {
  const groups = {};
  for (const c of commits) {
    const msg = (c.message || '').split('\n')[0];
    const cat = categorizeMessage(msg);
    groups[cat] = groups[cat] || [];
    groups[cat].push({ sha: c.sha, message: msg, author: c.author && c.author.name });
  }

  const format = opts.format || 'markdown';
  if (format === 'markdown') {
    let out = '# Release notes\n\n';
    for (const section of ['Features', 'Fixes', 'Security', 'Performance', 'Docs', 'Other']) {
      if (!groups[section] || groups[section].length === 0) continue;
      out += `## ${section}\n\n`;
      for (const item of groups[section]) {
        out += `- ${item.message} (${item.author || 'unknown'} — ${item.sha.slice(0, 7)})\n`;
      }
      out += '\n';
    }
    return out || '# Release notes\n\nNo changes recorded.';
  }

  if (format === 'html') {
    const items = Object.entries(groups)
      .flatMap(([section, entries]) => entries.map(item => `<li><strong>${section}:</strong> ${item.message} (${item.author || 'unknown'})</li>`));
    return `<h1>Release notes</h1><ul>${items.join('')}</ul>`;
  }

  return { groups };
}

async function summarizeCommits(commits = [], opts = {}) {
  const format = opts.format || 'markdown';
  const language = opts.language || 'en';
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  const model = process.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat');
  const baseURL = process.env.AI_BASE_URL || (provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com');

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey, baseURL });
      const prompt = [
        `You are drafting release notes for a software product.`,
        `Write the release notes in ${language}.`,
        format === 'markdown'
          ? 'Return the answer as polished Markdown with a title and short sections.'
          : format === 'html'
            ? 'Return an HTML fragment that can be embedded in a page.'
            : 'Return valid JSON with top-level sections such as features, fixes, security, performance, docs, and other.',
        'Use these commits as the source of truth:',
        commits.map((c, index) => `${index + 1}. ${c.message || ''}`).join('\n') || 'No commits provided.'
      ].join('\n\n');

      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a senior release notes writer.' },
          { role: 'user', content: prompt }
        ]
      });

      const content = completion?.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err) {
      console.warn('AI summarizer failed, using heuristic fallback:', err.message);
    }
  }

  return buildHeuristicSummary(commits, opts);
}

module.exports = { summarizeCommits, buildHeuristicSummary };
