const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

const target = `            </span>
          </div>
        </div>
      </div>

        {displayBanners.length === 0 ? (`;

const replacement = `            </span>
          </div>
        </div>

        {displayBanners.length === 0 ? (`;

content = content.replace(target, replacement);

fs.writeFileSync(f, content);
