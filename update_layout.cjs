const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Regex to capture the header-actions block flexibly
const headerRegex = /<div\s+className="header-actions">[\s\S]*?<span\s+className="icon-btn\s+notification"[\s\S]*?<\/span>\s*<\/div>/g;

// Regex to find the Messages list item
const sidebarRegex = /<li\s+className="nav-item">Messages<\/li>/g;

const newHeader = `<div className="header-actions">
            <span className="icon-btn" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', marginRight: '8px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </span>
            <span className="icon-btn" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', marginRight: '8px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </span>
            <span className="icon-btn notification" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative', color: '#64748b'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#4f46e5', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>2</span>
            </span>
          </div>`;

const newSidebar = `<li className="nav-item">Messages</li>
              <li className="nav-item" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>Notifications</li>`;

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    if (headerRegex.test(content)) {
      content = content.replace(headerRegex, newHeader);
      modified = true;
    }
    
    if (sidebarRegex.test(content)) {
      content = content.replace(sidebarRegex, newSidebar);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Modified: ' + filePath);
    }
  }
});
