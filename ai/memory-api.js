// memory-api.js
// This file creates a bridge between the Memory API used by chat-part3.js / ui.js
// and the underlying Storage-based memory methods.

document.addEventListener("DOMContentLoaded", () => {
  window.Memory = {
    /**
     * Get the full list of memories stored in localStorage.
     * @returns {string[]} An array of memory strings.
     */
    getMemories: function() {
      if (!window.Storage || typeof Storage.getMemories !== 'function') {
        console.warn("Storage API is missing or incomplete. Returning empty memory array.");
        return [];
      }
      return Storage.getMemories() || [];
    },

    /**
     * Add a new memory entry to localStorage, if it’s not empty/duplicate.
     * @param {string} text - The memory text to store.
     * @returns {boolean} True if successfully added; false otherwise.
     */
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

    /**
     * Remove a specific memory entry by its array index.
     * @param {number} index - The memory array index to remove.
     * @returns {boolean} True if removed; false otherwise.
     */
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

    /**
     * Clear all memory entries from localStorage.
     * @returns {boolean} True if cleared; false otherwise.
     */
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

    /**
     * Replace the memory at a given index with new text.
     * @param {number} index - The memory array index to update.
     * @param {string} newText - The new text to store at that index.
     * @returns {boolean} True if updated successfully; false otherwise.
     */
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

      // We don't strictly check duplicates for edits, so user can overwrite with whatever they want.
      // We'll just do it:
      const updatedText = newText.trim();

      try {
        // Manually update the local array and then store it.
        memories[index] = updatedText;
        localStorage.setItem("pollinations_memory", JSON.stringify(memories));
        console.log(`Memory at index ${index} updated to: ${updatedText}`);
        return true;
      } catch (err) {
        console.error("Error updating memory:", err);
        return false;
      }
    },

    /**
     * Update an existing memory that matches `pattern`, or create a new memory if none was found.
     * @param {string} pattern - The text pattern to search for in existing memories.
     * @param {string} newText - The new memory text to insert or update.
     * @returns {boolean} True if updated or added successfully; false otherwise.
     */
    updateOrAddMemory: function(pattern, newText) {
      const memories = this.getMemories();
      const index = memories.findIndex(mem => mem.includes(pattern));

      // If it exists, remove it first, then add the new text
      if (index !== -1) {
        this.removeMemoryEntry(index);
      }
      return this.addMemoryEntry(newText);
    },

    /**
     * Example helper: store user’s preference for voice (spoken) or silent AI.
     * @param {boolean} enabled - Whether the user wants voice speaking enabled.
     * @returns {boolean} True if updated or added successfully; false otherwise.
     */
    setVoicePreference: function(enabled) {
      const text = `Voice Preference: User prefers AI responses to be ${enabled ? 'spoken aloud' : 'not spoken'}.`;
      return this.updateOrAddMemory("Voice Preference:", text);
    }
  };

  console.log("Memory API loaded and linked to Storage-based memory system.");
});
