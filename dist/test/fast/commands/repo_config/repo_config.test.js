"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../../../../src/lib/config");
const scenes_1 = require("../../../lib/scenes");
const utils_1 = require("../../../lib/utils");
for (const scene of [new scenes_1.BasicScene()]) {
    describe(`(${scene}): infer repo owner/name`, function () {
        utils_1.configureTest(this, scene);
        it('Can infer cloned repos', () => {
            const { owner, name } = config_1.getOwnerAndNameFromURLForTesting('https://github.com/screenplaydev/graphite-cli.git');
            chai_1.expect(owner === 'screenplaydev').to.be.true;
            chai_1.expect(name === 'graphite-cli').to.be.true;
        });
        it('Can infer SSH cloned repos', () => {
            const { owner, name } = config_1.getOwnerAndNameFromURLForTesting('git@github.com:screenplaydev/graphite-cli.git');
            chai_1.expect(owner === 'screenplaydev').to.be.true;
            chai_1.expect(name === 'graphite-cli').to.be.true;
        });
        it('Can read the existing repo config when executing from a subfolder in the project', () => {
            chai_1.expect(() => scene.repo.execCliCommand(`ls`)).to.not.throw(Error);
            const subDir = path_1.default.join(scene.dir, 'tmpDir');
            fs_extra_1.default.mkdirSync(subDir);
            chai_1.expect(() => scene.repo.execCliCommand(`ls`, { cwd: subDir })).to.not.throw(Error);
        });
        // Not sure where these are coming from but we should be able to handle
        // them.
        it('Can infer cloned repos without .git', () => {
            const clone = config_1.getOwnerAndNameFromURLForTesting('https://github.com/screenplaydev/graphite-cli');
            chai_1.expect(clone.owner === 'screenplaydev').to.be.true;
            chai_1.expect(clone.name === 'graphite-cli').to.be.true;
            const sshClone = config_1.getOwnerAndNameFromURLForTesting('git@github.com:screenplaydev/graphite-cli');
            chai_1.expect(sshClone.owner === 'screenplaydev').to.be.true;
            chai_1.expect(sshClone.name === 'graphite-cli').to.be.true;
        });
    });
}
//# sourceMappingURL=repo_config.test.js.map