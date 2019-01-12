import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';

const UPDATE_SLIDER = 'UPDATE_SLIDER';

const resource = (n, mu) => {
  return { name: n, units: 3, max_units: mu };
}

let store = {
  total_units: 15,
  resources: [
    resource('research and development', 4),
    resource('hacking', 6),
    resource('firewalling', 5)
  ]
}

const dispatch = action => {
  store = app_reducer(store, action);
  render();
}

const app_reducer = (store, action) => {
  let new_resources = store.resources.slice();
  console.log(action);
  if (action.type === UPDATE_SLIDER) {
    let resource = new_resources[action.sliderIndex];
    new_resources[action.sliderIndex] = slider_reducer(resource, action);
  }
  return {
    total_units: store.total_units,
    resources: new_resources
  };
};

const slider_reducer = (slider, action) => {
  return {
    name: slider.name,
    units: Math.max(0, Math.min(Math.floor(action.value + 0.5), slider.max_units)),
    max_units: slider.max_units
  }
};

const get_event_offset_x = event => {
  return event.offsetX || event.pageX - event.currentTarget.offsetLeft - 10;
};

const updateSliderAction = (sliderIndex, event) => {
  let resource = store.resources[sliderIndex];
  let width = event.currentTarget.clientWidth - 20;
  let click_x = get_event_offset_x(event);
  let new_value = Math.min(click_x / width * resource.max_units, 100);
  return {
    type: UPDATE_SLIDER,
    sliderIndex: sliderIndex,
    value: new_value
  };
};

const sliderMouseMoved = (sliderIndex, event) => {
  console.log(event.buttons);
  if (event.buttons > 0) {
    dispatch(updateSliderAction(sliderIndex, event));
  }
};

const App = () => {
  console.log(store);
  return (
    <div className="app">
      <header className="app-header">
        <div className="resource-container">
          {store.resources.map(ResourceSlider)}
        </div>
      </header>
    </div>
  );
};

const ResourceSlider = (resource, i) => {
  let percentage = resource.units / resource.max_units * 100.0;
  return (
    <div key={i} className="resource">
            <div><b>{resource.name}:</b> {resource.units} / {resource.max_units}</div>
      <div className="resource-slider"
            onClick={(e) => dispatch(updateSliderAction(i, e))}
            onTouch={(e) => dispatch(updateSliderAction(i, e))}
            onMouseMove={(e) => sliderMouseMoved(i, e)}
            onTouchMove={(e) => sliderMouseMoved(i, e)}
            flex-direction="row">
        <div className="resource-slider-bar" style={{width: percentage + '%'}}></div>
      </div>
    </div>);
};

export const render = () => ReactDOM.render(<App />, document.getElementById('root'));

export default App;
