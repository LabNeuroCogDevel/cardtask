// cars contain some values
class Card {
   constructor(sym,  color, cost, pays, p){
      this.sym = sym; this.color=color; this.cost=cost;
      this.pays=pays; this.p=p;
   }
   html(side) {
     // nonbreaking space to preserve alignment
     let sym = this.sym==""?"&nbsp;":this.sym;
     let cost= this.cost!=0?("-"+this.cost):"&nbsp;";

     return('<div class="card-container" id="card-' + this.sym +'">' +
	    (DEBUG?("<p class='debug'>"+this.p+"</p>"):"") +
            '<div class="card '+ this.color +' '+ side + '">' + sym + '</div>' +
	    // if cost is zero, dont display anything
            '<p> '+ cost + '</p>' + 
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
