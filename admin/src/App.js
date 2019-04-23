// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import * as L from 'partial.lenses'

let store = {
  games: []
};

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

const big_struct = (field_types, is_col) => {
  let container = is_col ? column : row;
  return container(Object.keys(field_types).map(field => 
    titled_prop(field, field_types[field])));
};

const struct = (field_types, is_row) => lens => {
  let classes = "struct-container";
  if (!is_row) {
    classes += " struct-container-col";
  }
  return (<div className={classes}>
    {Object.keys(field_types).map((field, i) => {
      return (
        <div className="field-label">
          <div>{field}</div>
          {field_types[field]([lens, field])}
        </div>
      );
    })}
  </div>);
};

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
  return (
    <div className="list-maker-group">
      {actual_items.map((actual_item, i) => (
        <div className="list-item" key={i}>
          {template([lens, i])}
        </div>)
      )}
    </div>
  );
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
  let message_text = L.get([lens, 'text'], store);
  const update = text => store_action(store => L.set([lens, 'text'], text, store));
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

const stage = parent_game => {
  const default_action = { text: "", type: default_stage_type_id };
  const default_message = { text: "" };
  const home_net = L.get([parent_game, 'home_network'], store);
  const enemy_net = L.get([parent_game, 'enemy_network'], store);
  return collapsible('stage',
    column([
      stage_type_selector,
      row([
        titled_prop('messages', list(default_message, message_item)),
        titled_prop('actions', list(default_action, action_item)),
        titled_prop('home_network', network_portion(home_net)),
        titled_prop('enemy_network', network_portion(enemy_net))
      ])
    ]));
};

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

const game = lens => collapsible(L.get([lens, 'name'], store), column([
  row([
    titled_prop('name', input), 
    titled_prop('filename', input)
  ]),
  titled_prop('home_network', network),
  titled_prop('enemy_network', network),
  titled_prop('stages', list(default_stage, stage(lens), (_, i) => "stage " + i))
], true))(lens);

const default_game = {
  is_dirty: false,
  name: '', 
  stages: [],
  home_network: empty_network,
  enemy_network: empty_network
};

const App = () => big_struct({
  'games': list(default_game, game)
})([])

const render = () => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

export default render;
