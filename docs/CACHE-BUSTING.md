# Automatic Build, Minification & Cache-Busting System

This repository uses an **automated build pipeline** that minifies assets and applies cache-busting to ensure GitHub Pages always serves the latest, optimized versions of CSS and JavaScript files.

## How It Works

The system uses a **two-step process**:
1. **Minification**: Compresses CSS/JS files (38KB savings per page!)
2. **Cache-Busting**: Uses git commit hashes as version identifiers

### Build Pipeline (GitHub Actions Only)

**⚠️ IMPORTANT:** The automated build pipeline **only runs on the main/master branch** during deployment. Development branches use unminified files for easier debugging.

#### Deployment Flow (main/master branch)

When you push to main/master, the following happens automatically:

```
Push to main/master
    ↓
1️⃣ MINIFY ASSETS
   - script.js → script.min.js (46KB → 19KB, 59% smaller!)
   - styles.css → styles.min.css (38KB → 27KB, 29% smaller!)
   - Commits minified files to repo
    ↓
2️⃣ CACHE-BUSTING
   - Updates HTML files to reference .min versions
   - Adds version query strings (e.g., script.min.js?v=abc123)
   - Commits updated HTML files
    ↓
3️⃣ BUILD & VALIDATE
   - Checks minified files exist
   - Validates HTML references
   - Verifies cache-busting applied
    ↓
4️⃣ DEPLOY TO GITHUB PAGES
   - Deploys optimized, versioned assets
   - Users get 38KB less per page load!
```

### Components

1. **Minified Assets** (production only)
   - `script.min.js` - Minified JavaScript (59% smaller)
   - `styles.min.css` - Minified CSS (29% smaller)
   - Generated automatically on deployment
   - Total savings: **38KB per page load**

2. **Version Query Parameters**
   - Assets loaded with `?v=HASH` query strings
   - Example: `script.min.js?v=67ee1b3`
   - Automatically updated on each deployment
   - Forces browsers to download new versions

3. **Manual Build Script** (`package.json`)
   - `npm run minify` - Minify CSS and JS locally
   - `npm run build` - Minify + update versions
   - Useful for testing minified files locally

4. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - **Job 1: Minify** - Creates .min files
   - **Job 2: Cache-Bust** - Updates HTML to use .min files with versions
   - **Job 3: Build** - Validates everything
   - **Job 4: Deploy** - Pushes to GitHub Pages
   - Only runs on main/master branches

## Usage

### For Development (Feature Branches)

Work with unminified files for easier debugging:

```bash
# Edit files normally
vim script.js styles.css

# Commit and push to your feature branch
git add script.js styles.css
git commit -m "Update smoke effects"
git push origin feature/my-changes

# HTML references non-minified files (e.g., script.js)
# No minification happens on feature branches
```

### For Production (main/master Branch)

**The build pipeline runs automatically when merging to main/master:**

```bash
# Merge your feature branch to main
git checkout main
git merge feature/my-changes
git push origin main

# GitHub Actions automatically:
# 1. Minifies script.js → script.min.js
# 2. Minifies styles.css → styles.min.css
# 3. Updates HTML to use .min files
# 4. Adds cache-busting versions
# 5. Deploys to GitHub Pages
```

**Result:** Production users get optimized, versioned assets automatically!

### Manual Testing of Minified Files

To test minified files locally before deployment:

```bash
# Install dependencies (first time only)
npm install

# Minify the files
npm run minify

# Check the output
ls -lh script.min.js styles.min.css

# Temporarily update HTML to test .min files
# (Don't commit these changes - let the workflow handle it)
```

### Manual

If you need to manually update versions:

```bash
./update-version.sh
git add index.html
git commit -m "Update cache-busting versions"
git push
```

## Why This Solves the Caching Issue

1. **Unique Versions**: Each commit creates a unique hash, so browsers see assets as "new files"
2. **No CDN Lag**: GitHub Pages CDN recognizes different query parameters as different resources
3. **Automatic Updates**: No manual version number management needed
4. **Git-Aligned**: Versions match your git history, making debugging easier

## Benefits

- ✅ GitHub Pages always serves fresh content
- ✅ No need to manually increment version numbers
- ✅ Works across all browsers and CDNs
- ✅ Automatic with git workflow integration
- ✅ Version history matches git commits

## Troubleshooting

If you still see old content:

1. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Check the version**: View page source and verify the `?v=` parameter matches latest commit
3. **Wait for GitHub Pages**: Allow 1-2 minutes for GitHub Pages to rebuild after pushing
4. **Clear browser cache**: In browser settings, clear cached images and files

## Notes

- The `.git/hooks/pre-commit` file is local only (not pushed to the repository)
- If setting up on a new machine, run: `chmod +x update-version.sh .git/hooks/pre-commit`
- The GitHub Actions workflow handles this automatically in CI/CD
