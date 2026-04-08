
import express from 'express';
import cors from 'cors';
import net from 'net';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 6400;

app.post('/pos/sale', (req, res) => {
  const { amount, ip, port, brand } = req.body;
  console.log(`[POS] ${brand} (${ip}:${port}) üzerinden ${amount} tutarında işlem başlatılıyor...`);

  // Burada gerçek TCP iletişimi kurulur
  // Örnek Verifone/Ingenico TCP soket bağlantısı:
  /*
  const client = new net.Socket();
  client.connect(port, ip, () => {
    // Protokole uygun mesajı gönder
    client.write('SALE_COMMAND_HERE');
  });
  client.on('data', (data) => {
    res.json({ status: 'approved', message: 'İşlem Başarılı' });
    client.destroy();
  });
  */

  // Simülasyon (Gerçek cihaz bağlıysa yukarıdaki blok aktif edilmelidir)
  setTimeout(() => {
    res.json({ status: 'approved', message: 'İşlem Başarılı' });
  }, 5000);
});

app.listen(PORT, () => {
  console.log(`LookPrice POS Bridge ${PORT} portunda çalışıyor...`);
  console.log(`Lütfen bu pencereyi kapatmayın.`);
});
