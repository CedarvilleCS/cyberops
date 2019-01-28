// @flow
import Graph from 'react-graph-vis';
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';

type ResourceType = {| name: string |};

type Edge = {
	from: number,
	to: number
};

type Service = {|
	name: string,
	version: string
|};

type Vulnerability = {|
	can_sabotage: bool,
	can_surveil: bool,
	can_dos: bool,
	can_execute: bool,
	name: string
|};

type ComputerNode = {|
	id: number,
	label: string,
	node_type: 'computer',
	services: Array<Service>
|};

type LanNode = {|
	id: number,
	label: string,
	node_type: 'lan'
|};

type Node = ComputerNode | LanNode;

//type Actions =
//	{| action_type: 'administration', target_nodes: Array<Node> |} |
//	{| action_type: 'update_software', target_nodes: Array<Node> |} |
//	{| action_type: 'research', target_nodes: Array<Node> |} |
//	{| action_type: 'audit', target_nodes: Array<Node> |};

type Malware = Array<Vulnerability>;

type Network = {
	edges: Array<Edge>,
	nodes: Array<Node>
};

type WaitForAction = {|
	event_type: 'wait_for_action',
	time_allowed: number
|};

type Action = {|
  action_type: 'update_service', 
  old_service: Service,
  new_service: Service
|};

type Game = {
	prompts: Array<string>,
	player_network: Network,
	opponent_network: Network,
  actions: Array<Action>
};

const new_prompt = s => {
  return { prompts: [s] }
};

const sample_graph = {
	edges: [
		{ from: 1, to: 3 },
		{ from: 1, to: 4 },
		{ from: 1, to: 5 },
		{ from: 1, to: 6 },
		{ from: 1, to: 7 },
		{ from: 1, to: 8 },
		{ from: 2, to: 7 },
		{ from: 2, to: 8 },
		{ from: 2, to: 9 },
		{ from: 2, to: 10 }
	],
	nodes: [
    { id: 1, 
      label: 'Internal Network', 
      node_type: 'lan' },
    { id: 2,
      label: 'External Network',
      node_type: 'lan' },
    { id: 3,
      label: 'Windows 2003 SQL',
      node_type: 'computer',
      services: [
        { name: 'SQL Server', version: '2.03' },
        { name: 'SSH Server', version: '3.65' },
      ] },
    { id: 4,
      label: 'Windows 2008 Server',
      node_type: 'computer', 
      services: [
        { name: 'Apache', version: '3.45' },
        { name: 'Remote Desktop Server', version: '4.25' },
      ] },
    { id: 5,
      label: 'BackTrack 5',
      node_type: 'computer', services: [
        { name: 'SSH Server', version: '3.02' },
      ] },
    { id: 6,
      label: 'Windows XP Pro',
      node_type: 'computer', services: [
        { name: 'Microsoft Office', version: '2.13' },
        { name: 'Google Chrome', version: '1.0' }
      ] },
    { id: 7,
      label: 'Windows 2003 Server [Firewall]',
      node_type: 'computer', services: [
        { name: 'OpenFirewall', version: '31.45' }
      ] },
    { id: 8,
      label: 'Linux Sniffer',
      node_type: 'computer', services: [
        { name: 'Wireshark', version: '13.0' }
      ] },
    { id: 9,
      label: 'BackTrack 5',
      node_type: 'computer', services: [] },
    { id: 10,
      label: 'Windows 7',
      node_type: 'computer', services: [] },
	]
};

const sample_opp_graph = {
	edges: [
		{ from: 1, to: 2 },
		{ from: 1, to: 3 },
		{ from: 1, to: 4 },
		{ from: 1, to: 5 },
		{ from: 2, to: 3 },
		{ from: 2, to: 4 },
		{ from: 2, to: 5 },
		{ from: 3, to: 4 },
		{ from: 3, to: 5 },
		{ from: 4, to: 5 },
	],
	nodes: [
		{ id: 1, label: 'Hello', node_type: 'computer', services: [] },
		{ id: 2, label: 'There', node_type: 'computer', services: [] },
		{ id: 3, label: 'How', node_type: 'computer', services: [] },
		{ id: 4, label: 'Are', node_type: 'computer', services: [] },
		{ id: 5, label: 'You', node_type: 'lan' }
	]
};

let game_tree_index = 0;
const game_tree: Array<Event> = [
	new_prompt("Hello Seth! You have just been hired as the head of Cyber Operations in underwater kingdom of Atlantis."),
  { prompts: ["On your first day at work, your technical assistant takes you on a tour of the Atlantis IT facility and gives you an in-depth briefing about the current state of the kingdom's computer network. In addition, you also learn about the intelligence that has been gathered about the enemy City of Avalon" ],
    player_network: sample_graph, opponent_network: sample_opp_graph },
  new_prompt("The two kingdoms have been at war for 6 months. You've been instructed by your government to execute a DOS attack on the enemy's employment record database."),
  { actions: [
    { action_type: 'update_service', 
      old_service: { name: 'Google Chrome', version: '1.0'},
      new_service: { name: 'Google Chrome', version: '71.0'} },
    { action_type: 'update_service',
      old_service: { name: 'SQL Server', version: '2.03'},
      new_service: { name: 'SQL Server', version: '3.45'} }
  ] }
];

const poll_server = (): Game => {
	if (game_tree_index < game_tree.length) {
		let result = game_tree[game_tree_index];
		game_tree_index++;
		return result;
	} else {
		return { prompts: ["The game is over"] };
	}
};

type Store = {
	game: Game,
};

let empty_network = { nodes: [], edges: [] };

let store: Store = {
	game: {
		prompts: [],
		player_network: empty_network,//{ edges: [], nodes: [] },
		opponent_network: empty_network, //{ edges: [], nodes: [] }
    actions: [
      //      { action_type: 'update_service', 
      //        old_service: { name: 'Google Chrome', version: '1.0'},
      //        new_service: { name: 'Google Chrome', version: '71.0'} },
      //      { action_type: 'update_service',
      //        old_service: { name: 'SQL Server', version: '2.03'},
      //        new_service: { name: 'SQL Server', version: '3.45'} }
    ]
	}
}

const dispatch = action => {
  store = action(store);
  render();
}

const update_network = (old_net: Network, new_stuff): Network => {
  let new_nodes = [...old_net.nodes];
  let new_edges = [...old_net.edges];
  new_stuff.nodes.forEach(new_node => new_nodes[new_node.id] = new_node);
  new_edges = new_edges.concat(new_stuff.edges);
  if (new_stuff.removed_edges) {
    new_stuff.removed_edges.forEach(n => delete new_edges[n]);
  }
  if (new_stuff.removed_nodes) {
    new_stuff.removed_nodes.forEach(n => delete new_nodes[n]);
  }
  return { nodes: new_nodes, edges: new_edges };
};

const game_reducer = (game: Game, action: Event): Game => {
  let new_game = {...game};
  if (action.prompts) {
    new_game.prompts = [...action.prompts, ...game.prompts];
  }
  if (action.player_network) {
    new_game.player_network = update_network(game.player_network, action.player_network);
  }
  if (action.opponent_network) {
    new_game.opponent_network = update_network(game.opponent_network, action.opponent_network);
  }
  if (action.actions) {
    new_game.actions = [...game.actions, ...action.actions];
  }
  console.log('constructed new game', new_game);
  return new_game;
};

const compress_array = arr => {
  let new_arr = [];
  arr.forEach(x => new_arr.push(x));
  return new_arr;
}

const update_game_state = store => {
	let event = poll_server();
	return { ...store, game: game_reducer(store.game, event) };
};

const NetworkPanel = props => {

	// Change edge color and network title based on who owns the network.
	let edge_color = {
		color: '#3333ff',
		highlight: '#aaaaff',
		hover: '#6666ff',
		inherit: 'from'
	};
	let network_name = "Your Network";
	if (!props.friendly) {
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

	let network = {
		...props.network,
		nodes: compress_array(props.network.nodes.map(node => {
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
		}))
	};
	return (
		<div className="graph">
			<div className="graph-title">{network_name}</div>
			<div className="graph-container">
				<Graph graph={network} options={network_options}/>
			</div>
			<NetworkInspector network={network} friendly={props.friendly} />
		</div>
	);
};

const NodeProperty = props => (
	<div className="flex-row">
		<div className="node-prop-key">{props.prop_key}</div>
		<div className="node-prop-value">{props.value}</div>
	</div>
);

const Service = props => {
  return (
    <div className="service">
      <div className="service-name">{props.service.name}</div>
      <div className="service-version">{props.service.version}</div>
    </div>
  );
};

const NodeInspector = props => {
  let services = [];
  if (props.node.node_type === 'computer') {
    services = props.node.services;
  }
	return (
		<div className="node-inspector">
			<div className="flex-row">
				<div className="node-label">{props.node.label}</div>
				<div className="node-type">{props.node.node_type}</div>
			</div>
      {services.map((service, i) => <Service key={i} service={service}/>)}
		</div>
	);
};

const NetworkInspector = props => {
	return (
		<div className="graph-inspector">
			{props.network.nodes.map((node, i) => 
				<NodeInspector key={i} node={node}/>)}
		</div>
	);
};

const Action = props => {
  return (
    <div className="flex-col action-box">
      <div className="action-title">Update</div>
      <div className="flex-row service-update-row">
        <div>Old</div>
        <Service service={props.action.old_service}/>
      </div>
      <div className="flex-row service-update-row">
        <div>New</div>
        <Service service={props.action.new_service}/>
      </div>
    </div>
  );
};

const App = () => {
  console.log(store);
  return (
		<div className="app">
			<div className="app-content flex-col">
				<div className="main-content flex-row">
					<div className="message-bar-container panel-container">
						<div className="panel-content">
							<div className="panel-header">Messages</div>
							{store.game.prompts.map((message, i) => <div className="message-container" key={i}>{message}</div>)}
						</div>
					</div>
					<div className="dashboard-container">
						<div className="dashboard flex-col">
							<div className="player-graphs flex-row">
								<NetworkPanel network={store.game.player_network} friendly={true} />
								<NetworkPanel network={store.game.opponent_network} friendly={false} />
							</div>
						</div>
					</div>
					<div className="action-panel-container panel-container">
						<div className="panel-content">
							<div className="panel-header">Actions</div>
              {store.game.actions.map((action, i) => <Action key={i} action={action} />)}
						</div>
					</div>
				</div>
				<div className="continue-button" onClick={() => dispatch(update_game_state)}>Continue</div>
			</div>
		</div>
  );
};

export const render = (): void => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

export default App;
