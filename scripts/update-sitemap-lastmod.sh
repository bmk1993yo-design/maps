#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SITEMAP_PATH="${ROOT_DIR}/public/sitemap.xml"
TODAY="$(date +%Y-%m-%d)"

if [[ ! -f "${SITEMAP_PATH}" ]]; then
  echo "sitemap.xml not found at ${SITEMAP_PATH}" >&2
  exit 1
fi

if rg -q "<lastmod>.*</lastmod>" "${SITEMAP_PATH}"; then
  rg -n "<lastmod>.*</lastmod>" "${SITEMAP_PATH}" > /dev/null
  perl -0pi -e "s|<lastmod>.*?</lastmod>|<lastmod>${TODAY}</lastmod>|s" "${SITEMAP_PATH}"
else
  perl -0pi -e "s|(<loc>https://icheon-map.pages.dev/</loc>)|\\1\\n    <lastmod>${TODAY}</lastmod>|s" "${SITEMAP_PATH}"
fi

echo "Updated lastmod to ${TODAY} in ${SITEMAP_PATH}"
