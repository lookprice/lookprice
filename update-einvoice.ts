import fs from 'fs';

let content = fs.readFileSync('/routes/einvoice.ts', 'utf8');

content = content.replace(
  /taxExemptionReason: KDV_EXEMPTION_MAP\[exemptionCode \|\| "301"\] \|\| "301-11\/1-a Mal İhracatı"/g,
  'taxExemptionReason: exemptionReasonText'
);
content = content.replace(
  /TaxExemptionReason: KDV_EXEMPTION_MAP\[exemptionCode \|\| "301"\] \|\| "301-11\/1-a Mal İhracatı"/g,
  'TaxExemptionReason: exemptionReasonText'
);
content = content.replace(
  /exemptionReason: KDV_EXEMPTION_MAP\[exemptionCode \|\| "301"\] \|\| "301-11\/1-a Mal İhracatı"/g,
  'exemptionReason: exemptionReasonText'
);
content = content.replace(
  /taxExemptionReasonCode: exemptionCode \|\| "301"/g,
  'taxExemptionReasonCode: exemptionCode'
);
content = content.replace(
  /TaxExemptionReasonCode: exemptionCode \|\| "301"/g,
  'TaxExemptionReasonCode: exemptionCode'
);
content = content.replace(
  /exemptionReasonCode: exemptionCode \|\| "301"/g,
  'exemptionReasonCode: exemptionCode'
);

fs.writeFileSync('/routes/einvoice.ts', content, 'utf8');
console.log('Successfully updated /routes/einvoice.ts');
