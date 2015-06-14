describe('the RepoAssessor', function() {

    beforeEach(module('sidewinder-app'));

    var $httpBackend, RepoAssessor;

    beforeEach(inject(function(_$httpBackend_, _RepoAssessor_, _GitHubRepo_) {
        $httpBackend = _$httpBackend_;
        RepoAssessor = _RepoAssessor_;
        GitHubRepo = _GitHubRepo_;

        $httpBackend.whenGET(/\.html$/).respond(200, '');
    }));

    it('gets the repository state from GitHub combined status API', function(done) {
        $httpBackend.whenGET('https://api.github.com/repos/sidewinder-team/sidewinder-server/commits/master/status')
            .respond(200, {
                state: 'success'
            });

        var repo = GitHubRepo.fromObject({
            owner: 'sidewinder-team',
            name: 'sidewinder-server'
        });

        RepoAssessor.assess(repo).then(function(result) {
            expect(result.state).toBe('success');
        }).catch(function(error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();

    });

    it('returns repository state of unknown when connection fails', function(done) {

        $httpBackend.whenGET('https://api.github.com/repos/angular/angular.js/commits/master/status')
            .respond(500, {
                boom: 'goes the dynamite'
            });

        var repo = GitHubRepo.fromObject({
            owner: 'angular',
            name: 'angular.js'
        });

        RepoAssessor.assess(repo).then(function(result) {
            expect(result.state).toBe('unknown');
        }).catch(function(error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();

    });

    it('treats a "pending" commit without any statuses as "unknown"', function(done) {

        $httpBackend.whenGET('https://api.github.com/repos/sidewinder-team/sidewinder-server/commits/master/status')
            .respond(200, {
                state: 'pending',
                statuses: [],
            });

        var repo = GitHubRepo.fromObject({
            owner: 'sidewinder-team',
            name: 'sidewinder-server'
        });

        RepoAssessor.assess(repo).then(function(result) {
            expect(result.state).toBe('unknown');
        }).catch(function(error) {
            expect(error).toBeUndefined();
        }).finally(done);

        $httpBackend.flush();


    });

});
