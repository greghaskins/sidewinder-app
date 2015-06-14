var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

describe('sidewinder-server', function () {
    beforeEach(module('sidewinder.services'));

    it('add repository will send it to server and return repo on success', function (done) {
        inject(function ($httpBackend, GitHubRepo, sidewinderServer) {
            var repo = GitHubRepo.fromObject({owner: 'Tim', name: 'Veggiesaurus'});
            var deviceToken = 'lol3irfdsd';
            $httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
                {name: repo.fullName})
                .respond(200);
            sidewinderServer.addRepository(deviceToken, repo)
                .then(function (result) {
                    expect(result).toBe(repo);
                }).finally(done);
            $httpBackend.flush();
        })
    });

    it('add repository will send it to server and return error', function (done) {
        inject(function ($httpBackend, GitHubRepo, sidewinderServer) {
            var repo = GitHubRepo.fromObject({owner: 'Tim', name: 'Veggiesaurus'});
            var deviceToken = 'lol3irfdsd';
            $httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
                {name: repo.fullName})
                .respond(404);
            sidewinderServer.addRepository(deviceToken, repo)
                .catch(function (result) {
                    expect(result).toBe("Failed to add repo to server.");
                }).finally(done);
            $httpBackend.flush();
        })
    });


});