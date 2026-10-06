// Two deliberate photo arrangements, sharing the same originals and grid.
const photoTile = document.querySelector('.vk-photo-tile');
const photoFigures = [...photoTile.querySelectorAll('figure')];
const narrowPhotos = matchMedia('(max-width: 700px)');
function arrangePhotos() {
  const groups = narrowPhotos.matches ? [[1, 3, 4], [0, 2, 5, 6, 7]] : [[1, 3], [4, 2, 5], [0, 6, 7]];
  const columns = groups.map(group => {
    const column = document.createElement('div');
    column.className = 'vk-photo-column';
    for (const id of group) column.append(photoFigures.find(figure => Number(figure.dataset.photo) === id));
    return column;
  });
  photoTile.replaceChildren(...columns);
}
arrangePhotos();
narrowPhotos.addEventListener('change', arrangePhotos);
