/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

var trial = {       
    type: 'instructions',     
    pages: [      
    '<div>In this experiment, you will view a ' +       
    'series of images and answer questions.<br>' +      
    'Answer with the keys "y" or "n".',     

    'Here is an example:<br><br> ' +        
    '<img src="../img/age/of2.jpg"></img><br><br>' +       
    'Is this person OLD or YOUNG?'      
    ],        
    show_clickable_nav: true      
}       


/* start the experiment */
jsPsych.init({      
   timeline: [trial],        
   on_finish: function() {
      psiturk.saveData({
         success: function() { psiturk.completeHIT(); }
      });
   },
   on_data_update: function(data) {
      psiturk.recordTrialData(data);
   }
});
