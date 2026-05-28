export default async function init(el) {
  const source = el.querySelector('a')?.href || '/blog/taxonomy.json';
  el.innerHTML = '';

  let tags = [];
  let posts = [];

  try {
    const [taxResp, postResp] = await Promise.all([
      fetch(source.includes('?') ? source : `${source}?sheet=tags`),
      fetch('/blog/query-index.json'),
    ]);
    const taxJson = await taxResp.json();
    const postJson = await postResp.json();
    tags = taxJson.data || [];
    posts = postJson.data || [];
  } catch (e) {
    return;
  }

  // Count occurrences of each tag across all posts
  const tagCounts = {};
  for (const post of posts) {
    const postTags = post.tags ? JSON.parse(post.tags) : [];
    for (const t of postTags) {
      tagCounts[t.toLowerCase()] = (tagCounts[t.toLowerCase()] || 0) + 1;
    }
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'tag-cloud-wrapper';

  for (const tag of tags) {
    const name = tag.Tag || tag.tag || tag.Name || tag.name;
    const slug = tag.Slug || tag.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const count = tagCounts[name.toLowerCase()] || 0;
    if (count === 0) continue;

    const link = document.createElement('a');
    link.href = `/blog/?category=${encodeURIComponent(name)}`;
    link.className = 'tag-cloud-item';
    link.innerHTML = `${name} <span class="tag-count">(${count})</span>`;
    wrapper.append(link);
  }

  el.append(wrapper);
}
