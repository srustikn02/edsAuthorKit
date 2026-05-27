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
    // "Categories" is plain text with a nested <ul> — wrap text in a <button>
    const textNode = [...li.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
    );
    if (textNode) {
      const btn = document.createElement('button');
      btn.className = 'main-nav-link has-dropdown';
      btn.textContent = textNode.textContent.trim();
      textNode.replaceWith(btn);
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

  // Find language item (last list item) and make it a dropdown trigger
  const items = section.querySelectorAll('li');
  const langItem = [...items].find((li) => {
    const text = li.textContent.trim().toLowerCase();
    return !li.querySelector('a') && text.length > 0;
  });

  if (langItem) {
    langItem.classList.add('lang-selector');
    const btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.textContent = langItem.textContent.trim();
    btn.innerHTML += ' <span class="chevron">&#9662;</span>';
    langItem.textContent = '';
    langItem.append(btn);

    btn.addEventListener('click', () => {
      langItem.classList.toggle('is-open');
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

  if (sections[sectionIdx]) decorateBrandSection(sections[sectionIdx]);
  sectionIdx += 1;
  if (sections[sectionIdx]) decorateNavSection(sections[sectionIdx]);
  sectionIdx += 1;
  if (sections[sectionIdx]) decorateActionsSection(sections[sectionIdx]);

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
