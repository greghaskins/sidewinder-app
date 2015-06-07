angular.module('sidewinder-app', ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'home.html',
        })
        .state('settings', {
            url: '/settings',
            templateUrl: 'settings.html',
        });
})

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

.controller('StatusController', function($scope, repositories, StatusRefresher) {
    $scope.repoStatuses = [];

    function rebuildStatuses() {
        $scope.repoStatuses = repositories.list.map(function(repo) {
            return {
                repo: repo,
                status: {
                    state: 'unknown',
                }
            }
        });
        $scope.refresh();
    }

    function refreshComplete() {
        $scope.$broadcast('scroll.refreshComplete');
    }
    $scope.refresh = function() {
        StatusRefresher.refreshAll($scope.repoStatuses).then(refreshComplete, refreshComplete);
    }

    $scope.$on('$ionicView.enter', function(event, state) {
        if (state.stateName === 'home') {
            rebuildStatuses();
        }
    });

})

.factory('StatusRefresher', function($q, RepoAssessor) {
    function refreshOne(repoStatus) {
        var defer = $q.defer();
        var repository = repoStatus.repo;
        RepoAssessor.assess(repository).then(function(assessment) {
                repoStatus.status = assessment;
                defer.resolve(assessment);
            },
            function(reason) {
                console.error(reason);
                defer.reject(reason);
            });
        return defer.promise;
    }

    return {
        refreshAll: function(repoStatuses) {
            return Promise.all(repoStatuses.map(refreshOne));
        }
    };
})

.factory('RepoAssessor', function($http, $q) {
    return {
        assess: function(repository) {
            var url = "https://api.github.com/repos/" + repository.fullName + "/commits/master/status";

            var deferred = $q.defer();
            $http.get(url).success(function(data) {

                var state = data.state;
                if (state === 'pending' && data.statuses.length < 1) {
                    state = 'unknown';
                }
                deferred.resolve({
                    state: state,
                });

            }).error(function() {

                deferred.resolve({
                    state: 'unknown',
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
})

.controller('RepoConfigController', function($scope, repositories) {
    $scope.repositories = repositories;
})

.factory('repositories', function(GitHubRepo) {
    var repositories = {};
    var list = [

        GitHubRepo('sidewinder-team', 'sidewinder-server'),
        GitHubRepo('sidewinder-team', 'sidewinder-ios'),
        GitHubRepo('greghaskins', 'sidewinder-app'),
        GitHubRepo('sidewinder-team', 'sidewinder-team.github.io'),

    ];
    repositories.add = function(repo) {
        list.push(repo);
    };
    repositories.remove = function(repo) {
        var index = list.indexOf(repo);
        list.splice(index, 1);
    };
    Object.defineProperty(repositories, 'list', {
        get: function() {
            return list;
        }
    });
    return repositories;
})
