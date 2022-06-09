"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayBranchName = exports.interactiveBranchSelection = exports.logAction = void 0;
const chalk_1 = __importDefault(require("chalk"));
const prompts_1 = __importDefault(require("prompts"));
const errors_1 = require("../lib/errors");
const show_branch_1 = require("./show_branch");
function logAction(opts, context) {
    getStackLines({
        short: opts.style === 'SHORT',
        reverse: opts.reverse,
        branchName: opts.branchName,
        indentLevel: 0,
        steps: opts.steps,
    }, context).forEach((line) => context.splog.info(line));
    if (opts.style === 'SHORT' &&
        context.metaCache.isTrunk(opts.branchName) &&
        !opts.reverse &&
        !opts.steps) {
        context.splog.tip('Miss the old version of log short? Try the `--classic` flag!');
    }
}
exports.logAction = logAction;
async function interactiveBranchSelection(opts, context) {
    const choices = getStackLines({
        short: true,
        reverse: false,
        branchName: context.metaCache.trunk,
        indentLevel: 0,
        omitCurrentBranch: opts.omitCurrentBranch,
        noStyleBranchName: true,
    }, context).map((stackLine) => ({ title: stackLine, value: stackLine.trim() }));
    const indexOfCurrentIfPresent = choices.findIndex((choice) => choice.value ===
        (opts.omitCurrentBranch
            ? context.metaCache.getParentPrecondition(context.metaCache.currentBranchPrecondition)
            : context.metaCache.currentBranch));
    const initial = indexOfCurrentIfPresent !== -1
        ? indexOfCurrentIfPresent
        : choices.length - 1;
    const chosenBranch = (await (0, prompts_1.default)({
        type: 'autocomplete',
        name: 'branch',
        message: opts.message,
        choices,
        initial,
        suggest: (input, choices) => choices.filter((c) => c.value.includes(input)),
    }, {
        onCancel: () => {
            throw new errors_1.KilledError();
        },
    })).branch;
    context.splog.debug(`Selected ${chosenBranch}`);
    return chosenBranch;
}
exports.interactiveBranchSelection = interactiveBranchSelection;
function getStackLines(args, context) {
    const outputDeep = [
        getUpstackExclusiveLines(args, context),
        getBranchLines(args, context),
        getDownstackExclusiveLines(args, context),
    ];
    return args.reverse ? outputDeep.reverse().flat() : outputDeep.flat();
}
function getDownstackExclusiveLines(args, context) {
    if (context.metaCache.isTrunk(args.branchName)) {
        return [];
    }
    const outputDeep = [
        context.metaCache.trunk,
        ...context.metaCache.getRelativeStack(args.branchName, {
            recursiveParents: true,
        }),
    ]
        .slice(-(args.steps ?? 0))
        .map((branchName) => getBranchLines({ ...args, branchName }, context));
    // opposite of the rest of these because we got the list from trunk upward
    return args.reverse ? outputDeep.flat() : outputDeep.reverse().flat();
}
function getUpstackInclusiveLines(args, context) {
    const outputDeep = [
        getUpstackExclusiveLines(args, context),
        getBranchLines(args, context),
    ];
    return args.reverse ? outputDeep.reverse().flat() : outputDeep.flat();
}
function getUpstackExclusiveLines(args, context) {
    if (args.steps === 0) {
        return [];
    }
    const children = context.metaCache.getChildren(args.branchName);
    return children
        .filter((child) => !args.omitCurrentBranch ||
        child !== context.metaCache.currentBranchPrecondition)
        .flatMap((child, i) => getUpstackInclusiveLines({
        ...args,
        steps: args.steps ? args.steps - 1 : undefined,
        branchName: child,
        indentLevel: args.indentLevel + (args.reverse ? children.length - i - 1 : i),
    }, context));
}
function displayBranchName(branchName, context) {
    return `${branchName === context.metaCache.currentBranch
        ? chalk_1.default.cyan(branchName)
        : branchName} ${context.metaCache.isBranchFixed(branchName)
        ? ''
        : chalk_1.default.yellowBright(`(needs restack)`)}`;
}
exports.displayBranchName = displayBranchName;
function getBranchLines(args, context) {
    // `gt log short` case
    if (args.short) {
        return [
            `${'  '.repeat(args.indentLevel)}${args.noStyleBranchName
                ? args.branchName
                : displayBranchName(args.branchName, context)}`,
        ];
    }
    // `gt log` case
    const numChildren = context.metaCache.getChildren(args.branchName).length;
    const outputDeep = [
        getBranchingLine({
            numChildren,
            reverse: args.reverse,
            indentLevel: args.indentLevel,
        }),
        getInfoLines({ ...args, noStem: args.reverse && numChildren === 0 }, context),
    ];
    return args.reverse ? outputDeep.reverse().flat() : outputDeep.flat();
}
function getBranchingLine(args) {
    // return type is array so that we don't add lines to the output in the empty case
    if (args.numChildren < 2) {
        return [];
    }
    const [middleBranch, lastBranch] = args.reverse
        ? ['──┬', '──┐']
        : ['──┴', '──┘'];
    return [
        getPrefix(args.indentLevel) +
            '├'.concat(middleBranch.repeat(args.numChildren > 2 ? args.numChildren - 2 : 0), lastBranch),
    ];
}
function getInfoLines(args, context) {
    const isCurrent = args.branchName === context.metaCache.currentBranch;
    return (0, show_branch_1.getBranchInfo)({
        branchName: args.branchName,
        displayAsCurrent: isCurrent,
        showCommitNames: args.reverse ? 'REVERSE' : 'STANDARD',
    }, context)
        .map((line, index) => `${getPrefix(args.indentLevel)}${index === 0
        ? isCurrent
            ? chalk_1.default.cyan('◉')
            : '◯'
        : args.noStem
            ? ' '
            : '│'} ${line}`)
        .concat([getPrefix(args.indentLevel) + (args.noStem ? ' ' : '│')]);
}
function getPrefix(indentLevel) {
    return '│  '.repeat(indentLevel);
}
//# sourceMappingURL=log.js.map