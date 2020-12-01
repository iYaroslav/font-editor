#!/bin/bash -e

if [[ -z "$(git status --untracked-files=no --porcelain)" ]]; then
  yarn build

  yarn version --patch
  git push
  git push --tags

  open $(git remote -v | grep fetch | awk '{print $2}' | sed 's/git@/http:\/\//' | sed 's/com:/com\//')| head -n1
else
  echo 'Commit changes before deploy!'
fi
