#!/bin/bash
export PATH="/opt/homebrew/Cellar/node/25.8.1_1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
exec node node_modules/.bin/next dev --webpack --port 3001
