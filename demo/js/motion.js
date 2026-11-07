(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Navbar par scroll karne se halki chhaon
  const nav = document.querySelector('.navbar');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Scroll par sections ka ubharna
  const items = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window && items.length) {
    document.documentElement.classList.add('motion');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  }

  // Numbers ka ginti ke saath badhna
  window.countUp = function (id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const target = Number(value);
    if (reduce || !Number.isFinite(target) || target <= 0) {
      el.textContent = value;
      return;
    }
    const start = performance.now();
    const dur = 900;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
})();