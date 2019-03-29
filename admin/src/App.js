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
          return (
            <div key={i} onClick={update_type} className={classes}>{i_type}</div>
          );
        })}
      </div>
      {current_template(item)}
    </div>
  );
};

const big_struct = (field_types, is_col) => lens => {
  let classes = "big-struct-container";
  if (is_col) {
    classes += " big-struct-col";
  }
  return (<div className={classes}>
    {Object.keys(field_types).map((field, i) => 
      titled(field, field_types[field])([lens, field])
    )}
  </div>);
};

const struct = field_types => lens => {
  return (<div className="struct-container">
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

const stage_type_selector = tagged_union({
  'reconnaissance': nothing,
  'weaponization': nothing,
  'delivery': nothing,
  'exploitation': nothing,
  'installation': nothing,
  'command_and_control': nothing,
  'actions_on_objectives': nothing
});

const titled = (title, element) => lens => {
  return (<div className="titled-group">
    <h4>{title}</h4>
    {element(lens)}
  </div>);
};

const list = (default_item, template, title) => lens => {
  const add_item = () => store_action(store =>
    L.set([lens, L.appendTo], L.set('is_expanded', true, default_item), store));
  const remove_item = i => store_action(store => L.remove([lens, i], store));
  const actual_items = L.get(lens, store);
  return (
    <div className="list-maker-group">
      {actual_items.map((actual_item, i) => {
        let item = [lens, i];

        const toggle_expansion = () => store_action(store =>
          L.modify([item, 'is_expanded'], x => !x, store));

        let panel = (<></>);
        if (L.get([item, 'is_expanded'], store)) {
          panel = (<>
            <div className="item-template-container">
            {template(item)}
              </div>
            <div onClick={() => remove_item(i)} className="clickable remove-button">remove</div>
          </>);
        }
        return (
          <div key={i} className="list-maker-item">
            <div className="list-maker-item-title-bar">
              <div onClick={toggle_expansion} className="clickable collapse-button">
                {title(item, i)}
              </div>
            </div>
            {panel}
          </div>
        );
      })}
      <div className="clickable add-button" onClick={add_item}>new</div>
    </div>
  );
};

const message_item = message => {
  let message_text = L.get([message, 'text'], store);
  const update = text => store_action(store => L.set([message, 'text'], text, store));
  return (
    <textarea rows="4" value={message_text} onChange={ev => update(ev.target.value)} />
  );
};

const action_item = lens => {
  return (
    <div>
      {stage_type_selector(lens)}
      {struct({ 'text': input })(lens)}
    </div>
  );
};

const input = lens => {
  let actual = L.get(lens, store);
  let update = new_value => store_action(store => L.set(lens, new_value, store));
  return (<input type="text" value={actual} onChange={ev => update(ev.target.value)} />);
};

const diff_item = tagged_union({
  'computer': struct({ 'name': input, 'os': input, 'subnets': input }),
  'subnet': struct({ 'name': input }),
  'connect': struct({ 'from': input, 'to': input }),
  'disconnect': struct({ 'from': input, 'to': input })
});

const stage = lens => {
  const default_diff_item = { type: 'computer', computer_name: '' };
  const default_action = { text: "", type: default_stage_type_id };
  const default_message = { text: "" };
  return (
    <div>
      {stage_type_selector(lens)}
      {big_struct({
        'messages': list(default_message, message_item, (m, i) => "Message " + i),
        'actions': list(default_action, action_item, (m, i) => "Action " + i),
        'home_diff_items': list(default_diff_item, diff_item, (m, i) => "Diff " + i),
        'enemy_diff_items': list(default_diff_item, diff_item, (m, i) => "Diff " + i),
      })(lens)}
    </div>);
}

const default_stage = {
  type: default_stage_type_id,
  messages: [],
  actions: [],
  enemy_diff_items: [],
  home_diff_items: []
};

const game = big_struct({
  'name': input,
  'stages': list(default_stage, stage, (_, i) => "stage " + i)
}, true)

const default_game = { name: '', stages: [] };

const App = () => big_struct({
  'games': list(default_game, game, (game, i) => L.get([game, 'name'], store) || 'Unnamed')
})([])

const render = () => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

export default render;
