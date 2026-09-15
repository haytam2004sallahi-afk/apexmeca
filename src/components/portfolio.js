import { supabase } from '../lib/supabaseClient.js';
import { getLocalizedContent, PORTFOLIO_CATEGORIES } from '../data/content.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const ASSEMBLY_MODEL_PATH = '/models/my-assembly.glb';

let activeLightboxGallery = [];
let activeLightboxIndex = 0;

const PLACEHOLDER_ITEMS = [
  {
    id: 'placeholder-1',
    title: 'Precision Housing Assembly',
    category: '3D Models',
    image_url: '/assets/images/cert-1.jpg',
    video_url: null,
    description: 'Sample placeholder — connect Supabase and add real portfolio items from /admin.',
  },
  {
    id: 'placeholder-2',
    title: 'Continuous-Surface Panel',
    category: 'Surfacing',
    image_url: '/assets/images/cert-1.jpg',
    video_url: null,
    description: 'Sample placeholder — connect Supabase and add real portfolio items from /admin.',
  },
  {
    id: 'placeholder-3',
    title: 'Enclosure Flat-Pattern',
    category: 'Sheet Metal',
    image_url: '/assets/images/cert-1.jpg',
    video_url: null,
    description: 'Sample placeholder — connect Supabase and add real portfolio items from /admin.',
  },
];

function cardTemplate(item, translations) {
  const isModel = item.media_type === 'model' || item.model_url || item.category === '3D Models' && item.file_type === 'model';
  const isVideo = item.category === 'Videos' && item.video_url;
  const isDocument = item.media_type === 'document' || item.document_url || item.category === 'Documents';
  const description = item.description || item.details || item.overview || '';
  const categoryLabels = {
    All: translations.portfolio.all,
    '3D Models': translations.portfolio.models,
    Surfacing: translations.portfolio.surfacing,
    'Sheet Metal': translations.portfolio.sheetMetal,
    Videos: translations.portfolio.videos,
    Documents: translations.portfolio.documents,
  };
  return `
    <article
      class="glass glow-hover reticle rounded-lg overflow-hidden group cursor-pointer"
      data-id="${item.id}"
      data-video="${item.video_url ?? ''}"
      data-is-video="${Boolean(isVideo)}"
      data-model="${isModel ? item.model_url : ''}"
      data-document="${isDocument ? item.document_url : ''}"
      data-description="${encodeURIComponent(description)}"
      data-tags="${(item.tags || []).join('|')}"
      data-material="${item.material || ''}"
      data-software="${item.software || ''}"
      data-manufacturing="${item.manufacturing_method || ''}"
      data-file-type="${item.file_type || ''}"
      data-allow-download="${item.allow_download === true}"
      data-gallery="${encodeURIComponent(JSON.stringify(item.image_urls || item.gallery_urls || []))}"
    >
      <div class="portfolio-media aspect-[4/3] overflow-hidden bg-elevated relative">
        ${isModel ? `<div class="model-preview w-full h-full" data-model-url="${item.model_url}"></div>` : isDocument ? `<div class="w-full h-full flex flex-col items-center justify-center gap-3 text-muted"><span class="font-mono text-xs">PDF</span><span class="text-sm">${item.title}</span></div>` : `<img
          src="${item.image_url || '/assets/images/cert-1.jpg'}"
          alt="${item.title}"
          loading="lazy"
          class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />`}
        ${
          isVideo
            ? `<div class="absolute inset-0 flex items-center justify-center bg-void/30">
                 <div class="w-12 h-12 rounded-full border border-accent-bright/60 flex items-center justify-center bg-void/50 backdrop-blur-sm">
                   <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M0 0L14 8L0 16V0Z" fill="#9FD1F2"/></svg>
                 </div>
               </div>`
            : ''
        }
      </div>
      <div class="p-4">
        <p class="font-mono text-[10px] text-accent-bright/80 mb-1">${categoryLabels[item.category] || item.category}</p>
        <h3 class="font-display text-base text-ink">${item.title}</h3>
      </div>
    </article>
  `;
}

function openModal(item) {
  const modal = document.getElementById('portfolio-modal');
  const body = document.getElementById('portfolio-modal-body');
  if (!modal || !body) return;

  const isVideo = item.dataset.isVideo === 'true' && item.dataset.video;
  const title = item.querySelector('h3')?.textContent ?? '';
  const category = item.querySelector('p')?.textContent ?? '';
  const img = item.querySelector('img')?.getAttribute('src') ?? '';
  const modelUrl = item.dataset.model;
  const documentUrl = item.dataset.document;
  const youtubeUrl = toYouTubeEmbedUrl(item.dataset.video);
  let description = '';
  try {
    description = decodeURIComponent(item.dataset.description || '');
  } catch {
    description = item.dataset.description || '';
  }
  try {
    const parsedDescription = JSON.parse(description);
    if (parsedDescription && typeof parsedDescription === 'object') {
      description = parsedDescription.description || parsedDescription.details || parsedDescription.overview || '';
    }
  } catch {
  }
  const tags = item.dataset.tags ? item.dataset.tags.split('|').filter(Boolean) : [];
  const metadata = [
    ['Material', item.dataset.material],
    ['Software', item.dataset.software],
    ['Manufacturing', item.dataset.manufacturing],
    ['File type', item.dataset.fileType],
  ].filter(([, value]) => value);
  const allowDownload = item.dataset.allowDownload === 'true';
  let galleryUrls = [];
  try {
    galleryUrls = JSON.parse(decodeURIComponent(item.dataset.gallery || '[]')).filter(Boolean);
  } catch {
    galleryUrls = img ? [img] : [];
  }
  if (!galleryUrls.length && img) galleryUrls = [img];
  activeLightboxGallery = galleryUrls;
  activeLightboxIndex = 0;

  const hasGallery = galleryUrls.length > 0;
  const mediaTabs = modelUrl && hasGallery
    ? `<div class="flex gap-2 p-3 border-b border-line"><button type="button" data-media-tab="model" class="media-tab border border-accent-bright text-accent-bright rounded px-3 py-1.5 text-xs">3D Viewer</button><button type="button" data-media-tab="gallery" class="media-tab border border-line text-muted rounded px-3 py-1.5 text-xs">Image Gallery (${galleryUrls.length})</button></div>`
    : '';
  const modelMedia = modelUrl
    ? isExternalEmbedUrl(modelUrl)
      ? `<div data-media-panel="model" class="portfolio-media-stage aspect-[4/3] md:aspect-video w-full bg-black p-2 sm:p-4"><iframe src="${modelUrl}" title="${title} 3D viewer" class="w-full h-full rounded-md" loading="lazy" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe></div>`
      : `<div data-media-panel="model" class="portfolio-media-stage model-modal-preview aspect-[4/3] md:aspect-video w-full" data-model-url="${modelUrl}"></div>`
    : '';
  const galleryMedia = hasGallery
    ? `<div data-media-panel="gallery" class="${modelUrl ? 'hidden' : ''} portfolio-media-stage w-full p-3 sm:p-4"><div data-gallery-stage class="portfolio-gallery-stage relative aspect-[4/3] md:aspect-video bg-black rounded-md overflow-hidden"><img data-gallery-main src="${galleryUrls[0]}" alt="${title}" class="w-full h-full object-contain" /><button type="button" data-gallery-prev aria-label="Previous image" class="gallery-control gallery-control--prev">‹</button><button type="button" data-gallery-next aria-label="Next image" class="gallery-control gallery-control--next">›</button></div><div class="grid grid-flow-col auto-cols-[4.5rem] sm:auto-cols-[5.5rem] gap-2 overflow-x-auto mt-3 pb-1">${galleryUrls.map((url, index) => `<button type="button" data-gallery-thumb="${index}" class="shrink-0 aspect-[4/3] rounded border ${index === 0 ? 'border-accent-bright' : 'border-line'} overflow-hidden transition hover:border-accent-bright/70"><img src="${url}" alt="Preview ${index + 1}" class="w-full h-full object-cover" /></button>`).join('')}</div></div>`
    : '';
  const supplementalMedia = [
    youtubeUrl ? `<div class="portfolio-media-stage aspect-[4/3] md:aspect-video w-full border-t border-line p-3 sm:p-4"><iframe src="${youtubeUrl}" title="${title}" class="w-full h-full rounded-md bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : '',
    documentUrl ? `<div class="portfolio-media-stage w-full border-t border-line p-3 sm:p-4"><div class="pdf-preview-card relative aspect-[4/3] md:aspect-video overflow-hidden rounded-lg border border-line bg-slate-900"><iframe src="${documentUrl}" title="${title} PDF preview" class="absolute inset-0 h-full w-full bg-white" loading="lazy"></iframe><div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 p-5 text-center md:hidden"><span class="rounded border border-sky-300/50 px-3 py-1 font-mono text-xs tracking-widest text-sky-200">PDF DOCUMENT</span><p class="text-sm font-medium text-white">Open the document in your browser for the best mobile view.</p><a href="${documentUrl}" target="_blank" rel="noopener noreferrer" class="rounded-lg bg-sky-300 px-4 py-2.5 text-sm font-medium text-slate-950">Open PDF Document (Full Screen)</a></div></div><div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-elevated p-3"><div><p class="text-xs font-mono uppercase tracking-widest text-accent-bright">PDF document</p><p class="text-sm text-ink">Preview blocked? Open the source document.</p></div><div class="flex flex-wrap gap-2"><a href="${documentUrl}" target="_blank" rel="noopener noreferrer" class="rounded border border-accent-bright px-3 py-2 text-xs text-accent-bright hover:bg-accent/10">View PDF Document</a>${allowDownload ? `<a href="${documentUrl}" download target="_blank" rel="noopener noreferrer" class="rounded bg-accent-bright px-3 py-2 text-xs font-medium text-void hover:bg-white">Download PDF</a>` : ''}</div></div></div>` : '',
    isVideo && !youtubeUrl ? `<div class="portfolio-media-stage aspect-[4/3] md:aspect-video w-full border-t border-line p-3 sm:p-4"><video src="${item.dataset.video}" controls class="w-full h-full object-contain bg-black"></video></div>` : '',
  ].join('');

  body.innerHTML = `${mediaTabs}${modelMedia}${galleryMedia}${supplementalMedia}`;

  body.insertAdjacentHTML('beforeend', `<div class="portfolio-modal-content border-t border-line p-5 sm:p-7 bg-elevated"><p class="portfolio-description text-base text-slate-100 leading-relaxed font-medium"></p>${metadata.length ? `<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">${metadata.map(([label, value]) => `<div class="rounded-lg border border-line bg-black/20 p-2.5"><p class="text-[10px] font-mono uppercase tracking-widest text-muted">${label}</p><p class="mt-1 text-xs text-ink">${value}</p></div>`).join('')}</div>` : ''}<div class="flex flex-wrap items-center gap-2 mt-5">${tags.map((tag) => `<span class="text-xs border border-line rounded px-2 py-1 text-muted">${tag}</span>`).join('')}${allowDownload && (modelUrl || documentUrl) ? `<a href="${modelUrl || documentUrl}" target="_blank" rel="noopener noreferrer" download class="ml-auto inline-flex items-center rounded-lg bg-accent-bright px-3 py-2 text-xs font-medium text-void hover:bg-white">Download CAD / Spec File</a>` : ''}</div></div>`);
  const descriptionElement = body.querySelector('.portfolio-description');
  if (descriptionElement) descriptionElement.textContent = description || 'No description provided.';

  const modalTitle = document.getElementById('portfolio-modal-title');
  const modalCat = document.getElementById('portfolio-modal-category');
  if (modalTitle) modalTitle.textContent = title;
  if (modalCat) modalCat.textContent = category;
  body.querySelector('[data-model-url]') && mountModelPreview(body.querySelector('[data-model-url]'));

  body.querySelectorAll('[data-media-tab]').forEach((tab) => tab.addEventListener('click', () => {
    body.querySelectorAll('[data-media-tab]').forEach((button) => button.className = 'media-tab border border-line text-muted rounded px-3 py-1.5 text-xs');
    tab.className = 'media-tab border border-accent-bright text-accent-bright rounded px-3 py-1.5 text-xs';
    body.querySelectorAll('[data-media-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.mediaPanel !== tab.dataset.mediaTab));
  }));
  const updateGallery = (index) => {
    activeLightboxIndex = (index + galleryUrls.length) % galleryUrls.length;
    const main = body.querySelector('[data-gallery-main]');
    if (main && galleryUrls[activeLightboxIndex]) main.src = galleryUrls[activeLightboxIndex];
    body.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
      const selected = Number(button.dataset.galleryThumb) === activeLightboxIndex;
      button.classList.toggle('border-accent-bright', selected);
      button.classList.toggle('border-line', !selected);
    });
  };
  body.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => thumb.addEventListener('click', () => updateGallery(Number(thumb.dataset.galleryThumb))));
  body.querySelector('[data-gallery-prev]')?.addEventListener('click', () => updateGallery(activeLightboxIndex - 1));
  body.querySelector('[data-gallery-next]')?.addEventListener('click', () => updateGallery(activeLightboxIndex + 1));
  let galleryTouchStartX = 0;
  body.querySelector('[data-gallery-stage]')?.addEventListener('touchstart', (event) => { galleryTouchStartX = event.changedTouches[0]?.screenX || 0; }, { passive: true });
  body.querySelector('[data-gallery-stage]')?.addEventListener('touchend', (event) => {
    const delta = (event.changedTouches[0]?.screenX || 0) - galleryTouchStartX;
    if (Math.abs(delta) > 45) updateGallery(activeLightboxIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });
  body.querySelector('[data-gallery-main]')?.addEventListener('click', (event) => {
    activeLightboxIndex = galleryUrls.indexOf(event.currentTarget.src);
    openLightbox();
  });

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function openLightbox() {
  const lightbox = document.getElementById('portfolio-lightbox');
  if (!lightbox || !activeLightboxGallery.length) return;
  updateLightbox();
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
}

function updateLightbox() {
  const image = document.getElementById('portfolio-lightbox-image');
  const counter = document.getElementById('portfolio-lightbox-counter');
  const url = activeLightboxGallery[activeLightboxIndex];
  if (!image || !url) return;
  image.src = url;
  image.alt = `Portfolio image ${activeLightboxIndex + 1}`;
  if (counter) counter.textContent = `${activeLightboxIndex + 1} / ${activeLightboxGallery.length}`;
}

function navigateLightbox(direction) {
  if (!activeLightboxGallery.length) return;
  activeLightboxIndex = (activeLightboxIndex + direction + activeLightboxGallery.length) % activeLightboxGallery.length;
  updateLightbox();
}

function toYouTubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    let id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
    if (!id && parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2];
    return id ? `https://www.youtube.com/embed/${id}` : '';
  } catch { return ''; }
}

function isExternalEmbedUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && !/\.(glb|gltf)(\?.*)?$/i.test(parsed.pathname);
  } catch { return false; }
}

function mountModelPreview(element) {
  const url = element.dataset.modelUrl;
  if (!url) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
  camera.position.set(0, 0, 5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'block w-full h-full';
  element.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(3, 4, 5);
  scene.add(light);
  const loader = new GLTFLoader();
  loader.load(url, ({ scene: model }) => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.6 / maxDimension;
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    scene.add(model);

    const radius = Math.max(size.length() * scale * 0.5, 0.5);
    const distance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    camera.position.set(distance * 0.7, distance * 0.45, distance * 1.15);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = Math.max(distance * 100, 100);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }, undefined, (error) => {
    console.warn('[Apex Meca] Could not load portfolio model.', error);
    element.classList.add('model-preview--error');
  });
  const resize = () => {
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  const tick = () => {
    if (!element.isConnected) { observer.disconnect(); renderer.dispose(); controls.dispose(); return; }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  resize();
  tick();
}

function closeModal() {
  const modal = document.getElementById('portfolio-modal');
  const body = document.getElementById('portfolio-modal-body');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (body) body.innerHTML = '';
  document.body.style.overflow = '';
}

function closeLightbox() {
  const lightbox = document.getElementById('portfolio-lightbox');
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
  activeLightboxGallery = [];
  activeLightboxIndex = 0;
}

function groupPortfolioItems(items) {
  const groups = new Map();
  items.forEach((item) => {
    const titleParts = item.title?.split(' - ') || [item.title];
    const baseTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(' - ') : item.title;
    const key = `${item.category}|${item.model_url || baseTitle}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...item, title: baseTitle, gallery_urls: item.image_url ? [item.image_url] : [] });
      return;
    }
    if (item.image_url && !existing.gallery_urls.includes(item.image_url)) existing.gallery_urls.push(item.image_url);
    if (!existing.model_url && item.model_url) existing.model_url = item.model_url;
    if (!existing.video_url && item.video_url) existing.video_url = item.video_url;
    if (!existing.document_url && item.document_url) existing.document_url = item.document_url;
    if (item.description && !existing.description) existing.description = item.description;
    if (!existing.material && item.material) existing.material = item.material;
    if (!existing.software && item.software) existing.software = item.software;
    if (!existing.manufacturing_method && item.manufacturing_method) existing.manufacturing_method = item.manufacturing_method;
    if (!existing.file_type && item.file_type) existing.file_type = item.file_type;
    existing.allow_download = existing.allow_download || item.allow_download === true;
    if (item.tags?.length) existing.tags = [...new Set([...(existing.tags || []), ...item.tags])];
  });
  return [...groups.values()];
}

export async function initPortfolio({ getLocale = () => 'en' } = {}) {
  const grid = document.getElementById('portfolio-grid');
  const filterBar = document.getElementById('portfolio-filters');
  if (!grid) return;

  let items = PLACEHOLDER_ITEMS;

  // FIX: Table name changed from 'portfolio_items' to 'portfolio'
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data && data.length > 0) {
    items = groupPortfolioItems(data);
  } else if (error) {
    console.warn('[Apex Meca] Could not load portfolio from Supabase, showing placeholders.', error.message);
  }

  function render(category) {
    const translations = getLocalizedContent(getLocale()).translations;
    const categoryOrder = ['3D Models', 'Surfacing', 'Sheet Metal', 'Videos', 'Documents'];
    const filtered = (category === 'All' ? items : items.filter((i) => i.category === category))
      .slice()
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
    grid.innerHTML = filtered.length
      ? filtered.map((item) => cardTemplate(item, translations)).join('')
      : `<p class="col-span-full text-muted text-sm py-12 text-center">${translations.portfolio.empty}</p>`;

    grid.querySelectorAll('[data-id]').forEach((card) => {
      card.addEventListener('click', () => openModal(card));
    });
    grid.querySelectorAll('[data-model-url]').forEach(mountModelPreview);
  }

  if (filterBar) {
    const renderFilters = () => {
      const translations = getLocalizedContent(getLocale()).translations;
      const labels = [translations.portfolio.all, translations.portfolio.models, translations.portfolio.surfacing, translations.portfolio.sheetMetal, translations.portfolio.videos, translations.portfolio.documents];
      filterBar.innerHTML = PORTFOLIO_CATEGORIES.map(
      (cat, i) => `
        <button
          data-filter="${cat}"
          class="filter-btn font-mono text-xs px-4 py-2 rounded-full border transition-colors ${
            i === 0 ? 'border-accent-bright text-accent-bright bg-accent/10' : 'border-line text-muted hover:text-ink hover:border-accent/40'
          }"
        >${labels[i]}</button>`
      ).join('');

      filterBar.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach((b) => {
          b.classList.remove('border-accent-bright', 'text-accent-bright', 'bg-accent/10');
          b.classList.add('border-line', 'text-muted');
        });
        btn.classList.add('border-accent-bright', 'text-accent-bright', 'bg-accent/10');
        btn.classList.remove('border-line', 'text-muted');
        render(btn.dataset.filter);
      });
      });
    };
    renderFilters();
    window.addEventListener('apex:locale-change', () => {
      renderFilters();
      render('All');
    });
  }

  render('All');

  document.getElementById('portfolio-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('portfolio-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'portfolio-modal') closeModal();
  });
  document.getElementById('portfolio-lightbox')?.addEventListener('click', closeLightbox);
  document.querySelector('[data-lightbox-prev]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    navigateLightbox(-1);
  });
  document.querySelector('[data-lightbox-next]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    navigateLightbox(1);
  });
  let touchStartX = 0;
  document.getElementById('portfolio-lightbox')?.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0]?.screenX || 0;
  }, { passive: true });
  document.getElementById('portfolio-lightbox')?.addEventListener('touchend', (event) => {
    const delta = (event.changedTouches[0]?.screenX || 0) - touchStartX;
    if (Math.abs(delta) > 45) navigateLightbox(delta < 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeModal();
    }
    if (document.getElementById('portfolio-lightbox')?.classList.contains('flex')) {
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    }
  });
}