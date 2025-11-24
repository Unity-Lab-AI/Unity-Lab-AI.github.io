#!/bin/bash
# Script to update all legacy apps with Unity AI Lab navigation

# Apps to update (relative paths from /apps directory)
APPS=(
    "personaDemo/persona.html"
    "helperInterfaceDemo/helperInterface.html"
    "slideshowDemo/slideshow.html"
    "screensaverDemo/screensaver.html"
    "talkingWithUnity/index.html"
    "talkingWithUnity/indexAI.html"
    "oldSiteProject/index.html"
)

cd /home/user/sitetest0/apps

for app in "${APPS[@]}"; do
    echo "Processing $app..."

    if [ ! -f "$app" ]; then
        echo "  File not found: $app"
        continue
    fi

    # Add shared-theme.css if not already present
    if ! grep -q "shared-theme.css" "$app"; then
        # Find the head closing tag and insert before it
        sed -i '/<\/head>/i\  <link rel="stylesheet" href="../shared-theme.css">' "$app"
        echo "  Added shared-theme.css"
    fi

    # Hide home link by updating CSS
    if grep -q "\.home-link {" "$app"; then
        sed -i '/\.home-link {/,/}/c\    .home-link {\n      display: none !important; /* Hidden - using Unity nav instead */\n    }' "$app"
        echo "  Updated home-link CSS"
    fi

    # Add shared-nav.js before closing body tag if not already present
    if ! grep -q "shared-nav.js" "$app"; then
        sed -i '/<\/body>/i\  <!-- Unity AI Lab Navigation -->\n  <script src="../shared-nav.js"><\/script>\n' "$app"
        echo "  Added shared-nav.js"
    fi

    echo "  Completed $app"
done

echo "All apps updated successfully!"
