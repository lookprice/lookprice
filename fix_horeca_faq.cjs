const fs = require('fs');

let f = 'src/pages/HoReCaLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

let missingEn = `        } else if (item.id === 'stock_alarms') {
          q = "Is there a critical stock warning system?";
          a = "Yes! You can set critical alarm levels for your inventory and get notified instantly when stocks run low.";
        } else if (item.id === 'table_management') {
          q = "Can we customize the table layout plan?";
          a = "Yes. You can customize the interactive table map, track occupancies with color codes, and merge/transfer tables via drag-and-drop.";
        } else if (item.id === 'speed_and_security') {
          q = "How fast is the infrastructure and how secure is our data?";
          a = "Built on an ultra-fast database, orders are sent in milliseconds. Data is protected with SSL encryption and real-time cloud backups.";
        } else if (item.id === 'qr_table_bell') {
          q = "Does the QR code system have a waiter call or bill request feature?";
          a = "Yes. Customers can tap 'Call Waiter', 'Request Bill', or 'Help', which sends instant notifications to the waiter's smart watch or terminal.";
        } else if (item.id === 'auto_service_fees') {
          q = "Can service fees, cover charge, and tips be added automatically?";
          a = "In Development: We are developing a module to automatically add cover charges, tips, or percentage service fees to orders.";`;

content = content.replace(
  "        } else if (item.id === 'supply_chain_planning') {\n          q = \"Is there a system to track purchases and supplier invoices?\";\n          a = \"Yes! You can record supplier information, purchase invoices, and material inputs, and monitor your costs in detail.\";\n        }",
  "        } else if (item.id === 'supply_chain_planning') {\n          q = \"Is there a system to track purchases and supplier invoices?\";\n          a = \"Yes! You can record supplier information, purchase invoices, and material inputs, and monitor your costs in detail.\";\n" + missingEn + "\n        }"
);

let missingEl = `        } else if (item.id === 'stock_alarms') {
          q = "Υπάρχει προειδοποιητικό σύστημα κρίσιμου αποθέματος;";
          a = "Ναι! Μπορείτε να ορίσετε επίπεδα συναγερμού για το απόθεμά σας και να ειδοποιηθείτε άμεσα όταν τα αποθέματα εξαντλούνται.";
        } else if (item.id === 'table_management') {
          q = "Μπορούμε να προσαρμόσουμε το σχέδιο διάταξης τραπεζιών;";
          a = "Ναι. Μπορείτε να προσαρμόσετε τον διαδραστικό χάρτη, να παρακολουθήσετε πληρότητες με χρωματικούς κωδικούς και να συγχωνεύσετε τραπέζια με drag-and-drop.";
        } else if (item.id === 'speed_and_security') {
          q = "Πόσο γρήγορη είναι η υποδομή και πόσο ασφαλή είναι τα δεδομένα μας;";
          a = "Κατασκευασμένο σε μια εξαιρετικά γρήγορη βάση δεδομένων, οι παραγγελίες αποστέλλονται σε χιλιοστά του δευτερολέπτου. Τα δεδομένα προστατεύονται με κρυπτογράφηση SSL.";
        } else if (item.id === 'qr_table_bell') {
          q = "Το σύστημα κωδικών QR διαθέτει κλήση σερβιτόρου ή αίτημα λογαριασμού;";
          a = "Ναι. Οι πελάτες μπορούν να πατήσουν 'Κλήση σερβιτόρου' ή 'Αίτημα λογαριασμού', το οποίο στέλνει άμεσες ειδοποιήσεις στο ρολόι ή το τερματικό του σερβιτόρου.";
        } else if (item.id === 'auto_service_fees') {
          q = "Μπορούν να προστεθούν αυτόματα χρεώσεις εξυπηρέτησης, κουβέρ και φιλοδωρήματα;";
          a = "Σε ανάπτυξη: Αναπτύσσουμε μια ενότητα για αυτόματη προσθήκη χρεώσεων κουβέρ, φιλοδωρημάτων ή ποσοστιαίων χρεώσεων εξυπηρέτησης στις παραγγελίες.";`;

content = content.replace(
  "        } else if (item.id === 'supply_chain_planning') {\n          q = \"Υπάρχει σύστημα παρακολούθησης αγορών και τιμολογίων προμηθευτών;\";\n          a = \"Ναι! Μπορείτε να καταγράψετε πληροφορίες προμηθευτών, τιμολόγια αγοράς και εισροές υλικών και να παρακολουθήσετε το κόστος σας.\";\n        }",
  "        } else if (item.id === 'supply_chain_planning') {\n          q = \"Υπάρχει σύστημα παρακολούθησης αγορών και τιμολογίων προμηθευτών;\";\n          a = \"Ναι! Μπορείτε να καταγράψετε πληροφορίες προμηθευτών, τιμολόγια αγοράς και εισροές υλικών και να παρακολουθήσετε το κόστος σας.\";\n" + missingEl + "\n        }"
);

fs.writeFileSync(f, content);
console.log("HoReCaLanding FAQs fixed");
