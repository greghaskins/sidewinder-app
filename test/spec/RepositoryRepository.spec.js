describe('the RepositoryRepository', function() {
  beforeEach(module('sidewinder-app'));

  var deviceToken = 'THEdeviceTOKEN';
  var serverEndpoint = sidewinderServerHost + '/devices/' + deviceToken + '/repositories';

  beforeEach(module(function($provide) {
    $provide.factory('PushService', function($q) {
      var FakePushService = {};
      FakePushService.init = function() {
        return $q.when({
          deviceToken: deviceToken
        });
      };
      return FakePushService;
    });
  }));

  beforeEach(inject(function($httpBackend) {
    var sidewinderHostname = getHostname(serverEndpoint);

    function isNotServerEndpoint(url) {
      return url.indexOf(sidewinderHostname) < 0;
    }
    $httpBackend.whenGET(isNotServerEndpoint).respond(200, '');
  }));

  function getHostname(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }

  describe('retrieving a list of repos', function() {

    it('gets a list of repositories from sidewinder server', function(done) {
      inject(function($httpBackend, RepositoryRepository) {

        $httpBackend.whenGET(serverEndpoint)
          .respond(200, [{
            Name: 'owner1/repo1'
          }, {
            Name: 'owner2/repo2'
          }]);
        RepositoryRepository.all().then(function(result) {
            expect(result.length).toBe(2);
            expect(result[0].owner).toBe('owner1');
            expect(result[0].name).toBe('repo1');
            expect(result[1].owner).toBe('owner2');
            expect(result[1].name).toBe('repo2');
          })
          .catch(fail)
          .finally(done);

        $httpBackend.flush();
      });
    });

    it('gives and error when the connection blows up', function(done) {
      inject(function($httpBackend, RepositoryRepository) {
        $httpBackend.whenGET(serverEndpoint)
          .respond(500, 'kaboom');
        RepositoryRepository.all()
          .then(fail)
          .catch(function(err) {
            expect(err).toBe('Failed to retrieve repos from server.');
          })
          .finally(done);
        $httpBackend.flush();
      });

    });

  });

  describe('adding a repository', function() {

    it('adds repositories to the server-side list', function(done) {
      inject(function($httpBackend, RepositoryRepository, GitHubRepo) {
        $httpBackend.expectPOST(serverEndpoint, {
          name: 'the-new/repo-name'
        }).respond(200, '');
        RepositoryRepository.add(new GitHubRepo('the-new', 'repo-name'))
          .then(angular.noop)
          .catch(fail)
          .finally(done);

        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
      });
    });

    it('gives an error when the conneciton blows up', function(done){
      inject(function($httpBackend, RepositoryRepository, GitHubRepo) {
        $httpBackend.whenPOST(serverEndpoint, {
          name: 'the-new/repo-name'
        }).respond(500, 'boom');
        RepositoryRepository.add(new GitHubRepo('the-new', 'repo-name'))
          .then(fail)
          .catch(function(err){
            expect(err).toBe('Failed to add repo to server.');
          })
          .finally(done);

        $httpBackend.flush();
      });
    });

  });

});
