"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = void 0;
const errors_1 = require("../../lib/errors");
const preconditions_1 = require("../../lib/preconditions");
const checkout_branch_1 = require("../../lib/utils/checkout_branch");
const exec_sync_1 = require("../../lib/utils/exec_sync");
const splog_1 = require("../../lib/utils/splog");
const trunk_1 = require("../../lib/utils/trunk");
function pull(context, oldBranchName) {
    splog_1.logInfo(`Pulling in new changes...`);
    splog_1.logTip(`Disable this behavior at any point in the future with --no-pull`, context);
    const remote = context.repoConfig.getRemote();
    const trunk = trunk_1.getTrunk(context).name;
    if (preconditions_1.currentBranchPrecondition(context).name !== trunk) {
        throw new errors_1.PreconditionsFailedError('Must be on trunk to pull');
    }
    exec_sync_1.gpExecSync({ command: `git remote prune ${remote}` });
    exec_sync_1.gpExecSync({
        command: `git fetch ${remote} "+refs/heads/*:refs/remotes/${remote}/*"${context.userConfig.data.experimental
            ? ` "+refs/branch-metadata/*:refs/${remote}-branch-metadata/*"`
            : ''}`,
    }, (err) => {
        checkout_branch_1.checkoutBranch(oldBranchName, { quiet: true });
        throw new errors_1.ExitFailedError(`Failed to fetch from remote ${remote}`, err);
    });
    exec_sync_1.gpExecSync({ command: `git merge --ff-only "refs/remotes/${remote}/${trunk}"` }, (err) => {
        checkout_branch_1.checkoutBranch(oldBranchName, { quiet: true });
        throw new errors_1.ExitFailedError(`Failed to fast-forward trunk ${trunk}`, err);
    });
    splog_1.logNewline();
}
exports.pull = pull;
//# sourceMappingURL=pull.js.map