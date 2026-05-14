/* Live search in the navbar */
(function () {
  const input = document.getElementById('global-search');
  const dropdown = document.getElementById('search-results');
  if (!input || !dropdown) return;

  let timer = null;

  input.addEventListener('input', function () {
    clearTimeout(timer);
    const q = this.value.trim();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }
    timer = setTimeout(() => fetchResults(q), 200);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { dropdown.classList.add('hidden'); input.blur(); }
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  async function fetchResults(q) {
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q));
      const data = await res.json();
      render(data);
    } catch (_) { /* ignore */ }
  }

  function render(results) {
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="search-item" style="color:#94a3b8">Keine Ergebnisse</div>';
      dropdown.classList.remove('hidden');
      return;
    }
    dropdown.innerHTML = results.map(r => {
      const pidClean = r.id.replace(/@/g, '');
      const initial = r.name.charAt(0) || '?';
      const avatarClass = r.sex === 'M' ? 'avatar-m' : r.sex === 'F' ? 'avatar-f' : 'avatar-u';
      return `<a class="search-item" href="/person/${pidClean}">
        <span class="member-avatar avatar-sm ${avatarClass}">${initial}</span>
        <span>
          <div class="search-item-name">${esc(r.name)}</div>
          ${r.short_life ? `<div class="search-item-life">${esc(r.short_life)}</div>` : ''}
        </span>
      </a>`;
    }).join('');
    dropdown.classList.remove('hidden');
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
