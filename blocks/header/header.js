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
  const link = li.querySelector(':scope > a') || li.querySelector(':scope > p > a');
  if (link) link.classList.add('main-nav-link');

  // Check if this nav item has a nested sub-menu (ul)
  const submenu = li.querySelector(':scope > ul');
  if (submenu) {
    submenu.classList.add('nav-dropdown');
    if (link) {
      link.classList.add('has-dropdown');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(li);
      });
    }
  }
}

function decorateUtilitySection(section) {
  section.classList.add('utility-section');
}

function decorateBrandSection(section) {
  section.classList.add('brand-section');
  const brandLink = section.querySelector('a');
  if (!brandLink) return;
  const picture = brandLink.querySelector('picture');
  if (picture) {
    brandLink.classList.add('brand-link');
  }
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
  // Load any blocks inside the actions section (e.g., search)
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

  // Detect if first section is utility bar (has no picture/image = not brand)
  // Waters Blog: Section 0 = utility, Section 1 = brand, Section 2 = nav, Section 3 = actions
  let sectionIdx = 0;

  // If there are 4+ sections, first is utility bar
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

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
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
