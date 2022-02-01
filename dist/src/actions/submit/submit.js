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
exports.saveBranchPRInfo = exports.submitAction = void 0;
const graphite_cli_routes_1 = __importDefault(require("@screenplaydev/graphite-cli-routes"));
const retyped_routes_1 = require("@screenplaydev/retyped-routes");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../../lib/api");
const config_1 = require("../../lib/config");
const errors_1 = require("../../lib/errors");
const preconditions_1 = require("../../lib/preconditions");
const pr_info_1 = require("../../lib/sync/pr_info");
const survey_1 = require("../../lib/telemetry/survey/survey");
const utils_1 = require("../../lib/utils");
const wrapper_classes_1 = require("../../wrapper-classes");
const branch_1 = __importDefault(require("../../wrapper-classes/branch"));
const validate_1 = require("../validate");
const pr_body_1 = require("./pr_body");
const pr_draft_1 = require("./pr_draft");
const pr_title_1 = require("./pr_title");
const prompts_1 = __importDefault(require("prompts"));
function submitAction(args) {
    return __awaiter(this, void 0, void 0, function* () {
        let branchesToSubmit;
        // Check CLI pre-condition to warn early
        const cliAuthToken = preconditions_1.cliAuthPrecondition();
        if (args.dryRun) {
            utils_1.logInfo(chalk_1.default.yellow(`Running submit in 'dry-run' mode. No branches will be pushed and no PRs will be opened or updated.`));
            utils_1.logNewline();
            args.editPRFieldsInline = false;
        }
        if (!config_1.execStateConfig.interactive()) {
            utils_1.logInfo(`Running in interactive mode. All new PRs will be created as draft and PR fields inline prompt will be silenced`);
            args.editPRFieldsInline = false;
            args.createNewPRsAsDraft = true;
        }
        // This supports the use case in sync.ts. Skips Steps 1 and 2
        if (args.branchesToSubmit) {
            branchesToSubmit = args.branchesToSubmit;
        }
        else {
            // Step 1: Validate
            utils_1.logInfo(chalk_1.default.blueBright(`✏️  [Step 1] Validating that this Graphite stack is ready to submit...`));
            const validationResult = yield getValidBranchesToSubmit(args.scope);
            if (validationResult.abort) {
                return;
            }
            branchesToSubmit = validationResult.submittableBranches;
        }
        // Step 2: Prepare
        utils_1.logInfo(chalk_1.default.blueBright('🥞 [Step 2] Preparing to submit PRs for the following branches...'));
        const submissionInfoWithBranches = yield getPRInfoForBranches({
            branches: branchesToSubmit,
            editPRFieldsInline: args.editPRFieldsInline,
            createNewPRsAsDraft: args.createNewPRsAsDraft,
            updateOnly: args.updateOnly,
            dryRun: args.dryRun,
        });
        if (args.dryRun) {
            utils_1.logInfo(chalk_1.default.blueBright('✅ Dry Run complete.'));
            return;
        }
        // Step 3: Pushing branches to remote
        utils_1.logInfo(chalk_1.default.blueBright('➡️  [Step 3] Pushing branches to remote...'));
        const branchesPushedToRemote = pushBranchesToRemote(submissionInfoWithBranches.map((info) => info.branch));
        utils_1.logInfo(chalk_1.default.blueBright(`📂 [Step 4] Opening/updating PRs on GitHub for pushed branches...`));
        yield submitPullRequests({
            submissionInfoWithBranches: submissionInfoWithBranches,
            branchesPushedToRemote: branchesPushedToRemote,
            cliAuthToken: cliAuthToken,
        });
        utils_1.logNewline();
        const survey = yield survey_1.getSurvey();
        if (survey) {
            yield survey_1.showSurvey(survey);
        }
    });
}
exports.submitAction = submitAction;
function getValidBranchesToSubmit(scope) {
    return __awaiter(this, void 0, void 0, function* () {
        let branchesToSubmit;
        try {
            if (scope === 'BRANCH') {
                const currentBranch = preconditions_1.currentBranchPrecondition();
                branchesToSubmit = [currentBranch];
            }
            else {
                const stack = getStack({
                    currentBranch: preconditions_1.currentBranchPrecondition(),
                    scope: scope,
                });
                validate_1.validateStack(scope, stack);
                branchesToSubmit = stack.branches().filter((b) => !b.isTrunk());
            }
            utils_1.logNewline();
        }
        catch (_a) {
            throw new errors_1.ValidationFailedError(`Validation failed. Will not submit.`);
        }
        // Force a sync to link any PRs that have remote equivalents but weren't
        // previously tracked with Graphite.
        yield pr_info_1.syncPRInfoForBranches(branchesToSubmit);
        return yield processBranchesInInvalidState(branchesToSubmit);
    });
}
function processBranchesInInvalidState(branches) {
    return __awaiter(this, void 0, void 0, function* () {
        const closedBranches = branches.filter((b) => { var _a; return ((_a = b.getPRInfo()) === null || _a === void 0 ? void 0 : _a.state) === 'CLOSED'; });
        const mergedBranches = branches.filter((b) => { var _a; return ((_a = b.getPRInfo()) === null || _a === void 0 ? void 0 : _a.state) === 'MERGED'; });
        const submittableBranches = branches.filter((b) => { var _a, _b; return ((_a = b.getPRInfo()) === null || _a === void 0 ? void 0 : _a.state) !== 'CLOSED' || ((_b = b.getPRInfo()) === null || _b === void 0 ? void 0 : _b.state) !== 'MERGED'; });
        let abort = false;
        if (closedBranches.length > 0 || mergedBranches.length > 0) {
            utils_1.logWarn(`PRs for the following branches in the stack have been closed or merged:`);
            closedBranches.forEach((b) => utils_1.logWarn(`▸ ${chalk_1.default.reset(b.name)} (closed)`));
            mergedBranches.forEach((b) => utils_1.logWarn(`▸ ${chalk_1.default.reset(b.name)} (merged)`));
            utils_1.logWarn(`This can cause unexpected issues.`);
            if (!config_1.execStateConfig.interactive()) {
                abort = true;
                utils_1.logInfo(`Aborting.`);
            }
            else {
                const response = yield prompts_1.default({
                    type: 'select',
                    name: 'closed_branches_options',
                    message: `How would you like to proceed?`,
                    choices: [
                        {
                            title: `Abort "stack submit" and fix manually`,
                            value: 'fix_manually',
                        },
                        {
                            title: `Continue with closed branches (best effort)`,
                            value: 'continue_without_fix',
                        },
                    ],
                }, {
                    onCancel: () => {
                        throw new errors_1.KilledError();
                    },
                });
                if (response.closed_branches_options === 'fix_manually') {
                    abort = true;
                    utils_1.logInfo(`Aborting...`);
                } //TODO (nehasri): Fix branches automatically in the else option and modify submittableBranches
            }
            utils_1.logNewline();
        }
        return {
            submittableBranches: submittableBranches,
            closedBranches: closedBranches,
            mergedBranches: mergedBranches,
            abort: abort,
        };
    });
}
function submitPullRequests(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!args.submissionInfoWithBranches.length) {
            utils_1.logInfo(`No eligible branches to create PRs for.`);
            utils_1.logNewline();
            return;
        }
        const prInfo = yield requestServerToSubmitPRs(args.cliAuthToken, args.submissionInfoWithBranches);
        saveBranchPRInfo(prInfo);
        printSubmittedPRInfo(prInfo);
    });
}
function getStack(args) {
    switch (args.scope) {
        case 'UPSTACK':
            return new wrapper_classes_1.MetaStackBuilder().upstackInclusiveFromBranchWithParents(args.currentBranch);
        case 'DOWNSTACK':
            return new wrapper_classes_1.MetaStackBuilder().downstackFromBranch(args.currentBranch);
        case 'FULLSTACK':
            return new wrapper_classes_1.MetaStackBuilder().fullStackFromBranch(args.currentBranch);
    }
}
/**
 * For now, we only allow users to update the following PR properties which
 * necessitate a PR update:
 * - the PR base
 * - the PR's code contents
 *
 * Notably, we do not yet allow users to update the PR title, body, etc.
 *
 * Therefore, we should only update the PR iff either of these properties
 * differ from our stored data on the previous PR submission.
 */
function getPRInfoForBranches(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const branchPRInfo = [];
        const newPrBranches = [];
        for (const branch of args.branches) {
            // The branch here should always have a parent - above, the branches we've
            // gathered should exclude trunk which ensures that every branch we're submitting
            // a PR for has a valid parent.
            const parentBranchName = getBranchBaseName(branch);
            const previousPRInfo = branch.getPRInfo();
            let status, reason;
            if (previousPRInfo && branch.isBaseSameAsRemotePr()) {
                status = 'Update';
                reason = 'restacked';
                branchPRInfo.push({
                    action: 'update',
                    head: branch.name,
                    base: parentBranchName,
                    prNumber: previousPRInfo.number,
                    branch: branch,
                });
            }
            else if (previousPRInfo && utils_1.detectUnsubmittedChanges(branch)) {
                status = 'Update';
                reason = 'code changes/rebase';
                branchPRInfo.push({
                    action: 'update',
                    head: branch.name,
                    base: parentBranchName,
                    prNumber: previousPRInfo.number,
                    branch: branch,
                });
            }
            else if (!previousPRInfo && !args.updateOnly) {
                status = 'Create';
                newPrBranches.push(branch);
            }
            else {
                status = `no-op`;
            }
            utils_1.logInfo(`▸ ${chalk_1.default.cyan(branch.name)} (${status}${reason ? ' - ' + reason : ''})`);
        }
        // Prompt for PR creation info separately after printing
        for (const branch of newPrBranches) {
            const parentBranchName = getBranchBaseName(branch);
            const { title, body, draft } = yield getPRCreationInfo({
                branch: branch,
                parentBranchName: parentBranchName,
                editPRFieldsInline: args.editPRFieldsInline,
                createNewPRsAsDraft: args.createNewPRsAsDraft,
                dryRun: args.dryRun,
            });
            branchPRInfo.push({
                action: 'create',
                head: branch.name,
                base: parentBranchName,
                title: title,
                body: body,
                draft: draft,
                branch: branch,
            });
        }
        utils_1.logNewline();
        return branchPRInfo;
    });
}
function pushBranchesToRemote(branches) {
    const branchesPushedToRemote = [];
    if (!branches.length) {
        utils_1.logInfo(`No eligible branches to push.`);
        return [];
    }
    branches.forEach((branch) => {
        utils_1.logInfo(`Pushing ${branch.name} with force-with-lease (will not override external commits to remote)...`);
        const output = utils_1.gpExecSync({
            // redirecting stderr to stdout here because 1) git prints the output
            // of the push command to stderr 2) we want to analyze it but Node's
            // execSync makes analyzing stderr extremely challenging
            command: [
                `git push origin`,
                `--force-with-lease ${branch.name} 2>&1`,
                ...[config_1.execStateConfig.noVerify() ? ['--no-verify'] : []],
            ].join(' '),
            options: {
                printStdout: true,
            },
        }, (err) => {
            utils_1.logError(`Failed to push changes for ${branch.name} to remote.`);
            utils_1.logTip(`There maybe external commits on remote that were not overwritten with the attempted push. 
          \n Use 'git pull' to pull external changes and retry.`);
            throw new errors_1.ExitFailedError(err);
        })
            .toString()
            .trim();
        if (!output.includes('Everything up-to-date')) {
            branchesPushedToRemote.push(branch);
        }
    });
    return branchesPushedToRemote;
}
const SUCCESS_RESPONSE_CODE = 200;
const UNAUTHORIZED_RESPONSE_CODE = 401;
function requestServerToSubmitPRs(cliAuthToken, submissionInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield retyped_routes_1.request.requestWithArgs(api_1.API_SERVER, graphite_cli_routes_1.default.submitPullRequests, {
                authToken: cliAuthToken,
                repoOwner: config_1.repoConfig.getRepoOwner(),
                repoName: config_1.repoConfig.getRepoName(),
                prs: submissionInfo,
            });
            if (response._response.status === SUCCESS_RESPONSE_CODE &&
                response._response.body) {
                const requests = {};
                submissionInfo.forEach((prRequest) => {
                    requests[prRequest.head] = prRequest;
                });
                return response.prs.map((prResponse) => {
                    return {
                        request: requests[prResponse.head],
                        response: prResponse,
                    };
                });
            }
            else if (response._response.status === UNAUTHORIZED_RESPONSE_CODE) {
                throw new errors_1.PreconditionsFailedError('Your Graphite auth token is invalid/expired.\n\nPlease obtain a new auth token by visiting https://app.graphite.dev/activate.');
            }
            else {
                throw new errors_1.ExitFailedError(`unexpected server response (${response._response.status}).\n\nResponse: ${JSON.stringify(response)}`);
            }
        }
        catch (error) {
            throw new errors_1.ExitFailedError(`Failed to submit PRs`, error);
        }
    });
}
function getBranchBaseName(branch) {
    const parent = branch.getParentFromMeta();
    if (parent === undefined) {
        throw new errors_1.PreconditionsFailedError(`Could not find parent for branch ${branch.name} to submit PR against. Please checkout ${branch.name} and run \`gt upstack onto <parent_branch>\` to set its parent.`);
    }
    return parent.name;
}
function getPRCreationInfo(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (args.dryRun) {
            return {
                title: '',
                body: '',
                draft: true,
            };
        }
        utils_1.logInfo(`Enter info for new pull request for ${chalk_1.default.yellow(args.branch.name)} ▸ ${args.parentBranchName}:`);
        const title = yield pr_title_1.getPRTitle({
            branch: args.branch,
            editPRFieldsInline: args.editPRFieldsInline,
        });
        args.branch.setPriorSubmitTitle(title);
        const body = yield pr_body_1.getPRBody({
            branch: args.branch,
            editPRFieldsInline: args.editPRFieldsInline,
        });
        args.branch.setPriorSubmitBody(body);
        const createAsDraft = yield pr_draft_1.getPRDraftStatus({
            createNewPRsAsDraft: args.createNewPRsAsDraft,
        });
        // Log newline at the end to create some visual separation to the next
        // interactive PR section or status output.
        utils_1.logNewline();
        return {
            title: title,
            body: body,
            draft: createAsDraft,
        };
    });
}
function printSubmittedPRInfo(prs) {
    if (!prs.length) {
        utils_1.logNewline();
        utils_1.logInfo(chalk_1.default.blueBright('✅ All PRs up-to-date on GitHub; no updates necessary.'));
        return;
    }
    prs.forEach((pr) => {
        let status = pr.response.status;
        switch (pr.response.status) {
            case 'updated':
                status = `${chalk_1.default.yellow('(' + status + ')')}`;
                break;
            case 'created':
                status = `${chalk_1.default.green('(' + status + ')')}`;
                break;
            case 'error':
                status = `${chalk_1.default.red('(' + status + ')')}`;
                break;
            default:
                assertUnreachable(pr.response);
        }
        if ('error' in pr.response) {
            utils_1.logError(`Error in submitting ${pr.response.head}: ${pr.response.error}`);
        }
        else {
            utils_1.logSuccess(`${pr.response.head}: ${chalk_1.default.reset(pr.response.prURL)} ${status}`);
        }
    });
}
function saveBranchPRInfo(prs) {
    prs.forEach((pr) => __awaiter(this, void 0, void 0, function* () {
        if (pr.response.status === 'updated' || pr.response.status === 'created') {
            const branch = yield branch_1.default.branchWithName(pr.response.head);
            branch.setPRInfo({
                number: pr.response.prNumber,
                url: pr.response.prURL,
                base: pr.request.base,
            });
        }
    }));
}
exports.saveBranchPRInfo = saveBranchPRInfo;
// eslint-disable-next-line @typescript-eslint/no-empty-function
function assertUnreachable(arg) { }
//# sourceMappingURL=submit.js.map