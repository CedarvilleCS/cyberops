const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');
const body_parser = window.require('body-parser');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const os = require('os');
let networkInterfaces = os.networkInterfaces();

const app = express();
const port = 3003;

let all_games = [];
let valid_games = [];
let all_games_counters = [];
let valid_games_counters = [];
let game_checks = [];
let gameIndex = 0;

let totalConnections = 0;
let currentConnections = 0;
let finished = 0;

app.use(express.static('client'));
app.use(express.static('common'));
app.use(express.json());

const write_log = message => {
  let log = document.getElementById('server-log');
  let atBottom = log.scrollHeight < log.offsetHeight + log.scrollTop;
  log.value += '> ' + message + '\n';
  if (atBottom){
    log.scrollTop = log.scrollHeight;
  }
}

app.get('/api/request/:user_email', (req, res) => {
    let contents = fs.readFileSync(`../games/${valid_games[gameIndex % valid_games.length]}`);
    write_log(req.params.user_email + " connected; receiving " + valid_games[gameIndex % valid_games.length]);

    res.setHeader('Content-Type', 'application/json');
    res.end(contents);
    let counter = valid_games_counters[gameIndex % valid_games.length];
    counter.innerHTML = Number(counter.innerHTML) + 1;
    document.getElementById('total-connections').innerHTML = 'Total Connections: ' + ++totalConnections;
    document.getElementById('current-connections').innerHTML = 'In Progress: ' + ++currentConnections + ' ('+ (currentConnections/totalConnections*100).toFixed(1) + '%)';
    document.getElementById('completed-connections').innerHTML = 'Finished: ' + finished + ' ('+ (finished/totalConnections*100).toFixed(1) + '%)';
    gameIndex++;
});

app.post('/api', (req, res) => {
  // This is insecure, but we are just writing to the file that is specified by
  // the request parameters. This could be injected to overwrite any file on
  // the user's system. There is certainly a better way.
  let timestamp = Math.floor(new Date().getTime() / 1000);
  console.log(req.body);
  fs.writeFileSync(`../results/${req.body.name}-${req.body.email}-${timestamp}`, JSON.stringify(req.body));
  write_log(req.body.email + " finished: " + req.body.name);
  res.send('ok');
  document.getElementById('current-connections').innerHTML = 'In Progress: ' + --currentConnections + ' ('+ (currentConnections/totalConnections*100).toFixed(1) + '%)';
  document.getElementById('completed-connections').innerHTML = 'Finished: ' + ++finished + ' ('+ (finished/totalConnections*100).toFixed(1) + '%)';
});

const update_files = () => {
  //let input = document.getElementById('gameselect');
  //input.click();
	all_games = fs.readdirSync('../games');
};


const clear_children = node => {
  let first = node.firstElementChild;
  while (first) {
    first.remove();
    first = node.firstElementChild;
  }
};


const load_files = () => {
  update_files();
  let list = document.getElementById('games-list');
  clear_children(list);
  for (let filename of all_games) {
    let list_node = document.createElement('div');
    list_node.classList.add('game-name');
    list_node.innerHTML = filename;
    list_node.addEventListener('click', () => {
      ipcRenderer.send('open-game-file', filename);
    });

    let checkbox = document.createElement('input');
    checkbox.classList.add('check-box');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      if(!checkbox.checked){
        all_selected = false;
        document.getElementById('toggle-select-button').innerHTML = "Select All Games";
        return;
      }
      for(let c of game_checks) {
        if (!c.checked) return;
      }
      all_selected = true;
      document.getElementById('toggle-select-button').innerHTML = "Clear Selection";
    });
    game_checks.push(checkbox);

    let node_number = document.createElement('text');
    node_number.classList.add('num-games');
    node_number.innerHTML = '';
    all_games_counters.push(node_number);

    list.appendChild(checkbox);
    list.appendChild(list_node);
    list.appendChild(node_number);

  }
};

load_files();

document.getElementById('export-csv-button').addEventListener('click', () => {
  let results_filenames = fs.readdirSync('../results/');
  let game_rows = [['email', 'game_name', 'did_escalate']];
  let stage_rows = [['email', 'game_name', 'stage_index', 'stage_type', 'did_escalate']];
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

document.getElementById('choose-games-button').addEventListener('click', () => {
  load_files();
});

let server = null;
let server_running = false;
document.getElementById('toggle-server-button').addEventListener('click', () => {
  let button = document.getElementById('toggle-server-button');
  if (!server_running) {
    for (var i = 0; i < all_games.length; i++) {
      if(game_checks[i].checked == true){
        valid_games.push(all_games[i]);
        valid_games_counters.push(all_games_counters[i]);
      }
    }
    if(valid_games.length == 0){
      return;
    }
    server_running = true;
    server = app.listen(port, () => console.log(`app listening on port ${port}`));
    write_log("server listening on " + networkInterfaces["Wi-Fi"][1]["address"] + ":" + port);
    button.innerHTML = 'Stop Server';
  } else {
    server_running = false;
    if (server) {
      server.close();
    }
    valid_games = [];
    button.innerHTML = 'Start Server';
    write_log("server stopped");
  }
});

let all_selected = false;
document.getElementById('toggle-select-button').addEventListener('click', () => {
  let button = document.getElementById('toggle-select-button');
  if (!all_selected) {
    console.log('all selected')
    for(let check of game_checks){
      check.checked = true;
    }
    all_selected = true;
    button.innerHTML = 'Clear Selection';
  } else {
    for(let check of game_checks){
      check.checked = false;
    }
    all_selected = false
    console.log('cleared')
    button.innerHTML = 'Select All Games';
  }
});
