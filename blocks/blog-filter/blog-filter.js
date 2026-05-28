export default async function init(el) {
  const source = el.querySelector('a')?.href || el.textContent.trim();
  const taxonomyUrl = source.includes('taxonomy') ? source : '/blog/taxonomy.json?sheet=categories';

  el.innerHTML = '';
  el.classList.add('blog-filter');

  let categories = [];
  try {
    const resp = await fetch(taxonomyUrl.includes('?') ? taxonomyUrl : `${taxonomyUrl}?sheet=categories`);
    if (resp.ok) {
      const json = await resp.json();
      categories = json.data || [];
    }
  } catch (e) {
    /* taxonomy not available yet */
  }

  if (!categories.length) return;

  // Build filter UI
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-wrapper';

  // Accordion toggle for mobile
  const toggle = document.createElement('button');
  toggle.className = 'filter-toggle';
  toggle.textContent = 'Categories';
  toggle.addEventListener('click', () => {
    wrapper.classList.toggle('is-open');
  });

  const list = document.createElement('ul');
  list.className = 'filter-list';

  // "All" button
  const allItem = document.createElement('li');
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn is-active';
  allBtn.textContent = 'All';
  allBtn.dataset.tag = '';
  allItem.append(allBtn);
  list.append(allItem);

  // Category buttons
  for (const cat of categories) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat.Name || cat.name;
    btn.dataset.tag = cat.Name || cat.name;
    li.append(btn);
    list.append(li);
  }

  // Reset link
  const resetItem = document.createElement('li');
  resetItem.className = 'filter-reset-item';
  const resetLink = document.createElement('a');
  resetLink.className = 'filter-reset';
  resetLink.href = '#';
  resetLink.textContent = 'Reset';
  resetItem.append(resetLink);
  list.append(resetItem);

  wrapper.append(toggle, list);
  el.append(wrapper);

  // Click handler
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    const reset = e.target.closest('.filter-reset');

    if (btn) {
      el.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.dispatchEvent(new CustomEvent('blog:filter', { detail: { tag: btn.dataset.tag } }));
      wrapper.classList.remove('is-open');
    }

    if (reset) {
      e.preventDefault();
      const allButton = el.querySelector('.filter-btn');
      if (allButton) allButton.click();
    }
  });

  // Check URL for pre-selected category
  const urlParams = new URLSearchParams(window.location.search);
  const preselect = urlParams.get('category');
  if (preselect) {
    const match = el.querySelector(`.filter-btn[data-tag="${preselect}"]`);
    if (match) match.click();
  }
}
