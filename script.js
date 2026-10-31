(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const header = document.querySelector('.site-header');
  const mobileViewport = window.matchMedia('(max-width: 800px)');

  function setMenu(open, restoreFocus = false) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? 'Close' : 'Menu';
    mobileNav.hidden = !open;
    if (restoreFocus) menuToggle.focus();
  }
  menuToggle.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !header.contains(event.target)) setMenu(false);
  });
  header.addEventListener('focusout', event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
  });
  mobileViewport.addEventListener('change', event => {
    if (!event.matches) setMenu(false);
  });

  const projects = Array.from(document.querySelectorAll('.project'));
  const filters = document.querySelectorAll('.filter');
  const count = document.querySelector('.project-count');
  filters.forEach(button => {
    button.addEventListener('click', () => {
      filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      projects.forEach(project => {
        project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
      });
      const total = projects.filter(project => !project.hidden).length;
      count.textContent = `${total} project${total === 1 ? '' : 's'}`;
    });
  });

  const background = document.querySelector('.hidden-background');
  const follower = document.querySelector('.cursor-follower');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const supportsMask = CSS.supports('mask-image', 'radial-gradient(black, transparent)') ||
    CSS.supports('-webkit-mask-image', 'radial-gradient(black, transparent)');

  if (supportsMask) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    follower.appendChild(canvas);
    const context = canvas.getContext('2d');

    // All lengths are CSS pixels, all durations milliseconds. These are the tuning knobs.
    const trail = {
      maxDots: 56,
      lifetime: 380,
      maxLength: 210,
      spacing: 4,
      headSize: 7.5,
      tailSize: 1.6,
      sampleInterval: 4,
      historySize: 512
    };
    const history = Array.from({ length: trail.historySize }, () => ({ x: 0, y: 0, time: 0 }));
    const path = Array.from({ length: trail.historySize + 1 }, () => ({ x: 0, y: 0, time: 0, distance: 0 }));
    let historyHead = 0;
    let historyCount = 0;
    let pathCount = 0;
    let pixelRatio = 0;
    let width = 0;
    let height = 0;
    let frame = 0;
    let x = 0;
    let y = 0;
    let paintedX = NaN;
    let paintedY = NaN;
    let lastMove = 0;
    let wakeTime = 0;
    let visible = false;
    let listening = false;
    let paintedScroll = NaN;
    const discoveries = Array.from(background.querySelectorAll('.reveal-egg'), icon => {
      const anchor = document.querySelector(icon.dataset.anchor);
      return { icon, anchor, section: anchor.closest('section') || anchor };
    });
    // Fixed search offsets keep the collection organic and deterministic on resize.
    const discoveryOffsets = [[0, 0]];
    for (let radius = 24; radius <= 336; radius += 24) {
      for (let step = 0; step < 16; step++) {
        const angle = step * Math.PI / 8 + radius * .017;
        discoveryOffsets.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
    }

    function positionDiscoveries() {
      if (!listening) return;
      // Measure only on layout changes, never during pointer movement or scrolling.
      const scroll = window.scrollY;
      const viewport = document.documentElement.clientWidth;
      // Enforce separation in document pixels, regardless of section or anchor.
      const minimumSpacing = viewport >= 800 ? 300 : 280;
      const obstacles = [];
      const reserve = bounds => {
        if (!bounds.width || !bounds.height) return;
        obstacles.push({ left: bounds.left - 6, right: bounds.right + 6,
          top: bounds.top + scroll - 6, bottom: bounds.bottom + scroll + 6 });
      };
      // Text fragments preserve usable whitespace beside short headings and wrapped lines.
      document.querySelectorAll('main, .site-header, .site-footer').forEach(container => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim()) continue;
          if (node.parentElement.closest('details:not([open])') && !node.parentElement.closest('summary')) continue;
          range.selectNodeContents(node);
          Array.from(range.getClientRects()).forEach(reserve);
        }
      });
      document.querySelectorAll('a, button, summary').forEach(element => reserve(element.getBoundingClientRect()));
      // The About heading can stick while scrolling; reserve its full travel area.
      const heading = document.querySelector('.about-heading');
      if (getComputedStyle(heading).position === 'sticky') {
        const box = heading.getBoundingClientRect();
        const section = document.querySelector('#about').getBoundingClientRect();
        obstacles.push({ left: box.left - 6, right: box.right + 6,
          top: section.top + scroll + 48, bottom: section.bottom + scroll - 48 });
      }
      const measurements = discoveries.map(item => ({ ...item,
        bounds: item.anchor.getBoundingClientRect(), area: item.section.getBoundingClientRect() }));
      // Place one of each technology and the footer discovery before repetitions.
      const represented = new Set();
      measurements.forEach(item => {
        item.priority = item.anchor.matches('.site-footer') ? -1 : (!represented.has(item.icon.dataset.tech) ? 0 : 1);
        represented.add(item.icon.dataset.tech);
      });
      measurements.sort((a, b) => a.priority - b.priority);
      const placed = [];
      const positions = measurements.map(({ icon, bounds, area }) => {
        if (!bounds.width || !bounds.height) return { icon, hidden: true };
        const preferredX = bounds.left + bounds.width * Number(icon.dataset.x);
        const preferredY = scroll + bounds.top + bounds.height * Number(icon.dataset.y) + Number(icon.dataset.offset);
        const fits = ({ left, top }) => {
          if (left < 22 || left > viewport - 22 || top < scroll + area.top + 18 || top > scroll + area.bottom - 18) return false;
          if (obstacles.some(box => left + 17 > box.left && left - 17 < box.right && top + 17 > box.top && top - 17 < box.bottom)) return false;
          return !placed.some(point => Math.hypot(point.left - left, point.top - top) < minimumSpacing);
        };
        const candidates = discoveryOffsets.map(([dx, dy]) => ({ left: preferredX + dx, top: preferredY + dy }));
        // Prefer isolated reveals; use the hard minimum only when space is limited.
        const preferredSpacing = viewport >= 800 ? 420 : minimumSpacing;
        let position = candidates.find(point => fits(point) && placed.every(other =>
          Math.hypot(other.left - point.left, other.top - point.top) >= preferredSpacing));
        if (!position) position = candidates.find(fits);
        if (!position) {
          // Long reading columns may need a more distant gap within the same section.
          const gaps = [scroll + area.top + 20, scroll + area.bottom - 20];
          obstacles.forEach(box => gaps.push(box.top - 19, box.bottom + 19));
          const alternatives = [];
          for (const top of gaps) {
            for (const fraction of [.12, .36, .63, .88]) {
              alternatives.push({ left: 22 + (viewport - 44) * fraction, top });
            }
          }
          alternatives.sort((a, b) => Math.hypot(a.left - preferredX, a.top - preferredY) - Math.hypot(b.left - preferredX, b.top - preferredY));
          position = alternatives.find(fits);
        }
        if (position) placed.push(position);
        // If an unusually constrained layout has no safe space, never cover content.
        return { icon, hidden: !position, ...position };
      });
      positions.forEach(({ icon, hidden, left, top }) => {
        icon.toggleAttribute('hidden', hidden);
        if (hidden) return;
        icon.style.left = `${left}px`;
        icon.style.top = `${top}px`;
      });
    }
    function clearCanvas() {
      if (context) context.clearRect(0, 0, width, height);
    }
    function resizeCanvas() {
      if (!context) return;
      width = window.innerWidth;
      height = window.innerHeight;
      // Explicit CSS dimensions keep pointer coordinates exact beside native scrollbars.
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
    function hide() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      visible = false;
      historyCount = 0;
      paintedX = paintedY = paintedScroll = NaN;
      clearCanvas();
      background.classList.remove('is-active');
      follower.classList.remove('is-active');
    }
    function record(event, now) {
      const time = Math.min(now, event.timeStamp || now);
      const previous = history[historyHead];
      if (historyCount) {
        const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
        if (distance < .1 || (time - previous.time < trail.sampleInterval && distance < 3)) return;
      }
      historyHead = (historyHead + 1) % history.length;
      const point = history[historyHead];
      point.x = event.clientX;
      point.y = event.clientY;
      point.time = time;
      historyCount = Math.min(historyCount + 1, history.length);
    }
    function buildPath(now) {
      // Start exactly at the current pointer; older samples remain on their original trajectory.
      path[0].x = x + 9;
      path[0].y = y + 9;
      path[0].time = lastMove;
      path[0].distance = 0;
      pathCount = 1;
      const lengthLimit = Math.min(trail.maxLength, Math.max(width, height) * .95);
      for (let step = 0; step < historyCount; step++) {
        const older = history[(historyHead - step + history.length) % history.length];
        const previous = path[pathCount - 1];
        const dx = older.x + 9 - previous.x;
        const dy = older.y + 9 - previous.y;
        const distance = Math.hypot(dx, dy);
        if (distance < .01) continue;
        const timeFraction = (previous.time - (now - trail.lifetime)) / Math.max(1, previous.time - older.time);
        const lengthFraction = (lengthLimit - previous.distance) / distance;
        const fraction = Math.max(0, Math.min(1, timeFraction, lengthFraction));
        const point = path[pathCount++];
        point.x = previous.x + dx * fraction;
        point.y = previous.y + dy * fraction;
        point.time = previous.time + (older.time - previous.time) * fraction;
        point.distance = previous.distance + distance * fraction;
        if (fraction < 1 || point.distance >= lengthLimit) break;
      }
    }
    function drawTrail(now) {
      if (!context) return;
      clearCanvas();
      buildPath(now);
      const length = path[pathCount - 1].distance;
      const count = Math.min(trail.maxDots, Math.floor(length / trail.spacing) + 1);
      const appearance = Math.max(0, Math.min(1, (now - wakeTime) / 45));
      let segment = 1;
      for (let index = 0; index < count; index++) {
        // Fixed arc-length intervals prevent fast sweeps from spreading the dots apart.
        const distance = index * trail.spacing;
        const progress = length > 0 ? distance / length : 0;
        while (segment < pathCount - 1 && path[segment].distance < distance) segment++;
        const before = path[Math.max(0, segment - 1)];
        const after = path[Math.min(segment, pathCount - 1)];
        const fraction = Math.max(0, Math.min(1, (distance - before.distance) / Math.max(.001, after.distance - before.distance)));
        const pointX = before.x + (after.x - before.x) * fraction;
        const pointY = before.y + (after.y - before.y) * fraction;
        const time = before.time + (after.time - before.time) * fraction;
        const age = Math.max(0, (now - time) / trail.lifetime);
        const fade = Math.pow(Math.max(0, 1 - age), .65);
        const diameter = trail.tailSize + (trail.headSize - trail.tailSize) * Math.pow(1 - progress, .85);
        context.globalAlpha = appearance * fade * Math.pow(1 - progress, .55);
        context.fillStyle = index === 0 ? '#ffffff' : '#f5f3f7';
        context.beginPath();
        context.arc(pointX, pointY, diameter / 2, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }
    function paint(now) {
      // The reveal tracks the current pointer directly, independently of historical dots.
      if (x !== paintedX || y !== paintedY) {
        background.style.setProperty('--spot-x', `${x}px`);
        background.style.setProperty('--spot-y', `${y}px`);
        paintedX = x;
        paintedY = y;
      }
      if (window.scrollY !== paintedScroll) {
        paintedScroll = window.scrollY;
        background.style.setProperty('--discovery-scroll', `${-paintedScroll}px`);
      }
      background.classList.add('is-active');
      follower.classList.add('is-active');
      if (pixelRatio !== (window.devicePixelRatio || 1)) resizeCanvas();
      drawTrail(now);
      if (now - lastMove < trail.lifetime) frame = window.requestAnimationFrame(paint);
      else {
        clearCanvas();
        frame = 0;
      }
    }
    function move(event) {
      if (event.pointerType !== 'mouse') {
        hide();
        return;
      }
      const now = performance.now();
      if (!visible || now - lastMove >= trail.lifetime) {
        historyCount = 0;
        wakeTime = now;
        visible = true;
      }
      x = event.clientX;
      y = event.clientY;
      lastMove = now;
      // Coalesced samples retain curves from high-frequency mice without a growing history.
      const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
      for (const sample of samples) record(sample, now);
      record(event, now);
      if (!frame) frame = window.requestAnimationFrame(paint);
    }
    function sync() {
      const enabled = finePointer.matches && !reducedMotion.matches && !forcedColors.matches;
      if (enabled === listening) return;
      listening = enabled;
      if (enabled) {
        resizeCanvas();
        positionDiscoveries();
        document.addEventListener('pointermove', move, { passive: true });
      } else {
        document.removeEventListener('pointermove', move);
        hide();
        canvas.width = canvas.height = 1; // Release the bitmap on touch/reduced-motion devices.
      }
    }
    [finePointer, reducedMotion, forcedColors].forEach(preference => {
      preference.addEventListener('change', sync);
    });
    document.addEventListener('pointerout', event => {
      if (!event.relatedTarget) hide();
    }, { passive: true });
    document.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse') hide();
    }, { passive: true });
    document.addEventListener('pointercancel', hide, { passive: true });
    document.addEventListener('keydown', hide);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hide();
    });
    // Scroll updates the masked discoveries without restarting an idle cursor trail.
    window.addEventListener('scroll', () => {
      if (listening && visible && !frame) frame = window.requestAnimationFrame(paint);
    }, { passive: true });
    if ('ResizeObserver' in window) {
      const layoutObserver = new ResizeObserver(positionDiscoveries);
      document.querySelectorAll('main, .site-header, main > section').forEach(section => layoutObserver.observe(section));
      discoveries.forEach(({ anchor }) => layoutObserver.observe(anchor));
    }
    window.addEventListener('blur', hide);
    window.addEventListener('resize', () => {
      hide();
      if (listening) {
        resizeCanvas();
        positionDiscoveries();
      }
    });
    window.addEventListener('pagehide', hide);
    sync();
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
