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

const log_action = action_name => console.log('action:', action_name);

let store = {
  stages: {},
  expanded_stages: {}
};

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
    network_changes: {}
  };
};

const add_new_stage = store => {
  log_action('add_new_stage');
  let new_stages = {...store.stages};
  let stage_id = uuidv4()
  new_stages[stage_id] = make_stage('Stage - ' + stage_id);
  return {
    ...store,
    stages: new_stages
  };
}

const toggle_stage_expansion = stage_id => store => {
  log_action('toggle_stage_expansion');
  let new_expansions = {...store.expanded_stages};
  new_expansions[stage_id] = !new_expansions[stage_id];
  return {
    ...store,
    expanded_stages: new_expansions
  }
};

const update_stage = f => stage_id => store => {
  let stage = store.stages[stage_id];
  let new_stage = f(stage);
  let new_stages = {...store.stages};
  new_stages[stage_id] = new_stage;
  return {
    ...store,
    stages: new_stages
  };
};

const select_stage_type = stage_type_id => update_stage(stage => {
  log_action('select_stage_type');
  let new_stage = {...stage, type: stage_type_id };
  new_stage.type = stage_type_id;
  return new_stage;
});

const update_message = (message_id, message) => update_stage(stage => {
  let new_messages = {...stage.messages};
  new_messages[message_id] = message;
  return {
    ...stage,
    messages: new_messages
  };
});

const new_message = x => update_message(uuidv4(), "")(x);

const remove_message = message_id => update_stage(stage => {
  let new_messages = {...stage.messages};
  delete new_messages[message_id];
  return {
    ...stage,
    messages: new_messages
  };
});

const update_action_type = (action_id, type) => update_stage(stage => {
  let new_actions = {...stage.actions};
  let new_action = stage.actions[action_id];
  new_action.type = type;
  new_actions[action_id] = new_action;
  return {
    ...stage,
    actions: new_actions
  };
});

const update_action_text = (action_id, text) => update_stage(stage => {
  let new_actions = {...stage.actions};
  let new_action = stage.actions[action_id];
  new_action.text = text;
  new_actions[action_id] = new_action;
  return {
    ...stage,
    actions: new_actions
  };
});

const new_action = update_stage(stage => {
  let new_actions = {...stage.actions};
  new_actions[uuidv4()] = { text: "", type: default_stage_type_id };
  return {
    ...stage,
    actions: new_actions
  };
});

const remove_action = action_id => update_stage(stage => {
  let new_actions = {...stage.actions};
  delete new_actions[action_id];
  return {
    ...stage,
    actions: new_actions
  };
});

const dispatch = action => {
  store = action(store);
  console.log('current store:', store);
  render();
}

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
            <div onClick={() => dispatch(props.on_remove(item_id)(props.stage_id))} 
                 className="button-div">-</div>
            {props.template(item_id, item, props.stage_id)}
          </div>
        );
      })}
      <div className="button-div" 
           onClick={() => dispatch(props.on_add(props.stage_id))}>New {props.kind}</div>
    </div>
  );
};

const message_item = (message_id, message, stage_id) => {
  return (
    <textarea rows="4" value={message}
              onChange={ev => dispatch(
              update_message(message_id, ev.target.value)(stage_id))} />
  );
};

const action_item = (action_id, action, stage_id) => {
  return (
    <>
      <input type="text" value={action.text}
                onChange={ev => dispatch(
                update_action_text(action_id, ev.target.value)(stage_id))} />
      <StageTypeSelector selected_type={action.type}
                         on_change={t => dispatch(update_action_type(action_id, t)(stage_id))}/>
    </>
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
          on_change={t => dispatch(select_stage_type(t)(props.stage_id))} />
        <div className="diff-groups">
          <ListMaker
            on_remove={remove_message}
            on_add={new_message}
            items={stage.messages}
            stage_id={props.stage_id}
            kind="Message"
            template={message_item} />
          <ListMaker
            on_remove={remove_action}
            on_add={new_action}
            items={stage.actions}
            stage_id={props.stage_id}
            kind="Actions"
            template={action_item} />
        </div>
      </div>
    );
  }
  return (
    <div className="stage-list-item">
      <div onClick={() => dispatch(toggle_stage_expansion(props.stage_id))}
           className="stage-list-item-title">Stage {props.index}</div>
      {panel}
    </div>
  );
}

const App = () => {
  return (
    <div className="App">
      {Object.keys(store.stages).map((stage_id, i) => <Stage key={i} index={i} stage_id={stage_id} />)}
      <div onClick={() => dispatch(add_new_stage)}
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
