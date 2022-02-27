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
exports.createBranchAction = void 0;
const config_1 = require("../lib/config");
const errors_1 = require("../lib/errors");
const preconditions_1 = require("../lib/preconditions");
const utils_1 = require("../lib/utils");
const branch_1 = __importDefault(require("../wrapper-classes/branch"));
const EMPTY_COMMIT_MESSAGE_INFO = [
    '\n',
    '# No changes were staged before creating this new branch',
    '# Therefore Graphite has added an empty commit to your new branch',
    '# This is because Graphite does not support two branches referencing the same commit',
    '# Two branches referencing one commit would break parent-child inference',
    '#',
    '# While working on this branch, we recommend using \\`gt commit amend\\`, or later squashing this empty commit',
    '# For future branches, we recommend staging changes before running \\`gt bc -m \\"feat(new_feat): added xyz...\\"\\`',
].join('\n');
function stringToTmpFileInput(contents) {
    return `<(printf '%s\n' "${contents}")`;
}
function createBranchAction(opts, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentBranch = preconditions_1.currentBranchPrecondition(context);
        if (opts.addAll) {
            utils_1.gpExecSync({
                command: 'git add --all',
            }, () => {
                throw new errors_1.ExitFailedError('Could not add all staged changes. Aborting...');
            });
        }
        const branchName = newBranchName(context, opts.branchName, opts.commitMessage);
        checkoutNewBranch(branchName);
        /**
         * Here, we silence errors and ignore them. This
         * isn't great but our main concern is that we're able to create
         * and check out the new branch and these types of error point to
         * larger failure outside of our control.
         */
        utils_1.gpExecSync({
            command: [
                `git commit`,
                `--allow-empty`,
                `${opts.commitMessage ? `-m "${opts.commitMessage}"` : ''}`,
                `${!opts.commitMessage
                    ? `-t ${stringToTmpFileInput(EMPTY_COMMIT_MESSAGE_INFO)}`
                    : ''}`,
                `${config_1.execStateConfig.noVerify() ? '--no-verify' : ''}`,
            ].join(' '),
            options: {
                stdio: 'inherit',
                shell: '/bin/bash',
            },
        }, () => {
            // Commit failed, usually due to precommit hooks. Rollback the branch.
            utils_1.checkoutBranch(parentBranch.name);
            utils_1.gpExecSync({
                command: `git branch -d ${branchName}`,
                options: { stdio: 'ignore' },
            });
            throw new errors_1.ExitFailedError('Failed to commit changes, aborting');
        });
        // If the branch previously existed and the stale metadata is still around,
        // make sure that we wipe that stale metadata.
        new branch_1.default(branchName).clearMetadata().setParentBranchName(parentBranch.name);
    });
}
exports.createBranchAction = createBranchAction;
function newBranchName(context, branchName, commitMessage) {
    if (!branchName && !commitMessage) {
        throw new errors_1.ExitFailedError(`Must specify at least a branch name or commit message`);
    }
    else if (branchName) {
        return branchName;
    }
    const date = new Date();
    const MAX_BRANCH_NAME_LENGTH = 40;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let branchMessage = commitMessage
        .split('')
        .map((c) => {
        if (ALLOWED_BRANCH_CHARACTERS.includes(c)) {
            return c;
        }
        return '_'; // Replace all disallowed characters with _
    })
        .join('')
        .replace(/_+/g, '_');
    if (branchMessage.length <= MAX_BRANCH_NAME_LENGTH - 6) {
        // prepend date if there's room.
        branchMessage =
            `${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}-` + branchMessage; // Condence underscores
    }
    const newBranchName = `${context.userConfig.data.branchPrefix || ''}${branchMessage}`;
    return newBranchName.slice(0, MAX_BRANCH_NAME_LENGTH);
}
function checkoutNewBranch(branchName) {
    utils_1.gpExecSync({
        command: `git checkout -b "${branchName}"`,
    }, (err) => {
        throw new errors_1.ExitFailedError(`Failed to checkout new branch ${branchName}`, err);
    });
}
const ALLOWED_BRANCH_CHARACTERS = [
    '_',
    '-',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
];
//# sourceMappingURL=create_branch.js.map