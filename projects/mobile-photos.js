// Deliberate mobile bands; desktop figures return to their original locations.
const mobilePhotoMode = matchMedia('(max-width:700px)');
const pageBody = document.body;
const arrangements = [];
function tileSources(selector, bands) {
  const sources = [...document.querySelectorAll(selector)];
  const figures = sources.flatMap(source => [...source.querySelectorAll('figure')]);
  if (!figures.length) return;
  const anchors = figures.map(figure => {
    const anchor = document.createComment('desktop photo position');
    figure.before(anchor); return anchor;
  });
  const tile = document.createElement('div'); tile.className = 'mobile-photo-tile';
  sources[0].before(tile);
  const rows = bands.map(columns => {
    const row = document.createElement('div'); row.className = 'mobile-photo-band';
    const stacks = columns.map(indices => {
      const stack = document.createElement('div'); stack.className = 'mobile-photo-stack';
      return { stack, indices };
    });
    row.append(...stacks.map(item => item.stack)); tile.append(row);
    return { row, stacks };
  });
  const decorations = sources.flatMap(source => [...source.querySelectorAll('.case-sticker')]).map(node => {
    const anchor = document.createComment('desktop sticker position'); node.before(anchor); return { node, anchor };
  });
  arrangements.push({ sources, figures, anchors, tile, rows, decorations });
}
if (pageBody.classList.contains('turvsibur-case')) {
  tileSources('.case-photo-grid:not(.case-opening-group .case-photo-grid)', [[[0],[1]], [[2]], [[3],[4]]]);
} else if (pageBody.classList.contains('siburvkus-case')) {
  tileSources('.case-opening-group .case-photo-grid', [[[0]], [[1],[2]]]);
  tileSources('.case-photo-grid:not(.case-opening-group .case-photo-grid)', [[[0],[1]], [[2],[3]]]);
} else if (pageBody.classList.contains('beeline-case')) {
  tileSources('.case-opening-group .case-photo-grid', [[[0]], [[1],[2]]]);
  tileSources('.case-photo-grid:not(.case-opening-group .case-photo-grid)', [[[0],[1,3]], [[2],[4,5]]]);
} else if (pageBody.classList.contains('happynewfuture-case')) {
  tileSources('.case-opening-group .case-photo-grid', [[[0]], [[1],[2]]]);
  // Three complete bands, mixing the live programme and its physical details.
  tileSources('.case-photo-grid:not(.case-opening-group .case-photo-grid)', [[[0],[1]], [[2],[3]], [[4],[5]], [[6],[7]], [[8],[9]], [[10],[11]], [[12],[13]], [[14],[15]], [[16]]]);
} else if (pageBody.classList.contains('roche-case')) {
  tileSources('.case-opening-group .case-photo-grid', [[[0]], [[1],[2]]]);
  tileSources('.additional-materials', [[[0]], [[1],[2]]]);
} else if (pageBody.classList.contains('split-case')) {
  tileSources('.opening-photos', [[[0],[1]]]);
  tileSources('.mechanics-photos', [[[0],[1,2]]]);
  tileSources('.zoo-photos', [[[0],[1]], [[2]]]);
} else if (pageBody.classList.contains('cian-case')) {
  tileSources('.cian-opening', [[[0],[1]], [[2],[3]]]);
  tileSources('.case-photo-grid', [[[0],[1]], [[2],[3]], [[4],[5]]]);
} else if (pageBody.classList.contains('ultimamarket-case')) {
  tileSources('.additional-materials', [[[0],[1]]]);
} else if (pageBody.classList.contains('vkmail-case')) {
  tileSources('.vk-photo-tile', [[[1,3,4],[0,2,5,6,7]]]);
  tileSources('.additional-materials', [[[0],[1]], [[2],[3]], [[4],[5]], [[6],[7]]]);
}
function fitPhotoBands() {
  if (!mobilePhotoMode.matches) return;
  for (const arrangement of arrangements) {
    for (const { row, stacks } of arrangement.rows) {
      if (stacks.length !== 2) continue;
      const coefficients = stacks.map(({ indices }) => indices.reduce((sum, index) => {
        const image = arrangement.figures[index].querySelector('img');
        return sum + Number(image.dataset.sourceRatio);
      }, 0));
      const gap = parseFloat(getComputedStyle(row).columnGap);
      const available = row.clientWidth - gap;
      const left = (available * coefficients[1] + gap * (stacks[1].indices.length - stacks[0].indices.length)) / (coefficients[0] + coefficients[1]);
      row.style.gridTemplateColumns = `${left}px minmax(0,1fr)`;
    }
  }
}
function arrangeMobilePhotos() {
  for (const arrangement of arrangements) {
    const { sources, figures, anchors, tile, rows, decorations } = arrangement;
    sources.forEach(source => source.classList.toggle('mobile-photo-source', mobilePhotoMode.matches));
    tile.hidden = !mobilePhotoMode.matches;
    if (mobilePhotoMode.matches) {
      decorations.forEach(({ node }) => tile.append(node));
      for (const { stacks } of rows) for (const { stack, indices } of stacks) {
        for (const index of indices) stack.append(figures[index]);
      }
    } else {
      figures.forEach((figure,index) => anchors[index].after(figure));
      decorations.forEach(({ node, anchor }) => anchor.after(node));
    }
  }
  fitPhotoBands();
}
// Ratios come from source attributes, independent of lazy loading or viewport.
for (const arrangement of arrangements) for (const figure of arrangement.figures) {
  const img = figure.querySelector('img');
  img.dataset.sourceRatio = Number(img.getAttribute('height')) / Number(img.getAttribute('width'));
}
arrangeMobilePhotos();
mobilePhotoMode.addEventListener('change', arrangeMobilePhotos);
new ResizeObserver(fitPhotoBands).observe(document.querySelector('.case-shell'));
