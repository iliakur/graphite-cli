import { MergeConflictCallstackT, TDeleteBranchesStackFrame } from '../lib/config/merge_conflict_callstack_config';
import { TContext } from '../lib/context/context';
/**
 * This method is assumed to be idempotent -- if a merge conflict interrupts
 * execution of this method, we simply restart the method upon running `gt
 * continue`.
 */
export declare function deleteMergedBranches(opts: {
    frame: TDeleteBranchesStackFrame;
    parent: MergeConflictCallstackT;
}, context: TContext): Promise<void>;