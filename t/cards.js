var util = require('../static/js/utils.js')
var t = require('tap')
c0 = new util.Card('✿', 'blue', 10 , 500, 0)
c1 = new util.Card('✿', 'blue', 10 , 500, 1)
//sanity check
t.equal(c0.sym, '✿')

/* test probability function */
t.equal(c0.score(),   0, "0 probability never scores")
t.equal(c1.score(), 500, "1 probability always scores")

// run 1000 times, should be near 500
c5 = new util.Card('x', 'none', 10 , 1, .5)
sum = [...Array(1000).keys()].map((x) => c5.score()).reduce((x,y)=>x+y);
t.ok(sum < 600, "p=.5 x 1000 < 600")
t.ok(sum > 400, "p=.5 x 1000 > 400")
