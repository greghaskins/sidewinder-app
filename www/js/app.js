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
    function fromObject(repoInfo) {
        var repo = {
            owner: repoInfo.owner,
            name: repoInfo.name,
        };
        Object.defineProperty(repo, 'fullName', {
            get: function() {
                return repo.owner + '/' + repo.name;
            },
        });
        return repo;
    };

    function toObject(gitHubRepo) {
        return {
            owner: gitHubRepo.owner,
            name: gitHubRepo.name,
        };
    };

    var GitHubRepo = {
        fromObject: fromObject,
        toObject: toObject,
    };
    return GitHubRepo;
})

.controller('RepoConfigController', function($scope, $ionicModal, repositories, GitHubRepo) {
    $scope.repositories = repositories;

    var modalScope = $scope.$new(true);
    $ionicModal.fromTemplateUrl('edit-repo.html', {
        scope: modalScope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
        modalScope.cancel = function() {
            modal.hide();
        };
        modalScope.save = function(repo) {
            repositories.add(GitHubRepo.fromObject(repo));
            modal.hide();
        }
    });

    $scope.addRepository = function() {
        var repo = modalScope.repo = {
            owner: '',
            name: '',
            getURL: function() {
                if (repo.owner && repo.name) {
                    return 'https://github.com/' + repo.owner + '/' + repo.name;
                } else {
                    return 'https://github.com/{owner}/{repo-name}';
                }
            }
        };
        $scope.modal.show();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

})

.factory('repositories', function(GitHubRepo) {
    var repositories = {};
    var list = [];
    repositories.add = function(repo) {
        list.push(repo);
        persist();
    };
    repositories.remove = function(repo) {
        var index = list.indexOf(repo);
        list.splice(index, 1);
        persist();
    };
    Object.defineProperty(repositories, 'list', {
        get: function() {
            return list;
        }
    });


    function persist() {
        window.localStorage['repositories'] = JSON.stringify(list.map(GitHubRepo.toObject));
    }

    function load() {
        var items = JSON.parse(window.localStorage['repositories'] || '[]');
        list = items.map(GitHubRepo.fromObject);
    }

    load();

    return repositories;
})
