// ui.js

document.addEventListener("DOMContentLoaded", () => {
    const codePanel = document.getElementById("code-panel");
    const toggleCodeBtn = document.getElementById("toggle-code");
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
  
    toggleCodeBtn.addEventListener("click", () => {
      codePanel.classList.toggle("visible");
      toggleCodeBtn.textContent = codePanel.classList.contains("visible") ? "➡️" : "⬅️";
      Storage.saveCodePanelState();
    });
  
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
  
    // Dynamically fetch and categorize text models from the API.
    fetch("https://text.pollinations.ai/models")
      .then(res => res.json())
      .then(models => {
        // Group models into Base, Custom, and Safety.
        const baseModels = [];
        const customModels = [];
        const safetyModels = [];
  
        models.forEach(m => {
          if (m.type === "safety") {
            safetyModels.push(m);
          } else if (m.baseModel) {
            baseModels.push(m);
          } else {
            customModels.push(m);
          }
        });
  
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
        const groups = [
          createOptGroup("Base Models", baseModels),
          createOptGroup("Custom Models", customModels),
          createOptGroup("Safety Models", safetyModels)
        ];
        groups.forEach(g => {
          if (g) modelSelect.appendChild(g);
        });
  
        // Set the selected model based on the current session.
        const currentSession = Storage.getCurrentSession();
        if (currentSession && currentSession.model) {
          modelSelect.value = currentSession.model;
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
  