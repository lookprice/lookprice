const fs = require('fs');

let f = 'src/pages/ShopLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

let missingEn = `        } else if (item.id === 'shop_fleet_mgmt') {
          q = "How is the delivery fleet and vehicle inventory managed?";
          a = "You can manage the fuel, accident, and insurance tracking of your store's distribution and cargo vehicles from a single screen.";
        } else if (item.id === 'procurement_purchasing') {
          q = "How is end-to-end supply chain management done?";
          a = "You can record all stages of the products received from suppliers, from the ordering stage to invoicing.";
        } else if (item.id === 'multi_branch_retail_mgmt') {
          q = "How are multi-branch retail chains and inter-branch stock transfers managed?";
          a = "Add as many branches as you want. Manage product/personnel transfers between branches, measure performances on a branch basis.";
        } else if (item.id === 'foreign_currency_ledger_reconciliation') {
          q = "How does the Foreign Currency Ledger and Digital Reconciliation system work?";
          a = "Track current accounts and due payments indexed to the exchange rate. Complete digital reconciliations quickly with online approval links.";
        } else if (item.id === 'qr_price_checker_mobile') {
          q = "How does the in-store 'See Price' QR feature make life easier?";
          a = "Allow customers to scan the QR code on the product labels from their own phones and see instant prices easily.";
        } else if (item.id === 'e_commerce_integration_sanalpos') {
          q = "Which payment channels and Virtual POS are defined in our Corporate Website?";
          a = "Virtual POS systems like Iyzico and Paypal, plus Wire Transfer/EFT, Pay at Branch, and Pay at Door are integrated out-of-the-box.";`;

content = content.replace(
  "        } else if (item.id === 'expense_centers_tracking') {\n          q = \"Is there an analysis center where we can track all store expenses and costs?\";\n          a = \"Yes! You can process all your expenses (advertising, renovation, legal, cleaning) into income/expense items and perform profit and loss analyses.\";\n        }",
  "        } else if (item.id === 'expense_centers_tracking') {\n          q = \"Is there an analysis center where we can track all store expenses and costs?\";\n          a = \"Yes! You can process all your expenses (advertising, renovation, legal, cleaning) into income/expense items and perform profit and loss analyses.\";\n" + missingEn + "\n        }"
);

let missingEl = `        } else if (item.id === 'shop_fleet_mgmt') {
          q = "Πώς γίνεται η διαχείριση του στόλου παράδοσης και του αποθέματος οχημάτων;";
          a = "Μπορείτε να διαχειριστείτε την παρακολούθηση καυσίμων, ατυχημάτων και ασφάλισης των οχημάτων διανομής και φορτίου του καταστήματός σας από μία μόνο οθόνη.";
        } else if (item.id === 'procurement_purchasing') {
          q = "Πώς γίνεται η διαχείριση της αλυσίδας εφοδιασμού από άκρο σε άκρο;";
          a = "Καταγράψτε όλα τα στάδια των προϊόντων που λαμβάνονται από τους προμηθευτές, από το στάδιο της παραγγελίας έως την τιμολόγηση.";
        } else if (item.id === 'multi_branch_retail_mgmt') {
          q = "Πώς γίνεται η διαχείριση αλυσίδων λιανικής πολλών καταστημάτων και μεταφορών αποθεμάτων;";
          a = "Προσθέστε όσα υποκαταστήματα θέλετε. Διαχειριστείτε τις μεταφορές προϊόντων μεταξύ των υποκαταστημάτων και μετρήστε την απόδοση.";
        } else if (item.id === 'foreign_currency_ledger_reconciliation') {
          q = "Πώς λειτουργεί το σύστημα ψηφιακής συμφωνίας και καθολικού ξένου νομίσματος;";
          a = "Παρακολουθήστε τρεχούμενους λογαριασμούς και οφειλές σε συνάλλαγμα. Ολοκληρώστε τις ψηφιακές συμφωνίες γρήγορα με συνδέσμους έγκρισης.";
        } else if (item.id === 'qr_price_checker_mobile') {
          q = "Πώς διευκολύνει η λειτουργία QR 'Δείτε Τιμή' στο κατάστημα;";
          a = "Επιτρέψτε στους πελάτες να σαρώσουν τον κωδικό QR στις ετικέτες των προϊόντων από τα δικά τους τηλέφωνα και να δουν άμεσα τις τιμές.";
        } else if (item.id === 'e_commerce_integration_sanalpos') {
          q = "Ποια κανάλια πληρωμής και εικονικά POS ορίζονται στον Εταιρικό Ιστότοπό μας;";
          a = "Εικονικά συστήματα POS όπως Iyzico και Paypal, καθώς και τραπεζική μεταφορά, πληρωμή στο κατάστημα και αντικαταβολή είναι ενσωματωμένα.";`;

content = content.replace(
  "        } else if (item.id === 'expense_centers_tracking') {\n          q = \"Υπάρχει κέντρο ανάλυσης όπου μπορούμε να παρακολουθούμε όλα τα έξοδα και το κόστος του καταστήματος;\";\n          a = \"Ναι! Μπορείτε να επεξεργαστείτε όλα τα έξοδά σας σε στοιχεία εσόδων/εξόδων και να εκτελέσετε αναλύσεις κερδών και ζημιών.\";\n        }",
  "        } else if (item.id === 'expense_centers_tracking') {\n          q = \"Υπάρχει κέντρο ανάλυσης όπου μπορούμε να παρακολουθούμε όλα τα έξοδα και το κόστος του καταστήματος;\";\n          a = \"Ναι! Μπορείτε να επεξεργαστείτε όλα τα έξοδά σας σε στοιχεία εσόδων/εξόδων και να εκτελέσετε αναλύσεις κερδών και ζημιών.\";\n" + missingEl + "\n        }"
);

fs.writeFileSync(f, content);
console.log("ShopLanding FAQs fixed");
