// @flow
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

type Network = {
	edges: Array<Edge>,
	nodes: Array<Node>
};

type Action = {|
  id: number,
  action_type: 'update_service', 
  old_service: Service,
  new_service: Service,
  cost: number
|};

type Game = {
	prompts: Array<string>,
	player_network: Network,
	opponent_network: Network,
  actions: Array<Action>,
  allowed_credits: number
};
