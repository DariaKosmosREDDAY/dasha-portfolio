const themeButton = document.querySelector('.theme-button');
const themeColor = document.querySelector('meta[name="theme-color"]');
themeButton.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? 'Включить светлый фон' : 'Включить тёмный фон');
  themeColor.setAttribute('content', isDark ? '#29252f' : '#e5d7d1');
});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
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
