import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Hooks do Claude Code em .claude/hooks (ver .ai/patterns/convencoes.md).
const run = (script: string, input: string) =>
  spawnSync('bash', [`.claude/hooks/${script}`], { input, encoding: 'utf8' });

const isCommit = (command: string) => run('is-git-commit.sh', command).status === 0;

describe('is-git-commit.sh', () => {
  it.each([
    'git commit -m x',
    'cd /x && git commit -m "a"',
    'git -C dir commit',
    'git -C "dir x" commit',
    'git -c user.name=x commit',
    'git -C d -c a=b commit',
    'git --no-pager commit',
    '/usr/bin/git commit',
    '(git commit)',
    'echo $(git commit)',
    "sh -c 'git commit'",
    'bash -c "git add . && git commit"',
    'eval "git commit"',
    'git commit;echo ok',
    'GIT_DIR=.git git commit',
    'git\tcommit',
  ])('detecta: %s', (command) => {
    expect(isCommit(command)).toBe(true);
  });

  it.each([
    'git status',
    'git log --oneline -3',
    'git commit-tree abc',
    'git show HEAD:commit.txt',
    'mygit commit',
    'yarn test:run',
    '',
  ])('ignora: %s', (command) => {
    expect(isCommit(command)).toBe(false);
  });
});

describe('pre-commit-check.sh', () => {
  it('comando que não é commit → libera (exit 0)', () => {
    expect(run('pre-commit-check.sh', '{"tool_input":{"command":"git status"}}').status).toBe(0);
  });

  it('JSON inválido → bloqueia (exit 2) em vez de liberar', () => {
    const result = run('pre-commit-check.sh', 'isto não é json');

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/entrada inválida/i);
  });
});
