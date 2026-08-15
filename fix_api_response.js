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
  
  if (!content.includes('createApiResponse')) {
    content = content.replace(/import \{ NextResponse \} from "next\/server";/, 'import { NextResponse } from "next/server";\nimport { createApiResponse } from "@/lib/api-response";');
  }

  // Replace error returns
  content = content.replace(/return NextResponse\.json\(\{\s*error:\s*\{\s*code:\s*"FORBIDDEN",\s*message:\s*"Forbidden"\s*\}\s*\}, \s*\{\s*status:\s*403\s*\}\);/g, 'return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });');
  content = content.replace(/return NextResponse\.json\(\{\s*error:\s*\{\s*code:\s*err\.code,\s*message:\s*err\.message\s*\}\s*\}, \s*\{\s*status:\s*err\.statusCode\s*\}\);/g, 'return createApiResponse({ success: false, message: err.message, status: err.statusCode, errors: { code: err.code } });');
  content = content.replace(/return NextResponse\.json\(\{\s*error:\s*\{\s*code:\s*"INTERNAL_ERROR",\s*message:\s*"Internal server error"\s*\}\s*\}, \s*\{\s*status:\s*500\s*\}\);/g, 'return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });');
  content = content.replace(/return NextResponse\.json\(\{\s*error:\s*\{\s*code:\s*"UNAUTHORIZED",\s*message:\s*"Unauthorized"\s*\}\s*\}, \s*\{\s*status:\s*401\s*\}\);/g, 'return createApiResponse({ success: false, message: "Unauthorized", status: 401, errors: { code: "UNAUTHORIZED" } });');
  
  content = content.replace(/return NextResponse\.json\(\{\s*error:\s*\{\s*code:\s*"VALIDATION_ERROR",\s*message:\s*"Invalid data",\s*details:\s*result\.error\s*\}\s*\}, \s*\{\s*status:\s*400\s*\}\);/g, 'return createApiResponse({ success: false, message: "Invalid data", status: 400, errors: { code: "VALIDATION_ERROR", details: result.error } });');

  // Replace successful returns
  content = content.replace(/return NextResponse\.json\(\{\s*data:\s*([\w]+)\s*\}\);/g, 'return createApiResponse({ success: true, message: "Success", data: $1 });');
  
  fs.writeFileSync(f, content);
});
