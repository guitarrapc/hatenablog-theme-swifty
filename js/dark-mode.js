/**
 * Script to let readers choose light, dark, or automatic (OS setting) colors.
 * The theme switches colors with the --swifty-color-mode custom property on <html>;
 * this script sets it from the reader's choice and adds a button to the blog header.
 */
(function () {
  'use strict';

  const root = document.documentElement;

  // Run once even if the snippet is pasted twice
  if (root.hasAttribute('data-swifty-color-mode-toggle')) {
    return;
  }
  // Tells the theme CSS to keep room for the button in the header from the start, so adding it later does not move the title
  root.setAttribute('data-swifty-color-mode-toggle', '');

  // Remember the reader's choice across pages
  const STORAGE_KEY = 'swifty-color-mode';
  const MODES = ['light', 'dark', 'auto'];

  const ICONS = {
    light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    auto: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  };

  const LABELS = {
    light: 'ライト',
    dark: 'ダーク',
    auto: '自動',
  };

  function storedMode() {
    try {
      const mode = localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(mode) >= 0 ? mode : 'auto';
    } catch (e) {
      // Storage can be unavailable (e.g. blocked cookies); follow the blog's default
      return 'auto';
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // Without storage the choice still applies on this page
    }
  }

  // A choice on <html> (inline style) wins over the blog's design CSS. Automatic removes it and
  // falls back to the blog's default: the design CSS setting if any, otherwise the OS setting
  function applyMode(mode) {
    if (mode === 'auto') {
      root.style.removeProperty('--swifty-color-mode');
    } else {
      root.style.setProperty('--swifty-color-mode', mode);
    }
  }

  // Apply before the page is painted (place the snippet in <head> to avoid a flash of the other colors)
  let current = storedMode();
  applyMode(current);

  function createToggle() {
    const container = document.createElement('div');
    container.className = 'color-mode-toggle';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-mode-toggle-button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'color-mode-toggle-menu');

    const menu = document.createElement('div');
    menu.className = 'color-mode-toggle-menu';
    menu.id = 'color-mode-toggle-menu';
    menu.hidden = true;

    const options = MODES.map(function (mode) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'color-mode-toggle-option';
      option.setAttribute('data-mode', mode);
      option.innerHTML = ICONS[mode];
      const label = document.createElement('span');
      label.textContent = mode === 'auto' ? '自動(OSの設定)' : LABELS[mode];
      option.appendChild(label);
      option.addEventListener('click', function () {
        current = mode;
        applyMode(mode);
        saveMode(mode);
        update();
        close();
        button.focus();
      });
      menu.appendChild(option);
      return option;
    });

    // Show the current choice on the button and in the menu
    function update() {
      button.innerHTML = ICONS[current];
      button.setAttribute('aria-label', '表示モード: ' + LABELS[current]);
      options.forEach(function (option) {
        option.setAttribute('aria-pressed', String(option.getAttribute('data-mode') === current));
      });
    }

    function open() {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    }

    function close() {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }

    button.addEventListener('click', function () {
      if (menu.hidden) {
        open();
      } else {
        close();
      }
    });

    // Close on a click outside, and on Escape (returning focus to the button)
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !container.contains(e.target)) {
        close();
      }
    });
    container.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        close();
        button.focus();
      }
    });
    // Close when focus leaves the button and the menu
    container.addEventListener('focusout', function (e) {
      if (!menu.hidden && e.relatedTarget && !container.contains(e.relatedTarget)) {
        close();
      }
    });

    update();
    container.append(button, menu);
    return container;
  }

  // Put the button at the end of the blog header as soon as the header is parsed
  // (after the title, so it comes after the title in the tab order)
  function insert() {
    const header = document.getElementById('blog-title');
    const inner = document.getElementById('blog-title-inner');
    const parsed = header && (header.nextElementSibling || document.readyState !== 'loading');
    if (!parsed || !inner) {
      return document.readyState !== 'loading';
    }
    if (!inner.querySelector(':scope > .color-mode-toggle')) {
      inner.appendChild(createToggle());
    }
    return true;
  }

  if (!insert()) {
    const observer = new MutationObserver(function () {
      if (insert()) {
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', function () {
      observer.disconnect();
      insert();
    });
  }
})();
