const POSTS_PER_PAGE = 6;

function parseTags(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { /* not JSON */ }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function estimateReadingTime(content) {
  if (!content) return 0;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function renderCard(post) {
  const card = document.createElement('article');
  card.className = 'blog-card';

  const imageUrl = post.image || '/img/default-blog.png';
  const date = formatDate(post.date);
  const readTime = estimateReadingTime(post.content);
  const tags = parseTags(post.tags);

  card.innerHTML = `
    <a href="${post.path}" class="blog-card-image">
      <img src="${imageUrl}?width=480&format=webply&optimize=medium" alt="${post.title}" loading="lazy" />
    </a>
    <div class="blog-card-content">
      <h3 class="blog-card-title">
        <a href="${post.path}">${post.title}</a>
      </h3>
      <div class="blog-card-meta">
        <span class="blog-card-date">${date}</span>
        ${post.author ? `<span class="blog-card-author">| By <a href="/author/${post.author.toLowerCase().replace(/\s+/g, '-')}">${post.author}</a></span>` : ''}
      </div>
      ${readTime ? `<div class="blog-card-reading-time">Reading Time: ${readTime} minutes</div>` : ''}
      ${post.description ? `<p class="blog-card-excerpt">${post.description}</p>` : ''}
    </div>
  `;
  return card;
}

function renderPagination(currentPage, totalPages, onPageChange) {
  const nav = document.createElement('nav');
  nav.className = 'blog-pagination';

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 3 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (!nav.querySelector('.ellipsis')) {
        const dots = document.createElement('span');
        dots.className = 'ellipsis';
        dots.textContent = '...';
        nav.append(dots);
      }
      continue;
    }
    const btn = document.createElement('button');
    btn.className = `page-btn${i === currentPage ? ' is-active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => onPageChange(i));
    nav.append(btn);
  }

  if (currentPage < totalPages) {
    const next = document.createElement('button');
    next.className = 'page-btn page-next';
    next.textContent = '>';
    next.addEventListener('click', () => onPageChange(currentPage + 1));
    nav.append(next);
  }

  return nav;
}

export default async function init(el) {
  const source = el.querySelector('a')?.href || '/blog/query-index.json';
  const isFeatured = el.classList.contains('featured');

  el.innerHTML = '';

  let allPosts = [];
  try {
    const resp = await fetch(source);
    if (resp.ok) {
      const json = await resp.json();
      allPosts = json.data || [];
    }
  } catch (e) {
    /* index not available yet */
  }

  if (!allPosts.length) {
    el.innerHTML = '<p>No posts available yet. Publish blog pages to populate the index.</p>';
    return;
  }

  // Sort by date descending
  allPosts.sort((a, b) => (b.date || 0) - (a.date || 0));

  if (isFeatured) {
    allPosts = allPosts.filter((p) => p.featured === 'true');
  }

  const grid = document.createElement('div');
  grid.className = 'blog-cards-grid';

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'blog-pagination-container';

  let currentFilter = '';
  let currentPage = 1;

  function render() {
    let filtered = currentFilter
      ? allPosts.filter((p) => {
          const tags = parseTags(p.tags);
          return tags.includes(currentFilter);
        })
      : allPosts;

    const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filtered.slice(start, start + POSTS_PER_PAGE);

    grid.innerHTML = '';
    pagePosts.forEach((post) => grid.append(renderCard(post)));

    paginationContainer.innerHTML = '';
    if (totalPages > 1) {
      paginationContainer.append(renderPagination(currentPage, totalPages, (page) => {
        currentPage = page;
        render();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  }

  el.append(grid, paginationContainer);
  render();

  // Listen for filter events
  document.addEventListener('blog:filter', (e) => {
    currentFilter = e.detail.tag;
    currentPage = 1;
    render();
  });
}
