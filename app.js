const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const compactHeader = matchMedia('(max-width: 760px)');

function setMenu(open) {
  menuButton.hidden = !compactHeader.matches;
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.hidden = compactHeader.matches && !open;
}

setMenu(false);
compactHeader.addEventListener('change', () => setMenu(false));
menuButton.addEventListener('click', () => setMenu(navigation.hidden));
navigation.addEventListener('click', event => {
  if (compactHeader.matches && event.target.closest('a')) {
    const section = document.querySelector(event.target.closest('a').hash);
    setMenu(false);
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
}

const progress = document.querySelector('.page-progress');
const navLinks = [...navigation.querySelectorAll('a')];
const navSections = navLinks.map(link => document.querySelector(link.hash));
let frame = 0;
let active = -1;

function updateReadingPosition() {
  frame = 0;
  const scrollLimit = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = 'scaleX(' + (scrollLimit > 0 ? scrollY / scrollLimit : 0) + ')';
  const current = navSections.findLastIndex(section => section.getBoundingClientRect().top < innerHeight * 0.34);
  if (current === active) return;
  navLinks[active]?.removeAttribute('aria-current');
  navLinks[current]?.setAttribute('aria-current', 'location');
  active = current;
}

function scheduleReadingPosition() {
  if (!frame) frame = requestAnimationFrame(updateReadingPosition);
}

addEventListener('scroll', scheduleReadingPosition, { passive: true });
addEventListener('resize', scheduleReadingPosition);
addEventListener('load', scheduleReadingPosition);
scheduleReadingPosition();

const comparison = document.querySelector('.comparison');
const slider = document.querySelector('#facade-range');

function updateComparison() {
  const before = Number(slider.value);
  comparison.style.setProperty('--split', before + '%');
  slider.setAttribute('aria-valuetext', 'До ремонта: ' + before + ' %, после ремонта: ' + (100 - before) + ' %');
}

updateComparison();
comparison.classList.add('is-interactive');
slider.hidden = false;
slider.addEventListener('input', updateComparison);

const lightbox = document.querySelector('.lightbox');
const photoLinks = [...document.querySelectorAll('[data-photo]')];

if (typeof lightbox.showModal === 'function') {
  const preview = lightbox.querySelector('img');
  const title = lightbox.querySelector('figcaption');
  const count = lightbox.querySelector('.photo-count');
  let currentPhoto = 0;

  function showPhoto(index) {
    currentPhoto = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[currentPhoto];
    const caption = link.closest('figure')?.querySelector('figcaption');
    const image = link.querySelector('img') || comparison.querySelector('img[src="' + link.getAttribute('href') + '"]');
    preview.src = link.href;
    preview.alt = image.alt;
    title.textContent = link.dataset.caption || [...caption.children].map(part => part.textContent).join(' · ');
    count.textContent = (currentPhoto + 1) + ' / ' + photoLinks.length;
  }

  for (const [index, link] of photoLinks.entries()) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showPhoto(index);
      lightbox.showModal();
    });
  }

  lightbox.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => showPhoto(currentPhoto + Number(button.dataset.step)));
  });

  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
}
