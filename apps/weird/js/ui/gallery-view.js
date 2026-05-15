// DUNGEON MASTER: THE HUNT — image history gallery view.
// Past images viewable, downloadable, openable fullscreen in a lightbox.
//
// Per-girl gallery showing every past generated image. Thumbnails grid → click for
// fullscreen lightbox with prev/next navigation. Download button on each image.
// Source: girl.visualIdentity.imageHistory (populated by imaging.generateFor).

(function () {
  'use strict';

  function render(el, params) {
    const girlId = params.girl;
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) {
      el.innerHTML = `<div class="panel"><p>no such girl · <a href="#roster">Roster</a></p></div>`;
      return;
    }
    const history = (girl.visualIdentity?.imageHistory || []).slice().reverse();   // newest first

    el.innerHTML = `
      <div class="panel">
        <h2>🖼️ ${girl.name}'s image history (${history.length})</h2>
        <p class="small muted">Every past generation — profile / selfie / capture-memorial / room-scene / bond-milestone / disposal-final / film-cover / custom-pose / town + dungeon renders. Click any thumbnail to open fullscreen.</p>
        <div class="btn-row">
          <a href="#room?girl=${girl.id}" class="btn-small" data-tooltip="Back to her hold.">← back to her hold</a>
        </div>
      </div>

      ${history.length === 0 ? `
        <div class="panel">
          <p class="small muted">No images generated yet for ${girl.name}. Visit her room + click 📸 Demand selfie or 🎨 Custom pose to start her history.</p>
        </div>
      ` : `
        <div class="panel">
          <div class="gallery-grid">
            ${history.map((entry, idx) => `
              <figure class="gallery-thumb" data-idx="${idx}" data-tooltip="${entry.situation}${entry.userStaging ? ' (custom)' : ''} · ${new Date(entry.ts).toLocaleString()}">
                <img src="${entry.url}" alt="${girl.name} ${entry.situation}" loading="lazy" onerror="this.outerHTML='<div class=\\'small muted\\'>(load failed — open in tab)</div>'" />
                <figcaption class="small muted">
                  ${entry.situation}${entry.userStaging ? ' 🎨' : ''}
                  <br><span class="small">${new Date(entry.ts).toLocaleString()}</span>
                </figcaption>
              </figure>
            `).join('')}
          </div>
        </div>
      `}

      <div id="lightbox-overlay" class="gallery-lightbox" style="display:none">
        <button class="gallery-close" id="lightbox-close" data-tooltip="Close lightbox (Esc)">✕</button>
        <button class="gallery-nav prev" id="lightbox-prev" data-tooltip="Previous image (←)">‹</button>
        <button class="gallery-nav next" id="lightbox-next" data-tooltip="Next image (→)">›</button>
        <div class="gallery-main">
          <img id="lightbox-img" alt="" />
          <div class="gallery-meta" id="lightbox-meta"></div>
          <div class="gallery-actions">
            <a id="lightbox-download" class="btn-primary" data-tooltip="Download this image to disk">💾 Download</a>
            <a id="lightbox-open" class="btn-small" target="_blank" rel="noopener" data-tooltip="Open this image URL in a new browser tab">🔗 Open in new tab</a>
          </div>
        </div>
      </div>
    `;

    if (history.length === 0) return;

    let currentIdx = 0;
    const overlay = el.querySelector('#lightbox-overlay');
    const lbImg = el.querySelector('#lightbox-img');
    const lbMeta = el.querySelector('#lightbox-meta');
    const lbDownload = el.querySelector('#lightbox-download');
    const lbOpen = el.querySelector('#lightbox-open');

    function showLightbox(idx) {
      currentIdx = idx;
      const entry = history[idx];
      if (!entry) return;
      lbImg.src = entry.url;
      lbImg.alt = `${girl.name} ${entry.situation}`;
      lbMeta.innerHTML = `
        <b>${entry.situation}</b>${entry.userStaging ? ' · 🎨 custom' : ''}
        <span class="small muted">· ${new Date(entry.ts).toLocaleString()}</span>
        ${entry.userStaging ? `<div class="small muted" style="margin-top:6px;font-style:italic">"${entry.userStaging}"</div>` : ''}
      `;
      lbDownload.href = entry.url;
      const ext = entry.url.match(/\.(jpe?g|png|webp)/i)?.[1] || 'jpg';
      lbDownload.download = `${girl.name}-${entry.situation}-${entry.id || Date.now()}.${ext}`;
      lbOpen.href = entry.url;
      overlay.style.display = 'flex';
    }

    function hideLightbox() {
      overlay.style.display = 'none';
    }

    el.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.onclick = () => showLightbox(Number(thumb.dataset.idx));
    });

    // Blob-based download. The <a download> attribute is
    // only honored same-origin per HTML5 spec; Pollinations URLs are cross-origin and
    // would otherwise open inline. fetch→blob→objectURL→click forces a real download
    // even cross-origin (assuming CORS allows the GET). Falls back to direct href on
    // fetch error so worst-case is the original open-in-tab behavior.
    lbDownload.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const url = lbDownload.href;
      const filename = lbDownload.download || `image-${Date.now()}.jpg`;
      try {
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) throw new Error('fetch status ' + resp.status);
        const blob = await resp.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
      } catch (err) {
        // CORS-blocked or network — fall back to opening in a new tab so the user can
        // right-click → Save As manually.
        console.debug('[gallery] blob download failed, falling back to open:', err);
        window.open(url, '_blank');
      }
    });

    el.querySelector('#lightbox-close').onclick = hideLightbox;
    overlay.onclick = (ev) => {
      // Click outside the main image area = close. Inside the figure = stay open.
      if (ev.target === overlay) hideLightbox();
    };
    el.querySelector('#lightbox-prev').onclick = (ev) => {
      ev.stopPropagation();
      showLightbox((currentIdx - 1 + history.length) % history.length);
    };
    el.querySelector('#lightbox-next').onclick = (ev) => {
      ev.stopPropagation();
      showLightbox((currentIdx + 1) % history.length);
    };
    function onKey(ev) {
      if (overlay.style.display === 'none') return;
      if (ev.key === 'Escape') hideLightbox();
      else if (ev.key === 'ArrowLeft') showLightbox((currentIdx - 1 + history.length) % history.length);
      else if (ev.key === 'ArrowRight') showLightbox((currentIdx + 1) % history.length);
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }

  window.DMTHRouter.register('gallery', render);
})();
