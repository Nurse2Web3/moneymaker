#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
pip install -q --upgrade -r artifacts/api-server/requirements.txt || true
