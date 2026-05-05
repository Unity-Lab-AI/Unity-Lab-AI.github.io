// APPS — data
// Codex 04. The 8 free AI applications. Lifted from apps/index.html.

const APPS_DATA = {
  meta: [
    { dt: 'CODEX', dd: '04 / APPS' },
    { dt: 'COUNT', dd: '8 applications' },
    { dt: 'COST', dd: 'free \u2014 no signup' },
    { dt: 'POWERED BY', dd: 'Pollinations' },
  ],

  header: {
    kicker: 'COLLECTION \u00b7 OPEN ACCESS',
    title: 'Free AI\nApps.',
    lede: 'Eight experimental applications \u2014 chatbots, generators, voice, screensavers. All free, no registration, no API key. Launch any of them in a click.',
  },

  // Apps grid. Icon = Sigil name (existing) or null to use a Font Awesome class.
  // We'll render glyphs with available Sigils; fallback to a roman numeral mark.
  apps: [
    {
      slug: 'unity-chat',
      num: 'I',
      icon: 'Unity',
      title: 'Unity Chat',
      tag: 'flagship chat',
      lede: 'Advanced chat interface with code panel, image generation, and multi-model support. Syntax highlighting and voice capabilities included.',
      tags: ['Chat', 'Code', 'Image', 'Voice'],
      cta: { label: 'Launch app', href: './apps/unityDemo/unity.html' },
    },
    {
      slug: 'text-chat',
      num: 'II',
      icon: 'Wringer',
      title: 'Text Chat',
      tag: 'simple chat',
      lede: 'A clean, text-only chat with custom prompt support and persona selection. Same Pollinations pipe, none of the chrome.',
      tags: ['Chat', 'Personas'],
      cta: { label: 'Launch app', href: './apps/textDemo/text.html' },
    },
    {
      slug: 'persona-chat',
      num: 'III',
      icon: 'Robot',
      title: 'Persona Chat',
      tag: 'characters',
      lede: 'Switch between AI personalities and character modes. Each persona ships with its own voice, behavior, and posture.',
      tags: ['Personas', 'Character AI'],
      cta: { label: 'Launch app', href: './apps/personaDemo/persona.html' },
    },
    {
      slug: 'talking-with-unity',
      num: 'IV',
      icon: 'Flask',
      title: 'Talking With Unity',
      tag: 'voice conversation',
      lede: 'Interactive voice conversation platform featuring Unity. Speak, listen, interrupt \u2014 a more natural format for the persona.',
      tags: ['Voice', 'Real-time'],
      cta: { label: 'Launch app', href: './apps/talkingWithUnity/index.html' },
    },
    {
      slug: 'helper-interface',
      num: 'V',
      icon: 'Stack',
      title: 'Helper Interface',
      tag: 'utility console',
      lede: 'Comprehensive AI assistant with tools and utilities for various tasks and queries. The kitchen-sink interface.',
      tags: ['Tools', 'Utilities'],
      cta: { label: 'Launch app', href: './apps/helperInterfaceDemo/helperInterface.html' },
    },
    {
      slug: 'ai-slideshow',
      num: 'VI',
      icon: 'Seal',
      title: 'AI Slideshow',
      tag: 'image generation',
      lede: 'Dynamic AI-generated image slideshow. Watch artificial intelligence build stunning visuals in real time.',
      tags: ['Image', 'Generation'],
      cta: { label: 'Launch app', href: './apps/slideshowDemo/slideshow.html' },
    },
    {
      slug: 'ai-screensaver',
      num: 'VII',
      icon: 'Node',
      title: 'AI Screensaver',
      tag: 'ambient art',
      lede: 'Mesmerizing AI-powered screensaver with customizable prompts and transitions. Turn an idle screen into a working piece.',
      tags: ['Image', 'Ambient'],
      cta: { label: 'Launch app', href: './apps/screensaverDemo/screensaver.html' },
    },
    {
      slug: 'classic-unity',
      num: 'VIII',
      icon: 'Shield',
      title: 'Classic Unity',
      tag: 'archive',
      lede: 'The previous version of the Unity AI Lab interface. Full-featured chat with sessions, themes, and advanced settings. Kept around for the long-time users.',
      tags: ['Archive', 'Legacy'],
      cta: { label: 'Launch app', href: './apps/oldSiteProject/index.html' },
    },
  ],

  cta: {
    title: 'Building something? We can help.',
    lede: 'These are the open demos. If you need a private deployment \u2014 your prompts, your data, your hardware \u2014 we build those too.',
    primary: { label: 'See services', href: './services' },
    secondary: { label: 'Get in touch', href: './contact' },
  },
};

window.APPS_DATA = APPS_DATA;
