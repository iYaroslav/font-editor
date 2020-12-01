#!/bin/bash -e

if [[ -z "$(git status --untracked-files=no --porcelain)" ]]; then
  yarn version --patch
  git push
  git push --tags
else
  echo 'Commit changes before deploy!'
fi
