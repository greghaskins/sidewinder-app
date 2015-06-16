var app = angular.module('sidewinder-app', ['sidewinder.controllers', 'sidewinder.services', 'ionic', 'ngCordova', 'yaru22.angular-timeago']);
app
    .config(function($stateProvider, $urlRouterProvider) {
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
    })
    .run(function($ionicPlatform, PushService) {

        PushService.init().then(function(push){
            console.log("Push deviceToken: " + push.deviceToken);
        });

        $ionicPlatform.ready(function() {
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
