export const BRAND = {
  name: 'Apex Meca',
  code: 'AXM',
  owner: 'Haytam Sallahi',
  email: 'sallahi.haytam.officiel@gmail.com',
  phone: '+212681368537',
  whatsapp: 'https://wa.me/212681368537',
};

export const SOCIALS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/haytam-sallahi-6440b5376/' },
  { label: 'Facebook', url: 'https://www.facebook.com/apexmeca' },
  { label: 'Behance', url: 'https://www.behance.net/SallahiHaytam' },
  { label: 'Fiverr', url: 'https://www.fiverr.com/mega_craft_3d/buying?source=avatar_menu_profile' },
];

export const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Toolset', href: '#toolset' },
  { label: 'Experience', href: '#experience' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Contact', href: '#contact' },
];

export const SERVICES = [
  {
    code: 'CAD',
    title: 'Mechanical CAD Modeling',
    description:
      'Precision 3D modeling, complex surfacing and sheet-metal design in SolidWorks, from concept sketch to manufacture-ready assembly.',
    tags: ['3D Modeling', 'Surfacing', 'Sheet Metal', 'Assemblies'],
    status: 'active',
  },
  {
    code: 'CAM',
    title: 'CAM Programming',
    description:
      'Toolpath generation and machining strategy for CNC production, built in Mastercam and ESPRIT.',
    tags: ['Mastercam', 'ESPRIT', 'Toolpaths'],
    status: 'soon',
  },
  {
    code: 'FEA',
    title: 'Finite Element Analysis',
    description:
      'Structural simulation to validate part strength, stiffness and fatigue life before a single chip is cut.',
    tags: ['Static Stress', 'Fatigue', 'Optimization'],
    status: 'soon',
  },
  {
    code: 'CFD',
    title: 'Computational Fluid Dynamics',
    description:
      'Flow and thermal simulation for parts and assemblies operating under real fluid and thermal loads.',
    tags: ['Flow Analysis', 'Thermal', 'Aerodynamics'],
    status: 'soon',
  },
];

export const SOFTWARE = [
  { name: 'SolidWorks', logo: '/assets/logos/logo-solidworks.jpg', status: 'active' },
  { name: 'CATIA', logo: '/assets/logos/logo-catia.png', status: 'soon' },
  { name: 'Mastercam', logo: '/assets/logos/logo-mastercam.png', status: 'soon' },
  { name: 'ESPRIT', logo: '/assets/logos/logo-esprit.png', status: 'soon' },
];

export const EXPERIENCE = [
  {
    year: '2025 — Present',
    title: 'Régleur Machine CNC | AHG ATELIERS DE LA HAUTE GARONNE',
    description:
      'Setting up CNC machines, mounting tools, setting origins, reading technical drawings, and quality control.',
    type: 'role',
  },
  {
    year: 'March 2025',
    title: 'Opérateur Machine CNC | USINAGE SKHIRAT',
    description: 'Loading and unloading CNC machining centers, monitoring series production.',
    type: 'internship',
  },
  {
    year: 'June 2024',
    title: 'Opérateur en Usinage Conventionnel | AT Metal Temara',
    description: 'Conventional machining of single parts, manual machining operations, dimensional inspection.',
    type: 'internship',
  },
  {
    year: '2023 — 2025',
    title: 'Diplôme de TS en Génie Mécanique | ISTA Yacoub El Mansour, Rabat',
    description: 'Grade: 16.46/20.',
    type: 'education',
  },
  {
    year: '2022 — 2023',
    title: 'Baccalauréat en Sciences Physiques | Lycée Mers El Kheir, Temara',
    description: '',
    type: 'education',
  },
];

export const PORTFOLIO_CATEGORIES = ['All', '3D Models', 'Surfacing', 'Sheet Metal', 'Videos', 'Documents'];

export const TRANSLATIONS = {
  en: {
    nav: { services: 'Services', toolset: 'Toolset', experience: 'Experience', portfolio: 'Portfolio', contact: 'Contact', project: 'Start a project', admin: 'Admin' },
    controls: { language: 'FR', languageLabel: 'Switch to French', themeLight: 'Light mode', themeDark: 'Dark mode', menu: 'Toggle menu' },
    hero: {
      eyebrow: 'Haytam Sallahi — Mechanical Design Studio',
      title: 'Advanced Mechanical Design & 3D Engineering',
      description: 'Specialist in SolidWorks 3D modeling, complex surfacing and sheet-metal design — turning mechanical concepts into manufacture-ready geometry.',
      portfolio: 'View portfolio',
      project: 'Start a project',
      scroll: 'scroll ↓',
    },
    sections: {
      servicesTitle: 'Services & specializations',
      servicesDescription: 'One core discipline in active production today, with a roadmap into simulation and manufacturing programming.',
      toolsetTitle: 'Software stack & toolset',
      toolsetDescription: 'The platforms this practice is built on, and the ones on the way.',
      experienceTitle: 'Experience & certifications',
      experienceDescription: 'A working timeline of roles, diplomas and certificates.',
      portfolioTitle: 'Portfolio',
      portfolioDescription: 'Models, surfacing studies, sheet-metal work and speed-modeling videos.',
      contactTitle: "Let's build something precise",
      contactDescription: 'Send a brief and reference files, or reach out directly through whichever channel suits you.',
    },
    status: { active: 'Active', soon: 'Coming soon' },
    contact: { name: 'Name', email: 'Email', details: 'Project details', send: 'Send message', sending: 'Sending...', close: 'Close', required: 'Please fill in every field.', error: 'Something went wrong sending your message - please email me directly instead.', success: "Message sent. I'll get back to you shortly." },
    portfolio: { all: 'All', models: '3D Models', surfacing: 'Surfacing', sheetMetal: 'Sheet Metal', videos: 'Videos', documents: 'Documents', empty: 'No items in this category yet.' },
  },
  fr: {
    nav: { services: 'Services', toolset: 'Outils', experience: 'Expérience', portfolio: 'Portfolio', contact: 'Contact', project: 'Démarrer un projet', admin: 'Admin' },
    controls: { language: 'EN', languageLabel: 'Passer à l’anglais', themeLight: 'Mode clair', themeDark: 'Mode sombre', menu: 'Ouvrir le menu' },
    hero: {
      eyebrow: 'Haytam Sallahi — Studio de conception mécanique',
      title: 'Conception mécanique avancée & ingénierie 3D',
      description: 'Spécialiste de la modélisation 3D sur SolidWorks, des surfaces complexes et de la tôlerie, pour transformer vos concepts mécaniques en géométrie prête à fabriquer.',
      portfolio: 'Voir le portfolio',
      project: 'Démarrer un projet',
      scroll: 'défiler ↓',
    },
    sections: {
      servicesTitle: 'Services & spécialisations',
      servicesDescription: 'Une discipline principale en production, avec une feuille de route vers la simulation et la programmation de fabrication.',
      toolsetTitle: 'Logiciels & outils',
      toolsetDescription: 'Les plateformes au cœur de cette activité et celles à venir.',
      experienceTitle: 'Expérience & certifications',
      experienceDescription: 'Une chronologie des rôles, diplômes et certificats.',
      portfolioTitle: 'Portfolio',
      portfolioDescription: 'Modèles, études de surfaces, travaux de tôlerie et vidéos de modélisation rapide.',
      contactTitle: 'Construisons quelque chose de précis',
      contactDescription: 'Envoyez votre brief et vos fichiers de référence, ou contactez-moi directement par le canal qui vous convient.',
    },
    status: { active: 'Actif', soon: 'Bientôt disponible' },
    contact: { name: 'Nom', email: 'E-mail', details: 'Détails du projet', send: 'Envoyer le message', sending: 'Envoi...', close: 'Fermer', required: 'Veuillez remplir tous les champs.', error: "Une erreur s'est produite. Contactez-moi directement par e-mail.", success: 'Message envoyé. Je vous répondrai rapidement.' },
    portfolio: { all: 'Tous', models: 'Modèles 3D', surfacing: 'Surfaces', sheetMetal: 'Tôlerie', videos: 'Vidéos', documents: 'Documents', empty: 'Aucun élément dans cette catégorie pour le moment.' },
  },
};

const LOCALIZED_SERVICES = {
  en: SERVICES,
  fr: [
    { code: 'CAD', title: 'Modélisation CAO mécanique', description: 'Modélisation 3D de précision, surfaces complexes et conception de tôlerie sur SolidWorks, de l’esquisse à l’assemblage prêt à fabriquer.', tags: ['Modélisation 3D', 'Surfaces', 'Tôlerie', 'Assemblages'], status: 'active' },
    { code: 'CAM', title: 'Programmation FAO', description: 'Génération de parcours d’outils et stratégies d’usinage CNC avec Mastercam et ESPRIT.', tags: ['Mastercam', 'ESPRIT', 'Parcours d’outils'], status: 'soon' },
    { code: 'FEA', title: 'Analyse par éléments finis', description: 'Simulation structurelle pour valider résistance, rigidité et durée de vie avant la fabrication.', tags: ['Contraintes statiques', 'Fatigue', 'Optimisation'], status: 'soon' },
    { code: 'CFD', title: 'Mécanique des fluides numérique', description: 'Simulation des écoulements et des échanges thermiques pour des pièces soumises à des charges réelles.', tags: ['Écoulements', 'Thermique', 'Aérodynamique'], status: 'soon' },
  ],
};

export function getLocalizedContent(locale = 'en') {
  const language = locale === 'fr' ? 'fr' : 'en';
  const translations = TRANSLATIONS[language];
  const experience = language === 'fr'
    ? EXPERIENCE.map((item, index) => ({
        ...item,
        year: [
          '2025 — Présent',
          'Mars 2025',
          'Juin 2024',
          '2023 — 2025',
          '2022 — 2023',
        ][index] || item.year,
        ...[
          { title: 'Régleur Machine CNC | AHG ATELIERS DE LA HAUTE GARONNE', description: 'Réglage de machines CNC, montage des outils, origines, lecture de plans et contrôle qualité.' },
          { title: 'Opérateur Machine CNC | USINAGE SKHIRAT', description: 'Chargement et déchargement des centres CNC et suivi de la production en série.' },
          { title: 'Opérateur en Usinage Conventionnel | AT Metal Temara', description: 'Usinage conventionnel de pièces unitaires, opérations manuelles et contrôle dimensionnel.' },
          { title: 'Diplôme de TS en Génie Mécanique | ISTA Yacoub El Mansour, Rabat', description: 'Note: 16,46/20.' },
          { title: 'Baccalauréat en Sciences Physiques | Lycée Mers El Kheir, Temara', description: '' },
        ][index],
      }))
    : EXPERIENCE;
  return { translations, services: LOCALIZED_SERVICES[language], software: SOFTWARE, experience };
}
