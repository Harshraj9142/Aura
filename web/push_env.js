const fs = require('fs');
const { spawnSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf-8');
const lines = env.split(/\r?\n/);

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=("?)(.*)\2$/);
    if (match) {
      const key = match[1].trim();
      let val = match[3].trim();
      
      if (key === 'NEXTAUTH_URL') continue;
      
      console.log(`\nAdding ${key}...`);
      
      spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, 'production', '-y'], { shell: true });
      
      const result = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
        input: val,
        encoding: 'utf-8',
        shell: true
      });
      
      if (result.status !== 0) {
        console.log(`Error adding ${key}:`);
        console.log(result.error);
        if (result.stdout) console.log(result.stdout.toString());
        if (result.stderr) console.log(result.stderr.toString());
      } else {
        console.log(`Successfully added ${key}`);
      }
    }
  }
}
