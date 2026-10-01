#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
build_dir="$project_root/vue/dist"
deploy_target="${ESIM_SSH_TARGET:-root@212.118.56.141}"
deploy_base="/var/www/esim-landing-vue"
release_name="$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$project_root" rev-parse --short HEAD)"
ssh_options=(-o ControlPath=/tmp/esim-publish-ssh-%C)

test -s "$build_dir/index.html"
artifact="$(mktemp -t esim-host-release.XXXXXX)"
trap 'rm -f "$artifact"' EXIT
COPYFILE_DISABLE=1 tar --no-xattrs -C "$build_dir" -czf "$artifact" .

ssh "${ssh_options[@]}" "$deploy_target" "mkdir -p '$deploy_base/releases/$release_name'"
scp "${ssh_options[@]}" "$artifact" "$deploy_target:$deploy_base/releases/$release_name.tar.gz"
ssh "${ssh_options[@]}" "$deploy_target" bash -s -- "$deploy_base" "$release_name" <<'REMOTE'
set -euo pipefail
base="$1"
release="$base/releases/$2"
tar -xzf "$release.tar.gz" -C "$release"
test -s "$release/index.html"
# Keep earlier hashed bundles for visitors whose already-open page imports one.
if [ -d "$base/current/assets" ]; then
    cp -an "$base/current/assets/." "$release/assets/"
fi
chmod -R a+rX "$release"
ln -s "$release" "$base/current-next"
mv -Tf "$base/current-next" "$base/current"
rm -f "$release.tar.gz"
printf 'Published release: %s\n' "$release"
REMOTE
