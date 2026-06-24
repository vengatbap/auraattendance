const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Rename dashboard to (dashboard)
const dashboardDir = path.join(srcDir, 'app', 'dashboard');
const targetDir = path.join(srcDir, 'app', '(dashboard)');
if (fs.existsSync(dashboardDir)) {
    fs.renameSync(dashboardDir, targetDir);
    console.log('Renamed dashboard to (dashboard)');
}

// 2. Replace "/dashboard" with "" in tsx/ts files
function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            const regex = /["'`]\/dashboard(.*?)["'`]/g;
            const newContent = content.replace(regex, (match, p1) => {
                modified = true;
                const quoteMarker = match[0];
                const rest = p1 || '';
                return `${quoteMarker}/${rest.replace(/^\//, '')}${quoteMarker}`.replace(/\/\/+/, '/'); 
                // e.g. "/dashboard/employees" -> "/employees"
                // "/dashboard" -> "/"
            });
            
            // Also need to handle redirect("/dashboard...")
            
            if (modified && content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Updated links in:', fullPath);
            }
        }
    }
}
replaceInFiles(srcDir);
