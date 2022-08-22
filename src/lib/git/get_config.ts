import { runGitCommand } from './runner';

export function getConfigValue(key: string): string | undefined {
  const value = runGitCommand({
    args: [`config`, key],
    onError: 'ignore',
    resource: 'getGitEditor',
  });
  return value.length > 0 ? value : undefined;
}
