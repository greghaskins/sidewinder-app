describe('GitHubRepo objects', function () {
    beforeEach(module('sidewinder-app'));

    var GitHubRepo;

    beforeEach(inject(function (_GitHubRepo_) {
        GitHubRepo = _GitHubRepo_;
    }));

    it('can be built from simple JSON object', function () {
        var repo = new GitHubRepo('somebody', 'reponame');
        expect(repo.owner).toBe('somebody');
        expect(repo.name).toBe('reponame');

    });

    it('can be converted to simple JSON object', function () {
        var repo = new GitHubRepo('team-awesome', 'project-X');
        expect(repo.toObject()).toEqual({
            owner: 'team-awesome',
            name: 'project-X'
        });
    });

    it('has a display URL for github.com', function () {
        var repo = new GitHubRepo('team-awesome', 'project-X');
        expect(repo.displayURL).toBe('https://github.com/team-awesome/project-X');
    });

    it('has a display URL with a placeholder when owner is blank', function () {
        var repo = new GitHubRepo('', 'project-X');
        expect(repo.displayURL).toBe('https://github.com/{owner}/project-X');
    });

    it('has a display URL with a placeholder when owner is blank', function () {
        var repo = new GitHubRepo('sidewinder-team', '');
        expect(repo.displayURL).toBe('https://github.com/sidewinder-team/{repo-name}');
    });

    it('has the default state of "unknown"', function () {
        var repo = new GitHubRepo('team-awesome', 'project-X');
        expect(repo.status.state).toBe('unknown');
    });

});
