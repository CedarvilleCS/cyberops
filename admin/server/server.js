const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');
const body_parser = window.require('body-parser');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const app = express();
const port = 3003;

let store = [];
let gameIndex = 0;

app.use(express.static('client'));
app.use(express.static('common'));
app.use(express.json());

app.get('/api/request', (req, res) => {
    let contents = fs.readFileSync(`../games/${store[0/*gameIndex++ % store.length*/]}`);
    res.setHeader('Content-Type', 'application/json');
    res.end(contents);
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
  fs.writeFileSync(`../results/${req.body.name}-${req.body.email}-${timestamp}`, JSON.stringify(req.body));
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

document.getElementById('export-csv-button').addEventListener('click', () => {
  let results_filenames = fs.readdirSync('../results/');
  let game_rows = [['email', 'filename', 'did_escalate']];
  let stage_rows = [['email', 'filename', 'stage_index', 'stage_type', 'did_escalate']];
  for (let file of results_filenames) {
    let obj = JSON.parse(fs.readFileSync(`../results/${file}`));
    let game_escalated = false;
    obj.game.stages.forEach((stage, i) => {
      let did_escalate = false;
      for (let action of stage.actions) {
        if (action.is_escalatory && action.is_selected) {
          did_escalate = true;
          game_escalated = true;
        }
      }
      stage_rows.push([
        obj.email,
        obj.name,
        i,
        stage.type,
        did_escalate
      ]);
    });
    game_rows.push([
      obj.email,
      obj.name,
      game_escalated
    ]);
    console.log(game_rows)
    let game_rows_str = game_rows.map(row => {
      console.log(row);
      return row.join()
    }).join('\n');
    let stage_rows_str = stage_rows.map(row => row.join()).join('\n');
    fs.writeFileSync('../stages.csv', stage_rows_str);
    fs.writeFileSync('../games.csv', game_rows_str);
  }
});

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
