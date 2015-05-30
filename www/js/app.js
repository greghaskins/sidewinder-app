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

.controller('StatusController', function($scope, RepoAssessor) {
  var repositories = [

    {
      owner: 'sidewinder-team',
      name: 'sidewinder-server',
    }, {
      owner: 'sidewinder-team',
      name: 'sidewinder-ios',
    }, {
      owner: 'greghaskins',
      name: 'sidewinder-app',
    },

  ];
  $scope.repoAssessments = [];
  repositories.forEach(function(repository) {
    RepoAssessor.assess(repository).then(function(assessment) {
      $scope.repoAssessments.push(assessment);
    }, function(reason) {
      console.error(reason);
    });

  });

})

.factory('RepoAssessor', function($http, $q) {
  return {
    assess: function(repository) {
      var repo = repository.owner + "/" + repository.name;
      var url = "https://api.github.com/repos/" + repo + "/statuses/master";

      var deferred = $q.defer();
      $http.get(url).success(function(data) {
        if (data.length < 1) {
          deferred.resolve({
            name: repo,
            state: 'unknown',
          });
        }

        var status = data[0];
        deferred.resolve({
          name: repo,
          state: status.state,
        });
      }).error(function() {
        colsole.error('Failed to get statuses from ' + url);
        deferred.resolve({
          name: repo,
          state: 'unknown',
        });
      });

      return deferred.promise;
    }
  };
})
