document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = "https://your-hosted-server.com";
  const USE_LOCAL_FALLBACK = true;

  const sessionListEl = document.getElementById("session-list");
  let sessions = loadSessions();
  const defaultModelPreference = localStorage.getItem("defaultModelPreference") || "unity";

  if (!localStorage.getItem("currentSessionId")) {
    const newSession = createSession("New Chat");
    localStorage.setItem("currentSessionId", newSession.id);
  }

  initUserChecks();
  startVisitorCountPolling();
  renderSessions();

  window.Storage = {
    getSessions,
    createSession,
    deleteSession,
    getCurrentSession,
    setCurrentSessionId,
    updateSessionMessages,
    renameSession,
    setSessionModel,
    getDefaultModel,
    setDefaultModel,
    clearAllSessions,
    getMemories,
    addMemory,
    removeMemory,
    clearAllMemories,
    deleteAllUserData,
    renderSessions
  };

  function getSessions() {
    return sessions;
  }

  function getDefaultModel() {
    return localStorage.getItem("defaultModelPreference") || "unity";
  }

  function setDefaultModel(modelName) {
    localStorage.setItem("defaultModelPreference", modelName);
    console.log("Default model preference set to:", modelName);
  }

  function createSession(name) {
    const newId = Date.now().toString();
    const session = {
      id: newId,
      name,
      model: getDefaultModel(),
      messages: [],
      lastUpdated: Date.now()
    };
    sessions.push(session);
    saveSessions();
    return session;
  }

  function deleteSession(sessionId) {
    sessions = sessions.filter(s => s.id !== sessionId);
    saveSessions();
    if (localStorage.getItem("currentSessionId") === sessionId) {
      const chatBox = document.getElementById("chat-box");
      if (chatBox) chatBox.innerHTML = "";
      if (sessions.length > 0) {
        localStorage.setItem("currentSessionId", sessions[0].id);
      } else {
        const newSession = createSession("New Chat");
        localStorage.setItem("currentSessionId", newSession.id);
      }
    }
    renderSessions();
  }

  function renameSession(sessionId, newName) {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      let cleanName = newName;
      if (typeof newName === "object") {
        cleanName = JSON.stringify(newName);
      } else if (newName && newName.startsWith("{") && newName.endsWith("}")) {
        try {
          const parsed = JSON.parse(newName);
          cleanName = parsed.response || parsed.chatTitle || newName;
        } catch (e) {
          console.error("Error parsing session name JSON:", e);
        }
      }
      session.name = cleanName;
      session.lastUpdated = Date.now();
      saveSessions();
      renderSessions();
    }
  }

  function getCurrentSession() {
    const currentId = localStorage.getItem("currentSessionId");
    let session = sessions.find(s => s.id === currentId);
    if (!session) {
      session = createSession("New Chat");
      localStorage.setItem("currentSessionId", session.id);
    }
    return session;
  }

  function setCurrentSessionId(sessionId) {
    localStorage.setItem("currentSessionId", sessionId);
    renderSessions();
  }

  function setSessionModel(sessionId, modelName) {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.model = modelName;
      session.lastUpdated = Date.now();
      saveSessions();
      setDefaultModel(modelName);
    }
  }

  function updateSessionMessages(sessionId, messages) {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.messages = messages;
      session.lastUpdated = Date.now();
      saveSessions();
    }
  }

  function loadSessions() {
    const raw = localStorage.getItem("pollinations_sessions");
    return raw ? JSON.parse(raw) : [];
  }

  function saveSessions() {
    localStorage.setItem("pollinations_sessions", JSON.stringify(sessions));
  }

  function renderSessions() {
    if (!sessionListEl) return;
    sessionListEl.innerHTML = "";
    sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);

    const currentSessionId = localStorage.getItem("currentSessionId");
    sessions.forEach(session => {
      const li = document.createElement("li");
      li.classList.add("session-item");
      if (session.id === currentSessionId) {
        li.classList.add("active");
      }
      const titleSpan = document.createElement("span");
      titleSpan.classList.add("session-title");
      let displayName = session.name;
      if (displayName && displayName.startsWith("{") && displayName.endsWith("}")) {
        try {
          const parsed = JSON.parse(displayName);
          displayName = parsed.response || parsed.chatTitle || displayName;
        } catch (e) {
          console.error("Error parsing session name JSON:", e);
        }
      }
      titleSpan.textContent = displayName;
      const editBtn = document.createElement("button");
      editBtn.classList.add("session-edit-btn");
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.title = "Rename this chat session";
      editBtn.addEventListener("click", e => {
        e.stopPropagation();
        const newName = prompt("Rename session:", session.name);
        if (newName && newName.trim() !== "") {
          renameSession(session.id, newName.trim());
        }
      });
      const delBtn = document.createElement("button");
      delBtn.classList.add("session-delete-btn");
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.title = "Delete this entire session";
      delBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete session "${session.name}"?`)) return;
        deleteSession(session.id);
      });
      const controlsDiv = document.createElement("div");
      controlsDiv.className = "session-controls";
      controlsDiv.appendChild(editBtn);
      controlsDiv.appendChild(delBtn);
      li.appendChild(titleSpan);
      li.appendChild(controlsDiv);
      li.addEventListener("click", () => {
        localStorage.setItem("currentSessionId", session.id);
        location.reload();
      });
      sessionListEl.appendChild(li);
    });

    if (sessions.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "text-center text-muted";
      emptyMsg.style.padding = "10px";
      emptyMsg.innerHTML = '<i class="fas fa-info-circle"></i> No chat sessions yet. Start a new chat!';
      sessionListEl.appendChild(emptyMsg);
    }
  }

  function clearAllSessions() {
    sessions = [];
    saveSessions();
    localStorage.removeItem("currentSessionId");
    const newSession = createSession("New Chat");
    localStorage.setItem("currentSessionId", newSession.id);
    renderSessions();
  }

  function getMemories() {
    const raw = localStorage.getItem("pollinations_memory");
    return raw ? JSON.parse(raw) : [];
  }

  function saveMemories(memories) {
    localStorage.setItem("pollinations_memory", JSON.stringify(memories));
  }

  function addMemory(text) {
    const memories = getMemories();
    if (!memories.includes(text.trim())) {
      memories.push(text.trim());
      saveMemories(memories);
    }
  }

  function removeMemory(index) {
    const memories = getMemories();
    if (index >= 0 && index < memories.length) {
      memories.splice(index, 1);
      saveMemories(memories);
    }
  }

  function clearAllMemories() {
    localStorage.removeItem("pollinations_memory");
  }

  function deleteAllUserData() {
    localStorage.clear();
    location.reload();
  }

  function initUserChecks() {
    let firstLaunch = localStorage.getItem("firstLaunch");
    if (firstLaunch === null) {
      localStorage.setItem("firstLaunch", "0");
    }
    checkOrGenerateUserId().then(() => {
      console.log("User ID validation complete");
    }).catch(err => {
      console.warn("Problem with user ID, using local fallback:", err);
      ensureLocalUserId();
    });
  }

  function ensureLocalUserId() {
    if (!localStorage.getItem("uniqueUserId")) {
      const localId = generateRandomId();
      localStorage.setItem("uniqueUserId", localId);
      console.log("Created local user ID fallback");
    }
  }

  async function checkOrGenerateUserId() {
    let userId = localStorage.getItem("uniqueUserId");
    if (!userId) {
      userId = generateRandomId();
      let success = false;
      if (!USE_LOCAL_FALLBACK) {
        try {
          success = await registerUserIdWithServer(userId);
        } catch (err) {
          console.warn("Server registration failed, using local fallback:", err);
          success = true;
        }
      } else {
        success = true;
      }
      localStorage.setItem("uniqueUserId", userId);
    }
    return userId;
  }

  async function registerUserIdWithServer(userId) {
    if (USE_LOCAL_FALLBACK) {
      console.log("Using local fallback for user registration");
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/registerUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      return data.status === "registered" || data.status === "exists";
    } catch (err) {
      console.warn("Server registration failed:", err);
      return true;
    }
  }

  function generateRandomId() {
    return Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
  }

  function startVisitorCountPolling() {
    updateVisitorCount();
    setInterval(() => {
      updateVisitorCount();
    }, 300000);
  }

  async function updateVisitorCount() {
    const visitorDisplay = document.getElementById("visitor-count-display");
    if (!visitorDisplay) return;
    if (USE_LOCAL_FALLBACK) {
      visitorDisplay.textContent = "404";
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${SERVER_URL}/api/visitorCount`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      visitorDisplay.textContent = data.count.toLocaleString();
    } catch (err) {
      console.warn("Error fetching visitor count, using fallback:", err);
      visitorDisplay.textContent = "404";
    }
  }
});