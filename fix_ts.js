const fs = require('fs');

function replaceFile(path, searchRegex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(searchRegex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/modules/attendance-engine/types.ts', 
  /FACE_NOT_REGISTERED: "FACE_NOT_REGISTERED",/, 
  'FACE_NOT_REGISTERED: "FACE_NOT_REGISTERED",\n  REJECTED_TENANT: "REJECTED_TENANT",');

replaceFile('src/lib/auth.ts', 
  /return new NextResponse\(JSON\.stringify\(\{ error: "Unauthorized" \}\), \{\n\s*status: "401",\n\s*headers: \{ "Content-Type": "application\/json" \}\n\s*\}\);/g, 
  'return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });');

replaceFile('src/lib/auth.ts', 
  /return new NextResponse\(JSON\.stringify\(\{ error: "Forbidden" \}\), \{\n\s*status: "403",\n\s*headers: \{ "Content-Type": "application\/json" \}\n\s*\}\);/g, 
  'return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });');

replaceFile('src/modules/attendance-engine/services/offline-sync.service.ts', 
  /catch \(err: any\) \{/g, 
  'catch (err: unknown) {');

replaceFile('src/modules/attendance-engine/stages/persist-stage.ts', 
  /const existingLog = \{\} as any;/g, 
  'const existingLog = {} as Partial<typeof attendanceLogs.$inferSelect>;');

replaceFile('src/modules/payroll/engine/payroll-engine.ts', 
  /as { amount: string }\[\]/g, 
  'as { amount: string }[]');

replaceFile('src/hooks/useFaceRecognition.ts', 
  /catch \(err: any\) \{/g, 
  'catch (err: unknown) {');
