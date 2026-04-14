#!/usr/bin/env bash

set -euo pipefail

# Skip hook work when there is nothing staged.
if git diff --cached --quiet --exit-code; then
  echo "pre-commit: no staged changes, skipping lint-staged"
  exit 0
fi

# Allow empty post-fix commits so amend flows do not fail when
# staged changes are auto-fixed back to the current HEAD state.
bunx lint-staged --allow-empty