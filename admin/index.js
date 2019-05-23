const { dialog, app, Menu, BrowserWindow, ipcMain } = require('electron');

const new_window = () => {
	return new BrowserWindow({width: 800, height: 800, webPreferences: {
		nodeIntegration: true
	}});
};

let open_file_windows = {};

const open_file = filename => {
  if (!open_file_windows[filename] || open_file_windows[filename].isDestroyed()) {
    let win = create_editor_window();
    console.log('trying to open file', filename);
    win.webContents.once('dom-ready', () => {
      win.webContents.send('open', `../games/${filename}`);
    });
    open_file_windows[filename] = win;
  }
};

const create_server_window = () => {
	let win = new_window();
  //win.loadURL('http://localhost:3002');
  win.loadURL(`file://${__dirname}/server/server.html`);

  Menu.setApplicationMenu(menu(win));
};

const create_editor_window = filename => {

  let win = new_window();
  win.loadURL(`file://${__dirname}/admin/index.html`);

  Menu.setApplicationMenu(menu(win));
  return win;
}

const menu = win => Menu.buildFromTemplate([{ 
	label: 'File',
	submenu: [{
		label: 'New',
		click: () => create_editor_window(),
		accelerator: 'CmdOrCtrl+N'
	}, {
		label: 'Save',
		click: () => win.webContents.send('save'),
		accelerator: 'CmdOrCtrl+S'
	}, {
		label: 'Save As',
		click: () => win.webContents.send('save_as'),
		accelerator: 'CmdOrCtrl+Shift+S'
	}, {
		label: 'Open',
		click: () => open_file(dialog.showOpenDialog()[0]),
		accelerator: 'CmdOrCtrl+O'
	}, {
		label: 'Quit',
		role: 'quit'
	}
	]
}, {
	label: 'Server',
	submenu: [{
		label: 'New Server',
		accelerator: 'CmdOrCtrl+J',
		click: () => create_server_window()
	}]
}, {
	label: 'Window',
	role: 'windowMenu',
	submenu: [
		{ label: 'Reload', role: 'reload'},
		{ label: 'Force Reload', role: 'forceReload'},
		{ label: 'DevTools', role: 'toggleDevTools'}
	]
}]);

ipcMain.on('open-game-file', (event, filename) => {
  open_file(filename);
});

app.on('ready', create_editor_window);
