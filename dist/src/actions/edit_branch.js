"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editBranchAction = void 0;
const chalk_1 = __importDefault(require("chalk"));
const scope_spec_1 = require("../lib/engine/scope_spec");
const errors_1 = require("../lib/errors");
const persist_continuation_1 = require("./persist_continuation");
const print_conflict_status_1 = require("./print_conflict_status");
const restack_1 = require("./restack");
function editBranchAction(context) {
    const currentBranchName = context.metaCache.currentBranchPrecondition;
    // TODO fix the bug that breaks interactive rebase on non-restacked branches
    // (bug is that restack continue sets parent revision to the wrong thing; the
    // solution will be persisting new parent revision in continuation which also
    // fixes ds sync rebasing)
    if (!context.metaCache.isBranchFixed(currentBranchName)) {
        throw new errors_1.ExitFailedError('Can only edit restacked branches in this version, will be fixed soon!');
    }
    if (context.metaCache.rebaseInteractive(currentBranchName) === 'REBASE_CONFLICT') {
        (0, persist_continuation_1.persistContinuation)({
            branchesToRestack: context.metaCache.getRelativeStack(currentBranchName, scope_spec_1.SCOPE.UPSTACK_EXCLUSIVE),
        }, context);
        (0, print_conflict_status_1.printConflictStatus)(`Hit conflict during interactive rebase of ${chalk_1.default.yellow(currentBranchName)}.`, context);
        throw new errors_1.RebaseConflictError();
    }
    (0, restack_1.restackBranches)(context.metaCache.getRelativeStack(context.metaCache.currentBranchPrecondition, scope_spec_1.SCOPE.UPSTACK_EXCLUSIVE), context);
}
exports.editBranchAction = editBranchAction;
//# sourceMappingURL=edit_branch.js.map