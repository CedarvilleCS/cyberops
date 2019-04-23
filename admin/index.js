const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  let win = new BrowserWindow({width: 800, height: 800, webPreferences: {
    nodeIntegration: true
  }});
  //win.loadURL('http://localhost:3001');
  win.loadFile('build/index.html');
}

app.on('ready', createWindow);
