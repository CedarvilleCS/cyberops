const { dialog, app, Menu, BrowserWindow } = require('electron');

const new_window = () => {
	return new BrowserWindow({width: 800, height: 800, webPreferences: {
		nodeIntegration: true
	}});
};

const create_server_window = () => {
	let win = new_window();
	win.loadURL('http://localhost:3002');

  Menu.setApplicationMenu(menu(win));
};

const create_editor_window = () => {

  let win = new_window();
	//win.loadURL('http://localhost:3001');
	win.loadURL(`file://${__dirname}/build/index.html`);

  Menu.setApplicationMenu(menu(win));
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
	label: 'Server',
	submenu: [{
		label: 'New Server',
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

app.on('ready', create_editor_window);
