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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchBranchAction = exports.TraversalDirection = void 0;
const chalk_1 = __importDefault(require("chalk"));
const prompts_1 = __importDefault(require("prompts"));
const errors_1 = require("../lib/errors");
const preconditions_1 = require("../lib/preconditions");
const checkout_branch_1 = require("../lib/utils/checkout_branch");
const splog_1 = require("../lib/utils/splog");
const branch_1 = require("../wrapper-classes/branch");
var TraversalDirection;
(function (TraversalDirection) {
    TraversalDirection["Top"] = "TOP";
    TraversalDirection["Bottom"] = "BOTTOM";
    TraversalDirection["Up"] = "UP";
    TraversalDirection["Down"] = "DOWN";
})(TraversalDirection = exports.TraversalDirection || (exports.TraversalDirection = {}));
function getStackBranch(candidates) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield prompts_1.default({
            type: 'select',
            name: 'branch',
            message: 'Multiple branches found at the same level. Select a branch to guide the navigation',
            choices: candidates.map((b) => {
                return { title: b.name, value: b.name, branch: b };
            }),
        }, {
            onCancel: () => {
                throw new errors_1.KilledError();
            },
        })).branch;
    });
}
function getDownstackBranch(currentBranch, direction, context, numSteps) {
    let branch = currentBranch;
    let prevBranch = branch.getParentFromMeta(context);
    let indent = 0;
    // Bottom goes to the bottom of the stack but down can go up to trunk
    if (direction === TraversalDirection.Down && (prevBranch === null || prevBranch === void 0 ? void 0 : prevBranch.isTrunk(context))) {
        branch = prevBranch;
        indent++;
    }
    while (prevBranch && !prevBranch.isTrunk(context)) {
        splog_1.logInfo(`${'  '.repeat(indent)}↳(${branch})`);
        branch = prevBranch;
        prevBranch = branch.getParentFromMeta(context);
        indent++;
        if (direction === TraversalDirection.Down && indent === numSteps) {
            break;
        }
    }
    splog_1.logInfo(`${'  '.repeat(indent)}↳(${chalk_1.default.cyan(branch)})`);
    return branch === null || branch === void 0 ? void 0 : branch.name;
}
function getUpstackBranch(currentBranch, interactive, direction, context, numSteps) {
    return __awaiter(this, void 0, void 0, function* () {
        let branch = currentBranch;
        let candidates = branch.getChildrenFromMeta(context);
        let indent = 0;
        while (branch && candidates.length) {
            if (candidates.length === 1) {
                splog_1.logInfo(`${'  '.repeat(indent)}↳(${branch})`);
                branch = candidates[0];
            }
            else {
                if (interactive) {
                    const stack_base_branch = yield getStackBranch(candidates);
                    branch = branch_1.Branch.branchWithName(stack_base_branch, context);
                }
                else {
                    throw new errors_1.ExitFailedError(`Cannot get upstack branch, multiple choices available: [${candidates.join(', ')}]`);
                }
            }
            indent++;
            if (direction === TraversalDirection.Up && indent === numSteps) {
                break;
            }
            candidates = branch.getChildrenFromMeta(context);
        }
        splog_1.logInfo(`${'  '.repeat(indent)}↳(${chalk_1.default.cyan(branch)})`);
        return branch === null || branch === void 0 ? void 0 : branch.name;
    });
}
function switchBranchAction(direction, opts, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentBranch = preconditions_1.currentBranchPrecondition(context);
        const nextBranch = yield getNextBranch(direction, currentBranch, context, opts);
        if (nextBranch && nextBranch != currentBranch.name) {
            checkout_branch_1.checkoutBranch(nextBranch);
        }
        else {
            splog_1.logInfo(`Already at the ${direction === TraversalDirection.Down ||
                direction === TraversalDirection.Bottom
                ? 'bottom most'
                : 'top most'} branch in the stack. Exiting.`);
        }
    });
}
exports.switchBranchAction = switchBranchAction;
function getNextBranch(direction, currentBranch, context, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (direction) {
            case TraversalDirection.Bottom: {
                return getDownstackBranch(currentBranch, TraversalDirection.Bottom, context);
            }
            case TraversalDirection.Down: {
                return getDownstackBranch(currentBranch, TraversalDirection.Down, context, opts.numSteps);
            }
            case TraversalDirection.Top: {
                return yield getUpstackBranch(currentBranch, opts.interactive, TraversalDirection.Top, context);
            }
            case TraversalDirection.Up: {
                return yield getUpstackBranch(currentBranch, opts.interactive, TraversalDirection.Up, context, opts.numSteps);
            }
        }
    });
}
//# sourceMappingURL=branch_traversal.js.map