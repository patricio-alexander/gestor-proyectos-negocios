## Acerca del proyecto

Es un sistema de gestion de proyectos para negocios, el sistema va a permitir gesitonar cada modulo de cada negocio de forma granular, a traves de planes

## Estructura del proyecto

- `app/` Aqui van las paginas del proyecto
- `src/` Codigo fuente del proyecto aqui van `hooks/`, `helpers/`, `components/`, cada uno se va agrupar por features

## Arquitectura

Vas a usar Feature driven design cada modulo va estar separado por features

Ejemplo

```
features/
├─ cart/
│   ├─ components/
│   ├─ hooks/
    └─ types/
└─ auth/

shared/
├─ components/
└─ utils/            # shared utilities, helpers, and services
```

Y `shared/` se va usar para cosas compartidas entre cada uno de las features
