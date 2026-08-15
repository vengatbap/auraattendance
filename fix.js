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
  content = content.replace(/import \{ requireAuth \} from "@\/lib\/auth";/g, 'import { getSession } from "@/lib/auth";');
  content = content.replace(/const user = await requireAuth\(\);/g, 'const user = await getSession();\n    if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });');
  content = content.replace(/result\.error\.errors/g, 'result.error');
  fs.writeFileSync(f, content);
});
