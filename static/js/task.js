/*
 * LNCD Card Task - 20200406 - FC + WF
 *  
 *  task.js -  makes a trial `timeline` global to be used by jsPsych
 *  see also:
 *    utils.js           - "Card" class definition
 *    templates/exp.html - `timeline` usage. jsPsych+psiTurk
 *    index.html         - debugging and example page
 *    t/cards.js         - minimal tests
 *
 */
// starting value should be > 100, the most expensive card
const TASKVER = '20200428.1-star+2xfdbk';
const INITPOINTS=200;
// make block
const BLOCKLEN = 40;
const BLOCKJITTER = 2;      // Not implemented
const CARDFREQ = [.6, .4];  // low/high pair, any/red //20200421 inc 40% from 20%

// only the first 3 are used. Maybe shuffled later
const SYMOPTS = ['✿', '❖', '✢', '⚶', '⚙', '✾'];
const COLOROPTS = ['green', 'blue','red','yellow', 'orange']
const DEBUG = 0; // change 1=>0
const USERTBAR = 0; // 20200420 - RT progress bar is too stressful
const USERANDOM =0; // 20200422 - random but not toggled yet


const ALLOWTOUCH = 1; //20200421 - enable touching symbol

const CARDWIN = 50;
const LOWCOST = 1;
const HIGHCOST = 10;

const RTMAX = 2000; //ms. how long to wait before auto-progressing. 0 = off
const RTPEN = 0; // 20200421 - disable RT penalty
// animation
const MAXCNTDUR=400 //ms
const MAXRT=2000 // ms - time to zero points from slow RT
const RTPENSTART=300 // when to start the penilty progress bar
const SCOREANIMATEDUR=0 // 0 = disabled, otherwise ITI after response to animate score (500)

// 20200410 - feedback no longer autoadvances
// xxx TODO: make feedback faster after a few trials
//const FEEDBACKDUR = 1400;   //ms to display feedback


//keys
// see https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
const LEFT_KEY = 37;
const DOWN_KEY = 40;
const RIGHT_KEY = 39;   
const SPACE_KEY = 32; //progress feedback
const SLOTKEYS = [LEFT_KEY, DOWN_KEY, RIGHT_KEY];

// div id="scorebar" for a progress bar
// must be run after page is loaded
let SCOREBAR = null
if(document && SCOREANIMATEDUR>0) {
    $(document).ready(function(){
	$('body').append('<div class="scorebar-container"><div id="scorebar"> </div></div>');
	SCOREBAR = new ScoreBar('#scorebar', INITPOINTS);
})}

class Sym {
    constructor(sym, color, val, order) {
	this.sym=sym;
	this.val=val;
	this.color=color;
	this.side = order.indexOf(this.sym);
    }
}
class ThreePositions {
    // fix positions
    constructor(allsyms, allcolors, cost) {
	this.colors    = jsPsych.randomization.shuffle(allcolors).slice(0, 3);
	this.slotorder = jsPsych.randomization.shuffle(allsyms).slice(0, 3);
	this.slotval   = jsPsych.randomization.shuffle(this.slotorder);

	this.keys = ['I','S','H'];
	this.I = new Sym(this.slotval[0], this.colors[0], cost[0], this.slotorder);
	this.S = new Sym(this.slotval[1], this.colors[1], cost[1], this.slotorder);
	this.H = new Sym(this.slotval[2], this.colors[2], cost[2], this.slotorder);
	// keys reordered by position
	// e.g. H, S, I
	this.poskey = this.keys.map(k=>this.slotorder.indexOf(this[k].sym)).map(i=>this.keys[i])
    }
    // lookups
    pos_of_sym(sym){ return(this.slotorder.indexOf(sym));}
    sym_at_pos(i)  { return(this.slotorder[i]);}
    pos_at_type(t) { return(this.poskey.indexOf(t));}
    type_at_pos(i) { return(this.poskey[i]);}
    type_at_sym(i) { return(this[this.poskey[i]]);}
    key_at_side(i) { return(SLOTKEYS[i]); }
    type_at_keycode(k) { return(this.poskey[SLOTKEYS.indexOf(k)]);}
    keys_for_cards(cards){
	// keyinit omitted=use SLOTKEYS. might want to send spacebar. or nothing ([null,null,null])
	var keyarray = [null, null, null];
	var cardkey = [];
	for(var c of cards){
	    let i = this.pos_at_type(c.type)
	    keyarray[i] = SLOTKEYS[i];
	    cardkey.push(SLOTKEYS[i]);
        }
	return({'keys': keyarray, 'cards': cardkey})
    }
    html(showcards, keyinit, small) {
	// showcards is an array of cards to show
	// card should have 'type' property
	var carray = [CARDS['empty'], CARDS['empty'], CARDS['empty']];
	var classes = [small, small, small];
	for(var c of showcards){
	    let i = this.pos_at_type(c.type)
	    carray[i] = c;
	    //only one to show means we are doing feedback
	    if(showcards.length===1){classes[i]+=" chosen";}
        }
	var keyarray = keyinit===undefined?this.keys_for_cards(showcards)['keys']:keyinit
	return('<div class="threecards">'+
	    carray[0].html('left'  , keyarray[0], classes[0])+
	    carray[1].html('center', keyarray[1], classes[1])+
	    carray[2].html('right' , keyarray[2], classes[2])+
	    '</div>')
    }
}

const LAYOUT = new ThreePositions(SYMOPTS, COLOROPTS, [LOWCOST, LOWCOST, HIGHCOST]);

function symcard(type, p){
    let s = LAYOUT[type];
    return(new Card(s.sym, s.color, s.val, CARDWIN, p, type))
}


// initialize cards. probability will change
const CARDS = {
   // phase 1 20/80/100
   // 20200421 - setup for random symbols. change card names
   //   I=Initial Best was D=diamond
   //   S=Second was F=Flower 
   //   H=HighCost was R=red(cross)
  'p28_8I': symcard('I', .8),
  'p28_2S': symcard('S', .2),
  'p28_1H': symcard('H',  1),
   // phase 2 80/20/100
  'p82_2I': symcard('I', .2),
  'p82_8S': symcard('S', .8),
  'p82_1H': symcard('H',  1), // same as before, phase name change
   // phase 3 100/100/100
  'p11_1I': symcard('I',  1),
  'p11_1S': symcard('S',  1),
  'p11_1H': symcard('H',  1),
   // 60 instead of 80 - 20200416
   // phase 1 20/60/100
  'p26_8I': symcard('I', .6),
  'p26_2S': symcard('S', .2),
  'p26_1H': symcard('H',  1),
   // phase 2 60/20/100
  'p62_2I': symcard('I', .2),
  'p62_8S': symcard('S', .6),
  'p62_1H': symcard('H',  1),
   // 20200420 no card: used for empty display AND empty feedback
  'empty': new Card('', 'white' , LOWCOST, 0, 0, 'E'),
   // for testing only
  'test_0R': new Card('💣', 'red' , HIGHCOST, CARDWIN,  0, 'S'), //bomb
  'test_0B': new Card('💣', 'blue', LOWCOST , CARDWIN,  0, 'I'),
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
    {prompt: "The cost of ❖ changed ", options: ["0 times", "1-3 time(s)", "4+ times"],  name: "vchange"}, 
    {prompt: "How often ❖ gave a reward changed ", options: ["0 times", "1-3 time(s)", "4+ times"],  name: "pchange"}, 
    {prompt: "The left card was ", options: ["always better", "always worse", "neither"],  name: "sidethoughts"}, 
    {prompt: "<span color=red>✢</span> was the best choice ", options: ["always", "often", "rarely", "never"],  name: "redthoughts"}, 
    {prompt: "I choose wrong by going too fast", options: ["often", "rarely", "never"],  name: "speed"}, 
  ]
};

// instruction slides
var instructions = {       
    type: 'instructions',     
    pages: [
    '<div>In this game, you will use points to buy a card.<br>' +
    'Some cards pay out more often than others.<br>' +
    'Try to get as many points as you can!</div>',

    'Each card has a cost to buy it, either ' + LOWCOST + ' or ' + HIGHCOST + ' points.<br>' +
    "You have to pay whether you win or lose.",
	
    "<div>Some cards cost " + LOWCOST + " point" +
	// TODO: correct order!?
	LAYOUT.html([CARDS['p11_1S'], CARDS['p11_1I']], [null, null, null])+
    "</div>",

    "<div>This card cost " + HIGHCOST + ' points' +
	LAYOUT.html([CARDS['p11_1H']], [null, null, null])+
    "</div>",

    // NB. maybe don't put total wins (20200421BL)
    "On each trial, pick between two cards using the arrow keys.<br>"+
    "<font size=larger>←</font> for the left card, " +
      "<font size=larger>↓</font> for center, "+
      "<font size=larger>→</font> for right<br>"+
    "If your card wins, you get as many as " + CARDWIN + " points!",

    /*
    "<div>When a card gives you points<br>" +
    "you'll see the cost of the card taken out of your winnings<div>" +
    pictureRep(5,0) + "</div>",

    // repeat same instruction slide, but now with poofed coins
    "<div>When a card gives you points<br>" +
    "you'll see the cost of the card taken out of your winnings" +
    "<div> " +
      '<img src="static/images/poof_gold_sm.gif">' +
      '<img src="static/images/poof_gold_sm.gif">' +
      '<img src="static/images/poof_gold_sm.gif">' +
      '<img src="static/images/coin_sm.png">' +
      '<img src="static/images/coin_sm.png">' +
    "</div></div>",

    "<div>A lone X-ed coin means you lost a point!<br>" +
    pictureRep(0,1) + "</div>",
    */

    "Your goal is to learn which cards give rewards most often<br>" +
    "so that you can get as many points as possible.<br>"+
    "Remember, not all cards have the same cost",

    "Go as fast as you can!<br>"+
    "If you take too long you won't win anything!",

    "But be careful!<br>" +
    "Sometimes the chances of a card giving you a reward will change.",

    '<div>Ready? <br>The game starts after this page<br><br>' +
    '<br>Remember, hit <br>'+
    '<b>the arrow keys (←, ↓, or →)</b> to pick a card<br>' +
    'and <b>spacebar</b> to continue' +
    '</div>',
   
    //"Choices will look like: <br>" +
    // CARDS['p28_2'].add(CARDS['p28_8'])
    ],        
    show_clickable_nav: true      
}    

/* feedback animation functions
*/
function countWin(net, dur) {
   // initial from https://stackoverflow.com/questions/16994662/count-animation-from-number-a-to-b
   let startTimestamp = null;
   let obj = $('.feedback.net>span');
   const duration = dur===undefined?((net/CARDWIN)*MAXCNTDUR):dur;
   const g = 128; // green value
   const c = 4; // exp scale coef
   const animate = (progress) => {
      const cval = progress*net
      const g_color = Math.floor(g * Math.exp(c*cval/CARDWIN)/Math.exp(c))
      //  colors                     == 0 20 40 49
      // exp(2*(colors/MAX))/exp(2)  == 0.1353353 0.3011942 0.6703200 0.9607894
      const c_points =  Math.floor(cval)
      obj.html("+" + c_points);
      obj.parent().css("background-color", "rgb(0," + g_color + ",0)");
   };
   const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      animate(progress);
      if (progress >= 1){return;}
      window.requestAnimationFrame(step);
   };

   // sometimes we just want to set the color
   if(duration === 0) {
       animate(1); 
   } else {
       window.requestAnimationFrame(step);
   }
   return(obj)
}
function counter(obj, prefix, start, end, duration) {
   let startTimestamp = null;
   const net = end-start;
   /*
   if(net<0) { obj.css({'background-color': 'red'})}
   if(net>0) { obj.css({'background-color': 'green'})}
   */
   const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const cval = Math.floor(start + progress*net)
      obj.html(prefix + cval);
      if (progress < 1) {
         window.requestAnimationFrame(step);
      }
   };
   window.requestAnimationFrame(step);
   return(obj)
}

function pictureRep(n, red) {
   // https://www.behance.net/gallery/3885279/Elf-Defense-2D-Game-concept-art
   // https://www.pngitem.com/middle/boxhh_cartoon-transparent-background-gold-coin-hd-png-download/
   let ncol = 10;
   var imgsrc='coin_sm.png';
   if(n<=0) { imgsrc='nocoin_sm.png'; n=red}

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


function mktrial_fixloc(c1, c2) {
    c1c=CARDS[c1];
    c2c=CARDS[c2];
    // 20200420 fixed positions based on symbol
    let pos1=LAYOUT.pos_of_sym(c1c.sym)
    let pos2=LAYOUT.pos_of_sym(c2c.sym)
    let twocards=[c1, c2]; // for index of index later
    let stim = LAYOUT.html([c1c,c2c]);
    let avail_keys = LAYOUT.keys_for_cards([c1c,c2c])['cards'];
    let trialdur = RTMAX===0?null:RTMAX;

  return({
    type: 'html-keyboard-response',
    stimulus: stim,
    post_trial_gap: SCOREANIMATEDUR,
    choices: avail_keys,
    trial_duration: trialdur,
    //TODO: use only the available options?
    prompt: "<p>left, down, or right</p>" +
    (USERTBAR?"<div class='rtbar' style='background-color:blue;height:20px;width:100%;'></div>":""),
    on_start: function(trial) {
      trial.prompt += '<p>You have ' + totalPoints() + ' points</p>' +
        (DEBUG?("<span class='debug'>" + c1 + " or " + c2 +
		"keys: " + avail_keys.join(" or ") + "</span>"):"")
    },
    on_load: function(trial) {
      // start the rt bar counting down after 300 ms
      // but only if we want it (disabled 20200420)
      if(USERTBAR) { setTimeout(rt_progress, RTPENSTART)}
    },
    on_finish: function(data){

      if(DEBUG) {
	  console.log('keys:',avail_keys,
		      'pushed:', data.key_press,
                      'idx', avail_keys.indexOf(data.key_press));
      }
      if(data.key_press === null) {
          picked = 'empty';
	  ignored = 'both';
          data.side_idx = null;
          data.side = null;
      } else {
          // which card was chosen? from key press
          idx_picked = avail_keys.indexOf(data.key_press);
          // binary choice, make ignored opposite of picked
          idx_ignored = idx_picked==0?1:0;
          picked = twocards[idx_picked];
          ignored = twocards[idx_ignored];
	  // what side did we pick
	  data.side_idx = LAYOUT.pos_of_sym(CARDS[picked].sym)
      }
      
      // score
      data.win    = CARDS[picked].score();
      data.cost   = CARDS[picked].cost;
      data.rtpen  = calc_rtpen(data.rt, data.win, data.cost);
      data.score  = data.win - data.cost - data.rtpen;

      // animate cost of card
      if(SCOREANIMATEDUR > 0) {
	SCOREBAR.animate(-1*data.cost, SCOREANIMATEDUR)
      }

      /* data we want to have for later */
      data.picked = picked;
      data.ignored = ignored;
      // track card info for convince 
      data.p      = CARDS[picked].p;
      data.sym    = CARDS[picked].sym;
      data.color  = CARDS[picked].color;
      if(DEBUG) {console.log(picked, data.sym)}
    },
})}


// make a trial from 2 card index keys
function mktrial(l, r) {
  if(DEBUG) { console.log(l,r)}
  return({
    type: 'html-keyboard-response',
    stimulus: CARDS[l].add(CARDS[r]),
    choices: [LEFT_KEY, DOWN_KEY, RIGHT_KEY],
    prompt: "<p>left or right</p>" +
    (USERTBAR?"<div class='rtbar' style='background-color:blue;height:20px;width:100%;'></div>":""),
    on_start: function(trial) {
      trial.prompt += '<p>You have ' + totalPoints() + ' points</p>' +
        (DEBUG?("<span class='debug'>" + l + " or " + r +"</span>"):"")
    },
    on_load: function(trial) {
      // start the rt bar counting down after 300 ms
      // but only if we want it (disabled 20200420)
      if(USERTBAR) { setTimeout(rt_progress, RTPENSTART)}
    },
    on_finish: function(data){

      // which card was chosen?
      if(data.key_press==LEFT_KEY){picked=l; ignored=r;}
      else                        {picked=r; ignored=l;}
      // add score
      data.l = l;
      data.r = r;
      data.cost  = CARDS[picked].cost;
      data.color = CARDS[picked].color;
      data.p     = CARDS[picked].p;
      data.win   = CARDS[picked].score();
      data.rtpen = calc_rtpen(data.rt, data.win, data.cost)
      data.score = data.win - data.cost - data.rtpen;
      data.sym   = CARDS[picked].sym;
      data.picked = picked;
      data.ignored = ignored;

      //SCOREBAR.animate(-1*data.cost)
    },
   left: l, right: r
})}

function calc_rtpen(rt, win, cost) { 
  if(!RTPEN){return(0);}

  if(win == 0) { 
    rtpen = 0
  } else {
    rt = Math.max(rt - RTPENSTART, 0) // give some lag
    rtpen = Math.min(Math.floor(rt/MAXRT*win), win - cost)
  }
  return(rtpen)
}

// feedback trial informs player of their choice
// use function to make b/c we might want to 
// change proprties of one but not all (index.html in github pages)
function mkfbk(fbk_num) { 
   let onclick=ALLOWTOUCH?SPACE_KEY:null;
   let keychoices = fbk_num==1?jsPsych.NO_KEYS:[SPACE_KEY];
   let trldur = fbk_num==1?(2*MAXCNTDUR):null;
   return({
    type: 'html-keyboard-response',
    // 20200410 - no autoadvance
    //choices: jsPsych.NO_KEYS,
    //trial_duration: FEEDBACKDUR,
    // 20200413 - updated to use coins and animation
    // 20200428 - two versions first with no response, second with resp
    choices: keychoices,
    trial_duration: trldur,
    stimulus: function(trial){
      // setup win vs nowin feedback color and message
      let prev=jsPsych.data.get().last(fbk_num).values()[0];
      let msg=(prev.win > 0)?("+"+prev.win):"0";
      let wincolor=(prev.win > 0)?"win":"nowin";
      let card = CARDS[prev.picked];
      var coststring = "- " + prev.cost + " for the card";
      
      // make small cards all white. replace one of empties with picked
      if(prev.side_idx===null) {
	  disp = "<div onclick='simkey("+SPACE_KEY+")'>Respond faster to win points!</div>";
          var coststring = "- " + prev.cost + ": too slow";
      } else {
	  let fbkclasses='small hide1 ' + wincolor+'-card';
	  disp = LAYOUT.html([card], [SPACE_KEY, SPACE_KEY, SPACE_KEY], fbkclasses);
      }

      // 20200421 - when no rtpen not in feedback, no need for this
      /*if(prev.win>0) {
       slowmsg = "<p class='feedback nowin'>Slow: -" + prev.rtpen + "</p>"
      } else {
       slowmsg = ""
      }*/
      // 20200427 - remove wallet/coin animation
      /*
          "<div class='wallet'>" +
            pictureRep(prev.win-prev.rtpen, prev.cost) +
          "</div>"+
      */
      return(
          disp +
          "<p class='feedback cost'> " + coststring + "</p>"+
          "<p class='hide2 feedback "+ wincolor +"'> + " + prev.win + " from the card</p>"+
          "<p class='hide1 feedback net "+ wincolor +"'><span>-1</span> new points!</p>"+
          "<p class='feedback total'> Your total score is <span>" + totalPoints() + "</span></p>" +
          (fbk_num>1?"<p class='feedback'><br><b>Push the space for the next pair</b></p>":"")
      )
   }, on_load: function(trial) {
       console.log('on feedback', fbk_num, keychoices,trldur)
       let prev=jsPsych.data.get().last(fbk_num).values()[0];
       let net = prev.score;
       let total = totalPoints();
       let prevtotal = total - net;
       let totalcost = prevtotal - prev.cost;
       // count up if we have more than 0 points to count
       if(fbk_num==1) {
         counter($('.feedback.total>span'), '', prevtotal, totalcost, Math.max(0,MAXCNTDUR-100))
         setTimeout(function(){
            $('.hide1').removeClass('hide1');
	    if(net>0) {
                $('.hide2').removeClass('hide2');
		countWin(net);
		counter($('.feedback.total>span'), '', totalcost, total, MAXCNTDUR)
	    }
           }, MAXCNTDUR);
       } else {
	   $('.feedback.total>span').html(total);
	   $('.hide1').removeClass('hide1');
	   if(net>0){
	      $('.hide2').removeClass('hide2');
              countWin(net, 0)
           };
       }

       // remove any coins we may have paid
       // 20200427 - disable coins
       //   if(net>=0) {coin_poof(prev.cost)}

       // animate scorebar (disabled 20200427)
       if(net>0 && SCOREANIMATEDUR && fbk_num == 1) {
          SCOREBAR.animate(prev.win - prev.rtpen - prev.cost, SCOREANIMATEDUR)
       }
       // save data every feedback if we have uniqueID from psiturk
       if(typeof uniqueId !== 'undefined' && fbk_num == 1){
          psiturk.saveData({ success: function() {if(DEBUG){console.log('saved to psiturk!')}}});
       }
   },
})}

function coin_poof(n){
    if(DEBUG) {console.log('coin poof!',n)}
    setTimeout(function(){
       $('img.coin').slice(0,n).attr('src', 'static/images/poof_gold_sm.gif')
    }, 250)
}

var feedback1= mkfbk(1);
var feedback2= mkfbk(2);
var debrief={
    type: 'html-keyboard-response',
    stimulus: function(trial){
      // setup win vs nowin feedback color and message
      return(
          "<p class='feedback'>Thanks for playing!<br>" +
          "You accumulated " + totalPoints() + " points!<br>" +
        "<b><font size='larger'>Push any key to finish!</font></b></p>")

    }
}

// TODO: figure out block structure
//phase1 = BLOCKLEN - BLOCKJITTER + Math.random(BLOCKJITTER*2) 
//phase2 = (BLOCKLEN - phase1)/BLOCKLEN 
function mkrep(l,r,n) {
 //return(jsPsych.randomization.repeat(mktrial(l,r), n, 0))
 return(jsPsych.randomization.repeat(mktrial_fixloc(l,r), n, 0))
}

// make each phase
var nlow = BLOCKLEN*CARDFREQ[0]/2;
var nhigh = BLOCKLEN*CARDFREQ[1]/4;

// blocks of 20/80, 80/20, and 100/100
p28 = [].concat(
  mkrep('p28_2S','p28_8I', nlow ),
  mkrep('p28_8I','p28_2S', nlow ),
  mkrep('p28_1H','p28_2S', nhigh),
  mkrep('p28_2S','p28_1H', nhigh),
  mkrep('p28_1H','p28_8I', nhigh),
  mkrep('p28_8I','p28_1H', nhigh))
p82 = [].concat(
  mkrep('p82_2I','p82_8S', nlow ),
  mkrep('p82_8S','p82_2I', nlow ),
  mkrep('p82_1H','p82_2I', nhigh),
  mkrep('p82_2I','p82_1H', nhigh),
  mkrep('p82_1H','p82_8S', nhigh),
  mkrep('p82_8S','p82_1H', nhigh))
// 20200410 - end block is 2x as long as others
// maybe should be p11,p11 in trials
p11 = [].concat(
  mkrep('p11_1S','p11_1I', nlow *2),
  mkrep('p11_1I','p11_1S', nlow *2),
  mkrep('p11_1H','p11_1I', nhigh*2),
  mkrep('p11_1I','p11_1H', nhigh*2),
  mkrep('p11_1H','p11_1S', nhigh*2),
  mkrep('p11_1S','p11_1H', nhigh*2))

// 20200416 - 20/60 and 60/20 blocks
p26 = [].concat(
  mkrep('p26_2S','p26_8I', nlow ),
  mkrep('p26_8I','p26_2S', nlow ),
  mkrep('p26_1H','p26_2S', nhigh),
  mkrep('p26_2S','p26_1H', nhigh),
  mkrep('p26_1H','p26_8I', nhigh),
  mkrep('p26_8I','p26_1H', nhigh))
p62 = [].concat(
  mkrep('p62_2I','p62_8S', nlow ),
  mkrep('p62_8S','p62_2I', nlow ),
  mkrep('p62_1H','p62_2I', nhigh),
  mkrep('p62_2I','p62_1H', nhigh),
  mkrep('p62_1H','p62_8S', nhigh),
  mkrep('p62_8S','p62_1H', nhigh))

// combine all
trials=[p26, p62, p26, p62, p11].
  map( (a) => jsPsych.
  randomization.shuffle(a)).flat()

// show all left chards
if(DEBUG){console.log('left cards:', trials.map((x)=> x.left))}

// add feedback after each trial
trials = trials.flatMap((k) => [k, feedback1, feedback2]);

var timeline = [get_info, instructions, trials, final_thoughts, debrief].flat()

/* 'timeline' used in templates/exp.html */
