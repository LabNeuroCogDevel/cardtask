/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);


// cars contain some values
class Card {
   constructor(sym,  color, cost, pays, p){
      this.sym = sym; this.color=color; this.cost=cost;
      this.pays=pays; this.p=p;
   }
   html(side) {
     return('<div class="card-container"> <div class="card '+
             this.color +' '+ side + '">' +
              this.sym +'</div>'+
            '<p> -'+ this.cost + '</p></div>');
  }
  score(){
     return(((this.p - Math.random(1)) > 0) * this.pays - this.cost);
  }
  add(right){
   return('<div class="twocards">'+
           this.html('left')+
           right.html('right')+
           '</div>')
  }
};

// initialize cards. probablility will change
var cards = [
   new Card('✿', 'blue', 10 , 10 , .2),
   new Card('❖', 'blue', 10 , 10 , .8),
   new Card('✢', 'red' , 100, 500, 1)
];


var instructions = {       
    type: 'instructions',     
    pages: [      
    '<div>In this experiment, you will use points to buy a card<br>' +       
    'Some cards pay better or more often then others<br>' +      
    'Use the arrow keys to select a card</div>',     

    '<div>Blue cards cost 10 points.<br>' +
    'Red cards cost 100 points.<br>' +
    'Pay attention to the symbol on the card</div>',
   
    "Choices will look like: <br>" +
     cards[0].add(cards[1])
    ],        
    show_clickable_nav: true      
}    

const INITPOINTS=100;

function mktrial(l, r) {
  return({
    type: 'html-keyboard-response',
    stimulus: cards[l].add(cards[r]),
    choices: [37, 39, 'q'],
    //choices: ['left arrow', 'right arrow', 'q'],
    prompt: "<p>left or right<p>",
    on_start: function(trial) {
      prevscores=jsPsych.data.get().select('score').sum()
      cur_score = INITPOINTS + prevscores;
      trial.prompt += '<p>You have ' + cur_score + ' points</p>';
      console.log('trial start', cur_score, prevscores);
    },
    on_finish: function(data){
      if(data.key_press == 81){
        jsPsych.endExperiment('The experiment was ended by pressing Q.');
      }

      // increase score
      if(data.key_press==37){
         data.score = cards[l].score();
      }else {
         data.score = cards[r].score();
      }
      console.log('trial end', data.score, data) 
    }
})}

/* start the experiment */
jsPsych.init({      
   timeline: [instructions, mktrial(0,1), mktrial(2,0), mktrial(1,2)],
   on_finish: function() {
      psiturk.saveData({
         success: function() { psiturk.completeHIT(); }
      });
   },
   on_data_update: function(data) {
      psiturk.recordTrialData(data);
   }
});
