const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

const target = `              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                {"💡 " + txt("Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular.", "If the store name contains 'lookprice', the system automatically applies premium local business fallbacks.", "Εάν το όνομα του καταστήματος περιέχει 'lookprice', το σύστημα εφαρμόζει αυτόματα εναλλακτικές επιλογές κορυφαίων τοπικών επιχειρήσεων.")}
            </span>
          </div>
        </div>`;

const replacement = `              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                {txt("VİTRİN VE TASARIM", "SHOWCASE & DESIGN", "ΒΙΤΡΙΝΑ ΚΑΙ ΣΧΕΔΙΑΣΜΟΣ")}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { id: "announcement_bar", icon: <Tag className="w-4 h-4" />, label: txt("Duyuru Bandı", "Announcement Bar", "Γραμμή Ανακοινώσεων") },
                { id: "testimonials", icon: <Star className="w-4 h-4" />, label: txt("Müşteri Yorumları", "Testimonials", "Μαρτυρίες") },
                { id: "newsletter", icon: <Mail className="w-4 h-4" />, label: txt("Haber Bülteni", "Newsletter", "Newsletter") },
                { id: "live_activity", icon: <MessageCircle className="w-4 h-4" />, label: txt("Canlı Aktivite", "Live Activity", "Ζωντανή Δραστηριότητα") },
                { id: "featured_deals", icon: <Tag className="w-4 h-4" />, label: txt("Fiyatı Düşenler (Fırsat)", "Featured Deals", "Προσφορές") },
              ].map(toggle => (
                <label key={toggle.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={branding?.page_layout_settings?.[toggle.id] !== false}
                    onChange={(e) => {
                      const current = branding?.page_layout_settings || {};
                      onBrandingChange("page_layout_settings", { ...current, [toggle.id]: e.target.checked });
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                    {toggle.icon}
                    <span>{toggle.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {branding?.page_layout_settings?.announcement_bar !== false && (
              <div className="mb-6">
                <input
                  type="text"
                  value={branding?.page_layout_settings?.announcement_text || ""}
                  onChange={(e) => {
                    const current = branding?.page_layout_settings || {};
                    onBrandingChange("page_layout_settings", { ...current, announcement_text: e.target.value });
                  }}
                  placeholder={txt("Duyuru metnini buraya yazın...", "Enter announcement text here...", "Πληκτρολογήστε κείμενο ανακοίνωσης...")}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                />
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                {txt("TEMA KONSEPTİ", "THEME CONCEPT", "ΚΟΝΣΕΠΤ ΘΕΜΑΤΟΣ")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {['default', 'luxury', 'minimal', 'vibrant'].map(theme => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => onBrandingChange("theme_concept", theme)}
                    className={\`px-4 py-2 rounded-lg text-xs font-bold transition-all \${
                      (branding?.theme_concept || 'default') === theme 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }\`}
                  >
                    {theme === 'luxury' ? txt('Moda / Lüks', 'Fashion / Luxury', 'Μόδα / Πολυτέλεια') : theme.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              BANNER SLIDER (HERO)
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {txt("Mağazanızın en üstündeki reklam alanına birden fazla görsel ekleyip sıralayabilir, üzerindeki metinlerin konumunu ve görünürlüğünü yönetebilirsiniz.", "You can add multiple images to the advertising area at the top of your store, order them, and manage the position and visibility of the texts on them.", "Μπορείτε να προσθέσετε πολλές εικόνες στον διαφημιστικό χώρο στο πάνω μέρος του καταστήματός σας, να τις παραγγείλετε και να διαχειριστείτε τη θέση και την ορατότητα των κειμένων σε αυτές.")}
            </p>
          </div>
          <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-200">
            <span className="text-[10px] text-slate-400 font-medium">
              {"💡 " + txt("Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular.", "If the store name contains 'lookprice', the system automatically applies premium local business fallbacks.", "Εάν το όνομα του καταστήματος περιέχει 'lookprice', το σύστημα εφαρμόζει αυτόματα εναλλακτικές επιλογές κορυφαίων τοπικών επιχειρήσεων.")}
            </span>
          </div>
        </div>
      </div>`;

content = content.replace(target, replacement);

fs.writeFileSync(f, content);
