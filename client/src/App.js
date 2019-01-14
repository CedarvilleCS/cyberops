// @flow
import Graph from 'react-graph-vis';
import Sidebar from 'react-sidebar';
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';

const UPDATE_SLIDER = 'UPDATE_SLIDER';

type Event = InitGame | Message | WaitForAction

type InitGame = {| 
	event_type: 'init_game',
	player_network: Network,
	force_units: number,
	resources: Array<ResourceType>,
	player_network: Network
|};

type ResourceType = {| name: string |};

type Message = {|
	event_type: 'message',
	text: string,
|};

type WaitForAction = {|
	event_type: 'wait_for_action',
	time_allowed: number
|};

type Game = {|
	prompts: Array<string>,
	force_units: number,
	resources: Array<ResourceType>,
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

type Edge = {
	from: number,
	to: number
};

type Node = {
	id: number,
	label: string
}

type Network = {
	edges: Array<Edge>,
	nodes: Array<Node>
};

type ResearchFunding = {|
	node: Node,
	is_defense: bool
|};

type Resource = {
	name: string,
	units: number,
	max_units: number
};

type ResourceGroup = {
	total_units: number,
	resources: Array<Resource>,
	graph: Network
};

const resource = (n, mu): Resource => {
  return { name: n, units: 3, max_units: mu };
}

const sample_graph = {
	edges: [
		{ from: 1, to: 2 },
		{ from: 2, to: 3 },
		{ from: 2, to: 4 },
		{ from: 4, to: 5 },
		{ from: 5, to: 1 },
		{ from: 5, to: 3 }
	],
	nodes: [
		{ id: 1, label: 'A'},
		{ id: 2, label: 'B'},
		{ id: 3, label: 'C'},
		{ id: 4, label: 'D'},
		{ id: 5, label: 'E'}
	]
};

type Store = {
	game: Game,
};

let store: Store = {
	game: {
		prompts: [],
		force_units: 0,
		resources: [],
		player_network: sample_graph,//{ edges: [], nodes: [] },
		opponent_network: { edges: [], nodes: [] }
	}
}

const dispatch = action => {
  store = app_reducer(store, action);
  render();
}

type StoreAction = {| action_type: 'update_game_state' |};

const game_reducer = (game: Game, action: Event): Game => {
	if (action.event_type === 'message') {
		return { ...game, prompts: [action.text, ...game.prompts] };
	} else {
		return game;
	}
};

const app_reducer = (store: Store, action: StoreAction): Store => {
	if (action.action_type === 'update_game_state') {
		let event = poll_server();
		return { ...store, game: game_reducer(store.game, event) };
	}
	else {
		return store;
	}
};

const MessageBar = props => {
	let messages = props.messages;
	return (
		<div className="message-bar">
			<div className="message-header">Messages</div>
			{messages.map((message, i) => <div className="message-container" key={i}>{message}</div>)}
		</div>
	);
};

const network_options = {
	autoResize: true
};

const GraphPanel = props => {
	return (
		<div className="graph">
			<div className="graph-title">{props.network_name}</div>
			<div className="graph-container">
				<Graph graph={store.game.player_network} options={network_options}/>
			</div>
		</div>
	);
};

const App = () => {
  console.log(store);
  return (
		<div className="app">
			<div className="message-bar-container">
				<div className="message-bar">
					<div className="message-header">Messages</div>
					{store.game.prompts.map((message, i) => <div className="message-container" key={i}>{message}</div>)}
				</div>
			</div>
			<div className="dashboard-container">
				<div className="dashboard">
					<div className="player-graphs">
						<GraphPanel network_name="Your Network" />
						<GraphPanel network_name="Opponent Network" />
					</div>
				</div>
			</div>
			<a className="continue-button" onClick={() => dispatch({action_type: 'update_game_state'})}>Continue</a>
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
