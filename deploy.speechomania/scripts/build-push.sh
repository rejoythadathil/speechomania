#!/bin/sh
set -eu
OWNER="${GHCR_OWNER:-deadend-engineers}"
REF="${1:-origin/main}"
API_REPO="${API_REPO:-$(cd "$(dirname "$0")/../../api.speechomania" && pwd)}"

cd "$API_REPO"
git fetch --quiet origin
SHA=$(git rev-parse --short=12 "$REF")
WORKTREE=$(mktemp -d)
git worktree add --quiet --detach "$WORKTREE" "$REF"
trap 'git worktree remove --force "$WORKTREE"' EXIT

IMAGE="ghcr.io/$OWNER/speechomania-api"
docker buildx build --platform linux/amd64 -t "$IMAGE:$SHA" -t "$IMAGE:prod" --push "$WORKTREE"
echo "pushed $IMAGE:$SHA and $IMAGE:prod"
