const fs = require('fs');

let f = 'src/pages/REstateLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

let missingEn = `        } else if (item.id === 'multi_branch_crm_restate') {
          q = "Is there support for multi-branch and agent authorization?";
          a = "Yes! Add unlimited branches and staff, manage inventory transfers, and track branch metrics.";
        } else if (item.id === 'google_cloud_backup_restate') {
          q = "Can we backup all our data securely?";
          a = "Yes! All system data, images, and contracts can be securely backed up to corporate Google Cloud servers with one click.";
        } else if (item.id === 'seo_meta_integration_restate') {
          q = "Can SEO compliance and Google / Meta Ad pixel codes be added?";
          a = "Yes! Our SEO-compliant codebase ensures you rank high in Google searches. Add your Google Analytics and Meta Pixel codes in seconds.";
        } else if (item.id === 'realtime_analytics_restate') {
          q = "Is there a real-time analytics and charts dashboard?";
          a = "Yes! Top-selling regions, average selling times, and financial statements are instantly shown with sleek interactive charts.";
        } else if (item.id === 'radar_news_restate') {
          q = "Is there a radar system to track real estate news and opportunities?";
          a = "Yes! With the Radar Tracking System, you can instantly catch current sector news and opportunity listings.";
        } else if (item.id === 'currency_credit_audit_restate') {
          q = "Are automatic exchange rates, loan calculation, and user transaction audits included?";
          a = "Yes! With professional tools such as automatic exchange rate system, real-time financial loan calculation engine, and security audit logs.";`;

content = content.replace(
  "        } else if (item.id === 'ledger_accounts_restate') {\n          q = \"Can we track maturities and ledger accounts for term or installment sales?\";\n          a = \"Yes! Open ledgers for term sales or lease agreements to track payments, dues, and remaining balances, and export ledger statements easily.\";\n        }",
  "        } else if (item.id === 'ledger_accounts_restate') {\n          q = \"Can we track maturities and ledger accounts for term or installment sales?\";\n          a = \"Yes! Open ledgers for term sales or lease agreements to track payments, dues, and remaining balances, and export ledger statements easily.\";\n" + missingEn + "\n        }"
);

let missingEl = `        } else if (item.id === 'multi_branch_crm_restate') {
          q = "Υπάρχει υποστήριξη για πολλαπλά υποκαταστήματα και εξουσιοδότηση αντιπροσώπων;";
          a = "Ναι! Προσθέστε απεριόριστα υποκαταστήματα και προσωπικό, διαχειριστείτε μεταφορές αποθεμάτων και παρακολουθήστε μετρήσεις υποκαταστημάτων.";
        } else if (item.id === 'google_cloud_backup_restate') {
          q = "Μπορούμε να δημιουργήσουμε αντίγραφα ασφαλείας όλων των δεδομένων μας με ασφάλεια;";
          a = "Ναι! Όλα τα δεδομένα του συστήματος, οι εικόνες και τα συμβόλαια μπορούν να δημιουργηθούν με ασφάλεια αντίγραφα ασφαλείας στους διακομιστές Google Cloud με ένα κλικ.";
        } else if (item.id === 'seo_meta_integration_restate') {
          q = "Μπορεί να προστεθεί συμμόρφωση SEO και κώδικες pixel Google / Meta Ad;";
          a = "Ναι! Προσθέστε τους κωδικούς Google Analytics και Meta Pixel σε δευτερόλεπτα για να βελτιστοποιήσετε τις καμπάνιες μάρκετινγκ.";
        } else if (item.id === 'realtime_analytics_restate') {
          q = "Υπάρχει πίνακας ελέγχου αναλύσεων και γραφημάτων σε πραγματικό χρόνο;";
          a = "Ναι! Οι περιοχές με τις περισσότερες πωλήσεις, οι μέσοι χρόνοι πώλησης και οι οικονομικές καταστάσεις εμφανίζονται αμέσως με κομψά διαδραστικά γραφήματα.";
        } else if (item.id === 'radar_news_restate') {
          q = "Υπάρχει σύστημα ραντάρ για την παρακολούθηση ειδήσεων και ευκαιριών ακινήτων;";
          a = "Ναι! Με το Σύστημα Παρακολούθησης Ραντάρ, μπορείτε να καταγράψετε άμεσα τα τρέχοντα νέα του τομέα και τις λίστες ευκαιριών.";
        } else if (item.id === 'currency_credit_audit_restate') {
          q = "Περιλαμβάνονται αυτόματες συναλλαγματικές ισοτιμίες, υπολογισμός δανείου και έλεγχοι συναλλαγών χρηστών;";
          a = "Ναι! Το μεσιτικό σας γραφείο βρίσκεται υπό πλήρη έλεγχο με εργαλεία όπως ο αυτόματος συγχρονισμός συναλλαγματικών ισοτιμιών και τα αρχεία ελέγχου.";`;

content = content.replace(
  "        } else if (item.id === 'ledger_accounts_restate') {\n          q = \"Μπορούμε να παρακολουθούμε λήξεις και καθολικά για πωλήσεις με δόσεις;\";\n          a = \"Ναι! Ανοίξτε καθολικά για πωλήσεις ή μισθώσεις για να παρακολουθείτε πληρωμές, οφειλές και υπόλοιπα και εξάγετε καταστάσεις εύκολα.\";\n        }",
  "        } else if (item.id === 'ledger_accounts_restate') {\n          q = \"Μπορούμε να παρακολουθούμε λήξεις και καθολικά για πωλήσεις με δόσεις;\";\n          a = \"Ναι! Ανοίξτε καθολικά για πωλήσεις ή μισθώσεις για να παρακολουθείτε πληρωμές, οφειλές και υπόλοιπα και εξάγετε καταστάσεις εύκολα.\";\n" + missingEl + "\n        }"
);

fs.writeFileSync(f, content);
console.log("REstateLanding FAQs fixed");
