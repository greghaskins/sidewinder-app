var sidewinderServerHost = "http://sidewinder-server-a5b2d643.robertfmurdock.svc.tutum.io:5103";

describe('SidewinderServer', function () {
    beforeEach(module('sidewinder.services'));

    describe('Register device', function () {
        it('will send it to server and return deviceId on success', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectPOST(sidewinderServerHost + '/devices',
                    {deviceId: deviceToken})
                    .respond(200);
                SidewinderServer.registerDevice(deviceToken)
                    .then(function (result) {
                        expect(result).toBe(deviceToken);
                    }).finally(done);
                $httpBackend.flush();
            })
        });

        it('will send it to server and return error on failure', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectPOST(sidewinderServerHost + '/devices',
                    {deviceId: deviceToken})
                    .respond(404);
                SidewinderServer.registerDevice(deviceToken)
                    .catch(function (result) {
                        expect(result).toBe("Failed to register device.");
                    }).finally(done);
                $httpBackend.flush();
            })
        });
    });

    describe('Unregister device', function(){
        it('will send it to server and return deviceId on success', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectDELETE(sidewinderServerHost + '/devices/' + deviceToken)
                    .respond(200);
                SidewinderServer.unregisterDevice(deviceToken)
                    .then(function (result) {
                        expect(result).toBe(deviceToken);
                    }).finally(done);
                $httpBackend.flush();
            })
        });

        it('will send it to server and return error on failure', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectDELETE(sidewinderServerHost + '/devices/' + deviceToken)
                    .respond(404);
                SidewinderServer.unregisterDevice(deviceToken)
                    .catch(function (result) {
                        expect(result).toBe("Failed to unregister device.");
                    }).finally(done);
                $httpBackend.flush();
            })
        });
    });

    describe('add repository', function () {
        it('will send it to server and return repo on success', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var repo = GitHubRepo.fromObject({owner: 'Tim', name: 'Veggiesaurus'});
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
                    {name: repo.fullName})
                    .respond(200);
                SidewinderServer.addRepository(deviceToken, repo)
                    .then(function (result) {
                        expect(result).toBe(repo);
                    }).finally(done);
                $httpBackend.flush();
            })
        });

        it('will send it to server and return error on failure', function (done) {
            inject(function ($httpBackend, GitHubRepo, SidewinderServer) {
                var repo = GitHubRepo.fromObject({owner: 'Tim', name: 'Veggiesaurus'});
                var deviceToken = 'lol3irfdsd';
                $httpBackend.expectPOST(sidewinderServerHost + '/devices/' + deviceToken + '/repositories',
                    {name: repo.fullName})
                    .respond(404);
                SidewinderServer.addRepository(deviceToken, repo)
                    .catch(function (result) {
                        expect(result).toBe("Failed to add repo to server.");
                    }).finally(done);
                $httpBackend.flush();
            })
        });
    });
});