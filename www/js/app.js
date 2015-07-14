var app = angular.module('sidewinder-app', ['sidewinder.controllers', 'sidewinder.services', 'ionic', 'ngCordova', 'yaru22.angular-timeago']);
app
    .constant('debugMode', {
      active: false, // activate for testing in a desktop browser
      deviceToken: 'a417193a3c357874303e9346c8380ac3b599fa3b84290bccf703a0a45505afbf'
    })
    .config(function($stateProvider, $urlRouterProvider, $httpProvider, debugMode) {
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'home.html'
            })
            .state('settings', {
                url: '/settings',
                templateUrl: 'settings.html'
            });
        if (debugMode.active) {
          $httpProvider.interceptors.push('loggingHttpInterceptor');
        }
    })
    .run(function($ionicPlatform, PushService, repositories,  $log, debugMode) {

        $log.info('--- Starting Sidewinder ---');
        if (debugMode.active) {
          $log.warn('SIDEWINDER DEBUG MODE ACTIVE');
        }

        $ionicPlatform.ready(function() {
          PushService.init().then(function(push){
              $log.debug("Push deviceToken: " + push.deviceToken);
              repositories.deviceToken = push.deviceToken;
          });
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    });
