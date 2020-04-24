// Card: how to score and display cards
//       also hold onto card poperties 
//          probability, payout, color, symbol
// GLOBALS: ALLOWTOUCH and DEBUG
class Card {
   constructor(sym, color, cost, pays, p, type){
      this.sym = sym; this.color=color; this.cost=cost;
      this.pays=pays; this.p=p;
      this.type = type; // (I)nitial, (S)econd, (H)igh
   }
   html(side, charcode, extra) {
     // nonbreaking space to preserve alignment
     let sym = this.sym==""?"&nbsp;":this.sym;
     let cost= this.cost!=0?("-"+this.cost):"&nbsp;";
     let onclick = (charcode === undefined || charcode === null || !ALLOWTOUCH)?
         "":
         (" onclick='simkey("+charcode+")'")

     let classes =  ['card', this.color, side, extra].join(" ");
     return('<div class="card-container" id="card-' + this.sym +'">' +
	    (DEBUG?("<p class='debug'>"+this.p+"</p>"):"") +
            '<div class="'+ classes  + '" '+
	      onclick + '>' + sym + '</div>' +
	    // if cost is zero, dont display anything
            '<p> '+ (this.sym!=""?cost:"&nbsp;") + '</p>' + 
            '</div>');
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

class ScoreBar {
    /*
     * keep track of the score
     * should reach top expodentially
     */
    constructor(id, h) {
	this.obj = $(id)
	this.total = 20
    }
    after_inc(inc){
	return(inc/this.max)
    }
    animate(inc){
	// increasing height extends the bottom
        // but we want to extend the top
	// so we'll modify 'top'- 0% is very top
        // 100% is very bottom
	const newp = inc/10
	this.total += newp
        this.obj.css("background-color", (inc>0?"green":"red"));
	this.obj.animate({top: (100-this.total) + "%"}, SCOREANIMATEDUR);
	console.log('animate',100-this.total);
    }
}

function simkey(key) {
  // for charcode see e.g. "a".charCodeAt(0) 
   
  // doesnt work
  // jQuery.event.trigger({ type : 'keypress', which: key});
  
  // from jsPsych/tests/testing-utils.js:
  let dispel = document.querySelector('.jspsych-display-element');
  dispel.dispatchEvent(new KeyboardEvent('keydown', {keyCode: key}));
  dispel.dispatchEvent(new KeyboardEvent('keyup',   {keyCode: key}));
  // record that it was simulated push instead of key 
  jsPsych.data.get().addToLast({touched: true});
  console.log('sent', key, 'updated', jsPsych.data.get().last().values());
}



function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
		throw new AssertException(message);
	}
}

// Mean of booleans (true==1; false==0)
function boolpercent(arr) {
	var count = 0;
	for (var i=0; i<arr.length; i++) {
		if (arr[i]) { count++; } 
	}
	return 100* count / arr.length;
}

// export for testing
if(typeof module !== 'undefined') { module.exports = { Card }; }
