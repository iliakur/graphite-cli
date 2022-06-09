"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceCreateBranch = void 0;
const exec_sync_1 = require("../utils/exec_sync");
function forceCreateBranch(branchName, sha) {
    (0, exec_sync_1.gpExecSync)({
        command: `git switch -C ${branchName} ${sha}`,
    });
}
exports.forceCreateBranch = forceCreateBranch;
//# sourceMappingURL=write_branch.js.map