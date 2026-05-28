function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [String(raw)];
  try { return JSON.parse(raw); } catch { /* not JSON */ }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function extractSheetData(json, sheetName) {
  if (json[sheetName]?.data) return json[sheetName].data;
  if (json.data) return json.data;
  const key = Object.keys(json).find((k) => !k.startsWith(':') && json[k]?.data);
  return key ? json[key].data : [];
}

async function fetchMetadata() {
  try {
    const resp = await fetch('/blog/metadata.json');
    if (!resp.ok) return {};
    const json = await resp.json();
    const rows = json.data || json.metadata?.data || json[Object.keys(json).find((k) => !k.startsWith(':'))]?.data || [];
    const map = {};
    for (const row of rows) {
      const url = row.URL || row.url || row.Path || row.path;
      if (url && !url.includes('*')) {
        const key = url.startsWith('/blog') ? url : `/blog${url}`;
        map[key] = row;
      }
    }
    return map;
  } catch { return {}; }
}

export default async function init(el) {
  const source = el.querySelector('a')?.href || '/blog/taxonomy.json';
  el.innerHTML = '';

  let tags = [];
  let posts = [];
  let meta = {};

  try {
    const [taxResp, postResp, metaData] = await Promise.all([
      fetch(source.split('?')[0]),
      fetch('/blog/query-index.json'),
      fetchMetadata(),
    ]);
    meta = metaData;
    if (taxResp.ok) {
      const taxJson = await taxResp.json();
      tags = extractSheetData(taxJson, 'tags');
      if (!tags.length) tags = extractSheetData(taxJson, 'categories');
    }
    if (postResp.ok) {
      const postJson = await postResp.json();
      posts = postJson.data || [];
    }
  } catch (e) {
    /* data not available yet */
  }

  if (!tags.length) return;

  // Count tags — merge query-index tags with metadata tags
  const tagCounts = {};
  for (const post of posts) {
    const hasIndexTags = post.tags && (Array.isArray(post.tags) ? post.tags.length : post.tags);
    const extra = meta[post.path] || {};
    const postTags = parseTags(hasIndexTags ? post.tags : (extra['article:tag'] || ''));
    for (const t of postTags) {
      tagCounts[t.toLowerCase()] = (tagCounts[t.toLowerCase()] || 0) + 1;
    }
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'tag-cloud-wrapper';

  for (const tag of tags) {
    const name = tag.Tag || tag.tag || tag.Name || tag.name;
    if (!name) continue;
    const count = tagCounts[name.toLowerCase()] || 0;

    const link = document.createElement('a');
    link.href = `/blog/?category=${encodeURIComponent(name)}`;
    link.className = 'tag-cloud-item';
    link.innerHTML = `${name} <span class="tag-count">(${count})</span>`;
    wrapper.append(link);
  }

  if (!wrapper.children.length) return;
  el.append(wrapper);
}
