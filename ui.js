// ui.js
document.addEventListener("DOMContentLoaded", () => {
  const newSessionBtn = document.getElementById("new-session-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const modelSelect = document.getElementById("model-select");

  // Load theme from localStorage.
  const savedTheme = localStorage.getItem("themeMode") || "dark";
  if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
    themeToggle.checked = true;
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
    themeToggle.checked = false;
  }

  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
      localStorage.setItem("themeMode", "light");
    } else {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("themeMode", "dark");
    }
  });

  newSessionBtn.addEventListener("click", () => {
    const newSess = Storage.createSession("New Chat");
    localStorage.setItem("currentSessionId", newSess.id);
    location.reload();
  });

  // Dynamically fetch and categorize text models.
  fetch("https://text.pollinations.ai/models")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(models => {
      console.log("Fetched models:", models);

      function createOptGroup(label, modelsArray) {
        if (modelsArray.length === 0) return null;
        const group = document.createElement("optgroup");
        group.label = label;
        modelsArray.forEach(m => {
          const opt = document.createElement("option");
          opt.value = m.name;
          opt.textContent = m.description || m.name;
          let tooltip = m.description || m.name;
          tooltip += m.censored !== undefined ? (m.censored ? " (Censored)" : " (Uncensored)") : "";
          tooltip += m.reasoning ? " | Reasoning" : "";
          tooltip += m.vision ? " | Vision" : "";
          tooltip += m.audio ? " | Audio: " + (m.voices ? m.voices.join(", ") : "N/A") : "";
          tooltip += m.provider ? " | Provider: " + m.provider : "";
          opt.title = tooltip;
          group.appendChild(opt);
        });
        return group;
      }

      modelSelect.innerHTML = "";
      const baseModels = models.filter(m => m.baseModel);
      const customModels = models.filter(m => !m.baseModel && m.type !== "safety");
      const safetyModels = models.filter(m => m.type === "safety");

      const groups = [
        createOptGroup("Base Models", baseModels),
        createOptGroup("Custom Models", customModels),
        createOptGroup("Safety Models", safetyModels)
      ].filter(g => g !== null);

      groups.forEach(g => {
        if (g) modelSelect.appendChild(g);
      });

      const currentSession = Storage.getCurrentSession();
      // If the session doesn't have a model, force default to "unity"
      if (currentSession) {
        if (!currentSession.model || currentSession.model.trim() === "") {
          currentSession.model = "unity";
          Storage.setSessionModel(currentSession.id, "unity");
        }
        modelSelect.value = currentSession.model;
      } else {
        modelSelect.value = "unity";
      }
    })
    .catch(err => {
      console.error("Failed to fetch text models:", err);
    });

  modelSelect.addEventListener("change", () => {
    const currentSession = Storage.getCurrentSession();
    if (!currentSession) return;
    Storage.setSessionModel(currentSession.id, modelSelect.value);
  });
});