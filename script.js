function updateClock() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const el = document.getElementById("live-date");
  if (el) el.textContent = dateStr + " | " + timeStr;
}
updateClock();
setInterval(updateClock, 60000);

const pageTitleEl = document.getElementById("pageTitle");
const pageSubtitleEl = document.getElementById("pageSubtitle");
const pageActionsEl = document.getElementById("pageActions");
const pageContentEl = document.getElementById("pageContent");
const overlayRootEl = document.getElementById("overlayRoot");
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const notifBtn = document.getElementById("notifBtn");
const notifCountEl = document.getElementById("notifCount");
const notifListEl = document.getElementById("notifList");
const profileBtn = document.getElementById("profileBtn");
const notifMenu = document.getElementById("notifMenu");
const profileMenu = document.getElementById("profileMenu");
const stockAlertReadStorageKey = "maintflow.stockAlertReads";
const stockInventoryStateStorageKey = "maintflow.stockInventoryState";

let renderedNotifications = [];

const notifications = [
  {
    title: "Panne critique — Compresseur A3",
    subtitle: "Arrêt production ligne 2",
    time: "09:14",
    type: "crit",
    icon: "fa-circle-xmark",
    read: false,
  },
  {
    title: "Stock pièce critique faible",
    subtitle: "Joint torique Ø42 — 2 restants",
    time: "10:32",
    type: "warn",
    icon: "fa-triangle-exclamation",
    read: false,
  },
  {
    title: "Inspection planifiée demain",
    subtitle: "Chaudière B1 — Zone Nord",
    time: "13:47",
    type: "info",
    icon: "fa-info-circle",
    read: false,
  },
];

const dashboardKpis = [
  {
    label: "Interventions actives",
    value: "42",
    icon: "fa-screwdriver-wrench",
    iconClass: "blue",
    trendClass: "up",
    trendIcon: "fa-arrow-trend-up",
    trendValue: "+8%",
    footer: "vs mois dernier",
  },
  {
    label: "Équipements opérationnels",
    value: "128",
    icon: "fa-circle-check",
    iconClass: "green",
    trendClass: "up",
    trendIcon: "fa-arrow-trend-up",
    trendValue: "94%",
    footer: "taux de disponibilité",
  },
  {
    label: "Alertes en attente",
    value: "11",
    icon: "fa-triangle-exclamation",
    iconClass: "orange",
    trendClass: "down",
    trendIcon: "fa-arrow-trend-down",
    trendValue: "-3",
    footer: "depuis hier",
  },
  {
    label: "Coût maintenance (M)",
    value: "87k€",
    icon: "fa-coins",
    iconClass: "red",
    trendClass: "flat",
    trendIcon: "fa-minus",
    trendValue: "+1.2%",
    footer: "budget : 95k€",
  },
];

const recentInterventions = [
  {
    ref: "#INT-2847",
    equipment: "Compresseur A3",
    type: "Corrective",
    priorityClass: "p-high",
    priorityLabel: "Haute",
    statusClass: "badge-warning",
    statusLabel: "En cours",
    technician: "K. Benali",
  },
  {
    ref: "#INT-2846",
    equipment: "Pompe centrifuge P2",
    type: "Préventive",
    priorityClass: "p-medium",
    priorityLabel: "Moyenne",
    statusClass: "badge-success",
    statusLabel: "Terminée",
    technician: "S. Amrani",
  },
  {
    ref: "#INT-2845",
    equipment: "Convoyeur ligne 4",
    type: "Préventive",
    priorityClass: "p-low",
    priorityLabel: "Basse",
    statusClass: "badge-info",
    statusLabel: "Planifiée",
    technician: "T. Mehdaoui",
  },
  {
    ref: "#INT-2844",
    equipment: "Moteur électrique M7",
    type: "Corrective",
    priorityClass: "p-high",
    priorityLabel: "Haute",
    statusClass: "badge-danger",
    statusLabel: "Bloquée",
    technician: "R. Chiali",
  },
  {
    ref: "#INT-2843",
    equipment: "Chaudière B1",
    type: "Réglementaire",
    priorityClass: "p-medium",
    priorityLabel: "Moyenne",
    statusClass: "badge-success",
    statusLabel: "Terminée",
    technician: "M. Ouali",
  },
];

const dashboardAlerts = [
  {
    type: "crit",
    icon: "fa-circle-xmark",
    title: "Panne critique — Compresseur A3",
    subtitle: "Arrêt production ligne 2",
    time: "09:14",
  },
  {
    type: "warn",
    icon: "fa-triangle-exclamation",
    title: "Stock pièce critique faible",
    subtitle: "Joint torique Ø42 — 2 restants",
    time: "10:32",
  },
  {
    type: "warn",
    icon: "fa-clock",
    title: "Échéance PM dans 3 jours",
    subtitle: "Révision moteur M7",
    time: "11:05",
  },
  {
    type: "info",
    icon: "fa-info-circle",
    title: "Inspection planifiée demain",
    subtitle: "Chaudière B1 — Zone Nord",
    time: "13:47",
  },
];

const criticalEquipment = [
  {
    icon: "fa-wind",
    name: "Compresseur A3",
    location: "Zone A — Atelier",
    statusClass: "badge-danger",
    statusLabel: "En panne",
    fillClass: "fill-danger",
    fillWidth: "18%",
  },
  {
    icon: "fa-droplet",
    name: "Pompe P2",
    location: "Zone B — Sous-sol",
    statusClass: "badge-success",
    statusLabel: "Opérationnel",
    fillClass: "fill-success",
    fillWidth: "88%",
  },
  {
    icon: "fa-bolt",
    name: "Moteur M7",
    location: "Zone C — Hall 3",
    statusClass: "badge-warning",
    statusLabel: "Dégradé",
    fillClass: "fill-warning",
    fillWidth: "52%",
  },
  {
    icon: "fa-fire-flame-curved",
    name: "Chaudière B1",
    location: "Zone Nord",
    statusClass: "badge-success",
    statusLabel: "Opérationnel",
    fillClass: "fill-success",
    fillWidth: "92%",
  },
  {
    icon: "fa-conveyor-belt",
    name: "Convoyeur L4",
    location: "Ligne 4",
    statusClass: "badge-info",
    statusLabel: "Maintenance",
    fillClass: "fill-brand",
    fillWidth: "65%",
    fillStyle: "background:var(--brand)",
  },
  {
    icon: "fa-tower-broadcast",
    name: "Armoire TGBT",
    location: "Électrique",
    statusClass: "badge-success",
    statusLabel: "Opérationnel",
    fillClass: "fill-success",
    fillWidth: "97%",
  },
];

const workOrderStatus = [
  { label: "Terminées", count: 22, color: "var(--success)" },
  { label: "En cours", count: 8, color: "var(--warning)" },
  { label: "Bloquées", count: 5, color: "var(--danger)" },
  { label: "Planifiées", count: 7, color: "var(--border)" },
];

const availabilityByZone = [
  {
    label: "Zone A — Atelier",
    value: "72%",
    fillClass: "fill-warning",
    width: "72%",
  },
  {
    label: "Zone B — Sous-sol",
    value: "94%",
    fillClass: "fill-success",
    width: "94%",
  },
  {
    label: "Zone C — Hall 3",
    value: "88%",
    fillClass: "fill-brand",
    width: "88%",
  },
  {
    label: "Zone Nord",
    value: "97%",
    fillClass: "fill-success",
    width: "97%",
  },
];

const recentActivity = [
  {
    dotStyle: "background:var(--danger-bg);color:var(--danger)",
    icon: "fa-xmark",
    title: "Panne déclarée — Compresseur A3",
    meta: "09:14 · Déclaré par K. Benali · OT #2847 créé",
  },
  {
    dotStyle: "background:var(--success-bg);color:var(--success)",
    icon: "fa-check",
    title: "Intervention terminée — Pompe P2",
    meta: "08:45 · S. Amrani · Durée : 2h30",
  },
  {
    dotStyle: "background:var(--warning-bg);color:var(--warning)",
    icon: "fa-box",
    title: "Commande pièce — Joint Ø42",
    meta: "08:10 · Stock : 2 unités restantes",
  },
  {
    dotStyle: "background:var(--info-bg);color:var(--info)",
    icon: "fa-calendar-plus",
    title: "PM planifiée — Chaudière B1",
    meta: "07:30 · Prévu le 06/06 · Assigné à M. Ouali",
  },
  {
    dotStyle: "background:#f1f5f9;color:#64748b",
    icon: "fa-file-signature",
    title: "Rapport mensuel généré",
    meta: "Hier 17:00 · Mai 2026 — Exporté PDF",
  },
];

const weeklyPlanning = [
  { day: "Lun", value: "4", height: "40%", active: false },
  { day: "Auj.", value: "8", height: "80%", active: true },
  { day: "Mer", value: "6", height: "60%", active: false },
  { day: "Jeu", value: "3", height: "30%", active: false },
  { day: "Ven", value: "5", height: "50%", active: false },
];

const upcomingWork = [
  {
    accent: "var(--danger)",
    title: "Révision Compresseur A3",
    meta: "Demain 08:00 · K. Benali",
    priorityClass: "p-high",
    priorityLabel: "Urgente",
  },
  {
    accent: "var(--brand)",
    title: "Inspection Chaudière B1",
    meta: "06/06 · 10:00 · M. Ouali",
    priorityClass: "p-medium",
    priorityLabel: "Standard",
  },
  {
    accent: "var(--success)",
    title: "Graissage Convoyeur L4",
    meta: "07/06 · 14:00 · T. Mehdaoui",
    priorityClass: "p-low",
    priorityLabel: "Basse",
  },
];

const pages = {
  dashboard: {
    title: "Tableau de bord",
    subtitle: "Vue globale de la maintenance",
    body: "Cette page est prête pour la prochaine étape du développement.",
  },
  arborescence: {
    title: "Arborescence",
    subtitle: "Structure des sites et des actifs",
    body: "Espace vide pour construire cette page ensuite.",
  },
  organisation: {
    title: "Organisation",
    subtitle: "Unités, équipes et affectations",
    body: "Espace vide pour construire cette page ensuite.",
  },
  equipements: {
    title: "Équipements",
    subtitle: "Groupes, familles et inventaire des équipements",
    body: "Gestion des groupes, des familles et des fiches équipements.",
  },
  organe: {
    title: "Organe",
    subtitle: "Sous-ensembles et composants",
    body: "Espace vide pour construire cette page ensuite.",
  },
  articles: {
    title: "Articles",
    subtitle: "Référentiel des articles de stock",
    body: "Espace vide pour construire cette page ensuite.",
  },
  planification: {
    title: "Planification",
    subtitle: "Programmation des interventions",
    body: "Espace vide pour construire cette page ensuite.",
  },
  interventions: {
    title: "Interventions",
    subtitle: "Suivi des ordres de travail",
    body: "Espace vide pour construire cette page ensuite.",
  },
  stock: {
    title: "Stock",
    subtitle: "Fiche stock, mouvements, inventaires et historique",
    body: "Pilotage complet des articles, mouvements de stock, inventaires et consultations historiques.",
  },
  achats: {
    title: "Achats",
    subtitle: "Demandes et commandes",
    body: "Espace vide pour construire cette page ensuite.",
  },
  fournisseurs: {
    title: "Fournisseurs",
    subtitle: "Partenaires et contacts",
    body: "Espace vide pour construire cette page ensuite.",
  },
  administration: {
    title: "Administration",
    subtitle: "Paramètres et droits d’accès",
    body: "Espace vide pour construire cette page ensuite.",
  },
  profil: {
    title: "Profil",
    subtitle: "Informations du compte utilisateur",
    body: "Espace vide pour construire cette page ensuite.",
  },
  parametres: {
    title: "Paramètre",
    subtitle: "Réglages personnels",
    body: "Espace vide pour construire cette page ensuite.",
  },
  deconnexion: {
    title: "Déconnexion",
    subtitle: "Fin de session",
    body: "Espace vide pour construire cette page ensuite.",
  },
};

const organizationSubpages = {
  entreprise: {
    label: "Entreprise",
    title: "Entreprise",
    body: "Espace vide pour construire la fiche entreprise.",
  },
  unites: {
    label: "Unités",
    title: "Unités",
    body: "Gestion des unités avec liste, détails et formulaires.",
  },
  divisions: {
    label: "Divisions",
    title: "Divisions",
    body: "Gestion des divisions liées à plusieurs unités.",
  },
  "departements-services": {
    label: "Département",
    title: "Département",
    body: "Gestion des départements liés à plusieurs divisions.",
  },
};

const organizationUsers = [
  {
    id: "user-1",
    name: "Amina El Idrissi",
    email: "amina.elidrissi@maintflow.local",
    role: "Responsable RH",
  },
  {
    id: "user-2",
    name: "Youssef Bensaid",
    email: "youssef.bensaid@maintflow.local",
    role: "Responsable production",
  },
  {
    id: "user-3",
    name: "Nadia Rami",
    email: "nadia.rami@maintflow.local",
    role: "Responsable maintenance",
  },
  {
    id: "user-4",
    name: "Karim Lahlou",
    email: "karim.lahlou@maintflow.local",
    role: "Chef division",
  },
  {
    id: "user-5",
    name: "Sara Jaziri",
    email: "sara.jaziri@maintflow.local",
    role: "Chef de service",
  },
  {
    id: "user-6",
    name: "Omar Haddad",
    email: "omar.haddad@maintflow.local",
    role: "Coordinateur opérationnel",
  },
];

const organizationStorageKey = "maintflow.organizationStructure";

const organizationDefaults = {
  unites: [
    {
      id: "unit-1",
      code: "UNI-001",
      name: "Unité production Nord",
      locations: "Zone Nord, bâtiment A",
      phone: "021 45 11 10",
      responsibleUserId: "user-2",
      description:
        "Pilotage de la production et des équipements critiques du site nord.",
    },
    {
      id: "unit-2",
      code: "UNI-002",
      name: "Unité maintenance centrale",
      locations: "Plateforme centrale",
      phone: "021 45 11 22",
      responsibleUserId: "user-3",
      description:
        "Coordination des plans de maintenance préventive et corrective.",
    },
    {
      id: "unit-3",
      code: "UNI-003",
      name: "Unité support logistique",
      locations: "Zone services",
      phone: "021 45 11 35",
      responsibleUserId: "user-6",
      description:
        "Support interne, approvisionnement et assistance opérationnelle.",
    },
  ],
  divisions: [
    {
      id: "division-1",
      code: "DIV-001",
      name: "Division mécanique",
      unitIds: ["unit-1", "unit-2"],
      responsibleUserId: "user-4",
      description: "Regroupe les activités mécaniques de plusieurs unités.",
    },
    {
      id: "division-2",
      code: "DIV-002",
      name: "Division électrique",
      unitIds: ["unit-2"],
      responsibleUserId: "user-6",
      description: "Suivi des installations électriques et automatismes.",
    },
    {
      id: "division-3",
      code: "DIV-003",
      name: "Division logistique",
      unitIds: ["unit-3"],
      responsibleUserId: "user-5",
      description: "Gestion des flux, stocks et soutiens aux équipes.",
    },
  ],
  departmentServices: [
    {
      id: "department-1",
      code: "DEP-001",
      kind: "Département",
      name: "Département planification",
      divisionIds: ["division-1", "division-2"],
      responsibleUserId: "user-3",
      description:
        "Planification des activités de maintenance et des arrêts techniques.",
    },
    {
      id: "service-1",
      code: "SRV-001",
      kind: "Service",
      name: "Service support technique",
      divisionIds: ["division-1", "division-3"],
      responsibleUserId: "user-5",
      description:
        "Support de proximité et accompagnement des équipes terrain.",
    },
    {
      id: "department-2",
      code: "DEP-002",
      kind: "Département",
      name: "Département qualité et sécurité",
      divisionIds: ["division-2"],
      responsibleUserId: "user-1",
      description:
        "Supervision des procédures qualité, sécurité et conformité.",
    },
  ],
};

let organizationModalState = null;

const sectionSubpages = {
  equipements: {
    defaultSubpage: "groupe-equipment",
    tabs: {
      "groupe-equipment": {
        label: "Groupe équipement",
        title: "Groupe équipement",
        body: "Gestion des groupes d'équipements avec affectation multi-départements.",
      },
      "famille-equipment": {
        label: "Famille équipement",
        title: "Famille équipement",
        body: "Gestion des familles d'équipements rattachées à un groupe.",
      },
      equipment: {
        label: "Équipement",
        title: "Équipement",
        body: "Liste des équipements avec fiche détaillée et formulaire en plusieurs sections.",
      },
    },
  },
  organe: {
    defaultSubpage: "groupe-organe",
    tabs: {
      "groupe-organe": {
        label: "Groupe organe",
        title: "Groupe organe",
        body: "Gestion des groupes d'organes avec association multi-équipements.",
      },
      "famille-organe": {
        label: "Famille organe",
        title: "Famille organe",
        body: "Gestion des familles d'organes rattachées à un groupe.",
      },
      organe: {
        label: "Organe",
        title: "Organe",
        body: "Liste des organes avec formulaire complet et pièces jointes.",
      },
    },
  },
  articles: {
    defaultSubpage: "groupe-article",
    tabs: {
      "groupe-article": {
        label: "Groupe article",
        title: "Groupe article",
        body: "Espace vide pour construire la gestion des groupes d'articles.",
      },
      "famille-article": {
        label: "Famille article",
        title: "Famille article",
        body: "Espace vide pour construire la gestion des familles d'articles.",
      },
      article: {
        label: "Article",
        title: "Article",
        body: "Espace vide pour construire la liste des articles.",
      },
    },
  },
};

const stockSubpages = {
  defaultSubpage: "fiche-stock",
  tabs: {
    "fiche-stock": {
      label: "Fiche stock",
      title: "Fiche stock",
      body: "Paramétrage du stock, emplacements et valorisation des articles.",
    },
    mouvements: {
      label: "Mouvements",
      title: "Mouvements",
      body: "Entrées, sorties et transferts de stock avec traçabilité complète.",
    },
    inventaire: {
      label: "Inventaire",
      title: "Inventaire",
      body: "Création d’inventaires et feuille de comptage terrain.",
    },
    historique: {
      label: "Historique",
      title: "Historique",
      body: "Consultation des mouvements filtrée par article, type, date ou utilisateur.",
    },
  },
};

let stockHistoryFilterState = {
  articleId: "",
  type: "",
  from: "",
  to: "",
  user: "",
  linkedDocument: "",
};

let stockToastTimer = null;

let articleModalState = null;

const articleStorageKey = "maintflow.articleCatalog";

const articleDefaults = {
  groups: [
    {
      id: "article-group-1",
      code: "AGR-001",
      name: "Consommables",
      designations: "Produits consommables et pièces d'usure",
      associatedOrganeIds: [],
    },
    {
      id: "article-group-2",
      code: "AGR-002",
      name: "Pièces détachées",
      designations: "Pièces détachées mécaniques et électriques",
      associatedOrganeIds: [],
    },
  ],
  families: [
    {
      id: "article-family-1",
      code: "AFM-001",
      groupId: "article-group-1",
      name: "Lubrifiants",
      designations: "Huiles et graisses",
    },
    {
      id: "article-family-2",
      code: "AFM-002",
      groupId: "article-group-2",
      name: "Roulements",
      designations: "Roulements standards",
    },
  ],
  articles: [
    {
      id: "article-1",
      code: "ART-001",
      name: "Huile minérale 5L",
      reference: "HL-5L-100",
      brand: "LubriCo",
      price: "45.00",
      quantity: "12",
      groupId: "article-group-1",
      familyId: "article-family-1",
      designations: "Huile pour engrenages",
      photos: [],
    },
    {
      id: "article-2",
      code: "ART-002",
      name: "Roulement 6204",
      reference: "RB-6204",
      brand: "SKF",
      price: "12.50",
      quantity: "40",
      groupId: "article-group-2",
      familyId: "article-family-2",
      designations: "Roulement simple rangée",
      photos: [],
    },
  ],
};

function getArticleDirectory() {
  let directory = JSON.parse(JSON.stringify(articleDefaults));

  try {
    const stored = window.localStorage.getItem(articleStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      directory = {
        groups: Array.isArray(parsed.groups) ? parsed.groups : directory.groups,
        families: Array.isArray(parsed.families)
          ? parsed.families
          : directory.families,
        articles: Array.isArray(parsed.articles)
          ? parsed.articles
          : directory.articles,
      };
    }
  } catch (error) {
    directory = JSON.parse(JSON.stringify(articleDefaults));
  }

  return directory;
}

function saveArticleDirectory(directory) {
  try {
    window.localStorage.setItem(articleStorageKey, JSON.stringify(directory));
  } catch (error) {
    // ignore storage errors
  }
}

function getArticleRecords(kind) {
  const directory = getArticleDirectory();
  if (kind === "groups") return directory.groups;
  if (kind === "families") return directory.families;
  return directory.articles;
}

function getArticleRecord(kind, recordId) {
  return getArticleRecords(kind).find((r) => r.id === recordId) || null;
}

function setArticleModalState(state) {
  articleModalState = state;
}

function openArticleModal(pageKey, mode, recordId = null) {
  setArticleModalState({ pageKey, mode, recordId });
  renderArticlePage(pageKey);
  window.location.hash = `articles/${pageKey}`;
}

function buildArticleModalShell(title, subtitle, bodyHtml) {
  return `
    <div class="org-modal ${articleModalState ? "open" : ""}" role="presentation">
      <div class="org-modal-backdrop" data-art-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="artModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Article</div>
            <h3 id="artModalTitle">${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-art-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderArticleModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;
  if (!articleModalState) {
    overlayRootEl.innerHTML = "";
    return;
  }
  overlayRootEl.innerHTML = buildArticleModalShell(title, subtitle, bodyHtml);
}

function buildAssociatedOrganeOptions(selectedIds = []) {
  return getOrganeRecords("organes")
    .map(
      (org) => `
        <option value="${org.id}"${selectedIds.includes(org.id) ? " selected" : ""}>
          ${org.code} — ${org.name}
        </option>
      `,
    )
    .join("");
}

function buildArticleGroupOptions(selectedGroupId = "") {
  return [
    '<option value="">Sélectionner un groupe</option>',
    ...getArticleRecords("groups").map(
      (g) =>
        `<option value="${g.id}"${g.id === selectedGroupId ? " selected" : ""}>${g.code} — ${g.name}</option>`,
    ),
  ].join("");
}

function buildArticleFamilyOptions(
  selectedFamilyId = "",
  selectedGroupId = "",
) {
  const families = getArticleRecords("families").filter(
    (f) => !selectedGroupId || f.groupId === selectedGroupId,
  );
  return [
    '<option value="">Sélectionner une famille</option>',
    ...families.map(
      (f) =>
        `<option value="${f.id}"${f.id === selectedFamilyId ? " selected" : ""}>${f.code} — ${f.name}</option>`,
    ),
  ].join("");
}

function buildArticleTypeOptions(selectedType = "") {
  const types = [
    { value: "consommable", label: "Consommable" },
    { value: "piece-rechange", label: "Pièce de rechange" },
    { value: "outil", label: "Outil" },
    { value: "epi", label: "EPI" },
  ];

  return [
    '<option value="">Sélectionner le type d\'article</option>',
    ...types.map(
      (type) => `
        <option value="${type.value}"${type.value === selectedType ? " selected" : ""}>${type.label}</option>
      `,
    ),
  ].join("");
}

function buildArticleUnitMeasureOptions(selectedUnitMeasure = "") {
  const unitMeasures = [
    "Pièce",
    "Lot",
    "Boîte",
    "Kg",
    "g",
    "L",
    "m",
    "cm",
    "m²",
    "m³",
    "U",
  ];

  return [
    '<option value="">Sélectionner l\'unité de mesure</option>',
    ...unitMeasures.map(
      (unitMeasure) => `
        <option value="${unitMeasure}"${unitMeasure === selectedUnitMeasure ? " selected" : ""}>${unitMeasure}</option>
      `,
    ),
  ].join("");
}

function buildArticleSupplierOptions(selectedSupplier = "") {
  const suppliers = Array.from(
    new Set(
      [
        ...equipmentDefaults.equipments.map((equipment) => equipment.supplier),
        ...organeDefaults.organes.map((organe) => organe.supplier),
      ].filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return [
    '<option value="">Sélectionner le fournisseur principal</option>',
    ...suppliers.map(
      (supplier) => `
        <option value="${supplier}"${supplier === selectedSupplier ? " selected" : ""}>${supplier}</option>
      `,
    ),
  ].join("");
}

function buildArticleSubstituteOptions(
  selectedIds = [],
  currentArticleId = "",
) {
  const articles = getArticleRecords("articles").filter(
    (article) => article.id !== currentArticleId,
  );

  return [
    '<option value="">Sélectionner un article substitut</option>',
    ...articles.map(
      (article) => `
        <option value="${article.id}"${selectedIds.includes(article.id) ? " selected" : ""}>
          ${article.code} — ${article.name}
        </option>
      `,
    ),
  ].join("");
}

function getCurrentArticleCreator() {
  return organizationUsers[0] || { id: "system", name: "Système" };
}

function formatArticleTraceabilityDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR");
}

function buildArticleGroupFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("GRPART", getArticleRecords("groups"));

  return `
    <form class="org-form" data-art-form="groupe-article">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Code groupe</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label>Nom</label>
          <input name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom du groupe article" required />
        </div>
        <div class="field-group field-group-wide">
          <label>Désignations</label>
          <textarea name="designations" rows="4" placeholder="Désignations du groupe">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
        <div class="field-group field-group-wide">
          <label>Organes associés</label>
          <select name="associatedOrganeIds" multiple size="6">
            ${buildAssociatedOrganeOptions(record?.associatedOrganeIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs organes.</div>
        </div>
      </div>

      ${buildOrganizationFormFooter("groupe-article", mode, record?.id || "")}
    </form>
  `;
}

function buildArticleFamilyFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("FAMART", getArticleRecords("families"));

  return `
    <form class="org-form" data-art-form="famille-article">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Code famille</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label>Nom</label>
          <input name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de la famille article" required />
        </div>
        <div class="field-group">
          <label>Groupe associé</label>
          <select name="groupId">
            ${buildArticleGroupOptions(record?.groupId || "")}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label>Désignations</label>
          <textarea name="designations" rows="4" placeholder="Désignations de la famille">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
      </div>

      ${buildOrganizationFormFooter("famille-article", mode, record?.id || "")}
    </form>
  `;
}

function buildArticleFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("ART", getArticleRecords("articles"));
  const selectedGroup = record?.groupId || "";
  const selectedFamily = record?.familyId || "";
  const selectedType = record?.articleType || "";
  const selectedUnitMeasure = record?.unitMeasure || "";
  const selectedSupplier = record?.supplier || "";
  const selectedSubstitutes = Array.isArray(record?.substituteIds)
    ? record.substituteIds
    : [];
  const traceabilityDate = record?.createdAt || new Date().toISOString();
  const traceabilityUser = record?.createdBy || getCurrentArticleCreator().name;

  return `
    <form class="org-form" data-art-form="article">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Code article</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label>Nom</label>
          <input name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de l'article" required />
        </div>
        <div class="field-group">
          <label>Référence</label>
          <input name="reference" type="text" value="${escapeHtml(record?.reference || "")}" placeholder="Référence fournisseur" />
        </div>
        <div class="field-group">
          <label>Unité de mesure *</label>
          <select name="unitMeasure" required>
            ${buildArticleUnitMeasureOptions(selectedUnitMeasure)}
          </select>
        </div>
        <div class="field-group">
          <label>Type d'article</label>
          <select name="articleType">
            ${buildArticleTypeOptions(selectedType)}
          </select>
        </div>
        <div class="field-group">
          <label>Marque</label>
          <input name="brand" type="text" value="${escapeHtml(record?.brand || "")}" placeholder="Marque" />
        </div>
        <div class="field-group">
          <label>Prix</label>
          <input name="price" type="number" step="0.01" value="${escapeHtml(record?.price || "")}" placeholder="Prix" />
        </div>
        <div class="field-group">
          <label>Quantité</label>
          <input name="quantity" type="number" step="1" value="${escapeHtml(record?.quantity || "")}" placeholder="Quantité en stock" />
        </div>
        <div class="field-group field-group-wide">
          <label>Fournisseur principal</label>
          <select name="supplier">
            ${buildArticleSupplierOptions(selectedSupplier)}
          </select>
        </div>
        <div class="field-group">
          <label>Groupe</label>
          <select name="groupId">
            ${buildArticleGroupOptions(selectedGroup)}
          </select>
        </div>
        <div class="field-group">
          <label>Famille</label>
          <select name="familyId">
            ${buildArticleFamilyOptions(selectedFamily, selectedGroup)}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label>Désignations</label>
          <textarea name="designations" rows="3" placeholder="Désignation / description">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
        <div class="field-group field-group-wide">
          <label>Articles substituts</label>
          <select name="substituteIds" multiple size="4">
            ${buildArticleSubstituteOptions(selectedSubstitutes, record?.id || "")}
          </select>
          <div class="org-field-hint">Sélectionnez un ou plusieurs articles de remplacement en cas de rupture.</div>
        </div>
        <div class="field-group field-group-wide">
          <label>Traçabilité</label>
          <div class="org-form-grid org-form-grid--two">
            <div class="field-group">
              <label>Date création</label>
              <input type="text" value="${escapeHtml(formatArticleTraceabilityDate(traceabilityDate))}" readonly />
            </div>
            <div class="field-group">
              <label>Créé par</label>
              <input type="text" value="${escapeHtml(traceabilityUser)}" readonly />
            </div>
          </div>
        </div>
        <div class="field-group">
          <label>Photo</label>
          <input name="photos" type="file" accept="image/*" />
        </div>
        ${record && Array.isArray(record.photos) && record.photos.length ? `<div class="field-group field-group-wide">${buildArticleAttachmentsPreview(record, mode === "edit")}</div>` : ""}
      </div>

      ${buildOrganizationFormFooter("article", mode, record?.id || "")}
    </form>
  `;
}

function buildArticleListActions(pageKey, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-art-action="details" data-art-page="${pageKey}" data-art-id="${recordId}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-art-action="edit" data-art-page="${pageKey}" data-art-id="${recordId}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-art-action="delete" data-art-page="${pageKey}" data-art-id="${recordId}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildArticleDetailsContent(record) {
  const primaryPhoto = Array.isArray(record.photos) ? record.photos[0] : null;
  const primaryPhotoSrc = primaryPhoto?.dataUrl || primaryPhoto || "";
  const substituteNames = joinNames(
    getArticleRecords("articles"),
    record.substituteIds || [],
  );

  return `
    <div class="equipment-detail-layout">
      <div class="equipment-detail-media">
        <div class="equipment-detail-image">
          ${primaryPhotoSrc ? `<img src="${primaryPhotoSrc}" alt="${escapeHtml(record.name)}" />` : `<div class="equipment-detail-placeholder"><i class="fa-regular fa-image"></i><span>Aucune photo disponible</span></div>`}
        </div>
      </div>
      <div class="equipment-detail-info">
        <div class="equipment-detail-list">
          <div class="equipment-detail-row"><span>Code</span><strong>${record.code}</strong></div>
          <div class="equipment-detail-row"><span>Nom</span><strong>${record.name}</strong></div>
          <div class="equipment-detail-row"><span>Référence</span><strong>${record.reference || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Unité de mesure</span><strong>${record.unitMeasure || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Type d'article</span><strong>${record.articleType || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Marque</span><strong>${record.brand || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Fournisseur principal</span><strong>${record.supplier || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Prix</span><strong>${record.price || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Quantité</span><strong>${record.quantity || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Groupe</span><strong>${getArticleRecord("groups", record.groupId) ? `${getArticleRecord("groups", record.groupId).code} — ${getArticleRecord("groups", record.groupId).name}` : "-"}</strong></div>
          <div class="equipment-detail-row"><span>Famille</span><strong>${getArticleRecord("families", record.familyId) ? `${getArticleRecord("families", record.familyId).code} — ${getArticleRecord("families", record.familyId).name}` : "-"}</strong></div>
          <div class="equipment-detail-row"><span>Articles substituts</span><strong>${substituteNames}</strong></div>
          <div class="equipment-detail-row"><span>Date création</span><strong>${formatArticleTraceabilityDate(record.createdAt)}</strong></div>
          <div class="equipment-detail-row"><span>Créé par</span><strong>${record.createdBy || "-"}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function buildArticleGroupDetailsContent(record) {
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Organes associés</span><strong>${joinRecordLabels(getOrganeRecords("organes"), record.associatedOrganeIds || [], (o) => `${o.code} — ${o.name}`)}</strong></div>
    </div>
  `;
}

function buildArticleFamilyDetailsContent(record) {
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item"><span>Groupe</span><strong>${getArticleRecord("groups", record.groupId) ? `${getArticleRecord("groups", record.groupId).code} — ${getArticleRecord("groups", record.groupId).name}` : "-"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
    </div>
  `;
}

function renderArticleGroupsPage() {
  const directory = getArticleDirectory();
  renderArticlePageHeader(
    "Articles",
    "Gestion des groupes, familles et articles.",
  );
  renderArticleActionButtons("groupe-article", "Nouveau groupe article");

  if (!pageContentEl) return;

  const rows = directory.groups.length
    ? directory.groups
        .map(
          (group) => `
          <tr>
            <td><strong>${group.code}</strong></td>
            <td>${group.name}</td>
            <td class="muted">${group.designations || "-"}</td>
            <td class="muted">${joinRecordLabels(getOrganeRecords("organes"), group.associatedOrganeIds || [], (o) => `${o.code} — ${o.name}`)}</td>
            <td>${buildArticleListActions("groupe-article", group.id)}</td>
          </tr>
        `,
        )
        .join("")
    : `
        <tr><td colspan="5">${buildOrganizationEmptyState("fa-boxes", "Aucun groupe article", "Créez le premier groupe article.")}</td></tr>
      `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildArticleTabs("groupe-article")}
    <div class="card org-list-card">
      <div class="card-head"><div class="card-title"><i class="fa-solid fa-layer-group"></i> Liste des groupes articles</div><span class="status-badge badge-info">${directory.groups.length} lignes</span></div>
      <div class="table-wrap"><table><thead><tr><th>Code</th><th>Nom</th><th>Désignations</th><th>Organes associés</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;

  if (articleModalState) {
    const modalId = articleModalState.recordId || "";
    const modalMode = articleModalState.mode || "create";
    const title = modalId
      ? `Détails de ${getArticleRecord("groups", modalId)?.name || "groupe"}`
      : "Nouveau groupe article";
    const subtitle = modalId
      ? "Toutes les informations du groupe article sélectionné."
      : "Saisissez les informations du nouveau groupe article.";
    const body =
      modalMode === "details" && modalId
        ? buildArticleGroupDetailsContent(getArticleRecord("groups", modalId))
        : buildArticleGroupFormContent(
            getArticleRecord("groups", modalId),
            modalMode,
          );

    renderArticleModal(title, subtitle, body);
  } else if (overlayRootEl) {
    overlayRootEl.innerHTML = "";
  }
}

function renderArticleFamiliesPage() {
  const directory = getArticleDirectory();
  renderArticlePageHeader(
    "Articles",
    "Gestion des groupes, familles et articles.",
  );
  renderArticleActionButtons("famille-article", "Nouvelle famille article");

  if (!pageContentEl) return;

  const rows = directory.families.length
    ? directory.families
        .map(
          (family) => `
          <tr>
            <td><strong>${family.code}</strong></td>
            <td>${family.name}</td>
            <td class="muted">${family.designations || "-"}</td>
            <td class="muted">${getArticleRecord("groups", family.groupId) ? getArticleRecord("groups", family.groupId).name : "-"}</td>
            <td>${buildArticleListActions("famille-article", family.id)}</td>
          </tr>
        `,
        )
        .join("")
    : `<tr><td colspan="5">${buildOrganizationEmptyState("fa-folder-open", "Aucune famille article", "Créez la première famille article.")}</td></tr>`;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildArticleTabs("famille-article")}
    <div class="card org-list-card">
      <div class="card-head"><div class="card-title"><i class="fa-solid fa-layer-group"></i> Liste des familles articles</div><span class="status-badge badge-info">${directory.families.length} lignes</span></div>
      <div class="table-wrap"><table><thead><tr><th>Code</th><th>Nom</th><th>Désignations</th><th>Groupe</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;

  if (articleModalState) {
    const modalId = articleModalState.recordId || "";
    const modalMode = articleModalState.mode || "create";
    const title = modalId
      ? `Détails de ${getArticleRecord("families", modalId)?.name || "famille"}`
      : "Nouvelle famille article";
    const subtitle = modalId
      ? "Toutes les informations de la famille article sélectionnée."
      : "Saisissez les informations de la nouvelle famille article.";
    const body =
      modalMode === "details" && modalId
        ? buildArticleFamilyDetailsContent(
            getArticleRecord("families", modalId),
          )
        : buildArticleFamilyFormContent(
            getArticleRecord("families", modalId),
            modalMode,
          );

    renderArticleModal(title, subtitle, body);
  } else if (overlayRootEl) {
    overlayRootEl.innerHTML = "";
  }
}

function renderArticleItemsPage() {
  const directory = getArticleDirectory();
  renderArticlePageHeader(
    "Articles",
    "Gestion des groupes, familles et articles.",
  );
  renderArticleActionButtons("article", "Nouvel article");

  if (!pageContentEl) return;

  const rows = directory.articles.length
    ? directory.articles
        .map(
          (item) => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td class="muted">${getArticleRecord("groups", item.groupId) ? getArticleRecord("groups", item.groupId).name : "-"}</td>
            <td class="muted">${getArticleRecord("families", item.familyId) ? getArticleRecord("families", item.familyId).name : "-"}</td>
            <td class="muted">${item.price || "-"}</td>
            <td>${buildArticleListActions("article", item.id)}</td>
          </tr>
        `,
        )
        .join("")
    : `<tr><td colspan="6">${buildOrganizationEmptyState("fa-box-open", "Aucun article", "Créez le premier article.")}</td></tr>`;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildArticleTabs("article")}
    <div class="card org-list-card">
      <div class="card-head"><div class="card-title"><i class="fa-solid fa-boxes"></i> Liste des articles</div><span class="status-badge badge-info">${directory.articles.length} lignes</span></div>
      <div class="table-wrap"><table><thead><tr><th>Code</th><th>Nom</th><th>Groupe</th><th>Famille</th><th>Prix</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;

  if (articleModalState) {
    const modalId = articleModalState.recordId || "";
    const modalMode = articleModalState.mode || "create";
    const title = modalId
      ? `Détails de ${getArticleRecord("articles", modalId)?.name || "article"}`
      : "Nouvel article";
    const subtitle = modalId
      ? "Toutes les informations de l'article sélectionné."
      : "Saisissez les informations du nouvel article.";
    const body =
      modalMode === "details" && modalId
        ? buildArticleDetailsContent(getArticleRecord("articles", modalId))
        : buildArticleFormContent(
            getArticleRecord("articles", modalId),
            modalMode,
          );

    renderArticleModal(title, subtitle, body);
  } else if (overlayRootEl) {
    overlayRootEl.innerHTML = "";
  }
}

function buildArticleTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages articles">
      ${Object.entries(sectionSubpages.articles.tabs)
        .map(
          ([key, tab]) => `
          <button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-art-subpage="${key}">
            ${tab.label}
          </button>
        `,
        )
        .join("")}
    </div>
  `;
}

function attachArticleTabHandlers(selector) {
  if (!pageContentEl) return;
  pageContentEl.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function () {
      const next = this.dataset.artSubpage || "groupe-article";
      renderPage("articles", next);
      window.location.hash = `articles/${next}`;
    });
  });
}

function renderArticlePage(subpageKey) {
  const activeSubpageKey = sectionSubpages.articles.tabs[subpageKey]
    ? subpageKey
    : sectionSubpages.articles.defaultSubpage;

  if (!pageContentEl) return;

  if (activeSubpageKey === "groupe-article") {
    renderArticleGroupsPage();
  } else if (activeSubpageKey === "famille-article") {
    renderArticleFamiliesPage();
  } else {
    renderArticleItemsPage();
  }

  attachArticleTabHandlers("[data-art-subpage]");
  attachArticlePageHandlers(activeSubpageKey);
}

function renderArticlePageHeader(title, subtitle) {
  if (pageTitleEl) pageTitleEl.textContent = title;
  if (pageSubtitleEl) pageSubtitleEl.textContent = subtitle;
}

function renderArticleActionButtons(pageKey, createLabel) {
  if (!pageActionsEl) return;
  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-art-create="${pageKey}">
      <i class="fa-solid fa-plus"></i>
      <span>${createLabel}</span>
    </button>
  `;
  const createButton = pageActionsEl.querySelector("[data-art-create]");
  if (createButton)
    createButton.addEventListener("click", function () {
      openArticleModal(pageKey, "create");
    });
}

function attachArticlePageHandlers(pageKey) {
  if (!pageContentEl) return;
  // Clear any leftover overlay modal if no modal state is active across modules
  if (
    overlayRootEl &&
    !articleModalState &&
    !organizationModalState &&
    !equipmentModalState &&
    !organeModalState
  ) {
    overlayRootEl.innerHTML = "";
  }

  // Listen for create buttons that may live in the page content or in the global actions bar
  const createBtns = [
    ...(pageContentEl
      ? Array.from(pageContentEl.querySelectorAll("[data-art-create]"))
      : []),
    ...(pageActionsEl
      ? Array.from(pageActionsEl.querySelectorAll("[data-art-create]"))
      : []),
  ];
  createBtns.forEach((button) => {
    button.removeEventListener("click", button._artCreateListener);
    const listener = function () {
      openArticleModal(pageKey, "create");
    };
    button._artCreateListener = listener;
    button.addEventListener("click", listener);
  });

  pageContentEl.querySelectorAll("[data-art-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.artAction;
      const targetPage = this.dataset.artPage || pageKey;
      const recordId = this.dataset.artId || "";

      if (action === "details") {
        openArticleModal(targetPage, "details", recordId);
        return;
      }
      if (action === "edit") {
        openArticleModal(targetPage, "edit", recordId);
        return;
      }
      if (action === "delete") {
        const record = getArticleRecord(
          targetPage === "article"
            ? "articles"
            : targetPage === "famille-article"
              ? "families"
              : "groups",
          recordId,
        );
        if (!record) return;
        const confirmed = window.confirm(
          `Supprimer ${record.name} ? Cette action est irréversible.`,
        );
        if (!confirmed) return;
        const directory = getArticleDirectory();
        if (targetPage === "groupe-article") {
          const linkedFamilyIds = directory.families
            .filter((f) => f.groupId === recordId)
            .map((f) => f.id);
          directory.groups = directory.groups.filter((g) => g.id !== recordId);
          directory.families = directory.families.map((f) =>
            f.groupId === recordId ? { ...f, groupId: "" } : f,
          );
          directory.articles = directory.articles.map((a) => ({
            ...a,
            groupId: a.groupId === recordId ? "" : a.groupId,
            familyId: linkedFamilyIds.includes(a.familyId) ? "" : a.familyId,
          }));
        } else if (targetPage === "famille-article") {
          directory.families = directory.families.filter(
            (f) => f.id !== recordId,
          );
          directory.articles = directory.articles.map((a) =>
            a.familyId === recordId ? { ...a, familyId: "" } : a,
          );
        } else {
          directory.articles = directory.articles.filter(
            (a) => a.id !== recordId,
          );
        }
        saveArticleDirectory(directory);
        renderArticlePage(pageKey);
        window.location.hash = `articles/${pageKey}`;
      }
    });
  });

  const modal = overlayRootEl
    ? overlayRootEl.querySelector(".org-modal")
    : null;
  if (!modal) return;

  modal.querySelectorAll("[data-art-close]").forEach((button) => {
    button.addEventListener("click", function () {
      articleModalState = null;
      renderArticlePage(pageKey);
    });
  });

  const form = modal.querySelector("[data-art-form]");
  if (!form) return;

  attachAttachmentRemovalHandlers(form);

  const groupSelect = form.querySelector("select[name='groupId']");
  if (groupSelect) {
    groupSelect.addEventListener("change", function () {
      const familySelect = form.querySelector("select[name='familyId']");
      if (familySelect) {
        const families = getArticleRecords("families").filter(
          (f) => !this.value || f.groupId === this.value,
        );
        familySelect.innerHTML = [
          '<option value="">Sélectionner une famille</option>',
          ...families.map(
            (f) => `<option value="${f.id}">${f.code} — ${f.name}</option>`,
          ),
        ].join("");
      }
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const directory = getArticleDirectory();
    const recordId = String(
      form.querySelector("input[name='recordId']")?.value || "",
    );
    const existing = recordId
      ? getArticleRecord(
          pageKey === "article"
            ? "articles"
            : pageKey === "famille-article"
              ? "families"
              : "groups",
          recordId,
        )
      : null;

    if (pageKey === "groupe-article") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      if (!name) return;
      const next = {
        id: existing?.id || `article-group-${Date.now()}`,
        code:
          existing?.code ||
          generateOrganizationCode("GRPART", directory.groups),
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
        associatedOrganeIds: getSelectedValues(
          form.querySelector("select[name='associatedOrganeIds']"),
        ),
      };
      const updated = directory.groups.filter((g) => g.id !== next.id);
      updated.push(next);
      directory.groups = updated.sort((a, b) => a.code.localeCompare(b.code));
      saveArticleDirectory(directory);
      articleModalState = null;
      renderArticlePage(pageKey);
      return;
    }

    if (pageKey === "famille-article") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      const groupId = String(
        form.querySelector("select[name='groupId']")?.value || "",
      );
      if (!name || !groupId) return;
      const next = {
        id: existing?.id || `article-family-${Date.now()}`,
        code:
          existing?.code ||
          generateOrganizationCode("FAMART", directory.families),
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
        groupId,
      };
      const updated = directory.families.filter((f) => f.id !== next.id);
      updated.push(next);
      directory.families = updated.sort((l, r) => l.code.localeCompare(r.code));
      saveArticleDirectory(directory);
      articleModalState = null;
      renderArticlePage(pageKey);
      return;
    }

    const name = String(
      form.querySelector("input[name='name']")?.value || "",
    ).trim();
    const groupId = String(
      form.querySelector("select[name='groupId']")?.value || "",
    );
    const familyId = String(
      form.querySelector("select[name='familyId']")?.value || "",
    );
    if (!name) return;
    const removedPhotos = getAttachmentRemovalIndexes(form, "photos");
    const photos = await readEquipmentFiles(
      form.querySelector("input[name='photos']")?.files,
    );
    const currentCreator = getCurrentArticleCreator();
    const substituteIds = getSelectedValues(
      form.querySelector("select[name='substituteIds']"),
    );

    const next = {
      id: existing?.id || `article-${Date.now()}`,
      code:
        existing?.code || generateOrganizationCode("ART", directory.articles),
      name,
      unitMeasure: String(
        form.querySelector("input[name='unitMeasure']")?.value || "",
      ).trim(),
      articleType: String(
        form.querySelector("select[name='articleType']")?.value || "",
      ),
      reference: String(
        form.querySelector("input[name='reference']")?.value || "",
      ).trim(),
      supplier: String(
        form.querySelector("input[name='supplier']")?.value || "",
      ).trim(),
      brand: String(
        form.querySelector("input[name='brand']")?.value || "",
      ).trim(),
      price: String(
        form.querySelector("input[name='price']")?.value || "",
      ).trim(),
      quantity: String(
        form.querySelector("input[name='quantity']")?.value || "",
      ).trim(),
      groupId,
      familyId,
      designations: String(
        form.querySelector("textarea[name='designations']")?.value || "",
      ).trim(),
      substituteIds,
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdById: existing?.createdById || currentCreator.id,
      createdBy: existing?.createdBy || currentCreator.name,
      photos: [
        ...filterStoredAttachments(existing?.photos, removedPhotos),
        ...photos,
      ],
    };

    const updated = directory.articles.filter((a) => a.id !== next.id);
    updated.push(next);
    directory.articles = updated.sort((l, r) => l.code.localeCompare(r.code));
    saveArticleDirectory(directory);
    articleModalState = null;
    renderArticlePage(pageKey);
  });
}

let equipmentModalState = null;

const equipmentStorageKey = "maintflow.equipmentCatalog";

const equipmentDefaults = {
  groups: [
    {
      id: "equipment-group-1",
      code: "GRP-001",
      name: "Groupe puissance",
      designations: "Distribution électrique et motorisation",
      departmentIds: ["department-2"],
    },
    {
      id: "equipment-group-2",
      code: "GRP-002",
      name: "Groupe process",
      designations: "Pompage, chauffage et fluides",
      departmentIds: ["department-1"],
    },
    {
      id: "equipment-group-3",
      code: "GRP-003",
      name: "Groupe manutention",
      designations: "Convoyage, levage et manutention",
      departmentIds: ["service-1"],
    },
  ],
  families: [
    {
      id: "equipment-family-1",
      code: "FAM-001",
      groupId: "equipment-group-1",
      name: "Armoire électrique",
      designations: "Tableaux, armoires et alimentation",
    },
    {
      id: "equipment-family-2",
      code: "FAM-002",
      groupId: "equipment-group-1",
      name: "Moteur électrique",
      designations: "Moteurs et variateurs",
    },
    {
      id: "equipment-family-3",
      code: "FAM-003",
      groupId: "equipment-group-2",
      name: "Pompe industrielle",
      designations: "Pompes de process et circulation",
    },
    {
      id: "equipment-family-4",
      code: "FAM-004",
      groupId: "equipment-group-3",
      name: "Convoyeur",
      designations: "Convoyeurs et lignes de transfert",
    },
  ],
  equipments: [
    {
      id: "equipment-1",
      code: "EQP-001",
      name: "TGBT principal",
      groupId: "equipment-group-1",
      familyId: "equipment-family-1",
      brand: "Schneider",
      supplier: "ElectroPlus",
      serialNumber: "SER-1001",
      criticality: "Critique",
      purchasePrice: "120000",
      purchaseDate: "2025-01-12",
      serviceDate: "2025-02-01",
      warrantyDuration: "24 mois",
      status: "En service",
      designations: "Alimentation générale de la zone production.",
      photos: [],
      documents: [],
    },
    {
      id: "equipment-2",
      code: "EQP-002",
      name: "Pompe P2",
      groupId: "equipment-group-2",
      familyId: "equipment-family-3",
      brand: "Grundfos",
      supplier: "HydroServices",
      serialNumber: "SER-2044",
      criticality: "Haute",
      purchasePrice: "78500",
      purchaseDate: "2024-10-18",
      serviceDate: "2024-11-05",
      warrantyDuration: "18 mois",
      status: "En maintenance",
      designations: "Pompage du circuit secondaire.",
      photos: [],
      documents: [],
    },
    {
      id: "equipment-3",
      code: "EQP-003",
      name: "Convoyeur L4",
      groupId: "equipment-group-3",
      familyId: "equipment-family-4",
      brand: "SEW",
      supplier: "MecaLine",
      serialNumber: "SER-3307",
      criticality: "Moyenne",
      purchasePrice: "54200",
      purchaseDate: "2024-07-02",
      serviceDate: "2024-07-20",
      warrantyDuration: "12 mois",
      status: "En panne",
      designations: "Convoyeur de la ligne 4.",
      photos: [],
      documents: [],
    },
  ],
};

let organeModalState = null;

const organeStorageKey = "maintflow.organeCatalog";

const organeDefaults = {
  groups: [
    {
      id: "organe-group-1",
      code: "GOR-001",
      name: "Groupe transmission",
      designations: "Organes de transmission et couplage",
      associatedEquipmentIds: ["equipment-3"],
    },
    {
      id: "organe-group-2",
      code: "GOR-002",
      name: "Groupe pompage",
      designations: "Organes hydrauliques et étanchéité",
      associatedEquipmentIds: ["equipment-2"],
    },
  ],
  families: [
    {
      id: "organe-family-1",
      code: "FGO-001",
      groupId: "organe-group-1",
      name: "Roulement",
      designations: "Roulements, paliers et supports",
    },
    {
      id: "organe-family-2",
      code: "FGO-002",
      groupId: "organe-group-1",
      name: "Accouplement",
      designations: "Accouplements et éléments de liaison",
    },
    {
      id: "organe-family-3",
      code: "FGO-003",
      groupId: "organe-group-2",
      name: "Garniture mécanique",
      designations: "Étanchéité de pompes et circuits",
    },
  ],
  organes: [
    {
      id: "organe-1",
      code: "ORG-001",
      name: "Roulement AR Convoyeur L4",
      groupId: "organe-group-1",
      familyId: "organe-family-1",
      criticality: "Haute",
      brand: "SKF",
      supplier: "BearingPro",
      serialNumber: "ORG-SER-1001",
      purchasePrice: "8600",
      purchaseDate: "2025-03-18",
      serviceDate: "2025-04-02",
      warrantyDuration: "12 mois",
      status: "En service",
      photos: [],
      documents: [],
    },
    {
      id: "organe-2",
      code: "ORG-002",
      name: "Garniture Pompe P2",
      groupId: "organe-group-2",
      familyId: "organe-family-3",
      criticality: "Critique",
      brand: "FlowSeal",
      supplier: "HydroServices",
      serialNumber: "ORG-SER-2042",
      purchasePrice: "12900",
      purchaseDate: "2024-12-07",
      serviceDate: "2024-12-20",
      warrantyDuration: "18 mois",
      status: "En maintenance",
      photos: [],
      documents: [],
    },
  ],
};

const enterpriseStorageKey = "maintflow.enterpriseProfile";

const enterpriseDefaults = {
  name: "",
  wilaya: "",
  daira: "",
  commune: "",
  phone: "",
  code: "",
  logo: "",
};

let enterpriseEditMode = false;

function generateEnterpriseCode() {
  return `ENT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;
}

function getEnterpriseProfile() {
  let profile = { ...enterpriseDefaults };

  try {
    const stored = window.localStorage.getItem(enterpriseStorageKey);
    if (stored) {
      profile = { ...profile, ...JSON.parse(stored) };
    }
  } catch (error) {
    profile = { ...enterpriseDefaults };
  }

  if (!profile.code) {
    profile.code = generateEnterpriseCode();
    saveEnterpriseProfile(profile);
  }

  return profile;
}

function saveEnterpriseProfile(profile) {
  try {
    window.localStorage.setItem(enterpriseStorageKey, JSON.stringify(profile));
  } catch (error) {
    // Local storage unavailable: keep the UI functional without persistence.
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEnterprisePage() {
  const profile = getEnterpriseProfile();

  if (pageActionsEl) {
    pageActionsEl.innerHTML = `
      <button class="btn ${enterpriseEditMode ? "btn-outline" : "btn-primary"}" type="button" id="enterpriseToggleBtn">
        <i class="fa-solid ${enterpriseEditMode ? "fa-lock" : "fa-pen-to-square"}"></i>
        <span>${enterpriseEditMode ? "Verrouiller" : "Modifier"}</span>
      </button>
      <button class="btn btn-outline" type="button" id="enterpriseSaveBtn" ${enterpriseEditMode ? "" : "disabled"}>
        <i class="fa-solid fa-floppy-disk"></i>
        <span>Enregistrer</span>
      </button>
    `;
  }

  if (!pageContentEl) return;

  pageContentEl.className = "organization-page";
  pageContentEl.innerHTML = `
    <div class="enterprise-card">
      <div class="enterprise-grid">
        <div class="enterprise-logo-block">
          <div class="enterprise-logo" id="enterpriseLogoPreview">
              ${profile.logo ? `<img src="${profile.logo}" alt="Logo de l'entreprise" />` : `<i class="fa-solid fa-building"></i>`}
          </div>
          <div class="enterprise-logo-actions">
            <label class="btn btn-outline ${enterpriseEditMode ? "" : "is-disabled"}" for="enterpriseLogoInput">
              <i class="fa-regular fa-image"></i>
              <span>Ajouter le logo</span>
            </label>
            <input id="enterpriseLogoInput" type="file" accept="image/*" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="enterprise-hint">Le logo peut être ajouté après la création de l’entreprise.</div>
        </div>

        <div class="enterprise-form">
          <div class="field-group">
            <label for="enterpriseName">Nom</label>
            <input id="enterpriseName" type="text" value="${escapeHtml(profile.name)}" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="field-group">
            <label for="enterpriseWilaya">Wilaya</label>
            <input id="enterpriseWilaya" type="text" value="${escapeHtml(profile.wilaya)}" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="field-group">
            <label for="enterpriseDaira">Daira</label>
            <input id="enterpriseDaira" type="text" value="${escapeHtml(profile.daira)}" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="field-group">
            <label for="enterpriseCommune">Commune</label>
            <input id="enterpriseCommune" type="text" value="${escapeHtml(profile.commune)}" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="field-group">
            <label for="enterprisePhone">Numéro téléphone</label>
            <input id="enterprisePhone" type="tel" value="${escapeHtml(profile.phone)}" ${enterpriseEditMode ? "" : "disabled"} />
          </div>
          <div class="field-group">
            <label for="enterpriseCode">Code entreprise</label>
            <input id="enterpriseCode" type="text" value="${escapeHtml(profile.code)}" disabled />
          </div>
        </div>
      </div>
    </div>
  `;

  const toggleBtn = document.getElementById("enterpriseToggleBtn");
  const saveBtn = document.getElementById("enterpriseSaveBtn");
  const logoInput = document.getElementById("enterpriseLogoInput");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      enterpriseEditMode = !enterpriseEditMode;
      renderOrganizationPage("entreprise");
      window.location.hash = "organisation/entreprise";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      const current = getEnterpriseProfile();
      const nextProfile = {
        ...current,
        name: (document.getElementById("enterpriseName")?.value || "").trim(),
        wilaya: (
          document.getElementById("enterpriseWilaya")?.value || ""
        ).trim(),
        daira: (document.getElementById("enterpriseDaira")?.value || "").trim(),
        commune: (
          document.getElementById("enterpriseCommune")?.value || ""
        ).trim(),
        phone: (document.getElementById("enterprisePhone")?.value || "").trim(),
      };

      saveEnterpriseProfile(nextProfile);
      enterpriseEditMode = false;
      renderOrganizationPage("entreprise");
      window.location.hash = "organisation/entreprise";
    });
  }

  if (logoInput) {
    logoInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        const current = getEnterpriseProfile();
        const updated = { ...current, logo: String(reader.result || "") };
        saveEnterpriseProfile(updated);
        renderOrganizationPage("entreprise");
        window.location.hash = "organisation/entreprise";
      };
      reader.readAsDataURL(file);
    });
  }
}

function buildOrganizationTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages organisation">
      ${Object.entries(organizationSubpages)
        .map(
          ([key, subpage]) => `
            <button
              class="org-tab ${key === activeSubpageKey ? "active" : ""}"
              type="button"
              data-org-subpage="${key}"
            >
              ${subpage.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function attachOrganizationTabHandlers(selector) {
  pageContentEl.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.orgSubpage || "entreprise";
      renderPage("organisation", nextSubpage);
      window.location.hash = `organisation/${nextSubpage}`;
    });
  });
}

function renderDashboardActions() {
  if (!pageActionsEl) return;

  // Actions intentionally empty: buttons removed per request.
  pageActionsEl.innerHTML = "";
}

function getOrganizationDirectory() {
  let directory = JSON.parse(JSON.stringify(organizationDefaults));

  try {
    const stored = window.localStorage.getItem(organizationStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      directory = {
        unites: Array.isArray(parsed.unites) ? parsed.unites : directory.unites,
        divisions: Array.isArray(parsed.divisions)
          ? parsed.divisions
          : directory.divisions,
        departmentServices: Array.isArray(parsed.departmentServices)
          ? parsed.departmentServices
          : directory.departmentServices,
      };
    }
  } catch (error) {
    directory = JSON.parse(JSON.stringify(organizationDefaults));
  }

  return directory;
}

function saveOrganizationDirectory(directory) {
  try {
    window.localStorage.setItem(
      organizationStorageKey,
      JSON.stringify(directory),
    );
  } catch (error) {
    // Keep the UI usable even if persistent storage is not available.
  }
}

function getOrganizationUser(userId) {
  return organizationUsers.find((user) => user.id === userId) || null;
}

function getOrganizationRecords(kind) {
  const directory = getOrganizationDirectory();
  if (kind === "unites") return directory.unites;
  if (kind === "divisions") return directory.divisions;
  return directory.departmentServices;
}

function getOrganizationRecord(kind, recordId) {
  return (
    getOrganizationRecords(kind).find((record) => record.id === recordId) ||
    null
  );
}

function setOrganizationModalState(state) {
  organizationModalState = state;
}

function closeOrganizationModal(pageKey) {
  setOrganizationModalState(null);
  renderOrganizationPage(pageKey);
  window.location.hash = `organisation/${pageKey}`;
}

function openOrganizationModal(pageKey, mode, recordId = null) {
  setOrganizationModalState({ pageKey, mode, recordId });
  renderOrganizationPage(pageKey);
  window.location.hash = `organisation/${pageKey}`;
}

function generateOrganizationCode(prefix, records) {
  const maxValue = records.reduce((accumulator, record) => {
    const match = String(record.code || "").match(/-(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return value > accumulator ? value : accumulator;
  }, 0);

  return `${prefix}-${String(maxValue + 1).padStart(3, "0")}`;
}

function joinNames(items, ids) {
  const names = ids
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => item.name);

  return names.length ? names.join(", ") : "Aucune sélection";
}

function buildResponsibleOptions(selectedUserId) {
  return [
    `<option value="">Sélectionner un responsable</option>`,
    ...organizationUsers.map(
      (user) => `
        <option value="${user.id}"${user.id === selectedUserId ? " selected" : ""}>
          ${user.name} — ${user.role}
        </option>
      `,
    ),
  ].join("");
}

function buildUnitOptions(selectedUnitIds = []) {
  const units = getOrganizationRecords("unites");
  return units
    .map(
      (unit) => `
        <option value="${unit.id}"${selectedUnitIds.includes(unit.id) ? " selected" : ""}>
          ${unit.code} — ${unit.name}
        </option>
      `,
    )
    .join("");
}

function buildDivisionOptions(selectedDivisionIds = []) {
  const divisions = getOrganizationRecords("divisions");
  return divisions
    .map(
      (division) => `
        <option value="${division.id}"${selectedDivisionIds.includes(division.id) ? " selected" : ""}>
          ${division.code} — ${division.name}
        </option>
      `,
    )
    .join("");
}

function getSelectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map((option) => option.value);
}

function escapeTextarea(value) {
  return escapeHtml(value || "");
}

function getResponsibleEmail(userId) {
  const user = getOrganizationUser(userId);
  return user ? user.email : "";
}

function buildOrganizationModalShell(title, subtitle, bodyHtml) {
  return `
    <div class="org-modal ${organizationModalState ? "open" : ""}" role="presentation">
      <div class="org-modal-backdrop" data-org-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="orgModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Organisation</div>
            <h3 id="orgModalTitle">${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-org-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderOrganizationModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;

  if (!organizationModalState) {
    overlayRootEl.innerHTML = "";
    return;
  }

  overlayRootEl.innerHTML = buildOrganizationModalShell(
    title,
    subtitle,
    bodyHtml,
  );
}

function buildOrganizationEmptyState(icon, title, body, note) {
  return `
    <div class="org-empty-card org-empty-card--list">
      <div class="blank-badge"><i class="fa-regular ${icon}"></i></div>
      <h2>${title}</h2>
      <p>${body}</p>
      <span class="blank-note">${note}</span>
    </div>
  `;
}

function renderOrganizationActionButtons(pageKey, createLabel) {
  if (!pageActionsEl) return;

  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-org-create="${pageKey}">
      <i class="fa-solid fa-plus"></i>
      <span>${createLabel}</span>
    </button>
  `;

  const createButton = pageActionsEl.querySelector("[data-org-create]");
  if (createButton) {
    createButton.addEventListener("click", function () {
      openOrganizationModal(pageKey, "create");
    });
  }
}

function renderOrganizationPageHeader(title, subtitle) {
  if (pageTitleEl) pageTitleEl.textContent = title;
  if (pageSubtitleEl) pageSubtitleEl.textContent = subtitle;
}

function renderOrganizationStats(stats) {
  return `
    <div class="org-summary-grid">
      ${stats
        .map(
          (stat) => `
            <div class="org-summary-card">
              <div class="org-summary-label">${stat.label}</div>
              <div class="org-summary-value">${stat.value}</div>
              <div class="org-summary-note">${stat.note}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function buildOrganizationListActions(pageKey, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-org-action="details" data-org-page="${pageKey}" data-org-id="${recordId}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-org-action="edit" data-org-page="${pageKey}" data-org-id="${recordId}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-org-action="delete" data-org-page="${pageKey}" data-org-id="${recordId}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildOrganizationFormFooter(pageKey, mode, recordId) {
  return `
    <div class="org-modal-actions">
      <button class="btn btn-outline" type="button" data-org-close="true">Annuler</button>
      <button class="btn btn-primary" type="submit">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>${mode === "edit" ? "Mettre à jour" : "Créer"}</span>
      </button>
    </div>
    <input type="hidden" name="recordId" value="${recordId || ""}" />
    <input type="hidden" name="pageKey" value="${pageKey}" />
  `;
}

function syncResponsibleEmail(selectEl, emailInput) {
  if (!selectEl || !emailInput) return;
  emailInput.value = getResponsibleEmail(selectEl.value);
}

function renderUnitsManagementPage() {
  const directory = getOrganizationDirectory();
  const activeRecord =
    organizationModalState && organizationModalState.pageKey === "unites"
      ? getOrganizationRecord("unites", organizationModalState.recordId)
      : null;

  renderOrganizationPageHeader(
    "Unités",
    "Gestion des unités avec liste, détails, création, modification et suppression.",
  );
  renderOrganizationActionButtons("unites", "Nouvelle unité");

  if (!pageContentEl) return;

  const rows = directory.unites.length
    ? directory.unites
        .map((unit) => {
          const responsible = getOrganizationUser(unit.responsibleUserId);
          return `
            <tr>
              <td><strong>${unit.code}</strong></td>
              <td>${unit.name}</td>
              <td class="muted">${unit.locations || "-"}</td>
              <td class="muted">${unit.phone || "-"}</td>
              <td>
                <div class="org-person-cell">
                  <span>${responsible ? responsible.name : "Non défini"}</span>
                  <small>${responsible ? responsible.email : "Aucun email"}</small>
                </div>
              </td>
              <td>${buildOrganizationListActions("unites", unit.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-building",
            "Aucune unité enregistrée",
            "Créez la première unité pour commencer à structurer l’organisation.",
            "Le bouton Nouvelle unité ouvre le formulaire de création.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganizationTabs("unites")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organisation</div>
        <h2>Unités</h2>
        <p>Chaque unité conserve son code, ses coordonnées et son responsable avec email synchronisé automatiquement.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.unites.length} unités</span>
        <span class="status-badge badge-gray">${directory.divisions.length} divisions liées</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Unités actives",
        value: String(directory.unites.length),
        note: "Enregistrement local dans le navigateur",
      },
      {
        label: "Responsables attribués",
        value: String(
          directory.unites.filter((unit) => unit.responsibleUserId).length,
        ),
        note: "Email chargé automatiquement",
      },
      {
        label: "Description moyenne",
        value: String(
          directory.unites.filter((unit) => unit.description).length,
        ),
        note: "Champs descriptifs facultatifs",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-building"></i> Liste des unités</div>
        <span class="status-badge badge-info">${directory.unites.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Localisations</th>
              <th>Téléphone</th>
              <th>Responsable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

  `;

  renderOrganizationModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouvelle unité",
    activeRecord
      ? "Toutes les informations de l’unité sélectionnée."
      : "Saisissez les informations de la nouvelle unité.",
    organizationModalState &&
      organizationModalState.mode === "details" &&
      activeRecord
      ? buildUnitsDetailsContent(activeRecord)
      : buildUnitsFormContent(
          activeRecord,
          organizationModalState?.mode || "create",
        ),
  );

  attachOrganizationPageHandlers("unites");
}

function buildUnitsFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("UNI", getOrganizationRecords("unites"));
  const selectedResponsible = record?.responsibleUserId || "";
  const selectedEmail = getResponsibleEmail(selectedResponsible);

  return `
    <form class="org-form" data-org-form="unites">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="unitCode">Code unité</label>
          <input id="unitCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="unitName">Nom</label>
          <input id="unitName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de l’unité" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="unitLocations">Localisations</label>
          <input id="unitLocations" name="locations" type="text" value="${escapeHtml(record?.locations || "")}" placeholder="Localisation principale ou zones" />
        </div>
        <div class="field-group">
          <label for="unitPhone">Numéro téléphone</label>
          <input id="unitPhone" name="phone" type="tel" value="${escapeHtml(record?.phone || "")}" placeholder="Téléphone de l’unité" />
        </div>
        <div class="field-group">
          <label for="unitResponsible">Nom de responsable</label>
          <select id="unitResponsible" name="responsibleUserId" data-org-responsible-select>
            ${buildResponsibleOptions(selectedResponsible)}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label for="unitResponsibleEmail">Email du responsable</label>
          <input id="unitResponsibleEmail" name="responsibleEmail" type="email" value="${escapeHtml(selectedEmail)}" readonly />
        </div>
        <div class="field-group field-group-wide">
          <label for="unitDescription">Description</label>
          <textarea id="unitDescription" name="description" rows="4" placeholder="Description facultative">${escapeTextarea(record?.description || "")}</textarea>
        </div>
      </div>

      ${buildOrganizationFormFooter("unites", mode, record?.id || "")}
    </form>
  `;
}

function buildUnitsDetailsContent(record) {
  const responsible = getOrganizationUser(record.responsibleUserId);
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item"><span>Localisations</span><strong>${record.locations || "-"}</strong></div>
      <div class="org-detail-item"><span>Téléphone</span><strong>${record.phone || "-"}</strong></div>
      <div class="org-detail-item"><span>Responsable</span><strong>${responsible ? responsible.name : "Non défini"}</strong></div>
      <div class="org-detail-item"><span>Email</span><strong>${responsible ? responsible.email : "-"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Description</span><strong>${record.description || "Aucune description"}</strong></div>
    </div>
  `;
}

function renderDivisionsManagementPage() {
  const directory = getOrganizationDirectory();
  const activeRecord =
    organizationModalState && organizationModalState.pageKey === "divisions"
      ? getOrganizationRecord("divisions", organizationModalState.recordId)
      : null;

  renderOrganizationPageHeader(
    "Divisions",
    "Gestion des divisions avec liaison multi-unités, responsable et email synchronisé.",
  );
  renderOrganizationActionButtons("divisions", "Nouvelle division");

  if (!pageContentEl) return;

  const rows = directory.divisions.length
    ? directory.divisions
        .map((division) => {
          const responsible = getOrganizationUser(division.responsibleUserId);
          return `
            <tr>
              <td><strong>${division.code}</strong></td>
              <td>${division.name}</td>
              <td class="muted">${joinNames(directory.unites, division.unitIds || [])}</td>
              <td>
                <div class="org-person-cell">
                  <span>${responsible ? responsible.name : "Non défini"}</span>
                  <small>${responsible ? responsible.email : "Aucun email"}</small>
                </div>
              </td>
              <td>${buildOrganizationListActions("divisions", division.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="5">
          ${buildOrganizationEmptyState(
            "fa-diagram-project",
            "Aucune division enregistrée",
            "Créez une division et rattachez-la à une ou plusieurs unités.",
            "Les divisions peuvent appartenir à plusieurs unités.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganizationTabs("divisions")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organisation</div>
        <h2>Divisions</h2>
        <p>Chaque division peut appartenir à plusieurs unités, avec un responsable unique et son email chargé automatiquement.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.divisions.length} divisions</span>
        <span class="status-badge badge-gray">${directory.unites.length} unités disponibles</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Divisions actives",
        value: String(directory.divisions.length),
        note: "Liens multi-unités pris en charge",
      },
      {
        label: "Divisions multi-unités",
        value: String(
          directory.divisions.filter(
            (division) => (division.unitIds || []).length > 1,
          ).length,
        ),
        note: "Une division peut appartenir à plusieurs unités",
      },
      {
        label: "Responsables attribués",
        value: String(
          directory.divisions.filter((division) => division.responsibleUserId)
            .length,
        ),
        note: "Email synchronisé au choix du responsable",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-diagram-project"></i> Liste des divisions</div>
        <span class="status-badge badge-info">${directory.divisions.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Unités liées</th>
              <th>Responsable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

  `;

  renderOrganizationModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouvelle division",
    activeRecord
      ? "Toutes les informations de la division sélectionnée."
      : "Saisissez les informations de la nouvelle division.",
    organizationModalState &&
      organizationModalState.mode === "details" &&
      activeRecord
      ? buildDivisionsDetailsContent(activeRecord)
      : buildDivisionsFormContent(
          activeRecord,
          organizationModalState?.mode || "create",
        ),
  );

  attachOrganizationPageHandlers("divisions");
}

function buildDivisionsFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("DIV", getOrganizationRecords("divisions"));
  const selectedResponsible = record?.responsibleUserId || "";
  const selectedEmail = getResponsibleEmail(selectedResponsible);

  return `
    <form class="org-form" data-org-form="divisions">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="divisionCode">Code division</label>
          <input id="divisionCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="divisionName">Nom</label>
          <input id="divisionName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de la division" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="divisionUnits">Unités rattachées</label>
          <select id="divisionUnits" name="unitIds" multiple size="5">
            ${buildUnitOptions(record?.unitIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs unités.</div>
        </div>
        <div class="field-group">
          <label for="divisionResponsible">Nom de responsable</label>
          <select id="divisionResponsible" name="responsibleUserId" data-org-responsible-select>
            ${buildResponsibleOptions(selectedResponsible)}
          </select>
        </div>
        <div class="field-group">
          <label for="divisionResponsibleEmail">Email du responsable</label>
          <input id="divisionResponsibleEmail" name="responsibleEmail" type="email" value="${escapeHtml(selectedEmail)}" readonly />
        </div>
        <div class="field-group field-group-wide">
          <label for="divisionDescription">Description</label>
          <textarea id="divisionDescription" name="description" rows="4" placeholder="Description facultative">${escapeTextarea(record?.description || "")}</textarea>
        </div>
      </div>

      ${buildOrganizationFormFooter("divisions", mode, record?.id || "")}
    </form>
  `;
}

function buildDivisionsDetailsContent(record) {
  const responsible = getOrganizationUser(record.responsibleUserId);
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Unités liées</span><strong>${joinNames(getOrganizationRecords("unites"), record.unitIds || [])}</strong></div>
      <div class="org-detail-item"><span>Responsable</span><strong>${responsible ? responsible.name : "Non défini"}</strong></div>
      <div class="org-detail-item"><span>Email</span><strong>${responsible ? responsible.email : "-"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Description</span><strong>${record.description || "Aucune description"}</strong></div>
    </div>
  `;
}

function renderDepartmentServicesManagementPage() {
  const directory = getOrganizationDirectory();
  const activeRecord =
    organizationModalState &&
    organizationModalState.pageKey === "departements-services"
      ? getOrganizationRecord(
          "departmentServices",
          organizationModalState.recordId,
        )
      : null;

  renderOrganizationPageHeader(
    "Département",
    "Gestion des départements avec liaison multi-divisions.",
  );
  renderOrganizationActionButtons(
    "departements-services",
    "Nouveau département",
  );

  if (!pageContentEl) return;

  const filteredRecords = directory.departmentServices;

  const rows = filteredRecords.length
    ? filteredRecords
        .map((record) => {
          const responsible = getOrganizationUser(record.responsibleUserId);
          return `
            <tr>
              <td><strong>${record.code}</strong></td>
              <td>${record.name}</td>
              <td class="muted">${joinNames(directory.divisions, record.divisionIds || [])}</td>
              <td>
                <div class="org-person-cell">
                  <span>${responsible ? responsible.name : "Non défini"}</span>
                  <small>${responsible ? responsible.email : "Aucun email"}</small>
                </div>
              </td>
              <td>${buildOrganizationListActions("departements-services", record.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-folder-open",
            "Aucun département enregistré",
            "Créez un département et rattachez-le à une ou plusieurs divisions.",
            "Les départements supportent plusieurs divisions.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganizationTabs("departements-services")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organisation</div>
        <h2>Département</h2>
        <p>Chaque département peut être rattaché à plusieurs divisions.</p>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Éléments référencés",
        value: String(directory.departmentServices.length),
        note: "Départements uniquement",
      },
      {
        label: "Départements",
        value: String(directory.departmentServices.length),
        note: "Multiples divisions possibles",
      },
      {
        label: "Responsables attribués",
        value: String(
          directory.departmentServices.filter(
            (department) => department.responsibleUserId,
          ).length,
        ),
        note: "Email chargé automatiquement",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-folder-tree"></i> Liste des départements</div>
        <span class="status-badge badge-info">${filteredRecords.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Divisions liées</th>
              <th>Responsable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

  `;

  renderOrganizationModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouveau département",
    activeRecord
      ? "Toutes les informations du département sélectionné."
      : "Saisissez les informations du nouveau département.",
    organizationModalState &&
      organizationModalState.mode === "details" &&
      activeRecord
      ? buildDepartmentServicesDetailsContent(activeRecord)
      : buildDepartmentServicesFormContent(
          activeRecord,
          organizationModalState?.mode || "create",
        ),
  );

  attachOrganizationPageHandlers("departements-services");
}

function buildDepartmentServicesFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode(
      "DEP",
      getOrganizationRecords("departmentServices"),
    );
  const selectedResponsible = record?.responsibleUserId || "";
  const selectedEmail = getResponsibleEmail(selectedResponsible);

  return `
    <form class="org-form" data-org-form="departements-services">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="departmentServiceCode">Code département</label>
          <input id="departmentServiceCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group field-group-wide">
          <label for="departmentServiceName">Nom</label>
          <input id="departmentServiceName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom du département" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="departmentServiceDivisions">Divisions rattachées</label>
          <select id="departmentServiceDivisions" name="divisionIds" multiple size="5">
            ${buildDivisionOptions(record?.divisionIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs divisions.</div>
        </div>
        <div class="field-group">
          <label for="departmentServiceResponsible">Nom de responsable</label>
          <select id="departmentServiceResponsible" name="responsibleUserId" data-org-responsible-select>
            ${buildResponsibleOptions(selectedResponsible)}
          </select>
        </div>
        <div class="field-group">
          <label for="departmentServiceResponsibleEmail">Email du responsable</label>
          <input id="departmentServiceResponsibleEmail" name="responsibleEmail" type="email" value="${escapeHtml(selectedEmail)}" readonly />
        </div>
        <div class="field-group field-group-wide">
          <label for="departmentServiceDescription">Description</label>
          <textarea id="departmentServiceDescription" name="description" rows="4" placeholder="Description facultative">${escapeTextarea(record?.description || "")}</textarea>
        </div>
      </div>

      ${buildOrganizationFormFooter("departements-services", mode, record?.id || "")}
    </form>
  `;
}

function buildDepartmentServicesDetailsContent(record) {
  const responsible = getOrganizationUser(record.responsibleUserId);
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Divisions liées</span><strong>${joinNames(getOrganizationRecords("divisions"), record.divisionIds || [])}</strong></div>
      <div class="org-detail-item"><span>Responsable</span><strong>${responsible ? responsible.name : "Non défini"}</strong></div>
      <div class="org-detail-item"><span>Email</span><strong>${responsible ? responsible.email : "-"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Description</span><strong>${record.description || "Aucune description"}</strong></div>
    </div>
  `;
}

function attachOrganizationPageHandlers(pageKey) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-org-create]").forEach((button) => {
    button.addEventListener("click", function () {
      openOrganizationModal(pageKey, "create");
    });
  });

  pageContentEl.querySelectorAll("[data-org-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.orgAction;
      const targetPage = this.dataset.orgPage || pageKey;
      const recordId = this.dataset.orgId || "";

      if (action === "details") {
        openOrganizationModal(targetPage, "details", recordId);
        return;
      }

      if (action === "edit") {
        openOrganizationModal(targetPage, "edit", recordId);
        return;
      }

      if (action === "delete") {
        const record = getOrganizationRecord(
          targetPage === "departements-services"
            ? "departmentServices"
            : targetPage,
          recordId,
        );
        if (!record) return;

        const confirmed = window.confirm(
          `Supprimer ${record.name} ? Cette action est irréversible.`,
        );
        if (!confirmed) return;

        const directory = getOrganizationDirectory();
        if (targetPage === "unites") {
          directory.unites = directory.unites.filter(
            (item) => item.id !== recordId,
          );
          directory.divisions = directory.divisions.map((division) => ({
            ...division,
            unitIds: (division.unitIds || []).filter(
              (unitId) => unitId !== recordId,
            ),
          }));
        } else if (targetPage === "divisions") {
          directory.divisions = directory.divisions.filter(
            (item) => item.id !== recordId,
          );
          directory.departmentServices = directory.departmentServices.map(
            (entry) => ({
              ...entry,
              divisionIds: (entry.divisionIds || []).filter(
                (divisionId) => divisionId !== recordId,
              ),
            }),
          );
        } else {
          directory.departmentServices = directory.departmentServices.filter(
            (item) => item.id !== recordId,
          );
        }

        saveOrganizationDirectory(directory);
        renderOrganizationPage(pageKey);
        window.location.hash = `organisation/${pageKey}`;
      }
    });
  });

  const modal = overlayRootEl
    ? overlayRootEl.querySelector(".org-modal")
    : null;
  if (!modal) return;

  modal.querySelectorAll("[data-org-close]").forEach((button) => {
    button.addEventListener("click", function () {
      closeOrganizationModal(pageKey);
    });
  });

  const form = modal.querySelector("[data-org-form]");
  if (!form) return;

  const responsibleSelect = form.querySelector("[data-org-responsible-select]");
  const emailInput = form.querySelector("input[name='responsibleEmail']");
  if (responsibleSelect && emailInput) {
    responsibleSelect.addEventListener("change", function () {
      syncResponsibleEmail(responsibleSelect, emailInput);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const directory = getOrganizationDirectory();
    const recordId = String(
      form.querySelector("input[name='recordId']")?.value || "",
    );
    const mode = organizationModalState?.mode || "create";
    const existingRecord = recordId
      ? getOrganizationRecord(
          pageKey === "departements-services" ? "departmentServices" : pageKey,
          recordId,
        )
      : null;

    if (pageKey === "unites") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      if (!name) return;

      const nextUnit = {
        id: existingRecord?.id || `unit-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("UNI", directory.unites),
        name,
        locations: String(
          form.querySelector("input[name='locations']")?.value || "",
        ).trim(),
        phone: String(
          form.querySelector("input[name='phone']")?.value || "",
        ).trim(),
        responsibleUserId: String(
          form.querySelector("select[name='responsibleUserId']")?.value || "",
        ),
        description: String(
          form.querySelector("textarea[name='description']")?.value || "",
        ).trim(),
      };

      const updatedUnits = directory.unites.filter(
        (unit) => unit.id !== nextUnit.id,
      );
      updatedUnits.push(nextUnit);
      directory.unites = updatedUnits.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveOrganizationDirectory(directory);
      closeOrganizationModal(pageKey);
      return;
    }

    if (pageKey === "divisions") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      if (!name) return;

      const nextDivision = {
        id: existingRecord?.id || `division-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("DIV", directory.divisions),
        name,
        unitIds: getSelectedValues(
          form.querySelector("select[name='unitIds']"),
        ),
        responsibleUserId: String(
          form.querySelector("select[name='responsibleUserId']")?.value || "",
        ),
        description: String(
          form.querySelector("textarea[name='description']")?.value || "",
        ).trim(),
      };

      const updatedDivisions = directory.divisions.filter(
        (division) => division.id !== nextDivision.id,
      );
      updatedDivisions.push(nextDivision);
      directory.divisions = updatedDivisions.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveOrganizationDirectory(directory);
      closeOrganizationModal(pageKey);
      return;
    }

    const kind = String(
      form.querySelector("select[name='kind']")?.value || "Département",
    );
    const name = String(
      form.querySelector("input[name='name']")?.value || "",
    ).trim();
    if (!name) return;

    const codePrefix = kind === "Service" ? "SRV" : "DEP";
    const nextDepartmentService = {
      id: existingRecord?.id || `department-service-${Date.now()}`,
      code:
        existingRecord?.code ||
        generateOrganizationCode(
          codePrefix,
          directory.departmentServices.filter((item) =>
            kind === "Service"
              ? item.kind === "Service"
              : item.kind === "Département",
          ),
        ),
      kind,
      name,
      divisionIds: getSelectedValues(
        form.querySelector("select[name='divisionIds']"),
      ),
      responsibleUserId: String(
        form.querySelector("select[name='responsibleUserId']")?.value || "",
      ),
      description: String(
        form.querySelector("textarea[name='description']")?.value || "",
      ).trim(),
    };

    const updatedEntries = directory.departmentServices.filter(
      (entry) => entry.id !== nextDepartmentService.id,
    );
    updatedEntries.push(nextDepartmentService);
    directory.departmentServices = updatedEntries.sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    saveOrganizationDirectory(directory);
    closeOrganizationModal(pageKey);
  });

  const kindSelect = form.querySelector("select[name='kind']");
  if (kindSelect) {
    kindSelect.addEventListener("change", function () {
      const codeInput = form.querySelector("#departmentServiceCode");
      if (!codeInput) return;
      const currentCodePrefix = this.value === "Service" ? "SRV" : "DEP";
      codeInput.value = generateOrganizationCode(
        currentCodePrefix,
        getOrganizationRecords("departmentServices").filter(
          (item) => item.kind === this.value,
        ),
      );
    });
  }
}

function renderOrganizationPage(subpageKey) {
  const activeSubpageKey = organizationSubpages[subpageKey]
    ? subpageKey
    : "entreprise";

  if (!pageContentEl) return;

  if (activeSubpageKey === "entreprise") {
    const profile = getEnterpriseProfile();

    renderOrganizationPageHeader(
      "Entreprise",
      "Fiche entreprise, informations de base et logo.",
    );

    if (pageActionsEl) {
      pageActionsEl.innerHTML = `
        <button class="btn ${enterpriseEditMode ? "btn-outline" : "btn-primary"}" type="button" id="enterpriseToggleBtn">
          <i class="fa-solid ${enterpriseEditMode ? "fa-lock" : "fa-pen-to-square"}"></i>
          <span>${enterpriseEditMode ? "Verrouiller" : "Modifier"}</span>
        </button>
        <button class="btn btn-outline" type="button" id="enterpriseSaveBtn" ${enterpriseEditMode ? "" : "disabled"}>
          <i class="fa-solid fa-floppy-disk"></i>
          <span>Enregistrer</span>
        </button>
      `;
    }

    pageContentEl.className = "organization-page";
    pageContentEl.innerHTML = `
      ${buildOrganizationTabs(activeSubpageKey)}

      <div class="enterprise-card">
        <div class="enterprise-header">
          <div>
            <div class="enterprise-kicker">Fiche entreprise</div>
            <h2>${profile.name || "Entreprise non renseignée"}</h2>
            <p>Les informations sont affichées depuis la création de l’entreprise. Le code reste figé.</p>
          </div>
          <div class="enterprise-state ${enterpriseEditMode ? "edit" : "locked"}">
            <i class="fa-solid ${enterpriseEditMode ? "fa-unlock" : "fa-lock"}"></i>
            <span>${enterpriseEditMode ? "Modification active" : "Informations verrouillées"}</span>
          </div>
        </div>

        <div class="enterprise-grid">
          <div class="enterprise-logo-block">
            <div class="enterprise-logo" id="enterpriseLogoPreview">
              ${profile.logo ? `<img src="${profile.logo}" alt="Logo de l'entreprise" />` : `<i class="fa-solid fa-building"></i>`}
            </div>
            <div class="enterprise-logo-actions">
              <label class="btn btn-outline ${enterpriseEditMode ? "" : "is-disabled"}" for="enterpriseLogoInput">
                <i class="fa-regular fa-image"></i>
                <span>Ajouter le logo</span>
              </label>
              <input id="enterpriseLogoInput" type="file" accept="image/*" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="enterprise-hint">Le logo peut être ajouté après la création de l’entreprise.</div>
          </div>

          <div class="enterprise-form">
            <div class="field-group">
              <label for="enterpriseName">Nom</label>
              <input id="enterpriseName" type="text" value="${escapeHtml(profile.name)}" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="field-group">
              <label for="enterpriseWilaya">Wilaya</label>
              <input id="enterpriseWilaya" type="text" value="${escapeHtml(profile.wilaya)}" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="field-group">
              <label for="enterpriseDaira">Daira</label>
              <input id="enterpriseDaira" type="text" value="${escapeHtml(profile.daira)}" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="field-group">
              <label for="enterpriseCommune">Commune</label>
              <input id="enterpriseCommune" type="text" value="${escapeHtml(profile.commune)}" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="field-group">
              <label for="enterprisePhone">Numéro téléphone</label>
              <input id="enterprisePhone" type="tel" value="${escapeHtml(profile.phone)}" ${enterpriseEditMode ? "" : "disabled"} />
            </div>
            <div class="field-group">
              <label for="enterpriseCode">Code entreprise</label>
              <input id="enterpriseCode" type="text" value="${escapeHtml(profile.code)}" disabled />
            </div>
          </div>
        </div>
      </div>
    `;

    attachOrganizationTabHandlers("[data-org-subpage]");

    const toggleBtn = document.getElementById("enterpriseToggleBtn");
    const saveBtn = document.getElementById("enterpriseSaveBtn");
    const logoInput = document.getElementById("enterpriseLogoInput");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        enterpriseEditMode = !enterpriseEditMode;
        renderOrganizationPage("entreprise");
        window.location.hash = "organisation/entreprise";
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const current = getEnterpriseProfile();
        const nextProfile = {
          ...current,
          name: (document.getElementById("enterpriseName")?.value || "").trim(),
          wilaya: (
            document.getElementById("enterpriseWilaya")?.value || ""
          ).trim(),
          daira: (
            document.getElementById("enterpriseDaira")?.value || ""
          ).trim(),
          commune: (
            document.getElementById("enterpriseCommune")?.value || ""
          ).trim(),
          phone: (
            document.getElementById("enterprisePhone")?.value || ""
          ).trim(),
        };

        saveEnterpriseProfile(nextProfile);
        enterpriseEditMode = false;
        renderOrganizationPage("entreprise");
        window.location.hash = "organisation/entreprise";
      });
    }

    if (logoInput) {
      logoInput.addEventListener("change", function () {
        const file = this.files && this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function () {
          const current = getEnterpriseProfile();
          const updated = { ...current, logo: String(reader.result || "") };
          saveEnterpriseProfile(updated);
          renderOrganizationPage("entreprise");
          window.location.hash = "organisation/entreprise";
        };
        reader.readAsDataURL(file);
      });
    }
    return;
  }

  const activeSubpage = organizationSubpages[activeSubpageKey];

  if (activeSubpageKey === "unites") {
    renderUnitsManagementPage();
  } else if (activeSubpageKey === "divisions") {
    renderDivisionsManagementPage();
  } else if (activeSubpageKey === "departements-services") {
    renderDepartmentServicesManagementPage();
  } else {
    renderOrganizationPageHeader(activeSubpage.title, activeSubpage.body);
    pageContentEl.className = "organization-page";
    pageContentEl.innerHTML = buildOrganizationEmptyState(
      "fa-folder-open",
      activeSubpage.title,
      activeSubpage.body,
      "Contenu à développer plus tard.",
    );
  }

  attachOrganizationTabHandlers("[data-org-subpage]");
}

function getEquipmentDirectory() {
  let directory = JSON.parse(JSON.stringify(equipmentDefaults));

  try {
    const stored = window.localStorage.getItem(equipmentStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      directory = {
        groups: Array.isArray(parsed.groups) ? parsed.groups : directory.groups,
        families: Array.isArray(parsed.families)
          ? parsed.families
          : directory.families,
        equipments: Array.isArray(parsed.equipments)
          ? parsed.equipments
          : directory.equipments,
      };
    }
  } catch (error) {
    directory = JSON.parse(JSON.stringify(equipmentDefaults));
  }

  return directory;
}

function saveEquipmentDirectory(directory) {
  try {
    window.localStorage.setItem(equipmentStorageKey, JSON.stringify(directory));
  } catch (error) {
    // Keep the UI usable even if storage is unavailable.
  }
}

function getEquipmentRecords(kind) {
  const directory = getEquipmentDirectory();
  if (kind === "groups") return directory.groups;
  if (kind === "families") return directory.families;
  return directory.equipments;
}

function getEquipmentRecord(kind, recordId) {
  return (
    getEquipmentRecords(kind).find((record) => record.id === recordId) || null
  );
}

function setEquipmentModalState(state) {
  equipmentModalState = state;
}

function closeEquipmentModal(pageKey) {
  setEquipmentModalState(null);
  renderEquipmentPage(pageKey);
  window.location.hash = `equipements/${pageKey}`;
}

function openEquipmentModal(pageKey, mode, recordId = null) {
  setEquipmentModalState({ pageKey, mode, recordId });
  renderEquipmentPage(pageKey);
  window.location.hash = `equipements/${pageKey}`;
}

function buildEquipmentTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages équipements">
      ${Object.entries(sectionSubpages.equipements.tabs)
        .map(
          ([key, tab]) => `
            <button
              class="org-tab ${key === activeSubpageKey ? "active" : ""}"
              type="button"
              data-eq-subpage="${key}"
            >
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function attachEquipmentTabHandlers(selector) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.eqSubpage || "groupe-equipment";
      renderPage("equipements", nextSubpage);
      window.location.hash = `equipements/${nextSubpage}`;
    });
  });
}

function renderEquipmentPageHeader(title, subtitle) {
  if (pageTitleEl) pageTitleEl.textContent = title;
  if (pageSubtitleEl) pageSubtitleEl.textContent = subtitle;
}

function renderEquipmentActionButtons(pageKey, createLabel) {
  if (!pageActionsEl) return;

  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-eq-create="${pageKey}">
      <i class="fa-solid fa-plus"></i>
      <span>${createLabel}</span>
    </button>
  `;

  const createButton = pageActionsEl.querySelector("[data-eq-create]");
  if (createButton) {
    createButton.addEventListener("click", function () {
      openEquipmentModal(pageKey, "create");
    });
  }
}

function buildEquipmentListActions(pageKey, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-eq-action="details" data-eq-page="${pageKey}" data-eq-id="${recordId}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-eq-action="edit" data-eq-page="${pageKey}" data-eq-id="${recordId}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-eq-action="delete" data-eq-page="${pageKey}" data-eq-id="${recordId}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildEquipmentModalShell(title, subtitle, bodyHtml) {
  return `
    <div class="org-modal ${equipmentModalState ? "open" : ""}" role="presentation">
      <div class="org-modal-backdrop" data-org-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="eqModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Équipements</div>
            <h3 id="eqModalTitle">${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-org-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderEquipmentModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;

  if (!equipmentModalState) {
    overlayRootEl.innerHTML = "";
    return;
  }

  overlayRootEl.innerHTML = buildEquipmentModalShell(title, subtitle, bodyHtml);
}

function buildRecordLabel(items, recordId, labelBuilder = (item) => item.name) {
  const record = items.find((item) => item.id === recordId);
  return record ? labelBuilder(record) : "Aucune sélection";
}

function joinRecordLabels(items, ids, labelBuilder = (item) => item.name) {
  const labels = ids
    .map((id) => buildRecordLabel(items, id, labelBuilder))
    .filter((label) => label && label !== "Aucune sélection");

  return labels.length ? labels.join(", ") : "Aucune sélection";
}

function buildDepartmentServiceOptions(selectedIds = []) {
  return getOrganizationRecords("departmentServices")
    .map(
      (department) => `
        <option value="${department.id}"${selectedIds.includes(department.id) ? " selected" : ""}>
          ${department.code} — ${department.kind} — ${department.name}
        </option>
      `,
    )
    .join("");
}

function buildEquipmentGroupOptions(selectedGroupId = "") {
  return [
    '<option value="">Sélectionner un groupe</option>',
    ...getEquipmentRecords("groups").map(
      (group) => `
        <option value="${group.id}"${group.id === selectedGroupId ? " selected" : ""}>
          ${group.code} — ${group.name}
        </option>
      `,
    ),
  ].join("");
}

function buildEquipmentFamilyOptions(
  selectedFamilyId = "",
  selectedGroupId = "",
) {
  const families = getEquipmentRecords("families").filter((family) => {
    return !selectedGroupId || family.groupId === selectedGroupId;
  });

  return [
    '<option value="">Sélectionner une famille</option>',
    ...families.map(
      (family) => `
        <option value="${family.id}"${family.id === selectedFamilyId ? " selected" : ""}>
          ${family.code} — ${family.name}
        </option>
      `,
    ),
  ].join("");
}

function buildCriticalityOptions(selectedCriticality = "") {
  const criticalities = ["Faible", "Moyenne", "Haute", "Critique"];
  return [
    '<option value="">Sélectionner la criticité</option>',
    ...criticalities.map(
      (criticality) => `
        <option value="${criticality}"${criticality === selectedCriticality ? " selected" : ""}>${criticality}</option>
      `,
    ),
  ].join("");
}

function buildStatusOptions(selectedStatus = "") {
  const statuses = [
    "En service",
    "En maintenance",
    "En panne",
    "Hors service",
    "Réforme",
  ];
  return [
    '<option value="">Sélectionner l\'état</option>',
    ...statuses.map(
      (status) => `
        <option value="${status}"${status === selectedStatus ? " selected" : ""}>${status}</option>
      `,
    ),
  ].join("");
}

function formatEquipmentDate(value) {
  if (!value) return "-";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR");
}

function getCriticalityBadgeClass(criticality) {
  if (criticality === "Critique") return "badge-danger";
  if (criticality === "Haute") return "badge-warning";
  if (criticality === "Moyenne") return "badge-info";
  return "badge-success";
}

function getStatusBadgeClass(status) {
  if (status === "En panne") return "badge-danger";
  if (status === "En maintenance") return "badge-warning";
  if (status === "Hors service" || status === "Réforme") return "badge-gray";
  return "badge-success";
}

function readEquipmentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: String(reader.result || ""),
      });
    };
    reader.onerror = function () {
      reject(new Error(`Impossible de lire le fichier ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
}

async function readEquipmentFiles(fileList) {
  return Promise.all(
    Array.from(fileList || []).map((file) => readEquipmentFile(file)),
  );
}

function normalizeStoredAttachment(attachment, fallbackName) {
  if (!attachment) return null;
  if (typeof attachment === "string") {
    return {
      name: fallbackName,
      dataUrl: attachment,
    };
  }
  if (typeof attachment === "object") {
    return {
      ...attachment,
      name: attachment.name || fallbackName,
      dataUrl: attachment.dataUrl || "",
    };
  }
  return null;
}

function getAttachmentRemovalKey(kind) {
  return kind === "documents" ? "removedDocuments" : "removedPhotos";
}

function getAttachmentRemovalIndexes(form, kind) {
  const key = getAttachmentRemovalKey(kind);
  try {
    return JSON.parse(form.dataset[key] || "[]");
  } catch (error) {
    return [];
  }
}

function setAttachmentRemovalIndexes(form, kind, indexes) {
  const key = getAttachmentRemovalKey(kind);
  form.dataset[key] = JSON.stringify(indexes);
}

function addAttachmentRemovalIndex(form, kind, index) {
  const indexes = getAttachmentRemovalIndexes(form, kind);
  if (!indexes.includes(index)) {
    indexes.push(index);
    indexes.sort((left, right) => left - right);
    setAttachmentRemovalIndexes(form, kind, indexes);
  }
}

function filterStoredAttachments(items, removedIndexes = []) {
  const removedSet = new Set(removedIndexes);
  return (Array.isArray(items) ? items : []).filter(
    (_, index) => !removedSet.has(index),
  );
}

function buildAttachmentRemoveButton(kind, index, label) {
  return `
    <button class="equipment-attachment-remove" type="button" data-attachment-remove="true" data-attachment-kind="${kind}" data-attachment-index="${index}" aria-label="${escapeHtml(label)}">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
}

function buildStoredAttachmentsPreview(record, options = {}) {
  const {
    editable = false,
    showDocuments = true,
    photosTitle = "Photos associées",
    documentsTitle = "Documents associés",
    photosEmptyText = "Aucune photo associée.",
    documentsEmptyText = "Aucun document associé.",
  } = options;

  const photos = (Array.isArray(record?.photos) ? record.photos : [])
    .map((photo, index) => ({
      item: normalizeStoredAttachment(photo, `Photo ${index + 1}`),
      index,
    }))
    .filter((entry) => entry.item);
  const documents = (Array.isArray(record?.documents) ? record.documents : [])
    .map((document, index) => ({
      item: normalizeStoredAttachment(document, `Document ${index + 1}`),
      index,
    }))
    .filter((entry) => entry.item);

  return `
    <div class="equipment-attachments-grid">
      <div class="equipment-asset-card">
        <div class="equipment-asset-title">${photosTitle}</div>
        ${
          photos.length
            ? `
          <div class="equipment-photo-grid" data-attachment-list="photos">
            ${photos
              .map(
                ({ item, index }) => `
                  <figure class="equipment-photo-card" data-attachment-card>
                    ${editable ? buildAttachmentRemoveButton("photos", index, `Supprimer ${item.name || `Photo ${index + 1}`}`) : ""}
                    <img src="${item.dataUrl || ""}" alt="${escapeHtml(item.name || `Photo ${index + 1}`)}" />
                    <figcaption>${escapeHtml(item.name || `Photo ${index + 1}`)}</figcaption>
                  </figure>
                `,
              )
              .join("")}
          </div>
        `
            : `<div class="equipment-empty-assets" data-attachment-empty="photos">${photosEmptyText}</div>`
        }
      </div>

      ${
        showDocuments
          ? `
            <div class="equipment-asset-card">
              <div class="equipment-asset-title">${documentsTitle}</div>
              ${
                documents.length
                  ? `
                <div class="equipment-doc-list" data-attachment-list="documents">
                  ${documents
                    .map(
                      ({ item, index }) => `
                        <div class="equipment-doc-item" data-attachment-card>
                          <a class="equipment-doc-chip" href="${item.dataUrl || "#"}" download="${escapeHtml(item.name || `Document ${index + 1}`)}">
                            <i class="fa-regular fa-file-lines"></i>
                            <span>${escapeHtml(item.name || `Document ${index + 1}`)}</span>
                          </a>
                          ${editable ? buildAttachmentRemoveButton("documents", index, `Supprimer ${item.name || `Document ${index + 1}`}`) : ""}
                        </div>
                      `,
                    )
                    .join("")}
                </div>
              `
                  : `<div class="equipment-empty-assets" data-attachment-empty="documents">${documentsEmptyText}</div>`
              }
            </div>
          `
          : ""
      }
    </div>
  `;
}

function attachAttachmentRemovalHandlers(form) {
  form.addEventListener("click", function (event) {
    const button = event.target.closest("[data-attachment-remove]");
    if (!button || !form.contains(button)) return;

    event.preventDefault();

    const kind = button.dataset.attachmentKind;
    const index = Number(button.dataset.attachmentIndex);
    if (!kind || Number.isNaN(index)) return;

    addAttachmentRemovalIndex(form, kind, index);

    const card = button.closest("[data-attachment-card]");
    const list = button.closest("[data-attachment-list]");
    if (card) {
      card.remove();
    }

    if (list && !list.querySelector("[data-attachment-card]")) {
      const emptyText =
        kind === "documents"
          ? "Aucun document associé."
          : "Aucune photo associée.";
      list.innerHTML = `<div class="equipment-empty-assets" data-attachment-empty="${kind}">${emptyText}</div>`;
    }
  });
}

function buildEquipmentAttachmentsPreview(record, editable = false) {
  return buildStoredAttachmentsPreview(record, {
    editable,
    showDocuments: true,
  });
}

function buildArticleAttachmentsPreview(record, editable = false) {
  return buildStoredAttachmentsPreview(record, {
    editable,
    showDocuments: false,
  });
}

function syncEquipmentFamilySelect(form) {
  const groupSelect = form.querySelector("select[name='groupId']");
  const familySelect = form.querySelector("select[name='familyId']");
  if (!groupSelect || !familySelect) return;

  const selectedFamilyId = familySelect.value;
  familySelect.innerHTML = buildEquipmentFamilyOptions(
    selectedFamilyId,
    groupSelect.value,
  );

  if (
    selectedFamilyId &&
    !Array.from(familySelect.options).some(
      (option) => option.value === selectedFamilyId,
    )
  ) {
    familySelect.value = "";
  }
}

function buildGroupEquipmentFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("GRP", getEquipmentRecords("groups"));

  return `
    <form class="org-form equipment-form" data-eq-form="groupe-equipment">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="equipmentGroupCode">Code groupe</label>
          <input id="equipmentGroupCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="equipmentGroupName">Nom</label>
          <input id="equipmentGroupName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom du groupe équipement" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="equipmentGroupDesignations">Désignations</label>
          <textarea id="equipmentGroupDesignations" name="designations" rows="4" placeholder="Désignations du groupe">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
        <div class="field-group field-group-wide">
          <label for="equipmentGroupDepartments">Départements associés</label>
          <select id="equipmentGroupDepartments" name="departmentIds" multiple size="5">
            ${buildDepartmentServiceOptions(record?.departmentIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs départements.</div>
        </div>
      </div>

      ${buildOrganizationFormFooter("groupe-equipment", mode, record?.id || "")}
    </form>
  `;
}

function buildGroupEquipmentDetailsContent(record) {
  const directory = getEquipmentDirectory();
  const linkedFamilies = directory.families.filter(
    (family) => family.groupId === record.id,
  );
  const linkedEquipments = directory.equipments.filter(
    (equipment) => equipment.groupId === record.id,
  );

  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Départements associés</span><strong>${joinRecordLabels(getOrganizationRecords("departmentServices"), record.departmentIds || [], (department) => `${department.code} — ${department.kind} — ${department.name}`)}</strong></div>
      <div class="org-detail-item"><span>Familles liées</span><strong>${linkedFamilies.length}</strong></div>
      <div class="org-detail-item"><span>Équipements liés</span><strong>${linkedEquipments.length}</strong></div>
    </div>
  `;
}

function renderGroupEquipmentPage() {
  const directory = getEquipmentDirectory();
  const activeRecord =
    equipmentModalState && equipmentModalState.pageKey === "groupe-equipment"
      ? getEquipmentRecord("groups", equipmentModalState.recordId)
      : null;

  renderEquipmentPageHeader(
    "Équipements",
    "Référentiel des groupes, familles et équipements.",
  );
  renderEquipmentActionButtons("groupe-equipment", "Nouveau groupe");

  if (!pageContentEl) return;

  const rows = directory.groups.length
    ? directory.groups
        .map((group) => {
          const departmentCount = (group.departmentIds || []).length;
          const familyCount = directory.families.filter(
            (family) => family.groupId === group.id,
          ).length;
          const equipmentCount = directory.equipments.filter(
            (equipment) => equipment.groupId === group.id,
          ).length;

          return `
            <tr>
              <td><strong>${group.code}</strong></td>
              <td>${group.name}</td>
              <td class="muted">${group.designations || "-"}</td>
              <td class="muted">${joinRecordLabels(getOrganizationRecords("departmentServices"), group.departmentIds || [], (department) => `${department.code} — ${department.name}`)}</td>
              <td class="muted">${familyCount} familles · ${equipmentCount} équipements</td>
              <td>${buildEquipmentListActions("groupe-equipment", group.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-layer-group",
            "Aucun groupe enregistré",
            "Créez le premier groupe d'équipements pour commencer la structuration du référentiel.",
            "Le bouton Nouveau groupe ouvre le formulaire de création.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "equipment-page organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildEquipmentTabs("groupe-equipment")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel équipement</div>
        <h2>Groupes équipement</h2>
        <p>Chaque groupe associe plusieurs départements et sert de base aux familles puis aux équipements.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
        <span class="status-badge badge-gray">${directory.equipments.length} équipements</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Groupes actifs",
        value: String(directory.groups.length),
        note: "Base du référentiel équipement",
      },
      {
        label: "Départements liés",
        value: String(
          directory.groups.reduce(
            (total, group) => total + (group.departmentIds || []).length,
            0,
          ),
        ),
        note: "Association multi-départements",
      },
      {
        label: "Équipements associés",
        value: String(
          directory.equipments.filter((equipment) => equipment.groupId).length,
        ),
        note: "Rattachement direct au groupe",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-layer-group"></i> Liste des groupes</div>
        <span class="status-badge badge-info">${directory.groups.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Désignations</th>
              <th>Départements</th>
              <th>Liens</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderEquipmentModal(
    activeRecord
      ? `Détails de ${activeRecord.name}`
      : "Nouveau groupe équipement",
    activeRecord
      ? "Toutes les informations du groupe sélectionné."
      : "Saisissez les informations du nouveau groupe.",
    equipmentModalState &&
      equipmentModalState.mode === "details" &&
      activeRecord
      ? buildGroupEquipmentDetailsContent(activeRecord)
      : buildGroupEquipmentFormContent(
          activeRecord,
          equipmentModalState?.mode || "create",
        ),
  );

  attachEquipmentPageHandlers("groupe-equipment");
}

function buildFamilyEquipmentFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("FAM", getEquipmentRecords("families"));

  return `
    <form class="org-form equipment-form" data-eq-form="famille-equipment">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="equipmentFamilyCode">Code famille</label>
          <input id="equipmentFamilyCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="equipmentFamilyName">Nom</label>
          <input id="equipmentFamilyName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de la famille équipement" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="equipmentFamilyGroup">Groupe associé</label>
          <select id="equipmentFamilyGroup" name="groupId" required>
            ${buildEquipmentGroupOptions(record?.groupId || "")}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label for="equipmentFamilyDesignations">Désignations</label>
          <textarea id="equipmentFamilyDesignations" name="designations" rows="4" placeholder="Désignations de la famille">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
      </div>

      ${buildOrganizationFormFooter("famille-equipment", mode, record?.id || "")}
    </form>
  `;
}

function buildFamilyEquipmentDetailsContent(record) {
  const directory = getEquipmentDirectory();
  const linkedEquipments = directory.equipments.filter(
    (equipment) => equipment.familyId === record.id,
  );
  const group = getEquipmentRecord("groups", record.groupId);

  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item"><span>Groupe associé</span><strong>${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
      <div class="org-detail-item"><span>Équipements liés</span><strong>${linkedEquipments.length}</strong></div>
      <div class="org-detail-item"><span>État</span><strong>${linkedEquipments.length ? "Utilisée par le parc" : "Famille disponible"}</strong></div>
    </div>
  `;
}

function renderFamilyEquipmentPage() {
  const directory = getEquipmentDirectory();
  const activeRecord =
    equipmentModalState && equipmentModalState.pageKey === "famille-equipment"
      ? getEquipmentRecord("families", equipmentModalState.recordId)
      : null;

  renderEquipmentPageHeader(
    "Équipements",
    "Référentiel des groupes, familles et équipements.",
  );
  renderEquipmentActionButtons("famille-equipment", "Nouvelle famille");

  if (!pageContentEl) return;

  const rows = directory.families.length
    ? directory.families
        .map((family) => {
          const group = getEquipmentRecord("groups", family.groupId);
          const equipmentCount = directory.equipments.filter(
            (equipment) => equipment.familyId === family.id,
          ).length;

          return `
            <tr>
              <td><strong>${family.code}</strong></td>
              <td>${family.name}</td>
              <td class="muted">${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</td>
              <td class="muted">${family.designations || "-"}</td>
              <td class="muted">${equipmentCount} équipements</td>
              <td>${buildEquipmentListActions("famille-equipment", family.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-folder-tree",
            "Aucune famille enregistrée",
            "Créez une famille et rattachez-la à un groupe existant.",
            "Le bouton Nouvelle famille ouvre le formulaire de création.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "equipment-page organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildEquipmentTabs("famille-equipment")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel équipement</div>
        <h2>Familles équipement</h2>
        <p>Chaque famille dépend d’un groupe et prépare la création des fiches équipements.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.families.length} familles</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes disponibles</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Familles actives",
        value: String(directory.families.length),
        note: "Niveau de structuration intermédiaire",
      },
      {
        label: "Familles reliées à un groupe",
        value: String(
          directory.families.filter((family) => family.groupId).length,
        ),
        note: "Relation obligatoire au groupe",
      },
      {
        label: "Équipements liés",
        value: String(
          directory.equipments.filter((equipment) => equipment.familyId).length,
        ),
        note: "Le parc est rattaché à la famille",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-folder-tree"></i> Liste des familles</div>
        <span class="status-badge badge-info">${directory.families.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Groupe</th>
              <th>Désignations</th>
              <th>Liens</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderEquipmentModal(
    activeRecord
      ? `Détails de ${activeRecord.name}`
      : "Nouvelle famille équipement",
    activeRecord
      ? "Toutes les informations de la famille sélectionnée."
      : "Saisissez les informations de la nouvelle famille.",
    equipmentModalState &&
      equipmentModalState.mode === "details" &&
      activeRecord
      ? buildFamilyEquipmentDetailsContent(activeRecord)
      : buildFamilyEquipmentFormContent(
          activeRecord,
          equipmentModalState?.mode || "create",
        ),
  );

  attachEquipmentPageHandlers("famille-equipment");
}

function buildEquipmentFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("EQP", getEquipmentRecords("equipments"));
  const selectedGroupId = record?.groupId || "";

  return `
    <form class="org-form equipment-form" data-eq-form="equipment">
      <div class="equipment-form-sections">
        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Type général</div>
              <h4>Identification et statut</h4>
              <p>Les champs principaux définissent le rattachement et le statut de l’équipement.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group">
              <label for="equipmentCode">Code équipement</label>
              <input id="equipmentCode" type="text" value="${escapeHtml(codePreview)}" disabled />
            </div>
            <div class="field-group">
              <label for="equipmentName">Nom</label>
              <input id="equipmentName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de l’équipement" required />
            </div>
            <div class="field-group">
              <label for="equipmentGroup">Groupe équipement</label>
              <select id="equipmentGroup" name="groupId" required data-equipment-group-select>
                ${buildEquipmentGroupOptions(selectedGroupId)}
              </select>
            </div>
            <div class="field-group">
              <label for="equipmentFamily">Famille équipement</label>
              <select id="equipmentFamily" name="familyId" required data-equipment-family-select>
                ${buildEquipmentFamilyOptions(record?.familyId || "", selectedGroupId)}
              </select>
            </div>
            <div class="field-group">
              <label for="equipmentCriticality">Criticité</label>
              <select id="equipmentCriticality" name="criticality" required>
                ${buildCriticalityOptions(record?.criticality || "")}
              </select>
            </div>
            <div class="field-group">
              <label for="equipmentStatus">État</label>
              <select id="equipmentStatus" name="status" required>
                ${buildStatusOptions(record?.status || "")}
              </select>
            </div>
          </div>
        </section>

        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Type complémentaire</div>
              <h4>Informations techniques et achats</h4>
              <p>Les champs complémentaires décrivent le suivi fournisseur, la traçabilité et l’historique d’achat.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group">
              <label for="equipmentBrand">Marque</label>
              <input id="equipmentBrand" name="brand" type="text" value="${escapeHtml(record?.brand || "")}" placeholder="Marque" />
            </div>
            <div class="field-group">
              <label for="equipmentSupplier">Fournisseur</label>
              <input id="equipmentSupplier" name="supplier" type="text" value="${escapeHtml(record?.supplier || "")}" placeholder="Fournisseur" />
            </div>
            <div class="field-group">
              <label for="equipmentSerialNumber">N° série</label>
              <input id="equipmentSerialNumber" name="serialNumber" type="text" value="${escapeHtml(record?.serialNumber || "")}" placeholder="Numéro de série" />
            </div>
            <div class="field-group">
              <label for="equipmentPurchasePrice">Prix d'achat</label>
              <input id="equipmentPurchasePrice" name="purchasePrice" type="text" value="${escapeHtml(record?.purchasePrice || "")}" placeholder="Prix d’achat" />
            </div>
            <div class="field-group">
              <label for="equipmentPurchaseDate">Date d'achat</label>
              <input id="equipmentPurchaseDate" name="purchaseDate" type="date" value="${escapeHtml(record?.purchaseDate || "")}" />
            </div>
            <div class="field-group">
              <label for="equipmentServiceDate">Date de mise en service</label>
              <input id="equipmentServiceDate" name="serviceDate" type="date" value="${escapeHtml(record?.serviceDate || "")}" />
            </div>
            <div class="field-group">
              <label for="equipmentWarranty">Durée de garantie</label>
              <input id="equipmentWarranty" name="warrantyDuration" type="text" value="${escapeHtml(record?.warrantyDuration || "")}" placeholder="Durée de garantie" />
            </div>
          </div>
        </section>

        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Pièces jointes</div>
              <h4>Photos et documents associés</h4>
              <p>Vous pouvez ajouter plusieurs photos et documents pour enrichir la fiche.</p>
            </div>
          </div>
          <div class="equipment-upload-grid">
            <div class="field-group field-group-wide">
              <label for="equipmentPhotos">Photos</label>
              <input id="equipmentPhotos" name="photos" type="file" accept="image/*" multiple />
              <div class="org-field-hint">Plusieurs images peuvent être ajoutées à la fiche.</div>
            </div>
            <div class="field-group field-group-wide">
              <label for="equipmentDocuments">Documents associés</label>
              <input id="equipmentDocuments" name="documents" type="file" multiple />
              <div class="org-field-hint">PDF, images ou autres fichiers utiles au suivi de l’équipement.</div>
            </div>
            ${record ? `<div class="field-group field-group-wide">${buildEquipmentAttachmentsPreview(record, mode === "edit")}</div>` : ""}
          </div>
        </section>
      </div>

      ${buildOrganizationFormFooter("equipment", mode, record?.id || "")}
    </form>
  `;
}

function buildEquipmentDetailsContent(record) {
  const group = getEquipmentRecord("groups", record.groupId);
  const family = getEquipmentRecord("families", record.familyId);
  const primaryPhoto = Array.isArray(record.photos) ? record.photos[0] : null;
  const primaryPhotoSrc = primaryPhoto?.dataUrl || primaryPhoto || "";
  const primaryPhotoLabel = primaryPhoto?.name || record.name || "Équipement";

  return `
    <div class="equipment-detail-layout">
      <div class="equipment-detail-media">
        <div class="equipment-detail-image">
          ${primaryPhotoSrc ? `<img src="${primaryPhotoSrc}" alt="${escapeHtml(primaryPhotoLabel)}" />` : `<div class="equipment-detail-placeholder"><i class="fa-regular fa-image"></i><span>Aucune photo disponible</span></div>`}
        </div>
      </div>

      <div class="equipment-detail-info">
        <div class="equipment-detail-list">
          <div class="equipment-detail-row">
            <span>Code</span>
            <strong>${record.code}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>N° de série</span>
            <strong>${record.serialNumber || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Nom</span>
            <strong>${record.name}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Marque</span>
            <strong>${record.brand || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Criticité</span>
            <strong>${record.criticality || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>État</span>
            <strong>${record.status || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Groupe</span>
            <strong>${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Famille</span>
            <strong>${family ? `${family.code} — ${family.name}` : "Aucune sélection"}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEquipmentPage(subpageKey) {
  const activeSubpageKey = sectionSubpages.equipements.tabs[subpageKey]
    ? subpageKey
    : sectionSubpages.equipements.defaultSubpage;

  if (!pageContentEl) return;

  if (activeSubpageKey === "groupe-equipment") {
    renderGroupEquipmentPage();
  } else if (activeSubpageKey === "famille-equipment") {
    renderFamilyEquipmentPage();
  } else if (activeSubpageKey === "equipment") {
    renderEquipmentManagementPage();
  }

  attachEquipmentTabHandlers("[data-eq-subpage]");
}

function renderEquipmentManagementPage() {
  const directory = getEquipmentDirectory();
  const activeRecord =
    equipmentModalState && equipmentModalState.pageKey === "equipment"
      ? getEquipmentRecord("equipments", equipmentModalState.recordId)
      : null;

  renderEquipmentPageHeader(
    "Équipements",
    "Référentiel des groupes, familles et équipements.",
  );
  renderEquipmentActionButtons("equipment", "Nouvel équipement");

  if (!pageContentEl) return;

  const rows = directory.equipments.length
    ? directory.equipments
        .map((equipment) => {
          const group = getEquipmentRecord("groups", equipment.groupId);
          const family = getEquipmentRecord("families", equipment.familyId);

          return `
            <tr>
              <td><strong>${equipment.code}</strong></td>
              <td>${equipment.name}</td>
              <td class="muted">${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</td>
              <td class="muted">${family ? `${family.code} — ${family.name}` : "Aucune sélection"}</td>
              <td><span class="status-badge ${getCriticalityBadgeClass(equipment.criticality)}">${equipment.criticality || "-"}</span></td>
              <td><span class="status-badge ${getStatusBadgeClass(equipment.status)}">${equipment.status || "-"}</span></td>
              <td>${buildEquipmentListActions("equipment", equipment.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="7">
          ${buildOrganizationEmptyState(
            "fa-gear",
            "Aucun équipement enregistré",
            "Créez la première fiche équipement après avoir défini les groupes et les familles.",
            "Le bouton Nouvel équipement ouvre le formulaire complet.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "equipment-page organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildEquipmentTabs("equipment")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel équipement</div>
        <h2>Équipements</h2>
        <p>Le formulaire est découpé entre les champs principaux et les informations complémentaires pour simplifier la saisie.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.equipments.length} équipements</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Équipements total",
        value: String(directory.equipments.length),
        note: "Inventaire local du navigateur",
      },
      {
        label: "Équipements en service",
        value: String(
          directory.equipments.filter(
            (equipment) => equipment.status === "En service",
          ).length,
        ),
        note: "Statut opérationnel",
      },
      {
        label: "Équipements avec pièces jointes",
        value: String(
          directory.equipments.filter(
            (equipment) =>
              (Array.isArray(equipment.photos) ? equipment.photos.length : 0) +
                (Array.isArray(equipment.documents)
                  ? equipment.documents.length
                  : 0) >
              0,
          ).length,
        ),
        note: "Photos et documents associés",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-gear"></i> Liste des équipements</div>
        <span class="status-badge badge-info">${directory.equipments.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Groupe</th>
              <th>Famille</th>
              <th>Criticité</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderEquipmentModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouvel équipement",
    activeRecord
      ? "Toutes les informations de l’équipement sélectionné."
      : "Saisissez les informations du nouvel équipement.",
    equipmentModalState &&
      equipmentModalState.mode === "details" &&
      activeRecord
      ? buildEquipmentDetailsContent(activeRecord)
      : buildEquipmentFormContent(
          activeRecord,
          equipmentModalState?.mode || "create",
        ),
  );

  attachEquipmentPageHandlers("equipment");
}

function attachEquipmentPageHandlers(pageKey) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-eq-create]").forEach((button) => {
    button.addEventListener("click", function () {
      openEquipmentModal(pageKey, "create");
    });
  });

  pageContentEl.querySelectorAll("[data-eq-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.eqAction;
      const targetPage = this.dataset.eqPage || pageKey;
      const recordId = this.dataset.eqId || "";

      if (action === "details") {
        openEquipmentModal(targetPage, "details", recordId);
        return;
      }

      if (action === "edit") {
        openEquipmentModal(targetPage, "edit", recordId);
        return;
      }

      if (action === "delete") {
        const record = getEquipmentRecord(
          targetPage === "equipment"
            ? "equipments"
            : targetPage === "famille-equipment"
              ? "families"
              : "groups",
          recordId,
        );
        if (!record) return;

        const confirmed = window.confirm(
          `Supprimer ${record.name} ? Cette action est irréversible.`,
        );
        if (!confirmed) return;

        const directory = getEquipmentDirectory();

        if (targetPage === "groupe-equipment") {
          const linkedFamilyIds = directory.families
            .filter((family) => family.groupId === recordId)
            .map((family) => family.id);

          directory.groups = directory.groups.filter(
            (item) => item.id !== recordId,
          );
          directory.families = directory.families.map((family) =>
            family.groupId === recordId ? { ...family, groupId: "" } : family,
          );
          directory.equipments = directory.equipments.map((equipment) => ({
            ...equipment,
            groupId: equipment.groupId === recordId ? "" : equipment.groupId,
            familyId: linkedFamilyIds.includes(equipment.familyId)
              ? ""
              : equipment.familyId,
          }));
        } else if (targetPage === "famille-equipment") {
          directory.families = directory.families.filter(
            (item) => item.id !== recordId,
          );
          directory.equipments = directory.equipments.map((equipment) =>
            equipment.familyId === recordId
              ? { ...equipment, familyId: "" }
              : equipment,
          );
        } else {
          directory.equipments = directory.equipments.filter(
            (item) => item.id !== recordId,
          );
        }

        saveEquipmentDirectory(directory);
        renderEquipmentPage(pageKey);
        window.location.hash = `equipements/${pageKey}`;
      }
    });
  });

  const modal = overlayRootEl
    ? overlayRootEl.querySelector(".org-modal")
    : null;
  if (!modal) return;

  modal.querySelectorAll("[data-org-close]").forEach((button) => {
    button.addEventListener("click", function () {
      closeEquipmentModal(pageKey);
    });
  });

  const form = modal.querySelector("[data-eq-form]");
  if (!form) return;
  attachAttachmentRemovalHandlers(form);

  const groupSelect = form.querySelector("[data-equipment-group-select]");
  if (groupSelect) {
    groupSelect.addEventListener("change", function () {
      syncEquipmentFamilySelect(form);
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const directory = getEquipmentDirectory();
    const recordId = String(
      form.querySelector("input[name='recordId']")?.value || "",
    );
    const existingRecord = recordId
      ? getEquipmentRecord(
          pageKey === "equipment"
            ? "equipments"
            : pageKey === "famille-equipment"
              ? "families"
              : "groups",
          recordId,
        )
      : null;

    if (pageKey === "groupe-equipment") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      if (!name) return;

      const nextGroup = {
        id: existingRecord?.id || `equipment-group-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("GRP", directory.groups),
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
        departmentIds: getSelectedValues(
          form.querySelector("select[name='departmentIds']"),
        ),
      };

      const updatedGroups = directory.groups.filter(
        (group) => group.id !== nextGroup.id,
      );
      updatedGroups.push(nextGroup);
      directory.groups = updatedGroups.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveEquipmentDirectory(directory);
      closeEquipmentModal(pageKey);
      return;
    }

    if (pageKey === "famille-equipment") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      const groupId = String(
        form.querySelector("select[name='groupId']")?.value || "",
      );
      if (!name || !groupId) return;

      const nextFamily = {
        id: existingRecord?.id || `equipment-family-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("FAM", directory.families),
        groupId,
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
      };

      const updatedFamilies = directory.families.filter(
        (family) => family.id !== nextFamily.id,
      );
      updatedFamilies.push(nextFamily);
      directory.families = updatedFamilies.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveEquipmentDirectory(directory);
      closeEquipmentModal(pageKey);
      return;
    }

    const name = String(
      form.querySelector("input[name='name']")?.value || "",
    ).trim();
    const groupId = String(
      form.querySelector("select[name='groupId']")?.value || "",
    );
    const familyId = String(
      form.querySelector("select[name='familyId']")?.value || "",
    );
    if (!name || !groupId || !familyId) return;

    const removedPhotos = getAttachmentRemovalIndexes(form, "photos");
    const removedDocuments = getAttachmentRemovalIndexes(form, "documents");
    const photos = await readEquipmentFiles(
      form.querySelector("input[name='photos']")?.files,
    );
    const documents = await readEquipmentFiles(
      form.querySelector("input[name='documents']")?.files,
    );

    const nextEquipment = {
      id: existingRecord?.id || `equipment-${Date.now()}`,
      code:
        existingRecord?.code ||
        generateOrganizationCode("EQP", directory.equipments),
      name,
      groupId,
      familyId,
      brand: String(
        form.querySelector("input[name='brand']")?.value || "",
      ).trim(),
      supplier: String(
        form.querySelector("input[name='supplier']")?.value || "",
      ).trim(),
      serialNumber: String(
        form.querySelector("input[name='serialNumber']")?.value || "",
      ).trim(),
      criticality: String(
        form.querySelector("select[name='criticality']")?.value || "",
      ),
      purchasePrice: String(
        form.querySelector("input[name='purchasePrice']")?.value || "",
      ).trim(),
      purchaseDate: String(
        form.querySelector("input[name='purchaseDate']")?.value || "",
      ),
      serviceDate: String(
        form.querySelector("input[name='serviceDate']")?.value || "",
      ),
      warrantyDuration: String(
        form.querySelector("input[name='warrantyDuration']")?.value || "",
      ).trim(),
      status: String(form.querySelector("select[name='status']")?.value || ""),
      photos: [
        ...filterStoredAttachments(existingRecord?.photos, removedPhotos),
        ...photos,
      ],
      documents: [
        ...filterStoredAttachments(existingRecord?.documents, removedDocuments),
        ...documents,
      ],
    };

    const updatedEquipments = directory.equipments.filter(
      (equipment) => equipment.id !== nextEquipment.id,
    );
    updatedEquipments.push(nextEquipment);
    directory.equipments = updatedEquipments.sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    saveEquipmentDirectory(directory);
    closeEquipmentModal(pageKey);
  });

  if (pageKey === "equipment") {
    syncEquipmentFamilySelect(form);
  }
}

function getOrganeDirectory() {
  let directory = JSON.parse(JSON.stringify(organeDefaults));

  try {
    const stored = window.localStorage.getItem(organeStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      directory = {
        groups: Array.isArray(parsed.groups) ? parsed.groups : directory.groups,
        families: Array.isArray(parsed.families)
          ? parsed.families
          : directory.families,
        organes: Array.isArray(parsed.organes)
          ? parsed.organes
          : directory.organes,
      };
    }
  } catch (error) {
    directory = JSON.parse(JSON.stringify(organeDefaults));
  }

  return directory;
}

function saveOrganeDirectory(directory) {
  try {
    window.localStorage.setItem(organeStorageKey, JSON.stringify(directory));
  } catch (error) {
    // Keep the UI usable if persistent storage is unavailable.
  }
}

function getOrganeRecords(kind) {
  const directory = getOrganeDirectory();
  if (kind === "groups") return directory.groups;
  if (kind === "families") return directory.families;
  return directory.organes;
}

function getOrganeRecord(kind, recordId) {
  return (
    getOrganeRecords(kind).find((record) => record.id === recordId) || null
  );
}

function setOrganeModalState(state) {
  organeModalState = state;
}

function closeOrganeModal(pageKey) {
  setOrganeModalState(null);
  renderOrganePage(pageKey);
  window.location.hash = `organe/${pageKey}`;
}

function openOrganeModal(pageKey, mode, recordId = null) {
  setOrganeModalState({ pageKey, mode, recordId });
  renderOrganePage(pageKey);
  window.location.hash = `organe/${pageKey}`;
}

function buildOrganeTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages organes">
      ${Object.entries(sectionSubpages.organe.tabs)
        .map(
          ([key, tab]) => `
            <button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-og-subpage="${key}">
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function attachOrganeTabHandlers(selector) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.ogSubpage || "groupe-organe";
      renderPage("organe", nextSubpage);
      window.location.hash = `organe/${nextSubpage}`;
    });
  });
}

function renderOrganePageHeader(title, subtitle) {
  if (pageTitleEl) pageTitleEl.textContent = title;
  if (pageSubtitleEl) pageSubtitleEl.textContent = subtitle;
}

function renderOrganeActionButtons(pageKey, createLabel) {
  if (!pageActionsEl) return;

  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-og-create="${pageKey}">
      <i class="fa-solid fa-plus"></i>
      <span>${createLabel}</span>
    </button>
  `;

  const createButton = pageActionsEl.querySelector("[data-og-create]");
  if (createButton) {
    createButton.addEventListener("click", function () {
      openOrganeModal(pageKey, "create");
    });
  }
}

function buildOrganeListActions(pageKey, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-og-action="details" data-og-page="${pageKey}" data-og-id="${recordId}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-og-action="edit" data-og-page="${pageKey}" data-og-id="${recordId}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-og-action="delete" data-og-page="${pageKey}" data-og-id="${recordId}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildOrganeModalShell(title, subtitle, bodyHtml) {
  return `
    <div class="org-modal ${organeModalState ? "open" : ""}" role="presentation">
      <div class="org-modal-backdrop" data-org-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="ogModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Organe</div>
            <h3 id="ogModalTitle">${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-org-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderOrganeModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;

  if (!organeModalState) {
    overlayRootEl.innerHTML = "";
    return;
  }

  overlayRootEl.innerHTML = buildOrganeModalShell(title, subtitle, bodyHtml);
}

function buildAssociatedEquipmentOptions(selectedIds = []) {
  return getEquipmentRecords("equipments")
    .map(
      (equipment) => `
        <option value="${equipment.id}"${selectedIds.includes(equipment.id) ? " selected" : ""}>
          ${equipment.code} — ${equipment.name}
        </option>
      `,
    )
    .join("");
}

function buildOrganeGroupOptions(selectedGroupId = "") {
  return [
    '<option value="">Sélectionner un groupe</option>',
    ...getOrganeRecords("groups").map(
      (group) => `
        <option value="${group.id}"${group.id === selectedGroupId ? " selected" : ""}>
          ${group.code} — ${group.name}
        </option>
      `,
    ),
  ].join("");
}

function buildOrganeFamilyOptions(selectedFamilyId = "", selectedGroupId = "") {
  const families = getOrganeRecords("families").filter((family) => {
    return !selectedGroupId || family.groupId === selectedGroupId;
  });

  return [
    '<option value="">Sélectionner une famille</option>',
    ...families.map(
      (family) => `
        <option value="${family.id}"${family.id === selectedFamilyId ? " selected" : ""}>
          ${family.code} — ${family.name}
        </option>
      `,
    ),
  ].join("");
}

function syncOrganeFamilySelect(form) {
  const groupSelect = form.querySelector("select[name='groupId']");
  const familySelect = form.querySelector("select[name='familyId']");
  if (!groupSelect || !familySelect) return;

  const selectedFamilyId = familySelect.value;
  familySelect.innerHTML = buildOrganeFamilyOptions(
    selectedFamilyId,
    groupSelect.value,
  );

  if (
    selectedFamilyId &&
    !Array.from(familySelect.options).some(
      (option) => option.value === selectedFamilyId,
    )
  ) {
    familySelect.value = "";
  }
}

function buildOrganeGroupFormContent(record, mode) {
  const codePreview =
    record?.code || generateOrganizationCode("GOR", getOrganeRecords("groups"));

  return `
    <form class="org-form" data-og-form="groupe-organe">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="organeGroupCode">Code groupe</label>
          <input id="organeGroupCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="organeGroupName">Nom</label>
          <input id="organeGroupName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom du groupe organe" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="organeGroupDesignations">Désignations</label>
          <textarea id="organeGroupDesignations" name="designations" rows="4" placeholder="Désignations du groupe">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
        <div class="field-group field-group-wide">
          <label for="organeGroupEquipments">Équipements associés</label>
          <select id="organeGroupEquipments" name="associatedEquipmentIds" multiple size="6">
            ${buildAssociatedEquipmentOptions(record?.associatedEquipmentIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs équipements.</div>
        </div>
      </div>

      ${buildOrganizationFormFooter("groupe-organe", mode, record?.id || "")}
    </form>
  `;
}

function buildOrganeGroupDetailsContent(record) {
  const directory = getOrganeDirectory();
  const linkedFamilies = directory.families.filter(
    (family) => family.groupId === record.id,
  );
  const linkedOrganes = directory.organes.filter(
    (item) => item.groupId === record.id,
  );

  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Équipements associés</span><strong>${joinRecordLabels(getEquipmentRecords("equipments"), record.associatedEquipmentIds || [], (equipment) => `${equipment.code} — ${equipment.name}`)}</strong></div>
      <div class="org-detail-item"><span>Familles liées</span><strong>${linkedFamilies.length}</strong></div>
      <div class="org-detail-item"><span>Organes liés</span><strong>${linkedOrganes.length}</strong></div>
    </div>
  `;
}

function renderOrganeGroupsPage() {
  const directory = getOrganeDirectory();
  const activeRecord =
    organeModalState && organeModalState.pageKey === "groupe-organe"
      ? getOrganeRecord("groups", organeModalState.recordId)
      : null;

  renderOrganePageHeader(
    "Organe",
    "Référentiel des groupes, familles et organes.",
  );
  renderOrganeActionButtons("groupe-organe", "Nouveau groupe organe");

  if (!pageContentEl) return;

  const rows = directory.groups.length
    ? directory.groups
        .map((group) => {
          const familyCount = directory.families.filter(
            (family) => family.groupId === group.id,
          ).length;
          const organeCount = directory.organes.filter(
            (item) => item.groupId === group.id,
          ).length;
          return `
            <tr>
              <td><strong>${group.code}</strong></td>
              <td>${group.name}</td>
              <td class="muted">${group.designations || "-"}</td>
              <td class="muted">${joinRecordLabels(getEquipmentRecords("equipments"), group.associatedEquipmentIds || [], (equipment) => `${equipment.code} — ${equipment.name}`)}</td>
              <td class="muted">${familyCount} familles · ${organeCount} organes</td>
              <td>${buildOrganeListActions("groupe-organe", group.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-layer-group",
            "Aucun groupe organe enregistré",
            "Créez le premier groupe organe et associez-le à un ou plusieurs équipements.",
            "Le bouton Nouveau groupe organe ouvre le formulaire de création.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganeTabs("groupe-organe")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organe</div>
        <h2>Groupes organes</h2>
        <p>Chaque groupe organe peut être associé à plusieurs équipements.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Groupes organes",
        value: String(directory.groups.length),
        note: "Référentiel de premier niveau",
      },
      {
        label: "Équipements associés",
        value: String(
          directory.groups.reduce(
            (total, group) =>
              total + (group.associatedEquipmentIds || []).length,
            0,
          ),
        ),
        note: "Association multi-équipements",
      },
      {
        label: "Organes référencés",
        value: String(directory.organes.length),
        note: "Inventaire des organes",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-layer-group"></i> Liste des groupes organes</div>
        <span class="status-badge badge-info">${directory.groups.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Désignations</th>
              <th>Équipements associés</th>
              <th>Liens</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderOrganeModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouveau groupe organe",
    activeRecord
      ? "Toutes les informations du groupe organe sélectionné."
      : "Saisissez les informations du nouveau groupe organe.",
    organeModalState && organeModalState.mode === "details" && activeRecord
      ? buildOrganeGroupDetailsContent(activeRecord)
      : buildOrganeGroupFormContent(
          activeRecord,
          organeModalState?.mode || "create",
        ),
  );

  attachOrganePageHandlers("groupe-organe");
}

function buildOrganeFamilyFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("FGO", getOrganeRecords("families"));

  return `
    <form class="org-form" data-og-form="famille-organe">
      <div class="org-form-grid">
        <div class="field-group">
          <label for="organeFamilyCode">Code famille</label>
          <input id="organeFamilyCode" type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="organeFamilyName">Nom</label>
          <input id="organeFamilyName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de la famille organe" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="organeFamilyDesignations">Désignations</label>
          <textarea id="organeFamilyDesignations" name="designations" rows="4" placeholder="Désignations de la famille">${escapeTextarea(record?.designations || "")}</textarea>
        </div>
        <div class="field-group field-group-wide">
          <label for="organeFamilyGroup">Groupe associé</label>
          <select id="organeFamilyGroup" name="groupId" required>
            ${buildOrganeGroupOptions(record?.groupId || "")}
          </select>
        </div>
      </div>

      ${buildOrganizationFormFooter("famille-organe", mode, record?.id || "")}
    </form>
  `;
}

function buildOrganeFamilyDetailsContent(record) {
  const group = getOrganeRecord("groups", record.groupId);
  const linkedOrganes = getOrganeRecords("organes").filter(
    (item) => item.familyId === record.id,
  );

  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Code</span><strong>${record.code}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${record.name}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Désignations</span><strong>${record.designations || "Aucune désignation"}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Groupe associé</span><strong>${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</strong></div>
      <div class="org-detail-item"><span>Organes liés</span><strong>${linkedOrganes.length}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${linkedOrganes.length ? "Utilisée" : "Disponible"}</strong></div>
    </div>
  `;
}

function renderOrganeFamiliesPage() {
  const directory = getOrganeDirectory();
  const activeRecord =
    organeModalState && organeModalState.pageKey === "famille-organe"
      ? getOrganeRecord("families", organeModalState.recordId)
      : null;

  renderOrganePageHeader(
    "Organe",
    "Référentiel des groupes, familles et organes.",
  );
  renderOrganeActionButtons("famille-organe", "Nouvelle famille organe");

  if (!pageContentEl) return;

  const rows = directory.families.length
    ? directory.families
        .map((family) => {
          const group = getOrganeRecord("groups", family.groupId);
          const count = directory.organes.filter(
            (item) => item.familyId === family.id,
          ).length;
          return `
            <tr>
              <td><strong>${family.code}</strong></td>
              <td>${family.name}</td>
              <td class="muted">${family.designations || "-"}</td>
              <td class="muted">${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</td>
              <td class="muted">${count} organes</td>
              <td>${buildOrganeListActions("famille-organe", family.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6">
          ${buildOrganizationEmptyState(
            "fa-folder-tree",
            "Aucune famille organe enregistrée",
            "Créez une famille organe et associez-la à un groupe existant.",
            "Le bouton Nouvelle famille organe ouvre le formulaire de création.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganeTabs("famille-organe")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organe</div>
        <h2>Familles organes</h2>
        <p>Chaque famille organe est rattachée à un groupe organe.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.families.length} familles</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Familles organes",
        value: String(directory.families.length),
        note: "Niveau intermédiaire",
      },
      {
        label: "Familles reliées",
        value: String(
          directory.families.filter((family) => family.groupId).length,
        ),
        note: "Association obligatoire au groupe",
      },
      {
        label: "Organes créés",
        value: String(directory.organes.length),
        note: "Inventaire des organes",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-folder-tree"></i> Liste des familles organes</div>
        <span class="status-badge badge-info">${directory.families.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Désignations</th>
              <th>Groupe</th>
              <th>Liens</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderOrganeModal(
    activeRecord
      ? `Détails de ${activeRecord.name}`
      : "Nouvelle famille organe",
    activeRecord
      ? "Toutes les informations de la famille organe sélectionnée."
      : "Saisissez les informations de la nouvelle famille organe.",
    organeModalState && organeModalState.mode === "details" && activeRecord
      ? buildOrganeFamilyDetailsContent(activeRecord)
      : buildOrganeFamilyFormContent(
          activeRecord,
          organeModalState?.mode || "create",
        ),
  );

  attachOrganePageHandlers("famille-organe");
}

function buildOrganeFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("ORG", getOrganeRecords("organes"));
  const selectedGroupId = record?.groupId || "";

  return `
    <form class="org-form" data-og-form="organe">
      <div class="equipment-form-sections">
        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Type général</div>
              <h4>Identification et statut</h4>
              <p>Nom d'organe, groupe/famille, criticité et état.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group">
              <label for="organeCode">Code organe</label>
              <input id="organeCode" type="text" value="${escapeHtml(codePreview)}" disabled />
            </div>
            <div class="field-group">
              <label for="organeName">Nom organe</label>
              <input id="organeName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom de l'organe" required />
            </div>
            <div class="field-group">
              <label for="organeGroup">Groupe organe</label>
              <select id="organeGroup" name="groupId" required data-organe-group-select>
                ${buildOrganeGroupOptions(selectedGroupId)}
              </select>
            </div>
            <div class="field-group">
              <label for="organeFamily">Famille organe</label>
              <select id="organeFamily" name="familyId" required>
                ${buildOrganeFamilyOptions(record?.familyId || "", selectedGroupId)}
              </select>
            </div>
            <div class="field-group">
              <label for="organeCriticality">Criticité</label>
              <select id="organeCriticality" name="criticality" required>
                ${buildCriticalityOptions(record?.criticality || "")}
              </select>
            </div>
            <div class="field-group">
              <label for="organeStatus">État</label>
              <select id="organeStatus" name="status" required>
                ${buildStatusOptions(record?.status || "")}
              </select>
            </div>
          </div>
        </section>

        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Type complémentaire</div>
              <h4>Informations techniques et achats</h4>
              <p>Marque, fournisseur, traçabilité et historique d'achat.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group">
              <label for="organeBrand">Marque</label>
              <input id="organeBrand" name="brand" type="text" value="${escapeHtml(record?.brand || "")}" placeholder="Marque" />
            </div>
            <div class="field-group">
              <label for="organeSupplier">Fournisseur</label>
              <input id="organeSupplier" name="supplier" type="text" value="${escapeHtml(record?.supplier || "")}" placeholder="Fournisseur" />
            </div>
            <div class="field-group">
              <label for="organeSerialNumber">N° série</label>
              <input id="organeSerialNumber" name="serialNumber" type="text" value="${escapeHtml(record?.serialNumber || "")}" placeholder="Numéro de série" />
            </div>
            <div class="field-group">
              <label for="organePurchasePrice">Prix d'achat</label>
              <input id="organePurchasePrice" name="purchasePrice" type="text" value="${escapeHtml(record?.purchasePrice || "")}" placeholder="Prix d’achat" />
            </div>
            <div class="field-group">
              <label for="organePurchaseDate">Date d'achat</label>
              <input id="organePurchaseDate" name="purchaseDate" type="date" value="${escapeHtml(record?.purchaseDate || "")}" />
            </div>
            <div class="field-group">
              <label for="organeServiceDate">Date de mise en service</label>
              <input id="organeServiceDate" name="serviceDate" type="date" value="${escapeHtml(record?.serviceDate || "")}" />
            </div>
            <div class="field-group">
              <label for="organeWarranty">Durée de garantie</label>
              <input id="organeWarranty" name="warrantyDuration" type="text" value="${escapeHtml(record?.warrantyDuration || "")}" placeholder="Durée de garantie" />
            </div>
          </div>
        </section>

        <section class="equipment-section-card">
          <div class="equipment-section-head">
            <div>
              <div class="equipment-section-kicker">Pièces jointes</div>
              <h4>Photos et documents associés</h4>
              <p>Ajoutez les fichiers de référence de l'organe.</p>
            </div>
          </div>
          <div class="equipment-upload-grid">
            <div class="field-group field-group-wide">
              <label for="organePhotos">Photos</label>
              <input id="organePhotos" name="photos" type="file" accept="image/*" multiple />
            </div>
            <div class="field-group field-group-wide">
              <label for="organeDocuments">Documents associés</label>
              <input id="organeDocuments" name="documents" type="file" multiple />
            </div>
            ${record ? `<div class="field-group field-group-wide">${buildEquipmentAttachmentsPreview(record, mode === "edit")}</div>` : ""}
          </div>
        </section>
      </div>

      ${buildOrganizationFormFooter("organe", mode, record?.id || "")}
    </form>
  `;
}

function buildOrganeDetailsContent(record) {
  const group = getOrganeRecord("groups", record.groupId);
  const family = getOrganeRecord("families", record.familyId);
  const primaryPhoto = Array.isArray(record.photos) ? record.photos[0] : null;
  const primaryPhotoSrc = primaryPhoto?.dataUrl || primaryPhoto || "";
  const primaryPhotoLabel = primaryPhoto?.name || record.name || "Organe";

  return `
    <div class="equipment-detail-layout">
      <div class="equipment-detail-media">
        <div class="equipment-detail-image">
          ${primaryPhotoSrc ? `<img src="${primaryPhotoSrc}" alt="${escapeHtml(primaryPhotoLabel)}" />` : `<div class="equipment-detail-placeholder"><i class="fa-regular fa-image"></i><span>Aucune photo disponible</span></div>`}
        </div>
      </div>

      <div class="equipment-detail-info">
        <div class="equipment-detail-list">
          <div class="equipment-detail-row">
            <span>Code</span>
            <strong>${record.code}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>N° de série</span>
            <strong>${record.serialNumber || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Nom</span>
            <strong>${record.name}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Marque</span>
            <strong>${record.brand || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Criticité</span>
            <strong>${record.criticality || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>État</span>
            <strong>${record.status || "-"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Groupe</span>
            <strong>${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Famille</span>
            <strong>${family ? `${family.code} — ${family.name}` : "Aucune sélection"}</strong>
          </div>
        </div>
        <div class="equipment-detail-media-note">
          ${primaryPhotoSrc ? `Photo principale de la fiche organe` : `Ajoutez des photos depuis le formulaire pour enrichir la fiche`}
        </div>
      </div>
    </div>
  `;
}

function renderOrganeItemsPage() {
  const directory = getOrganeDirectory();
  const activeRecord =
    organeModalState && organeModalState.pageKey === "organe"
      ? getOrganeRecord("organes", organeModalState.recordId)
      : null;

  renderOrganePageHeader(
    "Organe",
    "Référentiel des groupes, familles et organes.",
  );
  renderOrganeActionButtons("organe", "Nouvel organe");

  if (!pageContentEl) return;

  const rows = directory.organes.length
    ? directory.organes
        .map((record) => {
          const group = getOrganeRecord("groups", record.groupId);
          const family = getOrganeRecord("families", record.familyId);
          return `
            <tr>
              <td><strong>${record.code}</strong></td>
              <td>${record.name}</td>
              <td class="muted">${group ? `${group.code} — ${group.name}` : "Aucune sélection"}</td>
              <td class="muted">${family ? `${family.code} — ${family.name}` : "Aucune sélection"}</td>
              <td><span class="status-badge ${getCriticalityBadgeClass(record.criticality)}">${record.criticality || "-"}</span></td>
              <td><span class="status-badge ${getStatusBadgeClass(record.status)}">${record.status || "-"}</span></td>
              <td>${buildOrganeListActions("organe", record.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="7">
          ${buildOrganizationEmptyState(
            "fa-puzzle-piece",
            "Aucun organe enregistré",
            "Créez la première fiche organe après avoir défini les groupes et familles.",
            "Le bouton Nouvel organe ouvre le formulaire complet.",
          )}
        </td>
      </tr>
    `;

  pageContentEl.className = "organization-page organization-crud-page";
  pageContentEl.innerHTML = `
    ${buildOrganeTabs("organe")}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel organe</div>
        <h2>Organes</h2>
        <p>Formulaire complet de création d'organe avec pièces jointes.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${directory.organes.length} organes</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "Organes total",
        value: String(directory.organes.length),
        note: "Inventaire local navigateur",
      },
      {
        label: "Organes en service",
        value: String(
          directory.organes.filter((item) => item.status === "En service")
            .length,
        ),
        note: "Statut opérationnel",
      },
      {
        label: "Pièces jointes",
        value: String(
          directory.organes.filter(
            (item) =>
              (Array.isArray(item.photos) ? item.photos.length : 0) +
                (Array.isArray(item.documents) ? item.documents.length : 0) >
              0,
          ).length,
        ),
        note: "Photos et documents associés",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-puzzle-piece"></i> Liste des organes</div>
        <span class="status-badge badge-info">${directory.organes.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Groupe</th>
              <th>Famille</th>
              <th>Criticité</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  renderOrganeModal(
    activeRecord ? `Détails de ${activeRecord.name}` : "Nouvel organe",
    activeRecord
      ? "Toutes les informations de l'organe sélectionné."
      : "Saisissez les informations du nouvel organe.",
    organeModalState && organeModalState.mode === "details" && activeRecord
      ? buildOrganeDetailsContent(activeRecord)
      : buildOrganeFormContent(
          activeRecord,
          organeModalState?.mode || "create",
        ),
  );

  attachOrganePageHandlers("organe");
}

function renderOrganePage(subpageKey) {
  const activeSubpageKey = sectionSubpages.organe.tabs[subpageKey]
    ? subpageKey
    : sectionSubpages.organe.defaultSubpage;

  if (!pageContentEl) return;

  if (activeSubpageKey === "groupe-organe") {
    renderOrganeGroupsPage();
  } else if (activeSubpageKey === "famille-organe") {
    renderOrganeFamiliesPage();
  } else {
    renderOrganeItemsPage();
  }

  attachOrganeTabHandlers("[data-og-subpage]");
}

function attachOrganePageHandlers(pageKey) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-og-create]").forEach((button) => {
    button.addEventListener("click", function () {
      openOrganeModal(pageKey, "create");
    });
  });

  pageContentEl.querySelectorAll("[data-og-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.ogAction;
      const targetPage = this.dataset.ogPage || pageKey;
      const recordId = this.dataset.ogId || "";

      if (action === "details") {
        openOrganeModal(targetPage, "details", recordId);
        return;
      }

      if (action === "edit") {
        openOrganeModal(targetPage, "edit", recordId);
        return;
      }

      if (action === "delete") {
        const record = getOrganeRecord(
          targetPage === "organe"
            ? "organes"
            : targetPage === "famille-organe"
              ? "families"
              : "groups",
          recordId,
        );
        if (!record) return;

        const confirmed = window.confirm(
          `Supprimer ${record.name} ? Cette action est irréversible.`,
        );
        if (!confirmed) return;

        const directory = getOrganeDirectory();

        if (targetPage === "groupe-organe") {
          const linkedFamilyIds = directory.families
            .filter((family) => family.groupId === recordId)
            .map((family) => family.id);

          directory.groups = directory.groups.filter(
            (item) => item.id !== recordId,
          );
          directory.families = directory.families.map((family) =>
            family.groupId === recordId ? { ...family, groupId: "" } : family,
          );
          directory.organes = directory.organes.map((item) => ({
            ...item,
            groupId: item.groupId === recordId ? "" : item.groupId,
            familyId: linkedFamilyIds.includes(item.familyId)
              ? ""
              : item.familyId,
          }));
        } else if (targetPage === "famille-organe") {
          directory.families = directory.families.filter(
            (item) => item.id !== recordId,
          );
          directory.organes = directory.organes.map((item) =>
            item.familyId === recordId ? { ...item, familyId: "" } : item,
          );
        } else {
          directory.organes = directory.organes.filter(
            (item) => item.id !== recordId,
          );
        }

        saveOrganeDirectory(directory);
        renderOrganePage(pageKey);
        window.location.hash = `organe/${pageKey}`;
      }
    });
  });

  const modal = overlayRootEl
    ? overlayRootEl.querySelector(".org-modal")
    : null;
  if (!modal) return;

  modal.querySelectorAll("[data-org-close]").forEach((button) => {
    button.addEventListener("click", function () {
      closeOrganeModal(pageKey);
    });
  });

  const form = modal.querySelector("[data-og-form]");
  if (!form) return;

  attachAttachmentRemovalHandlers(form);

  const groupSelect = form.querySelector("[data-organe-group-select]");
  if (groupSelect) {
    groupSelect.addEventListener("change", function () {
      syncOrganeFamilySelect(form);
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const directory = getOrganeDirectory();
    const recordId = String(
      form.querySelector("input[name='recordId']")?.value || "",
    );
    const existingRecord = recordId
      ? getOrganeRecord(
          pageKey === "organe"
            ? "organes"
            : pageKey === "famille-organe"
              ? "families"
              : "groups",
          recordId,
        )
      : null;

    if (pageKey === "groupe-organe") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      if (!name) return;

      const nextGroup = {
        id: existingRecord?.id || `organe-group-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("GOR", directory.groups),
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
        associatedEquipmentIds: getSelectedValues(
          form.querySelector("select[name='associatedEquipmentIds']"),
        ),
      };

      const updatedGroups = directory.groups.filter(
        (group) => group.id !== nextGroup.id,
      );
      updatedGroups.push(nextGroup);
      directory.groups = updatedGroups.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveOrganeDirectory(directory);
      closeOrganeModal(pageKey);
      return;
    }

    if (pageKey === "famille-organe") {
      const name = String(
        form.querySelector("input[name='name']")?.value || "",
      ).trim();
      const groupId = String(
        form.querySelector("select[name='groupId']")?.value || "",
      );
      if (!name || !groupId) return;

      const nextFamily = {
        id: existingRecord?.id || `organe-family-${Date.now()}`,
        code:
          existingRecord?.code ||
          generateOrganizationCode("FGO", directory.families),
        name,
        designations: String(
          form.querySelector("textarea[name='designations']")?.value || "",
        ).trim(),
        groupId,
      };

      const updatedFamilies = directory.families.filter(
        (family) => family.id !== nextFamily.id,
      );
      updatedFamilies.push(nextFamily);
      directory.families = updatedFamilies.sort((left, right) =>
        left.code.localeCompare(right.code),
      );
      saveOrganeDirectory(directory);
      closeOrganeModal(pageKey);
      return;
    }

    const name = String(
      form.querySelector("input[name='name']")?.value || "",
    ).trim();
    const groupId = String(
      form.querySelector("select[name='groupId']")?.value || "",
    );
    const familyId = String(
      form.querySelector("select[name='familyId']")?.value || "",
    );
    if (!name || !groupId || !familyId) return;

    const removedPhotos = getAttachmentRemovalIndexes(form, "photos");
    const removedDocuments = getAttachmentRemovalIndexes(form, "documents");
    const photos = await readEquipmentFiles(
      form.querySelector("input[name='photos']")?.files,
    );
    const documents = await readEquipmentFiles(
      form.querySelector("input[name='documents']")?.files,
    );

    const nextOrgane = {
      id: existingRecord?.id || `organe-${Date.now()}`,
      code:
        existingRecord?.code ||
        generateOrganizationCode("ORG", directory.organes),
      name,
      groupId,
      familyId,
      criticality: String(
        form.querySelector("select[name='criticality']")?.value || "",
      ),
      brand: String(
        form.querySelector("input[name='brand']")?.value || "",
      ).trim(),
      supplier: String(
        form.querySelector("input[name='supplier']")?.value || "",
      ).trim(),
      serialNumber: String(
        form.querySelector("input[name='serialNumber']")?.value || "",
      ).trim(),
      purchasePrice: String(
        form.querySelector("input[name='purchasePrice']")?.value || "",
      ).trim(),
      purchaseDate: String(
        form.querySelector("input[name='purchaseDate']")?.value || "",
      ),
      serviceDate: String(
        form.querySelector("input[name='serviceDate']")?.value || "",
      ),
      warrantyDuration: String(
        form.querySelector("input[name='warrantyDuration']")?.value || "",
      ).trim(),
      status: String(form.querySelector("select[name='status']")?.value || ""),
      photos: [
        ...filterStoredAttachments(existingRecord?.photos, removedPhotos),
        ...photos,
      ],
      documents: [
        ...filterStoredAttachments(existingRecord?.documents, removedDocuments),
        ...documents,
      ],
    };

    const updatedOrganes = directory.organes.filter(
      (item) => item.id !== nextOrgane.id,
    );
    updatedOrganes.push(nextOrgane);
    directory.organes = updatedOrganes.sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    saveOrganeDirectory(directory);
    closeOrganeModal(pageKey);
  });

  if (pageKey === "organe") {
    syncOrganeFamilySelect(form);
  }
}

function buildArboNode(id, label, icon, children = [], note = "") {
  return { id, label, icon, children, note };
}

function renderArboNode(node) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const leafMessage = node.note || "Créer le niveau suivant pour continuer.";
  const isArticleNode = String(node.id || "").startsWith("arbo-article-");
  const showLeafNote = !hasChildren && !isArticleNode && leafMessage;

  return `
    <li class="arbo-node-item">
      <button
        class="arbo-node-toggle ${hasChildren ? "" : "is-leaf"}"
        type="button"
        data-arbo-id="${node.id}"
        ${hasChildren ? `data-arbo-toggle="${node.id}" aria-expanded="false"` : "disabled"}
      >
        <span class="arbo-chevron" aria-hidden="true">></span>
        <i class="fa-solid ${node.icon}"></i>
        <span class="arbo-label">${escapeHtml(node.label)}</span>
        ${showLeafNote ? `<span class="arbo-note">${escapeHtml(leafMessage)}</span>` : ""}
      </button>
      ${hasChildren ? `<ul class="arbo-children" id="${node.id}" hidden>${node.children.map(renderArboNode).join("")}</ul>` : ""}
    </li>
  `;
}

function getArboDepartmentChildren(department, datasets) {
  const groups = datasets.equipmentGroups.filter((group) =>
    (group.departmentIds || []).includes(department.id),
  );

  return groups.map((group) => {
    const familyNodes = datasets.equipmentFamilies
      .filter((family) => family.groupId === group.id)
      .map((family) => {
        const equipmentNodes = datasets.equipments
          .filter((equipment) => equipment.familyId === family.id)
          .map((equipment) => {
            const organeGroupNodes = datasets.organeGroups
              .filter((orgGroup) =>
                (orgGroup.associatedEquipmentIds || []).includes(equipment.id),
              )
              .map((orgGroup) => {
                const organeFamilyNodes = datasets.organeFamilies
                  .filter((orgFamily) => orgFamily.groupId === orgGroup.id)
                  .map((orgFamily) => {
                    const organeNodes = datasets.organes
                      .filter((organe) => organe.familyId === orgFamily.id)
                      .map((organe) => {
                        const articleGroupNodes = datasets.articleGroups
                          .filter((articleGroup) =>
                            (articleGroup.associatedOrganeIds || []).includes(
                              organe.id,
                            ),
                          )
                          .map((articleGroup) => {
                            const articleFamilyNodes = datasets.articleFamilies
                              .filter(
                                (articleFamily) =>
                                  articleFamily.groupId === articleGroup.id,
                              )
                              .map((articleFamily) => {
                                const articleNodes = datasets.articles
                                  .filter(
                                    (article) =>
                                      article.familyId === articleFamily.id,
                                  )
                                  .map((article) =>
                                    buildArboNode(
                                      `arbo-article-${article.id}`,
                                      `${article.code} - ${article.name}`,
                                      "fa-barcode",
                                    ),
                                  );

                                return buildArboNode(
                                  `arbo-article-family-${articleFamily.id}`,
                                  `${articleFamily.code} - ${articleFamily.name}`,
                                  "fa-layer-group",
                                  articleNodes,
                                );
                              });

                            return buildArboNode(
                              `arbo-article-group-${articleGroup.id}`,
                              `${articleGroup.code} - ${articleGroup.name}`,
                              "fa-boxes-stacked",
                              articleFamilyNodes,
                            );
                          });

                        return buildArboNode(
                          `arbo-organe-${organe.id}`,
                          `${organe.code} - ${organe.name}`,
                          "fa-circle-nodes",
                          articleGroupNodes,
                        );
                      });

                    return buildArboNode(
                      `arbo-organe-family-${orgFamily.id}`,
                      `${orgFamily.code} - ${orgFamily.name}`,
                      "fa-puzzle-piece",
                      organeNodes,
                    );
                  });

                return buildArboNode(
                  `arbo-organe-group-${orgGroup.id}`,
                  `${orgGroup.code} - ${orgGroup.name}`,
                  "fa-diagram-project",
                  organeFamilyNodes,
                );
              });

            return buildArboNode(
              `arbo-equipment-${equipment.id}`,
              `${equipment.code} - ${equipment.name}`,
              "fa-gear",
              organeGroupNodes,
            );
          });

        return buildArboNode(
          `arbo-equipment-family-${family.id}`,
          `${family.code} - ${family.name}`,
          "fa-folder-tree",
          equipmentNodes,
        );
      });

    return buildArboNode(
      `arbo-equipment-group-${group.id}`,
      `${group.code} - ${group.name}`,
      "fa-screwdriver-wrench",
      familyNodes,
    );
  });
}

function buildArborescenceTree() {
  const enterprise = getEnterpriseProfile();
  const organization = getOrganizationDirectory();
  const equipment = getEquipmentDirectory();
  const organe = getOrganeDirectory();
  const article = getArticleDirectory();

  const datasets = {
    equipmentGroups: equipment.groups,
    equipmentFamilies: equipment.families,
    equipments: equipment.equipments,
    organeGroups: organe.groups,
    organeFamilies: organe.families,
    organes: organe.organes,
    articleGroups: article.groups,
    articleFamilies: article.families,
    articles: article.articles,
  };

  const departments = organization.departmentServices;

  const unitNodes = organization.unites.map((unit) => {
    const divisionNodes = organization.divisions
      .filter((division) => (division.unitIds || []).includes(unit.id))
      .map((division) => {
        const departmentNodes = departments
          .filter((department) =>
            (department.divisionIds || []).includes(division.id),
          )
          .map((department) => {
            return buildArboNode(
              `arbo-department-${division.id}__${department.id}`,
              `${department.code} - ${department.name}`,
              "fa-building-user",
              getArboDepartmentChildren(department, datasets),
            );
          });

        return buildArboNode(
          `arbo-division-${unit.id}__${division.id}`,
          `${division.code} - ${division.name}`,
          "fa-diagram-project",
          departmentNodes,
        );
      });

    return buildArboNode(
      `arbo-unit-${unit.id}`,
      `${unit.code} - ${unit.name}`,
      "fa-industry",
      divisionNodes,
    );
  });

  const enterpriseLabel = enterprise.name
    ? `${enterprise.code} - ${enterprise.name}`
    : `${enterprise.code} - Entreprise`;

  return buildArboNode(
    "arbo-enterprise-root",
    enterpriseLabel,
    "fa-building",
    unitNodes,
  );
}

function attachArborescenceHandlers() {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-arbo-toggle]").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.arboToggle;
      if (!targetId) return;
      const target = pageContentEl.querySelector(`#${targetId}`);
      if (!target) return;

      const isExpanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", isExpanded ? "false" : "true");
      this.classList.toggle("open", !isExpanded);
      target.hidden = isExpanded;
    });
  });

  // Right-click context menu on nodes
  pageContentEl.querySelectorAll("[data-arbo-id]").forEach((button) => {
    button.addEventListener("contextmenu", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const arboId = this.dataset.arboId || "";
      showArboContextMenu(ev.clientX, ev.clientY, arboId);
    });
  });
}

function renderArborescencePage() {
  if (pageActionsEl) {
    pageActionsEl.innerHTML = "";
  }
  if (!pageContentEl) return;

  const tree = buildArborescenceTree();

  pageContentEl.className = "organization-page arborescence-page";
  pageContentEl.innerHTML = `
    <div class="arbo-card">
      <div class="arbo-card-head">
        <div class="card-title"><i class="fa-solid fa-sitemap"></i> Arborescence hiérarchique</div>
        <span class="status-badge badge-info">Cliquez sur > pour ouvrir un niveau</span>
      </div>
      <div class="arbo-card-body">
        <ul class="arbo-tree-root">
          ${renderArboNode(tree)}
        </ul>
      </div>
    </div>
  `;

  attachArborescenceHandlers();
}

function renderSectionSubpages(pageKey, subpageKey) {
  const config = sectionSubpages[pageKey];
  if (!config || !pageContentEl) return;

  const activeSubpageKey = config.tabs[subpageKey]
    ? subpageKey
    : config.defaultSubpage;
  const activeSubpage = config.tabs[activeSubpageKey];

  if (pageActionsEl) {
    pageActionsEl.innerHTML = "";
  }

  pageContentEl.className = "organization-page";
  pageContentEl.innerHTML = `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages ${pages[pageKey].title}">
      ${Object.entries(config.tabs)
        .map(
          ([key, tab]) => `
            <button
              class="org-tab ${key === activeSubpageKey ? "active" : ""}"
              type="button"
              data-section-subpage="${key}"
            >
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>

    <div class="org-empty-card">
      <div class="blank-badge"><i class="fa-regular fa-folder-open"></i></div>
      <h2>${activeSubpage.title}</h2>
      <p>${activeSubpage.body}</p>
      <span class="blank-note">Contenu à développer plus tard.</span>
    </div>
  `;

  pageContentEl.querySelectorAll("[data-section-subpage]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.sectionSubpage || config.defaultSubpage;
      renderPage(pageKey, nextSubpage);
      window.location.hash = `${pageKey}/${nextSubpage}`;
    });
  });
}

function renderDashboardPage() {
  if (pageActionsEl) {
    renderDashboardActions();
  }

  if (!pageContentEl) return;

  const stockAlerts = getStockAlerts();
  const dashboardAlertItems = [...dashboardAlerts, ...stockAlerts];
  const alertCount = dashboardAlertItems.length;

  pageContentEl.className = "dashboard-page";
  pageContentEl.innerHTML = `
    <div class="kpi-grid">
      ${dashboardKpis
        .map(
          (kpi) => `
            <div class="kpi-card">
              <div class="kpi-header">
                <div class="kpi-label">${kpi.label}</div>
                <div class="kpi-icon ${kpi.iconClass}"><i class="fa-solid ${kpi.icon}"></i></div>
              </div>
              <div class="kpi-value">${kpi.label === "Alertes en attente" ? alertCount : kpi.value}</div>
              <div class="kpi-footer">
                <span class="kpi-trend ${kpi.trendClass}"><i class="fa-solid ${kpi.trendIcon}"></i> ${kpi.trendValue}</span>
                <span>${kpi.footer}</span>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>

    <div class="grid-3-1">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-list-check"></i> Interventions récentes</div>
          <a href="#" class="link-all">Voir toutes <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Équipement</th>
                <th>Type</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Technicien</th>
              </tr>
            </thead>
            <tbody>
              ${recentInterventions
                .map(
                  (intervention) => `
                    <tr>
                      <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${intervention.ref}</span></td>
                      <td><strong>${intervention.equipment}</strong></td>
                      <td class="muted">${intervention.type}</td>
                      <td><span class="priority-tag ${intervention.priorityClass}">${intervention.priorityLabel}</span></td>
                      <td><span class="status-badge ${intervention.statusClass}">${intervention.statusLabel}</span></td>
                      <td class="muted">${intervention.technician}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-bell"></i> Alertes</div>
          <span class="status-badge badge-danger" style="font-size:11px">${alertCount} actives</span>
        </div>
        <div class="alert-list">
          ${dashboardAlertItems
            .map(
              (alert) => `
                <div class="alert-item ${alert.type}">
                  <i class="fa-solid ${alert.icon} alert-icon"></i>
                  <div>
                    <div class="alert-text">${alert.title}</div>
                    <div class="alert-sub">${alert.subtitle}</div>
                  </div>
                  <div class="alert-time">${alert.time}</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-gear"></i> Équipements critiques</div>
          <a href="#" class="link-all">Tous les équipements <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="eq-grid">
          ${criticalEquipment
            .map(
              (equipment) => `
                <div class="eq-card">
                  <div class="eq-icon"><i class="fa-solid ${equipment.icon}"></i></div>
                  <div class="eq-name">${equipment.name}</div>
                  <div class="eq-loc"><i class="fa-solid fa-location-dot" style="font-size:10px"></i> ${equipment.location}</div>
                  <div class="eq-status"><span class="status-badge ${equipment.statusClass}" style="font-size:11px">${equipment.statusLabel}</span></div>
                  <div class="health-bar"><div class="health-fill ${equipment.fillClass}" style="width:${equipment.fillWidth};${equipment.fillStyle || ""}"></div></div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-chart-pie"></i> Statut des ordres de travail</div>
          </div>
          <div class="donut-wrap">
            <div class="donut">
              <div class="donut-center">
                <div class="donut-pct">52%</div>
                <div class="donut-lbl">Terminé</div>
              </div>
            </div>
            <div class="legend">
              ${workOrderStatus
                .map(
                  (item) => `
                    <div class="legend-item">
                      <div class="legend-dot" style="background:${item.color}"></div>
                      <span class="muted">${item.label}</span>
                      <span class="legend-count">${item.count}</span>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="stats-row">
            <div class="stat-cell">
              <div class="stat-num" style="color:var(--brand)">42</div>
              <div class="stat-lbl">Total OT</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num" style="color:var(--success)">3.2h</div>
              <div class="stat-lbl">Délai moy.</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num" style="color:var(--warning)">87%</div>
              <div class="stat-lbl">Taux respect</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-chart-simple"></i> Disponibilité par zone</div>
          </div>
          <div class="card-body">
            ${availabilityByZone
              .map(
                (zone, index) => `
                  <div class="progress-row"${index === availabilityByZone.length - 1 ? ' style="margin-bottom:0"' : ""}>
                    <div class="progress-label"><span>${zone.label}</span><span>${zone.value}</span></div>
                    <div class="progress-bar"><div class="progress-fill ${zone.fillClass}" style="width:${zone.width}"></div></div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-timeline"></i> Activité récente</div>
          <a href="#" class="link-all">Historique <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="card-body">
          <ul class="timeline">
            ${recentActivity
              .map(
                (item, index) => `
                  <li class="tl-item"${index === recentActivity.length - 1 ? ' style="padding-bottom:0"' : ""}>
                    <div class="tl-dot" style="${item.dotStyle}"><i class="fa-solid ${item.icon}" style="font-size:12px"></i></div>
                    <div class="tl-content">
                      <div class="tl-title">${item.title}</div>
                      <div class="tl-meta">${item.meta}</div>
                    </div>
                  </li>
                `,
              )
              .join("")}
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-calendar-week"></i> Planning de la semaine</div>
          <a href="#" class="link-all">Planification <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="card-body" style="padding:14px 20px">
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;text-align:center">
            ${weeklyPlanning
              .map(
                (day) => `
                  <div>
                    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;height:70px;justify-content:flex-end">
                      <div style="width:100%;background:${day.active ? "var(--brand)" : "var(--brand-light)"};border-radius:4px 4px 0 0;height:${day.height}"></div>
                    </div>
                    <div style="font-size:10px;color:${day.active ? "var(--brand)" : "var(--text-muted)"};font-weight:${day.active ? 600 : 400};margin-top:4px">${day.day}</div>
                    <div style="font-size:12px;font-weight:600;color:${day.active ? "var(--brand)" : "var(--text-primary)"}">${day.value}</div>
                  </div>
                `,
              )
              .join("")}
          </div>

          <div style="border-top:1px solid var(--border-light);padding-top:14px;display:flex;flex-direction:column;gap:10px">
            <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Prochaines interventions</div>

            ${upcomingWork
              .map(
                (item) => `
                  <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--body-bg);border-radius:var(--radius-md)">
                    <div style="width:4px;height:36px;background:${item.accent};border-radius:4px;flex-shrink:0"></div>
                    <div style="flex:1">
                      <div style="font-size:13px;font-weight:500">${item.title}</div>
                      <div style="font-size:11.5px;color:var(--text-muted)"><i class="fa-regular fa-clock"></i> ${item.meta}</div>
                    </div>
                    <span class="priority-tag ${item.priorityClass}">${item.priorityLabel}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeMenus() {
  [notifMenu, profileMenu].forEach((menu) => {
    if (!menu) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  });
  [notifBtn, profileBtn].forEach((button) => {
    if (!button) return;
    button.setAttribute("aria-expanded", "false");
  });
}

function renderNotifications() {
  const combinedNotifications = getCombinedNotifications();
  renderedNotifications = combinedNotifications;
  const count = combinedNotifications.filter(
    (notification) => !notification.read,
  ).length;

  if (notifCountEl) {
    notifCountEl.textContent = String(count);
    notifCountEl.style.display = count > 0 ? "inline-flex" : "none";
  }

  if (!notifListEl) return;

  if (!count) {
    notifListEl.innerHTML = `
      <div class="dropdown-empty">Aucune notification pour le moment.</div>
    `;
    return;
  }

  notifListEl.innerHTML = combinedNotifications
    .map(
      (notification, index) => `
        <div class="notif-item ${notification.type} ${notification.read ? "read" : "unread"}" data-notif-index="${index}">
          <i class="fa-solid ${notification.icon} notif-icon"></i>
          <div class="notif-content">
            <div class="notif-text">${notification.title}</div>
            <div class="notif-sub">${notification.subtitle}</div>
          </div>
          <div class="notif-time">${notification.time}</div>
        </div>
      `,
    )
    .join("");
}

function formatStockNumber(value) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatStockDateTime(date = new Date()) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const stockStorageKey = "maintflow.stockLedger";
const stockDefaultLocation = {
  warehouse: "Magasin central",
  aisle: "A4",
  shelf: "Étage 2",
  bin: "C-12",
};

function buildStockLocationLabel(location) {
  const parts = [
    location.warehouse,
    location.aisle,
    location.shelf,
    location.bin,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return parts.join(" / ");
}

function normalizeStockRecord(record) {
  const quantity = Number(record.currentQuantity ?? record.quantity ?? 0) || 0;
  const pmp = Number(record.pmp ?? record.unitPrice ?? 0) || 0;
  const stockRecord = {
    id: String(record.id || `stock-${record.articleId || Date.now()}`),
    articleId: String(record.articleId || ""),
    warehouse: String(record.warehouse || stockDefaultLocation.warehouse),
    aisle: String(record.aisle || stockDefaultLocation.aisle),
    shelf: String(record.shelf || stockDefaultLocation.shelf),
    bin: String(record.bin || stockDefaultLocation.bin),
    locationLabel: String(
      record.locationLabel ||
        buildStockLocationLabel({
          warehouse: record.warehouse || stockDefaultLocation.warehouse,
          aisle: record.aisle || stockDefaultLocation.aisle,
          shelf: record.shelf || stockDefaultLocation.shelf,
          bin: record.bin || stockDefaultLocation.bin,
        }),
    ),
    locationKey: String(
      record.locationKey ||
        buildStockLocationLabel({
          warehouse: record.warehouse || stockDefaultLocation.warehouse,
          aisle: record.aisle || stockDefaultLocation.aisle,
          shelf: record.shelf || stockDefaultLocation.shelf,
          bin: record.bin || stockDefaultLocation.bin,
        }),
    ),
    currentQuantity: quantity,
    pmp,
    minStock: Number(record.minStock ?? 15) || 0,
    maxStock: Number(record.maxStock ?? 120) || 0,
    safetyStock: Number(record.safetyStock ?? 20) || 0,
    replenishmentQty: Number(record.replenishmentQty ?? 40) || 0,
    observations: String(record.observations || ""),
    updatedAt: String(record.updatedAt || new Date().toISOString()),
  };

  return stockRecord;
}

function getDefaultStockRecords() {
  return getArticleRecords("articles").map((article, index) =>
    normalizeStockRecord({
      id: `stock-${article.id || index}`,
      articleId: article.id,
      currentQuantity: Number(article.quantity) || 0,
      pmp: Number(article.price) || 0,
      ...stockDefaultLocation,
      locationLabel: buildStockLocationLabel(stockDefaultLocation),
      locationKey: buildStockLocationLabel(stockDefaultLocation),
      minStock: 15,
      maxStock: 120,
      safetyStock: 20,
      replenishmentQty: 40,
      observations: "",
    }),
  );
}

function getStockDirectory() {
  const fallback = {
    records: getDefaultStockRecords(),
    movements: [],
  };

  try {
    const stored = window.localStorage.getItem(stockStorageKey);
    if (!stored) return fallback;

    const parsed = JSON.parse(stored);
    const storedRecords = Array.isArray(parsed.records)
      ? parsed.records.map(normalizeStockRecord)
      : [];
    const storedMovements = Array.isArray(parsed.movements)
      ? parsed.movements
      : [];
    const recordsByKey = new Map(
      storedRecords.map((record) => [
        `${record.articleId}__${record.locationKey}`,
        record,
      ]),
    );

    getArticleRecords("articles").forEach((article) => {
      const defaultRecord = normalizeStockRecord({
        id: `stock-${article.id}`,
        articleId: article.id,
        currentQuantity: Number(article.quantity) || 0,
        pmp: Number(article.price) || 0,
        ...stockDefaultLocation,
        locationLabel: buildStockLocationLabel(stockDefaultLocation),
        locationKey: buildStockLocationLabel(stockDefaultLocation),
        minStock: 15,
        maxStock: 120,
        safetyStock: 20,
        replenishmentQty: 40,
      });
      const key = `${defaultRecord.articleId}__${defaultRecord.locationKey}`;
      if (!recordsByKey.has(key)) {
        recordsByKey.set(key, defaultRecord);
      }
    });

    return {
      records: Array.from(recordsByKey.values()),
      movements: storedMovements,
    };
  } catch (error) {
    return fallback;
  }
}

function saveStockDirectory(directory) {
  try {
    window.localStorage.setItem(stockStorageKey, JSON.stringify(directory));
  } catch (error) {
    // ignore storage errors
  }
}

function getStockRecords() {
  return getStockDirectory().records;
}

function getStockRecordsForArticle(articleId) {
  return getStockRecords().filter((record) => record.articleId === articleId);
}

function getPrimaryStockRecord(articleId) {
  return getStockRecordsForArticle(articleId)[0] || null;
}

function getStockTotalsForArticle(articleId) {
  const records = getStockRecordsForArticle(articleId);
  const currentQuantity = records.reduce(
    (sum, record) => sum + (Number(record.currentQuantity) || 0),
    0,
  );
  const totalValue = records.reduce(
    (sum, record) =>
      sum + (Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0),
    0,
  );
  const pmp = currentQuantity > 0 ? totalValue / currentQuantity : 0;

  return {
    currentQuantity,
    totalValue,
    pmp,
    records,
  };
}

function syncStockArticleQuantityFromRecords(articleId) {
  const totals = getStockTotalsForArticle(articleId);
  syncArticleQuantity(articleId, totals.currentQuantity);
  return totals;
}

function getStockTotals() {
  const records = getStockRecords();
  const quantity = records.reduce(
    (sum, record) => sum + (Number(record.currentQuantity) || 0),
    0,
  );
  const value = records.reduce(
    (sum, record) =>
      sum + (Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0),
    0,
  );

  return { quantity, value };
}

function calculateStockPmp(
  currentQuantity,
  currentPmp,
  movementQuantity,
  unitPrice,
) {
  const quantityBefore = Number(currentQuantity) || 0;
  const pmpBefore = Number(currentPmp) || 0;
  const quantityIncoming = Number(movementQuantity) || 0;
  const priceIncoming = Number(unitPrice) || 0;
  const totalQuantity = quantityBefore + quantityIncoming;

  if (totalQuantity <= 0) return 0;

  const totalValue =
    quantityBefore * pmpBefore + quantityIncoming * priceIncoming;
  return totalValue / totalQuantity;
}

function syncArticleQuantity(articleId, quantity) {
  const directory = getArticleDirectory();
  directory.articles = directory.articles.map((article) =>
    article.id === articleId
      ? { ...article, quantity: String(Number(quantity) || 0) }
      : article,
  );
  saveArticleDirectory(directory);
}

function upsertStockRecord(articleId, locationData, patch = {}) {
  const directory = getStockDirectory();
  const locationKey =
    patch.locationKey ||
    buildStockLocationLabel(locationData || stockDefaultLocation);
  const locationLabel =
    patch.locationLabel ||
    buildStockLocationLabel(locationData || stockDefaultLocation);
  const existingIndex = directory.records.findIndex(
    (record) =>
      record.articleId === articleId && record.locationKey === locationKey,
  );
  const baseRecord =
    existingIndex >= 0
      ? directory.records[existingIndex]
      : normalizeStockRecord({
          articleId,
          ...stockDefaultLocation,
          locationLabel,
          locationKey,
        });
  const nextRecord = normalizeStockRecord({
    ...baseRecord,
    ...patch,
    articleId,
    locationLabel,
    locationKey,
  });

  if (existingIndex >= 0) {
    directory.records[existingIndex] = nextRecord;
  } else {
    directory.records.push(nextRecord);
  }

  saveStockDirectory(directory);
  return nextRecord;
}

function removeStockRecord(articleId, locationKey) {
  const directory = getStockDirectory();
  directory.records = directory.records.filter(
    (record) =>
      !(record.articleId === articleId && record.locationKey === locationKey),
  );
  saveStockDirectory(directory);
}

function appendStockMovement(movement) {
  const directory = getStockDirectory();
  directory.movements.unshift({
    id: movement.id || `mov-${Date.now()}`,
    ...movement,
    createdAt: movement.createdAt || new Date().toISOString(),
  });
  saveStockDirectory(directory);
}

function cancelStockMovement(movementId) {
  const directory = getStockDirectory();
  const movement = directory.movements.find((item) => item.id === movementId);
  if (!movement || movement.isReversal || movement.type === "inventory") {
    return false;
  }

  const articleId = movement.articleId;
  if (!articleId) return false;

  const quantity = Number(movement.quantity) || 0;
  if (quantity <= 0) return false;

  const recordsForArticle = getStockRecordsForArticle(articleId);
  const article = getArticleRecord("articles", articleId);
  const basePmp = Number(movement.pmp) || Number(article?.price) || 0;
  const movementLocation = String(movement.location || "").trim();

  if (movement.type === "entry") {
    const sourceRecord =
      recordsForArticle.find(
        (record) => record.locationLabel === movementLocation,
      ) ||
      recordsForArticle[0] ||
      null;
    if (
      !sourceRecord ||
      quantity > (Number(sourceRecord.currentQuantity) || 0)
    ) {
      window.alert(
        "Impossible d’annuler cette entrée: stock local insuffisant.",
      );
      return false;
    }

    const nextQuantity = (Number(sourceRecord.currentQuantity) || 0) - quantity;
    if (nextQuantity <= 0) {
      removeStockRecord(articleId, sourceRecord.locationKey);
    } else {
      upsertStockRecord(articleId, sourceRecord, {
        currentQuantity: nextQuantity,
        pmp: basePmp,
        locationLabel: sourceRecord.locationLabel,
        locationKey: sourceRecord.locationKey,
        updatedAt: new Date().toISOString(),
      });
    }

    syncStockArticleQuantityFromRecords(articleId);
  }

  if (movement.type === "exit") {
    const destinationLabel =
      movementLocation || buildStockLocationLabel(stockDefaultLocation);
    const targetRecord =
      recordsForArticle.find(
        (record) => record.locationLabel === destinationLabel,
      ) || null;

    if (targetRecord) {
      upsertStockRecord(articleId, targetRecord, {
        currentQuantity: (Number(targetRecord.currentQuantity) || 0) + quantity,
        pmp: basePmp,
        locationLabel: targetRecord.locationLabel,
        locationKey: targetRecord.locationKey,
        updatedAt: new Date().toISOString(),
      });
    } else {
      upsertStockRecord(articleId, stockDefaultLocation, {
        currentQuantity: quantity,
        pmp: basePmp,
        locationLabel: destinationLabel,
        locationKey: destinationLabel,
        updatedAt: new Date().toISOString(),
      });
    }

    syncStockArticleQuantityFromRecords(articleId);
  }

  if (movement.type === "transfer") {
    const sourceLabel = String(movement.destination || "").trim();
    const destinationLabel = String(movement.source || "").trim();
    const sourceRecord =
      recordsForArticle.find(
        (record) => record.locationLabel === sourceLabel,
      ) || null;

    if (sourceRecord) {
      const nextQuantity =
        (Number(sourceRecord.currentQuantity) || 0) - quantity;
      if (nextQuantity <= 0) {
        removeStockRecord(articleId, sourceRecord.locationKey);
      } else {
        upsertStockRecord(articleId, sourceRecord, {
          currentQuantity: nextQuantity,
          pmp: basePmp,
          locationLabel: sourceRecord.locationLabel,
          locationKey: sourceRecord.locationKey,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const destinationRecord =
      recordsForArticle.find(
        (record) => record.locationLabel === destinationLabel,
      ) || null;

    if (destinationRecord) {
      upsertStockRecord(articleId, destinationRecord, {
        currentQuantity:
          (Number(destinationRecord.currentQuantity) || 0) + quantity,
        pmp: basePmp,
        locationLabel: destinationRecord.locationLabel,
        locationKey: destinationRecord.locationKey,
        updatedAt: new Date().toISOString(),
      });
    } else {
      upsertStockRecord(articleId, stockDefaultLocation, {
        currentQuantity: quantity,
        pmp: basePmp,
        locationLabel:
          destinationLabel || buildStockLocationLabel(stockDefaultLocation),
        locationKey:
          destinationLabel || buildStockLocationLabel(stockDefaultLocation),
        updatedAt: new Date().toISOString(),
      });
    }

    syncStockArticleQuantityFromRecords(articleId);
  }

  appendStockMovement({
    type: movement.type,
    articleId,
    quantity,
    unitPrice: basePmp,
    linkedDocument: `ANNULATION ${movement.id}`,
    location:
      movement.location || movement.source || movement.destination || "",
    source: movement.source || "",
    destination: movement.destination || "",
    user: "Système",
    observations: `Annulation du mouvement ${movement.id}`,
    pmp: basePmp,
    resultingQuantity: getStockTotalsForArticle(articleId).currentQuantity,
    resultingValue: getStockTotalsForArticle(articleId).totalValue,
    isReversal: true,
    reversesMovementId: movement.id,
  });

  showStockToast("Mouvement annulé par mouvement inverse.");
  return true;
}

function getStockInventoryState() {
  const fallback = {
    status: "Ouvert",
    closedAt: "",
    inventoryId: "INV-001",
    openCount: 0,
    closedBy: "",
  };

  try {
    const stored = window.localStorage.getItem(stockInventoryStateStorageKey);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return {
      ...fallback,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch (error) {
    return fallback;
  }
}

function saveStockInventoryState(state) {
  try {
    window.localStorage.setItem(
      stockInventoryStateStorageKey,
      JSON.stringify(state),
    );
  } catch (error) {
    // ignore storage errors
  }
}

function closeStockInventory(form) {
  const rows = getInventoryRows(form);
  const inventoryId = String(
    form.querySelector("input[value='INV-001']")?.value || "INV-001",
  );
  const inventoryType = String(
    form.querySelector("select[name='inventoryType']")?.value || "",
  );
  const inventoryOwner = String(
    form.querySelector("select[name='inventoryOwner']")?.selectedOptions?.[0]
      ?.textContent || "",
  );
  const observations = String(
    form.querySelector("[data-stock-inventory-observations]")?.value || "",
  );
  const closedAt = new Date().toISOString();
  const affectedArticles = new Set();
  let openCount = 0;

  rows.forEach((row) => {
    const articleId = String(row.dataset.articleId || "");
    const locationLabel = String(row.dataset.locationLabel || "");
    const theoretical = Number(row.dataset.theoretical || 0) || 0;
    const counted =
      Number(row.querySelector("[data-stock-inventory-counted]")?.value || 0) ||
      0;
    const discrepancy = counted - theoretical;
    const article = getArticleRecord("articles", articleId);
    const existingRecord =
      getStockRecordsForArticle(articleId).find(
        (record) => record.locationLabel === locationLabel,
      ) ||
      getStockRecordsForArticle(articleId)[0] ||
      null;
    const pmp = Number(existingRecord?.pmp) || Number(article?.price) || 0;

    if (discrepancy !== 0) {
      openCount += 1;
    }

    if (articleId) {
      affectedArticles.add(articleId);
      upsertStockRecord(articleId, stockDefaultLocation, {
        currentQuantity: counted,
        pmp,
        locationLabel,
        locationKey: locationLabel,
        updatedAt: closedAt,
      });

      if (discrepancy > 0) {
        appendStockMovement({
          type: "entry",
          articleId,
          quantity: discrepancy,
          unitPrice: pmp,
          linkedDocument: inventoryId,
          user: inventoryOwner,
          observations: `Clôture inventaire positive · ${locationLabel}`,
          location: locationLabel,
          pmp,
          resultingQuantity: counted,
          resultingValue: counted * pmp,
          inventoryClosure: true,
          inventoryDirection: "positive",
        });
      }

      if (discrepancy < 0) {
        appendStockMovement({
          type: "exit",
          articleId,
          quantity: Math.abs(discrepancy),
          unitPrice: pmp,
          linkedDocument: inventoryId,
          user: inventoryOwner,
          observations: `Clôture inventaire négative · ${locationLabel}`,
          location: locationLabel,
          pmp,
          resultingQuantity: counted,
          resultingValue: counted * pmp,
          inventoryClosure: true,
          inventoryDirection: "negative",
        });
      }
    }
  });

  affectedArticles.forEach((articleId) => {
    syncStockArticleQuantityFromRecords(articleId);
  });

  saveStockInventoryState({
    status: "Clôturé",
    closedAt,
    inventoryId,
    openCount,
    closedBy: inventoryOwner,
    inventoryType,
    observations,
  });

  appendStockMovement({
    type: "inventory",
    articleId: "",
    quantity: rows.length,
    linkedDocument: inventoryId,
    observations: `Inventaire clôturé par ${inventoryOwner}`,
    user: inventoryOwner,
    inventoryStatus: "Clôturé",
    closedAt,
    openCount,
  });

  showStockToast(
    `Inventaire clôturé. ${openCount} écart(s) appliqué(s).`,
    openCount ? "warn" : "success",
  );
}

function getStockMovementTypeLabel(type) {
  if (type === "entry") return "Entrée";
  if (type === "exit") return "Sortie";
  if (type === "transfer") return "Transfert";
  if (type === "inventory") return "Inventaire";
  return "Mouvement";
}

function getStockMovementTypeBadge(type) {
  if (type === "entry") return "badge-success";
  if (type === "exit") return "badge-warning";
  if (type === "transfer") return "badge-info";
  if (type === "inventory") return "badge-gray";
  return "badge-gray";
}

function getStockAlertReadKeys() {
  try {
    const stored = window.localStorage.getItem(stockAlertReadStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (error) {
    return new Set();
  }
}

function saveStockAlertReadKeys(keys) {
  try {
    window.localStorage.setItem(
      stockAlertReadStorageKey,
      JSON.stringify(Array.from(keys)),
    );
  } catch (error) {
    // ignore storage errors
  }
}

function getStockAlerts() {
  const readKeys = getStockAlertReadKeys();

  return getStockRecords()
    .filter((record) => {
      const quantity = Number(record.currentQuantity) || 0;
      const safetyStock = Number(record.safetyStock) || 0;
      const minStock = Number(record.minStock) || 0;
      return quantity <= safetyStock || quantity <= minStock;
    })
    .map((record) => {
      const quantity = Number(record.currentQuantity) || 0;
      const safetyStock = Number(record.safetyStock) || 0;
      const minStock = Number(record.minStock) || 0;
      const article = getArticleRecord("articles", record.articleId);
      const key = `${record.articleId}__${record.locationKey}`;
      const isCritical = quantity <= safetyStock;

      return {
        id: key,
        source: "stock",
        sourceIndex: -1,
        title: isCritical
          ? `Stock critique — ${article ? article.name : "article"}`
          : `Stock faible — ${article ? article.name : "article"}`,
        subtitle: `${record.locationLabel || key} · ${quantity} restant(s) (min ${minStock}, sécurité ${safetyStock})`,
        time: formatStockDateTime(
          parseStockDateValue(record.updatedAt) || new Date(),
        ),
        type: isCritical ? "crit" : "warn",
        icon: isCritical ? "fa-triangle-exclamation" : "fa-box-open",
        read: readKeys.has(key),
      };
    });
}

function getCombinedNotifications() {
  const baseNotifications = notifications.map((notification, index) => ({
    ...notification,
    source: "base",
    sourceIndex: index,
    id: `base-${index}`,
  }));

  return [...baseNotifications, ...getStockAlerts()];
}

function parseStockDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStockHistoryRecords(filters = stockHistoryFilterState) {
  const directory = getStockDirectory();
  const fromDate = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const toDate = filters.to ? new Date(`${filters.to}T23:59:59`) : null;
  const normalizedLinked = String(filters.linkedDocument || "")
    .trim()
    .toLowerCase();

  return directory.movements.filter((movement) => {
    const article = movement.articleId
      ? getArticleRecord("articles", movement.articleId)
      : null;
    const createdAt = parseStockDateValue(movement.createdAt);
    const user = String(movement.user || "").toLowerCase();
    const linkedDocument = String(movement.linkedDocument || "").toLowerCase();
    const articleMatch =
      !filters.articleId || movement.articleId === filters.articleId;
    const typeMatch = !filters.type || movement.type === filters.type;
    const fromMatch = !fromDate || (createdAt ? createdAt >= fromDate : true);
    const toMatch = !toDate || (createdAt ? createdAt <= toDate : true);
    const userMatch =
      !filters.user || user.includes(String(filters.user).trim().toLowerCase());
    const linkedMatch =
      !normalizedLinked || linkedDocument.includes(normalizedLinked);

    return (
      articleMatch &&
      typeMatch &&
      fromMatch &&
      toMatch &&
      userMatch &&
      linkedMatch
    );
  });
}

function getInventoryRows(form) {
  return Array.from(form.querySelectorAll("[data-stock-inventory-row]"));
}

function refreshInventoryRow(row) {
  const theoretical = Number(row.dataset.theoretical || 0) || 0;
  const countedInput = row.querySelector("[data-stock-inventory-counted]");
  const discrepancyCell = row.querySelector(
    "[data-stock-inventory-discrepancy]",
  );
  const statusBadge = row.querySelector("[data-stock-inventory-status]");
  const observationsInput = row.querySelector(
    "[data-stock-inventory-observations]",
  );
  const counted = Number(countedInput?.value || 0) || 0;
  const discrepancy = counted - theoretical;

  if (discrepancyCell) {
    discrepancyCell.textContent =
      discrepancy > 0 ? `+${discrepancy}` : String(discrepancy);
    discrepancyCell.className =
      discrepancy === 0
        ? "muted"
        : discrepancy > 0
          ? "stock-discrepancy-positive"
          : "stock-discrepancy-negative";
  }

  if (statusBadge) {
    const status = discrepancy === 0 ? "Validé" : "À vérifier";
    statusBadge.textContent = status;
    statusBadge.className = `status-badge ${discrepancy === 0 ? "badge-success" : "badge-warning"}`;
  }

  if (
    observationsInput &&
    discrepancy !== 0 &&
    !observationsInput.value.trim()
  ) {
    observationsInput.placeholder = "Justifier l’écart...";
  }

  return discrepancy;
}

function refreshInventorySummary(form) {
  const rows = getInventoryRows(form);
  const discrepancies = rows.map((row) => refreshInventoryRow(row));
  const openCount = discrepancies.filter((value) => value !== 0).length;
  const positiveCount = discrepancies.filter((value) => value > 0).length;
  const negativeCount = discrepancies.filter((value) => value < 0).length;

  const summaryValueEls = form.querySelectorAll(
    "[data-stock-inventory-summary-value]",
  );
  if (summaryValueEls[0]) summaryValueEls[0].textContent = String(rows.length);
  if (summaryValueEls[1]) summaryValueEls[1].textContent = String(openCount);
  if (summaryValueEls[2])
    summaryValueEls[2].textContent = String(positiveCount);
  if (summaryValueEls[3])
    summaryValueEls[3].textContent = String(negativeCount);

  return { rows, openCount, positiveCount, negativeCount };
}

function showStockToast(message, kind = "success") {
  if (!overlayRootEl) return;

  const existing = overlayRootEl.querySelector(".stock-toast");
  if (existing) existing.remove();
  if (stockToastTimer) {
    clearTimeout(stockToastTimer);
    stockToastTimer = null;
  }

  const toast = document.createElement("div");
  toast.className = `stock-toast ${kind}`;
  toast.innerHTML = `
    <i class="fa-solid ${kind === "error" ? "fa-triangle-exclamation" : kind === "warn" ? "fa-circle-info" : "fa-circle-check"}"></i>
    <span>${message}</span>
  `;
  overlayRootEl.appendChild(toast);

  stockToastTimer = window.setTimeout(() => {
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 180);
  }, 2200);
}

function buildStockArticleOptions(selectedId = "") {
  const articles = getArticleRecords("articles");
  return [
    '<option value="">Sélectionner un article</option>',
    ...articles.map(
      (article) =>
        `<option value="${article.id}"${article.id === selectedId ? " selected" : ""}>${article.code} — ${article.name}</option>`,
    ),
  ].join("");
}

function buildStockResponsibleOptions(selectedName = "") {
  return [
    '<option value="">Sélectionner un responsable</option>',
    ...organizationUsers.map(
      (user) =>
        `<option value="${user.name}"${user.name === selectedName ? " selected" : ""}>${user.name} — ${user.role}</option>`,
    ),
  ].join("");
}

function buildStockLocationOptions(selectedValue = "") {
  const locations = [
    "Magasin central",
    "Magasin atelier",
    "Zone production",
    "Réserve sécurité",
  ];

  return [
    '<option value="">Sélectionner un magasin</option>',
    ...locations.map(
      (location) =>
        `<option value="${location}"${location === selectedValue ? " selected" : ""}>${location}</option>`,
    ),
  ].join("");
}

function buildStockTabs(activeSubpageKey) {
  return `
    <div class="org-tabs stock-tabs" role="tablist" aria-label="Sous-pages stock">
      ${Object.entries(stockSubpages.tabs)
        .map(
          ([key, tab]) => `
            <button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-stock-subpage="${key}">
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderStockPageActions(activeSubpageKey) {
  if (!pageActionsEl) return;

  const actionMap = {
    "fiche-stock": `
      <button class="btn btn-primary" type="button" data-stock-nav="mouvements">
        <i class="fa-solid fa-right-left"></i>
        <span>Nouveau mouvement</span>
      </button>
      <button class="btn btn-outline" type="button" data-stock-nav="inventaire">
        <i class="fa-solid fa-clipboard-check"></i>
        <span>Créer inventaire</span>
      </button>
    `,
    mouvements: `
      <button class="btn btn-primary" type="button" data-stock-nav="fiche-stock">
        <i class="fa-solid fa-box"></i>
        <span>Fiche stock</span>
      </button>
      <button class="btn btn-outline" type="button" data-stock-nav="historique">
        <i class="fa-regular fa-clock"></i>
        <span>Historique</span>
      </button>
    `,
    inventaire: `
      <button class="btn btn-primary" type="button" data-stock-nav="historique">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>Historique</span>
      </button>
      <button class="btn btn-outline" type="button" data-stock-nav="fiche-stock">
        <i class="fa-solid fa-box"></i>
        <span>Fiche stock</span>
      </button>
    `,
    historique: `
      <button class="btn btn-primary" type="button" data-stock-nav="fiche-stock">
        <i class="fa-solid fa-box"></i>
        <span>Retour fiche stock</span>
      </button>
      <button class="btn btn-outline" type="button" disabled>
        <i class="fa-solid fa-file-excel"></i>
        <span>Export Excel</span>
      </button>
      <button class="btn btn-outline" type="button" disabled>
        <i class="fa-solid fa-file-pdf"></i>
        <span>Export PDF</span>
      </button>
    `,
  };

  pageActionsEl.innerHTML =
    actionMap[activeSubpageKey] || actionMap[stockSubpages.defaultSubpage];
}

function renderStockSummaryCards() {
  const totals = getStockTotals();
  const articleCount = getArticleRecords("articles").length;

  return `
    <div class="stock-stat-grid">
      <div class="stock-stat-card">
        <span>Articles suivis</span>
        <strong>${articleCount}</strong>
        <small>références actives</small>
      </div>
      <div class="stock-stat-card">
        <span>Quantité totale</span>
        <strong>${formatStockNumber(totals.quantity)}</strong>
        <small>unités recensées</small>
      </div>
      <div class="stock-stat-card">
        <span>Valeur catalogue</span>
        <strong>${formatStockNumber(totals.value)} DH</strong>
        <small>valorisation estimée</small>
      </div>
    </div>
  `;
}

function buildStockMovementCard(title, icon, badgeLabel, bodyHtml) {
  return `
    <div class="card stock-card stock-movement-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid ${icon}"></i> ${title}</div>
        <span class="status-badge badge-info">${badgeLabel}</span>
      </div>
      <div class="card-body">${bodyHtml}</div>
    </div>
  `;
}

function buildStockFicheContent() {
  const primaryArticle = getArticleRecords("articles")[0] || null;
  const primaryStock = primaryArticle
    ? getPrimaryStockRecord(primaryArticle.id) ||
      normalizeStockRecord({
        articleId: primaryArticle.id,
        currentQuantity: Number(primaryArticle.quantity) || 0,
        pmp: Number(primaryArticle.price) || 0,
        ...stockDefaultLocation,
        locationLabel: buildStockLocationLabel(stockDefaultLocation),
        locationKey: buildStockLocationLabel(stockDefaultLocation),
      })
    : null;
  const location = primaryStock
    ? {
        warehouse: primaryStock.warehouse,
        aisle: primaryStock.aisle,
        shelf: primaryStock.shelf,
        bin: primaryStock.bin,
      }
    : stockDefaultLocation;
  const quantityValue = primaryStock ? primaryStock.currentQuantity : 0;
  const pmpValue = primaryStock ? primaryStock.pmp : 0;
  const totalValue = quantityValue * pmpValue;

  return `
    <div class="stock-layout">
      <div class="stock-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-box"></i> Fiche stock</div>
            <span class="status-badge badge-info">Référentiel de base</span>
          </div>
          <div class="card-body stock-card-body">
            ${renderStockSummaryCards()}
            <form class="org-form stock-form" data-stock-fiche-form>
              <div class="org-form-grid stock-form-grid">
                <div class="field-group field-group-wide">
                  <label>Article</label>
                  <select name="articleId" required data-stock-article-select>
                    ${buildStockArticleOptions(primaryArticle?.id || "")}
                  </select>
                  <div class="org-field-hint">Article lié obligatoire pour suivre la fiche stock.</div>
                </div>
                <div class="field-group">
                  <label>Quantité actuelle</label>
                  <input type="number" name="currentQuantity" value="${quantityValue}" min="0" step="1" data-stock-current-quantity />
                </div>
                <div class="field-group">
                  <label>Stock minimum</label>
                  <input type="number" name="minStock" value="${primaryStock ? primaryStock.minStock : 15}" min="0" step="1" required data-stock-min />
                </div>
                <div class="field-group">
                  <label>Stock maximum</label>
                  <input type="number" name="maxStock" value="${primaryStock ? primaryStock.maxStock : 120}" min="0" step="1" required data-stock-max />
                </div>
                <div class="field-group">
                  <label>Stock de sécurité</label>
                  <input type="number" name="securityStock" value="${primaryStock ? primaryStock.safetyStock : 20}" min="0" step="1" data-stock-safety />
                </div>
                <div class="field-group">
                  <label>Quantité de réapprovisionnement</label>
                  <input type="number" name="replenishmentQty" value="${primaryStock ? primaryStock.replenishmentQty : 40}" min="0" step="1" data-stock-replenishment />
                </div>
                <div class="field-group">
                  <label>PMP</label>
                  <input type="text" value="${formatStockNumber(pmpValue)} DH" disabled data-stock-pmp-display />
                </div>
                <div class="field-group">
                  <label>Valeur totale</label>
                  <input type="text" value="${formatStockNumber(totalValue)} DH" disabled data-stock-total-display />
                </div>
              </div>

              <div class="stock-form-section">
                <div class="stock-form-section-head">
                  <div>
                    <h3>Emplacement</h3>
                    <p>Structure physique de stockage et repérage.</p>
                  </div>
                </div>
                <div class="org-form-grid">
                  <div class="field-group">
                    <label>Magasin</label>
                    <select name="warehouse" data-stock-warehouse>
                      ${buildStockLocationOptions(location.warehouse)}
                    </select>
                  </div>
                  <div class="field-group">
                    <label>Allée</label>
                    <input type="text" name="aisle" value="${location.aisle}" data-stock-aisle />
                  </div>
                  <div class="field-group">
                    <label>Étagère</label>
                    <input type="text" name="shelf" value="${location.shelf}" data-stock-shelf />
                  </div>
                  <div class="field-group">
                    <label>Case</label>
                    <input type="text" name="bin" value="${location.bin}" data-stock-bin />
                  </div>
                </div>
              </div>

              <div class="field-group field-group-wide">
                <label>Observations</label>
                <textarea name="observations" rows="4" placeholder="Observations, contraintes ou informations de gestion..." data-stock-observations>${primaryStock ? primaryStock.observations : ""}</textarea>
              </div>
              <div class="stock-form-actions">
                <button class="btn btn-primary" type="submit" data-stock-save>
                  <i class="fa-solid fa-floppy-disk"></i>
                  <span>Enregistrer la fiche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="stock-side">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-triangle-exclamation"></i> Points de contrôle</div>
            <span class="status-badge badge-warning">Suivi actif</span>
          </div>
          <div class="card-body stock-side-body">
            <div class="stock-summary-grid">
              <div class="stock-summary-item">
                <span>Seuil d’alerte</span>
                <strong>18 unités</strong>
              </div>
              <div class="stock-summary-item">
                <span>Rupture estimée</span>
                <strong>4 jours</strong>
              </div>
              <div class="stock-summary-item">
                <span>Dernier mouvement</span>
                <strong>Sortie SOR-047</strong>
              </div>
              <div class="stock-summary-item">
                <span>Responsable</span>
                <strong>M. Ouali</strong>
              </div>
            </div>
            <div class="stock-note">
              La fiche stock consolide les paramètres de seuil, les emplacements et la valorisation PMP.
            </div>
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-layer-group"></i> Emplacements surveillés</div>
          </div>
          <div class="card-body">
            <div class="stock-location-list">
              <div class="stock-location-item"><span>Magasin central</span><strong>3 familles actives</strong></div>
              <div class="stock-location-item"><span>Atelier nord</span><strong>12 références</strong></div>
              <div class="stock-location-item"><span>Zone production</span><strong>5 références critiques</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildStockMovementsContent() {
  const primaryArticle = getArticleRecords("articles")[0] || null;
  const now = formatStockDateTime();

  return `
    <div class="stock-movements-grid">
      ${buildStockMovementCard(
        "Entrée de stock",
        "fa-arrow-down-short-wide",
        "ENT-001",
        `
          <form class="org-form stock-form" data-stock-movement-form="entry">
            <div class="org-form-grid">
              <div class="field-group">
                <label>Numéro</label>
                <input type="text" value="ENT-001" disabled />
              </div>
              <div class="field-group">
                <label>Date et heure</label>
                <input type="text" value="${now}" disabled />
              </div>
              <div class="field-group field-group-wide">
                <label>Article</label>
                <select name="entryArticle" required data-stock-movement-article>${buildStockArticleOptions(primaryArticle?.id || "")}</select>
              </div>
              <div class="field-group">
                <label>Quantité entrante</label>
                <input type="number" name="entryQty" min="1" step="1" required data-stock-entry-qty />
              </div>
              <div class="field-group">
                <label>Prix unitaire</label>
                <input type="number" name="entryPrice" min="0" step="0.01" placeholder="Pour recalcul du PMP" data-stock-entry-price />
              </div>
              <div class="field-group field-group-wide">
                <label>Type d'entrée</label>
                <select name="entryType" data-stock-entry-type>
                  <option>Réception commande</option>
                  <option>Retour chantier</option>
                  <option>Ajustement inventaire</option>
                </select>
              </div>
              <div class="field-group field-group-wide">
                <label>Emplacement destination</label>
                <input type="text" value="${buildStockLocationLabel(stockDefaultLocation)}" data-stock-entry-location />
              </div>
              <div class="field-group">
                <label>Effectué par</label>
                <input type="text" value="Utilisateur connecté" disabled data-stock-entry-user />
              </div>
              <div class="field-group field-group-wide">
                <label>Observations</label>
                <textarea rows="3" placeholder="Réception, contrôle qualité, référence du document source..." data-stock-entry-observations></textarea>
              </div>
            </div>
            <div class="stock-form-actions">
              <button class="btn btn-primary" type="submit" data-stock-submit="entry">
                <i class="fa-solid fa-check"></i>
                <span>Valider l’entrée</span>
              </button>
            </div>
          </form>
        `,
      )}

      ${buildStockMovementCard(
        "Sortie de stock",
        "fa-arrow-up-right-from-square",
        "SOR-001",
        `
          <form class="org-form stock-form" data-stock-movement-form="exit">
            <div class="org-form-grid">
              <div class="field-group">
                <label>Numéro</label>
                <input type="text" value="SOR-001" disabled />
              </div>
              <div class="field-group">
                <label>Date et heure</label>
                <input type="text" value="${now}" disabled />
              </div>
              <div class="field-group field-group-wide">
                <label>Article</label>
                <select name="exitArticle" required data-stock-movement-article>${buildStockArticleOptions(primaryArticle?.id || "")}</select>
              </div>
              <div class="field-group">
                <label>Quantité sortante</label>
                <input type="number" name="exitQty" min="1" step="1" required data-stock-exit-qty />
              </div>
              <div class="field-group field-group-wide">
                <label>Type de sortie</label>
                <select name="exitType" data-stock-exit-type>
                  <option>Consommation intervention</option>
                  <option>Mise au rebut</option>
                  <option>Ajustement inventaire</option>
                </select>
              </div>
              <div class="field-group field-group-wide">
                <label>Bon de travail / motif</label>
                <input type="text" placeholder="BT obligatoire pour consommation, motif pour rebut" data-stock-exit-linked />
              </div>
              <div class="field-group field-group-wide">
                <label>Emplacement source</label>
                <input type="text" value="${buildStockLocationLabel(stockDefaultLocation)}" data-stock-exit-location />
              </div>
              <div class="field-group">
                <label>Effectué par</label>
                <input type="text" value="Utilisateur connecté" disabled data-stock-exit-user />
              </div>
              <div class="field-group field-group-wide">
                <label>Observations</label>
                <textarea rows="3" placeholder="Informations complémentaires sur la sortie..." data-stock-exit-observations></textarea>
              </div>
            </div>
            <div class="stock-form-actions">
              <button class="btn btn-primary" type="submit" data-stock-submit="exit">
                <i class="fa-solid fa-check"></i>
                <span>Valider la sortie</span>
              </button>
            </div>
          </form>
        `,
      )}

      ${buildStockMovementCard(
        "Transfert",
        "fa-right-left",
        "TRF-001",
        `
          <form class="org-form stock-form" data-stock-movement-form="transfer">
            <div class="org-form-grid">
              <div class="field-group">
                <label>Numéro</label>
                <input type="text" value="TRF-001" disabled />
              </div>
              <div class="field-group">
                <label>Date et heure</label>
                <input type="text" value="${now}" disabled />
              </div>
              <div class="field-group field-group-wide">
                <label>Article</label>
                <select name="transferArticle" required data-stock-movement-article>${buildStockArticleOptions(primaryArticle?.id || "")}</select>
              </div>
              <div class="field-group">
                <label>Quantité</label>
                <input type="number" name="transferQty" min="1" step="1" required data-stock-transfer-qty />
              </div>
              <div class="field-group">
                <label>Emplacement source</label>
                <input type="text" value="${buildStockLocationLabel(stockDefaultLocation)}" required data-stock-transfer-source />
              </div>
              <div class="field-group">
                <label>Emplacement destination</label>
                <input type="text" value="Atelier nord / B2 / Étage 1 / D-03" required data-stock-transfer-destination />
              </div>
              <div class="field-group">
                <label>Effectué par</label>
                <input type="text" value="Utilisateur connecté" disabled data-stock-transfer-user />
              </div>
              <div class="field-group field-group-wide">
                <label>Observations</label>
                <textarea rows="3" placeholder="Motif du transfert, contrôle des écarts, réception..." data-stock-transfer-observations></textarea>
              </div>
            </div>
            <div class="stock-form-actions">
              <button class="btn btn-primary" type="submit" data-stock-submit="transfer">
                <i class="fa-solid fa-check"></i>
                <span>Valider le transfert</span>
              </button>
            </div>
          </form>
        `,
      )}
    </div>
  `;
}

function buildStockInventoryContent() {
  const now = formatStockDateTime();
  const inventoryState = getStockInventoryState();
  const isClosed = inventoryState.status === "Clôturé";
  const inventoryRows = [
    {
      articleId: getArticleRecords("articles")[0]?.id || "",
      article: "Huile minérale 5L",
      location: "Magasin central / A4",
      theoretical: 48,
      counted: 46,
      observations: "Deux bidons déplacés temporairement",
    },
    {
      articleId: getArticleRecords("articles")[1]?.id || "",
      article: "Roulement 6204",
      location: "Atelier nord / B2",
      theoretical: 40,
      counted: 40,
      observations: "Concordance parfaite",
    },
  ];

  return `
    <div class="stock-layout stock-inventory-layout">
      <div class="stock-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-clipboard-check"></i> Création inventaire</div>
            <span class="status-badge ${isClosed ? "badge-success" : "badge-info"}">${isClosed ? "Clôturé" : "Ouvert"}</span>
          </div>
          <div class="card-body">
            <form class="org-form stock-form" data-stock-inventory-form>
              <div class="org-form-grid">
                <div class="field-group">
                  <label>Numéro</label>
                  <input type="text" value="INV-001" disabled />
                </div>
                <div class="field-group">
                  <label>Date inventaire</label>
                  <input type="date" value="2026-05-29" required />
                </div>
                <div class="field-group field-group-wide">
                  <label>Type</label>
                  <select name="inventoryType">
                    <option>Général</option>
                    <option>Tournant</option>
                  </select>
                </div>
                <div class="field-group field-group-wide">
                  <label>Responsable inventaire</label>
                  <select name="inventoryOwner">${buildStockResponsibleOptions("Nadia Rami")}</select>
                </div>
                <div class="field-group field-group-wide">
                  <label>Périmètre</label>
                  <input type="text" placeholder="Famille ou emplacement si inventaire tournant" />
                </div>
                <div class="field-group field-group-wide">
                  <label>Observations</label>
                  <textarea rows="4" placeholder="Objectif, consignes, date limite de saisie terrain..." data-stock-inventory-observations></textarea>
                </div>
              </div>
              <div class="stock-form-section">
                <div class="stock-form-section-head">
                  <div>
                    <h3>Récapitulatif comptage</h3>
                    <p>Les écarts se recalculent automatiquement à la saisie terrain.</p>
                  </div>
                </div>
                <div class="stock-summary-grid">
                  <div class="stock-summary-item">
                    <span>Lignes comptées</span>
                    <strong data-stock-inventory-summary-value>0</strong>
                  </div>
                  <div class="stock-summary-item">
                    <span>Écarts ouverts</span>
                    <strong data-stock-inventory-summary-value>0</strong>
                  </div>
                  <div class="stock-summary-item">
                    <span>Écarts positifs</span>
                    <strong data-stock-inventory-summary-value>0</strong>
                  </div>
                  <div class="stock-summary-item">
                    <span>Écarts négatifs</span>
                    <strong data-stock-inventory-summary-value>0</strong>
                  </div>
                </div>
              </div>
              <div class="stock-form-actions">
                <button class="btn btn-primary" type="submit" data-stock-submit="inventory">
                  <i class="fa-solid fa-check"></i>
                  <span>${isClosed ? "Reclôturer" : "Clôturer l'inventaire"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-table-list"></i> Feuille de comptage</div>
            <span class="status-badge badge-warning">Saisie terrain</span>
          </div>
          <div class="card-body">
            <div class="table-wrap stock-count-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Emplacement</th>
                    <th>Théorique</th>
                    <th>Comptée</th>
                    <th>Écart</th>
                    <th>Statut</th>
                    <th>Observations</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventoryRows
                    .map((row) => {
                      const discrepancy = row.counted - row.theoretical;
                      const badgeClass =
                        discrepancy === 0 ? "badge-success" : "badge-warning";
                      const badgeLabel =
                        discrepancy === 0 ? "Validé" : "À vérifier";
                      const discrepancyLabel =
                        discrepancy > 0
                          ? `+${discrepancy}`
                          : String(discrepancy);
                      return `
                          <tr data-stock-inventory-row data-theoretical="${row.theoretical}" data-stock-article-id="${row.articleId}" data-stock-location-label="${escapeHtml(row.location)}">
                            <td>${row.article}</td>
                            <td>${row.location}</td>
                            <td>${row.theoretical}</td>
                            <td><input type="number" value="${row.counted}" class="stock-inline-input" data-stock-inventory-counted /></td>
                            <td class="${discrepancy === 0 ? "muted" : discrepancy > 0 ? "stock-discrepancy-positive" : "stock-discrepancy-negative"}" data-stock-inventory-discrepancy>${discrepancyLabel}</td>
                            <td><span class="status-badge ${badgeClass}" data-stock-inventory-status>${badgeLabel}</span></td>
                            <td><input type="text" value="${row.observations}" class="stock-inline-input stock-inline-text" data-stock-inventory-observations /></td>
                          </tr>
                        `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="stock-side">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-calculator"></i> Résultat inventaire</div>
          </div>
          <div class="card-body">
            <div class="stock-summary-grid">
              <div class="stock-summary-item">
                <span>Articles contrôlés</span>
                <strong>${inventoryRows.length}</strong>
              </div>
              <div class="stock-summary-item">
                <span>Écarts ouverts</span>
                <strong>${inventoryState.openCount || 0}</strong>
              </div>
              <div class="stock-summary-item">
                <span>Date de clôture</span>
                <strong>${inventoryState.closedAt ? formatStockDateTime(parseStockDateValue(inventoryState.closedAt) || new Date(inventoryState.closedAt)) : "En attente"}</strong>
              </div>
              <div class="stock-summary-item">
                <span>Statut</span>
                <strong>${isClosed ? "Clôturé" : "En cours"}</strong>
              </div>
            </div>
            <div class="stock-note">
              Les écarts sont calculés automatiquement puis appliqués au stock lors de la clôture.
            </div>
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-folder-tree"></i> Périmètres rapides</div>
          </div>
          <div class="card-body">
            <div class="stock-location-list">
              <div class="stock-location-item"><span>Famille Lubrifiants</span><strong>12 articles</strong></div>
              <div class="stock-location-item"><span>Emplacement A4</span><strong>34 articles</strong></div>
              <div class="stock-location-item"><span>Emplacement B2</span><strong>9 articles</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildStockHistoryContent() {
  const historyRows = getStockHistoryRecords(stockHistoryFilterState);
  const articleOptions = [
    '<option value="">Tous les articles</option>',
    ...getArticleRecords("articles").map(
      (article) =>
        `<option value="${article.id}"${stockHistoryFilterState.articleId === article.id ? " selected" : ""}>${article.code} — ${article.name}</option>`,
    ),
  ].join("");

  const userOptions = [
    '<option value="">Tous les utilisateurs</option>',
    ...organizationUsers.map(
      (user) =>
        `<option value="${user.name}"${stockHistoryFilterState.user === user.name ? " selected" : ""}>${user.name}</option>`,
    ),
  ].join("");

  return `
    <div class="stock-history-layout">
      <form class="card stock-card" data-stock-history-form>
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-filter"></i> Filtres de consultation</div>
          <span class="status-badge badge-gray">Lecture seule</span>
        </div>
        <div class="card-body">
          <div class="stock-filter-grid">
            <div class="field-group">
              <label>Par article</label>
              <select data-stock-history-filter="articleId">${articleOptions}</select>
            </div>
            <div class="field-group">
              <label>Par type de mouvement</label>
              <select data-stock-history-filter="type">
                <option value="">Tous les types</option>
                <option value="entry"${stockHistoryFilterState.type === "entry" ? " selected" : ""}>Entrée</option>
                <option value="exit"${stockHistoryFilterState.type === "exit" ? " selected" : ""}>Sortie</option>
                <option value="transfer"${stockHistoryFilterState.type === "transfer" ? " selected" : ""}>Transfert</option>
                <option value="inventory"${stockHistoryFilterState.type === "inventory" ? " selected" : ""}>Inventaire</option>
              </select>
            </div>
            <div class="field-group">
              <label>Date du</label>
              <input type="date" value="${stockHistoryFilterState.from}" data-stock-history-filter="from" />
            </div>
            <div class="field-group">
              <label>Au</label>
              <input type="date" value="${stockHistoryFilterState.to}" data-stock-history-filter="to" />
            </div>
            <div class="field-group">
              <label>Par utilisateur</label>
              <select data-stock-history-filter="user">${userOptions}</select>
            </div>
            <div class="field-group field-group-wide">
              <label>Par document lié</label>
              <input type="text" placeholder="BT / BC / inventaire..." data-stock-history-filter="linkedDocument" value="${escapeHtml(stockHistoryFilterState.linkedDocument || "")}" />
            </div>
          </div>
        </div>
      </form>

      <div class="card stock-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-list"></i> Tous les mouvements tracés</div>
          <div class="stock-history-actions">
            <button class="btn btn-outline" type="button" disabled><i class="fa-solid fa-file-excel"></i><span>Excel</span></button>
            <button class="btn btn-outline" type="button" disabled><i class="fa-solid fa-file-pdf"></i><span>PDF</span></button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Article</th>
                  <th>Type</th>
                  <th>Utilisateur</th>
                  <th>Date</th>
                  <th>Lien</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  historyRows.length
                    ? historyRows
                        .map((row) => {
                          const article = getArticleRecord(
                            "articles",
                            row.articleId,
                          );
                          const ref = `${getStockMovementTypeLabel(row.type).slice(0, 3).toUpperCase()}-${String(
                            String(row.id || "").slice(-3),
                          )}`;
                          return `
                          <tr>
                            <td>${ref}</td>
                            <td>${article ? `${article.code} — ${article.name}` : "Mouvement stock"}</td>
                            <td><span class="status-badge ${getStockMovementTypeBadge(row.type)}">${getStockMovementTypeLabel(row.type)}</span></td>
                            <td>${escapeHtml(row.user || "Utilisateur connecté")}</td>
                            <td>${formatStockDateTime(parseStockDateValue(row.createdAt) || new Date(row.createdAt))}</td>
                            <td class="muted">${escapeHtml(row.linkedDocument || row.destination || row.source || "—")}</td>
                            <td>
                              ${
                                row.type === "inventory" || row.isReversal
                                  ? `<span class="muted">—</span>`
                                  : `<button class="btn btn-outline stock-history-action" type="button" data-stock-cancel-id="${row.id}">Annuler</button>`
                              }
                            </td>
                          </tr>
                        `;
                        })
                        .join("")
                    : `
                    <tr>
                      <td colspan="7" class="muted">Aucun mouvement ne correspond aux filtres actuels.</td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachStockTabHandlers() {
  if (!pageContentEl) return;
  pageContentEl.querySelectorAll("[data-stock-subpage]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage =
        this.dataset.stockSubpage || stockSubpages.defaultSubpage;
      renderPage("stock", nextSubpage);
      window.location.hash = `stock/${nextSubpage}`;
    });
  });
}

function attachStockActionHandlers() {
  if (!pageActionsEl) return;
  pageActionsEl.querySelectorAll("[data-stock-nav]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.stockNav || stockSubpages.defaultSubpage;
      renderPage("stock", nextSubpage);
      window.location.hash = `stock/${nextSubpage}`;
    });
  });
}

function getStockArticleFromForm(form) {
  const articleId = String(
    form.querySelector("[data-stock-article-select]")?.value ||
      form.querySelector("select[name='articleId']")?.value ||
      "",
  );
  return articleId;
}

function getStockLocationFromForm(form, selectorPrefix = "") {
  const suffix = selectorPrefix ? `-${selectorPrefix}` : "";
  return {
    warehouse: String(
      form.querySelector(`[data-stock${suffix}-warehouse]`)?.value ||
        stockDefaultLocation.warehouse,
    ),
    aisle: String(
      form.querySelector(`[data-stock${suffix}-aisle]`)?.value ||
        stockDefaultLocation.aisle,
    ),
    shelf: String(
      form.querySelector(`[data-stock${suffix}-shelf]`)?.value ||
        stockDefaultLocation.shelf,
    ),
    bin: String(
      form.querySelector(`[data-stock${suffix}-bin]`)?.value ||
        stockDefaultLocation.bin,
    ),
  };
}

function getStockLocationLabelFromInput(form, selector) {
  return String(form.querySelector(selector)?.value || "").trim();
}

function updateStockSummaryCards() {
  if (!pageContentEl) return;
  const totals = getStockTotals();
  const cards = pageContentEl.querySelectorAll(".stock-stat-card strong");
  if (!cards.length) return;

  const articleCount = getArticleRecords("articles").length;
  if (cards[0]) cards[0].textContent = String(articleCount);
  if (cards[1]) cards[1].textContent = formatStockNumber(totals.quantity);
  if (cards[2]) cards[2].textContent = `${formatStockNumber(totals.value)} DH`;
}

function applyStockRecordToFicheForm(form, articleId) {
  const record =
    getPrimaryStockRecord(articleId) ||
    normalizeStockRecord({
      articleId,
      currentQuantity: 0,
      pmp: 0,
      ...stockDefaultLocation,
      locationLabel: buildStockLocationLabel(stockDefaultLocation),
      locationKey: buildStockLocationLabel(stockDefaultLocation),
    });

  const quantityInput = form.querySelector("[data-stock-current-quantity]");
  const minInput = form.querySelector("[data-stock-min]");
  const maxInput = form.querySelector("[data-stock-max]");
  const safetyInput = form.querySelector("[data-stock-safety]");
  const replenishmentInput = form.querySelector("[data-stock-replenishment]");
  const warehouseInput = form.querySelector("[data-stock-warehouse]");
  const aisleInput = form.querySelector("[data-stock-aisle]");
  const shelfInput = form.querySelector("[data-stock-shelf]");
  const binInput = form.querySelector("[data-stock-bin]");
  const observationsInput = form.querySelector("[data-stock-observations]");
  const pmpDisplay = form.querySelector("[data-stock-pmp-display]");
  const totalDisplay = form.querySelector("[data-stock-total-display]");

  if (quantityInput) quantityInput.value = String(record.currentQuantity || 0);
  if (minInput) minInput.value = String(record.minStock || 0);
  if (maxInput) maxInput.value = String(record.maxStock || 0);
  if (safetyInput) safetyInput.value = String(record.safetyStock || 0);
  if (replenishmentInput)
    replenishmentInput.value = String(record.replenishmentQty || 0);
  if (warehouseInput) warehouseInput.value = record.warehouse;
  if (aisleInput) aisleInput.value = record.aisle;
  if (shelfInput) shelfInput.value = record.shelf;
  if (binInput) binInput.value = record.bin;
  if (observationsInput) observationsInput.value = record.observations || "";
  if (pmpDisplay) pmpDisplay.value = `${formatStockNumber(record.pmp)} DH`;
  if (totalDisplay)
    totalDisplay.value = `${formatStockNumber(
      (Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0),
    )} DH`;
}

function saveStockFicheForm(form) {
  const articleId = getStockArticleFromForm(form);
  if (!articleId) return;

  const location = getStockLocationFromForm(form);
  const locationLabel = buildStockLocationLabel(location);
  const record = upsertStockRecord(articleId, location, {
    currentQuantity:
      Number(form.querySelector("[data-stock-current-quantity]")?.value) || 0,
    minStock: Number(form.querySelector("[data-stock-min]")?.value) || 0,
    maxStock: Number(form.querySelector("[data-stock-max]")?.value) || 0,
    safetyStock: Number(form.querySelector("[data-stock-safety]")?.value) || 0,
    replenishmentQty:
      Number(form.querySelector("[data-stock-replenishment]")?.value) || 0,
    observations: String(
      form.querySelector("[data-stock-observations]")?.value || "",
    ),
    locationLabel,
    locationKey: locationLabel,
    updatedAt: new Date().toISOString(),
  });

  syncArticleQuantity(articleId, record.currentQuantity);
  updateStockSummaryCards();

  const pmpDisplay = form.querySelector("[data-stock-pmp-display]");
  const totalDisplay = form.querySelector("[data-stock-total-display]");
  if (pmpDisplay) pmpDisplay.value = `${formatStockNumber(record.pmp)} DH`;
  if (totalDisplay)
    totalDisplay.value = `${formatStockNumber(
      (Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0),
    )} DH`;

  showStockToast(
    `Fiche stock enregistrée pour ${getArticleRecord("articles", articleId)?.name || "l'article"}.`,
  );
}

function updateStockFicheLive(form) {
  const currentQuantity =
    Number(form.querySelector("[data-stock-current-quantity]")?.value) || 0;
  const pmp =
    parseFloat(form.querySelector("[data-stock-pmp-display]")?.value || "0") ||
    0;
  const totalDisplay = form.querySelector("[data-stock-total-display]");
  if (totalDisplay) {
    totalDisplay.value = `${formatStockNumber(currentQuantity * pmp)} DH`;
  }
}

function setStockPmpAndTotal(form, pmp, quantity) {
  const pmpDisplay = form.querySelector("[data-stock-pmp-display]");
  const totalDisplay = form.querySelector("[data-stock-total-display]");
  if (pmpDisplay) pmpDisplay.value = `${formatStockNumber(pmp)} DH`;
  if (totalDisplay)
    totalDisplay.value = `${formatStockNumber((Number(quantity) || 0) * (Number(pmp) || 0))} DH`;
}

function updateAllStockRecordsForArticle(articleId, patch) {
  const directory = getStockDirectory();
  directory.records = directory.records.map((record) =>
    record.articleId === articleId
      ? normalizeStockRecord({ ...record, ...patch, articleId })
      : record,
  );
  saveStockDirectory(directory);
}

function applyStockMovement(type, form) {
  const articleId = getStockArticleFromForm(form);
  if (!articleId) return;

  const directory = getStockDirectory();
  const recordsForArticle = directory.records.filter(
    (record) => record.articleId === articleId,
  );
  const aggregate = getStockTotalsForArticle(articleId);

  if (type === "entry") {
    const quantity =
      Number(form.querySelector("[data-stock-entry-qty]")?.value) || 0;
    const unitPrice =
      Number(form.querySelector("[data-stock-entry-price]")?.value) || 0;
    if (quantity <= 0) return;

    const destination = getStockLocationLabelFromInput(
      form,
      "[data-stock-entry-location]",
    );
    const nextPmp = calculateStockPmp(
      aggregate.currentQuantity,
      aggregate.pmp,
      quantity,
      unitPrice,
    );
    upsertStockRecord(articleId, stockDefaultLocation, {
      currentQuantity:
        (Number(
          recordsForArticle.find(
            (record) => record.locationLabel === destination,
          )?.currentQuantity,
        ) || 0) + quantity,
      pmp: nextPmp,
      locationLabel:
        destination || buildStockLocationLabel(stockDefaultLocation),
      locationKey: destination || buildStockLocationLabel(stockDefaultLocation),
      updatedAt: new Date().toISOString(),
    });

    updateAllStockRecordsForArticle(articleId, { pmp: nextPmp });
    syncArticleQuantity(articleId, aggregate.currentQuantity + quantity);
    appendStockMovement({
      type: "entry",
      articleId,
      quantity,
      unitPrice,
      linkedDocument: String(
        form.querySelector("[data-stock-entry-type]")?.value || "",
      ),
      location: destination,
      user: String(form.querySelector("[data-stock-entry-user]")?.value || ""),
      observations: String(
        form.querySelector("[data-stock-entry-observations]")?.value || "",
      ),
      pmp: nextPmp,
      resultingQuantity: aggregate.currentQuantity + quantity,
      resultingValue: (aggregate.currentQuantity + quantity) * nextPmp,
    });

    showStockToast(
      `Entrée enregistrée et PMP recalculé à ${formatStockNumber(nextPmp)} DH.`,
    );

    return;
  }

  if (type === "exit") {
    const quantity =
      Number(form.querySelector("[data-stock-exit-qty]")?.value) || 0;
    if (quantity <= 0) return;

    const source = getStockLocationLabelFromInput(
      form,
      "[data-stock-exit-location]",
    );
    const sourceRecord =
      recordsForArticle.find((record) => record.locationLabel === source) ||
      recordsForArticle[0] ||
      null;
    if (!sourceRecord) return;
    if (quantity > (Number(sourceRecord.currentQuantity) || 0)) {
      window.alert(
        "La quantité sortante dépasse le stock disponible sur cet emplacement.",
      );
      return;
    }

    const nextQuantity = (Number(sourceRecord.currentQuantity) || 0) - quantity;
    if (nextQuantity <= 0) {
      removeStockRecord(articleId, sourceRecord.locationKey);
    } else {
      upsertStockRecord(articleId, sourceRecord, {
        currentQuantity: nextQuantity,
        pmp: aggregate.pmp,
        locationLabel: sourceRecord.locationLabel,
        locationKey: sourceRecord.locationKey,
        observations: sourceRecord.observations,
        updatedAt: new Date().toISOString(),
      });
    }

    syncArticleQuantity(articleId, aggregate.currentQuantity - quantity);
    appendStockMovement({
      type: "exit",
      articleId,
      quantity,
      linkedDocument: String(
        form.querySelector("[data-stock-exit-linked]")?.value || "",
      ),
      location: source,
      user: String(form.querySelector("[data-stock-exit-user]")?.value || ""),
      observations: String(
        form.querySelector("[data-stock-exit-observations]")?.value || "",
      ),
      pmp: aggregate.pmp,
      resultingQuantity: aggregate.currentQuantity - quantity,
      resultingValue: (aggregate.currentQuantity - quantity) * aggregate.pmp,
    });

    showStockToast(
      `Sortie enregistrée. Stock mis à jour pour ${getArticleRecord("articles", articleId)?.name || "l'article"}.`,
    );

    return;
  }

  if (type === "transfer") {
    const quantity =
      Number(form.querySelector("[data-stock-transfer-qty]")?.value) || 0;
    if (quantity <= 0) return;

    const source = getStockLocationLabelFromInput(
      form,
      "[data-stock-transfer-source]",
    );
    const destination = getStockLocationLabelFromInput(
      form,
      "[data-stock-transfer-destination]",
    );
    const sourceRecord =
      recordsForArticle.find((record) => record.locationLabel === source) ||
      recordsForArticle[0] ||
      null;
    if (!sourceRecord) return;
    if (quantity > (Number(sourceRecord.currentQuantity) || 0)) {
      window.alert(
        "La quantité transférée dépasse le stock disponible sur cet emplacement.",
      );
      return;
    }

    const sourceNextQuantity =
      (Number(sourceRecord.currentQuantity) || 0) - quantity;
    if (sourceNextQuantity <= 0) {
      removeStockRecord(articleId, sourceRecord.locationKey);
    } else {
      upsertStockRecord(articleId, sourceRecord, {
        currentQuantity: sourceNextQuantity,
        pmp: aggregate.pmp,
        locationLabel: sourceRecord.locationLabel,
        locationKey: sourceRecord.locationKey,
        observations: sourceRecord.observations,
        updatedAt: new Date().toISOString(),
      });
    }

    const destinationRecord =
      recordsForArticle.find(
        (record) => record.locationLabel === destination,
      ) || null;
    if (destinationRecord) {
      upsertStockRecord(
        articleId,
        {
          warehouse: destinationRecord.warehouse,
          aisle: destinationRecord.aisle,
          shelf: destinationRecord.shelf,
          bin: destinationRecord.bin,
        },
        {
          currentQuantity:
            (Number(destinationRecord.currentQuantity) || 0) + quantity,
          pmp: aggregate.pmp,
          locationLabel: destinationRecord.locationLabel,
          locationKey: destinationRecord.locationKey,
          observations: destinationRecord.observations,
          updatedAt: new Date().toISOString(),
        },
      );
    } else {
      upsertStockRecord(articleId, stockDefaultLocation, {
        currentQuantity: quantity,
        pmp: aggregate.pmp,
        locationLabel:
          destination || buildStockLocationLabel(stockDefaultLocation),
        locationKey:
          destination || buildStockLocationLabel(stockDefaultLocation),
        updatedAt: new Date().toISOString(),
      });
    }

    appendStockMovement({
      type: "transfer",
      articleId,
      quantity,
      source,
      destination,
      user: String(
        form.querySelector("[data-stock-transfer-user]")?.value || "",
      ),
      observations: String(
        form.querySelector("[data-stock-transfer-observations]")?.value || "",
      ),
      pmp: aggregate.pmp,
      resultingQuantity: aggregate.currentQuantity,
      resultingValue: aggregate.currentQuantity * aggregate.pmp,
    });

    syncArticleQuantity(articleId, aggregate.currentQuantity);
    showStockToast(
      `Transfert enregistré pour ${getArticleRecord("articles", articleId)?.name || "l'article"}.`,
    );
  }
}

function attachStockLifecycleHandlers(activeSubpageKey) {
  if (!pageContentEl) return;

  const ficheForm = pageContentEl.querySelector("[data-stock-fiche-form]");
  if (ficheForm) {
    const articleSelect = ficheForm.querySelector(
      "[data-stock-article-select]",
    );
    if (articleSelect) {
      articleSelect.addEventListener("change", function () {
        applyStockRecordToFicheForm(ficheForm, this.value);
        updateStockSummaryCards();
      });
    }

    ficheForm.addEventListener("input", function (event) {
      const target = event.target;
      if (!target || !target.closest("[data-stock-fiche-form]")) return;
      updateStockFicheLive(ficheForm);
    });

    ficheForm.addEventListener("change", function () {
      updateStockFicheLive(ficheForm);
      saveStockFicheForm(ficheForm);
      updateStockSummaryCards();
    });

    ficheForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveStockFicheForm(ficheForm);
      updateStockSummaryCards();
    });
  }

  const inventoryForm = pageContentEl.querySelector(
    "[data-stock-inventory-form]",
  );
  if (inventoryForm) {
    refreshInventorySummary(inventoryForm);

    inventoryForm.addEventListener("input", function (event) {
      const target = event.target;
      if (!target || !target.closest("[data-stock-inventory-row]")) return;
      refreshInventorySummary(inventoryForm);
    });

    inventoryForm.addEventListener("submit", function (event) {
      event.preventDefault();
      refreshInventorySummary(inventoryForm);
      closeStockInventory(inventoryForm);
      renderStockPage(activeSubpageKey);
    });
  }

  const historyForm = pageContentEl.querySelector("[data-stock-history-form]");
  if (historyForm) {
    historyForm
      .querySelectorAll("[data-stock-history-filter]")
      .forEach((control) => {
        control.addEventListener("input", function () {
          stockHistoryFilterState = {
            articleId: String(
              historyForm.querySelector(
                "[data-stock-history-filter='articleId']",
              )?.value || "",
            ),
            type: String(
              historyForm.querySelector("[data-stock-history-filter='type']")
                ?.value || "",
            ),
            from: String(
              historyForm.querySelector("[data-stock-history-filter='from']")
                ?.value || "",
            ),
            to: String(
              historyForm.querySelector("[data-stock-history-filter='to']")
                ?.value || "",
            ),
            user: String(
              historyForm.querySelector("[data-stock-history-filter='user']")
                ?.value || "",
            ),
            linkedDocument: String(
              historyForm.querySelector(
                "[data-stock-history-filter='linkedDocument']",
              )?.value || "",
            ),
          };
          renderStockPage(activeSubpageKey);
        });
        control.addEventListener("change", function () {
          control.dispatchEvent(new Event("input", { bubbles: true }));
        });
      });
  }

  pageContentEl.querySelectorAll("[data-stock-cancel-id]").forEach((button) => {
    button.addEventListener("click", function () {
      const movementId = String(this.dataset.stockCancelId || "");
      if (!movementId) return;
      const movement = getStockDirectory().movements.find(
        (item) => item.id === movementId,
      );
      if (!movement) return;

      const confirmed = window.confirm(
        `Annuler ${getStockMovementTypeLabel(movement.type)} ${movementId} par mouvement inverse ?`,
      );
      if (!confirmed) return;

      const success = cancelStockMovement(movementId);
      if (!success) return;
      renderStockPage(activeSubpageKey);
    });
  });

  updateStockSummaryCards();
}

function renderStockPage(subpageKey) {
  const activeSubpageKey = stockSubpages.tabs[subpageKey]
    ? subpageKey
    : stockSubpages.defaultSubpage;
  const activeSubpage = stockSubpages.tabs[activeSubpageKey];

  if (pageTitleEl) pageTitleEl.textContent = "Stock";
  if (pageSubtitleEl) pageSubtitleEl.textContent = activeSubpage.body;

  renderStockPageActions(activeSubpageKey);

  if (!pageContentEl) return;

  pageContentEl.className = "organization-page stock-page";
  pageContentEl.innerHTML = `
    <section class="stock-hero card">
      <div class="card-body stock-hero-body">
        <div>
          <div class="org-section-kicker">Ressources</div>
          <h2>${activeSubpage.title}</h2>
          <p>${activeSubpage.body}</p>
        </div>
        <div class="stock-hero-badges">
          <span class="status-badge badge-success">Traçabilité active</span>
          <span class="status-badge badge-info">PMP calculé</span>
          <span class="status-badge badge-warning">Inventaire prêt</span>
        </div>
      </div>
    </section>

    ${buildStockTabs(activeSubpageKey)}

    ${
      activeSubpageKey === "fiche-stock"
        ? buildStockFicheContent()
        : activeSubpageKey === "mouvements"
          ? buildStockMovementsContent()
          : activeSubpageKey === "inventaire"
            ? buildStockInventoryContent()
            : buildStockHistoryContent()
    }
  `;

  attachStockTabHandlers();
  attachStockActionHandlers();
  attachStockLifecycleHandlers(activeSubpageKey);
}

function markNotificationAsRead(index) {
  const notification = renderedNotifications[index];
  if (!notification || notification.read) return;

  if (notification.source === "stock") {
    const keys = getStockAlertReadKeys();
    keys.add(notification.id);
    saveStockAlertReadKeys(keys);
  } else if (notification.sourceIndex >= 0) {
    notifications[notification.sourceIndex].read = true;
  }

  renderNotifications();
}

function renderPage(pageKey, subpageKey) {
  if (pageKey.includes("/")) {
    const routeParts = pageKey.split("/");
    pageKey = routeParts[0];
    subpageKey = routeParts[1] || subpageKey;
  }

  const page = pages[pageKey] || pages.dashboard;
  const defaultSubpage =
    pageKey === "organisation"
      ? "entreprise"
      : sectionSubpages[pageKey]
        ? sectionSubpages[pageKey].defaultSubpage
        : "";
  const activeSubpageKey = subpageKey || defaultSubpage;
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageKey);
  });

  if (pageTitleEl) pageTitleEl.textContent = page.title;
  if (pageSubtitleEl) pageSubtitleEl.textContent = page.subtitle;

  if (pageContentEl) {
    if (pageKey === "dashboard") {
      renderDashboardPage();
    } else if (pageKey === "arborescence") {
      renderArborescencePage();
    } else if (pageKey === "organisation") {
      renderOrganizationPage(activeSubpageKey);
    } else if (pageKey === "equipements") {
      renderEquipmentPage(activeSubpageKey);
    } else if (pageKey === "organe") {
      renderOrganePage(activeSubpageKey);
    } else if (pageKey === "articles") {
      renderArticlePage(activeSubpageKey);
    } else if (pageKey === "stock") {
      renderStockPage(activeSubpageKey);
    } else if (sectionSubpages[pageKey]) {
      renderSectionSubpages(pageKey, activeSubpageKey);
    } else {
      if (pageActionsEl) {
        pageActionsEl.innerHTML = "";
      }
      pageContentEl.className = "blank-page";
      pageContentEl.innerHTML = `
        <div class="blank-card">
          <div class="blank-badge"><i class="fa-regular fa-file-lines"></i></div>
          <h2>${page.title}</h2>
          <p>${page.body}</p>
          <span class="blank-note">On développera cette page étape par étape.</span>
        </div>
      `;
    }
  }

  if (
    overlayRootEl &&
    pageKey !== "organisation" &&
    pageKey !== "equipements" &&
    pageKey !== "organe"
  ) {
    overlayRootEl.innerHTML = "";
  }

  closeMenus();
}

navItems.forEach((item) => {
  item.addEventListener("click", function (event) {
    event.preventDefault();
    renderPage(this.dataset.page || "dashboard");
    window.location.hash = this.dataset.page || "dashboard";
  });
});

function toggleMenu(button, menu) {
  const isOpen = menu.classList.contains("open");
  closeMenus();
  if (!isOpen) {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
  }
}

let __arboContextMenu = null;

function hideArboContextMenu() {
  if (__arboContextMenu) {
    __arboContextMenu.remove();
    __arboContextMenu = null;
  }
}

function clearArboContextOverlay() {
  if (overlayRootEl) {
    overlayRootEl.innerHTML = "";
  }
}

function bindArboContextModalClose(selector, onClose) {
  const modal = overlayRootEl
    ? overlayRootEl.querySelector(".org-modal")
    : null;
  if (!modal) return;

  modal.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      onClose();
    });
  });
}

function openArboOrganizationDetails(record, title, subtitle, bodyHtml) {
  if (!record) return;

  organizationModalState = {
    pageKey: "arborescence",
    mode: "details",
    recordId: record.id,
  };

  renderOrganizationModal(title, subtitle, bodyHtml);
  bindArboContextModalClose("[data-org-close]", function () {
    organizationModalState = null;
    clearArboContextOverlay();
  });
}

function openArboEquipmentDetails(record, title, subtitle, bodyHtml) {
  if (!record) return;

  equipmentModalState = {
    pageKey: "arborescence",
    mode: "details",
    recordId: record.id,
  };

  renderEquipmentModal(title, subtitle, bodyHtml);
  bindArboContextModalClose("[data-org-close]", function () {
    equipmentModalState = null;
    clearArboContextOverlay();
  });
}

function openArboOrganeDetails(record, title, subtitle, bodyHtml) {
  if (!record) return;

  organeModalState = {
    pageKey: "arborescence",
    mode: "details",
    recordId: record.id,
  };

  renderOrganeModal(title, subtitle, bodyHtml);
  bindArboContextModalClose("[data-org-close]", function () {
    organeModalState = null;
    clearArboContextOverlay();
  });
}

function openArboArticleDetails(record, title, subtitle, bodyHtml) {
  if (!record) return;

  articleModalState = {
    pageKey: "arborescence",
    mode: "details",
    recordId: record.id,
  };

  renderArticleModal(title, subtitle, bodyHtml);
  bindArboContextModalClose("[data-art-close]", function () {
    articleModalState = null;
    clearArboContextOverlay();
  });
}

function showArboContextMenu(x, y, arboId) {
  hideArboContextMenu();

  const menu = document.createElement("div");
  menu.className = "arbo-context-menu";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "arbo-context-item";
  btn.innerHTML = `<i class="fa-regular fa-eye"></i> Voir détails`;

  btn.addEventListener("click", function (ev) {
    ev.stopPropagation();
    hideArboContextMenu();

    if (!arboId) return;

    if (arboId.startsWith("arbo-unit-")) {
      const record = getOrganizationRecord(
        "unites",
        arboId.replace("arbo-unit-", ""),
      );
      openArboOrganizationDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de l’unité",
        "Toutes les informations de l’unité sélectionnée.",
        record ? buildUnitsDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-division-")) {
      const idParts = arboId.replace("arbo-division-", "").split("__");
      const divisionId = idParts[1] || "";
      const record = getOrganizationRecord("divisions", divisionId);
      openArboOrganizationDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de la division",
        "Toutes les informations de la division sélectionnée.",
        record ? buildDivisionsDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-department-")) {
      const idParts = arboId.replace("arbo-department-", "").split("__");
      const departmentId = idParts[1] || "";
      const record = getOrganizationRecord("departmentServices", departmentId);
      openArboOrganizationDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails du département",
        "Toutes les informations du département sélectionné.",
        record ? buildDepartmentServicesDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-equipment-group-")) {
      const record = getEquipmentRecord(
        "groups",
        arboId.replace("arbo-equipment-group-", ""),
      );
      openArboEquipmentDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails du groupe équipement",
        "Toutes les informations du groupe équipement sélectionné.",
        record ? buildEquipmentGroupDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-equipment-family-")) {
      const record = getEquipmentRecord(
        "families",
        arboId.replace("arbo-equipment-family-", ""),
      );
      openArboEquipmentDetails(
        record,
        record
          ? `Détails de ${record.name}`
          : "Détails de la famille équipement",
        "Toutes les informations de la famille équipement sélectionnée.",
        record ? buildEquipmentFamilyDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-equipment-")) {
      const record = getEquipmentRecord(
        "equipments",
        arboId.replace("arbo-equipment-", ""),
      );
      openArboEquipmentDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de l’équipement",
        "Toutes les informations de l’équipement sélectionné.",
        record ? buildEquipmentDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-organe-group-")) {
      const record = getOrganeRecord(
        "groups",
        arboId.replace("arbo-organe-group-", ""),
      );
      openArboOrganeDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails du groupe organe",
        "Toutes les informations du groupe organe sélectionné.",
        record ? buildOrganeGroupDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-organe-family-")) {
      const record = getOrganeRecord(
        "families",
        arboId.replace("arbo-organe-family-", ""),
      );
      openArboOrganeDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de la famille organe",
        "Toutes les informations de la famille organe sélectionnée.",
        record ? buildOrganeFamilyDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-organe-")) {
      const record = getOrganeRecord(
        "organes",
        arboId.replace("arbo-organe-", ""),
      );
      openArboOrganeDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de l’organe",
        "Toutes les informations de l’organe sélectionné.",
        record ? buildOrganeDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-article-group-")) {
      const record = getArticleRecord(
        "groups",
        arboId.replace("arbo-article-group-", ""),
      );
      openArboArticleDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails du groupe article",
        "Toutes les informations du groupe article sélectionné.",
        record ? buildArticleGroupDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-article-family-")) {
      const record = getArticleRecord(
        "families",
        arboId.replace("arbo-article-family-", ""),
      );
      openArboArticleDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de la famille article",
        "Toutes les informations de la famille article sélectionnée.",
        record ? buildArticleFamilyDetailsContent(record) : "",
      );
      return;
    }

    if (arboId.startsWith("arbo-article-")) {
      const record = getArticleRecord(
        "articles",
        arboId.replace("arbo-article-", ""),
      );
      openArboArticleDetails(
        record,
        record ? `Détails de ${record.name}` : "Détails de l’article",
        "Toutes les informations de l’article sélectionné.",
        record ? buildArticleDetailsContent(record) : "",
      );
      return;
    }
  });

  menu.appendChild(btn);
  document.body.appendChild(menu);
  __arboContextMenu = menu;

  // close on next click or Esc
  setTimeout(() => {
    const onDocClick = () => hideArboContextMenu();
    const onKey = (e) => {
      if (e.key === "Escape") hideArboContextMenu();
    };
    document.addEventListener("click", onDocClick, { once: true });
    document.addEventListener("keydown", onKey, { once: true });
  }, 0);
}

notifBtn.addEventListener("click", function (event) {
  event.stopPropagation();
  toggleMenu(notifBtn, notifMenu);
});

if (notifListEl) {
  notifListEl.addEventListener("click", function (event) {
    const item = event.target.closest(".notif-item");
    if (!item) return;

    const index = Number(item.dataset.notifIndex);
    if (Number.isNaN(index)) return;

    markNotificationAsRead(index);
  });
}

profileBtn.addEventListener("click", function (event) {
  event.stopPropagation();
  toggleMenu(profileBtn, profileMenu);
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", function () {
    const action = this.dataset.action;
    const route =
      action === "settings"
        ? "parametres"
        : action === "logout"
          ? "deconnexion"
          : "profil";
    renderPage(route);
    window.location.hash = route;
  });
});

document.addEventListener("click", function (event) {
  const target = event.target;
  if (!target.closest(".dropdown-wrap")) {
    closeMenus();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenus();
  }
});

function bootstrapRoute() {
  const hash = window.location.hash.replace("#", "").trim();
  const routeParts = hash.split("/").filter(Boolean);
  const route = pages[routeParts[0]] ? routeParts[0] : "dashboard";
  const subpage = routeParts[1];
  renderPage(route, subpage);
}

window.addEventListener("hashchange", bootstrapRoute);

// Sidebar toggle — collapsed par défaut
const sidebar = document.getElementById("sidebar");
const arrowIcon = document.getElementById("arrowIcon");

document.getElementById("sidebarToggle").addEventListener("click", function () {
  sidebar.classList.toggle("expanded");
});

bootstrapRoute();
renderNotifications();
