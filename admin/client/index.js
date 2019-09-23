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
let survey_index = 0;
let user_email = null;
let game = null;
let game_name = null;
let game_listing = null;
let game_over = false;
let survey_done = false;
let patt = new RegExp("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
let action_selected = false;
let survey_selected = false;


const curr_stage = () => game.stages[stage_index] || game.stages[game.stages.length - 1];
const curr_survey = () => game.survey[survey_index] || game.survey[game.survey.length - 1];

const dispatch = f => () => {
  f();
  render();
};

const dispatch_survey = (f, ans, type) => () => {
  f(ans, type);
  render();
}

const toggle_action_selection = (action) => {
  if (action.is_selected) {
    if (action_selected){
      document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
    }
    action_selected = false;
    delete action.is_selected;
  } else {
    for (let act of curr_stage().actions){
      delete act.is_selected;
    }
    if (!action_selected) {
      document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button");
    }
    action_selected = true;
    action.is_selected = true;
  }
}



const type_to_title = {
  reconnaissance: 'Reconnaissance',
  weaponization: 'Weaponization',
  delivery: 'Delivery',
  exploitation: 'Exploitation',
  installation: 'Installation',
  command_and_control: 'Command And Control',
  actions_on_objectives: 'Actions On Objectives'
};

const action_box = (action) => {
  let classes = 'flex-col action-box';
  if (action.is_selected) {
    classes += ' action-box-selected';
  } else {
    classes += ' action-box-disabled';
  }
  let content = div('action-content', img(`./${action.type}.svg`), div('', action.text));
  let title = type_to_title[action.type];
  //action.is_selected = true;
  return with_click(
    div(classes,
      div('action-title', title),
      content),
    dispatch(() => toggle_action_selection(action)));
};

const increment_stage = () => {
  if(!(curr_stage().actions.length == 0 || action_selected)){
    return;
  }
  action_selected = false;
  if (stage_index < game.stages.length) {
    stage_index++;
  }
  if (stage_index === game.stages.length) {
    console.log('game over');
    game_over = true;
  } else if (curr_stage().actions.length != 0){
    document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
  }

};

const increment_survey = () => {

  if(document.getElementsByClassName('continue-button').length == 0){
    return;
  }
  if (survey_index < game.survey.length) {
    survey_index++;
  }
  if (survey_index == game.survey.length) {
    console.log('done with survey');
    survey_done = true;
    document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
  } else if (curr_survey().type != 'short_answer' || curr_survey().type != 'message'){
    document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
  }
  if(document.getElementsByClassName('content-container').length != 0){
    for (var i = 0; i < document.getElementsByClassName('content-container')[0].children.length; i++) {
      if(document.getElementsByClassName('content-container')[0].children[i].className == 'answer-container-checked'){
        document.getElementsByClassName('content-container')[0].children[i].className = 'answer-container';
      }
    }
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
      if(ev.code == "Enter" && patt.test(user_email)){
        game = get_request(`/api/request/${user_email}`);
        game_name = game.name;
        render();
      }
    }
  }
};

const stage_type_panel = () => {
  return div('flex-col stage-type-panel', ...Object.keys(type_to_title).map(type => {
    if (curr_stage().type === type) {
      return h('img', { className: 'invert', src: `./${type}.svg` });
    } else {
      return img(`./${type}.svg`)
    }
  }))
};

const checkSelection = (answer_text, type) => {
  let answer = null;
  for(let answerbox of document.getElementsByClassName('content-container')[0].children){
    if (answerbox.innerHTML == answer_text){
      answer = answerbox;
      break;
    }
  }
  if (type == 'multiple_choice'){
    if (answer.className != 'answer-container-checked'){
      for(let ans of document.getElementsByClassName('answer-container-checked')){
        ans.className = 'answer-container';
      }
      answer.className = 'answer-container-checked';
      if(document.getElementsByClassName('continue-button-disabled').length !=0){
        document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button");
      }
      if(document.getElementsByClassName('content-container').length != 0){
        for (var i = 0; i < document.getElementsByClassName('content-container')[0].children.length; i++) {
          if(document.getElementsByClassName('content-container')[0].children[i].className == 'answer-container'){
            curr_survey().selection = [i];
            break;
          }
        }
      }
    }
  }
  else if (type == 'select_all'){
    if (answer.className == 'answer-container-checked'){
      answer.className = 'answer-container';
      if(document.getElementsByClassName('answer-container-checked').length == 0){
        document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
      }

    } else {
      answer.className = 'answer-container-checked';
      if(document.getElementsByClassName('continue-button').length == 0){
        document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button");
      }
    }
  }
  curr_survey().selection = [];
  if(document.getElementsByClassName('content-container').length != 0){
    for (var i = 0; i < document.getElementsByClassName('content-container')[0].children.length; i++) {
      if(document.getElementsByClassName('content-container')[0].children[i].className == 'answer-container-checked'){
        curr_survey().selection.push(i);
      }
    }
  }
};

const app = () => {
  if (game) {
    let continue_button = with_click(div('continue-button', 'Continue'), dispatch(increment_stage));
    let game_result_div = h('div', {style: 'display:none'});
    let game_intro_div = h('div', {style: 'display:none'});
    let game_survey_div = h('div', {style: 'display:none'});
    if(game.stages.length == 0){
      game_over = true;
    }
    if (game_over) {
      if(survey_done){
        continue_button = div('continue-button-disabled', 'Continue');
        post_request('/api/', {
          email: user_email,
          name: game_name,
          game: game
        });
        return div('app',
          game_result_div,
          div('app-content flex-col',
            div('main-content flex-row',
            div('dashboard-container',
              div('panel-content',
                div('logo-content',
                img(`./dardania.svg`, "width", "50")),
                div('panel-header', 'Stages'),
                stage_type_panel())),
              div('message-bar-container panel-container',
                div('panel-content',
                  div('panel-header', 'Messages'))),
              div('action-panel-container panel-container',
                div('panel-content',
                  div('panel-header', 'Actions')))),
            continue_button));
      }
      continue_button = with_click(div('continue-button-disabled', 'Continue'), dispatch(increment_survey));
      if(curr_survey().answers.length == 0){
        continue_button = with_click(div('continue-button', 'Continue'), dispatch(increment_survey));
      }
      game_survey_div = div('game-survey',
                          div('question-container', curr_survey().question),
                            div('content-container', ...curr_survey().answers.map((answer, i) => with_click(div('answer-container', answer), dispatch_survey(checkSelection, answer, curr_survey().type)))));

      return div('app',
        game_survey_div,
        div('app-content flex-col',
          div('main-content flex-row',
          div('dashboard-container',
            div('panel-content',
              div('logo-content',
              img(`./dardania.svg`, "width", "50")),
              div('panel-header', 'Stages'),
              stage_type_panel())),
            div('message-bar-container panel-container',
              div('panel-content',
                div('panel-header', 'Messages'))),
            div('action-panel-container panel-container',
              div('panel-content',
                div('panel-header', 'Actions')))),
          continue_button));
    }
    if (curr_stage().type == "pop_up"){
      game_intro_div = div("game-intro", ...curr_stage().messages.map((message, i) => div('message-container', (message.file != "") ? img(`./${message.file}` , "width", "50px"): "", message.text)));
      return div('app',
        game_intro_div,
        div('app-content flex-col',
          div('main-content flex-row',
          div('dashboard-container',
            div('panel-content',
              div('logo-content',
              img(`./dardania.svg`, "width", "50")),
              div('panel-header', 'Stages'),
              stage_type_panel())),
            div('message-bar-container panel-container',
              div('panel-content',
                div('panel-header', 'Messages'))),
            div('action-panel-container panel-container',
              div('panel-content',
                div('panel-header', 'Actions')))),
          continue_button));
    }
    else {
      return div('app',
        game_result_div,
        div('app-content flex-col',
          div('main-content flex-row',
          div('dashboard-container',
            div('panel-content',
            div('logo-content',
            img(`./dardania.svg`, "width", "50")),
              div('panel-header', 'Stages'),
              stage_type_panel())),
            div('message-bar-container panel-container',
              div('panel-content',
                div('panel-header', 'Messages'),
                ...curr_stage().messages.map((message, i) => div('message-container', (message.file != "") ? img(`./${message.file}` , "width", "50px"): "", message.text)))),
            div('action-panel-container panel-container',
              div('panel-content',
                div('panel-header', 'Actions'),
                ...curr_stage().actions.map(action =>
                  action_box(action))))),
          continue_button));
        }
  } else {
    return div('start-screen',
      div('start-header', 'Enter your email to get started'), user_email_input)}
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
