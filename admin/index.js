const { dialog, app, Menu, BrowserWindow } = require('electron');

const createWindow = () => {

  let win = new BrowserWindow({width: 800, height: 800, webPreferences: {
    nodeIntegration: true
  }});
  win.loadURL('http://localhost:3001');
  //win.loadFile('build/index.html');

  const menu = Menu.buildFromTemplate([{ 
    label: 'File',
    submenu: [{
      label: 'Save',
      click: () => win.webContents.send('save'),
      accelerator: 'CmdOrCtrl+S'
    }, {
      label: 'Save As',
      click: () => win.webContents.send('save_as'),
      accelerator: 'CmdOrCtrl+Shift+S'
    }, {
      label: 'Open',
      click: () => {
        win.webContents.send('open', dialog.showOpenDialog()[0])
      },
      accelerator: 'CmdOrCtrl+O'
    }, {
      label: 'Quit',
      role: 'quit'
    }
    ]
  }, {
    label: 'Window',
    role: 'windowMenu',
    submenu: [
      { label: 'Reload', role: 'reload'},
      { label: 'Force Reload', role: 'forceReload'},
      { label: 'DevTools', role: 'toggleDevTools'}
    ]
  }]);
  Menu.setApplicationMenu(menu);
}
app.on('ready', createWindow);
