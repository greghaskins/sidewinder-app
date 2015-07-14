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
                    }).catch(function(err) {
                        reject("Failed to retrieve repos from server.");
                    })
            })
        }
    })
    .factory('RepositoryRepository', function($q, SidewinderServer, PushService){
      var Repository = {};
      Repository.all = function(){
        return $q(function(resolve, reject){
          PushService.init().then(function(push){
            SidewinderServer.listRepositories(push.deviceToken).then(function(results){
              resolve(results);
            }).catch(function(err){
              reject(err);
            });
          }).catch(function(err){
            console.log(err);
            reject(err);
          });
        });
      };
      Repository.add = function(repo) {
        return $q(function(resolve, reject){
          PushService.init().then(function(push){
            SidewinderServer.addRepository(push.deviceToken, repo).then(resolve).catch(reject);
          });
        })};
      return Repository;
    })
    .factory('loggingHttpInterceptor', function($q, $log){
        var interceptor = {
          request: function(config){
            $log.info('HTTP request:\n' + JSON.stringify(config));
            return $q(function(resolve, reject){
              resolve(config);
            });
          },
          response: function(response){
            return $q(function(resolve, reject){
              $log.debug('HTTP response:\n' + JSON.stringify(response));
              resolve(response);
            });
          }
        };
        return interceptor;
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
    .factory('repositories', function(GitHubRepo, SidewinderServer, $log) {
        var repositories = {};
        var list = [];
        repositories.add = function(repo) {
            list.push(repo);
            persistLocally();
            if (repositories.deviceToken) {
                SidewinderServer.addRepository(repositories.deviceToken, repo).then(function(){
                  $log.debug('server added repo.')
                }).catch(function(err){
                  $log.error('server error: ' + err);
                });
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
    .factory('PushService', function($q, $ionicPlatform, $window, $log, debugMode) {
        var deviceToken = undefined;
        if (debugMode.active && !ionic.Platform.isIOS()) {

          deviceToken = debugMode.deviceToken;
        }
        function doNothing() {}
        function init() {
            return $q(function(resolve, reject) {
                if (debugMode.active && debugMode.deviceToken){
                  $log.debug('using DEBUG device token: '+ debugMode.deviceToken);
                  resolve({
                    addHandler: doNothing,
                    deviceToken: debugMode.deviceToken,
                    unregister: doNothing,
                    enabled: true
                  });
                  return;
                }
                if (!window.PushNotification) {
                    reject('Push notifications not available.');
                    return;
                }
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
                    var addHandler = function(callback) {
                        push.on('notification', callback);
                    };
                    push.on('error', function(err) {
                        $log.error("push error: " + err);
                    });

                    var doResolve = function() {
                      $log.info('resolving push registration');
                      doResolve = doNothing;
                      resolve({
                          addHandler: addHandler,
                          deviceToken: deviceToken,
                          unregister: unregister,
                          enabled: !!deviceToken
                      });
                    }
                    push.on('registration', function(data) {
                        $log.info('registration complete');
                        deviceToken = data.registrationId;
                        doResolve();
                    });
                    setTimeout(function(){ doResolve() }, 1500);
                });
            });
        }

        return {
            init: init
        };
    });
