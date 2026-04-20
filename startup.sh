#!/bin/bash

# Puerto asignado por Azure
PORT=${PORT:-8000}

echo "=========================================="
echo "🚀 Iniciando FastAPI en el puerto $PORT"
echo "📁 Archivo principal: app.py"
echo "🔧 Instancia de FastAPI: app"
echo "=========================================="

gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:$PORT
