/* ClimatePro: поведение интерфейса. Контент виден и без скриптов, здесь только улучшения. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.body.dataset.root || '';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Меню верхней полосы */
  $$('[data-menu]').forEach((m) => {
    const btn = $('button', m);
    const panel = $('.tb-menu__panel', m);
    const set = (open) => { btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(panel.hidden); });
    document.addEventListener('click', (e) => { if (!m.contains(e.target)) set(false); });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
  });

  /* Мегаменю */
  const mega = $('[data-mega]');
  const megaBtn = $('[data-mega-toggle]');
  if (mega && megaBtn) {
    let timer;
    const open = () => { clearTimeout(timer); mega.hidden = false; requestAnimationFrame(() => mega.classList.add('is-open')); megaBtn.setAttribute('aria-expanded', 'true'); };
    const close = () => { mega.classList.remove('is-open'); megaBtn.setAttribute('aria-expanded', 'false'); timer = setTimeout(() => { mega.hidden = true; }, 200); };
    const isOpen = () => megaBtn.getAttribute('aria-expanded') === 'true';
    megaBtn.addEventListener('click', (e) => { e.preventDefault(); isOpen() ? close() : open(); });
    document.addEventListener('click', (e) => { if (isOpen() && !mega.contains(e.target) && !megaBtn.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { close(); megaBtn.focus(); } });
    const show = (slug) => {
      $$('[data-mega-panel]', mega).forEach((p) => { p.hidden = p.dataset.megaPanel !== slug; });
      $$('[data-mega-item]', mega).forEach((i) => i.classList.toggle('is-active', i.dataset.megaItem === slug));
    };
    $$('[data-mega-item]', mega).forEach((i) => {
      i.addEventListener('pointerenter', () => show(i.dataset.megaItem));
      i.addEventListener('focus', () => show(i.dataset.megaItem));
    });
  }

  /* Мобильное меню */
  const drawer = $('#drawer');
  if (drawer) {
    $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => drawer.showModal()));
    $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => drawer.close()));
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });
  }

  /* Поиск с подсказками: индекс грузится при первом фокусе */
  const searchForm = $('[data-search]');
  if (searchForm) {
    const input = $('input', searchForm);
    const box = $('#suggest', searchForm);
    let index = null;
    let active = -1;
    const load = () => { if (index) return Promise.resolve(index); return fetch(`${root}assets/search-index.json`).then((r) => r.json()).then((d) => { index = d; return d; }); };
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[\s-]+/g, '');
    const hide = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const render = (q) => {
      const n = norm(q);
      if (n.length < 2) return hide();
      const hit = (e) => norm(`${e.t} ${e.m || ''} ${e.b || ''}`).includes(n);
      const prods = index.products.filter(hit).slice(0, 6);
      const cats = index.categories.filter((c) => norm(c.t).includes(n)).slice(0, 3);
      const brands = index.brands.filter((b) => norm(b.t).includes(n)).slice(0, 2);
      let html = '';
      if (cats.length) html += `<p class="suggest__label">Разделы</p>${cats.map((c) => `<a class="suggest__item" role="option" href="${root}${c.u}"><span class="suggest__text">${esc(c.t)}</span></a>`).join('')}`;
      if (brands.length) html += `<p class="suggest__label">Бренды</p>${brands.map((b) => `<a class="suggest__item" role="option" href="${root}${b.u}"><span class="suggest__text">${esc(b.t)}</span></a>`).join('')}`;
      if (prods.length) html += `<p class="suggest__label">Товары</p>${prods.map((p) => `<a class="suggest__item" role="option" href="${root}${p.u}"><img src="${root}${p.i}" alt="" width="48" height="48" loading="lazy"><span class="suggest__text">${esc(p.t)}<span class="suggest__meta">${esc(p.m)}, ${esc(p.b)}</span></span></a>`).join('')}`;
      if (!html) html = `<p class="suggest__empty">Ничего не нашлось. Попробуйте модель, например ACH-07, или напишите менеджеру.</p>`;
      else html += `<a class="suggest__all" href="${root}search/?q=${encodeURIComponent(q)}">Показать все результаты</a>`;
      box.innerHTML = html;
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    };
    input.addEventListener('focus', load, { once: true });
    input.addEventListener('input', () => load().then(() => render(input.value)));
    input.addEventListener('keydown', (e) => {
      const items = $$('.suggest__item', box);
      if (e.key === 'Escape') return hide();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('is-active', i === active));
        items[active].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && active >= 0) { e.preventDefault(); items[active].click(); }
    });
    document.addEventListener('click', (e) => { if (!searchForm.contains(e.target)) hide(); });
    $$('[data-focus-search]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); input.focus(); }));
  }

  /* Главный экран: слайды только вручную */
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('[data-slide]', hero);
    const count = $('[data-hero-count]', hero);
    let i = 0;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        if (k === i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        s.inert = k !== i;
      });
      count.textContent = `${i + 1} / ${slides.length}`;
    };
    slides.forEach((s, k) => { s.inert = k !== 0; });
    $('[data-hero-prev]', hero).addEventListener('click', () => go(i - 1));
    $('[data-hero-next]', hero).addEventListener('click', () => go(i + 1));
    hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  }

  /* Подбор по площади */
  const picker = $('[data-picker]');
  if (picker) {
    const data = JSON.parse($('[data-picker-json]', picker.parentElement).textContent);
    const range = $('[data-picker-range]', picker);
    const money = (n) => `от ${n.toLocaleString('ru-RU')} ₸`;
    const leadLink = $('[data-picker-lead]', picker);
    const all = $('[data-picker-all]', picker);
    const apply = () => {
      const v = +range.value;
      const pct = ((v - +range.min) / (+range.max - +range.min)) * 100;
      range.style.setProperty('--p', `${pct}%`);
      $('[data-picker-value]', picker).textContent = v >= +range.max ? `${v}+ м²` : `${v} м²`;
      const inRange = data.filter((d) => d.a[0] <= v && d.a[1] >= v);
      const above = data.filter((d) => d.a[1] >= v);
      const smallest = above.length ? Math.min(...above.map((d) => d.a[1])) : 0;
      const fits = inRange.length ? inRange : above.filter((d) => d.a[1] === smallest);
      const model = $('[data-picker-model]', picker);
      if (fits.length) {
        const list = [...fits].sort((a, b) => a.a[1] - b.a[1] || a.o - b.o);
        const m = list[0];
        model.href = m.u;
        $('[data-picker-img]', picker).src = m.i;
        $('[data-picker-img]', picker).hidden = false;
        $('[data-picker-fit]', picker).textContent = `Подойдёт для ${m.a[0]}-${m.a[1]} м²`;
        all.href = `${picker.dataset.catalogUrl}?area=${v}`;
        all.textContent = list.length > 1 ? `Все модели на ${v} м²: ${list.length}` : 'Смотреть в каталоге';
        $('[data-picker-type]', picker).textContent = m.t;
        $('[data-picker-code]', picker).textContent = m.m;
        $('[data-picker-install]', picker).textContent = money(v <= 35 ? 40000 : 45000);
        leadLink.dataset.item = `${m.t} ${m.m}`;
      } else {
        model.href = picker.dataset.semi;
        $('[data-picker-img]', picker).hidden = true;
        $('[data-picker-fit]', picker).textContent = 'Больше настенных моделей';
        all.href = picker.dataset.semi;
        all.textContent = 'Смотреть системы';
        $('[data-picker-type]', picker).textContent = 'Канальные и кассетные системы';
        $('[data-picker-code]', picker).textContent = 'подберём под объект';
        $('[data-picker-install]', picker).textContent = money(55000);
        leadLink.dataset.item = `Система для помещения ${v} м²`;
      }
    };
    range.addEventListener('input', apply);
    picker.addEventListener('submit', (e) => e.preventDefault());
    apply();
  }

  /* Окно заявки */
  const lead = $('#lead');
  if (lead) {
    const titles = { product: 'Заявка на оборудование', kp: 'Запрос коммерческого предложения', service: 'Заказать монтаж', callback: 'Обратный звонок' };
    const close = () => { lead.classList.remove('is-in'); setTimeout(() => lead.close(), 160); };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-lead]');
      if (!t) return;
      e.preventDefault();
      const kind = t.dataset.lead;
      $$('[data-lead-form]', lead).forEach((f) => { f.hidden = f.dataset.leadForm !== kind; });
      $('#lead-title').textContent = t.dataset.title || titles[kind];
      $('[data-lead-note]', lead).textContent = t.dataset.note || '';
      const form = $(`[data-lead-form="${kind}"] form`, lead);
      const item = $('[data-item]', form);
      if (item) item.value = t.dataset.item || '';
      lead.showModal();
      requestAnimationFrame(() => lead.classList.add('is-in'));
      $('input:not([data-item]), select, textarea', form)?.focus();
    });
    $$('[data-lead-close]', lead).forEach((b) => b.addEventListener('click', close));
    lead.addEventListener('click', (e) => { if (e.target === lead) close(); });
  }

  /* Формы: проверка и честный статус */
  const phoneMask = (input) => {
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      let d = raw.replace(/\D/g, '');
      if (raw.startsWith('+')) d = d.replace(/^7/, '');
      else if (d.length >= 11 && /^[78]/.test(d)) d = d.slice(1);
      else if (d.startsWith('8')) d = d.slice(1);
      d = d.slice(0, 10);
      let out = d ? `+7 (${d.slice(0, 3)}` : '';
      if (d.length >= 3) out += ')';
      if (d.length > 3) out += ` ${d.slice(3, 6)}`;
      if (d.length > 6) out += `-${d.slice(6, 8)}`;
      if (d.length > 8) out += `-${d.slice(8, 10)}`;
      input.value = out;
    });
  };
  $$('[data-phone]').forEach(phoneMask);
  $$('form[data-endpoint]').forEach((form) => {
    const status = $('.form__status', form);
    const fail = (el, msg) => {
      el.setAttribute('aria-invalid', 'true');
      const help = $(`#${el.id}-help`);
      if (help) help.textContent = msg;
    };
    const clear = (el) => {
      el.removeAttribute('aria-invalid');
      const help = $(`#${el.id}-help`);
      if (help) help.textContent = '';
    };
    form.addEventListener('input', (e) => { if (e.target.hasAttribute('aria-invalid')) clear(e.target); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      $$('input, select, textarea', form).forEach((el) => {
        clear(el);
        const bad = (el.required && !el.value.trim())
          || (el.dataset.phone !== undefined && el.value.replace(/\D/g, '').length < 11)
          || (el.type === 'email' && el.value && !el.checkValidity());
        if (bad) {
          fail(el, el.dataset.phone !== undefined ? 'Укажите номер полностью: +7 и десять цифр.' : el.type === 'email' ? 'Проверьте адрес, например name@company.kz.' : 'Заполните это поле.');
          first = first || el;
        }
      });
      if (first) { first.focus(); return; }
      status.classList.remove('is-ok', 'is-off');
      if (!form.dataset.endpoint) {
        status.classList.add('is-off');
        status.textContent = 'Заявка не отправлена: форма ещё не подключена к почте или CRM. Это макет.';
        return;
      }
      const btn = $('[type="submit"]', form);
      btn.setAttribute('aria-busy', 'true');
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form) })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          status.classList.add('is-ok');
          status.textContent = 'Заявка принята. Менеджер свяжется с вами в рабочее время.';
          form.reset();
        })
        .catch(() => { status.textContent = 'Не получилось отправить. Позвоните нам или напишите в WhatsApp.'; })
        .finally(() => btn.removeAttribute('aria-busy'));
    });
  });

  /* Кнопка заявки в шапке заливается, когда главный экран ушёл из вида */
  const mast = $('[data-mast]');
  const sentinel = $('.picker-wrap');
  if (mast && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => mast.classList.toggle('is-past', !e.isIntersecting)).observe(sentinel);
  } else if (mast) {
    mast.classList.add('is-past');
  }

  /* Лента: кнопки прокрутки */
  $$('[data-rail-wrap]').forEach((wrap) => {
    const rail = $('.rail', wrap);
    const step = () => (rail.firstElementChild?.getBoundingClientRect().width || 300) + 16;
    $('[data-rail-prev]', wrap)?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    $('[data-rail-next]', wrap)?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
  });

  /* Бегущая лента: держится на месте до показа, останавливается при наведении, фокусе и кнопкой */
  $$('[data-loop]').forEach((el) => {
    const btn = $('[data-loop-toggle]', el);
    const s = { seen: false, hover: false, focus: false, held: reduced };
    const sync = () => {
      el.classList.toggle('is-running', s.seen && !s.hover && !s.focus && !s.held);
      if (btn) { btn.setAttribute('aria-label', s.held ? 'Запустить ленту брендов' : 'Остановить ленту брендов'); btn.setAttribute('aria-pressed', String(s.held)); btn.innerHTML = s.held ? btn.dataset.play : btn.dataset.pause; }
    };
    btn?.addEventListener('click', () => { s.held = !s.held; sync(); });
    const box = $('.marquee', el) || el;
    [['pointerenter', 'hover', true], ['pointerleave', 'hover', false], ['focusin', 'focus', true], ['focusout', 'focus', false]].forEach(([t, k, v]) => box.addEventListener(t, () => { s[k] = v; sync(); }));
    new IntersectionObserver(([e]) => { s.seen = e.isIntersecting; sync(); }).observe(el);
  });

  /* Карта складов */
  $$('[data-geo]').forEach((geo) => {
    const select = (slug) => {
      $$('[data-zone]', geo).forEach((z) => z.classList.toggle('is-active', z.dataset.zone === slug));
      $$('[data-pin]', geo).forEach((p) => p.classList.toggle('is-active', p.dataset.pin === slug));
      $$('[data-city]', geo).forEach((b) => { const on = b.dataset.city === slug; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      $$('[data-city-panel]', geo).forEach((p) => p.classList.toggle('is-active', p.dataset.cityPanel === slug));
    };
    $$('[data-city]', geo).forEach((b) => b.addEventListener('click', () => select(b.dataset.city)));
    $$('[data-pin]', geo).forEach((p) => {
      p.addEventListener('click', () => select(p.dataset.pin));
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.dataset.pin); } });
    });
    if (location.hash) { const slug = location.hash.slice(1); if ($(`[data-city="${slug}"]`, geo)) select(slug); }
  });

  /* Схема монтажа: шаг активируется кликом и при прокрутке рядом со схемой */
  $$('[data-steps]').forEach((box) => {
    const plan = $('[data-plan]', box);
    const items = $$('.step', box);
    const set = (n) => { plan.dataset.step = n; items.forEach((s, i) => { const on = i + 1 === n; s.classList.toggle('is-active', on); s.setAttribute('aria-pressed', String(on)); }); };
    items.forEach((s, i) => s.addEventListener('click', () => set(i + 1)));
    if ('IntersectionObserver' in window && matchMedia('(min-width: 60rem)').matches) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target) + 1); }), { rootMargin: '-45% 0px -45% 0px' });
      items.forEach((s) => io.observe(s));
    }
    set(1);
  });

  /* Вкладки */
  $$('[data-tabs]').forEach((box) => {
    const tabs = $$('[role="tab"]', box);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const select = (i, focus) => {
      tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    select(0);
  });

  /* Каталог: фильтры, сортировка, страницы. На бою тот же интерфейс получит данные от сервера. */
  $$('[data-catalog]').forEach((cat) => {
    const grid = $('[data-grid]', cat);
    const cards = $$('[data-card]', grid);
    cards.forEach((c, i) => { c.dataset.order = i; });
    const form = $('[data-filter-form]', cat);
    const perPage = +cat.dataset.perPage || 12;
    const sortSel = $('[data-sort]', cat);
    const q = $('[data-catalog-q]', cat);
    const pager = $('[data-pager]', cat);
    const empty = $('[data-empty]', cat);
    const areaInput = $('input[name="area"]', form);
    const areaOut = $('[data-area-out]', form);
    let page = 1;
    const plural = (n) => { const a = n % 100; const b = n % 10; if (a > 10 && a < 20) return 'товаров'; if (b > 1 && b < 5) return 'товара'; if (b === 1) return 'товар'; return 'товаров'; };
    const num = (fd, k) => { const v = fd.get(k); return v === null || v === '' ? null : +v; };
    const params = new URLSearchParams(location.search);
    if (areaInput && params.get('area')) areaInput.value = params.get('area');
    ['brand', 'sub'].forEach((k) => { const v = params.get(k); if (v) { const box = form.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`); if (box) box.checked = true; } });
    const apply = (reset = true) => {
      if (reset) page = 1;
      const fd = new FormData(form);
      const brand = fd.getAll('brand');
      const sub = fd.getAll('sub');
      const btu = fd.getAll('btu');
      const area = +(fd.get('area') || 0);
      const inverter = fd.has('inverter');
      const wifi = fd.has('wifi');
      const asked = fd.has('asked');
      const ranges = [['price', 'price'], ['power', 'power'], ['volume', 'volume']].map(([k, d]) => ({ d, min: num(fd, `${k}-min`), max: num(fd, `${k}-max`) }));
      const text = (q?.value || '').toLowerCase().replace(/[\s-]+/g, '');
      if (areaInput) {
        const pct = (area / +areaInput.max) * 100;
        areaInput.style.setProperty('--p', `${pct}%`);
        if (areaOut) areaOut.textContent = area ? `${area} м²` : 'Любая';
      }
      /* Та же логика, что в подборе на главной: площадь внутри диапазона модели, иначе ближайшая модель побольше */
      let inAreaRange = false;
      let bestMax = null;
      if (area) {
        inAreaRange = cards.some((c) => +c.dataset.areaMin <= area && +c.dataset.areaMax >= area);
        const maxes = cards.map((c) => +c.dataset.areaMax).filter((m) => m >= area);
        bestMax = maxes.length ? Math.min(...maxes) : -1;
      }
      const match = (c) => {
        const d = c.dataset;
        if (brand.length && !brand.includes(d.brand)) return false;
        if (sub.length && !sub.includes(d.sub)) return false;
        if (btu.length && !(d.btu && btu.includes(String(Math.round(+d.btu / 1000))))) return false;
        if (area && inAreaRange && !(+d.areaMin <= area && +d.areaMax >= area)) return false;
        if (area && !inAreaRange && +d.areaMax !== bestMax) return false;
        if (inverter && d.inverter === undefined) return false;
        if (wifi && d.wifi === undefined) return false;
        if (asked && !d.price) return false;
        for (const r of ranges) {
          if (r.min === null && r.max === null) continue;
          const v = d[r.d];
          if (v === undefined) return false;
          if (r.min !== null && +v < r.min) return false;
          if (r.max !== null && +v > r.max) return false;
        }
        if (text && !d.name.toLowerCase().replace(/[\s-]+/g, '').includes(text)) return false;
        return true;
      };
      const list = cards.filter(match);
      const sort = sortSel.value;
      const price = (c) => (c.dataset.price ? +c.dataset.price : null);
      list.sort((a, b) => {
        if (sort === 'name') return a.dataset.name.localeCompare(b.dataset.name, 'ru');
        if (sort === 'price-asc' || sort === 'price-desc') {
          const pa = price(a); const pb = price(b);
          if (pa === null && pb === null) return +a.dataset.order - +b.dataset.order;
          if (pa === null) return 1;
          if (pb === null) return -1;
          return sort === 'price-asc' ? pa - pb : pb - pa;
        }
        return +a.dataset.order - +b.dataset.order;
      });
      const pages = Math.max(1, Math.ceil(list.length / perPage));
      page = Math.min(page, pages);
      cards.forEach((c) => { c.hidden = true; });
      list.forEach((c, i) => { grid.appendChild(c); c.hidden = i < (page - 1) * perPage || i >= page * perPage; });
      $('[data-count]', cat).textContent = `${list.length} ${plural(list.length)}`;
      const short = $('[data-count-short]', cat);
      if (short) short.textContent = list.length;
      empty.hidden = list.length > 0;
      pager.innerHTML = '';
      if (pages > 1) {
        const mk = (label, n, cur, aria) => { const b = document.createElement('button'); b.type = 'button'; b.className = `pager__btn${cur ? ' is-on' : ''}`; b.innerHTML = label; if (aria) b.setAttribute('aria-label', aria); if (cur) b.setAttribute('aria-current', 'page'); if (n === null) b.disabled = true; else b.addEventListener('click', () => { page = n; apply(false); cat.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }); return b; };
        pager.append(mk('Назад', page > 1 ? page - 1 : null, false, 'Предыдущая страница'));
        for (let n = 1; n <= pages; n++) pager.append(mk(String(n), n, n === page, `Страница ${n}`));
        pager.append(mk('Вперёд', page < pages ? page + 1 : null, false, 'Следующая страница'));
      }
    };
    form.addEventListener('input', () => apply());
    form.addEventListener('reset', () => setTimeout(() => apply(), 0));
    form.addEventListener('submit', (e) => e.preventDefault());
    sortSel.addEventListener('change', () => apply());
    q?.addEventListener('input', () => apply());
    $$('[data-view]', cat).forEach((b) => b.addEventListener('click', () => {
      grid.classList.toggle('is-list', b.dataset.view === 'list');
      $$('[data-view]', cat).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    }));
    const filters = $('[data-filters]', cat);
    $$('[data-filters-open]', cat).forEach((b) => b.addEventListener('click', () => { filters.classList.add('is-open'); document.documentElement.classList.add('no-scroll'); $('[data-filters-close]', filters)?.focus(); }));
    $$('[data-filters-close]', cat).forEach((b) => b.addEventListener('click', () => { filters.classList.remove('is-open'); document.documentElement.classList.remove('no-scroll'); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && filters.classList.contains('is-open')) { filters.classList.remove('is-open'); document.documentElement.classList.remove('no-scroll'); } });
    apply();
  });

  /* Галерея товара */
  $$('[data-gallery]').forEach((g) => {
    const thumbs = $$('[data-gallery-thumb]', g);
    const pics = $$('[data-gallery-pic]', g);
    thumbs.forEach((t, i) => t.addEventListener('click', () => {
      thumbs.forEach((x, k) => { x.classList.toggle('is-active', k === i); x.setAttribute('aria-pressed', String(k === i)); });
      pics.forEach((x, k) => x.classList.toggle('is-active', k === i));
    }));
  });

  /* Страница результатов поиска */
  const found = $('[data-search-page]');
  if (found) {
    const query = new URLSearchParams(location.search).get('q') || '';
    const input = $('#q');
    if (input) input.value = query;
    const title = $('[data-search-title]');
    const safe = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    if (query) {
      fetch(`${root}assets/search-index.json`).then((r) => r.json()).then((idx) => {
        const n = query.toLowerCase().replace(/ё/g, 'е').replace(/[\s-]+/g, '');
        const hit = (e) => `${e.t} ${e.m || ''} ${e.b || ''}`.toLowerCase().replace(/ё/g, 'е').replace(/[\s-]+/g, '').includes(n);
        const list = idx.products.filter(hit);
        title.textContent = `Результаты: ${query}`;
        found.innerHTML = list.length
          ? list.map((p) => `<a class="found__row" href="${root}${p.u}"><img src="${root}${p.i}" alt="" width="72" height="72" loading="lazy"><span><b>${safe(p.t)}</b><code class="model">${safe(p.m)}</code></span><span class="found__meta">${safe(p.b)}<br>${safe(p.g)}</span></a>`).join('')
          : '<p class="empty">Ничего не нашлось. Проверьте написание модели или оставьте заявку менеджеру.</p>';
      });
    }
  }

  /* Единственное появление блоков */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  } else {
    $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  }
})();
