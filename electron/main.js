const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "BillDo",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the built Vite app
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  
  // Optional: Open DevTools
  // win.webContents.openDevTools();
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
