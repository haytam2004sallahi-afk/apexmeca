import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dpdebudbbpbpvghyuwym.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZGVidWRiYnBicHZnaHl1d3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTk3NjksImV4cCI6MjA3NzA3NTc2OX0.iCTa5sZUc696kUjeCaCRxhdUM91KkXe_wpKC4uQcYwY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);
const TABLES = { portfolio: 'portfolio', experience: 'experience', skills: 'skills', blog: 'blog_posts' };
const normalizeTags = (tags) => Array.isArray(tags)
  ? tags.map((tag) => String(tag).trim()).filter(Boolean)
  : typeof tags === 'string'
    ? tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

const loginView = $('login-view');
const dashboardView = $('dashboard-view');
const loginForm = $('login-form');
const loginStatus = $('login-status');
const logoutBtn = $('logout-btn');
const itemForm = $('item-form');
const itemId = $('item-id');
const itemTitle = $('item-title');
const itemCategory = $('item-category');
const itemMediaFiles = $('item-media-files');
const itemImageUrl = $('item-image-url');
const itemModelUrl = $('item-model-url');
const itemVideoUrl = $('item-video-url');
const itemDescription = $('item-description');
const itemSubmitBtn = $('item-submit-btn');
const itemCancelBtn = $('item-cancel-btn');
const itemStatus = $('item-status');

function setStatus(element, text, kind = 'info') {
  if (!element) return;
  element.textContent = text;
  element.className = `text-sm min-h-[1.25rem] ${kind === 'error' ? 'text-red-500' : kind === 'success' ? 'text-green-400' : 'text-accent-bright'}`;
  showToast(text, kind);
}

function showToast(message, kind = 'info') {
  const toast = $('admin-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `fixed right-5 bottom-5 z-50 glass rounded-md px-4 py-3 text-sm shadow-2xl ${kind === 'error' ? 'text-red-400' : kind === 'success' ? 'text-emerald-400' : 'text-accent-bright'}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function showLogin() {
  loginView?.classList.remove('hidden');
  dashboardView?.classList.add('hidden');
  logoutBtn?.classList.add('hidden');
}

function showDashboard() {
  loginView?.classList.add('hidden');
  dashboardView?.classList.remove('hidden');
  logoutBtn?.classList.remove('hidden');
  refreshDashboard();
}

async function uploadFile(file, folder) {
  const path = `portfolio/${folder}/${file.name}`;
  const { error } = await supabase.storage.from('portfolio').upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
}

function mediaType(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'bin') return 'asset';
  if (extension === 'glb' || extension === 'gltf') return 'model';
  if (extension === 'pdf') return 'document';
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
}

async function savePortfolioItem() {
  const files = [...(itemMediaFiles?.files || [])];
  const base = {
    title: itemTitle.value.trim(),
    category: itemCategory.value,
    video_url: itemVideoUrl.value.trim(),
    model_url: itemModelUrl.value.trim(),
    description: itemDescription.value.trim(),
  };
  if (!base.title) throw new Error('A title is required.');

  const uploaded = [];
  const uploadFolder = crypto.randomUUID();
  for (const file of files) {
    uploaded.push({ url: await uploadFile(file, uploadFolder), type: mediaType(file), name: file.name });
  }
  const displayFiles = uploaded.filter((file) => file.type !== 'asset');
  if (!displayFiles.length && !itemImageUrl.value.trim() && !itemModelUrl.value.trim()) {
    throw new Error('Select a visible media file or provide a media URL.');
  }
  const pastedImageUrl = itemImageUrl.value.trim();
  const imageUrls = [...displayFiles.filter((file) => file.type === 'image').map((file) => file.url)];
  if (pastedImageUrl && !imageUrls.includes(pastedImageUrl)) imageUrls.unshift(pastedImageUrl);
  const firstImage = imageUrls[0] || pastedImageUrl;
  const model = displayFiles.find((file) => file.type === 'model');
  const document = displayFiles.find((file) => file.type === 'document');
  const projectData = {
    ...base,
    image_url: firstImage,
    image_urls: imageUrls,
    model_url: model?.url || base.model_url,
    document_url: document?.url || null,
    media_type: model ? 'model' : document ? 'document' : base.category === 'Videos' ? 'video' : 'image',
  };

  if (itemId.value) {
    const { error } = await supabase.from(TABLES.portfolio).update(projectData).eq('id', itemId.value);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(TABLES.portfolio).insert(projectData);
    if (error) throw error;
  }
}

itemForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(itemStatus, 'Saving item...');
  try {
    await savePortfolioItem();
    setStatus(itemStatus, 'Saved successfully!', 'success');
    resetItemForm();
    await fetchPortfolioItems();
  } catch (error) {
    setStatus(itemStatus, error.message, 'error');
  }
});

function resetItemForm() {
  itemId.value = '';
  itemForm?.reset();
  itemSubmitBtn.textContent = 'Save item';
  itemCancelBtn?.classList.add('hidden');
}
itemCancelBtn?.addEventListener('click', resetItemForm);

async function fetchPortfolioItems() {
  const { data, error } = await supabase.from(TABLES.portfolio).select('*').order('created_at', { ascending: false });
  const list = $('admin-items-list');
  if (error) {
    if (list) list.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    return;
  }
  if (list) {
    list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-4 space-y-2 border border-line">
      ${item.image_url ? `<img src="${item.image_url}" class="w-full h-32 object-cover rounded-md mb-2" alt="" />` : ''}
      <h3 class="font-display font-medium text-ink">${item.title}</h3>
      <span class="inline-block px-2 py-0.5 text-xs font-mono bg-elevated border border-line rounded text-muted">${item.category}</span>
      <p class="text-xs text-muted line-clamp-2">${item.description || ''}</p>
      <div class="flex gap-2 pt-2"><button data-edit-portfolio="${item.id}" class="text-xs font-mono text-accent-bright hover:underline">Edit</button><button data-delete-portfolio="${item.id}" class="text-xs font-mono text-red-400 hover:underline">Delete</button></div>
    </div>`).join('');
    list.querySelectorAll('[data-edit-portfolio]').forEach((button) => button.addEventListener('click', () => editPortfolioItem(button.dataset.editPortfolio)));
    list.querySelectorAll('[data-delete-portfolio]').forEach((button) => button.addEventListener('click', () => deleteRecord(TABLES.portfolio, button.dataset.deletePortfolio, fetchPortfolioItems)));
  }
  $('portfolio-count').textContent = data?.length || 0;
  $('overview-projects').textContent = data?.length || 0;
}

async function fetchBlogPosts() {
  const { data, error } = await supabase.from(TABLES.blog).select('*').order('published_at', { ascending: false });
  const list = $('admin-blog-list');
  if (error) {
    if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`;
    return;
  }
  if (list) {
    list.innerHTML = (data || []).map((post) => `<article class="glass rounded-lg p-4 border border-line">
      <div class="flex items-start justify-between gap-3"><div><p class="font-mono text-xs text-accent-bright">${post.published_at || 'Unscheduled'} · /blog/${post.slug}</p><h3 class="font-display text-lg">${post.title}</h3></div><span class="text-xs text-muted">${normalizeTags(post.tags).join(' · ')}</span></div>
      <p class="text-sm text-muted mt-2 line-clamp-2">${post.excerpt || ''}</p><div class="flex gap-3 mt-3"><button data-edit-blog="${post.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-blog="${post.id}" class="text-xs text-red-400">Delete</button></div>
    </article>`).join('') || '<p class="text-sm text-muted">No articles yet.</p>';
    list.querySelectorAll('[data-edit-blog]').forEach((button) => button.addEventListener('click', () => editBlogPost(button.dataset.editBlog)));
    list.querySelectorAll('[data-delete-blog]').forEach((button) => button.addEventListener('click', () => deleteRecord(TABLES.blog, button.dataset.deleteBlog, fetchBlogPosts)));
  }
  $('blog-count').textContent = data?.length || 0;
}

async function editBlogPost(id) {
  const { data: post } = await supabase.from(TABLES.blog).select('*').eq('id', id).single();
  if (!post) return;
  $('blog-id').value = post.id;
  $('blog-title').value = post.title || '';
  $('blog-slug').value = post.slug || '';
  $('blog-date').value = post.published_at ? post.published_at.slice(0, 10) : '';
  $('blog-tags').value = normalizeTags(post.tags).join(', ');
  $('blog-excerpt').value = post.excerpt || '';
  $('blog-cover-image').value = post.cover_image || '';
  $('blog-content').value = post.content || '';
  $('blog-cancel').classList.remove('hidden');
  $('blog-title').focus();
}

bindManagedForm({ form: 'blog-form', id: 'blog-id', table: TABLES.blog, status: 'blog-status', cancel: 'blog-cancel', list: fetchBlogPosts, fields: {
  title: 'blog-title', slug: 'blog-slug', published_at: 'blog-date', tags: () => normalizeTags($('blog-tags').value), excerpt: 'blog-excerpt', cover_image: 'blog-cover-image', content: 'blog-content',
} });

async function editPortfolioItem(id) {
  const { data } = await supabase.from(TABLES.portfolio).select('*').eq('id', id).single();
  if (!data) return;
  itemId.value = data.id;
  itemTitle.value = data.title;
  itemCategory.value = data.category;
  itemImageUrl.value = data.image_url || '';
  itemModelUrl.value = data.model_url || '';
  itemVideoUrl.value = data.video_url || '';
  itemDescription.value = data.description || '';
  itemSubmitBtn.textContent = 'Update item';
  itemCancelBtn?.classList.remove('hidden');
}

async function deleteRecord(table, id, refresh) {
  const confirmed = await confirmDelete();
  if (!confirmed) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Deleted successfully.', 'success');
  await refresh();
}

function confirmDelete() {
  return new Promise((resolve) => {
    const modal = $('delete-modal');
    if (!modal) { resolve(window.confirm('Are you sure you want to delete this item?')); return; }
    modal.classList.remove('hidden'); modal.classList.add('flex');
    const finish = (answer) => { modal.classList.add('hidden'); modal.classList.remove('flex'); resolve(answer); };
    $('delete-confirm').onclick = () => finish(true);
    $('delete-cancel').onclick = () => finish(false);
  });
}

function bindCrudForm({ form, ids, table, list, fields, status, cancel }) {
  const formEl = $(form);
  if (!formEl) return;
  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus($(status), 'Saving...');
    const payload = Object.fromEntries(Object.entries(fields).map(([column, id]) => [column, $(id).value.trim()]));
    try {
      const id = $(ids).value;
      const query = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload);
      const { error } = await query;
      if (error) throw error;
      formEl.reset();
      $(ids).value = '';
      $(cancel)?.classList.add('hidden');
      setStatus($(status), 'Saved successfully!', 'success');
      await list();
    } catch (error) {
      setStatus($(status), error.message, 'error');
    }
  });
  $(cancel)?.addEventListener('click', () => {
    formEl.reset();
    $(ids).value = '';
    $(cancel).classList.add('hidden');
  });
}

async function fetchExperience() {
  const { data, error } = await supabase.from(TABLES.experience).select('*').order('sort_order', { ascending: false }).order('year', { ascending: false });
  const list = $('admin-experience-list');
  if (error) {
    if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`;
    return;
  }
  list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-4 border border-line"><p class="font-mono text-xs text-accent-bright">${item.year}</p><h3 class="font-display">${item.title}</h3><p class="text-sm text-muted">${item.description || ''}</p><div class="flex gap-3 mt-2"><button data-edit-experience="${item.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-experience="${item.id}" class="text-xs text-red-400">Delete</button></div></div>`).join('');
  list.querySelectorAll('[data-delete-experience]').forEach((button) => button.addEventListener('click', () => deleteRecord(TABLES.experience, button.dataset.deleteExperience, fetchExperience)));
  list.querySelectorAll('[data-edit-experience]').forEach((button) => button.addEventListener('click', async () => {
    const { data: item } = await supabase.from(TABLES.experience).select('*').eq('id', button.dataset.editExperience).single();
    if (!item) return;
    $('experience-id').value = item.id;
    $('experience-year').value = item.year;
    $('experience-title').value = item.title;
    $('experience-type').value = item.type;
    $('experience-description').value = item.description || '';
    $('experience-cancel').classList.remove('hidden');
  }));
}

async function fetchSkills() {
  const { data, error } = await supabase.from(TABLES.skills).select('*').order('name');
  const list = $('admin-skills-list');
  if (error) {
    if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`;
    return;
  }
  list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-3 border border-line"><p class="font-display">${item.name}</p><p class="text-xs text-muted">${item.category}</p><div class="flex gap-3 mt-2"><button data-edit-skill="${item.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-skill="${item.id}" class="text-xs text-red-400">Delete</button></div></div>`).join('');
  list.querySelectorAll('[data-delete-skill]').forEach((button) => button.addEventListener('click', () => deleteRecord(TABLES.skills, button.dataset.deleteSkill, fetchSkills)));
  list.querySelectorAll('[data-edit-skill]').forEach((button) => button.addEventListener('click', async () => {
    const { data: item } = await supabase.from(TABLES.skills).select('*').eq('id', button.dataset.editSkill).single();
    if (!item) return;
    $('skill-id').value = item.id;
    $('skill-name').value = item.name;
    $('skill-category').value = item.category;
    $('skill-logo-url').value = item.logo_url || '';
    $('skill-cancel').classList.remove('hidden');
  }));
}

bindCrudForm({ form: 'experience-form', ids: 'experience-id', table: TABLES.experience, list: fetchExperience, status: 'experience-status', cancel: 'experience-cancel', fields: { year: 'experience-year', title: 'experience-title', type: 'experience-type', description: 'experience-description' } });
bindCrudForm({ form: 'skill-form', ids: 'skill-id', table: TABLES.skills, list: fetchSkills, status: 'skill-status', cancel: 'skill-cancel', fields: { name: 'skill-name', category: 'skill-category', logo_url: 'skill-logo-url' } });

async function refreshDashboard() {
  await Promise.all([fetchPortfolioItems(), fetchBlogPosts(), fetchExperience(), fetchSkills(), fetchServices(), fetchSoftware(), fetchSocialLinks(), fetchAnalytics()]);
}

function initAdminTabs() {
  document.querySelectorAll('[data-admin-tab]').forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.dataset.adminTab;
    document.querySelectorAll('.admin-nav-link').forEach((item) => item.classList.toggle('active', item.dataset.adminTab === target));
    document.querySelectorAll('.admin-tab').forEach((item) => item.className = 'admin-tab px-3 py-2 rounded-md border border-line text-muted text-sm');
    document.querySelectorAll(`.admin-tab[data-admin-tab="${target}"]`).forEach((item) => item.className = 'admin-tab active px-3 py-2 rounded-md border border-accent-bright text-accent-bright text-sm');
    document.querySelectorAll('[data-admin-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.adminPanel !== target));
  }));
  document.querySelector('[data-admin-tab="overview"]')?.click();
}

function bindManagedForm({ form, id, table, fields, list, status, cancel }) {
  const formElement = $(form);
  if (!formElement) return;
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus($(status), 'Saving...');
    const payload = Object.fromEntries(Object.entries(fields).map(([column, field]) => [column, typeof field === 'function' ? field() : $(field).value.trim()]));
    try {
      const recordId = $(id).value;
      const query = recordId ? supabase.from(table).update(payload).eq('id', recordId) : supabase.from(table).insert(payload);
      const { error } = await query;
      if (error) throw error;
      formElement.reset(); $(id).value = ''; $(cancel)?.classList.add('hidden'); setStatus($(status), 'Saved successfully!', 'success'); await list();
    } catch (error) { setStatus($(status), error.message, 'error'); }
  });
  $(cancel)?.addEventListener('click', () => { formElement.reset(); $(id).value = ''; $(cancel).classList.add('hidden'); });
}

async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*').order('sort_order'); const list = $('admin-services-list');
  if (error) { if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`; return; }
  list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-4 border border-line"><p class="font-mono text-xs text-accent-bright">${item.code} · ${item.status}</p><h3 class="font-display">${item.title}</h3><p class="text-sm text-muted">${item.description || ''}</p><div class="flex gap-3 mt-2"><button data-edit-service="${item.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-service="${item.id}" class="text-xs text-red-400">Delete</button></div></div>`).join('');
  list.querySelectorAll('[data-delete-service]').forEach((button) => button.addEventListener('click', () => deleteRecord('services', button.dataset.deleteService, fetchServices)));
  list.querySelectorAll('[data-edit-service]').forEach((button) => button.addEventListener('click', async () => { const { data: item } = await supabase.from('services').select('*').eq('id', button.dataset.editService).single(); if (!item) return; $('service-id').value = item.id; $('service-code').value = item.code; $('service-title').value = item.title; $('service-description').value = item.description || ''; $('service-tags').value = (item.tags || []).join(', '); $('service-status').value = item.status; $('service-order').value = item.sort_order; $('service-cancel').classList.remove('hidden'); }));
  $('overview-services').textContent = (data || []).filter((item) => item.status === 'active').length;
}

async function fetchSoftware() {
  const { data, error } = await supabase.from('software').select('*').order('sort_order'); const list = $('admin-software-list');
  if (error) { if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`; return; }
  list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-4 border border-line flex items-center gap-3">${item.logo_url ? `<img src="${item.logo_url}" class="w-10 h-10 object-contain" alt="" />` : ''}<div class="flex-1"><h3 class="font-display">${item.name}</h3><p class="text-xs text-muted">${item.status}</p></div><button data-edit-software="${item.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-software="${item.id}" class="text-xs text-red-400">Delete</button></div>`).join('');
  list.querySelectorAll('[data-delete-software]').forEach((button) => button.addEventListener('click', () => deleteRecord('software', button.dataset.deleteSoftware, fetchSoftware)));
  list.querySelectorAll('[data-edit-software]').forEach((button) => button.addEventListener('click', async () => { const { data: item } = await supabase.from('software').select('*').eq('id', button.dataset.editSoftware).single(); if (!item) return; $('software-id').value = item.id; $('software-name').value = item.name; $('software-logo').value = item.logo_url || ''; $('software-status').value = item.status; $('software-order').value = item.sort_order; $('software-cancel').classList.remove('hidden'); }));
  $('overview-software').textContent = data?.length || 0;
}

async function fetchSocialLinks() {
  const { data, error } = await supabase.from('social_links').select('*').order('sort_order'); const list = $('admin-social-list');
  if (error) { if (list) list.innerHTML = `<p class="text-red-500">${error.message}</p>`; return; }
  list.innerHTML = (data || []).map((item) => `<div class="glass rounded-lg p-4 border border-line"><p class="font-mono text-xs text-accent-bright">${item.label}</p><p class="text-sm text-muted break-all">${item.url || ''}</p><p class="text-xs text-muted">${item.subtext || ''}</p><div class="flex gap-3 mt-2"><button data-edit-social="${item.id}" class="text-xs text-accent-bright">Edit</button><button data-delete-social="${item.id}" class="text-xs text-red-400">Delete</button></div></div>`).join('');
  list.querySelectorAll('[data-delete-social]').forEach((button) => button.addEventListener('click', () => deleteRecord('social_links', button.dataset.deleteSocial, fetchSocialLinks)));
  list.querySelectorAll('[data-edit-social]').forEach((button) => button.addEventListener('click', async () => { const { data: item } = await supabase.from('social_links').select('*').eq('id', button.dataset.editSocial).single(); if (!item) return; $('social-id').value = item.id; $('social-slug').value = item.slug; $('social-label').value = item.label; $('social-url').value = item.url || ''; $('social-subtext').value = item.subtext || ''; $('social-order').value = item.sort_order; $('social-cancel').classList.remove('hidden'); }));
}

async function fetchAnalytics() {
  const { data, error } = await supabase.from('analytics_events').select('event_type,target'); if (error) return;
  const events = data || []; const count = (type) => events.filter((event) => event.event_type === type).length;
  $('analytics-views').textContent = count('page_view'); $('analytics-clicks').textContent = count('click'); $('analytics-contacts').textContent = count('contact_submit');
  $('analytics-breakdown').textContent = events.length ? `Tracked events: ${events.length}` : 'No analytics events recorded yet.';
  const { count: messageCount } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true });
  $('overview-messages').textContent = messageCount || 0;
  const total = Math.max(events.length, 1);
  $('analytics-views-bar').style.width = `${Math.min(100, countEvent(events, 'page_view') / total * 100)}%`;
  $('analytics-clicks-bar').style.width = `${Math.min(100, countEvent(events, 'click') / total * 100)}%`;
  $('analytics-contacts-bar').style.width = `${Math.min(100, countEvent(events, 'contact_submit') / total * 100)}%`;
  const { data: messages } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  const messagesList = $('admin-messages-list');
  if (messagesList) messagesList.innerHTML = (messages || []).map((message) => `<article class="border-b border-line pb-3"><div class="flex justify-between gap-3"><strong class="text-sm">${message.name}</strong><time class="text-xs text-muted">${new Date(message.created_at).toLocaleDateString()}</time></div><p class="text-xs text-muted mt-1">${message.email}</p><p class="text-sm mt-2">${message.message}</p></article>`).join('') || '<p class="text-sm text-muted">No messages yet.</p>';
}

function countEvent(events, type) { return events.filter((event) => event.event_type === type).length; }

function initAdminTheme() {
  const toggle = $('admin-theme-toggle');
  const apply = (theme) => {
    document.body.classList.toggle('admin-light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('apex-admin-theme', theme);
    if (toggle) toggle.textContent = theme === 'light' ? '●' : '◐';
  };
  apply(localStorage.getItem('apex-admin-theme') || 'dark');
  toggle?.addEventListener('click', () => apply(document.body.classList.contains('admin-light') ? 'dark' : 'light'));
}

function initSidebarToggle() {
  const toggle = $('admin-sidebar-toggle');
  toggle?.setAttribute('aria-label', 'Sidebar stays expanded');
  toggle?.addEventListener('click', () => showToast('Sidebar stays expanded to protect workspace layout.', 'info'));
}

function initListFilters() {
  const filterList = (inputId, listId, selectId) => {
    const input = $(inputId); const list = $(listId); const select = selectId ? $(selectId) : null;
    const apply = () => {
      const search = input?.value.toLowerCase() || ''; const category = select?.value || '';
      list?.querySelectorAll(':scope > div').forEach((item) => item.classList.toggle('hidden', !item.textContent.toLowerCase().includes(search) || Boolean(category && !item.textContent.includes(category))));
    };
    input?.addEventListener('input', apply); select?.addEventListener('change', apply);
  };
  filterList('portfolio-search', 'admin-items-list', 'portfolio-filter');
  filterList('blog-search', 'admin-blog-list');
  filterList('experience-search', 'admin-experience-list');
  filterList('skills-search', 'admin-skills-list');
  filterList('services-search', 'admin-services-list');
  filterList('software-search', 'admin-software-list');
  filterList('messages-search', 'admin-messages-list');
}

bindManagedForm({ form: 'service-form', id: 'service-id', table: 'services', status: 'service-status-message', cancel: 'service-cancel', list: fetchServices, fields: { code: 'service-code', title: 'service-title', description: 'service-description', tags: () => $('service-tags').value.split(',').map((tag) => tag.trim()).filter(Boolean), status: 'service-status', sort_order: 'service-order' } });
bindManagedForm({ form: 'software-form', id: 'software-id', table: 'software', status: 'software-status-message', cancel: 'software-cancel', list: fetchSoftware, fields: { name: 'software-name', logo_url: 'software-logo', status: 'software-status', sort_order: 'software-order' } });
bindManagedForm({ form: 'social-form', id: 'social-id', table: 'social_links', status: 'social-status-message', cancel: 'social-cancel', list: fetchSocialLinks, fields: { slug: 'social-slug', label: 'social-label', url: 'social-url', subtext: 'social-subtext', sort_order: 'social-order' } });
initAdminTabs();
initAdminTheme();
initSidebarToggle();
initListFilters();

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(loginStatus, 'Authenticating...');
  const { error } = await supabase.auth.signInWithPassword({ email: $('login-email').value, password: $('login-password').value });
  if (error) setStatus(loginStatus, error.message, 'error');
  else showDashboard();
});
logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); showLogin(); });
supabase.auth.getSession().then(({ data: { session } }) => session ? showDashboard() : showLogin());
