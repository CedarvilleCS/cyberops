const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const app = express();
const port = 3003;

let store = ['hello', 'world'];

app.get('/', (req,res) => res.send(JSON.stringify(store)));

const update_files = () => {
	store = fs.readdirSync('../games');
};

const start_server = () => {
  server_started
};

const clear_children = node => {
  let first = node.firstElementChild;
  while (first) {
    first.remove();
    first = node.firstElementChild;
  }
};

update_files();

document.getElementById('refresh-files-button').addEventListener('click', () => {
  update_files();
  let list = document.getElementById('games-list');
  clear_children(list);
  for (let filename of store) {
    let list_node = document.createElement('div');
    list_node.innerHTML = filename;
    list_node.addEventListener('click', () => {
      ipcRenderer.send('open-game-file', filename);
    });
    list.appendChild(list_node);
  }
});

let server = null;
let server_running = false;
document.getElementById('toggle-server-button').addEventListener('click', () => {
  let button = document.getElementById('toggle-server-button');
  if (!server_running) {
    server_running = true;
    server = app.listen(port, () => console.log(`app listening on port ${port}`));
    button.innerHTML = 'Stop Server';
  } else {
    server_running = false;
    if (server) {
      server.close();
    }
    button.innerHTML = 'Start Server';
  }
});
