#!/bin/bash
set -e

# This runs after EAS builds the .ipa (on the build server)
# But since we can't easily patch inside EAS worker, we'll patch the archive locally if needed.
# For full auto: use config plugin below. This is fallback.

echo "Patching Info.plists to remove CFBundleSupportedPlatforms from simulator bundles"

cd "$EAS_BUILD_WORKING_DIR" || exit 1  # EAS sets this, or adjust

# Unzip ipa if needed, but better: patch during archive phase if possible.
# For simplicity, if you download .ipa, unzip, patch, re-zip → but for auto-submit, use plugin.