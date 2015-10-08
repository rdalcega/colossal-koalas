var app = angular.module('greenfeels',
  ['greenfeels.services', 'greenfeels.home', 'greenfeels.journal', 'greenfeels.auth','greenfeels.graph', 'greenfeels.map', 'ui.router', 'ngAnimate']);

app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {

    //HERE IS A COMMENT

    $stateProvider
      .state('home', {
        // Parent state of home; load home.html, set controller, use initial state
        url: '/',
        
        views: {
          nav: {
            templateUrl: './nav/nav.html',
            controller: 'AuthController'
          },

          page: {
            templateUrl: './home/home.html',
            controller: 'HomeController',
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('home.initial', {
        // Initial nested state; display first prompt
        // url: '/',

        views: {
          initial: {
            templateUrl: './home/home.init.html'
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('home.selected', {
        // Selected state of home; load second prompt, display text input and submit button
        // url: '/',

        views: {
          selected: {
            templateUrl: './home/home.selected.html'
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('journal', {
        url: '/journal', // optional
        
        views: {
          
          nav: {
            templateUrl: './nav/nav.html',
            controller: 'AuthController'
          },

          page: {
            templateUrl: './journal/journal.html',
            controller: 'JournalController'
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }

      })
      .state('graph', {
        url: '/graph', // optional
        
        views: {
          
          nav: {
            templateUrl: './nav/nav.html',
            controller: 'AuthController'
          },

          page: {
            templateUrl: './graph/graph.html',
            controller: 'GraphController'
          }
        },

        data: {
          //change back later
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('map', {
        url: '/map',

        views: {
          nav: {
            templateUrl: './nav/nav.html',
            controller: 'AuthController'
          },

          page: {
            templateUrl: './map/map.html',
            controller: 'MapController'
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('map.initial', {
        // url: '/map',

        views: {
          initial: {
            templateUrl: './map/map.init.html',
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('map.selected', {
        // url: '/map',

        views: {
          selected: {
            templateUrl: './map/map.selected.html',
          }
        },

        data: {
          requireLogin: true //authentication is required to access this state
        }
      })
      .state('signin', {
        url: '/signin',
        
        views: {
        
          page: {
            templateUrl: './auth/signin.html',
            controller: 'AuthController'
          }
        },

        data: {
          requireLogin: false //authentication is not required to access this state
        }
      })
      .state('signup', {
        url: '/signup',
        
        views: {
        
          page: {
            templateUrl: './auth/signup.html',
            controller: 'AuthController'
          }
        },

        data: {
          requireLogin: false //authentication is not required to access this state
        }
      });

      $urlRouterProvider.otherwise('/');

  }])
.factory('AttachTokens', function ($window) {
  //this factory stops all outgoing requests, then looks in local storage
  //for the user's JWT and adds the token to the request header
  var attach = {
    request: function (object) {
      var jwt = $window.localStorage.getItem('moodlet');
      if (jwt) {
        object.headers['x-access-token'] = jwt;
      }
      object.headers['Allow-Control-Allow-Origin'] = '*';
      return object;
    }
  };
  return attach;
})
.run(function ($rootScope, $location, $state, Auth) {
  //this function listens for when angular changes states
  //when the state is changed, if the state requires authentication
  //local storage is checked for the JWT
  //if there is no JWT stored in local storage, transition to requested state is prevented
  //state is changed to 'signin'
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.data.requireLogin && !Auth.isAuth()) {
      //user isn't authenticated, so transition state to signin
      event.preventDefault(); //prevent state transition from happening
      $state.transitionTo('signin'); //transitions state to signin
    }
  });
});
