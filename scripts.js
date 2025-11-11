/* =========================================================================
   Digital Mind Project — scripts.js
   - Modal windows (applications/models)
   - Copy buttons for formulas/code
   - Back-to-top button
   - Article TOC enhancements
   - Header particles (optional visual)
   Everything is written defensively: code checks for element existence
   and supports both the new selectors (.application-card/.application-modal)
   and legacy ones (.model-card/.model-modal).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------ Utilities ------------------------------ */

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function delegate(parent, selector, type, handler) {
    if (!parent) return;
    parent.addEventListener(type, function (e) {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) handler.call(target, e);
    });
  }

  function trapFocus(modal) {
    // Optional: keep focus inside modal for accessibility
    const focusable = modal.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function keyHandler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    modal.addEventListener('keydown', keyHandler);
    return () => modal.removeEventListener('keydown', keyHandler);
  }

  /* --------------------------- Modal management -------------------------- */

  function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // accessibility
    modal.setAttribute('aria-hidden', 'false');
    const cleanupTrap = trapFocus(modal);
    modal.__trapCleanup = cleanupTrap;
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modal.setAttribute('aria-hidden', 'true');
    if (typeof modal.__trapCleanup === 'function') {
      modal.__trapCleanup();
      modal.__trapCleanup = null;
    }
  }

  function bindModals() {
    // Prefer new API: .application-card[data-app] -> #${app}-modal (class .application-modal)
    const appCards = document.querySelectorAll('.application-card');
    const modelCards = document.querySelectorAll('.model-card');

    if (appCards.length) {
      appCards.forEach(card => {
        card.style.cursor = 'pointer';
        if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');

        function getModal() {
          const appId = card.getAttribute('data-app');
          if (!appId) return null;
          return document.getElementById(`${appId}-modal`) ||
                 document.querySelector(`.application-modal[data-app="${appId}"]`);
        }

        card.addEventListener('click', e => {
          // Ignore clicks on links inside the card
          if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) return;
          openModal(getModal());
        });
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(getModal());
          }
        });
      });
    }

    // Legacy support: .model-card[data-model] -> #${model}-modal (class .model-modal)
    if (modelCards.length) {
      modelCards.forEach(card => {
        card.style.cursor = 'pointer';
        if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');

        function getModal() {
          const modelId = card.getAttribute('data-model');
          if (!modelId) return null;
          return document.getElementById(`${modelId}-modal`) ||
                 document.querySelector(`.model-modal[data-model="${modelId}"]`);
        }

        card.addEventListener('click', e => {
          if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) return;
          openModal(getModal());
        });
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(getModal());
          }
        });
      });
    }

    // Close buttons (both new and legacy)
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.application-modal, .model-modal');
        closeModal(modal);
      });
    });

    // Click on overlay to close
    window.addEventListener('click', e => {
      document.querySelectorAll('.application-modal, .model-modal').forEach(modal => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Esc to close
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.application-modal, .model-modal').forEach(modal => {
          if (modal.style.display === 'block') closeModal(modal);
        });
      }
    });
  }

  /* ------------------------ Copy buttons for formulas --------------------- */

  function bindCopyButtons() {
    // Works for any block with .copy-code inside .block-code
    document.querySelectorAll('.block-code').forEach(block => {
      const btn = block.querySelector('.copy-code');
      if (!btn) return;

      btn.addEventListener('click', () => {
        // Prefer concatenated .math-blocks text; fallback to block's text
        const parts = Array.from(block.querySelectorAll('.math-block, .math-inline'))
          .map(el => (el.innerText || '').trim())
          .filter(Boolean);

        let text = parts.join('\n');
        if (!text) {
          text = (block.innerText || '').trim();
        }

        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied');
          btn.setAttribute('aria-label', 'Скопировано');
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.removeAttribute('aria-label');
          }, 1200);
        }).catch(() => {
          // Fallback: create a temporary textarea
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch(e) {}
          document.body.removeChild(ta);
        });
      });
    });
  }

  /* --------------------------- Back-to-top button ------------------------- */

  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    function toggleVisibility() {
      const show = window.scrollY > 300;
      btn.classList.toggle('visible', show);
      btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------ Article TOC ----------------------------- */

  function enhanceTocScrollbar() {
    const tocElement = document.querySelector('.article-toc');
    const tocContent = document.querySelector('.toc-content');
    if (!tocElement || !tocContent) return;

    tocContent.addEventListener('scroll', function () {
      tocElement.classList.toggle('scrolled', this.scrollTop > 0);
    });

    function checkScrollbarNeed() {
      const hasScrollbar = tocContent.scrollHeight > tocContent.clientHeight;
      tocElement.classList.toggle('scrollbar-visible', hasScrollbar);
    }

    checkScrollbarNeed();
    window.addEventListener('resize', checkScrollbarNeed);
  }

  /* ------------------------- Header particles (opt) ----------------------- */

  function initHeaderParticles() {
    const container = document.querySelector('.article-header-particles');
    if (!container) return;

    const count = 28;
    const dots = [];
    const rect = container.getBoundingClientRect();

    function createDot() {
      const d = document.createElement('span');
      d.className = 'particle-dot';
      d.style.left = Math.random() * rect.width + 'px';
      d.style.top = Math.random() * rect.height + 'px';
      container.appendChild(d);
      return d;
    }

    for (let i = 0; i < count; i++) {
      dots.push(createDot());
    }

    let rafId = 0;
    const speed = 0.4;
    function animate() {
      dots.forEach((dot, i) => {
        const x = (parseFloat(dot.style.left) || 0) + (Math.sin(Date.now() / 1000 + i) * speed);
        const y = (parseFloat(dot.style.top) || 0) + (Math.cos(Date.now() / 1000 + i) * speed);
        dot.style.left = (x % rect.width + rect.width) % rect.width + 'px';
        dot.style.top  = (y % rect.height + rect.height) % rect.height + 'px';
      });
      rafId = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else animate();
    });
  }

  /* --------------------------------- Init -------------------------------- */

  onReady(function () {
    bindModals();
    bindCopyButtons();
    bindBackToTop();
    enhanceTocScrollbar();
    initHeaderParticles();
  });

})();
// ===== ГЛОССАРИЙ: авто-подсказки по наведению =====
(function () {
  const GLOSSARY = {
    "ReLU": "Функция активации max(0, x): ускоряет и стабилизирует обучение.",
    "градиент": "Вектор направлений наибольшего роста функции. Для обучения — направление уменьшения ошибки берём с минусом.",
    "градиентный спуск": "Алгоритм обновления весов в сторону уменьшения функции потерь.",
    "learning rate": "Скорость обучения (η): насколько сильно обновляем веса за шаг.",
    "регуляризация": "Приёмы для борьбы с переобучением: L2, L1, Dropout, ранняя остановка и т.д.",
    "Dropout": "Случайное «выключение» нейронов во время обучения для лучшей обобщающей способности.",
    "Batch Normalization": "Нормализация активаций в батче для стабилизации и ускорения обучения.",
    "свертка": "Операция извлечения локальных признаков фильтром по окрестности (CNN).",
    "pooling": "Сжатие карты признаков (например, max-pooling) с сохранением ключевой информации.",
    "внимание": "Механизм взвешивания важных элементов последовательности (Attention).",
    "трансформер": "Архитектура без рекурсии/сверток, основанная на внимании и позиционном кодировании.",
    "переобучение": "Модель запоминает шум/частности обучающей выборки и плохо обобщает на новые данные."
  };

  function wrapGlossaryTerms(rootSelector = ".article-main") {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    // Ограничим оборачивание только текстовых узлов внутри параграфов и списков.
    const walkers = root.querySelectorAll("p, li");
    const terms = Object.keys(GLOSSARY)
      .sort((a,b)=>b.length-a.length) // длинные сначала, чтобы не рвать составные фразы
      .map(t => ({
        key: t,
        re: new RegExp(`\\b(${t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})\\b`, "gi"),
        tip: GLOSSARY[t]
      }));

    walkers.forEach(node => {
      let html = node.innerHTML;
      terms.forEach(({re, tip}) => {
        html = html.replace(re, (m) =>
          `<span class="term" data-tip="${tip}">${m}</span>`
        );
      });
      node.innerHTML = html;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wrapGlossaryTerms();
  });
})();
// scripts.js
(function(){
  const bar = document.getElementById("read-progress"); if(!bar) return;
  const onScroll = () => {
    const h = document.documentElement;
    const p = (h.scrollTop)/(h.scrollHeight - h.clientHeight);
    bar.style.width = (p*100)+"%";
  };
  document.addEventListener("scroll", onScroll,{passive:true}); onScroll();
})();
// scripts.js
(function(){
  const heads = document.querySelectorAll(".article-main h2, .article-main h3");
  heads.forEach(h=>{
    if(!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^\wа-яё]+/gi,"-");
    const a = document.createElement("a");
    a.className = "anchor-link"; a.href = "#"+h.id; a.title="Скопировать ссылку";
    a.textContent = ""; a.addEventListener("click",(e)=>{ e.preventDefault(); navigator.clipboard.writeText(location.origin+location.pathname+"#"+h.id); history.replaceState(null,"","#"+h.id);});
    a.setAttribute("aria-label", "Скопировать ссылку на раздел");
    h.appendChild(a);
    // На всякий случай очищаем текст у всех уже добавленных якорей
document.querySelectorAll(".anchor-link").forEach(n => n.textContent = "");

  });
})();


// --- TOC: smooth scroll + robust active section highlight ---
(function initTocScrollAndSpy_v2() {
  const toc = document.querySelector('.article-toc');
  const links = [...document.querySelectorAll('.article-toc .toc-link')];
  const sections = [...document.querySelectorAll('.article-section[id]')];
  if (!toc || !links.length || !sections.length) return;

  const tocScroll = document.querySelector('.article-toc .toc-content');
  const linkById = new Map(links.map((el) => [el.getAttribute('href')?.replace('#',''), el]));
  let rafId = 0;

  const getHeaderOffset = () => {
    const header = document.querySelector('header');
    const h = header ? (header.getBoundingClientRect().height || 0) : 0;
    return Math.max(0, h + 12); // маленький зазор
  };

  const scrollToTarget = (el) => {
    const top = window.scrollY + el.getBoundingClientRect().top - getHeaderOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Плавный скролл по клику
  toc.addEventListener('click', (e) => {
    const a = e.target.closest('.toc-link');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.pushState(null, '', id);
  });

  // Подсветка активного пункта
  const setActive = (id) => {
    links.forEach((l) => {
      const active = l.getAttribute('href') === `#${id}`;
      l.classList.toggle('active', active);
      if (active) {
        l.setAttribute('aria-current', 'true');
        if (tocScroll) {
          const rectL = l.getBoundingClientRect();
          const rectC = tocScroll.getBoundingClientRect();
          const outOfView = rectL.top < rectC.top || rectL.bottom > rectC.bottom;
          if (outOfView) l.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      } else {
        l.removeAttribute('aria-current');
      }
    });
  };

  // Быстрый расчёт «текущей» секции по позициям (фолбэк и подтяжка поведения IO)
  const computeCurrentSection = () => {
    const offset = getHeaderOffset() + 8;
    const viewportTop = offset;
    const viewportBottom = window.innerHeight;

    // 1) если в самом низу страницы — активируем последнюю секцию
    const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
    if (atBottom) return sections[sections.length - 1].id;

    // 2) ищем первую секцию, верх которой не ниже «виртуального» верха
    let current = sections[0].id;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top - offset <= 0 && r.bottom > Math.min(viewportTop, viewportBottom * 0.25)) {
        current = s.id;
      }
    }
    return current;
  };

  // Throttle через rAF
  const onScrollThrottled = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      setActive(computeCurrentSection());
    });
  };

  // IntersectionObserver: чувствительнее к коротким секциям
  let observer = null;
  const setupObserver = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    const offset = getHeaderOffset();
    observer = new IntersectionObserver((entries) => {
      // выбираем самую «верхнюю» видимую секцию (с поправкой на хедер)
      const cand = entries
        .filter(e => e.isIntersecting)
        .map(e => ({ id: e.target.id, top: e.boundingClientRect.top }))
        .sort((a, b) => a.top - b.top)[0];

      if (cand && linkById.has(cand.id)) {
        setActive(cand.id);
      } else {
        // если IO не дал уверенного кандидата — считаем вручную
        setActive(computeCurrentSection());
      }
    }, {
      root: null,
      rootMargin: `-${offset}px 0px -60% 0px`,
      // Мелкие пороги, чтобы ловить короткие блоки
      threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.33, 0.5, 0.67, 0.85, 1],
    });

    sections.forEach(s => observer.observe(s));
  };

  // Перенастраиваем IO при ресайзе (если хедер меняет высоту)
  window.addEventListener('resize', () => {
    setupObserver();
    onScrollThrottled();
  }, { passive: true });

  // При скролле всегда уточняем активный пункт (фолбэк для экзотики)
  window.addEventListener('scroll', onScrollThrottled, { passive: true });

  // Корректная прокрутка при открытии/смене хэша
  const scrollToHash = () => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    scrollToTarget(target);
  };
  window.addEventListener('hashchange', scrollToHash);

  // Первый запуск
  setupObserver();
  setTimeout(() => {
    setActive(computeCurrentSection());
    scrollToHash();
  }, 0);
})();















/* === AI Evolution: плавный скролл + подсветка активного пункта === */
(function() {
  const tocRoot = document.querySelector('[data-toc-root]');
  if (!tocRoot) return;

  // 1) Плавный скролл по якорям
  document.querySelectorAll('.toc-link').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // 2) Подсветка активного пункта TOC (scrollspy)
  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
  const sections = tocLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const activate = (id) => {
    tocLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) activate(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -50% 0px', threshold: 0.01 });

  sections.forEach(sec => io.observe(sec));
})();

/* === Копирование содержимого из code/pre блоков целиком (исправлено) === */
(function() {
  document.querySelectorAll('.code-block .copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block')?.querySelector('pre');
      if (!pre) return;
      const text = pre.innerText; // Берём весь текст, не только первую строку
      navigator.clipboard.writeText(text).then(() => {
        // мини-уведомление
        const n = document.createElement('div');
        n.className = 'copy-toast';
        n.textContent = 'Скопировано';
        Object.assign(n.style, {
          position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
          background: 'var(--accent)', color: '#fff', padding: '10px 14px',
          borderRadius: '10px', zIndex: 9999, boxShadow: 'var(--shadow)'
        });
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 1400);
      });
    });
  });
})();



// === AI-EVOLUTION: вспомогательные скрипты для статьи ===

// Smooth scroll for TOC
(function(){
  const links = document.querySelectorAll('.article-toc .toc-link');
  links.forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
})();

// ScrollSpy (IntersectionObserver)
(function(){
  const sections = document.querySelectorAll('.article-main .article-section[id]');
  const links = Array.from(document.querySelectorAll('.article-toc .toc-link'));
  if (!sections.length || !links.length) return;

  const map = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = map.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const toc = document.querySelector('.article-toc .toc-content');
        if (toc) { toc.scrollTop = link.offsetTop - 80; }
      }
    });
  }, {rootMargin: '-40% 0px -55% 0px', threshold: [0, .2, .4, .6, .8, 1]});
  sections.forEach(sec => io.observe(sec));
})();

// Copy code buttons (if any code-blocks exist)
(function(){
  document.querySelectorAll('.code-block .copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block').querySelector('pre');
      if (!pre) return;
      const text = pre.innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1200);
      });
    });
  });
})();

// Image Lightbox
(function(){
  const lb = document.getElementById('imageLightbox');
  if (!lb) return;
  const imgEl = lb.querySelector('.lightbox-img');
  const capEl = lb.querySelector('.lightbox-caption');
  const closeBtn = lb.querySelector('.lightbox-close');
  const backdrop = lb.querySelector('.lightbox-backdrop');

  function open(src, alt){
    imgEl.src = src; imgEl.alt = alt || '';
    capEl.textContent = alt || '';
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lb.classList.remove('active');
    document.body.style.overflow = '';
    imgEl.src = '';
  }

  document.querySelectorAll('.image-zoom img').forEach(img => {
    img.addEventListener('click', () => open(img.src, img.alt));
  });
  [closeBtn, backdrop].forEach(el => el && el.addEventListener('click', close));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// Read progress bar
(function(){
  const bar = document.getElementById('read-progress');
  if (!bar) return;
  function onScroll(){
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    bar.style.width = (scrolled * 100) + '%';
  }
  document.addEventListener('scroll', onScroll, {passive: true});
  onScroll();
})();
// --- ScrollSpy для оглавления статьи (универсальный) ---
(function initScrollSpy() {
  const links = Array.from(document.querySelectorAll('.toc-link'));
  if (!links.length) return;
  const ids = links.map(a => a.getAttribute('href')).filter(Boolean);
  const sections = ids.map(id => document.querySelector(id)).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = '#' + entry.target.id;
      const link = document.querySelector(`.toc-link[href="${id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc-link.active').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // автопрокрутка видимой области оглавления
        const tocContent = document.querySelector('.toc-content');
        if (tocContent) {
          const rect = link.getBoundingClientRect();
          const containerRect = tocContent.getBoundingClientRect();
          if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
            tocContent.scrollTo({ top: tocContent.scrollTop + (rect.top - containerRect.top) - 40, behavior: 'smooth' });
          }
        }
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.1 });

  sections.forEach(sec => sec && observer.observe(sec));
})();

// --- Поддержка .term на тач-экранах (тап = показать подсказку на 2 сек) ---
(function initTermsTouchHints(){
  const terms = document.querySelectorAll('.ai-evolution .term');
  let touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!terms.length || !touchSupported) return;
  terms.forEach(t => {
    t.addEventListener('touchstart', () => {
      t.classList.add('term--show');
      setTimeout(() => t.classList.remove('term--show'), 1800);
    }, {passive: true});
  });
})();

// --- Лёгкий hover-zoom для картинок (класс .image-zoom уже стилизован) ---
(function initImageZoomHover(){
  const imgs = document.querySelectorAll('.ai-evolution .image-zoom img');
  imgs.forEach(img => {
    img.addEventListener('click', () => {
      // по клику открываем картинку в новой вкладке — просто и безопасно
      window.open(img.getAttribute('src'), '_blank');
    });
  });
})();
// --- Mobile burger menu toggle ---
(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(function () {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.getElementById('primary-nav');
    if (!btn || !nav) return;

    const header = document.querySelector('header');

    function setOpen(open) {
      nav.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('body-lock', open);
      // Меняем aria-label для читабельности скринридерами
      btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }

    btn.addEventListener('click', () => {
      const open = !nav.classList.contains('active');
      setOpen(open);
    });

    // Закрывать меню по клику на пункт
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && nav.classList.contains('active')) {
        setOpen(false);
      }
    });

    // Закрывать по Esc
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        setOpen(false);
      }
    });

    // Клик вне области навигации (внутри header) — тоже закрывает
    document.addEventListener('click', (e) => {
      const clickInsideHeader = header && header.contains(e.target);
      const isButton = btn.contains(e.target);
      const isNav = nav.contains(e.target);
      if (nav.classList.contains('active') && clickInsideHeader && !isButton && !isNav) {
        setOpen(false);
      }
    });
  });
})();
// --- Modal logic for AI model cards ---
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  ready(function () {
    const body = document.body;

    function openModal(modal) {
      if (!modal) return;
      modal.hidden = false;
      modal.classList.add('open');
      body.classList.add('body-lock');
      // фокус на заголовок для доступности
      const title = modal.querySelector('[id$="-title"]');
      if (title) title.focus({ preventScroll: true });
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('open');
      modal.hidden = true;
      body.classList.remove('body-lock');
    }

    // Делегирование на кнопки "Подробнее"
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.model-card .btn, .model-card .btn-outline');
      if (!btn) return;
      const card = btn.closest('.model-card');
      if (!card) return;
      const key = card.getAttribute('data-model');
      if (!key) return;
      const modal = document.getElementById(`${key}-modal`);
      if (modal) {
        e.preventDefault();
        openModal(modal);
      }
    });

    // Закрытие по "крестику" и клику вне контента
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.model-modal .close-modal');
      if (closeBtn) {
        closeModal(closeBtn.closest('.model-modal'));
        return;
      }
      const modal = e.target.closest('.model-modal');
      if (modal && e.target === modal) {
        closeModal(modal);
      }
    });

    // Esc закрывает активную модалку
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.model-modal.open').forEach(closeModal);
      }
    });
  });
})();
