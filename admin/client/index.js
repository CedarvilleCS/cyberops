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
let classText = 'continue-button';
let buttonText = 'Continue';

const capitalize_first_letter = s => s.charAt(0).toUpperCase() + s.slice(1);
const snake_to_words = s => s.split('_').map(capitalize_first_letter).join(' ');

const curr_stage = () => game.stages[stage_index] || game.stages[game.stages.length - 1];
const curr_survey = () => game.survey[survey_index] || game.survey[game.survey.length - 1];

const dispatch = f => () => {
    f();
    render();
};

openTab = (evt, tabName) => {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    if(document.getElementById(tabName) != null) {
        document.getElementById(tabName).style.display = "flex";
        evt.currentTarget.className += " active";
    }
}

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
    let actionDiv = "";
    let classes = 'actionDiv-';
    if(action.is_selected) {
        classes += 'selected';
    }
    else {
        classes += 'disabled';
    }

    let content = div('action-content', action.text);
    let title = ":::[Opt " + actionNum++ + "]   ";
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
    } else if (curr_stage().actions.length == 1){
        document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
        document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Select the Action to Proceed";
    } else if (curr_stage().actions.length != 0){
        document.getElementsByClassName('continue-button')[0].setAttribute("class", "continue-button-disabled");
        document.getElementsByClassName('continue-button-disabled')[0].innerHTML = "Select an Action to Proceed";
    }
};

const increment_survey = () => {
    if(document.getElementsByClassName('survey-button').length == 0){
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
        document.getElementsByClassName('survey-button')[0].setAttribute("class", "survey-button-disabled");
    } else if (curr_survey().type != "short_answer" && curr_survey().type != 'message'){
        document.getElementsByClassName('survey-button')[0].setAttribute("class", "survey-button-disabled");
        document.getElementsByClassName('survey-button-disabled')[0].innerHTML = "Answer the Question";
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
            if(document.getElementsByClassName('survey-button-disabled').length !=0){
                document.getElementsByClassName('survey-button-disabled')[0].setAttribute("class", "survey-button");
                document.getElementsByClassName('survey-button')[0].innerHTML = "NEXT";
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
                document.getElementsByClassName('survey-button')[0].setAttribute("class", "survey-button-disabled");
                document.getElementsByClassName('survey-button-disabled')[0].innerHTML = "Answer the Question";
            }

        } else {
            answer.className = 'answer-container-checked';
            if(document.getElementsByClassName('survey-button').length == 0){
                document.getElementsByClassName('survey-button-disabled')[0].setAttribute("class", "survey-button");
                document.getElementsByClassName('survey-button')[0].innerHTML = "Continue";
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
    let rulesTab = with_click(button('tablinks', 'rulesButton', 'REVIEW RULES OF ENGAGEMENT'), dispatch(() => openTab(event, 'Rules')));
    let actionTab = with_click(button('tablinks', 'rulesButton', 'ACTION MENU'), dispatch(() => openTab(event, 'Actions')));
    let game_result_div = h('div', {style: 'display:none'});
    let game_intro_div = h('div', {style: 'display:none'});
    let game_survey_div = h('div', {style: 'display:none'});
    if(game.stages.length == 0){
        game_over = true;
    }
    if (game_over) {
        if(survey_done || game.survey.length == 1){
            continue_button = div('survey-button-disabled', 'Game Complete');
            post_request('/api/', {
                user: time_stamp,
                name: game_name,
                game: game
            });
        }
        else{
            continue_button = with_click(div('survey-button-disabled', 'ANSWER THE QUESTION'), dispatch(increment_survey));
            if(curr_survey().answers.length == 0){
                continue_button = with_click(div('survey-button', 'NEXT'), dispatch(increment_survey));
            }
        }
        if(curr_survey().type == 'short_answer') {
            game_survey_div = div('survey-div',
                                    div('question-div',
                                        div('question-number', survey_index + "."),
                                        div('inner-question-div', div('bold-div', 'Short Answer:'), curr_survey().question, brk(), brk(), div('content-container', user_input))),
                                    continue_button);
        }
        else {
            game_survey_div = div('survey-div',
                                    div('question-div',
                                        div('question-number', survey_index + "."),
                                        div('inner-question-div', curr_survey().question, brk(), brk(),
                                            div('content-container', ...curr_survey().answers.map((answer, i) => with_click(div('answer-container', answer), dispatch_survey(checkSelection, answer, curr_survey().type)))))),
                                    continue_button);
        }
        return div('app-survey',
            game_survey_div);
    }
    if (curr_stage().type == "pop_up"){
        game_intro_div = div("game-intro", ...curr_stage().messages.map((message, i) => divc('popup-message-container', message.color, (message.file != "") ? img(`./${message.file}`): "", message.text)), with_click(div('continue-button-fake', 'Continue'), dispatch(increment_stage)));
        return div('app',
                game_intro_div,
                div('topRow',
                    div('title',
                        div('logo',
                            img(`./dardania.svg`, "width", "50")),
                        div('welcome',
                            div('loggedIn', 'LOGGED IN:'),
                            div('name', 'Commander'))),
                    img(`./divider.png`, "width", "50"),
                    div('killChain',
                            img(`./Cyber-Kill-Chain-icons-group.png`, "width", "50"))),
                div('bottomRow',
                    div('lowerLeft',
                        div('tab',
                            rulesTab,
                            actionTab),
                        div('undertab'),
                        div('content-area',
                            divId('tabcontent', 'Rules',div('code-line', ':::'),
                            div('code-line', div('line-space', ':::'), div('code-title', 'Kingdom of Dardania | Rules of Engagement:')),
                            div('code-line', ':::'),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view our current cyber operations as acceptable cyber competition; we believe Illyria finds this level of activity as a competitive contest;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view defensive action, when necessary, (including containing and preventing damage) as appropreiate;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'There is a scale of further cyber operations that may be approved by the Commander each of which represents increased intensification in the following order: disrupt, degrade, and destroy;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view the highest level intensification of operations to be a declaration of war and cross domain-attacks.'))),
                            divId('tabcontent', 'Actions'))),
                    div('lowerRight',
                        div('messagesDiv',
                            div('messageLabel',
                                divg('label', curr_stage().title_color, curr_stage().title),
                                div('labelSpacer', ' ')),
                            div('messageContent')),
                            continue_button)));
    }
    else if (curr_stage().type == "pop_up_evil"){
        game_intro_div = div("game-intro-evil", divc('title-container', curr_stage().title_color, curr_stage().title), ...curr_stage().messages.map((message, i) => divc('popup-message-container', message.color, (message.file != "") ? img(`./${message.file}`): "", message.text)), with_click(div('continue-button-fake', 'Continue'), dispatch(increment_stage)));
        return div('app',
                game_intro_div,
                div('topRow',
                    div('title',
                        div('logo',
                            img(`./dardania.svg`, "width", "50")),
                        div('welcome',
                            div('loggedIn', 'LOGGED IN:'),
                            div('name', 'Commander'))),
                    img(`./divider.png`, "width", "50"),
                    div('killChain',
                            img(`./Cyber-Kill-Chain-icons-group.png`, "width", "50"))),
                div('bottomRow',
                    div('lowerLeft',
                        div('tab',
                            rulesTab,
                            actionTab),
                        div('undertab'),
                        div('content-area',
                            divId('tabcontent', 'Rules',div('code-line', ':::'),
                            div('code-line', div('line-space', ':::'), div('code-title', 'Kingdom of Dardania | Rules of Engagement:')),
                            div('code-line', ':::'),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view our current cyber operations as acceptable cyber competition; we believe Illyria finds this level of activity as a competitive contest;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view defensive action, when necessary, (including containing and preventing damage) as appropreiate;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'There is a scale of further cyber operations that may be approved by the Commander each of which represents increased intensification in the following order: disrupt, degrade, and destroy;')),
                            brk(),
                            brk(),
                            div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view the highest level intensification of operations to be a declaration of war and cross domain-attacks.'))),
                            divId('tabcontent', 'Actions'))),
                    div('lowerRight',
                        div('messagesDiv',
                            div('messageLabel',
                                divg('label', curr_stage().title_color, curr_stage().title),
                                div('labelSpacer', ' ')),
                            div('messageContent')),
                        continue_button)));
    }
    else {
        actionNum = 1;
        return div('app',
                game_result_div,
                div('topRow',
                    div('title',
                        div('logo',
                            img(`./dardania.svg`, "width", "50")),
                        div('welcome',
                            div('loggedIn', 'LOGGED IN:'),
                            div('name', 'Commander'))),
                    img(`./divider.png`, "width", "50"),
                    div('killChain',
                            img(`./Cyber-Kill-Chain-icons-group.png`, "width", "50"))),
                div('bottomRow',
                    div('lowerLeft',
                        div('tab',
                            rulesTab,
                            actionTab),
                        div('undertab'),
                        div('content-area',
                            divId('tabcontent', 'Rules',
                                div('code-line', ':::'),
                                div('code-line', div('line-space', ':::'), div('code-title', 'Kingdom of Dardania | Rules of Engagement:')),
                                div('code-line', ':::'),
                                brk(),
                                div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view our current cyber operations as acceptable cyber competition; we believe Illyria finds this level of activity as a competitive contest;')),
                                brk(),
                                brk(),
                                div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view defensive action, when necessary, (including containing and preventing damage) as appropreiate;')),
                                brk(),
                                brk(),
                                div('code-line', div('line-space', ':::[X]'), div('code-content', 'There is a scale of further cyber operations that may be approved by the Commander each of which represents increased intensification in the following order: disrupt, degrade, and destroy;')),
                                brk(),
                                brk(),
                                div('code-line', div('line-space', ':::[X]'), div('code-content', 'We view the highest level intensification of operations to be a declaration of war and cross domain-attacks.'))),
                            divId('tabcontent', 'Actions',
                                ...curr_stage().actions.map(action => action_box(action, curr_stage().actions.length != 1))))),
                    div('lowerRight',
                        div('messagesDiv',
                            div('messageLabel',
                                divg('label', curr_stage().title_color, curr_stage().title),
                                div('labelSpacer', ' ')),
                            div('messageContent',
                                ...curr_stage().messages.map((message, i) => divc('message-container', message.color, (message.file != "") ? img(`./${message.file}`): "", message.text)))),
                        continue_button)));
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
document.getElementById("rulesButton").click();
