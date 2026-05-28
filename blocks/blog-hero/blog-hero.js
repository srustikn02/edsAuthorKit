function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [String(raw)];
  try { return JSON.parse(raw); } catch { /* not JSON */ }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function init(el) {
  const source = el.querySelector('a')?.href || '/blog/query-index.json';
  el.innerHTML = '';

  let post = null;
  try {
    const resp = await fetch(source);
    if (!resp.ok) return;
    const json = await resp.json();
    const posts = (json.data || []).filter((p) => p.featured === 'true');
    posts.sort((a, b) => (b.date || 0) - (a.date || 0));
    [post] = posts;
  } catch (e) {
    return;
  }

  if (!post) return;

  const tags = parseTags(post.tags);
  const date = formatDate(post.date);
  const authorSlug = post.author ? post.author.toLowerCase().replace(/\s+/g, '-') : '';

  el.innerHTML = `
    <div class="blog-hero-content">
      <h2 class="blog-hero-title">
        <a href="${post.path}">${post.title}</a>
      </h2>
      <hr class="blog-hero-separator" />
      <div class="blog-hero-meta">
        <span class="blog-hero-date">${date}</span>
        ${post.author ? `<span class="blog-hero-divider">|</span><span class="blog-hero-author">By <a href="/author/${authorSlug}">${post.author}</a></span>` : ''}
        ${tags.length ? `<span class="blog-hero-divider">|</span><a href="/blog/?category=${encodeURIComponent(tags[0])}" class="blog-hero-tag">${tags[0]}</a>` : ''}
      </div>
      ${post.description ? `<p class="blog-hero-excerpt">${post.description}</p>` : ''}
      <p class="blog-hero-cta"><a href="${post.path}">Read More</a></p>
    </div>
    <div class="blog-hero-image">
      ${(post.image && !post.image.includes('default-meta-image')) ? `<img src="${post.image.split('?')[0]}?width=750&format=webply&optimize=medium" alt="${post.title}" loading="eager" />` : ''}
    </div>
  `;
}
