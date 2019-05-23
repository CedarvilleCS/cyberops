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

const setProp = (node, k, v) => {
  if (k === 'className') {
    node.setAttributeNS(null, 'class', v)
  } else if (k === 'value') {
    node.value = v;
  } else {
    node.setAttributeNS(null, k, v);
  }
};

const removeProp = (node, k) => {
  if (k === 'className') {
    node.removeAttribute('class')
  } else {
    node.removeAttribute(k);
  }
};

const createElement = (node, child_of_svg) => {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  } else {
    if (node.type === 'svg' || child_of_svg) {
      let xmlns = 'http://www.w3.org/2000/svg';
      let e = document.createElementNS(xmlns, node.type);
      for (let key in node.props) {
        setProp(e, key, node.props[key]);
      }
      for (let evt in node.handlers) {
        e.addEventListener(evt, node.handlers[evt]);
      }
      for (let child of node.children.map(c => createElement(c, true))) {
        e.appendChild(child);
      }
      return e;
    } else {
      let e = document.createElement(node.type);
      for (let key in node.props) {
        setProp(e, key, node.props[key]);
      }
      for (let evt in node.handlers) {
        e.addEventListener(evt, node.handlers[evt]);
      }
      for (let child of node.children.map(c => createElement(c))) {
        e.appendChild(child);
      }
      return e;
    }
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

// ================================================================================
// ================================================================================

const trace_vdom = node => {
  if (typeof node === 'string') {
    return node;
  } else {
    return [node.type, node.children.map(trace_vdom)];
  }
};

// Call this function and print its output to see the structure of a certain
// virtual dom node.
const t_vdom = node => JSON.stringify(trace_vdom(node));

// Below are convenience functions for quickly creating dom trees.
const c = (type, classes, ...children) => h(type, { className: classes }, ...children);
const div = (classes, ...children) => c('div', classes, ...children);
const img = src => h('img', { src });
const svg = (w, height, ...children) => h('svg', {viewBox:`0 0 ${w} ${height}`}, ...children);
const rect = (x, y, width, height, ...children) => h('rect', {x, y, width, height, style:'fill:rgb(255,255,255);stroke-width:3;stroke:rgb(0,0,0)' }, ...children);
const g = (...children) => h('g', {}, ...children);

const with_click = (node, f) => {
  node.handlers.click = f;
  return node;
};
