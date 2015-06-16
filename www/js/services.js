var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

angular.module('sidewinder.services', ['ngLodash'])
    .service('SidewinderServer', function($q, $http, GitHubRepo, lodash) {
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

        server.listRepositories = function(deviceToken) {
            return $q(function(resolve, reject) {
                var url = sidewinderServerHost + "/devices/" + deviceToken + "/repositories";
                $http.get(url)
                    .then(function(response) {
                        resolve(lodash.map(response.data, function(repositoryEntry) {
                            var elements = repositoryEntry.name.split('/');
                            return new GitHubRepo(elements[0], elements[1]);
                        }));
                    }).catch(function() {
                        reject("Failed to add repo to server.");
                    })
            })
        }
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
                return $q(function(resolve) {
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
                                timestamp: status.updated_at
                            };
                        });
                        resolve({
                            state: state,
                            statuses: statuses
                        });
                    }).error(function() {
                        resolve({
                            state: 'unknown'
                        });
                    });
                });
            }
        };
    })
    .factory('GitHubRepo', function() {
        return function(owner, name) {
            var repo = this;
            repo.owner = owner;
            repo.name = name;
            repo.status = {
                state: 'unknown'
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
            repo.toObject = function() {
                return {
                    owner: repo.owner,
                    name: repo.name
                };
            }
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
            window.localStorage['repositories'] = JSON.stringify(list.map(function(repo) {
                return repo.toObject();
            }));
        }

        function load() {
            var items = JSON.parse(window.localStorage['repositories'] || '[]');
            list = items.map(function(object) {
                return new GitHubRepo(object.owner, object.name);
            });
        }

        load();

        return repositories;
    })
    .factory('PushService', function($q, $ionicPlatform, $window) {
        function init() {
            return $q(function(resolve, reject) {
                $ionicPlatform.ready(function() {
                    var push = $window.PushNotification.init({
                        ios: {
                            badge: true,
                            sound: true,
                            alert: true
                        }
                    });
                    var unregister = $q(function(reject, resolve) {
                        push.unregister(function() {
                            resolve();
                        }, function(error) {
                            reject(error);
                        });
                    });
                    var addHandler = function(callback){
                        push.on('notification', callback);
                    };
                    push.on('error', function(err){
                        console.log("push error: " + err);
                    });
                    push.on('registration', function(data) {
                        resolve({
                            addHandler: addHandler,
                            deviceToken: data.registrationId,
                            unregister: unregister
                        });
                    });
                });
            });
        }

        return {
            init: init
        };
    });
