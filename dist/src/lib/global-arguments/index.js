"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processGlobalArgumentsMiddleware = exports.globalArgumentsOptions = void 0;
const exec_state_config_1 = require("../config/exec_state_config");
const globalArgumentsOptions = {
    interactive: {
        alias: 'i',
        default: true,
        type: 'boolean',
        demandOption: false,
    },
    quiet: { alias: 'q', default: false, type: 'boolean', demandOption: false },
    verify: { default: true, type: 'boolean', demandOption: false },
    debug: { default: false, type: 'boolean', demandOption: false },
};
exports.globalArgumentsOptions = globalArgumentsOptions;
function processGlobalArgumentsMiddleware(argv) {
    exec_state_config_1.execStateConfig
        .setQuiet(argv.quiet)
        .setNoVerify(!argv.verify)
        .setInteractive(argv.interactive)
        .setOutputDebugLogs(argv.debug);
}
exports.processGlobalArgumentsMiddleware = processGlobalArgumentsMiddleware;
//# sourceMappingURL=index.js.map