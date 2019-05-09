import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
const electron = window.require('electron');
const express = window.require('express');
const fs = window.require('fs');

const app = express();
const port = 3003;

let store = ['hello', 'world'];

app.get('/', (req,res) => res.send(JSON.stringify(store)));

const store_action = action => {
  store = action(store);
  console.log('current store:', store);
  render();
}

const update_files = () => {
	console.log('clicked');
	store = fs.readdirSync('../games');
	render();
};

const start_server = () => {
	app.listen(port, () => console.log(`app listening on port ${port}`));
};

const App = () => {
  return (
    <div>
			<ul>
					{store.map((filename, i) => (<li key={i}>{filename}</li>))}
			</ul>
			<button onClick={() => update_files()}>Refresh</button>
			<button onClick={() => start_server()}>Start Server</button>
    </div>
  );
}

const render = () => {
	let root = document.getElementById('root');
	if (root) {
		ReactDOM.render(<App />, root);
	}
};

update_files();

export default render;
