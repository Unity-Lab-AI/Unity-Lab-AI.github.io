# n8n Webhook Integration Documentation

## Overview

This document describes the n8n webhook integration used for tracking unique visitors to the Unity AI Lab website. The webhook provides visitor counting functionality with page-specific tracking.

## Webhook Endpoint

**URL**: `https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID`

## API Reference

### POST - Register Visitor

Registers a unique visitor for a specific page and returns the updated count.

**Request**:
```bash
POST https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID
Content-Type: application/json

{
  "page": "demo",
  "uid": "ud-xx-xxxxxxxxx-xxxxxxxxx-xxxxxxxxxx"
}
```

**Response** (New User):
```json
{
  "uids": "15"
}
```

**Response** (Existing User):
```json
{
  "server": "User Exists"
}
```

**Status Codes**:
- `200 OK` - Request successful (both new and existing users)

### GET - Retrieve Visitor Count

Retrieves the visitor count for a specific page using a valid UID.

**Request**:
```bash
GET https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID?page=demo&uid=ud-xx-xxxxxxxxx-xxxxxxxxx-xxxxxxxxxx
```

**Response** (Valid UID):
```json
{
  "uids": "15"
}
```

**Response** (Invalid UID):
```json
{
  "server": "No Authorization"
}
```

**Status Codes**:
- `200 OK` - Valid UID, count returned
- `403 Forbidden` - Invalid or nonexistent UID

## UID Format

User IDs follow a specific 36-character format:

**Format**: `ud-XX-XXXXXXXXX-XXXXXXXXX-XXXXXXXXXX`

- **Prefix**: `ud-` (3 characters)
- **Section 1**: 2 random characters
- **Section 2**: 9 random characters
- **Section 3**: 9 random characters
- **Section 4**: 10 random characters
- **Separators**: `-` between sections
- **Character Set**: Lowercase alphanumeric (a-z, 0-9)
- **Total Length**: 36 characters

**Example**: `ud-r0-jhqq9ji5o-20d6u8cle-7kv86f4r2p`

### Security Requirements

⚠️ **IMPORTANT**: UIDs must be generated using cryptographically secure random number generation, not pseudo-random generators.

**JavaScript**:
```javascript
// Use crypto.getRandomValues() for secure random generation
const array = new Uint8Array(1);
crypto.getRandomValues(array);
```

**Python**:
```python
# Use secrets module for cryptographically secure random
import secrets
secrets.choice(chars)
```

## Special UID: Anonymous

The special UID `"anonymous"` can be used to retrieve visitor counts without being tracked as a specific user.

**Use Cases**:
- Displaying visitor counts to non-registered users
- Public statistics pages
- Before age verification is completed

**Example**:
```bash
GET https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID?page=demo&uid=anonymous
```

## Webhook Behavior

### User Tracking

- **Global User Registry**: UIDs are tracked globally across all pages
- **Page-Specific Counters**: Each page maintains its own visitor count
- **No Duplicate Counting**: Same UID cannot increment the same page counter twice

### Page Counters

Each page name creates an independent counter:

- `demo` - Demo page visitors
- `landing` - Landing page visitors
- `ai` - AI page visitors
- etc.

**Example Flow**:

1. User `ud-abc-...` visits `demo` page → `demo` counter = 1
2. User `ud-abc-...` visits `demo` page again → Counter unchanged, "User Exists"
3. User `ud-xyz-...` visits `demo` page → `demo` counter = 2
4. User `ud-abc-...` visits `landing` page → Can't increment, user exists globally

### Counter Behavior

- ✅ New UID on new page → Creates/increments page counter
- ✅ Existing UID on same page → Returns "User Exists", no increment
- ✅ Existing UID on different page → Returns "User Exists", no increment (users are global)
- ✅ Anonymous GET → Returns current count, no tracking

## Testing Results

### Test Suite Summary

Comprehensive testing was performed to verify all webhook behaviors:

**Tests Performed**:
1. ✅ Create first user on demo page
2. ✅ Duplicate user detection ("User Exists")
3. ✅ Multiple user creation (10 users)
4. ✅ GET count with valid UID
5. ✅ GET count with anonymous UID
6. ✅ GET count with invalid UID (403 Forbidden)
7. ✅ Create users on different page (landing)
8. ✅ Verify page-specific counters
9. ✅ Cross-page counter isolation
10. ✅ Anonymous POST handling

### Key Findings

- **Page Counters are Independent**: Each page maintains separate visitor counts
- **Users Tracked Globally**: Once a UID is registered, it exists across all pages
- **Anonymous Access Works**: The `anonymous` UID successfully retrieves counts
- **Security Working**: Invalid UIDs properly rejected with 403 Forbidden
- **Response Format Consistent**: Always returns `{"uids": "count"}` for successful operations

### Test Data

**Demo Page**: Created 10 unique users, counter incremented correctly (1→10)
**Landing Page**: Created 3 unique users, counter started at 1 and incremented (1→3)
**Anonymous Access**: Successfully retrieved counts without authentication

## Implementation Guide

### 1. UID Generation

Generate UID after successful age verification:

```javascript
function generateSecureUID() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    function secureRandom(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }
        return result;
    }

    return `ud-${secureRandom(2)}-${secureRandom(9)}-${secureRandom(9)}-${secureRandom(10)}`;
}
```

### 2. Cookie Storage

Store UID in cookie after age verification:

```javascript
// Set cookie (expires in 1 year)
document.cookie = `unityUID=${uid}; max-age=31536000; path=/; SameSite=Lax`;

// Get cookie
function getUID() {
    const match = document.cookie.match(/unityUID=([^;]+)/);
    return match ? match[1] : null;
}
```

### 3. Track Visitor (POST)

Send POST request when user visits tracked page:

```javascript
async function trackVisitor(page) {
    const uid = getUID();
    if (!uid) return; // No UID yet

    try {
        const response = await fetch('https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page, uid })
        });

        const data = await response.json();
        return data.uids; // Returns count or "User Exists"
    } catch (error) {
        console.error('Tracking error:', error);
    }
}
```

### 4. Display Count (GET)

Retrieve and display visitor count:

```javascript
async function getVisitorCount(page) {
    try {
        const response = await fetch(
            `https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID?page=${page}&uid=anonymous`
        );

        if (response.ok) {
            const data = await response.json();
            return data.uids; // Returns count as string
        }
    } catch (error) {
        console.error('Count retrieval error:', error);
    }
    return null;
}

// Display count
getVisitorCount('demo').then(count => {
    if (count) {
        document.getElementById('visitor-count').textContent = count;
    }
});
```

## Integration Points

### Demo Page (`/ai/demo/`)

**Purpose**: Track unique visitors to the demo page

**Implementation**:
- POST UID to webhook on page load (if UID exists in cookie)
- Page parameter: `"demo"`
- Silent tracking (no UI feedback required)

### AI Landing Page (`/ai/`)

**Purpose**: Display demo page visitor count

**Implementation**:
- GET request using `"anonymous"` UID
- Display count prominently on page
- Optional: Auto-refresh count periodically

### Age Verification

**Purpose**: Generate and store UID after verification

**Implementation**:
- Generate secure UID on successful verification
- Store in cookie with 1-year expiration
- Cookie available site-wide (path=/)

## Security Considerations

1. **Cryptographic Random Generation**: Always use `crypto.getRandomValues()` for UID generation
2. **Cookie Security**: Use `SameSite=Lax` to prevent CSRF attacks
3. **HTTPS Only**: All webhook requests must use HTTPS
4. **No PII**: UIDs are anonymous and contain no personally identifiable information
5. **Rate Limiting**: Consider implementing client-side throttling to prevent spam

## Error Handling

```javascript
async function safeTrackVisitor(page) {
    try {
        const uid = getUID();
        if (!uid) return null;

        const response = await fetch('https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page, uid }),
            signal: AbortSignal.timeout(5000) // 5s timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Tracking timeout');
        } else {
            console.error('Tracking failed:', error);
        }
        return null;
    }
}
```

## Future Enhancements

- [ ] Add analytics dashboard
- [ ] Implement page visit timestamps
- [ ] Track user journey across pages
- [ ] Add geographical visitor data
- [ ] Implement real-time visitor count updates
- [ ] Add visitor count trends/graphs

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Maintained by**: Unity AI Lab Team
