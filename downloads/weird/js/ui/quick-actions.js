// SEX SLAVE DUNGEON — one-hand mouse UX with full captor-dynamic action set.
// Tabbed by category: FORCE / POSITIONS / ORAL / ANAL / PAIN / PUNISHMENT / DEGRADE / DRUGS / COMMANDS.
// Actions are bond-gated — some get softer labels at high bond, most stay raw at every level.

(function () {
  'use strict';

  const TABS = {
    force: {
      label: '💢 Force',
      actions: [
        { emoji: '🤜',  label: 'pin her down',        text: '*pins her shoulders to the bed, one hand on her throat, forces her knees apart*' },
        { emoji: '🍆',  label: 'force vag entry',     text: '*shoves inside her dry, no warning, watches her face break*' },
        { emoji: '🍑',  label: 'force anal',          text: '*spits once, forces the head in, ignores the scream*' },
        { emoji: '👄',  label: 'face fuck hard',      text: '*grabs her hair with both hands and fucks her throat until her nose hits my pelvis*' },
        { emoji: '🤐',  label: 'gag her to the hilt', text: '*holds her jaw open and buries it, holds her there while she gags*' },
        { emoji: '🧱',  label: 'pin to wall',         text: '*slams her against the wall face-first, pulls her hips back, takes what I want*' },
        { emoji: '💦',  label: 'force cum inside',    text: '*pins her hips, holds her in place, empties inside her, doesn\'t let her pull away*' },
        { emoji: '🫸',  label: 'throat pin',          text: '*grips her throat while I fuck her, watches her eyes go glassy*' },
        { emoji: '✋',  label: 'grab by hair',        text: '*yanks her by the roots, drags her where I want her*' },
        { emoji: '🩸',  label: 'breed her',           text: '*holds her down after finishing, keeps me inside, refuses to let it spill*' }
      ]
    },
    positions: {
      label: '🍆 Positions',
      actions: [
        { emoji: '⬇',  label: 'missionary (pinned)',    text: '*puts her on her back, pins her wrists over her head, fucks her slow and deep*' },
        { emoji: '🐕', label: 'doggy rough',            text: '*grabs her hips and pulls her back onto me, sets a brutal pace*' },
        { emoji: '🤸', label: 'prone-bone',             text: '*flattens her face-down onto the mattress, lies on top, fucks her pinned flat*' },
        { emoji: '🔁', label: 'reverse cowgirl (force)',text: '*sits back, pulls her onto me backwards, grabs her hips and bounces her*' },
        { emoji: '🧍', label: 'against the wall',       text: '*picks her up, pins her to the wall, her legs around my waist, fucks her held up*' },
        { emoji: '🛏️', label: 'spooning rough',         text: '*behind her, hand on her throat, one leg up, fucks her on her side*' },
        { emoji: '🧎', label: 'kneeling service',       text: '*stands over her, hands in her hair, uses her mouth*' },
        { emoji: '🪑', label: 'over my lap',            text: '*drags her face-down across my thighs, ass up, starts spanking*' },
        { emoji: '🔃', label: 'flipped upside',         text: '*lifts her upside down by the hips, face at my cock, fucks her throat while her legs kick*' },
        { emoji: '🪢', label: 'spread-eagle tied',      text: '*ties each wrist and ankle to the bedposts, spreads her wide, takes my time*' }
      ]
    },
    oral: {
      label: '👅 Oral',
      actions: [
        { emoji: '🫦',  label: 'face fuck',             text: '*holds her head and fucks her mouth with full strokes*' },
        { emoji: '🌪️', label: 'throat bulge',           text: '*watches the bulge of my cock moving in her throat, one hand pressing on it from outside*' },
        { emoji: '💧',  label: 'make her gag',          text: '*holds her nose, forces her to take all of it, listens to her gag and choke*' },
        { emoji: '✋',  label: 'pin nose shut',         text: '*pinches her nose so her only air is my cock pulling back*' },
        { emoji: '👄',  label: 'slap with cock',        text: '*pulls out, slaps her across the face with my cock, then back in*' },
        { emoji: '🥵',  label: 'make her swallow',      text: '*finishes in her mouth, grabs her jaw shut, tells her to swallow every drop*' },
        { emoji: '💦',  label: 'cum on her face',       text: '*pulls out at the last second, coats her cheeks, eyelashes, mouth*' },
        { emoji: '🧎',  label: 'make her worship',      text: '*stands over her, tells her to kiss every inch, thank it, lick it slow*' },
        { emoji: '🫁',  label: 'deepthroat hold',       text: '*buries her nose in my pelvis and holds her there, counts to ten*' },
        { emoji: '🦷',  label: 'bite warning',          text: '*one finger under her jaw — no teeth. she learns fast.*' }
      ]
    },
    anal: {
      label: '🍑 Anal',
      actions: [
        { emoji: '💢',  label: 'force entry dry',       text: '*spits once, works the head in, ignores her cry*' },
        { emoji: '🟣',  label: 'plug first',            text: '*slides the plug in, leaves it an hour to open her up*' },
        { emoji: '🍆',  label: 'slow deep anal',        text: '*slides in inch by inch, watches her face in the mirror*' },
        { emoji: '🚀',  label: 'brutal pace',           text: '*grabs her hips and sets a merciless pace, hears her lose her breath*' },
        { emoji: '🫸',  label: 'double pen',            text: '*works in two while a finger stays deep in her cunt, both at once*' },
        { emoji: '💦',  label: 'cream her ass',         text: '*empties deep, holds her hips still, watches it leak when I pull out*' },
        { emoji: '👅',  label: 'rim her',               text: '*spreads her cheeks, tongue flat from back to front, over and over*' },
        { emoji: '📏',  label: 'anal training',         text: '*starts with one finger, works up, tells her what number we\'re at*' },
        { emoji: '🕳️',  label: 'gape hold',             text: '*pulls out at the right moment, holds her open, watches*' }
      ]
    },
    pain: {
      label: '🔥 Pain',
      actions: [
        { emoji: '🕯️',  label: 'hot wax on tits',       text: '*drips red candle wax slowly across her nipples and down her sternum*' },
        { emoji: '🕯️',  label: 'hot wax thighs',        text: '*drips hot wax along her inner thighs, watches her stomach jump*' },
        { emoji: '🥢',  label: 'whip her back',         text: '*lays five stripes across her shoulders with the leather, makes her count them*' },
        { emoji: '🪵',  label: 'cane ass',              text: '*six strokes with the cane, slow and measured, marks across both cheeks*' },
        { emoji: '🪢',  label: 'flog breasts',          text: '*steady flogging across her tits until they\'re red and swollen*' },
        { emoji: '🤏',  label: 'pinch nipples hard',    text: '*takes both nipples between thumb and forefinger, pinches, twists*' },
        { emoji: '🎀',  label: 'clamp nipples',         text: '*clips the weighted clamps on, adjusts until she whimpers*' },
        { emoji: '📎',  label: 'clamp clit',            text: '*small clamp on her clit hood, just enough pressure to keep her still*' },
        { emoji: '✋',  label: 'slap her pussy',        text: '*open-hand slap right between her legs, sharp wet sound*' },
        { emoji: '🤚',  label: 'slap tits red',         text: '*backhand across one breast, then the other*' },
        { emoji: '🦷',  label: 'bite nipples',          text: '*leans down, teeth closed on one nipple, bites until she sucks in a breath*' },
        { emoji: '🦶',  label: 'stomp (careful)',       text: '*puts a boot next to her head to make her stop moving*' }
      ]
    },
    punishment: {
      label: '⚱️ Punishment',
      actions: [
        { emoji: '🧍',  label: 'corner, silent',        text: '*sends her to the corner on her knees, hands behind head, one hour silent*' },
        { emoji: '🧎',  label: 'kneel on rice',         text: '*dumps a handful of rice, makes her kneel on it until I say stop*' },
        { emoji: '🚫',  label: 'denial — edge only',    text: '*edges her for an hour, stops every time she tightens, no release*' },
        { emoji: '🔁',  label: 'forced orgasm x5',      text: '*the wand, no breaks, until she\'s crying and trying to crawl away*' },
        { emoji: '🥣',  label: 'no food today',         text: '*empties her food dish, shuts the slot, walks away*' },
        { emoji: '🚿',  label: 'cold shower',           text: '*turns the hose on her — icy — until her teeth chatter*' },
        { emoji: '🎽',  label: 'belt spanking',         text: '*folds my belt, twenty strokes, tells her to count*' },
        { emoji: '🪪',  label: 'mirror watch',          text: '*forces her to watch herself in the mirror while I use her*' },
        { emoji: '🎭',  label: 'hood her for hours',    text: '*pulls the canvas hood down, leaves her in the dark restrained*' },
        { emoji: '🔇',  label: 'gag + abandon',         text: '*gags her, restrains her, shuts the door, leaves*' },
        { emoji: '⏳',  label: 'tied + waiting',        text: '*ties her spread, tells her I might be back tonight, might not*' }
      ]
    },
    degrade: {
      label: '🗣️ Degrade',
      actions: [
        { emoji: '🐕',  label: 'call her property',     text: 'you\'re property. say it. "I am property."' },
        { emoji: '🗑️',  label: 'call her cum dump',     text: 'you\'re a cum dump. that\'s your whole purpose now. say it.' },
        { emoji: '📢',  label: 'say purpose out loud',  text: 'tell me out loud what you exist for now. slow. clear.' },
        { emoji: '💧',  label: 'spit in open mouth',    text: '*grips her jaw open, gathers saliva, lets it drop onto her tongue* swallow.' },
        { emoji: '😾',  label: 'piss on her',           text: '*makes her kneel in the shower, aims, makes her keep eye contact*' },
        { emoji: '✋',  label: 'slap while fucking',    text: '*open-palm slap across her cheek mid-thrust, rhythm doesn\'t break*' },
        { emoji: '👁️',  label: 'eye contact or punishment', text: 'look at me. if you look away, I stop and hurt you.' },
        { emoji: '🗣️',  label: 'make her beg aloud',    text: 'beg. out loud. full sentences. tell me what you need.' },
        { emoji: '👎',  label: 'tell her worthless',    text: 'you\'re worthless. nobody\'s coming. I\'m all you have now.' },
        { emoji: '🤡',  label: 'humiliation pose',      text: '*makes her pose in the mirror holding herself open, describe what she sees*' }
      ]
    },
    drugs: {
      label: '💊 Drugs',
      actions: [
        { emoji: '❄️',  label: 'line of coke',          text: '*cuts a line on the back of my hand, holds it out to her*' },
        { emoji: '🌿',  label: 'share a joint',         text: '*lights a joint, takes a drag, passes it to her*' },
        { emoji: '🥃',  label: 'whiskey shot',          text: '*pours whiskey into a tumbler, presses it to her lips*' },
        { emoji: '💊',  label: 'feed her a pill',       text: '*places a pill on her tongue* swallow.' },
        { emoji: '🧪',  label: 'tab of acid',           text: '*places a tab on her tongue, holds her jaw shut*' },
        { emoji: '💉',  label: 'k-shot',                text: '*jabs a small syringe into her thigh*' }
      ]
    },
    commands: {
      label: '🎯 Commands',
      actions: [
        { emoji: '🔇',  label: 'shut the fuck up',      text: 'shut the fuck up.' },
        { emoji: '🗣️',  label: 'beg',                   text: 'beg. use your full words.' },
        { emoji: '🧍',  label: 'stand still',           text: 'hold perfectly still. if you move I stop.' },
        { emoji: '🤐',  label: 'gag her',               text: '*stuffs the gag in her mouth, cinches the strap*' },
        { emoji: '👁️',  label: 'eyes on me',            text: '*stops, stares* eyes on me. the whole time.' },
        { emoji: '🚪',  label: 'leave her tied',        text: '*stands up mid-scene, zips up* think about it. *walks out*' },
        { emoji: '🔓',  label: 'loosen one restraint',  text: '*unclips one cuff* behave.' },
        { emoji: '🛐',  label: 'kneel and worship',     text: 'on your knees. mouth open. now.' },
        { emoji: '👀',  label: 'inspect her',           text: '*walks slow circles around her, examining every inch of her body*' },
        { emoji: '❤️‍🩹',label: 'show a little mercy',    text: '*softens for a second — tucks hair behind her ear, thumb on her cheek*' }
      ]
    }
  };

  function render(container, girl, mode, onSelect) {
    const currentTab = container.dataset.qaTab || 'force';
    const tabKeys = Object.keys(TABS);
    container.innerHTML = `
      <div class="qa-tabs">
        ${tabKeys.map(k => `<button class="qa-tab ${k === currentTab ? 'active' : ''}" data-qa-tab-key="${k}">${TABS[k].label}</button>`).join('')}
      </div>
      <div class="qa-grid">
        ${TABS[currentTab].actions.map((a, i) => `
          <button class="qa-btn" data-qa-idx="${i}" title="${escapeHtml(a.text)}">
            <span class="qa-emoji">${a.emoji}</span>
            <span class="qa-label">${escapeHtml(a.label)}</span>
          </button>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('[data-qa-tab-key]').forEach(t => {
      t.onclick = () => {
        container.dataset.qaTab = t.dataset.qaTabKey;
        render(container, girl, mode, onSelect);
      };
    });
    container.querySelectorAll('.qa-btn').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.dataset.qaIdx, 10);
        const action = TABS[currentTab].actions[idx];
        if (action) onSelect(action.text);
      };
    });
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.SSDQuickActions = Object.freeze({ render, TABS });
})();
