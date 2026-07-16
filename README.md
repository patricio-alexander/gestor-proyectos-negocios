# Gestor de Proyectos

Sistema de gestión de proyectos con planes, módulos, licencias y suscripciones.

## Requisitos

- Node.js >= 18
- MySQL >= 8

## Configuración de la base de datos

### 1. Crear la base de datos

```sql
CREATE DATABASE gestor_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y ajustar los valores:

```env
DATABASE_URL="mysql://usuario:password@localhost:3306/gestor_proyectos"
DATABASE_USER="usuario"
DATABASE_PASSWORD="password"
DATABASE_NAME="gestor_proyectos"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
JWT_SECRET="cambiar-por-un-secreto-seguro"
NEXT_PUBLIC_BASE_PATH=/gestor-proyectos-negocios # no cambiar
```

### 3. Sincronizar el esquema

```bash
npx prisma db push --accept-data-loss
```

Esto crea las tablas sin necesidad de migraciones. Ideal para desarrollo.

> Para producción, usar `npx prisma migrate dev` para generar migraciones versionadas.

### 4. Generar el cliente Prisma

```bash
npx prisma generate
```

### 5. Crear un usuario inicial

Ejecutar el seed (si existe) o crear un usuario manualmente insertando en la tabla `User`. Luego iniciar sesión en `/login`.

## Script completo de setup

```bash
# 1. Instalar dependencias (genera Prisma Client automáticamente)
npm install

# 2. Configurar .env (copiar .env.example → .env)

# 3. Crear BD en MySQL y sincronizar esquema + seed
npm run setup
# alias de: npm run db:reset

# 4. Iniciar en desarrollo
npm run dev
```

Comandos de base de datos:

```bash
npm run db:sync    # genera cliente + empuja schema + seed (sin borrar DB)
npm run db:reset   # borra y recrea la DB, empuja schema + seed
npm run seed       # solo seed
```

> **Importante:** tras clonar, `npm install` ejecuta `prisma generate`. Si ves errores
> `Can't resolve prisma/generated/prisma/client`, corré `npx prisma generate` y reiniciá `npm run dev`.

## Variables de entorno

| Variable            | Descripción                    | Ejemplo                                             |
| ------------------- | ------------------------------ | --------------------------------------------------- |
| `DATABASE_URL`      | Cadena de conexión MySQL       | `mysql://root:pass@localhost:3306/gestor_proyectos` |
| `DATABASE_USER`     | Usuario de la DB               | `root`                                              |
| `DATABASE_PASSWORD` | Contraseña de la DB            | `root123`                                           |
| `DATABASE_NAME`     | Nombre de la base de datos     | `gestor_proyectos`                                  |
| `DATABASE_HOST`     | Host de la DB                  | `localhost`                                         |
| `DATABASE_PORT`     | Puerto de la DB                | `3306`                                              |
| `JWT_SECRET`        | Secreto para firmar tokens JWT | `cambiar-por-un-secreto-seguro`                     |

## Comandos útiles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npx prisma studio    # Abrir UI de Prisma para explorar datos
npx prisma db push   # Sincronizar esquema con la DB
npx prisma generate  # Regenerar cliente Prisma

## Workers

Los workers viven en `workers/` y se levantan todos juntos con PM2:

```bash
npm install -g pm2
npm run build          # Compilar antes de producción
npm run start          # Levantar app + workers con PM2
npm run workers:logs   # Ver logs
npm run workers:stop   # Detener todo
pm2 save               # Persistir tras reinicio del servidor
```

Workers incluidos:

| PM2 name | Script | Descripción |
|----------|--------|-------------|
| `worker-usage` | `worker:usage` | Resetea `usage_count` de secciones a medianoche |
| `worker-listener-folders` | `worker:listener-folders` | Escucha cambios en `/var/www/html` y actualiza peso de archivos |
| `worker-polling-db-size` | `worker:polling-db-size` | Actualiza el peso de cada base de datos por app |

También podés levantar uno solo:

```bash
pm2 start npm --name "usage-reset" -- run worker:usage
```
```

## Arquitectura

El proyecto usa **Feature-Driven Design**:

```
src/features/auth/          # Autenticación
src/features/businesses/    # Negocios
src/features/plans/         # Planes
src/features/modules/       # Módulos
src/features/licenses/      # Licencias
src/features/subscriptions/ # Suscripciones
src/shared/                 # Componentes y utilidades compartidas
app/api/                    # API routes (REST)
app/dashboard/              # Páginas del dashboard
```
