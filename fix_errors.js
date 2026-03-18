const fs = require('fs');

// 1. HomeScreen.js
let home = fs.readFileSync('mobile-app/src/screens/home/HomeScreen.js', 'utf8');
if(!home.includes('import socketService')) {
  home = home.replace("import api, { BASE_URL } from '../../services/api';", "import api, { BASE_URL } from '../../services/api';\nimport socketService from '../../services/socketService';");
}
// Fix empty blocks
home = home.replace(/catch \(error\) {\n    } finally {/g, 'catch (error) { console.error(error); } finally {');
home = home.replace(/catch \(e\) {}/g, 'catch (e) { console.error(e); }');
fs.writeFileSync('mobile-app/src/screens/home/HomeScreen.js', home);

// 2. AuthContext.js
let auth = fs.readFileSync('mobile-app/src/context/AuthContext.js', 'utf8');
auth = auth.replace(/catch \(error\) {\n      \n    }/g, 'catch (error) { console.error(error); }');
fs.writeFileSync('mobile-app/src/context/AuthContext.js', auth);

// 3. EditProfileScreen.js
let edit = fs.readFileSync('mobile-app/src/screens/profile/EditProfileScreen.js', 'utf8');
edit = edit.replace(/catch \(error\) {}/g, 'catch (error) { console.error(error); }');
fs.writeFileSync('mobile-app/src/screens/profile/EditProfileScreen.js', edit);

// 4. VerificationScreen.js
let verif = fs.readFileSync('mobile-app/src/screens/profile/VerificationScreen.js', 'utf8');
verif = verif.replace(/justifyContent: 'center', justifyContent: 'center'/g, "justifyContent: 'center'");
fs.writeFileSync('mobile-app/src/screens/profile/VerificationScreen.js', verif);

