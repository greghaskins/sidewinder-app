var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

angular.module('sidewinder.services', [])
    .service('SidewinderServer', function($q, $http) {
        var server = this;
        server.registerDevice = function(deviceToken) {
            var url = sidewinderServerHost + "/devices";
            return $q(function(resolve, reject) {
                $http.post(url, {
                    deviceId: deviceToken
                }).then(function() {
                    resolve(deviceToken);
                }).catch(function() {
                    reject("Failed to register device.");
                })
            });
        };
        server.unregisterDevice = function(deviceToken) {
            var url = sidewinderServerHost + "/devices/" + deviceToken;
            return $q(function(resolve, reject) {
                $http.delete(url).then(function() {
                    resolve(deviceToken);
                }).catch(function() {
                    reject("Failed to unregister device.");
                })
            });
        };
        server.addRepository = function(deviceToken, repo) {
            var url = sidewinderServerHost + "/devices/" + deviceToken + "/repositories";
            return $q(function(resolve, reject) {
                $http.post(url, {
                    name: repo.fullName
                }).then(function() {
                    resolve(repo);
                }).catch(function() {
                    reject("Failed to add repo to server.");
                })
            });
        };
    })
    .factory('StatusRefresher', function($q, RepoAssessor) {
        function refreshOne(repository) {
            var defer = $q.defer();
            RepoAssessor.assess(repository).then(function(assessment) {
                    repository.status = assessment;
                    defer.resolve(assessment);
                },
                function(reason) {
                    console.error(reason);
                    defer.reject(reason);
                });
            return defer.promise;
        }

        return {
            refreshAll: function(repositories) {
                return $q.all(repositories.map(refreshOne));
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

                    var statuses = (data.statuses || []).map(function(status) {
                        return {
                            state: status.state,
                            message: status.description,
                            href: status.target_url,
                            context: status.context,
                        };
                    });

                    deferred.resolve({
                        state: state,
                        statuses: statuses,
                    });

                }).error(function() {
                    deferred.resolve({
                        state: 'unknown'
                    });

                });

                return deferred.promise;

                // TODO: clean it up.
                //
                // assess: function (repository) {
                //     return $q(function (resolve) {
                //         var url = "https://api.github.com/repos/" + repository.fullName + "/commits/master/status";
                //         $http.get(url)
                //             .success(function (data) {
                //                 var state = data.state;
                //                 if (state === 'pending' && data.statuses.length < 1) {
                //                     state = 'unknown';
                //                 }
                //                 resolve({state: state});
                //             }).error(function () {
                //                 resolve({state: 'unknown'});
                //             })
                //     })

            }
        };
    })
    .factory('GitHubRepo', function() {
        function fromObject(repoInfo) {
            var repo = {
                owner: repoInfo.owner,
                name: repoInfo.name,
                status: {
                    state: 'unknown'
                }
            };
            Object.defineProperty(repo, 'fullName', {
                get: function() {
                    return repo.owner + '/' + repo.name;
                }
            });
            Object.defineProperty(repo, 'displayURL', {
                get: function() {
                    return ('https://github.com/' +
                        (repo.owner || '{owner}') +
                        '/' +
                        (repo.name || '{repo-name}'));
                }
            });
            return repo;
        }

        function toObject(gitHubRepo) {
            return {
                owner: gitHubRepo.owner,
                name: gitHubRepo.name
            };
        }

        return {
            fromObject: fromObject,
            toObject: toObject
        };
    })

.factory('repositories', function(GitHubRepo, SidewinderServer) {
    var repositories = {};
    var list = [];
    repositories.add = function(repo) {
        list.push(repo);
        persistLocally();
        if (repositories.deviceToken) {
            SidewinderServer.addRepository(repositories.deviceToken, repo);
        }
    };
    repositories.remove = function(repo) {
        var index = list.indexOf(repo);
        list.splice(index, 1);
        persistLocally();
    };
    Object.defineProperty(repositories, 'list', {
        get: function() {
            return list;
        }
    });

    function persistLocally() {
        window.localStorage['repositories'] = JSON.stringify(list.map(GitHubRepo.toObject));
    }

    function load() {
        var items = JSON.parse(window.localStorage['repositories'] || '[]');
        list = items.map(GitHubRepo.fromObject);
    }


    load();

    return repositories;
});
