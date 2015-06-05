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

.controller('StatusController', function($scope, GitHubRepo, RepoAssessor) {
    var repositories = [

        GitHubRepo('sidewinder-team', 'sidewinder-server'),
        GitHubRepo('sidewinder-team', 'sidewinder-ios'),
        GitHubRepo('greghaskins', 'sidewinder-app'),
        GitHubRepo('sidewinder-team' ,' sidewinder-team.github.io'),

    ];
    $scope.refresh = function() {
        $scope.repoAssessments = [];
        repositories.forEach(function(repository) {
            RepoAssessor.assess(repository).then(function(assessment) {
                    assessment.name = repository.fullName;
                    $scope.repoAssessments.push(assessment);
                },
                function(reason) {
                    console.error(reason);
                });

        });
    }
    $scope.refresh();

})

.factory('RepoAssessor', function($http, $q) {
    return {
        assess: function(repository) {
            var repo = repository.owner + "/" + repository.name;
            var url = "https://api.github.com/repos/" + repo + "/commits/master/status";

            var deferred = $q.defer();
            $http.get(url).success(function(data) {

                deferred.resolve({
                    state: data.state,
                });

            }).error(function() {

                deferred.resolve({
                    state: 'pending',
                });

            });

            return deferred.promise;
        }
    };
})

.factory('GitHubRepo', function() {
    function GitHubRepo(owner, name) {
        var repo = {
            owner: owner,
            name: name
        };
        Object.defineProperty(repo, 'fullName', {
            get: function() {
                return repo.owner + '/' + repo.name;
            },
        });
        return repo;
    };

    return GitHubRepo;
});
