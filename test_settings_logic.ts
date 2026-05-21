const settings = {
  password: 'Yapk1489',
  provider: 'mysoft',
  username: 'serdar@gapbilisim.net',
  api_token: 'tPerKc0mwsJ3rLgEDbsryamXB3DRkesZHsqiyt8F7pfHoYcUtW',
  is_active: true,
  tenant_id: '210',
  sender_alias: 'urn:mail:faturagb@serdarerdekli.com',
  earchive_uuid: '76fcb52f-5278-49bd-a0f6-932bf1267ee4',
  receiver_alias: 'urn:mail:faturapk@serdarerdekli.com',
  earchive_prefix: 'GEA',
  einvoice_prefix: 'GEF',
  earchive_username: 'gapbilisim'
};

try {
    if (!settings || !settings.is_active) {
        console.log("NOT ACTIVE");
    } else {
        console.log("ACTIVE");
    }
} catch (e) {
    console.error(e);
}
