#!/usr/bin/env bash
set -Eeuo pipefail

readonly EXTENSION_UUID="aurora@tekika3141"
readonly PREFIX="${HOME}/.local/share"
readonly EXTENSION_DIR="${PREFIX}/gnome-shell/extensions/${EXTENSION_UUID}"
readonly SESSION_DIR="${PREFIX}/xsessions"
readonly SCHEMA_DIR="${HOME}/.local/share/glib-2.0/schemas"
readonly ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '[aurora] %s\n' "$*"; }
fail() { printf '[aurora] error: %s\n' "$*" >&2; exit 1; }

command -v gnome-shell >/dev/null || fail "gnome-shell is required."
command -v glib-compile-schemas >/dev/null || fail "glib-compile-schemas is required."
command -v gnome-extensions >/dev/null || fail "gnome-extensions is required."

mkdir -p "$EXTENSION_DIR" "$SESSION_DIR" "$SCHEMA_DIR" "$PREFIX/gnome-session/sessions"
cp -R "$ROOT_DIR/extensions/${EXTENSION_UUID}/." "$EXTENSION_DIR/"
cp "$ROOT_DIR/session/aurora.desktop" "$SESSION_DIR/"
cp "$ROOT_DIR/session/aurora.session" "$PREFIX/gnome-session/sessions/"
cp "$ROOT_DIR/session/gnome-session" "$SESSION_DIR/aurora-session.desktop"
cp "$ROOT_DIR/extensions/${EXTENSION_UUID}/schemas/org.tekika3141.aurora.gschema.xml" "$SCHEMA_DIR/"
glib-compile-schemas "$SCHEMA_DIR"
gnome-extensions enable "$EXTENSION_UUID" || log "Enable manually after the next login."
log "Installed. Log out and choose 'Aurora Desktop' at the login screen."
