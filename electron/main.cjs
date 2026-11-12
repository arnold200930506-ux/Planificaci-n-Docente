const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { pathToFileURL } = require('url');

let backendServer;
let appUrl;

function configureAutoUpdates() {
  if (!app.isPackaged) return;

  // GitHub Releases can redirect downloads to another host; never forward
  // credentials or custom headers to those redirected requests.
  autoUpdater.crossOriginHeaders = () => [];
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', (error) => {
    console.error('No se pudo comprobar/descargar la actualización:', error);
  });
  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error('No se pudo iniciar la comprobación de actualizaciones:', error);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sistema de Planificación Docente MINERD',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  win.loadURL(appUrl);
}

async function startBackend() {
  const appRoot = path.join(__dirname, '..');
  const serverEntry = path.join(appRoot, 'dist', 'electron', 'server.mjs');
  const { startServer } = await import(pathToFileURL(serverEntry).href);

  backendServer = await startServer({
    host: '127.0.0.1',
    port: 0,
    staticDir: path.join(appRoot, 'dist'),
    dataDir: app.getPath('userData'),
    production: true,
  });

  const address = backendServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('El servidor local no devolvió una dirección válida.');
  }
  appUrl = `http://127.0.0.1:${address.port}`;
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
    configureAutoUpdates();
  } catch (error) {
    console.error('No se pudo iniciar la aplicación de escritorio:', error);
    dialog.showErrorBox(
      'No se pudo iniciar la aplicación',
      'El servidor local no pudo iniciarse. Reinicie la aplicación o contacte al soporte.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (appUrl && BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendServer?.listening) {
    backendServer.close();
  }
});
