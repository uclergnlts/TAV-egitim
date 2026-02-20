const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'TAV Eğitim Sistemi'
  });

  // Load the app
  if (isDev) {
    // Development: Load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Create menu
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Çıkış',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yenile', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Geliştirici Araçları', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Tam Ekran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () => {
            shell.openExternal('https://github.com/tav-egitim');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});
