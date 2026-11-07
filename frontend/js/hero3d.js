(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Har book ki jagah, size aur jhukao (left, width, height, depth, rotate, tilt, parallax)
 
  const LAYOUT = [
    { left: 140, w: 196, h: 284, d: 40, ry: 26,  rx: 4, k: 1.3 },  // left
    { left: 524, w: 196, h: 284, d: 40, ry: -24, rx: 4, k: 0.8 },  // right
    { left: 320, w: 220, h: 330, d: 46, ry: 8,   rx: 3, k: 1 },    // beech mein, sab se upar
  ];
  // Alag alag category ki 3 books chuno
  function pick(books) {
    const seen = new Set(), out = [];
    for (const b of books) {
      if (!seen.has(b.category)) { seen.add(b.category); out.push(b); }
      if (out.length === 3) break;
    }
    for (const b of books) {
      if (out.length === 3) break;
      if (!out.includes(b)) out.push(b);
    }
    return out;
  }

  function bookHTML(b, L, i) {
    const color = (typeof CAT_COLORS !== 'undefined' && CAT_COLORS[b.category]) || '#5E564B';
    return `
      <a class="book3d" href="catalog.html?search=${encodeURIComponent(b.title)}"
         aria-label="${esc(b.title)} by ${esc(b.author)}"
         style="left:${L.left}px;--w:${L.w}px;--h:${L.h}px;--d:${L.d}px;--ry:${L.ry}deg;--rx:${L.rx}deg;--k:${L.k};--cover:${color};z-index:${i === 0 ? 1 : 2}">
        <span class="book3d__inner">
          <span class="bf bf--back"></span>
          <span class="bf bf--spine"><span>${esc(b.title)}</span></span>
          <span class="bf bf--pages"></span>
          <span class="bf bf--top"></span>
          <span class="bf bf--bottom"></span>
          <span class="bf bf--front">
            <span class="bf__cat">${esc(b.category)}</span>
            <span class="bf__title">${esc(b.title)}</span>
            <span class="bf__author">${esc(b.author)}</span>
          </span>
        </span>
      </a>`;
  }

  window.buildHero = function (books) {
    const stage = document.getElementById('heroStack');
    if (!stage || !books.length) return;

    const chosen = pick(books);
    stage.innerHTML = '<div class="stage__table"></div>' +
      chosen.map((b, i) => bookHTML(b, LAYOUT[i], i)).join('');
    stage.removeAttribute('aria-hidden');

    if (reduce) return; // reduce-motion par sirf saakin tasveer

    let tx = 0, ty = 0, px = 0, py = 0, hover = false, visible = true;

    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tx = (x - 0.5) * 2;
      ty = (y - 0.5) * 2;
      hover = true;
      stage.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
      stage.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
    });
    stage.addEventListener('pointerleave', () => { hover = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);
    }

    const t0 = performance.now();
    (function loop(now) {
      if (visible) {
        if (!hover) {                       // mouse nahi hai to halka jhoolna
          const t = (now - t0) / 1000;
          tx = Math.sin(t * 0.6) * 0.5;
          ty = Math.cos(t * 0.45) * 0.25;
        }
        px += (tx - px) * 0.08;
        py += (ty - py) * 0.08;
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      }
      requestAnimationFrame(loop);
    })(t0);
  };
})();