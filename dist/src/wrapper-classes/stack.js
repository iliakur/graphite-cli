"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const _1 = require(".");
class Stack {
    constructor(source) {
        this.source = source;
    }
    toString() {
        const indentMultilineString = (lines) => lines
            .split("\n")
            .map((l) => "  " + l)
            .join("\n");
        return [`↳ (${this.source.branch.name})`]
            .concat(this.source.children
            .map((c) => new Stack(c).toString())
            .map(indentMultilineString))
            .join("\n");
    }
    toDictionary() {
        return this.source.toDictionary();
    }
    equals(other) {
        return this.base().equals(other.base());
    }
    base() {
        let base = this.source;
        while (base.parents.length > 0) {
            base = base.parents[0];
        }
        return base;
    }
    static fromMap(map) {
        if (Object.keys(map).length != 1) {
            throw Error(`Map must have only only top level branch name`);
        }
        const sourceBranchName = Object.keys(map)[0];
        const sourceNode = new _1.StackNode({
            branch: new _1.Branch(sourceBranchName),
            parents: [],
            children: [],
        });
        sourceNode.children = _1.StackNode.childrenNodesFromMap(sourceNode, map[sourceBranchName]);
        return new Stack(sourceNode);
    }
}
exports.Stack = Stack;
//# sourceMappingURL=stack.js.map