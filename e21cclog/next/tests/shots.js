// Where the tests write screenshots and reports: tests/out/, or OUT if set. Kept out of git.
const fs = require('fs'); const path = require('path');
const dir = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(dir, {recursive:true});
module.exports = name => path.join(dir, name);
