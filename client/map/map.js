var map = angular.module('greenfeels.map', ['ngAnimate']);

map.controller('MapController', ['$scope', '$state', '$animate', 'Prompts', 'Entries', 'Twemoji',
  function($scope, $state, $animate, Prompts, Entries, Twemoji) {
    // Expose our Twemoji service within the scope.
    // This is used to conveniently generate the `src`
    // attributes of the <img> tags within the buttons.
    $scope.getTwemojiSrc = Twemoji.getTwemojiSrc;

    $state.transitionTo('map.initial');

    $scope.selectHandler = function($event) {
      $state.transitionTo('map.selected');
      clearSelectedStates();
      var emotion = $event.currentTarget.attributes['data-emotion-id'].value;
      $event.currentTarget.classList.add('selected-emoji');
      makeMap(emotion);
    };

    var makeMap = function (emotion) {

      d3.selectAll(".word-map > *").remove();

      var fill = d3.scale.linear()
        .domain([-1, 0, 1])
        // .range(["#E51800", "#740F5D", "#0006BF"]); //red/purple/blue
        .range(["#c23423", "#6a1958", "#1d22a2"]); //duller red/purple/blue
        // .range(["#e05276", "#23c29b"]); //matching moodlet, original purple is #9952e0, twitter yellow is E2BE40

      var fontSize = d3.scale.linear()
        .domain([1, 40])
        .range([30, 150]);

      var draw = function (words, bounds) {
        d3.select(".word-map").append("svg")
            .attr("width", 1200)
            .attr("height", 550)
            .append("g")
            .attr("transform", "translate(600, 270)") //figure out what this is later
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .text(function(d) { return d.text; })
            .style("font-size", function(d) { return fontSize(d.frequency); })
            .style("font-family", "Varela Round")
            .style("font-weight", 400)
            .style("fill", function(d) { return fill(d.averageSentiment); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            });
      };

      // Entries.getWords(emotion)
      //   .then(function(data) {
      //     d3.layout.cloud().size([650, 650])
      //       .words(data)
      //       .font("Raleway")
      //       .fontSize(function(d) { return d.frequency; })
      //       .on("end", draw)
      //       .start();
      //   });

      var myWords = Entries.getWordsTest(emotion);

      d3.layout.cloud().size([700, 500])
        .words(myWords)
        .rotate(function() { return ~~(Math.random()*2) * 90; })
        .font("Varela Round")
        .fontSize(function(d) { return fontSize(d.frequency); })
        .fontWeight(function() { return 400; })
        .text(function(d) { return d.text; })
        .on("end", draw) //draw is passed in two objects, an array of the word objects and their positions, and the bounds
        .start();

    };

    function clearSelectedStates() {
      var selected = document.getElementsByClassName('selected-emoji');
      for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove('selected-emoji');
      }
    }

  }]);
