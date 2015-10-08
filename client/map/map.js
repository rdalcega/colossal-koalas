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
        .domain([-1, 1])
        .range("red", "blue");

      var draw = function (words, bounds) {
        d3.select(".word-map").append("svg")
            .attr("width", 600)
            .attr("height", 600)
            .append("g")
            .attr("transform", "translate(150,150)") //figure out what this is later
            .selectAll("text")
            .data(words)
            .style("fill", function(d) { console.log(d); return fill(d.averageSentiment); })
            .enter().append("text")
            .text(function(d) { console.log(d); return d.word; })
            .style("font-size", function(d) { return d.size * 3 + "px"; })
            .style("font-family", "Raleway")
            .style("font-weight", 400)
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

      d3.layout.cloud().size([600, 600])
        .words(myWords)
        .font("Raleway")
        .fontSize(function(d) { return d.frequency; })
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
