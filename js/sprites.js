/*
 * Пиксельный персонаж: голова и кроксы нарисованы вручную,
 * тело (худи, карго-штаны, руки) собирается из фигур,
 * затем автоматически добавляются контур и светотень.
 * Все кадры 44×76, ноги — на нижней строке.
 */
window.PIXEL_SPRITES = (() => {
  const W = 44;
  const H = 76;
  const K = '#1a1030';

  const HEAD_PAL = {
    K, H: '#3b2316', h: '#5e3a22', g: '#8f5d36',
    S: '#f4bf96', s: '#d9946c', t: '#b8734f',
    B: '#6e3f22', b: '#3f2312', n: '#94592f',
    E: '#1a1030', W: '#ffffff', R: '#8c2b2b',
  };
  const CROC_PAL = { K, Y: '#ffd21f', w: '#fff07a', y: '#e0a800', o: '#a87600' };

  const HEAD = [
    '.....KK..KKK.KK.......',
    '....KhgK.KggKKhK......',
    '...KhhgKKhghhKhhKK....',
    '...KhhhgghhhhhhhhhK...',
    '..KHhhhhhhhhhhgghhhK..',
    '..KHHhhhhhhhhhhhhHHK..',
    '..KHHHHHhhhhhhHHHHHK..',
    '.KHHHSSSSHHSSSSSSHHHK.',
    '.KHHSSSSSSSSSSSSSSHHK.',
    '.KHsSSSSSSSSSSSSSSsHK.',
    '.KHSbbbbSSSSSSbbbbSHK.',
    'KsKSSWEESSSSSSEEWSSKsK',
    'KsKSSSEESSSSSSEESSSKsK',
    'KsKsSSSSSSssSSSSSSsKsK',
    '.KKBSSSSSSttSSSSSSBKK.',
    '.KBBBSSSSSSSSSSSSBBBK.',
    '.KBBBBBnnBBBBnnBBBBBK.',
    '.KBBBBRWWWWWWWWRBBBBK.',
    '.KBBBBBRWWWWWWRBBBBBK.',
    '..KBBBBBRRRRRRBBBBBK..',
    '...KBBBnBBBBBBnBBBK...',
    '....KKBBBBBBBBBBKK....',
  ];
  const HEAD_BLINK = HEAD.slice();
  HEAD_BLINK[11] = 'KsKSSSSSSSSSSSSSSSSKsK';
  HEAD_BLINK[12] = 'KsKSSEEESSSSSSEEESSKsK';

  const CROC = [
    '...KKKKKKK...',
    '..KYYwwYYYK..',
    '.KYwYoYoYoYK.',
    'KYYYYoYoYYYyK',
    'KYwYYYYYYYYyK',
    'KYYYYYYYYYYyK',
    'KyyyyyyyyyyyK',
    '.KKKKKKKKKKK.',
  ];

  // z-порядок и цвета: [z, основной, свет, тень]
  const PARTS = {
    legL:   [1, '#272733', '#3b3b4b', '#16161e'],
    legR:   [2, '#272733', '#3b3b4b', '#16161e'],
    cargo:  [3, '#1e1e28', '#353544', '#121218'],
    shoe:   [4],
    torso:  [5, '#1f5fe0', '#4c86ff', '#1646b0'],
    pocket: [6, '#1b55d0', '#3d77f2', '#143f9f'],
    hem:    [7, '#194cc0', '#2d66dc', '#113889'],
    collar: [8, '#2a6cf0', '#5f97ff', '#1a4bba'],
    head:   [9],
    arm:    [10, '#2163e6', '#4f89ff', '#1747b4'],
    cuff:   [11, '#1a4fc4', '#3068e0', '#123a92'],
    hand:   [12, '#f4bf96', '#ffd8b8', '#d9946c'],
  };

  /* ---------- примитивы ---------- */
  function grid() {
    return { part: new Array(W * H).fill(null), col: new Array(W * H).fill(null) };
  }
  function put(g, x, y, p, c = null) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    const cur = g.part[i];
    if (cur && PARTS[cur][0] > PARTS[p][0]) return;
    g.part[i] = p;
    g.col[i] = c;
  }
  function rect(g, x, y, w, h, p) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(g, i, j, p);
  }
  function poly(g, pts, p) {
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let inside = false;
        for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
          const [xa, ya] = pts[a];
          const [xb, yb] = pts[b];
          if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) inside = !inside;
        }
        if (inside) put(g, x, y, p);
      }
    }
  }
  function ellipse(g, cx, cy, rx, ry, p) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) put(g, x, y, p);
      }
    }
  }
  function thick(g, a, b, r, p) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len * 2));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      ellipse(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, r, p);
    }
  }
  function stamp(g, art, ox, oy, p, pal, mirror = false) {
    art.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = mirror ? row[row.length - 1 - x] : row[x];
        if (ch === '.') continue;
        put(g, ox + x, oy + y, p, pal[ch]);
      }
    });
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const mx = (pt) => [W - pt[0], pt[1]];

  /* ---------- части тела ---------- */
  function upper(g, dy, blink) {
    ellipse(g, 22, 22 + dy, 12.5, 5, 'collar');
    poly(g, [[13, 23], [31, 23], [36, 28], [35.5, 49], [8.5, 49], [8, 28]].map(([x, y]) => [x, y + dy]), 'torso');
    poly(g, [[14, 38], [30, 38], [32, 47], [12, 47]].map(([x, y]) => [x, y + dy]), 'pocket');
    rect(g, 9, 46 + dy, 27, 3, 'hem');
    stamp(g, blink ? HEAD_BLINK : HEAD, 11, dy, 'head', HEAD_PAL);
  }
  function arm(g, sh, el, hand) {
    thick(g, sh, el, 3.2, 'arm');
    thick(g, el, hand, 3, 'arm');
    thick(g, lerp(hand, el, 0.3), lerp(hand, el, 0.1), 3.3, 'cuff');
    ellipse(g, hand[0], hand[1], 2.7, 2.7, 'hand');
  }
  function legsStand(g, top = 48) {
    poly(g, [[10.5, top], [22, top], [22, 60], [21, 69], [9.5, 69], [9, 60]], 'legL');
    poly(g, [[22, top], [33.5, top], [35, 60], [34.5, 69], [23, 69], [22.5, 60]], 'legR');
    rect(g, 8, 55, 5, 8, 'cargo');
    rect(g, 31, 55, 5, 8, 'cargo');
    stamp(g, CROC, 8, 68, 'shoe', CROC_PAL);
    stamp(g, CROC, 23, 68, 'shoe', CROC_PAL, true);
  }
  function legsJump(g) {
    poly(g, [[11, 48], [22, 48], [18, 63], [7, 63]], 'legL');
    poly(g, [[22, 48], [33, 48], [37, 63], [26, 63]], 'legR');
    rect(g, 6, 52, 5, 7, 'cargo');
    rect(g, 33, 52, 5, 7, 'cargo');
    stamp(g, CROC, 3, 61, 'shoe', CROC_PAL);
    stamp(g, CROC, 28, 61, 'shoe', CROC_PAL, true);
  }

  const HOLD_L = [[12.5, 29], [5.5, 37], [12.5, 21]];
  const HOLD_R = HOLD_L.map(mx);

  /* ---------- сборка в canvas с контуром и светотенью ---------- */
  function render(g) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : g.part[y * W + x]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = at(x, y);
        const nb = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
        let color = null;
        if (!p) {
          if (nb.some(Boolean)) color = K;
        } else if (nb.some((q) => q && q !== p && PARTS[q][0] > PARTS[p][0])) {
          color = K;
        } else if (g.col[y * W + x]) {
          color = g.col[y * W + x];
        } else {
          const [, base, light, shade] = PARTS[p];
          const right = at(x + 1, y) !== p || at(x + 2, y) !== p;
          const bottom = at(x, y + 1) !== p;
          const topLeft = at(x - 1, y) !== p || at(x, y - 1) !== p;
          color = right || bottom ? shade : topLeft ? light : base;
        }
        if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
      }
    }
    return c;
  }

  function build() {
    const frames = {};

    const stand = (blink) => {
      const g = grid();
      legsStand(g);
      upper(g, 0, blink);
      arm(g, ...HOLD_L);
      arm(g, ...HOLD_R);
      return render(g);
    };
    frames.stand = stand(false);
    frames.blink = stand(true);

    const sit = (phase) => {
      const g = grid();
      poly(g, [[10.5, 54], [22, 54], [21, 69], [9.5, 69]], 'legL');
      poly(g, [[22, 54], [33.5, 54], [34.5, 69], [23, 69]], 'legR');
      stamp(g, CROC, 8, 68, 'shoe', CROC_PAL);
      stamp(g, CROC, 23, 68, 'shoe', CROC_PAL, true);
      upper(g, 6, false);
      arm(g, [12.5, 35], [8, 45], [17, phase ? 46 : 48.5]);
      arm(g, mx([12.5, 35]), mx([8, 45]), mx([17, phase ? 48.5 : 46]));
      return render(g);
    };
    frames.sitA = sit(0);
    frames.sitB = sit(1);

    {
      const g = grid();
      legsJump(g);
      upper(g, 0, false);
      arm(g, [12, 28], [6, 18], [8, 8]);
      arm(g, mx([12, 28]), mx([6, 18]), mx([8, 8]));
      frames.jump = render(g);
    }

    const wave = (alt) => {
      const g = grid();
      legsStand(g);
      upper(g, 0, false);
      arm(g, ...HOLD_L);
      arm(g, [31.5, 29], [39, 23], alt ? [40.5, 11] : [37.5, 10]);
      return render(g);
    };
    frames.wave = wave(false);
    frames.wave2 = wave(true);

    return frames;
  }

  /* ---------- иконки интерфейса ---------- */
  const ICONS = {
    star: ['....X....', '...XXX...', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '..XXXXX..', '.XXX.XXX.', '.XX...XX.'],
    bag: ['...XXX...', '..X...X..', 'XXXXXXXXX', 'X.......X', 'XXXXXXXXX', 'X...X...X', 'X.......X', 'X.......X', 'XXXXXXXXX'],
    cap: ['....X....', '..XXXXX..', 'XXXXXXXXX', '..XXXXX.X', '..X...X.X', '..XXXXX.X', '........X'],
    info: ['..XXXXX..', '.XXX.XXX.', 'XXXXXXXXX', 'XXX..XXXX', 'XXXX.XXXX', 'XXXX.XXXX', 'XXX...XXX', '.XXXXXXX.', '..XXXXX..'],
    phone: ['XXX......', 'XXX......', 'XX.......', 'XX.......', '.XX......', '..XX..XXX', '...XXXXXX', '.....XXXX'],
    pin: ['..XXXXX..', '.XX...XX.', 'XX..X..XX', 'XX.XXX.XX', 'XX..X..XX', '.XX...XX.', '..XX.XX..', '...XXX...', '....X....'],
    tg: ['..........XX', '........XXXX', '......XXX.XX', '....XXX..X.X', '..XXX...X..X', 'XXXX...X...X', '..XXX.X...X.', '....XXX..X..', '.....XXXX...', '.....XXX....', '.....XX.....', '.....X......'],
    ig: ['..XXXXXXXX..', '.X........X.', 'X........X.X', 'X...XXXX...X', 'X..X....X..X', 'X..X....X..X', 'X..X....X..X', 'X..X....X..X', 'X...XXXX...X', 'X..........X', '.X........X.', '..XXXXXXXX..'],
    vk: ['X...X..X...X', 'X...X..X..X.', 'X...X..X.X..', '.X.X...XX...', '.X.X...X.X..', '..X....X..X.', '..X....X...X'],
    play: ['X...', 'XX..', 'XXX.', 'XXXX', 'XXX.', 'XX..', 'X...'],
    down: ['XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    check: ['......X', '.....XX', 'X...XX.', 'XX.XX..', '.XXX...', '..X....'],
    pen: ['......XX.', '.....XXXX', '....XXXX.', '...XXXX..', '..XXXX...', '.XXXX....', 'XXXX.....', 'XX.......'],
    code: ['..X...X..', '.X.....X.', 'X...X...X', 'X..X....X', '.X.X...X.', '..X...X..'],
    layers: ['....X....', '..XXXXX..', 'XXXXXXXXX', '..XXXXX..', 'X...X...X', '.XXXXXXX.', '...XXX...'],
    chart: ['.......XX', '.......XX', '....XX.XX', '....XX.XX', '.XX.XX.XX', '.XX.XX.XX', 'XXXXXXXXX'],
    spark: ['....X....', '....X....', '...XXX...', 'XXXXXXXXX', '...XXX...', '....X....', '.X..X....', 'XXX......', '.X.......'],
    link: ['....XXXX.', '...X....X', '..X..X..X', '.X..X..X.', 'X..X..X..', 'X....X...', '.XXXX....'],
    team: ['.XX...XX.', 'XXXX.XXXX', '.XX...XX.', '.........', 'XXXX.XXXX', 'XXXX.XXXX'],
    image: ['XXXXXXXXXXXXXXXX', 'X..............X', 'X..........XX..X', 'X.........XXXX.X', 'X..........XX..X', 'X....X.........X', 'X...XXX........X', 'X..XXXXX...X...X', 'X.XXXXXXX.XXX..X', 'XXXXXXXXXXXXXXXX'],
  };

  // облака: X — основной цвет, L — светлый край, D — тень
  const CLOUDS = [
    [
      '..........LLLLL...........',
      '........LLXXXXXLL.........',
      '...LLLLLXXXXXXXXXL..LLL...',
      '..LXXXXXXXXXXXXXXXLLXXXL..',
      '.LXXXXXXXXXXXXXXXXXXXXXXL.',
      'LXXXXXXXXXXXXXXXXXXXXXXXXL',
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'DDXXXXXXXXXXXXXXXXXXXXXXDD',
      '.DDDDDDDDDDDDDDDDDDDDDDDD.',
    ],
    [
      '.......LLLL.......',
      '.....LLXXXXL......',
      '..LLLXXXXXXXLLL...',
      '.LXXXXXXXXXXXXXL..',
      'LXXXXXXXXXXXXXXXLL',
      'XXXXXXXXXXXXXXXXXX',
      '.DDDDDDDDDDDDDDDD.',
    ],
  ];

  return { W, H, build, ICONS, CLOUDS };
})();
