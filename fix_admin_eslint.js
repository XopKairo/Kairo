const fs = require('fs');

let interests = fs.readFileSync('admin/src/pages/Interests.tsx', 'utf8');
interests = interests.replace(/catch \(e: any\)/g, 'catch (e: unknown)');
interests = interests.replace(/e\.response\?\.data\?\.message/g, '(e as any).response?.data?.message');
fs.writeFileSync('admin/src/pages/Interests.tsx', interests);

let verif = fs.readFileSync('admin/src/pages/VerificationRequests.tsx', 'utf8');
verif = verif.replace(/setRequests\(\(prev: any\)/g, 'setRequests((prev: VerificationRequest[])');
fs.writeFileSync('admin/src/pages/VerificationRequests.tsx', verif);
