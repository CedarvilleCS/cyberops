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
let game = null;
let game_name = null;
let game_listing = null;
let game_over = false;
let survey_done = false;
let action_selected = false;
let survey_selected = false;
let actionNum = 1;

const capitalize_first_letter = s => s.charAt(0).toUpperCase() + s.slice(1);
const snake_to_words = s => s.split('_').map(capitalize_first_letter).join(' ');

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
            document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Choose an Action";
        }
        action_selected = false;
        delete action.is_selected;
    } else {
        for (let act of curr_stage().actions){
            delete act.is_selected;
        }
        if (!action_selected) {
            document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button");
            document.getElementsByClassName('continue-button')[0].innerHTML = "Continue"
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

const action_box = (action, isMultiple) => {
    let classes = 'flex-col action-box';
    if (action.is_selected) {
        classes += ' action-box-selected';
    } else {
        classes += ' action-box-disabled';
    }
    let content = "";
    let title = "Option " + actionNum++;
    if(action.type != 'blank_action'){
        content = div('action-content', div( "", action.text), img(`./${action.type}.svg`), div('action-type', type_to_title[action.type]));
    }
    else {
        content = div('action-content', action.text);
    }

    if (isMultiple){
        return with_click(
            div(classes,
                div('action-title', title),
                content),
                dispatch(() => toggle_action_selection(action)));
    }
    else{
        return with_click(
            div(classes,
                content),
                dispatch(() => toggle_action_selection(action)));
    }
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
        document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Choose an Action";
    }
};

const increment_survey = () => {
    if(document.getElementsByClassName('continue-button').length == 0){
        return;
    }
    if(curr_survey().type == "short_answer"){
        curr_survey().selection = document.getElementById('mytext').value;
        document.getElementById('mytext').value = '';
    }
    if (survey_index < game.survey.length) {
        survey_index++;
    }
    if (survey_index == game.survey.length - 1) {
        console.log('done with survey');
        survey_done = true;
        document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled survey");
    } else if (curr_survey().type != "short_answer" && curr_survey().type != 'message'){
        document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled survey");
        document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Answer the Question";
    }
    if(document.getElementsByClassName('content-container').length != 0){
        for (var i = 0; i < document.getElementsByClassName('content-container')[0].children.length; i++) {
            if(document.getElementsByClassName('content-container')[0].children[i].className == 'answer-container-checked'){
                document.getElementsByClassName('content-container')[0].children[i].className = 'answer-container';
            }
        }
    }
};

let answer = "";
const user_input =  {
    type: 'textarea',
    props: {
        type: 'text',
        style: 'font-size: 20px',
        value: answer,
        id: "mytext",
        placeholder: 'answer',
        autofocus: true
    },
    children: []
};

const stage_type_panel = (on) => {
    return div('flex-col stage-type-panel', ...Object.keys(type_to_title).map(type => {
        if (on && curr_stage().type === type) {
            return divc('flex-col', 'white', h('img', { className: 'invert', src: `./${type}.svg` }), snake_to_words(`${type}`));
        } else {
            return div('flex-col',img(`./${type}.svg`), snake_to_words(`${type}`))
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
                document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button survey");
                document.getElementsByClassName('continue-button')[0].innerHTML = "Continue";
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
                document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled survey");
                document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Answer the Question";
            }

        } else {
            answer.className = 'answer-container-checked';
            if(document.getElementsByClassName('continue-button').length == 0){
                document.getElementsByClassName('continue-button-disabled')[0].setAttribute("class", "continue-button survey");
                document.getElementsByClassName('continue-button')[0].innerHTML = "Continue";
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
    let continue_button = with_click(div('continue-button', 'Continue'), dispatch(increment_stage));
    let game_result_div = h('div', {style: 'display:none'});
    let game_intro_div = h('div', {style: 'display:none'});
    let game_survey_div = h('div', {style: 'display:none'});
    if(game.stages.length == 0){
        game_over = true;
    }
    if (game_over) {
        if(survey_done || game.survey.length == 1){
            continue_button = div('continue-button-disabled survey', 'Game Complete');
            post_request('/api/', {
                user: time_stamp,
                name: game_name,
                game: game
            });
        }
        else{
            continue_button = with_click(div('continue-button-disabled survey', 'Answer the Question'), dispatch(increment_survey));
            if(curr_survey().answers.length == 0){
                continue_button = with_click(div('continue-button survey', 'Continue'), dispatch(increment_survey));
            }
        }
        if(curr_survey().type == 'short_answer'){
            game_survey_div = div('game-survey flex-col',
                                div('question-container', curr_survey().question), div('content-container', user_input), continue_button);

        } else{
            game_survey_div = div('game-survey flex-col',
                            div('question-container', curr_survey().question),
                            div('content-container', ...curr_survey().answers.map((answer, i) => with_click(div('answer-container', answer), dispatch_survey(checkSelection, answer, curr_survey().type)))), continue_button);
        }
        return div('app',
            game_survey_div);
        }
    if (curr_stage().type == "pop_up"){
        game_intro_div = div("game-intro", divc('title-container', curr_stage().title_color, curr_stage().title), ...curr_stage().messages.map((message, i) => divc('message-container', message.color, (message.file != "") ? img(`./${message.file}`): "", message.text)));
        return div('app',
            game_intro_div,
            div('app-content flex-col',
                div('main-content flex-row',
                    div('dashboard-container',
                        div('panel-content',
                            div('logo-content',
                                img(`./dardania.svg`, "width", "50")),
                            div('panel-header', 'Stages'),
                            stage_type_panel(true))),
                    div('message-bar-container panel-container',
                        div('panel-content',
                            div('panel-header', 'Messages'))),
                    div('action-panel-container panel-container',
                        div('panel-content',
                            div('panel-header', 'Action Menu')))),
                continue_button));
    }
    else {
        actionNum = 1;
        return div('app',
            game_result_div,
            div('app-content flex-col',
                div('main-content flex-row',
                    div('dashboard-container',
                        div('panel-content',
                            div('logo-content',
                                img(`./dardania.svg`, "width", "50")),
                            div('panel-header', 'Stages'),
                            stage_type_panel(true))),
                    div('message-bar-container panel-container',
                        div('panel-content',
                            div('panel-header', 'Messages'),
                            divc('title-container', curr_stage().title_color, curr_stage().title),
                            ...curr_stage().messages.map((message, i) => divc('message-container', message.color, (message.file != "") ? img(`./${message.file}`): "", message.text)))),
                    div('action-panel-container panel-container',
                        div('panel-content',
                            div('panel-header', 'Action Menu'),
                            ...curr_stage().actions.map(action => action_box(action, curr_stage().actions.length != 1))))),
                continue_button));
        }
    }

let current_vdom = null;
const render = () => {
    let root = document.getElementById('root');
    if (root) {
        let new_vdom = app();
        updateElement(root, new_vdom, current_vdom, root.childNodes[0]);
        current_vdom = new_vdom;
    }
};
let time_stamp = Math.floor(new Date().getTime());
let contents = get_request(`/api/request/${time_stamp}`);
game = contents;
game_name = game.name;
render();
