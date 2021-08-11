import { StackNode } from ".";
export declare class Stack {
    source: StackNode;
    constructor(source: StackNode);
    toString(): string;
    toDictionary(): Record<string, any>;
    equals(other: Stack): boolean;
    private base;
    static fromMap(map: Record<string, any>): Stack;
}