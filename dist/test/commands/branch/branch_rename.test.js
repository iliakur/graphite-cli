"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const all_scenes_1 = require("../../lib/scenes/all_scenes");
const configure_test_1 = require("../../lib/utils/configure_test");
const expect_commits_1 = require("../../lib/utils/expect_commits");
for (const scene of all_scenes_1.allScenes) {
    describe(`(${scene}): rename`, function () {
        (0, configure_test_1.configureTest)(this, scene);
        it('Can rename a branch', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.createChange('b', 'b');
            scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
            scene.repo.checkoutBranch('a');
            scene.repo.runCliCommand([`branch`, `rename`, `a1`]);
            (0, chai_1.expect)(() => scene.repo.runCliCommand([`ls`])).not.to.throw();
            scene.repo.checkoutBranch('b');
            (0, expect_commits_1.expectCommits)(scene.repo, 'b, a, 1');
            scene.repo.runCliCommand([`branch`, `down`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a1');
            scene.repo.runCliCommand([`branch`, `down`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('main');
        });
        it("Renaming a branch to its own name doesn't break", () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.createChange('b', 'b');
            scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
            scene.repo.checkoutBranch('a');
            scene.repo.runCliCommand([`branch`, `rename`, `a`]);
            (0, chai_1.expect)(() => scene.repo.runCliCommand([`ls`])).not.to.throw();
            (0, chai_1.expect)(() => scene.repo.runCliCommand([`bu`])).not.to.throw();
            (0, expect_commits_1.expectCommits)(scene.repo, 'b, a, 1');
        });
    });
}
//# sourceMappingURL=branch_rename.test.js.map