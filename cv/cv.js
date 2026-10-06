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

// Same two soft pulses, amplitude and timing as the hero brain.
const cvBrain = document.querySelector('.cv-hero-object');
const cvBrainImage = cvBrain.querySelector('img');
let cvBrainRunning = false, cvBrainTouch;
function playCvBrain() {
  if (cvBrainRunning || reducedMotion.matches) return;
  cvBrainRunning = true;
  const start = performance.now();
  function frame(time) {
    const progress = Math.min(1,(time-start)/850);
    const think = Math.sin(Math.PI*progress*2)**2;
    cvBrainImage.style.transform = `rotate(-12deg) scale(${1+think*.035},${1-think*.016})`;
    if (progress < 1) requestAnimationFrame(frame);
    else { cvBrainImage.style.transform = ''; cvBrainRunning = false; }
  }
  requestAnimationFrame(frame);
}
cvBrain.addEventListener('pointerenter', event => { if (desktopPointer.matches && event.pointerType === 'mouse') playCvBrain(); });
cvBrain.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') cvBrainTouch = {x:event.clientX,y:event.clientY}; },{passive:true});
cvBrain.addEventListener('pointerup', event => {
  if (event.pointerType !== 'mouse' && cvBrainTouch && Math.hypot(event.clientX-cvBrainTouch.x,event.clientY-cvBrainTouch.y)<12) playCvBrain();
  cvBrainTouch = undefined;
},{passive:true});
cvBrain.addEventListener('pointercancel', () => { cvBrainTouch = undefined; });
cvBrain.addEventListener('keydown', event => { if (!event.repeat && ['Enter',' '].includes(event.key)) { event.preventDefault(); playCvBrain(); } });
