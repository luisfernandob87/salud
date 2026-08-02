# Health App (nombre temporal "Project Health")

Plataforma web de **historial personal de salud**. Guarda síntomas, medicamentos, consultas, estudios y salud diaria en una línea de tiempo privada, y compártela con tu médico mediante un enlace de solo lectura o un PDF profesional.

> ⚠️ **Prototipo.** No reemplaza al médico: no diagnostica ni interpreta resultados. Los datos son solo del usuario.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React (JS) + Vite + Tailwind CSS + Recharts + jsPDF |
| Backend | Node.js + Express + Passport (Local + Google OAuth2) |
| Base de datos | SQLite (`better-sqlite3`) |

---

## Requisitos

- Node.js 20+
- npm 10+

---

## Instalación

```bash
npm run setup
```

Instala dependencias en la raíz, `server/` y `client/`.

## Configuración del servidor

```bash
cd server
copy .env.example .env    # Windows
# o: cp .env.example .env
```

Edita `.env` y pon al menos un `JWT_SECRET` (cualquier cadena larga y aleatoria).

## Ejecutar en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000 (API en `/api`)

También puedes lanzarlos por separado: `npm run dev:server` y `npm run dev:client`.

---

## Configurar el inicio de sesión con Google (opcional pero recomendado)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crea un proyecto (o usa uno existente).
3. **Pantalla de consentimiento de OAuth**: configura la pantalla (External), añade el correo como *user* de prueba y la URI de redireccionamiento.
4. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**
   - Orígenes de JavaScript autorizados: `http://localhost:5173`
   - **URI de redireccionamiento autorizada**: `http://localhost:4000/api/auth/google/callback`
5. Copia el **ID de cliente** y el **secreto** en `server/.env`:

```
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

6. Reinicia el servidor. El botón "Continuar con Google" quedará activo.

> Sin estas credenciales la app sigue funcionando: puedes registrarte e iniciar sesión con correo y contraseña.

---

## Funcionalidades

- **Registro / Login**: con correo y contraseña o con Google (Passport.js).
- **Registro rápido**: botón flotante "Registrar" para anotar síntomas, medicamentos, consultas, estudios, notas, peso, presión, glucosa o temperatura en menos de un minuto.
- **Línea de tiempo**: toda la historia médica ordenada cronológicamente, estilo red social privada.
- **Síntomas**: mapa corporal clicable, intensidad, tipo, duración, causas, contexto y archivos adjuntos.
- **Consultas**: especialidad, doctor, motivo, diagnóstico, tratamiento, próximas citas y recetas adjuntas.
- **Medicamentos**: dosis, frecuencia, estado (activo/suspendido/finalizado), quién lo indicó.
- **Estudios**: radiografías, laboratorios, resonancias… con archivos adjuntos (fotos, videos, PDF).
- **Salud diaria**: ánimo, sueño, peso, presión, glucosa, temperatura, frecuencia cardíaca y SpO₂, con **gráficas automáticas**.
- **Buscador inteligente**: encuentra registros por síntoma, medicamento, doctor, año, parte del cuerpo, etc.
- **Compartir con un médico**: enlace temporal de solo lectura (24 h / 7 días / 30 días) con contraseña opcional; el médico lo abre sin cuenta.
- **PDF médico**: descarga un documento profesional (datos, resumen, timeline, gráficas) para llevar a la consulta.
- **Privacidad**: los datos pertenecen al usuario, se aíslan por cuenta y se puede eliminar todo en cualquier momento desde Configuración.

---

## Estructura

```
server/                 Backend Express + SQLite
  config/passport.js    Estrategias Local y Google
  db/migrations.js      Esquema de la base de datos
  routes/               API REST (auth, timeline, symptoms, share…)
  services/             Subida y borrado de archivos
  uploads/              Archivos subidos (gitignored)
client/                 Frontend React (Vite)
  src/api/              Cliente HTTP (cookies httpOnly)
  src/components/       UI, layout, timeline, bodyMap, charts, pdf…
  src/pages/            Vistas (Dashboard, Timeline, Salud, …)
```

## Base de datos

La BD es SQLite en `server/data/health.db` (se crea sola al arrancar). Para empezar de cero, borra esa carpeta.

> El diseño separa la lógica de negocio en rutas, de modo que migrar a una BD centralizada (Postgres, etc.) más adelante sea directo.

## Renombrar la app

El nombre está en un solo lugar: `client/src/utils/app.js` (`APP_NAME`). Cámbialo ahí y actualiza `client/index.html` (`<title>`).

---

## Privacidad

- Los datos pertenecen únicamente al usuario.
- Nunca se venden ni se usan para publicidad.
- Contraseñas y contraseñas de enlaces con hash (bcrypt); sesiones con JWT en cookie httpOnly.
- El usuario puede eliminar su cuenta y todos sus datos (incluidos los archivos) en cualquier momento.

> El cifrado en reposo de la BD está previsto como mejora futura.
