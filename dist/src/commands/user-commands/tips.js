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
exports.handler = exports.builder = exports.canonical = exports.description = exports.command = void 0;
const profile_1 = require("../../lib/telemetry/profile");
const splog_1 = require("../../lib/utils/splog");
const args = {
    enable: {
        demandOption: false,
        default: false,
        type: 'boolean',
        describe: 'Enable tips.',
    },
    disable: {
        demandOption: false,
        default: false,
        type: 'boolean',
        describe: 'Disable tips.',
    },
};
exports.command = 'tips';
exports.description = 'Show tips while using Graphite';
exports.canonical = 'user tips';
exports.builder = args;
const handler = (argv) => __awaiter(void 0, void 0, void 0, function* () {
    return profile_1.profile(argv, exports.canonical, (context) => __awaiter(void 0, void 0, void 0, function* () {
        if (argv.enable) {
            context.userConfig.update((data) => (data.tips = true));
            splog_1.logInfo(`tips enabled`);
        }
        else if (argv.disable) {
            context.userConfig.update((data) => (data.tips = false));
            splog_1.logInfo(`tips disabled`);
        }
        else {
            context.userConfig.data.tips
                ? splog_1.logInfo(`tips enabled`)
                : splog_1.logInfo(`tips disabled`);
        }
    }));
});
exports.handler = handler;
//# sourceMappingURL=tips.js.map