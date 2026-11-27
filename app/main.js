// A deal board: every deal and a page for each, on hash routes. The deals are
// in data.js, so the site needs no network to show them; each deal links out
// to its store.
//
//   #/                                  the board, with search + filters
//   #/?q=airpods&cat=Tech&store=&min=50&sort=discount   a filtered board
//   #/deal/<id>                         one deal
//
// Filter state lives in the hash query string, so a filtered view is a real
// shareable address (and a screenshot can open one directly). Changing a
// control re-renders the list in place and updates the hash without reloading.
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from './data.js';
import { deal, list, missing, rows } from './views.js';

const app = document.getElementById('app');

function parseFilters() {
  const query = location.hash.split('?')[1] || '';
  const p = new URLSearchParams(query);
  return {
    q: p.get('q') || '',
    cat: p.get('cat') || '',
    store: p.get('store') || '',
    min: Number(p.get('min') || 0) || 0,
    sort: p.get('sort') || 'discount',
  };
}

function filtersToQuery(f) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cat) p.set('cat', f.cat);
  if (f.store) p.set('store', f.store);
  if (f.min) p.set('min', String(f.min));
  if (f.sort && f.sort !== 'discount') p.set('sort', f.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

function updateCount() {
  const count = document.getElementById('count');
  const grid = app.querySelector('.deals');
  if (count && grid) {
    const n = grid.querySelectorAll('.card').length;
    count.textContent = `${n} deal${n === 1 ? '' : 's'} shown`;
  }
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : 'Not found'} | Deal Board`;
    app.innerHTML = found ? deal(found, deals) : missing();
  } else {
    const filters = parseFilters();
    document.title = 'Deal Board — Black Friday 2026';
    app.innerHTML = list(deals, filters, deals);
    const grid = app.querySelector('.deals');
    const rerender = () => {
      const f = {
        q: app.querySelector('#q').value,
        cat: app.querySelector('#cat').value,
        store: app.querySelector('#store').value,
        min: Number(app.querySelector('#min').value) || 0,
        sort: app.querySelector('#sort').value,
      };
      grid.innerHTML = rows(deals, f);
      history.replaceState(null, '', `#/${filtersToQuery(f)}`);
      updateCount();
    };
    for (const id of ['q', 'cat', 'store', 'min', 'sort']) {
      const el = app.querySelector(`#${id}`);
      el.addEventListener(id === 'q' ? 'input' : 'change', rerender);
    }
    updateCount();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
