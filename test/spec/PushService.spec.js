describe('the PushService', function() {

	// TODO: figure out how to test this with spy-fu

    beforeEach(module('sidewinder-services'));

    var PushService;

    beforeEach(inject(function(_PushService_, $window, _$httpBackend_) {
        PushService = _PushService_;

        $window.PushNotification

        httpBackend = _$httpBackend_;
        httpBackend.whenGET(/.*/).respond(200, '');
        httpBackend.flush();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

});
