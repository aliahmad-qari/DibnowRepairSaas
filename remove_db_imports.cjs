const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            const newLines = lines.filter(line => {
                if (line.includes('import') && line.includes('db') && line.includes('api/db')) {
                    return false;
                }
                return true;
            });
            if (lines.length !== newLines.length) {
                fs.writeFileSync(fullPath, newLines.join('\n'));
                console.log('Modified', fullPath);
            }
        }
    }
}

// Ensure the mock file is deleted
const mockFilePath = path.join(baseDir, 'api', 'db.ts');
if (fs.existsSync(mockFilePath)) {
    fs.unlinkSync(mockFilePath);
    console.log('Deleted api/db.ts');
}

processDir(path.join(baseDir, 'pages'));
processDir(path.join(baseDir, 'components'));
processDir(path.join(baseDir, 'api'));
