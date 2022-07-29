"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitPager = exports.getGitEditor = void 0;
const run_command_1 = require("../utils/run_command");
function getGitEditor() {
    const editor = (0, run_command_1.runGitCommand)({
        args: [`config`, `--global`, `core.editor`],
        onError: 'ignore',
        resource: 'getGitEditor',
    });
    return editor.length > 0 ? editor : undefined;
}
exports.getGitEditor = getGitEditor;
function getGitPager() {
    const editor = (0, run_command_1.runGitCommand)({
        args: [`config`, `--global`, `core.pager`],
        onError: 'ignore',
        resource: 'getGitEditor',
    });
    return editor.length > 0 ? editor : undefined;
}
exports.getGitPager = getGitPager;
//# sourceMappingURL=git_editor.js.map