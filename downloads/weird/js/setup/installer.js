// DUNGEON MASTER: THE HUNT — setup wizard installer.
// Per-OS one-command Ollama install snippets + CORS env note + polling loop until Ollama comes online.

(function () {
  'use strict';

  // One-command install copy blocks per OS.
  // CORS matters — Ollama must be launched with OLLAMA_ORIGINS=* (or the exact site origin)
  // for browser fetch() to reach it.
  const OLLAMA_INSTALL = {
    windows: {
      steps: [
        {
          label: 'Install Ollama (PowerShell, one line)',
          cmd: 'winget install Ollama.Ollama',
          note: 'Or download from https://ollama.com/download/windows'
        },
        {
          label: 'Enable CORS so this page can talk to Ollama',
          cmd: '[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS","*","User")',
          note: 'This is a one-time user env var. You may need to restart Ollama.'
        },
        {
          label: 'Start Ollama',
          cmd: 'ollama serve',
          note: 'Leave this window open. Ollama is now running at localhost:11434.'
        }
      ]
    },
    mac: {
      steps: [
        {
          label: 'Install Ollama (Homebrew) — or download at ollama.com/download/mac',
          cmd: 'brew install ollama',
          note: ''
        },
        {
          label: 'Enable CORS so this page can talk to Ollama',
          cmd: 'launchctl setenv OLLAMA_ORIGINS "*"',
          note: 'Persists for this login session. Add to ~/.zshrc for persistence across reboots.'
        },
        {
          label: 'Start Ollama',
          cmd: 'ollama serve',
          note: 'Or launch the Ollama app. Ollama is now running at localhost:11434.'
        }
      ]
    },
    linux: {
      steps: [
        {
          label: 'Install Ollama (official install script)',
          cmd: 'curl -fsSL https://ollama.com/install.sh | sh',
          note: ''
        },
        {
          label: 'Enable CORS so this page can talk to Ollama',
          cmd: 'export OLLAMA_ORIGINS=* && systemctl --user restart ollama',
          note: 'Or edit /etc/systemd/system/ollama.service.d/override.conf with Environment="OLLAMA_ORIGINS=*".'
        },
        {
          label: 'Start Ollama',
          cmd: 'ollama serve',
          note: 'Ollama is now running at localhost:11434.'
        }
      ]
    },
    unknown: {
      steps: [
        {
          label: 'Download Ollama for your OS',
          cmd: 'https://ollama.com/download',
          note: 'Open the link, pick your OS, install. Then set OLLAMA_ORIGINS=* and run: ollama serve'
        }
      ]
    }
  };

  function getInstallSteps(os) {
    return OLLAMA_INSTALL[os] || OLLAMA_INSTALL.unknown;
  }

  // Poll detector until Ollama comes online or timeout.
  // onTick receives each status snapshot; returns unsubscribe fn.
  function pollForOllama(onTick, { intervalMs = 2000, maxWaitMs = 600000 } = {}) {
    let stopped = false;
    const started = Date.now();
    const loop = async () => {
      while (!stopped) {
        const status = await window.DMTHDetector.probeOllama();
        onTick(status);
        if (status.reachable) return;
        if (Date.now() - started > maxWaitMs) {
          onTick({ reachable: false, reason: 'timeout', models: [] });
          return;
        }
        await new Promise(r => setTimeout(r, intervalMs));
      }
    };
    loop();
    return () => { stopped = true; };
  }

  window.DMTHInstaller = Object.freeze({
    getInstallSteps,
    pollForOllama,
    OLLAMA_INSTALL
  });
})();
