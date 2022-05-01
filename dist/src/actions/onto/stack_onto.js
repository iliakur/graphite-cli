"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackOntoFixContinuation = exports.stackOntoBaseRebaseContinuation = exports.stackOnto = void 0;
const cache_1 = require("../../lib/config/cache");
const errors_1 = require("../../lib/errors");
const preconditions_1 = require("../../lib/preconditions");
const utils_1 = require("../../lib/utils");
const branch_1 = require("../../wrapper-classes/branch");
const fix_1 = require("../fix");
const validate_1 = require("../validate");
function stackOnto(opts, context) {
    return __awaiter(this, void 0, void 0, function* () {
        preconditions_1.branchExistsPrecondition(opts.onto);
        checkBranchCanBeMoved(opts.currentBranch, opts.onto, context);
        validateStack(context);
        const parent = yield getParentForRebaseOnto(opts.currentBranch, opts.onto, context);
        // Save the old ref from before rebasing so that children can find their bases.
        opts.currentBranch.setMetaPrevRef(opts.currentBranch.getCurrentRef());
        const stackOntoContinuationFrame = {
            op: 'STACK_ONTO_BASE_REBASE_CONTINUATION',
            currentBranchName: opts.currentBranch.name,
            onto: opts.onto,
        };
        // Add try catch check for rebase interactive....
        utils_1.gpExecSync({
            command: `git rebase --onto ${opts.onto} $(git merge-base ${opts.currentBranch.name} ${parent.name}) ${opts.currentBranch.name}`,
            options: { stdio: 'ignore' },
        }, (err) => {
            if (utils_1.rebaseInProgress()) {
                throw new errors_1.RebaseConflictError(`Interactive rebase in progress, cannot fix (${opts.currentBranch.name}) onto (${opts.onto}).`, [stackOntoContinuationFrame, ...opts.mergeConflictCallstack], context);
            }
            else {
                throw new errors_1.ExitFailedError(`Rebase failed when moving (${opts.currentBranch.name}) onto (${opts.onto}).`, err);
            }
        });
        yield stackOntoBaseRebaseContinuation(stackOntoContinuationFrame, opts.mergeConflictCallstack, context);
    });
}
exports.stackOnto = stackOnto;
function stackOntoBaseRebaseContinuation(frame, mergeConflictCallstack, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentBranch = yield branch_1.Branch.branchWithName(frame.currentBranchName, context);
        const onto = frame.onto;
        cache_1.cache.clearAll();
        // set current branch's parent only if the rebase succeeds.
        console.log(`setting ${currentBranch.name} parent to ${onto}`);
        currentBranch.setParentBranch(onto, new branch_1.Branch(onto).getCurrentRef());
        // Now perform a fix starting from the onto branch:
        const stackOntoContinuationFrame = {
            op: 'STACK_ONTO_FIX_CONTINUATION',
            currentBranchName: frame.currentBranchName,
            onto: frame.onto,
        };
        yield fix_1.restackBranch({
            branch: currentBranch,
            mergeConflictCallstack: [
                stackOntoContinuationFrame,
                ...mergeConflictCallstack,
            ],
        }, context);
        yield stackOntoFixContinuation(stackOntoContinuationFrame);
    });
}
exports.stackOntoBaseRebaseContinuation = stackOntoBaseRebaseContinuation;
function stackOntoFixContinuation(frame) {
    return __awaiter(this, void 0, void 0, function* () {
        utils_1.logInfo(`Successfully moved (${frame.currentBranchName}) onto (${frame.onto})`);
    });
}
exports.stackOntoFixContinuation = stackOntoFixContinuation;
function getParentForRebaseOnto(branch, onto, context) {
    const metaParent = branch.getParentFromMeta(context);
    if (metaParent) {
        return metaParent;
    }
    // If no meta parent, automatically recover:
    branch.setParentBranchName(onto);
    return new branch_1.Branch(onto);
}
function validateStack(context) {
    try {
        validate_1.validate('UPSTACK', context);
    }
    catch (_a) {
        throw new errors_1.ValidationFailedError(`Cannot stack "onto", git branches must match stack.`);
    }
}
function checkBranchCanBeMoved(branch, onto, context) {
    if (branch.name === utils_1.getTrunk(context).name) {
        throw new errors_1.PreconditionsFailedError(`Cannot stack (${branch.name}) onto ${onto}, (${branch.name}) is currently set as trunk.`);
    }
}
//# sourceMappingURL=stack_onto.js.map