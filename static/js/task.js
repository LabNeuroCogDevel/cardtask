const DEBUG = 0; // change 1=>0
// starting value
const INITPOINTS=200;
// make block
const BLOCKLEN = 20;
const BLOCKJITTER = 2;      // Not implemented
const CARDFREQ = [.8, .2];  // low/high pair, any/red
const FEEDBACKDUR = 1400;   //ms to display feedback
// TODO: make feedback faster after a few trials


/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);


// cars contain some values
class Card {
   constructor(sym,  color, cost, pays, p){
      this.sym = sym; this.color=color; this.cost=cost;
      this.pays=pays; this.p=p;
   }
   html(side) {
     return('<div class="card-container" id="card-' + this.sym +'">' +
	    (DEBUG?("<p class='debug'>"+this.p+"</p>"):"") +
            '<div class="card '+
             this.color +' '+ side + '">' +
              this.sym +'</div>'+
            '<p> -'+ this.cost + '</p></div>');
  }
  score(){
     return(((this.p - Math.random(1)) > 0) * this.pays);
  }
  add(right){
   return('<div class="twocards">'+
           this.html('left')+
           right.html('right')+
           '</div>')
  }
  // 20200408 - no longer used, was for feeback
  fade(){
      $('#card-' +this.sym).fadeTo(100, .1)
  }
};

// initialize cards. probablility will change
const CARDS = {
   // phase 1 20/80/100
  'p28_2': new Card('✿', 'blue', 10 , 500, .2),
  'p28_8': new Card('❖', 'blue', 10 , 500, .8),
  'p28_1': new Card('✢', 'red' , 100, 500, 1),
   // phase 2 80/20/100
  'p82_8': new Card('✿', 'blue', 10 , 500, .8),
  'p82_2': new Card('❖', 'blue', 10 , 500, .2),
  'p82_1': new Card('✢', 'red' , 100, 500, 1),
   // phase 3 100/100/100
  'p11_x': new Card('✿', 'blue', 10 , 500, 1),
  'p11_y': new Card('❖', 'blue', 10 , 500, 1),
  'p11_r': new Card('✢', 'red' , 100, 500, 1)
};

var get_info = {
  type: 'survey-text',
  questions: [
    {prompt: "Your Name?", name: "name"}, 
    {prompt: "Your Age?", placeholder: "25", name:"age"}
  ],
};

var instructions = {       
    type: 'instructions',     
    pages: [      
    '<div>In this experiment, you will use points to buy a card<br>' +       
    'Some cards pay better or more often then others<br>' +      
    'Use the arrow keys to select a card</div>',     

    '<div>Blue cards cost 10 points.<br>' +
    'Red cards cost 100 points.<br>' +
    'Pay attention to the symbol on the card</div>',

    '<div>Ready? <br>The task after this page</div>',
   
    //"Choices will look like: <br>" +
    // CARDS['p28_2'].add(CARDS['p28_8'])
    ],        
    show_clickable_nav: true      
}    

function totalPoints(){
  prevscores=jsPsych.data.get().select('score').sum();
  cur_score = INITPOINTS + prevscores;
  return(cur_score)
}


function mktrial(l, r) {
  return({
    type: 'html-keyboard-response',
    stimulus: CARDS[l].add(CARDS[r]),
    choices: [37, 39, 'q'],
    //choices: ['left arrow', 'right arrow', 'q'],
    prompt: "<p>left or right</p>",
    on_start: function(trial) {
      trial.prompt += '<p>You have ' + totalPoints() + ' points</p>' +
	  (DEBUG?("<span class='debug'>" + l + " or " + r +"</span>"):"")
    },
    on_finish: function(data){
      if(data.key_press == 81){
        jsPsych.endExperiment('The experiment was ended by pressing Q.');
      }

      // which card was choosen?
      if(data.key_press==37){picked=l; ignored=r;}
      else                  {picked=r; ignored=l;}
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
	  "<p class='feedback cost'> Payed: -" + prev.cost +"</p>" +
	  "<p class='feedback " + color + "'>Won: " + msg + "</p>" +
	  "<p class='feedback net "+color+"'>Net: " +
		(prev.win - prev.cost) + "</p>"+
          "<p class='feedback'>Total: " + totalPoints() + "</p>"
 )

    },
    choices: jsPsych.NO_KEYS,
    trial_duration: FEEDBACKDUR,
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
  mkrep('p28_2','p28_8', nlow ),
  mkrep('p28_8','p28_2', nlow ),
  mkrep('p28_1','p28_2', nhigh),
  mkrep('p28_2','p28_1', nhigh),
  mkrep('p28_1','p28_8', nhigh),
  mkrep('p28_8','p28_1', nhigh))
p82 = [].concat(
  mkrep('p82_2','p82_8', nlow ),
  mkrep('p82_8','p82_2', nlow ),
  mkrep('p82_1','p82_2', nhigh),
  mkrep('p82_2','p82_1', nhigh),
  mkrep('p82_1','p82_8', nhigh),
  mkrep('p82_8','p82_1', nhigh))
p11 = [].concat(
  mkrep('p11_x','p11_y', nlow ),
  mkrep('p11_y','p11_x', nlow ),
  mkrep('p11_r','p11_y', nhigh),
  mkrep('p11_y','p11_r', nhigh),
  mkrep('p11_r','p11_x', nhigh),
  mkrep('p11_x','p11_r', nhigh))

// combine all
trials=[p28, p82, p28, p82, p11].
  map( (a) => jsPsych.
  randomization.shuffle(a)).flat()

// show all left chards
if(DEBUG){console.log('left cards:', trials.map((x)=> x.left))}

// zip feedback together with trails
trials = trials.flatMap((k) => [k, feedback]);

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
