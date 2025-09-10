# PWA Update Workflow

## The Problem
PWAs (Progressive Web Apps) cache content aggressively. When you make changes to your app, installed PWAs won't automatically show the new version - they'll keep showing the old cached version until manually updated.

## The Solution
We've built an automatic update system that notifies users when new versions are available.

---

## 🔄 **Development Workflow**

### Every time you make changes to your app:

#### Option 1: Manual Update (Recommended)
```bash
# 1. Update the PWA cache version
npm run update-pwa

# 2. Commit and push your changes
git add .
git commit -m "Your commit message"
git push
```

#### Option 2: Automated (One Command)
```bash
# This does both steps above automatically
npm run push
```

---

## 🚀 **How Users Get Updates**

### For Installed PWA Users:
1. **Automatic Check**: Service worker checks for updates every 30 seconds
2. **Update Notification**: Blue notification appears: "New version available!"
3. **User Choice**: Click "Update Now" or "Later"  
4. **Auto Refresh**: App refreshes with latest version

### For Browser Users:
- Updates happen automatically on page refresh
- No special action needed

---

## 🛠 **Technical Details**

### What the scripts do:

**`npm run update-pwa`**:
- Reads `public/sw.js`
- Finds current cache version (e.g., `poker-notes-v3`)
- Increments to next version (e.g., `poker-notes-v4`)
- Updates the file automatically

**`npm run push`**:
- Runs `update-pwa`
- Stages all changes with `git add .`
- Commits with default message
- Pushes to remote repository

### File Structure:
```
scripts/
  └── update-sw-version.js    # Auto-increment cache version
public/
  └── sw.js                   # Service worker with cache version
src/components/
  └── ServiceWorkerRegistration.tsx  # Update notification UI
```

---

## ✅ **Testing the Update Flow**

1. **Make code changes**
2. **Run**: `npm run update-pwa`
3. **Open your installed PWA** (Chrome app)
4. **Wait 30 seconds** for update check
5. **See blue notification** appear
6. **Click "Update Now"**
7. **Verify new changes** are visible

---

## 🎯 **Best Practices**

- **Always increment version** before pushing changes
- **Test on installed PWA** not just browser
- **Use meaningful commit messages** since `npm run push` commits automatically
- **Warn users** about updates in your release notes

---

## 🐛 **Troubleshooting**

**PWA not updating?**
- Check if service worker registered: DevTools → Application → Service Workers
- Verify version incremented: Look for "v4, v5..." in console
- Force refresh: DevTools → Application → Storage → Clear Storage

**Script not working?**
- Ensure Node.js can run the script: `node scripts/update-sw-version.js`
- Check file permissions: `chmod +x scripts/update-sw-version.js`

**Notification not appearing?**
- Service worker needs 30 seconds to check for updates
- Close/reopen PWA to trigger immediate check
- Check console for service worker logs