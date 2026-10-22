import { supabase } from '../lib/supabaseClient.js';
import { getLocalizedContent, PORTFOLIO_CATEGORIES } from '../data/content.js';
import occtWasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url';

export const ASSEMBLY_MODEL_PATH = '/models/my-assembly.glb';

/* ====================================================================== */
/* State                                                                  */
/* ====================================================================== */

const state = {
  gallery: [],
  index: 0,
  lastFocused: null,
};

const viewers = { modal: new Set() };
const viewerDisposers = new WeakMap();

function destroyViewers(owner) {
  const activeViewers = viewers[owner];
  if (!activeViewers) return;
  [...activeViewers].forEach((dispose) => {
    try { dispose(); } catch { /* ignore */ }
  });
  activeViewers.clear();
}

/* ====================================================================== */
/* Helpers                                                                */
/* ====================================================================== */

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

function str(value) {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  return text === 'undefined' || text === 'null' ? '' : text;
}

function safeUrl(value) {
  const url = str(value);
  if (!url) return '';
  if (/^\s*(javascript|vbscript):/i.test(url)) return '';
  if (/^\s*data:/i.test(url) && !/^data:image\//i.test(url)) return '';
  return url;
}

function isModelFile(url) {
  try {
    const path = new URL(url, window.location.origin).pathname;
    return /\.(glb|gltf|stl|step|stp)$/i.test(path);
  } catch {
    return /\.(glb|gltf|stl|step|stp)(\?|#|$)/i.test(url);
  }
}

function isExternalEmbedUrl(url) {
  const value = safeUrl(url);
  if (!value || !/^https?:\/\//i.test(value)) return false;
  return !isModelFile(value);
}

function toYouTubeEmbedUrl(url) {
  const value = safeUrl(url);
  if (!value) return '';
  try {
    const parsed = new URL(value, window.location.origin);
    if (!/(^|\.)(youtube\.com|youtu\.be)$/i.test(parsed.hostname)) return '';
    let id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
    if (!id && parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : '';
  } catch {
    return '';
  }
}

function inlineDocumentUrl(url) {
  const value = safeUrl(url);
  if (!value) return '';
  try {
    const parsed = new URL(value, window.location.origin);
    parsed.searchParams.delete('download');
    return parsed.toString();
  } catch {
    return value;
  }
}

/* ====================================================================== */
/* Styles (Sketchfab Inspired UI)                                         */
/* ====================================================================== */

const MODAL_STYLES = `
.pf-scope {
  --pf-surface: #ffffff;
  --pf-elevated: #f8fafc;
  --pf-stage-bg: #dde3ea;
  --pf-ink: #0f172a;
  --pf-muted: #64748b;
  --pf-line: #e2e8f0;
  --pf-accent: #0284c7;
  --pf-accent-ink: #ffffff;
  --pf-overlay: rgba(15, 23, 42, 0.75);
  color: var(--pf-ink);
}

.pf-scope.pf-dark {
  --pf-surface: #0f172a;
  --pf-elevated: #1e293b;
  --pf-stage-bg: #1e293b;
  --pf-ink: #f8fafc;
  --pf-muted: #94a3b8;
  --pf-line: #334155;
  --pf-accent: #38bdf8;
  --pf-accent-ink: #020617;
  --pf-overlay: rgba(2, 6, 23, 0.85);
}

.pf-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: var(--pf-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pf-backdrop.hidden {
  display: none;
}

.pf-dialog {
  background: var(--pf-surface) !important;
  border: 1px solid var(--pf-line);
  width: min(96vw, 68rem);
  height: min(90dvh, 52rem);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/*
 * Header: this is the ONLY header the modal ever shows. openModal() reuses
 * the title/category/close elements shipped in index.html when it can find
 * them (by id) instead of building new ones, which is what previously left
 * the original static header behind as an unstyled white box with its own
 * stray close button. If those ids are missing it builds one header once
 * and never again, so repeated opens can't stack a second copy.
 */
.pf-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 1rem;
  padding: 1rem 1.5rem !important;
  border-bottom: 1px solid var(--pf-line) !important;
  background: var(--pf-surface) !important;
  color: var(--pf-ink) !important;
  flex-shrink: 0;
}

.pf-head * {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.pf-head-titles {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.pf-head-cat {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pf-accent) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

.pf-head-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--pf-ink) !important;
  line-height: 1.2;
  margin: 0;
  overflow-wrap: anywhere;
}

.pf-close-btn {
  flex-shrink: 0;
  width: 2.25rem !important;
  height: 2.25rem !important;
  border-radius: 0.5rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--pf-elevated) !important;
  color: var(--pf-ink) !important;
  border: 1px solid var(--pf-line) !important;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.25rem;
  line-height: 1;
}

.pf-close-btn:hover,
.pf-close-btn:focus-visible {
  background: var(--pf-accent) !important;
  color: var(--pf-accent-ink) !important;
}

.pf-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pf-stage {
  position: relative;
  flex: 0 1 auto;
  height: clamp(180px, 42dvh, 420px);
  min-height: 180px;
  background: var(--pf-stage-bg);
  overflow: hidden;
}

.pf-panel { position: absolute; inset: 0; }
.pf-panel[hidden] { display: none; }
.pf-panel iframe, .pf-panel video, .pf-panel canvas { display: block; width: 100%; height: 100%; border: 0; }
.pf-panel canvas { min-height: 0; }

.pf-tabs {
  position: absolute; z-index: 20; top: 0.75rem; left: 0.75rem;
  display: flex; gap: 0.25rem; padding: 0.25rem; border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pf-surface) 90%, transparent);
  border: 1px solid var(--pf-line);
  backdrop-filter: blur(8px);
}

.pf-tab {
  border-radius: 0.375rem; padding: 0.35rem 0.8rem; font-size: 0.75rem; line-height: 1.2;
  color: var(--pf-muted); background: transparent; cursor: pointer; transition: all .18s;
  border: none;
}
.pf-tab:hover { color: var(--pf-ink); }
.pf-tab[aria-selected="true"] { background: var(--pf-accent); color: var(--pf-accent-ink); font-weight: 600; }

.pf-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: var(--pf-surface);
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pf-text { color: var(--pf-muted); line-height: 1.7; font-size: 0.95rem; white-space: pre-line; }

.pf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
@media (min-width: 768px) { .pf-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.pf-chip { border: 1px solid var(--pf-line); background: var(--pf-elevated); border-radius: 0.75rem; padding: 0.75rem 1rem; }
.pf-chip dt { font-size: 0.65rem; letter-spacing: 0.08em; color: var(--pf-muted); font-weight: 600; text-transform: uppercase; }
.pf-chip dd { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--pf-ink); font-weight: 500; overflow-wrap: anywhere; }

.pf-tag {
  border: 1px solid var(--pf-line); background: var(--pf-elevated); color: var(--pf-muted);
  border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-family: monospace;
}

.pf-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  border-radius: 0.75rem; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 500;
  background: var(--pf-accent); color: var(--pf-accent-ink); text-decoration: none;
  transition: filter .18s; border: none; cursor: pointer;
}
.pf-btn:hover { filter: brightness(1.08); }
.pf-scope :focus-visible { outline: 2px solid var(--pf-accent); outline-offset: 2px; }
`;

function ensureStyles() {
  if (document.getElementById('pf-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'pf-modal-styles';
  style.textContent = MODAL_STYLES;
  document.head.appendChild(style);
}

/* ====================================================================== */
/* Data Placeholders                                                      */
/* ====================================================================== */

const PLACEHOLDER_ITEMS = [
  {
    id: 'placeholder-1',
    title: 'Guitar',
    category: '3D Models',
    image_url: '',
    description: 'Precision CAD model inspired by SolidWorks design.',
  },
  {
    id: 'placeholder-2',
    title: 'Assemblage',
    category: '3D Models',
    image_url: '',
    description: 'Mechanical part component.',
  },
];

function cardTemplate(item, translations) {
  const modelUrl = safeUrl(item.model_3d_url || item.model_url);
  const documentUrl = safeUrl(item.document_url);
  const videoUrl = safeUrl(item.video_url);
  const imageUrl = safeUrl(item.primary_image_url || item.image_url || item.image_urls?.[0]);
  const isModel = Boolean(modelUrl) || item.media_type === 'model';
  const description = str(item.description) || str(item.details) || str(item.overview);
  const gallery = normalizeImageList(item.gallery_images || item.image_urls || item.gallery_urls);
  const tags = normalizeTags(item.tags);

  const categoryLabels = {
    All: translations.portfolio.all,
    '3D Models': translations.portfolio.models,
    Surfacing: translations.portfolio.surfacing,
    'Sheet Metal': translations.portfolio.sheetMetal,
    Videos: translations.portfolio.videos,
    Documents: translations.portfolio.documents,
  };

  const media = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="${esc(item.title)}" loading="lazy" decoding="async" data-card-image class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />`
    : `<div class="portfolio-placeholder w-full h-full text-muted"><span class="font-mono text-xs uppercase">${esc(categoryLabels[item.category] || item.category)}</span><span class="text-xs">Preview unavailable</span></div>`;
  const date = item.project_date || item.created_at;
  const dateLabel = date && !Number.isNaN(new Date(date).getTime())
    ? new Date(date).toLocaleDateString(document.documentElement.lang || 'en', { year: 'numeric', month: 'short' })
    : '';
  const cardTags = [...new Set([item.category, ...tags].filter(Boolean))];
  const allGalleryImages = [...new Set([imageUrl, ...gallery].filter(Boolean))];
  const featured = item.is_featured === true;

  return `
    <article
      class="portfolio-card ${featured ? 'featured' : ''} bg-surface border border-line rounded-lg overflow-hidden group cursor-pointer transition-all hover:border-accent/50"
      data-id="${esc(item.id)}"
      data-title="${esc(item.title)}"
      data-category="${esc(item.category)}"
      data-category-label="${esc(categoryLabels[item.category] || item.category)}"
      data-image="${esc(imageUrl)}"
      data-created-at="${esc(dateLabel)}"
      data-video="${esc(videoUrl)}"
      data-model="${esc(modelUrl)}"
      data-document="${esc(documentUrl)}"
      data-description="${esc(encodeURIComponent(description))}"
      data-tags="${esc((item.tags || []).filter(Boolean).join('|'))}"
      data-material="${esc(str(item.material))}"
      data-software="${esc(str(item.software))}"
      data-manufacturing="${esc(str(item.manufacturing_method))}"
      data-file-type="${esc(str(item.file_type))}"
      data-allow-download="${item.allow_download === true}"
      data-gallery="${esc(encodeURIComponent(JSON.stringify(allGalleryImages)))}"
    >
      <div class="portfolio-media bg-elevated">
        ${media}
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-semibold text-ink line-clamp-2">${esc(item.title)}</h3>
          ${dateLabel ? `<time class="shrink-0 font-mono text-[10px] text-muted">${esc(dateLabel)}</time>` : ''}
        </div>
        ${description ? `<p class="mt-2 text-sm text-muted line-clamp-2">${esc(description)}</p>` : ''}
        ${cardTags.length ? `<div class="mt-3 flex flex-wrap gap-1.5">${cardTags.map((tag) => `<span class="rounded border border-line px-2 py-1 font-mono text-[10px] text-muted">${esc(tag)}</span>`).join('')}</div>` : ''}
        <button type="button" data-open-project class="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-void transition-colors hover:bg-accent-bright">${isModel ? 'View 3D Model' : 'View project'}<span aria-hidden="true">→</span></button>
      </div>
    </article>
  `;
}

function normalizeTags(tags) {
  if (typeof tags === 'string') tags = tags.split(/[·,]/);
  if (!Array.isArray(tags)) tags = tags == null ? [] : [tags];
  return tags.map((tag) => str(tag)).filter(Boolean);
}

function normalizeImageList(images) {
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      images = Array.isArray(parsed) ? parsed : images.split(/[\n,]+/);
    } catch {
      images = images.split(/[\n,]+/);
    }
  }
  if (!Array.isArray(images)) images = images == null ? [] : [images];
  return images.map(safeUrl).filter(Boolean);
}

function readCard(card) {
  const data = card.dataset;
  let description = '';
  try { description = decodeURIComponent(data.description || ''); } catch { description = data.description || ''; }

  let gallery = [];
  try { gallery = JSON.parse(decodeURIComponent(data.gallery || '[]')); } catch { gallery = []; }
  gallery = (Array.isArray(gallery) ? gallery : []).map(safeUrl).filter(Boolean);
  const image = safeUrl(data.image);
  if (!gallery.length && image) gallery = [image];

  return {
    title: str(data.title),
    category: str(data.categoryLabel) || str(data.category),
    description: str(description),
    gallery,
    modelUrl: safeUrl(data.model),
    documentUrl: safeUrl(data.document),
    videoUrl: safeUrl(data.video),
    tags: str(data.tags) ? data.tags.split('|').filter(Boolean) : [],
    allowDownload: data.allowDownload === 'true',
    metadata: [
      ['Material', str(data.material)],
      ['Software', str(data.software)],
      ['Manufacturing', str(data.manufacturing)],
      ['File type', str(data.fileType)],
    ].filter(([, value]) => value),
  };
}

/* ====================================================================== */
/* Three.js Viewer (studio lighting, balanced exposure)                   */
/* ====================================================================== */

async function mountModelPreview(element, owner = 'modal') {
  if (!element || element.dataset.pfMounted === '1') return;
  const url = safeUrl(element.dataset.modelUrl);
  if (!url) return;
  element.dataset.pfMounted = '1';
  const filePath = (() => {
    try { return new URL(url, window.location.origin).pathname; } catch { return url; }
  })();
  const isStepFile = /\.(step|stp)$/i.test(filePath);

  let THREE;
  let GLTFLoader;
  let OrbitControls;
  let RoomEnvironment;
  let STLLoader;
  try {
    [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }, { STLLoader }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
      import('three/examples/jsm/loaders/STLLoader.js'),
    ]);
  } catch (error) {
    element.dataset.pfMounted = '';
    console.error('[3D Engine] Viewer could not be loaded:', error);
    return;
  }
  if (!element.isConnected || !viewers[owner]) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.domElement.className = 'block w-full h-full';
  element.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotateSpeed = 1.2;

  /*
   * A metallic glTF material with no environment map has nothing to reflect
   * and renders pitch black regardless of how many lights are added, which
   * is why the previous setup looked dark despite a bright ambient light.
   * A generated room environment plus a soft multi-point rig gives it
   * something to reflect without blowing the surface out to white.
   */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.9);
  scene.add(hemiLight);

  // Key carries the form; the rest only lift the shadow side, so nothing
  // washes out to flat white the way the earlier 2.5-intensity rig did.
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(10, 15, 10);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.35);
  backLight.position.set(0, -10, 5);
  scene.add(backLight);

  let frame = 0;
  let disposed = false;
  let loadedRoot = null;

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = element;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(element);

  const loader = /\.stl$/i.test(filePath) ? new STLLoader() : new GLTFLoader();
  const showModel = (model) => {
    if (disposed) return;
    loadedRoot = model;

    model.traverse((node) => {
      if (!node.isMesh) return;
      node.frustumCulled = false;
      const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      materials.forEach((material) => {
        // GLTFLoader already converts baseColorFactor into three's linear
        // working space; re-running convertSRGBToLinear() on it double
        // gamma-corrects the colour and makes materials look washed out
        // and desaturated, so that step is intentionally NOT done here.
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
        if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.side = THREE.DoubleSide;
        if (!material.isMeshStandardMaterial) return;
        material.envMapIntensity = 0.65;
        // Untextured CAD metal is usually authored at metalness 1 /
        // roughness 0, which mirrors the room environment as a hot white
        // blowout. Pull both toward the middle; leave textured materials
        // and the author's diffuse colour alone.
        if (material.metalness >= 0.9 && !material.metalnessMap) material.metalness = 0.45;
        if (material.roughness <= 0.2 && !material.roughnessMap) material.roughness = 0.4;
        material.needsUpdate = true;
      });
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / maxDim;

    model.scale.setScalar(scale);
    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale;
    model.position.z = -center.z * scale;

    scene.add(model);

    camera.position.set(2.8, 2.2, 3.2);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    resize();
  };

  if (isStepFile) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`STEP download failed (${response.status}).`);
      const [{ default: initializeOcct }] = await Promise.all([import('occt-import-js')]);
      const occt = await initializeOcct({ locateFile: () => occtWasmUrl });
      const result = occt.ReadStepFile(new Uint8Array(await response.arrayBuffer()), {
        linearUnit: 'millimeter',
        linearDeflectionType: 'bounding_box_ratio',
        linearDeflection: 0.05,
        angularDeflection: 0.5,
      });
      if (!result.success || !result.meshes?.length) throw new Error('The STEP file contains no renderable geometry.');
      const model = new THREE.Group();
      result.meshes.forEach((mesh) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3));
        if (mesh.attributes.normal?.array) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3));
        if (mesh.index?.array) geometry.setIndex(mesh.index.array);
        if (!mesh.attributes.normal?.array) geometry.computeVertexNormals();
        const color = mesh.color || [0.66, 0.71, 0.76];
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color[0], color[1], color[2]),
          metalness: 0.3,
          roughness: 0.48,
          side: THREE.DoubleSide,
        });
        model.add(new THREE.Mesh(geometry, material));
      });
      showModel(model);
    } catch (error) {
      console.warn('[3D Engine] STEP model load failed:', error);
      element.classList.add('model-preview--error');
    }
  } else {
    loader.load(url, (result) => {
      const model = result.scene || new THREE.Mesh(
        result,
        new THREE.MeshStandardMaterial({ color: 0xa8b5c0, metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide }),
      );
      showModel(model);
    }, undefined, (err) => {
    console.warn('[3D Engine] Model load failed:', err);
    element.classList.add('model-preview--error');
    });
  }

  const tick = () => {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (!element.isConnected) { dispose(); return; }
    controls.update();
    renderer.render(scene, camera);
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.dispose();
    if (loadedRoot) {
      loadedRoot.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
    scene.environment = null;
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
    element.dataset.pfMounted = '';
    viewerDisposers.delete(element);
    viewers[owner].delete(dispose);
  }

  viewers[owner].add(dispose);
  viewerDisposers.set(element, dispose);
  requestAnimationFrame(() => { resize(); tick(); });
}

/* ====================================================================== */
/* Panels                                                                 */
/* ====================================================================== */

function buildPanels(item) {
  const panels = [];
  const youtubeUrl = toYouTubeEmbedUrl(item.videoUrl);
  const documentUrl = inlineDocumentUrl(item.documentUrl);

  if (item.modelUrl) {
    panels.push({
      key: 'model',
      label: '3D viewer',
      html: isExternalEmbedUrl(item.modelUrl)
        ? `<iframe data-src="${esc(item.modelUrl)}" title="${esc(item.title)}" loading="lazy" allowfullscreen></iframe>`
        : `<div class="model-modal-preview w-full h-full" data-model-url="${esc(item.modelUrl)}"></div>`,
    });
  }

  if (item.gallery.length) {
    panels.push({
      key: 'gallery',
      label: `Images (${item.gallery.length})`,
      html: `<div class="relative flex h-full w-full items-center justify-center p-4">
          <img data-gallery-image src="${esc(item.gallery[0])}" alt="${esc(item.title)} render 1" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain" />
          ${item.gallery.length > 1 ? `<button type="button" data-gallery-prev class="gallery-control gallery-control--prev" aria-label="Previous image">‹</button><button type="button" data-gallery-next class="gallery-control gallery-control--next" aria-label="Next image">›</button><span data-gallery-count class="absolute bottom-3 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white">1 / ${item.gallery.length}</span>` : ''}
        </div>`,
    });
  }

  if (documentUrl) {
    panels.push({
      key: 'pdf',
      label: 'Document',
      html: `<iframe data-src="${esc(documentUrl)}" title="${esc(item.title)}" class="w-full h-full"></iframe>`,
    });
  }

  if (youtubeUrl || item.videoUrl) {
    panels.push({
      key: 'video',
      label: 'Video',
      html: `<iframe data-src="${esc(youtubeUrl || item.videoUrl)}" title="${esc(item.title)}" allowfullscreen></iframe>`,
    });
  }

  return panels;
}

/* ====================================================================== */
/* Theme                                                                  */
/* ====================================================================== */

function isDarkTheme() {
  const root = document.documentElement;
  const body = document.body;
  if (root.classList.contains('dark') || body.classList.contains('dark')) return true;
  if (root.dataset.theme === 'dark' || body.dataset.theme === 'dark') return true;
  if (root.classList.contains('light') || body.classList.contains('light')) return false;
  if (root.dataset.theme === 'light' || body.dataset.theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/* ====================================================================== */
/* Modal header (single source of truth, built/bound at most once)        */
/* ====================================================================== */

/**
 * Renders the modal's title / category / close button.
 *
 * Reuses `#portfolio-modal-title`, `#portfolio-modal-category` and
 * `#portfolio-modal-close` from index.html when they exist, instead of
 * creating a second copy of them. That mismatch — new header injected on
 * top of the original static one — is what produced the white box behind
 * the title and the duplicate close ('X') button. If those ids aren't
 * present this builds one header element a single time and caches it on
 * the dialog, so re-opening the modal never stacks a second one.
 */
function paintHeader(dialog, item) {
  let title = document.getElementById('portfolio-modal-title');
  let category = document.getElementById('portfolio-modal-category');
  let closeBtn = document.getElementById('portfolio-modal-close');
  let head = title?.closest('.pf-head') || title?.parentElement?.parentElement || title?.parentElement;

  if (!title || !closeBtn) {
    head = dialog.querySelector(':scope > .pf-head');
    if (!head) {
      head = document.createElement('div');
      head.innerHTML = `
        <div class="pf-head-titles">
          <span class="pf-head-cat" id="portfolio-modal-category"></span>
          <h2 class="pf-head-title" id="portfolio-modal-title"></h2>
        </div>
        <button type="button" class="pf-close-btn" id="portfolio-modal-close" aria-label="Close">&times;</button>
      `;
      dialog.insertBefore(head, dialog.firstChild);
    }
    title = head.querySelector('#portfolio-modal-title');
    category = head.querySelector('#portfolio-modal-category');
    closeBtn = head.querySelector('#portfolio-modal-close');
  }

  // Any other element in the modal that merely looks like a close button
  // (leftover markup from an earlier header) is removed once, so it can't
  // sit as a second, faintly-styled 'X' next to the real one.
  document.querySelectorAll('#portfolio-modal [id*="close" i], #portfolio-modal [aria-label*="close" i]')
    .forEach((el) => { if (el !== closeBtn) el.remove(); });

  if (head) head.className = 'pf-head';
  if (title) { title.className = 'pf-head-title'; title.textContent = item.title; }
  if (category) { category.className = 'pf-head-cat'; category.textContent = item.category; }
  if (closeBtn) {
    closeBtn.className = 'pf-close-btn';
    closeBtn.innerHTML = closeBtn.innerHTML.trim() || '&times;';
    closeBtn.onclick = closeModal;
  }
}

/* ====================================================================== */
/* Modal                                                                  */
/* ====================================================================== */

function closeModal() {
  const modal = document.getElementById('portfolio-modal');
  const body = document.getElementById('portfolio-modal-body');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  destroyViewers('modal');
  if (body) body.innerHTML = '';
  document.body.style.overflow = '';
}

function openModal(card) {
  const modal = document.getElementById('portfolio-modal');
  const body = document.getElementById('portfolio-modal-body');
  if (!modal || !body) return;

  ensureStyles();
  destroyViewers('modal');

  const item = readCard(card);
  state.gallery = item.gallery;
  state.index = 0;

  modal.className = 'pf-scope pf-backdrop';
  modal.classList.toggle('pf-dark', isDarkTheme());

  const dialog = body.parentElement;
  if (dialog) dialog.className = 'pf-dialog';

  paintHeader(dialog, item);

  body.className = 'pf-body';

  const panels = buildPanels(item);
  const stageHtml = panels.length
    ? `<div class="pf-stage">
        ${panels.length > 1 ? `<div class="pf-tabs" role="tablist">${panels
          .map((panel, i) => `<button type="button" class="pf-tab" data-tab="${panel.key}" aria-selected="${i === 0}">${esc(panel.label)}</button>`)
          .join('')}</div>` : ''}
        ${panels.map((panel, i) => `<div class="pf-panel" data-panel="${panel.key}"${i === 0 ? '' : ' hidden'}>${panel.html}</div>`).join('')}
      </div>`
    : `<div class="pf-stage"><div class="pf-content" style="justify-content:center;align-items:center;text-align:center;">No preview available.</div></div>`;

  const downloadUrl = item.allowDownload ? (item.modelUrl || item.documentUrl) : '';
  const contentHtml = `<div class="pf-content">
      <p class="pf-text">${esc(item.description || 'No description provided.')}</p>
      ${item.metadata.length ? `<dl class="pf-grid">${item.metadata
        .map(([label, value]) => `<div class="pf-chip"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
        .join('')}</dl>` : ''}
      ${item.tags.length ? `<div class="flex flex-wrap gap-2">${item.tags
        .map((tag) => `<span class="pf-tag">${esc(tag)}</span>`).join('')}</div>` : ''}
      ${downloadUrl ? `<div><a class="pf-btn" href="${esc(downloadUrl)}" download target="_blank" rel="noopener noreferrer">Download Model</a></div>` : ''}
    </div>`;

  body.innerHTML = stageHtml + contentHtml;

  const activateTab = (key) => {
    body.querySelectorAll('[data-panel]').forEach((p) => {
      const active = p.dataset.panel === key;
      p.hidden = !active;
      if (active) {
        const iframe = p.querySelector('iframe[data-src]');
        if (iframe && !iframe.getAttribute('src')) iframe.src = iframe.dataset.src;
        const viewer = p.querySelector('[data-model-url]');
        if (viewer) void mountModelPreview(viewer, 'modal');
      }
    });
    const galleryImage = body.querySelector('[data-gallery-image]');
    if (galleryImage && key === 'gallery') updateGalleryImage(body);
    body.querySelectorAll('[data-tab]').forEach((t) => {
      t.setAttribute('aria-selected', String(t.dataset.tab === key));
    });
  };

  body.querySelectorAll('[data-tab]').forEach((t) => {
    t.addEventListener('click', () => activateTab(t.dataset.tab));
  });
  body.querySelector('[data-gallery-prev]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    state.index = (state.index - 1 + state.gallery.length) % state.gallery.length;
    updateGalleryImage(body);
  });
  body.querySelector('[data-gallery-next]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    state.index = (state.index + 1) % state.gallery.length;
    updateGalleryImage(body);
  });

  if (panels.length) activateTab(panels[0].key);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  document.getElementById('portfolio-modal-close')?.focus?.();
}

function updateGalleryImage(body) {
  const image = body.querySelector('[data-gallery-image]');
  if (!image || !state.gallery.length) return;
  image.src = state.gallery[state.index];
  image.alt = `${document.getElementById('portfolio-modal-title')?.textContent || 'Project'} render ${state.index + 1}`;
  const count = body.querySelector('[data-gallery-count]');
  if (count) count.textContent = `${state.index + 1} / ${state.gallery.length}`;
}

/* ====================================================================== */
/* Main Init                                                              */
/* ====================================================================== */

export async function initPortfolio({ getLocale = () => 'en' } = {}) {
  const grid = document.getElementById('portfolio-grid');
  const filterBar = document.getElementById('portfolio-filters');
  if (!grid) return;

  destroyViewers('modal');

  let items = PLACEHOLDER_ITEMS;

  const { data, error } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });

  if (!error && data && data.length > 0) {
    items = data;
  }

  let activeCategory = 'All';

  function renderFilterButtons() {
    if (!filterBar) return;
    const translations = getLocalizedContent(getLocale()).translations;
    const labels = {
      All: translations.portfolio.all,
      '3D Models': translations.portfolio.models,
      Surfacing: translations.portfolio.surfacing,
      'Sheet Metal': translations.portfolio.sheetMetal,
      Videos: translations.portfolio.videos,
      Documents: translations.portfolio.documents,
    };
    filterBar.innerHTML = PORTFOLIO_CATEGORIES.map((category) => {
      const selected = category === activeCategory;
      return `<button type="button" class="filter-btn rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${selected ? 'border-accent bg-accent/10 text-accent-bright' : 'border-line text-muted hover:text-ink'}" data-filter="${esc(category)}" aria-pressed="${selected}">${esc(labels[category])}</button>`;
    }).join('');
    filterBar.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => render(button.dataset.filter || 'All'));
    });
  }

  function render(category) {
    activeCategory = category;
    const translations = getLocalizedContent(getLocale()).translations;
    const filtered = category === 'All' ? items : items.filter((i) => i.category === category);

    grid.innerHTML = filtered.length
      ? filtered.map((item) => cardTemplate(item, translations)).join('')
      : `<p class="col-span-full text-slate-400 text-sm py-12 text-center">No projects found.</p>`;

    renderFilterButtons();

    grid.querySelectorAll('img[data-card-image]').forEach((image) => image.addEventListener('error', () => {
      const fallback = document.createElement('div');
      fallback.className = 'portfolio-placeholder w-full h-full text-muted';
      fallback.innerHTML = '<span class="font-mono text-xs uppercase">Preview</span><span class="text-xs">Preview unavailable</span>';
      image.replaceWith(fallback);
    }, { once: true }));

    grid.querySelectorAll('[data-id]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        openModal(card);
      });
      card.querySelector('[data-open-project]')?.addEventListener('click', () => openModal(card));
    });
  }

  render('All');
  window.addEventListener('apex:locale-change', () => {
    renderFilterButtons();
    render(activeCategory);
  });

  const modal = document.getElementById('portfolio-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}