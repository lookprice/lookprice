const fs = require('fs');
let content = fs.readFileSync('src/pages/StoreDashboard/index.tsx', 'utf8');

// Add dismissedWebSales state
if (!content.includes('const [dismissedWebSales, setDismissedWebSales] = useState(false);')) {
    content = content.replace('const [activeStaffRole, setActiveStaffRole] = useState<string>("admin");', 'const [activeStaffRole, setActiveStaffRole] = useState<string>("admin");\n  const [dismissedWebSales, setDismissedWebSales] = useState(false);');
    
    // Also modify the render condition
    content = content.replace('{notifications?.web_sales > 0 && (', '{!dismissedWebSales && notifications?.web_sales > 0 && (');
    
    // Modify onClick
    content = content.replace('onClick={() => setActiveTab("pos")}', 'onClick={() => { setActiveTab("pos"); setDismissedWebSales(true); }}');
    
    fs.writeFileSync('src/pages/StoreDashboard/index.tsx', content);
}
