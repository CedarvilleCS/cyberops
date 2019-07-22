const get_request = url => {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);
  return JSON.parse(xhr.responseText);
};

const post_request = (url, data) => {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', url, false);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
  return xhr.responseText;
};

let stage_index = 0;
let user_email = null;
let game = null;
let game_name = null;
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
    delete action.is_selected;
  } else if (used_credits() + action.credits <= credit_limit) {
    action.is_selected = true;
  }
}

const graph = in_network => {
  let max_net_comps = Math.max(in_network.networks.length, in_network.computers.length);
  //Don't know how to fix the svg error, if removed, sizes get messed up
  return svg(300, '400px',//40*(max_net_comps - 1) + 36,
    ...in_network.networks.map((network, i) =>
      g(rect(3, 40*i + 3, 100, 30),
        h('text', {x: 8, y: 40*i + 23, fill: 'black'}, network))),
    ...in_network.computers.map((computer, i) =>
      g(rect(200, 40*i + 3, 97, 30),
        h('text', {x: 208, y: 40*i + 23, fill: 'black'}, computer))),
    ...in_network.connections.map(conn => {
      let c_i = in_network.computers.indexOf(conn.computer);
      let n_i = in_network.networks.indexOf(conn.network);
      return h('line', {x1: 103, y1: 40*n_i + 15, x2: 200, y2: 40*c_i + 15, style: 'stroke:rgb(255,0,0);stroke-width:2' })
    }));
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
      div('graph-container',
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

const type_to_title = {
  reconnaissance: 'Reconnaissance',
  weaponization: 'Reconnaissance',
  delivery: 'Reconnaissance',
  exploitation: 'Reconnaissance',
  installation: 'Reconnaissance',
  command_and_control: 'Command And Control',
  actions_on_objectives: 'Actions On Objectives'
};

const action_box = (action, credit_limit) => {
  let classes = 'flex-col action-box';
  if (action.is_selected) {
    classes += ' action-box-selected';
  } else if (used_credits() + action.credits > credit_limit) {
    classes += ' action-box-disabled';
  }
  let content = div('action-content', img(`./${action.type}.svg`), div('', action.text));
  let title = type_to_title[action.type];
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
  }
  if (stage_index === game.stages.length) {
    console.log('game over');
    game_over = true;
  }
};

const user_email_input =  {
  type: 'input',
  props: {
    type: 'text',
    style: 'font-size: 20px',
    value: user_email,
    placeholder: 'Email',
    autofocus: true
  },
  children: [],
  handlers: {
    keypress: ev => {
      user_email = ev.target.value;
      render();
    }
  }
};

const stage_type_panel = () => {
  return div('flex-row stage-type-panel', ...Object.keys(type_to_title).map(type => {
    if (curr_stage().type === type) {
      return h('img', { className: 'invert', src: `./${type}.svg` });
    } else {
      return img(`./${type}.svg`)
    }
  }))
};

const app = () => {
  if (game) {
    let continue_button = with_click(div('continue-button', 'Continue'), dispatch(increment_stage));
    let game_result_div = h('div', {style: 'display:none'})
    if (game_over) {
      post_request('/api/', {
        email: user_email,
        name: game_name,
        game: game
      });
      continue_button = div('continue-button-disabled', 'Continue');
      let game_result_text = 'You Lose.';
      if (game.is_win) {
        game_result_text = 'You Win!!';
      }
      game_result_div = div('game-result', game_result_text);
    }
    let credit_limit = parseInt(curr_stage().credit_limit || 0);
    return div('app',
      game_result_div,
      div('app-content flex-col',
        div('main-content flex-row',
          div('message-bar-container panel-container',
            div('panel-content',
              div('panel-header', 'Messages'),
              ...curr_stage().messages.map((message, i) => div('message-container', message)))),
          div('dashboard-container',
            div('dashboard flex-col',
              div('player-graphs flex-column',
                network_panel(game.home_network, true),
                stage_type_panel(),
                network_panel(game.enemy_network, false)))),
          div('action-panel-container panel-container',
            div('panel-content',
              div('panel-header', 'Actions'),
              div('credit-status', `${used_credits()} / ${credit_limit} Credits`),
              ...curr_stage().actions.map(action =>
                action_box(action, credit_limit))))),
        continue_button));
  } else {
    let games = get_request(`/api/`);
    return div('start-screen',
      div('start-header', 'Enter your email to get started'),
      with_enter(user_email_input,
        dispatch(() => {
          game = get_request(`/api/request`);
          game_name = game.name;
        })
      ),
      /*with_click(div('email-input-continue', 'Continue'),
        dispatch(() => {
          game = get_request(`/api/request`);
          game_name = game.name;
        })
      )*/);
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
