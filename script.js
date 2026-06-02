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
const planificationStorageKey = "maintflow.planificationState";
const connectedUserStorageKey = "maintflow.connectedUserId";

let renderedNotifications = [];
let organizationModalState = null;
const notifications = [];

const organizationStorageKey = "maintflow.organizationDirectory";
const organizationUsers = [
  {
    id: "user-1",
    name: "Technicien Qualité",
    role: "Qualité",
    email: "technicien.qualite@maintflow.local",
  },
  {
    id: "user-2",
    name: "Responsable Production",
    role: "Production",
    email: "responsable.production@maintflow.local",
  },
  {
    id: "user-3",
    name: "Technicien Maintenance",
    role: "Maintenance",
    email: "technicien.maintenance@maintflow.local",
  },
  {
    id: "user-6",
    name: "Responsable Logistique",
    role: "Logistique",
    email: "responsable.logistique@maintflow.local",
  },
];
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
    subtitle:
      "Gestion des utilisateurs, des rôles, des paramètres globaux et des journaux système",
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
    logs: {
      label: "Journaux système",
      title: "Journaux système",
      body: "Traçabilité complète des actions réalisées dans l'application.",
    },
  },
};

const administrationStorageKey = "maintflow.administrationState";
const administrationRoleCatalog = [
  "Super Admin",
  "Admin",
  "Responsable",
  "Technicien",
  "Magasinier",
  "Acheteur",
  "Demandeur",
  "Consultant",
];
const administrationLanguageOptions = ["fr", "en"];
const administrationCurrencyOptions = ["DZD", "EUR", "USD"];
const administrationPermissionMatrix = [
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
    "Super Admin": administrationPermissionMatrix.reduce((accumulator, row) => {
      accumulator[row.module] = {
        view: true,
        create: true,
        edit: true,
        delete: true,
        validate: true,
      };
      return accumulator;
    }, {}),
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
  users: [
    {
      id: "adm-user-1",
      code: "USR-001",
      firstName: "Amina",
      lastName: "Benali",
      username: "amina.benali",
      passwordHint: "Hashé côté serveur",
      email: "amina.benali@maintflow.local",
      phone: "+213 555 010 101",
      photo: "",
      unit: "Site Nord Production",
      division: "Division Énergie",
      department: "Maintenance électrique",
      role: "Super Admin",
      functionTitle: "Administrateur système",
      language: "Français",
      timezone: "Africa/Algiers",
      status: "Actif",
      createdAt: "2026-05-10T08:30:00.000Z",
      lastLogin: "2026-05-31T08:15:00.000Z",
    },
    {
      id: "adm-user-2",
      code: "USR-002",
      firstName: "Yacine",
      lastName: "Mekki",
      username: "yacine.mekki",
      passwordHint: "Hashé côté serveur",
      email: "yacine.mekki@maintflow.local",
      phone: "+213 555 010 102",
      photo: "",
      unit: "Site Sud Conditionnement",
      division: "Division Process",
      department: "Production",
      role: "Responsable",
      functionTitle: "Responsable maintenance",
      language: "Français",
      timezone: "Africa/Algiers",
      status: "Actif",
      createdAt: "2026-05-14T10:15:00.000Z",
      lastLogin: "2026-05-30T16:50:00.000Z",
    },
    {
      id: "adm-user-3",
      code: "USR-003",
      firstName: "Nadia",
      lastName: "Khellaf",
      username: "nadia.khellaf",
      passwordHint: "Hashé côté serveur",
      email: "nadia.khellaf@maintflow.local",
      phone: "+213 555 010 103",
      photo: "",
      unit: "Site Nord Production",
      division: "Division Process",
      department: "Maintenance process",
      role: "Technicien",
      functionTitle: "Technicien",
      language: "Arabe",
      timezone: "Africa/Algiers",
      status: "Actif",
      createdAt: "2026-05-18T07:45:00.000Z",
      lastLogin: "2026-05-31T07:12:00.000Z",
    },
    {
      id: "adm-user-4",
      code: "USR-004",
      firstName: "Sami",
      lastName: "Boudiaf",
      username: "sami.boudiaf",
      passwordHint: "Hashé côté serveur",
      email: "sami.boudiaf@maintflow.local",
      phone: "+213 555 010 104",
      photo: "",
      unit: "Site Sud Conditionnement",
      division: "Division Logistique",
      department: "Magasin",
      role: "Magasinier",
      functionTitle: "Gestionnaire stock",
      language: "Français",
      timezone: "Africa/Algiers",
      status: "Suspendu",
      createdAt: "2026-05-19T09:20:00.000Z",
      lastLogin: "2026-05-27T11:40:00.000Z",
    },
  ],
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
    numbering: {
      diPrefix: "DI",
      otPrefix: "OT",
      btPrefix: "BT",
      daPrefix: "DA",
      bcPrefix: "BC",
      recPrefix: "REC",
      plnPrefix: "PLN",
      cptPrefix: "CPT",
      frnPrefix: "FRN",
      ctrPrefix: "CTR",
      digits: "3",
      resetPolicy: "Annuelle",
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
  logs: [
    {
      id: "log-1",
      date: "2026-05-31T08:21:00.000Z",
      user: "Amina Benali",
      action: "Connexion",
      module: "Administration",
      record: "USR-001",
      detail: "Connexion réussie depuis le poste d'administration.",
      before: "—",
      after: "Session ouverte",
    },
    {
      id: "log-2",
      date: "2026-05-30T15:42:00.000Z",
      user: "Yacine Mekki",
      action: "Création enregistrement",
      module: "Organisation",
      record: "DIV-004",
      detail: "Division créée avec rattachement à deux sites.",
      before: "—",
      after: "Division Énergie 2",
    },
    {
      id: "log-3",
      date: "2026-05-29T10:11:00.000Z",
      user: "Nadia Khellaf",
      action: "Modification enregistrement",
      module: "Stock",
      record: "STK-102",
      detail: "Mise à jour de la quantité mini et du seuil de sécurité.",
      before: "Min 20 / Sécurité 10",
      after: "Min 15 / Sécurité 8",
    },
    {
      id: "log-4",
      date: "2026-05-28T17:55:00.000Z",
      user: "Sami Boudiaf",
      action: "Export données",
      module: "Achats",
      record: "HIST-ACH-2026-05",
      detail: "Export CSV de l'historique des achats.",
      before: "—",
      after: "Fichier exporté",
    },
  ],
};

let administrationUserDraftId = null;
let administrationLogFilters = {
  user: "",
  module: "",
  action: "",
  from: "",
  to: "",
};

const planificationTechniciens = [
  {
    id: "tech-1",
    name: "Responsable Maintenance",
    role: "Responsable",
    email: "responsable.maintenance@maintflow.local",
  },
  {
    id: "tech-2",
    name: "Technicien Mécanique",
    role: "Mécanique",
    email: "technicien.mecanique@maintflow.local",
  },
  {
    id: "tech-3",
    name: "Technicien Instrumentation",
    role: "Instrumentation",
    email: "technicien.instrumentation@maintflow.local",
  },
];

const planificationDefaults = {
  view: "mensuelle",
  plans: [
    {
      id: "plan-1",
      ref: "PLN-001",
      title: "Révision préventive TGBT Atlas",
      planType: "Systématique",
      maintenanceType: "Préventive",
      frequency: "Mensuelle",
      equipment: "EQP-101",
      organ: "ORG-103",
      technicianId: "tech-2",
      durationHours: 4,
      status: "Actif",
      triggerMode: "Période fixe",
      triggerLabel: "Tous les 30 jours",
      nextDueDate: "2026-06-12T08:00:00.000Z",
      alertThreshold: "7 jours avant échéance",
      actionThreshold: "OT planifié automatique",
      articles: ["Fusible NH", "Nettoyant contact"],
      tasks: [
        "Consigner l'équipement et sécuriser la zone.",
        "Contrôler les protections, serrages et échauffements.",
        "Remplacer les consommables et tracer les mesures.",
      ],
      safety: ["Consignation requise", "EPI nécessaires", "Permis de travail"],
      documents: [
        "Fiche technique TGBT Atlas",
        "Procédure maintenance énergie",
      ],
    },
    {
      id: "plan-2",
      ref: "PLN-002",
      title: "Surveillance conditionnelle convoyeur emballage",
      planType: "Conditionnel",
      maintenanceType: "Réglementaire",
      frequency: "—",
      equipment: "EQP-103",
      organ: "ORG-101",
      technicianId: "tech-1",
      durationHours: 2,
      status: "Actif",
      triggerMode: "Compteur",
      triggerLabel: "Seuil à 450 h",
      nextDueDate: "2026-06-05T14:00:00.000Z",
      alertThreshold: "400 h",
      actionThreshold: "450 h",
      compteurId: "CPT-101",
      articles: ["Graisse de roulement", "Capteur vibratoire"],
      tasks: [
        "Vérifier le compteur d'heures de fonctionnement.",
        "Inspecter les galets et l'alignement du convoyeur.",
        "Générer l'OT si le seuil action est dépassé.",
      ],
      safety: ["Consignation requise", "EPI nécessaires"],
      documents: ["Note de calcul seuil", "Plan de graissage convoyeur"],
    },
    {
      id: "plan-3",
      ref: "PLN-003",
      title: "Inspection prédictive pompe de refroidissement R1",
      planType: "Prédictif",
      maintenanceType: "Prédictive",
      frequency: "—",
      equipment: "EQP-102",
      organ: "ORG-102",
      technicianId: "tech-3",
      durationHours: 1.5,
      status: "Inactif",
      triggerMode: "Seuil mesure",
      triggerLabel: "Température > 85 °C",
      nextDueDate: "2026-06-28T11:00:00.000Z",
      alertThreshold: "80 °C",
      actionThreshold: "85 °C",
      articles: ["Sonde température", "Joints mécaniques"],
      tasks: [
        "Relever la mesure et comparer au seuil.",
        "Analyser la tendance sur l'historique de relevés.",
        "Planifier une intervention si la dérive se confirme.",
      ],
      safety: ["Consignation requise"],
      documents: ["Rapport de tendance", "Fiche instrument de mesure"],
    },
  ],
  counters: [
    {
      id: "counter-1",
      ref: "CPT-101",
      name: "Heures convoyeur emballage",
      equipment: "EQP-103",
      organ: "ORG-101",
      type: "Heures de fonctionnement",
      unit: "h",
      currentValue: 462,
      initialValue: 0,
      alertThreshold: 400,
      actionThreshold: 450,
      planId: "plan-2",
      lastUpdate: "2026-05-30T07:45:00.000Z",
    },
    {
      id: "counter-2",
      ref: "CPT-102",
      name: "Température armoire TGBT",
      equipment: "EQP-101",
      organ: "ORG-103",
      type: "Nombre d'opérations",
      unit: "°C",
      currentValue: 78,
      initialValue: 68,
      alertThreshold: 75,
      actionThreshold: 80,
      planId: "plan-1",
      lastUpdate: "2026-05-29T16:10:00.000Z",
    },
    {
      id: "counter-3",
      ref: "CPT-103",
      name: "Heures pompe R1",
      equipment: "EQP-102",
      organ: "ORG-102",
      type: "Mesure physique",
      unit: "h",
      currentValue: 2150,
      initialValue: 2000,
      alertThreshold: 2000,
      actionThreshold: 2200,
      planId: "plan-3",
      lastUpdate: "2026-05-30T06:20:00.000Z",
    },
  ],
  readings: [
    {
      id: "reading-1",
      counterId: "counter-1",
      ref: "CPT-101",
      value: 462,
      date: "2026-05-30T07:45:00.000Z",
      createdBy: "Utilisateur connecté",
      observations: "Relevé automatique depuis supervision locale.",
      otGenerated: false,
    },
    {
      id: "reading-2",
      counterId: "counter-3",
      ref: "CPT-103",
      value: 2150,
      date: "2026-05-30T06:20:00.000Z",
      createdBy: "Utilisateur connecté",
      observations: "Valeur au-dessus de l'alerte mais sous l'action.",
      otGenerated: false,
    },
  ],
  scheduledOrders: [
    {
      id: "sot-1",
      ref: "OT-PLN-2001",
      sourceType: "Plan",
      sourceRef: "PLN-001",
      title: "Révision préventive TGBT Atlas",
      status: "Planifié",
      priority: "Haute",
      scheduledDate: "2026-06-12T08:00:00.000Z",
      technician: "Technicien Mécanique",
      equipment: "EQP-101",
      calendarView: "Mensuelle",
    },
    {
      id: "sot-2",
      ref: "OT-PLN-2002",
      sourceType: "Compteur",
      sourceRef: "CPT-101",
      title: "Contrôle compteur convoyeur emballage",
      status: "En cours",
      priority: "Critique",
      scheduledDate: "2026-06-03T14:00:00.000Z",
      technician: "Responsable Maintenance",
      equipment: "EQP-103",
      calendarView: "Hebdomadaire",
    },
    {
      id: "sot-3",
      ref: "OT-PLN-2003",
      sourceType: "Plan",
      sourceRef: "PLN-003",
      title: "Inspection prédictive pompe de refroidissement R1",
      status: "En retard",
      priority: "Moyenne",
      scheduledDate: "2026-05-26T11:00:00.000Z",
      technician: "Technicien Instrumentation",
      equipment: "EQP-102",
      calendarView: "Liste",
    },
  ],
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
  divisions: {
    label: "Divisions",
    title: "Divisions",
    body: "Gestion des divisions avec liaison multi-unités.",
  },
  "departements-services": {
    label: "Départements",
    title: "Départements",
    body: "Gestion des départements avec liaison multi-divisions.",
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
    unites: [
      {
        id: "unit-1",
        code: "UNI-001",
        name: "Unité Nord Production",
        responsibleUserId: "user-2",
        responsibleEmail: "responsable.production@maintflow.local",
        description: "Unité principale de production et d'assemblage",
      },
      {
        id: "unit-2",
        code: "UNI-002",
        name: "Unité Sud Conditionnement",
        responsibleUserId: "user-6",
        responsibleEmail: "responsable.logistique@maintflow.local",
        description: "Unité dédiée au conditionnement et à la logistique",
      },
    ],
    divisions: [
      {
        id: "division-1",
        code: "DIV-001",
        name: "Division Énergie",
        unitIds: ["unit-1"],
        responsibleUserId: "user-3",
        responsibleEmail: "technicien.maintenance@maintflow.local",
        description: "Gestion de la distribution électrique et des utilités",
      },
      {
        id: "division-2",
        code: "DIV-002",
        name: "Division Process",
        unitIds: ["unit-1", "unit-2"],
        responsibleUserId: "user-2",
        responsibleEmail: "responsable.production@maintflow.local",
        description: "Lignes de production et équipements de process",
      },
      {
        id: "division-3",
        code: "DIV-003",
        name: "Division Logistique",
        unitIds: ["unit-2"],
        responsibleUserId: "user-6",
        responsibleEmail: "responsable.logistique@maintflow.local",
        description: "Convoyage, stockage et expédition",
      },
    ],
    departmentServices: [
      {
        id: "department-1",
        code: "DEP-001",
        kind: "Département",
        name: "Département Maintenance",
        divisionIds: ["division-1"],
        responsibleUserId: "user-3",
        responsibleEmail: "technicien.maintenance@maintflow.local",
        description: "Maintenance préventive et corrective des utilités",
      },
      {
        id: "department-2",
        code: "DEP-002",
        kind: "Département",
        name: "Département Production",
        divisionIds: ["division-2"],
        responsibleUserId: "user-2",
        responsibleEmail: "responsable.production@maintflow.local",
        description: "Suivi des équipements de production",
      },
      {
        id: "department-3",
        code: "DEP-003",
        kind: "Département",
        name: "Département Logistique",
        divisionIds: ["division-3"],
        responsibleUserId: "user-6",
        responsibleEmail: "responsable.logistique@maintflow.local",
        description: "Flux de convoyage, stockage et expédition",
      },
    ],
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
    demandes: [
      {
        id: "da-1",
        number: "DA-001",
        createdAt: "2026-05-25T08:10:00.000Z",
        requester: "Responsable Maintenance",
        origin: "Manuelle",
        status: "Validée",
        articleId: "",
        articleLabel: "Roulement 6205 ZZ",
        quantity: 6,
        preferredSupplier: "MecaParts Algérie",
        reason: "Remplacement préventif sur convoyeur ligne 2",
        neededDate: "2026-06-05",
      },
      {
        id: "da-2",
        number: "DA-002",
        createdAt: "2026-05-27T09:00:00.000Z",
        requester: "Technicien Stock",
        origin: "Stock automatique",
        status: "Brouillon",
        articleId: "",
        articleLabel: "Fusible NH 125A",
        quantity: 12,
        preferredSupplier: "ElectroPro Distribution",
        reason: "Seuil minimum atteint en magasin central",
        neededDate: "2026-06-03",
      },
    ],
    bons: [
      {
        id: "bc-1",
        number: "BC-001",
        createdAt: "2026-05-28T10:30:00.000Z",
        orderDate: "2026-05-29",
        wantedDate: "2026-06-06",
        supplierName: "MecaParts Algérie",
        supplierPhone: "+213 555 20 20 20",
        supplierEmail: "contact@mecaparts.dz",
        articleId: "",
        articleLabel: "Roulement 6205 ZZ",
        supplierRef: "MP-6205-ZZ",
        quantity: 6,
        unitPrice: 1200,
        discountPercent: 5,
        lineTotalHt: 6840,
        totalHt: 6840,
        tvaPercent: 19,
        shippingCost: 1200,
        totalTtc: 9339.6,
        paymentTerm: "30 jours",
        deliveryAddress: "Site Nord Production - Magasin central",
        deliveryMode: "Transport fournisseur",
        observations: "Confirmer disponibilité avant expédition.",
        attachments: "Devis MP-2026-178",
        status: "Envoyé au fournisseur",
        linkedDaIds: ["da-1"],
      },
    ],
    receptions: [
      {
        id: "rec-1",
        number: "REC-001",
        createdAt: "2026-05-30T14:20:00.000Z",
        bcId: "bc-1",
        receiver: achatsCurrentUser,
        supplierName: "MecaParts Algérie",
        articleId: "",
        articleLabel: "Roulement 6205 ZZ",
        orderedQty: 6,
        receivedQty: 4,
        missingQty: 2,
        receptionState: "Conforme",
        qualityControl: "Partiellement conforme",
        storageLocation: "Magasin central / A2 / E1 / C5",
        deliveryNoteRef: "BL-7741",
        invoiceRef: "FAC-1198",
        observations: "2 unités restantes annoncées pour la semaine prochaine.",
        status: "Partielle",
      },
    ],
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
  groups: [
    {
      id: "article-group-1",
      code: "AGR-101",
      name: "Consommables techniques",
      designations: "Lubrifiants, nettoyants et consommables de maintenance",
      associatedOrganeIds: ["organe-2"],
    },
    {
      id: "article-group-2",
      code: "AGR-102",
      name: "Pièces mécaniques",
      designations: "Roulements, joints et ensembles mécaniques",
      associatedOrganeIds: ["organe-1"],
    },
    {
      id: "article-group-3",
      code: "AGR-103",
      name: "Instrumentation",
      designations: "Capteurs, contrôle et instrumentation terrain",
      associatedOrganeIds: ["organe-3"],
    },
  ],
  families: [
    {
      id: "article-family-1",
      code: "AFM-101",
      groupId: "article-group-1",
      name: "Lubrifiants",
      designations: "Huiles et graisses techniques",
    },
    {
      id: "article-family-2",
      code: "AFM-102",
      groupId: "article-group-1",
      name: "Étanchéité",
      designations: "Joints, presse-étoupes et accessoires",
    },
    {
      id: "article-family-3",
      code: "AFM-103",
      groupId: "article-group-2",
      name: "Roulements",
      designations: "Roulements standards",
    },
    {
      id: "article-family-4",
      code: "AFM-104",
      groupId: "article-group-3",
      name: "Capteurs",
      designations: "Instrumentation de suivi et de contrôle",
    },
  ],
  articles: [
    {
      id: "article-1",
      code: "ART-101",
      name: "Huile synthétique ISO VG 68",
      reference: "HL-68-500",
      brand: "LubriCo",
      price: "62.00",
      quantity: "18",
      groupId: "article-group-1",
      familyId: "article-family-1",
      articleType: "consommable",
      unitMeasure: "L",
      supplier: "HydroServices",
      substituteIds: ["article-3"],
      designations: "Lubrification des réducteurs et paliers.",
      createdAt: "2026-05-28T09:15:00.000Z",
      createdById: "user-3",
      createdBy: "Technicien Maintenance",
      photos: [],
    },
    {
      id: "article-2",
      code: "ART-102",
      name: "Roulement 6205 ZZ",
      reference: "RB-6205-ZZ",
      brand: "SKF",
      price: "18.90",
      quantity: "36",
      groupId: "article-group-2",
      familyId: "article-family-3",
      articleType: "piece-rechange",
      unitMeasure: "Pièce",
      supplier: "BearingPro",
      substituteIds: ["article-4"],
      designations: "Roulement principal pour convoyeur et motorisation.",
      createdAt: "2026-05-28T10:30:00.000Z",
      createdById: "user-1",
      createdBy: "Technicien Qualité",
      photos: [],
    },
    {
      id: "article-3",
      code: "ART-103",
      name: "Joint mécanique R1",
      reference: "JM-R1-210",
      brand: "FlowSeal",
      price: "74.00",
      quantity: "14",
      groupId: "article-group-1",
      familyId: "article-family-2",
      articleType: "piece-rechange",
      unitMeasure: "Pièce",
      supplier: "HydroServices",
      substituteIds: ["article-1"],
      designations: "Joint d'étanchéité pour pompe de refroidissement.",
      createdAt: "2026-05-28T11:00:00.000Z",
      createdById: "user-2",
      createdBy: "Responsable Production",
      photos: [],
    },
    {
      id: "article-4",
      code: "ART-104",
      name: "Capteur de vibration",
      reference: "CV-450",
      brand: "IFM",
      price: "145.00",
      quantity: "8",
      groupId: "article-group-3",
      familyId: "article-family-4",
      articleType: "outil",
      unitMeasure: "Pièce",
      supplier: "ElectroPlus",
      substituteIds: [],
      designations: "Capteur de diagnostic pour surveillance conditionnelle.",
      createdAt: "2026-05-28T11:30:00.000Z",
      createdById: "user-6",
      createdBy: "Responsable Logistique",
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
      code: "GRP-101",
      name: "Groupe énergie",
      designations: "Distribution électrique, automatisme et alimentation",
      divisionIds: ["division-1"],
    },
    {
      id: "equipment-group-2",
      code: "GRP-102",
      name: "Groupe process",
      designations: "Pompage, circulation et traitement des fluides",
      divisionIds: ["division-2"],
    },
    {
      id: "equipment-group-3",
      code: "GRP-103",
      name: "Groupe logistique",
      designations: "Convoyage, levage et lignes de transfert",
      divisionIds: ["division-2", "division-3"],
    },
  ],
  families: [
    {
      id: "equipment-family-1",
      code: "FAM-101",
      groupId: "equipment-group-1",
      name: "Armoire électrique",
      designations: "Tableaux, armoires et protection",
    },
    {
      id: "equipment-family-2",
      code: "FAM-102",
      groupId: "equipment-group-1",
      name: "Moteur électrique",
      designations: "Moteurs, variateurs et démarrage",
    },
    {
      id: "equipment-family-3",
      code: "FAM-103",
      groupId: "equipment-group-2",
      name: "Pompe industrielle",
      designations: "Pompes de process et circulation",
    },
    {
      id: "equipment-family-4",
      code: "FAM-104",
      groupId: "equipment-group-3",
      name: "Convoyeur",
      designations: "Convoyeurs et lignes de transfert",
    },
  ],
  equipments: [
    {
      id: "equipment-1",
      code: "EQP-101",
      name: "TGBT Atlas",
      groupId: "equipment-group-1",
      familyId: "equipment-family-1",
      brand: "Schneider",
      supplier: "ElectroPlus",
      serialNumber: "SER-AT-101",
      criticality: "Critique",
      purchasePrice: "128500",
      purchaseDate: "2025-02-10",
      serviceDate: "2025-02-21",
      warrantyDuration: "24 mois",
      status: "En service",
      designations: "Alimentation générale du site nord.",
      photos: [],
      documents: [],
    },
    {
      id: "equipment-2",
      code: "EQP-102",
      name: "Pompe de refroidissement R1",
      groupId: "equipment-group-2",
      familyId: "equipment-family-3",
      brand: "Grundfos",
      supplier: "HydroServices",
      serialNumber: "SER-RF-204",
      criticality: "Haute",
      purchasePrice: "84600",
      purchaseDate: "2024-11-08",
      serviceDate: "2024-11-22",
      warrantyDuration: "18 mois",
      status: "En maintenance",
      designations: "Pompage du circuit de refroidissement principal.",
      photos: [],
      documents: [],
    },
    {
      id: "equipment-3",
      code: "EQP-103",
      name: "Convoyeur ligne emballage",
      groupId: "equipment-group-3",
      familyId: "equipment-family-4",
      brand: "SEW",
      supplier: "MecaLine",
      serialNumber: "SER-LB-330",
      criticality: "Moyenne",
      purchasePrice: "56200",
      purchaseDate: "2024-08-14",
      serviceDate: "2024-09-01",
      warrantyDuration: "12 mois",
      status: "En service",
      designations: "Convoyeur de transfert vers la zone d'emballage.",
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
      code: "GOR-101",
      name: "Groupe transmission",
      designations: "Roulements, accouplements et transmission mécanique",
      associatedEquipmentIds: ["equipment-3"],
    },
    {
      id: "organe-group-2",
      code: "GOR-102",
      name: "Groupe pompage",
      designations: "Organes hydrauliques et étanchéité",
      associatedEquipmentIds: ["equipment-2"],
    },
    {
      id: "organe-group-3",
      code: "GOR-103",
      name: "Groupe commande",
      designations: "Commande électrique, contacteurs et protection",
      associatedEquipmentIds: ["equipment-1"],
    },
  ],
  families: [
    {
      id: "organe-family-1",
      code: "FGO-101",
      groupId: "organe-group-1",
      name: "Roulement",
      designations: "Roulements, paliers et supports",
    },
    {
      id: "organe-family-2",
      code: "FGO-102",
      groupId: "organe-group-1",
      name: "Accouplement",
      designations: "Accouplements et éléments de liaison",
    },
    {
      id: "organe-family-3",
      code: "FGO-103",
      groupId: "organe-group-2",
      name: "Garniture mécanique",
      designations: "Étanchéité de pompes et circuits",
    },
    {
      id: "organe-family-4",
      code: "FGO-104",
      groupId: "organe-group-3",
      name: "Contacteur",
      designations: "Protection et commande des moteurs",
    },
  ],
  organes: [
    {
      id: "organe-1",
      code: "ORG-101",
      name: "Roulement convoyeur emballage",
      groupId: "organe-group-1",
      familyId: "organe-family-1",
      criticality: "Haute",
      brand: "SKF",
      supplier: "BearingPro",
      serialNumber: "ORG-SER-101",
      purchasePrice: "9200",
      purchaseDate: "2025-03-12",
      serviceDate: "2025-03-26",
      warrantyDuration: "12 mois",
      status: "En service",
      photos: [],
      documents: [],
    },
    {
      id: "organe-2",
      code: "ORG-102",
      name: "Garniture mécanique pompe R1",
      groupId: "organe-group-2",
      familyId: "organe-family-3",
      criticality: "Critique",
      brand: "FlowSeal",
      supplier: "HydroServices",
      serialNumber: "ORG-SER-204",
      purchasePrice: "13600",
      purchaseDate: "2024-12-09",
      serviceDate: "2024-12-21",
      warrantyDuration: "18 mois",
      status: "En maintenance",
      photos: [],
      documents: [],
    },
    {
      id: "organe-3",
      code: "ORG-103",
      name: "Contacteur principal TGBT Atlas",
      groupId: "organe-group-3",
      familyId: "organe-family-4",
      criticality: "Haute",
      brand: "Schneider",
      supplier: "ElectroPlus",
      serialNumber: "ORG-SER-303",
      purchasePrice: "7400",
      purchaseDate: "2025-01-18",
      serviceDate: "2025-02-01",
      warrantyDuration: "12 mois",
      status: "En service",
      photos: [],
      documents: [],
    },
  ],
};

const demoDataVersionKey = "maintflow.demoDataVersion";
const demoDataVersion = "2026-05-30-v1";

function resetDemoDataIfNeeded() {
  try {
    const storedVersion = window.localStorage.getItem(demoDataVersionKey);
    if (storedVersion === demoDataVersion) return;

    const organizationSeed = buildOrganizationSeedState();
    const equipmentSeed = JSON.parse(JSON.stringify(equipmentDefaults));
    const organeSeed = JSON.parse(JSON.stringify(organeDefaults));
    const articleSeed = JSON.parse(JSON.stringify(articleDefaults));

    window.localStorage.removeItem("maintflow.organizationDirectory");
    window.localStorage.removeItem("maintflow.equipmentCatalog");
    window.localStorage.removeItem("maintflow.organeCatalog");
    window.localStorage.removeItem("maintflow.articleCatalog");
    window.localStorage.removeItem("maintflow.stockLedger");
    window.localStorage.removeItem("maintflow.interventions");
    window.localStorage.removeItem("maintflow.planificationState");
    window.localStorage.removeItem("maintflow.stockInventoryState");
    window.localStorage.removeItem("maintflow.stockAlertReads");
    window.localStorage.removeItem("maintflow.enterpriseProfile");

    window.localStorage.setItem(
      "maintflow.organizationDirectory",
      JSON.stringify(organizationSeed),
    );
    window.localStorage.setItem(
      "maintflow.equipmentCatalog",
      JSON.stringify(equipmentSeed),
    );
    window.localStorage.setItem(
      "maintflow.organeCatalog",
      JSON.stringify(organeSeed),
    );
    window.localStorage.setItem(
      "maintflow.articleCatalog",
      JSON.stringify(articleSeed),
    );
    window.localStorage.setItem(
      "maintflow.stockLedger",
      JSON.stringify({ records: getDefaultStockRecords(), movements: [] }),
    );
    window.localStorage.setItem(
      "maintflow.interventions",
      JSON.stringify(buildInterventionsSeedState()),
    );
    window.localStorage.setItem(
      "maintflow.planificationState",
      JSON.stringify(JSON.parse(JSON.stringify(planificationDefaults))),
    );
    window.localStorage.setItem(
      "maintflow.stockInventoryState",
      JSON.stringify({
        status: "Ouvert",
        closedAt: "",
        inventoryId: "INV-001",
        openCount: 0,
        closedBy: "",
      }),
    );
    window.localStorage.setItem("maintflow.stockAlertReads", "[]");
    window.localStorage.setItem(
      "maintflow.enterpriseProfile",
      JSON.stringify(enterpriseDefaults),
    );
    window.localStorage.setItem(demoDataVersionKey, demoDataVersion);
  } catch (error) {
    // ignore storage errors
  }
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
          : buildOrganizationSeedState().departmentServices,
      };
    }

    if (
      !directory.unites.length &&
      !directory.divisions.length &&
      !directory.departmentServices.length
    ) {
      const seedState = buildOrganizationSeedState();
      try {
        window.localStorage.setItem(
          organizationStorageKey,
          JSON.stringify(seedState),
        );
      } catch (error) {}
      return seedState;
    }
  } catch (error) {
    const seedState = buildOrganizationSeedState();
    try {
      window.localStorage.setItem(
        organizationStorageKey,
        JSON.stringify(seedState),
      );
    } catch (storageError) {}
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
    "Départements",
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
          <h2>Départements</h2>
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
        groups: Array.isArray(parsed.groups)
          ? parsed.groups.map((group) => {
              const { departmentIds, ...rest } = group;
              return {
                ...rest,
                divisionIds: Array.isArray(group.divisionIds)
                  ? group.divisionIds
                  : Array.isArray(group.departmentIds)
                    ? group.departmentIds
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
          <label for="equipmentGroupDivisions">Divisions associées</label>
          <select id="equipmentGroupDivisions" name="divisionIds" multiple size="5">
            ${buildDivisionLinkOptions(record?.divisionIds || [])}
          </select>
          <div class="org-field-hint">Maintenez Ctrl ou Cmd pour sélectionner plusieurs divisions.</div>
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
      <div class="org-detail-item org-detail-item--full"><span>Divisions associées</span><strong>${joinRecordLabels(getOrganizationRecords("divisions"), record.divisionIds || [], (division) => `${division.code} — ${division.name}`)}</strong></div>
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
              <td class="muted">${joinRecordLabels(getOrganizationRecords("divisions"), group.divisionIds || [], (division) => `${division.code} — ${division.name}`)}</td>
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
          <p>Chaque groupe associe plusieurs divisions et sert de base aux familles puis aux équipements.</p>
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
        label: "Divisions liées",
        value: String(
          directory.groups.reduce(
            (total, group) => total + (group.divisionIds || []).length,
            0,
          ),
        ),
        note: "Association multi-divisions",
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
        divisionIds: getSelectedValues(
          form.querySelector("select[name='divisionIds']"),
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

function getArboDivisionChildren(division, datasets) {
  const groups = datasets.equipmentGroups.filter((group) =>
    (group.divisionIds || []).includes(division.id),
  );

  const buildEquipmentBranch = (group) => {
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
  };

  const departmentNodes = datasets.departmentServices
    .filter((department) =>
      (department.divisionIds || []).includes(division.id),
    )
    .map((department) =>
      buildArboNode(
        `arbo-department-${department.id}`,
        `${department.code} - ${department.name}`,
        "fa-folder-open",
        groups.map((group) => buildEquipmentBranch(group)),
      ),
    );

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
    departmentServices: organization.departmentServices,
  };

  const unitNodes = organization.unites.map((unit) => {
    const divisionNodes = organization.divisions
      .filter((division) => (division.unitIds || []).includes(unit.id))
      .map((division) => {
        return buildArboNode(
          `arbo-division-${unit.id}__${division.id}`,
          `${division.code} - ${division.name}`,
          "fa-diagram-project",
          getArboDivisionChildren(division, datasets),
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
      greetingMain: "Bonjour,الهايشة 🐮",
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
      greetingMain: "Hello,الهايشة 🐮",
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
    ["Bonjour,الهايشة 🐮", branch.topbar.greetingMain],
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
              <strong>Super Admin</strong>
              <span class="status-badge badge-warning">Accès total</span>
            </div>
            <p>Contrôle complet de tous les modules, de la configuration et des données.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Admin</strong>
              <span class="status-badge badge-info">Quasi total</span>
            </div>
            <p>Tout sauf les actions réservées au Super Admin, notamment la hiérarchie de sécurité.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Responsable</strong>
              <span class="status-badge badge-success">Voir + créer + modifier + valider</span>
            </div>
            <p>Profil d'exploitation pour les responsables de service et les validateurs.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Technicien</strong>
              <span class="status-badge badge-gray">Opérations terrain</span>
            </div>
            <p>Lecture large et création des DI/BT avec modification des OT affectés.</p>
          </article>
          <article class="admin-role-card locked">
            <div class="admin-role-card-head">
              <strong>Magasinier</strong>
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
            <div class="equipment-section-kicker">Numérotation</div>
            <h3>Préfixes automatiques</h3>
            <p>Réglage des préfixes, du nombre de chiffres et du reset de séquence.</p>
          </div>
        </div>
        <div class="org-form-grid">
          ${[
            ["diPrefix", "DI"],
            ["otPrefix", "OT"],
            ["btPrefix", "BT"],
            ["daPrefix", "DA"],
            ["bcPrefix", "BC"],
            ["recPrefix", "REC"],
            ["plnPrefix", "PLN"],
            ["cptPrefix", "CPT"],
            ["frnPrefix", "FRN"],
            ["ctrPrefix", "CTR"],
          ]
            .map(
              ([key, label]) => `
                <div class="field-group">
                  <label for="admin${label}Prefix">${label}</label>
                  <input id="admin${label}Prefix" type="text" value="${escapeHtml(settings.numbering[key])}" />
                </div>
              `,
            )
            .join("")}
          <div class="field-group">
            <label for="adminNumberDigits">Nombre de chiffres</label>
            <select id="adminNumberDigits">
              ${["3", "4", "5"].map((digits) => `<option value="${digits}"${settings.numbering.digits === digits ? " selected" : ""}>${digits}</option>`).join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="adminResetPolicy">Remise à zéro</label>
            <select id="adminResetPolicy">
              ${["Annuelle", "Jamais"].map((policy) => `<option value="${policy}"${settings.numbering.resetPolicy === policy ? " selected" : ""}>${policy}</option>`).join("")}
            </select>
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
            ${
              filteredLogs
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

  if (activeSubpageKey === "logs") {
    return buildAdministrationLogsSection(state);
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

  if (activeSubpageKey === "logs") {
    pageActionsEl.innerHTML = `
      <button class="btn btn-outline" type="button" data-admin-export-logs>
        <i class="fa-solid fa-file-csv"></i>
        <span>${localizeAdministrationText("Exporter CSV", state)}</span>
      </button>
      <button class="btn btn-primary" type="button" data-admin-print-logs>
        <i class="fa-solid fa-print"></i>
        <span>${localizeAdministrationText("Imprimer / PDF", state)}</span>
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
  const saveButton = pageActionsEl
    ? pageActionsEl.querySelector("[data-admin-settings-save]")
    : null;

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
        form.querySelector("#adminDefaultLanguage")?.value ||
        nextState.settings.defaultLanguage,
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

function getDashboardKpis() {
  const interventionDirectory = loadInterventionsState();
  const equipmentDirectory = getEquipmentDirectory();
  const articleDirectory = getArticleDirectory();
  const stockAlerts = getStockAlerts();

  const openInterventions =
    interventionDirectory.dis.filter(
      (item) => !["Validée", "Rejetée", "Annulée"].includes(item.status),
    ).length +
    interventionDirectory.ots.filter(
      (item) => !["Terminé", "Clôturé", "Validé"].includes(item.status),
    ).length +
    interventionDirectory.bts.filter(
      (item) => !["Validé", "Clôturé"].includes(item.status),
    ).length;

  return [
    {
      label: "Interventions ouvertes",
      value: String(openInterventions),
      footer: "DI, OT et BT actifs",
      icon: "fa-screwdriver-wrench",
      iconClass: "blue",
      trendClass: "flat",
      trendIcon: "fa-minus",
      trendValue: "Suivi",
    },
    {
      label: "Équipements",
      value: String(equipmentDirectory.equipments.length),
      footer: `${equipmentDirectory.groups.length} groupes`,
      icon: "fa-gears",
      iconClass: "orange",
      trendClass: "flat",
      trendIcon: "fa-minus",
      trendValue: "Catalogue",
    },
    {
      label: "Articles",
      value: String(articleDirectory.articles.length),
      footer: "Référentiel matières",
      icon: "fa-box-open",
      iconClass: "green",
      trendClass: "flat",
      trendIcon: "fa-minus",
      trendValue: "Stock",
    },
    {
      label: "Alertes en attente",
      value: String(
        stockAlerts.length + notifications.filter((item) => !item.read).length,
      ),
      footer: "Notifications et stock",
      icon: "fa-bell",
      iconClass: "red",
      trendClass: "flat",
      trendIcon: "fa-minus",
      trendValue: "Actif",
    },
  ];
}

function getDashboardRecentInterventions() {
  const directory = loadInterventionsState();

  return [
    ...directory.dis.map((item) => ({
      type: "DI",
      ref: item.ref,
      equipment: item.equipmentLabel || item.title || "-",
      equipmentLabel: item.equipmentLabel || item.title || "-",
      priorityLabel: item.urgency || "-",
      priorityClass: getInterventionBadgeClass(item.urgency),
      statusLabel: item.status || "-",
      statusClass: getInterventionStatusBadgeClass(item.status),
      technician: item.requesterLabel || "-",
      sortDate: item.createdAt,
    })),
    ...directory.ots.map((item) => ({
      type: "OT",
      ref: item.ref,
      equipment: item.equipmentLabel || item.diRef || "-",
      equipmentLabel: item.equipmentLabel || item.diRef || "-",
      priorityLabel: item.priority || "-",
      priorityClass: getInterventionBadgeClass(item.priority),
      statusLabel: item.status || "-",
      statusClass: getInterventionStatusBadgeClass(item.status),
      technician: item.technicianLabel || "-",
      sortDate: item.createdAt || item.plannedDate,
    })),
    ...directory.bts.map((item) => {
      const linkedOt = directory.ots.find((ot) => ot.id === item.otId);
      return {
        type: "BT",
        ref: item.ref,
        equipment:
          item.equipmentLabel || linkedOt?.equipmentLabel || item.otRef || "-",
        equipmentLabel:
          item.equipmentLabel || linkedOt?.equipmentLabel || item.otRef || "-",
        priorityLabel: linkedOt?.priority || item.status || "-",
        priorityClass: getInterventionBadgeClass(linkedOt?.priority),
        statusLabel: item.status || "-",
        statusClass: getInterventionStatusBadgeClass(item.status),
        technician:
          item.technicianSignature?.name || item.managerSignature?.name || "-",
        sortDate: item.endDate || item.startDate || item.otRef,
      };
    }),
  ]
    .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0))
    .slice(0, 5);
}

function renderDashboardPage() {
  if (pageActionsEl) {
    renderDashboardActions();
  }

  if (!pageContentEl) return;

  const interventionDirectory = loadInterventionsState();
  const equipmentDirectory = getEquipmentDirectory();
  const dashboardAlertItems = getCombinedNotifications();
  const alertCount = dashboardAlertItems.length;
  const dashboardKpis = getDashboardKpis();
  const recentInterventions = getDashboardRecentInterventions();
  const criticalEquipment = (equipmentDirectory.equipments || [])
    .slice(0, 4)
    .map((equipment, index) => ({
      name: `${equipment.code} — ${equipment.name}`,
      location:
        equipment.location ||
        equipment.locationLabel ||
        "Localisation non précisée",
      statusLabel: equipment.status || "En service",
      statusClass: getStatusBadgeClass(equipment.status || "En service"),
      icon: ["fa-gear", "fa-industry", "fa-screwdriver-wrench", "fa-plug"][
        index % 4
      ],
      fillClass:
        index === 0
          ? "fill-danger"
          : index === 1
            ? "fill-warning"
            : "fill-success",
      fillWidth: `${Math.max(35, 100 - index * 18)}%`,
    }));
  const workOrderStatus = [
    {
      label: "Planifié",
      count: interventionDirectory.ots.filter(
        (item) => String(item.status || "").toLowerCase() === "planifié",
      ).length,
      color: "var(--info)",
    },
    {
      label: "En cours",
      count: interventionDirectory.ots.filter(
        (item) => String(item.status || "").toLowerCase() === "en cours",
      ).length,
      color: "var(--warning)",
    },
    {
      label: "Terminé",
      count: interventionDirectory.ots.filter((item) =>
        [
          "terminé",
          "termine",
          "validé",
          "valide",
          "clôturé",
          "cloture",
        ].includes(String(item.status || "").toLowerCase()),
      ).length,
      color: "var(--success)",
    },
    {
      label: "BT actifs",
      count: interventionDirectory.bts.filter(
        (item) => String(item.status || "").toLowerCase() === "en cours",
      ).length,
      color: "var(--brand)",
    },
  ];
  const availabilityByZone = (equipmentDirectory.groups || [])
    .slice(0, 4)
    .map((group, index) => ({
      label: `${group.code} — ${group.name}`,
      value: `${
        (equipmentDirectory.equipments || []).filter(
          (equipment) => equipment.groupId === group.id,
        ).length
      } équipements`,
      width: `${Math.max(25, 100 - index * 18)}%`,
      fillClass:
        index === 0
          ? "fill-danger"
          : index === 1
            ? "fill-warning"
            : "fill-success",
    }));
  const recentActivity = [
    ...dashboardAlertItems.slice(0, 3).map((alert) => ({
      title: alert.title,
      meta: `${alert.subtitle} · ${alert.time}`,
      icon: alert.icon,
      dotStyle:
        alert.type === "crit"
          ? "background:var(--danger)"
          : alert.type === "warn"
            ? "background:var(--warning)"
            : "background:var(--info)",
    })),
    ...recentInterventions.slice(0, 2).map((item) => ({
      title: `${item.ref} · ${item.type}`,
      meta: `${item.equipmentLabel} · ${item.statusLabel}`,
      icon: "fa-screwdriver-wrench",
      dotStyle:
        item.priorityClass === "badge-danger"
          ? "background:var(--danger)"
          : item.priorityClass === "badge-warning"
            ? "background:var(--warning)"
            : "background:var(--brand)",
    })),
  ].slice(0, 5);
  const weeklyPlanning = Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    const count = interventionDirectory.ots.filter(
      (item) => String(item.plannedDate || "").slice(0, 10) === dateKey,
    ).length;

    return {
      day: date.toLocaleDateString(getAdministrationLocale(), {
        weekday: "short",
      }),
      value: String(count),
      active: index === 0,
      height: `${Math.max(18, count * 18 + 18)}px`,
    };
  });
  const upcomingWork = [...interventionDirectory.ots]
    .sort(
      (a, b) =>
        new Date(a.plannedDate || a.createdAt || 0) -
        new Date(b.plannedDate || b.createdAt || 0),
    )
    .slice(0, 3)
    .map((item) => ({
      title: `${item.ref} · ${item.equipmentLabel || item.diRef || "Ordre"}`,
      meta: item.plannedDate || item.createdAt || "Date à planifier",
      accent:
        item.priority === "Critique"
          ? "var(--danger)"
          : item.priority === "Haute"
            ? "var(--warning)"
            : "var(--brand)",
      priorityClass: getInterventionBadgeClass(item.priority),
      priorityLabel: item.priority || "Standard",
    }));

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
          <a href="#interventions" class="link-all" data-dashboard-route="interventions">Voir toutes <i class="fa-solid fa-arrow-right"></i></a>
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
          <a href="#equipements" class="link-all" data-dashboard-route="equipements">Tous les équipements <i class="fa-solid fa-arrow-right"></i></a>
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
          <a href="#stock/historique" class="link-all" data-dashboard-route="stock/historique">Historique <i class="fa-solid fa-arrow-right"></i></a>
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
          <a href="#planification" class="link-all" data-dashboard-route="planification">Planification <i class="fa-solid fa-arrow-right"></i></a>
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

    return {
      records: storedRecords,
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
      <button class="btn btn-primary" type="button" data-stock-action="scroll-inventory">
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

function openStockRecordDetails(recordKey) {
  const record = getStockRecords().find(
    (item) => getStockRecordKey(item) === recordKey,
  );
  if (!record) return;

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
    (movement) => movement.type === type && !movement.isReversal,
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
  const bodyHtml = `
    <div class="org-detail-list">
      <div class="org-detail-item"><span>Référence</span><strong>${escapeHtml(movement.id)}</strong></div>
      <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(article ? `${article.code} — ${article.name}` : movement.articleId || "-")}</strong></div>
      <div class="org-detail-item"><span>Type</span><strong>${escapeHtml(getStockMovementTypeLabel(movement.type))}</strong></div>
      <div class="org-detail-item"><span>Quantité</span><strong>${escapeHtml(movement.quantity || 0)}</strong></div>
      <div class="org-detail-item"><span>Document lié</span><strong>${escapeHtml(movement.linkedDocument || "-")}</strong></div>
      <div class="org-detail-item"><span>Emplacement</span><strong>${escapeHtml(movement.location || movement.source || movement.destination || "-")}</strong></div>
      <div class="org-detail-item"><span>Utilisateur</span><strong>${escapeHtml(movement.user || "Utilisateur connecté")}</strong></div>
      <div class="org-detail-item"><span>Date</span><strong>${formatStockDateTime(parseStockDateValue(movement.createdAt) || new Date(movement.createdAt))}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Observations</span><strong>${escapeHtml(movement.observations || "Aucune observation")}</strong></div>
    </div>
    <div class="org-modal-actions">
      <button class="btn btn-outline" type="button" data-stock-close="true">Fermer</button>
    </div>
  `;

  renderStockModal(
    `Mouvement ${movement.id}`,
    "Détails du mouvement stock.",
    bodyHtml,
  );
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
        <div class="field-group">
          <label>Date et heure</label>
          <input type="text" name="createdAt" value="${escapeHtml(nowLabel)}" readonly />
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
        <div class="field-group field-group-wide" data-stock-entry-or-exit="true" hidden>
          <label>Document lié</label>
          <input type="text" name="linkedDocument" placeholder="" />
        </div>
        <div class="field-group field-group-wide" data-stock-source-location="true" hidden>
          <label>Emplacement source</label>
          <input type="text" name="source" value="${buildStockLocationLabel(stockDefaultLocation)}" />
        </div>
        <div class="field-group field-group-wide" data-stock-destination-location="true" hidden>
          <label>Emplacement destination</label>
          <input type="text" name="destination" value="${buildStockLocationLabel(stockDefaultLocation)}" />
        </div>
        <div class="field-group field-group-wide">
          <label>Effectué par</label>
          <input type="text" name="user" value="${escapeHtml(connectedUserName)}" readonly />
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

  typeSelect?.addEventListener("change", updateVisibility);
  updateVisibility();

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
      const movement = {
        id: String(formData.get("id") || `mov-${Date.now()}`),
        type,
        articleId,
        quantity,
        user: String(formData.get("user") || "Utilisateur connecté").trim(),
        observations: String(formData.get("observations") || "").trim(),
        createdAt,
      };

      if (type === "entry") {
        const unitPrice = Number(formData.get("unitPrice") || 0);
        const destination =
          String(formData.get("destination") || "").trim() ||
          buildStockLocationLabel(stockDefaultLocation);
        const aggregate = getStockTotalsForArticle(articleId);
        const nextPmp = calculateStockPmp(
          aggregate.currentQuantity,
          aggregate.pmp,
          quantity,
          unitPrice,
        );

        upsertStockRecord(articleId, stockDefaultLocation, {
          currentQuantity:
            (Number(
              getStockRecordsForArticle(articleId).find(
                (record) => record.locationLabel === destination,
              )?.currentQuantity,
            ) || 0) + quantity,
          pmp: nextPmp,
          locationLabel: destination,
          locationKey: destination,
          updatedAt: createdAt,
        });
        updateAllStockRecordsForArticle(articleId, { pmp: nextPmp });
        syncArticleQuantity(articleId, aggregate.currentQuantity + quantity);

        movement.unitPrice = unitPrice;
        movement.linkedDocument = String(
          formData.get("linkedDocument") || "BC",
        ).trim();
        movement.location = destination;
        movement.pmp = nextPmp;
        movement.resultingQuantity = aggregate.currentQuantity + quantity;
        movement.resultingValue =
          (aggregate.currentQuantity + quantity) * nextPmp;
      } else if (type === "exit") {
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

        movement.linkedDocument = String(
          formData.get("linkedDocument") || "BT",
        ).trim();
        movement.location = source;
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
    (movement) => !movement.isReversal,
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

  const discrepancies = inventoryRows.map(
    (row) => row.counted - row.theoretical,
  );
  const positiveCount = discrepancies.filter((value) => value > 0).length;
  const negativeCount = discrepancies.filter((value) => value < 0).length;
  const openCount = discrepancies.filter((value) => value !== 0).length;

  return `
    <div class="stock-page-shell">
      <div class="stock-kpi-grid">
        <div class="stock-kpi-card">
          <span>Lignes comptées</span>
          <strong>${inventoryRows.length}</strong>
          <small>articles inventoriés</small>
        </div>
        <div class="stock-kpi-card">
          <span>Écarts ouverts</span>
          <strong>${openCount}</strong>
          <small>lignes à valider</small>
        </div>
        <div class="stock-kpi-card">
          <span>Écarts positifs</span>
          <strong>${positiveCount}</strong>
          <small>surstock</small>
        </div>
        <div class="stock-kpi-card">
          <span>Écarts négatifs</span>
          <strong>${negativeCount}</strong>
          <small>manquants</small>
        </div>
      </div>

      <div class="stock-list-stack">
        <div class="card stock-card">
          <div class="card-head">
            <div class="card-title"><i class="fa-solid fa-clipboard-check"></i> Inventaire en cours</div>
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
                  <select name="inventoryType">${getStockInventoryTypeOptions(inventoryState.inventoryType || "Général")}</select>
                </div>
                <div class="field-group field-group-wide">
                  <label>Responsable inventaire</label>
                  <select name="inventoryOwner">${buildStockResponsibleOptions(inventoryState.closedBy || "Nadia Rami")}</select>
                </div>
                <div class="field-group field-group-wide">
                  <label>Observations</label>
                  <textarea rows="4" placeholder="Objectif, consignes, date limite de saisie terrain..." data-stock-inventory-observations>${escapeTextarea(inventoryState.observations || "")}</textarea>
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
                    <th>Actions</th>
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
                            <td>
                              <div class="org-row-actions">
                                <button class="org-icon-btn" type="button" data-stock-inventory-action="details" title="Voir"><i class="fa-regular fa-eye"></i></button>
                                <button class="org-icon-btn" type="button" data-stock-inventory-action="edit" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
                                <button class="org-icon-btn danger" type="button" data-stock-inventory-action="delete" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                              </div>
                            </td>
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

      <div class="stock-list-stack">
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
                <strong>${inventoryState.openCount || openCount}</strong>
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
    } else if (action === "scroll-inventory") {
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
      } catch (error) {}
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
  } catch (error) {}
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
  const label =
    activeSubpageKey === "calendrier"
      ? "Créer un OT"
      : activeSubpageKey === "compteurs"
        ? "Saisir un relevé"
        : "Nouveau plan";
  pageActionsEl.innerHTML = `
    <button class="btn btn-primary" type="button" data-plan-primary-action>
      <i class="fa-solid fa-plus"></i>
      <span>${label}</span>
    </button>
  `;

  const button = pageActionsEl.querySelector("[data-plan-primary-action]");
  if (!button) return;
  button.addEventListener("click", function () {
    const target =
      activeSubpageKey === "compteurs"
        ? pageContentEl?.querySelector("[data-plan-reading-form]")
        : pageContentEl?.querySelector(".planning-architecture-card") ||
          pageContentEl;
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
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
        <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(plan.equipment)}</strong></div>
        <div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(plan.organ || "-")}</strong></div>
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
          ${
            items.length
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
          ${counters
            .map(
              (counter) => `
            <div class="org-list-item planning-counter-card">
              <div class="card-head" style="margin-bottom:10px">
                <div class="card-title"><i class="fa-solid fa-scale-balanced"></i> ${counter.ref} · ${escapeHtml(counter.name)}</div>
                <span class="status-badge ${counter.currentValue >= counter.actionThreshold ? "badge-danger" : counter.currentValue >= counter.alertThreshold ? "badge-warning" : "badge-success"}">${escapeHtml(counter.unit)}</span>
              </div>
              <div class="org-detail-list">
                <div class="org-detail-item"><span>Équipement lié</span><strong>${escapeHtml(counter.equipment)}</strong></div>
                <div class="org-detail-item"><span>Organe lié</span><strong>${escapeHtml(counter.organ || "-")}</strong></div>
                <div class="org-detail-item"><span>Type compteur</span><strong>${escapeHtml(counter.type)}</strong></div>
                <div class="org-detail-item"><span>Valeur actuelle</span><strong>${escapeHtml(counter.currentValue)} ${escapeHtml(counter.unit)}</strong></div>
                <div class="org-detail-item"><span>Seuil alerte</span><strong>${escapeHtml(counter.alertThreshold)} ${escapeHtml(counter.unit)}</strong></div>
                <div class="org-detail-item"><span>Seuil action</span><strong>${escapeHtml(counter.actionThreshold)} ${escapeHtml(counter.unit)}</strong></div>
                <div class="org-detail-item"><span>Plan lié</span><strong>${escapeHtml(counter.planId || "-")}</strong></div>
                <div class="org-detail-item"><span>Mise à jour</span><strong>${formatPlanificationDate(counter.lastUpdate)}</strong></div>
              </div>
            </div>`,
            )
            .join("")}
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
            ${
              readings.length
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
        } else if (action === "scroll-inventory") {
          pageContentEl
            ?.querySelector("[data-stock-inventory-form]")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
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
        const row = inventoryAction.closest("[data-stock-inventory-row]");
        if (!row) return;
        const action = String(
          inventoryAction.dataset.stockInventoryAction || "",
        );
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
  } catch (error) {}
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

function getPlanificationTechnicianName(technicianId) {
  return (
    planificationTechniciens.find(
      (technician) => technician.id === technicianId,
    )?.name || "Technicien non attribué"
  );
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
    planificationTechniciens[0]?.id ||
    "";
  const bodyHtml = isDetails
    ? `
      <div class="org-detail-list">
        <div class="org-detail-item"><span>Numéro</span><strong>${escapeHtml(initialRef)}</strong></div>
        <div class="org-detail-item"><span>Titre</span><strong>${escapeHtml(plan?.title || "-")}</strong></div>
        <div class="org-detail-item"><span>Type de plan</span><strong>${escapeHtml(plan?.planType || "-")}</strong></div>
        <div class="org-detail-item"><span>Type maintenance</span><strong>${escapeHtml(plan?.maintenanceType || "-")}</strong></div>
        <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(plan?.equipment || "-")}</strong></div>
        <div class="org-detail-item"><span>Organe</span><strong>${escapeHtml(plan?.organ || "-")}</strong></div>
        <div class="org-detail-item"><span>Technicien</span><strong>${escapeHtml(getPlanificationTechnicianName(plan?.technicianId))}</strong></div>
        <div class="org-detail-item"><span>Fréquence</span><strong>${escapeHtml(plan?.frequency || "-")}</strong></div>
        <div class="org-detail-item"><span>Déclenchement</span><strong>${escapeHtml(plan?.triggerLabel || "-")}</strong></div>
        <div class="org-detail-item"><span>Prochaine échéance</span><strong>${formatPlanificationDate(plan?.nextDueDate)}</strong></div>
      </div>
      <div class="planning-modal-stack">
        <div><strong>Gamme opératoire</strong><p>${escapeHtml((plan?.tasks || []).join("\n"))}</p></div>
        <div><strong>Articles nécessaires</strong><p>${escapeHtml((plan?.articles || []).join(", ") || "-")}</p></div>
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
        <div class="field-group"><label for="planType">Type de plan</label><select id="planType" name="planType"><option${(plan?.planType || preset.planType) === "Systématique" ? " selected" : ""}>Systématique</option><option${(plan?.planType || preset.planType) === "Conditionnel" ? " selected" : ""}>Conditionnel</option><option${(plan?.planType || preset.planType) === "Prédictif" ? " selected" : ""}>Prédictif</option></select></div>
        <div class="field-group"><label for="planMaintenanceType">Type maintenance</label><select id="planMaintenanceType" name="maintenanceType"><option${(plan?.maintenanceType || preset.maintenanceType) === "Préventive" ? " selected" : ""}>Préventive</option><option${(plan?.maintenanceType || preset.maintenanceType) === "Prédictive" ? " selected" : ""}>Prédictive</option><option${(plan?.maintenanceType || preset.maintenanceType) === "Réglementaire" ? " selected" : ""}>Réglementaire</option></select></div>
        <div class="field-group"><label for="planEquipment">Équipement</label><input id="planEquipment" name="equipment" type="text" value="${escapeHtml(plan?.equipment || preset.equipment || "")}" required /></div>
        <div class="field-group"><label for="planOrgan">Organe</label><input id="planOrgan" name="organ" type="text" value="${escapeHtml(plan?.organ || preset.organ || "")}" /></div>
        <div class="field-group"><label for="planTechnician">Technicien par défaut</label><select id="planTechnician" name="technicianId">${planificationTechniciens.map((technician) => `<option value="${technician.id}"${technician.id === selectedTechnicianId ? " selected" : ""}>${escapeHtml(technician.name)} · ${escapeHtml(technician.role)}</option>`).join("")}</select></div>
        <div class="field-group"><label for="planFrequency">Fréquence</label><input id="planFrequency" name="frequency" type="text" value="${escapeHtml(plan?.frequency || preset.frequency || "Mensuelle")}" /></div>
        <div class="field-group"><label for="planDuration">Durée estimée (h)</label><input id="planDuration" name="durationHours" type="number" min="0" step="0.5" value="${escapeHtml(plan?.durationHours || preset.durationHours || 1)}" /></div>
        <div class="field-group"><label for="planTrigger">Déclenchement</label><input id="planTrigger" name="triggerLabel" type="text" value="${escapeHtml(plan?.triggerLabel || preset.triggerLabel || "")}" /></div>
        <div class="field-group"><label for="planNextDue">Prochaine échéance</label><input id="planNextDue" name="nextDueDate" type="datetime-local" value="${plan?.nextDueDate ? new Date(plan.nextDueDate).toISOString().slice(0, 16) : preset.nextDueDate ? new Date(preset.nextDueDate).toISOString().slice(0, 16) : ""}" /></div>
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
    const formData = new FormData(form);
    const nextState = loadPlanificationData();
    const planIndex = plan
      ? nextState.plans.findIndex((item) => item.id === plan.id)
      : -1;
    const tasks = String(formData.get("tasks") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const articles = String(formData.get("articles") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
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
      equipment: String(formData.get("equipment") || "").trim(),
      organ: String(formData.get("organ") || "").trim(),
      technicianId: String(formData.get("technicianId") || ""),
      frequency: String(formData.get("frequency") || "").trim(),
      durationHours: Number(formData.get("durationHours") || 0),
      triggerLabel: String(formData.get("triggerLabel") || "").trim(),
      nextDueDate: String(formData.get("nextDueDate") || ""),
      alertThreshold: String(formData.get("alertThreshold") || "").trim(),
      actionThreshold: String(formData.get("actionThreshold") || "").trim(),
      tasks,
      articles,
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
          : `<button class="btn btn-primary" type="button" data-plan-add-reading><i class="fa-solid fa-gauge-high"></i><span>Ajouter un relevé</span></button>`;
  }

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
              ${
                selectedEvents.length
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
        <div class="planning-counter-list">
          ${counters
            .map((counter) => {
              const thresholdState =
                Number(counter.currentValue) >=
                Number(counter.actionThreshold || 0)
                  ? "badge-danger"
                  : Number(counter.currentValue) >=
                      Number(counter.alertThreshold || 0)
                    ? "badge-warning"
                    : "badge-success";
              return `
              <div class="card planning-counter-card">
                <div class="card-head">
                  <div class="card-title"><i class="fa-solid fa-gauge-high"></i> ${counter.ref} · ${escapeHtml(counter.name)}</div>
                  <span class="status-badge ${thresholdState}">${escapeHtml(counter.unit)}</span>
                </div>
                <div class="card-body">
                  <div class="org-detail-list">
                    <div class="org-detail-item"><span>Équipement lié</span><strong>${escapeHtml(counter.equipment)}</strong></div>
                    <div class="org-detail-item"><span>Organe lié</span><strong>${escapeHtml(counter.organ || "-")}</strong></div>
                    <div class="org-detail-item"><span>Valeur actuelle</span><strong>${escapeHtml(counter.currentValue)} ${escapeHtml(counter.unit)}</strong></div>
                    <div class="org-detail-item"><span>Seuil alerte</span><strong>${escapeHtml(counter.alertThreshold)} ${escapeHtml(counter.unit)}</strong></div>
                    <div class="org-detail-item"><span>Seuil action</span><strong>${escapeHtml(counter.actionThreshold)} ${escapeHtml(counter.unit)}</strong></div>
                    <div class="org-detail-item"><span>Plan lié</span><strong>${escapeHtml(counter.planId || "-")}</strong></div>
                    <div class="org-detail-item"><span>Mise à jour</span><strong>${formatPlanificationDate(counter.lastUpdate)}</strong></div>
                  </div>
                </div>
              </div>
            `;
            })
            .join("")}
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
          ${
            plans
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

function buildAchatsDaOptions(demandes, selectedIds) {
  const selectedSet = new Set(selectedIds || []);
  return demandes
    .filter((item) => item.status === "Validée" || selectedSet.has(item.id))
    .map((item) => {
      const selected = selectedSet.has(item.id) ? "selected" : "";
      return `<option value="${escapeHtml(item.id)}" ${selected}>${escapeHtml(item.number)} - ${escapeHtml(item.articleLabel || "Article non défini")}</option>`;
    })
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

function buildAchatsListActions(subpageKey, recordId) {
  return `
    <div class="org-row-actions">
      <button class="org-icon-btn" data-org-action="details" type="button" data-ach-action="details" data-ach-subpage="${subpageKey}" data-ach-id="${recordId}" title="Voir">
        <i class="fa-regular fa-eye"></i>
      </button>
      <button class="org-icon-btn" data-org-action="edit" type="button" data-ach-action="edit" data-ach-subpage="${subpageKey}" data-ach-id="${recordId}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="org-icon-btn danger" data-org-action="delete" type="button" data-ach-action="delete" data-ach-subpage="${subpageKey}" data-ach-id="${recordId}" title="Supprimer">
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

  const regroupButton =
    activeSubpageKey === "bons-commande"
      ? `
        <button class="btn btn-outline" type="button" data-ach-group-da="true">
          <i class="fa-solid fa-object-group"></i>
          <span>Regrouper DA validées</span>
        </button>
      `
      : "";

  pageActionsEl.innerHTML = `
    ${regroupButton}
    <button class="btn btn-primary" type="button" data-ach-create="${activeSubpageKey}">
      <i class="fa-solid fa-plus"></i>
      <span>${labels[activeSubpageKey] || "Créer"}</span>
    </button>
  `;
}

function renderAchatsDemandsPage(state, activeSubpageKey) {
  if (!pageContentEl) return;

  const rows = state.demandes.length
    ? state.demandes
        .map(
          (da) => `
            <tr>
              <td><strong>${escapeHtml(da.number)}</strong></td>
              <td class="muted">${formatAchatsDate(da.createdAt)}</td>
              <td>${escapeHtml(da.requester || "-")}</td>
              <td>${escapeHtml(da.origin || "-")}</td>
              <td>${escapeHtml(da.articleLabel || "-")}</td>
              <td>${formatStockNumber(da.quantity || 0)}</td>
              <td><span class="status-badge ${getAchatsStatusBadgeClass(da.status)}">${escapeHtml(da.status || "-")}</span></td>
              <td>${buildAchatsListActions("demandes-achat", da.id)}</td>
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
        <p>Création manuelle ou depuis le stock minimum. Les DA validées peuvent ensuite être regroupées dans un ou plusieurs BC.</p>
      </div>
      <div class="org-section-pills">
        <span class="status-badge badge-info">${state.demandes.length} DA</span>
        <span class="status-badge badge-success">${state.demandes.filter((item) => item.status === "Validée").length} validées</span>
      </div>
    </div>

    ${renderOrganizationStats([
      {
        label: "DA en brouillon",
        value: String(
          state.demandes.filter((item) => item.status === "Brouillon").length,
        ),
        note: "À compléter avant validation",
      },
      {
        label: "DA validées",
        value: String(
          state.demandes.filter((item) => item.status === "Validée").length,
        ),
        note: "Prêtes pour transformation en BC",
      },
      {
        label: "Origine stock auto",
        value: String(
          state.demandes.filter((item) => item.origin === "Stock automatique")
            .length,
        ),
        note: "Demandes issues du seuil minimum",
      },
    ])}

    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-list-check"></i> Liste des DA</div>
        <span class="status-badge badge-info">${state.demandes.length} lignes</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date création</th>
              <th>Demandeur</th>
              <th>Origine</th>
              <th>Article</th>
              <th>Qté</th>
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
          <label>Date création</label>
          <input type="text" value="${escapeHtml(formatAchatsDate(datePreview))}" disabled />
        </div>
        <div class="field-group">
          <label>Demandeur</label>
          <input type="text" value="${escapeHtml(record?.requester || achatsCurrentUser)}" disabled />
        </div>
        <div class="field-group">
          <label for="daOrigin">Origine demande</label>
          <select id="daOrigin" name="origin" required>
            <option value="Manuelle" ${record?.origin === "Manuelle" ? "selected" : ""}>Manuelle</option>
            <option value="Stock automatique" ${record?.origin === "Stock automatique" ? "selected" : ""}>Stock automatique</option>
          </select>
        </div>
        <div class="field-group">
          <label for="daArticle">Article</label>
          <select id="daArticle" name="articleId">${buildAchatsArticleOptions(record?.articleId || "")}</select>
        </div>
        <div class="field-group">
          <label for="daArticleLabel">Désignation article (libre)</label>
          <input id="daArticleLabel" name="articleLabel" type="text" value="${escapeHtml(record?.articleLabel || "")}" placeholder="Nom article" required />
        </div>
        <div class="field-group">
          <label for="daQuantity">Quantité demandée</label>
          <input id="daQuantity" name="quantity" type="number" min="1" step="1" value="${escapeHtml(String(record?.quantity || ""))}" required />
        </div>
        <div class="field-group">
          <label for="daSupplier">Fournisseur suggéré</label>
          <input id="daSupplier" name="preferredSupplier" type="text" value="${escapeHtml(record?.preferredSupplier || "")}" placeholder="Nom fournisseur" />
        </div>
        <div class="field-group">
          <label for="daNeededDate">Date souhaitée</label>
          <input id="daNeededDate" name="neededDate" type="date" value="${escapeHtml(record?.neededDate || "")}" />
        </div>
        <div class="field-group">
          <label for="daStatus">Statut</label>
          <select id="daStatus" name="status" required>
            ${[
              "Brouillon",
              "En attente validation",
              "Validée",
              "Annulée",
              "Clôturée",
            ]
              .map(
                (status) =>
                  `<option value="${status}" ${record?.status === status ? "selected" : ""}>${status}</option>`,
              )
              .join("")}
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
          <input id="bcSupplierName" name="supplierName" type="text" value="${escapeHtml(record?.supplierName || "")}" placeholder="Nom fournisseur" required />
        </div>
        <div class="field-group">
          <label for="bcSupplierPhone">Contact fournisseur (téléphone)</label>
          <input id="bcSupplierPhone" name="supplierPhone" type="tel" value="${escapeHtml(record?.supplierPhone || "")}" placeholder="Téléphone" />
        </div>
        <div class="field-group">
          <label for="bcSupplierEmail">Email fournisseur</label>
          <input id="bcSupplierEmail" name="supplierEmail" type="email" value="${escapeHtml(record?.supplierEmail || "")}" placeholder="Email" />
        </div>
        <div class="field-group field-group-wide">
          <label for="bcLinkedDaIds">DA liée (sélection multiple)</label>
          <select id="bcLinkedDaIds" name="linkedDaIds" multiple size="4">${buildAchatsDaOptions(state.demandes, record?.linkedDaIds || [])}</select>
          <div class="org-field-hint">Regroupement de plusieurs DA validées pour un même fournisseur.</div>
        </div>

        <div class="field-group">
          <label for="bcArticle">Article (lien Articles)</label>
          <select id="bcArticle" name="articleId">${buildAchatsArticleOptions(record?.articleId || "")}</select>
        </div>
        <div class="field-group">
          <label for="bcArticleLabel">Désignation article</label>
          <input id="bcArticleLabel" name="articleLabel" type="text" value="${escapeHtml(record?.articleLabel || "")}" placeholder="Article commandé" required />
        </div>
        <div class="field-group">
          <label for="bcSupplierRef">Référence fournisseur</label>
          <input id="bcSupplierRef" name="supplierRef" type="text" value="${escapeHtml(record?.supplierRef || "")}" placeholder="Référence" />
        </div>
        <div class="field-group">
          <label for="bcQuantity">Quantité commandée</label>
          <input id="bcQuantity" name="quantity" type="number" min="1" step="1" value="${escapeHtml(String(record?.quantity || ""))}" required />
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
  const missingQty = Math.max(0, orderedQty - receivedQty);

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
          <label for="recMissingQty">Quantité manquante (auto)</label>
          <input id="recMissingQty" name="missingQty" type="number" value="${escapeHtml(String(missingQty))}" readonly />
        </div>
        <div class="field-group">
          <label for="recState">État réception</label>
          <select id="recState" name="receptionState" required>
            ${["Conforme", "Non conforme", "Endommagé"]
              .map(
                (stateOption) =>
                  `<option value="${stateOption}" ${record?.receptionState === stateOption ? "selected" : ""}>${stateOption}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="field-group">
          <label for="recQuality">Contrôle qualité</label>
          <select id="recQuality" name="qualityControl" required>
            ${["Conforme total", "Partiellement conforme", "Refusé"]
              .map(
                (quality) =>
                  `<option value="${quality}" ${record?.qualityControl === quality ? "selected" : ""}>${quality}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="field-group field-group-wide">
          <label for="recStorage">Emplacement de stockage</label>
          <input id="recStorage" name="storageLocation" type="text" value="${escapeHtml(record?.storageLocation || "")}" placeholder="Magasin / Allée / Étagère / Case" />
        </div>
        <div class="field-group">
          <label for="recDeliveryNote">Bon de livraison fournisseur</label>
          <input id="recDeliveryNote" name="deliveryNoteRef" type="text" value="${escapeHtml(record?.deliveryNoteRef || "")}" placeholder="Référence + photo" />
        </div>
        <div class="field-group">
          <label for="recInvoiceRef">Facture fournisseur</label>
          <input id="recInvoiceRef" name="invoiceRef" type="text" value="${escapeHtml(record?.invoiceRef || "")}" placeholder="Référence + document" />
        </div>
        <div class="field-group">
          <label for="recStatus">Statut</label>
          <select id="recStatus" name="status">
            ${["Partielle", "Complète"]
              .map(
                (status) =>
                  `<option value="${status}" ${record?.status === status ? "selected" : ""}>${status}</option>`,
              )
              .join("")}
          </select>
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
      <div class="org-detail-item"><span>Origine</span><strong>${escapeHtml(record.origin || "-")}</strong></div>
      <div class="org-detail-item"><span>Article</span><strong>${escapeHtml(record.articleLabel || "-")}</strong></div>
      <div class="org-detail-item"><span>Quantité</span><strong>${formatStockNumber(record.quantity || 0)}</strong></div>
      <div class="org-detail-item"><span>Fournisseur suggéré</span><strong>${escapeHtml(record.preferredSupplier || "-")}</strong></div>
      <div class="org-detail-item"><span>Date souhaitée</span><strong>${escapeHtml(record.neededDate || "-")}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(record.status || "-")}</strong></div>
      <div class="org-detail-item org-detail-item--full"><span>Justification</span><strong>${escapeHtml(record.reason || "-")}</strong></div>
    </div>
  `;
}

function buildAchatsBcDetails(record, state) {
  const linkedDaNumbers = (record.linkedDaIds || [])
    .map((id) => (state.demandes.find((item) => item.id === id) || {}).number)
    .filter(Boolean)
    .join(", ");

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
      <div class="org-detail-item org-detail-item--full"><span>DA liées</span><strong>${escapeHtml(linkedDaNumbers || "Aucune")}</strong></div>
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
      <div class="org-detail-item"><span>Qté manquante</span><strong>${formatStockNumber(record.missingQty || 0)}</strong></div>
      <div class="org-detail-item"><span>État réception</span><strong>${escapeHtml(record.receptionState || "-")}</strong></div>
      <div class="org-detail-item"><span>Contrôle qualité</span><strong>${escapeHtml(record.qualityControl || "-")}</strong></div>
      <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(record.status || "-")}</strong></div>
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

  modal.querySelectorAll("[data-ach-close]").forEach((button) => {
    button.addEventListener("click", function () {
      closeAchatsModal(activeSubpageKey);
    });
  });

  const form = modal.querySelector("[data-ach-form]");
  if (!form || mode === "details") return;

  const formType = form.getAttribute("data-ach-form");

  if (formType === "bons-commande") {
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
  }

  if (formType === "receptions") {
    const bcSelect = form.querySelector("select[name='bcId']");
    const supplierInput = form.querySelector("input[name='supplierName']");
    const articleInput = form.querySelector("input[name='articleLabel']");
    const orderedQtyInput = form.querySelector("input[name='orderedQty']");
    const receivedQtyInput = form.querySelector("input[name='receivedQty']");
    const missingQtyInput = form.querySelector("input[name='missingQty']");

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
      if (missingQtyInput)
        missingQtyInput.value = String(Math.max(0, orderedQty - receivedQty));
    };

    const refreshMissingQty = () => {
      const orderedQty = Number(orderedQtyInput?.value || 0);
      const receivedQty = Number(receivedQtyInput?.value || 0);
      if (missingQtyInput)
        missingQtyInput.value = String(Math.max(0, orderedQty - receivedQty));
    };

    bcSelect?.addEventListener("change", refreshFromBc);
    receivedQtyInput?.addEventListener("input", refreshMissingQty);
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
        origin: String(formData.get("origin") || "Manuelle"),
        status: String(formData.get("status") || "Brouillon"),
        articleId: String(formData.get("articleId") || ""),
        articleLabel: String(formData.get("articleLabel") || "").trim(),
        quantity: Number(formData.get("quantity") || 0),
        preferredSupplier: String(
          formData.get("preferredSupplier") || "",
        ).trim(),
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
      const linkedDaIds = Array.from(
        form.querySelector("select[name='linkedDaIds']")?.selectedOptions || [],
      ).map((option) => option.value);

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
        articleId: String(formData.get("articleId") || ""),
        articleLabel: String(formData.get("articleLabel") || "").trim(),
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
        linkedDaIds,
      };

      if (modeType === "edit") {
        nextState.bons = nextState.bons.map((item) =>
          item.id === recordId ? record : item,
        );
      } else {
        nextState.bons.unshift(record);
      }

      nextState.demandes = nextState.demandes.map((item) => {
        if (linkedDaIds.includes(item.id) && item.status !== "Annulée") {
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
        qualityControl: String(
          formData.get("qualityControl") || "Conforme total",
        ),
        storageLocation: String(formData.get("storageLocation") || "").trim(),
        deliveryNoteRef: String(formData.get("deliveryNoteRef") || "").trim(),
        invoiceRef: String(formData.get("invoiceRef") || "").trim(),
        observations: String(formData.get("observations") || "").trim(),
        status: String(formData.get("status") || finalStatus),
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
          if (!linkedBc.linkedDaIds?.includes(item.id)) return item;
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
          removed.linkedDaIds?.includes(item.id) &&
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
    const linkedDaIds = group.map((da) => da.id);
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
      linkedDaIds,
    });

    state.demandes = state.demandes.map((item) =>
      linkedDaIds.includes(item.id)
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
    dis: [
      {
        id: "di-seed-101",
        ref: "DI-101",
        createdAt: new Date(now - 5 * 24 * 3600000).toISOString(),
        title: "Vibration anormale sur convoyeur L4",
        description:
          "Le convoyeur présente des vibrations en charge avec bruit de roulement côté arrière.",
        equipmentId: equipmentConvoyeur?.id || "equipment-3",
        equipmentLabel: equipmentConvoyeur
          ? `${equipmentConvoyeur.code} — ${equipmentConvoyeur.name}`
          : "EQP-003 — Convoyeur L4",
        organeId: organRoulement?.id || "organe-1",
        organeLabel: organRoulement
          ? `${organRoulement.code} — ${organRoulement.name}`
          : "ORG-001 — Roulement AR Convoyeur L4",
        location: "Ligne 4 / Zone transfert",
        requestType: "Panne",
        urgency: "Haute",
        requesterId: userLogistique?.id || "user-6",
        requesterLabel: userLogistique ? userLogistique.name : "Omar Haddad",
        photos: [],
        status: "Validée",
      },
      {
        id: "di-seed-102",
        ref: "DI-102",
        createdAt: new Date(now - 3 * 24 * 3600000).toISOString(),
        title: "Fuite sur garniture de la pompe P2",
        description:
          "Présence de fuite au niveau du presse-étoupe, surveillance demandée avant arrêt complet.",
        equipmentId: equipmentPompe?.id || "equipment-2",
        equipmentLabel: equipmentPompe
          ? `${equipmentPompe.code} — ${equipmentPompe.name}`
          : "EQP-002 — Pompe P2",
        organeId: organGarniture?.id || "organe-2",
        organeLabel: organGarniture
          ? `${organGarniture.code} — ${organGarniture.name}`
          : "ORG-002 — Garniture Pompe P2",
        location: "Zone B / Sous-sol",
        requestType: "Anomalie",
        urgency: "Critique",
        requesterId: userMaintenance?.id || "user-3",
        requesterLabel: userMaintenance ? userMaintenance.name : "Nadia Rami",
        photos: [],
        status: "Transformée en OT",
      },
      {
        id: "di-seed-103",
        ref: "DI-103",
        createdAt: new Date(now - 1 * 24 * 3600000).toISOString(),
        title: "Contrôle préventif du TGBT principal",
        description:
          "Demande de contrôle visuel et resserrage préventif des connexions du tableau principal.",
        equipmentId: equipmentTgbt?.id || "equipment-1",
        equipmentLabel: equipmentTgbt
          ? `${equipmentTgbt.code} — ${equipmentTgbt.name}`
          : "EQP-001 — TGBT principal",
        organeId: "",
        organeLabel: "",
        location: "Zone A / Atelier électrique",
        requestType: "Sécurité",
        urgency: "Moyenne",
        requesterId: userQualite?.id || "user-1",
        requesterLabel: userQualite ? userQualite.name : "Amina El Idrissi",
        photos: [],
        status: "En attente",
      },
    ],
    ots: [
      {
        id: "ot-seed-101",
        ref: "OT-101",
        diId: "di-seed-101",
        diRef: "DI-101",
        createdAt: new Date(now - 4 * 24 * 3600000).toISOString(),
        plannedDate: new Date(now + 1 * 24 * 3600000)
          .toISOString()
          .slice(0, 10),
        durationEstimated: 3,
        typeMaintenance: "Corrective",
        equipmentId: equipmentConvoyeur?.id || "equipment-3",
        equipmentLabel: equipmentConvoyeur
          ? `${equipmentConvoyeur.code} — ${equipmentConvoyeur.name}`
          : "EQP-003 — Convoyeur L4",
        organeId: organRoulement?.id || "organe-1",
        organeLabel: organRoulement
          ? `${organRoulement.code} — ${organRoulement.name}`
          : "ORG-001 — Roulement AR Convoyeur L4",
        technicianIds: [
          userMaintenance?.id || "user-3",
          userProduction?.id || "user-2",
        ],
        technicianLabel:
          userMaintenance && userProduction
            ? `${userMaintenance.name}, ${userProduction.name}`
            : "Nadia Rami, Youssef Bensaid",
        priority: "Haute",
        instructions:
          "Vérifier le roulement arrière, contrôler l'alignement et resserrer les fixations du châssis.",
        articles: [{ articleId: articleRoulement?.id || "article-2", qty: 1 }],
        documents: [],
        status: "Planifié",
      },
      {
        id: "ot-seed-102",
        ref: "OT-102",
        diId: "di-seed-102",
        diRef: "DI-102",
        createdAt: new Date(now - 2 * 24 * 3600000).toISOString(),
        plannedDate: new Date(now).toISOString().slice(0, 10),
        durationEstimated: 4,
        typeMaintenance: "Corrective",
        equipmentId: equipmentPompe?.id || "equipment-2",
        equipmentLabel: equipmentPompe
          ? `${equipmentPompe.code} — ${equipmentPompe.name}`
          : "EQP-002 — Pompe P2",
        organeId: organGarniture?.id || "organe-2",
        organeLabel: organGarniture
          ? `${organGarniture.code} — ${organGarniture.name}`
          : "ORG-002 — Garniture Pompe P2",
        technicianIds: [userMaintenance?.id || "user-3"],
        technicianLabel: userMaintenance ? userMaintenance.name : "Nadia Rami",
        priority: "Critique",
        instructions:
          "Prévoir arrêt contrôlé, remplacement de la garniture et contrôle de fuite en redémarrage.",
        articles: [
          { articleId: articleHuile?.id || "article-1", qty: 2 },
          { articleId: articleRoulement?.id || "article-2", qty: 1 },
        ],
        documents: [],
        status: "En cours",
      },
    ],
    bts: [
      {
        id: "bt-seed-101",
        ref: "BT-101",
        otId: "ot-seed-102",
        otRef: "OT-102",
        startDate: new Date(now - 8 * 3600000).toISOString(),
        endDate: new Date(now - 5 * 3600000).toISOString(),
        duration: "3h",
        works:
          "Remplacement de la garniture, nettoyage du corps de pompe et contrôle du retour en service.",
        articles: [
          { articleId: articleHuile?.id || "article-1", qty: 1 },
          { articleId: articleRoulement?.id || "article-2", qty: 1 },
        ],
        observations:
          "Aucune fuite après redémarrage, surveillance recommandée sur 24h.",
        causes: ["Défaut de lubrification"],
        photos: [],
        technicianSignature: {
          name: userMaintenance ? userMaintenance.name : "Nadia Rami",
          signedAt: new Date(now - 5 * 3600000).toISOString(),
        },
        managerSignature: {
          name: userMaintenance ? userMaintenance.name : "Nadia Rami",
          signedAt: new Date(now - 4 * 3600000).toISOString(),
        },
        status: "Validé",
      },
      {
        id: "bt-seed-102",
        ref: "BT-102",
        otId: "ot-seed-101",
        otRef: "OT-101",
        startDate: new Date(now - 90 * 60000).toISOString(),
        endDate: null,
        duration: null,
        works:
          "Contrôle en cours du roulement arrière, alignement et graissage préventif.",
        articles: [{ articleId: articleRoulement?.id || "article-2", qty: 1 }],
        observations:
          "Vibrations en baisse après graissage, test final en cours.",
        causes: ["Usure normale"],
        photos: [],
        technicianSignature: {
          name: userProduction ? userProduction.name : "Youssef Bensaid",
          signedAt: new Date(now - 30 * 60000).toISOString(),
        },
        managerSignature: null,
        status: "En cours",
      },
    ],
    history: [
      {
        id: "hist-seed-101",
        createdAt: new Date(now - 4.5 * 24 * 3600000).toISOString(),
        action: "DI validée",
        recordType: "DI",
        recordRef: "DI-101",
        message: "DI-101 validée",
      },
      {
        id: "hist-seed-102",
        createdAt: new Date(now - 2.5 * 24 * 3600000).toISOString(),
        action: "DI transformée en OT",
        recordType: "DI",
        recordRef: "DI-102",
        message: "DI-102 transformée en OT",
      },
      {
        id: "hist-seed-103",
        createdAt: new Date(now - 6 * 3600000).toISOString(),
        action: "OT transformé en BT",
        recordType: "OT",
        recordRef: "OT-102",
        message: "OT-102 transformé en BT",
      },
    ],
  };
}

let interventionsModalState = null;

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

    if (
      !normalized.dis.length &&
      !normalized.ots.length &&
      !normalized.bts.length
    ) {
      try {
        window.localStorage.setItem(
          interventionsStorageKey,
          JSON.stringify(seedState),
        );
      } catch (error) {}
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
      } catch (error) {}

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
              <select id="intDiRequester" name="requesterId" required>
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

    overlayRootEl.innerHTML = `
      <div class="org-modal open" role="presentation">
        <div class="org-modal-backdrop" data-int-close="true"></div>
        <div class="org-modal-panel interventions-modal-panel" role="dialog" aria-modal="true" aria-labelledby="intConfirmTitle">
          <div class="org-modal-head">
            <div>
              <div class="org-modal-kicker">Ordre de travail</div>
              <h3 id="intConfirmTitle">Créer un BT depuis ${escapeHtml(ot.ref)}</h3>
              <p>Cette action supprimera l'OT de la liste des OT et créera un BT correspondant.</p>
            </div>
            <button class="org-modal-close" type="button" data-int-close="true" aria-label="Fermer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="org-detail-list">
            <div class="org-detail-item"><span>OT</span><strong>${escapeHtml(ot.ref)}</strong></div>
            <div class="org-detail-item"><span>DI liée</span><strong>${escapeHtml(ot.diRef || "-")}</strong></div>
            <div class="org-detail-item"><span>Équipement</span><strong>${escapeHtml(ot.equipmentLabel || ot.equipmentId || "-")}</strong></div>
            <div class="org-detail-item"><span>Statut</span><strong>${escapeHtml(ot.status || "-")}</strong></div>
          </div>
          <div class="org-modal-actions">
            <button class="btn btn-outline" type="button" data-int-close="true">Annuler</button>
            <button class="btn btn-primary" type="button" data-int-action="confirm-create-bt" data-int-id="${ot.id}">
              <i class="fa-solid fa-file-signature"></i>
              <span>Confirmer</span>
            </button>
          </div>
        </div>
      </div>
    `;
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
  if (!diForm) return;

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
      equipmentLabel: equipment ? `${equipment.code} — ${equipment.name}` : "",
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
      const index = directory.dis.findIndex((item) => item.id === existing.id);
      if (index >= 0) directory.dis[index] = nextRecord;
    } else {
      directory.dis.unshift(nextRecord);
    }

    saveInterventionsState(directory);
    closeInterventionsModal();
  });
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

  const primaryLabel =
    activeTabKey === "di"
      ? "Nouvelle DI"
      : activeTabKey === "ot"
        ? "Nouveau OT"
        : activeTabKey === "bt"
          ? "Nouveau BT"
          : "Exporter";

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

    if (activeTabKey === "ot") {
      window.alert(
        "La création manuelle d'OT peut être ajoutée ensuite sur la même base de modal.",
      );
      return;
    }

    if (activeTabKey === "bt") {
      window.alert(
        "La création manuelle de BT peut être ajoutée ensuite sur la même base de modal.",
      );
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
    }
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
  const rows = directory.bts.length
    ? directory.bts
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
        <span class="status-badge badge-info">${directory.bts.length} lignes</span>
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

function renderHistorySection(directory) {
  const entries = [];
  (Array.isArray(directory.history) ? directory.history : []).forEach(
    (event) => {
      entries.push({
        id: event.id,
        date: event.createdAt,
        ref: event.recordRef || event.action || "Événement",
        type: event.action || "Événement",
        label: event.message || event.action || "Transition",
        meta: event.recordType || "Journal",
        kind: "event",
      });
    },
  );
  directory.dis.forEach((di) => {
    entries.push({
      id: di.id,
      date: di.createdAt,
      ref: di.ref,
      type: "DI",
      label: di.title,
      meta: di.status,
      kind: "record",
    });
  });
  directory.ots.forEach((ot) => {
    entries.push({
      id: ot.id,
      date: ot.createdAt || ot.plannedDate,
      ref: ot.ref,
      type: "OT",
      label: ot.equipmentLabel || ot.diRef || "Ordre",
      meta: ot.status,
      kind: "record",
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
    });
  });
  entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const list = entries.length
    ? entries
        .map(
          (entry) => `
            <div class="intervention-history-row">
              <div>
                <div class="intervention-history-title"><strong>${entry.ref}</strong> · ${entry.type}</div>
                <div class="intervention-history-sub">${escapeHtml(entry.label)} · ${escapeHtml(entry.meta)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <div class="intervention-history-date">${entry.date ? new Date(entry.date).toLocaleString(getAdministrationLocale()) : "-"}</div>
                ${entry.kind === "record" ? buildInterventionHistoryActions(entry.type.toLowerCase(), entry.id) : ""}
              </div>
            </div>
          `,
        )
        .join("")
    : buildInterventionEmptyState(
        "fa-clock-rotate-left",
        "Aucun historique disponible",
        "Les créations, clôtures et validations apparaîtront ici.",
        "L'export Excel / PDF est prévu sur cette vue.",
      );

  return `
    <div class="card org-list-card">
      <div class="card-head">
        <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Historique consolidé</div>
        <span class="status-badge badge-info">${entries.length} événements</span>
      </div>
      <div class="card-body">
        <div class="intervention-history-toolbar">
          <div class="org-section-pills">
            <span class="status-badge badge-gray">Par équipement</span>
            <span class="status-badge badge-gray">Par technicien</span>
            <span class="status-badge badge-gray">Par type</span>
            <span class="status-badge badge-gray">Par statut</span>
            <span class="status-badge badge-gray">Par date</span>
            <span class="status-badge badge-gray">Par priorité</span>
          </div>
          <div class="intervention-history-actions">
            <button class="btn btn-outline" type="button" data-int-export="excel">Export Excel</button>
            <button class="btn btn-outline" type="button" data-int-export="pdf">Export PDF</button>
          </div>
        </div>
        <div class="intervention-history-list">${list}</div>
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
  const directory = loadInterventionsState();
  const diIndex = directory.dis.findIndex((item) => item.id === diId);
  const di = diIndex >= 0 ? directory.dis[diIndex] : null;
  if (!di) return window.alert("DI introuvable.");

  const ot = {
    id: `ot-${Date.now()}`,
    ref: buildInterventionRef("OT", directory.ots),
    diId: di.id,
    diRef: di.ref,
    createdAt: new Date().toISOString(),
    plannedDate: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 10),
    durationEstimated: 2,
    typeMaintenance: "Corrective",
    equipmentId: di.equipmentId || "",
    equipmentLabel: di.equipmentLabel || di.equipment || "",
    organeId: di.organeId || "",
    organeLabel: di.organeLabel || di.organe || "",
    technicianIds: [],
    priority: di.urgency || "Moyenne",
    instructions: di.description || "",
    articles: [],
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
  renderInterventionsPage("ot");
}

function createBtFromOt(otId) {
  const directory = loadInterventionsState();
  const otIndex = directory.ots.findIndex((item) => item.id === otId);
  const ot = otIndex >= 0 ? directory.ots[otIndex] : null;
  if (!ot) return window.alert("OT introuvable.");

  const bt = {
    id: `bt-${Date.now()}`,
    ref: buildInterventionRef("BT", directory.bts),
    otId: ot.id,
    otRef: ot.ref,
    startDate: new Date().toISOString(),
    endDate: null,
    duration: null,
    works: "",
    articles: [],
    observations: "",
    causes: [],
    photos: [],
    technicianSignature: null,
    managerSignature: null,
    status: "En cours",
  };

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
  renderInterventionsPage("bt");
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

  saveInterventionsState(directory);
  renderInterventionsPage(getCurrentInterventionsTab("bt"));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
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
    catalogue: {
      label: "Catalogue fournisseur",
      title: "Catalogue fournisseur",
      subtitle: "Articles fournis, références propres et prix négociés.",
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
      suppliers: [
        {
          id: "sup-1",
          number: "FRN-001",
          raisonSociale: "MecaParts Algérie",
          nomCommercial: "MecaParts",
          type: "Distributeur",
          domaine: "Mécanique",
          adresse: "Zone industrielle, Blida, Algérie",
          wilaya: "Blida / Blida / Oued El Alleug",
          tel1: "+213 555 20 20 20",
          tel2: "+213 555 20 20 21",
          email: "contact@mecaparts.dz",
          website: "https://mecaparts.dz",
          contact: {
            name: "Karim Benali",
            role: "Responsable commercial",
            phone: "+213 555 20 20 22",
            email: "karim.benali@mecaparts.dz",
          },
          legal: {
            rc: "16/00-123456B",
            nif: "001612345678901",
            nis: "0016123456789",
            articleImposition: "A-123",
            rib: "AL12 0001 2345 6789 0123 4567",
          },
          deliveryDays: 5,
          paymentTerm: "30 jours",
          currency: "DZD",
          discount: 5,
          status: "Actif",
          observations: "Fournisseur principal pour pièces mécaniques.",
          bcCount: 18,
          totalOrdered: 248000,
          avgDeliveryDays: 4.8,
          conformityRate: 98,
          disputes: 1,
          catalogue: [
            {
              id: "cat-1",
              supplierNumber: "FRN-001",
              article: "Roulement 6205 ZZ",
              refFourn: "MP-6205-ZZ",
              designation: "Roulement standard étanche",
              price: 1200,
              unit: "Pièce",
              moq: 6,
              leadTime: 4,
              discount: 2,
              availability: "En stock fournisseur",
              observations: "Tarif négocié trimestriellement",
              updatedAt: "2026-05-28T10:30:00.000Z",
            },
          ],
          contracts: [
            {
              id: "ctr-1",
              number: "CTR-001",
              supplierNumber: "FRN-001",
              type: "Contrat cadre",
              objet: "Contrat cadre pièces mécaniques",
              debut: "2026-01-01",
              fin: "2026-12-31",
              valeur: 1200000,
              conditions: "Livraison sous 5 jours ouvrés.",
              equipmentRefs: ["EQP-103"],
              articleRefs: ["ART-102"],
              alertDays: 30,
              autoRenew: true,
              documents: "Contrat signé + annexes",
              responsible: "Responsable Maintenance",
              status: "En cours",
            },
          ],
          warranties: [
            {
              id: "war-1",
              supplierNumber: "FRN-001",
              equipment: "EQP-103 — Convoyeur ligne emballage",
              debut: "2026-03-01",
              durationMonths: 12,
              endDate: "2027-03-01",
              conditions: "Garantie pièces et main d'oeuvre.",
              documents: "Bon de garantie, facture",
              status: "En garantie",
            },
          ],
          evaluations: [
            {
              id: "evl-1",
              number: "EVL-001",
              supplierNumber: "FRN-001",
              periode: "T1 2026",
              evaluator: "Responsable Maintenance",
              scores: {
                quality: 5,
                delay: 4,
                conformity: 5,
                sav: 4,
                price: 4,
                communication: 5,
              },
              global: 4.5,
              comments: "Bon niveau de service et réactivité correcte.",
              correctiveActions: "Suivi du délai de confirmation de commande.",
              recommendation: "Fournisseur recommandé",
            },
          ],
        },
        {
          id: "sup-2",
          number: "FRN-002",
          raisonSociale: "ElectroPro Distribution",
          nomCommercial: "ElectroPro",
          type: "Distributeur",
          domaine: "Électrique",
          adresse: "Rue des ateliers, Alger, Algérie",
          wilaya: "Alger / Kouba / Kouba",
          tel1: "+213 561 10 11 12",
          tel2: "+213 561 10 11 13",
          email: "support@electropro.dz",
          website: "https://electropro.dz",
          contact: {
            name: "Nadia Ziani",
            role: "Chargée comptes",
            phone: "+213 561 10 11 14",
            email: "nadia.ziani@electropro.dz",
          },
          legal: {
            rc: "16/00-223456B",
            nif: "001622345678901",
            nis: "0016223456789",
            articleImposition: "A-221",
            rib: "AL12 0002 2345 6789 0123 4567",
          },
          deliveryDays: 3,
          paymentTerm: "60 jours",
          currency: "DZD",
          discount: 8,
          status: "Actif",
          observations: "Délai rapide sur composants électriques et capteurs.",
          bcCount: 12,
          totalOrdered: 156500,
          avgDeliveryDays: 3.1,
          conformityRate: 95,
          disputes: 0,
          catalogue: [
            {
              id: "cat-2",
              supplierNumber: "FRN-002",
              article: "Fusible NH 125A",
              refFourn: "EP-NH125",
              designation: "Fusible NH pour armoire TGBT",
              price: 850,
              unit: "Pièce",
              moq: 10,
              leadTime: 2,
              discount: 3,
              availability: "En stock fournisseur",
              observations: "Stock disponible en permanence",
              updatedAt: "2026-05-27T08:15:00.000Z",
            },
          ],
          contracts: [
            {
              id: "ctr-2",
              number: "CTR-002",
              supplierNumber: "FRN-002",
              type: "Accord de partenariat",
              objet: "Accord de partenariat composants électriques",
              debut: "2026-02-01",
              fin: "2027-01-31",
              valeur: 850000,
              conditions: "Révision tarifaire trimestrielle.",
              equipmentRefs: ["EQP-101"],
              articleRefs: ["ART-101"],
              alertDays: 45,
              autoRenew: false,
              documents: "Accord signé",
              responsible: "Responsable Production",
              status: "En cours",
            },
          ],
          warranties: [
            {
              id: "war-2",
              supplierNumber: "FRN-002",
              equipment: "EQP-101 — TGBT Atlas",
              debut: "2026-04-10",
              durationMonths: 24,
              endDate: "2028-04-10",
              conditions: "Garantie constructeur + support technique.",
              documents: "Facture, certificat",
              status: "En garantie",
            },
          ],
          evaluations: [
            {
              id: "evl-2",
              number: "EVL-002",
              supplierNumber: "FRN-002",
              periode: "T1 2026",
              evaluator: "Responsable Production",
              scores: {
                quality: 4,
                delay: 5,
                conformity: 5,
                sav: 4,
                price: 5,
                communication: 4,
              },
              global: 4.5,
              comments: "Livraisons conformes, bonne communication.",
              correctiveActions:
                "Continuer le suivi des confirmations de livraison.",
              recommendation: "Fournisseur recommandé",
            },
          ],
        },
        {
          id: "sup-3",
          number: "FRN-003",
          raisonSociale: "HydroServices",
          nomCommercial: "HydroServices",
          type: "Prestataire de service",
          domaine: "Hydraulique",
          adresse: "Zone industrielle, Oran, Algérie",
          wilaya: "Oran / Es-Sénia / Es-Sénia",
          tel1: "+213 550 33 44 55",
          tel2: "+213 550 33 44 56",
          email: "contact@hydroservices.dz",
          website: "https://hydroservices.dz",
          contact: {
            name: "Sofiane Hadj",
            role: "Directeur technique",
            phone: "+213 550 33 44 57",
            email: "sofiane.hadj@hydroservices.dz",
          },
          legal: {
            rc: "31/00-445566A",
            nif: "003144556677889",
            nis: "0031445566778",
            articleImposition: "A-041",
            rib: "AL12 0003 2345 6789 0123 4567",
          },
          deliveryDays: 7,
          paymentTerm: "Comptant",
          currency: "DZD",
          discount: 3,
          status: "Suspendu",
          observations:
            "Interventions hydrauliques et lubrification spécialisée.",
          bcCount: 7,
          totalOrdered: 103200,
          avgDeliveryDays: 6.2,
          conformityRate: 89,
          disputes: 2,
          catalogue: [
            {
              id: "cat-3",
              supplierNumber: "FRN-003",
              article: "Huile hydraulique ISO VG 46",
              refFourn: "HS-H46",
              designation: "Huile hydraulique premium",
              price: 980,
              unit: "L",
              moq: 12,
              leadTime: 5,
              discount: 0,
              availability: "Sur commande",
              observations: "Livraison sur commande",
              updatedAt: "2026-05-26T14:00:00.000Z",
            },
          ],
          contracts: [
            {
              id: "ctr-3",
              number: "CTR-003",
              supplierNumber: "FRN-003",
              type: "Contrat de maintenance",
              objet: "Contrat maintenance hydraulique",
              debut: "2025-11-01",
              fin: "2026-10-31",
              valeur: 620000,
              conditions: "Intervention sous 72 h.",
              equipmentRefs: ["EQP-102"],
              articleRefs: ["ART-103"],
              alertDays: 20,
              autoRenew: false,
              documents: "Contrat signé",
              responsible: "Technicien Maintenance",
              status: "En cours",
            },
          ],
          warranties: [
            {
              id: "war-3",
              supplierNumber: "FRN-003",
              equipment: "EQP-102 — Pompe de refroidissement R1",
              debut: "2026-05-01",
              durationMonths: 12,
              endDate: "2027-05-01",
              conditions: "Sous réserve d'entretien périodique.",
              documents: "Bon de garantie, facture",
              status: "En garantie",
            },
          ],
          evaluations: [
            {
              id: "evl-3",
              number: "EVL-003",
              supplierNumber: "FRN-003",
              periode: "T1 2026",
              evaluator: "Technicien Maintenance",
              scores: {
                quality: 4,
                delay: 3,
                conformity: 4,
                sav: 3,
                price: 4,
                communication: 3,
              },
              global: 3.5,
              comments: "À surveiller sur le respect des délais.",
              correctiveActions: "Relance des confirmations de disponibilité.",
              recommendation: "À surveiller",
            },
          ],
        },
      ],
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
    if (tab === "catalogue") {
      return state.suppliers.flatMap((supplier) =>
        (supplier.catalogue || []).map((item) => ({
          ...item,
          supplierNumber: supplier.number,
          supplierName: supplier.raisonSociale,
          supplier,
        })),
      );
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
    updateHeader();
    const actionsEl = root.actions();
    const contentEl = root.content();
    if (!contentEl) return;
    const tab = activeTab;

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
      if (tab === "catalogue") tabContent.innerHTML = renderCatalogueTab(state);
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
    if (tab === "catalogue") {
      const items = getData("catalogue", state);
      return {
        count: items.length,
        active: items.filter((item) =>
          (item.availability || "").includes("stock"),
        ).length,
        score: items.length
          ? (
              items.reduce((sum, item) => sum + Number(item.price || 0), 0) /
              items.length
            ).toFixed(0)
          : "0",
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
        if (kind === "catalogue") openCatalogueModal();
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
          <div class="full"><label>Numéro</label><input name="number" value="${nextNumber}" readonly /></div>
          <div><label>Raison sociale *</label><input name="raisonSociale" value="${current.raisonSociale || ""}" required /></div>
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
          <div class="full"><label>Adresse complète</label><input name="adresse" value="${current.adresse || ""}" /></div>
          <div><label>Wilaya / Daira / Commune</label><input name="wilaya" value="${current.wilaya || ""}" /></div>
          <div><label>Téléphone principal</label><input name="tel1" value="${current.tel1 || ""}" /></div>
          <div><label>Téléphone secondaire</label><input name="tel2" value="${current.tel2 || ""}" /></div>
          <div><label>Email</label><input name="email" value="${current.email || ""}" /></div>
          <div><label>Site web</label><input name="website" value="${current.website || ""}" /></div>
          <div><label>Contact principal</label><input name="contactName" value="${current.contact?.name || ""}" /></div>
          <div><label>Poste / Fonction</label><input name="contactRole" value="${current.contact?.role || ""}" /></div>
          <div><label>Téléphone direct</label><input name="contactPhone" value="${current.contact?.phone || ""}" /></div>
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
          raisonSociale: fd.get("raisonSociale"),
          nomCommercial: fd.get("nomCommercial"),
          type: fd.get("type"),
          domaine: fd.get("domaine"),
          adresse: fd.get("adresse"),
          wilaya: fd.get("wilaya"),
          tel1: fd.get("tel1"),
          tel2: fd.get("tel2"),
          email: fd.get("email"),
          website: fd.get("website"),
          contact: {
            name: fd.get("contactName"),
            role: fd.get("contactRole"),
            phone: fd.get("contactPhone"),
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
          <div><label>Numéro</label><input name="number" value="${
            current.number ||
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

resetDemoDataIfNeeded();
bootstrapRoute();
renderNotifications();
