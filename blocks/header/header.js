import { getConfig, getMetadata, loadBlock } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

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

  const submenu = li.querySelector(':scope > ul');
  let trigger = li.querySelector(':scope > a') || li.querySelector(':scope > p > a');

  if (!trigger && submenu) {
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
      if (!trigger.classList.contains('has-dropdown')) {
        trigger.classList.add('has-dropdown');
      }
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(li);
      });
    }
  }
}

function decorateUtilitySection(section) {
  section.classList.add('utility-section');

  const { locale: currentLocale } = getConfig();
  const topItems = section.querySelectorAll('ul > li');

  for (const li of topItems) {
    const submenu = li.querySelector(':scope > ul');
    if (!submenu) continue;

    li.classList.add('lang-selector');

    const p = li.querySelector(':scope > p');
    const defaultLabel = p
      ? p.textContent.trim()
      : (li.firstChild && li.firstChild.nodeType === Node.TEXT_NODE
        ? li.firstChild.textContent.trim()
        : 'English');
    if (p) p.remove();
    [...li.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
    });

    const langLinks = submenu.querySelectorAll('a');
    let activeLabel = defaultLabel;
    let activeLink = null;

    for (const link of langLinks) {
      const href = link.getAttribute('href');
      if (currentLocale.prefix && href
        && (href === `${currentLocale.prefix}/` || href === currentLocale.prefix)) {
        activeLabel = link.textContent.trim();
        activeLink = link.closest('li');
        break;
      }
    }

    if (activeLink) activeLink.remove();

    if (currentLocale.prefix !== '') {
      const defaultItem = document.createElement('li');
      const defaultAnchor = document.createElement('a');
      defaultAnchor.href = '/';
      defaultAnchor.textContent = defaultLabel;
      defaultItem.append(defaultAnchor);
      submenu.prepend(defaultItem);
    }

    const btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.innerHTML = `${activeLabel} <span class="chevron">&#9662;</span>`;
    li.prepend(btn);
    submenu.classList.add('lang-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      li.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!li.contains(e.target)) li.classList.remove('is-open');
    });
  }
}

function decorateBrandSection(section) {
  section.classList.add('brand-section');
  const brandLink = section.querySelector('a');
  if (brandLink) brandLink.classList.add('brand-link');
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

  const mainNavItems = nav.querySelectorAll(':scope > ul > li');
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

function decorateNavToggle(el) {
  const header = el.closest('header') || el;
  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  toggle.addEventListener('click', () => {
    header.classList.toggle('is-mobile-open');
  });
  const brand = el.querySelector('.brand-section');
  if (brand) {
    const content = brand.querySelector('.default-content');
    if (content) content.append(toggle);
  }
}

async function decorateHeader(fragment) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  if (!sections.length) return;

  let sectionIdx = 0;

  if (sections.length >= 4) {
    decorateUtilitySection(sections[sectionIdx]);
    sectionIdx += 1;
  }

  const brandSection = sections[sectionIdx] || null;
  if (brandSection) decorateBrandSection(brandSection);
  sectionIdx += 1;

  const navSection = sections[sectionIdx] || null;
  if (navSection) decorateNavSection(navSection);
  sectionIdx += 1;

  const actionsSection = sections[sectionIdx] || null;
  if (actionsSection) decorateActionsSection(actionsSection);

  const mainRow = document.createElement('div');
  mainRow.className = 'header-main-row';
  if (brandSection) mainRow.append(brandSection);
  if (navSection) mainRow.append(navSection);
  if (actionsSection) mainRow.append(actionsSection);
  fragment.append(mainRow);

  decorateNavToggle(fragment);
}

export default async function init(el) {
  const { locale } = getConfig();
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  const fragment = await loadFragment(`${locale.prefix}${path}`);
  fragment.classList.add('header-content');
  await decorateHeader(fragment);
  el.append(fragment);
}
