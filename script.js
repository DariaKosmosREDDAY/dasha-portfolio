const themeButton = document.querySelector('.theme-button');
const themeColor = document.querySelector('meta[name="theme-color"]');
const photoDialog = document.querySelector('.photo-dialog');
const portraitButton = document.querySelector('.portrait-button');

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? 'Включить светлый фон' : 'Включить тёмный фон');
  themeColor.setAttribute('content', isDark ? '#242520' : '#edece6');
}

try {
  applyTheme(localStorage.getItem('daria-portfolio-theme') || 'light');
} catch {
  applyTheme('light');
}

themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('daria-portfolio-theme', theme); } catch { /* Works without browser storage too. */ }
});

portraitButton.addEventListener('click', () => photoDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', (event) => {
  const rect = photoDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    photoDialog.close();
  }
});
