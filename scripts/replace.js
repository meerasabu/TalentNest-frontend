const fs = require('fs');

async function fix() {
  const files = [
    'src/components/CreateListing/CreateListing.jsx',
    'src/components/Dashboard/Index.jsx',
    'src/components/Marketplace/Marketplace.jsx',
    'src/components/Orders/Orders.jsx',
    'src/components/ProductDetails/ProductDetails.jsx',
    'src/components/Services/Services.jsx',
    'src/components/SkillExchange/SkillExchange.jsx'
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace avatar
    let avatarSearch = '<img src="https://placehold.co/40x40" alt="Profile" className="user-avatar" />';
    let avatarReplace = '<img src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : "https://placehold.co/40x40"} alt="Profile" className="user-avatar" />';
    if (content.includes(avatarSearch)) {
       content = content.replace(avatarSearch, avatarReplace);
    }
    
    // Replace explicit $ instances
    // Only replacing cases like "$150", left unchanged things like "${", "$(" etc.
    content = content.replace(/\$([0-9]+(\.[0-9]{1,2})?|\b)/g, (match, p1) => {
        // Just checking if we matched something that is not part of string interpolation
        if (p1 === '' || isNaN(parseFloat(p1))) {
            return match; // return it untouched if it's not a real price (or just simple $) 
        }
        return '₹' + p1;
    });

    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
}
fix();
