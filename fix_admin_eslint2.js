const fs = require('fs');

let dash = fs.readFileSync('admin/src/pages/Dashboard.tsx', 'utf8');
dash = dash.replace(
`  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchLiveCalls, 10000); 
    return () => clearInterval(interval);
  }, []);`,
`  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchLiveCalls, 10000); 
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);`
);
fs.writeFileSync('admin/src/pages/Dashboard.tsx', dash);

let interests = fs.readFileSync('admin/src/pages/Interests.tsx', 'utf8');
interests = interests.replace(/catch \(e: unknown\)/g, 'catch (e: Error | unknown)');
interests = interests.replace(/\(e as any\)\.response\?\./g, '((e as { response?: { data?: { message?: string } } }).response)?.');
fs.writeFileSync('admin/src/pages/Interests.tsx', interests);

let verif = fs.readFileSync('admin/src/pages/VerificationRequests.tsx', 'utf8');
verif = verif.replace(/catch \(e: any\)/g, 'catch (e: Error | unknown)');
verif = verif.replace(/e\.response\?\.data\?\.message/g, '((e as { response?: { data?: { message?: string } } }).response)?.data?.message');
fs.writeFileSync('admin/src/pages/VerificationRequests.tsx', verif);
