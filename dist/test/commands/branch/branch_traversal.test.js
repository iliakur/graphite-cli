"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const all_scenes_1 = require("../../lib/scenes/all_scenes");
const configure_test_1 = require("../../lib/utils/configure_test");
function setupStack(scene) {
    scene.repo.createChange('a', 'a');
    scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
    scene.repo.createChange('b', 'b');
    scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
    scene.repo.createChange('c', 'c');
    scene.repo.runCliCommand([`branch`, `create`, `c`, `-m`, `c`]);
}
for (const scene of all_scenes_1.allScenes) {
    describe(`(${scene}): next and prev`, function () {
        (0, configure_test_1.configureTest)(this, scene);
        it('Can move to next branch', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.checkoutBranch('main');
            scene.repo.runCliCommand([`branch`, `up`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
        it('Can move to prev branch', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.createChange('b', 'b');
            scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
            scene.repo.runCliCommand([`branch`, `down`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
        it('Branch down goes up to trunk', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.checkoutBranch('a');
            scene.repo.runCliCommand([`branch`, `down`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('main');
        });
        it('Can move to next branch with numSteps = 2', () => {
            setupStack(scene);
            scene.repo.checkoutBranch('a');
            scene.repo.runCliCommand([`branch`, `up`, `2`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('c');
        });
        it('Can move to prev branch with numSteps = 2', () => {
            setupStack(scene);
            scene.repo.runCliCommand([`branch`, `down`, `2`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
        it('Can move to top of the stack', () => {
            setupStack(scene);
            scene.repo.checkoutBranch('a');
            scene.repo.runCliCommand([`branch`, `top`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('c');
        });
        it('Can move to bottom of the stack', () => {
            setupStack(scene);
            scene.repo.runCliCommand([`branch`, `bottom`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
        it('branch down moves to prev', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.createChange('b', 'b');
            scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
            scene.repo.runCliCommand([`branch`, `down`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
        it('branch up moves to next', () => {
            scene.repo.createChange('a', 'a');
            scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
            scene.repo.checkoutBranch('main');
            scene.repo.runCliCommand([`branch`, `up`, `--no-interactive`]);
            (0, chai_1.expect)(scene.repo.currentBranchName()).to.equal('a');
        });
    });
}
//# sourceMappingURL=branch_traversal.test.js.map