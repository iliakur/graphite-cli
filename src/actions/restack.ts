import chalk from 'chalk';
import { TContext } from '../lib/context';
import { RebaseConflictError } from '../lib/errors';
import { assertUnreachable } from '../lib/utils/assert_unreachable';
import { logInfo } from '../lib/utils/splog';

export function restackCurrentBranch(context: TContext): void {
  const branchName = context.metaCache.currentBranchPrecondition;
  if (context.metaCache.isTrunk(branchName)) {
    logInfo(`${chalk.cyan(branchName)} does not need to be restacked.`);
  }

  const result = context.metaCache.restackBranch(branchName);
  switch (result) {
    case 'REBASE_DONE':
      return finishRestack(context);

    case 'REBASE_CONFLICT':
      throw new RebaseConflictError(
        `Hit conflict restacking ${chalk.yellow(branchName)} on ${chalk.cyan(
          context.metaCache.getParentPrecondition(branchName)
        )}.`
      );

    case 'REBASE_UNNEEDED':
      logInfo(
        `${chalk.cyan(
          branchName
        )} does not need to be restacked${` on ${chalk.cyan(
          context.metaCache.getParentPrecondition(branchName)
        )}`}.`
      );
      break;

    default:
      assertUnreachable(result);
  }
}

export function finishRestack(context: TContext): void {
  const branchName = context.metaCache.currentBranchPrecondition;
  logInfo(
    `Restacked ${chalk.green(branchName)} on ${chalk.cyan(
      context.metaCache.getParentPrecondition(branchName)
    )}.`
  );
}