// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import uuidv4 from 'uuid/v4';
import reconnaissance from './svg/reconnaissance.svg';
import weaponization from './svg/weaponization.svg';
import delivery from './svg/delivery.svg';
import exploitation from './svg/exploitation.svg';
import installation from './svg/installation.svg';
import command_control from './svg/command_control.svg';
import actions_on_objectives from './svg/actions_on_objectives.svg';
import * as L from 'partial.lenses'

let store = {
  stages: {},
  expanded_stages: {}
};

const store_action = action => {
  store = action(store);
  console.log('current store:', store);
  render();
}

const default_stage_type_id = uuidv4();

const default_stage = {
  type: default_stage_type_id,
  messages: {},
  actions: {},
  diff_items: {}
};

const add_new_stage = () => store_action(store =>
  L.set(['stages', uuidv4()], default_stage, store));

const update_stage = f => stage_id => store_action(store => {
  let stage = store.stages[stage_id];
  let new_stage = f(stage);
  let new_stages = {...store.stages};
  new_stages[stage_id] = new_stage;
  return {
    ...store,
    stages: new_stages
  };
});

const stage_with_id = stage_id => L.compose(L.prop('stages'), L.prop(stage_id))

const action_with_id = (stage_id, action_id) => [stage_with_id(stage_id), 'actions', action_id];

let stage_types = {};
stage_types[default_stage_type_id] = { label: 'Reconnaissance', image: reconnaissance }
stage_types[uuidv4()] = { label: 'Weaponization', image: weaponization };
stage_types[uuidv4()] = { label: 'Delivery', image: delivery };
stage_types[uuidv4()] = { label: 'Exploitation', image: exploitation };
stage_types[uuidv4()] = { label: 'Installation', image: installation };
stage_types[uuidv4()] = { label: 'Command and Control', image: command_control };
stage_types[uuidv4()] = { label: 'Actions On Objectives', image: actions_on_objectives };

const StageTypeSelector = props => {
  return (
    <div className="stage-type-selector">
      {Object.entries(stage_types).map(([stage_type_id, stage_type], i) => {
        let classes = 'stage-type-item clickable';
        if (stage_type_id === props.selected_type) {
          classes += ' selected-stage-type-item';
        }
        return (
          <div key={i}
              className={classes}
              title={stage_type.label}
              onClick={() => props.on_change(stage_type_id)}>
            <img alt="" src={stage_type.image}/>
          </div>
        );
      })}
    </div>
  );
};

const default_diff_item = { type: 'new_computer', computer_name: '' };
const default_action = { text: "", type: default_stage_type_id };
const default_message = { text: "" };

const ListMaker = props => {

  const add_item = () => store_action(store =>
    L.set([props.items, uuidv4()], L.set('is_expanded', true, props.default_item), store));

  const remove_item = i => store_action(store => L.remove([props.items, i], store));

  let items = L.get(props.items, store);

  return (
    <div className="list-maker-group">
      {Object.keys(items).map((item_id, i) => {
        let item = [props.items, item_id];

        const toggle_expansion = () => store_action(store =>
          L.modify([item, 'is_expanded'], x => !x, store));

        let panel = (<></>);
        if (L.get([item, 'is_expanded'], store)) {
          panel = (<>
            {props.template(item)}
            <div onClick={() => remove_item(item_id)} className="clickable remove-button">-</div>
          </>);
        }
        return (
          <div key={i} className="list-maker-item">
            <div onClick={toggle_expansion} className="clickable collapse-button">{props.kind} {i}</div>
            {panel}
          </div>
        );
      })}
      <div className="clickable add-button" onClick={add_item}>New {props.kind}</div>
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

const action_item = action => {
  let action_text = L.get([action, 'text'], store);
  let action_type = L.get([action, 'type'], store);
  let update_text = text => store_action(store => L.set([action, 'text'], text, store));
  let update_type = type => store_action(store => L.set([action, 'type'], type, store));
  return (
    <div>
      <input type="text" value={action_text} onChange={ev => update_text(ev.target.value)} />
      <StageTypeSelector selected_type={action_type} on_change={update_type}/>
    </div>
  );
};

const diff_item = diff_item => {
  return (
    <div>
    </div>
  );
};

const stage = stage => {
  let panel = (<></>);
  let stage_type = [stage, 'type'];
  let select_stage_type = t => store_action(store => L.set(stage_type, t, store));
  return (
    <div >
      <StageTypeSelector selected_type={L.get(stage_type, store)}
        on_change={select_stage_type} />
      <div className="diff-groups">
        <ListMaker
          items={[stage, 'messages']}
          kind="Message"
          default_item={default_message}
          template={message_item} />
        <ListMaker
          items={[stage, 'actions']}
          kind="Action"
          default_item={default_action}
          template={action_item} />
        <ListMaker
          items={[stage, 'diff_items']}
          kind="Diff"
          default_item={default_diff_item}
          template={diff_item} />
      </div>
    </div>);
}

const App = () => {
  return (
    <div className="App">
      <ListMaker
        items={'stages'}
        kind="Stage"
        default_item={default_stage}
        template={stage} />
    </div>
  );
};

const render = () => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

export default render;
