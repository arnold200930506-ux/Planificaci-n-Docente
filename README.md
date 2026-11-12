# Sistema de Planificación Docente MINERD

Aplicación existente basada en React 19, Vite y TypeScript, con una versión de escritorio Electron y aplicaciones móviles mediante Capacitor.

## Desarrollo

Requisitos: Node.js compatible con el proyecto y npm.

```powershell
npm ci
npm run dev
```

`npm run dev` inicia el servidor de desarrollo existente (`server.ts`), que también proporciona el espejo de almacenamiento y el endpoint de generación de planes. Las credenciales opcionales de servicios externos se configuran mediante variables de entorno; no se deben incluir en el repositorio ni en el instalador.

`firebase-applet-config.json` contiene la configuración pública de Firebase para el SDK web; su `apiKey` identifica el proyecto, no es una credencial privada. No agregue ahí claves de Gemini, tokens de GitHub ni contraseñas. **Pendiente de seguridad:** `firestore.rules` permite actualmente lectura y escritura sin autenticación. La aplicación usa un bloqueo local para algunos módulos, no una identidad Firebase en sus operaciones de Firestore; cambiar esas reglas sin implementar primero una política de acceso compatible interrumpiría la sincronización. No publique datos reales hasta definir y aplicar esa política.

## Estructura relevante

- `src/components/`, `src/services/`, `src/types/`, `src/hooks/`: interfaz y lógica compartida por las plataformas.
- `electron/main.cjs`: proceso principal de escritorio Electron.
- `server.ts`: servidor compartido para desarrollo; el build de Windows lo empaqueta en `dist/electron/server.mjs`.
- `public/`: recursos de frontend e ícono institucional `favicon.ico`.
- `android/`, `ios/`: proyectos nativos de Capacitor.
- `.github/workflows/release-windows.yml`: publicación de Windows desde etiquetas de versión.

El renderer mantiene `contextIsolation: true` y `nodeIntegration: false`. La interfaz compartida no necesita una API nativa de Electron ni un `preload`. En Windows, el servidor existente se inicia en un puerto local aleatorio enlazado a `127.0.0.1`; el espejo conserva el archivo `school_storage_mirror.json` en los datos de usuario de la aplicación.

## Compilar para Windows

En Windows, desde la raíz del proyecto:

```powershell
npm ci
npm run dist:win
```

El comando construye Vite y genera el instalador asistido NSIS en `dist_electron/`. Electron Builder usa `public/favicon.ico` como ícono de la aplicación e incluye ese recurso en el paquete.

## Publicar una actualización de Windows

1. Cree y envíe una etiqueta con versión semántica, por ejemplo `v1.2.3`.
2. GitHub Actions valida el formato, establece esa versión para el empaquetado e instala las dependencias con `npm ci`.
3. El flujo construye la aplicación y publica en GitHub Releases el instalador NSIS y los metadatos que utiliza `electron-updater`. El repositorio de actualizaciones es `arnold200930506-ux/Planificaci-n-Docente`.

El workflow utiliza `GITHUB_TOKEN` únicamente durante la publicación; no se incorpora ninguna credencial a la aplicación. La primera versión que incluya el actualizador debe instalarse manualmente desde su Release. A partir de esa instalación, la aplicación comprueba actualizaciones al iniciar, las descarga en segundo plano y las aplica al cerrar la aplicación.

## Android e iOS

Capacitor permanece habilitado. Los comandos existentes para sincronizar y abrir los proyectos nativos son `npm run cap:android` y `npm run cap:ios`.
