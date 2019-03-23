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

const log_action = action_name => console.log('action:', action_name);

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
let stage_types = {};
stage_types[default_stage_type_id] = { label: 'Reconnaissance', image: reconnaissance }
stage_types[uuidv4()] = { label: 'Weaponization', image: weaponization };
stage_types[uuidv4()] = { label: 'Delivery', image: delivery };
stage_types[uuidv4()] = { label: 'Exploitation', image: exploitation };
stage_types[uuidv4()] = { label: 'Installation', image: installation };
stage_types[uuidv4()] = { label: 'Command and Control', image: command_control };
stage_types[uuidv4()] = { label: 'Actions On Objectives', image: actions_on_objectives };

const make_stage = (stage_name) => {
  return {
    type: default_stage_type_id, 
    name: stage_name,
    messages: {},
    actions: {},
    diff_items: {}
  };
};

const add_new_stage = () => store_action(store => {
  log_action('add_new_stage');
  let new_stages = {...store.stages};
  let stage_id = uuidv4()
  new_stages[stage_id] = make_stage('Stage - ' + stage_id);
  return {
    ...store,
    stages: new_stages
  };
});

const toggle_stage_expansion = stage_id => store_action(store => {
  log_action('toggle_stage_expansion');
  let new_expansions = {...store.expanded_stages};
  new_expansions[stage_id] = !new_expansions[stage_id];
  return {
    ...store,
    expanded_stages: new_expansions
  }
});

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


const select_stage_type = (stage_id, stage_type_id) => store_action(store => {
  let stage_type = L.compose(stage_with_id(stage_id), L.prop('type'))
  return L.set(stage_type, stage_type_id, store)
});

const update_message = (stage_id, message_id, text) => store_action(store => {
  let message = L.compose(stage_with_id(stage_id), L.prop('messages'), L.prop(message_id));
  return L.set(message, text, store);
});

const action_with_id = (stage_id, action_id) =>
  L.compose(stage_with_id(stage_id), L.prop('actions'), L.prop(action_id));

const update_action_type = (stage_id, action_id, type) => store_action(store => {
  let action_type = L.compose(action_with_id(stage_id, action_id), L.prop('type'));
  return L.set(action_type, type, store);
});

const update_action_text = (stage_id, action_id, text) => store_action(stage => {
  let action_text = L.compose(action_with_id(stage_id, action_id), L.prop('text'));
  return L.set(action_text, text, store);
});

const add_item = (prop_name, default_item) => update_stage(stage => {
  let new_items = {...stage[prop_name]};
  new_items[uuidv4()] = default_item;
  let new_stage = {...stage};
  new_stage[prop_name] = new_items;
  return new_stage;
});

const remove_item = (prop_name, i) => update_stage(stage => {
  let new_items = {...stage[prop_name]};
  delete new_items[i];
  let new_stage = {...stage};
  new_stage[prop_name] = new_items;
  return new_stage;
})

const default_diff_item = { type: 'new_computer', computer_name: '' };
const default_action = { text: "", type: default_stage_type_id };
const default_message = "";

const StageTypeSelector = props => {
  return (
    <div className="stage-type-selector">
      {Object.entries(stage_types).map(([stage_type_id, stage_type], i) => {
        let classes = 'stage-type-item';
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

const ListMaker = props => {
  return (
    <div className="list-maker-group">
      {Object.entries(props.items).map(([item_id, item], i) => {
        return (
          <div key={i} className="list-maker-item">
            <div onClick={() => remove_item(props.prop_name, item_id)(props.stage_id)} 
                 className="button-div">-</div>
            {props.template(item_id, item, props.stage_id)}
          </div>
        );
      })}
      <div className="button-div" 
           onClick={() => add_item(props.prop_name, props.default_item)(props.stage_id)}>New {props.kind}</div>
    </div>
  );
};

const message_item = (message_id, message, stage_id) => {
  return (
    <textarea rows="4" value={message}
              onChange={ev => update_message(stage_id, message_id, ev.target.value)} />
  );
};

const action_item = (action_id, action, stage_id) => {
  return (
    <div>
      <input type="text" value={action.text} onChange={ev => 
          update_action_text(stage_id, action_id, ev.target.value)} />
      <StageTypeSelector selected_type={action.type}
                         on_change={t => update_action_type(stage_id, action_id, t)}/>
    </div>
  );
};

const diff_item = (diff_item_id, diff_item, stage_id) => {
  return (
    <div>Hello world</div>
  );
};

const Stage = (props) => {
  let panel = (<></>);
  let stage = store.stages[props.stage_id];
  if (store.expanded_stages[props.stage_id]) {
    panel = (
      <div>
        <StageTypeSelector
          selected_type={stage.type}
          on_change={t => select_stage_type(props.stage_id, t)} />
        <div className="diff-groups">
          <ListMaker
            items={stage.messages}
            stage_id={props.stage_id}
            kind="Message"
            prop_name="messages"
            default_item={default_message}
            template={message_item} />
          <ListMaker
            items={stage.actions}
            stage_id={props.stage_id}
            kind="Action"
            prop_name="actions"
            default_item={default_action}
            template={action_item} />
          <ListMaker
            items={stage.diff_items}
            stage_id={props.stage_id}
            kind="Diff"
            prop_name="diff_items"
            default_item={default_diff_item}
            template={diff_item} />
        </div>
      </div>
    );
  }
  return (
    <div className="stage-list-item">
      <div onClick={() => toggle_stage_expansion(props.stage_id)}
           className="stage-list-item-title">Stage {props.index}</div>
      {panel}
    </div>
  );
}

const App = () => {
  return (
    <div className="App">
      {Object.keys(store.stages).map((stage_id, i) => <Stage key={i} index={i} stage_id={stage_id} />)}
      <div onClick={add_new_stage}
           className="add-stage-button stage-list-item stage-list-item-title">Add Stage</div>
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
