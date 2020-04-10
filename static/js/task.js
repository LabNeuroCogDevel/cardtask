const DEBUG = 0; // change 1=>0
// starting value
const INITPOINTS=200;
// make block
const BLOCKLEN = 40;
const BLOCKJITTER = 2;      // Not implemented
const CARDFREQ = [.8, .2];  // low/high pair, any/red
const FEEDBACKDUR = 1400;   //ms to display feedback
// TODO: make feedback faster after a few trials


//keys
// see https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
const LEFT_KEY = 37;
const RIGHT_KEY = 39;   
const SPACE_KEY = 32; //progress feedback

/* Card class defined in utils */

// initialize cards. probablility will change
const CARDS = {
   // phase 1 20/80/100
  'p28_2F': new Card('✿', 'blue', 10 , 500, .2),
  'p28_8D': new Card('❖', 'blue', 10 , 500, .8),
  'p28_1R': new Card('✢', 'red' , 100, 500, 1),
   // phase 2 80/20/100
  'p82_8F': new Card('✿', 'blue', 10 , 500, .8),
  'p82_2D': new Card('❖', 'blue', 10 , 500, .2),
  'p82_1R': new Card('✢', 'red' , 100, 500, 1),
   // phase 3 100/100/100
  'p11_1F': new Card('✿', 'blue', 10 , 500, 1),
  'p11_1D': new Card('❖', 'blue', 10 , 500, 1),
  'p11_1R': new Card('✢', 'red' , 100, 500, 1)
};

// initial trial - get name and age
var get_info = {
  type: 'survey-text',
  questions: [
    {prompt: "Your Name?", name: "name"}, 
    {prompt: "Your Age?", placeholder: "25", name:"age"}
  ],
};

// instruction slides
var instructions = {       
    type: 'instructions',     
    pages: [
    '<div>In this game, you will use points to buy a card.<br>' +
    'Some cards pay more often then others.<br>' +
    ' Try to get as many points as you can!',

    'Use the <b>arrow keys</b> to select a card<br> ' +
    'and <b>spacebar</b> to get to the next pair</div>',

    '<div>Blue cards cost 10 points.<br>' +
    'Red cards cost 100 points.<br>' +
    'Pay attention to the symbol on the card</div>',

    '<div>Ready? <br>The game starts after this page<br><br>' +
    '<br>Remember to hit the <b>left or right arrow key </b>' +
    'to choose a card and <b>spacebar</b> to continue' +
    '</div>',
   
    //"Choices will look like: <br>" +
    // CARDS['p28_2'].add(CARDS['p28_8'])
    ],        
    show_clickable_nav: true      
}    

// sum all scores. used in choice, feedback, and debrief
function totalPoints(){
  prevscores=jsPsych.data.get().select('score').sum();
  cur_score = INITPOINTS + prevscores;
  return(cur_score)
}

// make a trial from 2 card index keys
function mktrial(l, r) {
  if(DEBUG) { console.log(l,r)}
  return({
    type: 'html-keyboard-response',
    stimulus: CARDS[l].add(CARDS[r]),
    choices: [LEFT_KEY, RIGHT_KEY],
    prompt: "<p>left or right</p>",
    on_start: function(trial) {
      trial.prompt += '<p>You have ' + totalPoints() + ' points</p>' +
	  (DEBUG?("<span class='debug'>" + l + " or " + r +"</span>"):"")
    },
    on_finish: function(data){
      // which card was choosen?
      if(data.key_press==LEFT_KEY){picked=l; ignored=r;}
      else                        {picked=r; ignored=l;}
      // add score
      data.l = l;
      data.r = r;
      data.cost  = CARDS[picked].cost;
      data.p     = CARDS[picked].p;
      data.win   = CARDS[picked].score();
      data.score = data.win - data.cost;
      data.picked = picked;
      data.ignored = ignored;
    },
   left: l, right: r
})}

// feedback trial informs player of their choice
var feedback={
    type: 'html-keyboard-response',
    stimulus: function(trial){
	// setup win vs nowin feedback color and message
	var prev=jsPsych.data.get().last(1).values()[0]
	var msg=(prev.win > 0)?("+"+prev.win):"0";
	var color=(prev.win > 0)?"win":"nowin";
	var card = CARDS[prev.picked]
	return(
	  "<p class='feedback sym'>" + card.sym +"</p>" +
	  "<p class='feedback cost'> Paid: -" + prev.cost +"</p>" +
	  "<p class='feedback " + color + "'>Won: " + msg + "</p>" +
	  "<p class='feedback net "+color+"'>Net: " +
		(prev.win - prev.cost) + "</p>"+
          "<p class='feedback'>Total: " + totalPoints() + "</p>"+
          "<p class='feedback'><br><b>Push the space bar to see the next pair</b></p>"
    )},
    // 20200410 - no autoadvance
    choices: [SPACE_KEY],
    //choices: jsPsych.NO_KEYS,
    //trial_duration: FEEDBACKDUR,
}
var debrief={
    type: 'html-keyboard-response',
    stimulus: function(trial){
	// setup win vs nowin feedback color and message
	return(
          "<p class='feedback'>Thanks for playing!<br>" +
          "You accumulated " + totalPoints() + " points!<br>" +
	  "Push any key to finish!</p>")

    }
}

// TODO: figure out block structure
//phase1 = BLOCKLEN - BLOCKJITTER + Math.random(BLOCKJITTER*2) 
//phase2 = (BLOCKLEN - phase1)/BLOCKLEN 
function mkrep(l,r,n) {
 return(jsPsych.randomization.repeat(mktrial(l,r), n, 0))
}

// make each phase
var nlow = BLOCKLEN*CARDFREQ[0]/2;
var nhigh = BLOCKLEN*CARDFREQ[1]/4;

// blocks of 20/80, 80/20, and 100/100
p28 = [].concat(
  mkrep('p28_2F','p28_8D', nlow ),
  mkrep('p28_8D','p28_2F', nlow ),
  mkrep('p28_1R','p28_2F', nhigh),
  mkrep('p28_2F','p28_1R', nhigh),
  mkrep('p28_1R','p28_8D', nhigh),
  mkrep('p28_8D','p28_1R', nhigh))
p82 = [].concat(
  mkrep('p82_2D','p82_8F', nlow ),
  mkrep('p82_8F','p82_2D', nlow ),
  mkrep('p82_1R','p82_2D', nhigh),
  mkrep('p82_2D','p82_1R', nhigh),
  mkrep('p82_1R','p82_8F', nhigh),
  mkrep('p82_8F','p82_1R', nhigh))
// 20200410 - end block is 2x as long as others
// maybe should be p11,p11 in trials
p11 = [].concat(
  mkrep('p11_1F','p11_1D', nlow *2),
  mkrep('p11_1D','p11_1F', nlow *2),
  mkrep('p11_1R','p11_1D', nhigh*2),
  mkrep('p11_1D','p11_1R', nhigh*2),
  mkrep('p11_1R','p11_1F', nhigh*2),
  mkrep('p11_1F','p11_1R', nhigh*2))

// combine all
trials=[p28, p82, p28, p82, p11].
  map( (a) => jsPsych.
  randomization.shuffle(a)).flat()

// show all left chards
if(DEBUG){console.log('left cards:', trials.map((x)=> x.left))}

// add feedback after each trial
trials = trials.flatMap((k) => [k, feedback]);

/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

/* start the experiment */
jsPsych.init({      
   // 
   timeline: [get_info, instructions, trials, debrief].flat(),
   on_finish: function() {
      psiturk.saveData({
         success: function() { psiturk.completeHIT(); }
      });
   },
   on_data_update: function(data) {
      psiturk.recordTrialData(data);
   }
});
