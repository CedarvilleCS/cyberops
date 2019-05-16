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
//
// Notes regarding updates from the posts:
// Since we do not intend to use the JSX syntax, we do not need to detect
// custom properties or event handlers; we can simply put them in their own
// properties. Since updating event handlers is cheap (it does not force
// re-layout), every updateElement call removes all the old event handlers and
// adds all the new ones, even if there technically is no change.
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

const get_request = url => {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);
  return JSON.parse(xhr.responseText);
};

let stage_index = 0;
let game = null;
let game_listing = null;
let game_over = false;

const curr_stage = () => game.stages[stage_index] || game.stages[game.stages.length - 1];

const dispatch = f => () => {
  f();
  render();
};

const used_credits = () => {
  let result = 0;
  for (let action of curr_stage().actions) {
    if (action.is_selected) {
      result += parseInt(action.credits);
    }
  }
  return result;
};

const toggle_action_selection = (action, credit_limit) => {
  if (action.is_selected) {
    console.log('deselecting');
    delete action.is_selected;
  } else if (used_credits() + action.credits <= credit_limit) {
    console.log('selecting');
    action.is_selected = true;
  }
}

const graph = in_network => {
  return h('svg', {height: 100, width: 100},
    ...in_network.networks.map((network, i) => {
      return h('square', {width: 25, height: 25, color: 'yellow', x: 10, y: 30 * i})
    })
  );
};

const network_panel = (in_network, is_friendly) => {

	// Change edge color and network title based on who owns the network.
	let edge_color = {
		color: '#3333ff',
		highlight: '#aaaaff',
		hover: '#6666ff',
		inherit: 'from'
	};
	let network_name = "Your Network";
	if (!is_friendly) {
		edge_color = {
			color: '#ff3333',
			highlight: '#ffaaaa',
			hover: '#ff6666'
		}
		network_name = "Opponent Network";
	}

	let network_options = {
		autoResize: true,
		edges: {
			color: edge_color,
			width: 2,
			arrows: {
				to: {
					enabled: false
				},
				from: {
					enabled: false
				}
			}
		},
		interaction: {
			hover: true
		}
	};

  let transformed_network = {
    nodes: [
      ...in_network.computers.map(c => {
        return {
          id: c,
          node_type: 'computer',
          label: c
        };
      }),
      ...in_network.networks.map(n => {
        return {
          id: n,
          node_type: 'lan',
          label: n
        };
      })
    ],
    edges: []
  };

	let network = {
		...transformed_network,
		nodes: transformed_network.nodes.map(node => {
			let node_shape = 'ellipse';
			let node_color = 'lightgreen';
			if (node.node_type === 'computer') {
				node_shape = 'box';
				node_color = 'lightblue';
			}
			return {
				...node,
				shape: node_shape,
				color: node_color
			}
		})
	};
	return div('graph',
      div('graph-title', network_name),
      div('graph-container', 'Put Graph Component Here',
        graph(in_network),
        network_inspector(network, is_friendly)));
};

const service_box = service => {
  return div('service',
      div('service-name', service.name),
      div('service-version', service.version));
};

const node_inspector = node => {
  let services = [];
  //if (node.node_type === 'computer') {
  //  services = node.services;
  //}
	return div('node-inspector',
    div('flex-row',
      div('node-label', node.label),
      div('node-type', node.node_type)),
    ...services.map(service => service_box(service)));
};

const network_inspector = network => {
	return div('graph-inspector', ...network.nodes.map(node_inspector));
};

const action_box = (action, credit_limit) => {
  let classes = 'flex-col action-box';
  if (action.is_selected) {
    classes += ' action-box-selected';
  } else if (used_credits() + action.credits > credit_limit) {
    classes += ' action-box-disabled';
  }
  let content = div('');
  let title = '';
  if (action.type === 'update_service') {
    title = 'Update Service';
    content = div('',
      div('flex-row service-update-row',
        div('', 'Old'),
        service_box(action.old_service)),
      div('flex-row service-update-row',
        div('', 'New'),
        service_box(action.new_service)));
  } else if (action.type === 'reconnaissance') {
    title = 'Reconnaissance';
    content = div('', img('./reconnaissance.png'), div('', action.text));
  } else if (action.type === 'weaponization') {
    title = 'Weaponization';
    content = div('', img('./weaponization.png'), div('', action.text));
  } else if (action.type === 'delivery') {
    title = 'Delivery';
    content = div('', img('./delivery.png'), div('', action.text));
  } else if (action.type === 'exploitation') {
    title = 'Exploitation';
    content = div('', img('./exploitation.png'), div('', action.text));
  } else if (action.type === 'installation') {
    title = 'Installation';
    content = div('', img('./installation.png'), div('', action.text));
  } else if (action.type === 'actions_on_objectives') {
    title = 'Actions On Objectives';
    content = div('', img('./actions_on_objectives.png'), div('', action.text));
  }
  //action.is_selected = true;
  return with_click(
    div(classes,
      div('action-title', title),
      content,
      div('action-footer', `${action.credits || 0} Credits`)),
    dispatch(() => toggle_action_selection(action, credit_limit)));
};

const increment_stage = () => {
  if (stage_index < game.stages.length) {
    stage_index++;
  } else {
    game_over = true;
  }
};

const app = () => {
  if (game) {
    let continue_button = with_click(div('continue-button', 'Continue'), dispatch(increment_stage));
    if (game_over) {
      continue_button = div('continue-button-disabled', 'Continue');
    }
    let credit_limit = parseInt(curr_stage().credit_limit || 0);
    return div('app',
        div('app-content flex-col',
          div('main-content flex-row',
            div('message-bar-container panel-container',
              div('panel-content',
                div('panel-header', 'Messages'),
                ...curr_stage().messages.map((message, i) => div('message-container', message)))),
            div('dashboard-container',
              div('dashboard flex-col',
                div('player-graphs flex-row',
                  network_panel(game.home_network, true),
                  network_panel(game.enemy_network, false)))),
            div('action-panel-container panel-container',
              div('panel-content',
                div('panel-header', 'Actions'),
                div('credit-status', `${used_credits()} / ${credit_limit} Credits`),
                ...curr_stage().actions.map(action =>
                  action_box(action, credit_limit))))),
        continue_button));
  } else {
    let games = get_request('/api/');
    return div('game-selector', ...games.map(game_name => 
      with_click(div('game-selection-option', game_name),
        dispatch(() => game = get_request(`/api/${game_name}`))
      )));
  }
};

let current_vdom = null;
const render = () => {
	let root = document.getElementById('root');
	if (root) {
    let new_vdom = app();
    updateElement(root, new_vdom, current_vdom, root.childNodes[0]);
    current_vdom = new_vdom;
	}
};
render();
