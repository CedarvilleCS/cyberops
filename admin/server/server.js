const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');
const body_parser = window.require('body-parser');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const os = require('os');

const app = express();
const port = 3003;

let all_games = [];
let valid_games = [];
let all_games_objects = [];
let valid_games_objects = [];

let games_counters = [];
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

const updateCounters = () => {
    document.getElementById('total-connections').innerHTML = 'Total Connections: ' + totalConnections;
    document.getElementById('current-connections').innerHTML = 'In Progress: ' + currentConnections + ' ('+ (currentConnections/totalConnections*100).toFixed(1) + '%)';
    document.getElementById('completed-connections').innerHTML = 'Finished: ' + finished + ' ('+ (finished/totalConnections*100).toFixed(1) + '%)';
}

app.get('/api/request/:time_stamp', (req, res) => {
    let contents = fs.readFileSync(`../games/${valid_games[gameIndex % valid_games.length]}`);
    write_log("user: " + req.params.time_stamp + " connected; receiving " + JSON.parse(contents).name);

    res.setHeader('Content-Type', 'application/json');
    res.end(contents);
    let game_object = valid_games_objects[gameIndex % valid_games.length];

    game_object.innerHTML = game_object.innerHTML.replace(/:.+/g, '') + ': ' + ++games_counters[gameIndex % valid_games.length];
    totalConnections++;
    currentConnections++;
    updateCounters();
    gameIndex++;
});

app.post('/api', (req, res) => {
    // This is insecure, but we are just writing to the file that is specified by
    // the request parameters. This could be injected to overwrite any file on
    // the user's system. There is certainly a better way.
    console.log(req.body);
    fs.writeFileSync(`../results/${req.body.user}-${req.body.name}.result`, JSON.stringify(req.body));
    write_log("user: " + req.body.user + " finished: " + req.body.name);
    res.send('ok');
    currentConnections--;
    finished++;
    updateCounters();
});

const getIPAddress = () => {
    var interfaces = os.networkInterfaces();
    var addresses = ""
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                addresses += "\t" + devName + ": " + alias.address + ":" + port + "\n";
            }
        }
    }
    if (addresses === "") addresses = "localhost:3003";
    return addresses;
}

const update_files = () => {
    //let input = document.getElementById('gameselect');
    //input.click();
	all_games = fs.readdirSync('../games').filter(function(value, index, arr){
        return value != ".gitignore";
    });
};

const clear_children = node => {
    let first = node.firstElementChild;
    while (first) {
        first.remove();
        first = node.firstElementChild;
    }
};
let all_selected = true;
const load_files = () => {
    game_checks = [];
    all_selected = true;
    document.getElementById('toggle-select-button').innerHTML = "Clear Selection";
    update_files();
    let list = document.getElementById('games-list');
    clear_children(list);
    for (let filename of all_games) {
        if(filename == ".gitignore") continue;
        let contents = fs.readFileSync(`../games/${filename}`);
        let name = JSON.parse(contents).name;
        let list_node = document.createElement('div');
        list_node.classList.add('game-name');
        list_node.innerHTML = name;
        list_node.addEventListener('click', () => {
            ipcRenderer.send('open-game-file', filename);
        });
        all_games_objects.push(list_node);

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
        list.appendChild(checkbox);
        list.appendChild(list_node);
    }
};

load_files();

document.getElementById('export-csv-button').addEventListener('click', () => {
    let results_filenames = fs.readdirSync('../results/');
    if (results_filenames["length"] == 1 && results_filenames[0] === ".gitignore") {
        write_log("no results found");
        return;
    }
    let stage_rows = [['User', 'Date','Type', 'Scenario Name', 'Index', 'Text', 'Choice']];
    let isSetup = false;
    let game_rows_str = "";
    for (let file of results_filenames) {
        if(file === ".gitignore"){
            continue;
        }
        let obj = JSON.parse(fs.readFileSync(`../results/${file}`));
        let date = (new Date(obj.user)).toString();
        obj.game.stages.forEach((stage, i) => {
            stage_rows.push([
                obj.user,
                date,
                "stage",
                obj.name,
                i,
                "\"" + stage.messages.map(e => e.text).join(";")+ "\"",
                "\"" + ((stage.actions.length != 0) ? stage.actions[stage.actions.map(e => e.is_selected).indexOf(true)].text.replace(/\"/g, /\'/) : "") + "\""
            ]);
        });
        obj.game.survey.forEach((survey, i) => {
            stage_rows.push([
                obj.user,
                date,
                "survey: " + survey.type,
                obj.name,
                i,
                "\""+ survey.question + "\"",
                "\"" + (((survey.type == "short_answer") ? survey.selection : (survey.selection != undefined) ? survey.selection.map(e => survey.answers[e]).join(";") : "")).replace(/\"/g, /\'/) + "\""
            ]);
        });
        console.log(stage_rows)
        stage_rows_str = stage_rows.map(row => {
            console.log(row);
            return row.join()
        }).join('\n');
    }
    try{
        fs.writeFileSync('../games.csv', stage_rows_str);
        write_log("exported games.csv successfully");
    }
    catch(e){
        write_log("file error");
    }
});

document.getElementById('refresh-files-button').addEventListener('click', () => {
    if (document.getElementById('refresh-files-button').classList.contains('button-disabled')) {
        return;
    }
    load_files();
});

document.getElementById('create-new-game-button').addEventListener('click', () => {
    if (document.getElementById('create-new-game-button').classList.contains('button-disabled')) {
        return;
    }
    ipcRenderer.send('open-new-game-file');
});

let server = null;
let server_running = false;
document.getElementById('toggle-server-button').addEventListener('click', () => {
    let button = document.getElementById('toggle-server-button');
    if (!server_running) {

        currentConnections = 0;
        finished = 0;
        totalConnections = 0;
        document.getElementById('server-log').value = '';
        document.getElementById('total-connections').innerHTML = 'Total Connections: 0';
        document.getElementById('current-connections').innerHTML = 'In Progress: 0';
        document.getElementById('completed-connections').innerHTML = 'Finished: 0';

        let networkInterfaces = os.networkInterfaces();
        for (var i = 0; i < all_games.length; i++) {
            if(game_checks[i].checked == true){
                valid_games.push(all_games[i]);
                games_counters.push(0);
                valid_games_objects.push(all_games_objects[i]);
            }
        }
        if(valid_games.length == 0){
            return;
        }
        for(let check of game_checks){
            check.disabled = true;
        }
        server_running = true;
        server = app.listen(port, () => console.log(`app listening on port ${port}`));
        for (let obj of all_games_objects){
            obj.innerHTML = obj.innerHTML.replace(/:.+/g, '');
        }

        write_log("server listening on:\n" + getIPAddress());
        button.innerHTML = 'Stop Server';
        document.getElementById('refresh-files-button').classList.add('button-disabled');
        document.getElementById('create-new-game-button').classList.add('button-disabled');
    } else {
        server_running = false;
        for(let check of game_checks){
            check.disabled = false;
        }
        if (server) {
            server.close();
        }

        valid_games = [];
        valid_games_objects = [];
        games_counters = [];

        button.innerHTML = 'Start Server';
        document.getElementById('refresh-files-button').classList.remove('button-disabled');
        document.getElementById('create-new-game-button').classList.remove('button-disabled');
        write_log("server stopped");
    }
});


document.getElementById('toggle-select-button').addEventListener('click', () => {
    if (server_running) return;
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
