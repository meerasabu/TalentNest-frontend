import os
import glob
import re

components_dir = 'src/components'
files_to_check = glob.glob(os.path.join(components_dir, '**/*.jsx'), recursive=True)

header_new = '''<div className="header-actions">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="icon-wrapper" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div className="icon-wrapper notification-icon" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="notif-badge">2</span>
            </div>
          </div>'''

sidebar_new = '''<li className="nav-item">Messages</li>
              <li className="nav-item" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>Notifications</li>'''

for filepath in files_to_check:
    if any(x in filepath for x in ['Notifications.jsx', 'Login.jsx', 'Signup.jsx', 'Home.jsx']):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Replace header actions using regex
    # It matches `<div className="header-actions">...</div>`
    content = re.sub(r'<div className="header-actions">.*?</div>', header_new, content, flags=re.DOTALL)

    # Add Notifications to Sidebar
    if '<li className="nav-item">Messages</li>' in content and 'Notifications' not in content:
        content = content.replace('<li className="nav-item">Messages</li>', sidebar_new)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
