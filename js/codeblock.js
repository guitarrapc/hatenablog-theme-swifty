/**
 * Script to add tools (wrap toggle & copy) to Hatena Blog code blocks
 */
(function () {
  'use strict';

  const LABELS = {
    wrap: 'Wrap',
    copy: 'Copy',
    copied: 'Copied!',
    copyFailed: 'Copy failed',
  };

  // How long the copy result stays on the button
  const RESET_DELAY = 2000;

  function createButton(className, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block-button ' + className;
    button.textContent = label;
    return button;
  }

  function enhance(pre) {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    // The toolbar sits in the header band the theme reserves at the top of every code block,
    // so the buttons never cover the code and adding them does not shift the layout
    const toolbar = document.createElement('div');
    toolbar.className = 'code-block-toolbar';

    const wrapButton = createButton('code-block-wrap', LABELS.wrap);
    wrapButton.setAttribute('aria-pressed', 'false');
    const copyButton = createButton('code-block-copy', LABELS.copy);
    toolbar.append(wrapButton, copyButton);

    // Changing the button text is not announced by screen readers, so report the copy result here
    const status = document.createElement('span');
    status.className = 'code-block-status';
    status.setAttribute('role', 'status');

    pre.before(wrapper);
    wrapper.append(pre, toolbar, status);

    wrapButton.addEventListener('click', function () {
      const wrapped = pre.classList.toggle('is-wrapped');
      wrapButton.setAttribute('aria-pressed', String(wrapped));
    });

    let resetTimer = null;
    function showResult(copied) {
      const label = copied ? LABELS.copied : LABELS.copyFailed;
      copyButton.classList.toggle('is-copied', copied);
      copyButton.classList.toggle('is-failed', !copied);
      copyButton.textContent = label;
      status.textContent = label;

      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        copyButton.classList.remove('is-copied', 'is-failed');
        copyButton.textContent = LABELS.copy;
        status.textContent = '';
      }, RESET_DELAY);
    }

    copyButton.addEventListener('click', function () {
      // The language label is a pseudo element and the buttons are outside <pre>, so this is the code only
      const code = pre.textContent;
      if (!navigator.clipboard) {
        showResult(false);
        return;
      }
      navigator.clipboard.writeText(code).then(function () {
        showResult(true);
      }, function () {
        showResult(false);
      });
    });
  }

  function enhanceAll() {
    // Hatena's ASCII art (pre.lang-aa) is not code
    document.querySelectorAll('.entry-content pre.code:not(.lang-aa)').forEach(function (pre) {
      // Already enhanced (the script may run more than once)
      if (pre.parentElement && pre.parentElement.classList.contains('code-block')) {
        return;
      }
      enhance(pre);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAll);
  } else {
    enhanceAll();
  }
})();
