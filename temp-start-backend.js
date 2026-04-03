const { spawn } = require('child_process');
const child = spawn('cmd.exe', ['/c', '"C:\\Program Files\\nodejs\\npm.cmd" run dev'], {
  cwd: 'c:\\Users\\Swisstech\\OneDrive\\Desktop\\Platforma\\backend',
  detached: true,
  stdio: 'ignore'
});
child.unref();
console.log('spawned');
