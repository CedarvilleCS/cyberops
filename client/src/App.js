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
	service_type: 'remote_login' | 'database' | 'web_server';
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

type Actions =
	{| action_type: 'administration', target_nodes: Array<Node> |} |
	{| action_type: 'update_software', target_nodes: Array<Node> |} |
	{| action_type: 'research', target_nodes: Array<Node> |} |
	{| action_type: 'audit', target_nodes: Array<Node> |};

type Malware = Array<Vulnerability>;

type Network = {
	edges: Array<Edge>,
	nodes: Array<Node>
};

type InitGame = {| 
	event_type: 'init_game',
	player_network: Network,
	force_units: number,
	resources: Array<ResourceType>,
	player_network: Network
|};

type Message = {|
	event_type: 'message',
	text: string
|};

type WaitForAction = {|
	event_type: 'wait_for_action',
	time_allowed: number
|};

type Event = InitGame | Message | WaitForAction

type Game = {|
	prompts: Array<string>,
	force_units: number,
	player_network: Network,
	opponent_network: Network
|};

let game_tree_index = 0;
const game_tree: Array<Event> = [
	{ event_type: 'message',
		text: "Hello! You are the master administrator for your countries Cyber Warfare department. You have been tasked with completing a mission which will be described shortly." },
	{ event_type: 'message',
		text: "Throughout your campaign, you will receive status updates and notifications in this panel." }
];

const poll_server = (): Event => {
	if (game_tree_index < game_tree.length) {
		let result = game_tree[game_tree_index];
		game_tree_index++;
		return result;
	} else {
		return { event_type: 'message', text: "The game is over" };
	}
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
		{ id: 1, label: 'Internal Network', node_type: 'lan'},
		{ id: 2, label: 'External Network', node_type: 'lan'},
		{ id: 3, label: 'Windows 2003 SQL', node_type: 'computer', services: [] },
		{ id: 4, label: 'Windows 2008 Server', node_type: 'computer', services: [] },
		{ id: 5, label: 'BackTrack 5', node_type: 'computer', services: [] },
		{ id: 6, label: 'Windows XP Pro', node_type: 'computer', services: [] },
		{ id: 7, label: 'Windows 2003 Server [Firewall]', node_type: 'computer', services: [] },
		{ id: 8, label: 'Linux Sniffer', node_type: 'computer', services: [] },
		{ id: 9, label: 'BackTrack 5', node_type: 'computer', services: [] },
		{ id: 10, label: 'Windows 7', node_type: 'computer', services: [] },
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

type Store = {
	game: Game,
};

let store: Store = {
	game: {
		prompts: [],
		force_units: 0,
		player_network: sample_graph,//{ edges: [], nodes: [] },
		opponent_network: sample_opp_graph, //{ edges: [], nodes: [] }
	}
}

const dispatch = action => {
  store = action(store);
  render();
}

const game_reducer = (game: Game, action: Event): Game => {
	if (action.event_type === 'message') {
		return { ...game, prompts: [action.text, ...game.prompts] };
	} else {
		return game;
	}
};

const update_game_state = store => {
	let event = poll_server();
	return { ...store, game: game_reducer(store.game, event) };
};

const select_node = (node_id, is_friendly) => store => {
		if (is_friendly) {
			return {...store, selected_player_node: node_id };
		} else {
			return {...store, selected_opponent_node: node_id };
		}
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
		nodes: props.network.nodes.map(node => {
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
	console.log('making network');
	console.log(network);

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


const NodeInspector = props => {
	return (
		<div className="node-inspector">
			<NodeProperty prop_key={"Name"} value={props.node.label}/>
			<NodeProperty prop_key={"Type"} value={props.node.node_type}/>
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
