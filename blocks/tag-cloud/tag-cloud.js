function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [String(raw)];
  try { return JSON.parse(raw); } catch { /* not JSON */ }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function extractSheetData(json, sheetName) {
  // Multi-sheet: { tags: { data: [...] }, categories: { data: [...] } }
  if (json[sheetName]?.data) return json[sheetName].data;
  // Single sheet: { data: [...] }
  if (json.data) return json.data;
  // Try first non-meta key
  const key = Object.keys(json).find((k) => !k.startsWith(':') && json[k]?.data);
  return key ? json[key].data : [];
}

export default async function init(el) {
  const source = el.querySelector('a')?.href || '/blog/taxonomy.json';
  el.innerHTML = '';

  let tags = [];
  let posts = [];

  try {
    const [taxResp, postResp] = await Promise.all([
      fetch(source.split('?')[0]),
      fetch('/blog/query-index.json'),
    ]);
    if (taxResp.ok) {
      const taxJson = await taxResp.json();
      // Try "tags" sheet first, fall back to "categories"
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

  // Count occurrences of each tag across all posts
  const tagCounts = {};
  for (const post of posts) {
    const postTags = parseTags(post.tags);
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
