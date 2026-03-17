import { spawn, type ChildProcess } from 'node:child_process';

const children: ChildProcess[] = [];
let shuttingDown = false;

function runPnpm(args: string[]): ChildProcess {
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  return child;
}

function shutdown(exitCode = 0): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exitCode = exitCode;
}

const generator = runPnpm(['generate-language-pages', '--watch']);
const astro = runPnpm(['astro', 'dev']);

generator.on('exit', (code) => {
  if (shuttingDown) {
    return;
  }
  if (code && code !== 0) {
    console.error(`generate-language-pages watcher exited with code ${code}.`);
    shutdown(code);
    return;
  }
  shutdown(0);
});

astro.on('exit', (code) => {
  if (shuttingDown) {
    return;
  }
  shutdown(code || 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
