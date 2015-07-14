describe('the RepositoryRepository', function() {
  beforeEach(module('sidewinder-app'));

  var deviceToken = 'THEdeviceTOKEN';
  var serverEndpoint = sidewinderServerHost + '/devices/' + deviceToken + '/repositories';

  console.log(serverEndpoint);

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
    function isNotServerEndpoint(url){
      return url.indexOf(sidewinderHostname) < 0;
    }
    $httpBackend.whenGET(isNotServerEndpoint).respond(200, '');
  }));

  function getHostname(url){
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }

  it('gets a list of repositories from sidewinder server', function(done) {
    inject(function($httpBackend, RepositoryRepository) {

      $httpBackend.whenGET(serverEndpoint)
        .respond(200, [{
          name: 'owner1/repo1'
        }, {
          name: 'owner2/repo2'
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
