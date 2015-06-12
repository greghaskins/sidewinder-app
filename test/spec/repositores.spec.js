describe('the repositories model', function() {
    beforeEach(module('sidewinder-app'));

    var repositories, GitHubRepo;

    beforeEach(inject(function(_repositories_, _GitHubRepo_) {
        repositories = _repositories_;
        GitHubRepo = _GitHubRepo_;
    }));

    it('can add items', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'testing',
            name: 'test'
        });
        repositories.add(repo);
        expect(repositories.list).toContain(repo);
    });

    it('can remove items', function() {
        var repo = GitHubRepo.fromObject({
            owner: 'testing',
            name: 'toRemove'
        });
        repositories.add(repo);
        repositories.remove(repo);
        expect(repositories.list).not.toContain(repo);
    });

    it('doesn\'t explode when removing non-existing items', function() {
        repositories.remove(GitHubRepo.fromObject({
            owner: 'does-not',
            name: 'exist'
        }));
        
    })

});
