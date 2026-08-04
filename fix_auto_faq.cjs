const fs = require('fs');

let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// For EN missing
let missingEn = `        } else if (item.id === 'radar_news_tracking') {
          q = "Is there a radar system to track sector developments and vehicle listings?";
          a = "Yes. You can instantly catch current market news and opportunity listings with the smart Radar Tracking System that continuously scans the internet for keywords you specify.";
        } else if (item.id === 'currency_credit_audit') {
          q = "Are real-time exchange rates, loan calculation, and user transaction audits included?";
          a = "Yes. You keep your gallery under full control with professional tools like daily automatic exchange rate synchronization, map directions, loan calculation engine, and Audit Logs.";`;

content = content.replace(
  "        } else if (item.id === 'realtime_analytics_dashboard') {\n          q = \"Is there a real-time analytics and charts dashboard?\";\n          a = \"Yes! Top-selling vehicle segments, average selling times, branch revenues, and financial statements are instantly shown with sleek interactive charts.\";\n        }",
  "        } else if (item.id === 'realtime_analytics_dashboard') {\n          q = \"Is there a real-time analytics and charts dashboard?\";\n          a = \"Yes! Top-selling vehicle segments, average selling times, branch revenues, and financial statements are instantly shown with sleek interactive charts.\";\n" + missingEn + "\n        }"
);

// For EL missing
let missingEl = `        } else if (item.id === 'radar_news_tracking') {
          q = "Υπάρχει σύστημα ραντάρ για την παρακολούθηση των εξελίξεων του τομέα και των αγγελιών οχημάτων;";
          a = "Ναι. Μπορείτε να παρακολουθείτε άμεσα τα τρέχοντα νέα της αγοράς και τις ευκαιρίες με το έξυπνο σύστημα παρακολούθησης ραντάρ που σαρώνει συνεχώς το διαδίκτυο.";
        } else if (item.id === 'currency_credit_audit') {
          q = "Περιλαμβάνονται συναλλαγματικές ισοτιμίες σε πραγματικό χρόνο, υπολογισμός δανείου και έλεγχοι συναλλαγών χρηστών;";
          a = "Ναι. Διατηρείτε τη γκαλερί σας υπό πλήρη έλεγχο με επαγγελματικά εργαλεία όπως ο καθημερινός αυτόματος συγχρονισμός συναλλαγματικών ισοτιμιών και τα αρχεία καταγραφής ελέγχου.";`;

content = content.replace(
  "        } else if (item.id === 'realtime_analytics_dashboard') {\n          q = \"Υπάρχει πίνακας ελέγχου αναλύσεων και γραφημάτων σε πραγματικό χρόνο;\";\n          a = \"Ναι! Τα τμήματα οχημάτων με τις περισσότερες πωλήσεις, οι μέσοι χρόνοι πώλησης, τα έσοδα υποκαταστημάτων και οι οικονομικές καταστάσεις εμφανίζονται αμέσως με κομψά διαδραστικά γραφήματα.\";\n        }",
  "        } else if (item.id === 'realtime_analytics_dashboard') {\n          q = \"Υπάρχει πίνακας ελέγχου αναλύσεων και γραφημάτων σε πραγματικό χρόνο;\";\n          a = \"Ναι! Τα τμήματα οχημάτων με τις περισσότερες πωλήσεις, οι μέσοι χρόνοι πώλησης, τα έσοδα υποκαταστημάτων και οι οικονομικές καταστάσεις εμφανίζονται αμέσως με κομψά διαδραστικά γραφήματα.\";\n" + missingEl + "\n        }"
);

fs.writeFileSync(f, content);
console.log("AutoLanding FAQs fixed");
