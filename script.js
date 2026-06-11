const StorageManager = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Erreur lecture ${key}`, error);
      return defaultValue;
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Erreur écriture ${key}`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },
};

let administrationLocaleCache = "fr-FR";

function updateClock() {
  const now = new Date();
  const dateStr = now.toLocaleDateString(administrationLocaleCache, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString(administrationLocaleCache, {
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
const stockInventoriesStorageKey = "maintflow.stockInventories";
const stockSelectedInventoryStorageKey = "maintflow.stockSelectedInventory";
const planificationStorageKey = "maintflow.planificationState";
const connectedUserStorageKey = "maintflow.connectedUserId";

let renderedNotifications = [];
let organizationModalState = null;
const notifications = [];

const organizationStorageKey = "maintflow.organizationDirectory";
const organizationUsers = [];
const organizationDefaults = {
  unites: [],
  divisions: [],
  departmentServices: [],
};

const pages = {
  dashboard: {
    title: "Tableau de bord",
    subtitle: "Vue globale de la maintenance",
  },
  arborescence: {
    title: "Arborescence",
    subtitle: "Structure des actifs et des emplacements",
  },
  organisation: {
    title: "Organisation",
    subtitle: "Structure de l'entreprise et des équipes",
  },
  equipements: {
    title: "Équipements",
    subtitle: "Catalogue et suivi des équipements",
  },
  organe: {
    title: "Organe",
    subtitle: "Gestion des organes et sous-ensembles",
  },
  articles: {
    title: "Articles",
    subtitle: "Référentiel des articles et consommables",
    defaultSubpage: "groupe-article",
    tabs: {
      "groupe-article": {
        label: "Groupess article",
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
  planification: {
    defaultSubpage: "plans-maintenance",
    tabs: {
      "plans-maintenance": {
        label: "Plans de maintenance",
        title: "Plans de maintenance",
        body: "Suivi simple des plans de maintenance et de leurs déclenchements.",
      },
      calendrier: {
        label: "Calendrier",
        title: "Calendrier",
        body: "Vue des OT planifiés, en cours et en retard sur plusieurs horizons.",
      },
      compteurs: {
        label: "Compteurs",
        title: "Compteurs",
        body: "Suivi des relevés, seuils d'alerte et génération automatique d'OT.",
      },
    },
  },
  stock: {
    title: "Stock",
    subtitle: "Paramétrage du stock, mouvements et inventaire",
  },
  achats: {
    title: "Achats",
    subtitle: "Cycle DA, BC, réceptions et historique",
  },
  fournisseurs: {
    title: "Fournisseurs",
    subtitle: "Référentiel fournisseurs, catalogue, contrats et évaluations",
  },
  profil: {
    title: "Profil",
    subtitle: "Informations du compte connecté",
  },
  interventions: {
    title: "Interventions",
    subtitle: "Cycle complet DI, OT et BT avec suivi terrain",
  },
  parametres: {
    title: "Administration",
    subtitle: "Gestion des utilisateurs, des rôles et des paramètres globaux",
  },
};

const administrationSubpages = {
  defaultSubpage: "utilisateurs",
  tabs: {
    utilisateurs: {
      label: "Utilisateurs",
      title: "Utilisateurs",
      body: "Gestion de tous les comptes qui accèdent au logiciel.",
    },
    roles: {
      label: "Rôles & Permissions",
      title: "Rôles & Permissions",
      body: "Définition de qui peut faire quoi dans chaque module de la plateforme.",
    },
    general: {
      label: "Paramètres généraux",
      title: "Paramètres généraux",
      body: "Configuration globale du logiciel, des alertes et de la numérotation.",
    },
  },
};

const administrationStorageKey = "maintflow.administrationState";
const administrationRoleCatalog = [
  "Admin",
  "Responsable de maintenance",
  "Technicien de maintenance",
  "Gestionnaire de stock",
  "Acheteur",
  "Consultant",
];
const administrationLanguageOptions = ["fr", "en"];
const administrationCurrencyOptions = ["DZD", "EUR", "USD"];
let administrationPermissionMatrix = [
  {
    module: "Dashboard",
    view: true,
    create: false,
    edit: false,
    delete: false,
    validate: false,
  },
  {
    module: "Arborescence",
    view: true,
    create: false,
    edit: false,
    delete: false,
    validate: false,
  },
  {
    module: "Organisation",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
  {
    module: "Équipements",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
  {
    module: "Organes",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
  {
    module: "Articles",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
  {
    module: "Planification",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: true,
  },
  {
    module: "Interventions",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: true,
  },
  {
    module: "Stock",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: true,
  },
  {
    module: "Achats",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: true,
  },
  {
    module: "Fournisseurs",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
  {
    module: "Administration",
    view: true,
    create: true,
    edit: true,
    delete: true,
    validate: false,
  },
];

function buildAdministrationRolePermissionsDefaults() {
  const base = administrationPermissionMatrix.reduce((accumulator, row) => {
    accumulator[row.module] = {
      view: Boolean(row.view),
      create: Boolean(row.create),
      edit: Boolean(row.edit),
      delete: Boolean(row.delete),
      validate: Boolean(row.validate),
    };
    return accumulator;
  }, {});

  return {
    Admin: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view: true,
        create: true,
        edit: true,
        delete: true,
        validate: row.validate || row.module === "Administration",
      };
      return accumulator;
    }, {}),
    Responsable: JSON.parse(JSON.stringify(base)),
    Technicien: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view: true,
        create: row.module === "Interventions" || row.module === "Organisation",
        edit: row.module === "Interventions",
        delete: false,
        validate: row.module === "Interventions",
      };
      return accumulator;
    }, {}),
    Magasinier: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view:
          row.module === "Stock" ||
          row.module === "Achats" ||
          row.module === "Administration",
        create: row.module === "Stock",
        edit: row.module === "Stock",
        delete: false,
        validate: row.module === "Stock" || row.module === "Achats",
      };
      return accumulator;
    }, {}),
    Acheteur: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view:
          row.module === "Achats" ||
          row.module === "Fournisseurs" ||
          row.module === "Administration",
        create: row.module === "Achats" || row.module === "Fournisseurs",
        edit: row.module === "Achats" || row.module === "Fournisseurs",
        delete: row.module === "Fournisseurs",
        validate: row.module === "Achats",
      };
      return accumulator;
    }, {}),
    Demandeur: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view:
          row.module === "Dashboard" ||
          row.module === "Interventions" ||
          row.module === "Administration",
        create: row.module === "Interventions",
        edit: row.module === "Interventions",
        delete: false,
        validate: false,
      };
      return accumulator;
    }, {}),
    Consultant: administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view: true,
        create: false,
        edit: false,
        delete: false,
        validate: false,
      };
      return accumulator;
    }, {}),
  };
}

function mergeAdministrationRolePermissions(basePermissions, overrides = {}) {
  const nextPermissions = JSON.parse(JSON.stringify(basePermissions || {}));

  Object.entries(overrides || {}).forEach(([roleName, modulePermissions]) => {
    if (!nextPermissions[roleName]) {
      nextPermissions[roleName] = {};
    }

    Object.entries(modulePermissions || {}).forEach(
      ([moduleName, permissions]) => {
        nextPermissions[roleName][moduleName] = {
          ...(nextPermissions[roleName][moduleName] || {}),
          ...(permissions || {}),
        };
      },
    );
  });

  return nextPermissions;
}

const administrationDefaults = {
  users: [],
  settings: {
    companyName: "MaintFlow Industrie",
    logo: "",
    currency: "DZD",
    defaultLanguage: "fr",
    timezone: "Africa/Algiers",
    dateFormat: "JJ/MM/AAAA",
    stock: {
      valuation: "PMP",
      negativeStock: false,
      blockOnShortage: true,
      requireReceptionValidation: true,
    },
    notifications: {
      stockMinimum: true,
      stockSafety: true,
      stockBreakage: true,
      diDelayDays: 3,
      otDelayDays: 2,
      btDelayDays: 2,
      bcDelayDays: 5,
      daDelayDays: 4,
      contractExpiryDays: 30,
      warrantyExpiryDays: 15,
      counterThreshold: true,
    },
    interventions: {
      requireDiBeforeOt: true,
      requireBtSignature: true,
      requireBtPhotos: false,
      requireSafetyChecklist: true,
      maxPendingDiDays: 5,
    },
    backup: {
      exportMode: "JSON",
      exportScope: "Tous les modules",
      autoFrequency: "Hebdomadaire",
      importMode: "JSON",
      resetMode: "Double confirmation",
    },
    selectedRole: "Responsable",
    rolePermissions: buildAdministrationRolePermissionsDefaults(),
  },
  logs: [],
};

let administrationUserDraftId = null;
let administrationLogFilters = {
  user: "",
  module: "",
  action: "",
  from: "",
  to: "",
};

const planificationTechniciens = []; // garde pour compatibilité legacy

function getPlanificationTechniciens() {
  try {
    const state = StorageManager.get(administrationStorageKey, administrationDefaults);
    const users = Array.isArray(state?.users) ? state.users : [];
    return users.filter(u =>
      u.active !== false &&
      ['Technicien de maintenance', 'Responsable de maintenance', 'Admin'].includes(u.role)
    );
  } catch (e) {
    return [];
  }
}

const planificationDefaults = {
  view: "mensuelle",
  plans: [],
  counters: [],
  readings: [],
  scheduledOrders: [],
};

const organizationSubpages = {
  entreprise: {
    label: "Entreprise",
    title: "Entreprise",
    body: "Fiche entreprise, informations de base et logo.",
  },
  unites: {
    label: "Unités",
    title: "Unités",
    body: "Gestion des unités avec responsables et rattachements.",
  },
  "departements-services": {
    label: "Départements",
    title: "Départements",
    body: "Gestion des départements avec rattachement aux unités.",
  },
};

const sectionSubpages = {
  equipements: {
    defaultSubpage: "groupe-equipment",
    tabs: {
      "groupe-equipment": {
        label: "Groupe équipement",
        title: "Groupe équipement",
        body: "Gestion des groupes d'équipements avec affectation multi-divisions.",
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
  planification: {
    defaultSubpage: "plans-maintenance",
    tabs: {
      "plans-maintenance": {
        label: "Plans de maintenance",
        title: "Plans de maintenance",
        body: "Référentiel des plans, déclenchements et gammes opératoires.",
      },
      calendrier: {
        label: "Calendrier",
        title: "Calendrier",
        body: "Vue des OT planifiés, en cours et en retard sur plusieurs horizons.",
      },
      compteurs: {
        label: "Compteurs",
        title: "Compteurs",
        body: "Suivi des relevés, seuils d'alerte et génération automatique d'OT.",
      },
    },
  },
};

function buildOrganizationSeedState() {
  return {
    unites: [],
    divisions: [],
    departmentServices: [],
  };
}

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

const achatsStorageKey = "maintflow.purchaseFlow";
const achatsCurrentUser = "Utilisateur connecté";

const achatsSubpages = {
  defaultSubpage: "demandes-achat",
  tabs: {
    "demandes-achat": {
      label: "Demandes d'achat (DA)",
      title: "Demandes d'achat",
      subtitle:
        "Point de départ du flux achat, avec création manuelle ou automatique depuis le stock.",
    },
    "bons-commande": {
      label: "Bons de commande (BC)",
      title: "Bons de commande",
      subtitle:
        "Commandes fournisseurs, regroupement des DA et suivi des statuts de livraison.",
    },
    receptions: {
      label: "Réceptions",
      title: "Réceptions",
      subtitle:
        "Enregistrement de la marchandise reçue, contrôle qualité et mise à jour du stock.",
    },
    historique: {
      label: "Historique",
      title: "Historique",
      subtitle:
        "Consultation consolidée DA/BC/REC avec filtres multi-critères et export.",
    },
  },
};

let achatsModalState = null;
let achatsHistoryFilterState = {
  article: "",
  supplier: "",
  documentType: "",
  status: "",
  from: "",
  to: "",
  minAmount: "",
};

function buildAchatsSeedState() {
  return {
    demandes: [],
    bons: [],
    receptions: [],
  };
}

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
  groups: [],
  families: [],
  articles: [],
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

function buildArticleSupplierOptions(selectedSupplier) {
  const stored = (() => {
    try {
      const raw = window.localStorage.getItem('maintflow.fournisseurs');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.suppliers) ? parsed.suppliers : [];
    } catch (e) {
      return [];
    }
  })();
  return `<option value="">Sélectionner le fournisseur principal</option>` +
    stored
      .filter(s => s.nomCommercial)
      .sort((a, b) => a.nomCommercial.localeCompare(b.nomCommercial))
      .map(s =>
        `<option value="${escapeHtml(s.nomCommercial)}"${s.nomCommercial === selectedSupplier ? ' selected' : ''
        }>${escapeHtml(s.number)} — ${escapeHtml(s.nomCommercial)}</option>`
      )
      .join('');
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
  return date.toLocaleDateString(getAdministrationLocale());
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
  const linkedOrganeIds = Array.isArray(record?.linkedOrganeIds)
    ? record.linkedOrganeIds
    : [];
  const linkedEquipmentIds = Array.isArray(record?.linkedEquipmentIds)
    ? record.linkedEquipmentIds
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
          <label>Organes liés</label>
          <select name="linkedOrganeIds" multiple size="5">
            ${buildOrganeMultiOptions(linkedOrganeIds)}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs organes.</div>
        </div>
        <div class="field-group field-group-wide">
          <label>Équipements liés</label>
          <select name="linkedEquipmentIds" multiple size="5">
            ${buildAssociatedEquipmentOptions(linkedEquipmentIds)}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs équipements.</div>
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
  const linkedOrganeLabels = joinRecordLabels(
    getOrganeRecords("organes"),
    record.linkedOrganeIds || [],
    (organe) => `${organe.code} — ${organe.name}`,
  );
  const linkedEquipmentLabels = joinRecordLabels(
    getEquipmentRecords("equipments"),
    record.linkedEquipmentIds || [],
    (equipment) => `${equipment.code} — ${equipment.name}`,
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
          <div class="equipment-detail-row"><span>Unité de mesure</span><strong>${record.unitMeasure || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Type d'article</span><strong>${record.articleType || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Marque</span><strong>${record.brand || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Fournisseur principal</span><strong>${record.supplier || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Prix</span><strong>${record.price || "-"}</strong></div>
          <div class="equipment-detail-row"><span>Articles substituts</span><strong>${substituteNames}</strong></div>
          <div class="equipment-detail-row"><span>Organes liés</span><strong>${linkedOrganeLabels}</strong></div>
          <div class="equipment-detail-row"><span>Équipements liés</span><strong>${linkedEquipmentLabels}</strong></div>
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
  const linkedFamiliesCount = directory.families.filter(
    (family) => family.groupId,
  ).length;
  const linkedArticlesCount = directory.articles.filter(
    (article) => article.groupId,
  ).length;

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

    ${renderArticleSectionIntro(
    "Groupes articles",
    "Chaque groupe structure les familles et les articles rattachés.",
    `
        <span class="status-badge badge-info">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
        <span class="status-badge badge-gray">${directory.articles.length} articles</span>
      `,
    [
      {
        label: "Groupes articles",
        value: String(directory.groups.length),
        note: "Référentiel de premier niveau",
      },
      {
        label: "Familles liées",
        value: String(linkedFamiliesCount),
        note: "Rattachements actifs",
      },
      {
        label: "Articles référencés",
        value: String(linkedArticlesCount),
        note: "Inventaire disponible",
      },
    ],
  )}

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
  const familiesWithGroupCount = directory.families.filter(
    (family) => family.groupId,
  ).length;
  const articlesWithFamilyCount = directory.articles.filter(
    (article) => article.familyId,
  ).length;

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

    ${renderArticleSectionIntro(
    "Familles articles",
    "Chaque famille est rattachée à un groupe article.",
    `
        <span class="status-badge badge-info">${directory.families.length} familles</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.articles.length} articles</span>
      `,
    [
      {
        label: "Familles articles",
        value: String(directory.families.length),
        note: "Référentiel intermédiaire",
      },
      {
        label: "Familles liées",
        value: String(familiesWithGroupCount),
        note: "Association au groupe",
      },
      {
        label: "Articles référencés",
        value: String(articlesWithFamilyCount),
        note: "Articles classés par famille",
      },
    ],
  )}

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
  const completeArticlesCount = directory.articles.filter(
    (article) => article.groupId && article.familyId,
  ).length;
  const substituteArticlesCount = directory.articles.filter(
    (article) =>
      Array.isArray(article.substituteIds) && article.substituteIds.length,
  ).length;

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

    ${renderArticleSectionIntro(
    "Articles",
    "Chaque fiche article reprend le classement, les achats et la traçabilité.",
    `
        <span class="status-badge badge-info">${directory.articles.length} articles</span>
        <span class="status-badge badge-gray">${directory.groups.length} groupes</span>
        <span class="status-badge badge-gray">${directory.families.length} familles</span>
      `,
    [
      {
        label: "Articles totaux",
        value: String(directory.articles.length),
        note: "Inventaire principal",
      },
      {
        label: "Articles complets",
        value: String(completeArticlesCount),
        note: "Groupe et famille renseignés",
      },
      {
        label: "Articles avec substitut",
        value: String(substituteArticlesCount),
        note: "Ressources de remplacement",
      },
    ],
  )}

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

function renderArticleSectionIntro(title, subtitle, pillsHtml, stats) {
  return `
    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel article</div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="org-section-pills">
        ${pillsHtml}
      </div>
    </div>

    ${renderOrganizationStats(stats)}
  `;
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
    const linkedOrganeIds = getSelectedValues(
      form.querySelector("select[name='linkedOrganeIds']"),
    );
    const linkedEquipmentIds = getSelectedValues(
      form.querySelector("select[name='linkedEquipmentIds']"),
    );

    const next = {
      id: existing?.id || `article-${Date.now()}`,
      code:
        existing?.code || generateOrganizationCode("ART", directory.articles),
      name,
      unitMeasure: String(
        form.querySelector("select[name='unitMeasure']")?.value || "",
      ).trim(),
      articleType: String(
        form.querySelector("select[name='articleType']")?.value || "",
      ),
      supplier: String(
        form.querySelector("select[name='supplier']")?.value || "",
      ).trim(),
      brand: String(
        form.querySelector("input[name='brand']")?.value || "",
      ).trim(),
      price: String(
        form.querySelector("input[name='price']")?.value || "",
      ).trim(),
      groupId,
      familyId,
      designations: String(
        form.querySelector("textarea[name='designations']")?.value || "",
      ).trim(),
      substituteIds,
      linkedOrganeIds,
      linkedEquipmentIds,
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
    syncArticleBusinessLinks(next.id, linkedOrganeIds, linkedEquipmentIds);
    articleModalState = null;
    renderArticlePage(pageKey);
  });
}

let equipmentModalState = null;

const equipmentStorageKey = "maintflow.equipmentCatalog";

const equipmentDefaults = {
  groups: [],
  families: [],
  equipments: [],
};

let organeModalState = null;

const organeStorageKey = "maintflow.organeCatalog";

const organeDefaults = {
  groups: [],
  families: [],
  organes: [],
};

const demoDataVersionKey = "maintflow.demoDataVersion";
const demoDataVersion = "2026-05-30-v1";

function resetDemoDataIfNeeded() {
  return;
}

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
  return {
    ...enterpriseDefaults,
    ...StorageManager.get(enterpriseStorageKey, {}),
  };
}

function saveEnterpriseProfile(profile) {
  StorageManager.set(enterpriseStorageKey, profile);
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
        unites: Array.isArray(parsed.unites)
          ? parsed.unites.map((unit) => ({
            ...unit,
            code:
              typeof unit.code === "string" && unit.code.startsWith("SITE-")
                ? unit.code.replace(/^SITE-/, "UNI-")
                : unit.code,
            name:
              typeof unit.name === "string" && unit.name.includes("Site")
                ? unit.name.replace(/Site/g, "Unité")
                : unit.name,
          }))
          : directory.unites,
        divisions: Array.isArray(parsed.divisions)
          ? parsed.divisions
          : directory.divisions,
        departmentServices: Array.isArray(parsed.departmentServices)
          ? parsed.departmentServices
          : directory.departmentServices,
      };
    }

    if (!directory.unites.length && !directory.departmentServices.length) {
      const seedState = buildOrganizationSeedState();
      try {
        window.localStorage.setItem(
          organizationStorageKey,
          JSON.stringify(seedState),
        );
      } catch (error) { }
      return seedState;
    }
  } catch (error) {
    const seedState = buildOrganizationSeedState();
    try {
      window.localStorage.setItem(
        organizationStorageKey,
        JSON.stringify(seedState),
      );
    } catch (storageError) { }
    return seedState;
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
  if (kind === "departmentServices") return directory.departmentServices;
  return [];
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

function getSelectedValues(selectEl) {
  if (!selectEl) return [];
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
    "Départements",
    "Gestion des départements avec rattachement aux unités.",
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
              <td class="muted">${joinNames(getOrganizationRecords("unites"), record.unitIds || [])}</td>
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
<td colspan="5">
           ${buildOrganizationEmptyState(
      "fa-folder-open",
      "Aucun département enregistré",
      "Créez un département et rattachez-le à une ou plusieurs unités.",
      "Les départements supportent plusieurs unités.",
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
          <h2>Départements</h2>
        <p>Chaque département peut être rattaché à plusieurs unités.</p>
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
      note: "Multiples unités possibles",
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
        <div class="field-group">
          <label for="departmentServiceKind">Type</label>
          <select id="departmentServiceKind" name="kind">
            <option value="Département" ${!record?.kind || record.kind === "Département" ? "selected" : ""}>Département</option>
            <option value="Service" ${record?.kind === "Service" ? "selected" : ""}>Service</option>
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label for="departmentServiceName">Nom</label>
          <input id="departmentServiceName" name="name" type="text" value="${escapeHtml(record?.name || "")}" placeholder="Nom du département" required />
        </div>
        <div class="field-group field-group-wide">
          <label for="departmentServiceUnits">Unités rattachées</label>
          <select id="departmentServiceUnits" name="unitIds" multiple size="5">
            ${buildUnitOptions(record?.unitIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs unités.</div>
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
      <div class="org-detail-item org-detail-item--full"><span>Unités liées</span><strong>${joinNames(getOrganizationRecords("unites"), record.unitIds || [])}</strong></div>
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
              unitIds: (entry.unitIds || []).filter(
                (unitId) => unitId !== recordId,
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
      unitIds: getSelectedValues(form.querySelector("select[name='unitIds']")),
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
        groups: Array.isArray(parsed.groups)
          ? parsed.groups.map((group) => {
            const { divisionIds, ...rest } = group;
            return {
              ...rest,
              departmentIds: Array.isArray(group.departmentIds)
                ? group.departmentIds
                : Array.isArray(group.divisionIds)
                  ? group.divisionIds
                  : [],
            };
          })
          : directory.groups,
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

function normalizeLinkedIds(ids) {
  return Array.from(new Set((Array.isArray(ids) ? ids : []).filter(Boolean)));
}

function syncLinkedIdOnRecords(records, linkField, selectedRecordIds, linkedId) {
  const selectedIds = new Set(normalizeLinkedIds(selectedRecordIds));

  return records.map((record) => {
    const currentIds = normalizeLinkedIds(record[linkField]);
    const shouldLink = selectedIds.has(record.id);
    const isLinked = currentIds.includes(linkedId);

    if (shouldLink && !isLinked) {
      return { ...record, [linkField]: [...currentIds, linkedId] };
    }

    if (!shouldLink && isLinked) {
      return {
        ...record,
        [linkField]: currentIds.filter((id) => id !== linkedId),
      };
    }

    return record;
  });
}

function syncEquipmentBusinessLinks(equipmentId, linkedOrganeIds, linkedArticleIds) {
  const organeDirectory = getOrganeDirectory();
  organeDirectory.organes = syncLinkedIdOnRecords(
    organeDirectory.organes,
    "linkedEquipmentIds",
    linkedOrganeIds,
    equipmentId,
  );
  saveOrganeDirectory(organeDirectory);

  const articleDirectory = getArticleDirectory();
  articleDirectory.articles = syncLinkedIdOnRecords(
    articleDirectory.articles,
    "linkedEquipmentIds",
    linkedArticleIds,
    equipmentId,
  );
  saveArticleDirectory(articleDirectory);
}

function syncOrganeBusinessLinks(organeId, linkedEquipmentIds, linkedArticleIds) {
  const equipmentDirectory = getEquipmentDirectory();
  equipmentDirectory.equipments = syncLinkedIdOnRecords(
    equipmentDirectory.equipments,
    "linkedOrganeIds",
    linkedEquipmentIds,
    organeId,
  );
  saveEquipmentDirectory(equipmentDirectory);

  const articleDirectory = getArticleDirectory();
  articleDirectory.articles = syncLinkedIdOnRecords(
    articleDirectory.articles,
    "linkedOrganeIds",
    linkedArticleIds,
    organeId,
  );
  saveArticleDirectory(articleDirectory);
}

function syncArticleBusinessLinks(articleId, linkedOrganeIds, linkedEquipmentIds) {
  const organeDirectory = getOrganeDirectory();
  organeDirectory.organes = syncLinkedIdOnRecords(
    organeDirectory.organes,
    "linkedArticleIds",
    linkedOrganeIds,
    articleId,
  );
  saveOrganeDirectory(organeDirectory);

  const equipmentDirectory = getEquipmentDirectory();
  equipmentDirectory.equipments = syncLinkedIdOnRecords(
    equipmentDirectory.equipments,
    "linkedArticleIds",
    linkedEquipmentIds,
    articleId,
  );
  saveEquipmentDirectory(equipmentDirectory);
}

function buildDepartmentOptions(selectedDepartmentIds = []) {
  const departments = getOrganizationRecords("departmentServices");
  return departments
    .map(
      (department) => `
        <option value="${department.id}"${selectedDepartmentIds.includes(department.id) ? " selected" : ""}>
          ${department.code} — ${department.name}
        </option>
      `,
    )
    .join("");
}

function buildDivisionLinkOptions(selectedIds = []) {
  return getOrganizationRecords("divisions")
    .map(
      (division) => `
        <option value="${division.id}"${selectedIds.includes(division.id) ? " selected" : ""}>
          ${division.code} — ${division.name}
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
  return date.toLocaleDateString(getAdministrationLocale());
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
        ${photos.length
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

      ${showDocuments
      ? `
            <div class="equipment-asset-card">
              <div class="equipment-asset-title">${documentsTitle}</div>
              ${documents.length
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
            ${buildDepartmentOptions(record?.departmentIds || [])}
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
      <div class="org-detail-item org-detail-item--full"><span>Départements associés</span><strong>${joinRecordLabels(getOrganizationRecords("departmentServices"), record.departmentIds || [], (department) => `${department.code} — ${department.name}`)}</strong></div>
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
              <th>Divisions</th>
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

function buildArticleMultiOptions(selectedIds) {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  return getArticleRecords("articles")
    .map(article =>
      `<option value="${article.id}"${ids.includes(article.id) ? " selected" : ""}>${escapeHtml(article.code)} — ${escapeHtml(article.name)}</option>`
    ).join("\n");
}

function buildOrganeMultiOptions(selectedIds) {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  return getOrganeRecords("organes")
    .map(organe =>
      `<option value="${organe.id}"${ids.includes(organe.id) ? " selected" : ""}>${escapeHtml(organe.code)} — ${escapeHtml(organe.name)}</option>`
    ).join("\n");
}

function buildEquipmentSupplierOptions(selectedSupplier) {
  const stored = (() => {
    try {
      const raw = window.localStorage.getItem('maintflow.fournisseurs');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.suppliers) ? parsed.suppliers : [];
    } catch (e) {
      return [];
    }
  })();
  return `<option value="">Sélectionner un fournisseur</option>` +
    stored
      .filter(s => s.nomCommercial)
      .sort((a, b) => a.nomCommercial.localeCompare(b.nomCommercial))
      .map(s =>
        `<option value="${escapeHtml(s.nomCommercial)}"${s.nomCommercial === selectedSupplier ? ' selected' : ''
        }>${escapeHtml(s.number)} — ${escapeHtml(s.nomCommercial)}</option>`
      )
      .join('');
}

function buildEquipmentFormContent(record, mode) {
  const codePreview =
    record?.code ||
    generateOrganizationCode("EQP", getEquipmentRecords("equipments"));
  const selectedGroupId = record?.groupId || "";
  const linkedOrganeIds = Array.isArray(record?.linkedOrganeIds) ? record.linkedOrganeIds : [];
  const linkedArticleIds = Array.isArray(record?.linkedArticleIds) ? record.linkedArticleIds : [];

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
              <div class="equipment-section-kicker">Liaisons métier</div>
              <h4>Organes et articles associés</h4>
              <p>Associez les organes et articles déjà créés à cet équipement.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group field-group-wide">
              <label for="equipmentLinkedOrganes">Organes liés</label>
              <select id="equipmentLinkedOrganes" name="linkedOrganeIds" multiple size="5">
                ${buildOrganeMultiOptions(linkedOrganeIds)}
              </select>
              <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs organes.</div>
            </div>
            <div class="field-group field-group-wide">
              <label for="equipmentLinkedArticles">Articles liés</label>
              <select id="equipmentLinkedArticles" name="linkedArticleIds" multiple size="5">
                ${buildArticleMultiOptions(linkedArticleIds)}
              </select>
              <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs articles.</div>
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
  <select id="equipmentSupplier" name="supplier">
    ${buildEquipmentSupplierOptions(record?.supplier)}
  </select>
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
  const linkedOrganeLabels = joinRecordLabels(
    getOrganeRecords("organes"),
    record.linkedOrganeIds || [],
    (organe) => `${organe.code} — ${organe.name}`,
  );
  const linkedArticleLabels = joinRecordLabels(
    getArticleRecords("articles"),
    record.linkedArticleIds || [],
    (article) => `${article.code} — ${article.name}`,
  );

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
          <div class="equipment-detail-row">
            <span>Organes liés</span>
            <strong>${linkedOrganeLabels}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Articles liés</span>
            <strong>${linkedArticleLabels}</strong>
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

    const linkedOrganeIds = getSelectedValues(form.querySelector("select[name='linkedOrganeIds']"));
    const linkedArticleIds = getSelectedValues(form.querySelector("select[name='linkedArticleIds']"));

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
        form.querySelector("select[name='supplier']")?.value || "",
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
      linkedOrganeIds,
      linkedArticleIds,
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
    syncEquipmentBusinessLinks(
      nextEquipment.id,
      nextEquipment.linkedOrganeIds,
      nextEquipment.linkedArticleIds,
    );
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
  const linkedArticleIds = Array.isArray(record?.linkedArticleIds) ? record.linkedArticleIds : [];
  const linkedEquipmentIds = Array.isArray(record?.linkedEquipmentIds) ? record.linkedEquipmentIds : [];

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
              <div class="equipment-section-kicker">Liaisons métier</div>
              <h4>Équipements et articles associés</h4>
              <p>Associez les équipements et les articles de stock utilisés par cet organe.</p>
            </div>
          </div>
          <div class="org-form-grid">
            <div class="field-group field-group-wide">
              <label for="organeLinkedEquipments">Équipements liés</label>
              <select id="organeLinkedEquipments" name="linkedEquipmentIds" multiple size="5">
                ${buildAssociatedEquipmentOptions(linkedEquipmentIds)}
              </select>
              <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs équipements.</div>
            </div>
            <div class="field-group field-group-wide">
              <label for="organeLinkedArticles">Articles liés</label>
              <select id="organeLinkedArticles" name="linkedArticleIds" multiple size="5">
                ${buildArticleMultiOptions(linkedArticleIds)}
              </select>
              <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs articles.</div>
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
  <select id="organeSupplier" name="supplier">
    ${buildEquipmentSupplierOptions(record?.supplier)}
  </select>
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
  const linkedEquipmentLabels = joinRecordLabels(
    getEquipmentRecords("equipments"),
    record.linkedEquipmentIds || [],
    (equipment) => `${equipment.code} — ${equipment.name}`,
  );
  const linkedArticleLabels = joinRecordLabels(
    getArticleRecords("articles"),
    record.linkedArticleIds || [],
    (article) => `${article.code} — ${article.name}`,
  );

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
          <div class="equipment-detail-row">
            <span>Équipements liés</span>
            <strong>${linkedEquipmentLabels}</strong>
          </div>
          <div class="equipment-detail-row">
            <span>Articles liés</span>
            <strong>${linkedArticleLabels}</strong>
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
      supplier: String(form.querySelector("select[name='supplier']")?.value || "").trim(),
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
      linkedEquipmentIds: getSelectedValues(
        form.querySelector("select[name='linkedEquipmentIds']"),
      ),
      linkedArticleIds: getSelectedValues(
        form.querySelector("select[name='linkedArticleIds']"),
      ),
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
    syncOrganeBusinessLinks(
      nextOrgane.id,
      nextOrgane.linkedEquipmentIds,
      nextOrgane.linkedArticleIds,
    );
    closeOrganeModal(pageKey);
  });

  if (pageKey === "organe") {
    syncOrganeFamilySelect(form);
  }
}

function buildArboNode(domId, label, icon, children = [], note = "", dataId = null) {
  return { id: domId, label, icon, children, note, dataId: dataId || domId };
}

function renderArboNode(node) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const leafMessage = node.note || "Créer le niveau suivant pour continuer.";
  const isArticleNode = String(node.id || "").includes("-article-");
  const showLeafNote = !hasChildren && !isArticleNode && leafMessage;

  return `
    <li class="arbo-node-item">
      <button
        class="arbo-node-toggle ${hasChildren ? "" : "is-leaf"}"
        type="button"
        data-arbo-id="${node.dataId || node.id}"
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

function isOrganeLinkedToEquipment(organe, equipment) {
  return (
    normalizeLinkedIds(organe?.linkedEquipmentIds).includes(equipment?.id) ||
    normalizeLinkedIds(equipment?.linkedOrganeIds).includes(organe?.id)
  );
}

function isArticleLinkedToOrgane(article, organe) {
  return (
    normalizeLinkedIds(article?.linkedOrganeIds).includes(organe?.id) ||
    normalizeLinkedIds(organe?.linkedArticleIds).includes(article?.id)
  );
}

function buildArboArticleNodesForOrgane(datasets, organe, pathPrefix = "") {
  const linkedArticles = datasets.articles.filter((article) =>
    isArticleLinkedToOrgane(article, organe),
  );
  const prefix = pathPrefix ? `${pathPrefix}-` : "";

  return datasets.articleGroups
    .map((articleGroup) => {
      const articleFamilyNodes = datasets.articleFamilies
        .filter((articleFamily) => articleFamily.groupId === articleGroup.id)
        .map((articleFamily) => {
          const articleNodes = linkedArticles
            .filter(
              (article) =>
                article.groupId === articleGroup.id &&
                article.familyId === articleFamily.id,
            )
            .map((article) =>
              buildArboNode(
                `${prefix}arbo-article-${article.id}`,
                `${article.code} - ${article.name}`,
                "fa-barcode",
                [],
                "",
                `arbo-article-${article.id}`,
              ),
            );

          return buildArboNode(
            `${prefix}arbo-article-family-${articleFamily.id}`,
            `${articleFamily.code} - ${articleFamily.name}`,
            "fa-layer-group",
            articleNodes,
            "",
            `arbo-article-family-${articleFamily.id}`,
          );
        })
        .filter((articleFamilyNode) => articleFamilyNode.children.length > 0);

      return buildArboNode(
        `${prefix}arbo-article-group-${articleGroup.id}`,
        `${articleGroup.code} - ${articleGroup.name}`,
        "fa-boxes-stacked",
        articleFamilyNodes,
        "",
        `arbo-article-group-${articleGroup.id}`,
      );
    })
    .filter((articleGroupNode) => articleGroupNode.children.length > 0);
}

function buildArboOrganeNodesForEquipment(datasets, equipment, pathPrefix = "") {
  const linkedOrganes = datasets.organes.filter((organe) =>
    isOrganeLinkedToEquipment(organe, equipment),
  );
  const prefix = pathPrefix ? `${pathPrefix}-` : "";

  return datasets.organeGroups
    .map((orgGroup) => {
      const organeFamilyNodes = datasets.organeFamilies
        .filter((orgFamily) => orgFamily.groupId === orgGroup.id)
        .map((orgFamily) => {
          const organeNodes = linkedOrganes
            .filter(
              (organe) =>
                organe.groupId === orgGroup.id &&
                organe.familyId === orgFamily.id,
            )
            .map((organe) => {
              const organePath = `${prefix}arbo-organe-${organe.id}`;
              return buildArboNode(
                organePath,
                `${organe.code} - ${organe.name}`,
                "fa-circle-nodes",
                buildArboArticleNodesForOrgane(datasets, organe, organePath),
                "",
                `arbo-organe-${organe.id}`,
              );
            });

          return buildArboNode(
            `${prefix}arbo-organe-family-${orgFamily.id}`,
            `${orgFamily.code} - ${orgFamily.name}`,
            "fa-puzzle-piece",
            organeNodes,
            "",
            `arbo-organe-family-${orgFamily.id}`,
          );
        })
        .filter((organeFamilyNode) => organeFamilyNode.children.length > 0);

      return buildArboNode(
        `${prefix}arbo-organe-group-${orgGroup.id}`,
        `${orgGroup.code} - ${orgGroup.name}`,
        "fa-diagram-project",
        organeFamilyNodes,
        "",
        `arbo-organe-group-${orgGroup.id}`,
      );
    })
    .filter((organeGroupNode) => organeGroupNode.children.length > 0);
}

function getArboDivisionChildren(division, datasets, pathPrefix = "") {
  const groups = datasets.equipmentGroups.filter((group) =>
    (group.divisionIds || []).includes(division.id),
  );
  const prefix = pathPrefix ? `${pathPrefix}-` : "";

  const buildEquipmentBranch = (group) => {
    const groupPath = `${prefix}arbo-equipment-group-${group.id}`;
    const familyNodes = datasets.equipmentFamilies
      .filter((family) => family.groupId === group.id)
      .map((family) => {
        const familyPath = `${groupPath}-arbo-equipment-family-${family.id}`;
        const equipmentNodes = datasets.equipments
          .filter((equipment) => equipment.familyId === family.id)
          .map((equipment) => {
            const equipPath = `${familyPath}-arbo-equipment-${equipment.id}`;
            return buildArboNode(
              equipPath,
              `${equipment.code} - ${equipment.name}`,
              "fa-gear",
              buildArboOrganeNodesForEquipment(datasets, equipment, equipPath),
              "",
              `arbo-equipment-${equipment.id}`,
            );
          });

        return buildArboNode(
          familyPath,
          `${family.code} - ${family.name}`,
          "fa-folder-tree",
          equipmentNodes,
          "",
          `arbo-equipment-family-${family.id}`,
        );
      });

    return buildArboNode(
      groupPath,
      `${group.code} - ${group.name}`,
      "fa-screwdriver-wrench",
      familyNodes,
      "",
      `arbo-equipment-group-${group.id}`,
    );
  };

  const departmentNodes = datasets.departmentServices
    .filter((department) =>
      (department.divisionIds || []).includes(division.id),
    )
    .map((department) => {
      const deptPath = `${prefix}arbo-department-${department.id}`;
      return buildArboNode(
        deptPath,
        `${department.code} - ${department.name}`,
        "fa-folder-open",
        groups.map((group) => buildEquipmentBranch(group)),
        "",
        `arbo-department-${department.id}`,
      );
    });

  return departmentNodes.length > 0
    ? departmentNodes
    : groups.map((group) => buildEquipmentBranch(group));
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

  const buildEquipmentBranchForUnit = (pathPrefix = "") => {
    return datasets.equipmentGroups.map((group) => {
      const groupPath = pathPrefix
        ? `${pathPrefix}-arbo-equipment-group-${group.id}`
        : `arbo-equipment-group-${group.id}`;
      const familyNodes = datasets.equipmentFamilies
        .filter((family) => family.groupId === group.id)
        .map((family) => {
          const familyPath = `${groupPath}-arbo-equipment-family-${family.id}`;
          const equipmentNodes = datasets.equipments
            .filter((equipment) => equipment.familyId === family.id)
            .map((equipment) => {
              const equipPath = `${familyPath}-arbo-equipment-${equipment.id}`;
              return buildArboNode(
                equipPath,
                `${equipment.code} - ${equipment.name}`,
                "fa-gear",
                buildArboOrganeNodesForEquipment(datasets, equipment, equipPath),
                "",
                `arbo-equipment-${equipment.id}`,
              );
            });

          return buildArboNode(
            familyPath,
            `${family.code} - ${family.name}`,
            "fa-folder-tree",
            equipmentNodes,
            "",
            `arbo-equipment-family-${family.id}`,
          );
        });

      return buildArboNode(
        groupPath,
        `${group.code} - ${group.name}`,
        "fa-screwdriver-wrench",
        familyNodes,
        "",
        `arbo-equipment-group-${group.id}`,
      );
    });
  };

  const unitNodes = organization.unites.map((unit) => {
    const unitPath = `arbo-unit-${unit.id}`;
    const departmentNodes = (organization.departmentServices || [])
      .filter((department) => (department.unitIds || []).includes(unit.id))
      .map((department) => {
        const deptPath = `${unitPath}-arbo-department-${department.id}`;
        return buildArboNode(
          deptPath,
          `${department.code} - ${department.name}`,
          "fa-folder-open",
          buildEquipmentBranchForUnit(deptPath),
          "",
          `arbo-department-${department.id}`,
        );
      });

    const hasDepartments = departmentNodes.length > 0;
    const childrenNodes = hasDepartments
      ? departmentNodes
      : buildEquipmentBranchForUnit(unitPath);

    return buildArboNode(
      unitPath,
      `${unit.code} - ${unit.name}`,
      "fa-industry",
      childrenNodes,
      "",
      `arbo-unit-${unit.id}`,
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
    "",
    "arbo-enterprise-root",
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
  console.dir(tree, { depth: null });
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

function cloneAdministrationDefaults() {
  return JSON.parse(JSON.stringify(administrationDefaults));
}

function getAdministrationState() {
  const state = cloneAdministrationDefaults();

  try {
    const stored = window.localStorage.getItem(administrationStorageKey);
    if (!stored) return state;

    const parsed = JSON.parse(stored);
    const settings = parsed.settings || {};
    state.users = Array.isArray(parsed.users) ? parsed.users : state.users;
    state.logs = Array.isArray(parsed.logs) ? parsed.logs : state.logs;
    state.settings = {
      ...state.settings,
      ...settings,
      stock: {
        ...state.settings.stock,
        ...(settings.stock || {}),
      },
      notifications: {
        ...state.settings.notifications,
        ...(settings.notifications || {}),
      },
      numbering: {
        ...state.settings.numbering,
        ...(settings.numbering || {}),
      },
      interventions: {
        ...state.settings.interventions,
        ...(settings.interventions || {}),
      },
      backup: {
        ...state.settings.backup,
        ...(settings.backup || {}),
      },
      selectedRole: settings.selectedRole || state.settings.selectedRole,
      rolePermissions: mergeAdministrationRolePermissions(
        state.settings.rolePermissions,
        settings.rolePermissions || {},
      ),
    };
    state.settings.defaultLanguage = normalizeAdministrationLanguage(
      state.settings.defaultLanguage,
    );
  } catch (error) {
    return state;
  }

  return state;
}

function saveAdministrationState(state) {
  try {
    window.localStorage.setItem(
      administrationStorageKey,
      JSON.stringify(state),
    );
  } catch (error) {
    // ignore storage errors
  }
}

const administrationLanguageLabels = {
  fr: { fr: "Français", en: "French" },
  en: { fr: "Anglais", en: "English" },
};

const administrationUiText = {
  fr: {
    appTitleSuffix: "Tableau de bord",
    sidebarToggle: "Ouvrir / Fermer",
    navSections: {
      principal: "Principal",
      actifs: "Actifs",
      operations: "Opérations",
      ressources: "Ressources",
      systeme: "Système",
    },
    topbar: {
      greetingMain: "Bonjour",
      greetingSub: "Votre tableau de bord de maintenance",
      searchPlaceholder: "Rechercher équipement, intervention…",
      notifications: "Notifications",
      profile: "Profil",
      settings: "Paramètres",
      logout: "Déconnexion",
    },
    pages: {
      dashboard: ["Tableau de bord", "Vue globale de la maintenance"],
      arborescence: [
        "Arborescence",
        "Structure des actifs et des emplacements",
      ],
      organisation: [
        "Organisation",
        "Structure de l'entreprise et des équipes",
      ],
      equipements: ["Équipements", "Catalogue et suivi des équipements"],
      organe: ["Organe", "Gestion des organes et sous-ensembles"],
      articles: ["Articles", "Référentiel des articles et consommables"],
      planification: ["Planification", "Plans, calendrier et compteurs"],
      stock: ["Stock", "Paramétrage du stock, mouvements et inventaire"],
      achats: ["Achats", "Cycle DA, BC, réceptions et historique"],
      fournisseurs: [
        "Fournisseurs",
        "Référentiel fournisseurs, catalogue, contrats et évaluations",
      ],
      interventions: [
        "Interventions",
        "Cycle complet DI, OT et BT avec suivi terrain",
      ],
      parametres: [
        "Administration",
        "Gestion des utilisateurs, des rôles, des paramètres globaux et des journaux système",
      ],
    },
    admin: {
      users: [
        "Utilisateurs",
        "Gestion de tous les comptes qui accèdent au logiciel.",
      ],
      roles: [
        "Rôles & Permissions",
        "Définition de qui peut faire quoi dans chaque module de la plateforme.",
      ],
      general: [
        "Paramètres généraux",
        "Configuration globale du logiciel, des alertes et de la numérotation automatique.",
      ],
      logs: [
        "Journaux système",
        "Traçabilité complète des actions réalisées dans l'application.",
      ],
      enterprise: "Entreprise",
      localSave: "Sauvegarde locale",
      companyName: "Nom entreprise",
      companyNameHint: "Valeur automatiquement liée à l'Organisation.",
      logo: "Logo",
      logoHint: "Utilisé dans les exports PDF et les impressions.",
      currency: "Devise",
      defaultLanguage: "Langue par défaut",
      timezone: "Fuseau horaire",
      dateFormat: "Format date",
      notifications: "Notifications",
      alertsTitle: "Paramètres d'alertes",
      alertsBody:
        "Seuils et temporisations pour le stock, les interventions, les achats et les compteurs.",
      workflow: "Workflow métier",
      backup: "Sauvegarde",
      backupTitle: "Export, import et réinitialisation",
      backupBody:
        "Base d'export JSON, import complet et options de remise à zéro par module.",
      save: "Enregistrer les paramètres",
    },
  },
  en: {
    appTitleSuffix: "Dashboard",
    sidebarToggle: "Open / Close",
    navSections: {
      principal: "Main",
      actifs: "Assets",
      operations: "Operations",
      ressources: "Resources",
      systeme: "System",
    },
    topbar: {
      greetingMain: "Hello",
      greetingSub: "Your maintenance dashboard",
      searchPlaceholder: "Search equipment, intervention…",
      notifications: "Notifications",
      profile: "Profile",
      settings: "Settings",
      logout: "Sign out",
    },
    pages: {
      dashboard: ["Dashboard", "Global maintenance overview"],
      arborescence: ["Tree", "Assets and locations structure"],
      organisation: ["Organization", "Structure of the company and teams"],
      equipements: ["Equipment", "Equipment catalog and tracking"],
      organe: ["Component", "Component and sub-assembly management"],
      articles: ["Items", "Item and consumables reference"],
      planification: ["Planning", "Plans, calendar and counters"],
      stock: ["Stock", "Stock settings, movements and inventory"],
      achats: ["Purchasing", "PR, PO, receipts and history flow"],
      fournisseurs: [
        "Suppliers",
        "Supplier reference, catalog, contracts and evaluations",
      ],
      interventions: [
        "Work Orders",
        "Full work request, order and report flow",
      ],
      parametres: [
        "Administration",
        "Users, roles, global settings and system logs",
      ],
    },
    admin: {
      users: ["Users", "Management of all accounts that access the software."],
      roles: [
        "Roles & Permissions",
        "Define who can do what in each platform module.",
      ],
      general: [
        "General Settings",
        "Global software, alerts and numbering configuration.",
      ],
      logs: [
        "System Logs",
        "Full traceability of actions performed in the application.",
      ],
      enterprise: "Company",
      localSave: "Local save",
      companyName: "Company name",
      companyNameHint: "Automatically linked to Organization.",
      logo: "Logo",
      logoHint: "Used in PDF exports and prints.",
      currency: "Currency",
      defaultLanguage: "Default language",
      timezone: "Time zone",
      dateFormat: "Date format",
      notifications: "Notifications",
      alertsTitle: "Alert settings",
      alertsBody:
        "Thresholds and delays for stock, interventions, purchasing and counters.",
      workflow: "Business workflow",
      backup: "Backup",
      backupTitle: "Export, import and reset",
      backupBody: "JSON export base, full import and reset options by module.",
      save: "Save settings",
    },
  },
};

function normalizeAdministrationLanguage(value) {
  const language = String(value || "").toLowerCase();
  if (["en", "en-us", "english", "anglais"].includes(language)) {
    return "en";
  }
  return "fr";
}

function getAdministrationLanguageKey(state = null) {
  const currentState = state || getAdministrationState();
  return normalizeAdministrationLanguage(
    currentState.settings?.defaultLanguage,
  );
}

function getAdministrationLocale(state = null) {
  return getAdministrationLanguageKey(state) === "en" ? "en-US" : "fr-FR";
}

function getAdministrationText(path, state = null) {
  const languageKey = getAdministrationLanguageKey(state);
  const branch = administrationUiText[languageKey] || administrationUiText.fr;
  return path
    .split(".")
    .reduce((current, segment) => current?.[segment], branch);
}

function getAdministrationLanguageLabel(languageKey, state = null) {
  const currentLanguage = getAdministrationLanguageKey(state);
  return (
    administrationLanguageLabels[languageKey]?.[currentLanguage] || languageKey
  );
}

function localizeAdministrationText(value, state = null) {
  const languageKey = getAdministrationLanguageKey(state);
  const branch = administrationUiText[languageKey] || administrationUiText.fr;
  const translations = new Map([
    ...Object.entries(administrationUiText.fr.pages).map(([key, [fr]]) => [
      fr,
      branch.pages[key][0],
    ]),
  ]);

  const adminPairs = [
    [
      administrationUiText.fr.navSections.principal,
      branch.navSections.principal,
    ],
    [administrationUiText.fr.navSections.actifs, branch.navSections.actifs],
    [
      administrationUiText.fr.navSections.operations,
      branch.navSections.operations,
    ],
    [
      administrationUiText.fr.navSections.ressources,
      branch.navSections.ressources,
    ],
    [administrationUiText.fr.navSections.systeme, branch.navSections.systeme],
  ];

  const pagePairs = Object.values(administrationUiText.fr.pages).map(
    ([fr], index) => {
      const key = Object.keys(administrationUiText.fr.pages)[index];
      return [fr, branch.pages[key][0]];
    },
  );

  const specificPairs = [
    ["Sous-pages administration", branch.admin.roles[0]],
    ["Paramètres généraux", branch.admin.general[0]],
    ["Rôles & Permissions", branch.admin.roles[0]],
    ["Journaux système", branch.admin.logs[0]],
    ["Utilisateurs", branch.admin.users[0]],
    [
      "Gestion de tous les comptes qui accèdent au logiciel.",
      branch.admin.users[1],
    ],
    [
      "Définition de qui peut faire quoi dans chaque module de la plateforme.",
      branch.admin.roles[1],
    ],
    [
      "Configuration globale du logiciel, des alertes et de la numérotation automatique.",
      branch.admin.general[1],
    ],
    [
      "Configuration globale du logiciel, des alertes et de la numérotation.",
      branch.admin.general[1],
    ],
    [
      "Traçabilité complète des actions réalisées dans l'application.",
      branch.admin.logs[1],
    ],
    ["Entreprise", branch.admin.enterprise],
    ["Sauvegarde locale", branch.admin.localSave],
    ["Nom entreprise", branch.admin.companyName],
    [
      "Valeur automatiquement liée à l'Organisation.",
      branch.admin.companyNameHint,
    ],
    ["Logo", branch.admin.logo],
    ["Utilisé dans les exports PDF et les impressions.", branch.admin.logoHint],
    ["Devise", branch.admin.currency],
    ["Langue par défaut", branch.admin.defaultLanguage],
    ["Fuseau horaire", branch.admin.timezone],
    ["Format date", branch.admin.dateFormat],
    ["Notifications", branch.admin.notifications],
    ["Paramètres d'alertes", branch.admin.alertsTitle],
    [
      "Seuils et temporisations pour le stock, les interventions, les achats et les compteurs.",
      branch.admin.alertsBody,
    ],
    ["Workflow métier", branch.admin.workflow],
    ["Sauvegarde", branch.admin.backup],
    ["Export, import et réinitialisation", branch.admin.backupTitle],
    [
      "Base d'export JSON, import complet et options de remise à zéro par module.",
      branch.admin.backupBody,
    ],
    ["Enregistrer les paramètres", branch.admin.save],
    ["Enregistrer", languageKey === "en" ? "Save" : "Enregistrer"],
    ["Sauvegarde locale", branch.admin.localSave],
    ["Alertes stock", languageKey === "en" ? "Stock alerts" : "Alertes stock"],
    [
      "Activer alertes stock minimum",
      languageKey === "en"
        ? "Enable minimum stock alerts"
        : "Activer alertes stock minimum",
    ],
    [
      "Activer alertes stock sécurité",
      languageKey === "en"
        ? "Enable safety stock alerts"
        : "Activer alertes stock sécurité",
    ],
    [
      "Activer alertes rupture",
      languageKey === "en"
        ? "Enable stockout alerts"
        : "Activer alertes rupture",
    ],
    [
      "Alertes interventions",
      languageKey === "en" ? "Intervention alerts" : "Alertes interventions",
    ],
    [
      "DI non traitée après X jours",
      languageKey === "en"
        ? "Unprocessed request after X days"
        : "DI non traitée après X jours",
    ],
    [
      "OT en retard après X jours",
      languageKey === "en"
        ? "Late work order after X days"
        : "OT en retard après X jours",
    ],
    [
      "BT non validé après X jours",
      languageKey === "en"
        ? "Unvalidated work report after X days"
        : "BT non validé après X jours",
    ],
    [
      "BC non reçu après X jours",
      languageKey === "en"
        ? "Unreceived purchase order after X days"
        : "BC non reçu après X jours",
    ],
    [
      "DA en attente après X jours",
      languageKey === "en"
        ? "Pending purchase request after X days"
        : "DA en attente après X jours",
    ],
    ["Portée export", languageKey === "en" ? "Export scope" : "Portée export"],
    [
      "Fréquence sauvegarde auto",
      languageKey === "en"
        ? "Auto backup frequency"
        : "Fréquence sauvegarde auto",
    ],
    [
      "Tous les modules",
      languageKey === "en" ? "All modules" : "Tous les modules",
    ],
    ["Par module", languageKey === "en" ? "By module" : "Par module"],
    ["Quotidienne", languageKey === "en" ? "Daily" : "Quotidienne"],
    ["Hebdomadaire", languageKey === "en" ? "Weekly" : "Hebdomadaire"],
    ["Mensuelle", languageKey === "en" ? "Monthly" : "Mensuelle"],
    ["Aucune", languageKey === "en" ? "None" : "Aucune"],
    ["Notifications", branch.topbar.notifications],
    ["Profil", branch.topbar.profile],
    [
      "Informations du compte connecté",
      languageKey === "en"
        ? "Connected account information"
        : "Informations du compte connecté",
    ],
    [
      "Utilisateur connecté",
      languageKey === "en" ? "Connected user" : "Utilisateur connecté",
    ],
    ["Paramètre", branch.topbar.settings],
    ["Déconnexion", branch.topbar.logout],
    ["Ouvrir / Fermer", branch.sidebarToggle],
    ["Rechercher équipement, intervention…", branch.topbar.searchPlaceholder],
    ["Votre tableau de bord de maintenance", branch.topbar.greetingSub],
    ["Bonjour,", branch.topbar.greetingMain],
    ["Généré le", languageKey === "en" ? "Generated on" : "Généré le"],
    ["Planification", languageKey === "en" ? "Planning" : "Planification"],
    [
      "Plans, calendrier et compteurs",
      languageKey === "en"
        ? "Plans, calendar and counters"
        : "Plans, calendrier et compteurs",
    ],
    [
      "Paramétrage du stock, emplacements et valorisation des articles.",
      languageKey === "en"
        ? "Stock settings, locations and item valuation."
        : "Paramétrage du stock, emplacements et valorisation des articles.",
    ],
    [
      "Entrées, sorties et transferts de stock avec traçabilité complète.",
      languageKey === "en"
        ? "Stock entries, exits and transfers with full traceability."
        : "Entrées, sorties et transferts de stock avec traçabilité complète.",
    ],
    [
      "Création d’inventaires et feuille de comptage terrain.",
      languageKey === "en"
        ? "Inventory creation and field counting sheet."
        : "Création d’inventaires et feuille de comptage terrain.",
    ],
    [
      "Consultation des mouvements filtrée par article, type, date ou utilisateur.",
      languageKey === "en"
        ? "View movements filtered by item, type, date or user."
        : "Consultation des mouvements filtrée par article, type, date ou utilisateur.",
    ],
    [
      "Demandes d'achat (DA)",
      languageKey === "en" ? "Purchase requests (PR)" : "Demandes d'achat (DA)",
    ],
    [
      "Bons de commande (BC)",
      languageKey === "en" ? "Purchase orders (PO)" : "Bons de commande (BC)",
    ],
    [
      "Enregistrement de la marchandise reçue, contrôle qualité et mise à jour du stock.",
      languageKey === "en"
        ? "Register received goods, quality control and stock updates."
        : "Enregistrement de la marchandise reçue, contrôle qualité et mise à jour du stock.",
    ],
    [
      "Consultation consolidée DA/BC/REC avec filtres multi-critères et export.",
      languageKey === "en"
        ? "Consolidated PR/PO/REC view with multi-criteria filters and export."
        : "Consultation consolidée DA/BC/REC avec filtres multi-critères et export.",
    ],
    [
      "Référentiel des plans, déclenchements et gammes opératoires.",
      languageKey === "en"
        ? "Reference list of plans, triggers and operating procedures."
        : "Référentiel des plans, déclenchements et gammes opératoires.",
    ],
    [
      "Vue des OT planifiés, en cours et en retard sur plusieurs horizons.",
      languageKey === "en"
        ? "View of scheduled, in-progress and overdue work orders across several horizons."
        : "Vue des OT planifiés, en cours et en retard sur plusieurs horizons.",
    ],
    [
      "Plans de maintenance",
      languageKey === "en" ? "Maintenance plans" : "Plans de maintenance",
    ],
    ["Calendrier", languageKey === "en" ? "Calendar" : "Calendrier"],
    ["Compteurs", languageKey === "en" ? "Counters" : "Compteurs"],
  ];

  let output = String(value ?? "");
  [...adminPairs, ...pagePairs, ...specificPairs].forEach(([from, to]) => {
    if (from && to && output === from) {
      output = to;
    }
  });
  return output;
}

const englishInterfaceTranslations = new Map(
  Object.entries({
    "Tableau de bord": "Dashboard",
    Arborescence: "Asset tree",
    Organisation: "Organization",
    "\u00c9quipements": "Equipment",
    Equipements: "Equipment",
    Organe: "Component",
    Organes: "Components",
    Articles: "Items",
    Planification: "Planning",
    Interventions: "interventions",
    Achats: "Purchasing",
    Fournisseurs: "Suppliers",
    Administration: "Administration",
    Principal: "Main",
    Actifs: "Assets",
    "Op\u00e9rations": "Operations",
    Ressources: "Resources",
    "Syst\u00e8me": "System",
    Ajouter: "Add",
    Modifier: "Edit",
    Supprimer: "Delete",
    Enregistrer: "Save",
    Annuler: "Cancel",
    Fermer: "Close",
    Imprimer: "Print",
    Exporter: "Export",
    Importer: "Import",
    Rechercher: "Search",
    Filtrer: "Filter",
    Valider: "Approve",
    Refuser: "Reject",
    R\u00e9initialiser: "Reset",
    Actions: "Actions",
    Action: "Action",
    D\u00e9tails: "Details",
    Informations: "Information",
    Description: "Description",
    Code: "Code",
    Nom: "Name",
    Pr\u00e9nom: "First name",
    Email: "Email",
    T\u00e9l\u00e9phone: "Phone",
    Adresse: "Address",
    Type: "Type",
    Statut: "Status",
    "\u00c9tat": "Condition",
    Date: "Date",
    Quantit\u00e9: "Quantity",
    Prix: "Price",
    Total: "Total",
    R\u00e9f\u00e9rence: "Reference",
    Marque: "Brand",
    Fournisseur: "Supplier",
    Groupe: "Group",
    Famille: "Family",
    Division: "Division",
    D\u00e9partement: "Department",
    Service: "Service",
    Unit\u00e9: "Unit",
    Responsable: "Manager",
    Utilisateur: "User",
    Utilisateurs: "Users",
    R\u00f4le: "Role",
    R\u00f4les: "Roles",
    Permissions: "Permissions",
    Devise: "Currency",
    Langue: "Language",
    Oui: "Yes",
    Non: "No",
    Aucun: "None",
    Aucune: "None",
    Tous: "All",
    Toutes: "All",
    Actif: "Active",
    Active: "Active",
    Actifs: "Active",
    Inactif: "Inactive",
    Inactive: "Inactive",
    Suspendu: "Suspended",
    Suspendus: "Suspended",
    Brouillon: "Draft",
    "En attente": "Pending",
    Valid\u00e9: "Approved",
    Valid\u00e9e: "Approved",
    Annul\u00e9: "Cancelled",
    Annul\u00e9e: "Cancelled",
    Re\u00e7u: "Received",
    Re\u00e7ue: "Received",
    Conforme: "Compliant",
    Manquant: "Missing",
    Surstock: "Overstock",
    Criticit\u00e9: "Criticality",
    Faible: "Low",
    Moyenne: "Medium",
    "\u00c9lev\u00e9e": "High",
    Critique: "Critical",
    "Date cr\u00e9ation": "Creation date",
    "Cr\u00e9\u00e9 par": "Created by",
    "Derni\u00e8re connexion": "Last login",
    "Nom d'utilisateur": "Username",
    "Fuseau horaire": "Time zone",
    "Langue par d\u00e9faut": "Default language",
    "Format date": "Date format",
    "Nom entreprise": "Company name",
    Entreprise: "Company",
    Notifications: "Notifications",
    Profil: "Profile",
    Param\u00e8tres: "Settings",
    Param\u00e8tre: "Settings",
    D\u00e9connexion: "Sign out",
    "Sauvegarde locale": "Local save",
    Sauvegarde: "Backup",
    "Param\u00e8tres g\u00e9n\u00e9raux": "General settings",
    "R\u00f4les & Permissions": "Roles & Permissions",
    "Journaux syst\u00e8me": "System logs",
    "Enregistrer les param\u00e8tres": "Save settings",
    "Exporter CSV": "Export CSV",
    "Exporter PDF": "Export PDF",
    "Ajouter un utilisateur": "Add user",
    "Ajouter une unit\u00e9": "Add unit",
    "Ajouter une division": "Add division",
    "Ajouter un d\u00e9partement": "Add department",
    "Ajouter un \u00e9quipement": "Add equipment",
    "Ajouter un organe": "Add component",
    "Ajouter un article": "Add item",
    "Ajouter le logo": "Add logo",
    "Aucune photo disponible": "No photo available",
    "Aucune donn\u00e9e disponible": "No data available",
    "Aucun r\u00e9sultat": "No results",
    "Aucune notification pour le moment.":
      "No notifications at the moment.",
    "S\u00e9lectionner": "Select",
    "S\u00e9lectionner un groupe": "Select a group",
    "S\u00e9lectionner une famille": "Select a family",
    "S\u00e9lectionner un fournisseur": "Select a supplier",
    "S\u00e9lectionner un responsable": "Select a manager",
    "S\u00e9lectionner la criticit\u00e9": "Select criticality",
    "S\u00e9lectionner l'\u00e9tat": "Select condition",
    "S\u00e9lectionner une unit\u00e9": "Select a unit",
    "S\u00e9lectionner un d\u00e9partement": "Select a department",
    "Unit\u00e9 de mesure": "Unit of measure",
    "Fournisseur principal": "Main supplier",
    D\u00e9signations: "Descriptions",
    Localisations: "Locations",
    "Num\u00e9ro t\u00e9l\u00e9phone": "Phone number",
    "Code entreprise": "Company code",
    "Code \u00e9quipement": "Equipment code",
    "Nom \u00e9quipement": "Equipment name",
    "Code organe": "Component code",
    "Nom organe": "Component name",
    "Code article": "Item code",
    "N\u00b0 s\u00e9rie": "Serial no.",
    "Prix d'achat": "Purchase price",
    "Date d'achat": "Purchase date",
    "Date de mise en service": "Commissioning date",
    "Dur\u00e9e de garantie": "Warranty period",
    "Pi\u00e8ces jointes": "Attachments",
    Photos: "Photos",
    "Documents associ\u00e9s": "Related documents",
    "Informations techniques et achats":
      "Technical and purchasing information",
    "Identification et statut": "Identification and status",
    "Type g\u00e9n\u00e9ral": "General information",
    "Type compl\u00e9mentaire": "Additional information",
    "Liste des utilisateurs": "User list",
    "Liste des unit\u00e9s": "Unit list",
    "Liste des divisions": "Division list",
    "Liste des d\u00e9partements": "Department list",
    "Liste des \u00e9quipements": "Equipment list",
    "Liste des organes": "Component list",
    "Liste des articles": "Item list",
    "Liste des groupes": "Group list",
    "Liste des familles": "Family list",
    "R\u00e9f\u00e9rentiel organisation": "Organization directory",
    "R\u00e9f\u00e9rentiel \u00e9quipement": "Equipment directory",
    "R\u00e9f\u00e9rentiel organe": "Component directory",
    "R\u00e9f\u00e9rentiel article": "Item directory",
    "Mouvements de stock": "Stock movements",
    "Entr\u00e9e stock": "Stock entry",
    "Sortie stock": "Stock issue",
    Transfert: "Transfer",
    Inventaire: "Inventory",
    Inventaires: "Inventories",
    Emplacement: "Location",
    Stockage: "Storage",
    "Stock actuel": "Current stock",
    "Stock minimum": "Minimum stock",
    "Demande d'achat": "Purchase request",
    "Demandes d'achat": "Purchase requests",
    "Bon de commande": "Purchase order",
    "Bons de commande": "Purchase orders",
    R\u00e9ception: "Receipt",
    R\u00e9ceptions: "Receipts",
    Historique: "History",
    "Tous les équipements": "All equipment",
    "Voir toutes": "View all",
    Demandeur: "Requester",
    "Date souhait\u00e9e": "Required date",
    "Quantit\u00e9 demand\u00e9e": "Requested quantity",
    "En attente validation": "Pending approval",
    "Valid\u00e9e": "Approved",
    "Plans de maintenance": "Maintenance plans",
    Calendrier: "Calendar",
    Compteurs: "Counters",
    "Ordre de travail": "Work order",
    "Bon de travail": "Work ticket",
    "Demande d'intervention": "work Request",
    "Vue globale de la maintenance": "Global maintenance overview",
    Wilaya: "Province",
    Daira: "District",
    Commune: "Municipality",
    "Informations verrouill\u00e9es": "Locked information",
    "Information verrouill\u00e9es": "Locked information",
    "Modification active": "Editing enabled",
    "Non d\u00e9fini": "Not defined",
    "Code non d\u00e9fini": "Code not defined",
    "R\u00f4le non d\u00e9fini": "Role not defined",
    "Cliquez sur > pour ouvrir un niveau": "Click > to open a level",
    "R\u00e9f\u00e9rentiel de premier niveau": "Top-level directory",
    "Directory of premier niveau": "Top-level directory",
    "Niveau de structuration interm\u00e9diaire":
      "Intermediate structure level",
    "Niveau of structuration interm\u00e9diaire":
      "Intermediate structure level",
    "Niveau interm\u00e9diaire": "Intermediate level",
    "Statut op\u00e9rationnel": "Operational status",
    "Status op\u00e9rationnel": "Operational status",
    "Nouvel \u00e9quipement": "New equipment",
    "Nouvel equipment": "New equipment",
    "Nouvel organe": "New component",
    "Nouvel component": "New component",
    "Nouvelle famille": "New family",
    "Nouvelle famille \u00e9quipement": "New equipment family",
    "Nouvelle famille organe": "New component family",
    "\u00c9l\u00e9ments r\u00e9f\u00e9renc\u00e9s": "Referenced items",
    "Elements r\u00e9f\u00e9renc\u00e9s": "Referenced items",
    "D\u00e9partements uniquement": "Departments only",
    "Departments uniquement": "Departments only",
    "Unit\u00e9s multiples possibles": "Multiple units possible",
    "Multiples units possibles": "Multiple units possible",
    "Responsables attribu\u00e9s": "Assigned managers",
    "Managers attribu\u00e9s": "Assigned managers",
    "Familles reli\u00e9es": "Linked families",
    "Families reli\u00e9es": "Linked families",
    "Familles reli\u00e9es \u00e0 un groupe": "Families linked to a group",
    "Rattachements actifs": "Active assignments",
    "Articles r\u00e9f\u00e9renc\u00e9s": "Referenced items",
    "Components r\u00e9f\u00e9renc\u00e9s": "Referenced components",
    "Organes r\u00e9f\u00e9renc\u00e9s": "Referenced components",
    "Le formulaire est d\u00e9coup\u00e9 entre les champs principaux et les informations compl\u00e9mentaires pour simplifier la saisie.":
      "The form is split between main fields and additional information to simplify data entry.",
    "The formulaire is d\u00e9coup\u00e9 between the fields principaux and the information":
      "The form is split between main fields and additional information",
    "compl\u00e9mentaires for simplifier the entry.":
      "to simplify data entry.",
    DI: "WR",
    OT: "WO",
    BT: "WT",
    DA: "PR",
    BC: "PO",
    REC: "Receipt",
  }),
);

const englishInterfacePatterns = [
  [/^Cr\u00e9er un OT depuis (.+)$/i, "Create a WO from $1"],
  [/^Cr\u00e9er un BT depuis (.+)$/i, "Create a WT from $1"],
  [/^Transformer en OT$/i, "Convert to WO"],
  [/^1 familles\s*·\s*1 \u00e9quipements$/i, "1 family · 1 equipment"],
  [/^1 familles\s*·\s*1 organes$/i, "1 family · 1 component"],
  [/^1 familles$/i, "1 family"],
  [/^1 organes$/i, "1 component"],
  [/^(\d+) familles\s*·\s*(\d+) \u00e9quipements$/i, "$1 families · $2 equipment"],
  [/^(\d+) familles\s*·\s*(\d+) organes$/i, "$1 families · $2 components"],
  [/^(\d+) familles$/i, "$1 families"],
  [/^(\d+) \u00e9quipements$/i, "$1 equipment"],
  [/^(\d+) organes$/i, "$1 components"],
  [/^Liste des (.+)$/i, "List of $1"],
  [/^Cr\u00e9\u00e9 le (.+)$/i, "Created on $1"],
  [/^Derni\u00e8re connexion (.+)$/i, "Last login $1"],
  [/^Ajouter (.+)$/i, "Add $1"],
  [/^Modifier (.+)$/i, "Edit $1"],
  [/^Supprimer (.+)$/i, "Delete $1"],
];

const englishInterfacePhraseTranslations = new Map(
  Object.entries({
    "Maintenez Ctrl ou Cmd pour sélectionner plusieurs organes.":
      "Hold Ctrl ou Cmd for select multiple component ",
    "Maintenez Ctrl ou Cmd pour sélectionner plusieurs équipements.":
      "Hold Ctrl or Cmd for select multiple equipment.",

    "Maintenez Ctrl ou Cmd pour sélectionner plusieurs départements.":
      "Hold Ctrl or Cmd for select multiple department.",

    "Maintenez Ctrl ou Cmd pour sélectionner plusieurs unités.":
      "Hold Ctrl or Cmd for select multiple units.",
    "Saisissez les informations du nouvel article.":
      "Enter the information of the new item.",
    "Saisissez les informations du nouvel organe.":
      "Enter the information of the new component.",
    "Saisissez les informations du nouveau groupe organe.":
      "Enter the information of the new group component.",
    "Saisissez les informations du nouvel équipement":
      "Enter the information of the new equipment",
    "Saisissez les informations de la nouvelle famille":
      "Enter the information of the new family",
    "Saisissez les informations du nouveau groupe.":
      "Enter the information of the new group.",
    "Saisissez les informations du nouveau département.":
      "Enter the information of the new department.",

    "Saisissez les informations de la nouvelle unité.":
      "Enter the information of the new unit.",

    "Saisissez les informations du nouveau groupe article.":
      "Enter the information of the new item group.",

    "Saisissez les informations de la nouvelle famille article.":
      "Enter the information of the new item family.",
    "Structure des actifs et des emplacements":
      "Asset and location structure",
    "Structure de l'entreprise et des \u00e9quipes":
      "Company and team structure",
    "Catalogue et suivi des \u00e9quipements":
      "Equipment catalog and tracking",
    "Gestion des organes et sous-ensembles":
      "Component and subassembly management",
    "R\u00e9f\u00e9rentiel des articles et consommables":
      "Item and consumables directory",
    "Param\u00e9trage du stock, mouvements et inventaire":
      "Stock settings, movements and inventory",
    "Cycle DA, BC, r\u00e9ceptions et historique":
      "Purchase request, purchase order, receipt and history workflow",
    "R\u00e9f\u00e9rentiel fournisseurs, catalogue, contrats et \u00e9valuations":
      "Supplier directory, catalog, contracts and evaluations",
    "Informations du compte connect\u00e9":
      "Connected account information",
    "Cycle complet DI, OT et BT avec suivi terrain":
      "Complete request, work order and report workflow with field tracking",
    "Gestion des utilisateurs, des r\u00f4les et des param\u00e8tres globaux":
      "User, role and global settings management",
    "Param\u00e8tres de valorisation du stock et r\u00e8gles de validation des interventions.":
      "Stock valuation settings and work order approval rules.",
    "Gestion de tous les comptes qui acc\u00e8dent au logiciel.":
      "Manage all accounts that access the software.",
    "D\u00e9finition de qui peut faire quoi dans chaque module de la plateforme.":
      "Define what each role can do in every platform module.",
    "Configuration globale du logiciel, des alertes et de la num\u00e9rotation.":
      "Global software, alert and numbering configuration.",
    "Configuration globale du logiciel, des alertes et de la num\u00e9rotation automatique.":
      "Global software, alert and automatic numbering configuration.",
    "Ajoutez les fichiers de r\u00e9f\u00e9rence de l'organe.":
      "Add the component reference files.",
    "D\u00e9finir qui peut faire quoi dans chaque module, avec une matrice \u00e9ditable par r\u00f4le.":
      "Define who can do what in each module, with an editable matrix by role.",
    "Choisissez un r\u00f4le, puis modifiez ses permissions via des boutons \u00e0 \u00e9tat.":
      "Choose a role, then edit its permissions with status buttons.",
    "Lecture large et cr\u00e9ation des DI/BT avec modification des OT affect\u00e9s.":
      "Broad read access plus WR/WRP creation and assigned WO editing.",
    "Stock uniquement": "Stock only",
    "G\u00e8re le stock, les mouvements et les validations de r\u00e9ception.":
      "Manages stock, movements and receipt approvals.",
    "Gestion des unit\u00e9s avec responsables et rattachements.":
      "Manage units, managers and assignments.",
    "Gestion des d\u00e9partements avec rattachement aux unit\u00e9s.":
      "Manage departments and unit assignments.",
    "Chaque d\u00e9partement peut \u00eatre rattach\u00e9 \u00e0 plusieurs unit\u00e9s.":
      "Each department can be assigned to multiple units.",
    "Chaque division peut appartenir \u00e0 plusieurs unit\u00e9s, avec un responsable unique et son email charg\u00e9 automatiquement.":
      "Each division can belong to multiple units, with one manager whose email is loaded automatically.",
    "Chaque unit\u00e9 conserve son code, ses coordonn\u00e9es et son responsable avec email synchronis\u00e9 automatiquement.":
      "Each unit keeps its code, contact details and manager, with email synchronized automatically.",
    "Chaque groupe associe plusieurs d\u00e9partements et sert de base aux familles puis aux \u00e9quipements.":
      "Each group links multiple departments and serves as the basis for families and equipment.",
    "Chaque famille d\u00e9pend d\u2019un groupe et pr\u00e9pare la cr\u00e9ation des fiches \u00e9quipements.":
      "Each family belongs to a group and supports equipment record creation.",
    "Chaque groupe organe peut \u00eatre associ\u00e9 \u00e0 plusieurs \u00e9quipements.":
      "Each component group can be linked to multiple equipment records.",
    "Chaque famille organe est rattach\u00e9e \u00e0 un groupe organe.":
      "Each component family belongs to a component group.",
    "Gestion des groupes d'\u00e9quipements avec affectation multi-divisions.":
      "Manage equipment groups assigned to multiple divisions.",
    "Gestion des familles d'\u00e9quipements rattach\u00e9es \u00e0 un groupe.":
      "Manage equipment families assigned to a group.",
    "Liste des \u00e9quipements avec fiche d\u00e9taill\u00e9e et formulaire en plusieurs sections.":
      "Equipment list with detailed records and a multi-section form.",
    "Gestion des groupes d'organes avec association multi-\u00e9quipements.":
      "Manage component groups associated with multiple equipment records.",
    "Gestion des familles d'organes rattach\u00e9es \u00e0 un groupe.":
      "Manage component families assigned to a group.",
    "Liste des organes avec formulaire complet et pi\u00e8ces jointes.":
      "Component list with a complete form and attachments.",
    "R\u00e9f\u00e9rentiel des plans, d\u00e9clenchements et gammes op\u00e9ratoires.":
      "Directory of plans, triggers and operating procedures.",
    "Vue des OT planifi\u00e9s, en cours et en retard sur plusieurs horizons.":
      "View scheduled, active and overdue work orders across multiple periods.",
    "Suivi des relev\u00e9s, seuils d'alerte et g\u00e9n\u00e9ration automatique d'OT.":
      "Track readings, alert thresholds and automatic work order generation.",
    "Param\u00e9trage du stock, emplacements et valorisation des articles.":
      "Stock, location and item valuation settings.",
    "Entr\u00e9es, sorties et transferts de stock avec tra\u00e7abilit\u00e9 compl\u00e8te.":
      "Stock entries, issues and transfers with full traceability.",
    "Cr\u00e9ation d\u2019inventaires et feuille de comptage terrain.":
      "Create inventories and field count sheets.",
    "Consultation des mouvements filtr\u00e9e par article, type, date ou utilisateur.":
      "View movements filtered by item, type, date or user.",
    "Cr\u00e9ation manuelle ou depuis le stock minimum. Les DA valid\u00e9es peuvent ensuite \u00eatre regroup\u00e9es dans un ou plusieurs BC.":
      "Create manually or from minimum stock. Approved purchase requests can then be grouped into one or more purchase orders.",
    "Cr\u00e9ation des commandes fournisseurs avec lien DA, totaux calcul\u00e9s et suivi de statut jusqu'\u00e0 r\u00e9ception compl\u00e8te.":
      "Create supplier orders linked to purchase requests, with calculated totals and status tracking through full receipt.",
    "R\u00e9ception de la marchandise li\u00e9e \u00e0 un BC avec contr\u00f4le qualit\u00e9, \u00e9carts de quantit\u00e9 et tra\u00e7abilit\u00e9 documentaire.":
      "Receive goods linked to a purchase order with quality control, quantity discrepancies and document traceability.",
    "Consultation des DA, BC et r\u00e9ceptions avec filtres par article, fournisseur, type document, statut, date et montant.":
      "View purchase requests, orders and receipts filtered by item, supplier, document type, status, date and amount.",
    "Demande d'intervention (DI)": "work request (WR)",
    "Ordres de travail (OT)": "Work orders (WO)",
    "Bons de travail (BT)": "Work Tickets (WT)",
    "Historique des interventions": "Intervention history",
    "Demandes d'achat (DA)": "Purchase requests (PR)",
    "Bons de commande (BC)": "Purchase orders (PO)",
    "Contrats & Garanties": "Contracts & Warranties",
    "Fiche fournisseur": "Supplier record",
    "Fiche entreprise": "Company profile",
    "Fiche stock": "Stock record",
    "Groupe \u00e9quipement": "Equipment group",
    "Famille \u00e9quipement": "Equipment family",
    "Groupes \u00e9quipement": "Equipment groups",
    "Familles \u00e9quipement": "Equipment families",
    "Groupe organe": "Component group",
    "Famille organe": "Component family",
    "Groupes organes": "Component groups",
    "Familles organes": "Component families",
    "Groupes articles": "Item groups",
    "Familles articles": "Item families",
    "Arborescence hi\u00e9rarchique": "Hierarchical asset tree",
    "Activit\u00e9 r\u00e9cente": "Recent activity",
    "Interventions r\u00e9centes": "Recent intervention",
    "Prochaines interventions": "Upcoming intervention",
    "\u00c9quipements critiques": "Critical equipment",
    "Disponibilit\u00e9 par zone": "Availability by area",
    "Planning de la semaine": "Weekly schedule",
    "Filtres & actions": "Filters & actions",
    "Filtres de consultation": "View filters",
    "Formulaire de cr\u00e9ation": "Creation form",
    "Tableau r\u00e9capitulatif": "Summary table",
    "Feuille de comptage": "Count sheet",
    "R\u00e9sultat inventaire": "Inventory result",
    "Historique des relev\u00e9s": "Reading history",
    "Saisie de relev\u00e9": "Enter reading",
    "Fiches compteur": "Meter records",
    "Fiches stock": "Stock records",
    "Flux de d\u00e9clenchement": "Trigger workflow",
    "Journal des interventions": "Work order log",
    "Informations de l'intervention": "Work order information",
    "Cr\u00e9ation et mise \u00e0 jour d'une demande d'intervention.":
      "Create and update a work request.",
    "V\u00e9rifiez les informations de la DI et compl\u00e9tez les d\u00e9tails de l'OT.":
      "Review the work request information and complete the work order details.",
    "V\u00e9rifiez les informations de l'OT et compl\u00e9tez les d\u00e9tails du Bon de Travail.":
      "Review the work order information and complete the work report details.",
    "SECTION 1 \u2014 Informations de la DI":
      "SECTION 1 - Work request information",
    "SECTION 1 \u2014 Informations de l'OT":
      "SECTION 1 - Work order information",
    "SECTION 2 \u2014 Champs \u00e0 remplir pour l'OT":
      "SECTION 2 - Work order fields",
    "SECTION 2 \u2014 Champs \u00e0 remplir pour le BT":
      "SECTION 2 - Work report fields",
    "Articles consomm\u00e9s": "Consumed items",
    "Travaux r\u00e9alis\u00e9s": "Work performed",
    "Cause de la panne": "Failure cause",
    "Actions correctives": "Corrective actions",
    "Consommation de pi\u00e8ces": "Parts consumption",
    "Co\u00fbt articles consomm\u00e9s :": "Consumed items cost:",
    "Co\u00fbt total intervention :": "Total work order cost:",
    "Signature technicien": "Technician signature",
    "Signature responsable": "Manager signature",
    "Date planifi\u00e9e": "Scheduled date",
    "Dur\u00e9e estim\u00e9e": "Estimated duration",
    "Dur\u00e9e r\u00e9elle": "Actual duration",
    "Type maintenance": "Maintenance type",
    "Technicien assign\u00e9": "Assigned technician",
    "Technicien par d\u00e9faut": "Default technician",
    "Demandeur": "Requester",
    "Cr\u00e9\u00e9e le": "Created on",
    "DI li\u00e9e": "Linked work request",
    "OT li\u00e9": "Linked work order",
    "BC li\u00e9": "Linked purchase order",
    "Plan li\u00e9": "Linked plan",
    "Document li\u00e9": "Linked document",
    "\u00c9quipement li\u00e9": "Linked equipment",
    "Organe li\u00e9": "Linked component",
    "Adresse compl\u00e8te": "Full address",
    "Adresse de livraison": "Delivery address",
    "Nom commercial": "Trading name",
    "Raison sociale": "Legal name",
    "Domaine d'activit\u00e9": "Business activity",
    "T\u00e9l\u00e9phone principal": "Primary phone",
    "T\u00e9l\u00e9phone secondaire": "Secondary phone",
    "Email direct": "Direct email",
    "Site web": "Website",
    "D\u00e9signation fournisseur": "Supplier name",
    "Code fournisseur": "Supplier code",
    "Type fournisseur": "Supplier type",
    "Contact fournisseur (t\u00e9l\u00e9phone)": "Supplier contact (phone)",
    "Email fournisseur": "Supplier email",
    "Catalogue fournisseur": "Supplier catalog",
    "Liste fournisseurs": "Supplier list",
    "Conditions de paiement": "Payment terms",
    "Mode de livraison": "Delivery method",
    "D\u00e9lai de livraison moyen (jours)":
      "Average delivery time (days)",
    "D\u00e9lai livraison sp\u00e9cifique": "Specific delivery time",
    "Frais de livraison": "Delivery fees",
    "Remise habituelle %": "Standard discount %",
    "Montant minimum (BC)": "Minimum amount (PO)",
    "R\u00e9f\u00e9rence fournisseur": "Supplier reference",
    "R\u00e9f fournisseur": "Supplier ref.",
    "Prix unitaire HT": "Unit price excluding tax",
    "Montant HT (auto)": "Amount excl. tax (auto)",
    "Total HT (auto)": "Total excl. tax (auto)",
    "Total TTC (auto)": "Total incl. tax (auto)",
    "Total HT": "Total excl. tax",
    "Total TTC": "Total incl. tax",
    "Qt\u00e9 command\u00e9e": "Ordered qty.",
    "Qt\u00e9 re\u00e7ue": "Received qty.",
    "Qt\u00e9 manquante": "Missing qty.",
    "Quantit\u00e9 command\u00e9e": "Ordered quantity",
    "Quantit\u00e9 re\u00e7ue": "Received quantity",
    "Quantit\u00e9 manquante (auto)": "Missing quantity (auto)",
    "Contr\u00f4le qualit\u00e9": "Quality control",
    "Bon de livraison fournisseur": "Supplier delivery note",
    "BL fournisseur": "Supplier delivery note",
    "Facture fournisseur": "Supplier invoice",
    "R\u00e9ceptionn\u00e9 par": "Received by",
    "Date r\u00e9ception": "Receipt date",
    "\u00c9tat r\u00e9ception": "Receipt status",
    "Regrouper DA valid\u00e9es": "Group approved purchase requests",
    "Regroupement de plusieurs DA valid\u00e9es pour un m\u00eame fournisseur.":
      "Group multiple approved purchase requests for the same supplier.",
    "Mouvements de stock": "Stock movements",
    "Type de mouvement": "Movement type",
    "Code mouvement": "Movement code",
    "Magasin source": "Source warehouse",
    "Magasin destination": "Destination warehouse",
    "Emplacement de stockage": "Storage location",
    "Emplacement stock": "Stock location",
    "Stock de s\u00e9curit\u00e9": "Safety stock",
    "Stock maximum": "Maximum stock",
    "Autoriser stock n\u00e9gatif": "Allow negative stock",
    "Blocage sortie si rupture": "Block issue when out of stock",
    "M\u00e9thode valorisation": "Valuation method",
    "PMP calcul\u00e9": "Calculated weighted average cost",
    "Valeur totale": "Total value",
    "Valeur actuelle": "Current value",
    "Valeur relev\u00e9e": "Reading value",
    "Valorisation actuelle": "Current valuation",
    "valorisation actuelle": "current valuation",
    "valorisation estim\u00e9e": "estimated valuation",
    "Stock et interventions": "Stock and work orders",
    "Workflow m\u00e9tier": "Business workflow",
    "R\u00e8gles de validation": "Approval rules",
    "Validation r\u00e9ception obligatoire": "Receipt approval required",
    "DI obligatoire avant OT": "Work request required before work order",
    "Signature BT obligatoire": "Work report signature required",
    "Photos obligatoires dans BT": "Photos required in work report",
    "Checklist s\u00e9curit\u00e9 obligatoire": "Safety checklist required",
    "D\u00e9lai max DI non trait\u00e9e (jours)":
      "Maximum unprocessed request delay (days)",
    "Alerte seuil compteur": "Meter threshold alert",
    "Seuil alerte": "Alert threshold",
    "Seuil action": "Action threshold",
    "Valeur catalogue": "Catalog value",
    "Valeur contrat": "Contract value",
    "D\u00e9clenchement compteur": "Meter trigger",
    "D\u00e9clenchement syst\u00e9matique": "Scheduled trigger",
    "D\u00e9clenchement automatique bas\u00e9 sur l'usage":
      "Automatic usage-based trigger",
    "Gamme op\u00e9ratoire": "Operating procedure",
    "Gamme op\u00e9ratoire compl\u00e8te": "Complete operating procedure",
    "Consignation \u00e9lectrique": "Electrical lockout",
    "Permis de travail": "Work permit",
    "EPI requis": "Required PPE",
    "Checklist s\u00e9curit\u00e9": "Safety checklist",
    "Date de d\u00e9but": "Start date",
    "Date de fin": "End date",
    "Date d\u00e9but": "Start date",
    "Date fin": "End date",
    "Date commande": "Order date",
    "Date livraison souhait\u00e9e": "Requested delivery date",
    "Date inventaire": "Inventory date",
    "Date cl\u00f4ture": "Closing date",
    "Cl\u00f4tur\u00e9 le": "Closed on",
    "Derni\u00e8re mise \u00e0 jour": "Last update",
    "Prochaine \u00e9ch\u00e9ance": "Next due date",
    "\u00c9ch\u00e9ances proches": "Upcoming due dates",
    "P\u00e9riode \u00e9valu\u00e9e": "Evaluation period",
    "\u00c9valuation fournisseur": "Supplier evaluation",
    "\u00c9valuateur": "Evaluator",
    "Note globale": "Overall rating",
    "Note moyenne": "Average rating",
    "Historique des \u00e9valuations et note globale automatique.":
      "Evaluation history and automatic overall rating.",
    "Objet du contrat": "Contract purpose",
    "Type contrat": "Contract type",
    "Date d\u00e9but garantie": "Warranty start date",
    "Date fin garantie": "Warranty end date",
    "Dur\u00e9e garantie (mois)": "Warranty duration (months)",
    "Conditions de garantie": "Warranty terms",
    "Renouvellement auto": "Automatic renewal",
    "Alerte expiration (jours)": "Expiry alert (days)",
    "Garanties li\u00e9es aux \u00e9quipements et documents associ\u00e9s.":
      "Warranties linked to equipment and related documents.",
    "Contrats cadres, maintenance et partenariats.":
      "Framework contracts, maintenance and partnerships.",
    "Permissions par module": "Permissions by module",
    "Permissions actives": "Active permissions",
    "Droits actifs": "Active permissions",
    "Droits modifiables": "Editable permissions",
    "R\u00f4les pr\u00e9d\u00e9finis": "Predefined roles",
    "Profils pr\u00e9d\u00e9finis": "Predefined profiles",
    "R\u00f4les verrouill\u00e9s": "Locked roles",
    "Verrouill\u00e9s par d\u00e9faut": "Locked by default",
    "Responsable de maintenance": "Maintenance manager",
    "Technicien de maintenance": "Maintenance technician",
    "Gestionnaire de stock": "Stock manager",
    "Lecture seule": "Read only",
    "Recherche des journaux": "Log search",
    "Type d'action": "Action type",
    "Date et heure": "Date and time",
    "Avant:": "Before:",
    "Apr\u00e8s:": "After:",
    "Export donn\u00e9es": "Export data",
    "Import donn\u00e9es": "Import data",
    "Effacer historique": "Clear history",
    "R\u00e9initialisation": "Reset",
    "Modifications enregistr\u00e9es automatiquement":
      "Changes saved automatically",
    "Non renseign\u00e9": "Not provided",
    "Profil introuvable": "Profile not found",
    "Utilisateur connect\u00e9": "Connected user",
    "Dates de compte": "Account dates",
    "Code entreprise associ\u00e9": "Linked company code",
    "Total des utilisateurs enregistr\u00e9s": "Total registered users",
    "Connexions autoris\u00e9es": "Authorized logins",
    "Acc\u00e8s temporairement bloqu\u00e9s":
      "Temporarily blocked access",
    "Couverture fonctionnelle": "Functional coverage",
    "Comptes enregistr\u00e9s": "Registered accounts",
    "R\u00f4les utilis\u00e9s": "Roles in use",
    "Aucun journal trouv\u00e9": "No logs found",
    "Adaptez les filtres pour afficher d'autres entr\u00e9es.":
      "Adjust the filters to display other entries.",
    "Aucun fournisseur disponible.": "No supplier available.",
    "Aucun inventaire s\u00e9lectionn\u00e9.": "No inventory selected.",
    "Aucun relev\u00e9 enregistr\u00e9": "No reading recorded",
    "Aucune intervention visible": "No work order visible",
    "Aucune ligne catalogue.": "No catalog line.",
    "Aucune ligne de comptage.": "No count line.",
    "Aucune t\u00e2che sur cette date": "No task on this date",
    "Aucun mouvement ne correspond aux filtres actuels.":
      "No movement matches the current filters.",
    "Les fiches stock appara\u00eetront ici avec les actions voir, modifier et supprimer.":
      "Stock records will appear here with view, edit and delete actions.",
    "Structuration compl\u00e8te des plans, de la r\u00e8gle de d\u00e9clenchement jusqu'\u00e0 la g\u00e9n\u00e9ration des OT.":
      "Complete plan structure, from the trigger rule through WO generation.",
    "OT planifi\u00e9s, en cours et en retard, avec pr\u00e9paration pour glisser-d\u00e9poser et cr\u00e9ation depuis une date.":
      "Scheduled, active and overdue WO, prepared for drag-and-drop and date-based creation.",
    "La vue courante ne contient pas d'OT planifi\u00e9s.":
      "The current view contains no scheduled WO.",
    "Plan actif \u2192 \u00e9ch\u00e9ance atteinte \u2192 OT g\u00e9n\u00e9r\u00e9 automatiquement \u2192 notification \u2192 assignation technicien \u2192 visible dans le calendrier.":
      "Active plan -> due date reached -> WO generated automatically -> notification -> technician assignment -> visible in the calendar.",
    "Relev\u00e9 saisi \u2192 seuil action atteint \u2192 OT g\u00e9n\u00e9r\u00e9 \u2192 compteur remis \u00e0 z\u00e9ro apr\u00e8s cl\u00f4ture BT \u2192 prochain d\u00e9clenchement recalcul\u00e9.":
      "Reading entered -> action threshold reached -> WO generated -> meter reset after WRP closure -> next trigger recalculated.",
    "Les relev\u00e9s alimentent les seuils d'alerte et d'action, avec g\u00e9n\u00e9ration d'OT quand la valeur critique est atteinte.":
      "Readings feed alert and action thresholds, with WO generation when the critical value is reached.",
    "Si le seuil d'action est d\u00e9pass\u00e9, un OT est ajout\u00e9 \u00e0 la file planifi\u00e9e et le plan concern\u00e9 reste tra\u00e7able dans l'historique.":
      "If the action threshold is exceeded, a WO is added to the planned queue and the related plan remains traceable in history.",
    "Le compteur li\u00e9 pourra d\u00e9clencher un OT automatique.":
      "The linked meter can trigger an automatic WO.",
    "Cliquez une date pour voir le contenu planifi\u00e9 et ajoutez une t\u00e2che directement sur cette journ\u00e9e.":
      "Click a date to view scheduled content and add a task directly to that day.",
    "Vous pouvez s\u00e9lectionner une date puis ajouter une t\u00e2che ou un OT planifi\u00e9.":
      "You can select a date, then add a task or a scheduled WO.",
    "La date s\u00e9lectionn\u00e9e reste active pendant la navigation du calendrier.":
      "The selected date remains active while navigating the calendar.",
    "OT du mois": "WO this month",
    "Liste des DA": "PR list",
    "Liste des BC": "PO list",
    "Liste des DI": "WR list",
    "Liste des OT": "WO list",
    "Liste des BT": "WT list",
    "S\u00e9lectionner un BC": "Select a PO",
    "S\u00e9lectionner une DA": "Select a PR",
    "Fournisseur (auto BC)": "Supplier (auto PO)",
    "Article (auto BC)": "Item (auto PO)",
    "DA li\u00e9e": "Linked PR",
    "Date impression": "Print date",
    "Num\u00e9ro DI li\u00e9": "Linked WR number",
    "Num\u00e9ro OT li\u00e9": "Linked WO number",
    "Num\u00e9ro OT": "WO number",
    "Num\u00e9ro BT": "WRP number",
    "Titre / R\u00e9f DI": "Title / WR ref.",
    "RIB / Coordonn\u00e9es bancaires": "Bank details / account information",
    "Point de d\u00e9part du flux achat, avec cr\u00e9ation manuelle ou automatique depuis le stock.":
      "Starting point of the purchasing workflow, with manual or automatic creation from stock.",
    "Commandes fournisseurs, regroupement des DA et suivi des statuts de livraison.":
      "Supplier orders, PR grouping and delivery status tracking.",
    "Enregistrement de la marchandise re\u00e7ue, contr\u00f4le qualit\u00e9 et mise \u00e0 jour du stock.":
      "Record received goods, quality control and stock updates.",
    "Consultation consolid\u00e9e DA/BC/REC avec filtres multi-crit\u00e8res et export.":
      "Consolidated PR/PO/receipt view with multi-criteria filters and export.",
    "Quantit\u00e9 en stock": "Quantity in stock",
    "Sous-pages stock": "Stock subpages",
    "Objectif, consignes, date limite de saisie terrain...":
      "Objective, instructions and field entry deadline...",
    "BC (bon de commande / r\u00e9ception)": "PO (purchase order / receipt)",
    "BT (bon de sortie)": "Issue note",
    "BT / BC / inventaire...": "WRP / PO / inventory...",
    "DA en attente": "Pending PR",
    "DA urgentes": "Urgent PR",
    "DA valid\u00e9es": "Approved PR",
    "BC envoy\u00e9s": "Sent PO",
    "BC re\u00e7us complets": "Fully received PO",
    "Nom ou r\u00e9f\u00e9rence article": "Item name or reference",
    "Cr\u00e9ation, validation et transformation en OT avec \u00e9quipements, organes et demandeur li\u00e9s au r\u00e9f\u00e9rentiel.":
      "Create, approve and convert to WO with equipment, components and requester linked to the directory.",
    "Vue consolid\u00e9e des DI, OT et BT avec filtres et export Excel / PDF.":
      "Consolidated WR, WO and WRP view with filters and Excel / PDF export.",
    "Total DI": "Total WR",
    "Total OT": "Total WO",
    "Total BT": "Total WRP",
    "Aucune fiche stock": "No stock record",
    "Aucun contrat.": "No contract.",
    "Aucune garantie.": "No warranty.",
    "Aucune \u00e9valuation.": "No evaluation.",
    "Aujourd'hui": "Today",
    "Pr\u00e9c\u00e9dent": "Previous",
    "Suivant": "Next",
    "Voir toutes": "View all",
    "Appliquer les filtres": "Apply filters",
    "Cr\u00e9er le mouvement": "Create movement",
    "Cr\u00e9er un inventaire": "Create inventory",
    "Nouveau inventaire": "New inventory",
    "Nouveau mouvement": "New movement",
    "Nouvelle fiche stock": "New stock record",
    "Nouveau plan": "New plan",
    "Nouvelle ligne": "New line",
    "Ajouter une t\u00e2che": "Add task",
    "Ajouter sur cette date": "Add on this date",
    "Ajouter un relev\u00e9": "Add reading",
    "Enregistrer le relev\u00e9": "Save reading",
    "Cr\u00e9er la fiche": "Create record",
    "Imprimer la fiche": "Print record",
    "Transformer en OT": "Convert to work order",
    "Cr\u00e9er OT": "Create work order",
    "Cr\u00e9er BT": "Create work report",
    "Cl\u00f4turer": "Close",
    "Confirmer et cr\u00e9er OT": "Confirm and create work order",
    "Confirmer et cr\u00e9er BT": "Confirm and create work report",
    "Cette page centralise les plans qui organisent les interventions de maintenance.":
      "This page centralizes the plans that organize maintenance interventions.",
    "Référentiel de base, contacts, légaux et conditions commerciales.":
      "Basic repository, contacts, legal and commercial terms.",
    "Demande d'intervention":
      "Work Request ",
    "Ordre de travail":
      "Work order",
    "Bon de travail":
      "Work ticket",
    "Demandes d'intervention (DI)":
      "Work Request (WR)"

  }),
);

const englishInterfaceWordTranslations = new Map(
  Object.entries({
    "\u00e0": "to",
    afin: "to",
    ainsi: "thus",
    alors: "then",
    apr\u00e8s: "after",
    au: "to the",
    aucun: "no",
    aucune: "no",
    aux: "to the",
    avec: "with",
    bas\u00e9: "based",
    bas\u00e9e: "based",
    ce: "this",
    ces: "these",
    cet: "this",
    cette: "this",
    chaque: "each",
    charg\u00e9: "loaded",
    charg\u00e9e: "loaded",
    comme: "as",
    concern\u00e9: "affected",
    concern\u00e9e: "affected",
    concern\u00e9s: "affected",
    contient: "contains",
    d: "of",
    dans: "in",
    de: "of",
    depuis: "from",
    des: "of",
    directement: "directly",
    doit: "must",
    du: "of the",
    durant: "during",
    d\u00e9pass\u00e9: "exceeded",
    d\u00e9pass\u00e9e: "exceeded",
    en: "in",
    entre: "between",
    est: "is",
    et: "and",
    fait: "done",
    ici: "here",
    il: "it",
    ils: "they",
    jusqu: "until",
    l: "the",
    la: "the",
    le: "the",
    les: "the",
    leur: "their",
    leurs: "their",
    lors: "when",
    m\u00eame: "same",
    ne: "not",
    ni: "nor",
    non: "no",
    notamment: "including",
    nous: "we",
    ou: "or",
    o\u00f9: "where",
    par: "by",
    parce: "because",
    pendant: "during",
    peut: "can",
    peuvent: "can",
    plus: "more",
    plusieurs: "multiple",
    pour: "for",
    pourra: "can",
    pr\u00e9paration: "preparation",
    puis: "then",
    quand: "when",
    que: "that",
    quel: "which",
    quelle: "which",
    qui: "that",
    reste: "remains",
    sans: "without",
    se: "itself",
    selon: "depending on",
    sera: "will be",
    ses: "its",
    si: "if",
    son: "its",
    sont: "are",
    sous: "under",
    sur: "on",
    tous: "all",
    tout: "all",
    toute: "all",
    toutes: "all",
    un: "a",
    une: "a",
    via: "through",
    vos: "your",
    votre: "your",
    vous: "you",
    "\u00eatre": "be",
    da: "PR",
    di: "WR",
    ot: "WO",
    bt: "Wt",
    bc: "PO",
    rec: "receipt",
    acc\u00e8s: "access",
    actif: "active",
    actifs: "active",
    active: "active",
    actives: "active",
    activit\u00e9: "activity",
    affich\u00e9: "displayed",
    affich\u00e9e: "displayed",
    affich\u00e9es: "displayed",
    afficher: "display",
    ajoutez: "add",
    ajout\u00e9: "added",
    ajouter: "add",
    alimentent: "feed",
    alerte: "alert",
    alertes: "alerts",
    annuler: "cancel",
    attente: "pending",
    matières: "materials",
    anomalie: "issue",
    anomalies: "issues",
    article: "item",
    articles: "items",
    associ\u00e9: "linked",
    associ\u00e9e: "linked",
    associ\u00e9es: "linked",
    associ\u00e9s: "linked",
    automatique: "automatic",
    automatiquement: "automatically",
    autoriser: "allow",
    autre: "other",
    avant: "before",
    bon: "report",
    bons: "reports",
    calendrier: "calendar",
    catalogue: "catalog",
    cause: "cause",
    champs: "fields",
    choisir: "choose",
    choisissez: "choose",
    cliquez: "click",
    cl\u00f4ture: "closing",
    cl\u00f4tur\u00e9: "closed",
    code: "code",
    commande: "order",
    commandes: "orders",
    commentaire: "comment",
    commentaires: "comments",
    complet: "complete",
    compl\u00e8te: "complete",
    compl\u00e8tes: "complete",
    compte: "account",
    comptes: "accounts",
    comptage: "count",
    compteur: "meter",
    compteurs: "meters",
    conditionnel: "condition-based",
    conditions: "terms",
    conforme: "compliant",
    conformes: "compliant",
    connexion: "login",
    connexions: "logins",
    consomm\u00e9: "consumed",
    consomm\u00e9s: "consumed",
    consignes: "instructions",
    consultation: "view",
    consulter: "view",
    contact: "contact",
    contrat: "contract",
    contrats: "contracts",
    contr\u00f4le: "control",
    corrective: "corrective",
    correctives: "corrective",
    courante: "current",
    courant: "current",
    cr\u00e9er: "create",
    cr\u00e9ation: "creation",
    cr\u00e9er: "create",
    cr\u00e9\u00e9: "created",
    cr\u00e9\u00e9e: "created",
    cr\u00e9\u00e9s: "created",
    criticit\u00e9: "criticality",
    critique: "critical",
    date: "date",
    d\u00e9but: "start",
    d\u00e9clenchement: "trigger",
    d\u00e9clenchements: "triggers",
    d\u00e9faut: "failure",
    d\u00e9lai: "delay",
    d\u00e9clencher: "trigger",
    d\u00e9finir: "define",
    demande: "request",
    demandes: "requests",
    demand\u00e9e: "requested",
    d\u00e9partement: "department",
    d\u00e9partements: "departments",
    derni\u00e8re: "last",
    dernier: "last",
    description: "description",
    d\u00e9part: "start",
    d\u00e9signation: "description",
    d\u00e9signations: "descriptions",
    d\u00e9tail: "detail",
    d\u00e9tails: "details",
    devise: "currency",
    disponibilit\u00e9: "availability",
    division: "division",
    divisions: "divisions",
    document: "document",
    documents: "documents",
    donn\u00e9es: "data",
    droits: "permissions",
    dur\u00e9e: "duration",
    \u00e9cart: "discrepancy",
    \u00e9carts: "discrepancies",
    \u00e9ch\u00e9ance: "due date",
    \u00e9ch\u00e9ances: "due dates",
    effacer: "clear",
    \u00e9lev\u00e9e: "high",
    email: "email",
    emplacement: "location",
    emplacements: "locations",
    enregistrement: "record",
    enregistrements: "records",
    enregistrer: "save",
    entr\u00e9e: "entry",
    entr\u00e9es: "entries",
    entreprise: "company",
    \u00e9quipement: "equipment",
    \u00e9quipements: "equipment",
    estim\u00e9e: "estimated",
    \u00e9tat: "condition",
    \u00e9valuation: "evaluation",
    \u00e9valuations: "evaluations",
    \u00e9v\u00e9nements: "events",
    expiration: "expiry",
    export: "export",
    famille: "family",
    familles: "families",
    faible: "low",
    fiche: "record",
    fiches: "records",
    filtre: "filter",
    filtres: "filters",
    classés: "classified",
    intermédiaire: "intermediate",
    fournisseur: "supplier",
    fournisseurs: "suppliers",
    fr\u00e9quence: "frequency",
    garantie: "warranty",
    garanties: "warranties",
    g\u00e9n\u00e9ration: "generation",
    g\u00e9n\u00e9r\u00e9: "generated",
    g\u00e9n\u00e9r\u00e9e: "generated",
    glisser: "drag",
    gestion: "management",
    groupe: "group",
    groupes: "groups",
    haute: "high",
    heure: "time",
    historique: "history",
    identification: "identification",
    import: "import",
    impression: "print",
    imprimer: "print",
    inactif: "inactive",
    journ\u00e9e: "day",
    intervention: "work order",
    interventions: "work orders",
    inventaire: "inventory",
    inventaires: "inventories",
    journal: "log",
    journaux: "logs",
    justification: "reason",
    langue: "language",
    lecture: "read",
    lien: "link",
    liens: "links",
    ligne: "line",
    lignes: "lines",
    liste: "list",
    livraison: "delivery",
    localisation: "location",
    localisations: "locations",
    magasin: "warehouse",
    manquant: "missing",
    manquante: "missing",
    manquants: "missing",
    marque: "brand",
    matrice: "matrix",
    marchandise: "goods",
    message: "message",
    minimum: "minimum",
    mise: "update",
    modification: "change",
    modifications: "changes",
    modifier: "edit",
    modifiez: "edit",
    module: "module",
    modules: "modules",
    montant: "amount",
    mouvement: "movement",
    mouvements: "movements",
    moyenne: "average",
    nom: "name",
    note: "rating",
    notes: "ratings",
    nouveau: "new",
    nouvelle: "new",
    num\u00e9ro: "number",
    objet: "purpose",
    obligatoire: "required",
    obligatoires: "required",
    observations: "observations",
    op\u00e9rations: "operations",
    optionnel: "optional",
    organe: "component",
    organes: "components",
    origine: "source",
    panne: "failure",
    param\u00e8tres: "settings",
    parc: "fleet",
    p\u00e9riode: "period",
    permissions: "permissions",
    photo: "photo",
    photos: "photos",
    pi\u00e8ce: "part",
    pi\u00e8ces: "parts",
    plan: "plan",
    planification: "planning",
    planifi\u00e9: "scheduled",
    planifi\u00e9e: "scheduled",
    planifi\u00e9s: "scheduled",
    plans: "plans",
    pr\u00e9c\u00e9dent: "previous",
    pr\u00e9dictif: "predictive",
    pr\u00e9dictive: "predictive",
    pr\u00e9ventif: "preventive",
    pr\u00e9ventive: "preventive",
    principal: "primary",
    priorit\u00e9: "priority",
    prix: "price",
    prochaine: "next",
    prochaines: "upcoming",
    profil: "profile",
    profils: "profiles",
    quantit\u00e9: "quantity",
    raison: "reason",
    r\u00e9approvisionnement: "replenishment",
    r\u00e9ception: "receipt",
    r\u00e9ceptions: "receipts",
    re\u00e7u: "received",
    re\u00e7ue: "received",
    re\u00e7us: "received",
    recommandation: "recommendation",
    r\u00e9f\u00e9rence: "reference",
    r\u00e9f\u00e9rences: "references",
    r\u00e9f\u00e9rentiel: "directory",
    r\u00e9glementaire: "regulatory",
    relev\u00e9: "reading",
    relev\u00e9e: "reading",
    relev\u00e9s: "readings",
    remise: "discount",
    renouvellement: "renewal",
    r\u00e9pertoire: "directory",
    responsable: "manager",
    responsables: "managers",
    ressources: "resources",
    r\u00e9sum\u00e9: "summary",
    r\u00f4le: "role",
    r\u00f4les: "roles",
    saisie: "entry",
    saisi: "entered",
    sauvegarde: "backup",
    s\u00e9curit\u00e9: "safety",
    s\u00e9lectionner: "select",
    service: "department",
    seuil: "threshold",
    seuils: "thresholds",
    signature: "signature",
    signatures: "signatures",
    sortie: "issue",
    sorties: "issues",
    statut: "status",
    statuts: "statuses",
    stock: "stock",
    suivant: "next",
    suivi: "tracking",
    supprimer: "delete",
    suspendu: "suspended",
    suspendus: "suspended",
    surcharge: "overload",
    surstock: "overstock",
    surstocks: "overstock",
    syst\u00e8me: "system",
    syst\u00e9matique: "scheduled",
    t\u00e2che: "task",
    t\u00e2ches: "tasks",
    technique: "technical",
    techniques: "technical",
    technicien: "technician",
    techniciens: "technicians",
    t\u00e9l\u00e9phone: "phone",
    termin\u00e9: "completed",
    termin\u00e9e: "completed",
    termin\u00e9s: "completed",
    th\u00e9orique: "theoretical",
    titre: "title",
    total: "total",
    tra\u00e7abilit\u00e9: "traceability",
    tra\u00e7able: "traceable",
    transfert: "transfer",
    transferts: "transfers",
    transformer: "convert",
    travaux: "work",
    type: "type",
    unit\u00e9: "unit",
    unit\u00e9s: "units",
    urgence: "urgency",
    usure: "wear",
    utilisateur: "user",
    utilisateurs: "users",
    validation: "approval",
    valider: "approve",
    valeur: "value",
    valorisation: "valuation",
    verrouill\u00e9s: "locked",
    affect\u00e9: "assigned",
    affect\u00e9e: "assigned",
    affect\u00e9s: "assigned",
    appartenir: "belong",
    calcul\u00e9: "calculated",
    calcul\u00e9e: "calculated",
    commune: "municipality",
    communes: "municipalities",
    compl\u00e9mentaire: "additional",
    compl\u00e9mentaires: "additional",
    coordonn\u00e9es: "contact details",
    daira: "district",
    d\u00e9coup\u00e9: "split",
    d\u00e9coup\u00e9e: "split",
    d\u00e9fini: "defined",
    d\u00e9finie: "defined",
    \u00e9l\u00e9ment: "item",
    \u00e9l\u00e9ments: "items",
    enregistr\u00e9: "saved",
    enregistr\u00e9e: "saved",
    enregistr\u00e9es: "saved",
    enregistr\u00e9s: "saved",
    fig\u00e9: "fixed",
    fig\u00e9e: "fixed",
    formulaire: "form",
    global: "global",
    globale: "global",
    information: "information",
    informations: "information",
    joint: "attached",
    jointe: "attached",
    jointes: "attached",
    li\u00e9: "linked",
    li\u00e9e: "linked",
    li\u00e9es: "linked",
    li\u00e9s: "linked",
    maximum: "maximum",
    n\u00e9gatif: "negative",
    n\u00e9gatifs: "negative",
    niveau: "level",
    nouvel: "new",
    ouvrir: "open",
    ouvert: "open",
    ouverte: "open",
    ouvertes: "open",
    ouverts: "open",
    positif: "positive",
    positifs: "positive",
    pr\u00eat: "ready",
    pr\u00eate: "ready",
    principale: "primary",
    principaux: "main",
    possible: "possible",
    possibles: "possible",
    premier: "first",
    r\u00e9f\u00e9renc\u00e9: "referenced",
    r\u00e9f\u00e9renc\u00e9e: "referenced",
    r\u00e9f\u00e9renc\u00e9es: "referenced",
    r\u00e9f\u00e9renc\u00e9s: "referenced",
    reli\u00e9: "linked",
    reli\u00e9e: "linked",
    reli\u00e9es: "linked",
    reli\u00e9s: "linked",
    rattach\u00e9: "assigned",
    rattach\u00e9e: "assigned",
    rattach\u00e9es: "assigned",
    rattach\u00e9s: "assigned",
    recalcul\u00e9: "recalculated",
    remis: "reset",
    retard: "late",
    r\u00e8gle: "rule",
    r\u00e8gles: "rules",
    simplifier: "simplify",
    souhait\u00e9: "requested",
    souhait\u00e9e: "requested",
    synchronis\u00e9: "synchronized",
    synchronis\u00e9e: "synchronized",
    structuration: "structure",
    unique: "single",
    uniquement: "only",
    verrouill\u00e9: "locked",
    verrouill\u00e9e: "locked",
    verrouill\u00e9es: "locked",
    visible: "visible",
    visibles: "visible",
    wilaya: "province",
    voir: "view",
  }),
);

function preserveTranslationCase(source, translation) {
  if (source === source.toUpperCase()) return translation.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return `${translation.charAt(0).toUpperCase()}${translation.slice(1)}`;
  }
  return translation;
}

function translateInterfaceFallback(value) {
  let output = String(value ?? "");

  [...englishInterfacePhraseTranslations.entries()]
    .sort(([left], [right]) => right.length - left.length)
    .forEach(([from, to]) => {
      output = output.split(from).join(to);
    });

  output = output.replace(/[\p{L}\u00c0-\u00ff]+/gu, (word) => {
    const translation = englishInterfaceWordTranslations.get(
      word.toLocaleLowerCase("fr-FR"),
    );
    return translation ? preserveTranslationCase(word, translation) : word;
  });

  return output;
}

function translateInterfaceValue(value, allowFallback = true) {
  const source = String(value ?? "");
  const trimmed = source.trim();
  if (!trimmed) return source;

  let translated = englishInterfaceTranslations.get(trimmed);
  if (!translated) {
    for (const [pattern, replacement] of englishInterfacePatterns) {
      if (pattern.test(trimmed)) {
        translated = trimmed.replace(pattern, replacement);
        break;
      }
    }
  }
  if (allowFallback) {
    translated = translateInterfaceFallback(translated || trimmed);
  }
  if (!translated || translated === trimmed) return source;

  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function shouldUseInterfaceFallback(element) {
  if (!element) return false;
  if (
    element.closest(
      "label, button, option, th, h1, h2, h3, h4, h5, h6, p, .nav-item, .org-field-hint, .blank-note, .status-badge, .equipment-section-kicker, .org-section-kicker, .page-title, .page-sub, .dropdown-title, .dropdown-item, .supplier-tab, .org-tabs",
    )
  ) {
    return true;
  }

  if (element.closest("tbody td")) return false;

  return ["SPAN", "DIV", "STRONG", "SMALL"].includes(element.tagName);
}

function translateRenderedInterface(root = document) {
  if (getAdministrationLanguageKey() !== "en" || !root) return;

  const elementRoot =
    root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE
      ? root
      : root.parentElement;
  if (!elementRoot) return;

  const walker = document.createTreeWalker(
    elementRoot,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (
          !parent ||
          ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName) ||
          parent.isContentEditable
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const translated = translateInterfaceValue(
      node.nodeValue,
      shouldUseInterfaceFallback(node.parentElement),
    );
    if (translated !== node.nodeValue) node.nodeValue = translated;
  });

  const elements =
    elementRoot.nodeType === Node.ELEMENT_NODE
      ? [elementRoot, ...elementRoot.querySelectorAll("*")]
      : [...elementRoot.querySelectorAll("*")];
  elements.forEach((element) => {
    ["placeholder", "title", "aria-label", "data-tooltip"].forEach(
      (attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const current = element.getAttribute(attribute);
        const translated = translateInterfaceValue(current);
        if (translated !== current) element.setAttribute(attribute, translated);
      },
    );
  });
}

let interfaceTranslationObserver = null;

function startInterfaceTranslationObserver() {
  if (interfaceTranslationObserver || !document.body) return;
  interfaceTranslationObserver = new MutationObserver((mutations) => {
    if (getAdministrationLanguageKey() !== "en") return;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => translateRenderedInterface(node));
    });
  });
  interfaceTranslationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function applyLocalizedShell(state = null) {
  const languageKey = getAdministrationLanguageKey(state);
  const locale = getAdministrationLocale(state);
  const text = administrationUiText[languageKey] || administrationUiText.fr;

  administrationLocaleCache = locale;

  if (document.documentElement) {
    document.documentElement.lang = locale.startsWith("en") ? "en" : "fr";
  }

  if (document.title) {
    document.title = `MaintFlow — ${text.appTitleSuffix}`;
  }

  navItems.forEach((item) => {
    const pageKey = item.dataset.page || "dashboard";
    const label =
      text.pages[pageKey]?.[0] ||
      item.dataset.tooltip ||
      item.textContent.trim();
    const navLabel = item.querySelector(".nav-label");
    if (navLabel) navLabel.textContent = label;
    item.dataset.tooltip = label;
  });

  const sections = Array.from(document.querySelectorAll(".nav-section-label"));
  ["principal", "actifs", "operations", "ressources", "systeme"].forEach(
    (key, index) => {
      if (sections[index]) sections[index].textContent = text.navSections[key];
    },
  );

  const sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebarToggle) sidebarToggle.title = text.sidebarToggle;

  const greetingMain = document.querySelector(".greeting-main");
  if (greetingMain) greetingMain.textContent = text.topbar.greetingMain;
  const greetingSub = document.querySelector(".greeting-sub");
  if (greetingSub) greetingSub.textContent = text.topbar.greetingSub;
  const searchInput = document.querySelector(".topbar-search input");
  if (searchInput) searchInput.placeholder = text.topbar.searchPlaceholder;

  const notifBtnLabel = document.getElementById("notifBtn");
  if (notifBtnLabel) notifBtnLabel.title = text.topbar.notifications;
  const profileButton = document.getElementById("profileBtn");
  if (profileButton)
    profileButton.setAttribute("aria-label", text.topbar.profile);

  const notifDropdownTitle = document.querySelector(
    "#notifMenu .dropdown-title",
  );
  if (notifDropdownTitle)
    notifDropdownTitle.textContent = text.topbar.notifications;
  const profileProfile = document.querySelector(
    '#profileMenu [data-action="profile"] span',
  );
  if (profileProfile) profileProfile.textContent = text.topbar.profile;
  const profileSettings = document.querySelector(
    '#profileMenu [data-action="settings"] span',
  );
  if (profileSettings) profileSettings.textContent = text.topbar.settings;
  const profileLogout = document.querySelector(
    '#profileMenu [data-action="logout"] span',
  );
  if (profileLogout) profileLogout.textContent = text.topbar.logout;

  updateProfileAvatar();

  updateClock();
}

function formatAdministrationDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(getAdministrationLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAdministrationDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(getAdministrationLocale());
}

function getAdministrationUserFullName(user) {
  return (
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Utilisateur"
  );
}

function getAdministrationUserInitials(user) {
  const parts = [user.firstName, user.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getConnectedUserProfile() {
  const state = getAdministrationState();
  const storedUserId = (() => {
    try {
      return window.localStorage.getItem(connectedUserStorageKey) || "";
    } catch (_error) {
      return "";
    }
  })();

  return (
    state.users.find((user) => user.id === storedUserId) ||
    state.users.find(
      (user) => String(user.status || "").toLowerCase() === "actif",
    ) ||
    state.users[0] ||
    null
  );
}

function updateProfileAvatar() {
  if (!profileBtn) return;

  const connectedUser = getConnectedUserProfile();
  const initials = connectedUser
    ? getAdministrationUserInitials(connectedUser)
    : "U";
  const fullName = connectedUser
    ? getAdministrationUserFullName(connectedUser)
    : "Utilisateur";

  profileBtn.textContent = initials;
  profileBtn.title = `${fullName} · ${localizeAdministrationText("Profil")}`;
  profileBtn.setAttribute(
    "aria-label",
    `${localizeAdministrationText("Profil")} ${fullName}`,
  );
}

function renderProfilePage() {
  if (pageActionsEl) {
    pageActionsEl.innerHTML = "";
  }

  if (!pageContentEl) return;

  const connectedUser = getConnectedUserProfile();
  if (!connectedUser) {
    pageContentEl.className = "blank-page";
    pageContentEl.innerHTML = `
      <div class="blank-card">
        <div class="blank-badge"><i class="fa-regular fa-user"></i></div>
        <h2>Profil introuvable</h2>
        <p>Aucun utilisateur connecté n'est disponible pour afficher les informations du compte.</p>
        <span class="blank-note">Vérifiez la configuration de l'utilisateur courant.</span>
      </div>
    `;
    return;
  }

  const fullName = getAdministrationUserFullName(connectedUser);
  const initials = getAdministrationUserInitials(connectedUser);
  const status = connectedUser.status || "Actif";
  const statusClass =
    String(status).toLowerCase() === "actif" ? "success" : "warning";
  const profileCards = [
    ["Nom d'utilisateur", connectedUser.username || "—"],
    ["Code utilisateur", connectedUser.code || "—"],
    ["Rôle", connectedUser.role || "—"],
    ["Fonction", connectedUser.functionTitle || "—"],
    ["Email", connectedUser.email || "—"],
    ["Téléphone", connectedUser.phone || "—"],
    ["Unité", connectedUser.unit || "—"],
    ["Division", connectedUser.division || "—"],
    ["Département", connectedUser.department || "—"],
    ["Langue", connectedUser.language || "—"],
    ["Fuseau horaire", connectedUser.timezone || "—"],
    ["Statut", status],
  ];

  pageContentEl.className = "organization-page profile-page";
  pageContentEl.innerHTML = `
    <section class="profile-hero-card">
      <div class="profile-avatar">${escapeHtml(initials)}</div>
      <div class="profile-hero-copy">
        <div class="profile-kicker">Utilisateur connecté</div>
        <h2>${escapeHtml(fullName)}</h2>
        <p>${escapeHtml(
    connectedUser.functionTitle || connectedUser.role || "Compte interne",
  )}</p>
        <div class="profile-hero-meta">
          <span>${escapeHtml(connectedUser.role || "Rôle non défini")}</span>
          <span>${escapeHtml(connectedUser.unit || "Unité non renseignée")}</span>
          <span>${escapeHtml(connectedUser.email || "Email non renseigné")}</span>
        </div>
      </div>
      <span class="status-badge ${statusClass}">${escapeHtml(status)}</span>
    </section>

    <section class="profile-summary-grid org-detail-grid">
      ${profileCards
      .map(
        ([label, value]) => `
            <div class="org-detail-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `,
      )
      .join("")}
      <div class="org-detail-item org-detail-item--full profile-dates-card">
        <span>Dates de compte</span>
        <strong>Créé le ${escapeHtml(
        formatAdministrationDateTime(connectedUser.createdAt),
      )}</strong>
        <strong>Dernière connexion ${escapeHtml(
        formatAdministrationDateTime(connectedUser.lastLogin),
      )}</strong>
      </div>
    </section>
  `;
}

function buildAdministrationTabs(activeSubpageKey) {
  return `
    <div class="org-tabs administration-tabs" role="tablist" aria-label="${localizeAdministrationText("Sous-pages administration")}">
      ${Object.entries(administrationSubpages.tabs)
      .map(
        ([key, tab]) => `
            <button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-admin-subpage="${key}">
              ${localizeAdministrationText(tab.label)}
            </button>
          `,
      )
      .join("")}
    </div>
  `;
}

function buildAdministrationOrgOptions(kind, selectedValue = "") {
  return [
    '<option value="">Non renseigné</option>',
    ...getOrganizationRecords(kind).map((record) => {
      const value = record.name || record.code || "";
      return `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(record.code || "")} — ${escapeHtml(record.name || value)}</option>`;
    }),
  ].join("");
}

function buildAdministrationPhotoMarkup(user) {
  if (user.photo) {
    return `<img src="${escapeHtml(user.photo)}" alt="Photo de ${escapeHtml(getAdministrationUserFullName(user))}" />`;
  }

  return `<span>${escapeHtml(getAdministrationUserInitials(user))}</span>`;
}

function getAdministrationRolePermissions(state, roleName) {
  const permissions =
    state.settings.rolePermissions?.[roleName] ||
    buildAdministrationRolePermissionsDefaults()[roleName] ||
    {};

  return administrationPermissionMatrix.reduce((accumulator, row) => {
    accumulator[row.module] = {
      view: Boolean(permissions[row.module]?.view),
      create: Boolean(permissions[row.module]?.create),
      edit: Boolean(permissions[row.module]?.edit),
      delete: Boolean(permissions[row.module]?.delete),
      validate: Boolean(permissions[row.module]?.validate),
    };
    return accumulator;
  }, {});
}

function getAdministrationRolePermissionValue(
  state,
  roleName,
  moduleName,
  key,
) {
  const rolePermissions = getAdministrationRolePermissions(state, roleName);
  return Boolean(rolePermissions[moduleName]?.[key]);
}

function getAdministrationRolePermissionToggleLabel(value) {
  return value ? "Activée" : "Désactivée";
}

function toggleAdministrationRolePermission(state, roleName, moduleName, key) {
  const nextState = JSON.parse(JSON.stringify(state));
  if (!nextState.settings.rolePermissions) {
    nextState.settings.rolePermissions =
      buildAdministrationRolePermissionsDefaults();
  }

  if (!nextState.settings.rolePermissions[roleName]) {
    nextState.settings.rolePermissions[roleName] = {};
  }

  if (!nextState.settings.rolePermissions[roleName][moduleName]) {
    nextState.settings.rolePermissions[roleName][moduleName] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      validate: false,
    };
  }

  nextState.settings.rolePermissions[roleName][moduleName][key] = !Boolean(
    nextState.settings.rolePermissions[roleName][moduleName][key],
  );

  saveAdministrationState(nextState);
  return nextState;
}

function countAdministrationRolePermissions(rolePermissions) {
  return administrationPermissionMatrix.reduce((total, row) => {
    return (
      total +
      Object.values(rolePermissions[row.module] || {}).filter(Boolean).length
    );
  }, 0);
}

function renderAdministrationPermissionToggle(
  state,
  roleName,
  moduleName,
  key,
) {
  const checked = getAdministrationRolePermissionValue(
    state,
    roleName,
    moduleName,
    key,
  );

  return `
    <button
      class="admin-permission-toggle ${checked ? "is-on" : "is-off"}"
      type="button"
      data-admin-role-permission="${moduleName}::${key}"
      data-admin-role-name="${roleName}"
      aria-pressed="${checked ? "true" : "false"}"
      aria-label="${escapeHtml(moduleName)} ${escapeHtml(key)} ${getAdministrationRolePermissionToggleLabel(checked)}"
    >
      <i class="fa-solid ${checked ? "fa-square-check" : "fa-square"}"></i>
    </button>
  `;
}

function getAdministrationFilteredLogs(state) {
  return state.logs
    .filter((log) => {
      const userMatch =
        !administrationLogFilters.user ||
        log.user === administrationLogFilters.user;
      const moduleMatch =
        !administrationLogFilters.module ||
        log.module === administrationLogFilters.module;
      const actionMatch =
        !administrationLogFilters.action ||
        log.action === administrationLogFilters.action;
      const createdAt = log.date ? new Date(log.date) : null;
      const fromMatch =
        !administrationLogFilters.from ||
        (createdAt
          ? createdAt >= new Date(`${administrationLogFilters.from}T00:00:00`)
          : true);
      const toMatch =
        !administrationLogFilters.to ||
        (createdAt
          ? createdAt <= new Date(`${administrationLogFilters.to}T23:59:59`)
          : true);

      return userMatch && moduleMatch && actionMatch && fromMatch && toMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function buildAdministrationUserDetailsModalShell(title, subtitle, bodyHtml) {
  return `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-admin-user-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="adminUserModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Utilisateurs</div>
            <h3 id="adminUserModalTitle">${escapeHtml(title)}</h3>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <button class="org-modal-close" type="button" data-admin-user-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderAdministrationUserDetailsModal(user) {
  if (!overlayRootEl || !user) return;

  const enterprise = getEnterpriseProfile();
  const bodyHtml = `
    <div class="admin-user-detail-modal">
      <div class="admin-user-detail-hero">
        <div class="admin-user-avatar admin-user-detail-avatar">
          ${buildAdministrationPhotoMarkup(user)}
        </div>
        <div>
          <div class="admin-user-detail-code">${escapeHtml(user.code)}</div>
          <h4>${escapeHtml(getAdministrationUserFullName(user))}</h4>
          <p>${escapeHtml(user.role)} · ${escapeHtml(user.functionTitle)}</p>
        </div>
      </div>
      <div class="org-detail-grid">
        <div class="org-detail-item"><span>Nom d'utilisateur</span><strong>${escapeHtml(user.username)}</strong></div>
        <div class="org-detail-item"><span>Email</span><strong>${escapeHtml(user.email)}</strong></div>
        <div class="org-detail-item"><span>Téléphone</span><strong>${escapeHtml(user.phone || "-")}</strong></div>
        <div class="org-detail-item"><span>Unité</span><strong>${escapeHtml(user.unit || "Non renseigné")}</strong></div>
        <div class="org-detail-item"><span>Division</span><strong>${escapeHtml(user.division || "Non renseigné")}</strong></div>
        <div class="org-detail-item"><span>Département</span><strong>${escapeHtml(user.department || "Non renseigné")}</strong></div>
        <div class="org-detail-item"><span>Langue</span><strong>${escapeHtml(user.language || "-")}</strong></div>
        <div class="org-detail-item"><span>Fuseau horaire</span><strong>${escapeHtml(user.timezone || "-")}</strong></div>
        <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(user.status)}</strong></div>
        <div class="org-detail-item"><span>Date création</span><strong>${formatAdministrationDateTime(user.createdAt)}</strong></div>
        <div class="org-detail-item"><span>Dernière connexion</span><strong>${formatAdministrationDateTime(user.lastLogin)}</strong></div>
        <div class="org-detail-item"><span>Code entreprise associé</span><strong>${escapeHtml(user.companyCode || enterprise.code || "ORG-001")}</strong></div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-admin-user-print-detail="true">
          <i class="fa-solid fa-print"></i>
          <span>Imprimer</span>
        </button>
        <button class="btn btn-primary" type="button" data-admin-user-close="true">
          <i class="fa-solid fa-check"></i>
          <span>Fermer</span>
        </button>
      </div>
    </div>
  `;

  overlayRootEl.innerHTML = buildAdministrationUserDetailsModalShell(
    getAdministrationUserFullName(user),
    "Consultation des informations du compte.",
    bodyHtml,
  );

  overlayRootEl
    .querySelectorAll("[data-admin-user-close]")
    .forEach((button) => {
      button.addEventListener("click", function () {
        overlayRootEl.innerHTML = "";
      });
    });

  const printButton = overlayRootEl.querySelector(
    "[data-admin-user-print-detail]",
  );
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }
}

function openAdministrationUserDetails(recordId) {
  const state = getAdministrationState();
  const user = state.users.find((item) => item.id === recordId);
  if (!user) return;

  renderAdministrationUserDetailsModal(user);
}

function buildAdministrationUsersSection(state) {
  const currentUser = administrationUserDraftId
    ? state.users.find((user) => user.id === administrationUserDraftId) || null
    : null;
  const userCount = state.users.length;
  const activeUsers = state.users.filter(
    (user) => user.status === "Actif",
  ).length;
  const suspendedUsers = state.users.filter(
    (user) => user.status === "Suspendu",
  ).length;
  const roleCount = new Set(state.users.map((user) => user.role)).size;

  return `
    <section class="administration-section">
      <div class="administration-section-head">
        <div>
          <div class="equipment-section-kicker">Utilisateurs</div>
          <h3>Gestion de tous les comptes qui accèdent au logiciel.</h3>
        </div>
      </div>

      <div class="admin-users-intro">
        <div class="admin-users-kpi-grid">
          <div class="admin-summary-card">
            <span>Comptes</span>
            <strong>${userCount}</strong>
            <small>Total des utilisateurs enregistrés</small>
          </div>
          <div class="admin-summary-card">
            <span>Actifs</span>
            <strong>${activeUsers}</strong>
            <small>Connexions autorisées</small>
          </div>
          <div class="admin-summary-card">
            <span>Suspendus</span>
            <strong>${suspendedUsers}</strong>
            <small>Accès temporairement bloqués</small>
          </div>
          <div class="admin-summary-card">
            <span>Rôles utilisés</span>
            <strong>${roleCount}</strong>
            <small>Couverture fonctionnelle</small>
          </div>
        </div>
      </div>
    </section>

    <section class="administration-section">
      <div class="administration-section-head">
        <div>
          <div class="equipment-section-kicker">Répertoire</div>
          <h3>Comptes enregistrés</h3>
          <p>Liste des utilisateurs, des rattachements, du code entreprise associé et de la dernière connexion.</p>
        </div>
        <span class="status-badge badge-info">Consultation, impression et export</span>
      </div>
      <div class="admin-user-list">
        ${state.users
      .map(
        (user) => `
              <article class="admin-user-list-item">
                <div class="admin-user-list-avatar ${user.status === "Suspendu" ? "is-muted" : ""}">
                  ${buildAdministrationPhotoMarkup(user)}
                </div>
                <div class="admin-user-list-main">
                  <div class="admin-user-list-head">
                    <div>
                      <strong>${escapeHtml(getAdministrationUserFullName(user))}</strong>
                      <p>${escapeHtml(user.username)} · ${escapeHtml(user.email)}</p>
                    </div>
                    <span class="status-badge ${user.status === "Actif" ? "badge-success" : user.status === "Suspendu" ? "badge-warning" : "badge-gray"}">${escapeHtml(user.status)}</span>
                  </div>
                  <div class="admin-user-tags">
                    <span>${escapeHtml(user.code)}</span>
                    <span>${escapeHtml(user.role)}</span>
                    <span>${escapeHtml(user.functionTitle)}</span>
                    <span>Entreprise ${escapeHtml(user.companyCode || getEnterpriseProfile().code || "ORG-001")}</span>
                    <span>${escapeHtml(user.unit || "Non renseigné")}</span>
                    <span>${escapeHtml(user.division || "Non renseigné")}</span>
                  </div>
                  <div class="admin-user-footnote">
                    <span>Créé le ${formatAdministrationDate(user.createdAt)}</span>
                    <span>Dernière connexion ${formatAdministrationDateTime(user.lastLogin)}</span>
                  </div>
                </div>
                <div class="admin-user-list-actions">
                  <button class="btn btn-outline" type="button" data-admin-user-view="${escapeHtml(user.id)}">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                  <button class="btn btn-outline" type="button" data-admin-user-print="${escapeHtml(user.id)}">
                    <i class="fa-solid fa-print"></i>
                  </button>
                  <button class="btn btn-outline danger" type="button" data-admin-user-delete="${escapeHtml(user.id)}">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </article>
            `,
      )
      .join("")}
      </div>
    </section>
  `;
}

function buildAdministrationRolesSection(state) {
  const selectedRole = state.settings.selectedRole || "Responsable";
  const rolePermissions = getAdministrationRolePermissions(state, selectedRole);
  const activePermissions = countAdministrationRolePermissions(rolePermissions);
  const totalPermissions = administrationPermissionMatrix.reduce(
    (total, row) =>
      total +
      (row.module === "Dashboard" || row.module === "Arborescence" ? 1 : 5),
    0,
  );

  return `
    <section class="administration-section admin-roles-hero">
      <div class="administration-section-head">
        <div>
          <div class="equipment-section-kicker">Administration</div>
          <h3>Rôles & Permissions</h3>
          <p>Définir qui peut faire quoi dans chaque module, avec une matrice éditable par rôle.</p>
        </div>
        <span class="status-badge badge-info">Modifications enregistrées automatiquement</span>
      </div>
      <div class="admin-summary-grid admin-roles-kpi-grid">
        <div class="admin-summary-card">
          <span>Rôles prédéfinis</span>
          <strong>7</strong>
          <small>Verrouillés par défaut</small>
        </div>
        <div class="admin-summary-card">
          <span>Modules</span>
          <strong>${administrationPermissionMatrix.length}</strong>
          <small>Couverture complète</small>
        </div>
        <div class="admin-summary-card">
          <span>Droits actifs</span>
          <strong>${activePermissions}</strong>
          <small>Rôle ${escapeHtml(selectedRole)}</small>
        </div>
        <div class="admin-summary-card">
          <span>Droits modifiables</span>
          <strong>${totalPermissions}</strong>
          <small>Voir, créer, modifier, supprimer, valider</small>
        </div>
      </div>
    </section>

    <div class="admin-role-grid">
      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">Matrice</div>
            <h3>Permissions par module</h3>
            <p>Choisissez un rôle, puis modifiez ses permissions via des boutons à état.</p>
          </div>
        </div>

        <div class="admin-role-control">
          <label for="adminRoleSelect">Rôle</label>
          <select id="adminRoleSelect" class="admin-role-select">
            ${administrationRoleCatalog
      .map(
        (roleName) =>
          `<option value="${roleName}"${roleName === selectedRole ? " selected" : ""}>${roleName}</option>`,
      )
      .join("")}
          </select>
        </div>

        <div class="admin-role-matrix-summary">
          <div class="admin-role-matrix-summary-item">
            <span>Rôle actif</span>
            <strong>${escapeHtml(selectedRole)}</strong>
          </div>
          <div class="admin-role-matrix-summary-item">
            <span>Permissions actives</span>
            <strong>${activePermissions}</strong>
          </div>
        </div>

        <div class="admin-permission-table-wrap">
          <table class="admin-permission-table admin-permission-table--interactive">
            <thead>
              <tr>
                <th>Module</th>
                <th>Voir</th>
                <th>Créer</th>
                <th>Modifier</th>
                <th>Supprimer</th>
                <th>Valider</th>
              </tr>
            </thead>
            <tbody>
              ${administrationPermissionMatrix
      .map(
        (row) => `
                  <tr>
                    <td>${escapeHtml(row.module)}</td>
                    <td>${renderAdministrationPermissionToggle(state, selectedRole, row.module, "view")}</td>
                    <td>${renderAdministrationPermissionToggle(state, selectedRole, row.module, "create")}</td>
                    <td>${renderAdministrationPermissionToggle(state, selectedRole, row.module, "edit")}</td>
                    <td>${renderAdministrationPermissionToggle(state, selectedRole, row.module, "delete")}</td>
                    <td>${renderAdministrationPermissionToggle(state, selectedRole, row.module, "validate")}</td>
                  </tr>
                `,
      )
      .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">Rôles verrouillés</div>
            <h3>Profils prédéfinis</h3>
            <p>Ces rôles servent de base de sécurité. Les permissions fines peuvent être dérivées ensuite pour les profils métier.</p>
          </div>
        </div>
        <div class="admin-role-cards">
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Admin</strong>
              <span class="status-badge badge-info">Quasi total</span>
            </div>
            <p>Tout sauf les actions réservées au Super Admin, notamment la hiérarchie de sécurité.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Responsable de maintenance</strong>
              <span class="status-badge badge-success">Voir + créer + modifier + valider</span>
            </div>
            <p>Profil d'exploitation pour les responsables de service et les validateurs.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Technicien de maintenance</strong>
              <span class="status-badge badge-gray">Opérations terrain</span>
            </div>
            <p>Lecture large et création des DI/BT avec modification des OT affectés.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Gestionnaire de stock</strong>
              <span class="status-badge badge-gray">Stock uniquement</span>
            </div>
            <p>Gère le stock, les mouvements et les validations de réception.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Acheteur</strong>
              <span class="status-badge badge-gray">Achats + fournisseurs</span>
            </div>
            <p>Suit le cycle achat et les échanges avec les fournisseurs.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Consultant</strong>
              <span class="status-badge badge-info">Lecture seule</span>
            </div>
            <p>Accès de consultation sans modification ni validation.</p>
          </article>
        </div>
      </section>
    </div>
  `;
}

function buildAdministrationGeneralSection(state) {
  const settings = state.settings;
  const languageKey = getAdministrationLanguageKey(state);

  return `
    <form class="admin-settings-form" id="adminGeneralForm">
      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">${localizeAdministrationText("Entreprise", state)}</div>
            <h3>${localizeAdministrationText("Paramètres généraux", state)}</h3>
            <p>${localizeAdministrationText("Configuration globale du logiciel, des alertes et de la numérotation automatique.", state)}</p>
          </div>
          <span class="status-badge badge-info">${localizeAdministrationText("Sauvegarde locale", state)}</span>
        </div>

        <div class="org-form-grid">
          <div class="field-group">
            <label for="adminCompanyName">${localizeAdministrationText("Nom entreprise", state)}</label>
            <input id="adminCompanyName" type="text" value="${escapeHtml(settings.companyName)}" disabled />
            <div class="org-field-hint">${localizeAdministrationText("Valeur automatiquement liée à l'Organisation.", state)}</div>
          </div>
          <div class="field-group">
            <label for="adminCompanyLogo">${localizeAdministrationText("Logo", state)}</label>
            <input id="adminCompanyLogo" type="file" accept="image/*" />
            <div class="org-field-hint">${localizeAdministrationText("Utilisé dans les exports PDF et les impressions.", state)}</div>
          </div>
          <div class="field-group">
            <label for="adminCurrency">${localizeAdministrationText("Devise", state)}</label>
            <select id="adminCurrency">
              ${administrationCurrencyOptions
      .map(
        (currency) =>
          `<option value="${currency}"${settings.currency === currency ? " selected" : ""}>${currency}</option>`,
      )
      .join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminDefaultLanguage">${localizeAdministrationText("Langue par défaut", state)}</label>
            <select id="adminDefaultLanguage">
              ${administrationLanguageOptions
      .map(
        (language) =>
          `<option value="${language}"${normalizeAdministrationLanguage(settings.defaultLanguage) === language ? " selected" : ""}>${getAdministrationLanguageLabel(language, state)}</option>`,
      )
      .join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminTimezone">${localizeAdministrationText("Fuseau horaire", state)}</label>
            <input id="adminTimezone" type="text" value="${escapeHtml(settings.timezone)}" />
          </div>
          <div class="field-group">
            <label for="adminDateFormat">${localizeAdministrationText("Format date", state)}</label>
            <input id="adminDateFormat" type="text" value="${escapeHtml(settings.dateFormat)}" />
          </div>
        </div>
      </section>

      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">${localizeAdministrationText("Notifications", state)}</div>
            <h3>${localizeAdministrationText("Paramètres d'alertes", state)}</h3>
            <p>${localizeAdministrationText("Seuils et temporisations pour le stock, les interventions, les achats et les compteurs.", state)}</p>
          </div>
        </div>
        <div class="admin-settings-columns">
          <div class="admin-settings-card">
            <h4>${localizeAdministrationText("Alertes stock", state)}</h4>
            <div class="admin-toggle-list">
              <label><input type="checkbox" id="adminStockMinimum"${settings.notifications.stockMinimum ? " checked" : ""} /> ${localizeAdministrationText("Activer alertes stock minimum", state)}</label>
              <label><input type="checkbox" id="adminStockSafety"${settings.notifications.stockSafety ? " checked" : ""} /> ${localizeAdministrationText("Activer alertes stock sécurité", state)}</label>
              <label><input type="checkbox" id="adminStockBreakage"${settings.notifications.stockBreakage ? " checked" : ""} /> ${localizeAdministrationText("Activer alertes rupture", state)}</label>
            </div>
          </div>
          <div class="admin-settings-card">
            <h4>${localizeAdministrationText("Alertes interventions", state)}</h4>
            <div class="org-form-grid">
              <div class="field-group">
                <label for="adminDiDelayDays">${localizeAdministrationText("DI non traitée après X jours", state)}</label>
                <input id="adminDiDelayDays" type="number" min="0" value="${escapeHtml(settings.notifications.diDelayDays)}" />
              </div>
              <div class="field-group">
                <label for="adminOtDelayDays">${localizeAdministrationText("OT en retard après X jours", state)}</label>
                <input id="adminOtDelayDays" type="number" min="0" value="${escapeHtml(settings.notifications.otDelayDays)}" />
              </div>
              <div class="field-group">
                <label for="adminBtDelayDays">${localizeAdministrationText("BT non validé après X jours", state)}</label>
                <input id="adminBtDelayDays" type="number" min="0" value="${escapeHtml(settings.notifications.btDelayDays)}" />
              </div>
              <div class="field-group">
                <label for="adminBcDelayDays">${localizeAdministrationText("BC non reçu après X jours", state)}</label>
                <input id="adminBcDelayDays" type="number" min="0" value="${escapeHtml(settings.notifications.bcDelayDays)}" />
              </div>
              <div class="field-group">
                <label for="adminDaDelayDays">${localizeAdministrationText("DA en attente après X jours", state)}</label>
                <input id="adminDaDelayDays" type="number" min="0" value="${escapeHtml(settings.notifications.daDelayDays)}" />
              </div>
              <div class="field-group">
                <label for="adminCounterThreshold">Alerte seuil compteur</label>
                <select id="adminCounterThreshold">
                  <option value="true"${settings.notifications.counterThreshold ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.notifications.counterThreshold ? " selected" : ""}>Non</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">Stock et interventions</div>
            <h3>Workflow métier</h3>
            <p>Paramètres de valorisation du stock et règles de validation des interventions.</p>
          </div>
        </div>
        <div class="admin-settings-columns">
          <div class="admin-settings-card">
            <h4>Stock</h4>
            <div class="org-form-grid">
              <div class="field-group">
                <label for="adminStockValuation">Méthode valorisation</label>
                <select id="adminStockValuation">
                  ${["PMP", "FIFO", "LIFO"].map((method) => `<option value="${method}"${settings.stock.valuation === method ? " selected" : ""}>${method}</option>`).join("")}
                </select>
              </div>
              <div class="field-group">
                <label for="adminNegativeStock">Autoriser stock négatif</label>
                <select id="adminNegativeStock">
                  <option value="true"${settings.stock.negativeStock ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.stock.negativeStock ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group">
                <label for="adminBlockOnShortage">Blocage sortie si rupture</label>
                <select id="adminBlockOnShortage">
                  <option value="true"${settings.stock.blockOnShortage ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.stock.blockOnShortage ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group">
                <label for="adminReceptionValidation">Validation réception obligatoire</label>
                <select id="adminReceptionValidation">
                  <option value="true"${settings.stock.requireReceptionValidation ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.stock.requireReceptionValidation ? " selected" : ""}>Non</option>
                </select>
              </div>
            </div>
          </div>
          <div class="admin-settings-card">
            <h4>Interventions</h4>
            <div class="org-form-grid">
              <div class="field-group">
                <label for="adminRequireDiBeforeOt">DI obligatoire avant OT</label>
                <select id="adminRequireDiBeforeOt">
                  <option value="true"${settings.interventions.requireDiBeforeOt ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.interventions.requireDiBeforeOt ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group">
                <label for="adminRequireBtSignature">Signature BT obligatoire</label>
                <select id="adminRequireBtSignature">
                  <option value="true"${settings.interventions.requireBtSignature ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.interventions.requireBtSignature ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group">
                <label for="adminRequireBtPhotos">Photos obligatoires dans BT</label>
                <select id="adminRequireBtPhotos">
                  <option value="true"${settings.interventions.requireBtPhotos ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.interventions.requireBtPhotos ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group">
                <label for="adminRequireSafetyChecklist">Checklist sécurité obligatoire</label>
                <select id="adminRequireSafetyChecklist">
                  <option value="true"${settings.interventions.requireSafetyChecklist ? " selected" : ""}>Oui</option>
                  <option value="false"${!settings.interventions.requireSafetyChecklist ? " selected" : ""}>Non</option>
                </select>
              </div>
              <div class="field-group field-group-wide">
                <label for="adminMaxPendingDiDays">Délai max DI non traitée (jours)</label>
                <input id="adminMaxPendingDiDays" type="number" min="0" value="${escapeHtml(settings.interventions.maxPendingDiDays)}" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="administration-section">
        <div class="administration-section-head">
          <div>
            <div class="equipment-section-kicker">${localizeAdministrationText("Sauvegarde", state)}</div>
            <h3>${localizeAdministrationText("Export, import et réinitialisation", state)}</h3>
            <p>${localizeAdministrationText("Base d'export JSON, import complet et options de remise à zéro par module.", state)}</p>
          </div>
        </div>
        <div class="org-form-grid">
          <div class="field-group">
            <label for="adminBackupExportMode">Export données</label>
            <select id="adminBackupExportMode">
              ${["JSON", "CSV"].map((mode) => `<option value="${mode}"${settings.backup.exportMode === mode ? " selected" : ""}>${mode}</option>`).join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminBackupExportScope">${localizeAdministrationText("Portée export", state)}</label>
            <select id="adminBackupExportScope">
              ${["Tous les modules", "Par module"].map((scope) => `<option value="${scope}"${settings.backup.exportScope === scope ? " selected" : ""}>${localizeAdministrationText(scope, state)}</option>`).join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminBackupFrequency">${localizeAdministrationText("Fréquence sauvegarde auto", state)}</label>
            <select id="adminBackupFrequency">
              ${["Quotidienne", "Hebdomadaire", "Mensuelle", "Aucune"].map((frequency) => `<option value="${frequency}"${settings.backup.autoFrequency === frequency ? " selected" : ""}>${localizeAdministrationText(frequency, state)}</option>`).join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminBackupImportMode">Import données</label>
            <select id="adminBackupImportMode">
              ${["JSON"].map((mode) => `<option value="${mode}"${settings.backup.importMode === mode ? " selected" : ""}>${mode}</option>`).join("")}
            </select>
          </div>
          <div class="field-group field-group-wide">
            <label for="adminBackupResetMode">Réinitialisation</label>
            <select id="adminBackupResetMode">
              ${["Module unique", "Double confirmation", "Désactivée"].map((mode) => `<option value="${mode}"${settings.backup.resetMode === mode ? " selected" : ""}>${mode}</option>`).join("")}
            </select>
          </div>
        </div>
      </section>

      <div class="org-modal-actions">
        <button class="btn btn-primary" type="submit">
          <i class="fa-solid fa-floppy-disk"></i>
          <span>${localizeAdministrationText("Enregistrer les paramètres", state)}</span>
        </button>
      </div>
    </form>
  `;
}

function buildAdministrationLogsSection(state) {
  const filteredLogs = getAdministrationFilteredLogs(state);
  const users = Array.from(new Set(state.logs.map((log) => log.user))).sort();
  const modules = Array.from(
    new Set(state.logs.map((log) => log.module)),
  ).sort();
  const actions = Array.from(
    new Set(state.logs.map((log) => log.action)),
  ).sort();

  return `
    <div class="admin-hero-grid">
      <div class="admin-hero-copy">
        <div class="org-section-kicker">Administration</div>
        <h2>Journaux système</h2>
        <p>Consultation uniquement. Chaque ligne trace l'utilisateur, l'action, le module concerné, l'enregistrement ciblé et le détail avant/après.</p>
      </div>
      <div class="admin-summary-grid">
        <div class="admin-summary-card">
          <span>Entrées visibles</span>
          <strong>${filteredLogs.length}</strong>
          <small>Après filtrage</small>
        </div>
        <div class="admin-summary-card">
          <span>Actions distinctes</span>
          <strong>${actions.length}</strong>
          <small>Typologie d'audit</small>
        </div>
        <div class="admin-summary-card">
          <span>Modules suivis</span>
          <strong>${modules.length}</strong>
          <small>Couverture de traçabilité</small>
        </div>
        <div class="admin-summary-card">
          <span>Utilisateurs</span>
          <strong>${users.length}</strong>
          <small>Comptes présents dans l'historique</small>
        </div>
      </div>
    </div>

    <section class="administration-section">
      <div class="administration-section-head">
        <div>
          <div class="equipment-section-kicker">Filtres</div>
          <h3>Recherche des journaux</h3>
          <p>Affinage par utilisateur, module, type d'action et intervalle de dates.</p>
        </div>
      </div>

      <div class="admin-log-filters">
        <label>
          <span>Utilisateur</span>
          <select data-admin-log-filter="user">
            <option value="">Tous</option>
            ${users.map((user) => `<option value="${escapeHtml(user)}"${administrationLogFilters.user === user ? " selected" : ""}>${escapeHtml(user)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Module</span>
          <select data-admin-log-filter="module">
            <option value="">Tous</option>
            ${modules.map((module) => `<option value="${escapeHtml(module)}"${administrationLogFilters.module === module ? " selected" : ""}>${escapeHtml(module)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Type d'action</span>
          <select data-admin-log-filter="action">
            <option value="">Tous</option>
            ${actions.map((action) => `<option value="${escapeHtml(action)}"${administrationLogFilters.action === action ? " selected" : ""}>${escapeHtml(action)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Du</span>
          <input data-admin-log-filter="from" type="date" value="${escapeHtml(administrationLogFilters.from)}" />
        </label>
        <label>
          <span>Au</span>
          <input data-admin-log-filter="to" type="date" value="${escapeHtml(administrationLogFilters.to)}" />
        </label>
      </div>

      <div class="admin-permission-table-wrap admin-log-table-wrap">
        <table class="admin-permission-table admin-log-table">
          <thead>
            <tr>
              <th>Date et heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Module</th>
              <th>Enregistrement</th>
              <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs
      .map(
        (log) => `
                  <tr>
                    <td>${formatAdministrationDateTime(log.date)}</td>
                    <td>${escapeHtml(log.user)}</td>
                    <td><span class="status-badge badge-info">${escapeHtml(log.action)}</span></td>
                    <td>${escapeHtml(log.module)}</td>
                    <td>${escapeHtml(log.record)}</td>
                    <td>
                      <div class="admin-log-detail">${escapeHtml(log.detail)}</div>
                      <div class="admin-log-before-after"><span>Avant: ${escapeHtml(log.before)}</span><span>Après: ${escapeHtml(log.after)}</span></div>
                    </td>
                  </tr>
                `,
      )
      .join("") ||
    `<tr><td colspan="6"><div class="org-empty-card admin-empty-card"><div class="blank-badge"><i class="fa-regular fa-folder-open"></i></div><h2>Aucun journal trouvé</h2><p>Adaptez les filtres pour afficher d'autres entrées.</p></div></td></tr>`
    }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildAdministrationSection(activeSubpageKey, state) {
  if (activeSubpageKey === "roles") {
    return buildAdministrationRolesSection(state);
  }

  if (activeSubpageKey === "general") {
    return buildAdministrationGeneralSection(state);
  }

  return buildAdministrationUsersSection(state);
}

function buildAdministrationActionButtons(activeSubpageKey, state) {
  if (!pageActionsEl) return;

  if (activeSubpageKey === "utilisateurs") {
    pageActionsEl.innerHTML = `
      <button class="btn btn-outline" type="button" data-admin-export-users>
        <i class="fa-solid fa-file-csv"></i>
        <span>${localizeAdministrationText("Exporter CSV", state)}</span>
      </button>
      <button class="btn btn-primary" type="button" data-admin-users-print>
        <i class="fa-solid fa-print"></i>
        <span>${localizeAdministrationText("Imprimer", state)}</span>
      </button>
    `;
    return;
  }

  if (activeSubpageKey === "general") {
    pageActionsEl.innerHTML = `
      <button class="btn btn-primary" type="button" data-admin-settings-save>
        <i class="fa-solid fa-floppy-disk"></i>
        <span>${localizeAdministrationText("Enregistrer", state)}</span>
      </button>
    `;
    return;
  }

  pageActionsEl.innerHTML = "";
}

function renderAdministrationPage(subpageKey) {
  const activeSubpageKey = administrationSubpages.tabs[subpageKey]
    ? subpageKey
    : administrationSubpages.defaultSubpage;
  const activeSubpage = administrationSubpages.tabs[activeSubpageKey];
  const state = getAdministrationState();

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText(
      "Administration",
      state,
    );
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(
      activeSubpage.body,
      state,
    );
  buildAdministrationActionButtons(activeSubpageKey, state);

  if (!pageContentEl) return;

  pageContentEl.className = "organization-page administration-page";
  pageContentEl.innerHTML = `
    ${buildAdministrationTabs(activeSubpageKey)}
    ${buildAdministrationSection(activeSubpageKey, state)}
  `;

  applyLocalizedShell(state);
  attachAdministrationTabHandlers();
  attachAdministrationRolesHandlers(state);
  attachAdministrationUserHandlers(state);
  attachAdministrationGeneralHandlers(state);
  attachAdministrationLogHandlers(state);
}

function attachAdministrationTabHandlers() {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-admin-subpage]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage =
        this.dataset.adminSubpage || administrationSubpages.defaultSubpage;
      renderPage("parametres", nextSubpage);
      window.location.hash = `parametres/${nextSubpage}`;
    });
  });
}

function attachAdministrationRolesHandlers(state) {
  if (!pageContentEl) return;

  const roleSelect = pageContentEl.querySelector("#adminRoleSelect");
  if (roleSelect) {
    roleSelect.addEventListener("change", function () {
      const nextState = getAdministrationState();
      nextState.settings.selectedRole = this.value;
      saveAdministrationState(nextState);
      renderPage("parametres", "roles");
      window.location.hash = "parametres/roles";
    });
  }

  pageContentEl
    .querySelectorAll("[data-admin-role-permission]")
    .forEach((button) => {
      button.addEventListener("click", function () {
        const roleName = this.dataset.adminRoleName || "";
        const permissionKey = this.dataset.adminRolePermission || "";
        const [moduleName, actionKey] = permissionKey.split("::");
        if (!roleName || !moduleName || !actionKey) return;

        const nextState = toggleAdministrationRolePermission(
          getAdministrationState(),
          roleName,
          moduleName,
          actionKey,
        );
        nextState.settings.selectedRole = roleName;
        saveAdministrationState(nextState);
        renderPage("parametres", "roles");
        window.location.hash = "parametres/roles";
      });
    });
}

function readAdministrationFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(String(reader.result || ""));
    };
    reader.onerror = function () {
      reject(new Error("Impossible de lire le fichier."));
    };
    reader.readAsDataURL(file);
  });
}

function downloadAdministrationCsv(filename, rows) {
  const escapeCell = (value) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function attachAdministrationUserHandlers(state) {
  if (!pageContentEl) return;

  const exportButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-export-users]")
    : null;
  const printButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-users-print]")
    : null;

  if (exportButton) {
    exportButton.addEventListener("click", function () {
      const rows = [
        [
          "Numéro",
          "Nom",
          "Prénom",
          "Nom d'utilisateur",
          "Email",
          "Téléphone",
          "Rôle",
          "Fonction",
          "Unité",
          "Division",
          "Département",
          "Statut",
        ],
        ...state.users.map((user) => [
          user.code,
          user.lastName,
          user.firstName,
          user.username,
          user.email,
          user.phone,
          user.role,
          user.functionTitle,
          user.unit,
          user.division,
          user.department,
          user.status,
        ]),
      ];
      downloadAdministrationCsv("utilisateurs-administration.csv", rows);
    });
  }

  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }

  pageContentEl.querySelectorAll("[data-admin-user-view]").forEach((button) => {
    button.addEventListener("click", function () {
      const recordId = this.dataset.adminUserView || "";
      openAdministrationUserDetails(recordId);
    });
  });

  pageContentEl
    .querySelectorAll("[data-admin-user-print]")
    .forEach((button) => {
      button.addEventListener("click", function () {
        const recordId = this.dataset.adminUserPrint || "";
        const user = state.users.find((item) => item.id === recordId);
        if (!user) return;

        renderAdministrationUserDetailsModal(user);
        setTimeout(() => window.print(), 0);
      });
    });

  pageContentEl
    .querySelectorAll("[data-admin-user-delete]")
    .forEach((button) => {
      button.addEventListener("click", function () {
        const userId = this.dataset.adminUserDelete;
        if (!userId) return;

        const nextState = getAdministrationState();
        const user = nextState.users.find((item) => item.id === userId);
        if (!user) return;

        if (
          !window.confirm(`Supprimer ${getAdministrationUserFullName(user)} ?`)
        )
          return;

        nextState.users = nextState.users.filter((item) => item.id !== userId);
        nextState.logs = [
          {
            id: `log-${Date.now()}`,
            date: new Date().toISOString(),
            user: "Administrateur système",
            action: "Suppression enregistrement",
            module: "Administration",
            record: user.code,
            detail: `Utilisateur ${getAdministrationUserFullName(user)} supprimé depuis la page Administration.`,
            before: getAdministrationUserFullName(user),
            after: "Compte supprimé",
          },
          ...nextState.logs,
        ];
        saveAdministrationState(nextState);
        administrationUserDraftId = null;
        renderPage("parametres", "utilisateurs");
        window.location.hash = "parametres/utilisateurs";
      });
    });
}

function attachAdministrationGeneralHandlers() {
  if (!pageContentEl) return;

  const form = pageContentEl.querySelector("#adminGeneralForm");
  const languageSelect = form?.querySelector("#adminDefaultLanguage");
  const saveButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-settings-save]")
    : null;

  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      const nextState = getAdministrationState();
      const nextLanguage = normalizeAdministrationLanguage(this.value);

      if (nextState.settings.defaultLanguage === nextLanguage) return;

      nextState.settings.defaultLanguage = nextLanguage;
      saveAdministrationState(nextState);
      applyLocalizedShell(nextState);
      renderPage("parametres", "general");
      window.location.hash = "parametres/general";
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else if (form) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
      }
    });
  }

  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nextState = getAdministrationState();
    const logoInput = form.querySelector("#adminCompanyLogo");
    const logoFile = logoInput && logoInput.files ? logoInput.files[0] : null;
    const logoData = logoFile
      ? await readAdministrationFileAsDataUrl(logoFile)
      : nextState.settings.logo || "";

    nextState.settings = {
      ...nextState.settings,
      logo: logoData,
      currency:
        form.querySelector("#adminCurrency")?.value ||
        nextState.settings.currency,
      defaultLanguage:
        normalizeAdministrationLanguage(
          form.querySelector("#adminDefaultLanguage")?.value ||
          nextState.settings.defaultLanguage,
        ),
      timezone:
        form.querySelector("#adminTimezone")?.value ||
        nextState.settings.timezone,
      dateFormat:
        form.querySelector("#adminDateFormat")?.value ||
        nextState.settings.dateFormat,
      stock: {
        ...nextState.settings.stock,
        valuation:
          form.querySelector("#adminStockValuation")?.value ||
          nextState.settings.stock.valuation,
        negativeStock:
          form.querySelector("#adminNegativeStock")?.value === "true",
        blockOnShortage:
          form.querySelector("#adminBlockOnShortage")?.value === "true",
        requireReceptionValidation:
          form.querySelector("#adminReceptionValidation")?.value === "true",
      },
      notifications: {
        ...nextState.settings.notifications,
        stockMinimum: !!form.querySelector("#adminStockMinimum")?.checked,
        stockSafety: !!form.querySelector("#adminStockSafety")?.checked,
        stockBreakage: !!form.querySelector("#adminStockBreakage")?.checked,
        diDelayDays: Number(
          form.querySelector("#adminDiDelayDays")?.value || 0,
        ),
        otDelayDays: Number(
          form.querySelector("#adminOtDelayDays")?.value || 0,
        ),
        btDelayDays: Number(
          form.querySelector("#adminBtDelayDays")?.value || 0,
        ),
        bcDelayDays: Number(
          form.querySelector("#adminBcDelayDays")?.value || 0,
        ),
        daDelayDays: Number(
          form.querySelector("#adminDaDelayDays")?.value || 0,
        ),
        contractExpiryDays: nextState.settings.notifications.contractExpiryDays,
        warrantyExpiryDays: nextState.settings.notifications.warrantyExpiryDays,
        counterThreshold:
          form.querySelector("#adminCounterThreshold")?.value === "true",
      },
      numbering: {
        ...nextState.settings.numbering,
        diPrefix:
          form.querySelector("#adminDIPrefix")?.value ||
          nextState.settings.numbering.diPrefix,
        otPrefix:
          form.querySelector("#adminOTPrefix")?.value ||
          nextState.settings.numbering.otPrefix,
        btPrefix:
          form.querySelector("#adminBTPrefix")?.value ||
          nextState.settings.numbering.btPrefix,
        daPrefix:
          form.querySelector("#adminDAPrefix")?.value ||
          nextState.settings.numbering.daPrefix,
        bcPrefix:
          form.querySelector("#adminBCPrefix")?.value ||
          nextState.settings.numbering.bcPrefix,
        recPrefix:
          form.querySelector("#adminRECPrefix")?.value ||
          nextState.settings.numbering.recPrefix,
        plnPrefix:
          form.querySelector("#adminPLNPrefix")?.value ||
          nextState.settings.numbering.plnPrefix,
        cptPrefix:
          form.querySelector("#adminCPTPrefix")?.value ||
          nextState.settings.numbering.cptPrefix,
        frnPrefix:
          form.querySelector("#adminFRNPrefix")?.value ||
          nextState.settings.numbering.frnPrefix,
        ctrPrefix:
          form.querySelector("#adminCTRPrefix")?.value ||
          nextState.settings.numbering.ctrPrefix,
        digits:
          form.querySelector("#adminNumberDigits")?.value ||
          nextState.settings.numbering.digits,
        resetPolicy:
          form.querySelector("#adminResetPolicy")?.value ||
          nextState.settings.numbering.resetPolicy,
      },
      interventions: {
        ...nextState.settings.interventions,
        requireDiBeforeOt:
          form.querySelector("#adminRequireDiBeforeOt")?.value === "true",
        requireBtSignature:
          form.querySelector("#adminRequireBtSignature")?.value === "true",
        requireBtPhotos:
          form.querySelector("#adminRequireBtPhotos")?.value === "true",
        requireSafetyChecklist:
          form.querySelector("#adminRequireSafetyChecklist")?.value === "true",
        maxPendingDiDays: Number(
          form.querySelector("#adminMaxPendingDiDays")?.value || 0,
        ),
      },
      backup: {
        ...nextState.settings.backup,
        exportMode:
          form.querySelector("#adminBackupExportMode")?.value ||
          nextState.settings.backup.exportMode,
        exportScope:
          form.querySelector("#adminBackupExportScope")?.value ||
          nextState.settings.backup.exportScope,
        autoFrequency:
          form.querySelector("#adminBackupFrequency")?.value ||
          nextState.settings.backup.autoFrequency,
        importMode:
          form.querySelector("#adminBackupImportMode")?.value ||
          nextState.settings.backup.importMode,
        resetMode:
          form.querySelector("#adminBackupResetMode")?.value ||
          nextState.settings.backup.resetMode,
      },
    };

    nextState.logs = [
      {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        user: "Administrateur système",
        action: "Modification enregistrement",
        module: "Administration",
        record: "PARAM-001",
        detail:
          "Paramètres généraux enregistrés depuis la page Administration.",
        before: "Configuration précédente",
        after: "Configuration mise à jour",
      },
      ...nextState.logs,
    ];

    saveAdministrationState(nextState);
    renderPage("parametres", "general");
    window.location.hash = "parametres/general";
  });
}

function attachAdministrationLogHandlers(state) {
  if (!pageContentEl) return;

  const exportButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-export-logs]")
    : null;
  const printButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-print-logs]")
    : null;

  if (exportButton) {
    exportButton.addEventListener("click", function () {
      const filteredLogs = getAdministrationFilteredLogs(state);
      const rows = [
        [
          "Date",
          "Utilisateur",
          "Action",
          "Module",
          "Enregistrement",
          "Détail",
          "Avant",
          "Après",
        ],
        ...filteredLogs.map((log) => [
          formatAdministrationDateTime(log.date),
          log.user,
          log.action,
          log.module,
          log.record,
          log.detail,
          log.before,
          log.after,
        ]),
      ];
      downloadAdministrationCsv("journaux-systeme.csv", rows);
    });
  }

  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }

  pageContentEl
    .querySelectorAll("[data-admin-log-filter]")
    .forEach((control) => {
      const key = control.dataset.adminLogFilter;
      if (!key) return;

      control.addEventListener("change", function () {
        administrationLogFilters = {
          ...administrationLogFilters,
          [key]: this.value,
        };
        renderPage("parametres", "logs");
        window.location.hash = "parametres/logs";
      });
    });
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

function getDashboardInterventionStats(type) {
  const directory = loadInterventionsState();
  let total = 0;
  let planifie = 0;
  let encours = 0;
  let termine = 0;

  if (type === "DI") {
    const items = directory.dis || [];
    total = items.length;
    planifie = items.filter((item) => item.status === "En attente").length;
    termine = items.filter(
      (item) =>
        item.status === "Validée" ||
        item.status === "Transformée en OT" ||
        item.status === "Terminé",
    ).length;
  } else if (type === "OT") {
    const items = directory.ots || [];
    total = items.length;
    planifie = items.filter((item) => item.status === "Planifié").length;
    encours = items.filter((item) => item.status === "En cours").length;
    termine = items.filter(
      (item) =>
        item.status === "Terminé" ||
        item.status === "Validé" ||
        item.status === "Clôturé",
    ).length;
  } else if (type === "BT") {
    const items = directory.bts || [];
    total = items.length;
    planifie = items.filter(
      (item) =>
        item.status === "Créé" ||
        item.status === "Assigné" ||
        item.status === "En attente",
    ).length;  // ✅ BTs pas encore démarrés
    encours = items.filter((item) => item.status === "En cours").length;  // ✅ BTs en exécution
    termine = items.filter(
      (item) =>
        item.status === "Validé" ||
        item.status === "Clôturé" ||
        item.status === "Terminé",
    ).length;  // ✅ inchangé
  }

  const pctTermine = total > 0 ? Math.round((termine / total) * 100) : 0;

  return { total, planifie, encours, termine, pctTermine };
}

function dashboardDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dashboardFormatDate(value) {
  const date = dashboardDateValue(value);
  return date ? date.toLocaleDateString(getAdministrationLocale()) : "-";
}

function dashboardFormatNumber(value) {
  return new Intl.NumberFormat(getAdministrationLocale(), {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dashboardFormatMoney(value) {
  return new Intl.NumberFormat(getAdministrationLocale(), {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dashboardPercent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function dashboardIsClosedStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return (
    normalized.includes("valid") ||
    normalized.includes("termin") ||
    normalized.includes("clôt") ||
    normalized.includes("clÃ´t") ||
    normalized.includes("reçu complet") ||
    normalized.includes("reÃ§u complet") ||
    normalized.includes("transform")
  );
}

function dashboardIsLate(dateValue, status) {
  const date = dashboardDateValue(dateValue);
  if (!date || dashboardIsClosedStatus(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function dashboardGetSupplierState() {
  try {
    const raw = window.localStorage.getItem("maintflow.fournisseurs");
    const parsed = raw ? JSON.parse(raw) : { suppliers: [] };
    return { suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [] };
  } catch (error) {
    return { suppliers: [] };
  }
}

function dashboardGetInterventionRows(directory = loadInterventionsState()) {
  return [
    ...(directory.dis || []).map((item) => ({
      source: "DI",
      ref: item.ref || "-",
      equipment: item.equipmentLabel || item.title || "-",
      type: item.requestType || "Corrective",
      priority: item.urgency || "-",
      priorityClass: getInterventionBadgeClass(item.urgency),
      status: item.status || "-",
      statusClass: getInterventionStatusBadgeClass(item.status),
      technician: item.requesterLabel || "-",
      date: item.createdAt,
      dueDate: item.createdAt,
      cost: 0,
      articles: [],
    })),
    ...(directory.ots || []).map((item) => ({
      source: "OT",
      ref: item.ref || "-",
      equipment: item.equipmentLabel || item.diRef || "-",
      type: item.maintenanceType || item.requestType || "Corrective",
      priority: item.priority || "-",
      priorityClass: getInterventionBadgeClass(item.priority),
      status: item.status || "-",
      statusClass: getInterventionStatusBadgeClass(item.status),
      technician: item.technicianLabel || "-",
      date: item.plannedDate || item.createdAt,
      dueDate: item.plannedDate || item.createdAt,
      cost: 0,
      articles: item.articles || [],
    })),
    ...(directory.bts || []).map((item) => {
      const linkedOt = (directory.ots || []).find((ot) => ot.id === item.otId);
      return {
        source: "BT",
        ref: item.ref || "-",
        equipment: item.equipmentLabel || linkedOt?.equipmentLabel || item.otRef || "-",
        type: item.maintenanceType || linkedOt?.maintenanceType || "Corrective",
        priority: linkedOt?.priority || "-",
        priorityClass: getInterventionBadgeClass(linkedOt?.priority),
        status: item.status || "-",
        statusClass: getInterventionStatusBadgeClass(item.status),
        technician: item.technicianSignature?.name || item.managerSignature?.name || linkedOt?.technicianLabel || "-",
        date: item.endDate || item.startDate || linkedOt?.plannedDate || linkedOt?.createdAt,
        dueDate: item.endDate || item.startDate || linkedOt?.plannedDate,
        cost: dashboardGetArticleLinesCost(item.articles || []),
        articles: item.articles || [],
      };
    }),
  ];
}

function dashboardGetArticleLinesCost(lines = []) {
  return (lines || []).reduce((sum, line) => {
    const article = getArticleRecord("articles", line.articleId);
    const unitPrice = Number(line.unitPrice ?? line.price ?? article?.price ?? 0) || 0;
    const qty = Number(line.qty ?? line.quantity ?? 0) || 0;
    return sum + unitPrice * qty;
  }, 0);
}

function dashboardMonthKeys(count = 6) {
  const formatter = new Intl.DateTimeFormat(getAdministrationLocale(), {
    month: "short",
  });
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (count - 1 - index));
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: formatter.format(date),
    };
  });
}

function dashboardBuildMonthlyInterventionChart(rows) {
  const months = dashboardMonthKeys(6);
  const typeKeys = ["Corrective", "Préventive", "Réglementaire"];
  const aliases = {
    preventive: "Préventive",
    "prÃ©ventive": "Préventive",
    "préventive": "Préventive",
    réglementaire: "Réglementaire",
    "rÃ©glementaire": "Réglementaire",
  };
  const data = months.map((month) => {
    const item = { ...month, Corrective: 0, Préventive: 0, Réglementaire: 0 };
    rows.forEach((row) => {
      const date = dashboardDateValue(row.date);
      if (!date) return;
      const rowKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (rowKey !== month.key) return;
      const rawType = String(row.type || "Corrective").toLowerCase();
      const normalized = aliases[rawType] || (rawType.includes("préd") || rawType.includes("prÃ©d") ? "Préventive" : row.type || "Corrective");
      const target = typeKeys.includes(normalized) ? normalized : "Corrective";
      item[target] += 1;
    });
    item.total = typeKeys.reduce((sum, key) => sum + item[key], 0);
    return item;
  });
  const max = Math.max(1, ...data.map((item) => item.total));
  return { data, max, typeKeys };
}

function dashboardBuildAvailabilityByZone(equipmentDirectory) {
  const equipments = equipmentDirectory.equipments || [];
  const zones = (equipmentDirectory.groups || []).map((group) => {
    const zoneEquipments = equipments.filter((equipment) => equipment.groupId === group.id);
    const total = zoneEquipments.length;
    const operational = zoneEquipments.filter((equipment) => equipment.status === "En service").length;
    return {
      label: group.name || group.code || "Zone",
      total,
      percent: dashboardPercent(operational, total),
    };
  });

  if (!zones.length && equipments.length) {
    const operational = equipments.filter((equipment) => equipment.status === "En service").length;
    zones.push({ label: "Parc équipements", total: equipments.length, percent: dashboardPercent(operational, equipments.length) });
  }

  return zones.filter(zone => zone.total > 0).sort((a, b) => a.percent - b.percent).slice(0, 4);
}

function dashboardBuildPieSegments(items, colors) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradients = items.map((item, index) => {
    const size = total > 0 ? (item.value / total) * 100 : 0;
    const start = cursor;
    cursor += size;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return {
    total,
    style: total > 0 ? `background: conic-gradient(${gradients.join(", ")});` : "",
    items: items.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      percent: dashboardPercent(item.value, total),
    })),
  };
}

function dashboardBuildMaintenanceTypePie(rows) {
  const labels = ["Corrective", "Préventive", "Prédictive", "Réglementaire"];
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));
  rows.forEach((row) => {
    const type = String(row.type || "Corrective").toLowerCase();
    if (type.includes("préd") || type.includes("prÃ©d")) counts["Prédictive"] += 1;
    else if (type.includes("prév") || type.includes("prÃ©v")) counts["Préventive"] += 1;
    else if (type.includes("rég") || type.includes("rÃ©g")) counts["Réglementaire"] += 1;
    else counts.Corrective += 1;
  });
  return dashboardBuildPieSegments(
    labels.map((label) => ({ label, value: counts[label] })),
    ["#dc2626", "#16a34a", "#0d6e8a", "#94a3b8"],
  );
}

function dashboardBuildStockFamilyPie() {
  const directory = getArticleDirectory();
  const familyValues = new Map();
  (directory.articles || []).forEach((article) => {
    const family = (directory.families || []).find((item) => item.id === article.familyId);
    const totals = getStockTotalsForArticle(article.id);
    const value = totals.totalValue || (Number(article.quantity) || 0) * (Number(article.price) || 0);
    const key = family?.name || "Sans famille";
    familyValues.set(key, (familyValues.get(key) || 0) + value);
  });
  const items = Array.from(familyValues.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
  return dashboardBuildPieSegments(items, ["#0d6e8a", "#16a34a", "#d97706", "#94a3b8"]);
}

function dashboardBuildOtStatusPie(stats) {
  return dashboardBuildPieSegments(
    [
      { label: "Terminés", value: stats.termine },
      { label: "En cours", value: stats.encours },
      { label: "Planifiés", value: stats.planifie },
      { label: "Bloqués", value: Math.max(0, stats.total - stats.termine - stats.encours - stats.planifie) },
    ],
    ["#16a34a", "#d97706", "#0d6e8a", "#dc2626"],
  );
}

function dashboardBuildWeekPlanning(directory) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const items = (directory.ots || []).filter((ot) => String(ot.plannedDate || "").slice(0, 10) === key);
    return {
      key,
      label: date.toLocaleDateString(getAdministrationLocale(), { weekday: "short" }),
      count: items.length,
    };
  });
  const max = Math.max(1, ...days.map((item) => item.count));
  return { days, max };
}

function dashboardBuildActivity(rows, achatsState, stockDirectory, interventionDirectory) {
  const interventionHistory = (interventionDirectory.history || []).map((entry) => ({
    title: entry.action || "Intervention",
    meta: `${entry.recordRef || entry.recordType || "Intervention"} · ${dashboardFormatDate(entry.createdAt)}`,
    icon: "fa-screwdriver-wrench",
    date: entry.createdAt,
    tone: "brand",
  }));
  const stockActivity = (stockDirectory.movements || []).map((entry) => ({
    title: entry.type === "exit" ? "Mouvement stock" : "Entrée stock",
    meta: `${entry.articleLabel || entry.linkedDocument || "Stock"} · ${dashboardFormatDate(entry.createdAt)}`,
    icon: "fa-boxes-stacked",
    date: entry.createdAt,
    tone: "warning",
  }));
  const achatsActivity = [
    ...(achatsState.demandes || []).map((entry) => ({
      title: "DA créée",
      meta: `${entry.number || "DA"} · ${dashboardFormatDate(entry.createdAt || entry.date)}`,
      icon: "fa-file-circle-plus",
      date: entry.createdAt || entry.date,
      tone: "info",
    })),
    ...(achatsState.bons || []).map((entry) => ({
      title: "BC envoyé",
      meta: `${entry.number || "BC"} · ${dashboardFormatDate(entry.createdAt || entry.date)}`,
      icon: "fa-paper-plane",
      date: entry.createdAt || entry.date,
      tone: "success",
    })),
    ...(achatsState.receptions || []).map((entry) => ({
      title: "Réception validée",
      meta: `${entry.number || "Réception"} · ${dashboardFormatDate(entry.createdAt || entry.date)}`,
      icon: "fa-clipboard-check",
      date: entry.createdAt || entry.date,
      tone: "success",
    })),
  ];
  const recentRows = rows.slice(0, 4).map((row) => ({
    title: row.source === "DI" ? "Panne déclarée" : row.status.includes("Term") ? "Intervention terminée" : "Intervention mise à jour",
    meta: `${row.ref} · ${row.equipment}`,
    icon: "fa-clock-rotate-left",
    date: row.date,
    tone: row.priorityClass === "badge-danger" ? "danger" : "brand",
  }));

  return [...interventionHistory, ...stockActivity, ...achatsActivity, ...recentRows]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 6);
}

function dashboardBuildBusinessKpis(rows, stockRecords) {
  const failures = rows.filter((row) => String(row.type || "").toLowerCase().includes("correct"));
  const closedBts = rows.filter((row) => row.source === "BT" && dashboardIsClosedStatus(row.status));
  const repairHours = closedBts
    .map((row) => {
      const bt = (loadInterventionsState().bts || []).find((item) => item.ref === row.ref);
      const start = dashboardDateValue(bt?.startDate);
      const end = dashboardDateValue(bt?.endDate);
      return start && end ? Math.max(0, end - start) / 36e5 : null;
    })
    .filter((value) => value !== null);
  const preventiveRows = rows.filter((row) => {
    const type = String(row.type || "").toLowerCase();
    return type.includes("prév") || type.includes("prÃ©v");
  });
  const preventiveDone = preventiveRows.filter((row) => dashboardIsClosedStatus(row.status)).length;
  const availableStock = stockRecords.filter((record) => Number(record.currentQuantity) > Number(record.minStock || 0)).length;

  return [
    {
      label: "MTBF",
      value: failures.length > 1 ? `${Math.round(30 / failures.length)} jours` : "-",
      sub: "moy pannes",
    },
    {
      label: "MTTR",
      value: repairHours.length ? `${(repairHours.reduce((sum, item) => sum + item, 0) / repairHours.length).toFixed(1)} h` : "-",
      sub: "moy répar.",
    },
    {
      label: "Taux PM réalisées",
      value: `${dashboardPercent(preventiveDone, preventiveRows.length)}%`,
      sub: "dans délais",
    },
    {
      label: "Taux service stock",
      value: `${dashboardPercent(availableStock, stockRecords.length)}%`,
      sub: "dispo immé.",
    },
  ];
}

function dashboardBuildPurchaseBudgetChart(achatsState) {
  const months = dashboardMonthKeys(6).map((month) => ({ ...month, allocated: 0, engaged: 0 }));
  (achatsState.bons || []).forEach((bc) => {
    const date = dashboardDateValue(bc.createdAt || bc.date || bc.orderDate);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = months.find((item) => item.key === key);
    if (!month) return;
    const total = Number(bc.totalTtc ?? bc.total ?? bc.amount ?? 0) || 0;
    month.engaged += total;
    month.allocated += Number(bc.budget ?? 0) || total;
  });
  const max = Math.max(1, ...months.flatMap((item) => [item.allocated, item.engaged]));
  return { months, max };
}

function dashboardBuildTopSuppliers(supplierState, achatsState) {
  const bons = achatsState.bons || [];
  return (supplierState.suppliers || [])
    .map((supplier) => {
      const name = supplier.raisonSociale || supplier.nomCommercial || supplier.name || "-";
      const supplierOrders = bons.filter((bc) => String(bc.supplierId || bc.supplierName || "").includes(supplier.id) || String(bc.supplierName || "") === name);
      const evaluations = supplier.evaluations || [];
      const score = evaluations.length
        ? evaluations.reduce((sum, item) => sum + (Number(item.global) || 0), 0) / evaluations.length
        : Number(supplier.score || 0) || 0;
      return {
        name,
        orders: supplierOrders.length,
        delay: supplier.averageDelay || supplier.delaiMoyen || "-",
        compliance: supplier.complianceRate || supplier.tauxConformite || "-",
        score: score ? score.toFixed(1) : "-",
      };
    })
    .sort((a, b) => Number(b.score === "-" ? 0 : b.score) - Number(a.score === "-" ? 0 : a.score))
    .slice(0, 5);
}

function dashboardEmptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}"><div class="dashboard-empty">${message}</div></td></tr>`;
}

function renderDashboardPage() {
  if (pageActionsEl) {
    renderDashboardActions();
  }

  if (!pageContentEl) return;

  const interventionDirectory = loadInterventionsState();
  const equipmentDirectory = getEquipmentDirectory();
  const stockDirectory = getStockDirectory();
  const achatsState = loadAchatsState();
  const supplierState = dashboardGetSupplierState();
  const selectedType = localStorage.getItem("dashboardType") || "OT";
  const stats = getDashboardInterventionStats(selectedType);
  const interventionRows = dashboardGetInterventionRows(interventionDirectory)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const dashboardAlertItems = getCombinedNotifications();
  const alertCount = dashboardAlertItems.length;
  const recentInterventions = interventionRows.slice(0, 5);
  const workOrderStatus = dashboardBuildOtStatusPie(stats);
  const monthlyInterventions = dashboardBuildMonthlyInterventionChart(interventionRows);
  const availabilityByZone = dashboardBuildAvailabilityByZone(equipmentDirectory);
  const maintenanceTypePie = dashboardBuildMaintenanceTypePie(interventionRows);
  const stockFamilyPie = dashboardBuildStockFamilyPie();
  const weeklyPlanning = dashboardBuildWeekPlanning(interventionDirectory);
  const recentActivity = dashboardBuildActivity(
    interventionRows,
    achatsState,
    stockDirectory,
    interventionDirectory,
  );
  const businessKpis = dashboardBuildBusinessKpis(
    interventionRows,
    stockDirectory.records || [],
  );
  const purchaseBudget = dashboardBuildPurchaseBudgetChart(achatsState);
  const topSuppliers = dashboardBuildTopSuppliers(supplierState, achatsState);
  const totalEquipments = (equipmentDirectory.equipments || []).length;
  const operationalEquipments = (equipmentDirectory.equipments || []).filter(
    (equipment) => equipment.status === "En service",
  ).length;
  const equipmentAvailability = dashboardPercent(operationalEquipments, totalEquipments);
  const lateOts = (interventionDirectory.ots || []).filter((ot) =>
    dashboardIsLate(ot.plannedDate || ot.createdAt, ot.status),
  ).length;
  const activeInterventions = interventionRows.filter(
    (row) => !dashboardIsClosedStatus(row.status),
  ).length;
  const pendingDa = (achatsState.demandes || []).filter(
    (da) => !dashboardIsClosedStatus(da.status),
  );
  const criticalStock = getStockAlerts().filter((alert) => alert.type === "crit");
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthMaintenanceCost = interventionRows
    .filter((row) => String(row.date || "").slice(0, 7) === currentMonthKey)
    .reduce((sum, row) => sum + (Number(row.cost) || 0), 0);
  const budgetMonth = (achatsState.bons || [])
    .filter((bc) => String(bc.createdAt || bc.date || bc.orderDate || "").slice(0, 7) === currentMonthKey)
    .reduce((sum, bc) => sum + (Number(bc.budget ?? bc.totalTtc ?? bc.total ?? bc.amount ?? 0) || 0), 0);
  const upcomingWork = [...(interventionDirectory.ots || [])]
    .filter((item) => !dashboardIsClosedStatus(item.status))
    .sort(
      (a, b) =>
        new Date(a.plannedDate || a.createdAt || 0) -
        new Date(b.plannedDate || b.createdAt || 0),
    )
    .slice(0, 3)
    .map((item) => ({
      title: `${item.ref || "OT"} · ${item.equipmentLabel || item.diRef || "Ordre"}`,
      meta: `${dashboardFormatDate(item.plannedDate || item.createdAt)} · ${item.technicianLabel || "-"}`,
      accent:
        item.priority === "Critique"
          ? "var(--danger)"
          : item.priority === "Haute"
            ? "var(--warning)"
            : "var(--brand)",
      priorityClass: getInterventionBadgeClass(item.priority),
      priorityLabel: item.priority || "Standard",
    }));
  const dashboardKpis = [
    {
      label: "Interventions actives",
      value: dashboardFormatNumber(activeInterventions),
      footer: "DI, OT et BT ouverts",
      icon: "fa-screwdriver-wrench",
      tone: "info",
    },
    {
      label: "Équipements opérationnels",
      value: `${dashboardFormatNumber(operationalEquipments)} / ${equipmentAvailability}%`,
      footer: `${dashboardFormatNumber(totalEquipments)} équipements`,
      icon: "fa-gears",
      tone: "success",
    },
    {
      label: "OT en retard",
      value: dashboardFormatNumber(lateOts),
      footer: "échéance dépassée",
      icon: "fa-clock",
      tone: lateOts ? "danger" : "success",
    },
    {
      label: "DA en attente",
      value: dashboardFormatNumber(pendingDa.length),
      footer: `${pendingDa.filter((da) => String(da.priority || da.urgency || "").toLowerCase().includes("urgent")).length} urgentes`,
      icon: "fa-file-circle-exclamation",
      tone: "warning",
    },
    {
      label: "Stock critique",
      value: `${dashboardFormatNumber(criticalStock.length)} articles`,
      footer: "sous seuil min",
      icon: "fa-box-open",
      tone: criticalStock.length ? "danger" : "success",
    },
    {
      label: "Coût maintenance ce mois",
      value: dashboardFormatMoney(monthMaintenanceCost),
      footer: `budget ${dashboardFormatMoney(budgetMonth)}`,
      icon: "fa-coins",
      tone: "info",
    },
  ];

  pageContentEl.className = "dashboard-page";
  pageContentEl.innerHTML = `
    <section class="dashboard-kpi-grid">
      ${dashboardKpis
      .map(
        (kpi) => `
            <div class="kpi-card dashboard-kpi-card ${kpi.tone}">
              <div class="kpi-header">
                <div class="kpi-label">${kpi.label}</div>
                <div class="kpi-icon ${kpi.tone}"><i class="fa-solid ${kpi.icon}"></i></div>
              </div>
              <div class="kpi-value">${kpi.value}</div>
              <div class="kpi-footer">${kpi.footer}</div>
            </div>
          `,
      )
      .join("")}
    </section>

    <section class="dashboard-grid dashboard-grid-2">
      <div class="card dashboard-chart-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-chart-column"></i> Interventions par mois</div>
          <span class="status-badge badge-info">6 derniers mois</span>
        </div>
        <div class="dashboard-stacked-chart">
          ${monthlyInterventions.data
      .map(
        (month) => `
                <div class="stacked-month">
                  <div class="stacked-bar" style="height:${Math.max(6, (month.total / monthlyInterventions.max) * 150)}px">
                    <span class="stacked-segment corrective" style="height:${month.total ? (month.Corrective / month.total) * 100 : 0}%"></span>
                    <span class="stacked-segment preventive" style="height:${month.total ? (month.Préventive / month.total) * 100 : 0}%"></span>
                    <span class="stacked-segment regulatory" style="height:${month.total ? (month.Réglementaire / month.total) * 100 : 0}%"></span>
                  </div>
                  <strong>${month.total}</strong>
                  <span>${month.label}</span>
                </div>
              `,
      )
      .join("")}
        </div>
        <div class="dashboard-chart-legend">
          <span><i class="legend-dot danger"></i>Corrective</span>
          <span><i class="legend-dot success"></i>Préventive</span>
          <span><i class="legend-dot info"></i>Réglementaire</span>
        </div>
      </div>

      <div class="card dashboard-chart-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-chart-simple"></i> Disponibilité équipements par zone</div>
        </div>
        <div class="card-body dashboard-zone-list">
          ${availabilityByZone.length
      ? availabilityByZone
        .map(
          (zone) => `
                <div class="dashboard-zone-row">
                  <div class="progress-label"><span>${escapeHtml(zone.label)}</span><span>${zone.percent}%</span></div>
                  <div class="progress-bar"><div class="progress-fill ${zone.percent < 75 ? "fill-danger" : zone.percent < 90 ? "fill-warning" : "fill-success"}" style="width:${zone.percent}%"></div></div>
                  <small>${dashboardFormatNumber(zone.total)} équipements</small>
                </div>
              `,
        )
        .join("")
      : `<div class="dashboard-empty">Aucune zone disponible.</div>`}
        </div>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid-3">
      <div class="card dashboard-pie-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-chart-pie"></i> Statut des interventions</div>
          <select id="dashboardInterventionType" class="dashboard-select">
            <option value="DI">DI</option>
            <option value="OT">OT</option>
            <option value="BT">BT</option>
          </select>
        </div>
        <div class="donut-wrap dashboard-pie-wrap">
          <div class="donut" style="${workOrderStatus.style}">
            <div class="donut-center">
              <div class="donut-pct">${stats.pctTermine}%</div>
              <div class="donut-lbl">Terminés</div>
            </div>
          </div>
          <div class="legend">
            ${workOrderStatus.items
      .map(
        (item) => `
                <div class="legend-item">
                  <div class="legend-dot" style="background:${item.color}"></div>
                  <span class="muted">${item.label}</span>
                  <span class="legend-count">${item.percent}%</span>
                </div>
              `,
      )
      .join("")}
          </div>
        </div>
      </div>

      <div class="card dashboard-pie-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-screwdriver-wrench"></i> Types de maintenance</div>
        </div>
        <div class="donut-wrap dashboard-pie-wrap">
          <div class="dashboard-pie" style="${maintenanceTypePie.style}"></div>
          <div class="legend">
            ${maintenanceTypePie.items
      .map(
        (item) => `
                <div class="legend-item">
                  <div class="legend-dot" style="background:${item.color}"></div>
                  <span class="muted">${item.label}</span>
                  <span class="legend-count">${item.percent}%</span>
                </div>
              `,
      )
      .join("")}
          </div>
        </div>
      </div>

      <div class="card dashboard-pie-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-boxes-stacked"></i> Valeur stock par famille</div>
        </div>
        <div class="donut-wrap dashboard-pie-wrap">
          <div class="dashboard-pie" style="${stockFamilyPie.style}"></div>
          <div class="legend">
            ${stockFamilyPie.items.length
      ? stockFamilyPie.items
        .map(
          (item) => `
                  <div class="legend-item">
                    <div class="legend-dot" style="background:${item.color}"></div>
                    <span class="muted">${escapeHtml(item.label)}</span>
                    <span class="legend-count">${item.percent}%</span>
                  </div>
                `,
        )
        .join("")
      : `<div class="dashboard-empty">Aucune valeur stock.</div>`}
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-list-check"></i> Interventions récentes</div>
          <a href="#interventions" class="link-all" data-dashboard-route="interventions">Voir module <i class="fa-solid fa-arrow-right"></i></a>
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
              ${recentInterventions.length
      ? recentInterventions
        .map(
          (intervention) => `
                    <tr>
                      <td><span class="mono-ref">${escapeHtml(intervention.ref)}</span></td>
                      <td><strong>${escapeHtml(intervention.equipment)}</strong></td>
                      <td class="muted">${escapeHtml(intervention.type)}</td>
                      <td><span class="priority-tag ${intervention.priorityClass}">${escapeHtml(intervention.priority)}</span></td>
                      <td><span class="status-badge ${intervention.statusClass}">${escapeHtml(intervention.status)}</span></td>
                      <td class="muted">${escapeHtml(intervention.technician)}</td>
                    </tr>
                  `,
        )
        .join("")
      : dashboardEmptyRow(6, "Aucune intervention enregistrée.")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-bell"></i> Alertes actives</div>
          <span class="status-badge badge-danger">${alertCount} actives</span>
        </div>
        <div class="alert-list dashboard-alert-list">
          ${dashboardAlertItems.length
      ? dashboardAlertItems
        .map(
          (alert) => `
                  <div class="alert-item ${alert.type}">
                    <i class="fa-solid ${alert.icon} alert-icon"></i>
                    <div>
                      <div class="alert-text">${escapeHtml(alert.title)}</div>
                      <div class="alert-sub">${escapeHtml(alert.subtitle)}</div>
                    </div>
                    <div class="alert-time">${escapeHtml(alert.time)}</div>
                  </div>
                `,
        )
        .join("")
      : `<div class="dashboard-empty">Aucune alerte active.</div>`}
        </div>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-calendar-week"></i> Planning semaine</div>
          <a href="#planification" class="link-all" data-dashboard-route="planification">Planification <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="card-body">
          <div class="dashboard-week-bars">
            ${weeklyPlanning.days
      .map(
        (day) => `
                <div class="dashboard-week-day">
                  <div class="dashboard-week-track">
                    <span style="height:${Math.max(8, (day.count / weeklyPlanning.max) * 88)}px"></span>
                  </div>
                  <strong>${dashboardFormatNumber(day.count)}</strong>
                  <small>${escapeHtml(day.label)}</small>
                </div>
              `,
      )
      .join("")}
          </div>
          <div class="dashboard-next-list">
            <div class="card-mini-title">Prochaines interventions</div>
            ${upcomingWork.length
      ? upcomingWork
        .map(
          (item) => `
                  <div class="dashboard-next-item">
                    <i style="background:${item.accent}"></i>
                    <div>
                      <strong>${escapeHtml(item.title)}</strong>
                      <span>${escapeHtml(item.meta)}</span>
                    </div>
                    <span class="priority-tag ${item.priorityClass}">${escapeHtml(item.priorityLabel)}</span>
                  </div>
                `,
        )
        .join("")
      : `<div class="dashboard-empty">Aucune intervention planifiée.</div>`}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-timeline"></i> Activité récente</div>
          <a href="#stock/historique" class="link-all" data-dashboard-route="stock/historique">Historique <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="card-body">
          <ul class="timeline">
            ${recentActivity.length
      ? recentActivity
        .map(
          (item) => `
                  <li class="tl-item">
                    <div class="tl-dot ${item.tone}"><i class="fa-solid ${item.icon}"></i></div>
                    <div class="tl-content">
                      <div class="tl-title">${escapeHtml(item.title)}</div>
                      <div class="tl-meta">${escapeHtml(item.meta)}</div>
                    </div>
                  </li>
                `,
        )
        .join("")
      : `<li class="dashboard-empty">Aucune activité récente.</li>`}
          </ul>
        </div>
      </div>
    </section>

    <section class="dashboard-business-grid">
      ${businessKpis
      .map(
        (kpi) => `
            <div class="planning-kpi-card dashboard-business-card">
              <strong>${escapeHtml(kpi.value)}</strong>
              <span>${escapeHtml(kpi.label)}</span>
              <small>${escapeHtml(kpi.sub)}</small>
            </div>
          `,
      )
      .join("")}
    </section>

    <section class="dashboard-grid dashboard-grid-2">
      <div class="card dashboard-chart-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-chart-line"></i> Budget achats par mois</div>
        </div>
        <div class="dashboard-budget-chart">
          ${purchaseBudget.months
      .map(
        (month) => `
              <div class="budget-month">
                <div class="budget-bars">
                  <span class="allocated" style="height:${Math.max(4, (month.allocated / purchaseBudget.max) * 110)}px"></span>
                  <span class="engaged" style="height:${Math.max(4, (month.engaged / purchaseBudget.max) * 110)}px"></span>
                </div>
                <strong>${dashboardFormatMoney(month.engaged)}</strong>
                <small>${month.label}</small>
              </div>
            `,
      )
      .join("")}
        </div>
        <div class="dashboard-chart-legend">
          <span><i class="legend-dot info"></i>Alloué</span>
          <span><i class="legend-dot success"></i>Engagé</span>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-truck"></i> Top fournisseurs</div>
          <a href="#fournisseurs" class="link-all" data-dashboard-route="fournisseurs">Fournisseurs <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>BC en cours</th>
                <th>Délai moyen</th>
                <th>Taux conformité</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${topSuppliers.length
      ? topSuppliers
        .map(
          (supplier) => `
                  <tr>
                    <td><strong>${escapeHtml(supplier.name)}</strong></td>
                    <td>${dashboardFormatNumber(supplier.orders)}</td>
                    <td>${escapeHtml(String(supplier.delay))}</td>
                    <td>${escapeHtml(String(supplier.compliance))}</td>
                    <td><span class="status-badge badge-info">${escapeHtml(String(supplier.score))}</span></td>
                  </tr>
                `,
        )
        .join("")
      : dashboardEmptyRow(5, "Aucun fournisseur enregistré.")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  const typeSelect = document.getElementById("dashboardInterventionType");

  if (typeSelect) {
    typeSelect.value = selectedType;
    typeSelect.addEventListener("change", function () {
      localStorage.setItem("dashboardType", this.value);
      renderDashboardPage();
    });
  }

  pageContentEl.querySelectorAll("[data-dashboard-route]").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const route = this.dataset.dashboardRoute || "dashboard";
      const routeParts = route.split("/");
      renderPage(routeParts[0], routeParts[1]);
      window.location.hash = route;
    });
  });
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
  return new Intl.NumberFormat(getAdministrationLocale(), {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatStockDateTime(date = new Date()) {
  return date.toLocaleString(getAdministrationLocale(), {
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
  return [];
}

function openStockLocationCreateModal() {
  const directory = getStockDirectory();

  const maxCode = Math.max(
    0,
    ...directory.locations.map((location) => {
      const match = String(location.code || "").match(/MAG-(\d+)/);
      return match ? Number(match[1]) : 0;
    }),
  );

  const nextCode = `MAG-${String(maxCode + 1).padStart(3, "0")}`;
  const bodyHtml = `
    <form class="org-form" data-stock-location-form>
      <div class="org-form-grid">

       <div class="field-group">
  <label>Code magasin</label>
  <input
    type="text"
    name="code"
    value="${nextCode}"
    readonly
  />
</div>

        <div class="field-group">
          <label>Nom magasin</label>
          <input type="text" name="name" required />
        </div>

        <div class="field-group field-group-wide">
          <label>Description</label>
          <textarea name="description" rows="3"></textarea>
        </div>

      </div>

      <div class="org-modal-actions">
        <button type="button" class="btn btn-outline" data-stock-close="true">
          Annuler
        </button>

        <button type="submit" class="btn btn-primary">
          Enregistrer
        </button>
      </div>
    </form>
  `;

  renderStockModal(
    "Nouveau magasin",
    "Création d'un emplacement de stockage",
    bodyHtml,
  );

  overlayRootEl
    ?.querySelector("[data-stock-location-form]")
    ?.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(this);

      const directory = getStockDirectory();

      directory.locations.push({
        id: `LOC-${Date.now()}`,
        code: nextCode,
        name: String(formData.get("name") || "").trim(),
        description: String(formData.get("description") || "").trim(),
      });

      saveStockDirectory(directory);

      showStockToast("Magasin créé avec succès.");

      if (overlayRootEl) overlayRootEl.innerHTML = "";

      renderStockMovementCreateModal();
    });
}

function getStockDirectory() {
  const fallback = {
    records: getDefaultStockRecords(),
    movements: [],
    locations: [
      {
        id: "LOC-001",
        code: "MAG-001",
        name: "Magasin Principal",
        description: "",
      },
    ],
  };

  try {
    const stored = window.localStorage.getItem(stockStorageKey);

    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored);

    return {
      records: Array.isArray(parsed.records)
        ? parsed.records.map(normalizeStockRecord)
        : fallback.records,

      movements: Array.isArray(parsed.movements)
        ? parsed.movements
        : fallback.movements,

      locations:
        Array.isArray(parsed.locations) && parsed.locations.length > 0
          ? parsed.locations
          : fallback.locations,
    };
  } catch (error) {
    console.error("Erreur lecture stock :", error);
    return fallback;
  }
}

function buildStockLocationOptions(selectedValue = "") {
  const locations = getStockDirectory().locations || [];

  if (!locations.length) {
    return `<option value="">Aucun magasin</option>`;
  }

  return locations
    .map(
      (location) => `
        <option
          value="${escapeHtml(location.name)}"
          ${location.name === selectedValue ? "selected" : ""}
        >
          ${escapeHtml(location.code)} - ${escapeHtml(location.name)}
        </option>
      `,
    )
    .join("");
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

  movement.isCancelled = true;
  saveStockDirectory(directory);

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

function getStockInventoryTemplate() {
  return {
    id: `INV-${Date.now()}`,
    status: "Ouvert",
    closedAt: "",
    inventoryId: `INV-${Date.now()}`,
    type: "Général",
    owner: "",
    observations: "",
    createdAt: new Date().toISOString(),
    openCount: 0,
    rows: [
      {
        articleId: "",
        article: "",
        location: "",
        theoretical: 0,
        counted: 0,
        observations: "",
      },
    ],
  };
}

function getStockInventories() {
  try {
    const raw = window.localStorage.getItem(stockInventoriesStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // ignore storage errors
  }

  return [];
}

function saveStockInventories(inventories) {
  try {
    window.localStorage.setItem(
      stockInventoriesStorageKey,
      JSON.stringify(inventories),
    );
  } catch (error) {
    // ignore storage errors
  }
}

function getStockSelectedInventoryId() {
  try {
    return window.localStorage.getItem(stockSelectedInventoryStorageKey) || "";
  } catch (error) {
    return "";
  }
}

function saveStockSelectedInventoryId(inventoryId) {
  try {
    window.localStorage.setItem(
      stockSelectedInventoryStorageKey,
      String(inventoryId || ""),
    );
  } catch (error) {
    // ignore storage errors
  }
}

function getStockInventoryById(inventoryId) {
  return getStockInventories().find((item) => item.id === inventoryId) || null;
}

function getStockInventoryState() {
  const inventories = getStockInventories();
  const selectedId = getStockSelectedInventoryId();
  const target =
    inventories.find((item) => item.id === selectedId) ||
    inventories.find((item) => item.status === "Ouvert") ||
    inventories[0] ||
    getStockInventoryTemplate();
  if (!selectedId && target && target.id) {
    saveStockSelectedInventoryId(target.id);
  }
  return target;
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
  const baseNotifications = (
    Array.isArray(notifications) ? notifications : []
  ).map((notification, index) => ({
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
  const theoreticalInput = row.querySelector(
    "[data-stock-inventory-theoretical]"
  );

  const theoretical =
    Number(theoreticalInput?.value || 0) || 0;
  const countedInput = row.querySelector("[data-stock-inventory-counted]");
  const discrepancyCell = row.querySelector(
    "[data-stock-inventory-discrepancy]",
  );
  const statusBadge = row.querySelector("[data-stock-inventory-status]");
  const observationsInput = row.querySelector(
    "[data-stock-inventory-observations]",
  );
  const counted =
    Number(
      row.querySelector("[data-stock-inventory-counted]")?.value || 0
    ) || 0;

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
    let badgeClass = "";
    let badgeLabel = "";

    if (discrepancy === 0) {
      badgeClass = "badge-success";
      badgeLabel = "Conforme";
    } else if (discrepancy > 0) {
      badgeClass = "badge-info";
      badgeLabel = "Surstock";
    } else {
      badgeClass = "badge-danger";
      badgeLabel = "Manquant";
    }

    statusBadge.textContent = badgeLabel;
    statusBadge.className = `status-badge ${badgeClass}`;
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
  console.count("refreshInventorySummary");
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
  // Toasts disabled per user preference (silent mode)
  return;
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
      <button class="btn btn-primary" type="button" data-stock-action="create-fiche" onclick="openStockRecordCreate()">
        <i class="fa-solid fa-plus"></i>
        <span>Nouvelle fiche stock</span>
      </button>
    `,
    mouvements: `
      <button class="btn btn-primary" type="button" data-stock-action="create-movement">
        <i class="fa-solid fa-right-left"></i>
        <span>Nouveau mouvement</span>
      </button>
    `,
    inventaire: `
      <button class="btn btn-primary" type="button" data-stock-action="create-inventory">
        <i class="fa-solid fa-clipboard-check"></i>
        <span>Nouveau inventaire</span>
      </button>
    `,
    historique: "",
  };

  pageActionsEl.innerHTML = actionMap[activeSubpageKey] || "";
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

function getStockRecordKey(record) {
  return `${record.articleId || ""}__${record.locationKey || record.locationLabel || ""}`;
}

function getStockRecordRiskLevel(record) {
  const quantity = Number(record.currentQuantity) || 0;
  const safetyStock = Number(record.safetyStock) || 0;
  const minStock = Number(record.minStock) || 0;
  if (quantity <= safetyStock) return "danger";
  if (quantity <= minStock) return "warning";
  return "success";
}

function getStockRecordRiskLabel(record) {
  const level = getStockRecordRiskLevel(record);
  if (level === "danger") return "Critique";
  if (level === "warning") return "Alerte";
  return "Normal";
}

function getStockRecordRiskBadge(record) {
  const level = getStockRecordRiskLevel(record);
  if (level === "danger") return "badge-danger";
  if (level === "warning") return "badge-warning";
  return "badge-success";
}

function getStockRecordDescription(record) {
  const article = getArticleRecord("articles", record.articleId);
  return `${article ? `${article.code} — ${article.name}` : record.articleId || "Article"} · ${record.locationLabel || "Emplacement"}`;
}

function getStockInventoryTypeOptions(selectedValue = "") {
  return [
    ["Général", "Général"],
    ["Tournant", "Tournant"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}"${value === selectedValue ? " selected" : ""}>${label}</option>`,
    )
    .join("");
}

function getStockMovementFormTitle(type) {
  if (type === "entry") return "Entrée de stock";
  if (type === "exit") return "Sortie de stock";
  if (type === "transfer") return "Transfert de stock";
  return "Mouvement de stock";
}

function getStockMovementListTitle(type) {
  if (type === "entry") return "Entrées";
  if (type === "exit") return "Sorties";
  if (type === "transfer") return "Transferts";
  return "Mouvements";
}

function getStockMovementTypeFilterLabel(type) {
  if (type === "entry") return "Entrée";
  if (type === "exit") return "Sortie";
  if (type === "transfer") return "Transfert";
  return "Tous";
}

function renderStockModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;
  overlayRootEl.innerHTML = `
    <div class="org-modal open stock-modal-open" role="presentation">
      <div class="org-modal-backdrop" data-stock-close="true"></div>
      <div class="org-modal-panel stock-modal-panel" role="dialog" aria-modal="true">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Stock</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-stock-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="org-modal-body">${bodyHtml}</div>
      </div>
    </div>
  `;

  overlayRootEl
    .querySelectorAll("[data-stock-close='true']")
    .forEach((button) => {
      button.addEventListener("click", function () {
        if (overlayRootEl) overlayRootEl.innerHTML = "";
      });
    });
}
function buildInventoryArticleOptions(selectedId = "") {
  return getArticleRecords("articles")
    .map(
      (article) => `
        <option value="${article.id}"
          ${article.id === selectedId ? "selected" : ""}>
          ${article.code} - ${article.name}
        </option>
      `,
    )
    .join("");
}

function buildInventoryLocationOptions(selectedLocation = "") {
  const directory = getStockDirectory();

  return (directory.locations || [])
    .map(
      (location) => `
        <option value="${location.id}"
          ${location.id === selectedLocation ? "selected" : ""}>
          ${location.code} - ${location.name}
        </option>
      `,
    )
    .join("");
}

function buildInventoryRowMarkup(row) {
  const selectedArticleId = row.articleId || row.article || "";
  const discrepancy = row.counted - row.theoretical;
  let badgeClass = "";
  let badgeLabel = "";

  if (discrepancy === 0) {
    badgeClass = "badge-success";
    badgeLabel = "Conforme";
  } else if (discrepancy > 0) {
    badgeClass = "badge-info";
    badgeLabel = "Surstock";
  } else {
    badgeClass = "badge-danger";
    badgeLabel = "Manquant";
  }
  const discrepancyLabel =
    discrepancy > 0 ? `+${discrepancy}` : String(discrepancy);
  return `
    <tr data-stock-inventory-row data-stock-article-id="${escapeHtml(selectedArticleId)}" data-location-label="${escapeHtml(row.location)}" data-theoretical="${row.theoretical}">
      <td><select
  class="stock-inline-input"
  data-stock-inventory-article
>
  ${buildInventoryArticleOptions(selectedArticleId)}
</select></td>
      <td><select
  class="stock-inline-input"
  data-stock-inventory-location
>
  ${buildInventoryLocationOptions(row.location)}
</select></td>
      <td><input type="number" value="${row.theoretical}" class="stock-inline-input" data-stock-inventory-theoretical readonly /></td>
      <td><input type="number" value="${row.counted}" class="stock-inline-input" data-stock-inventory-counted /></td>
      <td class="${discrepancy === 0 ? "muted" : discrepancy > 0 ? "stock-discrepancy-positive" : "stock-discrepancy-negative"}" data-stock-inventory-discrepancy>${discrepancyLabel}</td>
      <td><span class="status-badge ${badgeClass}" data-stock-inventory-status>${badgeLabel}</span></td>
      <td><input type="text" value="${escapeHtml(row.observations)}" class="stock-inline-input stock-inline-text" data-stock-inventory-observations /></td>
      <td>
        <div class="org-row-actions">
          <button class="org-icon-btn" type="button" data-stock-inventory-action="details" title="Voir"><i class="fa-regular fa-eye"></i></button>
          <button class="org-icon-btn" type="button" data-stock-inventory-action="edit" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="org-icon-btn danger" type="button" data-stock-inventory-action="delete" title="Réinitialiser"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
  `;
}

function buildStockInventoryModalBody(inventoryState) {
  const isEditing = Boolean(inventoryState.isEditing);
  const inventoryRows =
    Array.isArray(inventoryState.rows) && inventoryState.rows.length
      ? inventoryState.rows
      : [
        {
          articleId: getArticleRecords("articles")[0]?.id || "",
          article: "",
          location: "",
          theoretical: 0,
          counted: 0,
          observations: "",
        },
      ];

  return `
    <form class="org-form stock-form" data-stock-inventory-form>
      <div class="org-form-grid">
        <div class="field-group">
          <label>Numéro</label>
          <input type="text" name="inventoryId" value="${escapeHtml(inventoryState.inventoryId || `INV-${Date.now()}`)}" ${isEditing ? "readonly" : ""} required />
        </div>
        <div class="field-group">
          <label>Date inventaire</label>
          <input type="date" name="inventoryDate" value="${escapeHtml(inventoryState.createdAt ? inventoryState.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))}" required />
        </div>
        <div class="field-group field-group-wide">
          <label>Type</label>
          <select name="inventoryType">${getStockInventoryTypeOptions(inventoryState.type || "Général")}</select>
        </div>
        <div class="field-group field-group-wide">
          <label>Responsable inventaire</label>
          <select name="inventoryOwner">${buildStockResponsibleOptions(inventoryState.owner || "Nadia Rami")}</select>
        </div>
        <div class="field-group field-group-wide">
          <label>Observations</label>
          <textarea rows="4" placeholder="Objectif, consignes, date limite de saisie terrain..." data-stock-inventory-observations>${escapeTextarea(inventoryState.observations || "")}</textarea>
        </div>
      </div>
      <div class="stock-form-actions">
        <button class="btn btn-primary" type="submit" data-stock-submit="inventory">
          <i class="fa-solid fa-check"></i>
          <span>${isEditing ? "Enregistrer les modifications" : "Créer l'inventaire"}</span>
        </button>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${inventoryRows.map(buildInventoryRowMarkup).join("")}
              </tbody>
            </table>
          </div>
          <div class="stock-form-actions">
            <button class="btn btn-secondary" type="button" data-stock-inventory-add-row>
              <i class="fa-solid fa-plus"></i>
              <span>Nouvelle ligne</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  `;
}

function openStockInventoryModal(inventoryId = "") {
  const existingInventory = inventoryId
    ? getStockInventoryById(inventoryId)
    : null;
  if (inventoryId && !existingInventory) return;
  if (existingInventory?.status === "Clôturé") return;

  const inventoryState = existingInventory
    ? { ...existingInventory, isEditing: true }
    : getStockInventoryTemplate();
  renderStockModal(
    existingInventory ? `Modifier ${existingInventory.id}` : "Créer un inventaire",
    existingInventory
      ? "Mettez à jour les informations et la feuille de comptage."
      : "Saisissez un nouvel inventaire depuis une fenêtre modale.",
    buildStockInventoryModalBody(inventoryState),
  );

  const inventoryForm = overlayRootEl?.querySelector(
    "[data-stock-inventory-form]",
  );
  if (!inventoryForm) return;

  refreshInventorySummary(inventoryForm);

  inventoryForm.addEventListener("change", function (event) {
    const target = event.target;
    if (!target || !target.matches("[data-stock-inventory-article]")) return;
    const row = target.closest("[data-stock-inventory-row]");
    if (!row) return;
    const articleId = String(target.value || "").trim();
    const theoreticalInput = row.querySelector("[data-stock-inventory-theoretical]");
    if (!theoreticalInput) return;
    if (articleId) {
      const totals = getStockTotalsForArticle(articleId);
      theoreticalInput.value = Number(totals.currentQuantity) || 0;
    } else {
      theoreticalInput.value = 0;
    }
    refreshInventorySummary(inventoryForm);
  });

  inventoryForm.addEventListener("input", function (event) {
    const target = event.target;
    if (!target || !target.closest("[data-stock-inventory-row]")) return;
    refreshInventorySummary(inventoryForm);
  });

  inventoryForm.addEventListener("click", function (event) {
    const addRowButton = event.target.closest("[data-stock-inventory-add-row]");
    if (addRowButton) {
      const tbody = inventoryForm.querySelector("tbody");
      if (tbody) {
        tbody.insertAdjacentHTML(
          "beforeend",
          buildInventoryRowMarkup({
            articleId: "",
            article: "",
            location: "",
            theoretical: 0,
            counted: 0,
            observations: "",
          }),
        );
      }
      return;
    }

    const inventoryAction = event.target.closest(
      "[data-stock-inventory-action]",
    );
    if (!inventoryAction || !inventoryForm.contains(inventoryAction)) return;

    const row = inventoryAction.closest("[data-stock-inventory-row]");
    if (!row) return;

    const action = String(inventoryAction.dataset.stockInventoryAction || "");
    if (action === "details") {
      renderStockInventoryRowDetails(row);
    } else if (action === "edit") {
      row.querySelector("[data-stock-inventory-counted]")?.focus();
    } else if (action === "delete") {
      const confirmed = window.confirm("Supprimer cette ligne ?");
      if (!confirmed) return;
      row.remove();
      refreshInventorySummary(inventoryForm);
      showStockToast("Ligne supprimée.");
    }
  });

  inventoryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    refreshInventorySummary(inventoryForm);
    createStockInventoryFromForm(inventoryForm);
    if (overlayRootEl) overlayRootEl.innerHTML = "";
    renderStockPage(getCurrentStockSubpage());
  });
}

function createStockInventoryFromForm(form) {
  const inventoryId = String(
    form.querySelector("[name='inventoryId']")?.value || `INV-${Date.now()}`,
  );
  const inventoryType = String(
    form.querySelector("[name='inventoryType']")?.value || "Général",
  );
  const inventoryOwner = String(
    form.querySelector("[name='inventoryOwner']")?.value || "",
  );
  const observations = String(
    form.querySelector("[data-stock-inventory-observations]")?.value || "",
  );
  const rows = Array.from(
    form.querySelectorAll("[data-stock-inventory-row]"),
  ).map((row) => {
    const article = String(
      row.querySelector("[data-stock-inventory-article]")?.value || "",
    );
    const location = String(
      row.querySelector("[data-stock-inventory-location]")?.value || "",
    );
    const theoretical =
      Number(
        row.querySelector("[data-stock-inventory-theoretical]")?.value || 0,
      ) || 0;
    const counted =
      Number(row.querySelector("[data-stock-inventory-counted]")?.value || 0) ||
      0;
    const observationsRow = String(
      row.querySelector("[data-stock-inventory-observations]")?.value || "",
    );
    return {
      articleId: article,
      article,
      location,
      theoretical,
      counted,
      observations: observationsRow,
    };
  });

  const discrepancies = rows.map((row) => row.counted - row.theoretical);
  const openCount = discrepancies.filter((value) => value !== 0).length;

  const inventories = getStockInventories();
  const existingIndex = inventories.findIndex(
    (item) => item.id === inventoryId,
  );
  const existingInventory =
    existingIndex >= 0 ? inventories[existingIndex] : null;
  const inventoryDate = String(
    form.querySelector("[name='inventoryDate']")?.value || "",
  );
  const inventoryRecord = {
    ...existingInventory,
    id: inventoryId,
    inventoryId,
    status: existingInventory?.status || "Ouvert",
    type: inventoryType,
    owner: inventoryOwner,
    observations,
    createdAt: inventoryDate
      ? `${inventoryDate}T00:00:00.000Z`
      : existingInventory?.createdAt || new Date().toISOString(),
    closedAt: existingInventory?.closedAt || "",
    openCount,
    rows,
  };

  if (existingIndex >= 0) {
    inventories[existingIndex] = inventoryRecord;
  } else {
    inventories.unshift(inventoryRecord);
  }

  saveStockInventories(inventories);
  saveStockSelectedInventoryId(inventoryId);
}

function closeStockInventoryById(inventoryId) {
  const inventories = getStockInventories();
  const index = inventories.findIndex((item) => item.id === inventoryId);
  if (index < 0) return;

  const inventory = inventories[index];
  if (inventory.status === "Clôturé") return;

  inventories[index] = {
    ...inventory,
    status: "Clôturé",
    closedAt: new Date().toISOString(),
  };

  saveStockInventories(inventories);
  saveStockSelectedInventoryId(inventoryId);
  renderStockPage(getCurrentStockSubpage());
}

function deleteStockInventoryById(inventoryId) {
  const inventory = getStockInventoryById(inventoryId);
  if (!inventory) return;

  const confirmed = window.confirm(
    `Supprimer définitivement l'inventaire ${inventory.id} ?`,
  );
  if (!confirmed) return;

  const inventories = getStockInventories().filter(
    (item) => item.id !== inventoryId,
  );
  saveStockInventories(inventories);

  if (getStockSelectedInventoryId() === inventoryId) {
    saveStockSelectedInventoryId(inventories[0]?.id || "");
  }

  renderStockPage(getCurrentStockSubpage());
}

function openStockRecordDetails(recordKey) {
  const directory = getStockDirectory();

  const record = directory.records.find(
    (item) => getStockRecordKey(item) === recordKey,
  );

  if (!record) {
    showToast?.("Fiche stock introuvable");
    return;
  }

  const article = getArticleRecord("articles", record.articleId);

  const totalValue =
    (Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0);
  const bodyHtml = `
    <div class="stock-detail-grid">
      <div class="org-detail-list">
        <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(article ? `${article.code} — ${article.name}` : record.articleId || "-")}</strong></div>
        <div class="org-detail-item"><span>Quantité</span><strong>${escapeHtml(record.currentQuantity)}</strong></div>
        <div class="org-detail-item"><span>PMP</span><strong>${formatStockNumber(record.pmp)} DH</strong></div>
        <div class="org-detail-item"><span>Valeur totale</span><strong>${formatStockNumber(totalValue)} DH</strong></div>
        <div class="org-detail-item"><span>Minimum</span><strong>${escapeHtml(record.minStock)}</strong></div>
        <div class="org-detail-item"><span>Sécurité</span><strong>${escapeHtml(record.safetyStock)}</strong></div>
        <div class="org-detail-item"><span>Réapprovisionnement</span><strong>${escapeHtml(record.replenishmentQty)}</strong></div>
        <div class="org-detail-item"><span>Emplacement</span><strong>${escapeHtml(record.locationLabel || "-")}</strong></div>
        <div class="org-detail-item"><span>État</span><strong>${getStockRecordRiskLabel(record)}</strong></div>
        <div class="org-detail-item"><span>Dernière mise à jour</span><strong>${formatStockDateTime(parseStockDateValue(record.updatedAt) || new Date(record.updatedAt || Date.now()))}</strong></div>
      </div>
      <div class="stock-modal-notes">
        <strong>Observations</strong>
        <p>${escapeHtml(record.observations || "Aucune observation")}</p>
      </div>
    </div>
    <div class="org-modal-actions">
      <button class="btn btn-outline" type="button" data-stock-close="true">Fermer</button>
      <button class="btn btn-outline" type="button" data-stock-print-record="true">
        <i class="fa-solid fa-print"></i>
        <span>Imprimer la fiche</span>
      </button>
    </div>
  `;

  renderStockModal(
    `Fiche stock ${article ? article.code : ""}`.trim(),
    "Vue détaillée de la fiche avec impression.",
    bodyHtml,
  );

  overlayRootEl
    ?.querySelector("[data-stock-print-record='true']")
    ?.addEventListener("click", function () {
      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${escapeHtml(record.articleId || "Fiche stock")}</title>
            <link rel="stylesheet" href="style.css" />
          </head>
          <body class="stock-print-body">
            <div class="stock-print-sheet">
              <div class="stock-print-head">
                <div>
                  <div class="stock-print-kicker">Fiche stock</div>
                  <h1>${escapeHtml(article ? `${article.code} — ${article.name}` : record.articleId || "Article")}</h1>
                  <p>${escapeHtml(record.locationLabel || "Emplacement non renseigné")}</p>
                </div>
                <div class="stock-print-meta">${formatStockDateTime(new Date())}</div>
              </div>
              <div class="org-detail-list">
                <div class="org-detail-item"><span>Quantité</span><strong>${escapeHtml(record.currentQuantity)}</strong></div>
                <div class="org-detail-item"><span>PMP</span><strong>${formatStockNumber(record.pmp)} DH</strong></div>
                <div class="org-detail-item"><span>Valeur totale</span><strong>${formatStockNumber((Number(record.currentQuantity) || 0) * (Number(record.pmp) || 0))} DH</strong></div>
                <div class="org-detail-item"><span>Minimum</span><strong>${escapeHtml(record.minStock)}</strong></div>
                <div class="org-detail-item"><span>Sécurité</span><strong>${escapeHtml(record.safetyStock)}</strong></div>
                <div class="org-detail-item"><span>Réapprovisionnement</span><strong>${escapeHtml(record.replenishmentQty)}</strong></div>
                <div class="org-detail-item"><span>État</span><strong>${getStockRecordRiskLabel(record)}</strong></div>
              </div>
              <div class="stock-print-notes">
                <strong>Observations</strong>
                <p>${escapeHtml(record.observations || "Aucune observation")}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
      };
    });
}

function openStockRecordDeleteConfirm(recordKey) {
  const record = getStockRecords().find(
    (item) => getStockRecordKey(item) === recordKey,
  );
  if (!record) return;

  const confirmed = window.confirm(
    `Supprimer la fiche stock ${record.articleId || ""} / ${record.locationLabel || ""} ?`,
  );
  if (!confirmed) return;

  const directory = getStockDirectory();
  const nextRecords = directory.records.filter(
    (item) => getStockRecordKey(item) !== recordKey,
  );

  if (nextRecords.length === directory.records.length) return;

  directory.records = nextRecords;
  saveStockDirectory(directory);
  syncStockArticleQuantityFromRecords(record.articleId);
  renderStockPage(getCurrentStockSubpage());
}

function openStockRecordEdit(recordKey) {
  const record = getStockRecords().find(
    (item) => getStockRecordKey(item) === recordKey,
  );
  if (!record) return;

  const article = getArticleRecord("articles", record.articleId);
  const bodyHtml = `
    <form class="org-form stock-form" data-stock-record-form data-stock-record-id="${escapeHtml(getStockRecordKey(record))}">
      <div class="org-form-grid">
        <div class="field-group field-group-wide">
          <label>Article</label>
          <select name="articleId" disabled>
            ${buildStockArticleOptions(record.articleId)}
          </select>
        </div>
        <div class="field-group">
          <label>Quantité</label>
          <input type="number" name="currentQuantity" min="0" step="1" value="${escapeHtml(record.currentQuantity)}" />
        </div>
        <div class="field-group">
          <label>PMP</label>
          <input type="number" name="pmp" min="0" step="0.01" value="${escapeHtml(record.pmp)}" />
        </div>
        <div class="field-group">
          <label>Stock minimum</label>
          <input type="number" name="minStock" min="0" step="1" value="${escapeHtml(record.minStock)}" />
        </div>
        <div class="field-group">
          <label>Stock maximum</label>
          <input type="number" name="maxStock" min="0" step="1" value="${escapeHtml(record.maxStock)}" />
        </div>
        <div class="field-group">
          <label>Stock de sécurité</label>
          <input type="number" name="safetyStock" min="0" step="1" value="${escapeHtml(record.safetyStock)}" />
        </div>
        <div class="field-group">
          <label>Réapprovisionnement</label>
          <input type="number" name="replenishmentQty" min="0" step="1" value="${escapeHtml(record.replenishmentQty)}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Emplacement</label>
          <input type="text" name="locationLabel" value="${escapeHtml(record.locationLabel || "")}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Observations</label>
          <textarea name="observations" rows="4">${escapeTextarea(record.observations || "")}</textarea>
        </div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Annuler</button>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </div>
    </form>
  `;

  renderStockModal(
    `Modifier la fiche ${article ? article.code : "stock"}`,
    "Les changements sont appliqués à la fiche stock sélectionnée.",
    bodyHtml,
  );

  overlayRootEl
    ?.querySelector("[data-stock-record-form]")
    ?.addEventListener("submit", function (event) {
      event.preventDefault();
      const form = this;
      const formData = new FormData(form);
      const locationLabel = String(formData.get("locationLabel") || "").trim();
      const nextLocation = locationLabel || record.locationLabel;
      const nextRecord = upsertStockRecord(
        record.articleId,
        {
          warehouse: record.warehouse,
          aisle: record.aisle,
          shelf: record.shelf,
          bin: record.bin,
        },
        {
          currentQuantity: Number(formData.get("currentQuantity") || 0),
          pmp: Number(formData.get("pmp") || 0),
          minStock: Number(formData.get("minStock") || 0),
          maxStock: Number(formData.get("maxStock") || 0),
          safetyStock: Number(formData.get("safetyStock") || 0),
          replenishmentQty: Number(formData.get("replenishmentQty") || 0),
          observations: String(formData.get("observations") || ""),
          locationLabel: nextLocation,
          locationKey: nextLocation,
          updatedAt: new Date().toISOString(),
        },
      );
      if (nextRecord) {
        syncStockArticleQuantityFromRecords(record.articleId);
        showStockToast(
          `Fiche mise à jour pour ${article ? article.name : "l'article"}.`,
        );
        if (overlayRootEl) overlayRootEl.innerHTML = "";
        renderStockPage(getCurrentStockSubpage());
      }
    });
}

function openStockRecordCreate() {
  const defaultArticleId = getArticleRecords("articles")[0]?.id || "";
  const bodyHtml = `
    <form class="org-form stock-form" data-stock-record-create-form>
      <div class="org-form-grid">
        <div class="field-group field-group-wide">
          <label>Article</label>
          <select name="articleId" required>
            ${buildStockArticleOptions(defaultArticleId)}
          </select>
        </div>
        <div class="field-group">
          <label>Quantité</label>
          <input type="number" name="currentQuantity" min="0" step="1" value="0" />
        </div>
        <div class="field-group">
          <label>PMP</label>
          <input type="number" name="pmp" min="0" step="0.01" value="0" />
        </div>
        <div class="field-group">
          <label>Stock minimum</label>
          <input type="number" name="minStock" min="0" step="1" value="15" />
        </div>
        <div class="field-group">
          <label>Stock maximum</label>
          <input type="number" name="maxStock" min="0" step="1" value="120" />
        </div>
        <div class="field-group">
          <label>Stock de sécurité</label>
          <input type="number" name="safetyStock" min="0" step="1" value="20" />
        </div>
        <div class="field-group">
          <label>Réapprovisionnement</label>
          <input type="number" name="replenishmentQty" min="0" step="1" value="40" />
        </div>
        <div class="field-group field-group-wide">
          <label>Emplacement</label>
          <input type="text" name="locationLabel" value="${buildStockLocationLabel(stockDefaultLocation)}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Observations</label>
          <textarea name="observations" rows="4" placeholder="Commentaire optionnel"></textarea>
        </div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Annuler</button>
        <button class="btn btn-primary" type="submit">Créer la fiche</button>
      </div>
    </form>
  `;

  renderStockModal(
    "Nouvelle fiche stock",
    "Renseignez l'article, l'emplacement et les seuils de suivi.",
    bodyHtml,
  );

  overlayRootEl
    ?.querySelector("[data-stock-record-create-form]")
    ?.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(this);
      const articleId = String(formData.get("articleId") || "");
      if (!articleId) return;

      const locationLabel = String(formData.get("locationLabel") || "").trim();
      const nextLocation =
        locationLabel || buildStockLocationLabel(stockDefaultLocation);

      upsertStockRecord(articleId, stockDefaultLocation, {
        currentQuantity: Number(formData.get("currentQuantity") || 0),
        pmp: Number(formData.get("pmp") || 0),
        minStock: Number(formData.get("minStock") || 0),
        maxStock: Number(formData.get("maxStock") || 0),
        safetyStock: Number(formData.get("safetyStock") || 0),
        replenishmentQty: Number(formData.get("replenishmentQty") || 0),
        observations: String(formData.get("observations") || ""),
        locationLabel: nextLocation,
        locationKey: nextLocation,
        updatedAt: new Date().toISOString(),
      });

      syncStockArticleQuantityFromRecords(articleId);
      if (overlayRootEl) overlayRootEl.innerHTML = "";
      renderStockPage(getCurrentStockSubpage());
      showStockToast(
        `Fiche stock créée pour ${getArticleRecord("articles", articleId)?.name || "l'article"}.`,
      );
    });
}

function getCurrentStockSubpage(fallback = "fiche-stock") {
  const hash = window.location.hash.replace("#", "").trim();
  if (!hash.startsWith("stock")) return fallback;
  const parts = hash.split("/");
  return parts[1] || fallback;
}

function getStockMovementRecord(movementId) {
  return (
    getStockDirectory().movements.find((item) => item.id === movementId) || null
  );
}

function getStockMovementsByType(type) {
  return getStockDirectory().movements.filter(
    (movement) =>
      movement.type === type && !movement.isReversal && !movement.isCancelled,
  );
}

function renderStockRecordCards(records) {
  if (!records.length) {
    return `
      <div class="org-empty-card org-empty-card--list">
        <div class="org-empty-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
        <h3>Aucune fiche stock</h3>
        <p>Les fiches stock apparaîtront ici avec les actions voir, modifier et supprimer.</p>
        <small>Le référentiel se met à jour à partir des mouvements et de l'inventaire.</small>
      </div>
    `;
  }

  return records
    .map((record) => {
      const article = getArticleRecord("articles", record.articleId);
      return `
        <div class="stock-record-card">
          <div class="stock-record-main">
            <div class="stock-record-head">
              <div class="card-title"><i class="fa-solid fa-boxes-stacked"></i> ${escapeHtml(article ? `${article.code} — ${article.name}` : record.articleId || "Article")}</div>
              <span class="status-badge ${getStockRecordRiskBadge(record)}">${getStockRecordRiskLabel(record)}</span>
            </div>
            <div class="stock-record-meta">
              <span>Qté ${escapeHtml(record.currentQuantity)}</span>
              <span>PMP ${formatStockNumber(record.pmp)} DH</span>
              <span>${escapeHtml(record.locationLabel || "Emplacement")}</span>
            </div>
            <p class="stock-record-description">${escapeHtml(getStockRecordDescription(record))}</p>
          </div>
          <div class="stock-record-side">
            <small>${escapeHtml(record.observations || "Aucune observation")}</small>
            <div class="org-row-actions">
              <button class="org-icon-btn" type="button" data-stock-record-action="details" data-stock-record-key="${escapeHtml(getStockRecordKey(record))}" title="Voir détails"><i class="fa-regular fa-eye"></i></button>
              <button class="org-icon-btn" type="button" data-stock-record-action="edit" data-stock-record-key="${escapeHtml(getStockRecordKey(record))}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="org-icon-btn danger" type="button" data-stock-record-action="delete" data-stock-record-key="${escapeHtml(getStockRecordKey(record))}" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderStockMovementList(type, movements) {
  if (!movements.length) {
    return `
      <div class="org-empty-card org-empty-card--list">
        <div class="org-empty-icon"><i class="fa-solid fa-right-left"></i></div>
        <h3>Aucune ${getStockMovementListTitle(type).toLowerCase()}</h3>
        <p>Les mouvements de type ${getStockMovementListTitle(type).toLowerCase()} s'afficheront ici.</p>
        <small>Utilisez le bouton de création pour enregistrer un mouvement.</small>
      </div>
    `;
  }

  return movements
    .map((movement) => {
      const article = getArticleRecord("articles", movement.articleId);
      const movementLabel = getStockMovementTypeLabel(movement.type);
      return `
        <div class="stock-movement-row">
          <div>
            <div class="intervention-history-title"><strong>${escapeHtml(movement.id)}</strong> · ${escapeHtml(article ? `${article.code} — ${article.name}` : "Article")}</div>
            <div class="intervention-history-sub">${escapeHtml(movementLabel)} · ${escapeHtml(movement.linkedDocument || movement.source || movement.destination || "-")}</div>
          </div>
          <div class="stock-movement-row-meta">
            <span class="status-badge ${getStockMovementTypeBadge(movement.type)}">${movementLabel}</span>
            <span class="muted">${formatStockDateTime(parseStockDateValue(movement.createdAt) || new Date(movement.createdAt))}</span>
          </div>
          <div class="org-row-actions">
            <button class="org-icon-btn" type="button" data-stock-movement-action="details" data-stock-movement-id="${escapeHtml(movement.id)}" title="Voir"><i class="fa-regular fa-eye"></i></button>
            <button class="org-icon-btn" type="button" data-stock-movement-action="edit" data-stock-movement-id="${escapeHtml(movement.id)}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="org-icon-btn danger" type="button" data-stock-movement-action="delete" data-stock-movement-id="${escapeHtml(movement.id)}" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderStockMovementDetails(movement) {
  const article = getArticleRecord("articles", movement.articleId);

  const directory = getStockDirectory();

  const sourceLocation = directory.locations?.find(
    (location) => location.id === movement.source,
  );

  const destinationLocation = directory.locations?.find(
    (location) => location.id === movement.destination,
  );

  const bodyHtml = `
    <div class="org-detail-list">

      <div class="org-detail-item">
        <span>Référence</span>
        <strong>${escapeHtml(movement.id || "-")}</strong>
      </div>

      <div class="org-detail-item">
        <span>Article</span>
        <strong>
          ${escapeHtml(
    article
      ? `${article.code} — ${article.name}`
      : movement.articleId || "-",
  )}
        </strong>
      </div>

      <div class="org-detail-item">
        <span>Type</span>
        <strong>
          ${escapeHtml(getStockMovementTypeLabel(movement.type))}
        </strong>
      </div>

      <div class="org-detail-item">
        <span>Quantité</span>
        <strong>
          ${escapeHtml(movement.quantity || 0)}
        </strong>
      </div>

      <div class="org-detail-item">
        <span>Magasin source</span>
        <strong>
          ${escapeHtml(
    sourceLocation
      ? `${sourceLocation.code} - ${sourceLocation.name}`
      : "-",
  )}
        </strong>
      </div>

      <div class="org-detail-item">
        <span>Magasin destination</span>
        <strong>
          ${escapeHtml(
    destinationLocation
      ? `${destinationLocation.code} - ${destinationLocation.name}`
      : "-",
  )}
        </strong>
      </div>

      <div class="org-detail-item">
        <span>Pièce jointe</span>
        <strong>
          ${escapeHtml(movement.attachmentName || "Aucune pièce jointe")}
        </strong>
      </div>

      <div class="org-detail-item org-detail-item--full">
        <span>Observations</span>
        <strong>
          ${escapeHtml(movement.observations || "Aucune observation")}
        </strong>
      </div>

    </div>

    <div class="org-modal-actions">
      <button
        class="btn btn-outline"
        type="button"
        data-stock-close="true"
      >
        Fermer
      </button>
    </div>
  `;

  renderStockModal(
    `Mouvement ${movement.id}`,
    "Détails du mouvement stock.",
    bodyHtml,
  );
  console.log("movement =", movement);
}

function renderStockMovementEdit(movement) {
  const article = getArticleRecord("articles", movement.articleId);
  const bodyHtml = `
    <form class="org-form stock-form" data-stock-movement-edit-form data-stock-movement-id="${escapeHtml(movement.id)}">
      <div class="org-form-grid">
        <div class="field-group field-group-wide">
          <label>Type de mouvement</label>
          <select name="type" disabled>
            <option value="${movement.type}" selected>${getStockMovementTypeLabel(movement.type)}</option>
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label>Article</label>
          <select name="articleId" disabled>
            ${buildStockArticleOptions(movement.articleId)}
          </select>
        </div>
        <div class="field-group">
          <label>Quantité</label>
          <input type="number" name="quantity" value="${escapeHtml(movement.quantity || 0)}" disabled />
        </div>
        <div class="field-group field-group-wide">
          <label>Document lié</label>
          <input type="text" name="linkedDocument" value="${escapeHtml(movement.linkedDocument || "")}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Emplacement</label>
          <input type="text" name="location" value="${escapeHtml(movement.location || movement.source || movement.destination || "")}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Utilisateur</label>
          <input type="text" name="user" value="${escapeHtml(movement.user || "Utilisateur connecté")}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Observations</label>
          <textarea name="observations" rows="4">${escapeTextarea(movement.observations || "")}</textarea>
        </div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Annuler</button>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </div>
    </form>
  `;

  renderStockModal(
    `Modifier ${movement.id}`,
    `Modifier les informations de ${getStockMovementTypeLabel(movement.type).toLowerCase()}.`,
    bodyHtml,
  );

  overlayRootEl
    ?.querySelector("[data-stock-movement-edit-form]")
    ?.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(this);
      const directory = getStockDirectory();
      const movementIndex = directory.movements.findIndex(
        (item) => item.id === movement.id,
      );
      if (movementIndex < 0) return;

      directory.movements[movementIndex] = {
        ...directory.movements[movementIndex],
        linkedDocument: String(formData.get("linkedDocument") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        user: String(formData.get("user") || "").trim(),
        observations: String(formData.get("observations") || "").trim(),
      };

      saveStockDirectory(directory);
      if (overlayRootEl) overlayRootEl.innerHTML = "";
      renderStockPage(getCurrentStockSubpage());
      showStockToast("Mouvement mis à jour.");
    });
}

function openStockMovementDetails(movement) {
  renderStockMovementDetails(movement);
}

function openStockMovementEdit(movement) {
  renderStockMovementEdit(movement);
}

function renderStockMovementCreateModal() {
  const articleOptions = buildStockArticleOptions(
    getArticleRecords("articles")[0]?.id || "",
  );
  const nextNumber = String(getStockDirectory().movements.length + 1).padStart(
    3,
    "0",
  );
  const defaultId = `MVT-${nextNumber}`;
  const nowLabel = formatStockDateTime(new Date());
  const connectedUser = getConnectedUserProfile();
  const connectedUserName = connectedUser
    ? getAdministrationUserFullName(connectedUser)
    : "Utilisateur connecté";

  const bodyHtml = `
    <form class="org-form stock-form" data-stock-movement-create-form>
      <div class="org-form-grid">
        <div class="field-group">
          <label>Code mouvement</label>
          <input type="text" name="id" value="${escapeHtml(defaultId)}" readonly />
        </div>

        <div class="field-group field-group-wide">
          <label>Type de mouvement</label>
          <select name="type" data-stock-create-movement-type required>
            <option value="entry">Entrée</option>
            <option value="exit">Sortie</option>
            <option value="transfer">Transfert</option>
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label>Article</label>
          <select name="articleId" required>${articleOptions}</select>
        </div>
        <div class="field-group">
          <label>Quantité</label>
          <input type="number" name="quantity" min="1" step="1" required />
        </div>
        <div class="field-group" data-stock-entry-only="true">
          <label>Prix unitaire</label>
          <input type="number" name="unitPrice" min="0" step="0.01" />
        </div>
       <div class="field-group field-group-wide">
  <label>Pièce jointe</label>
  <input
    type="file"
    name="attachment"
    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
  />
</div>

<div class="field-group">
  <label>Magasin source</label>

  <div class="stock-location-picker">
    <select name="source">
      ${buildStockLocationOptions()}
    </select>

    <button
      type="button"
      class="stock-location-add-btn"
      data-stock-create-location="true"
      title="Créer un magasin"
    >
      <i class="fa-solid fa-plus"></i>
    </button>
  </div>
</div>

<div class="field-group">
  <label>Magasin destination</label>

  <div class="stock-location-picker">
    <select name="destination">
      ${buildStockLocationOptions()}
    </select>

    <button
      type="button"
      class="stock-location-add-btn"
      data-stock-create-location="true"
      title="Créer un magasin"
    >
      <i class="fa-solid fa-plus"></i>
    </button>
  </div>
</div>


        <div class="field-group field-group-wide">
          <label>Observations</label>
          <textarea name="observations" rows="4"></textarea>
        </div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Annuler</button>
        <button class="btn btn-primary" type="submit">Créer le mouvement</button>
      </div>
    </form>
  `;

  renderStockModal(
    "Nouveau mouvement",
    "Choisissez le type de mouvement puis complétez les champs associés.",
    bodyHtml,
  );

  const typeSelect = overlayRootEl?.querySelector(
    "[data-stock-create-movement-type]",
  );
  const updateVisibility = () => {
    const movementType = String(typeSelect?.value || "entry");
    overlayRootEl
      ?.querySelectorAll("[data-stock-entry-only='true']")
      .forEach((element) => {
        element.hidden = movementType !== "entry";
      });
    overlayRootEl
      ?.querySelectorAll("[data-stock-exit-only='true']")
      .forEach((element) => {
        element.hidden = movementType !== "exit";
      });
    overlayRootEl
      ?.querySelectorAll("[data-stock-transfer-only='true']")
      .forEach((element) => {
        element.hidden = movementType !== "transfer";
      });
    overlayRootEl
      ?.querySelectorAll("[data-stock-entry-or-exit='true']")
      .forEach((element) => {
        element.hidden = !(movementType === "entry" || movementType === "exit");
      });
    overlayRootEl
      ?.querySelectorAll("[data-stock-source-location='true']")
      .forEach((element) => {
        element.hidden = !(
          movementType === "exit" || movementType === "transfer"
        );
      });
    overlayRootEl
      ?.querySelectorAll("[data-stock-destination-location='true']")
      .forEach((element) => {
        element.hidden = !(
          movementType === "entry" || movementType === "transfer"
        );
      });

    const linkedInput = overlayRootEl?.querySelector("[name='linkedDocument']");
    if (linkedInput) {
      if (movementType === "entry")
        linkedInput.placeholder = "BC (bon de commande / réception)";
      else if (movementType === "exit")
        linkedInput.placeholder = "BT (bon de sortie)";
      else linkedInput.placeholder = "";
    }
  };

  function buildStockLocationOptions(selected = "") {
    const directory = getStockDirectory();

    return (directory.locations || [])
      .map(
        (location) => `
        <option value="${location.id}"
          ${location.id === selected ? "selected" : ""}>
          ${location.code} - ${location.name}
        </option>
      `,
      )
      .join("");
  }

  typeSelect?.addEventListener("change", updateVisibility);
  updateVisibility();

  overlayRootEl
    ?.querySelectorAll("[data-stock-create-location='true']")
    .forEach((button) => {
      button.addEventListener("click", function () {
        openStockLocationCreateModal();
      });
    });

  overlayRootEl
    ?.querySelector("[data-stock-movement-create-form]")
    ?.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(this);
      const type = String(formData.get("type") || "entry");
      const articleId = String(formData.get("articleId") || "");
      if (!articleId) return;

      const directory = getStockDirectory();
      const article = getArticleRecord("articles", articleId);
      const quantity = Number(formData.get("quantity") || 0);
      if (quantity <= 0) return;

      const createdAt = new Date().toISOString();
      const attachment = formData.get("attachment");
      const movement = {
        id: String(formData.get("id") || `mov-${Date.now()}`),
        type,
        articleId,
        quantity,

        observations: String(formData.get("observations") || "").trim(),

        attachmentName: attachment && attachment.name ? attachment.name : "",

        createdAt,
      };

      if (type === "entry") {
        const source =
          String(formData.get("source") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const unitPrice = Number(formData.get("unitPrice") || 0);
        const destinationRaw =
          String(formData.get("destination") || "").trim();
        const aggregate = getStockTotalsForArticle(articleId);
        const nextPmp = calculateStockPmp(
          aggregate.currentQuantity,
          aggregate.pmp,
          quantity,
          unitPrice,
        );

        const allRecordsForArticle = getStockRecordsForArticle(articleId);
        const existingRecord =
          (destinationRaw
            ? allRecordsForArticle.find(
              (record) => record.locationLabel === destinationRaw,
            )
            : null) ||
          allRecordsForArticle[0] ||
          null;

        const destination = existingRecord
          ? existingRecord.locationLabel
          : destinationRaw || buildStockLocationLabel(stockDefaultLocation);

        const previousQuantity = Number(existingRecord?.currentQuantity ?? 0);

        upsertStockRecord(articleId, stockDefaultLocation, {
          currentQuantity: previousQuantity + quantity,
          pmp: nextPmp,
          locationLabel: destination,
          locationKey: destination,
          updatedAt: createdAt,
        });
        updateAllStockRecordsForArticle(articleId, { pmp: nextPmp });
        syncArticleQuantity(articleId, aggregate.currentQuantity + quantity);

        movement.unitPrice = unitPrice;
        movement.source = source;
        movement.location = destination;
        movement.destination = destination;
        movement.pmp = nextPmp;
        movement.resultingQuantity = aggregate.currentQuantity + quantity;
        movement.resultingValue =
          (aggregate.currentQuantity + quantity) * nextPmp;
      }

      else if (type === "exit") {
        const destination =
          String(formData.get("destination") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const source =
          String(formData.get("source") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const aggregate = getStockTotalsForArticle(articleId);
        const sourceRecord =
          getStockRecordsForArticle(articleId).find(
            (record) => record.locationLabel === source,
          ) ||
          getStockRecordsForArticle(articleId)[0] ||
          null;
        if (
          !sourceRecord ||
          quantity > (Number(sourceRecord.currentQuantity) || 0)
        )
          return;
        const nextQuantity =
          (Number(sourceRecord.currentQuantity) || 0) - quantity;
        if (nextQuantity <= 0) {
          removeStockRecord(articleId, sourceRecord.locationKey);
        } else {
          upsertStockRecord(articleId, sourceRecord, {
            currentQuantity: nextQuantity,
            pmp: aggregate.pmp,
            locationLabel: sourceRecord.locationLabel,
            locationKey: sourceRecord.locationKey,
            updatedAt: createdAt,
          });
        }
        syncArticleQuantity(articleId, aggregate.currentQuantity - quantity);
        movement.source = source;
        movement.destination = destination;
        movement.pmp = aggregate.pmp;
        movement.resultingQuantity = aggregate.currentQuantity - quantity;
        movement.resultingValue =
          (aggregate.currentQuantity - quantity) * aggregate.pmp;
      } else if (type === "transfer") {
        const source =
          String(formData.get("source") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const destination =
          String(formData.get("destination") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const aggregate = getStockTotalsForArticle(articleId);
        const sourceRecord =
          getStockRecordsForArticle(articleId).find(
            (record) => record.locationLabel === source,
          ) ||
          getStockRecordsForArticle(articleId)[0] ||
          null;
        if (
          !sourceRecord ||
          quantity > (Number(sourceRecord.currentQuantity) || 0)
        )
          window.alert(
            "Impossible d'effectuer le transfert : la quantité demandée dépasse le stock disponible.",
            "error"
          );
        return;
        return;
        const nextQuantity =
          (Number(sourceRecord.currentQuantity) || 0) - quantity;
        if (nextQuantity <= 0) {
          removeStockRecord(articleId, sourceRecord.locationKey);
        } else {
          upsertStockRecord(articleId, sourceRecord, {
            currentQuantity: nextQuantity,
            pmp: aggregate.pmp,
            locationLabel: sourceRecord.locationLabel,
            locationKey: sourceRecord.locationKey,
            updatedAt: createdAt,
          });
        }
        upsertStockRecord(
          articleId,
          {
            warehouse: stockDefaultLocation.warehouse,
            aisle: stockDefaultLocation.aisle,
            shelf: stockDefaultLocation.shelf,
            bin: stockDefaultLocation.bin,
          },
          {
            currentQuantity: quantity,
            pmp: aggregate.pmp,
            locationLabel: destination,
            locationKey: destination,
            updatedAt: createdAt,
          },
        );
        syncArticleQuantity(articleId, aggregate.currentQuantity);

        movement.source = source;
        movement.destination = destination;
        movement.pmp = aggregate.pmp;
        movement.resultingQuantity = aggregate.currentQuantity;
        movement.resultingValue = aggregate.currentQuantity * aggregate.pmp;
      }

      appendStockMovement(movement);
      saveStockDirectory(getStockDirectory());
      syncStockArticleQuantityFromRecords(articleId);
      if (overlayRootEl) overlayRootEl.innerHTML = "";
      renderStockPage(getCurrentStockSubpage());
      showStockToast(`${getStockMovementFormTitle(type)} créée.`);
    });
}

function renderStockInventoryRowDetails(row) {
  const article = getArticleRecord("articles", row.dataset.articleId || "");
  const theoretical = Number(row.dataset.theoretical || 0) || 0;
  const counted =
    Number(row.querySelector("[data-stock-inventory-counted]")?.value || 0) ||
    0;
  const discrepancy = counted - theoretical;
  renderStockModal(
    `Détail inventaire ${article ? article.code : ""}`.trim(),
    "Détail de la ligne d'inventaire sélectionnée.",
    `
      <div class="org-detail-list">
        <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(article ? `${article.code} — ${article.name}` : row.dataset.articleId || "-")}</strong></div>
        <div class="org-detail-item"><span>Emplacement</span><strong>${escapeHtml(row.dataset.locationLabel || "-")}</strong></div>
        <div class="org-detail-item"><span>Théorique</span><strong>${escapeHtml(theoretical)}</strong></div>
        <div class="org-detail-item"><span>Comptée</span><strong>${escapeHtml(counted)}</strong></div>
        <div class="org-detail-item"><span>Écart</span><strong>${discrepancy > 0 ? `+${discrepancy}` : discrepancy}</strong></div>
        <div class="org-detail-item"><span>Statut</span><strong>${discrepancy === 0 ? "Validé" : "À vérifier"}</strong></div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Fermer</button>
      </div>
    `,
  );
}

function openStockInventoryDetails(inventoryId) {
  const inventory = getStockInventoryById(inventoryId);
  if (!inventory) return;

  const rows = Array.isArray(inventory.rows) ? inventory.rows : [];
  const discrepancies = rows.map(
    (row) => (Number(row.counted) || 0) - (Number(row.theoretical) || 0),
  );
  const openCount = discrepancies.filter((value) => value !== 0).length;
  const positiveCount = discrepancies.filter((value) => value > 0).length;
  const negativeCount = discrepancies.filter((value) => value < 0).length;
  const locations = getStockDirectory().locations || [];

  const rowsMarkup = rows.length
    ? rows
      .map((row) => {
        const article = getArticleRecord("articles", row.articleId || "");
        const location = locations.find(
          (item) => item.id === row.location || item.code === row.location,
        );
        const theoretical = Number(row.theoretical) || 0;
        const counted = Number(row.counted) || 0;
        const discrepancy = counted - theoretical;
        const statusLabel =
          discrepancy === 0
            ? "Conforme"
            : discrepancy > 0
              ? "Surstock"
              : "Manquant";
        const statusClass =
          discrepancy === 0
            ? "badge-success"
            : discrepancy > 0
              ? "badge-info"
              : "badge-danger";

        return `
            <tr>
              <td>${escapeHtml(article ? `${article.code} — ${article.name}` : row.article || row.articleId || "-")}</td>
              <td>${escapeHtml(location ? `${location.code} — ${location.name}` : row.location || "-")}</td>
              <td>${formatStockNumber(theoretical)}</td>
              <td>${formatStockNumber(counted)}</td>
              <td>${discrepancy > 0 ? `+${formatStockNumber(discrepancy)}` : formatStockNumber(discrepancy)}</td>
              <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
              <td>${escapeHtml(row.observations || "-")}</td>
            </tr>
          `;
      })
      .join("")
    : `
        <tr>
          <td colspan="7" class="muted">Aucune ligne de comptage.</td>
        </tr>
      `;

  saveStockSelectedInventoryId(inventory.id);
  renderStockModal(
    `Inventaire ${escapeHtml(inventory.id)}`,
    "Détails et résultats de l'inventaire sélectionné.",
    `
      <div class="stock-inventory-details-grid">
        <div class="stock-summary-item"><span>Type</span><strong>${escapeHtml(inventory.type || "-")}</strong></div>
        <div class="stock-summary-item"><span>Responsable</span><strong>${escapeHtml(inventory.owner || "-")}</strong></div>
        <div class="stock-summary-item"><span>Statut</span><strong>${escapeHtml(inventory.status || "-")}</strong></div>
        <div class="stock-summary-item"><span>Créé le</span><strong>${inventory.createdAt ? formatStockDateTime(new Date(inventory.createdAt)) : "-"}</strong></div>
        <div class="stock-summary-item"><span>Lignes</span><strong>${rows.length}</strong></div>
        <div class="stock-summary-item"><span>Écarts ouverts</span><strong>${openCount}</strong></div>
        <div class="stock-summary-item"><span>Surstocks</span><strong>${positiveCount}</strong></div>
        <div class="stock-summary-item"><span>Manquants</span><strong>${negativeCount}</strong></div>
      </div>
      <div class="stock-modal-notes">
        <strong>Observations</strong>
        <p>${escapeHtml(inventory.observations || "Aucune observation.")}</p>
      </div>
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
          <tbody>${rowsMarkup}</tbody>
        </table>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-stock-close="true">Fermer</button>
      </div>
    `,
  );
}

function buildStockFicheContent() {
  const records = getStockRecords()
    .slice()
    .sort((a, b) => {
      const articleA = getArticleRecord("articles", a.articleId);
      const articleB = getArticleRecord("articles", b.articleId);
      return String(articleA?.code || a.articleId || "").localeCompare(
        String(articleB?.code || b.articleId || ""),
        "fr-FR",
      );
    });
  const totals = getStockTotals();
  const alerts = getStockAlerts();
  const valueByArticle = records.reduce((sum, record) => {
    const quantity = Number(record.currentQuantity) || 0;
    const pmp = Number(record.pmp) || 0;
    return sum + quantity * pmp;
  }, 0);

  return `
    <div class="stock-page-shell">
      <div class="stock-kpi-grid">
        <div class="stock-kpi-card">
          <span>Fiches actives</span>
          <strong>${records.length}</strong>
          <small>emplacements enregistrés</small>
        </div>
        <div class="stock-kpi-card">
          <span>Quantité totale</span>
          <strong>${formatStockNumber(totals.quantity)}</strong>
          <small>unités en stock</small>
        </div>
        <div class="stock-kpi-card">
          <span>Valeur catalogue</span>
          <strong>${formatStockNumber(valueByArticle)} DH</strong>
          <small>valorisation actuelle</small>
        </div>
        <div class="stock-kpi-card ${alerts.length ? "danger" : ""}">
          <span>Alertes</span>
          <strong>${alerts.length}</strong>
          <small>fiches sous seuil</small>
        </div>
      </div>

      <div class="card stock-card stock-records-card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-boxes-stacked"></i> Fiches stock</div>
          <span class="status-badge badge-info">${records.length} fiches</span>
        </div>
        <div class="card-body">
          <div class="stock-record-list">
            ${renderStockRecordCards(records)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildStockMovementsContent() {
  const allMovements = getStockDirectory().movements.filter(
    (movement) => !movement.isReversal && !movement.isCancelled,
  );
  const entryMovements = allMovements
    .filter((movement) => movement.type === "entry")
    .slice(0, 3);
  const exitMovements = allMovements
    .filter((movement) => movement.type === "exit")
    .slice(0, 3);
  const transferMovements = allMovements
    .filter((movement) => movement.type === "transfer")
    .slice(0, 3);

  return `
    <div class="stock-page-shell">
      <div class="stock-kpi-grid">
        <div class="stock-kpi-card">
          <span>Entrées</span>
          <strong>${entryMovements.length}</strong>
          <small>mouvements récents</small>
        </div>
        <div class="stock-kpi-card">
          <span>Sorties</span>
          <strong>${exitMovements.length}</strong>
          <small>mouvements récents</small>
        </div>
        <div class="stock-kpi-card">
          <span>Transferts</span>
          <strong>${transferMovements.length}</strong>
          <small>mouvements récents</small>
        </div>
        <div class="stock-kpi-card">
          <span>Total tracé</span>
          <strong>${allMovements.length}</strong>
          <small>mouvements actifs</small>
        </div>
      </div>

      <div class="stock-list-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-arrow-down-short-wide"></i> Entrées</div>
            <span class="status-badge badge-success">${entryMovements.length} lignes</span>
          </div>
          <div class="card-body">
            ${renderStockMovementList("entry", entryMovements)}
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-arrow-up-right-from-square"></i> Sorties</div>
            <span class="status-badge badge-warning">${exitMovements.length} lignes</span>
          </div>
          <div class="card-body">
            ${renderStockMovementList("exit", exitMovements)}
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-right-left"></i> Transferts</div>
            <span class="status-badge badge-info">${transferMovements.length} lignes</span>
          </div>
          <div class="card-body">
            ${renderStockMovementList("transfer", transferMovements)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildStockInventoryContent() {
  const inventories = getStockInventories();
  const selectedInventoryId =
    getStockSelectedInventoryId() ||
    (inventories[0] && inventories[0].id) ||
    "";
  const selectedInventory =
    getStockInventoryById(selectedInventoryId) ||
    (inventories.length ? inventories[0] : null);
  const inventoryOptions = inventories
    .map(
      (inventory) =>
        `<option value="${escapeHtml(inventory.id)}"${inventory.id === selectedInventory.id ? " selected" : ""}>${escapeHtml(inventory.id)} — ${escapeHtml(inventory.type)} (${escapeHtml(inventory.status)})</option>`,
    )
    .join("");

  const selectedRows = selectedInventory ? selectedInventory.rows || [] : [];
  const discrepancies = selectedRows.map(
    (row) => row.counted - row.theoretical,
  );
  const positiveCount = discrepancies.filter((value) => value > 0).length;
  const negativeCount = discrepancies.filter((value) => value < 0).length;
  const openCount = discrepancies.filter((value) => value !== 0).length;

  return `
    <div class="stock-page-shell">
      <div class="stock-list-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-clipboard-list"></i> Inventaires</div>
            <button class="btn btn-outline" type="button" data-stock-action="create-inventory">
              <i class="fa-solid fa-plus"></i>
              <span>Créer un inventaire</span>
            </button>
          </div>
          <div class="card-body">
            ${inventories.length
      ? `<div class="table-wrap stock-inventory-list">
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Type</th>
                      <th>Responsable</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th>Clôturé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${inventories
        .map((inventory) => {
          const createdAt = inventory.createdAt
            ? formatStockDateTime(new Date(inventory.createdAt))
            : "-";
          const closedAt = inventory.closedAt
            ? formatStockDateTime(new Date(inventory.closedAt))
            : "-";
          return `
                          <tr>
                            <td>${escapeHtml(inventory.id)}</td>
                            <td>${escapeHtml(inventory.type)}</td>
                            <td>${escapeHtml(inventory.owner || "-")}</td>
                            <td><span class="status-badge ${inventory.status === "Clôturé" ? "badge-success" : "badge-info"}">${escapeHtml(inventory.status)}</span></td>
                            <td>${createdAt}</td>
                            <td>${closedAt}</td>
                            <td>
                              <div class="stock-inventory-actions">
                                <button class="org-icon-btn" type="button" data-stock-inventory-action="details" data-stock-inventory-id="${escapeHtml(inventory.id)}" title="Voir les détails" aria-label="Voir les détails">
                                  <i class="fa-regular fa-eye"></i>
                                </button>
                                ${inventory.status !== "Clôturé"
              ? `<button class="org-icon-btn" type="button" data-stock-inventory-action="edit-inventory" data-stock-inventory-id="${escapeHtml(inventory.id)}" title="Modifier" aria-label="Modifier">
                                  <i class="fa-regular fa-pen-to-square"></i>
                                </button>`
              : ""
            }
                                <button class="org-icon-btn danger" type="button" data-stock-inventory-action="delete-inventory" data-stock-inventory-id="${escapeHtml(inventory.id)}" title="Supprimer" aria-label="Supprimer">
                                  <i class="fa-regular fa-trash-can"></i>
                                </button>
                              ${inventory.status !== "Clôturé"
              ? `<button class="btn btn-primary" type="button" data-stock-inventory-action="close" data-stock-inventory-id="${escapeHtml(inventory.id)}">Clôturer</button>`
              : ""
            }
                              </div>
                            </td>
                          </tr>
                        `;
        })
        .join("")}
                  </tbody>
                </table>
              </div>`
      : `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-folder-open"></i></div><h3>Aucun inventaire</h3><p>Créez un inventaire pour commencer la saisie.</p></div>`
    }
          </div>
        </div>
      </div>

      <div class="stock-list-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-calculator"></i> Résultat inventaire</div>
            <div class="field-group field-group-inline stock-results-select">
              <label>Sélectionner</label>
              <select data-stock-results-selector>
                ${inventoryOptions}
              </select>
            </div>
          </div>
          <div class="card-body">
            ${selectedInventory
      ? `
              <div class="stock-inventory-details-grid">
                <div class="stock-summary-item">
                  <span>Inventaire</span>
                  <strong>${escapeHtml(selectedInventory.id)}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Statut</span>
                  <strong>${escapeHtml(selectedInventory.status)}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Responsable</span>
                  <strong>${escapeHtml(selectedInventory.owner || "-")}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Date création</span>
                  <strong>${selectedInventory.createdAt ? formatStockDateTime(new Date(selectedInventory.createdAt)) : "-"}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Écarts ouverts</span>
                  <strong>${openCount}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Écarts positifs</span>
                  <strong>${positiveCount}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Écarts négatifs</span>
                  <strong>${negativeCount}</strong>
                </div>
                <div class="stock-summary-item">
                  <span>Date clôture</span>
                  <strong>${selectedInventory.closedAt ? formatStockDateTime(new Date(selectedInventory.closedAt)) : "En attente"}</strong>
                </div>
              </div>
            `
      : `<p>Aucun inventaire sélectionné.</p>`
    }

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
                ${historyRows.length
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
                              ${row.type === "inventory" || row.isReversal
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
  if (pageActionsEl.dataset.stockActionHandlersBound === "true") return;
  pageActionsEl.dataset.stockActionHandlersBound = "true";

  pageActionsEl.addEventListener("click", function (event) {
    const stockAction = event.target.closest("[data-stock-action]");
    if (!stockAction || !pageActionsEl.contains(stockAction)) return;

    const action = String(stockAction.dataset.stockAction || "");
    if (action === "create-fiche") {
      openStockRecordCreate();
      return;
    }
    if (action === "create-movement") {
      renderStockMovementCreateModal();
      return;
    }
    if (action === "create-inventory") {
      openStockInventoryModal();
      return;
    }
    if (action === "scroll-inventory") {
      pageContentEl
        ?.querySelector("[data-stock-inventory-form]")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }
  });
}

function getStockArticleFromForm(form) {
  return String(
    form.querySelector("[data-stock-article-select]")?.value ||
    form.querySelector("select[name='articleId']")?.value ||
    "",
  );
}

function clonePlanificationDefaults() {
  return JSON.parse(JSON.stringify(planificationDefaults));
}

function loadPlanificationState() {
  try {
    const raw = window.localStorage.getItem(planificationStorageKey);
    if (!raw) {
      const seedState = clonePlanificationDefaults();
      try {
        window.localStorage.setItem(
          planificationStorageKey,
          JSON.stringify(seedState),
        );
      } catch (error) { }
      return seedState;
    }

    const parsed = JSON.parse(raw);
    const seedState = clonePlanificationDefaults();
    const state = {
      view: ["mensuelle", "hebdomadaire", "liste"].includes(parsed.view)
        ? parsed.view
        : seedState.view,
      plans: Array.isArray(parsed.plans) ? parsed.plans : seedState.plans,
      counters: Array.isArray(parsed.counters)
        ? parsed.counters
        : seedState.counters,
      readings: Array.isArray(parsed.readings)
        ? parsed.readings
        : seedState.readings,
      scheduledOrders: Array.isArray(parsed.scheduledOrders)
        ? parsed.scheduledOrders
        : seedState.scheduledOrders,
    };

    return state;
  } catch (error) {
    return clonePlanificationDefaults();
  }
}

function savePlanificationState(state) {
  try {
    window.localStorage.setItem(planificationStorageKey, JSON.stringify(state));
  } catch (error) { }
}

function buildPlanificationCode(prefix, items) {
  const maxNumber = items.reduce((max, item) => {
    const match = String(item.ref || "").match(
      new RegExp(`^${prefix}-(\\d+)$`),
    );
    const value = match ? Number(match[1]) : 0;
    return value > max ? value : max;
  }, 0);
  return `${prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
}

function getPlanificationTechnicianName(technicianId) {
  return (
    planificationTechniciens.find(
      (technician) => technician.id === technicianId,
    )?.name || "Technicien non attribué"
  );
}

function formatPlanificationDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(getAdministrationLocale());
}

function getPlanificationPlanBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("actif")) return "badge-success";
  if (normalized.includes("inact")) return "badge-gray";
  return "badge-info";
}

function getPlanificationOrderBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("retard")) return "badge-danger";
  if (normalized.includes("cours")) return "badge-warning";
  if (normalized.includes("plan")) return "badge-info";
  return "badge-gray";
}

function getPlanificationPriorityBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critique") return "badge-danger";
  if (normalized === "haute") return "badge-warning";
  if (normalized === "moyenne") return "badge-info";
  return "badge-gray";
}

function buildPlanificationTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages planification">
      ${Object.entries(sectionSubpages.planification.tabs)
      .map(
        ([key, tab]) => `
            <button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-plan-subpage="${key}">${tab.label}</button>
          `,
      )
      .join("")}
    </div>
  `;
}

function attachPlanificationTabHandlers() {
  if (!pageContentEl) return;
  pageContentEl.querySelectorAll("[data-plan-subpage]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.planSubpage || "plans-maintenance";
      renderPage("planification", nextSubpage);
      window.location.hash = `planification/${nextSubpage}`;
    });
  });
}

function renderPlanificationActionButtons(activeSubpageKey) {
  if (!pageActionsEl) return;

  if (activeSubpageKey === 'compteurs') {
    pageActionsEl.innerHTML = `
      <button class="btn btn-outline" type="button" data-plan-primary-action>
        <i class="fa-solid fa-gauge-high"></i><span>Saisir un relevé</span>
      </button>
      <button class="btn btn-primary" type="button" data-counter-new>
        <i class="fa-solid fa-plus"></i><span>Nouveau compteur</span>
      </button>`;
  } else {
    const label = activeSubpageKey === 'calendrier' ? 'Créer un OT' : 'Nouveau plan';
    pageActionsEl.innerHTML = `
      <button class="btn btn-primary" type="button" data-plan-primary-action>
        <i class="fa-solid fa-plus"></i><span>${label}</span>
      </button>`;
  }

  const primaryBtn = pageActionsEl.querySelector('[data-plan-primary-action]');
  if (primaryBtn) {
    primaryBtn.addEventListener('click', function () {
      const target = activeSubpageKey === 'compteurs'
        ? pageContentEl?.querySelector('[data-plan-reading-form]')
        : pageContentEl?.querySelector('.planning-architecture-card') || pageContentEl;
      if (target && typeof target.scrollIntoView === 'function')
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  pageActionsEl.querySelector('[data-counter-new]')
    ?.addEventListener('click', () => openPlanificationCounterModal('create'));
}

function buildPlanificationPlanCard(plan, state) {
  const technician = getPlanificationTechnicianName(plan.technicianId);
  const relatedCounter = plan.compteurId
    ? state.counters.find((counter) => counter.ref === plan.compteurId)
    : null;

  return `
    <div class="org-list-item planning-plan-card">
      <div class="card-head" style="margin-bottom:12px">
        <div class="card-title"><i class="fa-solid fa-layer-group"></i> ${plan.ref} · ${escapeHtml(plan.title)}</div>
        <span class="status-badge ${getPlanificationPlanBadgeClass(plan.status)}">${escapeHtml(plan.status)}</span>
      </div>
      <div class="org-detail-list">
        <div class="org-detail-item"><span>Type de plan</span><strong>${escapeHtml(plan.planType)}</strong></div>
        <div class="org-detail-item"><span>Type maintenance</span><strong>${escapeHtml(plan.maintenanceType)}</strong></div>
        <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(
    (() => {
      const eDir = getEquipmentDirectory();
      const e = eDir.equipments.find(e => e.id === ctr.equipmentId);
      return e ? e.code + ' ' + e.name : ctr.equipment || '-';
    })()
  )}</strong></div>
<div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(
    (() => {
      const oDir = getOrganeDirectory();
      const o = oDir.organes.find(o => o.id === ctr.organId);
      return o ? o.code + ' ' + o.name : ctr.organ || '-';
    })()
  )}</strong></div>
        <div class="org-detail-item"><span>Déclenchement</span><strong>${escapeHtml(plan.triggerLabel)}</strong></div>
        <div class="org-detail-item"><span>Technicien</span><strong>${escapeHtml(technician)}</strong></div>
        <div class="org-detail-item"><span>Durée estimée</span><strong>${escapeHtml(plan.durationHours)} h</strong></div>
        <div class="org-detail-item"><span>Prochaine échéance</span><strong>${formatPlanificationDate(plan.nextDueDate)}</strong></div>
      </div>
      <div class="planning-inline-tags">
        <span class="status-badge badge-gray">${escapeHtml(plan.frequency)}</span>
        <span class="status-badge badge-info">${escapeHtml(plan.alertThreshold)}</span>
        <span class="status-badge badge-warning">${escapeHtml(plan.actionThreshold)}</span>
        ${relatedCounter ? `<span class="status-badge badge-gray">${relatedCounter.ref}</span>` : ""}
      </div>
      <div class="planning-subgrid">
        <div>
          <div class="card-mini-title">Gamme opératoire</div>
          <ol class="planning-numbered-list">${plan.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ol>
        </div>
        <div>
          <div class="card-mini-title">Sécurité</div>
          <div class="planning-stack">${plan.safety.map((item) => `<span class="status-badge badge-info">${escapeHtml(item)}</span>`).join("")}</div>
          <div class="card-mini-title" style="margin-top:12px">Documents associés</div>
          <div class="planning-stack">${plan.documents.map((item) => `<span class="status-badge badge-gray">${escapeHtml(item)}</span>`).join("")}</div>
          <div class="card-mini-title" style="margin-top:12px">Articles nécessaires</div>
          <div class="planning-stack">${plan.articles.map((item) => `<span class="status-badge badge-success">${escapeHtml(item)}</span>`).join("")}</div>
        </div>
      </div>
    </div>
  `;
}

function renderPlanificationPlansPage(state, activeSubpageKey) {
  const plans = state.plans || [];
  const activePlans = plans.filter(
    (plan) => String(plan.status).toLowerCase() === "actif",
  );
  const systematic = plans.filter(
    (plan) => plan.planType === "Systématique",
  ).length;
  const conditional = plans.filter(
    (plan) => plan.planType === "Conditionnel",
  ).length;
  const predictive = plans.filter(
    (plan) => plan.planType === "Prédictif",
  ).length;

  pageContentEl.className = "organization-page planning-page";
  pageContentEl.innerHTML = `
    ${buildPlanificationTabs(activeSubpageKey)}
    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Référentiel opérationnel</div>
        <div class="org-section-title">Plans de maintenance</div>
        <div class="org-section-subtitle">Structuration complète des plans, de la règle de déclenchement jusqu'à la génération des OT.</div>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-success">${plans.length} plans</span>
        <span class="status-badge badge-info">${activePlans.length} actifs</span>
        <span class="status-badge badge-warning">${systematic} systématiques</span>
        <span class="status-badge badge-gray">${conditional} conditionnels</span>
        <span class="status-badge badge-gray">${predictive} prédictifs</span>
      </div>
    </div>
    <div class="planning-dashboard-grid">
      <div class="card planning-architecture-card">
        <div class="card-head"><div class="card-title"><i class="fa-solid fa-diagram-project"></i> Formulaire de création</div><span class="status-badge badge-info">PLN-XXX automatique</span></div>
        <div class="card-body">
          <div class="org-detail-list">
            <div class="org-detail-item"><span>Titre</span><strong>obligatoire</strong></div>
            <div class="org-detail-item"><span>Type de plan</span><strong>Systématique / Conditionnel / Prédictif</strong></div>
            <div class="org-detail-item"><span>Équipement</span><strong>obligatoire</strong></div>
            <div class="org-detail-item"><span>Organe</span><strong>optionnel</strong></div>
            <div class="org-detail-item"><span>Type maintenance</span><strong>Préventive / Prédictive / Réglementaire</strong></div>
            <div class="org-detail-item"><span>Fréquence</span><strong>selon le mode de déclenchement</strong></div>
            <div class="org-detail-item"><span>Seuils</span><strong>compteur lié ou seuil mesure</strong></div>
            <div class="org-detail-item"><span>Technicien</span><strong>Organisation</strong></div>
            <div class="org-detail-item"><span>Articles / tâches / sécurité</span><strong>Gamme opératoire complète</strong></div>
            <div class="org-detail-item"><span>Statut</span><strong>Actif / Inactif</strong></div>
          </div>
        </div>
      </div>
      <div class="planning-list-column">${plans.map((plan) => buildPlanificationPlanCard(plan, state)).join("")}</div>
    </div>
  `;
}

function buildPlanificationCalendarItems(state, viewKey) {
  const sortedOrders = [...(state.scheduledOrders || [])].sort(
    (a, b) => new Date(a.scheduledDate || 0) - new Date(b.scheduledDate || 0),
  );
  if (viewKey === "liste") return sortedOrders;
  return sortedOrders.filter((order) => {
    if (viewKey === "mensuelle") return order.calendarView === "Mensuelle";
    if (viewKey === "hebdomadaire")
      return order.calendarView === "Hebdomadaire";
    return true;
  });
}

function renderPlanificationCalendarPage(state, activeSubpageKey) {
  const viewKey = ["mensuelle", "hebdomadaire", "liste"].includes(state.view)
    ? state.view
    : "mensuelle";
  const items = buildPlanificationCalendarItems(state, viewKey);
  const lateItems = state.scheduledOrders.filter(
    (order) => order.status === "En retard",
  );
  const inProgressItems = state.scheduledOrders.filter(
    (order) => order.status === "En cours",
  );

  pageContentEl.className = "organization-page planning-page";
  pageContentEl.innerHTML = `
    ${buildPlanificationTabs(activeSubpageKey)}
    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Vue calendrier</div>
        <div class="org-section-title">Calendrier des interventions planifiées</div>
        <div class="org-section-subtitle">OT planifiés, en cours et en retard, avec préparation pour glisser-déposer et création depuis une date.</div>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${state.scheduledOrders.length} OT</span>
        <span class="status-badge badge-warning">${inProgressItems.length} en cours</span>
        <span class="status-badge badge-danger">${lateItems.length} en retard</span>
      </div>
    </div>
    <div class="planning-calendar-toolbar">
      <div class="planning-view-switches">
        ${[
      ["mensuelle", "Mensuelle"],
      ["hebdomadaire", "Hebdomadaire"],
      ["liste", "Liste"],
    ]
      .map(
        ([key, label]) =>
          `<button class="org-tab ${key === viewKey ? "active" : ""}" type="button" data-plan-view="${key}">${label}</button>`,
      )
      .join("")}
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-gray">Par équipement</span>
        <span class="status-badge badge-gray">Par technicien</span>
        <span class="status-badge badge-gray">Par type maintenance</span>
        <span class="status-badge badge-gray">Par priorité</span>
      </div>
    </div>
    <div class="planning-calendar-grid">
      <div class="card">
        <div class="card-head"><div class="card-title"><i class="fa-solid fa-calendar-days"></i> OT visibles sur la vue ${viewKey}</div><span class="status-badge badge-info">${items.length} éléments</span></div>
        <div class="card-body">
          ${items.length
      ? items
        .map(
          (item) => `
            <div class="org-list-item planning-calendar-item">
              <div>
                <div class="intervention-history-title"><strong>${escapeHtml(item.ref)}</strong> · ${escapeHtml(item.title)}</div>
                <div class="intervention-history-sub">${escapeHtml(item.equipment)} · ${escapeHtml(item.technician)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end">
                <div class="intervention-history-date">${formatPlanificationDate(item.scheduledDate)}</div>
                <span class="status-badge ${getPlanificationPriorityBadgeClass(item.priority)}">${escapeHtml(item.priority)}</span>
                <span class="status-badge ${getPlanificationOrderBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
                <span class="status-badge badge-gray">${escapeHtml(item.sourceType)} · ${escapeHtml(item.sourceRef)}</span>
              </div>
            </div>`,
        )
        .join("")
      : `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div><h3>Aucune intervention visible</h3><p>La vue courante ne contient pas d'OT planifiés.</p><small>Basculer sur une autre vue ou élargir les filtres.</small></div>`
    }
        </div>
      </div>
      <div class="planning-side-column">
        <div class="card">
          <div class="card-head"><div class="card-title"><i class="fa-solid fa-route"></i> Flux de déclenchement</div></div>
          <div class="card-body">
            <div class="planning-flow-box"><strong>Déclenchement systématique</strong><p>Plan actif → échéance atteinte → OT généré automatiquement → notification → assignation technicien → visible dans le calendrier.</p></div>
            <div class="planning-flow-box"><strong>Déclenchement compteur</strong><p>Relevé saisi → seuil action atteint → OT généré → compteur remis à zéro après clôture BT → prochain déclenchement recalculé.</p></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title"><i class="fa-solid fa-filter"></i> Filtres & actions</div></div>
          <div class="card-body"><div class="planning-stack"><span class="status-badge badge-gray">Filtre équipement</span><span class="status-badge badge-gray">Filtre technicien</span><span class="status-badge badge-gray">Filtre priorité</span><span class="status-badge badge-gray">Glisser-déposer</span><span class="status-badge badge-gray">Créer depuis date</span></div></div>
        </div>
      </div>
    </div>
  `;

  pageContentEl.querySelectorAll("[data-plan-view]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextView = this.dataset.planView || "mensuelle";
      const nextState = { ...state, view: nextView };
      savePlanificationState(nextState);
      renderPage("planification", activeSubpageKey);
      window.location.hash = `planification/${activeSubpageKey}`;
    });
  });
}

function openPlanificationCounterModal(mode, counterId = null) {
  const state = loadPlanificationState();
  const counter = counterId ? state.counters.find(c => c.id === counterId) : null;
  const isDetails = mode === "details";
  const isEdit = mode === "edit";
  const initialRef = counter?.ref || buildPlanificationCode("CPT", state.counters);

  // Options équipements
  const equipmentOptions = `<option value="">-- Aucun --</option>` +
    getEquipmentRecords('equipments')
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(e => `<option value="${escapeHtml(e.id)}"${counter?.equipmentId === e.id ? ' selected' : ''}>
        ${escapeHtml(e.code + ' — ' + e.name)}
      </option>`).join('');

  // Options organes
  const organeOptions = `<option value="">-- Aucun --</option>` +
    getOrganeRecords('organes')
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(o => `<option value="${escapeHtml(o.id)}"${counter?.organId === o.id ? ' selected' : ''}>
        ${escapeHtml(o.code + ' — ' + o.name)}
      </option>`).join('');

  // Options plans liés
  const planOptions = `<option value="">-- Aucun --</option>` +
    state.plans
      .sort((a, b) => a.ref.localeCompare(b.ref))
      .map(p => `<option value="${escapeHtml(p.id)}"${counter?.planId === p.id ? ' selected' : ''}>
        ${escapeHtml(p.ref + ' · ' + p.title)}
      </option>`).join('');

  const bodyHtml = isDetails ? `
    <div class="org-detail-list">
      <div class="org-detail-item"><span>Référence</span><strong>${escapeHtml(initialRef)}</strong></div>
      <div class="org-detail-item"><span>Nom</span><strong>${escapeHtml(counter?.name || '-')}</strong></div>
      <div class="org-detail-item"><span>Type</span><strong>${escapeHtml(counter?.type || '-')}</strong></div>
      <div class="org-detail-item"><span>Unité</span><strong>${escapeHtml(counter?.unit || '-')}</strong></div>
      <div class="org-detail-item"><span>Valeur actuelle</span><strong>${escapeHtml(String(counter?.currentValue ?? 0))} ${escapeHtml(counter?.unit || '')}</strong></div>
      <div class="org-detail-item"><span>Valeur initiale</span><strong>${escapeHtml(String(counter?.initialValue ?? 0))}</strong></div>
      <div class="org-detail-item"><span>Seuil alerte</span><strong>${escapeHtml(String(counter?.alertThreshold || '-'))}</strong></div>
      <div class="org-detail-item"><span>Seuil action</span><strong>${escapeHtml(String(counter?.actionThreshold || '-'))}</strong></div>
      <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(
    (() => { const e = getEquipmentRecords('equipments').find(e => e.id === counter?.equipmentId); return e ? e.code + ' — ' + e.name : '-'; })()
  )}</strong></div>
      <div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(
    (() => { const o = getOrganeRecords('organes').find(o => o.id === counter?.organId); return o ? o.code + ' — ' + o.name : '-'; })()
  )}</strong></div>
      <div class="org-detail-item"><span>Plan lié</span><strong>${escapeHtml(
    (() => { const p = state.plans.find(p => p.id === counter?.planId); return p ? p.ref + ' · ' + p.title : '-'; })()
  )}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(counter?.status || '-')}</strong></div>
    </div>
    <div class="org-modal-actions">
      <button class="btn btn-outline" type="button" data-plan-modal-close>Fermer</button>
      <button class="btn btn-primary" type="button" data-counter-edit-from-details>Modifier</button>
    </div>
  ` : `
    <form class="org-form-grid planning-modal-form" data-counter-form>
      <div class="field-group">
        <label>Référence</label>
        <input type="text" value="${escapeHtml(initialRef)}" disabled />
      </div>
      <div class="field-group">
        <label for="counterName">Nom du compteur</label>
        <input id="counterName" name="name" type="text"
          value="${escapeHtml(counter?.name || '')}"
          placeholder="Ex: Heures moteur pompe P1" required />
      </div>
      <div class="field-group">
        <label for="counterType">Type</label>
        <select id="counterType" name="type">
          ${['Horaire', 'Kilométrique', 'Cyclique', 'Pression', 'Température', 'Vibration', 'Autre']
    .map(t => `<option${counter?.type === t ? ' selected' : ''}>${t}</option>`)
    .join('')}
        </select>
      </div>
      <div class="field-group">
        <label for="counterUnit">Unité</label>
        <select id="counterUnit" name="unit">
          ${['h', 'km', 'cycles', 'bar', '°C', 'mm/s', 'tours', 'L', 'm³', 'Autre']
    .map(u => `<option${counter?.unit === u ? ' selected' : ''}>${u}</option>`)
    .join('')}
        </select>
      </div>
      <div class="field-group">
        <label for="counterInitial">Valeur initiale</label>
        <input id="counterInitial" name="initialValue" type="number" min="0" step="0.01"
          value="${escapeHtml(String(counter?.initialValue ?? 0))}" />
      </div>
      <div class="field-group">
        <label for="counterCurrent">Valeur actuelle</label>
        <input id="counterCurrent" name="currentValue" type="number" min="0" step="0.01"
          value="${escapeHtml(String(counter?.currentValue ?? 0))}" />
      </div>
      <div class="field-group">
        <label for="counterAlert">Seuil alerte</label>
        <input id="counterAlert" name="alertThreshold" type="number" min="0" step="1"
          value="${escapeHtml(String(counter?.alertThreshold || ''))}"
          placeholder="Ex: 450" />
      </div>
      <div class="field-group">
        <label for="counterAction">Seuil action (génère OT)</label>
        <input id="counterAction" name="actionThreshold" type="number" min="0" step="1"
          value="${escapeHtml(String(counter?.actionThreshold || ''))}"
          placeholder="Ex: 500" />
      </div>
      <div class="field-group">
        <label for="counterEquipment">Équipement lié</label>
        <select id="counterEquipment" name="equipmentId">${equipmentOptions}</select>
      </div>
      <div class="field-group">
        <label for="counterOrgane">Organe lié</label>
        <select id="counterOrgane" name="organId">${organeOptions}</select>
      </div>
      <div class="field-group field-group-wide">
        <label for="counterPlan">Plan de maintenance lié</label>
        <select id="counterPlan" name="planId">${planOptions}</select>
      </div>
      <div class="field-group">
        <label for="counterStatus">Statut</label>
        <select id="counterStatus" name="status">
          <option${(counter?.status || 'Actif') === 'Actif' ? ' selected' : ''}>Actif</option>
          <option${counter?.status === 'Inactif' ? ' selected' : ''}>Inactif</option>
          <option${counter?.status === 'En panne' ? ' selected' : ''}>En panne</option>
        </select>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-plan-modal-close>Annuler</button>
        <button class="btn btn-primary" type="submit">${isEdit ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </form>
  `;

  renderPlanificationModal(
    isDetails ? `Détails ${initialRef}` : isEdit ? `Modifier ${initialRef}` : `Nouveau compteur ${initialRef}`,
    isDetails ? "Fiche complète du compteur et ses seuils." : "Création et mise à jour d'un compteur de maintenance.",
    bodyHtml
  );

  if (isDetails) {
    overlayRootEl?.querySelector('[data-counter-edit-from-details]')
      ?.addEventListener('click', () => openPlanificationCounterModal('edit', counterId));
    return;
  }

  const form = overlayRootEl?.querySelector('[data-counter-form]');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const nextState = loadPlanificationState();
    const counterIndex = counter
      ? nextState.counters.findIndex(c => c.id === counter.id)
      : -1;

    const nextRecord = {
      ...(counter || {}),
      id: counter?.id || `counter-${Date.now()}`,
      ref: counter?.ref || buildPlanificationCode("CPT", nextState.counters),
      name: String(formData.get('name') || '').trim(),
      type: String(formData.get('type') || 'Horaire'),
      unit: String(formData.get('unit') || 'h'),
      initialValue: Number(formData.get('initialValue') || 0),
      currentValue: Number(formData.get('currentValue') || 0),
      alertThreshold: Number(formData.get('alertThreshold') || 0),
      actionThreshold: Number(formData.get('actionThreshold') || 0),
      equipmentId: String(formData.get('equipmentId') || '').trim(),
      organId: String(formData.get('organId') || '').trim(),
      planId: String(formData.get('planId') || '').trim(),
      status: String(formData.get('status') || 'Actif'),
      createdAt: counter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (counterIndex >= 0) {
      nextState.counters[counterIndex] = nextRecord;
    } else {
      nextState.counters.unshift(nextRecord);
    }

    savePlanificationState(nextState);
    closePlanificationModal();
    renderPlanificationPageClean("compteurs");
  });
}



function renderPlanificationCountersPage(state, activeSubpageKey) {
  const counters = state.counters || [];
  const readings = [...(state.readings || [])].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
  );
  const alertCounters = counters.filter(
    (counter) => counter.currentValue >= counter.alertThreshold,
  );
  const actionCounters = counters.filter(
    (counter) => counter.currentValue >= counter.actionThreshold,
  );

  pageContentEl.className = "organization-page planning-page";
  pageContentEl.innerHTML = `
    ${buildPlanificationTabs(activeSubpageKey)}
    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Compteurs & seuils</div>
        <div class="org-section-title">Déclenchement automatique basé sur l'usage</div>
        <div class="org-section-subtitle">Les relevés alimentent les seuils d'alerte et d'action, avec génération d'OT quand la valeur critique est atteinte.</div>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${counters.length} compteurs</span>
        <span class="status-badge badge-warning">${alertCounters.length} en alerte</span>
        <span class="status-badge badge-danger">${actionCounters.length} en action</span>
      </div>
    </div>
    <div class="planning-dashboard-grid">
      <div class="card">
        <div class="card-head"><div class="card-title"><i class="fa-solid fa-gauge-high"></i> Fiches compteur</div><span class="status-badge badge-info">CPT-XXX automatique</span></div>
        <div class="card-body">
         ${counters.length === 0
      ? `<p>Aucun compteur.</p>`
      : `
    <div class="field-group" style="margin-bottom:var(--space-4)">
      <label for="counterSelector">Sélectionner un compteur</label>
      <select id="counterSelector" data-counter-selector>
                 ${counters.length === 0
        ? `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-gauge-high"></i></div><h3>Aucun compteur</h3><p>Créez votre premier compteur.</p></div>`
        : `
              <div class="field-group" style="margin-bottom:16px">
                <label for="counterSelectorA">Sélectionner un compteur</label>
                <select id="counterSelectorA" data-counter-selector-a>
                  ${counters.map(c => {
          const icon = Number(c.currentValue) >= Number(c.actionThreshold || 0) ? "🔴"
            : Number(c.currentValue) >= Number(c.alertThreshold || 0) ? "🟡" : "🟢";
          return `<option value="${c.id}">${icon} ${escapeHtml(c.ref)} — ${escapeHtml(c.name)} (${escapeHtml(String(c.currentValue ?? 0))} ${escapeHtml(c.unit)})</option>`;
        }).join("")}
                </select>
              </div>
              <div data-counter-detail-a>${buildCounterDetailHtml(counters[0], state)}</div>`
      }
      </select>
    </div>
    <div data-counter-detail></div>
  `
    }
        </div>
      </div>
      <div class="planning-side-column">
        <div class="card">
          <div class="card-head"><div class="card-title"><i class="fa-solid fa-pen-ruler"></i> Saisie de relevé</div></div>
          <div class="card-body">
            <form class="planning-reading-form" data-plan-reading-form>
              <div class="field-group"><label for="planReadingCounter">Compteur</label><select id="planReadingCounter" name="counterId" required>${counters.map((counter) => `<option value="${counter.id}">${escapeHtml(counter.ref)} · ${escapeHtml(counter.name)}</option>`).join("")}</select></div>
              <div class="field-group"><label for="planReadingValue">Valeur relevée</label><input id="planReadingValue" name="value" type="number" step="0.01" required placeholder="Ex: 500" /></div>
              <div class="field-group field-group-wide"><label for="planReadingNotes">Observations</label><textarea id="planReadingNotes" name="observations" rows="4" placeholder="Commentaire optionnel"></textarea></div>
              <div class="planning-form-footer"><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i><span>Enregistrer le relevé</span></button></div>
            </form>
            <div class="planning-flow-box" style="margin-top:16px"><strong>Flux automatique</strong><p>Si le seuil d'action est dépassé, un OT est ajouté à la file planifiée et le plan concerné reste traçable dans l'historique.</p></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Historique des relevés</div><span class="status-badge badge-info">${readings.length} saisies</span></div>
          <div class="card-body">
            ${readings.length
      ? readings
        .map(
          (reading) => `
              <div class="org-list-item planning-reading-item">
                <div>
                  <div class="intervention-history-title"><strong>${escapeHtml(reading.ref)}</strong> · ${escapeHtml(reading.value)} ${escapeHtml(counters.find((counter) => counter.id === reading.counterId)?.unit || "")}</div>
                  <div class="intervention-history-sub">${escapeHtml(reading.createdBy)} · ${escapeHtml(reading.observations || "Aucune observation")}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                  <div class="intervention-history-date">${formatPlanificationDate(reading.date)}</div>
                  <span class="status-badge ${reading.otGenerated ? "badge-danger" : "badge-success"}">${reading.otGenerated ? "OT généré" : "Saisie tracée"}</span>
                </div>
              </div>`,
        )
        .join("")
      : `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-chart-line"></i></div><h3>Aucun relevé enregistré</h3><p>Les saisies apparaîtront ici avec leur traçabilité complète.</p><small>Le compteur lié pourra déclencher un OT automatique.</small></div>`
    }
          </div>
        </div>
      </div>
    </div>
  `;

  // Afficher le 1er compteur par défaut
  const detailEl = pageContentEl.querySelector("[data-counter-detail]");
  if (detailEl && counters.length > 0) {
    detailEl.innerHTML = buildCounterDetailHtml(counters[0], state);
  }

  // Changement de sélection
  pageContentEl.querySelector("[data-counter-selector]")?.addEventListener("change", function () {
    const ctr = counters.find(c => c.id === this.value);
    const el = pageContentEl.querySelector("[data-counter-detail]");
    if (el) el.innerHTML = buildCounterDetailHtml(ctr, state);
  });
  const form = pageContentEl.querySelector("[data-plan-reading-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const counterId = String(formData.get("counterId") || "");
      const value = Number(formData.get("value"));
      const observations = String(formData.get("observations") || "").trim();
      const stateToSave = loadPlanificationState();
      const counterIndex = stateToSave.counters.findIndex(
        (counter) => counter.id === counterId,
      );
      if (counterIndex < 0 || Number.isNaN(value)) return;

      const counter = stateToSave.counters[counterIndex];
      const readingDate = new Date().toISOString();
      let otGenerated = false;

      if (value >= counter.actionThreshold) {
        const existingGeneratedOrder = stateToSave.scheduledOrders.find(
          (order) =>
            order.sourceType === "Compteur" &&
            order.sourceRef === counter.ref &&
            order.status !== "Clôturé",
        );
        if (!existingGeneratedOrder) {
          const plan = stateToSave.plans.find(
            (item) => item.id === counter.planId,
          );
          stateToSave.scheduledOrders.push({
            id: `sot-${Date.now()}`,
            ref: buildPlanificationCode("OT", stateToSave.scheduledOrders),
            sourceType: "Compteur",
            sourceRef: counter.ref,
            title: `Intervention automatique ${counter.name}`,
            status: "Planifié",
            priority: "Critique",
            scheduledDate: readingDate,
            technician: getPlanificationTechnicianName(plan?.technicianId),
            equipment: counter.equipment,
            calendarView: "Liste",
          });
          otGenerated = true;
        }
      }

      stateToSave.counters[counterIndex] = {
        ...counter,
        currentValue: value,
        lastUpdate: readingDate,
      };
      stateToSave.readings.unshift({
        id: `reading-${Date.now()}`,
        counterId,
        ref: counter.ref,
        value,
        date: readingDate,
        createdBy: "Utilisateur connecté",
        observations,
        otGenerated,
      });

      savePlanificationState(stateToSave);
      renderPage("planification", activeSubpageKey);
      window.location.hash = `planification/${activeSubpageKey}`;
    });
  }
  if (pageContentEl && !pageContentEl.dataset.counterHandlersBound) {
    // APRÈS (correct)
    pageContentEl.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-counter-action]');
      if (!btn || !pageContentEl.contains(btn)) return;
      const action = btn.dataset.counterAction;
      const counterId = btn.dataset.counterId;

      if (action === 'details') {
        openPlanificationCounterModal('details', counterId);
      } else if (action === 'edit') {
        openPlanificationCounterModal('edit', counterId);
      } else if (action === 'reset') {
        if (!window.confirm('Remettre la valeur du compteur à zéro ?')) return;
        const s = loadPlanificationState();
        const c = s.counters.find(c => c.id === counterId);
        if (c) {
          c.currentValue = 0;
          c.updatedAt = new Date().toISOString();
          savePlanificationState(s);
          renderPlanificationCountersPage(s, 'compteurs');
        }
      } else if (action === 'delete') {
        if (!window.confirm('Supprimer ce compteur définitivement ?')) return;
        const s = loadPlanificationState();
        s.counters = s.counters.filter(c => c.id !== counterId);
        savePlanificationState(s);
        renderPlanificationCountersPage(s, 'compteurs');
      }
    });
  }
}

function renderPlanificationPage(subpageKey = "plans-maintenance") {
  const state = loadPlanificationState();
  const activeSubpageKey = sectionSubpages.planification.tabs[subpageKey]
    ? subpageKey
    : sectionSubpages.planification.defaultSubpage;

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText("Planification");
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(
      sectionSubpages.planification.tabs[activeSubpageKey].body,
    );

  renderPlanificationActionButtons(activeSubpageKey);

  if (activeSubpageKey === "calendrier") {
    renderPlanificationCalendarPage(state, activeSubpageKey);
  } else if (activeSubpageKey === "compteurs") {
    renderPlanificationCountersPage(state, activeSubpageKey);
  } else {
    renderPlanificationPlansPage(state, activeSubpageKey);
  }

  attachPlanificationTabHandlers();
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

  if (recordsForArticle.length === 0) {
    window.alert(
      "Impossible d\u2019effectuer le mouvement : aucune fiche de stock n\u2019existe pour cet article.",
    );
    return;
  }

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

  pageContentEl
    .querySelectorAll("[data-stock-movement-form]")
    .forEach((movementForm) => {
      movementForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const movementType = String(
          movementForm.dataset.stockMovementForm || "",
        );
        if (!movementType) return;
        applyStockMovement(movementType, movementForm);
        renderStockPage(getCurrentStockSubpage());
      });
    });

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
      renderStockPage(getCurrentStockSubpage());
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
          renderStockPage(getCurrentStockSubpage());
        });
        control.addEventListener("change", function () {
          control.dispatchEvent(new Event("input", { bubbles: true }));
        });
      });
  }

  const stockResultsSelector = pageContentEl.querySelector(
    "[data-stock-results-selector]",
  );
  if (stockResultsSelector) {
    stockResultsSelector.addEventListener("change", function () {
      const inventoryId = String(this.value || "");
      if (!inventoryId) return;
      saveStockSelectedInventoryId(inventoryId);
      renderStockPage(getCurrentStockSubpage());
    });
  }

  if (pageContentEl.dataset.stockHandlersBound !== "true") {
    pageContentEl.dataset.stockHandlersBound = "true";
    pageContentEl.addEventListener("click", function (event) {
      const stockRecordAction = event.target.closest(
        "[data-stock-record-action]",
      );
      if (stockRecordAction && pageContentEl.contains(stockRecordAction)) {
        const recordKey = String(
          stockRecordAction.dataset.stockRecordKey || "",
        );
        const action = String(
          stockRecordAction.dataset.stockRecordAction || "",
        );
        if (action === "details") openStockRecordDetails(recordKey);
        if (action === "edit") openStockRecordEdit(recordKey);
        if (action === "delete") openStockRecordDeleteConfirm(recordKey);
        return;
      }

      const stockAction = event.target.closest("[data-stock-action]");
      if (stockAction && pageContentEl.contains(stockAction)) {
        const action = String(stockAction.dataset.stockAction || "");
        if (action === "create-fiche") {
          openStockRecordCreate();
        } else if (action === "create-movement") {
          renderStockMovementCreateModal();
        } else if (action === "create-inventory") {
          openStockInventoryModal();
        }
        return;
      }

      const movementAction = event.target.closest(
        "[data-stock-movement-action]",
      );
      if (movementAction && pageContentEl.contains(movementAction)) {
        const movementId = String(movementAction.dataset.stockMovementId || "");
        const action = String(movementAction.dataset.stockMovementAction || "");
        const movement = getStockMovementRecord(movementId);
        if (!movement) return;
        if (action === "details") openStockMovementDetails(movement);
        if (action === "edit") openStockMovementEdit(movement);
        if (action === "delete") {
          const success = cancelStockMovement(movementId);
          if (success) renderStockPage(getCurrentStockSubpage());
        }
        return;
      }

      const inventoryAction = event.target.closest(
        "[data-stock-inventory-action]",
      );
      if (inventoryAction && pageContentEl.contains(inventoryAction)) {
        const inventoryId = String(
          inventoryAction.dataset.stockInventoryId || "",
        );
        const action = String(
          inventoryAction.dataset.stockInventoryAction || "",
        );

        if (inventoryId && action === "details") {
          openStockInventoryDetails(inventoryId);
          return;
        }

        if (inventoryId && action === "edit-inventory") {
          openStockInventoryModal(inventoryId);
          return;
        }

        if (inventoryId && action === "delete-inventory") {
          deleteStockInventoryById(inventoryId);
          return;
        }

        if (inventoryId && action === "close") {
          closeStockInventoryById(inventoryId);
          return;
        }

        const row = inventoryAction.closest("[data-stock-inventory-row]");
        if (!row) return;
        if (action === "details") {
          renderStockInventoryRowDetails(row);
        } else if (action === "edit") {
          row.querySelector("[data-stock-inventory-counted]")?.focus();
        } else if (action === "delete") {
          const theoretical = Number(row.dataset.theoretical || 0) || 0;
          const countedInput = row.querySelector(
            "[data-stock-inventory-counted]",
          );
          const observationsInput = row.querySelector(
            "[data-stock-inventory-observations]",
          );
          if (countedInput) countedInput.value = String(theoretical);
          if (observationsInput) observationsInput.value = "";
          refreshInventorySummary(
            pageContentEl.querySelector("[data-stock-inventory-form]") ||
            pageContentEl,
          );
          showStockToast("Ligne inventaire réinitialisée.");
        }
      }
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
      renderStockPage(getCurrentStockSubpage());
    });
  });

  updateStockSummaryCards();
}

function renderStockPage(subpageKey) {
  const activeSubpageKey = stockSubpages.tabs[subpageKey]
    ? subpageKey
    : stockSubpages.defaultSubpage;
  const activeSubpage = stockSubpages.tabs[activeSubpageKey];

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText("Stock");
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(activeSubpage.body);

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

    ${activeSubpageKey === "fiche-stock"
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

function loadPlanificationData() {
  const seedState = JSON.parse(JSON.stringify(planificationDefaults));
  try {
    const raw = window.localStorage.getItem(planificationStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    const state = parsed
      ? {
        ...seedState,
        ...parsed,
        plans: Array.isArray(parsed.plans) ? parsed.plans : seedState.plans,
        counters: Array.isArray(parsed.counters)
          ? parsed.counters
          : seedState.counters,
        readings: Array.isArray(parsed.readings)
          ? parsed.readings
          : seedState.readings,
        scheduledOrders: Array.isArray(parsed.scheduledOrders)
          ? parsed.scheduledOrders
          : seedState.scheduledOrders,
      }
      : seedState;

    if (!state.calendarMonth) {
      state.calendarMonth = new Date().toISOString().slice(0, 7);
    }
    if (!state.selectedDate) {
      state.selectedDate = new Date().toISOString().slice(0, 10);
    }

    return state;
  } catch (error) {
    return {
      ...seedState,
      calendarMonth: new Date().toISOString().slice(0, 7),
      selectedDate: new Date().toISOString().slice(0, 10),
    };
  }
}

function savePlanificationData(state) {
  try {
    window.localStorage.setItem(planificationStorageKey, JSON.stringify(state));
  } catch (error) { }
}

function planificationDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function planificationMonthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function planificationMonthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString(
    getAdministrationLocale(),
    {
      month: "long",
      year: "numeric",
    },
  );
}

function buildPlanificationRef(prefix, items) {
  const maxNumber = items.reduce((max, item) => {
    const match = String(item.ref || "").match(
      new RegExp(`^${prefix}-(\\d+)$`),
    );
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
}

function getPlanificationTechnicianEmail(technicianId) {
  return (
    planificationTechniciens.find(
      (technician) => technician.id === technicianId,
    )?.email || ""
  );
}

function renderPlanificationModal(title, subtitle, bodyHtml) {
  if (!overlayRootEl) return;
  overlayRootEl.innerHTML = `
    <div class="org-modal open" data-plan-modal>
      <div class="org-modal-panel">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Planification</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-plan-modal-close aria-label="Fermer">×</button>
        </div>
        <div class="org-modal-body">${bodyHtml}</div>
      </div>
    </div>
  `;

  overlayRootEl
    .querySelectorAll("[data-plan-modal-close]")
    .forEach((button) => {
      button.addEventListener("click", closePlanificationModal);
    });
}

function closePlanificationModal() {
  if (overlayRootEl) overlayRootEl.innerHTML = "";
}

function computeNextDueDate(fromDate, frequency) {
  const base = fromDate ? new Date(fromDate) : new Date();
  if (isNaN(base.getTime())) return "";
  const d = new Date(base);
  switch (frequency) {
    case "Quotidienne": d.setDate(d.getDate() + 1); break;
    case "Hebdomadaire": d.setDate(d.getDate() + 7); break;
    case "Mensuelle": d.setMonth(d.getMonth() + 1); break;
    case "Trimestrielle": d.setMonth(d.getMonth() + 3); break;
    case "Semestrielle": d.setMonth(d.getMonth() + 6); break;
    case "Annuelle": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 16);
}

function getPlanificationTriggerOptions(planType) {
  const map = {
    "Systématique": [
      "Par calendrier",
      "Par durée de fonctionnement",
      "Par date fixe",
    ],
    "Conditionnel": [
      "Par événement",
      "Par état détecté",
      "Sur demande d'intervention",
    ],
    "Prédictif": [
      "Par compteur",
      "Par relevé vibratoire",
      "Par analyse thermique",
      "Par analyse huile",
    ],
  };
  return map[planType] || map["Systématique"];
}

function renderPlanificationPlanModal(mode, planId = null, preset = {}) {
  const state = loadPlanificationData();
  const plan = planId ? state.plans.find((item) => item.id === planId) : null;
  const isDetails = mode === "details";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";
  const initialRef = plan?.ref || buildPlanificationRef("PLN", state.plans);
  const selectedTechnicianId =
    plan?.technicianId ||
    preset.technicianId ||
    "";
  const currentEquipmentLabel = plan?.equipment || preset.equipment || "";
  const currentOrganeLabel = plan?.organ || preset.organ || "";
  const selectedFrequency = plan?.frequency || preset.frequency || "Mensuelle";

  let equipmentOptions = getEquipmentRecords('equipments')
    .map(e => `<option value="${escapeHtml(e.id)}"${(plan?.equipmentId || preset?.equipmentId) === e.id ? ' selected' : ''}>${escapeHtml(e.code + ' — ' + e.name)}</option>`)
    .join('');
  if (
    currentEquipmentLabel &&
    !equipmentOptions.includes(">" + currentEquipmentLabel + "</option>")
  ) {
    equipmentOptions =
      "<option selected>" +
      escapeHtml(currentEquipmentLabel) +
      "</option>" +
      equipmentOptions;
  }

  let organeOptions = getOrganeRecords('organes')
    .map(o => `<option value="${escapeHtml(o.id)}"${(plan?.organId || preset?.organId) === o.id ? ' selected' : ''}>${escapeHtml(o.code + ' — ' + o.name)}</option>`)
    .join('');
  if (
    currentOrganeLabel &&
    !organeOptions.includes(">" + currentOrganeLabel + "</option>")
  ) {
    organeOptions =
      "<option selected>" +
      escapeHtml(currentOrganeLabel) +
      "</option>" +
      organeOptions;
  }

  const frequencyOptions = [
    "Quotidienne",
    "Hebdomadaire",
    "Mensuelle",
    "Trimestrielle",
    "Semestrielle",
    "Annuelle",
  ]
    .map(
      (frequency) =>
        "<option" +
        (frequency === selectedFrequency ? " selected" : "") +
        ">" +
        escapeHtml(frequency) +
        "</option>",
    )
    .join("");

  const bodyHtml = isDetails
    ? `
      <div class="org-detail-list">
        <div class="org-detail-item"><span>Numéro</span><strong>${escapeHtml(initialRef)}</strong></div>
        <div class="org-detail-item"><span>Titre</span><strong>${escapeHtml(plan?.title || "-")}</strong></div>
        <div class="org-detail-item"><span>Type de plan</span><strong>${escapeHtml(plan?.planType || "-")}</strong></div>
        <div class="org-detail-item"><span>Type maintenance</span><strong>${escapeHtml(plan?.maintenanceType || "-")}</strong></div>
        <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(
      (() => { const e = getEquipmentRecords('equipments').find(e => e.id === plan?.equipmentId); return e ? e.code + ' — ' + e.name : plan?.equipment || '-'; })()
    )}</strong></div>
<div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(
      (() => { const o = getOrganeRecords('organes').find(o => o.id === plan?.organId); return o ? o.code + ' — ' + o.name : plan?.organ || '-'; })()
    )}</strong></div>
        <div class="org-detail-item"><span>Technicien</span><strong>${escapeHtml(getPlanificationTechnicianName(plan?.technicianId))}</strong></div>
        <div class="org-detail-item"><span>Fréquence</span><strong>${escapeHtml(plan?.frequency || "-")}</strong></div>
        <div class="org-detail-item">
  <span>Type de plan</span>
  <strong>${escapeHtml(plan?.planType || "-")}</strong>
</div>
<div class="org-detail-item">
  <span>Déclenchement</span>
  <strong>${escapeHtml(plan?.triggerLabel || "-")}</strong>
</div>
        <div class="org-detail-item"><span>Prochaine échéance</span><strong>${formatPlanificationDate(plan?.nextDueDate)}</strong></div>
      </div>
      <div class="planning-modal-stack">
        <div><strong>Gamme opératoire</strong><p>${escapeHtml((plan?.tasks || []).join("\n"))}</p></div>
        <div class="field-group field-group-wide">
      <div><strong>Articles nécessaires</strong>
  <p>${(() => {
      if (Array.isArray(plan?.articleIds) && plan.articleIds.length) {
        return plan.articleIds.map(id => {
          const a = getArticleRecord('articles', id);
          return a ? escapeHtml(a.code + ' — ' + a.name) : escapeHtml(id);
        }).join(', ');
      }
      return escapeHtml((plan?.articles || []).join(', ') || '-');
    })()}</p>
</div>
  <select id="planArticles" name="articleIds" multiple size="5">
    ${(() => {
      const selected = Array.isArray(plan?.articleIds) ? plan.articleIds
        : Array.isArray(preset?.articleIds) ? preset.articleIds : [];
      return getArticleRecords('articles')
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(a => `<option value="${escapeHtml(a.id)}"${selected.includes(a.id) ? ' selected' : ''}>
          ${escapeHtml(a.code)} — ${escapeHtml(a.name)}
          ${a.unitMeasure ? ' (' + escapeHtml(a.unitMeasure) + ')' : ''}
        </option>`)
        .join('') || '<option disabled>Aucun article dans le catalogue</option>';
    })()}
  </select>
</div>
        <div><strong>Sécurité</strong><p>${escapeHtml((plan?.safety || []).join(", ") || "-")}</p></div>
        <div><strong>Documents</strong><p>${escapeHtml((plan?.documents || []).join(", ") || "-")}</p></div>
      </div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-plan-modal-close>Fermer</button>
        <button class="btn btn-primary" type="button" data-plan-edit-from-details>Modifier</button>
      </div>
    `
    : `
      <form class="org-form-grid planning-modal-form" data-plan-form>
        <div class="field-group"><label for="planRef">Numéro</label><input id="planRef" type="text" value="${escapeHtml(initialRef)}" disabled /></div>
        <div class="field-group"><label for="planTitle">Titre</label><input id="planTitle" name="title" type="text" value="${escapeHtml(plan?.title || preset.title || "")}" required /></div>
        <div class="field-group"><label for="planMaintenanceType">Type maintenance</label><select id="planMaintenanceType" name="maintenanceType"><option${(plan?.maintenanceType || preset.maintenanceType) === "Préventive" ? " selected" : ""}>Préventive</option><option${(plan?.maintenanceType || preset.maintenanceType) === "Prédictive" ? " selected" : ""}>Prédictive</option><option${(plan?.maintenanceType || preset.maintenanceType) === "Réglementaire" ? " selected" : ""}>Réglementaire</option></select></div>
        <div class="field-group"><label for="planEquipment">Équipement</label><select id="planEquipment" name="equipmentId" required>${equipmentOptions}</select></div>
        <div class="field-group"><label for="planOrgan">Organe</label><select id="planOrgan" name="organId"><option value="">-- Aucun --</option>${organeOptions}</select></div>
        <div class="field-group"><label for="planTechnician">Technicien par défaut</label><select id="planTechnician" name="technicianId">
  <option value="">— Non assigné —</option>
  ${getPlanificationTechniciens().map(t =>
      `<option value="${escapeHtml(t.id)}"${t.id === selectedTechnicianId ? " selected" : ""}>
      ${escapeHtml((t.firstName ? t.firstName + ' ' : '') + t.name)} · ${escapeHtml(t.role)}
    </option>`
    ).join("") || '<option disabled>Aucun technicien — créez des utilisateurs dans Administration</option>'}
</select></div>
        <div class="field-group"><label for="planFrequency">Fréquence</label><select id="planFrequency" name="frequency">${frequencyOptions}</select></div>
        <div class="field-group"><label for="planDuration">Durée estimée (h)</label><input id="planDuration" name="durationHours" type="number" min="0" step="0.5" value="${escapeHtml(plan?.durationHours || preset.durationHours || 1)}" /></div>
        <div class="field-group">
  <label for="planTrigger">Déclenchement</label>
  <select id="planTrigger" name="triggerLabel">
    ${getPlanificationTriggerOptions(plan?.planType || preset.planType || "Systématique")
      .map(t => `<option${(plan?.triggerLabel || preset.triggerLabel) === t ? " selected" : ""}>${escapeHtml(t)}</option>`)
      .join("")}
  </select>
</div>
        <div class="field-group">
  <label for="planStartDate">Date de début</label>
  <input id="planStartDate" name="startDate" type="date"
    value="${plan?.startDate || preset.startDate || new Date().toISOString().slice(0, 10)}" />
</div>
<div class="field-group">
  <label for="planNextDue">Prochaine échéance <span style="color:var(--color-text-muted);font-size:0.8em">(calculée auto)</span></label>
  <input id="planNextDue" name="nextDueDate" type="datetime-local"
    value="${plan?.nextDueDate ? new Date(plan.nextDueDate).toISOString().slice(0, 16)
      : computeNextDueDate(plan?.startDate || preset.startDate || new Date().toISOString(), plan?.frequency || preset.frequency || 'Mensuelle')}" 
    readonly style="background:var(--color-surface-offset);cursor:not-allowed" />
</div>
        <div class="field-group"><label for="planAlert">Seuil alerte</label><input id="planAlert" name="alertThreshold" type="text" value="${escapeHtml(plan?.alertThreshold || preset.alertThreshold || "")}" /></div>
        <div class="field-group"><label for="planAction">Seuil action</label><input id="planAction" name="actionThreshold" type="text" value="${escapeHtml(plan?.actionThreshold || preset.actionThreshold || "")}" /></div>
        <div class="field-group field-group-wide"><label for="planTasks">Gamme opératoire</label><textarea id="planTasks" name="tasks" rows="5">${escapeHtml((plan?.tasks || preset.tasks || []).join("\n"))}</textarea></div>
        <div class="field-group field-group-wide"><label for="planArticles">Articles nécessaires</label><textarea id="planArticles" name="articles" rows="3">${escapeHtml((plan?.articles || preset.articles || []).join("\n"))}</textarea></div>
        <div class="field-group field-group-wide"><label for="planSafety">Checklist sécurité</label><textarea id="planSafety" name="safety" rows="3">${escapeHtml((plan?.safety || preset.safety || []).join("\n"))}</textarea></div>
        <div class="field-group field-group-wide"><label for="planDocuments">Documents associés</label><textarea id="planDocuments" name="documents" rows="3">${escapeHtml((plan?.documents || preset.documents || []).join("\n"))}</textarea></div>
        <div class="field-group"><label for="planStatus">Statut</label><select id="planStatus" name="status"><option${(plan?.status || preset.status || "Actif") === "Actif" ? " selected" : ""}>Actif</option><option${(plan?.status || preset.status) === "Inactif" ? " selected" : ""}>Inactif</option></select></div>
        <div class="org-modal-actions">
          <button class="btn btn-outline" type="button" data-plan-modal-close>Annuler</button>
          <button class="btn btn-primary" type="submit">${isEdit ? "Enregistrer" : isCreate ? "Créer" : "Valider"}</button>
        </div>
      </form>
    `;

  renderPlanificationModal(
    isDetails
      ? `Détails ${initialRef}`
      : isEdit
        ? `Modifier ${initialRef}`
        : `Nouveau plan ${initialRef}`,
    isDetails
      ? "Vue complète du référentiel, des seuils et de la gamme opératoire."
      : "Création et mise à jour du référentiel des plans de maintenance.",
    bodyHtml,
  );

  if (isDetails) {
    overlayRootEl
      ?.querySelector("[data-plan-edit-from-details]")
      ?.addEventListener("click", () => {
        openPlanificationPlanModal("edit", planId);
      });
    return;
  }

  const form = overlayRootEl?.querySelector("[data-plan-form]");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    // Recalcul automatique nextDueDate
    const freqSelect = form.querySelector('#planFrequency');
    const startInput = form.querySelector('[name="startDate"]');
    const nextDueInput = form.querySelector('#planNextDue');

    function refreshNextDueDate() {
      const freq = freqSelect?.value || 'Mensuelle';
      const start = startInput?.value || new Date().toISOString();
      if (nextDueInput) nextDueInput.value = computeNextDueDate(start, freq);
    }

    // Mise à jour dynamique des options déclenchement selon planType
    const planTypeSelect = form.querySelector('#planPlanType');
    const triggerSelect = form.querySelector('#planTrigger');

    function refreshTriggerOptions() {
      const planType = planTypeSelect?.value || 'Systématique';
      const options = getPlanificationTriggerOptions(planType);
      if (triggerSelect) {
        triggerSelect.innerHTML = options
          .map(t => `<option>${escapeHtml(t)}</option>`)
          .join('');
      }
    }

    planTypeSelect?.addEventListener('change', refreshTriggerOptions);

    freqSelect?.addEventListener('change', refreshNextDueDate);
    startInput?.addEventListener('change', refreshNextDueDate);
    const formData = new FormData(form);
    const nextState = loadPlanificationData();
    const planIndex = plan
      ? nextState.plans.findIndex((item) => item.id === plan.id)
      : -1;
    const tasks = String(formData.get("tasks") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const articleIds = formData.getAll("articleIds").filter(Boolean);
    const safety = String(formData.get("safety") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const documents = String(formData.get("documents") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const nextRecord = {
      ...(plan || {}),
      id: plan?.id || `plan-${Date.now()}`,
      ref: plan?.ref || buildPlanificationRef("PLN", nextState.plans),
      title: String(formData.get("title") || "").trim(),
      planType: String(formData.get("planType") || "Systématique"),
      maintenanceType: String(formData.get("maintenanceType") || "Préventive"),
      equipmentId: String(formData.get("equipmentId") || "").trim(),
      organId: String(formData.get("organId") || "").trim(),
      technicianId: String(formData.get("technicianId") || ""),
      frequency: String(formData.get("frequency") || "").trim(),
      durationHours: Number(formData.get("durationHours") || 0),
      triggerLabel: String(formData.get("triggerLabel") || "").trim(),
      startDate: String(formData.get("startDate") || new Date().toISOString().slice(0, 10)),
      nextDueDate: String(formData.get("nextDueDate") || ""),
      alertThreshold: String(formData.get("alertThreshold") || "").trim(),
      actionThreshold: String(formData.get("actionThreshold") || "").trim(),
      tasks,
      articleIds: articleIds,
      // fallback texte pour compatibilité anciens plans
      articles: articleIds.map(id => {
        const a = getArticleRecord('articles', id);
        return a ? a.code + ' — ' + a.name : id;
      }),
      safety,
      documents,
      status: String(formData.get("status") || "Actif"),
    };

    if (planIndex >= 0) {
      nextState.plans[planIndex] = nextRecord;
    } else {
      nextState.plans.unshift(nextRecord);
    }

    savePlanificationData(nextState);
    closePlanificationModal();
    renderPlanificationPageClean("plans-maintenance");
  });
}

function openPlanificationPlanModal(mode, planId = null, preset = {}) {
  renderPlanificationPlanModal(mode, planId, preset);
}

function openPlanificationTaskModal(dateKey, presetTitle = "") {
  const selectedDate = dateKey || new Date().toISOString().slice(0, 10);
  const bodyHtml = `
    <form class="org-form-grid planning-modal-form" data-plan-task-form>
      <div class="field-group field-group-wide"><label for="taskTitle">Tâche</label><input id="taskTitle" name="title" type="text" value="${escapeHtml(presetTitle)}" required /></div>
      <div class="field-group"><label for="taskDate">Date</label><input id="taskDate" name="date" type="date" value="${selectedDate}" required /></div>
      <div class="field-group"><label for="taskTime">Heure</label><input id="taskTime" name="time" type="time" value="08:00" /></div>
      <div class="field-group"><label for="taskPriority">Priorité</label><select id="taskPriority" name="priority"><option>Moyenne</option><option>Haute</option><option>Critique</option></select></div>
      <div class="field-group field-group-wide"><label for="taskNotes">Notes</label><textarea id="taskNotes" name="notes" rows="4"></textarea></div>
      <div class="org-modal-actions">
        <button class="btn btn-outline" type="button" data-plan-modal-close>Annuler</button>
        <button class="btn btn-primary" type="submit">Ajouter</button>
      </div>
    </form>
  `;

  renderPlanificationModal(
    `Tâche du ${selectedDate}`,
    "Ajouter une tâche directement sur une date du calendrier.",
    bodyHtml,
  );

  const form = overlayRootEl?.querySelector("[data-plan-task-form]");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const state = loadPlanificationData();
    const date = String(formData.get("date") || selectedDate);
    const time = String(formData.get("time") || "08:00");
    state.scheduledOrders.unshift({
      id: `task-${Date.now()}`,
      ref: buildPlanificationRef("TASK", state.scheduledOrders),
      sourceType: "Manuel",
      sourceRef: "Calendrier",
      title: String(formData.get("title") || "").trim(),
      status: "Planifié",
      priority: String(formData.get("priority") || "Moyenne"),
      scheduledDate: `${date}T${time}:00`,
      technician: "À assigner",
      equipment: "-",
      calendarView: "Mensuelle",
      notes: String(formData.get("notes") || "").trim(),
    });
    state.selectedDate = date;
    savePlanificationData(state);
    closePlanificationModal();
    renderPlanificationPageClean("calendrier");
  });
}

function renderPlanificationPageClean(subpageKey = "plans-maintenance") {
  const state = loadPlanificationData();
  const activeSubpageKey = sectionSubpages.planification.tabs[subpageKey]
    ? subpageKey
    : sectionSubpages.planification.defaultSubpage;
  const activeTab = sectionSubpages.planification.tabs[activeSubpageKey];

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText(activeTab.title);
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(activeTab.body);

  const plans = state.plans || [];
  const activePlans = plans.filter(
    (plan) => String(plan.status).toLowerCase() === "actif",
  );
  const dueSoon = plans.filter((plan) => {
    const date = new Date(plan.nextDueDate || 0);
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (date.getTime() - Date.now()) / 86400000;
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const counters = state.counters || [];
  const alerts = counters.filter(
    (counter) =>
      Number(counter.currentValue) >= Number(counter.alertThreshold || 0),
  ).length;

  if (pageActionsEl) {
    pageActionsEl.innerHTML =
      activeSubpageKey === "plans-maintenance"
        ? `<button class="btn btn-primary" type="button" data-plan-create><i class="fa-solid fa-plus"></i><span>Nouveau plan</span></button>`
        : activeSubpageKey === "calendrier"
          ? `<button class="btn btn-primary" type="button" data-plan-add-task><i class="fa-solid fa-plus"></i><span>Ajouter une tâche</span></button>`
          : `
          <button class="btn btn-outline" type="button" data-plan-add-reading>
            <i class="fa-solid fa-gauge-high"></i><span>Saisir un relevé</span>
          </button>
          <button class="btn btn-primary" type="button" data-counter-new>
            <i class="fa-solid fa-plus"></i><span>Nouveau compteur</span>
          </button>
        `;
  }

  // APRÈS (cible le bon attribut)
  pageActionsEl.querySelector('[data-counter-new]')
    ?.addEventListener('click', () => openPlanificationCounterModal('create'));

  pageActionsEl.querySelector('[data-counter-action="new-reading"]')
    ?.addEventListener('click', () => openPlanificationReadingModal());

  if (!pageContentEl) return;
  pageContentEl.className = "organization-page planning-page";

  if (activeSubpageKey === "calendrier") {
    const monthValue =
      state.calendarMonth || new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = monthValue.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const monthKey = planificationMonthKey(`${monthValue}-01T12:00:00`);
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = 42;
    const todayKey = new Date().toISOString().slice(0, 10);
    const selectedDate = state.selectedDate || todayKey;
    const monthOrders = (state.scheduledOrders || []).filter((order) =>
      planificationDayKey(order.scheduledDate).startsWith(monthKey),
    );
    const monthPlannedCount = monthOrders.filter(
      (order) => order.status === "Planifié",
    ).length;
    const monthInProgressCount = monthOrders.filter(
      (order) => order.status === "En cours",
    ).length;
    const monthLateCount = monthOrders.filter(
      (order) => order.status === "En retard",
    ).length;
    const eventsByDay = (state.scheduledOrders || []).reduce((acc, item) => {
      const key = planificationDayKey(item.scheduledDate);
      if (!key) return acc;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    const selectedEvents = eventsByDay[selectedDate] || [];

    pageContentEl.innerHTML = `
      <div class="org-tabs" role="tablist" aria-label="Sous-pages planification">
        ${Object.entries(sectionSubpages.planification.tabs)
        .map(
          ([key, tab]) =>
            `<button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-plan-subpage="${key}">${tab.label}</button>`,
        )
        .join("")}
      </div>
      <div class="org-section-intro">
        <div>
          <div class="org-section-kicker">Référentiel planification</div>
          <h2>Calendrier</h2>
          <div class="org-section-subtitle">Cliquez une date pour voir le contenu planifié et ajoutez une tâche directement sur cette journée.</div>
        </div>
        <div class="org-section-pills">
          <span class="status-badge badge-success">${plans.length} plans</span>
          <span class="status-badge badge-info">${state.scheduledOrders.length} événements</span>
          <span class="status-badge badge-warning">${alerts} alertes compteur</span>
        </div>
      </div>
      <div class="planning-kpi-grid">
        <div class="planning-kpi-card"><strong>${monthOrders.length}</strong><span>OT du mois</span></div>
        <div class="planning-kpi-card"><strong>${monthPlannedCount}</strong><span>Planifiés</span></div>
        <div class="planning-kpi-card"><strong>${monthInProgressCount}</strong><span>En cours</span></div>
        <div class="planning-kpi-card"><strong>${monthLateCount}</strong><span>En retard</span></div>
      </div>
      <div class="planning-calendar-shell">
        <div class="card">
          <div class="card-head planning-calendar-header">
            <div class="card-title"><i class="fa-solid fa-calendar-days"></i> ${planificationMonthLabel(year, monthIndex)}</div>
            <div class="planning-calendar-nav">
              <button class="btn btn-outline" type="button" data-plan-month="prev">Précédent</button>
              <button class="btn btn-outline" type="button" data-plan-month="today">Aujourd'hui</button>
              <button class="btn btn-outline" type="button" data-plan-month="next">Suivant</button>
            </div>
          </div>
          <div class="planning-weekdays">
            ${["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => `<span>${label}</span>`).join("")}
          </div>
          <div class="planning-calendar-gridview">
            ${Array.from({ length: totalCells }, (_, index) => {
          const cellDate = new Date(
            year,
            monthIndex,
            1 - startOffset + index,
          );
          const cellKey = planificationDayKey(cellDate);
          const inMonth = cellDate.getMonth() === monthIndex;
          const events = eventsByDay[cellKey] || [];
          return `
                <button class="planning-day ${inMonth ? "in-month" : "out-month"} ${cellKey === selectedDate ? "selected" : ""} ${events.length ? "has-events" : ""}" type="button" data-plan-day="${cellKey}">
                  <span class="planning-day-number">${cellDate.getDate()}</span>
                  <div class="planning-day-events">${events
              .slice(0, 2)
              .map(
                (event) =>
                  `<span class="planning-chip">${escapeHtml(event.ref)} ${escapeHtml(event.title)}</span>`,
              )
              .join("")}</div>
                  ${events.length > 2 ? `<small>+${events.length - 2} autres</small>` : ""}
                </button>
              `;
        }).join("")}
          </div>
        </div>
        <div class="planning-side-column">
          <div class="card">
            <div class="card-head"><div class="card-title"><i class="fa-solid fa-calendar-check"></i> ${selectedDate}</div></div>
            <div class="card-body">
              ${selectedEvents.length
        ? selectedEvents
          .map(
            (event) => `
                <div class="org-list-item planning-calendar-item">
                  <div class="card-title"><strong>${escapeHtml(event.ref)}</strong> ${escapeHtml(event.title)}</div>
                  <div class="planning-inline-tags">
                    <span class="status-badge ${getPlanificationPriorityBadgeClass(event.priority)}">${escapeHtml(event.priority)}</span>
                    <span class="status-badge ${getPlanificationOrderBadgeClass(event.status)}">${escapeHtml(event.status)}</span>
                  </div>
                  <p>${escapeHtml(formatPlanificationDate(event.scheduledDate))}</p>
                </div>
              `,
          )
          .join("")
        : `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-calendar-plus"></i></div><h3>Aucune tâche sur cette date</h3><p>Vous pouvez sélectionner une date puis ajouter une tâche ou un OT planifié.</p><small>La date sélectionnée reste active pendant la navigation du calendrier.</small></div>`
      }
            </div>
          </div>
          <div class="card">
            <div class="card-head"><div class="card-title"><i class="fa-solid fa-plus"></i> Ajouter une tâche</div></div>
            <div class="card-body">
              <button class="btn btn-primary" type="button" data-plan-task-for-date="${selectedDate}">Ajouter sur cette date</button>
            </div>
          </div>
        </div>
      </div>
    `;

    pageContentEl.querySelectorAll("[data-plan-day]").forEach((button) => {
      button.addEventListener("click", function () {
        const nextState = loadPlanificationData();
        nextState.selectedDate = this.dataset.planDay || selectedDate;
        savePlanificationData(nextState);
        renderPlanificationPageClean("calendrier");
      });
    });

    pageContentEl
      .querySelector("[data-plan-task-for-date]")
      ?.addEventListener("click", function () {
        openPlanificationTaskModal(
          this.dataset.planTaskForDate || selectedDate,
        );
      });

    pageContentEl.querySelectorAll("[data-plan-month]").forEach((button) => {
      button.addEventListener("click", function () {
        const nextState = loadPlanificationData();
        const current = new Date(`${monthValue}-01T12:00:00`);
        if (Number.isNaN(current.getTime())) return;
        if (this.dataset.planMonth === "prev")
          current.setMonth(current.getMonth() - 1);
        if (this.dataset.planMonth === "next")
          current.setMonth(current.getMonth() + 1);
        if (this.dataset.planMonth === "today") {
          nextState.calendarMonth = new Date().toISOString().slice(0, 7);
          nextState.selectedDate = new Date().toISOString().slice(0, 10);
        } else {
          nextState.calendarMonth = planificationMonthKey(current);
          nextState.selectedDate = planificationDayKey(current);
        }
        savePlanificationData(nextState);
        renderPlanificationPageClean("calendrier");
      });
    });
  } else if (activeSubpageKey === "compteurs") {
    pageContentEl.innerHTML = `
      <div class="org-tabs" role="tablist" aria-label="Sous-pages planification">
        ${Object.entries(sectionSubpages.planification.tabs)
        .map(
          ([key, tab]) =>
            `<button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-plan-subpage="${key}">${tab.label}</button>`,
        )
        .join("")}
      </div>
      <div class="org-section-intro">
        <div>
          <div class="org-section-kicker">Référentiel planification</div>
          <h2>Compteurs</h2>
          <div class="org-section-subtitle">Le style a été resserré pour un usage plus lisible: compteur, dernier relevé, seuils et historique visibles ensemble.</div>
        </div>
        <div class="org-section-pills">
          <span class="status-badge badge-info">${counters.length} compteurs</span>
          <span class="status-badge badge-warning">${alerts} en alerte</span>
          <span class="status-badge badge-danger">${counters.filter((counter) => Number(counter.currentValue) >= Number(counter.actionThreshold || 0)).length} en action</span>
        </div>
      </div>
      <div class="planning-counter-layout">
                  <div class="card">
            <div class="card-head" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
              <div class="card-title"><i class="fa-solid fa-gauge-high"></i> Fiche compteur</div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <select data-counter-selector-main style="font-size:0.8rem;padding:4px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);max-width:220px">
                  ${counters.length === 0
        ? '<option value="">Aucun compteur</option>'
        : counters.map(c => {
          const icon = Number(c.currentValue) >= Number(c.actionThreshold || 0) ? "🔴"
            : Number(c.currentValue) >= Number(c.alertThreshold || 0) ? "🟡" : "🟢";
          return `<option value="${c.id}">${icon} ${escapeHtml(c.ref)} — ${escapeHtml(c.name)}</option>`;
        }).join("")}
                </select>
                <button class="org-icon-btn" type="button" data-counter-id="${counters[0]?.id}" data-counter-action="edit" data-counter-btn-edit title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="org-icon-btn danger" type="button" data-counter-id="${counters[0]?.id}" data-counter-action="reset" data-counter-btn-reset title="Remettre à zéro"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="org-icon-btn danger" type="button" data-counter-id="${counters[0]?.id}" data-counter-action="delete" data-counter-btn-delete title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
              </div>
            </div>
            <div class="card-body" data-counter-detail-main>
              ${counters.length > 0 ? (() => {
        const counter = counters[0];
        const ts = Number(counter.currentValue) >= Number(counter.actionThreshold || 0) ? "badge-danger"
          : Number(counter.currentValue) >= Number(counter.alertThreshold || 0) ? "badge-warning" : "badge-success";
        return `
                  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
                    <span class="status-badge badge-gray">${escapeHtml(counter.ref)}</span>
                    <strong style="font-size:1rem">${escapeHtml(counter.name)}</strong>
                    <span class="status-badge ${ts}">${escapeHtml(String(counter.currentValue ?? 0))} ${escapeHtml(counter.unit)}</span>
                    <span class="status-badge ${counter.status === 'Actif' ? 'badge-success' : 'badge-gray'}">${escapeHtml(counter.status || 'Actif')}</span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;font-size:0.92rem">
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Équipement lié</span><span>${escapeHtml(counter.equipment || "-")}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Organe lié</span><span>${escapeHtml(counter.organ || "-")}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Type</span><span>${escapeHtml(counter.type || "-")}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Valeur initiale</span><span>${escapeHtml(String(counter.initialValue ?? 0))} ${escapeHtml(counter.unit)}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Valeur actuelle</span><span><strong>${escapeHtml(String(counter.currentValue ?? 0))} ${escapeHtml(counter.unit)}</strong></span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Seuil alerte</span><span>${escapeHtml(String(counter.alertThreshold || "-"))} ${escapeHtml(counter.unit)}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Seuil action (→ OT)</span><span>${escapeHtml(String(counter.actionThreshold || "-"))} ${escapeHtml(counter.unit)}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Plan lié</span><span>${escapeHtml(counter.planId || "-")}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Mise à jour</span><span>${formatPlanificationDate(counter.lastUpdate)}</span></div>
                    <div style="display:flex;gap:8px"><span style="color:var(--color-text-muted);min-width:140px">Créé le</span><span>${formatPlanificationDate(counter.createdAt)}</span></div>
                  </div>`;
      })() : '<p style="color:var(--color-text-muted)">Aucun compteur enregistré.</p>'}
            </div>
          </div>
        <div class="planning-side-column">
          <div class="card">
            <div class="card-head"><div class="card-title"><i class="fa-solid fa-pen-ruler"></i> Saisie de relevé</div></div>
            <div class="card-body">
              <form class="planning-reading-form" data-plan-reading-form>
                <div class="field-group"><label for="planReadingCounter">Compteur</label><select id="planReadingCounter" name="counterId" required>${counters.map((counter) => `<option value="${counter.id}">${escapeHtml(counter.ref)} · ${escapeHtml(counter.name)}</option>`).join("")}</select></div>
                <div class="field-group"><label for="planReadingValue">Valeur relevée</label><input id="planReadingValue" name="value" type="number" step="0.01" required placeholder="Ex: 500" /></div>
                <div class="field-group field-group-wide"><label for="planReadingNotes">Observations</label><textarea id="planReadingNotes" name="observations" rows="4" placeholder="Commentaire optionnel"></textarea></div>
                <div class="planning-form-footer"><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i><span>Enregistrer le relevé</span></button></div>
              </form>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Historique des relevés</div></div>
            <div class="card-body">
              ${(state.readings || [])
        .slice(0, 10)
        .map(
          (reading) => `
                <div class="org-list-item planning-reading-item">
                  <div>
                    <div class="intervention-history-title"><strong>${escapeHtml(reading.ref)}</strong> · ${escapeHtml(reading.value)}</div>
                    <div class="intervention-history-sub">${escapeHtml(reading.observations || "Aucune observation")}</div>
                  </div>
                  <div class="intervention-history-date">${formatPlanificationDate(reading.date)}</div>
                </div>
              `,
        )
        .join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    pageContentEl.querySelector("[data-counter-selector-main]")?.addEventListener("change", function () {
      const ctr = counters.find(c => c.id === this.value);
      if (!ctr) return;
      // 1. Mettre à jour les data-counter-id des 3 boutons
      pageContentEl.querySelector('[data-counter-btn-edit]')
        ?.setAttribute('data-counter-id', ctr.id);
      pageContentEl.querySelector('[data-counter-btn-reset]')
        ?.setAttribute('data-counter-id', ctr.id);
      pageContentEl.querySelector('[data-counter-btn-delete]')
        ?.setAttribute('data-counter-id', ctr.id);

      // 2. Mettre à jour aussi les attributs data-counter-action
      //    (au cas où ils sont aussi utilisés pour la délégation)
      pageContentEl.querySelector('[data-counter-btn-edit]')
        ?.setAttribute('data-counter-action', 'edit');
      pageContentEl.querySelector('[data-counter-btn-reset]')
        ?.setAttribute('data-counter-action', 'reset');
      pageContentEl.querySelector('[data-counter-btn-delete]')
        ?.setAttribute('data-counter-action', 'delete');

      const eqDir = getEquipmentDirectory();
      const eqMatch = eqDir.equipments.find(e => e.id === ctr.equipmentId);

      const oDir = getOrganeDirectory();
      const oMatch = oDir.organes.find(o => o.id === ctr.organId);
      const ts = Number(ctr.currentValue) >= Number(ctr.actionThreshold || 0) ? "badge-danger"
        : Number(ctr.currentValue) >= Number(ctr.alertThreshold || 0) ? "badge-warning" : "badge-success";
      const detailEl = pageContentEl.querySelector("[data-counter-detail-main]");
      if (detailEl) {
        detailEl.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
      <span class="status-badge badge-gray">${escapeHtml(ctr.ref)}</span>
      <strong style="font-size:1rem">${escapeHtml(ctr.name)}</strong>
      <span class="status-badge ${ts}">
        ${escapeHtml(String(ctr.currentValue ?? 0))} ${escapeHtml(ctr.unit)}
      </span>
      <span class="status-badge ${ctr.status === "Actif" ? "badge-success" : "badge-gray"
          }">
        ${escapeHtml(ctr.status || "Actif")}
      </span>
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.92rem">

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Équipement lié
        </span>
        <span>
          ${escapeHtml(
            eqMatch
              ? `${eqMatch.code} ${eqMatch.name}`
              : (ctr.equipment || "-")
          )}
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Organe lié
        </span>
        <span>
          ${escapeHtml(
            oMatch
              ? `${oMatch.code} ${oMatch.name}`
              : (ctr.organ || "-")
          )}
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Type
        </span>
        <span>${escapeHtml(ctr.type || "-")}</span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Valeur initiale
        </span>
        <span>
          ${escapeHtml(String(ctr.initialValue ?? 0))} ${escapeHtml(ctr.unit)}
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Valeur actuelle
        </span>
        <span>
          <strong>
            ${escapeHtml(String(ctr.currentValue ?? 0))} ${escapeHtml(ctr.unit)}
          </strong>
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Seuil alerte
        </span>
        <span>
          ${escapeHtml(String(ctr.alertThreshold || "-"))} ${escapeHtml(ctr.unit)}
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Seuil action (→ OT)
        </span>
        <span>
          ${escapeHtml(String(ctr.actionThreshold || "-"))} ${escapeHtml(ctr.unit)}
        </span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Plan lié
        </span>
        <span>${escapeHtml(ctr.planId || "-")}</span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Mise à jour
        </span>
        <span>${formatPlanificationDate(ctr.lastUpdate)}</span>
      </div>

      <div style="display:flex;gap:8px">
        <span style="color:var(--color-text-muted);min-width:140px">
          Créé le
        </span>
        <span>${formatPlanificationDate(ctr.createdAt)}</span>
      </div>

    </div>
  `;
      }

      const readingSel = pageContentEl.querySelector("[data-plan-reading-form] select[name='counterId']");
      if (readingSel) readingSel.value = this.value;
    });



    pageContentEl
      .querySelector("[data-plan-reading-form]")
      ?.addEventListener("submit", function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        const nextState = loadPlanificationData();
        const counterIndex = nextState.counters.findIndex(
          (counter) => counter.id === String(formData.get("counterId") || ""),
        );
        const value = Number(formData.get("value") || 0);
        if (counterIndex < 0) return;

        const counter = nextState.counters[counterIndex];
        const readingDate = new Date().toISOString();
        const otGenerated = value >= Number(counter.actionThreshold || 0);
        if (
          otGenerated &&
          !nextState.scheduledOrders.some(
            (order) =>
              order.sourceType === "Compteur" &&
              order.sourceRef === counter.ref &&
              order.status !== "Clôturé",
          )
        ) {
          const relatedPlan = nextState.plans.find(
            (plan) => plan.id === counter.planId,
          );
          nextState.scheduledOrders.unshift({
            id: `task-${Date.now()}`,
            ref: buildPlanificationRef("OT", nextState.scheduledOrders),
            sourceType: "Compteur",
            sourceRef: counter.ref,
            title: `Intervention automatique ${counter.name}`,
            status: "Planifié",
            priority: "Critique",
            scheduledDate: readingDate,
            technician: getPlanificationTechnicianName(
              relatedPlan?.technicianId,
            ),
            equipment: counter.equipment,
            calendarView: "Liste",
          });
        }

        nextState.counters[counterIndex] = {
          ...counter,
          currentValue: value,
          lastUpdate: readingDate,
        };
        nextState.readings.unshift({
          id: `reading-${Date.now()}`,
          counterId: counter.id,
          ref: counter.ref,
          value,
          date: readingDate,
          createdBy: "Utilisateur connecté",
          observations: String(formData.get("observations") || "").trim(),
          otGenerated,
        });
        savePlanificationData(nextState);
        renderPlanificationPageClean("compteurs");
      });
  } else {
    const dueSoonCount = dueSoon;
    const calendarEvents = (state.scheduledOrders || []).length;
    pageContentEl.innerHTML = `
      <div class="org-tabs" role="tablist" aria-label="Sous-pages planification">
        ${Object.entries(sectionSubpages.planification.tabs)
        .map(
          ([key, tab]) =>
            `<button class="org-tab ${key === activeSubpageKey ? "active" : ""}" type="button" data-plan-subpage="${key}">${tab.label}</button>`,
        )
        .join("")}
      </div>
      <div class="org-section-intro">
        <div>
          <div class="org-section-kicker">Référentiel planification</div>
          <h2>Plans de maintenance</h2>
          <div class="org-section-subtitle">Cette page centralise les plans qui organisent les interventions de maintenance.</div>
        </div>
        <div class="org-section-pills">
          <span class="status-badge badge-success">${plans.length} plans</span>
          <span class="status-badge badge-info">${activePlans.length} actifs</span>
          <span class="status-badge badge-warning">${dueSoonCount} à échéance</span>
          <span class="status-badge badge-gray">${calendarEvents} événements calendrier</span>
        </div>
      </div>
      <div class="planning-kpi-grid">
        <div class="planning-kpi-card"><strong>${plans.length}</strong><span>Plans enregistrés</span></div>
        <div class="planning-kpi-card"><strong>${activePlans.length}</strong><span>Plans actifs</span></div>
        <div class="planning-kpi-card"><strong>${dueSoonCount}</strong><span>Échéances proches</span></div>
        <div class="planning-kpi-card"><strong>${calendarEvents}</strong><span>Événements planifiés</span></div>
      </div>
      <div class="planning-list-shell card">
        <div class="card-head">
          <div class="card-title"><i class="fa-solid fa-list"></i> Liste des plans</div>
          <span class="status-badge badge-info">Créer, modifier, supprimer, consulter</span>
        </div>
        <div class="card-body planning-plan-list">
          ${plans
        .map(
          (plan) => `
            <div class="planning-plan-row">
              <div class="planning-plan-main">
                <div class="planning-plan-title"><strong>${escapeHtml(plan.ref)}</strong> · ${escapeHtml(plan.title)}</div>
                <div class="planning-plan-meta">
                  <span>${escapeHtml(plan.planType)}</span>
                  <span>${escapeHtml(plan.maintenanceType)}</span>
                  <span>${escapeHtml(plan.equipment)}</span>
                  <span>${escapeHtml(getPlanificationTechnicianName(plan.technicianId))}</span>
                </div>
              </div>
              <div class="planning-plan-side">
                <span class="status-badge ${getPlanificationPlanBadgeClass(plan.status)}">${escapeHtml(plan.status)}</span>
                <div class="org-row-actions">
                  <button class="org-icon-btn" type="button" data-plan-action="details" data-plan-id="${plan.id}" title="Voir les détails"><i class="fa-regular fa-eye"></i></button>
                  <button class="org-icon-btn" type="button" data-plan-action="edit" data-plan-id="${plan.id}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
                  <button class="org-icon-btn danger" type="button" data-plan-action="delete" data-plan-id="${plan.id}" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                </div>
              </div>
            </div>
          `,
        )
        .join("") ||
      `<div class="org-empty-card org-empty-card--list"><div class="org-empty-icon"><i class="fa-solid fa-folder-open"></i></div><h3>Aucun plan</h3><p>Créez un premier plan de maintenance pour alimenter la liste et le calendrier.</p><small>La création se fait via la fenêtre modale du bouton Nouveau plan.</small></div>`
      }
        </div>
      </div>
    `;

    pageContentEl.querySelectorAll("[data-plan-action]").forEach((button) => {
      button.addEventListener("click", function () {
        const planId = String(this.dataset.planId || "");
        const action = String(this.dataset.planAction || "details");
        if (action === "delete") {
          const nextState = loadPlanificationData();
          const plan = nextState.plans.find((item) => item.id === planId);
          if (!plan) return;
          if (window.confirm(`Supprimer ${plan.ref} ?`)) {
            nextState.plans = nextState.plans.filter(
              (item) => item.id !== planId,
            );
            savePlanificationData(nextState);
            renderPlanificationPageClean(activeSubpageKey);
          }
          return;
        }
        openPlanificationPlanModal(action, planId);
      });
    });
  }

  pageContentEl.querySelectorAll("[data-plan-subpage]").forEach((button) => {
    button.addEventListener("click", function () {
      const nextSubpage = this.dataset.planSubpage || "plans-maintenance";
      renderPlanificationPageClean(nextSubpage);
      window.location.hash = `planification/${nextSubpage}`;
    });
  });

  pageActionsEl
    ?.querySelector("[data-plan-create]")
    ?.addEventListener("click", function () {
      openPlanificationPlanModal("create");
    });
  pageActionsEl
    ?.querySelector("[data-plan-add-task]")
    ?.addEventListener("click", function () {
      openPlanificationTaskModal(
        state.selectedDate || new Date().toISOString().slice(0, 10),
      );
    });
  pageActionsEl
    ?.querySelector("[data-plan-add-reading]")
    ?.addEventListener("click", function () {
      pageContentEl
        .querySelector("[data-plan-reading-form]")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

function cloneAchatsState(state) {
  return JSON.parse(JSON.stringify(state));
}

function loadAchatsState() {
  const seed = buildAchatsSeedState();

  try {
    const raw = window.localStorage.getItem(achatsStorageKey);
    if (!raw) return cloneAchatsState(seed);
    const parsed = JSON.parse(raw);

    return {
      demandes: Array.isArray(parsed?.demandes)
        ? parsed.demandes
        : cloneAchatsState(seed).demandes,
      bons: Array.isArray(parsed?.bons)
        ? parsed.bons
        : cloneAchatsState(seed).bons,
      receptions: Array.isArray(parsed?.receptions)
        ? parsed.receptions
        : cloneAchatsState(seed).receptions,
    };
  } catch (error) {
    return cloneAchatsState(seed);
  }
}

function saveAchatsState(state) {
  try {
    window.localStorage.setItem(achatsStorageKey, JSON.stringify(state));
  } catch (error) {
    // Keep UI operational if localStorage is unavailable.
  }
}

function buildAchatsRef(prefix, records) {
  const max = (records || []).reduce((highest, record) => {
    const match = String(record?.number || "").match(/-(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return value > highest ? value : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function formatAchatsDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(getAdministrationLocale());
}

function formatAchatsMoney(value) {
  return new Intl.NumberFormat(getAdministrationLocale(), {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getAchatsStatusBadgeClass(status) {
  const map = {
    Brouillon: "badge-gray",
    "En attente validation": "badge-warning",
    Validée: "badge-success",
    "Transformée en BC": "badge-info",
    Clôturée: "badge-success",
    Annulée: "badge-danger",
    "Envoyé au fournisseur": "badge-info",
    "Confirmé par fournisseur": "badge-success",
    "Partiellement reçu": "badge-warning",
    "Reçu complet": "badge-success",
    Partielle: "badge-warning",
    Complète: "badge-success",
  };
  return map[status] || "badge-gray";
}

function getAchatsRecordsBySubpage(state, subpageKey) {
  if (subpageKey === "demandes-achat") return state.demandes;
  if (subpageKey === "bons-commande") return state.bons;
  if (subpageKey === "receptions") return state.receptions;
  return [];
}

function getAchatsArticles() {
  const fallback = [];
  try {
    const directory = getArticleDirectory();
    if (!directory || !Array.isArray(directory.articles)) return fallback;
    return directory.articles.map((article) => ({
      id: article.id,
      label: `${article.code || "ART"} - ${article.name || "Article"}`,
    }));
  } catch (error) {
    return fallback;
  }
}

function buildAchatsArticleOptions(selectedValue) {
  const articles = getAchatsArticles();
  const options = [`<option value="">Sélectionner un article</option>`];
  articles.forEach((article) => {
    const selected = article.id === selectedValue ? "selected" : "";
    options.push(
      `<option value="${escapeHtml(article.id)}" ${selected}>${escapeHtml(article.label)}</option>`,
    );
  });
  return options.join("");
}

function buildAchatsDaOptions(
  demandes,
  selectedId = ""
) {
  return demandes
    .map((item) => `
      <option
        value="${item.id}"
        ${item.id === selectedId
        ? "selected"
        : ""
      }
      >
        ${item.number}
        -
        ${item.articleLabel || "Article"}
      </option>
    `)
    .join("");
}

function buildAchatsBcOptions(bons, selectedId) {
  return [
    `<option value="">Sélectionner un BC</option>`,
    ...bons.map((bc) => {
      const selected = bc.id === selectedId ? "selected" : "";
      return `<option value="${escapeHtml(bc.id)}" ${selected}>${escapeHtml(bc.number)} - ${escapeHtml(bc.supplierName || "Fournisseur")}</option>`;
    }),
  ].join("");
}

function buildAchatsTabs(activeSubpageKey) {
  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages achats">
      ${Object.entries(achatsSubpages.tabs)
      .map(
        ([key, tab]) => `
            <button
              class="org-tab ${key === activeSubpageKey ? "active" : ""}"
              type="button"
              data-ach-tab="${key}"
            >
              ${tab.label}
            </button>
          `,
      )
      .join("")}
    </div>
  `;
}

function buildAchatsListActions(
  subpageKey,
  recordId,
  status = ""
) {
  const hideEdit =
    subpageKey === "demandes-achat" &&
    status === "Transformée en BC";

  return `
    <div class="org-row-actions">
      <button
        class="org-icon-btn"
        data-org-action="details"
        type="button"
        data-ach-action="details"
        data-ach-subpage="${subpageKey}"
        data-ach-id="${recordId}"
        title="Voir"
      >
        <i class="fa-regular fa-eye"></i>
      </button>

      ${!hideEdit
      ? `
      <button
        class="org-icon-btn"
        data-org-action="edit"
        type="button"
        data-ach-action="edit"
        data-ach-subpage="${subpageKey}"
        data-ach-id="${recordId}"
        title="Modifier"
      >
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      `
      : ""
    }

      <button
        class="org-icon-btn danger"
        data-org-action="delete"
        type="button"
        data-ach-action="delete"
        data-ach-subpage="${subpageKey}"
        data-ach-id="${recordId}"
        title="Supprimer"
      >
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function openAchatsModal(subpageKey, mode, recordId = null) {
  achatsModalState = {
    subpageKey,
    mode,
    recordId,
  };
  renderAchatsPage(subpageKey);
}

function closeAchatsModal(subpageKey) {
  achatsModalState = null;
  renderAchatsPage(subpageKey);
}

function renderAchatsPageActions(activeSubpageKey) {
  if (!pageActionsEl) return;

  if (activeSubpageKey === "historique") {
    pageActionsEl.innerHTML = `
      <button class="btn btn-outline" type="button" data-ach-export="excel">
        <i class="fa-solid fa-file-csv"></i>
        <span>Export Excel (CSV)</span>
      </button>
      <button class="btn btn-outline" type="button" data-ach-export="pdf">
        <i class="fa-regular fa-file-pdf"></i>
        <span>Export PDF</span>
      </button>
    `;
    return;
  }

  const labels = {
    "demandes-achat": "Nouvelle DA",
    "bons-commande": "Nouveau BC",
    receptions: "Nouvelle réception",
  };
  pageActionsEl.innerHTML = `
  <button class="btn btn-primary" type="button" data-ach-create="${activeSubpageKey}">
    <i class="fa-solid fa-plus"></i>
    <span>${labels[activeSubpageKey] || "Créer"}</span>
  </button>
`;
}

function renderAchatsDemandsPage(state, activeSubpageKey) {
  if (!pageContentEl) return;

  const activeDemandes = state.demandes;

  const rows = activeDemandes.length
    ? state.demandes
      .map(
        (da) => `
            <tr>
              <td><strong>${escapeHtml(da.number)}</strong></td>
              <td class="muted">${formatAchatsDate(da.createdAt)}</td>
              <td>${escapeHtml(da.requester || "-")}</td>
              <td>
  <span class="status-badge ${da.urgency === "Critique"
            ? "badge-danger"
            : da.urgency === "Urgente"
              ? "badge-warning"
              : "badge-info"
          }">
    ${escapeHtml(da.urgency || "Normale")}
  </span>
</td>
              <td>${escapeHtml(da.articleLabel || "-")}</td>
              <td>${formatStockNumber(da.quantity || 0)}</td>
              <td>
  ${formatStockNumber(
            da.estimatedUnitPrice || 0
          )} DA
</td>
              <td><span class="status-badge ${getAchatsStatusBadgeClass(da.status)}">${escapeHtml(da.status || "-")}</span></td>
              <td>${buildAchatsListActions("demandes-achat", da.id, da.status)}</td>
            </tr>
          `,
      )
      .join("")
    : `
      <tr>
        <td colspan="8">
          ${buildOrganizationEmptyState(
      "fa-file-lines",
      "Aucune demande d'achat",
      "Créez votre première DA pour lancer le flux achat.",
      "Le numéro DA est généré automatiquement.",
    )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "organization-page organization-crud-page achats-page";
  pageContentEl.innerHTML = `
    ${buildAchatsTabs(activeSubpageKey)}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Achats</div>
        <h2>Demandes d'achat (DA)</h2>
        <p>Gestion des demandes d'achat avec validation,
priorisation par niveau d'urgence et
transformation en bons de commande.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${activeDemandes.length} DA</span>
        <span class="status-badge badge-success">${state.demandes.filter((item) => item.status === "Validée").length} validées</span>
      </div>
    </div>
${renderOrganizationStats([
    {
      label: "DA en attente",
      value: String(
        state.demandes.filter(
          (item) => item.status === "En attente"
        ).length,
      ),
      note: "À traiter",
    },
    {
      label: "DA urgentes",
      value: String(
        state.demandes.filter(
          (item) =>
            item.urgency === "Urgente" ||
            item.urgency === "Critique"
        ).length,
      ),
      note: "Priorité élevée",
    },
    {
      label: "DA validées",
      value: String(
        state.demandes.filter(
          (item) => item.status === "Validée"
        ).length,
      ),
      note: "Prêtes pour BC",
    },
  ])}


    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-list-check"></i> Liste des DA</div>
        <span class="status-badge badge-info">${activeDemandes.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date création</th>
              <th>Demandeur</th>
              <th>Urgence</th>
              <th>Article</th>
              <th>Qté</th>
              <th>Prix estimé</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAchatsOrdersPage(state, activeSubpageKey) {
  if (!pageContentEl) return;

  const rows = state.bons.length
    ? state.bons
      .map(
        (bc) => `
            <tr>
              <td><strong>${escapeHtml(bc.number)}</strong></td>
              <td class="muted">${formatAchatsDate(bc.createdAt)}</td>
              <td>${escapeHtml(bc.supplierName || "-")}</td>
              <td>${escapeHtml(bc.articleLabel || "-")}</td>
              <td>${formatStockNumber(bc.quantity || 0)}</td>
              <td>${formatAchatsMoney(bc.totalTtc || 0)}</td>
              <td><span class="status-badge ${getAchatsStatusBadgeClass(bc.status)}">${escapeHtml(bc.status || "-")}</span></td>
              <td>${buildAchatsListActions("bons-commande", bc.id)}</td>
            </tr>
          `,
      )
      .join("")
    : `
      <tr>
        <td colspan="8">
          ${buildOrganizationEmptyState(
      "fa-cart-shopping",
      "Aucun bon de commande",
      "Créez un BC à partir d'une ou plusieurs DA validées.",
      "Le calcul HT/TVA/TTC se fait automatiquement.",
    )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "organization-page organization-crud-page achats-page";
  pageContentEl.innerHTML = `
    ${buildAchatsTabs(activeSubpageKey)}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Achats</div>
        <h2>Bons de commande (BC)</h2>
        <p>Création des commandes fournisseurs avec lien DA, totaux calculés et suivi de statut jusqu'à réception complète.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${state.bons.length} BC</span>
        <span class="status-badge badge-warning">${state.bons.filter((item) => item.status === "Partiellement reçu").length} partiels</span>
      </div>
    </div>

    ${renderOrganizationStats([
    {
      label: "BC envoyés",
      value: String(
        state.bons.filter((item) => item.status === "Envoyé au fournisseur")
          .length,
      ),
      note: "En attente de confirmation fournisseur",
    },
    {
      label: "Montant cumulé TTC",
      value: formatAchatsMoney(
        state.bons.reduce(
          (sum, item) => sum + (Number(item.totalTtc) || 0),
          0,
        ),
      ),
      note: "Frais de livraison inclus",
    },
    {
      label: "BC reçus complets",
      value: String(
        state.bons.filter((item) => item.status === "Reçu complet").length,
      ),
      note: "Clôturés côté approvisionnement",
    },
  ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-file-signature"></i> Liste des BC</div>
        <span class="status-badge badge-info">${state.bons.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date création</th>
              <th>Fournisseur</th>
              <th>Article</th>
              <th>Qté</th>
              <th>Total TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAchatsReceptionsPage(state, activeSubpageKey) {
  if (!pageContentEl) return;

  const rows = state.receptions.length
    ? state.receptions
      .map(
        (rec) => `
            <tr>
              <td><strong>${escapeHtml(rec.number)}</strong></td>
              <td class="muted">${formatAchatsDate(rec.createdAt)}</td>
              <td>${escapeHtml((state.bons.find((item) => item.id === rec.bcId) || {}).number || "-")}</td>
              <td>${escapeHtml(rec.supplierName || "-")}</td>
              <td>${escapeHtml(rec.articleLabel || "-")}</td>
              <td>${formatStockNumber(rec.receivedQty || 0)}</td>
              <td>${formatStockNumber(rec.missingQty || 0)}</td>
              <td><span class="status-badge ${getAchatsStatusBadgeClass(rec.status)}">${escapeHtml(rec.status || "-")}</span></td>
              <td>${buildAchatsListActions("receptions", rec.id)}</td>
            </tr>
          `,
      )
      .join("")
    : `
      <tr>
        <td colspan="9">
          ${buildOrganizationEmptyState(
      "fa-box-open",
      "Aucune réception",
      "Enregistrez une réception à partir d'un BC existant.",
      "La quantité manquante est calculée automatiquement.",
    )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "organization-page organization-crud-page achats-page";
  pageContentEl.innerHTML = `
    ${buildAchatsTabs(activeSubpageKey)}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Achats</div>
        <h2>Réceptions</h2>
        <p>Réception de la marchandise liée à un BC avec contrôle qualité, écarts de quantité et traçabilité documentaire.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${state.receptions.length} réceptions</span>
        <span class="status-badge badge-warning">${state.receptions.filter((item) => Number(item.missingQty) > 0).length} avec manquants</span>
      </div>
    </div>

    ${renderOrganizationStats([
    {
      label: "Réceptions conformes",
      value: String(
        state.receptions.filter((item) => item.receptionState === "Conforme")
          .length,
      ),
      note: "Conformité ligne article",
    },
    {
      label: "Qté reçue totale",
      value: formatStockNumber(
        state.receptions.reduce(
          (sum, item) => sum + (Number(item.receivedQty) || 0),
          0,
        ),
      ),
      note: "Cumul toutes réceptions",
    },
    {
      label: "Contrôle qualité refusé",
      value: String(
        state.receptions.filter((item) => item.qualityControl === "Refusé")
          .length,
      ),
      note: "Retours ou litiges fournisseurs",
    },
  ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-dolly"></i> Liste des réceptions</div>
        <span class="status-badge badge-info">${state.receptions.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date réception</th>
              <th>BC lié</th>
              <th>Fournisseur</th>
              <th>Article</th>
              <th>Qté reçue</th>
              <th>Qté manquante</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildAchatsHistoryRows(state) {
  const demandes = state.demandes.map((item) => ({
    id: item.id,
    type: "DA",
    number: item.number,
    date: item.createdAt,
    article: item.articleLabel || "-",
    supplier: item.preferredSupplier || "-",
    status: item.status || "-",
    amount: 0,
  }));

  const bons = state.bons.map((item) => ({
    id: item.id,
    type: "BC",
    number: item.number,
    date: item.createdAt,
    article: item.articleLabel || "-",
    supplier: item.supplierName || "-",
    status: item.status || "-",
    amount: Number(item.totalTtc) || 0,
  }));

  const receptions = state.receptions.map((item) => ({
    id: item.id,
    type: "REC",
    number: item.number,
    date: item.createdAt,
    article: item.articleLabel || "-",
    supplier: item.supplierName || "-",
    status: item.status || "-",
    amount: 0,
  }));

  return [...demandes, ...bons, ...receptions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function filterAchatsHistoryRows(rows) {
  return rows.filter((row) => {
    if (
      achatsHistoryFilterState.article &&
      !String(row.article || "")
        .toLowerCase()
        .includes(achatsHistoryFilterState.article.toLowerCase())
    ) {
      return false;
    }

    if (
      achatsHistoryFilterState.supplier &&
      !String(row.supplier || "")
        .toLowerCase()
        .includes(achatsHistoryFilterState.supplier.toLowerCase())
    ) {
      return false;
    }

    if (
      achatsHistoryFilterState.documentType &&
      row.type !== achatsHistoryFilterState.documentType
    ) {
      return false;
    }

    if (
      achatsHistoryFilterState.status &&
      row.status !== achatsHistoryFilterState.status
    ) {
      return false;
    }

    if (achatsHistoryFilterState.from) {
      const from = new Date(achatsHistoryFilterState.from).getTime();
      if (!Number.isNaN(from) && new Date(row.date).getTime() < from) {
        return false;
      }
    }

    if (achatsHistoryFilterState.to) {
      const to = new Date(achatsHistoryFilterState.to).getTime();
      if (!Number.isNaN(to) && new Date(row.date).getTime() > to + 86399999) {
        return false;
      }
    }

    if (achatsHistoryFilterState.minAmount) {
      const minAmount = Number(achatsHistoryFilterState.minAmount) || 0;
      if ((Number(row.amount) || 0) < minAmount) return false;
    }

    return true;
  });
}

function renderAchatsHistoryPage(state, activeSubpageKey) {
  if (!pageContentEl) return;

  const historyRows = buildAchatsHistoryRows(state);
  const filteredRows = filterAchatsHistoryRows(historyRows);
  const uniqueStatuses = Array.from(
    new Set(historyRows.map((row) => row.status)),
  );

  const rows = filteredRows.length
    ? filteredRows
      .map(
        (row) => `
            <tr>
              <td><strong>${escapeHtml(row.number)}</strong></td>
              <td><span class="status-badge badge-info">${escapeHtml(row.type)}</span></td>
              <td class="muted">${formatAchatsDate(row.date)}</td>
              <td>${escapeHtml(row.article)}</td>
              <td>${escapeHtml(row.supplier)}</td>
              <td><span class="status-badge ${getAchatsStatusBadgeClass(row.status)}">${escapeHtml(row.status)}</span></td>
              <td>${row.type === "BC" ? formatAchatsMoney(row.amount) : "-"}</td>
            </tr>
          `,
      )
      .join("")
    : `
      <tr>
        <td colspan="7">
          ${buildOrganizationEmptyState(
      "fa-filter-circle-xmark",
      "Aucun résultat",
      "Aucun document ne correspond aux filtres sélectionnés.",
      "Ajustez les filtres puis relancez la recherche.",
    )}
        </td>
      </tr>
    `;

  pageContentEl.className =
    "organization-page organization-crud-page achats-page";
  pageContentEl.innerHTML = `
    ${buildAchatsTabs(activeSubpageKey)}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">Achats</div>
        <h2>Historique consolidé</h2>
        <p>Consultation des DA, BC et réceptions avec filtres par article, fournisseur, type document, statut, date et montant.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${historyRows.length} documents</span>
        <span class="status-badge badge-success">${filteredRows.length} affichés</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-sliders"></i> Filtres</div>
      </div>
      <div class="card-body">
        <form class="org-form" data-ach-history-filter="true">
          <div class="org-form-grid">
            <div class="field-group">
              <label for="historyArticle">Par article</label>
              <input id="historyArticle" name="article" type="text" value="${escapeHtml(achatsHistoryFilterState.article)}" placeholder="Nom ou référence article" />
            </div>
            <div class="field-group">
              <label for="historySupplier">Par fournisseur</label>
              <input id="historySupplier" name="supplier" type="text" value="${escapeHtml(achatsHistoryFilterState.supplier)}" placeholder="Fournisseur" />
            </div>
            <div class="field-group">
              <label for="historyDocType">Type document</label>
              <select id="historyDocType" name="documentType">
                <option value="">Tous</option>
                <option value="DA" ${achatsHistoryFilterState.documentType === "DA" ? "selected" : ""}>DA</option>
                <option value="BC" ${achatsHistoryFilterState.documentType === "BC" ? "selected" : ""}>BC</option>
                <option value="REC" ${achatsHistoryFilterState.documentType === "REC" ? "selected" : ""}>REC</option>
              </select>
            </div>
            <div class="field-group">
              <label for="historyStatus">Statut</label>
              <select id="historyStatus" name="status">
                <option value="">Tous</option>
                ${uniqueStatuses
      .map(
        (status) =>
          `<option value="${escapeHtml(status)}" ${achatsHistoryFilterState.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`,
      )
      .join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="historyFrom">Du</label>
              <input id="historyFrom" name="from" type="date" value="${escapeHtml(achatsHistoryFilterState.from)}" />
            </div>
            <div class="field-group">
              <label for="historyTo">Au</label>
              <input id="historyTo" name="to" type="date" value="${escapeHtml(achatsHistoryFilterState.to)}" />
            </div>
            <div class="field-group">
              <label for="historyMinAmount">Montant minimum (BC)</label>
              <input id="historyMinAmount" name="minAmount" type="number" min="0" step="0.01" value="${escapeHtml(achatsHistoryFilterState.minAmount)}" />
            </div>
          </div>
          <div class="org-modal-actions">
            <button class="btn btn-outline" type="button" data-ach-history-reset="true">Réinitialiser</button>
            <button class="btn btn-primary" type="submit">
              <i class="fa-solid fa-filter"></i>
              <span>Appliquer les filtres</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-table"></i> Tableau récapitulatif</div>
        <span class="status-badge badge-info">${filteredRows.length} lignes</span>
      </div>
      <div class="table-wrap" data-ach-history-table="true">
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Type</th>
              <th>Date</th>
              <th>Article</th>
              <th>Fournisseur</th>
              <th>Statut</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildAchatsFormFooter(subpageKey, mode, recordId) {
  return `
    <div class="org-modal-actions">
      <button class="btn btn-outline" type="button" data-ach-close="true">Annuler</button>
      <button class="btn btn-primary" type="submit">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>${mode === "edit" ? "Mettre à jour" : "Créer"}</span>
      </button>
    </div>
    <input type="hidden" name="recordId" value="${recordId || ""}" />
    <input type="hidden" name="subpageKey" value="${subpageKey}" />
  `;
}
function getSuppliersDirectory() {
  try {
    const stored = localStorage.getItem("maintflow.fournisseurs");
    console.log("Fournisseurs stockés :", stored);
    if (!stored) {
      return { suppliers: [] };
    }

    return JSON.parse(stored);
  } catch (error) {
    return { suppliers: [] };
  }
}

function buildSupplierOptions(selectedSupplier = "") {
  const suppliers =
    getSuppliersDirectory().suppliers || [];

  return [
    '<option value="">Sélectionner un fournisseur</option>',
    ...suppliers.map(
      (supplier) => `
        <option
          value="${supplier.nomCommercial}"
          ${supplier.nomCommercial === selectedSupplier
          ? "selected"
          : ""
        }
        >
          ${supplier.number} - ${supplier.nomCommercial}
        </option>
      `
    ),
  ].join("");
}

function getSupplierByName(name) {
  const suppliers =
    getSuppliersDirectory().suppliers || [];

  return (
    suppliers.find(
      (supplier) =>
        supplier.nomCommercial === name
    ) || null
  );
}

function buildAchatsDaForm(record, mode) {
  const codePreview =
    record?.number || buildAchatsRef("DA", loadAchatsState().demandes);
  const datePreview = record?.createdAt || new Date().toISOString();

  return `
    <form class="org-form" data-ach-form="demandes-achat">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Numéro</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label for="daArticle">Article</label>
          <select id="daArticle" name="articleId">${buildAchatsArticleOptions(record?.articleId || "")}</select>
        </div>
        <div class="field-group">
          <label for="daQuantity">Quantité demandée</label>
          <input id="daQuantity" name="quantity" type="number" min="1" step="1" value="${escapeHtml(String(record?.quantity || ""))}" required />
        </div>
        <div class="field-group">
  <label for="daEstimatedPrice">Prix unitaire estimé</label>
  <input
    id="daEstimatedPrice"
    name="estimatedUnitPrice"
    type="number"
    min="0"
    step="0.01"
    value="${escapeHtml(String(record?.estimatedUnitPrice || ""))}"
  />
</div>
        <div class="field-group">
  <label for="daSupplier">Fournisseur</label>
  <select id="daSupplier" name="preferredSupplier">
    ${buildSupplierOptions(record?.preferredSupplier || "")}
  </select>
</div>
        <div class="field-group">
          <label for="daNeededDate">Date souhaitée</label>
          <input id="daNeededDate" name="neededDate" type="date" value="${escapeHtml(record?.neededDate || "")}" />
        </div>
        <div class="field-group">
  <label for="daUrgency">Urgence</label>
  <select id="daUrgency" name="urgency" required>
    <option value="Normale" ${record?.urgency === "Normale" ? "selected" : ""}>Normale</option>
    <option value="Urgente" ${record?.urgency === "Urgente" ? "selected" : ""}>Urgente</option>
    <option value="Critique" ${record?.urgency === "Critique" ? "selected" : ""}>Critique</option>
  </select>
</div>

        <div class="field-group field-group-wide">
          <label for="daReason">Justification</label>
          <textarea id="daReason" name="reason" rows="4" placeholder="Motif de la demande">${escapeTextarea(record?.reason || "")}</textarea>
        </div>
      </div>
      ${buildAchatsFormFooter("demandes-achat", mode, record?.id || "")}
    </form>
  `;
}

function computeBcTotals(
  quantity,
  unitPrice,
  discountPercent,
  tvaPercent,
  shippingCost,
) {
  const lineTotalHt = Math.max(
    0,
    quantity * unitPrice * (1 - discountPercent / 100),
  );
  const totalHt = lineTotalHt;
  const totalTtc = totalHt * (1 + tvaPercent / 100) + shippingCost;
  return {
    lineTotalHt,
    totalHt,
    totalTtc,
  };
}

function buildAchatsBcForm(record, mode, state) {
  const codePreview = record?.number || buildAchatsRef("BC", state.bons);
  const datePreview = record?.createdAt || new Date().toISOString();
  const totals = computeBcTotals(
    Number(record?.quantity) || 0,
    Number(record?.unitPrice) || 0,
    Number(record?.discountPercent) || 0,
    Number(record?.tvaPercent) || 0,
    Number(record?.shippingCost) || 0,
  );

  return `
    <form class="org-form" data-ach-form="bons-commande">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Numéro</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label>Date création</label>
          <input type="text" value="${escapeHtml(formatAchatsDate(datePreview))}" disabled />
        </div>
        <div class="field-group">
          <label for="bcOrderDate">Date commande</label>
          <input id="bcOrderDate" name="orderDate" type="date" value="${escapeHtml(record?.orderDate || "")}" required />
        </div>
        <div class="field-group">
          <label for="bcWantedDate">Date livraison souhaitée</label>
          <input id="bcWantedDate" name="wantedDate" type="date" value="${escapeHtml(record?.wantedDate || "")}" required />
        </div>
        <div class="field-group">
  <label for="bcSupplierName">Fournisseur</label>
  <select id="bcSupplierName" name="supplierName" required>
    ${buildSupplierOptions(record?.supplierName || "")}
  </select>
</div>
        <div class="field-group">
  <label for="bcSupplierPhone">Contact fournisseur</label>
  <input
    id="bcSupplierPhone"
    name="supplierPhone"
    type="text"
    value="${escapeHtml(record?.supplierPhone || "")}"
    readonly
  />
</div>
       <div class="field-group">
  <label for="bcSupplierEmail">Email fournisseur</label>
  <input
    id="bcSupplierEmail"
    name="supplierEmail"
    type="email"
    value="${escapeHtml(record?.supplierEmail || "")}"
    readonly
  />
</div>

        <div class="field-group">
          <label for="bcSupplierRef">Référence fournisseur</label>
          <input id="bcSupplierRef" name="supplierRef" type="text" value="${escapeHtml(record?.supplierRef || "")}" placeholder="Référence" />
        </div>
         <div class="field-group field-group-wide">
  <label for="bcDaLinked">
    Demande d'achat liée
  </label>

  <select
    id="bcDaLinked"
    name="linkedDaId"
    required
  >
    <option value="">
      Sélectionner une DA
    </option>

    ${buildAchatsDaOptions(
    state.demandes.filter(
      (da) => da.status === "Validée" ||
        da.id === record?.linkedDaId
    ),
    record?.linkedDaId || ""
  )}
  </select>

  <div class="org-field-hint">
    Sélectionnez une demande d'achat validée.
  </div>
</div>

<div class="field-group">
  <label for="bcQuantity">
    Quantité commandée
  </label>

  <input
    id="bcQuantity"
    name="quantity"
    type="number"
    min="1"
    step="1"
    value="${escapeHtml(String(record?.quantity || ""))}"
    readonly
  />
</div>

        <div class="field-group">
          <label for="bcUnitPrice">Prix unitaire HT</label>
          <input id="bcUnitPrice" name="unitPrice" type="number" min="0" step="0.01" value="${escapeHtml(String(record?.unitPrice || ""))}" required />
        </div>
        <div class="field-group">
          <label for="bcDiscount">Remise %</label>
          <input id="bcDiscount" name="discountPercent" type="number" min="0" max="100" step="0.01" value="${escapeHtml(String(record?.discountPercent || "0"))}" />
        </div>
        <div class="field-group">
          <label for="bcLineTotal">Montant HT (auto)</label>
          <input id="bcLineTotal" name="lineTotalHt" type="number" value="${escapeHtml(String(totals.lineTotalHt.toFixed(2)))}" readonly />
        </div>
        <div class="field-group">
          <label for="bcTotalHt">Total HT (auto)</label>
          <input id="bcTotalHt" name="totalHt" type="number" value="${escapeHtml(String(totals.totalHt.toFixed(2)))}" readonly />
        </div>
        <div class="field-group">
          <label for="bcTva">TVA %</label>
          <input id="bcTva" name="tvaPercent" type="number" min="0" step="0.01" value="${escapeHtml(String(record?.tvaPercent || "19"))}" />
        </div>
        <div class="field-group">
          <label for="bcShipping">Frais de livraison</label>
          <input id="bcShipping" name="shippingCost" type="number" min="0" step="0.01" value="${escapeHtml(String(record?.shippingCost || "0"))}" />
        </div>
        <div class="field-group">
          <label for="bcTotalTtc">Total TTC (auto)</label>
          <input id="bcTotalTtc" name="totalTtc" type="number" value="${escapeHtml(String(totals.totalTtc.toFixed(2)))}" readonly />
        </div>
        <div class="field-group">
          <label for="bcPaymentTerm">Conditions de paiement</label>
          <select id="bcPaymentTerm" name="paymentTerm">
            ${["Comptant", "30 jours", "60 jours", "Autre"]
      .map(
        (term) =>
          `<option value="${term}" ${record?.paymentTerm === term ? "selected" : ""}>${term}</option>`,
      )
      .join("")}
          </select>
        </div>
        <div class="field-group">
          <label for="bcStatus">Statut</label>
          <select id="bcStatus" name="status" required>
            ${[
      "Brouillon",
      "Envoyé au fournisseur",
      "Confirmé par fournisseur",
      "Partiellement reçu",
      "Reçu complet",
      "Annulé",
    ]
      .map(
        (status) =>
          `<option value="${status}" ${record?.status === status ? "selected" : ""}>${status}</option>`,
      )
      .join("")}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label for="bcDeliveryAddress">Adresse de livraison</label>
          <input id="bcDeliveryAddress" name="deliveryAddress" type="text" value="${escapeHtml(record?.deliveryAddress || "")}" />
        </div>
        <div class="field-group">
          <label for="bcDeliveryMode">Mode de livraison</label>
          <input id="bcDeliveryMode" name="deliveryMode" type="text" value="${escapeHtml(record?.deliveryMode || "")}" />
        </div>
        <div class="field-group">
          <label for="bcAttachments">Documents joints</label>
          <input id="bcAttachments" name="attachments" type="text" value="${escapeHtml(record?.attachments || "")}" placeholder="Devis, contrat..." />
        </div>
        <div class="field-group field-group-wide">
          <label for="bcObservations">Observations</label>
          <textarea id="bcObservations" name="observations" rows="4">${escapeTextarea(record?.observations || "")}</textarea>
        </div>
      </div>
      ${buildAchatsFormFooter("bons-commande", mode, record?.id || "")}
    </form>
  `;
}

function buildAchatsReceptionForm(record, mode, state) {
  const codePreview = record?.number || buildAchatsRef("REC", state.receptions);
  const datePreview = record?.createdAt || new Date().toISOString();
  const linkedBc = state.bons.find((item) => item.id === record?.bcId);
  const orderedQty = Number(record?.orderedQty || linkedBc?.quantity || 0);
  const receivedQty = Number(record?.receivedQty || 0);
  const gapQty = receivedQty - orderedQty;

  return `
    <form class="org-form" data-ach-form="receptions">
      <div class="org-form-grid">
        <div class="field-group">
          <label>Numéro</label>
          <input type="text" value="${escapeHtml(codePreview)}" disabled />
        </div>
        <div class="field-group">
          <label>Date réception</label>
          <input type="text" value="${escapeHtml(formatAchatsDate(datePreview))}" disabled />
        </div>
        <div class="field-group">
          <label for="recBcId">BC lié</label>
          <select id="recBcId" name="bcId" required>${buildAchatsBcOptions(state.bons, record?.bcId || "")}</select>
        </div>
        <div class="field-group">
          <label>Réceptionné par</label>
          <input type="text" value="${escapeHtml(record?.receiver || achatsCurrentUser)}" disabled />
        </div>
        <div class="field-group">
          <label for="recSupplierName">Fournisseur (auto BC)</label>
          <input id="recSupplierName" name="supplierName" type="text" value="${escapeHtml(record?.supplierName || linkedBc?.supplierName || "")}" readonly />
        </div>
        <div class="field-group">
          <label for="recArticleLabel">Article (auto BC)</label>
          <input id="recArticleLabel" name="articleLabel" type="text" value="${escapeHtml(record?.articleLabel || linkedBc?.articleLabel || "")}" readonly />
        </div>
        <div class="field-group">
          <label for="recOrderedQty">Quantité commandée</label>
          <input id="recOrderedQty" name="orderedQty" type="number" min="0" value="${escapeHtml(String(orderedQty))}" readonly />
        </div>
        <div class="field-group">
          <label for="recReceivedQty">Quantité reçue</label>
          <input id="recReceivedQty" name="receivedQty" type="number" min="0" step="1" value="${escapeHtml(String(receivedQty || ""))}" required />
        </div>
        <div class="field-group">
  <label for="recGapQty">Écart</label>
  <input
      id="recGapQty"
      name="gapQty"
      type="text"
      value="${gapQty > 0 ? "+" + gapQty : gapQty}"
      readonly
  />
</div>
       <div class="field-group">
  <label for="recState">État réception</label>

  <input
    id="recState"
    name="receptionState"
    type="text"
    value="${gapQty === 0
      ? "Réception complète"
      : gapQty < 0
        ? "Réception partielle"
        : "Sur-réception"
    }"
    readonly
  />
</div>

        <div class="field-group field-group-wide">
  <label for="recStorage">Emplacement de stockage</label>

  <select
      id="recStorage"
      name="storageLocation"
      required
  >
      ${buildStockLocationOptions(record?.storageLocation || "")}
  </select>

</div>
        <div class="field-group">
  <label for="recDeliveryNote">Bon de livraison fournisseur</label>

  <input
    id="recDeliveryNote"
    name="deliveryNoteFile"
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
  />

</div>
        <div class="field-group">
  <label for="recInvoiceRef">Facture fournisseur</label>

  <input
    id="recInvoiceRef"
    name="invoiceFile"
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
  />

</div>
        <div class="field-group field-group-wide">
          <label for="recObservations">Observations générales</label>
          <textarea id="recObservations" name="observations" rows="4">${escapeTextarea(record?.observations || "")}</textarea>
        </div>
      </div>
      ${buildAchatsFormFooter("receptions", mode, record?.id || "")}
    </form>
  `;
}

function buildAchatsDaDetails(record) {
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Numéro</span><strong>${escapeHtml(record.number)}</strong></div>
      <div class="org-detail-item"><span>Date création</span><strong>${formatAchatsDate(record.createdAt)}</strong></div>
      <div class="org-detail-item"><span>Demandeur</span><strong>${escapeHtml(record.requester || "-")}</strong></div>
      <div class="org-detail-item">
  <span>Urgence</span>
  <strong>${escapeHtml(record.urgency || "Normale")}</strong>
</div>
      <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(record.articleLabel || "-")}</strong></div>
      <div class="org-detail-item"><span>Quantité</span><strong>${formatStockNumber(record.quantity || 0)}</strong></div>
      <div class="org-detail-item">
  <span>Prix unitaire estimé</span>
  <strong>${formatStockNumber(record.estimatedUnitPrice || 0)} DH</strong>
</div>
      <div class="org-detail-item"><span>Fournisseur suggéré</span><strong>${escapeHtml(record.preferredSupplier || "-")}</strong></div>
      <div class="org-detail-item"><span>Date souhaitée</span><strong>${escapeHtml(record.neededDate || "-")}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(record.status || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Justification</span><strong>${escapeHtml(record.reason || "-")}</strong></div>
    </div>
    <div class="org-modal-actions">
    ${record.status === "En attente"
      ? `
          <button
            type="button"
            class="btn btn-success"
            data-da-validate="${record.id}"
          >
            <i class="fa-solid fa-check"></i>
            Valider
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-da-reject="${record.id}"
          >
            <i class="fa-solid fa-xmark"></i>
            Refuser
          </button>
        `
      : ""
    }

    <button
      type="button"
      class="btn btn-outline"
      data-ach-close="true"
    >
      Fermer
    </button>
  </div>

  `;
}

function buildAchatsBcDetails(record, state) {
  const linkedDa =
    state.demandes.find(
      (item) =>
        item.id === record.linkedDaId
    );

  const linkedDaNumber =
    linkedDa?.number || "-";

  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Numéro</span><strong>${escapeHtml(record.number)}</strong></div>
      <div class="org-detail-item"><span>Date création</span><strong>${formatAchatsDate(record.createdAt)}</strong></div>
      <div class="org-detail-item"><span>Date commande</span><strong>${escapeHtml(record.orderDate || "-")}</strong></div>
      <div class="org-detail-item"><span>Date livraison souhaitée</span><strong>${escapeHtml(record.wantedDate || "-")}</strong></div>
      <div class="org-detail-item"><span>Fournisseur</span><strong>${escapeHtml(record.supplierName || "-")}</strong></div>
      <div class="org-detail-item"><span>Contact</span><strong>${escapeHtml(record.supplierPhone || "-")} | ${escapeHtml(record.supplierEmail || "-")}</strong></div>
      <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(record.articleLabel || "-")}</strong></div>
      <div class="org-detail-item"><span>Réf fournisseur</span><strong>${escapeHtml(record.supplierRef || "-")}</strong></div>
      <div class="org-detail-item"><span>Quantité</span><strong>${formatStockNumber(record.quantity || 0)}</strong></div>
      <div class="org-detail-item"><span>Total HT</span><strong>${formatAchatsMoney(record.totalHt || 0)}</strong></div>
      <div class="org-detail-item"><span>Total TTC</span><strong>${formatAchatsMoney(record.totalTtc || 0)}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(record.status || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>DA liée</span><strong>${escapeHtml(linkedDaNumber)}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Adresse de livraison</span><strong>${escapeHtml(record.deliveryAddress || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Observations</span><strong>${escapeHtml(record.observations || "-")}</strong></div>
    </div>
  `;
}

function buildAchatsReceptionDetails(record, state) {
  const linkedBc = state.bons.find((item) => item.id === record.bcId);
  return `
    <div class="org-detail-grid">
      <div class="org-detail-item"><span>Numéro</span><strong>${escapeHtml(record.number)}</strong></div>
      <div class="org-detail-item"><span>Date réception</span><strong>${formatAchatsDate(record.createdAt)}</strong></div>
      <div class="org-detail-item"><span>BC lié</span><strong>${escapeHtml(linkedBc?.number || "-")}</strong></div>
      <div class="org-detail-item"><span>Réceptionné par</span><strong>${escapeHtml(record.receiver || "-")}</strong></div>
      <div class="org-detail-item"><span>Fournisseur</span><strong>${escapeHtml(record.supplierName || "-")}</strong></div>
      <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(record.articleLabel || "-")}</strong></div>
      <div class="org-detail-item"><span>Qté commandée</span><strong>${formatStockNumber(record.orderedQty || 0)}</strong></div>
      <div class="org-detail-item"><span>Qté reçue</span><strong>${formatStockNumber(record.receivedQty || 0)}</strong></div>
      <div class="org-detail-item"><span>Écart</span><strong>${formatStockNumber(record.missingQty || 0)}</strong></div>
      <div class="org-detail-item"><span>État réception</span><strong>${escapeHtml(record.receptionState || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Emplacement stock</span><strong>${escapeHtml(record.storageLocation || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>BL fournisseur</span><strong>${escapeHtml(record.deliveryNoteRef || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Facture fournisseur</span><strong>${escapeHtml(record.invoiceRef || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Observations</span><strong>${escapeHtml(record.observations || "-")}</strong></div>
    </div>
  `;
}

function renderAchatsModal(activeSubpageKey, state) {
  if (!overlayRootEl) return;

  if (!achatsModalState || achatsModalState.subpageKey !== activeSubpageKey) {
    overlayRootEl.innerHTML = "";
    return;
  }

  const record = getAchatsRecordsBySubpage(state, activeSubpageKey).find(
    (item) => item.id === achatsModalState.recordId,
  );
  const mode = achatsModalState.mode || "create";

  let title = "";
  let subtitle = "";
  let content = "";

  if (activeSubpageKey === "demandes-achat") {
    title =
      mode === "edit"
        ? `Modifier ${record?.number || "DA"}`
        : mode === "details"
          ? `Détails ${record?.number || "DA"}`
          : "Nouvelle demande d'achat";
    subtitle =
      mode === "details"
        ? "Consultation de la demande d'achat."
        : "Formulaire DA avec numéro/date/demandeur automatiques.";
    content =
      mode === "details" && record
        ? buildAchatsDaDetails(record)
        : buildAchatsDaForm(record, mode);
  } else if (activeSubpageKey === "bons-commande") {
    title =
      mode === "edit"
        ? `Modifier ${record?.number || "BC"}`
        : mode === "details"
          ? `Détails ${record?.number || "BC"}`
          : "Nouveau bon de commande";
    subtitle =
      mode === "details"
        ? "Consultation du bon de commande."
        : "Formulaire BC avec calcul automatique des montants.";
    content =
      mode === "details" && record
        ? buildAchatsBcDetails(record, state)
        : buildAchatsBcForm(record, mode, state);
  } else {
    title =
      mode === "edit"
        ? `Modifier ${record?.number || "REC"}`
        : mode === "details"
          ? `Détails ${record?.number || "REC"}`
          : "Nouvelle réception";
    subtitle =
      mode === "details"
        ? "Consultation de la réception."
        : "Formulaire réception lié à un BC avec quantité manquante auto.";
    content =
      mode === "details" && record
        ? buildAchatsReceptionDetails(record, state)
        : buildAchatsReceptionForm(record, mode, state);
  }

  overlayRootEl.innerHTML = `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-ach-close="true"></div>
      <div class="org-modal-panel" role="dialog" aria-modal="true" aria-labelledby="achModalTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Achats</div>
            <h3 id="achModalTitle">${escapeHtml(title)}</h3>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <button class="org-modal-close" type="button" data-ach-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${content}
      </div>
    </div>
  `;


  const modal = overlayRootEl.querySelector(".org-modal");
  if (!modal) return;

  const supplierSelect =
    modal.querySelector("#bcSupplierName");

  supplierSelect?.addEventListener(
    "change",
    function () {
      const supplier =
        getSupplierByName(this.value);

      if (!supplier) return;

      const phoneInput =
        modal.querySelector("#bcSupplierPhone");

      const emailInput =
        modal.querySelector("#bcSupplierEmail");

      if (phoneInput) {
        phoneInput.value =
          supplier.tel1 || "";
      }

      if (emailInput) {
        emailInput.value =
          supplier.email || "";
      }
    }
  );


  modal.querySelectorAll("[data-ach-close]").forEach((button) => {
    button.addEventListener("click", function () {
      closeAchatsModal(activeSubpageKey);
    });
  });

  modal.querySelectorAll("[data-da-validate]").forEach((button) => {
    button.addEventListener("click", function () {
      const recordId = this.dataset.daValidate;

      const state = loadAchatsState();

      state.demandes = state.demandes.map((item) =>
        item.id === recordId
          ? { ...item, status: "Validée" }
          : item
      );

      saveAchatsState(state);

      closeAchatsModal("demandes-achat");
      renderAchatsPage("demandes-achat");
    });
  });

  modal.querySelectorAll("[data-da-reject]").forEach((button) => {
    button.addEventListener("click", function () {
      const recordId = this.dataset.daReject;

      const state = loadAchatsState();

      state.demandes = state.demandes.map((item) =>
        item.id === recordId
          ? { ...item, status: "Refusée" }
          : item
      );

      saveAchatsState(state);

      closeAchatsModal("demandes-achat");
      renderAchatsPage("demandes-achat");
    });
  });

  const form = modal.querySelector("[data-ach-form]");
  if (!form || mode === "details") return;

  const formType = form.getAttribute("data-ach-form");

  if (formType === "bons-commande") {
    const linkedDaSelect =
      form.querySelector("select[name='linkedDaId']");
    const qtyInput = form.querySelector("input[name='quantity']");
    const unitPriceInput = form.querySelector("input[name='unitPrice']");
    const discountInput = form.querySelector("input[name='discountPercent']");
    const tvaInput = form.querySelector("input[name='tvaPercent']");
    const shippingInput = form.querySelector("input[name='shippingCost']");
    const lineTotalInput = form.querySelector("input[name='lineTotalHt']");
    const totalHtInput = form.querySelector("input[name='totalHt']");
    const totalTtcInput = form.querySelector("input[name='totalTtc']");

    const refreshTotals = () => {
      const totals = computeBcTotals(
        Number(qtyInput?.value || 0),
        Number(unitPriceInput?.value || 0),
        Number(discountInput?.value || 0),
        Number(tvaInput?.value || 0),
        Number(shippingInput?.value || 0),
      );
      if (lineTotalInput) lineTotalInput.value = totals.lineTotalHt.toFixed(2);
      if (totalHtInput) totalHtInput.value = totals.totalHt.toFixed(2);
      if (totalTtcInput) totalTtcInput.value = totals.totalTtc.toFixed(2);
    };

    [qtyInput, unitPriceInput, discountInput, tvaInput, shippingInput].forEach(
      (input) => {
        input?.addEventListener("input", refreshTotals);
      },
    );
    refreshTotals();
    linkedDaSelect?.addEventListener(
      "change",
      function () {
        const da = state.demandes.find(
          (item) => item.id === this.value
        );

        if (!da) return;

        if (qtyInput) {
          qtyInput.value = da.quantity || 0;
        }

        refreshTotals();
      }
    );
  }

  if (formType === "receptions") {
    const bcSelect = form.querySelector("select[name='bcId']");
    const supplierInput = form.querySelector("input[name='supplierName']");
    const articleInput = form.querySelector("input[name='articleLabel']");
    const orderedQtyInput = form.querySelector("input[name='orderedQty']");
    const receivedQtyInput = form.querySelector("input[name='receivedQty']");
    const gapQtyInput = form.querySelector("input[name='gapQty']");
    const receptionStateInput = form.querySelector(
      "input[name='receptionState']"
    );
    const refreshFromBc = () => {
      const selectedBc = state.bons.find((item) => item.id === bcSelect?.value);
      if (supplierInput)
        supplierInput.value = selectedBc ? selectedBc.supplierName || "" : "";
      if (articleInput)
        articleInput.value = selectedBc ? selectedBc.articleLabel || "" : "";
      if (orderedQtyInput)
        orderedQtyInput.value = String(
          selectedBc ? Number(selectedBc.quantity || 0) : 0,
        );

      const orderedQty = Number(orderedQtyInput?.value || 0);
      const receivedQty = Number(receivedQtyInput?.value || 0);

      const gap = receivedQty - orderedQty;

      if (gapQtyInput) {
        gapQtyInput.value = gap > 0 ? `+${gap}` : String(gap);
      }

      if (receptionStateInput) {
        if (gap === 0) {
          receptionStateInput.value = "Réception complète";
        } else if (gap < 0) {
          receptionStateInput.value = "Réception partielle";
        } else {
          receptionStateInput.value = "Sur-réception";
        }
      }
    };

    const refreshMissingQty = () => {
      const orderedQty = Number(orderedQtyInput?.value || 0);
      const receivedQty = Number(receivedQtyInput?.value || 0);

      const gap = receivedQty - orderedQty;

      if (gapQtyInput) {
        gapQtyInput.value = gap > 0 ? `+${gap}` : String(gap);
      }

      if (receptionStateInput) {
        receptionStateInput.value =
          gap === 0 ? "Conforme" : "Non conforme";
      }
      console.log("Gap =", gap);
      console.log("Etat =", receptionStateInput?.value);
    };

    bcSelect?.addEventListener("change", refreshFromBc);
    receivedQtyInput?.addEventListener("input", refreshMissingQty);
    refreshFromBc();
    refreshMissingQty();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const modeType = achatsModalState?.mode || "create";
    const recordId = achatsModalState?.recordId || "";
    const nextState = loadAchatsState();

    if (formType === "demandes-achat") {
      const record = {
        id: modeType === "edit" ? recordId : `da-${Date.now()}`,
        number:
          modeType === "edit"
            ? (nextState.demandes.find((item) => item.id === recordId) || {})
              .number || buildAchatsRef("DA", nextState.demandes)
            : buildAchatsRef("DA", nextState.demandes),
        createdAt:
          modeType === "edit"
            ? (nextState.demandes.find((item) => item.id === recordId) || {})
              .createdAt || new Date().toISOString()
            : new Date().toISOString(),
        requester: achatsCurrentUser,
        status: modeType === "edit"
          ? (nextState.demandes.find((item) => item.id === recordId) || {}).status || "En attente"
          : "En attente",
        articleId: String(formData.get("articleId") || ""),
        articleLabel: (() => {
          const articleId = String(formData.get("articleId") || "");

          const article = getArticleRecord("articles", articleId);

          return article
            ? `${article.code} — ${article.name}`
            : "";
        })(),
        quantity: Number(formData.get("quantity") || 0),
        estimatedUnitPrice: Number(
          formData.get("estimatedUnitPrice") || 0
        ),
        preferredSupplier: String(
          formData.get("preferredSupplier") || "",
        ).trim(),
        urgency: String(
          formData.get("urgency") || "Normale"
        ),
        reason: String(formData.get("reason") || "").trim(),
        neededDate: String(formData.get("neededDate") || ""),
      };

      if (modeType === "edit") {
        nextState.demandes = nextState.demandes.map((item) =>
          item.id === recordId ? record : item,
        );
      } else {
        nextState.demandes.unshift(record);
      }
    }

    if (formType === "bons-commande") {
      const quantity = Number(formData.get("quantity") || 0);
      const unitPrice = Number(formData.get("unitPrice") || 0);
      const discountPercent = Number(formData.get("discountPercent") || 0);
      const tvaPercent = Number(formData.get("tvaPercent") || 0);
      const shippingCost = Number(formData.get("shippingCost") || 0);
      const totals = computeBcTotals(
        quantity,
        unitPrice,
        discountPercent,
        tvaPercent,
        shippingCost,
      );
      const linkedDaId = String(
        formData.get("linkedDaId") || ""
      );
      const linkedDa = nextState.demandes.find(
        da => da.id === linkedDaId
      );
      const record = {
        id: modeType === "edit" ? recordId : `bc-${Date.now()}`,
        number:
          modeType === "edit"
            ? (nextState.bons.find((item) => item.id === recordId) || {})
              .number || buildAchatsRef("BC", nextState.bons)
            : buildAchatsRef("BC", nextState.bons),
        createdAt:
          modeType === "edit"
            ? (nextState.bons.find((item) => item.id === recordId) || {})
              .createdAt || new Date().toISOString()
            : new Date().toISOString(),
        orderDate: String(formData.get("orderDate") || ""),
        wantedDate: String(formData.get("wantedDate") || ""),
        supplierName: String(formData.get("supplierName") || "").trim(),
        supplierPhone: String(formData.get("supplierPhone") || "").trim(),
        supplierEmail: String(formData.get("supplierEmail") || "").trim(),
        articleId: linkedDa?.articleId || "",
        articleLabel: linkedDa?.articleLabel || "",
        supplierRef: String(formData.get("supplierRef") || "").trim(),
        quantity,
        unitPrice,
        discountPercent,
        lineTotalHt: totals.lineTotalHt,
        totalHt: totals.totalHt,
        tvaPercent,
        shippingCost,
        totalTtc: totals.totalTtc,
        paymentTerm: String(formData.get("paymentTerm") || "Comptant"),
        deliveryAddress: String(formData.get("deliveryAddress") || "").trim(),
        deliveryMode: String(formData.get("deliveryMode") || "").trim(),
        observations: String(formData.get("observations") || "").trim(),
        attachments: String(formData.get("attachments") || "").trim(),
        status: String(formData.get("status") || "Brouillon"),
        linkedDaId,
      };

      if (modeType === "edit") {
        nextState.bons = nextState.bons.map((item) =>
          item.id === recordId ? record : item,
        );
      } else {
        nextState.bons.unshift(record);
      }

      nextState.demandes = nextState.demandes.map((item) => {
        if (item.id === linkedDaId && item.status !== "Annulée") {
          return { ...item, status: "Transformée en BC" };
        }
        return item;
      });
    }

    if (formType === "receptions") {
      const bcId = String(formData.get("bcId") || "").trim();
      const linkedBc = nextState.bons.find((item) => item.id === bcId);
      const orderedQty = Number(
        formData.get("orderedQty") || linkedBc?.quantity || 0,
      );
      const receivedQty = Number(formData.get("receivedQty") || 0);
      const missingQty = Math.max(0, orderedQty - receivedQty);
      const finalStatus = missingQty > 0 ? "Partielle" : "Complète";
      const deliveryFile = form.querySelector(
        "input[name='deliveryNoteFile']"
      )?.files?.[0] || null;

      const invoiceFile = form.querySelector(
        "input[name='invoiceFile']"
      )?.files?.[0] || null;
      const record = {
        id: modeType === "edit" ? recordId : `rec-${Date.now()}`,
        number:
          modeType === "edit"
            ? (nextState.receptions.find((item) => item.id === recordId) || {})
              .number || buildAchatsRef("REC", nextState.receptions)
            : buildAchatsRef("REC", nextState.receptions),
        createdAt:
          modeType === "edit"
            ? (nextState.receptions.find((item) => item.id === recordId) || {})
              .createdAt || new Date().toISOString()
            : new Date().toISOString(),
        bcId,
        receiver: achatsCurrentUser,
        supplierName: String(
          formData.get("supplierName") || linkedBc?.supplierName || "",
        ).trim(),
        articleId: linkedBc?.articleId || "",
        articleLabel: String(
          formData.get("articleLabel") || linkedBc?.articleLabel || "",
        ).trim(),
        orderedQty,
        receivedQty,
        missingQty,
        receptionState: String(formData.get("receptionState") || "Conforme"),
        storageLocation: String(formData.get("storageLocation") || "").trim(),
        deliveryNote: deliveryFile
          ? {
            name: deliveryFile.name,
            type: deliveryFile.type,
            size: deliveryFile.size,
          }
          : null,

        invoice: invoiceFile
          ? {
            name: invoiceFile.name,
            type: invoiceFile.type,
            size: invoiceFile.size,
          }
          : null,
        observations: String(formData.get("observations") || "").trim(),
      };

      if (modeType === "edit") {
        nextState.receptions = nextState.receptions.map((item) =>
          item.id === recordId ? record : item,
        );
      } else {
        nextState.receptions.unshift(record);
      }

      if (linkedBc) {
        nextState.bons = nextState.bons.map((item) => {
          if (item.id !== linkedBc.id) return item;

          const bcStatus =
            missingQty > 0 ? "Partiellement reçu" : "Reçu complet";
          return { ...item, status: bcStatus };
        });

        nextState.demandes = nextState.demandes.map((item) => {
          if (!linkedBc.linkedDaId?.includes(item.id)) return item;
          return {
            ...item,
            status: missingQty > 0 ? "Transformée en BC" : "Clôturée",
          };
        });
      }
    }

    saveAchatsState(nextState);
    closeAchatsModal(activeSubpageKey);
  });
}

function deleteAchatsRecord(subpageKey, recordId) {
  const state = loadAchatsState();

  if (subpageKey === "demandes-achat") {
    state.demandes = state.demandes.filter((item) => item.id !== recordId);
  }

  if (subpageKey === "bons-commande") {
    const removed = state.bons.find((item) => item.id === recordId);
    state.bons = state.bons.filter((item) => item.id !== recordId);
    if (removed) {
      state.demandes = state.demandes.map((item) => {
        if (
          removed.linkedDaId?.includes(item.id) &&
          item.status !== "Clôturée"
        ) {
          return { ...item, status: "Validée" };
        }
        return item;
      });
    }
    state.receptions = state.receptions.filter(
      (item) => item.bcId !== recordId,
    );
  }

  if (subpageKey === "receptions") {
    const removed = state.receptions.find((item) => item.id === recordId);
    state.receptions = state.receptions.filter((item) => item.id !== recordId);
    if (removed) {
      state.bons = state.bons.map((item) =>
        item.id === removed.bcId
          ? { ...item, status: "Confirmé par fournisseur" }
          : item,
      );
    }
  }

  saveAchatsState(state);
}

function exportAchatsHistoryCsv(rows) {
  const header = [
    "Numero",
    "Type",
    "Date",
    "Article",
    "Fournisseur",
    "Statut",
    "Montant",
  ];
  const lines = rows.map((row) => [
    row.number,
    row.type,
    formatAchatsDate(row.date),
    row.article,
    row.supplier,
    row.status,
    row.type === "BC" ? String(row.amount || 0) : "",
  ]);
  const csv = [header, ...lines]
    .map((line) =>
      line
        .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
        .join(";"),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `historique-achats-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function exportAchatsHistoryPdf(rows) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.number)}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(formatAchatsDate(row.date))}</td>
          <td>${escapeHtml(row.article)}</td>
          <td>${escapeHtml(row.supplier)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${row.type === "BC" ? escapeHtml(formatAchatsMoney(row.amount)) : "-"}</td>
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Historique Achats</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d9e1ea; padding: 8px; text-align: left; }
          th { background: #f2f6fa; }
        </style>
      </head>
      <body>
        <h1>Historique Achats</h1>
        <p>${localizeAdministrationText("Généré le")} ${escapeHtml(new Date().toLocaleString(getAdministrationLocale()))}</p>
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Type</th>
              <th>Date</th>
              <th>Article</th>
              <th>Fournisseur</th>
              <th>Statut</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function groupValidatedDaIntoBc() {
  const state = loadAchatsState();
  const validDAs = state.demandes.filter(
    (item) => item.status === "Validée" && item.preferredSupplier,
  );

  if (!validDAs.length) {
    window.alert(
      "Aucune DA validée avec fournisseur suggéré pour générer un BC groupé.",
    );
    return;
  }

  const groups = validDAs.reduce((accumulator, da) => {
    const key = da.preferredSupplier.trim().toLowerCase();
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(da);
    return accumulator;
  }, {});

  Object.values(groups).forEach((group) => {
    const supplier = group[0].preferredSupplier;
    const totalQty = group.reduce(
      (sum, da) => sum + (Number(da.quantity) || 0),
      0,
    );
    const linkedDaId = group.map((da) => da.id);
    const unitPrice = 1000;
    const tvaPercent = 19;
    const shippingCost = 0;
    const totals = computeBcTotals(
      totalQty,
      unitPrice,
      0,
      tvaPercent,
      shippingCost,
    );

    state.bons.unshift({
      id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      number: buildAchatsRef("BC", state.bons),
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString().slice(0, 10),
      wantedDate: "",
      supplierName: supplier,
      supplierPhone: "",
      supplierEmail: "",
      articleId: "",
      articleLabel: `Regroupement ${group.length} DA`,
      supplierRef: "",
      quantity: totalQty,
      unitPrice,
      discountPercent: 0,
      lineTotalHt: totals.lineTotalHt,
      totalHt: totals.totalHt,
      tvaPercent,
      shippingCost,
      totalTtc: totals.totalTtc,
      paymentTerm: "30 jours",
      deliveryAddress: "",
      deliveryMode: "",
      observations: "BC créé automatiquement via regroupement de DA validées.",
      attachments: "",
      status: "Brouillon",
      linkedDaId,
    });

    state.demandes = state.demandes.map((item) =>
      linkedDaId.includes(item.id)
        ? { ...item, status: "Transformée en BC" }
        : item,
    );
  });

  saveAchatsState(state);
  renderAchatsPage("bons-commande");
  window.alert(
    `${Object.keys(groups).length} BC généré(s) par regroupement fournisseur.`,
  );
}

function attachAchatsPageHandlers(activeSubpageKey, state) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll("[data-ach-tab]").forEach((button) => {
    button.addEventListener("click", function () {
      const next = this.dataset.achTab || achatsSubpages.defaultSubpage;
      renderPage("achats", next);
      window.location.hash = `achats/${next}`;
    });
  });

  pageContentEl.querySelectorAll("[data-ach-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.achAction;
      const subpageKey = this.dataset.achSubpage || activeSubpageKey;
      const recordId = this.dataset.achId || "";

      if (action === "details") {
        openAchatsModal(subpageKey, "details", recordId);
        return;
      }

      if (action === "edit") {
        openAchatsModal(subpageKey, "edit", recordId);
        return;
      }

      if (action === "delete") {
        const records = getAchatsRecordsBySubpage(state, subpageKey);
        const record = records.find((item) => item.id === recordId);
        if (!record) return;
        const confirmed = window.confirm(
          `Supprimer ${record.number || "cet élément"} ? Cette action est irréversible.`,
        );
        if (!confirmed) return;
        deleteAchatsRecord(subpageKey, recordId);
        renderAchatsPage(activeSubpageKey);
      }
    });
  });

  const historyFilterForm = pageContentEl.querySelector(
    "[data-ach-history-filter='true']",
  );
  historyFilterForm?.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(historyFilterForm);
    achatsHistoryFilterState = {
      article: String(formData.get("article") || "").trim(),
      supplier: String(formData.get("supplier") || "").trim(),
      documentType: String(formData.get("documentType") || ""),
      status: String(formData.get("status") || ""),
      from: String(formData.get("from") || ""),
      to: String(formData.get("to") || ""),
      minAmount: String(formData.get("minAmount") || "").trim(),
    };
    renderAchatsPage("historique");
  });

  pageContentEl
    .querySelector("[data-ach-history-reset='true']")
    ?.addEventListener("click", function () {
      achatsHistoryFilterState = {
        article: "",
        supplier: "",
        documentType: "",
        status: "",
        from: "",
        to: "",
        minAmount: "",
      };
      renderAchatsPage("historique");
    });

  pageActionsEl
    ?.querySelector("[data-ach-create]")
    ?.addEventListener("click", function () {
      const targetSubpage = this.dataset.achCreate || activeSubpageKey;
      openAchatsModal(targetSubpage, "create");
    });

  pageActionsEl
    ?.querySelector("[data-ach-group-da]")
    ?.addEventListener("click", function () {
      groupValidatedDaIntoBc();
    });

  pageActionsEl
    ?.querySelector("[data-ach-export='excel']")
    ?.addEventListener("click", function () {
      const rows = filterAchatsHistoryRows(
        buildAchatsHistoryRows(loadAchatsState()),
      );
      exportAchatsHistoryCsv(rows);
    });

  pageActionsEl
    ?.querySelector("[data-ach-export='pdf']")
    ?.addEventListener("click", function () {
      const rows = filterAchatsHistoryRows(
        buildAchatsHistoryRows(loadAchatsState()),
      );
      exportAchatsHistoryPdf(rows);
    });
}

function renderAchatsPage(subpageKey) {
  const activeSubpageKey = achatsSubpages.tabs[subpageKey]
    ? subpageKey
    : achatsSubpages.defaultSubpage;
  const config = achatsSubpages.tabs[activeSubpageKey];
  const state = loadAchatsState();

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText(
      `Achats - ${config.title}`,
    );
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(config.subtitle);

  renderAchatsPageActions(activeSubpageKey);

  if (activeSubpageKey === "demandes-achat") {
    renderAchatsDemandsPage(state, activeSubpageKey);
  } else if (activeSubpageKey === "bons-commande") {
    renderAchatsOrdersPage(state, activeSubpageKey);
  } else if (activeSubpageKey === "receptions") {
    renderAchatsReceptionsPage(state, activeSubpageKey);
  } else {
    renderAchatsHistoryPage(state, activeSubpageKey);
  }

  renderAchatsModal(activeSubpageKey, state);
  attachAchatsPageHandlers(activeSubpageKey, state);
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
      : pageKey === "interventions"
        ? "di"
        : pageKey === "achats"
          ? achatsSubpages.defaultSubpage
          : sectionSubpages[pageKey]
            ? sectionSubpages[pageKey].defaultSubpage
            : "";
  const activeSubpageKey = subpageKey || defaultSubpage;
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageKey);
  });

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText(page.title);
  if (pageSubtitleEl)
    pageSubtitleEl.textContent = localizeAdministrationText(page.subtitle);

  applyLocalizedShell();

  if (pageContentEl) {
    if (pageKey === "dashboard") {
      renderDashboardPage();
    } else if (pageKey === "profil") {
      renderProfilePage();
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
    } else if (pageKey === "planification") {
      renderPlanificationPageClean(activeSubpageKey);
    } else if (pageKey === "stock") {
      renderStockPage(activeSubpageKey);
    } else if (pageKey === "achats") {
      renderAchatsPage(activeSubpageKey);
    } else if (pageKey === "fournisseurs") {
      if (
        window._fournisseurs &&
        typeof window._fournisseurs.renderPage === "function"
      ) {
        window._fournisseurs.renderPage();
      }
    } else if (pageKey === "interventions") {
      renderInterventionsPage(activeSubpageKey);
    } else if (pageKey === "parametres") {
      renderAdministrationPage(activeSubpageKey);
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
          <p>${page.body || page.subtitle || "Contenu à développer plus tard."}</p>
          <span class="blank-note">On développera cette page étape par étape.</span>
        </div>
      `;
    }
  }

  if (
    overlayRootEl &&
    pageKey !== "organisation" &&
    pageKey !== "equipements" &&
    pageKey !== "organe" &&
    pageKey !== "achats"
  ) {
    overlayRootEl.innerHTML = "";
  }

  closeMenus();
  translateRenderedInterface(document);
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

// -----------------------
// Interventions module
// -----------------------
const interventionsStorageKey = "maintflow.interventions";

const interventionStatusOptions = [
  "En attente",
  "Validée",
  "Rejetée",
  "Transformée en OT",
];
const interventionUrgencyOptions = ["Faible", "Moyenne", "Haute", "Critique"];
const interventionMaintenanceTypes = [
  "Corrective",
  "Préventive",
  "Prédictive",
  "Réglementaire",
];
const interventionBtCauses = [
  "Usure normale",
  "Défaut de lubrification",
  "Surcharge",
  "Défaut matière",
  "Autre",
];

const interventionDefaultState = {
  dis: [],
  ots: [],
  bts: [],
};

function buildInterventionsSeedState() {
  const now = Date.now();
  const equipmentConvoyeur = getEquipmentRecord("equipments", "equipment-3");
  const equipmentPompe = getEquipmentRecord("equipments", "equipment-2");
  const equipmentTgbt = getEquipmentRecord("equipments", "equipment-1");
  const organRoulement = getOrganeRecord("organes", "organe-1");
  const organGarniture = getOrganeRecord("organes", "organe-2");
  const userMaintenance = getOrganizationUser("user-3");
  const userProduction = getOrganizationUser("user-2");
  const userQualite = getOrganizationUser("user-1");
  const userLogistique = getOrganizationUser("user-6");
  const articleHuile = getArticleRecord("articles", "article-1");
  const articleRoulement = getArticleRecord("articles", "article-2");

  return {
    dis: [],
    ots: [],
    bts: [],
    history: [],
  };
}

let interventionsModalState = null;
let interventionsHistoryFilterState = {
  equipment: "",
  technician: "",
  type: "",
  status: "",
  priority: "",
  from: "",
  to: "",
};

function loadInterventionsState() {
  try {
    const raw = window.localStorage.getItem(interventionsStorageKey);
    if (!raw) return buildInterventionsSeedState();
    const parsed = JSON.parse(raw);
    const normalized = {
      dis: Array.isArray(parsed.dis) ? parsed.dis : [],
      ots: Array.isArray(parsed.ots) ? parsed.ots : [],
      bts: Array.isArray(parsed.bts) ? parsed.bts : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };

    const seedState = buildInterventionsSeedState();
    const hasSeedData = seedState.dis.some((item) =>
      normalized.dis.some((record) => record.ref === item.ref),
    );

    const hasStoredInterventionsState = raw !== null;
    const isEmptyStoredState =
      hasStoredInterventionsState &&
      !normalized.dis.length &&
      !normalized.ots.length &&
      !normalized.bts.length &&
      !normalized.history.length;

    if (isEmptyStoredState) {
      return normalized;
    }

    if (!hasStoredInterventionsState) {
      try {
        window.localStorage.setItem(
          interventionsStorageKey,
          JSON.stringify(seedState),
        );
      } catch (error) { }
      return seedState;
    }

    if (!hasSeedData) {
      const mergedState = {
        dis: [...seedState.dis, ...normalized.dis],
        ots: [...seedState.ots, ...normalized.ots],
        bts: [...seedState.bts, ...normalized.bts],
        history: [...seedState.history, ...normalized.history],
      };

      try {
        window.localStorage.setItem(
          interventionsStorageKey,
          JSON.stringify(mergedState),
        );
      } catch (error) { }

      return mergedState;
    }

    return {
      dis: normalized.dis,
      ots: normalized.ots,
      bts: normalized.bts,
      history: normalized.history.length
        ? normalized.history
        : seedState.history,
    };
  } catch (e) {
    return buildInterventionsSeedState();
  }
}

function saveInterventionsState(state) {
  try {
    window.localStorage.setItem(interventionsStorageKey, JSON.stringify(state));
  } catch (e) {
    // Keep the UI usable if persistent storage is unavailable.
  }
}

function appendInterventionHistory(directory, entry) {
  const history = Array.isArray(directory.history) ? directory.history : [];
  history.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    action: entry.action || "Événement",
    recordType: entry.recordType || "",
    recordRef: entry.recordRef || "",
    message: entry.message || entry.action || "",
  });
  directory.history = history;
}

function setInterventionsModalState(state) {
  interventionsModalState = state;
}

function closeInterventionsModal() {
  setInterventionsModalState(null);
  renderInterventionsPage(getCurrentInterventionsTab());
}

function openInterventionsModal(mode, recordId = null, recordType = "di") {
  setInterventionsModalState({ mode, recordId, recordType });
  renderInterventionsPage(getCurrentInterventionsTab());
}

function openInterventionsDetails(recordType, recordId) {
  openInterventionsModal("details", recordId, recordType);
}

function buildInterventionDiFormModal(record = null) {
  const equipmentOptions = getEquipmentRecords("equipments")
    .map(
      (equipment) =>
        `<option value="${equipment.id}"${equipment.id === (record?.equipmentId || "") ? " selected" : ""}>${escapeHtml(equipment.code)} — ${escapeHtml(equipment.name)}</option>`,
    )
    .join("");
  const organeOptions = getOrganeRecords("organes")
    .map(
      (organe) =>
        `<option value="${organe.id}"${organe.id === (record?.organeId || "") ? " selected" : ""}>${escapeHtml(organe.code)} — ${escapeHtml(organe.name)}</option>`,
    )
    .join("");
  const requesterOptions = organizationUsers
    .map(
      (user) =>
        `<option value="${user.id}"${user.id === (record?.requesterId || "") ? " selected" : ""}>${escapeHtml(user.name)} — ${escapeHtml(user.role)}</option>`,
    )
    .join("");

  return `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-int-close="true"></div>
      <div class="org-modal-panel interventions-modal-panel" role="dialog" aria-modal="true" aria-labelledby="intFormTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Demande d'intervention</div>
            <h3 id="intFormTitle">${record ? `Modifier ${escapeHtml(record.ref || "DI")}` : "Nouvelle DI"}</h3>
            <p>Création et mise à jour d'une demande d'intervention.</p>
          </div>
          <button class="org-modal-close" type="button" data-int-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form class="org-form" data-int-di-form>
          <div class="org-form-grid">
            <div class="field-group field-group-wide">
              <label for="intDiTitle">Titre</label>
              <input id="intDiTitle" name="title" type="text" required value="${escapeHtml(record?.title || "")}" />
            </div>
            <div class="field-group field-group-wide">
              <label for="intDiDescription">Description</label>
              <textarea id="intDiDescription" name="description" rows="4" placeholder="Décrivez le besoin d'intervention...">${escapeTextarea(record?.description || "")}</textarea>
            </div>
            <div class="field-group">
              <label for="intDiEquipment">Équipement</label>
              <select id="intDiEquipment" name="equipmentId" required>
                <option value="">Sélectionner</option>
                ${equipmentOptions}
              </select>
            </div>
            <div class="field-group">
              <label for="intDiOrgane">Organe</label>
              <select id="intDiOrgane" name="organeId">
                <option value="">Aucun</option>
                ${organeOptions}
              </select>
            </div>
            <div class="field-group">
              <label for="intDiRequester">Demandeur</label>
              <select id="intDiRequester" name="requesterId">
                <option value="">Sélectionner</option>
                ${requesterOptions}
              </select>
            </div>
            <div class="field-group">
              <label for="intDiType">Type</label>
              <select id="intDiType" name="requestType">
                <option${record?.requestType === "Panne" ? " selected" : ""}>Panne</option>
                <option${record?.requestType === "Anomalie" ? " selected" : ""}>Anomalie</option>
                <option${record?.requestType === "Préventif" ? " selected" : ""}>Préventif</option>
              </select>
            </div>
            <div class="field-group">
              <label for="intDiUrgency">Urgence</label>
              <select id="intDiUrgency" name="urgency">
                ${interventionUrgencyOptions
      .map(
        (option) =>
          `<option${option === (record?.urgency || "Moyenne") ? " selected" : ""}>${option}</option>`,
      )
      .join("")}
              </select>
            </div>
            <div class="field-group field-group-wide">
              <label for="intDiLocation">Localisation</label>
              <input id="intDiLocation" name="location" type="text" value="${escapeHtml(record?.location || "")}" placeholder="Zone, atelier, ligne..." />
            </div>
          </div>
          <div class="org-modal-actions">
            <button class="btn btn-outline" type="button" data-int-close="true">Annuler</button>
            <button class="btn btn-primary" type="submit">${record ? "Enregistrer" : "Créer la DI"}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderInterventionsModal() {
  if (!overlayRootEl || !interventionsModalState) return;

  const mode = interventionsModalState.mode || "create-di";
  const recordType = interventionsModalState.recordType || "di";
  const recordId = interventionsModalState.recordId || null;

  if (mode === "details") {
    const record = getInterventionRecord(recordType, recordId);
    if (!record) {
      closeInterventionsModal();
      return;
    }
    overlayRootEl.innerHTML = renderInterventionRecordDetails(
      recordType,
      record,
    );
    return;
  }

  if (mode === "confirm-create-bt") {
    const ot = getInterventionOt(recordId);
    if (!ot) {
      closeInterventionsModal();
      return;
    }
    overlayRootEl.innerHTML = buildInterventionTransformBtModal(ot);
    return;
  }

  if (mode === "transform-to-ot") {
    const diRecord = getInterventionDi(recordId);
    if (!diRecord) {
      closeInterventionsModal();
      return;
    }
    overlayRootEl.innerHTML = buildInterventionTransformOtModal(diRecord);
    return;
  }

  const diRecord = recordId ? getInterventionDi(recordId) : null;
  overlayRootEl.innerHTML = buildInterventionDiFormModal(diRecord);
}

function bindInterventionsModalHandlers() {
  if (!overlayRootEl) return;

  overlayRootEl
    .querySelectorAll("[data-int-close='true']")
    .forEach((button) => {
      button.addEventListener("click", function () {
        closeInterventionsModal();
      });
    });

  overlayRootEl
    .querySelector("[data-int-print-details='true']")
    ?.addEventListener("click", function () {
      openInterventionsPrintCurrentDetails();
    });

  overlayRootEl.querySelectorAll("[data-int-action]").forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.intAction || "";
      const recordId = this.dataset.intId || "";

      if (action === "validate-di") {
        validateInterventionDi(recordId);
        return;
      }

      if (action === "transform-di") {
        convertDiToOt(recordId);
        return;
      }

      if (action === "confirm-create-bt") {
        createBtFromOt(recordId);
        return;
      }
    });
  });

  const diForm = overlayRootEl.querySelector("[data-int-di-form]");
  if (diForm) {
    diForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(diForm);
      const directory = loadInterventionsState();
      const nowIso = new Date().toISOString();
      const existing = interventionsModalState?.recordId
        ? directory.dis.find(
          (item) => item.id === interventionsModalState.recordId,
        )
        : null;

      const equipmentId = String(formData.get("equipmentId") || "");
      const organeId = String(formData.get("organeId") || "");
      const requesterId = String(formData.get("requesterId") || "");
      const equipment = equipmentId
        ? getEquipmentRecord("equipments", equipmentId)
        : null;
      const organ = organeId ? getOrganeRecord("organes", organeId) : null;
      const requester = requesterId ? getOrganizationUser(requesterId) : null;

      const nextRecord = {
        ...(existing || {}),
        id: existing?.id || `di-${Date.now()}`,
        ref: existing?.ref || buildInterventionRef("DI", directory.dis),
        createdAt: existing?.createdAt || nowIso,
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        equipmentId,
        equipmentLabel: equipment
          ? `${equipment.code} — ${equipment.name}`
          : "",
        organeId,
        organeLabel: organ ? `${organ.code} — ${organ.name}` : "",
        requesterId,
        requesterLabel: requester ? requester.name : "",
        requestType: String(formData.get("requestType") || "Panne"),
        urgency: String(formData.get("urgency") || "Moyenne"),
        location: String(formData.get("location") || "").trim(),
        status: existing?.status || "En attente",
        documents: Array.isArray(existing?.documents) ? existing.documents : [],
      };

      if (existing) {
        const index = directory.dis.findIndex(
          (item) => item.id === existing.id,
        );
        if (index >= 0) directory.dis[index] = nextRecord;
      } else {
        directory.dis.unshift(nextRecord);
      }

      saveInterventionsState(directory);
      closeInterventionsModal();
    });
  }

  const otAddArticleBtn = overlayRootEl.querySelector("#otAddArticleBtn");
  if (otAddArticleBtn) {
    otAddArticleBtn.addEventListener("click", () => {
      const container = overlayRootEl.querySelector("#otArticleLinesContainer");
      const line = document.createElement("div");
      line.style.display = "flex";
      line.style.gap = "0.5rem";
      line.style.marginBottom = "0.5rem";
      line.innerHTML = `
        <select name="articleIds[]" style="flex:1;" required>
          <option value="">Sélectionner un article</option>
          ${otAddArticleBtn.dataset.options}
        </select>
        <input type="number" name="articleQtys[]" min="1" value="1" required style="width:80px;" />
        <button type="button" class="org-icon-btn danger" onclick="this.parentElement.remove()" title="Supprimer">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      container.appendChild(line);
    });
  }

  const transformOtForm = overlayRootEl.querySelector(
    "[data-int-transform-ot-form]",
  );
  if (transformOtForm) {
    transformOtForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(transformOtForm);
      const diId = transformOtForm.dataset.diId;

      const directory = loadInterventionsState();
      const diIndex = directory.dis.findIndex((item) => item.id === diId);
      const di = diIndex >= 0 ? directory.dis[diIndex] : null;
      if (!di) {
        window.alert("DI introuvable.");
        return;
      }

      const plannedDate = formData.get("plannedDate");
      if (!plannedDate) {
        window.alert("La date planifiée est obligatoire.");
        return;
      }

      const articleIds = formData.getAll("articleIds[]");
      const articleQtys = formData.getAll("articleQtys[]");
      const articles = articleIds
        .map((id, index) => ({
          articleId: id,
          qty: Number(articleQtys[index]) || 1,
        }))
        .filter((a) => a.articleId);

      const technicianId = formData.get("technicianId");
      const technicianLabel = technicianId
        ? getOrganizationUser(technicianId)?.name || ""
        : "";

      const ot = {
        id: `ot-${Date.now()}`,
        ref: buildInterventionRef("OT", directory.ots),
        diId: di.id,
        diRef: di.ref,
        createdAt: new Date().toISOString(),
        plannedDate: plannedDate,
        durationEstimated: Number(formData.get("durationEstimated")) || null,
        typeMaintenance: formData.get("typeMaintenance"),
        equipmentId: di.equipmentId || "",
        equipmentLabel: di.equipmentLabel || di.equipment || "",
        organeId: di.organeId || "",
        organeLabel: di.organeLabel || di.organe || "",
        technicianIds: technicianId ? [technicianId] : [],
        technicianLabel: technicianLabel,
        priority: formData.get("priority"),
        instructions: formData.get("instructions") || "",
        safetyChecklist: formData.getAll("safetyChecklist"),
        articles: articles,
        documents: [],
        status: "Planifié",
      };

      directory.dis.splice(diIndex, 1);
      directory.ots.unshift(ot);
      appendInterventionHistory(directory, {
        action: "DI transformée en OT",
        recordType: "DI",
        recordRef: di.ref,
        message: `${di.ref} transformée en ${ot.ref}`,
      });
      saveInterventionsState(directory);
      closeInterventionsModal();

      showInterventionsToast("OT créé avec succès", "success");

      renderInterventionsPage("ot");
    });
  }

  const btAddArticleBtn = overlayRootEl.querySelector("#btAddArticleBtn");
  if (btAddArticleBtn) {
    btAddArticleBtn.addEventListener("click", () => {
      const container = overlayRootEl.querySelector("#btArticleLinesContainer");
      const line = document.createElement("div");
      line.className = "bt-article-line";
      line.style.display = "flex";
      line.style.gap = "0.5rem";
      line.style.marginBottom = "0.5rem";
      line.innerHTML = `
        <select name="articleIds[]" style="flex:1;" required class="bt-article-select">
          <option value="" data-pmp="0">Sélectionner un article</option>
          ${btAddArticleBtn.dataset.options}
        </select>
        <input type="number" name="articleQtys[]" min="1" value="1" required style="width:80px;" class="bt-article-qty" />
        <button type="button" class="org-icon-btn danger" onclick="this.parentElement.remove(); window.dispatchEvent(new Event('bt-cost-update'));" title="Supprimer">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      container.appendChild(line);

      const select = line.querySelector(".bt-article-select");
      const qty = line.querySelector(".bt-article-qty");
      select.addEventListener("change", () =>
        window.dispatchEvent(new Event("bt-cost-update")),
      );
      qty.addEventListener("input", () =>
        window.dispatchEvent(new Event("bt-cost-update")),
      );
    });
  }

  const btEndDate = overlayRootEl.querySelector("#btEndDate");
  const btStartDate = overlayRootEl.querySelector("#btStartDate");
  const btDurationReal = overlayRootEl.querySelector("#btDurationReal");

  if (btEndDate && btStartDate && btDurationReal) {
    btEndDate.addEventListener("change", () => {
      const start = new Date(btStartDate.value);
      const end = new Date(btEndDate.value);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const hours = Math.round(((end - start) / 3600000) * 10) / 10;
        btDurationReal.value = hours + "h";
      } else {
        btDurationReal.value = "0h";
      }
    });
  }

  window.addEventListener("bt-cost-update", () => {
    const costArticlesEl = overlayRootEl.querySelector("#btCostArticles");
    const costTotalEl = overlayRootEl.querySelector("#btCostTotal");
    if (!costArticlesEl || !costTotalEl) return;

    let totalArticles = 0;
    const lines = overlayRootEl.querySelectorAll(".bt-article-line");
    lines.forEach((line) => {
      const select = line.querySelector(".bt-article-select");
      const qty = line.querySelector(".bt-article-qty");
      const opt = select.options[select.selectedIndex];
      if (opt && opt.value) {
        const pmp = Number(opt.dataset.pmp) || 0;
        const q = Number(qty.value) || 0;
        totalArticles += pmp * q;
      }
    });

    const formattedCost = new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(totalArticles);
    costArticlesEl.textContent = formattedCost;
    costTotalEl.textContent = formattedCost;
  });

  const transformBtForm = overlayRootEl.querySelector(
    "[data-int-transform-bt-form]",
  );
  if (transformBtForm) {
    transformBtForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(transformBtForm);
      const otId = transformBtForm.dataset.otId;

      const directory = loadInterventionsState();
      const otIndex = directory.ots.findIndex((item) => item.id === otId);
      const ot = otIndex >= 0 ? directory.ots[otIndex] : null;
      if (!ot) {
        window.alert("OT introuvable.");
        return;
      }

      const works = formData.get("works");
      if (!works) {
        window.alert("Les travaux réalisés sont obligatoires.");
        return;
      }

      const start = new Date(formData.get("startDate"));
      const end = new Date(formData.get("endDate"));
      let durationHours = "0h";
      if (!isNaN(start) && !isNaN(end) && end > start) {
        durationHours = Math.round(((end - start) / 3600000) * 10) / 10 + "h";
      }

      const articleIds = formData.getAll("articleIds[]");
      const articleQtys = formData.getAll("articleQtys[]");
      const articles = articleIds
        .map((id, index) => ({
          articleId: id,
          qty: Number(articleQtys[index]) || 1,
        }))
        .filter((a) => a.articleId);

      const cause = formData.get("cause");
      const causes = cause ? [cause] : [];

      const bt = {
        id: `bt-${Date.now()}`,
        ref: buildInterventionRef("BT", directory.bts),
        otId: ot.id,
        otRef: ot.ref,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        duration: durationHours,
        works: works,
        articles: articles,
        observations: formData.get("observations") || "",
        causes: causes,
        anomalies: formData.get("anomalies") || "",
        photos: [],
        technicianSignature: null,
        managerSignature: null,
        status: "En cours",
        equipmentId: ot.equipmentId || "",
        equipmentLabel: ot.equipmentLabel || "",
        technicianIds: Array.isArray(ot.technicianIds)
          ? ot.technicianIds.slice()
          : [],
        technicianLabel: ot.technicianLabel || "",
        priority: ot.priority || "",
      };

      articles.forEach((articleLine) => {
        const primary = getPrimaryStockRecord(articleLine.articleId);
        if (!primary) return;

        const quantity = Number(articleLine.qty) || 0;
        const nextQuantity = Math.max(
          0,
          Number(primary.currentQuantity || 0) - quantity,
        );
        upsertStockRecord(articleLine.articleId, primary, {
          currentQuantity: nextQuantity,
          updatedAt: new Date().toISOString(),
        });
        appendStockMovement({
          articleId: articleLine.articleId,
          quantity,
          type: "exit",
          source: "BT",
          linkedRef: bt.ref,
          pmp: primary.pmp || 0,
          location: primary.locationLabel,
        });
        syncStockArticleQuantityFromRecords(articleLine.articleId);
      });

      directory.ots.splice(otIndex, 1);
      directory.bts.unshift(bt);
      appendInterventionHistory(directory, {
        action: "OT transformé en BT",
        recordType: "OT",
        recordRef: ot.ref,
        message: `${ot.ref} transformé en ${bt.ref}`,
      });
      saveInterventionsState(directory);
      closeInterventionsModal();

      showInterventionsToast("BT créé avec succès", "success");

      renderInterventionsPage("bt");
    });
  }
}

function buildInterventionPrintDetails(recordType, record) {
  const equipment = record.equipmentId
    ? getEquipmentRecord("equipments", record.equipmentId)
    : null;
  const organ = record.organeId
    ? getOrganeRecord("organes", record.organeId)
    : null;
  const requester = record.requesterId
    ? getOrganizationUser(record.requesterId)
    : null;
  const technicians = (record.technicianIds || [])
    .map((id) => getOrganizationUser(id))
    .filter(Boolean)
    .map((user) => user.name)
    .join(", ");

  const sharedRows = [
    { label: "Référence", value: record.ref || "-" },
    { label: "Statut", value: record.status || "-" },
    {
      label: "Équipement",
      value: equipment
        ? `${equipment.code} — ${equipment.name}`
        : record.equipmentLabel || "-",
    },
    {
      label: "Organe",
      value: organ
        ? `${organ.code} — ${organ.name}`
        : record.organeLabel || "-",
    },
  ];

  if (recordType === "di") {
    sharedRows.push(
      {
        label: "Demandeur",
        value: requester ? requester.name : record.requesterLabel || "-",
      },
      { label: "Type", value: record.requestType || "-" },
      { label: "Urgence", value: record.urgency || "-" },
      { label: "Localisation", value: record.location || "-" },
      { label: "Créée le", value: formatInterventionDate(record.createdAt) },
    );
  }

  if (recordType === "ot") {
    sharedRows.push(
      { label: "DI liée", value: record.diRef || "-" },
      { label: "Type maintenance", value: record.typeMaintenance || "-" },
      { label: "Priorité", value: record.priority || "-" },
      {
        label: "Technicien(s)",
        value: technicians || record.technicianLabel || "-",
      },
      { label: "Date planifiée", value: record.plannedDate || "-" },
      {
        label: "Durée estimée",
        value: record.durationEstimated ? `${record.durationEstimated} h` : "-",
      },
    );
  }

  if (recordType === "bt") {
    sharedRows.push(
      {
        label: "OT lié",
        value: record.otRef || getInterventionOt(record.otId)?.ref || "-",
      },
      { label: "Début", value: formatInterventionDate(record.startDate) },
      { label: "Fin", value: formatInterventionDate(record.endDate) },
      { label: "Durée réelle", value: record.duration || "-" },
      { label: "Travaux réalisés", value: record.works || "-" },
      { label: "Observations", value: record.observations || "-" },
    );
  }

  return sharedRows;
}

function buildInterventionPrintArticles(record) {
  if (!Array.isArray(record.articles) || !record.articles.length) {
    return `
      <div class="intervention-print-empty">
        Aucun article renseigné pour ce document.
      </div>
    `;
  }

  const rows = record.articles
    .map((articleLine, index) => {
      const article = getArticleRecord("articles", articleLine.articleId);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${article ? `${article.code} — ${article.name}` : articleLine.articleId || "Article"}</td>
          <td>${articleLine.qty || 0}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="intervention-print-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Article</th>
          <th>Qté</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildInterventionPrintSignatures(recordType, record) {
  const requester = record.requesterId
    ? getOrganizationUser(record.requesterId)
    : null;
  const technicians = (record.technicianIds || [])
    .map((id) => getOrganizationUser(id))
    .filter(Boolean)
    .map((user) => user.name)
    .join(", ");
  const btTechnician =
    record.technicianSignature?.name || technicians || "Nom du technicien";
  const btManager = record.managerSignature?.name || "Nom du responsable";

  const firstLabel =
    recordType === "di"
      ? "Demandeur"
      : recordType === "ot"
        ? "Technicien"
        : "Technicien";
  const firstName =
    recordType === "di"
      ? requester?.name || record.requesterLabel || "Nom du demandeur"
      : recordType === "ot"
        ? technicians || record.technicianLabel || "Nom du technicien"
        : btTechnician;

  const secondLabel =
    recordType === "di" ? "Responsable validation" : "Responsable / Validation";
  const secondName =
    recordType === "bt"
      ? `${btManager}${record.managerSignature?.signedAt ? ` · ${formatInterventionDate(record.managerSignature.signedAt)}` : ""}`
      : "Nom du responsable";

  return `
    <div class="intervention-print-signatures">
      <div class="intervention-print-signature">
        <strong>${firstLabel}</strong>
        <span>${firstName}</span>
        <div class="intervention-print-signature-line"></div>
        <small>Nom et signature</small>
      </div>
      <div class="intervention-print-signature">
        <strong>${secondLabel}</strong>
        <span>${secondName}</span>
        <div class="intervention-print-signature-line"></div>
        <small>Nom et signature</small>
      </div>
    </div>
  `;
}

function renderInterventionPrintDocument(recordType, record, enterprise) {
  const documentTitle =
    recordType === "di"
      ? "FICHE TECHNIQUE DI"
      : recordType === "ot"
        ? "FICHE TECHNIQUE OT"
        : "FICHE TECHNIQUE BT";
  const documentTypeLabel =
    recordType === "di"
      ? "Demande d'intervention"
      : recordType === "ot"
        ? "Ordre de travail"
        : "Bon de travail";
  const printDate = new Date().toLocaleString(getAdministrationLocale());
  const enterpriseLocation = [
    enterprise.wilaya,
    enterprise.daira,
    enterprise.commune,
  ]
    .filter(Boolean)
    .join(" • ");
  const enterprisePhone = enterprise.phone
    ? `Téléphone : ${enterprise.phone}`
    : "";
  const enterpriseCode = enterprise.code ? `Code : ${enterprise.code}` : "";
  const companyInitials = (enterprise.name || enterprise.code || "MF")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const detailRows = buildInterventionPrintDetails(recordType, record)
    .map(
      (row) => `
        <div class="intervention-print-item">
          <span>${row.label}</span>
          <strong>${row.value}</strong>
        </div>
      `,
    )
    .join("");
  const linkedEquipment = record.equipmentId
    ? getEquipmentRecord("equipments", record.equipmentId)
    : null;
  const linkedOrgan = record.organeId
    ? getOrganeRecord("organes", record.organeId)
    : null;
  const contextText =
    record.description ||
    record.instructions ||
    record.works ||
    "Aucun descriptif saisi.";
  const progressText =
    recordType === "bt" && record.observations
      ? record.observations
      : recordType === "ot"
        ? record.instructions || "Document de planification et d'exécution."
        : "Document de demande à instruire.";
  const logoMarkup = enterprise.logo
    ? `<img src="${escapeHtml(enterprise.logo)}" alt="Logo de l'entreprise" />`
    : `<span>${escapeHtml(companyInitials || "MF")}</span>`;

  return `
    <div class="intervention-print-document">
      <header class="intervention-print-header">
        <div class="intervention-print-brand">
          <div class="intervention-print-logo">${logoMarkup}</div>
          <div class="intervention-print-company">
            <div class="intervention-print-kicker">Document technique interne</div>
            <h1>${escapeHtml(enterprise.name || "Entreprise")}</h1>
            <p>${escapeHtml(enterpriseLocation || "Adresse non renseignée")}</p>
            <div class="intervention-print-company-lines">
              ${enterpriseCode ? `<span>${escapeHtml(enterpriseCode)}</span>` : ""}
              ${enterprisePhone ? `<span>${escapeHtml(enterprisePhone)}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="intervention-print-meta">
          <div class="intervention-print-meta-title">${documentTitle}</div>
          <div class="intervention-print-meta-grid">
            <div><span>Référence</span><strong>${escapeHtml(record.ref || "-")}</strong></div>
            <div><span>Type</span><strong>${escapeHtml(documentTypeLabel)}</strong></div>
            <div><span>Statut</span><strong>${escapeHtml(record.status || "-")}</strong></div>
            <div><span>Date impression</span><strong>${escapeHtml(printDate)}</strong></div>
          </div>
        </div>
      </header>

      <section class="intervention-print-section">
        <div class="intervention-print-section-head">
          <h2>Informations de l'intervention</h2>
          <span>${escapeHtml(recordType.toUpperCase())}</span>
        </div>
        <div class="intervention-print-grid">${detailRows}</div>
      </section>

      <section class="intervention-print-section">
        <div class="intervention-print-section-head">
          <h2>Référentiel technique</h2>
          <span>Parc et traçabilité</span>
        </div>
        <div class="intervention-print-reference-grid">
          <div class="intervention-print-reference-card">
            <span>Équipement</span>
            <strong>${escapeHtml(linkedEquipment ? `${linkedEquipment.code} — ${linkedEquipment.name}` : record.equipmentLabel || "-")}</strong>
          </div>
          <div class="intervention-print-reference-card">
            <span>Organe</span>
            <strong>${escapeHtml(linkedOrgan ? `${linkedOrgan.code} — ${linkedOrgan.name}` : record.organeLabel || "-")}</strong>
          </div>
          <div class="intervention-print-reference-card">
            <span>Responsable / Technicien</span>
            <strong>${escapeHtml(recordType === "di" ? record.requesterLabel || "-" : record.technicianLabel || recordType === "bt" ? record.technicianSignature?.name || "-" : "-")}</strong>
          </div>
        </div>
      </section>

      <section class="intervention-print-section">
        <div class="intervention-print-section-head">
          <h2>Contexte et observations</h2>
          <span>Résumé métier</span>
        </div>
        <div class="intervention-print-notes">
          <strong>Résumé</strong>
          <p>${escapeHtml(contextText)}</p>
        </div>
        <div class="intervention-print-notes intervention-print-notes--muted">
          <strong>Compléments</strong>
          <p>${escapeHtml(progressText)}</p>
        </div>
      </section>

      <section class="intervention-print-section">
        <div class="intervention-print-section-head">
          <h2>Consommation de pièces</h2>
          <span>Articles liés</span>
        </div>
        ${buildInterventionPrintArticles(record)}
      </section>

      <section class="intervention-print-section">
        <div class="intervention-print-section-head">
          <h2>Signatures</h2>
          <span>Validation documentaire</span>
        </div>
        ${buildInterventionPrintSignatures(recordType, record)}
      </section>

      <footer class="intervention-print-footer">
        <div>
          <strong>${escapeHtml(enterprise.name || "Entreprise")}</strong>
          <span>${escapeHtml(enterpriseLocation || "Adresse non renseignée")}</span>
        </div>
        <div>
          <strong>${escapeHtml(enterprise.code || "Code non défini")}</strong>
          <span>${escapeHtml(printDate)}</span>
        </div>
      </footer>
    </div>
  `;
}

function openInterventionsPrintCurrentDetails() {
  if (!interventionsModalState) return;

  const recordType = interventionsModalState.recordType || "di";
  const record = getInterventionRecord(
    recordType,
    interventionsModalState.recordId,
  );
  if (!record) return;

  const enterprise = getEnterpriseProfile();
  const popup = window.open("", "_blank", "width=1100,height=1400");
  if (!popup) {
    window.alert("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  const stylesHref = new URL("style.css", window.location.href).href;
  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(record.ref || "Impression intervention")}</title>
        <link rel="stylesheet" href="${stylesHref}" />
      </head>
      <body class="intervention-print-body">
        ${renderInterventionPrintDocument(recordType, record, enterprise)}
      </body>
    </html>
  `);
  popup.document.close();
  popup.onload = function () {
    popup.focus();
    popup.print();
  };
  popup.onafterprint = function () {
    popup.close();
  };
}

function openInterventionsDeleteConfirm(recordType, recordId) {
  const directory = loadInterventionsState();
  const source = getInterventionRecord(recordType, recordId);
  if (!source) return;

  const confirmed = window.confirm(
    `Supprimer ${source.ref} ? Cette action est irréversible.`,
  );
  if (!confirmed) return;

  if (recordType === "di") {
    directory.dis = directory.dis.filter((item) => item.id !== recordId);
    directory.ots = directory.ots.filter((item) => item.diId !== recordId);
    directory.bts = directory.bts.filter((item) => {
      const ot = directory.ots.find((order) => order.id === item.otId);
      return !ot || ot.diId !== recordId;
    });
  } else if (recordType === "ot") {
    directory.ots = directory.ots.filter((item) => item.id !== recordId);
    directory.bts = directory.bts.filter((item) => item.otId !== recordId);
    directory.dis = directory.dis.map((item) =>
      item.id === source.diId ? { ...item, status: "Validée" } : item,
    );
  } else if (recordType === "bt") {
    directory.bts = directory.bts.filter((item) => item.id !== recordId);
  }

  saveInterventionsState(directory);
  renderInterventionsPage(getCurrentInterventionsTab());
}

function getCurrentInterventionsTab(fallback = "di") {
  const hash = window.location.hash.replace("#", "").trim();
  if (!hash.startsWith("interventions")) return fallback;
  const parts = hash.split("/");
  return parts[1] || fallback;
}

function buildInterventionRef(prefix, items) {
  const maxNumber = items.reduce((max, item) => {
    const match = String(item.ref || "").match(
      new RegExp(`^${prefix}-(\\d+)$`),
    );
    const value = match ? Number(match[1]) : 0;
    return value > max ? value : max;
  }, 0);

  return `${prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
}

function getInterventionDirectory() {
  return loadInterventionsState();
}

function getInterventionDi(recordId) {
  return (
    getInterventionDirectory().dis.find((item) => item.id === recordId) || null
  );
}

function getInterventionOt(recordId) {
  return (
    getInterventionDirectory().ots.find((item) => item.id === recordId) || null
  );
}

function getInterventionBt(recordId) {
  return (
    getInterventionDirectory().bts.find((item) => item.id === recordId) || null
  );
}

function getInterventionRecord(recordType, recordId) {
  if (recordType === "ot") return getInterventionOt(recordId);
  if (recordType === "bt") return getInterventionBt(recordId);
  return getInterventionDi(recordId);
}

function buildInterventionsTabs(activeTabKey) {
  const tabs = {
    di: "Demande d'intervention (DI)",
    ot: "Ordre de travail (OT)",
    bt: "Bon de travail (BT)",
    history: "Historique",
  };

  return `
    <div class="org-tabs" role="tablist" aria-label="Sous-pages interventions">
      ${Object.entries(tabs)
      .map(
        ([key, label]) => `
            <button class="org-tab ${key === activeTabKey ? "active" : ""}" type="button" data-int-subpage="${key}">
              ${label}
            </button>
          `,
      )
      .join("")}
    </div>
  `;
}

function attachInterventionsTabHandlers(selector) {
  if (!pageContentEl) return;

  pageContentEl.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", function () {
      const nextTab = this.dataset.intSubpage || "di";
      renderPage("interventions", nextTab);
      window.location.hash = `interventions/${nextTab}`;
    });
  });
}

function renderInterventionsActionButtons(activeTabKey) {
  if (!pageActionsEl) return;

  if (activeTabKey === "ot" || activeTabKey === "bt") {
    pageActionsEl.innerHTML = "";
    return;
  }

  const primaryLabel = activeTabKey === "di" ? "Nouvelle DI" : "Exporter";

  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-int-action="primary">
      <i class="fa-solid fa-plus"></i>
      <span>${primaryLabel}</span>
    </button>
  `;

  const button = pageActionsEl.querySelector("[data-int-action='primary']");
  if (!button) return;

  button.addEventListener("click", function () {
    if (activeTabKey === "di") {
      openInterventionsModal("create-di");
      return;
    }

    window.alert("L'export Excel / PDF sera branché sur le module Historique.");
  });
}

function renderInterventionsPage(activeTabKey = "di") {
  const tabKey = ["di", "ot", "bt", "history"].includes(activeTabKey)
    ? activeTabKey
    : "di";
  const directory = getInterventionDirectory();

  if (pageTitleEl)
    pageTitleEl.textContent = localizeAdministrationText("Interventions");
  if (pageSubtitleEl) {
    pageSubtitleEl.textContent =
      tabKey === "history"
        ? "Consultation, export et traçabilité des interventions"
        : "Cycle complet DI, OT et BT avec suivi terrain";
  }

  renderInterventionsActionButtons(tabKey);

  if (!pageContentEl) return;

  const sectionMeta = {
    di: {
      kicker: "Demande d'intervention",
      title: "Demandes d'intervention (DI)",
      subtitle:
        "Création, validation et transformation en OT avec équipements, organes et demandeur liés au référentiel.",
      pills: [
        `${directory.dis.length} DI`,
        `${directory.dis.filter((item) => item.status === "En attente").length} en attente`,
      ],
    },
    ot: {
      kicker: "Ordre de travail",
      title: "Ordres de travail (OT)",
      subtitle:
        "Planification, assignation technicien et suivi de l'exécution jusqu'à la clôture.",
      pills: [
        `${directory.ots.length} OT`,
        `${directory.ots.filter((item) => item.status === "Planifié").length} planifiés`,
      ],
    },
    bt: {
      kicker: "Bon de travail",
      title: "Bons de travail (BT)",
      subtitle:
        "Saisie terrain, articles consommés, signatures et validation finale.",
      pills: [
        `${directory.bts.length} BT`,
        `${directory.bts.filter((item) => item.status === "Clôturé").length} clôturés`,
      ],
    },
    history: {
      kicker: "Historique",
      title: "Historique des interventions",
      subtitle:
        "Vue consolidée des DI, OT et BT avec filtres et export Excel / PDF.",
      pills: [
        `${directory.dis.length + directory.ots.length + directory.bts.length} événements`,
        `${directory.bts.filter((item) => item.status === "Validé").length} BT validés`,
      ],
    },
  };

  const meta = sectionMeta[tabKey];

  pageContentEl.className =
    "organization-page organization-crud-page interventions-page";
  pageContentEl.innerHTML = `
    ${buildInterventionsTabs(tabKey)}

    <div class="org-section-intro">
      <div>
        <div class="org-section-kicker">${meta.kicker}</div>
        <h2>${meta.title}</h2>
        <p>${meta.subtitle}</p>
      </div>
      <div class="org-section-pills">
        ${meta.pills.map((pill) => `<span class="status-badge badge-info">${pill}</span>`).join("")}
      </div>
    </div>

    ${renderInterventionsKpis(tabKey, directory)}

    ${renderInterventionsTabContent(tabKey, directory)}
  `;

  attachInterventionsTabHandlers("[data-int-subpage]");

  if (interventionsModalState) {
    renderInterventionsModal();
    bindInterventionsModalHandlers();
  } else if (overlayRootEl) {
    overlayRootEl.innerHTML = "";
  }

  attachInterventionsPageHandlers(tabKey);
}

function attachInterventionsPageHandlers(activeTabKey) {
  if (
    !pageContentEl ||
    pageContentEl.dataset.interventionsHandlersBound === "true"
  ) {
    return;
  }

  pageContentEl.dataset.interventionsHandlersBound = "true";
  pageContentEl.addEventListener("click", function (event) {
    const actionButton = event.target.closest("[data-int-action]");
    if (actionButton && pageContentEl.contains(actionButton)) {
      const action = actionButton.dataset.intAction || "";
      const recordId = actionButton.dataset.intId || "";

      if (action.startsWith("details-")) {
        openInterventionsDetails(action.replace("details-", ""), recordId);
        return;
      }

      if (action.startsWith("delete-")) {
        openInterventionsDeleteConfirm(action.replace("delete-", ""), recordId);
        return;
      }

      if (action === "to-ot") {
        convertDiToOt(recordId);
        return;
      }

      if (action === "create-bt") {
        setInterventionsModalState({
          mode: "confirm-create-bt",
          recordId,
          recordType: "ot",
        });
        renderInterventionsPage(getCurrentInterventionsTab("ot"));
        return;
      }

      if (action === "close-bt") {
        closeBt(recordId);
        return;
      }

      if (action === "edit-di") {
        openInterventionsModal("create-di", recordId);
        return;
      }
    }

    const exportButton = event.target.closest("[data-int-export]");
    if (exportButton && pageContentEl.contains(exportButton)) {
      window.alert(
        `Export ${exportButton.dataset.intExport.toUpperCase()} à brancher sur le module Historique.`,
      );
      return;
    }

    const clearHistoryButton = event.target.closest("[data-int-history-clear]");
    if (clearHistoryButton && pageContentEl.contains(clearHistoryButton)) {
      const confirmed = window.confirm(
        "Effacer tout l'historique des interventions et réinitialiser l'état ?",
      );
      if (!confirmed) return;

      const directory = loadInterventionsState();
      directory.dis = [];
      directory.ots = [];
      directory.bts = [];
      directory.history = [];
      saveInterventionsState(directory);
      interventionsHistoryFilterState = {
        equipment: "",
        technician: "",
        type: "",
        status: "",
        priority: "",
        from: "",
        to: "",
      };
      renderInterventionsPage("history");
      return;
    }
  });

  pageContentEl.addEventListener("change", function (event) {
    const filterElement = event.target.closest("[data-int-history-filter]");
    if (!filterElement || !pageContentEl.contains(filterElement)) {
      return;
    }

    const filterKey = filterElement.dataset.intHistoryFilter;
    if (!filterKey || !(filterKey in interventionsHistoryFilterState)) {
      return;
    }

    interventionsHistoryFilterState[filterKey] = filterElement.value || "";
    renderInterventionsPage("history");
  });
}

function renderInterventionsKpis(tabKey, directory) {
  const kpiSets = {
    di: [
      {
        label: "Total DI",
        value: String(directory.dis.length),
        footer: "Demandes enregistrées",
        icon: "fa-clipboard-list",
        iconClass: "blue",
      },
      {
        label: "En attente",
        value: String(
          directory.dis.filter((item) => item.status === "En attente").length,
        ),
        footer: "À valider",
        icon: "fa-hourglass-half",
        iconClass: "orange",
      },
      {
        label: "Validées",
        value: String(
          directory.dis.filter((item) => item.status === "Validée").length,
        ),
        footer: "Prêtes pour OT",
        icon: "fa-circle-check",
        iconClass: "green",
      },
      {
        label: "Transformées",
        value: String(
          directory.dis.filter((item) => item.status === "Transformée en OT")
            .length,
        ),
        footer: "OT créés",
        icon: "fa-arrow-right",
        iconClass: "red",
      },
    ],
    ot: [
      {
        label: "Total OT",
        value: String(directory.ots.length),
        footer: "Ordres enregistrés",
        icon: "fa-screwdriver-wrench",
        iconClass: "blue",
      },
      {
        label: "Planifiés",
        value: String(
          directory.ots.filter((item) => item.status === "Planifié").length,
        ),
        footer: "À démarrer",
        icon: "fa-calendar-check",
        iconClass: "orange",
      },
      {
        label: "En cours",
        value: String(
          directory.ots.filter((item) => item.status === "En cours").length,
        ),
        footer: "Sur le terrain",
        icon: "fa-gears",
        iconClass: "green",
      },
      {
        label: "Terminés",
        value: String(
          directory.ots.filter((item) => item.status === "Terminé").length,
        ),
        footer: "Clôturés",
        icon: "fa-circle-check",
        iconClass: "red",
      },
    ],
    bt: [
      {
        label: "Total BT",
        value: String(directory.bts.length),
        footer: "Bons saisis",
        icon: "fa-file-signature",
        iconClass: "blue",
      },
      {
        label: "En cours",
        value: String(
          directory.bts.filter((item) => item.status === "En cours").length,
        ),
        footer: "Terrain",
        icon: "fa-person-digging",
        iconClass: "orange",
      },
      {
        label: "Clôturés",
        value: String(
          directory.bts.filter((item) => item.status === "Clôturé").length,
        ),
        footer: "En attente de validation",
        icon: "fa-circle-check",
        iconClass: "green",
      },
      {
        label: "Validés",
        value: String(
          directory.bts.filter((item) => item.status === "Validé").length,
        ),
        footer: "Finalisés",
        icon: "fa-shield-check",
        iconClass: "red",
      },
    ],
    history: [
      {
        label: "Événements",
        value: String(
          directory.dis.length + directory.ots.length + directory.bts.length,
        ),
        footer: "Vue consolidée",
        icon: "fa-clock-rotate-left",
        iconClass: "blue",
      },
      {
        label: "DI",
        value: String(directory.dis.length),
        footer: "Demandes",
        icon: "fa-clipboard-list",
        iconClass: "orange",
      },
      {
        label: "OT",
        value: String(directory.ots.length),
        footer: "Ordres",
        icon: "fa-screwdriver-wrench",
        iconClass: "green",
      },
      {
        label: "BT",
        value: String(directory.bts.length),
        footer: "Bons",
        icon: "fa-file-signature",
        iconClass: "red",
      },
    ],
  };

  return `
    <div class="kpi-grid interventions-kpi-grid">
      ${kpiSets[tabKey]
      .map(
        (item) => `
            <div class="kpi-card">
              <div class="kpi-header">
                <div class="kpi-label">${item.label}</div>
                <div class="kpi-icon ${item.iconClass}"><i class="fa-solid ${item.icon}"></i></div>
              </div>
              <div class="kpi-value">${item.value}</div>
              <div class="kpi-footer">
                <span class="kpi-trend flat"><i class="fa-solid fa-minus"></i></span>
                <span>${item.footer}</span>
              </div>
            </div>
          `,
      )
      .join("")}
    </div>
  `;
}

function renderInterventionsTabContent(tabKey, directory) {
  if (tabKey === "di") {
    return renderDiSection(directory);
  }

  if (tabKey === "ot") {
    return renderOtSection(directory);
  }

  if (tabKey === "bt") {
    return renderBtSection(directory);
  }

  return renderHistorySection(directory);
}

function renderDiSection(directory) {
  const rows = directory.dis.length
    ? directory.dis
      .map((di) => {
        const equipment = di.equipmentId
          ? getEquipmentRecord("equipments", di.equipmentId)
          : null;
        const organ = di.organeId
          ? getOrganeRecord("organes", di.organeId)
          : null;
        const requester = getOrganizationUser(di.requesterId);

        return `
            <tr>
              <td><strong>${di.ref}</strong></td>
              <td>${escapeHtml(di.title)}</td>
              <td class="muted">${equipment ? `${equipment.code} — ${equipment.name}` : di.equipmentLabel || "-"}</td>
              <td class="muted">${organ ? `${organ.code} — ${organ.name}` : di.organeLabel || "-"}</td>
              <td class="muted">${requester ? `${requester.name}` : di.requesterLabel || "-"}</td>
              <td><span class="status-badge ${getInterventionBadgeClass(di.urgency)}">${di.urgency}</span></td>
              <td><span class="status-badge ${getInterventionStatusBadgeClass(di.status)}">${di.status}</span></td>
              <td>${buildInterventionDiActions(di)}</td>
            </tr>
          `;
      })
      .join("")
    : `
      <tr>
        <td colspan="8">
          ${buildInterventionEmptyState(
      "fa-clipboard-list",
      "Aucune DI enregistrée",
      "Créez la première demande d'intervention depuis le bouton Nouvelle DI.",
      "La fenêtre popup reprend le formulaire métier et les liens vers les autres modules.",
    )}
        </td>
      </tr>
    `;

  return `
    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-clipboard-list"></i> Liste des DI</div>
        <span class="status-badge badge-info">${directory.dis.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>Titre</th>
              <th>Équipement</th>
              <th>Organe</th>
              <th>Demandeur</th>
              <th>Urgence</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderOtSection(directory) {
  const rows = directory.ots.length
    ? directory.ots
      .map((ot) => {
        const equipment = ot.equipmentId
          ? getEquipmentRecord("equipments", ot.equipmentId)
          : null;
        const technicianNames = (ot.technicianIds || [])
          .map((id) => getOrganizationUser(id))
          .filter(Boolean)
          .map((user) => user.name)
          .join(", ");

        return `
            <tr>
              <td><strong>${ot.ref}</strong></td>
              <td class="muted">${ot.diRef || "-"}</td>
              <td class="muted">${equipment ? `${equipment.code} — ${equipment.name}` : ot.equipmentLabel || "-"}</td>
              <td>${ot.typeMaintenance || "-"}</td>
              <td class="muted">${ot.plannedDate || "-"}</td>
              <td class="muted">${technicianNames || ot.technicianLabel || "-"}</td>
              <td><span class="status-badge ${getInterventionStatusBadgeClass(ot.status)}">${ot.status}</span></td>
              <td>${buildInterventionOtActions(ot)}</td>
            </tr>
          `;
      })
      .join("")
    : `
      <tr>
        <td colspan="8">
          ${buildInterventionEmptyState(
      "fa-screwdriver-wrench",
      "Aucun OT planifié",
      "Les OT issus d'une DI validée apparaîtront ici.",
      "Le tableau gardera le même langage visuel que les pages Équipements et Organe.",
    )}
        </td>
      </tr>
    `;

  return `
    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-screwdriver-wrench"></i> Liste des OT</div>
        <span class="status-badge badge-info">${directory.ots.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>DI liée</th>
              <th>Équipement</th>
              <th>Type</th>
              <th>Date planifiée</th>
              <th>Technicien(s)</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBtSection(directory) {
  const visibleBts = directory.bts.filter((item) => item.status !== "Clôturé");
  const rows = visibleBts.length
    ? visibleBts
      .map((bt) => {
        return `
            <tr>
              <td><strong>${bt.ref}</strong></td>
              <td class="muted">${bt.otRef || "-"}</td>
              <td class="muted">${bt.startDate ? new Date(bt.startDate).toLocaleString(getAdministrationLocale()) : "-"}</td>
              <td class="muted">${bt.endDate ? new Date(bt.endDate).toLocaleString(getAdministrationLocale()) : "-"}</td>
              <td>${bt.duration || bt.durationReal || "-"}</td>
              <td><span class="status-badge ${getInterventionStatusBadgeClass(bt.status)}">${bt.status}</span></td>
              <td>${buildInterventionBtActions(bt)}</td>
            </tr>
          `;
      })
      .join("")
    : `
      <tr>
        <td colspan="7">
          ${buildInterventionEmptyState(
      "fa-file-signature",
      "Aucun BT saisi",
      "Les bons de travail remplis par les techniciens s'afficheront ici.",
      "La clôture BT déclenchera les sorties de stock automatiques.",
    )}
        </td>
      </tr>
    `;

  return `
    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-file-signature"></i> Liste des BT</div>
        <span class="status-badge badge-info">${visibleBts.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>OT lié</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Durée réelle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildInterventionsHistoryEntries(directory) {
  const entries = [];
  (Array.isArray(directory.history) ? directory.history : []).forEach(
    (event) => {
      entries.push({
        id: event.id,
        date: event.createdAt,
        ref: event.recordRef || event.action || "Événement",
        type: event.recordType || "Historique",
        label: event.message || event.action || "Transition",
        meta: event.recordType || "Journal",
        kind: "event",
        equipment: "",
        technician: "",
        status: "",
        priority: "",
      });
    },
  );

  directory.dis.forEach((di) => {
    const equipment = di.equipmentId
      ? getEquipmentRecord("equipments", di.equipmentId)
      : null;
    const technician = getOrganizationUser(di.requesterId);

    entries.push({
      id: di.id,
      date: di.createdAt,
      ref: di.ref,
      type: "DI",
      label: di.title,
      meta: di.status,
      kind: "record",
      equipment:
        equipment?.code && equipment?.name
          ? `${equipment.code} — ${equipment.name}`
          : di.equipmentLabel || "",
      technician: technician ? technician.name : di.requesterLabel || "",
      status: di.status || "",
      priority: di.urgency || "",
    });
  });

  directory.ots.forEach((ot) => {
    const equipment = ot.equipmentId
      ? getEquipmentRecord("equipments", ot.equipmentId)
      : null;
    const technicianNames = (ot.technicianIds || [])
      .map((id) => getOrganizationUser(id))
      .filter(Boolean)
      .map((user) => user.name)
      .join(", ");

    entries.push({
      id: ot.id,
      date: ot.createdAt || ot.plannedDate,
      ref: ot.ref,
      type: "OT",
      label: ot.equipmentLabel || ot.diRef || "Ordre",
      meta: ot.status,
      kind: "record",
      equipment:
        equipment?.code && equipment?.name
          ? `${equipment.code} — ${equipment.name}`
          : ot.equipmentLabel || "",
      technician: technicianNames || ot.technicianLabel || "",
      status: ot.status || "",
      priority: ot.priority || "",
    });
  });

  directory.bts.forEach((bt) => {
    entries.push({
      id: bt.id,
      date: bt.endDate || bt.startDate || bt.createdAt,
      ref: bt.ref,
      type: "BT",
      label: bt.otRef || "Bon",
      meta: bt.status,
      kind: "record",
      equipment: bt.equipmentLabel || "",
      technician: bt.technicianLabel || "",
      status: bt.status || "",
      priority: bt.priority || "",
    });
  });

  entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return entries;
}

function filterInterventionsHistory(entries) {
  const state = interventionsHistoryFilterState;
  return entries.filter((entry) => {
    if (state.equipment && entry.equipment !== state.equipment) return false;
    if (state.technician && entry.technician !== state.technician) return false;
    if (state.type && entry.type !== state.type) return false;
    if (state.status && entry.status !== state.status) return false;
    if (state.priority && entry.priority !== state.priority) return false;
    if (state.from || state.to) {
      const entryDate = new Date(entry.date || "");
      if (isNaN(entryDate)) return false;
      if (state.from) {
        const fromDate = new Date(`${state.from}T00:00:00`);
        if (entryDate < fromDate) return false;
      }
      if (state.to) {
        const toDate = new Date(`${state.to}T23:59:59`);
        if (entryDate > toDate) return false;
      }
    }
    return true;
  });
}

function buildInterventionsHistorySelectOptions(values, selectedValue) {
  const uniqueValues = [...new Set(values.filter(Boolean))].sort();
  return ["", ...uniqueValues]
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""
        }>${escapeHtml(value || "Tous")}</option>`,
    )
    .join("");
}

function renderHistorySection(directory) {
  const historyEntries = buildInterventionsHistoryEntries(directory);
  const filteredEntries = filterInterventionsHistory(historyEntries);
  const equipmentOptions = buildInterventionsHistorySelectOptions(
    historyEntries.map((entry) => entry.equipment),
    interventionsHistoryFilterState.equipment,
  );
  const technicianOptions = buildInterventionsHistorySelectOptions(
    historyEntries.map((entry) => entry.technician),
    interventionsHistoryFilterState.technician,
  );
  const typeOptions = buildInterventionsHistorySelectOptions(
    historyEntries.map((entry) => entry.type),
    interventionsHistoryFilterState.type,
  );
  const statusOptions = buildInterventionsHistorySelectOptions(
    historyEntries.map((entry) => entry.status),
    interventionsHistoryFilterState.status,
  );
  const priorityOptions = buildInterventionsHistorySelectOptions(
    historyEntries.map((entry) => entry.priority),
    interventionsHistoryFilterState.priority,
  );

  const rows = filteredEntries.length
    ? filteredEntries
      .map(
        (entry) => `
            <tr>
              <td><strong>${escapeHtml(entry.ref)}</strong></td>
              <td>${escapeHtml(entry.type)}</td>
              <td>${escapeHtml(entry.equipment || "-")}</td>
              <td>${escapeHtml(entry.technician || "-")}</td>
              <td>${escapeHtml(entry.status || "-")}</td>
              <td>${escapeHtml(entry.priority || "-")}</td>
              <td>${escapeHtml(entry.label)}</td>
              <td class="muted">${escapeHtml(
          entry.date
            ? new Date(entry.date).toLocaleString(
              getAdministrationLocale(),
            )
            : "-",
        )}</td>
            </tr>
          `,
      )
      .join("")
    : `
      <tr>
        <td colspan="8">
          ${buildInterventionEmptyState(
      "fa-clock-rotate-left",
      "Aucun historique",
      "Aucun événement ou intervention ne correspond aux filtres sélectionnés.",
      "Réinitialisez les filtres ou effacez l'historique pour repartir de zéro.",
    )}
        </td>
      </tr>
    `;

  return `
    <div class="org-section-actions org-history-filters">
      <div class="org-filters">
        <div class="field-group"><label for="historyFilterEquipment">Équipement</label><select id="historyFilterEquipment" data-int-history-filter="equipment">${equipmentOptions}</select></div>
        <div class="field-group"><label for="historyFilterTechnician">Technicien</label><select id="historyFilterTechnician" data-int-history-filter="technician">${technicianOptions}</select></div>
        <div class="field-group"><label for="historyFilterType">Type</label><select id="historyFilterType" data-int-history-filter="type">${typeOptions}</select></div>
        <div class="field-group"><label for="historyFilterStatus">Statut</label><select id="historyFilterStatus" data-int-history-filter="status">${statusOptions}</select></div>
        <div class="field-group"><label for="historyFilterPriority">Priorité</label><select id="historyFilterPriority" data-int-history-filter="priority">${priorityOptions}</select></div>
        <div class="field-group"><label for="historyFilterFrom">Date début</label><input id="historyFilterFrom" type="date" data-int-history-filter="from" value="${escapeHtml(interventionsHistoryFilterState.from)}" /></div>
        <div class="field-group"><label for="historyFilterTo">Date fin</label><input id="historyFilterTo" type="date" data-int-history-filter="to" value="${escapeHtml(interventionsHistoryFilterState.to)}" /></div>
      </div>
      <button class="btn btn-outline" type="button" data-int-history-clear>Effacer historique</button>
    </div>
    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Journal des interventions</div>
        <span class="status-badge badge-info">${filteredEntries.length}/${historyEntries.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>Type</th>
              <th>Équipement</th>
              <th>Technicien</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildInterventionEmptyState(icon, title, subtitle, note) {
  return `
    <div class="org-empty-card org-empty-card--list">
      <div class="org-empty-icon"><i class="fa-solid ${icon}"></i></div>
      <h3>${title}</h3>
      <p>${subtitle}</p>
      <small>${note}</small>
    </div>
  `;
}

function buildInterventionDiActions(di) {
  const transformButton =
    di.status === "Validée"
      ? `
      <button class="org-icon-btn" type="button" data-int-action="to-ot" data-int-id="${di.id}" title="Transformer en OT">
        <i class="fa-solid fa-arrow-right"></i>
      </button>
    `
      : "";

  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-int-action="details-di" data-int-id="${di.id}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-int-action="edit-di" data-int-id="${di.id}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      ${transformButton}
      <button class="org-icon-btn danger" type="button" data-int-action="delete-di" data-int-id="${di.id}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildInterventionOtActions(ot) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-int-action="details-ot" data-int-id="${ot.id}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-int-action="create-bt" data-int-id="${ot.id}" title="Créer BT">
        <i class="fa-regular fa-file-lines"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-int-action="delete-ot" data-int-id="${ot.id}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildInterventionBtActions(bt) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-int-action="details-bt" data-int-id="${bt.id}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" type="button" data-int-action="close-bt" data-int-id="${bt.id}" title="Clôturer">
        <i class="fa-solid fa-check"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-int-action="delete-bt" data-int-id="${bt.id}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function buildInterventionHistoryActions(type, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" type="button" data-int-action="details-${type}" data-int-id="${recordId}" title="Voir les détails">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn danger" type="button" data-int-action="delete-${type}" data-int-id="${recordId}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;
}

function getInterventionBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critique") return "badge-danger";
  if (normalized === "haute") return "badge-warning";
  if (normalized === "moyenne") return "badge-info";
  return "badge-gray";
}

function getInterventionStatusBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("valid")) return "badge-success";
  if (normalized.includes("term")) return "badge-success";
  if (normalized.includes("plan")) return "badge-info";
  if (normalized.includes("cours")) return "badge-warning";
  if (normalized.includes("rejet")) return "badge-danger";
  if (normalized.includes("clôt")) return "badge-info";
  return "badge-gray";
}

function formatInterventionDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(getAdministrationLocale());
}

function formatInterventionArticleLine(articleLine) {
  const article = getArticleRecord("articles", articleLine.articleId);
  return article
    ? `${article.code} — ${article.name} × ${articleLine.qty || 0}`
    : `${articleLine.articleId || "Article"} × ${articleLine.qty || 0}`;
}

function buildInterventionDetailRows(rows) {
  return `
    <div class="org-detail-list">
      ${rows
      .map(
        (row) => `
            <div class="org-detail-item">
              <span>${row.label}</span>
              <strong>${row.value}</strong>
            </div>
          `,
      )
      .join("")}
    </div>
  `;
}

function renderInterventionRecordDetails(recordType, record) {
  const badgeLabel =
    recordType === "di"
      ? "Demande d'intervention"
      : recordType === "ot"
        ? "Ordre de travail"
        : "Bon de travail";

  const title = record?.ref || badgeLabel;
  const subtitle =
    recordType === "di"
      ? "Fiche détaillée de la DI"
      : recordType === "ot"
        ? "Fiche détaillée de l'OT"
        : "Fiche détaillée du BT";

  let detailsHtml = "";

  if (recordType === "di") {
    const equipment = record.equipmentId
      ? getEquipmentRecord("equipments", record.equipmentId)
      : null;
    const organ = record.organeId
      ? getOrganeRecord("organes", record.organeId)
      : null;
    const requester = record.requesterId
      ? getOrganizationUser(record.requesterId)
      : null;

    detailsHtml = buildInterventionDetailRows([
      { label: "Réf", value: record.ref || "-" },
      { label: "Titre", value: record.title || "-" },
      {
        label: "Équipement",
        value: equipment
          ? `${equipment.code} — ${equipment.name}`
          : record.equipmentLabel || "-",
      },
      {
        label: "Organe",
        value: organ
          ? `${organ.code} — ${organ.name}`
          : record.organeLabel || "-",
      },
      { label: "Localisation", value: record.location || "-" },
      {
        label: "Demandeur",
        value: requester ? requester.name : record.requesterLabel || "-",
      },
      { label: "Type", value: record.requestType || "-" },
      { label: "Urgence", value: record.urgency || "-" },
      { label: "Statut", value: record.status || "-" },
      { label: "Créée le", value: formatInterventionDate(record.createdAt) },
    ]);
  }

  if (recordType === "ot") {
    const equipment = record.equipmentId
      ? getEquipmentRecord("equipments", record.equipmentId)
      : null;
    const organ = record.organeId
      ? getOrganeRecord("organes", record.organeId)
      : null;
    const technicians = (record.technicianIds || [])
      .map((id) => getOrganizationUser(id))
      .filter(Boolean)
      .map((user) => user.name)
      .join(", ");

    detailsHtml = buildInterventionDetailRows([
      { label: "Réf", value: record.ref || "-" },
      { label: "DI liée", value: record.diRef || "-" },
      {
        label: "Équipement",
        value: equipment
          ? `${equipment.code} — ${equipment.name}`
          : record.equipmentLabel || "-",
      },
      {
        label: "Organe",
        value: organ
          ? `${organ.code} — ${organ.name}`
          : record.organeLabel || "-",
      },
      { label: "Type maintenance", value: record.typeMaintenance || "-" },
      { label: "Priorité", value: record.priority || "-" },
      {
        label: "Technicien(s)",
        value: technicians || record.technicianLabel || "-",
      },
      { label: "Date planifiée", value: record.plannedDate || "-" },
      {
        label: "Durée estimée",
        value: record.durationEstimated ? `${record.durationEstimated} h` : "-",
      },
      { label: "Statut", value: record.status || "-" },
      { label: "Instructions", value: record.instructions || "-" },
    ]);
  }

  if (recordType === "bt") {
    const ot = record.otId ? getInterventionOt(record.otId) : null;
    detailsHtml = buildInterventionDetailRows([
      { label: "Réf", value: record.ref || "-" },
      { label: "OT lié", value: record.otRef || ot?.ref || "-" },
      { label: "Début", value: formatInterventionDate(record.startDate) },
      { label: "Fin", value: formatInterventionDate(record.endDate) },
      { label: "Durée réelle", value: record.duration || "-" },
      { label: "Statut", value: record.status || "-" },
      { label: "Travaux réalisés", value: record.works || "-" },
      { label: "Observations", value: record.observations || "-" },
      {
        label: "Causes",
        value: Array.isArray(record.causes)
          ? record.causes.join(", ") || "-"
          : "-",
      },
      {
        label: "Articles consommés",
        value: Array.isArray(record.articles)
          ? record.articles.map(formatInterventionArticleLine).join("<br />") ||
          "-"
          : "-",
      },
      {
        label: "Signature technicien",
        value: record.technicianSignature
          ? `${record.technicianSignature.name} · ${formatInterventionDate(record.technicianSignature.signedAt)}`
          : "-",
      },
      {
        label: "Signature responsable",
        value: record.managerSignature
          ? `${record.managerSignature.name} · ${formatInterventionDate(record.managerSignature.signedAt)}`
          : "-",
      },
    ]);
  }

  const workflowButtons = [];
  if (recordType === "di") {
    if (record.status === "Validée") {
      workflowButtons.push(
        `<button class="btn btn-primary" type="button" data-int-action="transform-di" data-int-id="${record.id}"><i class="fa-solid fa-arrow-right"></i><span>Transformer en OT</span></button>`,
      );
    } else if (record.status !== "Transformée en OT") {
      workflowButtons.push(
        `<button class="btn btn-primary" type="button" data-int-action="validate-di" data-int-id="${record.id}"><i class="fa-solid fa-circle-check"></i><span>Valider</span></button>`,
      );
    }
  }

  return `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-int-close="true"></div>
      <div class="org-modal-panel interventions-modal-panel" role="dialog" aria-modal="true" aria-labelledby="intDetailTitle">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">${badgeLabel}</div>
            <h3 id="intDetailTitle">${title}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="org-modal-close" type="button" data-int-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${detailsHtml}
        <div class="org-modal-actions">
          <button class="btn btn-outline" type="button" data-int-close="true">Fermer</button>
          <button class="btn btn-outline" type="button" data-int-print-details="true">
            <i class="fa-solid fa-print"></i>
            <span>Imprimer</span>
          </button>
          ${workflowButtons.join("")}
        </div>
      </div>
    </div>
  `;
}

function validateInterventionDi(diId) {
  const directory = loadInterventionsState();
  const di = directory.dis.find((item) => item.id === diId);
  if (!di) return window.alert("DI introuvable.");
  if (di.status === "Validée" || di.status === "Transformée en OT") {
    closeInterventionsModal();
    return;
  }

  di.status = "Validée";
  appendInterventionHistory(directory, {
    action: "DI validée",
    recordType: "DI",
    recordRef: di.ref,
    message: `${di.ref} validée`,
  });
  saveInterventionsState(directory);
  setInterventionsModalState({
    mode: "details",
    recordType: "di",
    recordId: di.id,
  });
  renderInterventionsPage(getCurrentInterventionsTab("di"));
}

function convertDiToOt(diId) {
  setInterventionsModalState({
    mode: "transform-to-ot",
    recordId: diId,
    recordType: "di",
  });
  renderInterventionsPage(getCurrentInterventionsTab("di"));
}

function showInterventionsToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "1rem 1.5rem";
  toast.style.background = type === "success" ? "#10b981" : "#ef4444";
  toast.style.color = "#fff";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.zIndex = "9999";
  toast.style.transition = "opacity 0.3s ease";
  toast.style.fontFamily = "inherit";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function buildInterventionTransformOtModal(di) {
  const equipment = di.equipmentId
    ? getEquipmentRecord("equipments", di.equipmentId)
    : null;
  const organ = di.organeId ? getOrganeRecord("organes", di.organeId) : null;
  const requester = di.requesterId ? getOrganizationUser(di.requesterId) : null;

  const equipmentLabel = equipment
    ? `${equipment.code} — ${equipment.name}`
    : di.equipmentLabel || "-";
  const organLabel = organ
    ? `${organ.code} — ${organ.name}`
    : di.organeLabel || "-";
  const requesterLabel = requester ? requester.name : di.requesterLabel || "-";

  const technicianOptions = organizationUsers
    .map(
      (user) =>
        `<option value="${user.id}">${escapeHtml(user.name)} - ${escapeHtml(user.role)}</option>`,
    )
    .join("");

  const articleOptions = getArticleRecords("articles")
    .map(
      (a) =>
        `<option value="${a.id}">${escapeHtml(a.code)} - ${escapeHtml(a.name)}</option>`,
    )
    .join("");

  return `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-int-close="true"></div>
      <div class="org-modal-panel interventions-modal-panel" role="dialog" aria-modal="true" aria-labelledby="intTransformTitle" style="max-width: 800px;">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Transformer en OT</div>
            <h3 id="intTransformTitle">Créer un OT depuis ${escapeHtml(di.ref || "DI")}</h3>
            <p>Vérifiez les informations de la DI et complétez les détails de l'OT.</p>
          </div>
          <button class="org-modal-close" type="button" data-int-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form class="org-form" data-int-transform-ot-form data-di-id="${di.id}">
          <div class="org-form-section" style="padding: 1.5rem;">
            <h4 class="org-form-section-title" style="margin-top: 0;">SECTION 1 — Informations de la DI</h4>
            <div class="org-detail-list" style="margin-bottom: 0;">
              <div class="org-detail-item"><span>Numéro DI lié</span><strong>${escapeHtml(di.ref || "-")}</strong></div>
              <div class="org-detail-item"><span>Titre</span><strong>${escapeHtml(di.title || "-")}</strong></div>
              <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(equipmentLabel)}</strong></div>
              <div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(organLabel)}</strong></div>
              <div class="org-detail-item"><span>Type demande</span><strong>${escapeHtml(di.requestType || "-")}</strong></div>
              <div class="org-detail-item"><span>Urgence</span><strong>${escapeHtml(di.urgency || "-")}</strong></div>
              <div class="org-detail-item"><span>Demandeur</span><strong>${escapeHtml(requesterLabel)}</strong></div>
              <div class="org-detail-item"><span>Description</span><strong>${escapeHtml(di.description || "-")}</strong></div>
            </div>
          </div>

          <div class="org-form-section" style="padding: 1.5rem; border-top: 1px solid var(--org-border);">
            <h4 class="org-form-section-title" style="margin-top: 0;">SECTION 2 — Champs à remplir pour l'OT</h4>
            <div class="org-form-grid">
              <div class="field-group">
                <label>Numéro OT</label>
                <input type="text" value="Généré automatiquement (OT-XXX)" disabled />
              </div>
              <div class="field-group">
                <label for="otTypeMaintenance">Type maintenance</label>
                <select id="otTypeMaintenance" name="typeMaintenance" required>
                  <option value="Corrective">Corrective</option>
                  <option value="Préventive">Préventive</option>
                  <option value="Prédictive">Prédictive</option>
                  <option value="Réglementaire">Réglementaire</option>
                </select>
              </div>
              <div class="field-group">
                <label for="otPlannedDate">Date planifiée <span style="color:var(--org-danger);">*</span></label>
                <input id="otPlannedDate" name="plannedDate" type="date" required />
              </div>
              <div class="field-group">
                <label for="otDuration">Durée estimée (heures)</label>
                <input id="otDuration" name="durationEstimated" type="number" step="0.5" min="0" placeholder="Ex: 2" />
              </div>
              <div class="field-group">
                <label for="otTechnician">Technicien assigné</label>
                <select id="otTechnician" name="technicianId">
                  <option value="">Sélectionner</option>
                  ${technicianOptions}
                </select>
              </div>
              <div class="field-group">
                <label for="otPriority">Priorité</label>
                <select id="otPriority" name="priority">
                  <option value="Faible"${di.urgency === "Faible" ? " selected" : ""}>Faible</option>
                  <option value="Moyenne"${!di.urgency || di.urgency === "Moyenne" ? " selected" : ""}>Moyenne</option>
                  <option value="Haute"${di.urgency === "Haute" ? " selected" : ""}>Haute</option>
                  <option value="Critique"${di.urgency === "Critique" ? " selected" : ""}>Critique</option>
                </select>
              </div>
              <div class="field-group field-group-wide">
                <label for="otInstructions">Instructions techniques</label>
                <textarea id="otInstructions" name="instructions" rows="3" placeholder="Saisissez les instructions pour le technicien..."></textarea>
              </div>
              <div class="field-group field-group-wide">
                <label>Checklist sécurité</label>
                <div style="display:flex; gap:1.5rem; flex-wrap:wrap; margin-top:0.5rem; padding: 0.5rem; background: var(--org-bg-alt); border-radius: 6px;">
                  <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="checkbox" name="safetyChecklist" value="Consignation électrique" /> Consignation électrique</label>
                  <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="checkbox" name="safetyChecklist" value="EPI requis" /> EPI requis</label>
                  <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="checkbox" name="safetyChecklist" value="Permis de travail" /> Permis de travail</label>
                </div>
              </div>
              <div class="field-group field-group-wide">
                <label>Articles prévus</label>
                <div id="otArticleLinesContainer" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.75rem;">
                </div>
                <button type="button" class="btn btn-outline btn-sm" id="otAddArticleBtn" data-options="${escapeHtml(articleOptions)}">
                  <i class="fa-solid fa-plus"></i> Ajouter un article
                </button>
              </div>
              <div class="field-group">
                <label>Statut</label>
                <input type="text" value="Planifié" disabled />
              </div>
            </div>
          </div>

          <div class="org-modal-actions">
            <button class="btn btn-outline" type="button" data-int-close="true">Annuler</button>
            <button class="btn btn-primary" type="submit">
              <i class="fa-solid fa-arrow-right"></i>
              <span>Confirmer et créer OT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function buildInterventionTransformBtModal(ot) {
  const equipment = ot.equipmentId
    ? getEquipmentRecord("equipments", ot.equipmentId)
    : null;
  const organ = ot.organeId ? getOrganeRecord("organes", ot.organeId) : null;

  const equipmentLabel = equipment
    ? `${equipment.code} — ${equipment.name}`
    : ot.equipmentLabel || "-";
  const organLabel = organ
    ? `${organ.code} — ${organ.name}`
    : ot.organeLabel || "-";

  const articleOptions = getArticleRecords("articles")
    .map(
      (a) =>
        `<option value="${a.id}" data-pmp="${getPrimaryStockRecord(a.id)?.pmp || 0}">${escapeHtml(a.code)} - ${escapeHtml(a.name)}</option>`,
    )
    .join("");
  const formattedArticles =
    ot.articles && ot.articles.length
      ? ot.articles.map(formatInterventionArticleLine).join("<br/>")
      : "-";

  return `
    <div class="org-modal open" role="presentation">
      <div class="org-modal-backdrop" data-int-close="true"></div>
      <div class="org-modal-panel interventions-modal-panel" role="dialog" aria-modal="true" aria-labelledby="intTransformBtTitle" style="max-width: 800px;">
        <div class="org-modal-head">
          <div>
            <div class="org-modal-kicker">Créer BT</div>
            <h3 id="intTransformBtTitle">Créer un BT depuis ${escapeHtml(ot.ref || "OT")}</h3>
            <p>Vérifiez les informations de l'OT et complétez les détails du Bon de Travail.</p>
          </div>
          <button class="org-modal-close" type="button" data-int-close="true" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form class="org-form" data-int-transform-bt-form data-ot-id="${ot.id}">
          <div class="org-form-section" style="padding: 1.5rem;">
            <h4 class="org-form-section-title" style="margin-top: 0;">SECTION 1 — Informations de l'OT</h4>
            <div class="org-detail-list" style="margin-bottom: 0;">
              <div class="org-detail-item"><span>Numéro OT lié</span><strong>${escapeHtml(ot.ref || "-")}</strong></div>
              <div class="org-detail-item"><span>Titre / Réf DI</span><strong>${escapeHtml(ot.diRef || "-")}</strong></div>
              <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(equipmentLabel)}</strong></div>
              <div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(organLabel)}</strong></div>
              <div class="org-detail-item"><span>Type maintenance</span><strong>${escapeHtml(ot.typeMaintenance || "-")}</strong></div>
              <div class="org-detail-item"><span>Technicien assigné</span><strong>${escapeHtml(ot.technicianLabel || "-")}</strong></div>
              <div class="org-detail-item"><span>Date planifiée</span><strong>${escapeHtml(ot.plannedDate || "-")}</strong></div>
              <div class="org-detail-item"><span>Durée estimée</span><strong>${ot.durationEstimated ? ot.durationEstimated + " h" : "-"}</strong></div>
              <div class="org-detail-item" style="grid-column: 1 / -1;"><span>Instructions techniques</span><strong>${escapeHtml(ot.instructions || "-")}</strong></div>
              <div class="org-detail-item" style="grid-column: 1 / -1;"><span>Articles prévus</span><strong>${formattedArticles}</strong></div>
            </div>
          </div>

          <div class="org-form-section" style="padding: 1.5rem; border-top: 1px solid var(--org-border);">
            <h4 class="org-form-section-title" style="margin-top: 0;">SECTION 2 — Champs à remplir pour le BT</h4>
            <div class="org-form-grid">
              <div class="field-group">
                <label>Numéro BT</label>
                <input type="text" value="Généré automatiquement (BT-XXX)" disabled />
              </div>
              <div class="field-group">
                <label for="btStartDate">Date de début</label>
                <input id="btStartDate" name="startDate" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}" readonly />
              </div>
              <div class="field-group">
                <label for="btEndDate">Date de fin <span style="color:var(--org-danger);">*</span></label>
                <input id="btEndDate" name="endDate" type="datetime-local" required />
              </div>
              <div class="field-group">
                <label for="btDurationReal">Durée réelle</label>
                <input id="btDurationReal" type="text" value="0h" readonly />
              </div>
              <div class="field-group field-group-wide">
                <label for="btWorks">Travaux réalisés <span style="color:var(--org-danger);">*</span></label>
                <textarea id="btWorks" name="works" rows="3" required placeholder="Détaillez les actions menées..."></textarea>
              </div>
              <div class="field-group">
                <label for="btCause">Cause de la panne</label>
                <select id="btCause" name="cause">
                  <option value="">Sélectionner</option>
                  <option value="Usure normale">Usure normale</option>
                  <option value="Défaut lubrification">Défaut lubrification</option>
                  <option value="Surcharge">Surcharge</option>
                  <option value="Défaut matière">Défaut matière</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="field-group">
                <label>Statut</label>
                <input type="text" value="Clôturé" disabled />
              </div>
              <div class="field-group field-group-wide">
                <label for="btAnomalies">Anomalies détectées</label>
                <textarea id="btAnomalies" name="anomalies" rows="2" placeholder="Ex: Fuite mineure constatée sur joint secondaire..."></textarea>
              </div>
              <div class="field-group field-group-wide">
                <label for="btObservations">Observations</label>
                <textarea id="btObservations" name="observations" rows="2" placeholder="Remarques éventuelles..."></textarea>
              </div>
              <div class="field-group field-group-wide">
                <label>Photos après intervention</label>
                <input type="file" accept="image/*" multiple />
              </div>
              <div class="field-group field-group-wide">
                <label>Articles consommés</label>
                <div id="btArticleLinesContainer" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.75rem;">
                </div>
                <button type="button" class="btn btn-outline btn-sm" id="btAddArticleBtn" data-options="${escapeHtml(articleOptions)}">
                  <i class="fa-solid fa-plus"></i> Ajouter un article consommé
                </button>
              </div>
            </div>
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--org-bg-alt); border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Coût articles consommés :</span>
                <strong id="btCostArticles">0,00 DZD</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold; border-top: 1px solid var(--org-border); padding-top: 0.5rem;">
                <span>Coût total intervention :</span>
                <strong id="btCostTotal">0,00 DZD</strong>
              </div>
            </div>
          </div>

          <div class="org-modal-actions">
            <button class="btn btn-outline" type="button" data-int-close="true">Annuler</button>
            <button class="btn btn-primary" type="submit">
              <i class="fa-solid fa-check"></i>
              <span>Confirmer et créer BT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function closeBt(btId) {
  const directory = loadInterventionsState();
  const bt = directory.bts.find((item) => item.id === btId);
  if (!bt) return window.alert("BT introuvable.");

  bt.endDate = new Date().toISOString();
  bt.duration = `${Math.max(0, Math.round((new Date(bt.endDate) - new Date(bt.startDate)) / 3600000))}h`;
  bt.status = "Clôturé";

  (bt.articles || []).forEach((articleLine) => {
    const primary = getPrimaryStockRecord(articleLine.articleId);
    if (!primary) return;

    const quantity = Number(articleLine.qty || 0) || 0;
    const nextQuantity = Math.max(
      0,
      Number(primary.currentQuantity || 0) - quantity,
    );
    upsertStockRecord(articleLine.articleId, primary, {
      currentQuantity: nextQuantity,
      updatedAt: new Date().toISOString(),
    });
    appendStockMovement({
      articleId: articleLine.articleId,
      quantity,
      type: "exit",
      source: "BT",
      linkedRef: bt.ref,
      pmp: primary.pmp || 0,
      location: primary.locationLabel,
    });
    syncStockArticleQuantityFromRecords(articleLine.articleId);
  });

  const ot = directory.ots.find((item) => item.id === bt.otId);
  if (ot) ot.status = "Terminé";

  appendInterventionHistory(directory, {
    action: "BT clôturé",
    recordType: "BT",
    recordRef: bt.ref,
    message: `${bt.ref} clôturé`,
  });
  // Recalcul nextDueDate du plan lié après clôture BT
  if (bt.planId) {
    const planState = loadPlanificationData();
    const linkedPlan = planState.plans.find(p => p.id === bt.planId);
    if (linkedPlan) {
      linkedPlan.nextDueDate = computeNextDueDate(new Date().toISOString(), linkedPlan.frequency);
      savePlanificationData(planState);
    }
  }
  saveInterventionsState(directory);
  renderInterventionsPage(getCurrentInterventionsTab("bt"));
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
        record ? `Détails de ${record.name}` : "Détails du site",
        "Toutes les informations du site sélectionné.",
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

(function () {
  const STORAGE_KEY = "maintflow.fournisseurs";
  const TAB_CONFIG = {
    fiche: {
      label: "Fiche fournisseur",
      title: "Fiche fournisseur",
      subtitle:
        "Référentiel de base, contacts, légaux et conditions commerciales.",
    },
    contrats: {
      label: "Contrats & Garanties",
      title: "Contrats & Garanties",
      subtitle:
        "Suivi des engagements contractuels et garanties liées aux équipements.",
    },
    evaluation: {
      label: "Évaluation",
      title: "Évaluation fournisseur",
      subtitle: "Notation périodique, commentaires et recommandations.",
    },
  };

  const root = {
    title: () => document.getElementById("pageTitle"),
    subtitle: () => document.getElementById("pageSubtitle"),
    actions: () => document.getElementById("pageActions"),
    content: () => document.getElementById("pageContent"),
    overlay: () => document.getElementById("overlayRoot"),
  };

  let activeTab = "fiche";

  function qs(sel, ctx = document) {
    return ctx.querySelector(sel);
  }

  function qsa(sel, ctx = document) {
    return Array.from(ctx.querySelectorAll(sel));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { suppliers: [] };
    } catch (_error) {
      return { suppliers: [] };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seededState() {
    return {
      suppliers: [],
      contracts: [],
      warranties: [],
      evaluations: [],
    };
  }

  function ensureSeedData() {
    const state = loadState();
    if (!state.suppliers || state.suppliers.length === 0) {
      const seeded = seededState();
      saveState(seeded);
      return seeded;
    }
    return state;
  }

  function nextRef(prefix, items, field = "number") {
    const values = (items || [])
      .map((item) => item[field])
      .filter(Boolean)
      .map((value) => {
        const match = String(value).match(/(\d+)$/);
        return match ? Number(match[1]) : 0;
      });
    const next = (values.length ? Math.max(...values) : 0) + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === "") return "—";
    return Number(value).toLocaleString(getAdministrationLocale());
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(getAdministrationLocale());
  }

  function getData(tab, state) {
    if (tab === "fiche") {
      return state.suppliers.map((supplier) => ({
        id: supplier.id,
        number: supplier.number,
        raisonSociale: supplier.raisonSociale,
        nomCommercial: supplier.nomCommercial,
        type: supplier.type,
        domaine: supplier.domaine,
        status: supplier.status,
        supplier,
      }));
    }
    if (tab === "contrats") {
      return {
        contracts: state.suppliers.flatMap((supplier) =>
          (supplier.contracts || []).map((item) => ({
            ...item,
            supplierNumber: supplier.number,
            supplierName: supplier.raisonSociale,
            supplier,
            recordType: "contract",
          })),
        ),
        warranties: state.suppliers.flatMap((supplier) =>
          (supplier.warranties || []).map((item) => ({
            ...item,
            supplierNumber: supplier.number,
            supplierName: supplier.raisonSociale,
            supplier,
            recordType: "warranty",
          })),
        ),
      };
    }
    return state.suppliers.flatMap((supplier) =>
      (supplier.evaluations || []).map((item) => ({
        ...item,
        supplierNumber: supplier.number,
        supplierName: supplier.raisonSociale,
        supplier,
      })),
    );
  }

  function updateHeader() {
    const tab = TAB_CONFIG[activeTab];
    const titleEl = root.title();
    const subtitleEl = root.subtitle();
    if (titleEl) titleEl.textContent = tab.title;
    if (subtitleEl) subtitleEl.textContent = tab.subtitle;
  }

  function openModal(title, description, contentHtml, footerHtml) {
    const overlay = root.overlay();
    if (!overlay) return;
    overlay.innerHTML = `
      <div class="supplier-modal-overlay" data-close="backdrop">
        <div class="supplier-modal" role="dialog" aria-modal="true" aria-label="${title}">
          <div class="supplier-modal-head">
            <div>
              <h3>${title}</h3>
              <p>${description || ""}</p>
            </div>
            <button class="supplier-modal-close" type="button" data-close="button">×</button>
          </div>
          ${contentHtml}
          ${footerHtml || ""}
        </div>
      </div>
    `;
    const close = () => {
      overlay.innerHTML = "";
    };
    qsa("[data-close], [data-modal-cancel]", overlay).forEach((btn) => {
      btn.addEventListener("click", (event) => {
        if (event.target === btn || btn.dataset.close) close();
      });
    });
    const modal = qs(".supplier-modal", overlay);
    if (modal) {
      modal.addEventListener("click", (event) => event.stopPropagation());
    }
  }

  function buildActionButtons(type, record, mode = "row") {
    return `
      <div class="supplier-actions">
        <button class="org-icon-btn" type="button" data-action="view" data-type="${type}" data-id="${record.id}" title="Voir">
          <i class="fa-regular fa-eye"></i>
        </button>
        <button class="org-icon-btn" type="button" data-action="edit" data-type="${type}" data-id="${record.id}" title="Modifier">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="org-icon-btn danger" type="button" data-action="delete" data-type="${type}" data-id="${record.id}" title="Supprimer">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
  }

  function renderTabs() {
    const tabs = Object.entries(TAB_CONFIG)
      .map(
        ([key, config]) =>
          `<button class="supplier-tab ${key === activeTab ? "active" : ""}" type="button" data-tab="${key}">${config.label}</button>`,
      )
      .join("");
    return `<div class="supplier-tabs">${tabs}</div>`;
  }

  function renderPage() {
    const state = ensureSeedData();
    const tab = TAB_CONFIG[activeTab] ? activeTab : "fiche";
    if (tab !== activeTab) {
      activeTab = tab;
    }
    updateHeader();
    const actionsEl = root.actions();
    const contentEl = root.content();
    if (!contentEl) return;

    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="btn btn-primary supplier-create-btn" type="button" data-kind="${tab}">
          <i class="fa-solid fa-plus"></i>
          <span>Créer</span>
        </button>
      `;
    }

    const pageStats = buildStats(tab, state);
    contentEl.innerHTML = `
      <div class="supplier-module">
        <div class="supplier-module-hero">
          <div>
            <h2>${TAB_CONFIG[tab].title}</h2>
            <p>${TAB_CONFIG[tab].subtitle}</p>
          </div>
          <div class="supplier-pill">${state.suppliers.length} fournisseurs actifs</div>
        </div>
        ${renderTabs()}
        <div class="supplier-kpi-grid">
          <div class="supplier-kpi-card"><small>Enregistrements</small><strong>${pageStats.count}</strong></div>
          <div class="supplier-kpi-card"><small>En cours / actifs</small><strong>${pageStats.active}</strong></div>
          <div class="supplier-kpi-card"><small>Note moyenne</small><strong>${pageStats.score}</strong></div>
        </div>
        <div id="supplierTabContent"></div>
      </div>
    `;

    const tabContent = qs("#supplierTabContent", contentEl);
    if (tabContent) {
      if (tab === "fiche") tabContent.innerHTML = renderFicheTab(state);
      if (tab === "contrats") tabContent.innerHTML = renderContractsTab(state);
      if (tab === "evaluation")
        tabContent.innerHTML = renderEvaluationTab(state);
    }

    bindTabEvents();
    bindActionEvents(state);
    bindCreateEvent(state);
  }

  function buildStats(tab, state) {
    if (tab === "fiche") {
      return {
        count: state.suppliers.length,
        active: state.suppliers.filter(
          (supplier) => supplier.status === "Actif",
        ).length,
        score: averageScore(state).toFixed(2),
      };
    }
    if (tab === "contrats") {
      const items = getData("contrats", state);
      return {
        count: items.contracts.length + items.warranties.length,
        active:
          items.contracts.filter((item) => item.status === "En cours").length +
          items.warranties.filter((item) => item.status === "En garantie")
            .length,
        score: averageScore(state).toFixed(2),
      };
    }
    const items = getData("evaluation", state);
    return {
      count: items.length,
      active: items.filter(
        (item) => item.recommendation === "Fournisseur recommandé",
      ).length,
      score: items.length
        ? (
          items.reduce((sum, item) => sum + Number(item.global || 0), 0) /
          items.length
        ).toFixed(2)
        : "0",
    };
  }

  function averageScore(state) {
    const evaluations = state.suppliers.flatMap(
      (supplier) => supplier.evaluations || [],
    );
    if (!evaluations.length) return 0;
    return (
      evaluations.reduce(
        (sum, evaluation) => sum + Number(evaluation.global || 0),
        0,
      ) / evaluations.length
    );
  }

  function renderFicheTab(state) {
    const rows = state.suppliers
      .map(
        (supplier) => `
          <tr>
            <td>
              <div class="supplier-row-title">${supplier.number}</div>
              <div class="supplier-row-sub">${supplier.domaine || ""}</div>
            </td>
            <td>
              <div class="supplier-row-title">${supplier.raisonSociale || ""}</div>
              <div class="supplier-row-sub">${supplier.nomCommercial || ""}</div>
            </td>
            <td>${supplier.type || "—"}</td>
            <td><span class="supplier-pill">${supplier.status || "Actif"}</span></td>
            <td>${supplier.tel1 || "—"}</td>
            <td>${supplier.email || "—"}</td>
            <td>${buildActionButtons("fiche", supplier)}</td>
          </tr>
        `,
      )
      .join("");
    return `
      <div class="supplier-section">
        <div class="supplier-section-head">
          <div>
            <h3>Liste fournisseurs</h3>
            <p>Chaque ligne dispose des actions voir, modifier et supprimer.</p>
          </div>
        </div>
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Raison sociale</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="7"><div class="supplier-empty-state">Aucun fournisseur disponible.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderCatalogueTab(state) {
    const items = getData("catalogue", state);
    const rows = items
      .map(
        (item) => `
          <tr>
            <td>
              <div class="supplier-row-title">${item.supplierName}</div>
              <div class="supplier-row-sub">${item.supplierNumber}</div>
            </td>
            <td>
              <div class="supplier-row-title">${item.article || ""}</div>
              <div class="supplier-row-sub">${item.designation || ""}</div>
            </td>
            <td>${item.refFourn || "—"}</td>
            <td>${item.unit || "—"}</td>
            <td>${formatCurrency(item.price)} DZD</td>
            <td>${item.moq || "—"}</td>
            <td>${formatDate(item.updatedAt)}</td>
            <td>${buildActionButtons("catalogue", item)}</td>
          </tr>
        `,
      )
      .join("");
    return `
      <div class="supplier-section">
        <div class="supplier-section-head">
          <div>
            <h3>Catalogue fournisseur</h3>
            <p>Liste des lignes catalogue avec références fournisseurs et tarifs négociés.</p>
          </div>
        </div>
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Article</th>
                <th>Référence fournisseur</th>
                <th>Unité</th>
                <th>Prix HT</th>
                <th>MOQ</th>
                <th>Mise à jour prix</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="8"><div class="supplier-empty-state">Aucune ligne catalogue.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderContractsTab(state) {
    const data = getData("contrats", state);
    const contractRows = data.contracts
      .map(
        (item) => `
          <tr>
            <td>
              <div class="supplier-row-title">${item.number}</div>
              <div class="supplier-row-sub">${item.type}</div>
            </td>
            <td>
              <div class="supplier-row-title">${item.supplierName}</div>
              <div class="supplier-row-sub">${item.supplierNumber}</div>
            </td>
            <td>${item.objet || "—"}</td>
            <td>${formatDate(item.debut)} → ${formatDate(item.fin)}</td>
            <td>${formatCurrency(item.valeur)} DZD</td>
            <td>${item.status || "—"}</td>
            <td>${buildActionButtons("contract", item)}</td>
          </tr>
        `,
      )
      .join("");
    const warrantyRows = data.warranties
      .map(
        (item) => `
          <tr>
            <td>
              <div class="supplier-row-title">${item.equipment}</div>
              <div class="supplier-row-sub">${item.supplierName}</div>
            </td>
            <td>${formatDate(item.debut)}</td>
            <td>${item.durationMonths || "—"} mois</td>
            <td>${formatDate(item.endDate)}</td>
            <td>${item.status || "—"}</td>
            <td>${buildActionButtons("warranty", item)}</td>
          </tr>
        `,
      )
      .join("");
    return `
      <div class="supplier-section" style="margin-bottom:16px;">
        <div class="supplier-section-head">
          <div>
            <h3>Contrats</h3>
            <p>Contrats cadres, maintenance et partenariats.</p>
          </div>
        </div>
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Fournisseur</th>
                <th>Objet</th>
                <th>Période</th>
                <th>Valeur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${contractRows || `<tr><td colspan="7"><div class="supplier-empty-state">Aucun contrat.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="supplier-section">
        <div class="supplier-section-head">
          <div>
            <h3>Garanties</h3>
            <p>Garanties liées aux équipements et documents associés.</p>
          </div>
        </div>
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>Équipement</th>
                <th>Date début</th>
                <th>Durée</th>
                <th>Date fin</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${warrantyRows || `<tr><td colspan="6"><div class="supplier-empty-state">Aucune garantie.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderEvaluationTab(state) {
    const items = getData("evaluation", state);
    const rows = items
      .map(
        (item) => `
          <tr>
            <td>
              <div class="supplier-row-title">${item.number}</div>
              <div class="supplier-row-sub">${item.periode}</div>
            </td>
            <td>
              <div class="supplier-row-title">${item.supplierName}</div>
              <div class="supplier-row-sub">${item.supplierNumber}</div>
            </td>
            <td>${item.evaluator || "—"}</td>
            <td><span class="supplier-pill">${Number(item.global || 0).toFixed(2)}</span></td>
            <td>${item.recommendation || "—"}</td>
            <td>${buildActionButtons("evaluation", item)}</td>
          </tr>
        `,
      )
      .join("");
    return `
      <div class="supplier-section">
        <div class="supplier-section-head">
          <div>
            <h3>Évaluation fournisseur</h3>
            <p>Historique des évaluations et note globale automatique.</p>
          </div>
        </div>
        <div class="supplier-table-wrap">
          <table class="supplier-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Fournisseur</th>
                <th>Évaluateur</th>
                <th>Note globale</th>
                <th>Recommandation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="6"><div class="supplier-empty-state">Aucune évaluation.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function bindTabEvents() {
    qsa(".supplier-tab").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.tab;
        renderPage();
      });
    });
  }

  function bindCreateEvent(state) {
    qsa(".supplier-create-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const kind = button.dataset.kind || activeTab;
        if (kind === "fiche") openSupplierModal();
        if (kind === "contract") openContractModal(state);
        if (kind === "warranty") openWarrantyModal(state);
        if (kind === "evaluation") openEvaluationModal();
      });
    });
  }

  function bindActionEvents(state) {
    qsa("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.type;
        const id = button.dataset.id;
        const action = button.dataset.action;
        handleRowAction(state, type, id, action);
      });
    });
  }

  function getRecordByType(state, type, id) {
    if (type === "fiche") return state.suppliers.find((item) => item.id === id);
    if (type === "catalogue") {
      for (const supplier of state.suppliers) {
        const item = (supplier.catalogue || []).find(
          (entry) => entry.id === id,
        );
        if (item) return { item, supplier };
      }
    }
    if (type === "contract") {
      for (const supplier of state.suppliers) {
        const item = (supplier.contracts || []).find(
          (entry) => entry.id === id,
        );
        if (item) return { item, supplier };
      }
    }
    if (type === "warranty") {
      for (const supplier of state.suppliers) {
        const item = (supplier.warranties || []).find(
          (entry) => entry.id === id,
        );
        if (item) return { item, supplier };
      }
    }
    if (type === "evaluation") {
      for (const supplier of state.suppliers) {
        const item = (supplier.evaluations || []).find(
          (entry) => entry.id === id,
        );
        if (item) return { item, supplier };
      }
    }
    return null;
  }

  function handleRowAction(state, type, id, action) {
    const result = getRecordByType(state, type, id);
    if (!result) return;
    const entry = result.item || result;
    const supplier = result.supplier || result;
    if (action === "view") {
      openViewModal(type, entry, supplier);
      return;
    }
    if (action === "edit") {
      if (type === "fiche") openSupplierModal(entry);
      if (type === "catalogue") openCatalogueModal(entry, supplier);
      if (type === "contract") openContractModal(state, entry, supplier);
      if (type === "warranty") openWarrantyModal(state, entry, supplier);
      if (type === "evaluation") openEvaluationModal(entry, supplier);
      return;
    }
    if (action === "delete") {
      const label =
        entry.raisonSociale ||
        entry.number ||
        entry.article ||
        entry.objet ||
        entry.equipment ||
        "cet élément";
      if (!window.confirm(`Supprimer ${label} ?`)) return;
      removeRecord(type, id);
      renderPage();
    }
  }

  function removeRecord(type, id) {
    const state = loadState();
    if (type === "fiche") {
      state.suppliers = state.suppliers.filter(
        (supplier) => supplier.id !== id,
      );
    }
    if (type === "catalogue") {
      state.suppliers.forEach((supplier) => {
        supplier.catalogue = (supplier.catalogue || []).filter(
          (item) => item.id !== id,
        );
      });
    }
    if (type === "contract") {
      state.suppliers.forEach((supplier) => {
        supplier.contracts = (supplier.contracts || []).filter(
          (item) => item.id !== id,
        );
      });
    }
    if (type === "warranty") {
      state.suppliers.forEach((supplier) => {
        supplier.warranties = (supplier.warranties || []).filter(
          (item) => item.id !== id,
        );
      });
    }
    if (type === "evaluation") {
      state.suppliers.forEach((supplier) => {
        supplier.evaluations = (supplier.evaluations || []).filter(
          (item) => item.id !== id,
        );
      });
    }
    saveState(state);
  }

  function openViewModal(type, entry, supplier) {
    let fields = [];
    if (type === "fiche") {
      fields = [
        ["Numéro", entry.number],
        ["Raison sociale", entry.raisonSociale],
        ["Nom commercial", entry.nomCommercial],
        ["Type", entry.type],
        ["Domaine", entry.domaine],
        ["Téléphone", entry.tel1],
        ["Email", entry.email],
        ["Statut", entry.status],
      ];
    }
    if (type === "catalogue") {
      fields = [
        ["Fournisseur", entry.supplierName],
        ["Article", entry.article],
        ["Référence fournisseur", entry.refFourn],
        ["Désignation", entry.designation],
        ["Prix HT", `${formatCurrency(entry.price)} DZD`],
        ["Unité", entry.unit],
        ["MOQ", entry.moq],
        ["Disponibilité", entry.availability],
        ["Observations", entry.observations],
      ];
    }
    if (type === "contract") {
      fields = [
        ["Numéro contrat", entry.number],
        ["Fournisseur", entry.supplierName],
        ["Type contrat", entry.type],
        ["Objet", entry.objet],
        ["Début", formatDate(entry.debut)],
        ["Fin", formatDate(entry.fin)],
        ["Valeur", `${formatCurrency(entry.valeur)} DZD`],
        ["Statut", entry.status],
      ];
    }
    if (type === "warranty") {
      fields = [
        ["Équipement", entry.equipment],
        ["Fournisseur", entry.supplierName],
        ["Début", formatDate(entry.debut)],
        ["Durée", `${entry.durationMonths || "—"} mois`],
        ["Fin", formatDate(entry.endDate)],
        ["Statut", entry.status],
        ["Conditions", entry.conditions],
      ];
    }
    if (type === "evaluation") {
      fields = [
        ["Numéro", entry.number],
        ["Fournisseur", entry.supplierName],
        ["Période", entry.periode],
        ["Évaluateur", entry.evaluator],
        ["Note globale", Number(entry.global || 0).toFixed(2)],
        ["Recommandation", entry.recommendation],
        ["Commentaires", entry.comments],
        ["Actions correctives", entry.correctiveActions],
      ];
    }
    openModal(
      `Voir ${TAB_CONFIG[activeTab].label}`,
      `Détail du dossier ${supplier.raisonSociale || supplier.supplierName || ""}`,
      `<div class="supplier-section"><div class="supplier-form-grid">${fields
        .map(
          ([label, value]) =>
            `<div class="full"><label>${label}</label><div style="padding:11px 12px;border:1px solid var(--border);border-radius:12px;background:#fff;">${value || "—"}</div></div>`,
        )
        .join("")}</div></div>`,
    );
  }

  function supplierOptions(selectedId = "") {
    const state = loadState();
    return state.suppliers
      .map(
        (supplier) =>
          `<option value="${supplier.id}" ${supplier.id === selectedId ? "selected" : ""}>${supplier.number} - ${supplier.raisonSociale}</option>`,
      )
      .join("");
  }

  function openSupplierModal(entry = null) {
    const isEdit = Boolean(entry);
    const state = loadState();
    const current = isEdit ? entry : {};
    const nextNumber = isEdit
      ? current.number
      : nextRef("FRN-", state.suppliers, "number");
    openModal(
      isEdit ? "Modifier fournisseur" : "Créer fournisseur",
      "Formulaire de création et de modification de la fiche fournisseur.",
      `
        <form class="supplier-form-grid" id="supplierForm">
          <div><label>Code fournisseur</label><input name="number" value="${nextNumber}" readonly /></div>
          <div><label>Domaine d'activité</label>
            <select name="domaine">
              ${[
        "Mécanique",
        "Électrique",
        "Hydraulique",
        "Lubrifiants",
        "EPI / Sécurité",
        "Autre",
      ]
        .map(
          (option) =>
            `<option ${current.domaine === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div><label>Nom commercial</label><input name="nomCommercial" value="${current.nomCommercial || ""}" /></div>
          <div><label>Type fournisseur</label>
            <select name="type">
              ${[
        "Fabricant",
        "Distributeur",
        "Prestataire de service",
        "Sous-traitant",
      ]
        .map(
          (option) =>
            `<option ${current.type === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div class="full"><label>Adresse complète</label><input name="adresse" value="${current.adresse || ""}" /></div>
          <div><label>Téléphone principal</label><input name="tel1" value="${current.tel1 || ""}" /></div>
          <div><label>Téléphone secondaire</label><input name="tel2" value="${current.tel2 || ""}" /></div>
          <div><label>Email</label><input name="email" value="${current.email || ""}" /></div>
          <div><label>Site web</label><input name="website" value="${current.website || ""}" /></div>
          <div><label>Poste / Fonction</label><input name="contactRole" value="${current.contact?.role || ""}" /></div>
          <div><label>Email direct</label><input name="contactEmail" value="${current.contact?.email || ""}" /></div>
          <div><label>Numéro RC</label><input name="rc" value="${current.legal?.rc || ""}" /></div>
          <div><label>NIF</label><input name="nif" value="${current.legal?.nif || ""}" /></div>
          <div><label>NIS</label><input name="nis" value="${current.legal?.nis || ""}" /></div>
          <div><label>Article d'imposition</label><input name="articleImposition" value="${current.legal?.articleImposition || ""}" /></div>
          <div class="full"><label>RIB / Coordonnées bancaires</label><input name="rib" value="${current.legal?.rib || ""}" /></div>
          <div><label>Délai de livraison moyen (jours)</label><input name="deliveryDays" type="number" value="${current.deliveryDays || ""}" /></div>
          <div><label>Conditions de paiement</label>
            <select name="paymentTerm">
              ${["Comptant", "30 jours", "60 jours", "Autre"]
        .map(
          (option) =>
            `<option ${current.paymentTerm === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div><label>Devise</label><input name="currency" value="${current.currency || "DZD"}" /></div>
          <div><label>Remise habituelle %</label><input name="discount" type="number" step="0.01" value="${current.discount || 0}" /></div>
          <div class="full"><label>Statut</label>
            <select name="status">
              ${["Actif", "Suspendu", "Blacklisté"]
        .map(
          (option) =>
            `<option ${current.status === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div class="full"><label>Observations</label><textarea name="observations">${current.observations || ""}</textarea></div>
        </form>
      `,
      `
        <div class="supplier-form-footer">
          <button type="button" class="btn btn-outline" data-modal-cancel>Annuler</button>
          <button type="button" class="btn btn-primary" id="supplierSaveBtn">Enregistrer</button>
        </div>
      `,
    );

    const saveBtn = qs("#supplierSaveBtn", root.overlay());
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = qs("#supplierForm", root.overlay());
        if (!form) return;
        const fd = new FormData(form);
        const payload = {
          id: isEdit ? current.id : `sup-${Date.now()}`,
          number: fd.get("number"),
          raisonSociale: current.raisonSociale || "",
          nomCommercial: fd.get("nomCommercial"),
          type: fd.get("type"),
          domaine: fd.get("domaine"),
          adresse: fd.get("adresse"),
          tel1: fd.get("tel1"),
          tel2: fd.get("tel2"),
          email: fd.get("email"),
          website: fd.get("website"),
          contact: {
            role: fd.get("contactRole"),
            email: fd.get("contactEmail"),
          },
          legal: {
            rc: fd.get("rc"),
            nif: fd.get("nif"),
            nis: fd.get("nis"),
            articleImposition: fd.get("articleImposition"),
            rib: fd.get("rib"),
          },
          deliveryDays: Number(fd.get("deliveryDays") || 0),
          paymentTerm: fd.get("paymentTerm"),
          currency: fd.get("currency"),
          discount: Number(fd.get("discount") || 0),
          status: fd.get("status"),
          observations: fd.get("observations"),
          bcCount: current.bcCount || 0,
          totalOrdered: current.totalOrdered || 0,
          avgDeliveryDays: current.avgDeliveryDays || 0,
          conformityRate: current.conformityRate || 0,
          disputes: current.disputes || 0,
          catalogue: current.catalogue || [],
          contracts: current.contracts || [],
          warranties: current.warranties || [],
          evaluations: current.evaluations || [],
        };
        const state = loadState();
        if (isEdit) {
          state.suppliers = state.suppliers.map((supplier) =>
            supplier.id === current.id ? payload : supplier,
          );
        } else {
          state.suppliers.unshift(payload);
        }
        saveState(state);
        closeModal();
        renderPage();
      });
    }
  }

  function openCatalogueModal(entry = null, supplierRef = null) {
    const isEdit = Boolean(entry);
    const state = loadState();
    const currentSupplierId =
      supplierRef?.id || entry?.supplier?.id || state.suppliers[0]?.id || "";
    const current = entry || {};
    openModal(
      isEdit ? "Modifier ligne catalogue" : "Créer ligne catalogue",
      "Formulaire de ligne catalogue fournisseur.",
      `
        <form class="supplier-form-grid" id="catalogueForm">
          <div><label>Fournisseur</label><select name="supplierId">${supplierOptions(currentSupplierId)}</select></div>
          <div><label>Article</label><input name="article" value="${current.article || ""}" /></div>
          <div><label>Référence fournisseur</label><input name="refFourn" value="${current.refFourn || ""}" /></div>
          <div><label>Désignation fournisseur</label><input name="designation" value="${current.designation || ""}" /></div>
          <div><label>Prix unitaire HT</label><input name="price" type="number" step="0.01" value="${current.price || ""}" /></div>
          <div><label>Unité de mesure</label><input name="unit" value="${current.unit || ""}" /></div>
          <div><label>MOQ</label><input name="moq" type="number" value="${current.moq || ""}" /></div>
          <div><label>Délai livraison spécifique</label><input name="leadTime" type="number" value="${current.leadTime || ""}" /></div>
          <div><label>Remise %</label><input name="discount" type="number" step="0.01" value="${current.discount || 0}" /></div>
          <div><label>Disponibilité</label>
            <select name="availability">
              ${["En stock fournisseur", "Sur commande", "Délai spécial"]
        .map(
          (option) =>
            `<option ${current.availability === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div class="full"><label>Observations</label><textarea name="observations">${current.observations || ""}</textarea></div>
        </form>
      `,
      `
        <div class="supplier-form-footer">
          <button type="button" class="btn btn-outline" data-modal-cancel>Annuler</button>
          <button type="button" class="btn btn-primary" id="catalogueSaveBtn">Enregistrer</button>
        </div>
      `,
    );
    const saveBtn = qs("#catalogueSaveBtn", root.overlay());
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = qs("#catalogueForm", root.overlay());
        if (!form) return;
        const fd = new FormData(form);
        const state = loadState();
        const supplier = state.suppliers.find(
          (item) => item.id === fd.get("supplierId"),
        );
        if (!supplier) return;
        const payload = {
          id: isEdit ? current.id : `cat-${Date.now()}`,
          supplierNumber: supplier.number,
          article: fd.get("article"),
          refFourn: fd.get("refFourn"),
          designation: fd.get("designation"),
          price: Number(fd.get("price") || 0),
          unit: fd.get("unit"),
          moq: Number(fd.get("moq") || 0),
          leadTime: Number(fd.get("leadTime") || 0),
          discount: Number(fd.get("discount") || 0),
          availability: fd.get("availability"),
          observations: fd.get("observations"),
          updatedAt: new Date().toISOString(),
        };
        if (!supplier.catalogue) supplier.catalogue = [];
        if (isEdit) {
          supplier.catalogue = supplier.catalogue.map((item) =>
            item.id === current.id ? payload : item,
          );
        } else {
          supplier.catalogue.unshift(payload);
        }
        saveState(state);
        closeModal();
        renderPage();
      });
    }
  }

  function openContractModal(
    stateOverride = null,
    entry = null,
    supplierRef = null,
  ) {
    const state = stateOverride || loadState();
    const isEdit = Boolean(entry);
    const currentSupplierId =
      supplierRef?.id || entry?.supplier?.id || state.suppliers[0]?.id || "";
    const current = entry || {};
    openModal(
      isEdit ? "Modifier contrat" : "Créer contrat",
      "Fiche contrat avec alertes et responsables de suivi.",
      `
        <form class="supplier-form-grid" id="contractForm">
          <div><label>Fournisseur</label><select name="supplierId">${supplierOptions(currentSupplierId)}</select></div>
          <div><label>Type contrat</label>
            <select name="type">
              ${[
        "Contrat cadre",
        "Contrat de maintenance",
        "Garantie équipement",
        "Accord de partenariat",
      ]
        .map(
          (option) =>
            `<option ${current.type === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
          <div><label>Objet du contrat</label><input name="objet" value="${current.objet || ""}" /></div>
          <div><label>Valeur contrat</label><input name="valeur" type="number" step="0.01" value="${current.valeur || ""}" /></div>
          <div><label>Date début</label><input name="debut" type="date" value="${current.debut || ""}" /></div>
          <div><label>Date fin</label><input name="fin" type="date" value="${current.fin || ""}" /></div>
          <div class="full"><label>Conditions</label><textarea name="conditions">${current.conditions || ""}</textarea></div>
          <div><label>Équipements couverts</label><input name="equipmentRefs" value="${Array.isArray(current.equipmentRefs) ? current.equipmentRefs.join(", ") : current.equipmentRefs || ""}" /></div>
          <div><label>Articles couverts</label><input name="articleRefs" value="${Array.isArray(current.articleRefs) ? current.articleRefs.join(", ") : current.articleRefs || ""}" /></div>
          <div><label>Alerte expiration (jours)</label><input name="alertDays" type="number" value="${current.alertDays || 30}" /></div>
          <div><label>Renouvellement auto</label>
            <select name="autoRenew"><option value="yes" ${current.autoRenew ? "selected" : ""}>Oui</option><option value="no" ${current.autoRenew === false ? "selected" : ""}>Non</option></select>
          </div>
          <div><label>Responsable suivi</label><input name="responsible" value="${current.responsible || ""}" /></div>
          <div><label>Documents joints</label><input name="documents" value="${current.documents || ""}" /></div>
          <div class="full"><label>Statut</label>
            <select name="status">
              ${["En cours", "Expiré", "Résilié", "En renouvellement"]
        .map(
          (option) =>
            `<option ${current.status === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
        </form>
      `,
      `
        <div class="supplier-form-footer">
          <button type="button" class="btn btn-outline" data-modal-cancel>Annuler</button>
          <button type="button" class="btn btn-primary" id="contractSaveBtn">Enregistrer</button>
        </div>
      `,
    );
    const saveBtn = qs("#contractSaveBtn", root.overlay());
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = qs("#contractForm", root.overlay());
        if (!form) return;
        const fd = new FormData(form);
        const state = loadState();
        const supplier = state.suppliers.find(
          (item) => item.id === fd.get("supplierId"),
        );
        if (!supplier) return;
        const payload = {
          id: isEdit ? current.id : `ctr-${Date.now()}`,
          number: isEdit
            ? current.number ||
            nextRef("CTR-", supplier.contracts || [], "number")
            : nextRef("CTR-", supplier.contracts || [], "number"),
          supplierNumber: supplier.number,
          type: fd.get("type"),
          objet: fd.get("objet"),
          debut: fd.get("debut"),
          fin: fd.get("fin"),
          valeur: Number(fd.get("valeur") || 0),
          conditions: fd.get("conditions"),
          equipmentRefs: String(fd.get("equipmentRefs") || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          articleRefs: String(fd.get("articleRefs") || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          alertDays: Number(fd.get("alertDays") || 0),
          autoRenew: fd.get("autoRenew") === "yes",
          documents: fd.get("documents"),
          responsible: fd.get("responsible"),
          status: fd.get("status"),
        };
        if (!supplier.contracts) supplier.contracts = [];
        if (isEdit) {
          supplier.contracts = supplier.contracts.map((item) =>
            item.id === current.id ? payload : item,
          );
        } else {
          supplier.contracts.unshift(payload);
        }
        saveState(state);
        closeModal();
        renderPage();
      });
    }
  }

  function openWarrantyModal(
    stateOverride = null,
    entry = null,
    supplierRef = null,
  ) {
    const state = stateOverride || loadState();
    const isEdit = Boolean(entry);
    const currentSupplierId =
      supplierRef?.id || entry?.supplier?.id || state.suppliers[0]?.id || "";
    const current = entry || {};
    openModal(
      isEdit ? "Modifier garantie" : "Créer garantie",
      "Fiche garantie liée à un équipement.",
      `
        <form class="supplier-form-grid" id="warrantyForm">
          <div><label>Équipement</label><input name="equipment" value="${current.equipment || ""}" /></div>
          <div><label>Fournisseur</label><select name="supplierId">${supplierOptions(currentSupplierId)}</select></div>
          <div><label>Date début garantie</label><input name="debut" type="date" value="${current.debut || ""}" /></div>
          <div><label>Durée garantie (mois)</label><input name="durationMonths" type="number" value="${current.durationMonths || ""}" /></div>
          <div><label>Date fin garantie</label><input name="endDate" type="date" value="${current.endDate || ""}" /></div>
          <div class="full"><label>Conditions de garantie</label><textarea name="conditions">${current.conditions || ""}</textarea></div>
          <div><label>Documents</label><input name="documents" value="${current.documents || ""}" /></div>
          <div><label>Statut</label>
            <select name="status">
              ${["En garantie", "Garantie expirée"]
        .map(
          (option) =>
            `<option ${current.status === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
        </form>
      `,
      `
        <div class="supplier-form-footer">
          <button type="button" class="btn btn-outline" data-modal-cancel>Annuler</button>
          <button type="button" class="btn btn-primary" id="warrantySaveBtn">Enregistrer</button>
        </div>
      `,
    );
    const saveBtn = qs("#warrantySaveBtn", root.overlay());
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = qs("#warrantyForm", root.overlay());
        if (!form) return;
        const fd = new FormData(form);
        const state = loadState();
        const supplier = state.suppliers.find(
          (item) => item.id === fd.get("supplierId"),
        );
        if (!supplier) return;
        const durationMonths = Number(fd.get("durationMonths") || 0);
        const start = fd.get("debut");
        const payload = {
          id: isEdit ? current.id : `war-${Date.now()}`,
          supplierNumber: supplier.number,
          equipment: fd.get("equipment"),
          debut: start,
          durationMonths,
          endDate: fd.get("endDate") || calcEndDate(start, durationMonths),
          conditions: fd.get("conditions"),
          documents: fd.get("documents"),
          status: fd.get("status"),
        };
        if (!supplier.warranties) supplier.warranties = [];
        if (isEdit) {
          supplier.warranties = supplier.warranties.map((item) =>
            item.id === current.id ? payload : item,
          );
        } else {
          supplier.warranties.unshift(payload);
        }
        saveState(state);
        closeModal();
        renderPage();
      });
    }
  }

  function calcEndDate(startDate, durationMonths) {
    if (!startDate) return "";
    const date = new Date(startDate);
    if (Number.isNaN(date.getTime())) return "";
    date.setMonth(date.getMonth() + Number(durationMonths || 0));
    return date.toISOString().slice(0, 10);
  }

  function openEvaluationModal(entry = null, supplierRef = null) {
    const isEdit = Boolean(entry);
    const state = loadState();
    const currentSupplierId =
      supplierRef?.id || entry?.supplier?.id || state.suppliers[0]?.id || "";
    const current = entry || {};
    const scoreNames = [
      ["quality", "Qualité des produits"],
      ["delay", "Respect des délais"],
      ["conformity", "Conformité des livraisons"],
      ["sav", "Réactivité / SAV"],
      ["price", "Rapport qualité/prix"],
      ["communication", "Communication"],
    ];
    openModal(
      isEdit ? "Modifier évaluation" : "Créer évaluation",
      "Fiche d'évaluation fournisseur avec note globale calculée.",
      `
        <form class="supplier-form-grid" id="evaluationForm">
          <div><label>Fournisseur</label><select name="supplierId">${supplierOptions(currentSupplierId)}</select></div>
          <div><label>Numéro</label><input name="number" value="${current.number ||
      nextRef(
        "EVL-",
        state.suppliers.flatMap((supplier) => supplier.evaluations || []),
        "number",
      )
      }" readonly /></div>
          <div><label>Période évaluée</label><input name="periode" value="${current.periode || ""}" /></div>
          <div><label>Évaluateur</label><input name="evaluator" value="${current.evaluator || ""}" /></div>
          ${scoreNames
        .map(
          ([field, label]) =>
            `<div><label>${label} (1 à 5)</label><input name="${field}" type="number" min="1" max="5" value="${current.scores?.[field] || ""}" /></div>`,
        )
        .join("")}
          <div class="full"><label>Commentaires</label><textarea name="comments">${current.comments || ""}</textarea></div>
          <div class="full"><label>Actions correctives</label><textarea name="correctiveActions">${current.correctiveActions || ""}</textarea></div>
          <div><label>Recommandation</label>
            <select name="recommendation">
              ${["Fournisseur recommandé", "À surveiller", "À remplacer"]
        .map(
          (option) =>
            `<option ${current.recommendation === option ? "selected" : ""}>${option}</option>`,
        )
        .join("")}
            </select>
          </div>
        </form>
      `,
      `
        <div class="supplier-form-footer">
          <button type="button" class="btn btn-outline" data-modal-cancel>Annuler</button>
          <button type="button" class="btn btn-primary" id="evaluationSaveBtn">Enregistrer</button>
        </div>
      `,
    );
    const saveBtn = qs("#evaluationSaveBtn", root.overlay());
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = qs("#evaluationForm", root.overlay());
        if (!form) return;
        const fd = new FormData(form);
        const state = loadState();
        const supplier = state.suppliers.find(
          (item) => item.id === fd.get("supplierId"),
        );
        if (!supplier) return;
        const scores = {
          quality: Number(fd.get("quality") || 0),
          delay: Number(fd.get("delay") || 0),
          conformity: Number(fd.get("conformity") || 0),
          sav: Number(fd.get("sav") || 0),
          price: Number(fd.get("price") || 0),
          communication: Number(fd.get("communication") || 0),
        };
        const values = Object.values(scores).filter((value) => value > 0);
        const global = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;
        const payload = {
          id: isEdit ? current.id : `evl-${Date.now()}`,
          number: fd.get("number"),
          supplierNumber: supplier.number,
          periode: fd.get("periode"),
          evaluator: fd.get("evaluator"),
          scores,
          global: Number(global.toFixed(2)),
          comments: fd.get("comments"),
          correctiveActions: fd.get("correctiveActions"),
          recommendation: fd.get("recommendation"),
        };
        if (!supplier.evaluations) supplier.evaluations = [];
        if (isEdit) {
          supplier.evaluations = supplier.evaluations.map((item) =>
            item.id === current.id ? payload : item,
          );
        } else {
          supplier.evaluations.unshift(payload);
        }
        saveState(state);
        closeModal();
        renderPage();
      });
    }
  }

  function closeModal() {
    const overlay = root.overlay();
    if (overlay) overlay.innerHTML = "";
  }

  function attachNavigation() {
    const navItem = document.querySelector('[data-page="fournisseurs"]');
    if (navItem) {
      navItem.addEventListener("click", (event) => {
        event.preventDefault();
        document
          .querySelectorAll(".nav-item")
          .forEach((item) => item.classList.remove("active"));
        navItem.classList.add("active");
        activeTab = "fiche";
        renderPage();
      });
    }
    if (location.hash === "#fournisseurs") {
      activeTab = "fiche";
      renderPage();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachNavigation);
  } else {
    attachNavigation();
  }

  window._fournisseurs = { loadState, saveState, seededState, renderPage };
})();
/*
function resetApplicationData() {
  const keys = [
    "maintflow.organizationDirectory",
    "maintflow.articleCatalog",
    "maintflow.purchaseFlow",
    "maintflow.planificationState",
    "maintflow.administrationState",
    "maintflow.stockInventoryState",
    "maintflow.stockInventories",
    "maintflow.stockSelectedInventory",
    "maintflow.stockAlertReads",
    "maintflow.connectedUserId",
    "maintflow.equipmentCatalog",
    "maintflow.organeCatalog",
    "maintflow.demoDataVersion",
    "maintflow.enterpriseProfile",
    "maintflow.stockLedger",
    "maintflow.interventions",
    "maintflow.fournisseurs",
  ];

  keys.forEach((key) => localStorage.removeItem(key));

  location.reload();
}*/
resetDemoDataIfNeeded();
startInterfaceTranslationObserver();
bootstrapRoute();
renderNotifications();
