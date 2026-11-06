// Chapter index for the staged documentary. No dependencies or external requests.
export function setupChapterIndex({story, navigate, getCurrent}) {
  const dialog = document.querySelector('#chapter-index-dialog');
  const openButton = document.querySelector('#chapter-index-open');
  const closeButton = document.querySelector('#chapter-index-close');
  const list = document.querySelector('#chapter-index-list');
  if (!dialog || !openButton || !closeButton || !list) return;

  const byAct = new Map();
  story.forEach((chapter, index) => {
    if (!byAct.has(chapter.act)) byAct.set(chapter.act, []);
    byAct.get(chapter.act).push({chapter, index});
  });

  for (const [act, chapters] of byAct) {
    const section = document.createElement('section');
    section.className = 'chapter-index-act';
    const heading = document.createElement('h3');
    heading.className = 'chapter-index-act-title';
    heading.textContent = act;
    section.append(heading);
    const group = document.createElement('div');
    group.className = 'chapter-index-group';

    for (const {chapter, index} of chapters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter-index-item';
      button.dataset.chapter = String(index);
      button.setAttribute('aria-label', 'Chapter ' + (index + 1) + ': ' + chapter.detail);

      const number = document.createElement('span');
      number.className = 'chapter-index-number';
      number.textContent = String(index + 1).padStart(2, '0');

      const info = document.createElement('span');
      info.className = 'chapter-index-item-info';
      const title = document.createElement('strong');
      title.textContent = chapter.title;
      const place = document.createElement('small');
      place.textContent = chapter.place;
      info.append(title, place);

      const arrow = document.createElement('span');
      arrow.className = 'chapter-index-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');

      button.append(number, info, arrow);
      group.append(button);
    }
    section.append(group);
    list.append(section);
  }

  function syncActive(index) {
    for (const item of list.querySelectorAll('.chapter-index-item')) {
      const active = Number(item.dataset.chapter) === index;
      item.classList.toggle('is-current', active);
      if (active) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
  }

  function openDialog() {
    syncActive(getCurrent());
    dialog.showModal();
    const active = list.querySelector('.chapter-index-item.is-current');
    (active || closeButton).focus({preventScroll: true});
  }

  openButton.addEventListener('click', openDialog);
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => openButton.focus({preventScroll: true}));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  list.addEventListener('click', event => {
    const item = event.target.closest('.chapter-index-item');
    if (!item) return;
    const index = Number(item.dataset.chapter);
    dialog.close();
    navigate(index);
    document.querySelector('#film')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  document.addEventListener('feliks:chapterchange', event => syncActive(event.detail.index));
  syncActive(getCurrent());
}
