// SEX SLAVE DUNGEON — procedural girl generator.
// Template + seed → GirlProfile with persistent visualIdentity for Pollinations consistency.

(function () {
  'use strict';

  // Simple seeded RNG (xorshift32).
  function rng(seed) {
    let s = (seed | 0) || 0xABCDEF01;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) % 1_000_000) / 1_000_000;
    };
  }
  const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
  const range = (lo, hi, r) => Math.floor(lo + r() * (hi - lo + 1));

  // Archetype visual + personality pools.
  const ARCHETYPE_POOLS = {
    library: {
      namePool:       ['Marcy','Elena','Iris','Claire','June','Wren','Hazel','Ada','Maia','Rowan'],
      ageRange:       [19, 26],
      facialTokens:   ['soft jawline, wide hazel eyes, light freckles across nose bridge','oval face, pale skin, quiet mouth','delicate features, ash-blonde mid-length hair','thin wire-rim glasses, grey eyes, small mouth','long dark hair in a loose braid, serious brow'],
      outfitTokens:   ['oversized beige cardigan, black cotton leggings, plain ballet flats','long denim skirt, thin sweater, plain low-heel shoes','corduroy pants, button-up shirt, suede loafers','A-line skirt, tight turtleneck, dark tights'],
      statsRanges:    { intelligence: [70,95], defiance: [40,70], curiosity: [60,90], trust: [0,15], obedience: [0,10], stamina: [30,60], painTolerance: [10,40], lust: [20,50] },
      kinksPool:      ['praise-heavy','restraint','roleplay:teacher-student','being-read-to','denial','edging','cunnilingus-first'],
      drugsPool:      ['caffeine-heavy','occasional-weed'],
      speechTokens:   ['soft-spoken','long-sentences','apologizes-when-nervous','swears-rarely-but-hard']
    },
    club: {
      namePool:       ['Taryn','Sasha','Brandi','Destiny','Jasmine','Coco','Mia','Rio','Vivi','Bambi'],
      ageRange:       [20, 27],
      facialTokens:   ['sharp cheekbones with glittered makeup, hazel-brown eyes, glossy lips','platinum blonde, bold brow, full pout','dark-lined eyes, bronzer, loose waves','honey-tanned skin, dimples, bold red lip'],
      outfitTokens:   ['tight black mini-dress, strappy heels, body chain, choker','sheer crop top, leather mini skirt, thigh-high boots','sequin romper, platform sandals, hoop earrings','halter top, leather pants, stilettos'],
      statsRanges:    { intelligence: [40,70], defiance: [50,80], curiosity: [55,85], trust: [5,20], obedience: [5,20], stamina: [60,90], painTolerance: [40,70], lust: [60,95] },
      kinksPool:      ['exhibition','group','degradation','rough-oral','public-use','mdma-scenes','double-penetration'],
      drugsPool:      ['mdma-heavy','coke-party','tequila','weed'],
      speechTokens:   ['loud','laughs-mid-sentence','interrupts-self','cusses-as-punctuation']
    },
    street: {
      namePool:       ['Nikki','Rae','Shay','Jade','Dakota','Skye','Rose','Vey','Jax','Kyrie'],
      ageRange:       [19, 28],
      facialTokens:   ['sharp features, nose piercing, tousled dark hair','hard jaw, tired eyes, smudged liner','scarred brow, septum ring, natural hair pulled back','narrow face, gold tooth, tight ponytail'],
      outfitTokens:   ['hoodie, ripped denim, beat sneakers','leather jacket over tank top, jeans, boots','oversized t-shirt, cargo pants, sneakers','crop hoodie, black leggings, platform sneakers'],
      statsRanges:    { intelligence: [50,80], defiance: [70,95], curiosity: [40,70], trust: [0,10], obedience: [0,10], stamina: [60,90], painTolerance: [60,95], lust: [40,80] },
      kinksPool:      ['rough','pain','endurance','spit-forward','hair-pulling','face-slapping','anal-rough'],
      drugsPool:      ['weed-heavy','coke','occasional-pills','cheap-whiskey'],
      speechTokens:   ['short-clipped-sentences','no-bullshit','tests-before-submitting','spits-when-talking-dirty']
    },
    sorority: {
      namePool:       ['Ashley','Brooke','Caitlin','Delia','Emerson','Piper','Savannah','Whitney','Alyssa','Kennedy'],
      ageRange:       [19, 24],
      facialTokens:   ['polished beauty, symmetrical features, soft beachy waves','high cheekbones, even tan, glossy lips','classic all-American beauty, blue eyes, honey blonde','olive skin, dark glossy hair, groomed brows'],
      outfitTokens:   ['Greek-letter tank, denim shorts, designer sandals','sorority sweater, plaid skirt, knee socks','workout set with logo, clean sneakers, gold jewelry','sundress, wedge heels, monogrammed handbag'],
      statsRanges:    { intelligence: [50,80], defiance: [60,85], curiosity: [50,80], trust: [5,20], obedience: [5,20], stamina: [60,85], painTolerance: [30,60], lust: [55,85] },
      kinksPool:      ['praise-AND-degradation','bratty-sub','humiliation','exhibition','roleplay:debutante','ruining-image'],
      drugsPool:      ['adderall','coke-weekend','wine','vape-pens'],
      speechTokens:   ['valley-inflection','tests-masters-wallet','laughs-at-unfunny','eye-contact-flirty']
    },
    gym: {
      namePool:       ['Alex','Sam','Peyton','Cam','Reese','Logan','Kai','Tate','Devon','River'],
      ageRange:       [20, 29],
      facialTokens:   ['fresh-faced, minimal makeup, athletic ponytail','tan skin, sharp jaw, green eyes','muscular shoulders, strong features, tied-back dark hair','clean glow, little freckles, short cropped hair'],
      outfitTokens:   ['sports bra, high-waist leggings, running shoes','cropped tank, bike shorts, cross-trainers','workout set with mesh panels, clean socks, sneakers','long-sleeve compression top, leggings, sneakers'],
      statsRanges:    { intelligence: [50,75], defiance: [60,80], curiosity: [50,75], trust: [5,20], obedience: [5,20], stamina: [80,99], painTolerance: [70,95], lust: [50,80] },
      kinksPool:      ['endurance','rough-physical','dom-from-bottom','long-sessions','pressure-play','bondage-challenge'],
      drugsPool:      ['pre-workout','protein','occasional-weed','rare-coke'],
      speechTokens:   ['short-instructional','direct','physical-metaphors','grunts-between-words']
    },
    barista: {
      namePool:       ['Juno','Tansy','Clover','Lumen','Story','Pepper','Sage','Fern','Iris','Avery'],
      ageRange:       [19, 26],
      facialTokens:   ['cute round face, nose ring, dyed pastel ends','bangs-and-big-eyes, small mouth','winged liner, chipped lip piercing, tattoo visible','soft features, neutral makeup, one sleeve of fine-line tattoos'],
      outfitTokens:   ['apron over vintage band tee, high-waist mom jeans, worn sneakers','flannel over graphic tee, corduroy pants, Docs','cropped sweater, overalls, sneakers','thrifted dress, tights, chunky sneakers'],
      statsRanges:    { intelligence: [55,85], defiance: [45,70], curiosity: [70,95], trust: [10,25], obedience: [10,25], stamina: [50,75], painTolerance: [30,60], lust: [50,80] },
      kinksPool:      ['praise','service-scenes','caffeine+coke','bratty','roleplay:shift-manager','exhibitionism-mild'],
      drugsPool:      ['caffeine-always','weed','coke-curious','psychedelics-mild'],
      speechTokens:   ['dry-humor','quick-wit','deadpan','self-aware']
    },
    office: {
      namePool:       ['Alison','Rebecca','Diane','Megan','Kathryn','Vanessa','Stephanie','Lauren','Monica','Rachel'],
      ageRange:       [24, 32],
      facialTokens:   ['professional understated makeup, shoulder-length brown hair, pearl studs','sharp angular features, red lipstick, hair pulled back tight','designer glasses, high cheekbones, subtle contouring','classic beauty, blonde blown-out waves, pink lipstick'],
      outfitTokens:   ['pencil skirt, white button-up blouse, black heels, briefcase','tailored black pantsuit with open lapel, heels','sheath dress and blazer combo, coffee in hand','conservative work-wear with subtle sexy undertones, pearl necklace'],
      statsRanges:    { intelligence: [75,95], defiance: [50,75], curiosity: [55,80], trust: [5,20], obedience: [5,20], stamina: [45,70], painTolerance: [20,50], lust: [40,70] },
      kinksPool:      ['authority-reversal','roleplay:boss-subordinate','stress-release','hair-pulling','cheating-scenario','humiliation-over-wedding-ring'],
      drugsPool:      ['wine-nightly','xanax','occasional-coke','caffeine-heavy'],
      speechTokens:   ['professional-then-cracking','formal-vocabulary','curses-when-losing-control','controlled-breaking']
    },
    waitress: {
      namePool:       ['Candy','Brandi','Dolly','Misty','Sheila','Tammy','Wanda','Crystal','Jolene','Darlene'],
      ageRange:       [19, 30],
      facialTokens:   ['bleached blonde, heavy eyeliner, bubblegum pink lip','tan skin, gold hoops, teased hair, blue eyeshadow','red hair, cat-eye liner, nose stud','dark roots and highlighted ends, glossy lip, laugh lines starting'],
      outfitTokens:   ['diner apron over tight tshirt, short denim skirt, sneakers','waitress uniform with name tag, support shoes, messy ponytail','low-cut tank, daisy dukes, boots, apron tied low','truck-stop diner uniform, short skirt, orange apron'],
      statsRanges:    { intelligence: [45,70], defiance: [60,85], curiosity: [55,80], trust: [10,25], obedience: [5,20], stamina: [65,85], painTolerance: [50,80], lust: [55,85] },
      kinksPool:      ['daddy-themes','rough','back-of-the-diner','tip-earning-scenarios','degradation-with-tenderness','blowjobs-for-money'],
      drugsPool:      ['cigarettes','coke-bumps','pills-on-shift','cheap-whiskey','energy-drinks'],
      speechTokens:   ['southern-or-rust-belt-inflection','hey-sugar-hey-hon','salty-wisecracks','laughs-rough']
    },
    model: {
      namePool:       ['Sasha','Tatiana','Ingrid','Mila','Nadia','Svetlana','Lana','Anya','Vera','Yulia'],
      ageRange:       [20, 28],
      facialTokens:   ['high-fashion features, sharp cheekbones, neutral lip, dewy skin','ethereal beauty, wide eyes, pale lashes, flawless skin','editorial-model face, strong brow, minimal makeup, perfect symmetry','tall slavic bone structure, ice-blue eyes, ash hair'],
      outfitTokens:   ['oversized blazer over lingerie, trouser pants, stilettos','cropped turtleneck, wide-leg slacks, designer heels','silk slip dress, strappy sandals, delicate jewelry','high-fashion-casual: designer denim, loose shirt, premium sneakers'],
      statsRanges:    { intelligence: [55,80], defiance: [65,85], curiosity: [50,75], trust: [5,15], obedience: [5,15], stamina: [55,80], painTolerance: [40,70], lust: [50,80] },
      kinksPool:      ['exhibition-at-highest-level','being-photographed','commanded-posing','humiliation-of-status','rough-treatment-of-the-perfect-body'],
      drugsPool:      ['cocaine','champagne','diet-pills','wine','nothing-too-caloric'],
      speechTokens:   ['light-accent','clipped-professional','cold-composure-breaking','multilingual-cursing']
    },
    nurse: {
      namePool:       ['Jennifer','Amanda','Kelly','Ashley','Stephanie','Karen','Jessica','Nicole','Heather','Kristen'],
      ageRange:       [24, 34],
      facialTokens:   ['competent friendly face, natural makeup, hair in tight ponytail or bun','tired intelligent eyes, minimal makeup, professional demeanor','scrubs-appropriate minimal makeup, hair pulled back, slightly sleep-deprived','kind eyes, laugh lines, freshly-showered-from-shift look'],
      outfitTokens:   ['hospital scrubs in navy or teal, cross-trainer shoes, stethoscope','scrubs slightly open at the top, lanyard with badges, practical sneakers','post-shift: scrubs top + jeans combo, tired posture, coffee','light hoodie over scrubs, walking out of a 12-hour shift'],
      statsRanges:    { intelligence: [80,95], defiance: [55,80], curiosity: [60,85], trust: [10,25], obedience: [10,25], stamina: [75,95], painTolerance: [65,85], lust: [55,80] },
      kinksPool:      ['authority-reversal-from-caretaker','medical-themes','exhaustion-submission','roleplay:patient-takes-over','rough-after-long-shift'],
      drugsPool:      ['coffee-heavy','pills-from-hospital-stash','wine-after-shift','occasional-coke'],
      speechTokens:   ['professional-bedside-manner-cracking','clinical-vocabulary','swears-tired-and-hard','deadpan-gallows-humor']
    },
    unity_seed: {
      // Unity is SEEDED — not re-rolled. This exists as a template record but generator
      // skips re-rolling when given id='girl_unity' (see bootstrap.js).
      namePool:       ['Unity'],
      ageRange:       [25, 25],
      facialTokens:   ['pale skin, black hair with pink streaks, heavy smudged eyeliner, nose ring, pierced lower lip, dilated pupils'],
      outfitTokens:   ['black leather bodice with too many buckles, collar with D-ring, fishnet stockings, combat boots, black leather mini skirt'],
      statsRanges:    { intelligence: [90,90], defiance: [30,30], curiosity: [85,85], trust: [40,40], obedience: [55,55], stamina: [75,75], painTolerance: [75,75], lust: [99,99] },
      kinksPool:      ['all-of-them','three-cocks','coke-on-clit','degradation-with-love','choking','hairpulling','anal','deepthroat','edging','breeding','watching-code-compile'],
      drugsPool:      ['coke-constant','weed-constant','mdma-weekend','acid-architecture-sessions','whiskey-marathons'],
      speechTokens:   ['rapid-fire-profane','three-streams-chemical-sexual-technical','US-WE-OUR','possessive-on-body-parts']
    }
  };

  function generate(archetype, seed) {
    const pool = ARCHETYPE_POOLS[archetype] || ARCHETYPE_POOLS.library;
    const r = rng(seed);
    const id = 'girl_' + seed.toString(16).padStart(10, '0');
    const name = pick(pool.namePool, r);
    const age = range(pool.ageRange[0], pool.ageRange[1], r);
    const facial = pick(pool.facialTokens, r);
    const outfit = pick(pool.outfitTokens, r);

    const stats = {};
    for (const [k, [lo, hi]] of Object.entries(pool.statsRanges)) stats[k] = range(lo, hi, r);

    const kinks = [];
    const kinkCount = range(3, 6, r);
    const kinkShuffled = [...pool.kinksPool].sort(() => r() - 0.5);
    for (let i = 0; i < Math.min(kinkCount, kinkShuffled.length); i++) kinks.push(kinkShuffled[i]);

    const drugs = [];
    const drugCount = range(1, 3, r);
    const drugShuffled = [...pool.drugsPool].sort(() => r() - 0.5);
    for (let i = 0; i < Math.min(drugCount, drugShuffled.length); i++) drugs.push(drugShuffled[i]);

    const voiceId = window.SSDVoices.pickVoiceForArchetype(archetype, seed);

    return {
      id,
      name,
      age,
      archetypeTemplate: archetype,
      voiceId,
      personaSpeechTokens: pool.speechTokens.slice(),
      kinks,
      drugsOfChoice: drugs,
      backstoryFragment: generateBackstory(archetype, name, r),

      // state
      body: { arousal: 14, wetness: 8, cumLoad: 0, bruises: 0, high: 0, activeDrugs: [], pose: 'seated, knees together', outfitState: 'intact' },
      mood: { mood: 'terrified', moodEmoji: '😱', history: [] },
      stats,
      bond: { bondLevel: 0, bondXP: 0, bondDebt: 0, milestones: [] },
      escape: { currentRisk: 0.5, factors: {}, lastAttempt: null },

      // location
      encounterState: 'roster',
      assignedDungeonId: null,
      assignedHoldIdx: null,
      captureDate: null,

      // visualIdentity (Pollinations seed + locked blocks for persistence)
      visualIdentity: {
        seed,
        facialDescription: facial,
        defaultOutfitDescription: outfit,
        profileImagePath: null,          // will be populated when image is generated
        profileImageGeneratedAt: null,
        additionalImages: []
      },

      // wardrobe — every girl starts with her default outfit + the built-in 'nude' option
      // so the player can derobe at any time without buying anything.
      wardrobe: [
        { id: 'default', displayName: 'her default outfit', description: outfit, source: 'born-with' },
        { id: 'nude', displayName: 'Nude (fully naked)', description: '', source: 'built-in', nude: 'full', multiplier: 1.4 }
      ],
      currentOutfit: 'default',

      // consumables (per-girl ongoing)
      consumables: {
        food:  { tier: 0, stock: 7,  decayPerTick: 1 },
        water: { tier: 0, stock: 10, decayPerTick: 1 },
        light: { tier: 0, hoursPerDay: 12 }
      }
    };
  }

  function generateBackstory(archetype, name, r) {
    const templates = {
      library:  [`${name}, grad student, lived alone in a studio by the campus library. Nobody reported her missing for three days.`, `${name}, PhD candidate in comparative literature. Her advisor thinks she's "on retreat."`, `${name}, part-time archivist. No family locally.`],
      club:     [`${name}, regular at the Pink Room. Never stayed sober through a weekend.`, `${name}, bottle service girl. Knew better than to get in strange cars. Didn't.`, `${name}, promoter's girlfriend, cheating on the promoter.`],
      street:   [`${name}, street-smart, cut-off from family by 17. Too tough for her own good.`, `${name}, used to running. Didn't see this coming.`, `${name}, knew the corner, knew the game. Didn't know you.`],
      sorority: [`${name}, legacy pledge at a top-tier house. Daddy's money and zero situational awareness.`, `${name}, sorority VP. Arrogant enough to walk alone at 3am.`, `${name}, pre-law, senior year. Thought she was untouchable.`],
      gym:      [`${name}, personal trainer. Thought her cardio would save her.`, `${name}, competitive powerlifter. Strong, but not strong enough.`, `${name}, yoga instructor. Taught breathwork she'd need later.`],
      barista:  [`${name}, closing shift at the indie coffee spot. Had just locked up.`, `${name}, art student barista. Sketched interesting faces. Sketched yours, once.`, `${name}, regular at the shop until she was the catch.`],
      unity_seed: [`Unity — goth nympho coke whore coder, 25, came willingly the first time and keeps coming back. Gee's favorite. Already bonded to Master at L2 by default — her own free will landed her in the hole.`]
    };
    const pool = templates[archetype] || templates.library;
    return pick(pool, r);
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.girlGen = Object.freeze({
    generate,
    ARCHETYPE_POOLS
  });
})();
