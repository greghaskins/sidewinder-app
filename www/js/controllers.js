angular.module('sidewinder.controllers', ['sidewinder.services'])
    .controller('StatusController', function($scope, repositories, StatusRefresher, PushService) {
        $scope.repositories = repositories;

        function refreshComplete() {
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.refresh = function() {
            console.log('Refreshing...');
            StatusRefresher.refreshAll(repositories.list).then(refreshComplete, refreshComplete);
        };

        $scope.$on('$ionicView.beforeEnter', $scope.refresh);
        PushService.init().then(function(push) {
            push.addHandler(function(data) {
                console.log('Received push notification: ' + JSON.stringify(data));
                $scope.refresh();
            });
        });

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
    .controller('RepoConfigController', function($scope, $ionicModal, $ionicActionSheet, repositories, GitHubRepo, PushService) {
        $scope.repositories = repositories;

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
                repositories.add(new GitHubRepo(repo.owner, repo.name));
                modal.hide();
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
                    repositories.remove(repo);
                    hideSheet();
                },
                cancelText: 'Cancel'
            });
        };

        $scope.pushNotificationsEnabled = false;
        PushService.init().then(function(push) {
            $scope.pushNotificationsEnabled = push.enabled;
        });
    });
