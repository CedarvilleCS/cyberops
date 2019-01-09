import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';

const UPDATE_SLIDER = 'UPDATE_SLIDER';

let store = [10, 20, 30];

const dispatch = action => {
  store = appReducer(store, action);
  render();
}

const appReducer = (store, action) => {
  let newStore = store.slice();
  if (action.type === UPDATE_SLIDER) {
    console.log(action);
    newStore[action.sliderIndex] = action.value;
  }
  return newStore;
};

const get_event_offset_x = event => {
  return event.offsetX || event.pageX - event.currentTarget.offsetLeft - 10;//event.layerX - event.target.offsetLeft;
};

const updateSliderAction = (sliderIndex, event) => {
  console.log(event);
  console.log(event.relatedTarget);
  console.log(event.target);
  let width = event.currentTarget.clientWidth - 20;
  let click_x = get_event_offset_x(event);
  let new_value = Math.min(click_x / width * 100.0, 100);
  console.log(event.type, width, click_x, new_value);
  console.log(event.layerX, event.currentTarget, event.originalEvent);
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

const resourceSliderReducer = (state, index) => {
  console.log('clicked ' + index);
  store[index] += 30;
};

const App = () => {
  console.log(store);
  return (
    <div className="app">
      <header className="app-header">
        {store.map((_, i) => ResourceSlider(i))}
      </header>
    </div>
  );
};

const ResourceSlider = i => {
  console.log(i);
  return (
    <div key={i} 
         className="resource-slider" 
         onClick={(e) => dispatch(updateSliderAction(i, e))} 
         onMouseMove={(e) => sliderMouseMoved(i, e)}
         flex-direction="row">
      <div className="resource-slider-bar" style={{width: store[i] + '%'}}></div>
    </div>
  );
};

export const render = () => ReactDOM.render(<App />, document.getElementById('root'));

export default App;
