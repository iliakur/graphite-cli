import yargs from 'yargs';
import { restackCurrentBranch } from '../../actions/restack';
import { profile } from '../../lib/telemetry/profile';

const args = {} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const aliases = ['r'];
export const command = 'restack';
export const canonical = 'branch restack';
export const description = 'Restack the current branch onto its parent.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return profile(argv, canonical, async (context) =>
    restackCurrentBranch(context)
  );
};