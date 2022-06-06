// Why does an open source CLI include telemetry?
// We the creators want to understand how people are using the tool
// All metrics logged are listed plain to see, and are non blocking in case the server is unavailable.
import chalk from 'chalk';
import yargs from 'yargs';
import { version } from '../../package.json';
import { init } from '../actions/init';
import { initContext, TContext } from './context';
import {
  ExitFailedError,
  KilledError,
  PreconditionsFailedError,
  RebaseConflictError,
} from './errors';
import { getUnmergedFiles } from './git/merge_conflict_help';
import { TGlobalArguments } from './global_arguments';
import { refreshPRInfoInBackground } from './requests/fetch_pr_info';
import { getUserEmail } from './telemetry/context';
import { postTelemetryInBackground } from './telemetry/post_traces';
import { registerSigintHandler } from './telemetry/sigint_handler';
import { postSurveyResponsesInBackground } from './telemetry/survey/post_survey';
import { tracer } from './telemetry/tracer';
import { fetchUpgradePromptInBackground } from './telemetry/upgrade_prompt';
import { parseArgs } from './utils/parse_args';

export async function graphite(
  args: yargs.Arguments & TGlobalArguments,
  canonicalName: string,
  handler: (context: TContext) => Promise<void>
): Promise<void> {
  const parsedArgs = parseArgs(args);

  await tracer.span(
    {
      name: 'command',
      resource: parsedArgs.command,
      meta: {
        user: getUserEmail() || 'NotFound',
        version: version,
        args: parsedArgs.args,
        alias: parsedArgs.alias,
      },
    },
    () => graphiteHelper(args, parsedArgs.command, canonicalName, handler)
  );
}

// TODO check with Greg about whether we still need all the OldTelemetry stuff?
// Then we can simplify this function and signature a lot
// eslint-disable-next-line max-params
async function graphiteHelper(
  args: yargs.Arguments & TGlobalArguments,
  commandName: string,
  canonicalName: string,
  handler: (context: TContext) => Promise<void>
): Promise<void> {
  const start = Date.now();
  registerSigintHandler({
    commandName,
    canonicalCommandName: canonicalName,
    startTime: start,
  });

  const context = initContext({
    globalArguments: args,
  });

  const err = await (async (): Promise<Error | undefined> => {
    try {
      fetchUpgradePromptInBackground(context);
      postSurveyResponsesInBackground(context);

      if (
        canonicalName !== 'repo init' &&
        !context.repoConfig.graphiteInitialized()
      ) {
        context.splog.logInfo(
          `Graphite has not been initialized, attempting to setup now...`
        );
        context.splog.logNewline();
        await init(context);
      }

      await handler(context);
      return undefined;
    } catch (err) {
      handleGraphiteError(err, context);
      context.splog.logDebug(err);
      context.splog.logDebug(err.stack);
      // print errors when debugging tests
      if (process.env.DEBUG) {
        process.stdout.write(err.stack.toString());
      }
      process.exitCode = 1;
      return err;
    }
  })();
  context.metaCache.persist();
  refreshPRInfoInBackground(context);

  const end = Date.now();
  postTelemetryInBackground({
    canonicalCommandName: canonicalName,
    commandName,
    durationMiliSeconds: end - start,
    err,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleGraphiteError(err: any, context: TContext): void {
  switch (err.constructor) {
    case KilledError:
      // pass
      return;
    case ExitFailedError:
      context.splog.logError(err.message);
      return;
    case PreconditionsFailedError:
      context.splog.logError(err.message);
      return;
    case RebaseConflictError:
      context.splog.logInfo(`${chalk.red(`Rebase Conflict`)}: ${err.message}`);
      context.splog.logNewline();
      context.splog.logInfo(chalk.yellow(`Unmerged files:`));
      context.splog.logInfo(
        getUnmergedFiles()
          .map((line) => chalk.red(line))
          .join('\n')
      );
      context.splog.logNewline();
      context.splog.logInfo(
        `To fix and continue your previous Graphite command:`
      );
      context.splog.logInfo(`(1) resolve the listed merge conflicts`);
      context.splog.logInfo(
        `(2) mark them as resolved with ${chalk.cyan(`gt add`)}`
      );
      context.splog.logInfo(
        `(3) run ${chalk.cyan(
          `gt continue`
        )} to continue executing your previous Graphite command`
      );
      return;
    default:
      context.splog.logError(err.message);
      return;
  }
}