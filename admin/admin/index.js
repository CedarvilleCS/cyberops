// ================================================================================
// The following code delimited by comments was adapted very closely from the
// following two blog posts by the medium user 'deathmood':
//
// https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060
// https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76
//
// Refer to these posts for troubleshooting and perhaps to more fully implement
// the approach (not every feature was added to this codebase because a
// conservative, add-features-as-you-need-them approach is being taken for this
// adaptation).
// ================================================================================

const h = (type, props, ...children) => {
  return {
    type: type,
    children: children,
    props: props || {},
    handlers: {},
    force_update: false
  };
};
const c = (type, classes, ...children) => h(type, { className: classes}, ...children);
const div = (classes, ...children) => c('div', classes, ...children);
const img = src => h('img', { src });
const with_click = (node, f) => {
  node.handlers.click = f;
  return node;
};

const setProp = (node, k, v) => {
  if (k === 'className') {
    node.setAttribute('class', v)
  } else if (k === 'value') {
    node.value = v;
  } else {
    node.setAttribute(k, v);
  }
};

const removeProp = (node, k) => {
  if (k === 'className') {
    node.removeAttribute('class')
  } else {
    node.removeAttribute(k);
  }
};

const createElement = node => {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  } else {
    let e = document.createElement(node.type);
    for (let key in node.props) {
      setProp(e, key, node.props[key]);
    }
    for (let evt in node.handlers) {
      e.addEventListener(evt, node.handlers[evt]);
    }
    for (let child of node.children.map(createElement)) {
      e.appendChild(child);
    }
    return e;
  }
};

const changed = (l, r) => {
  //if (l.type === 'input' && r.type === 'input') console.log(t_vdom(l), t_vdom(r))
  return typeof l !== typeof r ||
    typeof l === 'string' && l !== r ||
    l.type !== r.type ||
    l.force_update;
};

const updateProps = (target, newProps, oldProps) => {
  const props = Object.assign({}, newProps, oldProps);
  for (let key in props) {
    let newVal = newProps[key];
    let oldVal = oldProps[key];
    if (!newProps.hasOwnProperty(key)) {
      removeProp(target, key);
    } else if (!oldProps.hasOwnProperty(key) || newVal !== oldVal) {
      setProp(target, key, newVal);
    }
  }
};

const updateHandlers = (target, newHandlers, oldHandlers) => {
  for (let key in oldHandlers) {
    target.removeEventListener(key, oldHandlers[key]);
  }
  for (let key in newHandlers) {
    target.addEventListener(key, newHandlers[key]);
  }
};

const updateElement = (parent, newNode, oldNode, currentChild) => {
  if (!oldNode) {
    parent.appendChild(createElement(newNode));
  } else if (!newNode) {
    parent.removeChild(currentChild);
  } else if (changed(newNode, oldNode)) {
    parent.replaceChild(createElement(newNode), currentChild);
  } else if (newNode.type) {
    updateProps(currentChild, newNode.props, oldNode.props);
    updateHandlers(currentChild, newNode.handlers, oldNode.handlers);
    const loopIters = Math.max(newNode.children.length, oldNode.children.length);
    const childNodes = Array.from(currentChild.childNodes);
    for (let i = 0; i < loopIters; i++) {
      updateElement(currentChild, newNode.children[i], oldNode.children[i], childNodes[i]);
    }
  }
};

// Function only useful for debugging
const trace_vdom = node => {
  if (typeof node === 'string') {
    return node;
  } else {
    return [node.type, node.children.map(trace_vdom)];
  }
};

const t_vdom = node => JSON.stringify(trace_vdom(node));

// ================================================================================
// ================================================================================

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

const default_stage_type_id = 'reconnaissance';

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

const checkbox = property => lens => {
  let update = new_value => store_action(store => {
    console.log('checked happened');
    return L.set([lens, property], new_value, store);
  });
  let is_checked = L.get([lens, property], store);
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
    c('label', '', property));
};

const checklist = prop_list => column(prop_list.map(property => prop(property, checkbox(property))));

const message_item = lens => {
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

const action_item = column([
  remove_button,
  prop('type', stage_type_selector),
  prop('credits', input('number')),
  prop('text', input())]);

const text = text => lens => div('', text);

const network_portion = net => column([
  titled_prop('computers', checklist(net.computers)),
  titled_prop('networks', checklist(net.networks)),
  titled_prop('connections',
    checklist(net.connections.map(x => x.computer + ':' + x.network)))
])

const default_action = { text: "", type: default_stage_type_id };
const default_message = "";
const stage = lens => {
  const x = L.get(lens, store);
  let title = `Type: ${snake_to_words(x.type)}, Duration: ${x.time_limit}, Credits: ${x.credit_limit}, Messages: ${x.messages.length}, Actions: ${x.actions.length}`;
  return collapsible(title,
    column([
      row([
        titled_prop('type', stage_type_selector),
        column([
          titled_prop('time_limit', input('number')),
          titled_prop('credit_limit', input('number'))
        ])
      ]),
      row([
        titled_prop('messages', list(default_message, message_item)),
        titled_prop('actions', list(default_action, action_item)),
        titled_prop('home_network', network_portion(store.home_network)),
        titled_prop('enemy_network', network_portion(store.enemy_network))
      ])
    ]))(lens);
};

const empty_network = {
  computers: [],
  networks: [],
  connections: []
};

const default_stage = {
  type: default_stage_type_id,
  time_limit: 0,
  credit_limit: 0,
  messages: [],
  actions: [],
  home_network: empty_network,
  enemy_network: empty_network
};

const network = row([
  titled_prop('computers', list('', removeable(input('text', 'computers')))),
  titled_prop('networks', list('', removeable(input('text', 'networks')))),
  titled('Connections', column([
    prop('connections', list({computer: '', network: ''},
      removeable(row([
        prop('computer', input('text', 'computer')),
        prop('network', input('text', 'network'))]))))
  ]))
]);

const game = column([
  row([
    titled_prop('name', input())
  ]),
  prop('home_network', collapsible('Home Network', network, true)),
  prop('enemy_network', collapsible('Enemy Network', network, true)),
  titled_prop('stages', list(default_stage, stage, (_, i) => "stage " + i))
], true);

const default_game = {
  name: 'unnamed', 
  stages: [],
  home_network: empty_network,
  enemy_network: empty_network
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
