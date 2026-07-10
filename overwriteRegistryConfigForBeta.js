const { writeFileSync, existsSync } = require('fs');

const packagePath = './package.json';
if (!existsSync(packagePath)) {
  console.log('\tDoes not contain a package.json file\n'.underline.red);
  return;
}
let packageJson = require(packagePath);

if (packageJson['publishConfig']['registry']) {
  packageJson['publishConfig']['registry'] = 'https://packages.iniationware.com/api/packages/p4nr-nodejs-beta/npm/';

  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), { encoding: 'utf8', flag: 'w' });
}
