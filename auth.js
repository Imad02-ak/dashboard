(function () {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const languageStorageKey = "maintflow.authLanguage";
  const authTranslations = {
    fr: {
      documentTitleLogin: "MaintFlow - Connexion",
      documentTitleRegister: "MaintFlow - Inscription",
      pageAria: "Authentification MaintFlow",
      brandAria: "Présentation MaintFlow",
      logoAria: "MaintFlow accueil",
      languageAria: "Choisir la langue",
      brandSubtitle: "Plateforme intelligente de gestion de maintenance",
      features: [
        "Gérez tous vos actifs en un seul endroit",
        "Planifiez, suivez et optimisez vos opérations",
        "Optimisez vos ressources et vos coûts",
        "Suivez vos performances en temps réel",
      ],
      brandFooter: "Optimisez votre maintenance avec MaintFlow.",
      loginKicker: "Espace utilisateur",
      loginTitle: "Connexion",
      loginSubtitle: "Connectez-vous à votre espace MaintFlow",
      email: "Adresse e-mail",
      emailPlaceholder: "nom@entreprise.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      remember: "Se souvenir de moi",
      forgot: "Mot de passe oublié ?",
      loginButton: "Se connecter",
      noAccount: "Vous n'avez pas de compte ?",
      createAccount: "Créer un compte",
      registerKicker: "Nouvel accès",
      registerTitle: "Créer un compte",
      registerSubtitle: "Rejoignez votre plateforme MaintFlow",
      firstName: "Prénom",
      firstNamePlaceholder: "Prénom",
      lastName: "Nom",
      lastNamePlaceholder: "Nom",
      birthDate: "Date de naissance",
      passwordNewPlaceholder: "8 caractères minimum",
      confirmation: "Confirmation",
      confirmationPlaceholder: "Confirmer le mot de passe",
      createCompany: "Créer une nouvelle entreprise",
      companyCode: "Code entreprise",
      companyCodePlaceholder: "Ex : MF-2026-ALGER",
      companyMiniTitle: "Entreprise",
      companyInfo: "Informations de l'entreprise",
      newBadge: "Nouvelle",
      uploadLogo: "Logo entreprise",
      uploadHint: "PNG, JPG ou WEBP.",
      companyName: "Nom entreprise",
      companyNamePlaceholder: "MaintFlow Industrie",
      wilaya: "Wilaya",
      wilayaPlaceholder: "Alger",
      daira: "Daïra",
      dairaPlaceholder: "Daïra",
      commune: "Commune",
      communePlaceholder: "Commune",
      companyCreatedAt: "Date de création",
      phone: "Téléphone",
      phonePlaceholder: "+213 000 00 00 00",
      address: "Adresse",
      addressPlaceholder: "Adresse complète",
      website: "Site web",
      websitePlaceholder: "https://entreprise.com",
      registerButton: "Créer mon compte",
      haveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      required: "{field} est requis.",
      invalidEmail: "Veuillez saisir une adresse e-mail valide.",
      invalidUrl: "Veuillez saisir une URL valide.",
      minLength: "Minimum {count} caractères.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      fixFields: "Veuillez corriger les champs signalés.",
      loginSuccess: "Connexion validée. Redirection vers le tableau de bord...",
      registerSuccess: "Compte prêt à être créé. Redirection vers la connexion...",
    },
    en: {
      documentTitleLogin: "MaintFlow - Login",
      documentTitleRegister: "MaintFlow - Sign up",
      pageAria: "MaintFlow authentication",
      brandAria: "MaintFlow overview",
      logoAria: "MaintFlow home",
      languageAria: "Choose language",
      brandSubtitle: "Smart maintenance management platform",
      features: [
        "Manage all your assets in one place",
        "Plan, track, and optimize your operations",
        "Optimize your resources and costs",
        "Track your performance in real time",
      ],
      brandFooter: "Optimize your maintenance with MaintFlow.",
      loginKicker: "User area",
      loginTitle: "Login",
      loginSubtitle: "Sign in to your MaintFlow workspace",
      email: "Email address",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      remember: "Remember me",
      forgot: "Forgot password?",
      loginButton: "Sign in",
      noAccount: "Don't have an account?",
      createAccount: "Create an account",
      registerKicker: "New access",
      registerTitle: "Create an account",
      registerSubtitle: "Join your MaintFlow platform",
      firstName: "First name",
      firstNamePlaceholder: "First name",
      lastName: "Last name",
      lastNamePlaceholder: "Last name",
      birthDate: "Date of birth",
      passwordNewPlaceholder: "8 characters minimum",
      confirmation: "Confirmation",
      confirmationPlaceholder: "Confirm password",
      createCompany: "Create a new company",
      companyCode: "Company code",
      companyCodePlaceholder: "Ex: MF-2026-ALGER",
      companyMiniTitle: "Company",
      companyInfo: "Company information",
      newBadge: "New",
      uploadLogo: "Company logo",
      uploadHint: "PNG, JPG, or WEBP.",
      companyName: "Company name",
      companyNamePlaceholder: "MaintFlow Industry",
      wilaya: "Wilaya",
      wilayaPlaceholder: "Algiers",
      daira: "District",
      dairaPlaceholder: "District",
      commune: "Municipality",
      communePlaceholder: "Municipality",
      companyCreatedAt: "Creation date",
      phone: "Phone",
      phonePlaceholder: "+213 000 00 00 00",
      address: "Address",
      addressPlaceholder: "Full address",
      website: "Website",
      websitePlaceholder: "https://company.com",
      registerButton: "Create my account",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      showPassword: "Show password",
      hidePassword: "Hide password",
      required: "{field} is required.",
      invalidEmail: "Please enter a valid email address.",
      invalidUrl: "Please enter a valid URL.",
      minLength: "Minimum {count} characters.",
      passwordMismatch: "Passwords do not match.",
      fixFields: "Please correct the highlighted fields.",
      loginSuccess: "Login validated. Redirecting to the dashboard...",
      registerSuccess: "Account ready to be created. Redirecting to login...",
    },
  };

  function getAuthLanguage() {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "fr";
  }

  function translate(key, replacements = {}) {
    let value = authTranslations[getAuthLanguage()][key] || authTranslations.fr[key] || "";
    Object.entries(replacements).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, String(replacement));
    });
    return value;
  }

  function setText(selector, value, root = document) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setPlaceholder(selector, value, root = document) {
    const element = root.querySelector(selector);
    if (element) element.placeholder = value;
  }

  function applyAuthTranslations() {
    const lang = getAuthLanguage();
    const text = authTranslations[lang];
    const isRegister = Boolean(document.getElementById("registerForm"));
    document.documentElement.lang = lang === "en" ? "en" : "fr";
    document.title = isRegister ? text.documentTitleRegister : text.documentTitleLogin;
    document.querySelector(".auth-layout")?.setAttribute("aria-label", text.pageAria);
    document.querySelector(".auth-brand-panel")?.setAttribute("aria-label", text.brandAria);
    document.querySelector(".auth-logo")?.setAttribute("aria-label", text.logoAria);

    const languageSelect = document.getElementById("authLanguageSelect");
    if (languageSelect) {
      languageSelect.value = lang;
      languageSelect.setAttribute("aria-label", text.languageAria);
    }

    setText(".auth-brand-copy p", text.brandSubtitle);
    document.querySelectorAll(".auth-feature-card span").forEach((item, index) => {
      item.textContent = text.features[index] || "";
    });
    setText(".auth-brand-footer", text.brandFooter);

    if (document.getElementById("loginForm")) {
      setText(".auth-kicker", text.loginKicker);
      setText(".auth-card-head h2", text.loginTitle);
      setText(".auth-card-head p", text.loginSubtitle);
      setText("label[for='loginEmail']", text.email);
      setPlaceholder("#loginEmail", text.emailPlaceholder);
      setText("label[for='loginPassword']", text.password);
      setPlaceholder("#loginPassword", text.passwordPlaceholder);
      setText("label[for='rememberMe'] span", text.remember);
      const forgotLink = document.querySelector(".auth-form-row .auth-link");
      if (forgotLink) {
        forgotLink.textContent = text.forgot;
        forgotLink.setAttribute("aria-label", text.forgot);
      }
      setText(".auth-submit span", text.loginButton);
      const switchEl = document.querySelector(".auth-switch");
      if (switchEl) {
        switchEl.innerHTML = `${text.noAccount} <a class="auth-link" href="register.html">${text.createAccount}</a>`;
      }
    }

    if (isRegister) {
      setText(".auth-kicker", text.registerKicker);
      setText(".auth-card-head h2", text.registerTitle);
      setText(".auth-card-head p", text.registerSubtitle);
      setText("label[for='firstName']", text.firstName);
      setPlaceholder("#firstName", text.firstNamePlaceholder);
      setText("label[for='lastName']", text.lastName);
      setPlaceholder("#lastName", text.lastNamePlaceholder);
      setText("label[for='birthDate']", text.birthDate);
      setText("label[for='registerEmail']", text.email);
      setPlaceholder("#registerEmail", text.emailPlaceholder);
      setText("label[for='registerPassword']", text.password);
      setPlaceholder("#registerPassword", text.passwordNewPlaceholder);
      setText("label[for='confirmPassword']", text.confirmation);
      setPlaceholder("#confirmPassword", text.confirmationPlaceholder);
      setText("label[for='createCompany'] span", text.createCompany);
      setText("label[for='companyCode']", text.companyCode);
      setPlaceholder("#companyCode", text.companyCodePlaceholder);
      setText(".card-mini-title", text.companyMiniTitle);
      setText("#companyInfoTitle", text.companyInfo);
      const badge = document.querySelector(".auth-section-badge");
      if (badge) badge.lastChild.textContent = ` ${text.newBadge}`;
      setText(".auth-upload-btn span", text.uploadLogo);
      setText(".auth-field-hint", text.uploadHint);
      setText("label[for='companyName']", text.companyName);
      setPlaceholder("#companyName", text.companyNamePlaceholder);
      setText("label[for='wilaya']", text.wilaya);
      setPlaceholder("#wilaya", text.wilayaPlaceholder);
      setText("label[for='daira']", text.daira);
      setPlaceholder("#daira", text.dairaPlaceholder);
      setText("label[for='commune']", text.commune);
      setPlaceholder("#commune", text.communePlaceholder);
      setText("label[for='companyCreatedAt']", text.companyCreatedAt);
      setText("label[for='companyPhone']", text.phone);
      setPlaceholder("#companyPhone", text.phonePlaceholder);
      setText("label[for='companyAddress']", text.address);
      setPlaceholder("#companyAddress", text.addressPlaceholder);
      setText("label[for='companyWebsite']", text.website);
      setPlaceholder("#companyWebsite", text.websitePlaceholder);
      setText(".auth-submit span", text.registerButton);
      const switchEl = document.querySelector(".auth-switch");
      if (switchEl) {
        switchEl.innerHTML = `${text.haveAccount} <a class="auth-link" href="login.html">${text.signIn}</a>`;
      }
    }

    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = button.parentElement?.querySelector("input");
      const isVisible = input?.type === "text";
      button.setAttribute("aria-label", isVisible ? text.hidePassword : text.showPassword);
    });
  }

  function initAuthLanguageSelector() {
    const languageSelect = document.getElementById("authLanguageSelect");
    if (!languageSelect) return;
    languageSelect.value = getAuthLanguage();
    languageSelect.addEventListener("change", function () {
      localStorage.setItem(languageStorageKey, this.value === "en" ? "en" : "fr");
      applyAuthTranslations();
      document.querySelectorAll("input, textarea").forEach(clearError);
      document.querySelectorAll(".auth-status").forEach((status) => {
        status.textContent = "";
        status.classList.remove("is-visible", "is-error");
      });
    });
  }

  function getField(input) {
    return input.closest("[data-field]");
  }

  function getErrorEl(input) {
    return getField(input)?.querySelector(".auth-error");
  }

  function setError(input, message) {
    const field = getField(input);
    const error = getErrorEl(input);
    if (!field || !error) return;

    field.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
  }

  function clearError(input) {
    setError(input, "");
  }

  function isVisibleInput(input) {
    return !input.disabled && input.offsetParent !== null;
  }

  function getRequiredMessage(input) {
    const label = getField(input)?.querySelector("label")?.textContent?.trim() || "Ce champ";
    return translate("required", { field: label });
  }

  function validateInput(input, form) {
    if (!isVisibleInput(input)) {
      clearError(input);
      return true;
    }

    const value = input.value.trim();
    if (input.required && !value) {
      setError(input, getRequiredMessage(input));
      return false;
    }

    if (input.type === "email" && value && !emailPattern.test(value)) {
      setError(input, translate("invalidEmail"));
      return false;
    }

    if (input.type === "url" && value) {
      try {
        new URL(value);
      } catch (error) {
        setError(input, translate("invalidUrl"));
        return false;
      }
    }

    if (input.minLength > 0 && value && value.length < input.minLength) {
      setError(input, translate("minLength", { count: input.minLength }));
      return false;
    }

    if (input.name === "confirmPassword") {
      const password = form.querySelector("input[name='password']");
      if (password && value !== password.value) {
        setError(input, translate("passwordMismatch"));
        return false;
      }
    }

    clearError(input);
    return true;
  }

  function setStatus(form, message, isError) {
    const status = form.querySelector(".auth-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-visible", Boolean(message));
    status.classList.toggle("is-error", Boolean(isError));
  }

  function validateForm(form) {
    const inputs = Array.from(form.querySelectorAll("input, textarea"));
    const valid = inputs.every((input) => validateInput(input, form));
    const firstError = form.querySelector(".has-error input, .has-error textarea");
    if (firstError) firstError.focus();
    return valid;
  }

  function initPasswordToggles(root) {
    root.querySelectorAll("[data-password-toggle]").forEach((button) => {
      button.addEventListener("click", function () {
        const input = button.parentElement.querySelector("input");
        if (!input) return;

        const shouldShow = input.type === "password";
        input.type = shouldShow ? "text" : "password";
        button.setAttribute("aria-pressed", shouldShow ? "true" : "false");
        button.setAttribute(
          "aria-label",
          shouldShow ? translate("hidePassword") : translate("showPassword"),
        );
        button.querySelector("i")?.classList.toggle("fa-eye", !shouldShow);
        button.querySelector("i")?.classList.toggle("fa-eye-slash", shouldShow);
      });
    });
  }

  function initLiveValidation(form) {
    form.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", function () {
        if (getField(input)?.classList.contains("has-error")) {
          validateInput(input, form);
        }
      });

      input.addEventListener("blur", function () {
        validateInput(input, form);
      });
    });
  }

  function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    initLiveValidation(form);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(form, "", false);

      if (!validateForm(form)) {
        setStatus(form, translate("fixFields"), true);
        return;
      }

      setStatus(form, translate("loginSuccess"));
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 650);
    });
  }

  function setCompanyMode(form, createCompany) {
    const codeField = document.getElementById("companyCodeField");
    const companyCard = document.getElementById("companyInfoCard");
    const companyInputs = Array.from(companyCard?.querySelectorAll("input, textarea") || []);
    const companyCode = document.getElementById("companyCode");

    codeField?.classList.toggle("is-hidden", createCompany);
    companyCard?.classList.toggle("is-hidden", !createCompany);

    if (companyCode) {
      companyCode.required = !createCompany;
      if (createCompany) clearError(companyCode);
    }

    companyInputs.forEach((input) => {
      if (input.type !== "file") input.required = createCompany && ["companyName", "wilaya", "daira", "commune", "companyCreatedAt", "companyPhone", "companyAddress"].includes(input.name);
      if (!createCompany) clearError(input);
    });

    setStatus(form, "", false);
  }

  function initLogoPreview() {
    const input = document.getElementById("companyLogo");
    const preview = document.getElementById("companyLogoPreview");
    const icon = document.querySelector(".auth-upload-preview i");
    if (!input || !preview) return;

    input.addEventListener("change", function () {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        preview.src = String(reader.result || "");
        preview.hidden = false;
        if (icon) icon.hidden = true;
      };
      reader.readAsDataURL(file);
    });
  }

  function initRegisterForm() {
    const form = document.getElementById("registerForm");
    const createCompany = document.getElementById("createCompany");
    if (!form) return;

    initLiveValidation(form);
    initLogoPreview();

    if (createCompany) {
      setCompanyMode(form, createCompany.checked);
      createCompany.addEventListener("change", function () {
        setCompanyMode(form, createCompany.checked);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(form, "", false);

      if (!validateForm(form)) {
        setStatus(form, translate("fixFields"), true);
        return;
      }

      setStatus(form, translate("registerSuccess"));
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 750);
    });
  }

  applyAuthTranslations();
  initAuthLanguageSelector();
  initPasswordToggles(document);
  initLoginForm();
  initRegisterForm();
})();
