#!/bin/bash 
# Script de inicio para FastAPI en Azure App Service 
# El puerto lo asigna Azure automáticamente 

PORT = ${PORT:8000} 

echo "==========================================" 
echo "🚀 Iniciando FastAPI en el puerto $PORT" 
echo "📁 Archivo principal: app.py" 
echo "🔧 Instancia de FastAPI: app" 
echo "=========================================="

