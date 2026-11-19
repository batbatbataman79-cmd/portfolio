(() => {
  'use strict';

  const { W: SW, H: SH, build, ICONS, CLOUDS } = window.PIXEL_SPRITES;
  const sprites = build();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OUT = '#1a1030';

  /* ------------------------------------------------------------------
   * Пиксельные иконки и облака (SVG)
   * ------------------------------------------------------------------ */
  function pixelSVG(rows, colors) {
    let rects = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        const fill = colors ? ` fill="${colors[ch]}"` : '';
        rects += `<rect x="${x}" y="${y}" width="1" height="1"${fill}/>`;
      }
    });
    return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`;
  }
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const rows = ICONS[el.dataset.icon];
    if (rows) el.innerHTML = pixelSVG(rows);
  });

  const CLOUD_COLORS = { X: '#5b4bc4', L: '#8f80f2', D: '#3a2d8f' };
  document.querySelectorAll('[data-cloud]').forEach((el) => {
    const rows = CLOUDS[+el.dataset.cloud] || CLOUDS[0];
    const s = parseFloat(getComputedStyle(el).getPropertyValue('--s')) || 4;
    el.style.width = rows[0].length * s + 'px';
    el.style.height = rows.length * s + 'px';
    el.innerHTML = pixelSVG(rows, CLOUD_COLORS);
  });

  /* ------------------------------------------------------------------
   * Ночной пиксельный город
   * ------------------------------------------------------------------ */
  function drawSkyline(canvas) {
    const P = 3;
    const w = Math.ceil(canvas.clientWidth / P);
    const h = Math.ceil(canvas.clientHeight / P);
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    let seed = parseInt(canvas.dataset.seed, 10) || 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const LIT = ['#ffcf5a', '#ffcf5a', '#ff7ad9', '#7ae8ff'];

    // дальний план
    for (let x = -2; x < w;) {
      const bw = 7 + Math.floor(rnd() * 12);
      const bh = Math.floor(h * 0.35 + rnd() * h * 0.5);
      g.fillStyle = '#2a1f70';
      g.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 3; wy < h - 2; wy += 4) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
          if (rnd() < 0.12) { g.fillStyle = '#4b3bb0'; g.fillRect(wx, wy, 1, 2); }
        }
      }
      x += bw + (rnd() < 0.3 ? 2 : 0);
    }
    // ближний план
    for (let x = -4; x < w;) {
      const bw = 10 + Math.floor(rnd() * 16);
      const bh = Math.floor(h * 0.18 + rnd() * h * 0.42);
      const top = h - bh;
      g.fillStyle = '#1b1452';
      g.fillRect(x, top, bw, bh);
      g.fillStyle = '#4a3bb5';
      g.fillRect(x, top, bw, 1);
      if (rnd() < 0.35) {
        const ax = x + Math.floor(bw / 2);
        g.fillStyle = '#1b1452';
        g.fillRect(ax, top - 6, 1, 6);
        g.fillStyle = '#ff5c8a';
        g.fillRect(ax, top - 7, 1, 1);
      }
      for (let wy = top + 3; wy < h - 3; wy += 4) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
          const r = rnd();
          if (r < 0.2) { g.fillStyle = LIT[Math.floor(rnd() * LIT.length)]; g.fillRect(wx, wy, 2, 2); }
          else if (r < 0.45) { g.fillStyle = '#2a2178'; g.fillRect(wx, wy, 2, 2); }
        }
      }
      x += bw + 1;
    }
    // земля
    g.fillStyle = '#120c3a';
    g.fillRect(0, h - 3, w, 3);
    g.fillStyle = '#a78bfa';
    g.fillRect(0, h - 4, w, 1);
  }
  const skylines = [...document.querySelectorAll('.skyline')];

  /* ------------------------------------------------------------------
   * Портрет в блоке «Обо мне»
   * ------------------------------------------------------------------ */
  const portrait = document.getElementById('portrait');
  portrait.width = SW;
  portrait.height = SH;
  const portraitCtx = portrait.getContext('2d');
  let portraitFrame = '';
  function drawPortrait(name) {
    if (portraitFrame === name) return;
    portraitFrame = name;
    portraitCtx.clearRect(0, 0, SW, SH);
    portraitCtx.drawImage(sprites[name], 0, 0);
  }

  /* ------------------------------------------------------------------
   * Сцена главного экрана: стол, монитор, стул, растение
   * ------------------------------------------------------------------ */
  const SCENE_W = 160;
  const SCENE_H = 112;
  const FLOOR_Y = 100; // ноги персонажа
  const SEAT_X = 80;   // центр персонажа на стуле

  const sceneWrap = document.getElementById('scene');
  const stage = document.getElementById('stage');
  const back = document.getElementById('sceneBack');
  const front = document.getElementById('sceneFront');
  back.width = front.width = SCENE_W;
  back.height = front.height = SCENE_H;
  const bctx = back.getContext('2d');
  const fctx = front.getContext('2d');
  let ps = 3; // размер «пикселя» сцены в CSS-пикселях

  function layout() {
    const avail = Math.min(sceneWrap.clientWidth, 640);
    ps = Math.max(2, Math.floor(avail / SCENE_W));
    stage.style.width = SCENE_W * ps + 'px';
    stage.style.height = SCENE_H * ps + 'px';
    stage.style.setProperty('--ps', ps + 'px');
    skylines.forEach(drawSkyline);
  }

  const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function rrect(g, c, x, y, w, h, r) {
    g.fillStyle = c;
    for (let j = 0; j < h; j++) {
      const inset = j < r ? r - j : j >= h - r ? r - (h - 1 - j) : 0;
      g.fillRect(x + inset, y + j, w - inset * 2, 1);
    }
  }
  function blob(g, c, cx, cy, rx, ry) {
    g.fillStyle = c;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
      }
    }
  }
  function line(g, c, x0, y0, x1, y1, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      g.fillRect(x, y, t, t);
    }
  }

  // Мини-сайт в редакторе на мониторе собирается по шагам
  const SCREEN_STEPS = 6;
  let screenStep = 0;
  function drawScreen(g, ox, oy, step, now) {
    rect(g, '#1e1b2e', ox, oy, 36, 25);
    rect(g, '#2b2840', ox, oy, 36, 2);
    rect(g, '#ff5f57', ox + 1, oy, 1, 1); rect(g, '#febc2e', ox + 3, oy, 1, 1); rect(g, '#28c840', ox + 5, oy, 1, 1);
    rect(g, '#26233a', ox, oy + 2, 7, 23);
    for (let i = 0; i < 5; i++) rect(g, i === step % 5 ? '#a78bfa' : '#4a4670', ox + 1, oy + 4 + i * 3, 4, 1);
    rect(g, '#26233a', ox + 30, oy + 2, 6, 23);
    ['#8b5cf6', '#ff5cd6', '#ffc93c', '#1f5fe0'].forEach((c, i) => rect(g, c, ox + 31, oy + 4 + i * 3, 3, 2));
    // артборд
    const ax = ox + 10;
    const ay = oy + 4;
    rect(g, '#f6f3ff', ax, ay, 17, 19);
    if (step >= 1) { rect(g, '#1e1b2e', ax, ay, 17, 2); rect(g, '#ffc93c', ax + 1, ay, 3, 1); }
    if (step >= 2) { rect(g, '#7c3aed', ax + 1, ay + 4, 8, 1); rect(g, '#7c3aed', ax + 1, ay + 6, 6, 1); }
    if (step >= 3) { rect(g, '#ff5cd6', ax + 1, ay + 9, 5, 2); }
    if (step >= 4) { rect(g, '#1f5fe0', ax + 10, ay + 4, 6, 7); rect(g, '#6ee7ff', ax + 11, ay + 5, 2, 2); }
    if (step >= 5) { for (let i = 0; i < 3; i++) rect(g, '#c4b5fd', ax + 1 + i * 5, ay + 13, 4, 3); }
    if (step >= 6) { rect(g, '#1e1b2e', ax, ay + 17, 17, 2); }
    // курсор-выделение
    if (step > 0 && Math.floor(now / 450) % 2) {
      g.strokeStyle = '#00b3ff';
      g.lineWidth = 1;
      g.strokeRect(ax + 0.5, ay + 0.5, 16, 18);
    }
  }

  function drawBack(now) {
    const g = bctx;
    g.clearRect(0, 0, SCENE_W, SCENE_H);

    // пол-крыша
    rrect(g, OUT, 2, 99, 156, 13, 2);
    rect(g, '#6b58d6', 4, 100, 152, 1);
    rect(g, '#3f3199', 3, 101, 154, 5);
    for (let x = 12; x < 156; x += 14) rect(g, '#33278a', x, 101, 1, 5);
    rect(g, '#281e72', 3, 106, 154, 4);
    rect(g, '#1d1558', 4, 110, 152, 1);

    // перекладина стола (сзади)
    rect(g, OUT, 22, 90, 116, 3);
    rect(g, '#b8641f', 22, 91, 116, 1);

    // растение в горшке
    const leaf = (cx, cy, rx, ry, c, hl) => {
      blob(g, OUT, cx, cy, rx + 1, ry + 1);
      blob(g, c, cx, cy, rx, ry);
      blob(g, hl, cx - rx * 0.35, cy - ry * 0.3, rx * 0.35, ry * 0.45);
    };
    leaf(139, 70, 5, 10, '#2fbf68', '#6ee79a');
    leaf(151, 66, 5, 11, '#24a356', '#4fd283');
    leaf(145, 57, 4, 9, '#2fbf68', '#6ee79a');
    leaf(133, 78, 6, 4, '#24a356', '#4fd283');
    leaf(155, 78, 4, 4, '#2fbf68', '#6ee79a');
    rect(g, OUT, 131, 81, 26, 5);
    rect(g, '#e07a4c', 132, 82, 24, 3);
    rect(g, OUT, 133, 86, 22, 13);
    rect(g, '#c4643a', 134, 86, 20, 12);
    rect(g, '#9a4826', 150, 86, 4, 12);
    rect(g, '#d97a4f', 135, 86, 2, 12);

    // стул (за персонажем)
    rrect(g, OUT, 63, 44, 34, 33, 4);
    rrect(g, '#4a3f8f', 64, 45, 32, 31, 3);
    rect(g, '#6a5fb5', 67, 46, 26, 1);
    for (let y = 53; y < 74; y += 7) rect(g, '#3a3078', 68, y, 24, 1);
    rect(g, OUT, 78, 79, 5, 13);
    rect(g, '#3a3360', 79, 79, 3, 13);
    rect(g, OUT, 64, 92, 33, 3);
    rect(g, '#3a3360', 65, 93, 31, 1);
    [64, 78, 93].forEach((x) => { rect(g, OUT, x, 95, 4, 4); rect(g, '#5a5480', x + 1, 96, 2, 2); });

    // монитор
    rrect(g, OUT, 16, 36, 42, 32, 2);
    rrect(g, '#2c2f48', 17, 37, 40, 30, 1);
    drawScreen(g, 19, 39, screenStep, now);
    rect(g, OUT, 33, 68, 8, 3);
    rect(g, '#2c2f48', 34, 68, 6, 3);
    rect(g, OUT, 27, 71, 20, 2);
    rect(g, '#4a4e70', 28, 71, 18, 1);
    // стикеры
    rect(g, OUT, 54, 38, 6, 6); rect(g, '#ffc93c', 55, 39, 4, 4);
    rect(g, OUT, 55, 45, 6, 6); rect(g, '#ff7ad9', 56, 46, 4, 4);

    // клавиатура
    rrect(g, OUT, 63, 68, 35, 5, 1);
    rect(g, '#d6d3ec', 64, 69, 33, 3);
    for (let x = 65; x < 96; x += 2) { rect(g, '#9a96c0', x, 69); rect(g, '#9a96c0', x + 1, 71); }

    // кружка с паром
    rrect(g, OUT, 104, 62, 10, 11, 1);
    rect(g, '#ece8ff', 105, 63, 8, 9);
    rect(g, '#b9b3e6', 111, 63, 2, 9);
    rect(g, '#8b5cf6', 105, 66, 8, 2);
    rect(g, OUT, 114, 64, 3, 1); rect(g, OUT, 116, 64, 1, 5); rect(g, OUT, 114, 68, 3, 1);
    for (let i = 0; i < 4; i++) {
      const p = ((now / 1100) + i / 4) % 1;
      g.globalAlpha = 1 - p;
      rect(g, '#ffffff', 107 + Math.round(Math.sin(p * 6 + i * 2) * 1.5) + (i % 2) * 3, Math.round(60 - p * 10));
      g.globalAlpha = 1;
    }

    // лампа
    rrect(g, OUT, 120, 69, 13, 4, 1);
    rect(g, '#ffb84d', 121, 70, 11, 2);
    line(g, OUT, 126, 69, 121, 56, 2);
    line(g, OUT, 121, 56, 130, 50, 2);
    rrect(g, OUT, 128, 46, 12, 7, 2);
    rect(g, '#ffb84d', 130, 47, 8, 4);
    rect(g, '#fff3b0', 131, 52, 6, 1);
    g.globalAlpha = 0.14;
    g.fillStyle = '#ffd36b';
    g.beginPath(); g.moveTo(129, 53); g.lineTo(139, 53); g.lineTo(146, 73); g.lineTo(116, 73); g.fill();
    g.globalAlpha = 1;
  }

  function drawFront() {
    const g = fctx;
    g.clearRect(0, 0, SCENE_W, SCENE_H);
    // столешница перед персонажем
    rect(g, OUT, 10, 73, 140, 6);
    rect(g, '#ffb46b', 11, 74, 138, 1);
    rect(g, '#e8893a', 11, 75, 138, 2);
    rect(g, '#b8641f', 11, 77, 138, 1);
    // ножки
    for (const x of [16, 138]) {
      rect(g, OUT, x, 79, 6, 21);
      rect(g, '#e8893a', x + 1, 79, 4, 20);
      rect(g, '#ffb46b', x + 1, 79, 1, 20);
      rect(g, '#b8641f', x + 4, 79, 1, 20);
    }
    // тумба
    rect(g, OUT, 108, 79, 27, 13);
    rect(g, '#d97b2e', 109, 79, 25, 12);
    rect(g, '#b8641f', 109, 85, 25, 1);
    rect(g, OUT, 118, 81, 7, 2);
    rect(g, OUT, 118, 87, 7, 2);
  }

  /* ------------------------------------------------------------------
   * Пузырь с текстом, который «печатает» персонаж
   * ------------------------------------------------------------------ */
  const LINES = ['собираю прототип', 'сетка 12 колонок', 'Zero Block: готово', 'кнопку поярче!', 'адаптив: ок', 'ЮKassa подключена'];
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
        typing.next = now + 50 + Math.random() * 80;
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
        typing.next = now + 18;
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

  const smallScale = () => (innerWidth < 680 ? 1 : 1.5);
  const hudHeight = () => (innerWidth <= 680 ? 56 : 64);

  function platformPos(p, s) {
    const r = p.el.getBoundingClientRect();
    const half = (SW / 2) * s + 6;
    let lx = r.width * p.frac;
    lx = Math.max(Math.min(half, r.width / 2), Math.min(r.width - half, lx));
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
    let minTop = hudHeight() + SH * s * 0.55;
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
    const pick = () => {
      let best = null;
      let bestScore = Infinity;
      for (const p of platforms) {
        const sc = score(p);
        if (sc < bestScore) { bestScore = sc; best = p; }
      }
      return [best, bestScore];
    };

    let [best, bestScore] = pick();
    // гистерезис, чтобы персонаж не дёргался между соседними платформами
    if (best && current && best !== current) {
      const cs = score(current);
      if (cs !== Infinity && cs - bestScore < 60) return current;
    }
    if (best) return best;

    // нет платформ в удобной зоне — любая видимая под шапкой
    minTop = hudHeight() + 8;
    [best] = pick();
    if (best) return best;

    // совсем ничего не видно — ближайшая к линии
    for (const p of platforms) {
      const sc = Math.abs(p.el.getBoundingClientRect().top - line);
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    return best;
  }

  /* ------------------------------------------------------------------
   * Персонаж
   * ------------------------------------------------------------------ */
  const playerEl = document.getElementById('player');
  playerEl.width = SW;
  playerEl.height = SH;
  playerEl.style.width = SW + 'px';
  playerEl.style.height = SH + 'px';
  const pctx = playerEl.getContext('2d');
  const P = {
    x: 0, y: 0, s: 3, z: 5,
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
    if (P.plat && P.plat.final) return Math.floor(now / 300) % 2 ? 'wave' : 'wave2';
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
    const sx = P.s * (1 + 0.16 * q);
    const sy = P.s * (1 - 0.16 * q);
    const tx = Math.round(P.x - (SW * sx) / 2);
    const ty = Math.round(P.y - SH * sy);
    playerEl.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    playerEl.style.zIndex = P.z;

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------
   * Появление блоков
   * ------------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  // блоки прячутся для анимации только когда скрипт точно работает
  document.documentElement.classList.add('js');
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ------------------------------------------------------------------
   * Старт
   * ------------------------------------------------------------------ */
  layout();
  drawFront();
  drawBack(performance.now());
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  });

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
