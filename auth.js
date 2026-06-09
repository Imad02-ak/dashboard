(function () {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return `${label} est requis.`;
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
      setError(input, "Veuillez saisir une adresse e-mail valide.");
      return false;
    }

    if (input.type === "url" && value) {
      try {
        new URL(value);
      } catch (error) {
        setError(input, "Veuillez saisir une URL valide.");
        return false;
      }
    }

    if (input.minLength > 0 && value && value.length < input.minLength) {
      setError(input, `Minimum ${input.minLength} caractères.`);
      return false;
    }

    if (input.name === "confirmPassword") {
      const password = form.querySelector("input[name='password']");
      if (password && value !== password.value) {
        setError(input, "Les mots de passe ne correspondent pas.");
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
          shouldShow ? "Masquer le mot de passe" : "Afficher le mot de passe",
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
        setStatus(form, "Veuillez corriger les champs signalés.", true);
        return;
      }

      setStatus(form, "Connexion validée. Redirection vers le tableau de bord...");
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
        setStatus(form, "Veuillez corriger les champs signalés.", true);
        return;
      }

      setStatus(form, "Compte prêt à être créé. Redirection vers la connexion...");
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 750);
    });
  }

  initPasswordToggles(document);
  initLoginForm();
  initRegisterForm();
})();
