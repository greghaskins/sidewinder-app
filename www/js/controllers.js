angular.module('sidewinder.controllers', ['sidewinder.services'])
    .controller('StatusController', function ($scope, repositories, StatusRefresher) {
        $scope.repositories = repositories;

        function refreshComplete() {
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.refresh = function () {
            StatusRefresher.refreshAll(repositories.list).then(refreshComplete, refreshComplete);
        };

        $scope.$on('$ionicView.enter', function (event, state) {
            if (state.stateName === 'home') {
                $scope.refresh();
            }
        });
    })
    .controller('RepoConfigController', function ($scope, $ionicModal, repositories, GitHubRepo) {
        $scope.repositories = repositories;

        var modalScope = $scope.$new(true);
        $ionicModal.fromTemplateUrl('edit-repo.html', {
            scope: modalScope,
            animation: 'slide-in-up',
            focusFirstInput: true,
        }).then(function (modal) {
            $scope.modal = modal;
            modalScope.cancel = function () {
                modal.hide();
            };
            modalScope.save = function (repo) {
                repositories.add(GitHubRepo.fromObject(repo));
                modal.hide();
            }
        });

        $scope.addRepository = function () {
            modalScope.repo = GitHubRepo.fromObject({
                owner: '',
                name: ''
            });
            $scope.modal.show();
        };

        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });
    });