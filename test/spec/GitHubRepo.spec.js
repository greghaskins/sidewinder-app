describe('GitHubRepo objects', function() {
    beforeEach(module('sidewinder-app'));

    var GitHubRepo;

    beforeEach(inject(function(_GitHubRepo_) {
        GitHubRepo = _GitHubRepo_;
    }));

    it('can be built from simple JSON object', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'somebody',
            name: 'reponame'
        });
        expect(repo.owner).toBe('somebody');
        expect(repo.name).toBe('reponame');

    });

    it('can be converted to simple JSON object', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'team-awesome',
            name: 'project-X'
        });
        expect(GitHubRepo.toObject(repo)).toEqual({
            owner: 'team-awesome',
            name: 'project-X'
        });
    });

});
