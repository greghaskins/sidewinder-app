angular.module('sidewinder.controllers', ['sidewinder.services'])
    .controller('StatusController', function($scope, $log, $q, RepoAssessor, PushService,  RepositoryRepository, ErrorHandler) {
        $scope.repositories = [];

        function refreshComplete() {
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.refresh = function() {
          $log.info('Refreshing view...');

          RepositoryRepository.all()
            .then(function(results) {
              return $q.all(results.map(function(repo) {
                return RepoAssessor.assess(repo).then(function(assessment) {
                  repo.status = assessment;
                  return repo;
                })
              }));
            })
            .then(function(results) {
              $scope.repositories = results;
            })
            .catch(ErrorHandler.handle)
            .finally(refreshComplete);
        };

        $scope.$on('$ionicView.beforeEnter', $scope.refresh);
        PushService.init().then(function(push) {
            push.addHandler(function(data) {
                $log.info('Received push notification: ' + JSON.stringify(data));
                $scope.refresh();
            });
        }).then($scope.refresh);

        var precedence = {
            'failure': 0,
            'pending': 1,
            'unknown': 2,
            'success': 3
        }

        $scope.troubleOnTop = function(repo) {
            return precedence[repo.status.state] + '--' + repo.fullName;
        }
    })
    .controller('RepoConfigController', function($scope, $ionicModal, $ionicActionSheet, RepositoryRepository, GitHubRepo, PushService, ErrorHandler) {
          $scope.repositories = [];

          $scope.refresh = function() {
            RepositoryRepository.all().then(function(results) {
                $scope.repositories = results;
              })
              .catch(ErrorHandler.handle);
          }
          $scope.$on('$ionicView.beforeEnter', $scope.refresh);

          var modalScope = $scope.$new(true);
          $ionicModal.fromTemplateUrl('edit-repo.html', {
            scope: modalScope,
            animation: 'slide-in-up',
            focusFirstInput: true
          }).then(function(modal) {
            $scope.modal = modal;
            modalScope.cancel = function() {
              modal.hide();
            };
            modalScope.save = function(repo) {
              RepositoryRepository.add(new GitHubRepo(repo.owner, repo.name))
              .then($scope.refresh)
              .then(function() {
                modal.hide();
              })
              .catch(ErrorHandler.handle);
            }
          });

        $scope.addRepository = function() {
            modalScope.repo = new GitHubRepo('', '');
            $scope.modal.show();
        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        $scope.removeRepo = function(repo) {
            var hideSheet = $ionicActionSheet.show({
                titleText: 'Remove <b>' + repo.fullName + '</b>?',
                destructiveText: 'Remove',
                destructiveButtonClicked: function() {
                    // TODO: actually delete stuff
                    hideSheet();
                },
                cancelText: 'Cancel'
            });
        };

        $scope.pushNotificationsEnabled = false;
        PushService.init().then(function(push) {
            $scope.pushNotificationsEnabled = push.enabled;
        });
    })
    .service('ErrorHandler', function($ionicPopup){
      var ErrorHandler = this;
      this.handle = function(error) {
        console.error(error);
        return $ionicPopup.alert({
          title: 'Whoops!',
          template: 'An error occurred:<br><br>' + error
        });
      }
    });
