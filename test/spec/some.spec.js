describe('a thing', function() {

	beforeEach(module('sidewinder-app'));

	var $httpBackend;

	beforeEach(inject(function(_$httpBackend_) {
		$httpBackend = _$httpBackend_;
	}));

	it('does stuff', function() {
		expect(true).toBe(true);
	});

});
