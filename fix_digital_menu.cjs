const fs = require('fs');

let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("QR kod okunamadıysa veya listede olmayan özel bir masa ise aşağıya manuel olarak masa numarası veya adını yazıp onaylayabilirsiniz.", "{t('QR kod okunamadıysa veya listede olmayan özel bir masa ise aşağıya manuel olarak masa numarası veya adını yazıp onaylayabilirsiniz.', 'If the QR code cannot be read or it is a special table not on the list, you can manually type the table number or name below and confirm.', 'Εάν ο κωδικός QR δεν μπορεί να διαβαστεί ή πρόκειται για ειδικό τραπέζι εκτός λίστας, μπορείτε να πληκτρολογήσετε χειροκίνητα τον αριθμό ή το όνομα του τραπεζιού παρακάτω και να επιβεβαιώσετε.')}");

fs.writeFileSync(f, content);
