import fs from 'node:fs';
import { execSync } from 'node:child_process';
try {
  const out = execSync('netstat -ano | findstr :3001 | findstr LISTENING', { encoding: 'utf8' });
  console.log('LISTEN:', out.trim());
} catch (e) { console.log('no listener'); }
const log = 'F:/personal/个人网站项目/personToolStation/PersonalStaticStation/_backend.log';
if (fs.existsSync(log)) {
  const t = fs.readFileSync(log, 'utf8');
  const idx = t.lastIndexOf('Server running');
  console.log('--- last startup log ---');
  console.log(idx > -1 ? t.slice(idx - 300) : t.slice(-1000));
}
