import chalk from 'chalk';
import prompts from 'prompts';
import { TContext } from '../../lib/context';
import { ExitFailedError, KilledError } from '../../lib/errors';
import { assertUnreachable } from '../../lib/utils/assert_unreachable';

export async function getBranchesFromRemote(
  downstack: string[],
  base: string,
  context: TContext
): Promise<void> {
  let parentBranchName = base;
  for (const branchName of downstack) {
    context.metaCache.fetchBranch(branchName, parentBranchName);
    if (!context.metaCache.branchExists(branchName)) {
      // If the branch doesn't already exists, no conflict to resolve
      context.metaCache.checkoutBranchFromFetched(branchName, parentBranchName);
      context.splog.logInfo(`Synced ${chalk.cyan(branchName)} from remote.`);
    } else if (
      context.metaCache.getParentPrecondition(branchName) !== parentBranchName
    ) {
      await handleDifferentParents(branchName, parentBranchName, context);
    } else if (context.metaCache.branchMatchesFetched(branchName)) {
      context.splog.logInfo(`${chalk.cyan(branchName)} is up to date.`);
    } else {
      await handleSameParent(branchName, parentBranchName, context);
    }
    parentBranchName = branchName;
  }
}

async function handleDifferentParents(
  branchName: string,
  parentBranchName: string,
  context: TContext
): Promise<void> {
  context.splog.logInfo(
    [
      `${chalk.yellow(
        branchName
      )} shares a name with a local branch, but they have different parents.`,
      `In order to sync it, you must overwrite your local copy of the branch.`,
      `If you do not wish to overwrite your copy, the command will be aborted.`,
    ].join('\n')
  );

  if (
    !context.interactive ||
    !(
      await prompts(
        {
          type: 'confirm',
          name: 'value',
          message: `Overwrite ${chalk.yellow(
            branchName
          )} with the version from remote?`,
          initial: false,
        },
        {
          onCancel: () => {
            throw new KilledError();
          },
        }
      )
    ).value
  ) {
    throw new KilledError();
  }

  context.metaCache.checkoutBranchFromFetched(branchName, parentBranchName);
  context.splog.logInfo(`Synced ${chalk.cyan(branchName)} from remote.`);
}

async function handleSameParent(
  branchName: string,
  parentBranchName: string,
  context: TContext
): Promise<void> {
  context.splog.logInfo(
    [
      `${chalk.yellow(
        branchName
      )} shares a name with a local branch, and they have the same parent.`,
      `You can either overwrite your copy of the branch, or rebase your local changes onto the remote version.`,
      `You can also abort the command entirely and keep your local state as is.`,
    ].join('\n')
  );

  const fetchChoice: 'REBASE' | 'OVERWRITE' | 'ABORT' = !context.interactive
    ? 'ABORT'
    : (
        await prompts(
          {
            type: 'select',
            name: 'value',
            message: `How would you like to handle ${chalk.yellow(
              branchName
            )}?`,
            choices: [
              {
                title: 'Rebase your changes on top of the remote version',
                value: 'REBASE',
              },
              {
                title: 'Overwrite the local copy with the remote version',
                value: 'OVERWRITE',
              },
              { title: 'Abort this command', value: 'ABORT' },
            ],
          },
          {
            onCancel: () => {
              throw new KilledError();
            },
          }
        )
      ).value;

  switch (fetchChoice) {
    case 'REBASE':
      throw new ExitFailedError(`Rebasing is not yet implemented.`);
    case 'OVERWRITE':
      context.metaCache.checkoutBranchFromFetched(branchName, parentBranchName);
      context.splog.logInfo(`Synced ${chalk.cyan(branchName)} from remote.`);
      break;
    case 'ABORT':
      throw new KilledError();
    default:
      assertUnreachable(fetchChoice);
  }
}
