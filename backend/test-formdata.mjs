import fs from 'fs';

async function test() {
  const formData = new FormData();
  const buffer = fs.readFileSync('package.json');
  formData.append('file', new Blob([buffer], { type: 'application/json' }), 'package.json');
  console.log('FormData ready');
}
test();
