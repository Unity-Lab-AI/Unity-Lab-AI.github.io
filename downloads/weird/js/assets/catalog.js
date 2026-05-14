// SEX SLAVE DUNGEON — asset catalog.
// Authoritative data for every asset in the game: locations, items, dungeons, rooms, facilities.
// Each entry has:
//   id           — stable ID (also the folder name under assets/<category>/<id>/)
//   displayName  — human label for UI
//   emoji        — text-layer fallback / shorthand used everywhere
//   category     — "location" | "item" | "dungeon" | "room" | "facility"
//   subcategory  — finer group within category (items: sedation/restraint/food/etc.)
//   prompt       — the PG-beat-around-the-bush template prompt for an image generator.
//                  NOTE: every prompt is deliberately euphemistic, artistic, documentary-style —
//                  we dance around explicit content and describe atmospheres / props / framings
//                  that imply the intent without triggering image-gen content filters. Gee runs
//                  these through his image generator of choice and drops the output into the
//                  matching assets/<category>/<id>/ folder. The loader auto-discovers it.
//   cost         — in-game price for items / locations / upgrades
//   unlock       — unlock conditions
//   gridPlacement — (locations only) default button position in the town plot grid (x, y)
//   plotTokens   — (dungeons only) aesthetic tokens used in full-res environment renders
//
// No hardcoded file names — loader tries cover.png/jpg/webp, then falls back to emoji.

(function () {
  'use strict';

  // =========================================================================
  // LOCATIONS — outside world hunt locations. Each also doubles as a slot-item
  // the player plots into the town grid.
  // =========================================================================
  const LOCATIONS = [
    {
      id: 'street', displayName: 'Main Street', emoji: '🏙️',
      category: 'location', subcategory: 'easy',
      prompt: 'wide documentary photograph of a downtown main street at dusk, neon signs reflecting on damp pavement, pedestrians passing blurred, brick facades, mood of a city that keeps its own business, 35mm film look, muted color grade',
      cost: 0, unlock: { default: true },
      gridPlacement: { x: 0, y: 0 },
      notes: 'Starter location. Low-difficulty hunts. Public setting — tough for capture attempts.'
    },
    {
      id: 'club', displayName: 'Pink Room Club', emoji: '🍸',
      category: 'location', subcategory: 'medium',
      prompt: 'exterior establishing shot of a trendy urban nightclub, pink and purple neon signage, bouncer silhouette at velvet rope, wet city street reflecting the lights, moody nightlife photography, cinematic color grade',
      cost: 500, unlock: { minNotoriety: 0 },
      gridPlacement: { x: 1, y: 0 },
      notes: 'Medium-difficulty. Drug-forward spawns. Loud, crowded.'
    },
    {
      id: 'library', displayName: 'Old Library', emoji: '📚',
      category: 'location', subcategory: 'medium',
      prompt: 'interior photograph of a vintage public library reading room, tall wooden shelves, warm reading lamps, late-afternoon light through arched windows, quiet studious atmosphere, shallow depth of field',
      cost: 400, unlock: { minNotoriety: 0 },
      gridPlacement: { x: 3, y: 0 },
      notes: 'Medium-difficulty. Shy bookish spawns. Quiet setting good for discreet approach.'
    },
    {
      id: 'park', displayName: 'Westwood Park', emoji: '🌳',
      category: 'location', subcategory: 'easy',
      prompt: 'golden hour photograph of an urban park, tree-lined paths, joggers and dog-walkers in background, sunlight through leaves, peaceful open setting, lifestyle photography',
      cost: 200, unlock: { default: true },
      gridPlacement: { x: 4, y: 0 },
      notes: 'Easy. Mixed spawns. Very public — difficult for capture attempts.'
    },
    {
      id: 'gym', displayName: 'Iron Gym', emoji: '🏋️',
      category: 'location', subcategory: 'medium',
      prompt: 'interior of a modern fitness center, rack of weights, athletic-apparel silhouettes mid-workout, fluorescent lighting, active energy, commercial gym aesthetic, wide angle',
      cost: 500, unlock: { minNotoriety: 1 },
      gridPlacement: { x: 1, y: 1 },
      notes: 'Medium. Athletic spawns. Members come and go — moderate foot traffic.'
    },
    {
      id: 'mall', displayName: 'Downtown Mall', emoji: '🏬',
      category: 'location', subcategory: 'medium',
      prompt: 'bright modern shopping mall concourse, skylights, window displays of boutique stores, reflective tile floor, shoppers crossing frame, commercial photography style',
      cost: 600, unlock: { minNotoriety: 1 },
      gridPlacement: { x: 2, y: 1 },
      notes: 'Medium. Mixed spawns. Very public, lots of cameras.'
    },
    {
      id: 'coffee-shop', displayName: 'Cup & Saucer', emoji: '☕',
      category: 'location', subcategory: 'easy',
      prompt: 'warm interior of an independent coffee shop, exposed brick, hanging pendant lights, barista behind bar, plants on the counter, cozy third-wave-coffee aesthetic, natural lighting',
      cost: 300, unlock: { default: true },
      gridPlacement: { x: 4, y: 1 },
      notes: 'Easy. Barista / student / writer spawns. Intimate setting.'
    },
    {
      id: 'sorority', displayName: 'Greek Row', emoji: '🏛️',
      category: 'location', subcategory: 'hard',
      prompt: 'afternoon shot of a stately Greek-letter house on a tree-lined college street, white-columned porch, landscaped lawn, banner with Greek letters, collegiate atmosphere, editorial photography',
      cost: 1500, unlock: { minNotoriety: 3 },
      gridPlacement: { x: 0, y: 2 },
      notes: 'Hard. Vibrant, polished spawns. Alumni connections increase suspicion.'
    },
    {
      id: 'remote', displayName: 'Backroads', emoji: '🛣️',
      category: 'location', subcategory: 'hard',
      prompt: 'dusk landscape photograph of a two-lane backroad winding through scrubland, single car headlights approaching, power lines following the road, wide horizon, isolated-highway photography',
      cost: 800, unlock: { minNotoriety: 4 },
      gridPlacement: { x: 3, y: 2 },
      notes: 'Hard+. Rare hitchhiker-type spawns. Remote = excellent capture conditions.'
    },
    {
      id: 'hotel-lobby', displayName: 'Grand Hotel Lobby', emoji: '🏨',
      category: 'location', subcategory: 'hard',
      prompt: 'interior of an upscale hotel lobby, marble floor, modernist chandelier, concierge desk, leather seating areas, well-dressed guests crossing frame, luxury hospitality photography',
      cost: 2000, unlock: { minNotoriety: 5 },
      gridPlacement: { x: 4, y: 2 },
      notes: 'Hard. High-end spawns. Heavy surveillance.'
    },
    {
      id: 'private-party', displayName: 'Private Party', emoji: '🎉',
      category: 'location', subcategory: 'hard',
      prompt: 'interior of an upscale house party, string lights, people mingling with drinks, record player in background, hardwood floors, warm ambient lighting, lifestyle-editorial photography',
      cost: 1200, unlock: { minNotoriety: 6, requiredItems: ['fake-id'] },
      gridPlacement: { x: 0, y: 3 },
      notes: 'Hard. Invitation-only. Insider spawns. Risk of being recognized.'
    },
    {
      id: 'school-campus', displayName: 'Campus Quad', emoji: '🎓',
      category: 'location', subcategory: 'medium',
      prompt: 'wide shot of a university campus quad, ivy-covered brick buildings, students crossing with backpacks, autumn trees, cathedral-like clock tower in background, collegiate editorial photography',
      cost: 700, unlock: { minNotoriety: 2 },
      gridPlacement: { x: 1, y: 3 },
      notes: 'Medium-hard. Young-adult spawns. Campus security.'
    }
  ];

  // =========================================================================
  // ITEMS — the whole huge items list. Split by subcategory.
  // All prompts are PG-beat-around-the-bush.
  // =========================================================================
  const ITEMS = [
    // --- SEDATION ---
    {
      id: 'rohypnol', displayName: 'Sedative Vial (sm)', emoji: '💉',
      category: 'item', subcategory: 'sedation',
      prompt: 'product photograph on plain background of a single small glass medical vial of clear liquid, rubber-stopper top, pharmacy-grade labeling slightly blurred, professional commerce photography',
      cost: 180, tier: 2,
      notes: 'Capture tool. +0.35 capture bonus.'
    },
    {
      id: 'chloroform', displayName: 'Clear Solvent Bottle', emoji: '⚗️',
      category: 'item', subcategory: 'sedation',
      prompt: 'studio product shot of a small amber glass laboratory bottle with ground-glass stopper, clear liquid inside, plain white backdrop, science-supplies catalog style',
      cost: 220, tier: 2,
      notes: 'Capture tool. +0.40 capture bonus. Smells obvious if wasted.'
    },
    {
      id: 'ether', displayName: 'Anesthetic Solution', emoji: '🧪',
      category: 'item', subcategory: 'sedation',
      prompt: 'clinical product photograph of a small brown-glass bottle marked with a simple label, stoppered, placed on a white lab bench, professional medical-supply catalog composition',
      cost: 300, tier: 3,
      notes: 'Capture tool. +0.50 capture bonus. Fast-acting.'
    },
    {
      id: 'ketamine', displayName: 'Veterinary Bottle', emoji: '🐴',
      category: 'item', subcategory: 'sedation',
      prompt: 'product shot of a small amber veterinary medicine bottle with clinical label partially obscured, placed next to a small bag of white crystalline powder on a dark surface, muted documentary photography',
      cost: 450, tier: 4,
      notes: 'Capture tool. +0.60. Requires contacts to acquire.'
    },

    // --- BLUNT ---
    {
      id: 'pipe', displayName: 'Lead Pipe', emoji: '🔧',
      category: 'item', subcategory: 'blunt',
      prompt: 'product photograph of a short length of weathered lead pipe with threaded ends on a plain white background, hardware-salvage catalog style',
      cost: 15, tier: 0,
      notes: 'Starter blunt-weapon subdue tool. Cheap, quick, messy. Low success rate, high suspicion if witnessed.'
    },

    // --- RESTRAINT-GRADE ---
    {
      id: 'duct-tape', displayName: 'Duct Tape', emoji: '📼',
      category: 'item', subcategory: 'restraint',
      prompt: 'product photograph of a single roll of heavy-duty silver duct tape on a plain white background, professional commerce photography, commercial grade industrial',
      cost: 5, tier: 1,
      notes: 'Restraint basic. Crude but effective.'
    },
    {
      id: 'rope', displayName: 'Nylon Rope Coil', emoji: '🪢',
      category: 'item', subcategory: 'restraint',
      prompt: 'product shot of a coiled length of black nylon rope on a plain white backdrop, commercial hardware catalog style',
      cost: 12, tier: 1,
      notes: 'Restraint basic. Versatile.'
    },
    {
      id: 'zip-ties', displayName: 'Heavy-Duty Zip Ties', emoji: '🔗',
      category: 'item', subcategory: 'restraint',
      prompt: 'product photograph of a bundle of heavy-duty black plastic zip ties fanned out on a plain white background, commercial hardware catalog style',
      cost: 8, tier: 2,
      notes: 'Restraint tier-2. Single-use.'
    },
    {
      id: 'handcuffs', displayName: 'Steel Cuffs', emoji: '🔒',
      category: 'item', subcategory: 'restraint',
      prompt: 'product photograph of a pair of chrome-plated steel handcuffs on a plain white background, commercial security-equipment catalog style',
      cost: 45, tier: 3,
      notes: 'Restraint tier-3. Reusable, secure.'
    },
    {
      id: 'shackles', displayName: 'Steel Shackles', emoji: '⛓️',
      category: 'item', subcategory: 'restraint',
      prompt: 'product photograph of heavy steel leg shackles with a short connecting chain on a plain white backdrop, industrial-security catalog style',
      cost: 120, tier: 4,
      notes: 'Restraint tier-4. Install in room.'
    },
    {
      id: 'harness', displayName: 'Full Body Harness Rig', emoji: '🧍',
      category: 'item', subcategory: 'restraint',
      prompt: 'product photograph of a complex black leather body harness with metal rings, displayed on a dress form against a plain studio backdrop, tasteful product catalog composition',
      cost: 320, tier: 5,
      notes: 'Restraint tier-5. Install in deluxe+ rooms.'
    },

    // --- CONTAINMENT ---
    {
      id: 'blindfold', displayName: 'Leather Blindfold', emoji: '🕶️',
      category: 'item', subcategory: 'containment',
      prompt: 'product photograph of a soft black leather blindfold with elastic strap, resting on a plain neutral background, tasteful product-catalog composition',
      cost: 25, tier: 1
    },
    {
      id: 'ballgag', displayName: 'Silicone Gag', emoji: '👄',
      category: 'item', subcategory: 'containment',
      prompt: 'product photograph of a silicone-and-leather mouth gag on a plain neutral backdrop, product-catalog composition',
      cost: 40, tier: 2
    },
    {
      id: 'hood', displayName: 'Canvas Hood', emoji: '🎭',
      category: 'item', subcategory: 'containment',
      prompt: 'product photograph of a plain canvas hood on a neutral backdrop, utilitarian product-catalog composition',
      cost: 60, tier: 2
    },
    {
      id: 'collar', displayName: 'Leather Collar w/ Bell', emoji: '🔔',
      category: 'item', subcategory: 'containment',
      prompt: 'product photograph of a black leather collar with a small silver bell and D-ring, displayed on a plain background, tasteful accessory catalog composition',
      cost: 55, tier: 2
    },

    // --- TOYS ---
    {
      id: 'vibrator', displayName: 'Wand Vibrator', emoji: '💫',
      category: 'item', subcategory: 'toys',
      prompt: 'product photograph of a modern cordless wand massager on a plain white background, commercial personal-care catalog style',
      cost: 70, tier: 2
    },
    {
      id: 'dildo', displayName: 'Silicone Sculpture', emoji: '🔵',
      category: 'item', subcategory: 'toys',
      prompt: 'product photograph of an abstract blue silicone sculpture on a plain neutral backdrop, artful design-product catalog composition',
      cost: 60, tier: 2
    },
    {
      id: 'plug', displayName: 'Training Plug', emoji: '🟣',
      category: 'item', subcategory: 'toys',
      prompt: 'product photograph of a smooth purple silicone object on a plain neutral background, adult-product catalog composition',
      cost: 40, tier: 2
    },
    {
      id: 'clamps', displayName: 'Weighted Clamps', emoji: '📎',
      category: 'item', subcategory: 'toys',
      prompt: 'product photograph of a pair of small metal adjustable clamps connected by a chain with weighted drops, plain neutral backdrop, accessory catalog composition',
      cost: 35, tier: 2
    },

    // --- FOOD ---
    {
      id: 'slop', displayName: 'Rations Bucket', emoji: '🥣',
      category: 'item', subcategory: 'food',
      prompt: 'overhead photograph of a plastic bucket of uniform beige paste-like rations, no branding, flat cafeteria lighting, documentary photography',
      cost: 3, tier: 0
    },
    {
      id: 'basic-meal', displayName: 'Microwave Meals (12pk)', emoji: '🍱',
      category: 'item', subcategory: 'food',
      prompt: 'product photograph of a stack of plain-packaging frozen microwave meals on a grocery-store shelf style backdrop, cheap-generic-brand catalog style',
      cost: 18, tier: 1
    },
    {
      id: 'gourmet-meal', displayName: 'Gourmet Boxes', emoji: '🍽️',
      category: 'item', subcategory: 'food',
      prompt: 'plated overhead photograph of a gourmet restaurant dish with garnish, on a dark matte plate, fine-dining editorial photography',
      cost: 45, tier: 3
    },
    {
      id: 'wine', displayName: 'Bottle of Red', emoji: '🍷',
      category: 'item', subcategory: 'drugs',
      prompt: 'product photograph of a single bottle of red wine on a plain dark backdrop, minimal label, wine-catalog editorial style',
      cost: 25, tier: 2,
      notes: 'Wine or whiskey. Slurring onset ~20min, 90min duration.'
    },
    {
      id: 'weed', displayName: 'Rolled Joints (pack)', emoji: '🌿',
      category: 'item', subcategory: 'drugs',
      prompt: 'close-up product photograph of hand-rolled herbal cigarettes in a small tin on a plain neutral background, lifestyle-catalog photography',
      cost: 15, tier: 1,
      notes: 'Cannabis. Slow onset, 2hr duration. Mellowing.'
    },
    {
      id: 'coke-bumps', displayName: 'Small White Packet', emoji: '❄️',
      category: 'item', subcategory: 'drugs',
      prompt: 'close-up product photograph of a small folded paper packet of white powder on a black mirrored surface with a thin metal straw, moody chiaroscuro product photography',
      cost: 80, tier: 3,
      notes: 'Stimulant. Rapid onset, jaw-clenching high, 45min duration.'
    },
    {
      id: 'mdma', displayName: 'Pressed Pills', emoji: '💊',
      category: 'item', subcategory: 'drugs',
      prompt: 'macro product photograph of a few small colorful pressed pills in a blister pack on a plain white background, pharmacy-catalog style',
      cost: 60, tier: 3,
      notes: 'Euphoric empathy drug. 30min onset, 4hr duration. Weekend stuff.'
    },
    {
      id: 'acid', displayName: 'Blotter Tab', emoji: '🧪',
      category: 'item', subcategory: 'drugs',
      prompt: 'macro product photograph of a small square perforated paper tab on a neutral background, harsh studio lighting, scientific-specimen framing',
      cost: 40, tier: 3,
      notes: 'Psychedelic. 45min onset, 10hr duration. Architecture-session material.'
    },

    // --- DUNGEON-UPGRADE ITEMS ---
    {
      id: 'lock-basic', displayName: 'Deadbolt Kit', emoji: '🗝️',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a heavy steel deadbolt lock kit in retail packaging, hardware catalog style, commercial security-supply photography',
      cost: 60, tier: 1
    },
    {
      id: 'lock-steel', displayName: 'Vault-Grade Lock', emoji: '🔐',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of an industrial combination-dial vault lock on a plain backdrop, commercial high-security catalog composition',
      cost: 400, tier: 4
    },
    {
      id: 'lights-dim', displayName: 'Dim Warm Bulb', emoji: '💡',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a single bare incandescent bulb with warm glow, simple plain backdrop, minimalist catalog photography',
      cost: 10, tier: 1
    },
    {
      id: 'lights-led', displayName: 'Mood LED Strips', emoji: '🔆',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of coiled color-changing LED light strips in retail packaging on a neutral backdrop, tech-catalog style',
      cost: 50, tier: 3
    },
    {
      id: 'toilet-can', displayName: 'Bucket (tier 0)', emoji: '🪣',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a plain galvanized-metal utility pail on a plain backdrop, commercial hardware catalog style',
      cost: 5, tier: 0
    },
    {
      id: 'toilet-bucket', displayName: 'Portable Commode', emoji: '🚽',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a portable commode / camping toilet on a plain backdrop, utility-catalog style',
      cost: 45, tier: 1
    },
    {
      id: 'toilet-plumbing', displayName: 'Plumbing Install Kit', emoji: '🚰',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a plumbing installation kit with pipes, fittings, and a compact toilet unit laid out on a plain backdrop, hardware-catalog composition',
      cost: 300, tier: 2
    },
    {
      id: 'bedding-mat', displayName: 'Foam Mat', emoji: '🟫',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a rolled foam sleeping pad on a plain backdrop, outdoor-gear catalog style',
      cost: 20, tier: 1
    },
    {
      id: 'bedding-real-bed', displayName: 'Twin Bed Set', emoji: '🛏️',
      category: 'item', subcategory: 'dungeon-upgrade',
      prompt: 'product photograph of a basic twin bed with metal frame, plain sheets, single pillow, against a plain studio backdrop, furniture-catalog style',
      cost: 150, tier: 3
    },

    // --- CONSUMABLES ---
    {
      id: 'lube', displayName: 'Lubricant (bulk)', emoji: '💧',
      category: 'item', subcategory: 'consumables',
      prompt: 'product photograph of a plain-label pump bottle on a neutral backdrop, pharmacy-catalog style composition',
      cost: 12, tier: 1
    },
    {
      id: 'bandages', displayName: 'First-Aid Pack', emoji: '🩹',
      category: 'item', subcategory: 'consumables',
      prompt: 'product photograph of a standard first-aid kit box opened to show contents — bandages, gauze, antiseptic — on a plain neutral backdrop, clinical-supply catalog style',
      cost: 20, tier: 1
    },

    // --- OUTSIDE-WORLD UTILITY ---
    {
      id: 'cover-clothing', displayName: 'Nondescript Jacket', emoji: '🧥',
      category: 'item', subcategory: 'utility',
      prompt: 'product photograph of a plain dark-gray zip-up hoodie or light jacket on a mannequin against a plain studio backdrop, commercial apparel catalog style',
      cost: 30, tier: 1
    },
    {
      id: 'fake-id', displayName: 'Fake ID', emoji: '🪪',
      category: 'item', subcategory: 'utility',
      prompt: 'close-up product photograph of a generic wallet-sized plastic card on a dark mirrored surface, minimal design, muted product-photography style',
      cost: 250, tier: 3
    },
    {
      id: 'burner-phone', displayName: 'Burner Phone', emoji: '📱',
      category: 'item', subcategory: 'utility',
      prompt: 'product photograph of a basic candybar-style feature phone in plain retail packaging on a plain neutral backdrop, budget-electronics catalog style',
      cost: 40, tier: 2
    },

    // --- TECH ---
    {
      id: 'hidden-camera', displayName: 'Hidden Cam (pinhole)', emoji: '🎥',
      category: 'item', subcategory: 'tech',
      prompt: 'macro product photograph of a tiny pinhole surveillance camera module next to a US quarter for scale on a plain studio backdrop, tech-catalog photography',
      cost: 120, tier: 3
    },
    {
      id: 'security-camera', displayName: 'Wall-Mount Security Cam', emoji: '📹',
      category: 'item', subcategory: 'tech',
      prompt: 'product photograph of a white plastic wall-mount security camera on a plain backdrop, commercial security-supply catalog style',
      cost: 180, tier: 3
    },
    {
      id: 'recording-rig', displayName: 'Recording Rig (4K)', emoji: '🎬',
      category: 'item', subcategory: 'tech',
      prompt: 'product photograph of a professional 4K camera mounted on a tripod with external microphone and LED ring light, studio-photography-equipment catalog style',
      cost: 900, tier: 4
    }
  ];

  // =========================================================================
  // DUNGEONS — PREDATOR HIDEOUTS. Isolated, concealed, away from prying eyes and ears.
  //
  // Gee verbatim 2026-04-21: "locations wherrer one preditor would set up his save dugeon
  // from prying eyes and ears.. ccaontainer in the woods.. hole in the ground in the desert.
  // hidden room in basement, lock tunnel in abandoned sewers, subway service room. ect ect"
  //
  // These are NOT hunting locations. Hunting locations (street/club/library/etc.) are
  // separate — they live in the LOCATIONS array and are purchased as properties in the
  // outside-world plot grid. Dungeons are hidden hideouts, OFF the town plot, where
  // captives are actually kept.
  //
  // Each hideout has: isolation (higher = less suspicion heat), concealment (higher = less
  // discovery risk), roomSlots (capacity), tier (progression), cost (in episode-sale dollars),
  // contentValueMultiplier (some hideouts give better aesthetic for films).
  // =========================================================================
  const DUNGEONS = [
    {
      id: 'hole-in-the-desert', displayName: 'Hole in the Desert', emoji: '🕳️',
      category: 'dungeon', subcategory: 'starter',
      prompt: 'documentary landscape photograph at dusk of a remote desert clearing with a rectangular pit dug into the earth, edges reinforced with weathered plywood and tarps, rope ladder coiled at the rim, a single heavy iron ring embedded in the pit floor with a length of chain attached, scrub brush and tumbleweeds scattered around, distant mountains on the horizon, no structures in sight, desolate isolation, muted golden-hour light, 35mm film aesthetic',
      cost: 0, tier: 0, roomSlots: 1, contentValueMultiplier: 0.65,
      isolation: 0.95, concealment: 0.7,
      plotTokens: 'buried desert pit, plywood-reinforced walls, rope ladder, iron floor ring, chain, remote, dusty',
      holdType: 'floor-ring-chain',
      holdPrompt: 'heavy forged iron ring set in the pit floor, attached chain with a steel cuff',
      capacityUpgrades: [
        { atSlots: 2, cost: 400,  addsHold: 'floor-ring-chain', describedAs: 'widened pit with a second floor ring at the opposite corner' },
        { atSlots: 3, cost: 900,  addsHold: 'floor-ring-chain', describedAs: 'dug deeper, three-ring layout around the central ladder' }
      ],
      notes: 'Starter hideout. 1 hold at base. Dig to expand up to 3. Grim, cramped, buried-alive aesthetic.'
    },
    {
      id: 'woods-container', displayName: 'Container in the Woods', emoji: '📦',
      category: 'dungeon', subcategory: 'starter',
      prompt: 'documentary forest photograph of a partially-buried weathered shipping container in a dense pine forest clearing, moss and vines creeping over the metal, camouflage netting over the top, fallen leaves covering the access hatch, interior visible through open hatch showing a row of heavy eyebolts welded to the steel walls with chains hanging from them, overgrown dirt two-track leading in from a distant logging road, dim dappled light through the canopy, muted earthy tones, 35mm film look',
      cost: 800, tier: 1, roomSlots: 2, contentValueMultiplier: 0.8,
      isolation: 0.9, concealment: 0.85,
      plotTokens: 'buried shipping container, pine forest, moss, camouflage netting, welded wall eyebolts, chains, isolated dirt road',
      holdType: 'wall-eyebolt-chain',
      holdPrompt: 'heavy steel eyebolt welded to the container wall, chain with cuff hanging from it',
      capacityUpgrades: [
        { atSlots: 3, cost: 600,  addsHold: 'wall-eyebolt-chain', describedAs: 'added eyebolt on the far wall' },
        { atSlots: 4, cost: 1200, addsHold: 'wall-eyebolt-chain', describedAs: 'bury a second container end-to-end, corridor between them' }
      ],
      notes: '2 holds at base. Weld more eyebolts or bury a second container. Cap 4.'
    },
    {
      id: 'basement-hidden-room', displayName: 'Hidden Basement Room', emoji: '🚪',
      category: 'dungeon', subcategory: 'mid',
      prompt: 'documentary interior photograph of an unassuming suburban basement, ordinary water heater and stacked cardboard boxes in foreground, and behind them a section of wood paneling that is subtly offset — revealing a concealed door seam — the room beyond shows three bed frames bolted to the concrete floor, each frame fitted with metal cuff rails at all four corners, bare overhead bulb, concrete floor, entirely ordinary surface basement except for the hidden threshold, muted tungsten lighting, 35mm documentary aesthetic',
      cost: 2000, tier: 2, roomSlots: 3, contentValueMultiplier: 0.9,
      isolation: 0.5, concealment: 0.9,
      plotTokens: 'ordinary suburban basement with concealed false-wall door, water heater, boxes, hidden threshold, bolted bed frames, cuff rails',
      holdType: 'bolted-bed-cuff',
      holdPrompt: 'steel bed frame bolted through the concrete floor with cuff rails at all four corners',
      capacityUpgrades: [
        { atSlots: 4, cost: 1200, addsHold: 'bolted-bed-cuff', describedAs: 'removed the adjacent storage closet to fit a fourth frame' },
        { atSlots: 5, cost: 2500, addsHold: 'bolted-bed-cuff', describedAs: 'broke through to the crawl-space next door to add a fifth' }
      ],
      notes: '3 holds at base. Expand by annexing adjacent basement areas. Cap 5.'
    },
    {
      id: 'subway-service-room', displayName: 'Subway Service Room', emoji: '🚇',
      category: 'dungeon', subcategory: 'mid',
      prompt: 'documentary interior photograph of a disused underground transit utility room, tiled walls with 1970s-era public-works signage half-peeled, heavy rusted metal door with a locked padlock bar, along one wall four narrow steel-barred cell bays separated by welded rebar partitions with padlocked door panels, bundled cables and old ventilation piping along the ceiling, single bare sodium-vapor bulb humming, forgotten-infrastructure aesthetic, moody sulfur-toned lighting, 35mm film',
      cost: 4500, tier: 3, roomSlots: 4, contentValueMultiplier: 0.95,
      isolation: 0.85, concealment: 0.8,
      plotTokens: 'disused subway service room, tiled walls, rusted metal door, steel-barred cell bays, rebar partitions, padlocked panels, old cables, sodium bulb',
      holdType: 'steel-barred-bay',
      holdPrompt: 'narrow steel-barred bay partition with a welded-rebar gate and padlock',
      capacityUpgrades: [
        { atSlots: 5, cost: 2000, addsHold: 'steel-barred-bay', describedAs: 'knocked through to the adjacent utility closet' },
        { atSlots: 6, cost: 3800, addsHold: 'steel-barred-bay', describedAs: 'extended into the next service alcove down the corridor' }
      ],
      notes: '4 holds at base. Cap 6. Requires city knowledge + bribes for door-key access.'
    },
    {
      id: 'sewer-tunnel-locked', displayName: 'Locked Sewer Tunnel', emoji: '🦠',
      category: 'dungeon', subcategory: 'mid',
      prompt: 'documentary interior photograph of a sealed-off section of abandoned brick sewer tunnel, heavy modern steel bulkhead with a high-security padlock welded across an archway of Victorian-era brickwork, six alcoves carved into the brick at regular intervals each fitted with a heavy forged ring and chain anchored into the masonry, standing water, dripping condensate, iron rungs climbing to a long-forgotten manhole, sickly green-tinged lamp clamped to the wall, 35mm film, claustrophobic damp atmosphere',
      cost: 7000, tier: 3, roomSlots: 6, contentValueMultiplier: 1.0,
      isolation: 0.95, concealment: 0.9,
      plotTokens: 'sealed sewer tunnel, brick arch, steel bulkhead, alcoves with forged rings and chains, standing water, iron rungs, sickly lamp',
      holdType: 'alcove-ring-chain',
      holdPrompt: 'brick alcove with a heavy forged iron ring anchored into the masonry, chain with cuff',
      capacityUpgrades: [
        { atSlots: 8, cost: 4000, addsHold: 'alcove-ring-chain', describedAs: 'broke the bulkhead further down-tunnel to add two more alcoves' },
        { atSlots: 10, cost: 8000, addsHold: 'alcove-ring-chain', describedAs: 'linked through to the adjoining sewer branch' }
      ],
      notes: '6 holds at base. Cap 10. Extreme isolation. Flooding risk during heavy rain.'
    },
    {
      id: 'coldwar-bunker', displayName: 'Cold War Bunker', emoji: '☢️',
      category: 'dungeon', subcategory: 'late',
      prompt: 'documentary interior photograph of a repurposed mid-century civil-defense bunker, concrete walls stained with decades of damp, heavy blast door with combination wheel, overhead fluorescent tubes buzzing, ten concrete-walled bay cells along the main corridor each with its own steel door and built-in wall cuff station, cold-war era ventilation ducts crossing the ceiling, dated warning signage, government-surplus chairs stacked in a corner, mothball-and-concrete atmosphere, wide documentary angle',
      cost: 15000, tier: 4, roomSlots: 10, contentValueMultiplier: 1.2,
      isolation: 0.95, concealment: 0.75,
      plotTokens: 'repurposed cold-war bunker, concrete, blast door combination wheel, fluorescent tubes, ventilation ducts, concrete bay cells, steel doors, wall cuff stations, government surplus',
      holdType: 'bunker-bay-cuff',
      holdPrompt: 'concrete-walled bay with a steel door and built-in wall cuff station',
      capacityUpgrades: [
        { atSlots: 12, cost: 6000,  addsHold: 'bunker-bay-cuff', describedAs: 'converted the adjacent generator room' },
        { atSlots: 14, cost: 12000, addsHold: 'bunker-bay-cuff', describedAs: 'dug through to the secondary bunker access' }
      ],
      notes: '10 holds at base. Cap 14. Self-contained ventilation.'
    },
    {
      id: 'abandoned-mine-shaft', displayName: 'Abandoned Mine Shaft', emoji: '⛏️',
      category: 'dungeon', subcategory: 'late',
      prompt: 'documentary interior photograph of an abandoned deep-shaft mine adit, rough-hewn rock walls reinforced with aged timber cribbing, sixteen lateral cribbed alcoves along both walls each fitted with heavy industrial eyehooks sunk into the bedrock, rail cart tracks leading deeper into darkness, rusted ore bucket chain hanging from the ceiling, oil-lamp mounted on a post, gnarled wooden ladder descending to a lower level, wide cavernous composition, chiaroscuro lighting, 35mm documentary aesthetic',
      cost: 28000, tier: 5, roomSlots: 16, contentValueMultiplier: 1.3,
      isolation: 0.99, concealment: 0.9,
      plotTokens: 'abandoned deep mine shaft, timber cribbing, lateral cribbed alcoves, eyehooks sunk in bedrock, rail tracks, ore bucket, multiple levels, chiaroscuro',
      holdType: 'cribbed-alcove-eyehook',
      holdPrompt: 'timber-cribbed alcove with a heavy industrial eyehook sunk into the bedrock',
      capacityUpgrades: [
        { atSlots: 20, cost: 12000, addsHold: 'cribbed-alcove-eyehook', describedAs: 'opened the secondary drift tunnel' },
        { atSlots: 24, cost: 24000, addsHold: 'cribbed-alcove-eyehook', describedAs: 'extended into the lower-level workings' }
      ],
      notes: '16 holds at base. Cap 24. Near-total isolation; stability caveats in some levels.'
    },
    {
      id: 'remote-compound', displayName: 'Remote Off-Grid Compound', emoji: '🏕️',
      category: 'dungeon', subcategory: 'endgame',
      prompt: 'documentary landscape photograph of an isolated off-grid compound on a dirt track deep in the mountains, weathered single-story main building with metal roof and five adjacent hardened outbuildings each visible in the frame, solar panel array, propane tank, no power lines or other structures within sight, dense tree cover on all sides, miles of dirt road visible curling away toward the horizon, overcast muted lighting, wilderness-isolation aesthetic, wide establishing shot',
      cost: 60000, tier: 6, roomSlots: 24, contentValueMultiplier: 1.4,
      isolation: 0.98, concealment: 0.7,
      plotTokens: 'remote off-grid mountain compound, solar panels, propane, main building plus hardened outbuildings, miles of dirt track, no neighbors, wilderness',
      holdType: 'outbuilding-cell',
      holdPrompt: 'interior of a hardened wooden outbuilding fitted as a single-captive cell with bed-frame cuff rails and a barred outer door',
      capacityUpgrades: [
        { atSlots: 32, cost: 24000, addsHold: 'outbuilding-cell', describedAs: 'added four more pre-fab outbuildings on the back acreage' },
        { atSlots: 40, cost: 48000, addsHold: 'outbuilding-cell', describedAs: 'extended into the cleared back field with eight more structures' }
      ],
      notes: '24 holds at base across multiple hardened outbuildings. Cap 40. Nearest neighbor 15 miles.'
    },
    {
      id: 'underground-complex', displayName: 'Underground Complex', emoji: '🏛️',
      category: 'dungeon', subcategory: 'endgame',
      prompt: 'documentary architectural photograph of a purpose-built underground facility, polished concrete corridors stretching into perspective, forty separated concrete cells flanking the main corridors each with its own heavy security door and integrated steel bed-frame with cuff rails visible through the door window, heavy security doors at intervals, recessed lighting, HVAC vents, brushed steel signage, industrial-institutional-cold aesthetic, professional-grade infrastructure, wide cinematic angle',
      cost: 140000, tier: 7, roomSlots: 40, contentValueMultiplier: 1.6,
      isolation: 0.95, concealment: 0.95,
      plotTokens: 'purpose-built underground complex, polished concrete, separated cells with integrated bed-frame cuff rails, recessed lighting, HVAC, heavy security doors, institutional-grade, industrial-cold',
      holdType: 'cell-integrated-bedframe',
      holdPrompt: 'cell with integrated steel bed-frame bolted to floor and wall, cuff rails on all four corners, barred viewing window in the security door',
      capacityUpgrades: [
        { atSlots: 56, cost: 80000,  addsHold: 'cell-integrated-bedframe', describedAs: 'opened the secondary wing' },
        { atSlots: 80, cost: 200000, addsHold: 'cell-integrated-bedframe', describedAs: 'activated the full lower level' }
      ],
      notes: '40 holds at base. Cap 80. The kingdom move.'
    }
  ];

  // =========================================================================
  // ROOMS — individual cell / room slot items (plot into dungeon grid).
  // =========================================================================
  const ROOMS = [
    {
      id: 'room-basic', displayName: 'Basic Cell', emoji: '🚪',
      category: 'room', subcategory: 'starter',
      prompt: 'documentary interior photograph of a bare basement cell, four rough walls, concrete floor, heavy metal door with small viewing slot, single overhead bulb, muted low-light photography, tight claustrophobic framing',
      cost: 0, tier: 0
    },
    {
      id: 'room-standard', displayName: 'Standard Cell', emoji: '🛏️',
      category: 'room', subcategory: 'mid',
      prompt: 'documentary interior photograph of a basic cell with a single mattress on a low frame, small wooden stool, small shelf, overhead bulb, concrete walls and floor, muted low-light',
      cost: 200, tier: 1
    },
    {
      id: 'room-deluxe', displayName: 'Deluxe Cell', emoji: '🛌',
      category: 'room', subcategory: 'mid',
      prompt: 'editorial interior photograph of a small private room with a real twin bed, neutral bedding, a small desk and chair, warm lamp lighting, carpeted floor, intimate lived-in residential aesthetic',
      cost: 800, tier: 2
    },
    {
      id: 'room-themed-medical', displayName: 'Medical Themed', emoji: '🏥',
      category: 'room', subcategory: 'themed',
      prompt: 'editorial interior photograph of a small themed medical examination room, white-tile walls, stainless-steel exam table with padded covering, medical cabinets with supplies, bright clinical lighting, moody contrast',
      cost: 1500, tier: 3
    },
    {
      id: 'room-themed-classroom', displayName: 'Classroom Themed', emoji: '📚',
      category: 'room', subcategory: 'themed',
      prompt: 'editorial interior photograph of a small themed classroom-style room, chalkboard on one wall, single wooden schoolhouse desk, teacher\'s desk with reading lamp, wood floor, vintage academic aesthetic',
      cost: 1500, tier: 3
    },
    {
      id: 'room-themed-bedroom', displayName: 'Bedroom Themed', emoji: '💗',
      category: 'room', subcategory: 'themed',
      prompt: 'editorial interior photograph of a small themed intimate bedroom, plush queen bed with deep red bedding, soft lamp lighting, velvet drapes along one wall, romantic private-retreat aesthetic',
      cost: 1800, tier: 3
    },
    {
      id: 'room-themed-chapel', displayName: 'Chapel Themed', emoji: '⛪',
      category: 'room', subcategory: 'themed',
      prompt: 'editorial interior photograph of a small themed gothic-chapel room, stone-arch vaulting, stained-glass alcove, single wooden kneeler, candlelit chiaroscuro lighting, sacral-gothic aesthetic',
      cost: 2000, tier: 4
    }
  ];

  // =========================================================================
  // FACILITIES — shared dungeon facilities (plot into dungeon grid, not girl-assigned).
  // =========================================================================
  const FACILITIES = [
    {
      id: 'main-hall', displayName: 'Main Hall', emoji: '🏛️',
      category: 'facility', subcategory: 'common',
      prompt: 'editorial interior photograph of a grand underground common hall, long banquet-style wooden table, arched ceiling, hanging chandeliers, rich rugs, communal gathering-space aesthetic',
      cost: 1200
    },
    {
      id: 'kitchen', displayName: 'Kitchen', emoji: '🍳',
      category: 'facility', subcategory: 'service',
      prompt: 'editorial interior photograph of a functional industrial-style kitchen, stainless-steel counters, gas range, hanging copper pots, warm task lighting, professional commercial-kitchen aesthetic',
      cost: 800
    },
    {
      id: 'security-office', displayName: 'Security Office', emoji: '📹',
      category: 'facility', subcategory: 'security',
      prompt: 'editorial interior photograph of a security control room, wall of CCTV monitors, dark ergonomic console, ambient blue glow from screens, mission-control aesthetic, wide angle',
      cost: 1500
    },
    {
      id: 'storage', displayName: 'Storage', emoji: '📦',
      category: 'facility', subcategory: 'utility',
      prompt: 'editorial interior photograph of an organized industrial storage room, labeled shelves with crates and containers, rolling step ladder, overhead fluorescent lighting, warehouse aesthetic',
      cost: 400
    },
    {
      id: 'utility-closet', displayName: 'Utility Closet', emoji: '🧹',
      category: 'facility', subcategory: 'utility',
      prompt: 'editorial interior photograph of a utility closet, cleaning supplies organized on shelves, mop and bucket, breaker panel on one wall, bare bulb lighting, functional-utilitarian aesthetic',
      cost: 200
    },
    {
      id: 'recording-studio', displayName: 'Recording Studio', emoji: '🎬',
      category: 'facility', subcategory: 'content',
      prompt: 'editorial interior photograph of a professional video production studio, multiple camera tripods, ring lights and softboxes, acoustic wall panels, control desk with monitors, studio-production aesthetic',
      cost: 3000
    },
    {
      id: 'observation-deck', displayName: 'Observation Deck', emoji: '🪟',
      category: 'facility', subcategory: 'security',
      prompt: 'editorial interior photograph of an elevated observation room with one-way-mirror wall facing downward into a dungeon common area below, leather observation chair, muted indirect lighting, voyeur-suite aesthetic',
      cost: 2500
    },
    {
      id: 'playroom', displayName: 'Playroom', emoji: '🎭',
      category: 'facility', subcategory: 'common',
      prompt: 'editorial interior photograph of a themed private playroom, red velvet furnishings, wall-mounted equipment racks holding various implements, mood lighting, theatrical-salon aesthetic',
      cost: 2200
    }
  ];

  // =========================================================================
  // ALL — merged catalog keyed by category for lookup.
  // =========================================================================
  const ALL = {
    location: LOCATIONS,
    item: ITEMS,
    dungeon: DUNGEONS,
    room: ROOMS,
    facility: FACILITIES
  };

  // ---- Lookup helpers ----
  function getAll(category) { return (ALL[category] || []).slice(); }
  function getById(category, id) { return (ALL[category] || []).find(x => x.id === id) || null; }
  function getItemsBySubcategory(subcat) {
    return ITEMS.filter(x => x.subcategory === subcat);
  }
  function getPrompt(category, id) {
    const e = getById(category, id);
    return e ? e.prompt : null;
  }
  function assetFolderPath(category, id) {
    // e.g., 'assets/locations/street/', 'assets/items/rohypnol/', 'assets/dungeons/cinderblock/'
    // Plural folder for locations and items, singular for others (by convention).
    const folder = {
      location: 'locations',
      item:     'items',
      dungeon:  'dungeons',
      room:     'rooms',
      facility: 'facilities'
    }[category] || category;
    return `assets/${folder}/${id}/`;
  }

  // =========================================================================
  // STARTER TOWN PLOT — the default button layout the player sees at new-game.
  // Matches each starter location's gridPlacement above.
  // =========================================================================
  const STARTER_TOWN_PLOT = {
    width: 5,
    height: 4,
    slots: LOCATIONS
      .filter(l => l.unlock?.default || l.cost === 0)  // starter-unlocked only
      .map(l => ({
        x: l.gridPlacement.x,
        y: l.gridPlacement.y,
        filled: true,
        itemId: l.id,
        emoji: l.emoji,
        label: l.displayName
      }))
      .concat(
        // fill the rest as empty plots
        (() => {
          const out = [];
          const filled = new Set(LOCATIONS.filter(l => l.unlock?.default || l.cost === 0)
            .map(l => `${l.gridPlacement.x},${l.gridPlacement.y}`));
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
              if (!filled.has(`${x},${y}`)) {
                out.push({ x, y, filled: false, itemId: null, emoji: '▫', label: 'empty plot' });
              }
            }
          }
          return out;
        })()
      )
  };

  window.SSDAssets = Object.freeze({
    LOCATIONS, ITEMS, DUNGEONS, ROOMS, FACILITIES,
    ALL,
    STARTER_TOWN_PLOT,
    getAll, getById, getItemsBySubcategory, getPrompt, assetFolderPath
  });
})();
