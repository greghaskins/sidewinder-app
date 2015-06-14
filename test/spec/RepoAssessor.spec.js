describe('the RepoAssessor', function () {

    beforeEach(module('sidewinder-app'));

    var $httpBackend, RepoAssessor;

    beforeEach(inject(function (_$httpBackend_, _RepoAssessor_, _GitHubRepo_) {
        $httpBackend = _$httpBackend_;
        RepoAssessor = _RepoAssessor_;
        GitHubRepo = _GitHubRepo_;

        $httpBackend.whenGET(/\.html$/).respond(200, '');
    }));

    it('gets the repository state from GitHub combined status API', function (done) {
        $httpBackend.whenGET('https://api.github.com/repos/sidewinder-team/sidewinder-server/commits/master/status')
            .respond(200, {
                state: 'success'
            });

        var repo = new GitHubRepo('sidewinder-team', 'sidewinder-server');

        RepoAssessor.assess(repo).then(function (result) {
            expect(result.state).toBe('success');
        }).catch(function (error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();

    });

    it('returns repository state of unknown when connection fails', function (done) {

        $httpBackend.whenGET('https://api.github.com/repos/angular/angular.js/commits/master/status')
            .respond(500, {
                boom: 'goes the dynamite'
            });

        var repo = new GitHubRepo('angular', 'angular.js');

        RepoAssessor.assess(repo).then(function (result) {
            expect(result.state).toBe('unknown');
        }).catch(function (error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();

    });

    it('treats a "pending" commit without any statuses as "unknown"', function (done) {

        $httpBackend.whenGET('https://api.github.com/repos/sidewinder-team/sidewinder-server/commits/master/status')
            .respond(200, {
                state: 'pending',
                statuses: []
            });

        var repo = new GitHubRepo('sidewinder-team', 'sidewinder-server');

        RepoAssessor.assess(repo).then(function (result) {
            expect(result.state).toBe('unknown');
        }).catch(function (error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();
    });

    it('includes state, description, and url for each status', function (done) {
        $httpBackend.whenGET('https://api.github.com/repos/sidewinder-team/sidewinder-app/commits/master/status')
            .respond(200, {
                state: 'success',
                statuses: [{
                    "url": "https://api.github.com/repos/sidewinder-team/sidewinder-app/statuses/90a1afaaefb38642784b3a89eab2a7dc459c5d79",
                    "id": 241039215,
                    "state": "failure",
                    "description": "Your tests failed",
                    "target_url": "https://circleci.com/gh/sidewinder-team/sidewinder-app/2",
                    "context": "ci/circleci",
                    "created_at": "2015-06-14T13:17:56Z",
                    "updated_at": "2015-06-14T13:17:56Z"
                }, {
                    "url": "https://api.github.com/repos/sidewinder-team/sidewinder-app/statuses/90a1afaaefb38642784b3a89eab2a7dc459c5d79",
                    "id": 241040339,
                    "state": "success",
                    "description": "The Travis CI build passed",
                    "target_url": "https://travis-ci.org/sidewinder-team/sidewinder-app/builds/66745547",
                    "context": "continuous-integration/travis-ci/push",
                    "created_at": "2015-06-14T13:25:40Z",
                    "updated_at": "2015-06-14T13:25:40Z"
                }]
            });

        var repo = new GitHubRepo('sidewinder-team', 'sidewinder-app');

        RepoAssessor.assess(repo).then(function (result) {
            expect(result.statuses.length).toBe(2);

            expect(result.statuses[0].state).toBe('failure');
            expect(result.statuses[0].message).toBe('Your tests failed');
            expect(result.statuses[0].href).toBe('https://circleci.com/gh/sidewinder-team/sidewinder-app/2');
            expect(result.statuses[0].context).toBe('ci/circleci');

            expect(result.statuses[1].state).toBe('success');
            expect(result.statuses[1].message).toBe('The Travis CI build passed');
            expect(result.statuses[1].href).toBe('https://travis-ci.org/sidewinder-team/sidewinder-app/builds/66745547');
            expect(result.statuses[1].context).toBe('continuous-integration/travis-ci/push');

        }).catch(function (error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();

    });

});
