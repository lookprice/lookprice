import { runStartupSystemGuards, verifyCriticalSystemInvariants } from "../src/services/backend/systemGuardService";

async function main() {
  console.log("==========================================================");
  console.log("🛡️  LOOKPRICE / ENRAKİPSİZ KRİTİK AKIŞ DOĞRULAMA KALKANI");
  console.log("==========================================================");

  await runStartupSystemGuards();
  const report = await verifyCriticalSystemInvariants();

  for (const check of report.checks) {
    const icon = check.passed ? "✅ [BAŞARILI]" : "❌ [HATA]";
    console.log(`${icon} ${check.name}: ${check.details}`);
  }

  console.log("----------------------------------------------------------");
  if (!report.healthy) {
    console.error("🚨 KRİTİK REGRESYON TESPİT EDİLDİ! İşlem durduruldu.");
    process.exit(1);
  }

  console.log("🎯 TÜM KRİTİK KONTROLLER (İyzico, Sepet, Alt Kategori Zorunlu Alan İzolasyonu, Veritabanı Hijyeni) BAŞARIYLA GEÇTİ.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Kritik akış doğrulama hatası:", err);
  process.exit(1);
});
