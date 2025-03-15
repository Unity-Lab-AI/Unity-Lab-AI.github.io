document.addEventListener("DOMContentLoaded", () => {
  window.Memory = {
    getMemories: function() {
      if (!window.Storage || typeof Storage.getMemories !== 'function') {
        console.warn("Storage API is missing or incomplete. Returning empty memory array.");
        return [];
      }
      return Storage.getMemories() || [];
    },

    addMemoryEntry: function(text) {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        console.warn("Attempted to add an empty or invalid memory entry.");
        return false;
      }

      const trimmedText = text.trim();
      const existingMemories = this.getMemories();
      if (existingMemories.includes(trimmedText)) {
        console.log("Skipping duplicate memory entry:", trimmedText);
        return false;
      }

      if (!window.Storage || typeof Storage.addMemory !== 'function') {
        console.error("Storage API not available for memory add operation.");
        return false;
      }

      try {
        Storage.addMemory(trimmedText);
        console.log("Memory added:", trimmedText.substring(0, 50) + (trimmedText.length > 50 ? '...' : ''));
        return true;
      } catch (err) {
        console.error("Error adding memory:", err);
        return false;
      }
    },

    removeMemoryEntry: function(index) {
      const memories = this.getMemories();
      if (index < 0 || index >= memories.length) {
        console.warn("Invalid memory index:", index);
        return false;
      }
      if (!window.Storage || typeof Storage.removeMemory !== 'function') {
        console.error("Storage API not available for removeMemory.");
        return false;
      }

      try {
        Storage.removeMemory(index);
        console.log("Memory removed at index:", index);
        return true;
      } catch (err) {
        console.error("Error removing memory:", err);
        return false;
      }
    },

    clearAllMemories: function() {
      if (!window.Storage || typeof Storage.clearAllMemories !== 'function') {
        console.error("Storage API not available for clearAllMemories.");
        return false;
      }
      try {
        Storage.clearAllMemories();
        console.log("All memories cleared.");
        return true;
      } catch (err) {
        console.error("Error clearing memories:", err);
        return false;
      }
    },

    updateMemoryEntry: function(index, newText) {
      const memories = this.getMemories();
      if (index < 0 || index >= memories.length) {
        console.warn("Invalid memory index for edit:", index);
        return false;
      }
      if (!newText || typeof newText !== 'string' || !newText.trim()) {
        console.warn("Blank or invalid newText for memory update.");
        return false;
      }

      const updatedText = newText.trim();

      try {
        const currentMemories = this.getMemories();
        currentMemories[index] = updatedText;
        localStorage.setItem("pollinations_memory", JSON.stringify(currentMemories));
        console.log(`Memory at index ${index} updated to: ${updatedText}`);
        return true;
      } catch (err) {
        console.error("Error updating memory:", err);
        return false;
      }
    },

    updateOrAddMemory: function(pattern, newText) {
      const memories = this.getMemories();
      const index = memories.findIndex(mem => mem.includes(pattern));

      if (index !== -1) {
        this.removeMemoryEntry(index);
      }
      return this.addMemoryEntry(newText);
    },

    setVoicePreference: function(enabled) {
      const text = `Voice Preference: User prefers AI responses to be ${enabled ? 'spoken aloud' : 'not spoken'}.`;
      return this.updateOrAddMemory("Voice Preference:", text);
    }
  };

  console.log("Memory API loaded and linked to Storage-based memory system.");

});