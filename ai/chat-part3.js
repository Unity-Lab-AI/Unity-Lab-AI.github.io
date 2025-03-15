document.addEventListener("DOMContentLoaded", () => {
  const newSessionBtn = document.getElementById("new-session-btn");
  const modelSelect = document.getElementById("model-select");
  const donationOpenBtn = document.getElementById("donation-open-btn");
  const donationModal = document.getElementById("donation-modal");
  const donationModalClose = document.getElementById("donation-modal-close");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const settingsModalClose = document.getElementById("settings-modal-close");
  const themeSelect = document.getElementById("theme-select");
  const themeSelectSettings = document.getElementById("theme-select-settings");
  const voiceSelectSettings = document.getElementById("voice-select-settings");
  const openPersonalizationBtn = document.getElementById("open-personalization-btn");
  const openPersonalizationSettings = document.getElementById("open-personalization-settings");
  const personalizationModal = document.getElementById("personalization-modal");
  const personalizationClose = document.getElementById("personalization-close");
  const savePersonalizationBtn = document.getElementById("save-personalization");
  const cancelPersonalizationBtn = document.getElementById("cancel-personalization");
  const openMemoryManagerBtn = document.getElementById("open-memory-manager");
  const memoryModal = document.getElementById("memory-modal");
  const memoryModalClose = document.getElementById("memory-modal-close");
  const memoryList = document.getElementById("memory-list");
  const addMemoryBtn = document.getElementById("add-memory-btn");
  const clearAllMemoryBtn = document.getElementById("clear-all-memory-btn");
  const addMemoryModal = document.getElementById("add-memory-modal");
  const addMemoryModalClose = document.getElementById("add-memory-modal-close");
  const newMemoryText = document.getElementById("new-memory-text");
  const saveNewMemoryBtn = document.getElementById("save-new-memory-btn");
  const cancelNewMemoryBtn = document.getElementById("cancel-new-memory-btn");
  const clearChatSessionsBtn = document.getElementById("clear-chat-sessions-btn");
  const clearUserDataBtn = document.getElementById("clear-user-data-btn");

  let themeLinkElement = document.getElementById("theme-link");
  if (!themeLinkElement) {
      themeLinkElement = document.createElement("link");
      themeLinkElement.id = "theme-link";
      themeLinkElement.rel = "stylesheet";
      document.head.appendChild(themeLinkElement);
  }

  const allThemes = [
      { value: "light", label: "Light", file: "themes/light.css" },
      { value: "dark", label: "Dark", file: "themes/dark.css" },
      { value: "hacker", label: "Hacker", file: "themes/hacker.css" },
      { value: "oled", label: "OLED Dark", file: "themes/oled.css" },
      { value: "subtle-light", label: "Subtle Light", file: "themes/subtle_light.css" },
      { value: "burple", label: "Burple", file: "themes/burple.css" },
      { value: "pretty-pink", label: "Pretty Pink", file: "themes/pretty_pink.css" },
      { value: "nord", label: "Nord", file: "themes/nord.css" },
      { value: "solarized-light", label: "Solarized Light", file: "themes/solarized_light.css" },
      { value: "solarized-dark", label: "Solarized Dark", file: "themes/solarized_dark.css" },
      { value: "gruvbox-light", label: "Gruvbox Light", file: "themes/gruvbox_light.css" },
      { value: "gruvbox-dark", label: "Gruvbox Dark", file: "themes/gruvbox_dark.css" },
      { value: "cyberpunk", label: "Cyberpunk", file: "themes/cyberpunk.css" },
      { value: "dracula", label: "Dracula", file: "themes/dracula.css" },
      { value: "monokai", label: "Monokai", file: "themes/monokai.css" },
      { value: "material-dark", label: "Material Dark", file: "themes/material_dark.css" },
      { value: "material-light", label: "Material Light", file: "themes/material_light.css" },
      { value: "pastel-dream", label: "Pastel Dream", file: "themes/pastel_dream.css" },
      { value: "ocean-breeze", label: "Ocean Breeze", file: "themes/ocean_breeze.css" },
      { value: "vintage-paper", label: "Vintage Paper", file: "themes/vintage_paper.css" },
      { value: "honeycomb", label: "Honeycomb", file: "themes/honeycomb.css" },
      { value: "rainbow-throwup", label: "Rainbow Throwup", file: "themes/rainbow_throwup.css" },
      { value: "serenity", label: "Serenity", file: "themes/serenity.css" }
  ];

  function populateThemeDropdowns() {
      themeSelect.innerHTML = "";
      themeSelectSettings.innerHTML = "";
      allThemes.forEach(themeObj => {
          const opt1 = document.createElement("option");
          opt1.value = themeObj.value;
          opt1.textContent = themeObj.label;
          opt1.title = `Apply the ${themeObj.label} theme.`;
          themeSelect.appendChild(opt1);

          const opt2 = document.createElement("option");
          opt2.value = themeObj.value;
          opt2.textContent = themeObj.label;
          opt2.title = `Apply the ${themeObj.label} theme.`;
          themeSelectSettings.appendChild(opt2);
      });
  }
  populateThemeDropdowns();

  function loadUserTheme() {
      const savedTheme = localStorage.getItem("selectedTheme") || "dark";
      themeSelect.value = savedTheme;
      themeSelectSettings.value = savedTheme;
      const found = allThemes.find(t => t.value === savedTheme);
      themeLinkElement.href = found ? found.file : "themes/dark.css";
  }
  loadUserTheme();

  function changeTheme(newThemeValue) {
      localStorage.setItem("selectedTheme", newThemeValue);
      themeSelect.value = newThemeValue;
      themeSelectSettings.value = newThemeValue;
      const found = allThemes.find(t => t.value === newThemeValue);
      themeLinkElement.href = found ? found.file : "";
  }

  themeSelect.addEventListener("change", () => {
      changeTheme(themeSelect.value);
  });
  themeSelectSettings.addEventListener("change", () => {
      changeTheme(themeSelectSettings.value);
  });

  function fetchPollinationsModels() {
      fetch("https://text.pollinations.ai/models", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store"
      }).then(res => {
          if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
      }).then(models => {
          modelSelect.innerHTML = "";
          let hasValidModel = false;

          models.forEach(m => {
              if (m.type !== "safety" && m.name) {
                  const opt = document.createElement("option");
                  opt.value = m.name;
                  opt.textContent = m.description || m.name;

                  let tooltip = m.description || m.name;
                  if (m.censored !== undefined) {
                      tooltip += m.censored ? " (Censored)" : " (Uncensored)";
                  }
                  if (m.reasoning) tooltip += " | Reasoning";
                  if (m.vision) tooltip += " | Vision";
                  if (m.audio) tooltip += " | Audio: " + (m.voices ? m.voices.join(", ") : "N/A");
                  if (m.provider) tooltip += " | Provider: " + m.provider;

                  opt.title = tooltip;
                  modelSelect.appendChild(opt);
                  hasValidModel = true;
              }
          });

          if (!hasValidModel) {
              const fallbackOpt = document.createElement("option");
              fallbackOpt.value = "unity";
              fallbackOpt.textContent = "Unity (Fallback)";
              modelSelect.appendChild(fallbackOpt);
              modelSelect.value = "unity";
          }

          const currentSession = Storage.getCurrentSession();
          if (currentSession && currentSession.model) {
              const modelExists = Array.from(modelSelect.options).some(option => option.value === currentSession.model);
              if (modelExists) {
                  modelSelect.value = currentSession.model;
              } else {
                  const tempOpt = document.createElement("option");
                  tempOpt.value = currentSession.model;
                  tempOpt.textContent = `${currentSession.model} (Previously Selected - May Be Unavailable)`;
                  tempOpt.title = "This model may no longer be available";
                  modelSelect.appendChild(tempOpt);
                  modelSelect.value = currentSession.model;
              }
          } else if (!modelSelect.value) {
              modelSelect.value = "unity";
          }
      }).catch(err => {
          modelSelect.innerHTML = "";
          const fallbackOpt = document.createElement("option");
          fallbackOpt.value = "unity";
          fallbackOpt.textContent = "Unity (Fallback - API Unavailable)";
          modelSelect.appendChild(fallbackOpt);
          modelSelect.value = "unity";

          const currentSession = Storage.getCurrentSession();
          if (currentSession && currentSession.model && currentSession.model !== "unity") {
              const sessOpt = document.createElement("option");
              sessOpt.value = currentSession.model;
              sessOpt.textContent = `${currentSession.model} (From Session - May Be Unavailable)`;
              modelSelect.appendChild(sessOpt);
              modelSelect.value = currentSession.model;
          }
      });
  }
  fetchPollinationsModels();

  modelSelect.addEventListener("change", () => {
      const currentSession = Storage.getCurrentSession();
      if (currentSession) {
          const newModel = modelSelect.value;
          Storage.setSessionModel(currentSession.id, newModel);
          const originalBg = modelSelect.style.backgroundColor;
          modelSelect.style.backgroundColor = "#4CAF50";
          modelSelect.style.color = "white";
          setTimeout(() => {
              modelSelect.style.backgroundColor = originalBg;
              modelSelect.style.color = "";
          }, 500);
      }
  });

  newSessionBtn.addEventListener("click", () => {
      localStorage.setItem("firstLaunch", "1");
      const newSess = Storage.createSession("New Chat");
      localStorage.setItem("currentSessionId", newSess.id);
      location.reload();
  });

  donationOpenBtn.addEventListener("click", () => {
      donationModal.classList.remove("hidden");
  });
  donationModalClose.addEventListener("click", () => {
      donationModal.classList.add("hidden");
  });

  openSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.remove("hidden");
      if (window._chatInternals && window._chatInternals.voices && window._chatInternals.voices.length > 0) {
          window._chatInternals.populateAllVoiceDropdowns();
      }
  });
  settingsModalClose.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
  });

  if (openPersonalizationBtn) {
      openPersonalizationBtn.addEventListener("click", () => {
          openPersonalizationModal();
      });
  }
  if (openPersonalizationSettings) {
      openPersonalizationSettings.addEventListener("click", () => {
          openPersonalizationModal();
      });
  }
  if (personalizationClose) {
      personalizationClose.addEventListener("click", () => {
          personalizationModal.classList.add("hidden");
      });
  }
  if (cancelPersonalizationBtn) {
      cancelPersonalizationBtn.addEventListener("click", () => {
          personalizationModal.classList.add("hidden");
      });
  }
  if (savePersonalizationBtn) {
      savePersonalizationBtn.addEventListener("click", () => {
          const userData = {
              name: document.getElementById('user-name').value.trim(),
              interests: document.getElementById('user-interests').value.trim(),
              aiTraits: document.getElementById('ai-traits').value.trim(),
              additionalInfo: document.getElementById('additional-info').value.trim()
          };
          localStorage.setItem('userPersonalization', JSON.stringify(userData));
          const hasData = Object.values(userData).some(value => value !== '');
          if (hasData) {
              let memoryText = "User Personalization:";
              if (userData.name) memoryText += `\n- Name: ${userData.name}`;
              if (userData.interests) memoryText += `\n- Interests: ${userData.interests}`;
              if (userData.aiTraits) memoryText += `\n- Preferred AI traits: ${userData.aiTraits}`;
              if (userData.additionalInfo) memoryText += `\n- Additional info: ${userData.additionalInfo}`;
              addOrUpdatePersonalizationMemory(memoryText);
          }
          window.showToast("Personalization saved");
          personalizationModal.classList.add("hidden");
      });
  }

  function openPersonalizationModal() {
      if (!personalizationModal) return;
      loadPersonalization();
      personalizationModal.classList.remove("hidden");
  }

  function loadPersonalization() {
      const savedData = localStorage.getItem('userPersonalization');
      if (savedData) {
          try {
              const userData = JSON.parse(savedData);
              if (document.getElementById('user-name')) {
                  document.getElementById('user-name').value = userData.name || '';
              }
              if (document.getElementById('user-interests')) {
                  document.getElementById('user-interests').value = userData.interests || '';
              }
              if (document.getElementById('ai-traits')) {
                  document.getElementById('ai-traits').value = userData.aiTraits || '';
              }
              if (document.getElementById('additional-info')) {
                  document.getElementById('additional-info').value = userData.additionalInfo || '';
              }
          } catch (error) {
              console.error("Error loading personalization data:", error);
          }
      }
  }

  function addOrUpdatePersonalizationMemory(memoryText) {
      const memories = Memory.getMemories();
      const personalizationIndex = memories.findIndex(m => m.startsWith("User Personalization:"));
      if (personalizationIndex !== -1) {
          Memory.removeMemoryEntry(personalizationIndex);
      }
      Memory.addMemoryEntry(memoryText);
  }

  openMemoryManagerBtn.addEventListener("click", () => {
      memoryModal.classList.remove("hidden");
      loadMemoryEntries();
  });
  memoryModalClose.addEventListener("click", () => {
      memoryModal.classList.add("hidden");
  });

  addMemoryBtn.addEventListener("click", () => {
      addMemoryModal.classList.remove("hidden");
      newMemoryText.value = "";
  });
  addMemoryModalClose.addEventListener("click", () => {
      addMemoryModal.classList.add("hidden");
  });
  cancelNewMemoryBtn.addEventListener("click", () => {
      addMemoryModal.classList.add("hidden");
  });
  saveNewMemoryBtn.addEventListener("click", () => {
      const txt = newMemoryText.value.trim();
      if (!txt) return;
      Memory.addMemoryEntry(txt);
      addMemoryModal.classList.add("hidden");
      loadMemoryEntries();
      window.showToast("Memory added successfully");
  });

  clearAllMemoryBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to clear ALL memory entries?")) return;
      Memory.clearAllMemories();
      loadMemoryEntries();
      window.showToast("All memories cleared");
  });

  function loadMemoryEntries() {
      memoryList.innerHTML = "";
      const arr = Memory.getMemories();
      arr.forEach((line, idx) => {
          const li = document.createElement("li");
          li.style.padding = "8px";
          li.style.marginBottom = "6px";
          li.style.backgroundColor = "rgba(0,0,0,0.05)";
          li.style.borderRadius = "8px";
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "flex-start";
          const textDiv = document.createElement("div");
          textDiv.style.flex = "1";
          textDiv.style.marginRight = "10px";
          textDiv.textContent = line;
          li.appendChild(textDiv);

          const btnContainer = document.createElement("div");
          btnContainer.style.display = "flex";
          btnContainer.style.gap = "6px";

          const editBtn = document.createElement("button");
          editBtn.className = "btn btn-sm btn-secondary";
          editBtn.innerHTML = '<i class="fas fa-pen"></i>';
          editBtn.title = "Edit this memory entry";
          editBtn.style.minWidth = "40px";
          editBtn.addEventListener("click", () => {
              const newText = prompt("Edit memory entry:", line);
              if (!newText || newText.trim() === line) {
                  return;
              }
              const success = Memory.updateMemoryEntry(idx, newText);
              if (success) {
                  window.showToast("Memory updated");
                  loadMemoryEntries();
              }
          });
          btnContainer.appendChild(editBtn);

          const delBtn = document.createElement("button");
          delBtn.className = "btn btn-sm btn-danger";
          delBtn.innerHTML = '<i class="fas fa-trash"></i>';
          delBtn.title = "Delete this memory entry";
          delBtn.style.minWidth = "40px";
          delBtn.addEventListener("click", () => {
              if (!confirm(`Delete memory entry?\n"${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`)) {
                  return;
              }
              Memory.removeMemoryEntry(idx);
              loadMemoryEntries();
              window.showToast("Memory deleted");
          });
          btnContainer.appendChild(delBtn);

          li.appendChild(btnContainer);
          memoryList.appendChild(li);
      });

      if (arr.length === 0) {
          const emptyMsg = document.createElement("p");
          emptyMsg.className = "text-center text-muted";
          emptyMsg.textContent = "No memories saved yet. Add a memory using the button below.";
          memoryList.appendChild(emptyMsg);
      }
  }

  clearChatSessionsBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to CLEAR ALL chat sessions?")) return;
      Storage.clearAllSessions();
      window.showToast("All chat sessions removed");
      setTimeout(() => {
          location.reload();
      }, 1000);
  });

  clearUserDataBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to DELETE ALL USER DATA? This will remove all chat history, memories, and settings.")) return;
      Storage.clearAllSessions();
      Memory.clearAllMemories();
      localStorage.clear();
      document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      });
      window.showToast("All data has been deleted. Reloading page...");
      setTimeout(() => {
          location.reload();
      }, 1500);
  });

  window.showToast = function(message, duration = 3000) {
      let toast = document.getElementById("toast-notification");
      if (!toast) {
          toast = document.createElement("div");
          toast.id = "toast-notification";
          toast.style.position = "fixed";
          toast.style.top = "5%";
          toast.style.left = "50%";
          toast.style.transform = "translateX(-50%)";
          toast.style.backgroundColor = "rgba(0,0,0,0.7)";
          toast.style.color = "#fff";
          toast.style.padding = "10px 20px";
          toast.style.borderRadius = "5px";
          toast.style.zIndex = "9999";
          toast.style.transition = "opacity 0.3s";
          document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.opacity = "1";
      clearTimeout(toast.timeout);
      toast.timeout = setTimeout(() => {
          toast.style.opacity = "0";
      }, duration);
  };

});