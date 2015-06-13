var app = angular.module('sidewinder-app', ['sidewinder.controllers', 'sidewinder.services', 'ionic', 'ngCordova']);
app
    .config(function ($stateProvider, $urlRouterProvider) {
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
    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
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
app.run(function ($http, $cordovaPush) {

    var iosConfig = {
        "badge": true,
        "sound": true,
        "alert": true
    };

    document.addEventListener("deviceready", function () {
        $cordovaPush.register(iosConfig).then(function (deviceToken) {
            console.log("deviceToken: " + deviceToken);
        }, function (err) {
            alert("Registration error: " + err)
        });
    }, false);
});