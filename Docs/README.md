# Docs - Pollinations.AI API Documentation

This directory contains comprehensive documentation for the Pollinations.AI API, which powers the Unity AI Lab libraries and tools.

## Contents

### Pollinations_API_Documentation.md

Complete API reference documentation for Pollinations.AI, including:

- **API Endpoints**: Text generation, image generation, speech synthesis, and more
- **Authentication** *(legacy — see note below)*: Referrer-based and bearer token authentication methods as originally documented by Pollinations
- **Rate Limits**: Access tiers and rate limit specifications
- **Request/Response Formats**: Detailed parameter documentation

> **⚠ 2026-05 update:** This site no longer authenticates against `text.pollinations.ai` / `image.pollinations.ai` directly. All requests are routed through the unityailab.com Cloudflare Worker proxy at `https://websiteunityailab.gfourteen7525.workers.dev`, which holds an `sk_*` Pollinations token server-side and forwards to `gen.pollinations.ai` (the migrated API surface). The doc body preserves the upstream Pollinations reference verbatim — useful as the underlying API spec — but `?referrer=...` query params are deprecated; new code should NOT add them. See [PolliLibJS/README.md](../PolliLibJS/README.md) and [PolliLibJS/pollylib.js](../PolliLibJS/pollylib.js) for the proxy URL and route map.
- **Model Information**: Available models and their capabilities
- **Code Examples**: Usage examples in multiple languages

## Using the Documentation

The documentation in this directory is referenced by both library implementations:

- **PolliLibJS**: JavaScript/Node.js library → See [../PolliLibJS/README.md](../PolliLibJS/README.md)
- **PolliLibPy**: Python library → See [../PolliLibPy/README.md](../PolliLibPy/README.md)

## Quick Links

- [Main Repository README](../README.md)
- [Pollinations.AI Official Documentation](https://github.com/pollinations/pollinations)
- [Pollinations.AI Developer Console (enter.pollinations.ai)](https://enter.pollinations.ai/) — replaced the retired legacy `auth.pollinations.ai` portal in 2026

## Purpose

This documentation serves as:

1. A reference guide for developers using the Unity AI Lab libraries
2. Technical specifications for API implementation
3. A resource for understanding Pollinations.AI capabilities and limitations

---

Part of the Unity AI Lab project - Testing and demonstrating the latest Pollinations.AI integration.
