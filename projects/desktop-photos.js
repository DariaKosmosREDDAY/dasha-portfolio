// Closed editorial modules: source-ratio stacks share a common bottom edge.
// Originals return to their anchors before the separate mobile layout takes over.
const desktopPhotoMode = matchMedia('(min-width:701px)');
const desktopModules = [];
function photoModule(selector, bands) {
  const sources = [...document.querySelectorAll(selector)];
  const figures = sources.flatMap(source => [...source.querySelectorAll('figure')]);
  if (!figures.length) return;
  const used = bands.flat(2);
  if (used.length !== figures.length || new Set(used).size !== figures.length) throw new Error('Incomplete photo module');
  const anchors = figures.map(figure => { const anchor = document.createComment('original photo location'); figure.before(anchor); return anchor; });
  const tile = document.createElement('div'); tile.className = 'desktop-photo-module'; tile.hidden = true; sources[0].before(tile);
  const rows = bands.map(columns => {
    const row = document.createElement('div'); row.className = 'desktop-photo-band';
    const stacks = columns.map(indices => { const node = document.createElement('div'); node.className = 'desktop-photo-stack'; row.append(node); return { node, indices }; });
    tile.append(row); return { row, stacks };
  });
  desktopModules.push({ sources, figures, anchors, tile, rows });
}
const opening = '.case-opening-group .case-photo-grid';
const remaining = '.case-photo-grid:not(.case-opening-group .case-photo-grid)';
if (document.body.classList.contains('vkmail-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule('.vk-photo-tile,.additional-materials', [[[0],[2],[1,3,4]],[[5],[6,7],[8,9]],[[10],[11],[12],[13,14,15]]]);
} else if (document.body.classList.contains('happynewfuture-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule(remaining, [[[0,2],[1]],[[3],[4,5]],[[6],[7],[8]],[[9],[10],[11]],[[12],[13]],[[14],[15,16]]]);
} else if (document.body.classList.contains('roche-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule(remaining, [[[0],[1]],[[2],[3,4]],[[5],[6,7]]]);
} else if (document.body.classList.contains('siburvkus-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule(remaining, [[[0],[1]],[[2],[3]]]);
} else if (document.body.classList.contains('turvsibur-case')) {
  // Keep the strong metro anchor; its companion remains a full, uncropped frame.
  photoModule(remaining, [[[0],[1],[2]],[[3],[4]]]);
} else if (document.body.classList.contains('beeline-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule(remaining, [[[0],[1,3]],[[2],[4,5]]]);
} else if (document.body.classList.contains('ultimamarket-case')) {
  photoModule(opening, [[[0],[1,2]]]);
  photoModule(remaining, [[[0],[1],[2]],[[3],[4],[5]]]);
} else if (document.body.classList.contains('cian-case')) {
  photoModule('.cian-opening', [[[0],[1],[2],[3]]]);
  photoModule('.case-photo-grid', [[[0],[1],[2]],[[3],[4],[5]]]);
}
function fitDesktopModules() {
  if (!desktopPhotoMode.matches) return;
  for (const { figures, rows } of desktopModules) for (const { row, stacks } of rows) {
    const gap = parseFloat(getComputedStyle(row).columnGap);
    const coefficients = stacks.map(({ indices }) => indices.reduce((sum,index) => {
      const img = figures[index].querySelector('img'); return sum + Number(img.getAttribute('height')) / Number(img.getAttribute('width'));
    },0));
    const usable = row.clientWidth - gap * (stacks.length - 1);
    const height = (usable + stacks.reduce((sum,stack,index) => sum + gap * (stack.indices.length - 1) / coefficients[index],0)) / coefficients.reduce((sum,value) => sum + 1 / value,0);
    row.style.gridTemplateColumns = stacks.map((stack,index) => `${Math.max(1,(height-gap*(stack.indices.length-1))/coefficients[index])}px`).join(' ');
  }
}
function arrangeDesktopModules() {
  for (const { sources, figures, anchors, tile, rows } of desktopModules) {
    sources.forEach(source => source.classList.toggle('desktop-photo-source',desktopPhotoMode.matches));
    tile.hidden = !desktopPhotoMode.matches;
    if (desktopPhotoMode.matches) {
      for (const { stacks } of rows) for (const { node, indices } of stacks) for (const index of indices) node.append(figures[index]);
    } else figures.forEach((figure,index) => anchors[index].after(figure));
  }
  fitDesktopModules();
}
// Mobile restores its originals first when returning to desktop.
if (desktopPhotoMode.matches) queueMicrotask(arrangeDesktopModules);
desktopPhotoMode.addEventListener('change', () => {
  if (desktopPhotoMode.matches) queueMicrotask(arrangeDesktopModules);
  else arrangeDesktopModules();
});
new ResizeObserver(fitDesktopModules).observe(document.querySelector('.case-shell'));
