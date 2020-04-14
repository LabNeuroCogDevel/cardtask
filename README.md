# CardTask

see https://labneurocogdevel.github.io/cardtask/

## Task
![example choice](example_choice.png?raw=T)

Each trial is a choice between 2 of 3 total cards (✿, ❖, ✢). 
 * cards have fixed costs ✿=10 ❖=10 ✢=100.
 * high cost/high prob card `✢` is seen 20% of the time.
 * 3 phase types each with a different fixed probability of reward.
    - 20/80/100: ✿ < ❖ < ✢
    - 80/20/100: ✢ > ✿ > ❖
    - 100/100/100: ✢ = ✿ = ❖

## TODO
 - [ ] write consent page (`templates/consent.html`)
 - [ ] Jitter block/phase lengths
 - [ ] test code (with jest?)

## Hacking
 - install psiturk from master branch
 - clone this repo
 - run psiturk server in this projects directory
 - edit `static/js/task.js` and `static/css/style.css`
 - refresh brower page, use <kbd>F12</kbd> developer console

 ```
 pip install --user git+https://github.com/NYUCCL/psiTurk
 git clone https://github.com/LabNeuroCogDevel/cardtask/
 cd cardtask
 # run psiturk console. use that to turn on and debug
 psiturk
   server on
   debug
 # elsewhere
 vim static/js/task.js
 # in browser
 #  launch
 #  push F12
 #  debug
 ```

## helpful link
 * https://github.com/jspsych/sample-jspsych-psiturk-experiment/
 * https://psiturk.readthedocs.io/en/latest/heroku.html
 * https://www.jspsych.org/plugins/jspsych-html-keyboard-response/
 * https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
 * https://github.com/jspsych/jsPsych/tree/master/tests
