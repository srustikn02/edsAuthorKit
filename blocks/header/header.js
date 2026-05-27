import { getConfig, getMetadata, loadBlock } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';

function closeAllMenus() {
  const openMenus = document.body.querySelectorAll('header .is-open');
  for (const openMenu of openMenus) {
    openMenu.classList.remove('is-open');
  }
}

function docClose(e) {
  if (e.target.closest('header')) return;
  closeAllMenus();
}

function toggleMenu(menu) {
  const isOpen = menu.classList.contains('is-open');
  closeAllMenus();
  if (isOpen) {
    document.removeEventListener('click', docClose);
    return;
  }
  document.addEventListener('click', docClose);
  menu.classList.add('is-open');
}

function decorateNavItem(li) {
  li.classList.add('main-nav-item');

  // Check if this nav item has a nested sub-menu (ul)
  const submenu = li.querySelector(':scope > ul');

  // Find the link OR create a clickable trigger from plain text
  let trigger = li.querySelector(':scope > a') || li.querySelector(':scope > p > a');

  if (!trigger && submenu) {
    // "Categories" is inside a <p> with no link — replace <p> with a clickable <button>
    const p = li.querySelector(':scope > p');
    if (p) {
      const btn = document.createElement('button');
      btn.className = 'main-nav-link has-dropdown';
      btn.textContent = p.textContent.trim();
      p.replaceWith(btn);
      trigger = btn;
    }
  }

  if (trigger && trigger.tagName === 'A') {
    trigger.classList.add('main-nav-link');
  }

  if (submenu) {
    submenu.classList.add('nav-dropdown');
    if (trigger) {
      trigger.classList.add('has-dropdown');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(li);
      });
    }
  }
}

function decorateUtilitySection(section) {
  section.classList.add('utility-section');

  // Find language item — a <li> with nested <ul> of language links
  const topItems = section.querySelectorAll(':scope ul > li');
  for (const li of topItems) {
    const submenu = li.querySelector(':scope > ul');
    if (!submenu) continue;

    // This li has a nested language list
    li.classList.add('lang-selector');

    // Get the current language label from text or <p>
    const p = li.querySelector(':scope > p');
    const labelText = p ? p.textContent.trim() : li.firstChild?.textContent?.trim() || 'English';
    if (p) p.remove();

    // Remove bare text nodes (the label text)
    [...li.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
    });

    // Create the trigger button
    const btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.innerHTML = `${labelText} <span class="chevron">&#9662;</span>`;

    // Insert button before the dropdown list
    li.prepend(btn);

    // Style the dropdown
    submenu.classList.add('lang-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      li.classList.toggle('is-open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!li.contains(e.target)) li.classList.remove('is-open');
    });
  }
}

function decorateBrandSection(section) {
  section.classList.add('brand-section');
  const brandLink = section.querySelector('a');
  if (!brandLink) return;
  brandLink.classList.add('brand-link');
}

function decorateNavSection(section) {
  section.classList.add('main-nav-section');
  const navContent = section.querySelector('.default-content');
  const navList = section.querySelector('ul');
  if (!navList) return;
  navList.classList.add('main-nav-list');

  const nav = document.createElement('nav');
  nav.append(navList);
  if (navContent) navContent.append(nav);

  const mainNavItems = section.querySelectorAll('nav > ul > li');
  for (const navItem of mainNavItems) {
    decorateNavItem(navItem);
  }
}

function decorateActionsSection(section) {
  section.classList.add('actions-section');
  const blocks = section.querySelectorAll('.block-content > div[class]');
  for (const block of blocks) {
    loadBlock(block);
  }
}

function decorateNavToggle(header) {
  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  toggle.addEventListener('click', () => {
    header.classList.toggle('is-mobile-open');
  });
  const brand = header.querySelector('.brand-section');
  if (brand) brand.querySelector('.default-content')?.append(toggle);
}

async function decorateHeader(fragment) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  let sectionIdx = 0;

  if (sections.length >= 4) {
    decorateUtilitySection(sections[sectionIdx]);
    sectionIdx += 1;
  }

  const brandSection = sections[sectionIdx];
  if (brandSection) decorateBrandSection(brandSection);
  sectionIdx += 1;

  const navSection = sections[sectionIdx];
  if (navSection) decorateNavSection(navSection);
  sectionIdx += 1;

  const actionsSection = sections[sectionIdx];
  if (actionsSection) decorateActionsSection(actionsSection);

  // Wrap brand + nav + actions into a horizontal main row
  const mainRow = document.createElement('div');
  mainRow.className = 'header-main-row';
  if (brandSection) mainRow.append(brandSection);
  if (navSection) mainRow.append(navSection);
  if (actionsSection) mainRow.append(actionsSection);
  fragment.append(mainRow);

  decorateNavToggle(fragment);
}

export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('header-content');
    await decorateHeader(fragment);
    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
