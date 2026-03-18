const fs = require('fs');
let code = fs.readFileSync('backend-mongo/controllers/userAuthController.js', 'utf8');
code = code.replace('import User from "../models/User.js";', 'import User from "../models/User.js";\nimport calculateBadge from "../utils/badgeSystem.js";');
code = code.replace('import calculateBadge from "../utils/badgeSystem.js";\n\nclass UserAuthController {', 'class UserAuthController {');
// Remove the misplaced import inside the function
code = code.replace('import calculateBadge from "../utils/badgeSystem.js";', '');
fs.writeFileSync('backend-mongo/controllers/userAuthController.js', code);
