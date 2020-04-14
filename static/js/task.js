/*
 * LNCD Card Task - 20200406 - FC + WF
 *  
 *  task.js -  makes a trial `timeline` global to be used by jsPsych
 *  see also:
 *    utils.js           -  "Card" class definition
 *    templates/exp.html - `timeline` usage. jsPsych+psiTurk
 *    t/cards.js         - minimal tests
 *
 */
// starting value should be > 100, the most expensive card
const INITPOINTS=200;
// make block
const BLOCKLEN = 40;
const BLOCKJITTER = 2;      // Not implemented
const CARDFREQ = [.8, .2];  // low/high pair, any/red
const DEBUG = 0; // change 1=>0
const TASKVER = '20200413.2-rtpen+endQ';

const CARDWIN = 50;
const LOWCOST = 1;
const HIGHCOST = 10;

// animation
const MAXCNTDUR=250 //ms
const MAXRT=2000 // ms - time to zero points from slow RT
const RTPENSTART=300 // when to start the penilty progress bar

// 20200410 - feedback no longer autoadvances
// xxx TODO: make feedback faster after a few trials
//const FEEDBACKDUR = 1400;   //ms to display feedback


//keys
// see https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
const LEFT_KEY = 37;
const RIGHT_KEY = 39;   
const SPACE_KEY = 32; //progress feedback

/* Card class defined in utils */

// initialize cards. probablility will change
const CARDS = {
   // phase 1 20/80/100
  'p28_2F': new Card('✿', 'blue', LOWCOST , CARDWIN, .2),
  'p28_8D': new Card('❖', 'blue', LOWCOST , CARDWIN, .8),
  'p28_1R': new Card('✢', 'red' , HIGHCOST, CARDWIN,  1),
   // phase 2 80/20/100
  'p82_8F': new Card('✿', 'blue', LOWCOST , CARDWIN, .8),
  'p82_2D': new Card('❖', 'blue', LOWCOST , CARDWIN, .2),
  'p82_1R': new Card('✢', 'red' , HIGHCOST, CARDWIN,  1),
   // phase 3 100/100/100
  'p11_1F': new Card('✿', 'blue', LOWCOST , CARDWIN,  1),
  'p11_1D': new Card('❖', 'blue', LOWCOST , CARDWIN,  1),
  'p11_1R': new Card('✢', 'red' , HIGHCOST, CARDWIN,  1),
   // for testing only
  'test_0R': new Card('💣', 'red' , HIGHCOST, CARDWIN,  0),
  'test_0B': new Card('💣', 'blue', LOWCOST , CARDWIN,  0),
};

// initial trial - get name and age
var get_info = {
  type: 'survey-text',
  questions: [
    {prompt: "Your Name?", name: "name"}, 
    {prompt: "Your Age?", placeholder: "25", name:"age"}
  ],
  on_finish: function(data){
      // add task version
      resp = JSON.parse(data.responses)
      resp.taskver = TASKVER
      data.responses=JSON.stringify(resp)
  }
};
var final_thoughts = {
  type: 'survey-multi-choice',
  questions: [
    {prompt: "How many times did the cost of ❖ change?", options: ["0", "1-3", "4+"],  name: "vchange"}, 
    {prompt: "How many times did ❖ change how often it won?", options: ["0", "1-3", "4+"],  name: "pchange"}, 
    {prompt: "<span color=red>✢</span> was the best choice", options: ["always", "most of the time", "rarely", "never"],  name: "redthoughts"}, 
	      
  ],
  on_finish: function(data){
      // add task version
      resp = JSON.parse(data.responses)
      resp.taskver = TASKVER
      data.responses=JSON.stringify(resp)
  }
};

// instruction slides
var instructions = {       
    type: 'instructions',     
    pages: [
    '<div>In this game, you will use points to buy a card.<br>' +
    'Some cards pay out more often then others.<br>' +
    'Try to get as many points as you can!</div>',

    'Each card has a cost to buy it, either ' + LOWCOST + ' or ' + HIGHCOST + ' points.<br>' +
    "You have to pay whether you win or lose.",

    "On each trial, pick between two cards using the arrow keys.<br>"+
    "If your card wins, you get " + CARDWIN + " points!",

    "Your goal is to learn which cards give rewards most often<br>" +
    "so that you can get as many points as possible.",

    "Go as fast as you can!<br>"+
    "You lose more of your card winnings the slower you go.",

    "But be careful!<br>" +
    "Sometimes the chances of a card giving you a reward will change.",

    '<div>Ready? <br>The game starts after this page<br><br>' +
    '<br>Remember, hit<br>'+
    'the <b>left or right arrow key</b> to pick a card<br>' +
    'and <b>spacebar</b> to continue' +
    '</div>',
   
    //"Choices will look like: <br>" +
    // CARDS['p28_2'].add(CARDS['p28_8'])
    ],        
    show_clickable_nav: true      
}    

/* feedback animation functions
*/
function countWin(net) {
   // initial from https://stackoverflow.com/questions/16994662/count-animation-from-number-a-to-b
   let startTimestamp = null;
   let obj = $('.net');
   const duration = (net/CARDWIN)*MAXCNTDUR;
   const g = 128; // green value
   const c = 4; // exp scale coef
   const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const cval = progress*net
      const g_color = Math.floor(g * Math.exp(c*cval/CARDWIN)/Math.exp(c))
      //  colors                     == 0 20 40 49
      // exp(2*(colors/MAX))/exp(2)  == 0.1353353 0.3011942 0.6703200 0.9607894
      const c_points =  Math.floor(cval)
      obj.html("Net: " + c_points);
      obj.css("background-color", "rgb(0," + g_color + ",0)");
      if (progress < 1) {
         window.requestAnimationFrame(step);
      }
   };
   window.requestAnimationFrame(step);
}
function pictureRep(n, red) {
   // https://www.behance.net/gallery/3885279/Elf-Defense-2D-Game-concept-art
   // https://www.pngitem.com/middle/boxhh_cartoon-transparent-background-gold-coin-hd-png-download/
   let ncol = 10;
   var imgsrc='coin_sm.png';
   if(n<=0) { imgsrc='redcoin_sm.png'; n=red}

   let img = "<img class='coin' src='static/images/"+ imgsrc +"'/>" 
   let img_col = Array(ncol).fill(img).join("\t")
   let imgx = Array(n%ncol).fill(img).join("\t")
   let all = Array(Math.floor(n/ncol)).fill(img_col).concat(imgx).join("<br>")
   return(all)
}


// sum all scores. used in choice, feedback, and debrief
function totalPoints(){
  prevscores=jsPsych.data.get().select('score').sum();
  cur_score = INITPOINTS + prevscores;
  return(cur_score)
}
function rt_progress(){

   let startTimestamp = null;
   let obj = $('.rtbar');
   const duration = MAXRT;
   const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const time = Math.min(timestamp - startTimestamp, MAXRT);
      const color = (time<MAXRT/5)?"green":(time<MAXRT/2)?"orange":"red";
      obj.css("width", (1- time/MAXRT)*100 + "%");
      obj.css("background-color", color);
      if (time < MAXRT) {
         window.requestAnimationFrame(step);
      }
   };
   window.requestAnimationFrame(step);
}

// make a trial from 2 card index keys
function mktrial(l, r) {
  if(DEBUG) { console.log(l,r)}
  return({
    type: 'html-keyboard-response',
    stimulus: CARDS[l].add(CARDS[r]),
    choices: [LEFT_KEY, RIGHT_KEY],
    prompt: "<p>left or right</p><div class='rtbar' style='background-color:blue;height:20px;width:100%;'></div>",
    on_start: function(trial) {
      trial.prompt += '<p>You have ' + totalPoints() + ' points</p>' +
        (DEBUG?("<span class='debug'>" + l + " or " + r +"</span>"):"")
    },
    on_load: function(trial) {
       // start the rt bar counting down after 300 ms
       setTimeout(rt_progress, RTPENSTART)
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
      if(data.win == 0) { 
        data.rtpen = 0
      } else {
        rt = Math.max(data.rt - RTPENSTART, 0) // give some lag
        data.rtpen = Math.min(Math.floor(rt/MAXRT*data.win), data.win-data.cost)
      }
      data.score = data.win - data.cost - data.rtpen;
      data.picked = picked;
      data.ignored = ignored;
    },
   left: l, right: r
})}

// feedback trial informs player of their choice
// use function to make b/c we might want to 
// change proprties of one but not all (index.html in github pages)
function mkfbk() { 
   return({
    type: 'html-keyboard-response',
    // 20200413 - updated to use coins and animation
    stimulus: function(trial){
      // setup win vs nowin feedback color and message
      let prev=jsPsych.data.get().last(1).values()[0];
      let msg=(prev.win > 0)?("+"+prev.win):"0";
      let color=(prev.win > 0)?"win":"nowin";
      let card = CARDS[prev.picked];
      if(prev.win>0) {
       slowmsg = "<p class='feedback nowin'>Slow: -" + prev.rtpen + "</p>"
      } else {
       slowmsg = ""
      }
      return(
          "<p class='feedback sym'>" + card.sym +"</p><div class='wallet'>" +
            pictureRep(prev.win-prev.rtpen, prev.cost) +
            "</div><p class='feedback cost'> Paid: -" + prev.cost +"</p>" +
            "<p class='feedback " + color + "'>Won: " + msg + "</p>" +
	     slowmsg +
            "<p class='feedback net "+color+"'>Net: " + prev.score + "</p>"+
            "<p class='feedback'>Total: " + totalPoints() + "</p>" +
            "<p class='feedback'><br><b>Push the space bar to see the next pair</b></p>"
      )
   }, on_load: function(trial) {
       let prev=jsPsych.data.get().last(1).values()[0]
       let net = (prev.win - prev.cost)
       if(net>0) {
         countWin(net) 
         setTimeout(function(){
             $('img.coin').slice(0,prev.cost).attr('src', 'static/images/poof_gold_sm.gif')
         },300)
       }
   },
    // 20200410 - no autoadvance
    choices: [SPACE_KEY],
    //choices: jsPsych.NO_KEYS,
    //trial_duration: FEEDBACKDUR,
})}

var feedback= mkfbk()
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

var timeline = [get_info, instructions, trials, final_thoughts, debrief].flat()

/* 'timeline' used in templates/exp.html */
