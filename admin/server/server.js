const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');
const body_parser = window.require('body-parser');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const app = express();
const port = 3003;

let store = [];

app.use(express.static('client'));
app.use(express.static('common'));
app.use(express.json());

app.get('/api/:filename', (req, res) => {
  if (req.params.filename && store.includes(req.params.filename)) {
    let contents = fs.readFileSync(`../games/${req.params.filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.end(contents);
  }
});

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(store));
});

app.post('/api', (req, res) => {
  // This is insecure, but we are just writing to the file that is specified by
  // the request parameters. This could be injected to overwrite any file on
  // the user's system. There is certainly a better way.
  let timestamp = Math.floor(new Date().getTime() / 1000);
  console.log(req.body);
  fs.writeFileSync(`../results/${req.body.filename}-${req.body.email}-${timestamp}`);
  res.send('ok');
});

const update_files = () => {
	store = fs.readdirSync('../games');
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
