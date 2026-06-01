#!/usr/bin/env bash
# Run Gradle for apps/mobile/android using a JDK that works with React Native + CMake.
#
# JDK 24+ often fails in :react-native-worklets:configureCMake* with:
#   "WARNING: A restricted method in java.lang.System has been called"
# Use JDK 17 or 21 (Android Studio’s embedded JDK, or Temurin).
#
# Usage (from repo root):
#   ./apps/mobile/scripts/android-gradle.sh assembleRelease
#   ./apps/mobile/scripts/android-gradle.sh --stop-daemon

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="${ROOT}/android"

pick_java_home() {
  if [ -n "${JAVA_HOME:-}" ] && [ -x "${JAVA_HOME}/bin/java" ]; then
    local v
    v="$("${JAVA_HOME}/bin/java" -version 2>&1 | head -1)"
    # Prefer 17–23 when JAVA_HOME is already set and looks sane
    case "$v" in
      *"17."*|*"18."*|*"19."*|*"20."*|*"21."*|*"22."*|*"23."*) printf '%s' "$JAVA_HOME"; return ;;
    esac
  fi
  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    for ver in 17 21 23; do
      local h
      h="$(/usr/libexec/java_home -v "$ver" 2>/dev/null)" || true
      if [ -n "${h:-}" ] && [ -x "${h}/bin/java" ]; then
        printf '%s' "$h"
        return
      fi
    done
  fi
  return 1
}

if ! JAVA_HOME="$(pick_java_home)"; then
  echo "Could not find JDK 17–23. Install one (e.g. Temurin) or set JAVA_HOME, then retry." >&2
  echo "  macOS: brew install --cask temurin@17" >&2
  exit 1
fi

export JAVA_HOME
echo "Using JAVA_HOME=${JAVA_HOME}"
"${JAVA_HOME}/bin/java" -version

cd "${ANDROID_DIR}"
exec ./gradlew "$@"
