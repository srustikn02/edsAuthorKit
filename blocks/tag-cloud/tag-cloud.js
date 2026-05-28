function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [String(raw)];
  try { return JSON.parse(raw); } catch { /* not JSON */ }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

async function fetchMetadata() {
  try {
    const resp = await fetch('/blog/metadata.json');
    if (!resp.ok) return {};
    const json = await resp.json();
    const rows = json.data || json.metadata?.data || json[Object.keys(json).find((k) => !k.startsWith(':'))]?.data || [];
    const map = {};
    for (const row of rows) {
      const url = row.URL || row.url;
      if (url && !url.includes('*')) {
        const key = url.startsWith('/blog') ? url : `/blog${url}`;
        map[key] = row;
      }
    }
    return map;
  } catch { return {}; }
}

export default async function init(el) {
  el.innerHTML = '';

  let posts = [];
  let meta = {};

  try {
    const [postResp, metaData] = await Promise.all([
      fetch('/blog/query-index.json'),
      fetchMetadata(),
    ]);
    meta = metaData;
    if (postResp.ok) {
      const postJson = await postResp.json();
      posts = (postJson.data || []).filter((p) => p.path !== '/blog/' && p.path !== '/blog/index');
    }
  } catch (e) {
    return;
  }

  // Collect ALL tags from posts (merged with metadata)
  const tagCounts = {};
  for (const post of posts) {
    const hasIndexTags = post.tags && (Array.isArray(post.tags) ? post.tags.length : post.tags);
    const extra = meta[post.path] || {};
    const postTags = parseTags(
      hasIndexTags ? post.tags : (extra.tags || extra['article:tag'] || ''),
    );
    for (const t of postTags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  // Sort by count descending
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'tag-cloud-wrapper';

  for (const [name, count] of sorted) {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'tag-cloud-item';
    link.innerHTML = `${name} <span class="tag-count">(${count})</span>`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Dispatch filter event to blog-cards on the same page
      document.dispatchEvent(new CustomEvent('blog:filter', { detail: { tag: name } }));
      // Scroll to blog cards section
      const cards = document.querySelector('.blog-cards');
      if (cards) cards.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    wrapper.append(link);
  }

  el.append(wrapper);
}
