// HTML for each page, built from the deal data. Every value is escaped before
// it goes into the page. The "really a deal" verdict is computed only from the
// verified discount — no invented history, no invented "lowest ever" claims.

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const day = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' }) + ' ET';

// Verdict bands, from the verified discount alone.
export function verdict(d) {
  const p = percentOff(d);
  if (p >= 50) return { label: 'Deep cut — real deal', cls: 'deep', text: `${p}% off the usual price. A cut this big is the real thing — buy it if you wanted it.` };
  if (p >= 30) return { label: 'Strong deal', cls: 'strong', text: `${p}% off the usual price. A genuine saving, not a token markdown.` };
  if (p >= 20) return { label: 'Solid deal', cls: 'solid', text: `${p}% off the usual price. A fair Black Friday saving.` };
  return { label: 'Modest cut', cls: 'modest', text: `Only ${p}% off the usual price. A real saving, but a small one — compare it with the deeper cuts on this board first.` };
}

const CATEGORY_GLYPH = {
  Tech: '⌁',
  TV: '▣',
  Audio: '♪',
  Kitchen: '◐',
  Home: '⌂',
  Toys: '◆',
  Fashion: '✂',
  Beauty: '✦',
};

function card(d) {
  const v = verdict(d);
  return `<li class="card">
  <a class="card-link" href="#/deal/${encodeURIComponent(d.id)}">
    <span class="card-top"><span class="glyph" aria-hidden="true">${CATEGORY_GLYPH[d.category] ?? '•'}</span><span class="cat">${escape(d.category)}</span><span class="off">${percentOff(d)}% off</span></span>
    <span class="title">${escape(d.title)}</span>
    <span class="store">${escape(d.store)}</span>
    <span class="prices"><span class="price">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="save">save ${usd(saved(d))}</span></span>
    <span class="verdict ${v.cls}">${escape(v.label)}</span>
  </a>
</li>`;
}

export function rows(deals, filters) {
  const q = (filters.q || '').trim().toLowerCase();
  const shown = deals.filter(
    (d) =>
      (q === '' || `${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) &&
      (!filters.cat || d.category === filters.cat) &&
      (!filters.store || d.store === filters.store) &&
      percentOff(d) >= (filters.min || 0),
  );
  const sorted = [...shown].sort((a, b) => {
    if (filters.sort === 'price') return a.price - b.price;
    if (filters.sort === 'save') return saved(b) - saved(a);
    return percentOff(b) - percentOff(a);
  });
  if (sorted.length === 0) return '<li class="empty">No deal matches those filters. <a href="#/">Clear them</a>.</li>';
  return sorted.map(card).join('');
}

export function list(deals, filters, all) {
  const totalSaved = all.reduce((s, d) => s + saved(d), 0);
  const best = Math.max(...all.map(percentOff));
  const cats = [...new Set(all.map((d) => d.category))].sort();
  const stores = [...new Set(all.map((d) => d.store))].sort();
  const opt = (list, current, label) =>
    `<option value="">${label}</option>` +
    list.map((v) => `<option value="${escape(v)}"${v === current ? ' selected' : ''}>${escape(v)}</option>`).join('');
  return `<section class="hero">
  <p class="kicker">Black Friday · Cyber Monday 2026</p>
  <h1>Real deals, checked today</h1>
  <p class="lede">Every price below was read on the store's own page — or on a deals roundup that shows the price — on <strong>27 Nov 2026</strong>. No roundup copy-paste, no invented prices. If a cut is small, the board says so.</p>
  <dl class="stats">
    <div><dt>Verified deals</dt><dd>${all.length}</dd></div>
    <div><dt>Stores</dt><dd>${stores.length}</dd></div>
    <div><dt>Deepest cut</dt><dd>${best}%</dd></div>
    <div><dt>Total you could save</dt><dd>${usd(totalSaved)}</dd></div>
  </dl>
</section>
<section class="controls" aria-label="Find a deal">
  <label>Search <input type="search" id="q" value="${escape(filters.q || '')}" placeholder="Try “AirPods”, “TV”, “LEGO”…"></label>
  <label>Category <select id="cat">${opt(cats, filters.cat, 'All categories')}</select></label>
  <label>Store <select id="store">${opt(stores, filters.store, 'All stores')}</select></label>
  <label>At least <select id="min">
    <option value="0"${!filters.min ? ' selected' : ''}>Any discount</option>
    <option value="20"${filters.min === 20 ? ' selected' : ''}>20% off</option>
    <option value="30"${filters.min === 30 ? ' selected' : ''}>30% off</option>
    <option value="50"${filters.min === 50 ? ' selected' : ''}>50% off</option>
  </select></label>
  <label>Sort by <select id="sort">
    <option value="discount"${filters.sort !== 'price' && filters.sort !== 'save' ? ' selected' : ''}>Biggest discount</option>
    <option value="price"${filters.sort === 'price' ? ' selected' : ''}>Lowest price</option>
    <option value="save"${filters.sort === 'save' ? ' selected' : ''}>Biggest saving</option>
  </select></label>
  <p class="count" id="count"></p>
</section>
<ul class="deals">${rows(deals, filters)}</ul>`;
}

export function deal(d, all) {
  const v = verdict(d);
  const same = all.filter((x) => x.id !== d.id && x.title === d.title);
  const others = same.length
    ? `<section class="same"><h2>Same product, other stores</h2><ul>${same
        .map(
          (x) =>
            `<li><a href="#/deal/${encodeURIComponent(x.id)}">${escape(x.store)} — ${usd(x.price)} (${percentOff(x)}% off)</a></li>`,
        )
        .join('')}</ul></section>`
    : '';
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <p class="card-top"><span class="glyph" aria-hidden="true">${CATEGORY_GLYPH[d.category] ?? '•'}</span><span class="cat">${escape(d.category)}</span><span class="off">${percentOff(d)}% off</span></p>
  <h1>${escape(d.title)}</h1>
  <p class="prices big"><span class="price">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="save">you save ${usd(saved(d))}</span></p>
  <p class="verdict ${v.cls}">${escape(v.label)}</p>
  <p class="verdict-text">${escape(v.text)}</p>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Checked</dt><dd>${day(d.checked)}</dd>
    <dt>Where the price was read</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="note">${escape(d.note)}</p>
  <p><a class="cta" href="${escape(d.url)}" target="_blank" rel="noopener">See it at ${escape(d.store)} &rarr;</a></p>
  <p class="fineprint">Prices change fast on Black Friday — re-check the store page before buying.</p>
</article>
${others}`;
}

export function missing() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
