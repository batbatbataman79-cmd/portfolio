/*
 * Пиксельные спрайты персонажа и иконок.
 * Каждый символ — один пиксель, '.' — прозрачный.
 * Все кадры персонажа 20×32, ноги — на нижней строке.
 */
window.PIXEL_SPRITES = (() => {
  const PAL = {
    K: '#1a1226', // контур
    H: '#3a2418', // волосы
    h: '#5c3a26', // блик на волосах
    S: '#f2b98f', // кожа
    s: '#d48f6a', // тень кожи
    B: '#7a4527', // борода
    b: '#4a2a18', // брови
    E: '#22140f', // глаза
    W: '#ffffff', // зубы
    M: '#9b2f2f', // уголки рта
    U: '#1f63e0', // худи
    u: '#1647a6', // тень худи
    L: '#5a93ff', // блик худи
    J: '#1c1c24', // джинсы
    j: '#3a3a48', // блик джинсов
    Y: '#ffd21f', // кроксы
    y: '#e0a800', // тень кроксов
    O: '#a87a00', // дырочки кроксов
  };

  // Голова + капюшон вокруг шеи (16 px в ширину)
  const HEAD = [
    '....KKKKKKKK....',
    '...KHHhHHHhHK...',
    '..KHHHHhHHHHHK..',
    '..KHHHHHHHHHHK..',
    '..KHHSSSSSSHHK..',
    '..KHbbSSSSbbHK..',
    '..KSSESSSSESSK..',
    '.KsSSSSssSSSSsK.',
    '..KBSSSSSSSSBK..',
    '..KBBBBBBBBBBK..',
    '..KBBMWWWWMBBK..',
    '..KBBBBBBBBBBK..',
    '.KUKBBBBBBBBKUK.',
    'KULUKBBBBBBKULUK',
    'KUULUKKKKKKULUUK',
  ];

  const STAND_BODY = [
    'KUUUUUUUUUUUUUUK',
    'KUUUUUUUUUUUUUUK',
    'KULKUUUUUUUUKLUK',
    'KULKUUUUUUUUKLUK',
    'KUuKUUUUUUUUKuUK',
    'KUuKuUUUUUUuKuUK',
    'KUuKuuuuuuuuKuUK',
    'KUuKUUUUUUUUKuUK',
    'KSsKuuuuuuuuKsSK',
    '.KK.KKKKKKKK.KK.',
    '...KJJJjjJJJK...',
    '...KJJJKKJJJK...',
    '...KJjJKKJjJK...',
    '...KJjJKKJjJK...',
    '..KYYYYKKYYYYK..',
    '..KYOYyKKyYOYK..',
    '..KKKKKKKKKKKK..',
  ];

  const pad = (r) => '..' + r + '..';
  const E16 = '................';

  const stand = [...HEAD, ...STAND_BODY].map(pad);
  const blink = stand.slice();
  blink[6] = pad('..KSSsSSSSsSSK..');

  // Сидит за столом, руки на клавиатуре (два кадра печати)
  const sitTop = [
    E16, E16, E16,
    ...HEAD,
    'KUUUUUUUUUUUUUUK',
    'KULKUUUUUUUUKLUK',
    'KUuKUUUUUUUUKuUK',
  ];
  const sitBottom = [
    'KuuuuuuuuuuuuuuK',
    'KKKKKKKKKKKKKKKK',
    '.KJJJJJJJJJJJJK.',
    '.KJjJJJKKJJJjJK.',
    '..KJJJK..KJJJK..',
    '..KJjJK..KJjJK..',
    '.KYYYYK..KYYYYK.',
    '.KYOYyK..KyYOYK.',
    '.KKKKKK..KKKKKK.',
  ];
  const sitA = [...sitTop, 'KSSKUUUUUUUUKuUK', '.KK.KuuuuuuKKSSK', ...sitBottom].map(pad);
  const sitB = [...sitTop, 'KUuKUUUUUUUUKSSK', 'KSSKKuuuuuuK.KK.', ...sitBottom].map(pad);

  // Прыжок: руки вверх, ноги поджаты
  const E20 = '....................';
  const jump = [
    '......KKKKKKKK......',
    '.....KHHhHHHhHK.....',
    '....KHHHHhHHHHHK....',
    '....KHHHHHHHHHHK....',
    '.KK.KHHSSSSSSHHK.KK.',
    'KSSKKHbbSSSSbbHKKSSK',
    'KSSKKSSESSSSESSKKSSK',
    'KUUKsSSSSssSSSSsKUUK',
    '.KUUKBSSSSSSSSBKUUK.',
    '..KUKBBBBBBBBBBKUK..',
    '..KUKBBMWWWWMBBKUK..',
    '..KUKBBBBBBBBBBKUK..',
    '..KUUKBBBBBBBBKUUK..',
    '..KULUKBBBBBBKULUK..',
    '..KUULUKKKKKKULUUK..',
    '...KUUUUUUUUUUUUK...',
    '...KUUUUUUUUUUUUK...',
    '...KUuUUUUUUUUuUK...',
    '...KUuUUUUUUUUuUK...',
    '...KUuuuuuuuuuuUK...',
    '...KUUUUUUUUUUUUK...',
    '...KuuuuuuuuuuuuK...',
    '...KKKKKKKKKKKKKK...',
    '...KJJJJJKKJJJJJK...',
    '..KJJjJJK..KJJjJJK..',
    '.KJJJJK......KJJJJK.',
    '.KYYYYK......KYYYYK.',
    'KYOYyYK......KYyYOYK',
    'KKKKKKK......KKKKKKK',
    E20, E20, E20,
  ];

  // Машет рукой (для финального экрана)
  const wave = stand.slice();
  Object.assign(wave, {
    8:  '....KBSSSSSSSSBK.KK.',
    9:  '....KBBBBBBBBBBKKSSK',
    10: '....KBBMWWWWMBBKKSSK',
    11: '....KBBBBBBBBBBK.KUK',
    12: '...KUKBBBBBBBBKUKKUK',
    13: '..KULUKBBBBBBKULUKUK',
    14: '..KUULUKKKKKKULUUUUK',
    15: '..KUUUUUUUUUUUUUUUK.',
    16: '..KUUUUUUUUUUUUKKK..',
  });
  // убираем опущенную правую руку
  for (let row = 17; row <= 24; row++) wave[row] = wave[row].slice(0, 15) + '.....';

  // Иконки для интерфейса
  const ICONS = {
    star: [
      '...X...',
      '...X...',
      '..XXX..',
      'XXXXXXX',
      '.XXXXX.',
      '..XXX..',
      '.XX.XX.',
      'X.....X',
    ],
    heart: [
      '.XX.XX.',
      'XXXXXXX',
      'XXXXXXX',
      '.XXXXX.',
      '..XXX..',
      '...X...',
    ],
    play: [
      'X...',
      'XX..',
      'XXX.',
      'XXXX',
      'XXX.',
      'XX..',
      'X...',
    ],
    down: [
      'XXXXXXX',
      '.XXXXX.',
      '..XXX..',
      '...X...',
    ],
    check: [
      '......X',
      '.....XX',
      'X...XX.',
      'XX.XX..',
      '.XXX...',
      '..X....',
    ],
    tg: [
      '..........XX',
      '........XXXX',
      '......XXX.XX',
      '....XXX..X.X',
      '..XXX...X..X',
      'XXXX...X...X',
      '..XXX.X...X.',
      '....XXX..X..',
      '.....XXXX...',
      '.....XXX....',
      '.....XX.....',
      '.....X......',
    ],
    ig: [
      '..XXXXXXXX..',
      '.X........X.',
      'X........X.X',
      'X...XXXX...X',
      'X..X....X..X',
      'X..X....X..X',
      'X..X....X..X',
      'X..X....X..X',
      'X...XXXX...X',
      'X..........X',
      '.X........X.',
      '..XXXXXXXX..',
    ],
    vk: [
      '..............',
      'X...X..X...X..',
      'X...X..X..X...',
      'X...X..X.X....',
      '.X.X...XX.....',
      '.X.X...X.X....',
      '..X....X..X...',
      '..X....X...X..',
      '..............',
    ],
    image: [
      'XXXXXXXXXXXXXXXX',
      'X..............X',
      'X..........XX..X',
      'X.........XXXX.X',
      'X..........XX..X',
      'X....X.........X',
      'X...XXX........X',
      'X..XXXXX...X...X',
      'X.XXXXXXX.XXX..X',
      'XXXXXXXXXXXXXXXX',
    ],
  };

  return { PAL, SPRITES: { stand, blink, sitA, sitB, jump, wave }, ICONS };
})();
