"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeSplog = void 0;
/* eslint-disable no-console */
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const tmp_1 = __importDefault(require("tmp"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const errors_1 = require("../errors");
function composeSplog(opts = {}) {
    return {
        newline: opts.quiet ? () => void 0 : () => console.log(),
        info: opts.quiet ? () => void 0 : (s) => console.log(s),
        debug: opts.outputDebugLogs
            ? (s) => console.log(chalk_1.default.dim(`${chalk_1.default.bold(`${new Date().toISOString()}:`)} ${s}`))
            : () => void 0,
        error: (s) => console.log(chalk_1.default.redBright(`ERROR: ${s}`)),
        warn: (s) => console.log(chalk_1.default.yellow(`WARNING: ${s}`)),
        message: (s) => console.log(chalk_1.default.yellow(`${chalk_1.default.yellow(s)}\n\n`)),
        tip: (s) => opts.tips && !opts.quiet
            ? console.log(chalk_1.default.gray([
                '',
                `${chalk_1.default.bold('tip')}: ${s}`,
                chalk_1.default.italic('Feeling expert? `gt user tips --disable`'),
                '',
            ].join('\n')))
            : () => void 0,
        page: opts.pager
            ? (s) => {
                const tmpFile = tmp_1.default.fileSync();
                fs_extra_1.default.writeFileSync(tmpFile.fd, s);
                const command = `${opts.pager} ${tmpFile.name}`;
                try {
                    (0, child_process_1.execSync)(command, { stdio: 'inherit', encoding: 'utf-8' });
                }
                catch (e) {
                    throw new errors_1.CommandFailedError({
                        command,
                        args: [tmpFile.name],
                        ...e,
                    });
                }
            }
            : (s) => console.log(s),
    };
}
exports.composeSplog = composeSplog;
//# sourceMappingURL=splog.js.map