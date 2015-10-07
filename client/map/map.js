var map = angular.module('greenfeels.map', ['ngAnimate']);

map.controller('MapController', ['$scope', '$state', '$animate', 'Prompts', 'Entries', 'Twemoji',
  function($scope, $state, $animate, Prompts, Entries, Twemoji) {
    // Expose our Twemoji service within the scope.
    // This is used to conveniently generate the `src`
    // attributes of the <img> tags within the buttons.
    $scope.getTwemojiSrc = Twemoji.getTwemojiSrc;

    $scope.selectHandler = function($event) {
      // $state.transitionTo('home.selected');
      // clearSelectedStates();
      // var emotion = $event.currentTarget.attributes['data-emotion-id'].value;
      // $event.currentTarget.classList.add('selected-emoji');
      // $scope.entry.emotion = emotion;
      // $scope.secondPrompt = Prompts.getSecondPrompt(emotion);
    };

  }]);
