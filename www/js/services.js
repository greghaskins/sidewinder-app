var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

angular.module('sidewinder.services', [])
    .service('SidewinderServer', function ($q, $http) {
        var server = this;
        server.registerDevice = function (deviceToken) {
            var url = sidewinderServerHost + "/devices";
            return $q(function (resolve, reject) {
                $http.post(url, {deviceId: deviceToken}).then(function () {
                    resolve(deviceToken);
                }).catch(function () {
                    reject("Failed to register device.");
                })
            });
        };
        server.unregisterDevice = function (deviceToken) {
            var url = sidewinderServerHost + "/devices/" + deviceToken;
            return $q(function (resolve, reject) {
                $http.delete(url).then(function () {
                    resolve(deviceToken);
                }).catch(function () {
                    reject("Failed to unregister device.");
                })
            });
        };
        server.addRepository = function (deviceToken, repo) {
            var url = sidewinderServerHost + "/devices/" + deviceToken + "/repositories";
            return $q(function (resolve, reject) {
                $http.post(url, {name: repo.fullName}).then(function () {
                    resolve(repo);
                }).catch(function () {
                    reject("Failed to add repo to server.");
                })
            });
        };
    })
    .factory('StatusRefresher', function ($q, RepoAssessor) {
        function refreshOne(repository) {
            var defer = $q.defer();
            RepoAssessor.assess(repository).then(function (assessment) {
                    repository.status = assessment;
                    defer.resolve(assessment);
                },
                function (reason) {
                    console.error(reason);
                    defer.reject(reason);
                });
            return defer.promise;
        }

        return {
            refreshAll: function (repositories) {
                return $q.all(repositories.map(refreshOne));
            }
        };
    })
    .factory('RepoAssessor', function ($http, $q) {
        return {
            assess: function (repository) {
                var url = "https://api.github.com/repos/" + repository.fullName + "/commits/master/status";
                return $q(function (resolve) {
                    $http.get(url).success(function (data) {
                        var state = data.state;
                        if (state === 'pending' && data.statuses.length < 1) {
                            state = 'unknown';
                        }
                        var statuses = (data.statuses || []).map(function (status) {
                            return {
                                state: status.state,
                                message: status.description,
                                href: status.target_url,
                                context: status.context
                            };
                        });
                        resolve({state: state, statuses: statuses});
                    }).error(function () {
                        resolve({state: 'unknown'});

                    });
                });
            }
        };
    })
    .factory('GitHubRepo', function () {
        return function (owner, name) {
            this.owner = owner;
            this.name = name;
            this.status = {
                state: 'unknown'
            };

            Object.defineProperty(this, 'fullName', {
                get: function () {
                    return this.owner + '/' + this.name;
                }
            });
            Object.defineProperty(this, 'displayURL', {
                get: function () {
                    return ('https://github.com/' +
                    (this.owner || '{owner}') +
                    '/' +
                    (this.name || '{repo-name}'));
                }
            });
            this.toObject = function () {
                return {
                    owner: this.owner,
                    name: this.name
                };
            }
        };
    })
    .factory('repositories', function (GitHubRepo, SidewinderServer) {
        var repositories = {};
        var list = [];
        repositories.add = function (repo) {
            list.push(repo);
            persistLocally();
            if (repositories.deviceToken) {
                SidewinderServer.addRepository(repositories.deviceToken, repo);
            }
        };
        repositories.remove = function (repo) {
            var index = list.indexOf(repo);
            list.splice(index, 1);
            persistLocally();
        };
        Object.defineProperty(repositories, 'list', {
            get: function () {
                return list;
            }
        });

        function persistLocally() {
            window.localStorage['repositories'] = JSON.stringify(list.map(function (repo) {
                return repo.toObject();
            }));
        }

        function load() {
            var items = JSON.parse(window.localStorage['repositories'] || '[]');
            list = items.map(function (object) {
                return new GitHubRepo(object.owner, object.name);
            });
        }

        load();

        return repositories;
    });