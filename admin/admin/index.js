const L = window.require('partial.lenses');
const electron = window.require('electron');
const fs = window.require('fs');
const ipcRenderer = electron.ipcRenderer;

let store = null;

const store_action = action => {
  store = action(store);
  console.log('current store:', store);
  render();
}

const default_stage_type_id = 'pop_up';

const row = items => lens => {
  return div('flex-row', ...items.map(item => item(lens)));
};

const column = items => lens => {
  return div('flex-col', ...items.map(item => item(lens)));
};

const prop = (prop_name, view) => lens => view([lens, prop_name]);

const titled = (title, element) => column([() => c('h4', '', title), element]);
const labeled = (title, element) => column([() => div('', title), element]);

const capitalize_first_letter = s => s.charAt(0).toUpperCase() + s.slice(1);
const snake_to_words = s => s.split('_').map(capitalize_first_letter).join(' ');

const titled_prop = (p, element) => titled(snake_to_words(p), prop(p, element));
const labeled_prop = (p, element) => labeled(snake_to_words(p), prop(p, element));

const nothing = lens => div('');

const options = item_types => lens => {
  return div('',
    div('union-type-selector',
      ...item_types.map(i_type => {
        const update_type = () => {
          return store_action(store => L.set(lens, i_type, store));
        };
        let classes = 'union-item-header clickable';
        if (L.get(lens, store) === i_type) {
          classes += ' selected-union-item';
        }
        return with_click(div(classes, snake_to_words(i_type)), update_type);
      })));
};

const stage_type_selector = options([
  'pop_up',
  'blank_action',
  'reconnaissance',
  'weaponization',
  'delivery',
  'exploitation',
  'installation',
  'command_and_control',
  'actions_on_objectives'
]);

const action_type_selector = options([
  'blank_action',
  'reconnaissance',
  'weaponization',
  'delivery',
  'exploitation',
  'installation',
  'command_and_control',
  'actions_on_objectives'
]);

const remove_button = lens => {
  const remove_item = () => store_action(store => {
    console.log('removing');
    return L.remove(lens, store)
  });
  return with_click(div('remove-button clickable', 'remove'), remove_item);
};

const removeable = ui => lens => {
  return div('removeable', ui(lens), remove_button(lens));
};

const collapsible = (title, element, permanent) => lens => {
  const toggle_expansion = () => store_action(store =>
    L.modify([lens, 'is_expanded'], x => !x, store));

  let panel = div('');

  if (L.get([lens, 'is_expanded'], store)) {
    panel = element(lens);
  }
  return div('collapsible-container',
    div('collapsible-titlebar',
      with_click(div('clickable collapse-button', title || 'unnamed'), toggle_expansion),
      permanent ? div('') : remove_button(lens)),
    panel);
}

const add_button = default_item => lens => {
  const add_item = () => store_action(store => {
    console.log('adding item');
    return L.set([lens, L.appendTo], default_item, store)
  });
  return with_click(div('clickable add-button', 'new'), add_item);
}

const list = (default_item, template) => lens => {
  const actual_items = L.get(lens, store);
  return column([
    column([...actual_items.map((actual_item, i) => prop(i, template))]),
    add_button(default_item)
  ])(lens);
};

const checkbox = label => lens => {
  let update = new_value => store_action(store => {
    console.log('checked happened');
    return L.set(lens, new_value, store);
  });
  let is_checked = L.get(lens, store);
  let checked_obj = {};
  if (is_checked) {
    checked_obj.checked = true;
  }
  //  const check_item = item => store_action(store => {
  //    console.log('checking item');
  //    return L.set(item, true, store)
  //  });
  //  const uncheck_item = item => store_action(store => L.set(item, false, store));
  return div('',
    { type: 'input',
      props: { type: 'checkbox', id: 'prop_check', ...checked_obj },
      children: [],
      handlers: {
        change: ev => update(ev.target.checked)
      }
    },
    c('label', '', label));
};

const checklist = prop_list => column(prop_list.map(property => prop(property, checkbox(property))));

const message_item1 = lens => {
  console.log(lens.flat(100));
  let message_text = L.get(lens, store);
  const update = text => store_action(store => L.set(lens, text, store));
  let textarea = {
    type: 'textarea',
    props: {
      rows: 4,
      value: message_text
    },
    children: [],
    handlers: {
      change: ev => update(ev.target.value)
    }
  };
  return column([
    remove_button,
    () => textarea
  ])(lens);
};

const input = (type, hint) => lens => {
  let actual = L.get(lens, store);
  let update = new_value => store_action(store => L.set(lens, new_value, store));
  return {
    type: 'input',
    props: {
      type: type || 'text',
      value: actual,
      placeholder: hint || ''
    },
    children: [],
    handlers: {
      change: ev => {
        if (type === 'number') {
          return update(parseInt(ev.target.value));
        } else {
          return update(ev.target.value);
        }
      }
    }
  };
};

const text_input = (type, hint, rows) => lens => {
  let actual = L.get(lens, store);
  let update = new_value => store_action(store => L.set(lens, new_value, store));
  return {
    type: 'textarea',
    props: {
      type: type || 'text',
      rows: rows,
      value: actual,
      placeholder: hint || ''
    },
    children: [],
    handlers: {
      change: ev => {
        if (type === 'number') {
          return update(parseInt(ev.target.value));
        } else {
          return update(ev.target.value);
        }
      }
    }
  };
};

const action_item = column([
  remove_button,
  prop('type', action_type_selector),
  prop('text', input())
]);

const text = text => lens => div('', text);

const message_item = column([
  remove_button,
  prop('text', text_input('text','message', 4)),
  prop('file', text_input('file','image file', 1)),
  prop('color', text_input('color', 'text color (use html color names)', 1))]);

const default_action = { text: "", type: default_stage_type_id };
const default_message = {text: "", file: "", color: ""};
const stage = lens => {
  const x = L.get(lens, store);
  let title = `Type: ${snake_to_words(x.type)}, Messages: ${x.messages.length}, Actions: ${x.actions.length}`;
  return collapsible(title,
    column([
        titled_prop('type', stage_type_selector),
        titled_prop('title', input('text', 'title')),
      row([
        titled_prop('messages', list(default_message, message_item)),
        titled_prop('actions', list(default_action, action_item))
      ])
    ]))(lens);
};

const default_stage = {
  type: default_stage_type_id,
  title: '',
  messages: [],
  actions: []
};

const default_question_type_id = "multiple_choice";

const question_type_selector = options([
  'message',
  'multiple_choice',
  'select_all',
  'short_answer',
]);


const default_answer = "Sample Answer";
const question = lens => {
  const x = L.get(lens, store);
  let title = `Type: ${snake_to_words(x.type)}, Answers: ${x.answers.length}`;
  return collapsible(title,
    column([
      row([
        titled_prop('type', question_type_selector),
        titled_prop('question', input('text', 'Sample Question'))
      ]),
        titled_prop('answers', list(default_answer, input())),
    ]))(lens);
};

const default_survey_question = {
  type: default_question_type_id,
  question: "Sample Question",
  answers: [],
};


const game = column([
  titled_prop('name', input()),
  titled_prop('stages', list(default_stage, stage, (_, i) => "stage " + i)),
  titled_prop('survey', list(default_survey_question, question, (_, i) => "question " + i))
], true);

const default_game = {
  name: 'unnamed',
  stages: [],
  survey: []
};

store = default_game;

const app = () => game([])

let filename = null;

ipcRenderer.on('save_as', () => {
  console.log('saving!!!!!!!!!!!!!!!!');
  filename = electron.remote.dialog.showSaveDialog();
  if (filename) {
    fs.writeFileSync(filename, JSON.stringify(store));
  }
});

ipcRenderer.on('save', () => {
  console.log('saving!!!');
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

let current_vdom = null;
const render = () => {
	let root = document.getElementById('root');
	if (root) {
    let new_vdom = app();
    console.log();
    console.log(t_vdom(new_vdom));
    updateElement(root, new_vdom, current_vdom, root.childNodes[0]);
    current_vdom = new_vdom;
	}
};
render();
