# TTS Bug Hunt - 10 Agent Investigation

## Problem Summary
- Welcome message TTS not playing after age verification
- Voice playback toggle enabled but AI response TTS not playing
- Multiple attempts to fix have failed (400, 429 errors, no audio)

## Agent Findings

### Agent 1: Working persona.js TTS
**WORKING PATTERN FOUND:**
- **Endpoint:** POST to `PollinationsAPI.TEXT_API` (`gen.pollinations.ai/v1/chat/completions`)
- **Method:** POST (not GET!)
- **Body:**
```javascript
{
  model: 'openai',           // NOT 'openai-audio'
  modalities: ['text', 'audio'],  // CRITICAL!
  audio: { voice: 'nova', format: 'wav' },
  messages: [{ role: 'user', content: 'Please read this text aloud...' }]
}
```
- **Response:** Base64 audio at `data.choices[0].message.audio.data`
- **Playback:** `new Audio('data:audio/wav;base64,' + audioData)`

### Agent 2: Broken voice.js
**BROKEN PATTERN:**
- Uses GET to `text.pollinations.ai/{encodedText}?model=openai-audio`
- URL length limits cause 400 errors with long text
- No modalities specified
- Expects direct audio stream (wrong)
- No retry logic for 429

### Agent 3: Broken age-verification.js
**SAME BROKEN PATTERN + EXTRA ISSUE:**
- setTimeout breaks browser autoplay policy
- User gesture context lost before audio.play()

### Agent 4: API Documentation
**TWO VALID METHODS:**
1. GET `text.pollinations.ai/{text}?model=openai-audio&voice={voice}` - SHORT text only, returns MP3 stream
2. POST `gen.pollinations.ai/v1/chat/completions` with modalities - RECOMMENDED for longer text

### Agent 5: Audio Models
- `openai-audio` for GET endpoint
- `openai` with `modalities: ['text', 'audio']` for POST endpoint
- Voices: alloy, echo, fable, onyx, nova, shimmer

### Agent 6: Critical Differences
| Aspect | WORKING | BROKEN |
|--------|---------|--------|
| Method | POST | GET |
| Endpoint | /v1/chat/completions | text.pollinations.ai/{text} |
| Model | 'openai' | 'openai-audio' |
| Modalities | ['text', 'audio'] | Not specified |
| Response | Base64 JSON | Expects stream |

### Agent 7: CORS/Auth Issues
**CRITICAL FINDING:**
- `text.pollinations.ai` uses `referrer=UA-73J7ItT-ws` NOT `key=`
- `gen.pollinations.ai` uses `key=pk_...`
- Broken code uses wrong auth for wrong endpoint!

### Agent 8: PolliLibJS
- Has TTS class but it's also broken (wrong endpoint)
- Don't use the library TTS, use the POST pattern from persona.js

### Agent 9: Error Analysis
- **400 errors:** Wrong endpoint, missing modalities
- **429 errors:** Rate limit (3 req/burst, 1/15sec refill for pk_ keys)
- Need retry with exponential backoff

### Agent 10: unity.js/helperInterface.js
- Use browser `speechSynthesis` API (not Pollinations!)
- Not applicable for this fix

## ROOT CAUSE ANALYSIS

**THE BUG:** voice.js and age-verification.js use GET requests to `text.pollinations.ai/{text}` which:
1. Has URL length limits (400 error on long text)
2. Uses wrong auth method (`key=` vs `referrer=`)
3. Returns nothing usable for Audio element

**THE FIX:** Use POST to `gen.pollinations.ai/v1/chat/completions` with:
- `model: 'openai'`
- `modalities: ['text', 'audio']`
- `audio: { voice, format: 'wav' }`
- Extract base64 from `response.choices[0].message.audio.data`
- Play with `new Audio('data:audio/wav;base64,' + data)`

## Fix Plan
1. ✅ Rewrite voice.js playNextVoiceChunk() to use POST pattern from persona.js
2. ✅ Rewrite age-verification.js playWelcomeMessage() same way
3. ✅ Add retry logic for 429 errors (exponential backoff in voice.js)
4. ⏳ Test both TTS systems

## Implementation Summary
- **voice.js**: Changed `playNextVoiceChunk()` to POST to `text.pollinations.ai/openai` with `model: 'openai'`, `modalities: ['text', 'audio']`, `audio: { voice, format: 'wav' }`. Extracts base64 from `choices[0].message.audio.data`. Added retry logic for 429 errors.
- **age-verification.js**: Changed `playWelcomeMessage()` same pattern.
- **index.html**: Cache version bumped to v=8
