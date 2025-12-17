#!/bin/bash
# Automatic cache-busting script
# Updates version numbers in index.html based on git commit hash

# Get the short git commit hash
VERSION=$(git rev-parse --short HEAD)

# If git command fails (not in a git repo), use timestamp
if [ $? -ne 0 ]; then
    VERSION=$(date +%s)
fi

echo "Updating asset versions to: $VERSION"

# Update index.html with new version numbers
sed -i.bak "s/styles\.css?v=[^\"']*/styles.css?v=$VERSION/g" index.html
sed -i.bak "s/script\.js?v=[^\"']*/script.js?v=$VERSION/g" index.html

# Remove backup file
rm -f index.html.bak

echo "✓ Asset versions updated to $VERSION"
echo "Files will now be cache-busted with the current commit hash"
