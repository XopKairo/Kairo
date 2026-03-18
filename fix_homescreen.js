const fs = require('fs');
let code = fs.readFileSync('mobile-app/src/screens/home/HomeScreen.js', 'utf8');
code = code.replace(/catch \(error\) {\n    } finally {/g, 'catch (error) { console.error(error); } finally {');
code = code.replace(/catch \(e\) {}/g, 'catch (e) { console.error(e); }');
fs.writeFileSync('mobile-app/src/screens/home/HomeScreen.js', code);
