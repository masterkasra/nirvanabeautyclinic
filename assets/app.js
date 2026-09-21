/* =========================================================
   Nirvana Beauty Clinic — progressive enhancement only.
   All content is already in the HTML; this adds interaction.
   Data comes from window.NV (injected per page/language).
   ========================================================= */
(() => {
const NV = window.NV || {};
const L = NV.lang || 'fa';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const T = k => (NV.t && NV.t[k]) || '';
const DIGITS = { fa: '۰۱۲۳۴۵۶۷۸۹', ar: '٠١٢٣٤٥٦٧٨٩' };
const dg = s => (DIGITS[L] ? String(s).replace(/\d/g, d => DIGITS[L][d]) : String(s));
const enDigits = s => String(s).replace(/[۰-۹٠-٩]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(d) : '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  $('span', t).textContent = msg;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 2800);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
}

/* ---------- preloader ---------- */
setTimeout(() => $('#preloader')?.classList.add('is-done'), reduced ? 0 : 1000);

/* ---------- header / progress / dock ---------- */
const header = $('#header'), progress = $('#progress'), dock = $('#dock');
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  header?.classList.toggle('is-scrolled', y > 40);
  if (progress) progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  dock?.classList.toggle('is-visible', y > innerHeight * .6);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* nav highlight (home only) */
const navLinks = $$('.nav a[href^="#"]');
if (navLinks.length) {
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const el = $(a.getAttribute('href')); if (el) spy.observe(el); });
}

/* ---------- drawer ---------- */
const drawer = $('#drawer'), burger = $('#burger');
function setDrawer(open) {
  if (!drawer) return;
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  burger?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) $('.drawer-close', drawer)?.focus();
}
burger?.addEventListener('click', () => setDrawer(true));
drawer?.addEventListener('click', e => { if (e.target.closest('[data-close], a')) setDrawer(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') { setDrawer(false); $$('details.lang[open]').forEach(d => (d.open = false)); } });
document.addEventListener('click', e => {
  $$('details.lang[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
});

/* ---------- reveal + split headline + counters ---------- */
$$('[data-split]').forEach(el => {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const w = document.createElement('span');
        w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part;
        frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && !n.classList.contains('sr-only')) walk(n);
  });
  walk(el);
  $$('.accent .w', el).forEach(w => w.classList.add('accent'));
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal, .split').forEach(el => io.observe(el));

const counterIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1500;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = dg(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
});
$$('[data-count]').forEach(el => counterIO.observe(el));

/* ---------- service filters ---------- */
const filters = $('#filters');
filters?.addEventListener('click', e => {
  const b = e.target.closest('.filter'); if (!b) return;
  $$('.filter', filters).forEach(f => { f.classList.toggle('is-active', f === b); f.setAttribute('aria-pressed', String(f === b)); });
  const cat = b.dataset.cat;
  const run = () => $$('#services-grid .svc').forEach(c => c.classList.toggle('is-hidden', cat !== 'all' && c.dataset.cat !== cat));
  document.startViewTransition && !reduced ? document.startViewTransition(run) : run();
});
// pointer glow on cards
document.addEventListener('pointermove', e => {
  const card = e.target.closest?.('.svc'); if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

/* ---------- face map: camera that dollies onto the chosen area ---------- */
const facemap = $('#facemap');
const stage = $('#face-stage'), cam = $('#face-cam');
function aim(x, y, z) {
  // Keep the point (x%, y%) centred while scaling by z, clamped so the frame never shows an empty edge.
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const tx = z > 1 ? clamp(50 - x * z, 100 - 100 * z, 0) : 0;
  const ty = z > 1 ? clamp(50 - y * z, 100 - 100 * z, 0) : 0;
  cam.style.setProperty('--tx', tx + '%');
  cam.style.setProperty('--ty', ty + '%');
  cam.style.setProperty('--s', z);
  stage.classList.toggle('is-zoomed', z > 1);
  $('#finder-zoom').textContent = dg(z.toFixed(1)) + '×';
}
function selectZone(id, { camera = true } = {}) {
  $$('[data-zone]', facemap).forEach(x => {
    const on = x.dataset.zone === id;
    x.classList.toggle('is-active', on);
    if (x.classList.contains('zone-btn')) x.setAttribute('aria-pressed', String(on));
  });
  $$('[data-zone-panel]', facemap).forEach(p => {
    const on = p.dataset.zonePanel === id;
    p.hidden = !on;
    if (on) { p.classList.remove('fade-swap'); void p.offsetWidth; p.classList.add('fade-swap'); }
  });
  if (!camera || !cam) return;
  const spot = $(`.hotspot[data-zone="${id}"]`, cam);
  const label = $(`.zone-btn[data-zone="${id}"]`, facemap)?.textContent || '';
  $('#finder-label').textContent = spot ? label : '';
  spot ? aim(+spot.dataset.x, +spot.dataset.y, +spot.dataset.z) : aim(50, 50, 1);
}
if (facemap && cam) {
  facemap.addEventListener('click', e => {
    if (e.target.closest('[data-view-all]')) { aim(50, 50, 1); $('#finder-label').textContent = ''; return; }
    const b = e.target.closest('[data-zone]'); if (b) selectZone(b.dataset.zone);
  });
  // Opening shot: wide view, then the camera glides in to the eyes once the section is on screen.
  aim(50, 50, 1);
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    setTimeout(() => selectZone('eyes'), reduced ? 0 : 900);
  }, { threshold: .45 }).observe(stage);

  // ?calibrate — click the portrait to read the x/y (percent) of any spot, for CONFIG.faceZones.
  if (new URLSearchParams(location.search).has('calibrate')) {
    stage.classList.add('is-calibrating');
    cam.addEventListener('click', e => {
      if (e.target.closest('.hotspot')) return;
      const r = cam.getBoundingClientRect();
      const x = +((e.clientX - r.left) / r.width * 100).toFixed(1), y = +((e.clientY - r.top) / r.height * 100).toFixed(1);
      const txt = `{ x: ${x}, y: ${y} }`;
      copy(txt); toast(txt);
    });
  }
}

/* ---------- quiz ---------- */
const quizCard = $('#quiz-card');
if (quizCard) {
  const answers = { concern: [], downtime: null, goal: null };
  let step = 0;
  const prevBtn = $('#quiz-prev'), nextBtn = $('#quiz-next'), results = $('#results');
  const valid = () => (step === 0 ? answers.concern.length > 0 : step === 1 ? answers.downtime !== null : step === 2 ? answers.goal !== null : true);
  const arrow = '<svg class="arw" aria-hidden="true"><use href="#i-arrow"/></svg>';

  function render() {
    $$('.quiz-step', quizCard).forEach(s => s.classList.toggle('is-active', +s.dataset.step === step));
    $$('.quiz-progress i', quizCard).forEach((b, i) => b.classList.toggle('is-done', i <= step));
    prevBtn.disabled = step === 0;
    nextBtn.disabled = !valid();
    nextBtn.innerHTML = step === 2 ? `${T('showResult')}<svg aria-hidden="true"><use href="#i-sparkle"/></svg>` : step === 3 ? `${T('restart')}${arrow}` : `${T('next')}${arrow}`;
    if (step === 3) renderResults();
  }
  function renderResults() {
    const score = {};
    answers.concern.forEach(c => Object.entries(NV.fit[c] || {}).forEach(([s, w]) => { score[s] = (score[s] || 0) + w; }));
    Object.keys(score).forEach(s => {
      if (NV.down[s] > answers.downtime) score[s] -= 2.5 * (NV.down[s] - answers.downtime);
      score[s] += (NV.bonus[answers.goal]?.[s] || 0);
    });
    const ranked = Object.entries(score).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = Math.max(...ranked.map(r => r[1]), 1);
    if (!ranked.length) {
      results.innerHTML = `<div class="result"><span class="rank">?</span><div><h4>${T('consult')}</h4><p>${T('consultNone')}</p></div><a class="btn btn--light btn--sm" href="#booking">${T('bookShort')}</a></div>`;
      return;
    }
    results.innerHTML = ranked.map(([slug, v], i) => {
      const pct = Math.round(Math.max(55, Math.min(98, (v / max) * 96)));
      return `<div class="result" style="animation-delay:${i * .12}s">
        <span class="rank">${dg(i + 1)}</span>
        <div><h4><a href="${NV.urls[slug]}">${NV.names[slug]}</a> <span class="match">· ${dg(pct)}٪ ${T('match')}</span></h4><p>${NV.shorts[slug]}</p></div>
        <a class="btn btn--light btn--sm" href="#booking" data-book="${slug}">${T('bookShort')}</a>
      </div>`;
    }).join('');
    if (L === 'en') $$('.match', results).forEach(m => (m.textContent = m.textContent.replace('٪', '%')));
  }
  quizCard.addEventListener('click', e => {
    const o = e.target.closest('.opt');
    if (o) {
      const { key, v } = o.dataset;
      if (o.dataset.multi === 'true') {
        const on = o.getAttribute('aria-pressed') !== 'true';
        o.setAttribute('aria-pressed', String(on));
        answers[key] = on ? [...answers[key], v] : answers[key].filter(x => x !== v);
      } else {
        $$(`.opt[data-key="${key}"]`, quizCard).forEach(b => b.setAttribute('aria-pressed', String(b === o)));
        answers[key] = key === 'downtime' ? +v : v;
        setTimeout(() => { if (step < 3 && valid()) { step++; render(); } }, reduced ? 0 : 350);
      }
      nextBtn.disabled = !valid();
      return;
    }
    if (e.target.closest('#quiz-next')) {
      if (step === 3) {
        answers.concern = []; answers.downtime = null; answers.goal = null;
        $$('.opt', quizCard).forEach(b => b.setAttribute('aria-pressed', 'false'));
        step = 0;
      } else if (valid()) step++;
      render();
    }
    if (e.target.closest('#quiz-prev') && step > 0) { step--; render(); }
  });
  render();
}

/* ---------- aftercare tabs ---------- */
const tabs = $('.tabs');
function selectCare(id) {
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.careTab === id)));
  $$('.care-wrap .care-panel').forEach(p => {
    const on = p.dataset.care === id;
    p.hidden = !on;
    if (on) { p.classList.remove('fade-swap'); void p.offsetWidth; p.classList.add('fade-swap'); }
  });
}
tabs?.addEventListener('click', e => { const t = e.target.closest('[data-care-tab]'); if (t) selectCare(t.dataset.careTab); });
tabs?.addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const list = $$('.tab', tabs), i = list.indexOf(document.activeElement);
  if (i < 0) return;
  const dir = (e.key === 'ArrowLeft') === (NV.dir === 'rtl') ? 1 : -1;
  const n = list[(i + dir + list.length) % list.length];
  n.focus(); n.click();
});
/* Branded print: only the chosen care guide, on a sheet with the logo watermark and every contact channel. */
function printCare(panel) {
  const P = NV.print || {};
  const logo = $('.brand .logo')?.outerHTML || '';
  const name = $('[data-share]', panel)?.dataset.title || '';
  $('#print-sheet')?.remove();
  const sheet = document.createElement('div');
  sheet.id = 'print-sheet';
  sheet.setAttribute('dir', NV.dir || 'rtl');
  sheet.innerHTML = `
    <div class="ps-watermark" aria-hidden="true">${logo}</div>
    <header class="ps-head">${logo}<div><b>${P.title || ''}</b><span dir="ltr">${P.site || ''}</span></div></header>
    <h1 class="ps-title">${P.heading ? P.heading + " — " : ""}${name}</h1>
    <div class="ps-body"></div>
    <footer class="ps-foot"><b>${P.footer || ''}</b><p>${(P.lines || []).map(l => `<span>${l}</span>`).join('<i>·</i>')}</p></footer>`;
  $('.ps-body', sheet).append($('.care-body', panel).cloneNode(true));
  document.body.append(sheet);
  document.body.classList.add('printing-sheet');
  const cleanup = () => { document.body.classList.remove('printing-sheet'); sheet.remove(); removeEventListener('afterprint', cleanup); };
  addEventListener('afterprint', cleanup);
  print();
}

document.addEventListener('click', async e => {
  const pr = e.target.closest('[data-print]');
  if (pr) return printCare(pr.closest('.care-panel'));
  const b = e.target.closest('[data-share]'); if (!b) return;
  const panel = b.closest('.care-panel');
  const cols = $$('.care-col', panel);
  const list = c => $$('li', c).map(li => '• ' + li.textContent.trim()).join('\n');
  const text = `${b.dataset.title} — ${document.title.split('|')[0].trim()}\n\n✅ ${T('do')}:\n${list(cols[0])}\n\n⛔ ${T('dont')}:\n${list(cols[1])}\n\n${T('contactClinic')}: ${NV.phone}`;
  if (navigator.share) { try { return await navigator.share({ title: b.dataset.title, text }); } catch { /* cancelled */ } }
  await copy(text); toast(T('copied'));
});

/* ---------- before / after sliders ---------- */
$$('.ba-range').forEach(r => {
  const frame = r.closest('.ba-frame');
  const sync = () => frame.style.setProperty('--pos', r.value + '%');
  r.addEventListener('input', sync); sync();
});

/* ---------- FAQ search ---------- */
const faqQ = $('#faq-q');
faqQ?.addEventListener('input', e => {
  const q = e.target.value.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  let shown = 0;
  $$('#faq-list .acc').forEach(d => {
    const hit = !q || d.textContent.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase().includes(q);
    d.classList.toggle('is-hidden', !hit);
    if (hit) { shown++; d.classList.add('is-in'); if (q) d.open = true; }
  });
  const empty = $('#faq-empty');
  if (empty) empty.style.display = shown ? 'none' : 'block';
});

/* ---------- booking ---------- */
const form = $('#booking-form');
if (form) {
  const fService = $('#f-service'), fName = $('#f-name'), fPhone = $('#f-phone'), fNote = $('#f-note');
  const daysEl = $('#days');
  const cal = L === 'fa' ? 'fa-IR-u-ca-persian' : L === 'ar' ? 'ar-u-nu-arab' : 'en-GB';
  const dayFmt = new Intl.DateTimeFormat(cal, { day: 'numeric' });
  const monFmt = new Intl.DateTimeFormat(cal, { month: 'long' });
  const wdFmt = new Intl.DateTimeFormat(L === 'fa' ? 'fa-IR' : L === 'ar' ? 'ar' : 'en-GB', { weekday: 'short' });
  const fullFmt = new Intl.DateTimeFormat(cal, { weekday: 'long', day: 'numeric', month: 'long' });
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return d; });
  daysEl.innerHTML = days.map((d, i) => `<button type="button" class="day${d.getDay() === 5 ? ' is-fri' : ''}" data-day="${i}" aria-pressed="false" aria-label="${fullFmt.format(d)}">
      <small>${i === 0 ? T('tomorrow') : wdFmt.format(d)}</small><b>${dayFmt.format(d)}</b><span>${monFmt.format(d)}</span></button>`).join('');

  let chosenDay = null, chosenSlot = null;
  daysEl.addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    $$('.day', daysEl).forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    chosenDay = on ? fullFmt.format(days[+b.dataset.day]) : null;
  });
  $$('.slot').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    $$('.slot').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    chosenSlot = on ? b.dataset.slot : null;
  }));

  const setErr = (k, msg) => { $('#f-' + k).classList.add('is-invalid'); $('#e-' + k).textContent = msg; };
  const clearErr = k => { $('#f-' + k).classList.remove('is-invalid'); $('#e-' + k).textContent = ''; };
  fName.addEventListener('input', () => clearErr('name'));
  fPhone.addEventListener('input', () => { fPhone.value = enDigits(fPhone.value).replace(/[^\d+ ]/g, ''); clearErr('phone'); });

  function normPhone(v) {
    let p = enDigits(v).replace(/[^\d+]/g, '');
    if (p.startsWith('+')) return p;
    if (p.startsWith('0098')) p = '0' + p.slice(4);
    else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
    else if (p.startsWith('9') && p.length === 10) p = '0' + p;
    return p;
  }
  const validPhone = p => (L === 'fa' ? /^09\d{9}$/.test(p) : /^(\+\d{8,15}|0\d{9,12})$/.test(p));

  // draft + preselected service
  const draft = store.get('nv-draft');
  if (draft) {
    fName.value = draft.name || ''; fPhone.value = draft.phone || ''; fNote.value = draft.note || '';
    if (draft.service && fService.querySelector(`option[value="${draft.service}"]`) && !NV.preset) fService.value = draft.service;
  }
  if (NV.preset) fService.value = NV.preset;
  const saveDraft = () => store.set('nv-draft', { name: fName.value, phone: fPhone.value, service: fService.value, note: fNote.value });
  form.addEventListener('input', saveDraft);

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-book]'); if (!b) return;
    const slug = b.dataset.book;
    if (fService.querySelector(`option[value="${slug}"]`)) {
      fService.value = slug; saveDraft();
      toast(`«${NV.names[slug]}» ${T('bookedFor')}`);
    }
  });

  let via = 'wa';
  $$('[data-via]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = fName.value.trim();
    const phone = normPhone(fPhone.value);
    let ok = true;
    if (name.length < 3) { setErr('name', T('errName')); ok = false; }
    if (!validPhone(phone)) { setErr('phone', T('errPhone')); ok = false; }
    if (!ok) return $('.is-invalid', form).focus();
    const svc = fService.value === 'consult' ? $('#f-service option[value="consult"]').textContent : NV.names[fService.value];
    const text = [
      T('msgIntro'),
      `👤 ${T('msgName')}: ${name}`,
      `📱 ${T('msgPhone')}: ${phone}`, // Latin digits so staff can copy and dial
      `💆 ${T('msgService')}: ${svc}`,
      chosenDay && `📅 ${T('msgDay')}: ${chosenDay}`,
      chosenSlot && `🕒 ${T('msgSlot')}: ${chosenSlot}`,
      fNote.value.trim() && `📝 ${T('msgNote')}: ${fNote.value.trim()}`,
      T('msgLang'),
    ].filter(Boolean).join('\n');
    const url = via === 'sms'
      ? `sms:${NV.sms}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(text)}`
      : `https://wa.me/${NV.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, via === 'sms' ? '_self' : '_blank', 'noopener');
    toast(T('sent'));
  });
}
})();
