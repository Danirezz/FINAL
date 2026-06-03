# WBill$ - Sistema de Gestión de Finanzas Personales

## Descripción

WBill$ es una aplicación web desarrollada en Python que permite gestionar ingresos, gastos y movimientos financieros personales.

La aplicación implementa la arquitectura Model-View-Controller (MVC) utilizando FastAPI para la capa de servicios, SQLAlchemy como ORM para la persistencia de datos y Jinja2 para la interfaz web.

## Características

* Registro de usuarios.
* Inicio de sesión.
* Registro de ingresos.
* Registro de gastos.
* Consulta de movimientos.
* Actualización de movimientos.
* Eliminación de movimientos.
* Dashboard financiero.
* Persistencia de datos mediante SQLite.
* Pruebas automatizadas con Pytest.
* Integración continua mediante GitHub Actions.
* Despliegue en la nube.

---

## Tecnologías Utilizadas

* Python 3.12
* FastAPI
* SQLAlchemy
* SQLite
* Jinja2
* Pytest
* GitHub Actions
* Azure App Service

---

## Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/Danirezz/FINAL.git
cd FINAL
```

### 2. Crear entorno virtual

#### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

---

## Ejecución Local

Iniciar el servidor:

```bash
python -m uvicorn app:app --reload
```

Abrir en el navegador:

```text
http://localhost:8000
```

---

## Documentación de la API

Swagger UI:

```text
http://localhost:8000/docs
```

OpenAPI:

```text
http://localhost:8000/openapi.json
```

---

## Ejecución de Pruebas

```bash
PYTHONPATH=. pytest
```

---

## Arquitectura MVC

```text
app.py                  -> Controladores y rutas
database/               -> Modelos y persistencia
services/               -> Lógica de negocio
templates/              -> Vistas Jinja2
static/                 -> Recursos estáticos
tests/                  -> Pruebas automatizadas
```

## CI/CD

Cada push a la rama principal ejecuta automáticamente la suite de pruebas mediante GitHub Actions.

Si alguna prueba falla, el pipeline marca el cambio como fallido.

---

## Integración Continua

El proyecto utiliza GitHub Actions para ejecutar automáticamente la suite de pruebas cada vez que se realizan cambios en el repositorio.

---

## Despliegue

Aplicación desplegada en la nube mediante Azure App Service.

URL pública:

```text
https://app-gastos-personales.azurewebsites.net
```

---

## Autor

Angel Daniel Ramos Ortiz
Juan Sebastián Cepeda Moreno
Javier Steve Ahumada Cuevas

Ingeniería de Sistemas
Universidad Católica de Colombia

