const photoDialog = document.querySelector('.photo-dialog');
const portraitButton = document.querySelector('.portrait-button');

portraitButton.addEventListener('click', () => photoDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', (event) => {
  const rect = photoDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    photoDialog.close();
  }
});

// The PNG remains the unchanged resting state; moving parts are clipped copies.
const svgNS = 'http://www.w3.org/2000/svg';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const mobileSculptureMode = matchMedia('(max-width:700px)');
const sculptureNames = { piano: 'Клавиши пианино', bible: 'Библия', laptop: 'Ноутбук', brain: 'Мозг', banknote: 'Купюра', memoji: 'Memoji' };
const keyShapes = [
  '468,337 530,291 666,462 681,550 638,682 590,649 479,433',
  '644,196 713,165 875,356 897,457 849,518 784,490 653,280',
  '851,104 936,99 1088,265 1118,363 1064,397 1001,375 862,184'
];
const screenShape = 'M195 147 C380 214 603 267 831 312 Q862 326 850 412 L869 652 Q872 687 828 675 L191 583 Q150 578 164 526 Z';
let sculptureSerial = 0;
function svgNode(name, attrs = {}) {
  const node = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
function makeSculpture(original) {
  const kind = Object.keys(sculptureNames).find(name => original.classList.contains(`sculpture-${name}`));
  const id = `sculpture-${++sculptureSerial}`;
  const svg = svgNode('svg', { viewBox: '0 0 1254 1254', width: '1254', height: '1254', role: 'button', tabindex: '0', 'aria-label': `${sculptureNames[kind]} — анимация` });
  svg.setAttribute('class', `${original.className} interactive-sculpture`);
  const defs = svgNode('defs');
  const motion = svgNode('g');
  const source = original.getAttribute('src');
  const image = () => svgNode('image', { href: source, width: '1254', height: '1254', 'pointer-events': 'none' });
  const base = image();
  svg.append(defs, motion);
  motion.append(base);
  let renderPart = () => {};
  if (kind === 'piano' || kind === 'bible') {
    const mask = svgNode('mask', { id: `${id}-mask`, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '1254', height: '1254' });
    mask.append(svgNode('rect', { width: '1254', height: '1254', fill: 'white' }));
    defs.append(mask);
    base.setAttribute('mask', `url(#${id}-mask)`);
    if (kind === 'piano') {
      const parts = keyShapes.map((points, index) => {
        const clip = svgNode('clipPath', { id: `${id}-key-${index}` });
        clip.append(svgNode('polygon', { points }));
        defs.append(clip);
        const hole = svgNode('polygon', { points, fill: 'black', opacity: '0' });
        mask.append(hole);
        const under = svgNode('polygon', { points, fill: '#e5d9c3', opacity: '0' });
        motion.insertBefore(under, base);
        const moving = svgNode('g', { opacity: '0' });
        const crop = svgNode('g', { 'clip-path': `url(#${id}-key-${index})` });
        crop.append(image()); moving.append(crop); motion.append(moving);
        return { hole, under, moving };
      });
      renderPart = (progress) => parts.forEach(({hole, under, moving}, index) => {
        const local = (progress - index * .22) / .38;
        const press = local > 0 && local < 1 ? Math.sin(Math.PI * local) ** 2 : 0;
        hole.setAttribute('opacity', press > .001 ? '1' : '0');
        under.setAttribute('opacity', press > .001 ? '1' : '0');
        moving.setAttribute('opacity', press > .001 ? '1' : '0');
        moving.setAttribute('transform', `translate(${press * 3} ${press * 18}) translate(0 320) skewX(${press * .7}) scale(1 ${1 - press * .018}) translate(0 -320)`);
        moving.style.filter = press > .001 ? `brightness(${1 - press * .13}) drop-shadow(0 ${press * 4}px ${press * 3}px #241c2480)` : '';
      });
    } else {
      // Project both covers around one fixed spine, never cut the PNG texture.
      const hinge = { x: 275, y: 190, nx: .98387, ny: -.178885, vx: .178885, vy: .98387 };
      const opened = svgNode('g', { opacity: '0', 'pointer-events': 'none' });
      const spread = svgNode('g', { transform: `matrix(${hinge.nx} ${hinge.ny} ${hinge.vx} ${hinge.vy} ${hinge.x} ${hinge.y})` });
      const backCover = svgNode('path', { fill: '#4b2334', stroke: '#a57a66', 'stroke-width': '9', 'stroke-linejoin': 'round' });
      const frontCover = image();
      const paperGradient = svgNode('linearGradient', { id: `${id}-paper`, x1: '0', y1: '0', x2: '1', y2: '0' });
      paperGradient.append(svgNode('stop', { offset: '0', 'stop-color': '#bb9665' }), svgNode('stop', { offset: '.18', 'stop-color': '#eedfc3' }), svgNode('stop', { offset: '1', 'stop-color': '#f4e8d0' })); defs.append(paperGradient);
      const leftPages = svgNode('path', { fill: `url(#${id}-paper)`, stroke: '#d3bb95', 'stroke-width': '3' });
      const rightPages = svgNode('path', { fill: `url(#${id}-paper)`, stroke: '#d3bb95', 'stroke-width': '3' });
      const pageEdges = svgNode('g', { fill: 'none', stroke: '#97754d', 'stroke-width': '1.5', opacity: '.28' });
      const edgeLines = Array.from({length: 12}, () => { const path = svgNode('path'); pageEdges.append(path); return path; });
      const gradient = svgNode('radialGradient', { id: `${id}-warm` });
      gradient.append(svgNode('stop', { offset: '0', 'stop-color': '#fff4cf', 'stop-opacity': '.9' }), svgNode('stop', { offset: '1', 'stop-color': '#ffd79c', 'stop-opacity': '0' })); defs.append(gradient);
      const glow = svgNode('ellipse', { cx: '0', cy: '435', rx: '165', ry: '370', fill: `url(#${id}-warm)`, opacity: '0' });
      const crease = svgNode('path', { d: 'M0 24 Q-16 430 0 830', fill: 'none', stroke: '#a57d53', 'stroke-width': '5', opacity: '.45' });
      spread.append(backCover);
      opened.append(spread, frontCover);
      const pages = svgNode('g', { transform: spread.getAttribute('transform') });
      pages.append(leftPages, rightPages, pageEdges, crease, glow); opened.append(pages);
      motion.append(opened);
      renderPart = (progress) => {
        const open = Math.sin(Math.PI * progress) ** 2;
        const visible = open > .001;
        base.setAttribute('opacity', visible ? '0' : '1');
        opened.setAttribute('opacity', visible ? '1' : '0');
        // A perspective projection whose complete spine axis stays fixed.
        const projection = 1 - open * .48;
        const k = projection - 1;
        const aa = 1 + k * hinge.nx * hinge.nx;
        const bb = k * hinge.nx * hinge.ny;
        const dd = 1 + k * hinge.ny * hinge.ny;
        frontCover.setAttribute('transform', `matrix(${aa} ${bb} ${bb} ${dd} ${hinge.x - aa * hinge.x - bb * hinge.y} ${hinge.y - bb * hinge.x - dd * hinge.y})`);
        const left = open * 295;
        const right = open * 430;
        backCover.setAttribute('d', `M0 0 Q${-left * .6} -35 ${-left} -22 L${-left} 800 Q${-left * .5} 790 0 850 Z`);
        leftPages.setAttribute('d', `M0 24 Q${-left * .5} -4 ${-left * .94} 4 L${-left * .94} 770 Q${-left * .5} 758 0 830 Z`);
        rightPages.setAttribute('d', `M0 24 Q${right * .45} -12 ${right} -15 L${right + open * 30} 754 Q${right * .5} 780 0 830 Z`);
        pages.setAttribute('opacity', Math.min(1, open * 2));
        edgeLines.forEach((line, index) => {
          const y = 755 + index * 5;
          line.setAttribute('d', `M${-left * .93} ${y - 25} Q${-left * .45} ${y - 35} 0 ${y + 42} Q${right * .45} ${y + 6} ${right + open * 29} ${y - 42}`);
        });
        glow.setAttribute('opacity', open ** 2 * .7);
      };
    }
  }
  if (kind === 'laptop') {
    const clip = svgNode('clipPath', { id: `${id}-screen` }); clip.append(svgNode('path', { d: screenShape })); defs.append(clip);
    const gradient = svgNode('radialGradient', { id: `${id}-light` });
    gradient.append(svgNode('stop', { offset: '0', 'stop-color': '#b3a0d5', 'stop-opacity': '.7' }), svgNode('stop', { offset: '1', 'stop-color': '#6b578e', 'stop-opacity': '.14' })); defs.append(gradient);
    const screen = svgNode('g', { 'clip-path': `url(#${id}-screen)`, opacity: '0', 'pointer-events': 'none' });
    screen.append(svgNode('path', { d: screenShape, fill: `url(#${id}-light)` }));
    const text = svgNode('text', { x: '0', y: '0', 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#f2edf8', 'font-family': 'Arial, sans-serif', 'font-size': '95', 'font-weight': '500', 'letter-spacing': '-4', transform: 'matrix(1 .2 -.08 .92 508 425)' });
    text.textContent = 'прив'; screen.append(text); motion.append(screen);
    renderPart = (progress) => { screen.setAttribute('opacity', Math.sin(Math.PI * progress) ** 2); };
  }
  let wrinkleAmount, paperWarp;
  if (kind === 'banknote') {
    const filter = svgNode('filter', { id: `${id}-wrinkles`, x: '-5%', y: '-5%', width: '110%', height: '110%', 'color-interpolation-filters': 'sRGB' });
    filter.append(svgNode('feTurbulence', { type: 'fractalNoise', baseFrequency: '.009 .017', numOctaves: '2', seed: '3', result: 'creases' }));
    wrinkleAmount = svgNode('feDisplacementMap', { in: 'SourceGraphic', in2: 'creases', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' });
    filter.append(wrinkleAmount); defs.append(filter);
    paperWarp = svgNode('g');
    motion.insertBefore(paperWarp, base); paperWarp.append(base);
  }
  // A silhouette hit area avoids rectangular transparent PNG margins stealing taps.
  const hit = svgNode('path', { class: 'sculpture-hit-area', fill: 'transparent', d: '' }); svg.append(hit);
  const decoded = new Image();
  decoded.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(decoded, 0, 0, 96, 96);
    const pixels = context.getImageData(0, 0, 96, 96).data;
    const left = [], right = [];
    for (let y = 0; y < 96; y++) {
      let start = -1, end = -1;
      for (let x = 0; x < 96; x++) if (pixels[(y * 96 + x) * 4 + 3] > 40) { if (start < 0) start = x; end = x; }
      if (start >= 0) { left.push([start * 1254 / 96, y * 1254 / 96]); right.push([(end + 1) * 1254 / 96, (y + 1) * 1254 / 96]); }
    }
    hit.setAttribute('d', [...left, ...right.reverse()].map((point, index) => `${index ? 'L' : 'M'}${point.join(' ')}`).join(' ') + 'Z');
  };
  decoded.src = source;
  let running = false;
  function play() {
    if (running || (kind === 'bible' && mobileSculptureMode.matches)) return;
    running = true;
    svg.dataset.animating = 'true';
    const duration = reducedMotion.matches ? 140 : kind === 'memoji' ? 600 : kind === 'bible' ? 900 : 850;
    const start = performance.now();
    const frame = (time) => {
      const progress = kind === 'bible' && mobileSculptureMode.matches ? 1 : Math.min(1, (time - start) / duration);
      const pulse = Math.sin(Math.PI * progress) ** 2;
      renderPart(progress);
      if (!reducedMotion.matches) {
        if (kind === 'brain') {
          const think = Math.sin(Math.PI * progress * 2) ** 2;
          motion.setAttribute('transform', `translate(627 627) scale(${1 + think * .035} ${1 - think * .016}) translate(-627 -627)`);
        } else if (kind === 'banknote') {
          motion.setAttribute('transform', `translate(627 627) rotate(${pulse * -3}) skewX(${pulse * 3}) scale(${1 - pulse * .085} ${1 - pulse * .055}) translate(-627 -627)`);
          base.style.filter = `contrast(${1 + pulse * .12})`;
          wrinkleAmount.setAttribute('scale', pulse * 20);
          if (pulse > .001) paperWarp.setAttribute('filter', `url(#${id}-wrinkles)`); else paperWarp.removeAttribute('filter');
        } else if (kind === 'memoji') {
          motion.setAttribute('transform', `translate(627 710) rotate(${pulse * -4}) scale(${1 + pulse * .035}) translate(-627 -710)`);
        }
      }
      if (progress < 1) requestAnimationFrame(frame);
      else { motion.removeAttribute('transform'); base.style.filter = ''; if (wrinkleAmount) { wrinkleAmount.setAttribute('scale', '0'); paperWarp.removeAttribute('filter'); } renderPart(0); running = false; svg.dataset.animating = 'false'; }
    };
    requestAnimationFrame(frame);
  }
  const onHover = event => { if (desktopPointer.matches && event.pointerType === 'mouse') play(); };
  svg.addEventListener('pointerenter', onHover);
  hit.addEventListener('pointerenter', onHover);
  let touchStart;
  svg.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') touchStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  svg.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse' && touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) < 12) play();
    touchStart = undefined;
  }, { passive: true });
  svg.addEventListener('pointercancel', () => { touchStart = undefined; });
  svg.addEventListener('keydown', event => { if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); play(); } });
  original.replaceWith(svg);
}
document.querySelectorAll('img.sculpture').forEach(makeSculpture);
document.querySelector('.sculptures').removeAttribute('aria-hidden');

const cursor = document.createElement('div');
cursor.className = 'editorial-cursor'; cursor.setAttribute('aria-hidden', 'true');
const cursorDot = document.createElement('span'), cursorRing = document.createElement('span');
cursorDot.className = 'editorial-cursor-dot'; cursorRing.className = 'editorial-cursor-ring';
cursor.append(cursorDot, cursorRing); document.body.append(cursor);
let cursorX = 0, cursorY = 0, ringX = 0, ringY = 0, cursorFrame = 0, cursorInitialized = false;
function followCursor() {
  const amount = reducedMotion.matches ? 1 : .28;
  ringX += (cursorX - ringX) * amount; ringY += (cursorY - ringY) * amount;
  cursorRing.style.transform = `translate3d(${ringX}px,${ringY}px,0)`;
  cursorFrame = Math.hypot(cursorX - ringX, cursorY - ringY) > .15 ? requestAnimationFrame(followCursor) : 0;
}
function syncCursorMode() {
  document.documentElement.classList.toggle('has-editorial-cursor', desktopPointer.matches);
  if (!desktopPointer.matches) cursor.classList.remove('is-visible');
}
syncCursorMode(); desktopPointer.addEventListener('change', syncCursorMode);
document.addEventListener('pointermove', event => {
  if (!desktopPointer.matches || event.pointerType !== 'mouse') return;
  cursorX = event.clientX; cursorY = event.clientY;
  if (!cursorInitialized) { ringX = cursorX; ringY = cursorY; cursorInitialized = true; }
  cursorDot.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
  cursor.classList.add('is-visible');
  cursor.classList.toggle('is-interactive', Boolean(event.target.closest('a, button, [role="button"], input, textarea, select')));
  if (!cursorFrame) cursorFrame = requestAnimationFrame(followCursor);
}, { passive: true });
document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'), { passive: true });
document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'), { passive: true });
document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
window.addEventListener('blur', () => cursor.classList.remove('is-visible'));
// Keep the cursor visible inside the photo dialog's browser top layer too.
new MutationObserver(() => (photoDialog.open ? photoDialog : document.body).append(cursor)).observe(photoDialog, { attributes: true, attributeFilter: ['open'] });

// Mobile focus follows the single card nearest the viewport's central zone.
const mobileCases = matchMedia('(max-width: 700px)');
const caseCards = [...document.querySelectorAll('.case-cover')];
let caseFocusFrame = 0;
function setMobileCaseFocus(card) {
  for (const item of caseCards) item.classList.toggle('is-revealed', item === card);
}
function updateMobileCaseFocus() {
  caseFocusFrame = 0;
  if (!mobileCases.matches) { setMobileCaseFocus(null); return; }
  const height = window.visualViewport?.height ?? window.innerHeight;
  const top = window.visualViewport?.offsetTop ?? 0;
  const center = top + height / 2;
  const radius = height * .15;
  const candidates = caseCards.map(card => {
    const rect = card.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    return { card, rect, middle, distance: Math.abs(middle - center) };
  }).filter(item => item.rect.height > 0 && item.rect.bottom > top && item.rect.top < top + height && item.distance <= radius);
  candidates.sort((a, b) => a.distance - b.distance);
  let active = candidates[0];
  if (active) {
    // Equal-height neighbours share one vertical centre. Split their common
    // focus interval in reading order, so each participates in both directions.
    const peers = candidates.filter(item => Math.abs(item.middle - active.middle) < 1).sort((a,b) => a.rect.left - b.rect.left);
    const progress = Math.max(0, Math.min(.999, (center - active.middle + radius) / (2 * radius)));
    active = peers[Math.floor(progress * peers.length)];
  }
  setMobileCaseFocus(active?.card ?? null);
}
function scheduleMobileCaseFocus() {
  if (!caseFocusFrame) caseFocusFrame = requestAnimationFrame(updateMobileCaseFocus);
}
window.addEventListener('scroll', scheduleMobileCaseFocus, { passive: true });
window.addEventListener('resize', scheduleMobileCaseFocus, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleMobileCaseFocus, { passive: true });
window.visualViewport?.addEventListener('scroll', scheduleMobileCaseFocus, { passive: true });
window.addEventListener('pageshow', scheduleMobileCaseFocus);
window.addEventListener('load', scheduleMobileCaseFocus);
mobileCases.addEventListener('change', scheduleMobileCaseFocus);
scheduleMobileCaseFocus();
