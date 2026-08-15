const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) { 
      results.push(file);
    }
  });
  return results;
}
const files = walk('src/app/api/payroll');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ getSession \} from "@\/lib\/auth";/g, 'import { requireTenantContext } from "@/lib/auth";');
  
  content = content.replace(/const user = await getSession\(\);\s*if \(\!user\) return NextResponse\.json\(\{ error: \{ code: "UNAUTHORIZED", message: "Unauthorized" \} \}, \{ status: 401 \}\);/g, 'const user = await requireTenantContext();');
  
  content = content.replace(/user\.organizationId\!/g, 'user.organizationId');
  
  content = content.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
  
  fs.writeFileSync(f, content);
});
