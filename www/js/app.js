angular.module('sidewinder-app', ['ionic'])

.run(function($ionicPlatform) {
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
})

.controller('StatusController', function($scope, $timeout, $ionicModal) {

  $scope.repoStatuses = [{
    'name': 'first thing',
    'state': 'success',
  }, {
    'name': 'second thing',
    'state': 'failed',
  }];

})
