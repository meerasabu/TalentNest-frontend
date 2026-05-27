import os
import re

header_regex = re.compile(r'<header className="main-header">[\s\S]*?</header>', re.MULTILINE)
header_replacement = '<Header user={user} />'
import_statement = "import Header from '../Common/Header';\n"

directory = 'a:/SDC-Internship/TalentNest/frontend/src/components'

files_to_check = [
    'Dashboard/Index.jsx',
    'Marketplace/Marketplace.jsx',
    'SkillExchange/SkillExchange.jsx',
    'Services/Services.jsx',
    'SkillDetails/SkillDetails.jsx',
    'ServiceDetails/ServiceDetails.jsx',
    'ProductDetails/ProductDetails.jsx',
    'Notifications/Notifications.jsx',
    'EditProfile/EditProfile.jsx',
    'CreateListing/CreateListing.jsx',
    'Orders/Orders.jsx'
]

for filename in files_to_check:
    filepath = os.path.join(directory, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if header_regex.search(content):
            # Replace header
            new_content = header_regex.sub(header_replacement, content)
            
            # Add import if not present
            if "import Header from" not in new_content:
                # find last import
                last_import_idx = -1
                lines = new_content.split('\n')
                for i in range(len(lines) - 1, -1, -1):
                    if lines[i].startswith('import '):
                        last_import_idx = i
                        break
                
                if last_import_idx != -1:
                    lines.insert(last_import_idx + 1, import_statement.strip())
                    new_content = '\n'.join(lines)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"Header not found in {filename}")
    else:
        print(f"File not found: {filename}")
