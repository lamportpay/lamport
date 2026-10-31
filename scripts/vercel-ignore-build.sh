#!/bin/sh
# Vercel "Ignored Build Step" (remediation R1, 31 Oct 2026). Vercel → project lamport → Settings →
# Git → Ignored Build Step runs exactly:
#
#   if [ -f scripts/vercel-ignore-build.sh ]; then sh scripts/vercel-ignore-build.sh; else exit 0; fi
#
# so a commit without this file (Lovable's main, lovable/legacy) never builds. Exit 0 = skip the
# build, exit 1 = build.
#
# - Production: only from main. Git pushes never deploy main (vercel.json git.deploymentEnabled),
#   so a Production build happens only when the owner deliberately creates one (Vercel →
#   Deployments → Create Deployment, branch main, or the API) after approving the release.
# - Preview: only the integration branch vercel-preview-migration, whose variables are scoped to it.

if [ "$VERCEL_ENV" = "production" ]; then
  if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
    echo "Production build of main: allowed (owner-approved deployment)."
    exit 1
  fi
  echo "Production builds come only from main: skipped."
  exit 0
fi

if [ "$VERCEL_GIT_COMMIT_REF" = "vercel-preview-migration" ]; then
  echo "Preview of the integration branch: allowed."
  exit 1
fi

echo "Previews are built only for vercel-preview-migration: skipped."
exit 0
