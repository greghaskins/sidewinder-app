var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

describe('the repositories model', function () {
    beforeEach(module('sidewinder-app'));

    var repositories, GitHubRepo, httpBackend;

    beforeEach(inject(function (_repositories_, _GitHubRepo_, _$httpBackend_) {
        repositories = _repositories_;
        GitHubRepo = _GitHubRepo_;
        httpBackend = _$httpBackend_;
        httpBackend.whenGET(/.*/).respond(200, '');
        httpBackend.whenPOST(/.*/).respond(200, '');
    }));

    afterEach(function () {
        httpBackend.flush();
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('can add items and added items are sent to sidewinder-server', function () {
        var repo = new GitHubRepo('testing', 'test');
        repositories.add(repo);
        expect(repositories.list).toContain(repo);
    });

    it('adding items while a device token is registered will post to sidewinder-server', function () {
        var repo = new GitHubRepo('testing', 'test');
        var deviceToken = 'abcdef';
        httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
            {name: repo.fullName})
            .respond(200);
        repositories.deviceToken = deviceToken;
        repositories.add(repo);
        expect(repositories.list).toContain(repo);
    });

    it('can remove items', function () {
        var repo = new GitHubRepo('testing', 'toRemove');
        repositories.add(repo);
        repositories.remove(repo);
        expect(repositories.list).not.toContain(repo);
    });

    it('doesn\'t explode when removing non-existing items', function () {
        repositories.remove(new GitHubRepo('does-not', 'exist'));
    })

});
