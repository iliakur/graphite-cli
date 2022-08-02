"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCommits = void 0;
const run_command_1 = require("../utils/run_command");
function showCommits(base, head, patch) {
    return (0, run_command_1.runGitCommand)({
        args: [
            `-c`,
            `color.ui=always`,
            `--no-pager`,
            `log`,
            ...(patch ? ['-p'] : []),
            `${base}..${head}`,
            `--`,
        ],
        onError: 'throw',
        resource: 'showCommits',
    });
}
exports.showCommits = showCommits;
//# sourceMappingURL=show_commits.js.map