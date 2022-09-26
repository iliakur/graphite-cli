"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KilledError = exports.BadTrunkOperationError = exports.UntrackedBranchError = exports.NoBranchError = exports.DetachedError = exports.ConcurrentExecutionError = exports.PreconditionsFailedError = exports.RebaseConflictError = exports.ExitFailedError = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ExitFailedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExitFailed';
    }
}
exports.ExitFailedError = ExitFailedError;
class RebaseConflictError extends Error {
    constructor() {
        super(`Hit a conflict during rebase.`);
        this.name = 'RebaseConflict';
    }
}
exports.RebaseConflictError = RebaseConflictError;
class PreconditionsFailedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PreconditionsFailed';
    }
}
exports.PreconditionsFailedError = PreconditionsFailedError;
class ConcurrentExecutionError extends Error {
    constructor() {
        super(`Cannot run more than one Graphite process at once.`);
        this.name = 'ConcurrentExecutionError';
    }
}
exports.ConcurrentExecutionError = ConcurrentExecutionError;
class DetachedError extends Error {
    constructor() {
        super(`Cannot perform this operation without a branch checked out.`);
        this.name = 'DetachedError';
    }
}
exports.DetachedError = DetachedError;
class NoBranchError extends Error {
    constructor(branchName) {
        super(`Could not find branch ${chalk_1.default.yellow(branchName)}.`);
        this.name = 'NoBranchError';
    }
}
exports.NoBranchError = NoBranchError;
class UntrackedBranchError extends Error {
    constructor(branchName) {
        super([
            `Cannot perform this operation on untracked branch ${chalk_1.default.yellow(branchName)}.`,
            `You can track it by specifying its parent with ${chalk_1.default.cyan(`gt branch track`)}.`,
        ].join('\n'));
        this.name = 'UntrackedBranchError';
    }
}
exports.UntrackedBranchError = UntrackedBranchError;
class BadTrunkOperationError extends Error {
    constructor() {
        super(`Cannot perform this operation on the trunk branch.`);
        this.name = 'BadTrunkOperationError';
    }
}
exports.BadTrunkOperationError = BadTrunkOperationError;
class KilledError extends Error {
    constructor() {
        super(`Killed Graphite early.`);
        this.name = 'Killed';
    }
}
exports.KilledError = KilledError;
//# sourceMappingURL=errors.js.map