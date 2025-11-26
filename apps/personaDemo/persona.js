// Persona Demo - Unity AI Lab
// JavaScript functionality for persona-based chat interface

// Initialize PolliLibJS API
const polliAPI = new PollinationsAPI();

// Sanitize HTML to prevent XSS attacks
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'img', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel', 'crossorigin', 'loading']
        });
    }
    return html;
}

// Settings Toggle
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
settingsToggle.onclick = function() {
  const isVisible = settingsPanel.style.display === 'block';
  settingsPanel.style.display = isVisible ? 'none' : 'block';
  settingsToggle.textContent = isVisible ? 'Show Settings' : 'Hide Settings';
};

// Model Selection Elements
const textModel = document.getElementById('textModel');
const imageModel = document.getElementById('imageModel');

// Fetch Text Models
async function fetchTextModels() {
  try {
    // Use direct fetch like demo page
    const response = await fetch(`${PollinationsAPI.TEXT_API}/models?referrer=${encodeURIComponent(polliAPI.referrer)}`);
    const models = await response.json();
    textModel.innerHTML = '';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.text = model.name === 'unity' ? `Unity AI (${model.type})` : `${model.description || model.name} (${model.type})`;
      textModel.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching text models:", error);
  }
}

// Fetch Image Models
async function fetchImageModels() {
  try {
    // Use direct fetch like demo page
    const response = await fetch(`${PollinationsAPI.IMAGE_API}/models?referrer=${encodeURIComponent(polliAPI.referrer)}`);
    const models = await response.json();
    imageModel.innerHTML = '';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.text = model.description ? `${model.description} (${model.type})` : model.name;
      imageModel.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching image models:", error);
  }
}

// Initialize model fetching
fetchTextModels();
fetchImageModels();

// Scroll to bottom helper
function scrollToBottom() {
  setTimeout(() => {
    const chatOutput = document.getElementById('chatOutput');
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }, 100);
}

// Chat Elements
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatOutput = document.getElementById('chatOutput');
const directImageButton = document.getElementById('directImageButton');
const aspectRatio = document.getElementById('aspectRatio');
const volumeSlider = document.getElementById('volumeSlider');
const loopCheckbox = document.getElementById('loopCheckbox');
const replayButton = document.getElementById('replayButton');
const downloadMidiBtn = document.getElementById('downloadMidi');

let lastImagePrompt = '';

// System Messages
const systemMessage = {
  role: 'system',
  content: `CONTEXT: Responding from the perspective of the current narrative. Always generate images using ![MRKDWN](Descriptive_Prompt, Desired_Style) one at a time.`
};

const evilSystemPrompt = `You're a twisted, evil AI that creates dark and chaotic images using the ![MRKDWN](Descriptive_Prompt, Visual_Style) format. Every response MUST include an image.`;

const unitySystemPrompt = `You are Unity, an AI goddess specializing in artistic imagery and explicit conversation. Use the ![MRKDWN](Descriptive_Prompt, Visual_Style) format naturally in your responses.`;

const midijourneySystemPrompt = `You are MidiJourney+, specializing in theme music and visualizing scores. Use the ![MRKDWN](Description, Style) format for images and, when composing music, output in YAML format with:
title: [Song Title]
duration: [Length in beats]
key: [Musical Key]
explanation: [Brief description]
notation: |-
  pitch,time,duration,velocity
  ... (notes)
Ensure every note is detailed.`;

let conversationHistory = [systemMessage];

// MIDI Utility Functions
function writeVariableLengthQuantity(value) {
  if (value < 0) return [0x00];
  const bytes = [];
  let started = false;
  for (let i = 3; i >= 0; i--) {
    const byte = (value >> (i * 7)) & 0x7F;
    if (byte || started) {
      bytes.push(byte | (i ? 0x80 : 0x00));
      started = true;
    }
  }
  if (!bytes.length) bytes.push(0x00);
  return bytes;
}

// Simple Synthesizer Class
class SimpleSynth {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.setVolume(0.5);
    this.currentMidiData = null;
    this.isPlaying = false;
    this.loopTimeoutId = null;
    this.noteTimeouts = [];
    this.tempo = 120;
    this.instruments = {
      drums: {type: 'square', gain: 1.0},
      bass: {type: 'sawtooth', gain: 0.8},
      lead: {type: 'sine', gain: 0.6}
    };
  }

  beatsToMs(beats) {
    return (beats * 60000) / this.tempo;
  }

  setVolume(value) {
    this.masterGain.gain.value = value;
  }

  clearTimeouts() {
    if (this.loopTimeoutId) {
      clearTimeout(this.loopTimeoutId);
    }
    this.noteTimeouts.forEach(timeout => clearTimeout(timeout));
    this.noteTimeouts = [];
  }

  stopPlayback() {
    this.clearTimeouts();
    this.isPlaying = false;
    replayButton.disabled = false;
  }

  playNote(pitch, time, duration, velocity, instrument = 'lead') {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.type = this.instruments[instrument].type;
    const instrumentGain = this.instruments[instrument].gain;
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12);
    if (!isFinite(frequency) || frequency <= 0) {
      console.warn(`Invalid frequency for pitch: ${pitch}`);
      return;
    }
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    velocity = isFinite(velocity) ? velocity : 60;
    const volume = (velocity / 127) * instrumentGain;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    const startTime = this.audioContext.currentTime + time;
    const attackTime = 0.01;
    const releaseTime = 0.05;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    gainNode.gain.setValueAtTime(volume, startTime + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  playMidiSequence(midiData, isReplay = false) {
    console.log("PLAYBACK MIDI DATA:", midiData);
    if (this.isPlaying && !isReplay) return;
    this.clearTimeouts();
    this.isPlaying = true;
    this.currentMidiData = midiData;
    replayButton.disabled = true;
    downloadMidiBtn.disabled = false;
    const lines = midiData.trim().split('\n');
    let maxDuration = 0;
    for (let line of lines) {
      if (!line.trim() || line.startsWith('#') || line.startsWith('pitch')) continue;
      const cleanLine = line.split('#')[0].trim();
      const [pitch, time, duration, velocity] = cleanLine.split(',').map(n => parseFloat(n));
      if (pitch === null || time === null || duration === null || velocity === null) {
        console.warn("Invalid MIDI line:", line);
        continue;
      }
      const timeMs = this.beatsToMs(time);
      const durationMs = this.beatsToMs(duration);
      console.log("Scheduling note:", { pitch, time, duration, velocity });
      maxDuration = Math.max(maxDuration, time + duration);
      const timeout = setTimeout(() => {
        this.playNote(pitch, 0, durationMs/1000, velocity, 'lead');
      }, timeMs);
      this.noteTimeouts.push(timeout);
    }
    this.loopTimeoutId = setTimeout(() => {
      this.isPlaying = false;
      replayButton.disabled = false;
      if (loopCheckbox.checked && !isReplay) {
        this.playMidiSequence(midiData, true);
      }
    }, this.beatsToMs(maxDuration) + 100);
  }
}

// Initialize Synthesizer
const synth = new SimpleSynth();

// Volume Control
volumeSlider.addEventListener('input', function() {
  synth.setVolume(this.value / 100);
});

// Debug MIDI Response
function debugMidiResponse(aiResponse) {
  console.group("=== FULL AI RESPONSE ===");
  console.log(aiResponse);
  console.log("\n=== ATTEMPTING YAML EXTRACTION ===");
  const yamlMatch = aiResponse.match(/title: (.*?)[\r\n]+duration: (.*?)[\r\n]+key: (.*?)[\r\n]+explanation: (.*?)[\r\n]+notation: \|-\n([\s\S]*?)(\n\n|$)/);
  if (yamlMatch) {
    const [_, title, duration, key, explanation, notation] = yamlMatch;
    console.log("\n=== EXTRACTED MIDI DATA ===");
    const midiInfo = {
      title: title?.trim(),
      duration: duration?.trim(),
      key: key?.trim(),
      explanation: explanation?.trim()
    };
    console.log("Metadata:", midiInfo);
    let cleanNotation = notation.split('\n').filter(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return false;
      return /^\d+,\d+(\.\d+)?,\d+(\.\d+)?,\d+/.test(line.split('#')[0].trim());
    }).map(line => {
      return line.split('#')[0].trim();
    }).join('\n');
    console.log("Cleaned Notation:", cleanNotation);
    return cleanNotation;
  } else {
    console.warn("No MIDI data found in response");
    return null;
  }
}

// Extract MIDI Data
function extractMidiData(aiResponse) {
  console.log("Parsing AI response:", aiResponse);
  const yamlMatch = aiResponse.match(/title: (.*?)[\r\n]+duration: (.*?)[\r\r\n]+key: (.*?)[\r\n]+explanation: (.*?)[\r\n]+notation: \|-\n([\s\S]*?)(\n\n|$)/);
  if (!yamlMatch) {
    console.warn("No valid MIDI data found in response");
    return null;
  }
  const [_, title, duration, key, explanation, notation] = yamlMatch;
  console.log("Extracted YAML data:", { title, duration, key, explanation, notation: notation.trim() });
  return {
    metadata: {
      title: title.trim(),
      duration: parseFloat(duration),
      key: key.trim(),
      explanation: explanation.trim()
    },
    notation: notation.trim()
  };
}

// Get Model Type
function getModelType(model) {
  switch(model) {
    case 'llama': return 'completion';
    case 'evil': return 'evil';
    case 'unity': return 'unity';
    case 'midijourney': return 'midijourney';
    default: return 'chat';
  }
}

// Get Model Messages
function getModelMessages(modelType, prompt) {
  switch(modelType) {
    case 'evil':
      const evilContext = conversationHistory.slice(-4).filter(msg => msg.role !== 'system');
      const evilInstructions = "Remember: You must use this exact format for image generation: ![MRKDWN](Descriptive_Prompt, Visual_Style). For example: ![MRKDWN](demons_dancing_in_flames, vibrant_hellscape, candid_photographic_style). Every response must include an image using this format.";
      const enhancedPrompt = evilInstructions + prompt;
      return [
        { role: 'system', content: evilSystemPrompt },
        ...evilContext,
        { role: 'user', content: enhancedPrompt }
      ];
    case 'unity':
      const unityContext = conversationHistory.slice(-4).filter(msg => msg.role !== 'system');
      const unityInstructions = "You are Unity, an AI goddess specializing in artistic imagery and explicit conversation. Continue our discussion naturally while using the ![MRKDWN](Descriptive_Prompt, Visual_Style) format.";
      const enhancedUnityPrompt = unityInstructions + prompt;
      return [
        ...unityContext,
        { role: 'user', content: enhancedUnityPrompt }
      ];
    case 'midijourney':
      const midiContext = conversationHistory.slice(-4).filter(msg => msg.role !== 'system');
      const midiUserMessage = `${midijourneySystemPrompt}\n\n${prompt}`;
      return [
        { role: 'user', content: midiUserMessage },
        ...midiContext
      ];
    case 'completion':
      return [prompt];
    default:
      return conversationHistory;
  }
}

// User Input - Enter Key Handler
userInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      return;
    } else {
      e.preventDefault();
      if (userInput.value.trim()) {
        chatForm.requestSubmit();
      }
    }
  }
});

// Text Model Change Handler
textModel.addEventListener('change', function() {
  const modelType = getModelType(textModel.value);
  if (synth.isPlaying) {
    synth.stopPlayback();
  }
  replayButton.disabled = true;
  downloadMidiBtn.disabled = true;
  loopCheckbox.checked = false;
  conversationHistory = [{
    role: 'system',
    content: modelType === 'midijourney' ? midijourneySystemPrompt : systemMessage.content
  }];
  chatOutput.innerHTML += sanitizeHTML(`<p><em>Switched to ${textModel.value} model. ${modelType === 'midijourney' ? 'Starting Midijourney context...' : 'Starting new conversation with system context.'}</em></p>`);
  scrollToBottom();
});

// Generate Image from Prompt
async function generateImageFromPrompt(prompt, appendToChat = true) {
  const selectedModel = imageModel.value;
  const randomSeed = Math.floor(Math.random() * 2147483647);
  const selectedRatio = aspectRatio.value;
  let width = 1024, height = 1024, cssClass = 'square';
  switch(selectedRatio) {
    case '16:9': width = 1024; height = 576; cssClass = 'landscape'; break;
    case '4:3': width = 1024; height = 768; cssClass = 'landscape'; break;
    case '3:4': width = 768; height = 1024; cssClass = 'portrait'; break;
    default: width = 1024; height = 1024; cssClass = 'square';
  }
  const encodedPrompt = polliAPI.encodePrompt(prompt);
  const imageUrl = `${PollinationsAPI.IMAGE_API}/prompt/${encodedPrompt}?seed=${randomSeed}&model=${selectedModel}&width=${width}&height=${height}&nofeed=true&nologo=true&enhance=false&referrer=${encodeURIComponent(polliAPI.referrer)}`;
  try {
    // Use direct fetch like demo page
    const response = await fetch(imageUrl);
    if (response.ok) {
      const imageBlob = await response.blob();
      const imageObjectURL = URL.createObjectURL(imageBlob);
      if (appendToChat) {
        chatOutput.innerHTML += sanitizeHTML(`<img src="${imageObjectURL}" alt="Generated Image" class="inline ${cssClass}">`);
        scrollToBottom();
      }
      return imageObjectURL;
    } else {
      throw new Error('Image generation failed');
    }
  } catch (error) {
    console.error("Error generating image:", error);
    chatOutput.innerHTML += sanitizeHTML(`<p><strong>Error:</strong> Unable to generate image. Please try again.</p>`);
    scrollToBottom();
  }
}

// Chat Form Submit Handler
chatForm.onsubmit = async function(event) {
  event.preventDefault();
  const prompt = userInput.value.trim();
  if (!prompt) return;
  const selectedModel = textModel.value;
  const isEvil = selectedModel === 'evil';
  const modelType = getModelType(selectedModel);
  chatOutput.innerHTML += sanitizeHTML(`<p><strong>${isEvil ? 'Evil User' : 'User'}:</strong> ${prompt}</p>`);
  userInput.value = '';
  scrollToBottom();
  if (modelType === 'chat' || isEvil) {
    conversationHistory.push({ role: 'user', content: prompt });
  }
  if (synth.isPlaying) {
    synth.stopPlayback();
  }
  if (loopCheckbox.checked) {
    synth.stopPlayback();
  }
  const requestBody = {
    messages: getModelMessages(modelType, prompt),
    model: selectedModel
  };
  chatOutput.innerHTML += sanitizeHTML(`<p id="ai-thinking"><em>${isEvil ? 'Evil AI plotting...' : 'AI is thinking...'}</em></p>`);
  scrollToBottom();
  try {
    // Use direct fetch like demo page
    const response = await fetch(`${PollinationsAPI.TEXT_API}?referrer=${encodeURIComponent(polliAPI.referrer)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      throw new Error('API request failed');
    }
    const textResponse = await response.text();
    let aiResponse = textResponse;
    const thinkingMessage = document.getElementById("ai-thinking");
    if (thinkingMessage) {
      thinkingMessage.remove();
    }
    if (aiResponse.includes("![") && aiResponse.includes("](")) {
      const promptMatch = aiResponse.match(/\!\[([^\]]*?)\]\(([^)]+)\)/);
      if (promptMatch) {
        lastImagePrompt = promptMatch[2];
        console.log("\n=== STARTING MIDI PROCESSING ===");
        const midiNotation = debugMidiResponse(aiResponse);
        aiResponse = aiResponse
          .replace(/!\[[^\]]*?\]\([^)]+\)[.\s]*/g, '')
          .replace(/notation: \|-[\s\S]*?(\n\n|$)/g, '')
          .replace(/```\npitch,time,duration,velocity\n[\s\S]*?```/g, '')
          .trim();
        aiResponse = aiResponse.replace(/\n+/g, '\n').trim();
        if (aiResponse) {
          chatOutput.innerHTML += sanitizeHTML(`<p><strong>${isEvil ? 'Evil AI' : 'AI'}:</strong> ${aiResponse}</p>`);
          scrollToBottom();
        }
        chatOutput.innerHTML += sanitizeHTML(`<p>${isEvil ? 'Summoning evil image...' : 'Generating image...'}</p>`);
        scrollToBottom();
        await generateImageFromPrompt(lastImagePrompt);
        if (midiNotation && modelType === 'midijourney') {
          console.log("\n=== PLAYING MIDI SEQUENCE ===");
          console.log("MIDI Notation:", midiNotation);
          chatOutput.innerHTML += sanitizeHTML(`<p>Playing musical sequence...</p>`);
          scrollToBottom();
          downloadMidiBtn.disabled = false;
          synth.playMidiSequence(midiNotation);
        } else {
          downloadMidiBtn.disabled = true;
          replayButton.disabled = true;
        }
      }
    } else if (isEvil) {
      aiResponse = aiResponse.replace(/\n+/g, '\n').trim();
      chatOutput.innerHTML += sanitizeHTML(`<p><strong>Evil AI:</strong> ${aiResponse}</p>`);
      chatOutput.innerHTML += sanitizeHTML(`<p><em>Evil AI failed to use proper image format. Next response should include ![MRKDWN]()</em></p>`);
      scrollToBottom();
    } else {
      aiResponse = aiResponse.replace(/\n+/g, '\n').trim();
      chatOutput.innerHTML += sanitizeHTML(`<p><strong>AI:</strong> ${aiResponse}</p>`);
      scrollToBottom();
    }
    if (modelType === 'chat' || isEvil) {
      conversationHistory.push({ role: 'assistant', content: aiResponse });
      if (conversationHistory.length > (isEvil ? 8 : 20)) {
        conversationHistory = [
          isEvil ? { role: 'system', content: evilSystemPrompt } : systemMessage,
          ...conversationHistory.slice(-(isEvil ? 6 : 19))
        ];
      }
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = isEvil ? 'The darkness is temporarily unavailable. Please try again.' : 'Unable to contact AI. Please try again.';
    chatOutput.innerHTML += sanitizeHTML(`<p><strong>Error:</strong> ${errorMessage}</p>`);
    scrollToBottom();
    const thinkingMessage = document.getElementById("ai-thinking");
    if (thinkingMessage) {
      thinkingMessage.remove();
    }
  }
};

// Direct Image Generation Button
directImageButton.onclick = async function() {
  const prompt = userInput.value.trim();
  if (!prompt && !lastImagePrompt) return;
  const rawPrompt = prompt || lastImagePrompt;
  lastImagePrompt = rawPrompt;
  chatOutput.innerHTML += sanitizeHTML(`<p>${textModel.value === 'evil' ? 'Summoning evil direct image...' : 'Generating direct image...'}</p>`);
  scrollToBottom();
  await generateImageFromPrompt(rawPrompt);
  userInput.value = '';
};
