#!/usr/bin/env bash
set -Eeuo pipefail

readonly EXTENSION_UUID="aurora@tekika3141"
readonly EXTENSION_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_UUID}"
readonly SCHEMA_FILE="${HOME}/.local/share/glib-2.0/schemas/org.tekika3141.aurora.gschema.xml"
readonly SESSION_FILE="${HOME}/.local/share/xsessions/aurora.desktop"
readonly SESSION_FILE_ALT="${HOME}/.local/share/xsessions/aurora-session.desktop"
readonly SESSION_CONFIG="${HOME}/.local/share/gnome-session/sessions/aurora.session"
readonly SCHEMA_DIR="${HOME}/.local/share/glib-2.0/schemas"

gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
rm -rf -- "$EXTENSION_DIR"
rm -f -- "$SCHEMA_FILE" "$SESSION_FILE" "$SESSION_FILE_ALT" "$SESSION_CONFIG"
if [[ -d "$SCHEMA_DIR" ]]; then
  glib-compile-schemas "$SCHEMA_DIR"
fi
printf '[aurora] removed Aurora files; Ubuntu GNOME remains unchanged.\n'
