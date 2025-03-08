// storage.js
document.addEventListener("DOMContentLoaded", () => {
  const sessionListEl = document.getElementById("session-list");
  let sessions = loadSessions();

  if (!localStorage.getItem("currentSessionId")) {
    const newSession = createSession("New Chat");
    localStorage.setItem("currentSessionId", newSession.id);
  }

  renderSessions();

  window.Storage = {
    getSessions,
    createSession,
    deleteSession,
    getCurrentSession,
    setCurrentSessionId,
    updateSessionMessages,
    renameSession,
    setSessionModel
  };

  function getSessions() {
    return sessions;
  }

  function createSession(name) {
    const newId = Date.now().toString();
    const session = {
      id: newId,
      name,
      model: "unity", // Default model set to "unity"
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
      // Clear chat box if the current session is deleted.
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

  // FIXED: Ensure a valid session is always returned.
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
    sessionListEl.innerHTML = "";
    sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    sessions.forEach(session => {
      const li = document.createElement("li");
      li.classList.add("session-item");

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
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", e => {
        e.stopPropagation();
        const newName = prompt("Rename session:", session.name);
        if (newName && newName.trim() !== "") {
          renameSession(session.id, newName.trim());
        }
      });
      li.appendChild(titleSpan);
      li.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.classList.add("session-delete-btn");
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", e => {
        e.stopPropagation();
        deleteSession(session.id);
      });
      li.appendChild(delBtn);

      li.addEventListener("click", () => {
        localStorage.setItem("currentSessionId", session.id);
        location.reload();
      });

      if (session.id === localStorage.getItem("currentSessionId")) {
        li.style.backgroundColor = "rgba(255,255,255,0.2)";
      }

      sessionListEl.appendChild(li);
    });
  }
});