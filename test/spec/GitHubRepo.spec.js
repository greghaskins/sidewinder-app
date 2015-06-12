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

    it('has a display URL for github.com', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'team-awesome',
            name: 'project-X'
        });
        expect(repo.displayURL).toBe('https://github.com/team-awesome/project-X');
    });

    it('has a display URL with a placeholder when owner is blank', function() {
        var repo = GitHubRepo.fromObject({
            owner: '',
            name: 'project-X'
        });
        expect(repo.displayURL).toBe('https://github.com/{owner}/project-X');
    });

    it('has a display URL with a placeholder when owner is blank', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'sidewinder-team',
            name: ''
        });
        expect(repo.displayURL).toBe('https://github.com/sidewinder-team/{repo-name}');
    });

    it('has the default state of "unknown"', function(){
    	var repo = GitHubRepo.fromObject({
            owner: 'team-awesome',
            name: 'project-X'
        });
        expect(repo.status.state).toBe('unknown');
    });

});
