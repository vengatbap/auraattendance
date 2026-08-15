const fs = require('fs');

let f1 = 'src/modules/attendance-engine/repository/attendance-engine.repository.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/logOperation\?: \(\) => Promise<any>/g, 'logOperation?: () => Promise<unknown>');
fs.writeFileSync(f1, c1);

let f2 = 'src/modules/attendance-engine/stages/tenant-stage.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/context\.flags\.push\("REJECTED_TENANT" as any\);/g, 'context.flags.push("REJECTED_TENANT");');
fs.writeFileSync(f2, c2);

let f3 = 'src/modules/attendance-engine/__tests__/attendance-engine.test.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/"REJECTED_TENANT" as any/g, '"REJECTED_TENANT"');
fs.writeFileSync(f3, c3);

let f4 = 'src/modules/leave/repository/leave-balance.repository.ts';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/dbClient: any,/g, 'dbClient: Parameters<Parameters<typeof db.transaction>[0]>[0],');
fs.writeFileSync(f4, c4);

let f5 = 'src/modules/leave/repository/leave-request.repository.ts';
let c5 = fs.readFileSync(f5, 'utf8');
c5 = c5.replace(/dbClient: any,/g, 'dbClient: Parameters<Parameters<typeof db.transaction>[0]>[0],');
fs.writeFileSync(f5, c5);
