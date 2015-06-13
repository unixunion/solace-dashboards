#!/bin/bash

# Cleanes up unwanted files in the commit history

git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch conf.json' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch ./src/main/resources/conf.json' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch ./src/test/resources/conf.json' --prune-empty --tag-name-filter cat -- --all
