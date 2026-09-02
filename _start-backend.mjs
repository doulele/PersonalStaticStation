// 后台启动后端（detached + 日志文件）
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const backend = 'F:/personal/个人网站项目/personToolStation/PersonalStaticStationBackend';
const log = fs.openSync('F:/personal/个人网站项目/personToolStation/PersonalStaticStation/_backend.log', 'a');
const child = spawn('node', ['app.js'], {
  cwd: backend,
  stdio: ['ignore', log, log],
  detached: true,
  shell: false
});
child.unref();
console.log('backend starting, pid=', child.pid);
