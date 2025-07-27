#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Default to port 8080 if the PORT environment variable is not set.
PORT=${PORT:-8080}

# Run the uvicorn server
exec uvicorn pipeline:app --host 0.0.0.0 --port "$PORT" 