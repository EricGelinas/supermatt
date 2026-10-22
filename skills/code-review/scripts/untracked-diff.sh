#!/bin/sh
# Appends a diff of every untracked, non-ignored file in the current repository to "$1/diff.patch", listing them in
# "$1/untracked". Run from the repository root. Only git diff statuses 0 (equal) and 1 (different) are accepted; any
# other status stops collection and the script exits nonzero.
#
# This lives in a script rather than in SKILL.md because a host that loads a skill with arguments substitutes $1, $2
# and so on in the skill's text before the agent reads it.
set -eu

dir="$1"
git ls-files -z --others --exclude-standard > "$dir/untracked"
xargs -0 -I{} sh -c '
  git diff --no-index -- /dev/null "$1"
  status=$?
  [ "$status" -le 1 ] || exit 255
' sh {} < "$dir/untracked" >> "$dir/diff.patch"
