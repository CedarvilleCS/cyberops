// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import * as L from 'partial.lenses'
const electron = window.require('electron');
const fs = window.require('fs');
const ipcRenderer = electron.ipcRenderer;

let store = null;

const store_action = action => {
  store = action(store);
  console.log('current store:', store);
  render();
}

const default_stage_type_id = 'reconnaissance';

const row = items => lens => {
  return (<div className="flex-row">
    {items.map(item => item(lens))}
  </div>);
};

const column = items => lens => {
  return (<div className="flex-col">
    {items.map(item => item(lens))}
  </div>);
};

const prop = (prop_name, view) => lens => view([lens, prop_name]);

const titled = (title, element) => {
  return column([
    () => <h4>{title}</h4>,
    element
  ]);
};

const titled_prop = (p, element) => titled(p, prop(p, element));

const nothing = lens => (<></>);

const tagged_union = item_types => item => {
  const item_type = [item, 'type'];
  const current_template = item_types[L.get(item_type, store)] || nothing;
  return (
    <div>
      <div className="union-type-selector">
        {Object.keys(item_types).map((i_type, i) => {
          const update_type = () => {
            return store_action(store => L.set(item_type, i_type, store));
          };
          let classes = 'union-item-header clickable';
          if (L.get(item_type, store) === i_type) {
            classes += ' selected-union-item';
          }
          return (<div key={i} onClick={update_type} className={classes}>{i_type}</div>);
        })}
      </div>
      {current_template(item)}
    </div>
  );
};

const stage_type_selector = tagged_union({
  'reconnaissance': nothing,
  'weaponization': nothing,
  'delivery': nothing,
  'exploitation': nothing,
  'installation': nothing,
  'command_and_control': nothing,
  'actions_on_objectives': nothing
});

const remove_button = lens => {
  const remove_item = () => store_action(store => L.remove(lens, store));
  return (<div className="remove-button clickable" onClick={remove_item}>remove</div>);
};

const collapsible = (title, element) => lens => {
  const toggle_expansion = () => store_action(store =>
    L.modify([lens, 'is_expanded'], x => !x, store));

  let panel = (<></>);

  if (L.get([lens, 'is_expanded'], store)) {
    panel = element(lens);
  }
  return (<div className="collapsible-container">
    <div className="collapsible-titlebar">
      <div onClick={toggle_expansion} className="clickable collapse-button">
        {title || 'unnamed'}
      </div>
      {remove_button(lens)}
    </div>
    {panel}
  </div>);
}

const add_button = default_item => lens => {
  const add_item = () => store_action(store =>
    L.set([lens, L.appendTo], default_item, store));
  return (<div className="clickable add-button" onClick={add_item}>new</div>);
}

const list = (default_item, template) => lens => {
  const actual_items = L.get(lens, store);
  return column([
    ...actual_items.map((actual_item, i) => prop(i, template)),
    add_button(default_item)
  ])(lens);
};

const checkbox = property => lens => {
  const check_item = item => store_action(store => L.set(item, true, store));
  const uncheck_item = item => store_action(store => L.set(item, true, store));
  return (<div>
    <input type="checkbox" id="prop_check" />
    <label> {property}</label>
  </div>);
};

const checklist = prop_list => column(prop_list.map(property => prop(property, checkbox(property))));

const message_item = lens => {
  console.log(lens.flat(100));
  let message_text = L.get(lens, store);
  const update = text => store_action(store => L.set(lens, text, store));
  return column([
    remove_button,
    () => (<textarea rows="4" value={message_text} onChange={ev => update(ev.target.value)} />)
  ])(lens);
};

const input = lens => {
  let actual = L.get(lens, store);
  let update = new_value => store_action(store => L.set(lens, new_value, store));
  return (<input type="text" value={actual} onChange={ev => update(ev.target.value)} />);
};

const action_item = column([remove_button, stage_type_selector, prop('text', input)]);

const text = text => lens => (<div>{text}</div>);

const network_portion = net => column([
  titled_prop('computers', checklist(net.computers)),
  titled_prop('networks', checklist(net.networks)),
  titled_prop('connections',
    checklist(net.connections.map(x => x.computer + ':' + x.network)))
])

const default_action = { text: "", type: default_stage_type_id };
const default_message = "";
const stage = lens => collapsible('stage',
  column([
    stage_type_selector,
    row([
      titled_prop('messages', list(default_message, message_item)),
      titled_prop('actions', list(default_action, action_item)),
      titled_prop('home_network', network_portion(store.home_network)),
      titled_prop('enemy_network', network_portion(store.enemy_network))
    ])
  ]))(lens);

const empty_network = {
  computers: [],
  networks: [],
  connections: []
};

const default_stage = {
  type: default_stage_type_id,
  messages: [],
  actions: [],
  home_network: empty_network,
  enemy_network: empty_network
};

const network = row([
  titled_prop('computers', list('', input)),
  titled_prop('networks', list('', input)),
  titled_prop('connections', list({computer: '', network: ''}, row([
    prop('computer', input),
    prop('network', input)]))),
]);

const game = column([
  row([
    titled_prop('name', input)
  ]),
  titled_prop('home_network', network),
  titled_prop('enemy_network', network),
  titled_prop('stages', list(default_stage, stage, (_, i) => "stage " + i))
], true);

const default_game = {
  name: 'unnamed', 
  stages: [],
  home_network: empty_network,
  enemy_network: empty_network
};

store = default_game;

const App = () => game([])

const render = () => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

let filename = null;

ipcRenderer.on('save_as', () => {
  console.log('saving!!!!!!!!!!!!!!!!');
  filename = electron.remote.dialog.showSaveDialog();
  if (filename) {
    fs.writeFileSync(filename, JSON.stringify(store));
  }
});

ipcRenderer.on('save', () => {
  console.log('saving!!!!!!!!!!!!!!!!');
  if (!filename) {
    filename = electron.remote.dialog.showSaveDialog();
  }
  if (filename) {
    fs.writeFileSync(filename, JSON.stringify(store));
  }
});

ipcRenderer.on('open', (event, fn) => store_action(() => {
  console.log('opening');
  console.log(fn);
  filename = fn;
  return JSON.parse(fs.readFileSync(fn));
}));

export default render;
