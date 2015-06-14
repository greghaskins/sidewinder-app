var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

describe('the repositories model', function () {
    beforeEach(module('sidewinder-app'));

    var repositories, GitHubRepo, httpBackend;

    beforeEach(inject(function (_repositories_, _GitHubRepo_, _$httpBackend_) {
        repositories = _repositories_;
        GitHubRepo = _GitHubRepo_;
        httpBackend = _$httpBackend_;
        httpBackend.whenGET(/.*/).respond(200, '');
        httpBackend.flush();
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('can add items and added items are sent to sidewinder-server', function () {
        var repo = GitHubRepo.fromObject({
            owner: 'testing',
            name: 'test'
        });
        repositories.add(repo);
        expect(repositories.list).toContain(repo);
    });

    it('adding items while a device token is registered will post to sidewinder-server', function () {
        var repo = GitHubRepo.fromObject({
            owner: 'testing',
            name: 'test'
        });
        var deviceToken = 'abcdef';
        httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
            {name: repo.fullName})
            .respond(200);
        repositories.deviceToken = deviceToken;
        repositories.add(repo);
        expect(repositories.list).toContain(repo);
        httpBackend.flush();
    });

    it('can remove items', function () {
        var repo = GitHubRepo.fromObject({
            owner: 'testing',
            name: 'toRemove'
        });
        repositories.add(repo);
        repositories.remove(repo);
        expect(repositories.list).not.toContain(repo);
    });

    it('doesn\'t explode when removing non-existing items', function () {
        repositories.remove(GitHubRepo.fromObject({
            owner: 'does-not',
            name: 'exist'
        }));
    })

});
