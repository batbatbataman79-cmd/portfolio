(() => {
  'use strict';

  const { PAL, SPRITES, ICONS } = window.PIXEL_SPRITES;
  const SW = 20;           // ширина кадра персонажа
  const SH = 32;           // высота кадра персонажа
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
   * Спрайты → offscreen canvas
   * ------------------------------------------------------------------ */
  const sprites = {};
  for (const [name, rows] of Object.entries(SPRITES)) {
    if (rows.length !== SH || rows.some((r) => r.length !== SW)) {
      console.warn('[sprites] неверный размер кадра', name, rows.map((r) => r.length));
    }
    const c = document.createElement('canvas');
    c.width = SW; c.height = SH;
    const g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        g.fillStyle = PAL[ch] || '#f0f';
        g.fillRect(x, y, 1, 1);
      }
    });
    sprites[name] = c;
  }

  /* ------------------------------------------------------------------
   * Пиксельные иконки
   * ------------------------------------------------------------------ */
  const iconSVG = (rows) => {
    let rects = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    });
    return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`;
  };
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const rows = ICONS[el.dataset.icon];
    if (rows) el.innerHTML = iconSVG(rows);
  });

  /* ------------------------------------------------------------------
   * Портрет в блоке «Обо мне»
   * ------------------------------------------------------------------ */
  const portrait = document.getElementById('portrait');
  const portraitCtx = portrait && portrait.getContext('2d');
  let portraitFrame = '';
  function drawPortrait(name) {
    if (!portraitCtx || portraitFrame === name) return;
    portraitFrame = name;
    portraitCtx.clearRect(0, 0, SW, SH);
    portraitCtx.drawImage(sprites[name], 0, 0);
  }

  /* ------------------------------------------------------------------
   * Сцена главного экрана: комната, стол, монитор
   * ------------------------------------------------------------------ */
  const SCENE_W = 80;
  const SCENE_H = 56;
  const FLOOR_Y = 48;  // ноги персонажа
  const SEAT_X = 40;   // центр персонажа на стуле

  const sceneWrap = document.getElementById('scene');
  const stage = document.getElementById('stage');
  const back = document.getElementById('sceneBack');
  const front = document.getElementById('sceneFront');
  back.width = front.width = SCENE_W;
  back.height = front.height = SCENE_H;
  const bctx = back.getContext('2d');
  const fctx = front.getContext('2d');
  let ps = 6; // размер «пикселя» сцены в CSS-пикселях

  function layoutScene() {
    const avail = Math.min(sceneWrap.clientWidth, 640);
    ps = Math.max(3, Math.floor(avail / SCENE_W));
    stage.style.width = SCENE_W * ps + 'px';
    stage.style.height = SCENE_H * ps + 'px';
    stage.style.setProperty('--ps', ps + 'px');
  }

  const rect = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
  const OUT = '#14102a';

  // Мини-сайт на мониторе собирается по шагам, пока персонаж печатает
  const SCREEN_STEPS = 6;
  let screenStep = 0;
  function drawScreen(g, ox, oy, step) {
    rect(g, '#f4f1ff', ox, oy, 15, 12);
    if (step >= 1) { rect(g, '#1a1226', ox, oy, 15, 1); rect(g, '#ffd21f', ox + 1, oy, 2, 1); rect(g, '#8f88c9', ox + 10, oy, 1, 1); rect(g, '#8f88c9', ox + 12, oy, 1, 1); }
    if (step >= 2) { rect(g, '#2f6bff', ox + 1, oy + 2, 7, 1); rect(g, '#2f6bff', ox + 1, oy + 4, 5, 1); }
    if (step >= 3) { rect(g, '#ffd21f', ox + 1, oy + 6, 4, 1); rect(g, '#1a1226', ox + 1, oy + 7, 4, 1); }
    if (step >= 4) { rect(g, '#ff5c8a', ox + 9, oy + 2, 5, 5); rect(g, '#ffe28a', ox + 10, oy + 3, 1, 1); rect(g, '#c23a63', ox + 9, oy + 6, 5, 1); }
    if (step >= 5) { for (let i = 0; i < 3; i++) rect(g, '#c7c0f0', ox + 1 + i * 5, oy + 9, 3, 2); }
    if (step >= 6) { rect(g, '#1a1226', ox, oy + 11, 15, 1); }
  }

  function drawBack(now) {
    const g = bctx;
    g.clearRect(0, 0, SCENE_W, SCENE_H);

    // стена
    rect(g, '#231d4d', 0, 0, 80, 46);
    for (let x = 0; x < 80; x += 8) rect(g, '#272157', x, 0, 4, 46);
    rect(g, '#15112f', 0, 46, 80, 2);

    // пол
    rect(g, '#3b2a55', 0, 48, 80, 8);
    for (let y = 48; y < 56; y += 2) {
      for (let x = ((y / 2) % 2) * 4; x < 80; x += 8) rect(g, '#33244b', x, y, 4, 2);
    }

    // окно с ночным небом
    rect(g, '#3d347a', 3, 3, 21, 17);
    rect(g, '#0d1033', 4, 4, 19, 15);
    [[6, 6], [11, 9], [20, 6], [8, 15], [16, 13], [21, 16], [6, 11], [18, 10]].forEach(([x, y], i) => {
      const on = Math.sin(now / 420 + i * 1.9) > -0.2;
      rect(g, on ? '#ffffff' : '#5c63b8', x, y);
    });
    rect(g, '#ffe9a8', 15, 6, 3, 3);
    rect(g, '#0d1033', 17, 6, 1, 1);
    rect(g, '#3d347a', 13, 4, 1, 15);
    rect(g, '#3d347a', 4, 11, 19, 1);
    rect(g, '#4b418f', 2, 20, 23, 1);

    // постер с сердечком
    rect(g, '#ffd21f', 56, 4, 15, 13);
    rect(g, '#1a1226', 57, 5, 13, 11);
    ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'].forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === 'X') rect(g, '#ff5c8a', 60 + x, 7 + y);
    });

    // полка с книгами и растением
    rect(g, '#6b4429', 54, 26, 20, 1);
    rect(g, '#3e2616', 54, 27, 20, 1);
    [['#2f6bff', 55, 3], ['#ff5c8a', 57, 4], ['#ffd21f', 59, 2], ['#3ee07a', 61, 4], ['#a487ff', 63, 3]].forEach(([c, x, hgt]) => {
      rect(g, OUT, x, 26 - hgt - 2, 2, hgt + 2);
      rect(g, c, x, 26 - hgt - 1, 1, hgt + 1);
    });
    rect(g, '#c4643a', 68, 22, 4, 4);
    rect(g, '#3ee07a', 67, 19, 2, 3); rect(g, '#3ee07a', 70, 18, 2, 4); rect(g, '#26b864', 69, 20, 1, 2);

    // стул (за персонажем)
    // спинка со скруглённым верхом
    rect(g, OUT, 33, 23, 14, 13);
    rect(g, OUT, 32, 25, 16, 11);
    rect(g, '#ff5c8a', 34, 24, 12, 11);
    rect(g, '#ff5c8a', 33, 26, 14, 9);
    rect(g, '#ff8aac', 34, 24, 12, 1);
    rect(g, '#d43f6c', 33, 33, 14, 2);
    // строчка на спинке
    rect(g, '#d43f6c', 36, 27, 8, 1);
    rect(g, '#d43f6c', 36, 30, 8, 1);
    // ножка спинки и сиденье
    rect(g, OUT, 39, 36, 2, 2);
    rect(g, OUT, 31, 38, 18, 1);
    rect(g, '#2a2540', 39, 42, 2, 4);
    rect(g, '#2a2540', 33, 46, 14, 1);
    rect(g, '#0b0916', 33, 47, 2, 1); rect(g, '#0b0916', 39, 47, 2, 1); rect(g, '#0b0916', 45, 47, 2, 1);

    // монитор
    rect(g, OUT, 12, 21, 17, 14);
    drawScreen(g, 13, 22, screenStep);
    rect(g, OUT, 19, 35, 3, 3);
    rect(g, OUT, 16, 38, 9, 1);

    // клавиатура
    rect(g, OUT, 31, 37, 18, 2);
    rect(g, '#c9cbe0', 32, 37, 16, 1);
    for (let x = 33; x < 47; x += 2) rect(g, '#8f92b0', x, 37);

    // кружка с паром
    rect(g, OUT, 54, 33, 6, 6);
    rect(g, '#ffd21f', 55, 34, 4, 4);
    rect(g, '#e0a800', 55, 37, 4, 1);
    rect(g, OUT, 60, 34, 2, 3);
    for (let i = 0; i < 3; i++) {
      const p = ((now / 900) + i / 3) % 1;
      g.globalAlpha = 1 - p;
      rect(g, '#ffffff', 56 + Math.round(Math.sin(p * 6 + i * 2)), Math.round(32 - p * 7));
      g.globalAlpha = 1;
    }

    // лампа
    rect(g, OUT, 63, 37, 6, 2);
    rect(g, OUT, 65, 30, 1, 7);
    rect(g, OUT, 62, 28, 7, 3);
    rect(g, '#ffd21f', 63, 29, 5, 1);
    g.globalAlpha = 0.12;
    g.fillStyle = '#ffd21f';
    g.beginPath(); g.moveTo(62, 31); g.lineTo(69, 31); g.lineTo(73, 39); g.lineTo(58, 39); g.fill();
    g.globalAlpha = 1;
  }

  function drawFront() {
    const g = fctx;
    g.clearRect(0, 0, SCENE_W, SCENE_H);
    // столешница перед персонажем
    rect(g, OUT, 9, 39, 62, 4);
    rect(g, '#b07a4c', 10, 39, 60, 1);
    rect(g, '#8a5a35', 10, 40, 60, 2);
    // ножки
    rect(g, OUT, 11, 43, 4, 5);
    rect(g, '#6b4429', 12, 43, 2, 5);
    rect(g, OUT, 65, 43, 4, 5);
    rect(g, '#6b4429', 66, 43, 2, 5);
    // тумба с ящиком
    rect(g, OUT, 50, 43, 15, 5);
    rect(g, '#7a4c2c', 51, 43, 13, 4);
    rect(g, '#ffd21f', 56, 44, 3, 1);
  }

  /* ------------------------------------------------------------------
   * Пузырь с текстом, который «печатает» персонаж
   * ------------------------------------------------------------------ */
  const LINES = ['header: готов', 'сетка 12 колонок', 'заголовок 48/56', 'кнопку поярче!', 'адаптив: ок', 'wow-эффект: ок'];
  const typedEl = document.getElementById('typed');
  const typing = { line: 0, char: 0, mode: 'type', next: 0 };

  function typingTick(now) {
    if (now < typing.next) return;
    const text = LINES[typing.line];
    if (typing.mode === 'type') {
      typing.char++;
      typedEl.textContent = text.slice(0, typing.char);
      if (typing.char >= text.length) {
        typing.mode = 'hold';
        typing.next = now + 1100;
        screenStep = Math.min(SCREEN_STEPS, screenStep + 1);
      } else {
        typing.next = now + 55 + Math.random() * 80;
      }
    } else if (typing.mode === 'hold') {
      typing.mode = 'erase';
      typing.next = now;
    } else {
      typing.char--;
      typedEl.textContent = text.slice(0, Math.max(0, typing.char));
      if (typing.char <= 0) {
        typing.mode = 'type';
        typing.line = (typing.line + 1) % LINES.length;
        if (typing.line === 0) screenStep = 0;
        typing.next = now + 300;
      } else {
        typing.next = now + 20;
      }
    }
  }

  /* ------------------------------------------------------------------
   * Платформы — элементы дизайна, на которые прыгает персонаж
   * ------------------------------------------------------------------ */
  const FRACS = [0.2, 0.75, 0.45, 0.85, 0.3, 0.6];
  const platforms = [...document.querySelectorAll('[data-platform]')].map((el, i) => ({
    el,
    frac: el.dataset.x ? parseFloat(el.dataset.x) : FRACS[i % FRACS.length],
    offset: el.dataset.offset ? parseFloat(el.dataset.offset) : 0,
    final: el.hasAttribute('data-final'),
  }));

  const smallScale = () => (innerWidth < 680 ? 2 : 3);
  const hudHeight = () => (innerWidth <= 680 ? 56 : 64);

  function platformPos(p, s) {
    const r = p.el.getBoundingClientRect();
    const half = (SW / 2) * s + 8;
    let lx = r.width * p.frac;
    lx = Math.max(half, Math.min(r.width - half, lx));
    let x = r.left + lx;
    x = Math.max(half, Math.min(document.documentElement.clientWidth - half, x));
    return { x: x + scrollX, y: r.top + scrollY - p.offset };
  }

  function seatPos() {
    const r = back.getBoundingClientRect();
    return { x: r.left + scrollX + SEAT_X * ps, y: r.top + scrollY + FLOOR_Y * ps };
  }

  // Персонаж сидит, пока сцена видна целиком (на мобильных она ниже первого экрана)
  function atStart() {
    const r = back.getBoundingClientRect();
    const sceneBottom = r.bottom + scrollY;
    const limit = Math.max(40, sceneBottom - innerHeight + 40);
    return scrollY < limit;
  }

  // Выбираем платформу, ближайшую к «линии взгляда» на 60% высоты экрана
  function chooseTarget(current) {
    const vh = innerHeight;
    const s = smallScale();
    const line = vh * 0.6;
    let minTop = hudHeight() + SH * s * 0.6;
    const maxTop = vh - 12;
    const curX = P.x - scrollX;

    const score = (p) => {
      const r = p.el.getBoundingClientRect();
      if (r.width < 60 || r.height === 0) return Infinity;
      const top = r.top - p.offset;
      if (top < minTop || top > maxTop) return Infinity;
      const pos = platformPos(p, s);
      return Math.abs(top - line) + Math.abs(pos.x - scrollX - curX) * 0.03;
    };

    let best = null;
    let bestScore = Infinity;
    for (const p of platforms) {
      const sc = score(p);
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    // гистерезис, чтобы персонаж не дёргался между соседними платформами
    if (current && best !== current) {
      const cs = score(current);
      if (cs !== Infinity && cs - bestScore < 60) return current;
    }
    if (best) return best;

    // нет платформ в удобной зоне — пробуем любую видимую под шапкой
    minTop = hudHeight() + 8;
    for (const p of platforms) {
      const sc = score(p);
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    if (best) return best;

    // совсем ничего не видно — берём ближайшую к линии
    for (const p of platforms) {
      const r = p.el.getBoundingClientRect();
      const sc = Math.abs(r.top - line);
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    return best;
  }

  /* ------------------------------------------------------------------
   * Персонаж
   * ------------------------------------------------------------------ */
  const playerEl = document.getElementById('player');
  const pctx = playerEl.getContext('2d');
  const P = {
    x: 0, y: 0, s: 6, z: 5,
    state: 'sit',     // sit | standup | jump | roam | sitdown
    sprite: '',
    jump: null,
    plat: null,
    squash: 0,
    timer: 0,
  };

  function setSprite(name) {
    if (P.sprite === name) return;
    P.sprite = name;
    pctx.clearRect(0, 0, SW, SH);
    pctx.drawImage(sprites[name], 0, 0);
  }

  let score = 0;
  const scoreEl = document.getElementById('score');
  function addScore(n) {
    score += n;
    scoreEl.textContent = String(score).padStart(6, '0');
  }
  function popup(x, y, text) {
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function startJump(targetFn, s1, onLand, home = false) {
    const t = targetFn();
    const dx = t.x - P.x;
    const dy = t.y - P.y;
    const dist = Math.hypot(dx, dy);
    let dur = Math.min(950, 380 + dist * 0.45);
    if (reduceMotion) dur *= 0.5;
    const arc = 30 + Math.max(0, -dy) * 0.55 + Math.min(dist, 700) * 0.07;
    P.jump = { x0: P.x, y0: P.y, s0: P.s, s1, t0: performance.now(), dur, arc, targetFn, onLand, home };
    P.state = 'jump';
    setSprite('jump');
  }

  function stepJump(now) {
    const j = P.jump;
    const t = Math.min(1, (now - j.t0) / j.dur);
    const tg = j.targetFn();
    P.x = j.x0 + (tg.x - j.x0) * t;
    P.y = j.y0 + (tg.y - j.y0) * t - j.arc * 4 * t * (1 - t);
    P.s = j.s0 + (j.s1 - j.s0) * easeOut(t);
    if (j.home && t > 0.6) P.z = 5;
    if (t >= 1) {
      P.jump = null;
      P.squash = 1;
      setSprite('stand');
      j.onLand();
    }
  }

  function jumpToPlatform(p) {
    P.plat = p;
    P.z = 50;
    startJump(() => platformPos(p, smallScale()), smallScale(), () => {
      P.state = 'roam';
      P.timer = performance.now();
      addScore(100);
      popup(P.x, P.y - SH * P.s, '+100');
    });
  }

  function goHome() {
    P.plat = null;
    startJump(seatPos, ps, () => {
      P.state = 'sitdown';
      P.timer = performance.now();
    }, true);
  }

  function idleSprite(now) {
    if (P.plat && P.plat.final) {
      return Math.floor(now / 350) % 2 ? 'wave' : 'stand';
    }
    return (now % 3400) < 140 ? 'blink' : 'stand';
  }

  function typingSprite(now) {
    if (typing.mode !== 'type') return 'sitA';
    return Math.floor(now / 120) % 2 ? 'sitA' : 'sitB';
  }

  /* ------------------------------------------------------------------
   * Главный цикл
   * ------------------------------------------------------------------ */
  let lastSceneDraw = 0;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;
    const start = atStart();

    switch (P.state) {
      case 'sit': {
        const sp = seatPos();
        P.x = sp.x; P.y = sp.y; P.s = ps; P.z = 5;
        typingTick(now);
        setSprite(typingSprite(now));
        if (!start) {
          P.state = 'standup';
          P.timer = now;
          setSprite('stand');
          stage.classList.add('is-away');
        }
        break;
      }
      case 'standup': {
        const sp = seatPos();
        P.x = sp.x; P.y = sp.y; P.s = ps;
        if (start) {
          P.state = 'sit';
          stage.classList.remove('is-away');
        } else if (now - P.timer > 280) {
          jumpToPlatform(chooseTarget(null));
        }
        break;
      }
      case 'jump': {
        stepJump(now);
        if (P.state !== 'jump') break; // приземлились в этом кадре
        if (P.jump.home) {
          if (!start) jumpToPlatform(chooseTarget(null));
        } else if (start) {
          goHome();
        } else {
          const t = chooseTarget(P.plat);
          if (t && t !== P.plat) jumpToPlatform(t);
        }
        break;
      }
      case 'roam': {
        if (start) { goHome(); break; }
        const t = chooseTarget(P.plat);
        if (t && t !== P.plat) { jumpToPlatform(t); break; }
        const pos = platformPos(P.plat, smallScale());
        P.x = pos.x; P.y = pos.y; P.s = smallScale();
        if (now - P.timer > 160) setSprite(idleSprite(now));
        break;
      }
      case 'sitdown': {
        const sp = seatPos();
        P.x = sp.x; P.y = sp.y; P.s = ps; P.z = 5;
        if (!start) {
          P.state = 'standup';
          P.timer = now;
        } else if (now - P.timer > 220) {
          P.state = 'sit';
          stage.classList.remove('is-away');
        }
        break;
      }
    }

    // перерисовка сцены ~12 раз в секунду и только когда она видна
    if (now - lastSceneDraw > 80) {
      const r = back.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) drawBack(now);
      lastSceneDraw = now;
    }

    drawPortrait((now % 2800) < 150 ? 'blink' : 'stand');

    // приземление: сплющивание
    P.squash = Math.max(0, P.squash - dt / 170);
    const q = P.squash;
    const sx = P.s * (1 + 0.2 * q);
    const sy = P.s * (1 - 0.2 * q);
    const tx = Math.round(P.x - (SW * sx) / 2);
    const ty = Math.round(P.y - SH * sy);
    playerEl.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    playerEl.style.zIndex = P.z;

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------
   * Появление блоков и шкал навыков
   * ------------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .skills').forEach((el) => io.observe(el));

  /* ------------------------------------------------------------------
   * Старт
   * ------------------------------------------------------------------ */
  layoutScene();
  drawFront();
  drawBack(performance.now());
  addEventListener('resize', layoutScene);

  // если страница открылась не с самого верха — сразу ставим персонажа на платформу
  requestAnimationFrame(() => {
    if (!atStart()) {
      const p = chooseTarget(null);
      P.plat = p;
      const pos = platformPos(p, smallScale());
      P.x = pos.x; P.y = pos.y; P.s = smallScale(); P.z = 50;
      P.state = 'roam';
      stage.classList.add('is-away');
      setSprite('stand');
    }
    requestAnimationFrame(frame);
  });
})();
