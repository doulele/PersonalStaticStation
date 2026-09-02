// 重启后端：找到占用 3001 端口的进程并结束
import { execSync } from 'node:child_process';

try {
  const out = execSync('netstat -ano | findstr :3001', { encoding: 'utf8' });
  const lines = out.split('\n').filter((l) => l.includes('LISTENING'));
  const pids = new Set();
  for (const l of lines) {
    const m = l.trim().split(/\s+/);
    const pid = m[m.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }
  if (pids.size === 0) {
    console.log('NO_PROCESS_ON_3001');
  } else {
    for (const pid of pids) {
      console.log('KILL', pid);
      try { execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' }); } catch (e) { console.log('kill fail', e.message); }
    }
  }
} catch (e) {
  console.log('ERR', e.message);
}
