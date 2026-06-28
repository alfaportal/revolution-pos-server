import { getLang } from "../lib/i18n.js";

const legalPages = {
  privacy: {
    sq: {
      title: "Privatësia e të dhënave",
      updated: "Përditësuar: qershor 2026",
      content: `
        <p class="legal-lead">Kjo politikë shpjegon si <strong>Revolution Invest POS</strong> (“ne”, “shërbimi”) mbledh, përdor dhe mbron të dhënat kur bizneset në Kosovë, Shqipëri dhe rajon përdorin platformën tonë.</p>

        <h2>1. Kush jemi ne</h2>
        <p>Revolution Invest POS ofrohet nga Revolution Invest. Për pyetje rreth privatësisë: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a>.</p>

        <h2>2. Cilat të dhëna mbledhim</h2>
        <p>Varet nga mënyra se si e përdorni shërbimin:</p>
        <ul>
          <li><strong>Të dhëna biznesi:</strong> emri i restorantit/kafenesë, adresa, numri i telefonit, email, NUI/NIPT (kur kërkohet), logo dhe informacion publik i faqes së restorantit.</li>
          <li><strong>Llogari pronari & staf:</strong> emër, email, telefon, roli (pronar, menaxher, kamarier, kuzhinier), regjistrime hyrjeje në sistem.</li>
          <li><strong>Të dhëna operacionale POS:</strong> porosi, tavolina, artikuj menuje, çmime, pagesa, fatura, raporte shitjeje dhe Z-Report (kur moduli fiskal përdoret).</li>
          <li><strong>Të dhëna klientësh (nga porositë):</strong> emër ose telefon vetëm kur klienti i jep vullnetarisht (p.sh. delivery, rezervim).</li>
          <li><strong>Të dhëna teknike:</strong> lloji i pajisjes, shfletuesi, adresa IP, log-e gabimesh dhe performancës — për siguri dhe diagnostikim.</li>
          <li><strong>Kontakt & marketing:</strong> mesazhet që na dërgoni përmes formës së kontaktit ose WhatsApp.</li>
        </ul>

        <h2>3. Si i përdorim të dhënat</h2>
        <ul>
          <li>Furnizimi dhe mirëmbajtja i sistemit POS (porosi, kuzhinë, raporte, faqe publike).</li>
          <li>Aktivizimi i licencës, provës falas dhe menaxhimi i abonimit.</li>
          <li>Mbështetje teknike, trajnime dhe përgjigje ndaj kërkesave tuaja.</li>
          <li>Përmirësimi i shërbimit, sigurisë dhe stabilitetit të platformës.</li>
          <li>Përmbushja e detyrimeve ligjore (p.sh. mbajtja e evidencave fiskale kur klienti përdor modulin ATK).</li>
        </ul>
        <p>Ne <strong>nuk shesim</strong> të dhënat tuaja personale palëve të treta për qëllime marketingu.</p>

        <h2>4. Si ruhen të dhënat</h2>
        <ul>
          <li>Të dhënat ruhen në serverë cloud me enkriptim gjatë transmetimit (HTTPS/TLS).</li>
          <li>Aksesi është i kufizuar vetëm për stafin e autorizuar të Revolution Invest.</li>
          <li>Backup periodik për të shmangur humbjen e të dhënave.</li>
          <li>Disa pajisje (POS, tablet) mund të punojnë offline; të dhënat sinkronizohen kur lidhet interneti.</li>
        </ul>

        <h2>5. Me kë ndajmë të dhënat</h2>
        <p>Mund t’i ndajmë vetëm kur është e nevojshme:</p>
        <ul>
          <li><strong>Ofrues infrastrukture:</strong> hosting cloud, baza të dhënash — me kontrata që kërkojnë mbrojtje të të dhënave.</li>
          <li><strong>Integrime që zgjidhni ju:</strong> p.sh. printues fiskal, delivery, njoftime WhatsApp/SMS — vetëm të dhënat e nevojshme për atë shërbim.</li>
          <li><strong>Autoritete:</strong> kur ligji e kërkon (p.sh. kërkesë zyrtare nga organet kompetente).</li>
        </ul>

        <h2>6. Afati i ruajtjes</h2>
        <p>Të dhënat ruhen gjatë kohës që keni kontratë aktive me ne. Pas mbylljes së llogarisë, fshijmë ose anonimizojmë të dhënat brenda një afati të arsyeshëm (zakonisht deri 12 muaj), përveç kur ligji kërkon ruajtje më të gjatë — p.sh. evidenca fiskale sipas rregulloreve të ATK-së në Kosovë ose autoriteteve përkatëse në Shqipëri.</p>

        <h2>7. Të drejtat tuaja (GDPR & ligji lokal)</h2>
        <p>Nëse jeni në Kosovë, Shqipëri ose BE, keni të drejtë të:</p>
        <ul>
          <li><strong>Akses:</strong> kërkoni kopje të të dhënave tuaja.</li>
          <li><strong>Korrigjim:</strong> kërkoni përditësim të të dhënave të pasakta.</li>
          <li><strong>Fshirje:</strong> kërkoni fshirjen e të dhënave kur nuk ka bazë ligjore për ruajtje.</li>
          <li><strong>Kufizim & kundërshtim:</strong> kundërshtoni përpunimin për qëllime të caktuara.</li>
          <li><strong>Portabilitet:</strong> merrni të dhënat tuaja në format të lexueshëm, kur aplikohet.</li>
          <li><strong>Ankim:</strong> ankoheni te autoriteti i mbrojtjes së të dhënave në vendin tuaj.</li>
        </ul>
        <p>Për të ushtruar këto të drejta, shkruani te <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a>. Përgjigjemi brenda 30 ditëve.</p>

        <h2>8. Cookies & teknologji të ngjashme</h2>
        <p>Faqja publique dhe paneli përdorin cookies thelbësore për hyrjen në llogari, preferencën e gjuhës dhe sigurinë e sesionit. Nuk përdorim cookies reklamuese palësh të treta në platformën tonë.</p>

        <h2>9. Fëmijët</h2>
        <p>Shërbimi është i destinuar për biznese. Ne nuk mbledhim me vetëdije të dhëna nga persona nën 16 vjeç.</p>

        <h2>10. Ndryshime në këtë politikë</h2>
        <p>Mund ta përditësojmë këtë faqe. Data e përditësimit shfaqet sipër. Përdorimi i vazhdueshëm i shërbimit pas ndryshimeve nënkupton pranimin e politikës së re.</p>

        <h2>11. Kontakt</h2>
        <p>Email: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a><br />Faqja e kontaktit: <a href="/#kontakt" data-navigate>revolution-pos.com/#kontakt</a></p>
      `,
    },
    en: {
      title: "Privacy Policy",
      updated: "Last updated: June 2026",
      content: `
        <p class="legal-lead">This policy explains how <strong>Revolution Invest POS</strong> (“we”, “the service”) collects, uses, and protects data when businesses in Kosovo, Albania, and the region use our platform.</p>

        <h2>1. Who we are</h2>
        <p>Revolution Invest POS is provided by Revolution Invest. Privacy inquiries: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a>.</p>

        <h2>2. What data we collect</h2>
        <p>Depending on how you use the service:</p>
        <ul>
          <li><strong>Business data:</strong> restaurant/café name, address, phone, email, tax ID when required, logo, and public restaurant page information.</li>
          <li><strong>Owner & staff accounts:</strong> name, email, phone, role (owner, manager, waiter, kitchen), login activity.</li>
          <li><strong>POS operational data:</strong> orders, tables, menu items, prices, payments, invoices, sales reports, and Z-Reports (when the fiscal module is used).</li>
          <li><strong>Customer data (from orders):</strong> name or phone only when the customer provides it voluntarily (e.g. delivery, reservation).</li>
          <li><strong>Technical data:</strong> device type, browser, IP address, error and performance logs — for security and diagnostics.</li>
          <li><strong>Contact & marketing:</strong> messages you send via our contact form or WhatsApp.</li>
        </ul>

        <h2>3. How we use data</h2>
        <ul>
          <li>Providing and maintaining the POS system (orders, kitchen, reports, public page).</li>
          <li>Activating licenses, free trials, and managing subscriptions.</li>
          <li>Technical support, training, and responding to your requests.</li>
          <li>Improving service, security, and platform stability.</li>
          <li>Legal compliance (e.g. fiscal records when you use the ATK fiscal module).</li>
        </ul>
        <p>We do <strong>not sell</strong> your personal data to third parties for marketing.</p>

        <h2>4. How data is stored</h2>
        <ul>
          <li>Data is stored on cloud servers with encryption in transit (HTTPS/TLS).</li>
          <li>Access is limited to authorized Revolution Invest staff only.</li>
          <li>Periodic backups to prevent data loss.</li>
          <li>Some devices (POS, tablets) may work offline; data syncs when connected.</li>
        </ul>

        <h2>5. Who we share data with</h2>
        <p>We share data only when necessary:</p>
        <ul>
          <li><strong>Infrastructure providers:</strong> cloud hosting, databases — under data protection agreements.</li>
          <li><strong>Integrations you choose:</strong> e.g. fiscal printer, delivery, WhatsApp/SMS notifications — only data required for that service.</li>
          <li><strong>Authorities:</strong> when required by law (official requests from competent bodies).</li>
        </ul>

        <h2>6. Retention period</h2>
        <p>Data is kept while you have an active agreement with us. After account closure, we delete or anonymize data within a reasonable period (usually up to 12 months), except where law requires longer retention — e.g. fiscal records under ATK rules in Kosovo or relevant authorities in Albania.</p>

        <h2>7. Your rights (GDPR & local law)</h2>
        <p>If you are in Kosovo, Albania, or the EU, you have the right to:</p>
        <ul>
          <li><strong>Access:</strong> request a copy of your data.</li>
          <li><strong>Rectification:</strong> request correction of inaccurate data.</li>
          <li><strong>Erasure:</strong> request deletion when there is no legal basis to retain.</li>
          <li><strong>Restriction & objection:</strong> object to processing for certain purposes.</li>
          <li><strong>Portability:</strong> receive your data in a readable format, where applicable.</li>
          <li><strong>Complaint:</strong> lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>To exercise these rights, email <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a>. We respond within 30 days.</p>

        <h2>8. Cookies & similar technologies</h2>
        <p>The public site and panel use essential cookies for login, language preference, and session security. We do not use third-party advertising cookies on our platform.</p>

        <h2>9. Children</h2>
        <p>The service is intended for businesses. We do not knowingly collect data from persons under 16.</p>

        <h2>10. Changes to this policy</h2>
        <p>We may update this page. The update date is shown above. Continued use after changes means acceptance of the updated policy.</p>

        <h2>11. Contact</h2>
        <p>Email: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a><br />Contact page: <a href="/#kontakt" data-navigate>revolution-pos.com/#kontakt</a></p>
      `,
    },
  },
  terms: {
    sq: {
      title: "Kushtet e shërbimit",
      updated: "Përditësuar: qershor 2026",
      content: `
        <p class="legal-lead">Duke përdorur <strong>Revolution Invest POS</strong>, ju (“Klienti”, “Pronari i biznesit”) pranoni këto kushte. Lexojini me kujdes para aktivizimit të provës ose abonimit.</p>

        <h2>1. Çfarë ofron shërbimi</h2>
        <p>Revolution Invest POS është platformë softuerike për restorante, kafene dhe bare, që përfshin (sipas pakos së zgjedhur):</p>
        <ul>
          <li>POS kasë — porosi, fatura, menaxhim tavolinash</li>
          <li>Panel pronari — menu, staf, raporte</li>
          <li>KDS kuzhinë, kamarier tablet, kiosk QR</li>
          <li>Faqe publike restoranti dhe module shtesë (mobile, delivery, etj.)</li>
        </ul>
        <p>Funksionalitetet e sakta varen nga paketa e zgjedhur. Lista aktuale shfaqet në faqen “Pakot”.</p>

        <h2>2. Llogaria & përgjegjësitë tuaja</h2>
        <ul>
          <li>Jeni përgjegjës për saktësinë e të dhënave të biznesit tuaj.</li>
          <li>Mbrojtja e fjalëkalimeve dhe aksesit të stafit është detyrë juaj.</li>
          <li>Informoni stafin për përdorimin e duhur të sistemit dhe të dhënave të klientëve.</li>
          <li>Nuk lejohet përdorimi i shërbimit për aktivitete të paligjshme.</li>
        </ul>

        <h2>3. Provë falas & abonimi</h2>
        <ul>
          <li>Ofrojmë <strong>provë falas 1 muaj</strong> për pakot e reja, nëse nuk thuhet ndryshe në ofertë.</li>
          <li>Pas provës, shërbimi vazhdon vetëm me abonim aktiv.</li>
          <li>Çmimet dhe modulet e përfshira komunikohen gjatë regjistrimit ose rinovimit — nuk shfaqen publikisht nëse kemi marrëveshje individuale.</li>
        </ul>

        <h2>4. Pagesat</h2>
        <ul>
          <li>Pagesat bëhen sipas ciklit të rënë dakord (javor, mujor ose vjetor).</li>
          <li>Pagesa vonuar mund të çojë në pezullim të përkohshëm të aksesit deri në sqarim.</li>
          <li>Çmimet mund të ndryshojnë me njoftim paraprak — jo për periudhën e paguar tashmë.</li>
        </ul>

        <h2>5. Anulimi & mbyllja</h2>
        <ul>
          <li>Mund ta anuloni abonimin duke na kontaktuar me email ose WhatsApp.</li>
          <li>Anulimi hyn në fuqi në fund të periudhës së paguar, përveç rasteve të veçanta të rëna dakord.</li>
          <li>Ne mund ta pezullojmë ose mbyllim llogarinë në rast shkeljeje të kushteve, mos-pagese të vazhdueshme ose keqpërdorimi.</li>
          <li>Pas mbylljes, mund të eksportoni raportet tuaja brenda afatit të arsyeshëm; pastaj të dhënat trajtohen sipas politikës së privatësisë.</li>
        </ul>

        <h2>6. Licenca e softuerit</h2>
        <p>Revolution Invest POS mbetet pronë e Revolution Invest. Ju merrni një <strong>licencë jo-ekskluzive, jo-transferueshme</strong> për ta përdorur gjatë kohës së abonimit, vetëm për biznesin tuaj të regjistruar.</p>
        <p>Nuk lejohet:</p>
        <ul>
          <li>Kopjimi, shpërndarja ose rishitja e softuerit pa leje me shkrim</li>
          <li>Modifikimi i kodit burimor ose tentativa për ta prishur sigurinë</li>
          <li>Përdorimi i një licence për më shumë se një lokacion pa marrëveshje shtesë</li>
        </ul>

        <h2>7. Disponueshmëria & mbështetja</h2>
        <p>Forcojmë përpjekjet për uptime të lartë, por nuk garantojmë shërbim pa ndërprerje 100%. Mirëmbajtje e planifikuar njoftohet paraprakisht kur është e mundur.</p>
        <p>Mbështetja ofrohet përmes email, WhatsApp dhe dokumentacionit online (manuali).</p>

        <h2>8. Përgjegjësia</h2>
        <ul>
          <li>Revolution Invest nuk mban përgjegjësi për humbje indirekte (fitim i humbur, reputacion) përveç kur ligji e kërkon.</li>
          <li>Përgjegjësia jonë totale për çdo kërkesë nuk tejkalon shumën e paguar nga klienti për 3 muajt e fundit të shërbimit.</li>
          <li>Ju mbani përgjegjësi për saktësinë fiskale të faturave dhe raportimeve që gjeneroni në sistem.</li>
        </ul>

        <h2>9. Të dhënat & privatësia</h2>
        <p>Përpunimi i të dhënave rregullohet nga <a href="/privacy" data-navigate>Politika e Privatësisë</a>. Duke përdorur shërbimin, pranoni edhe atë politikë.</p>

        <h2>10. Ndryshime në kushte</h2>
        <p>Mund t’i përditësojmë këto kushte. Ndryshimet materiale njoftohen me email ose në panel. Përdorimi pas njoftimit konsiderohet pranim.</p>

        <h2>11. Ligji zbatues & mosmarrëveshje</h2>
        <p>Këto kushte rregullohen sipas ligjeve të Republikës së Kosovës, përveç kur marrëveshja e shkruar parashikon ndryshe. Mosmarrëveshjet zgjidhen fillimisht me negociata të ndershme; nëse dështojnë, kompetente janë gjykatat e Kosovës.</p>

        <h2>12. Kontakt</h2>
        <p>Email: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a><br />Kontakt: <a href="/#kontakt" data-navigate>revolution-pos.com/#kontakt</a></p>
      `,
    },
    en: {
      title: "Terms of Service",
      updated: "Last updated: June 2026",
      content: `
        <p class="legal-lead">By using <strong>Revolution Invest POS</strong>, you (“Client”, “Business Owner”) accept these terms. Please read them carefully before activating a trial or subscription.</p>

        <h2>1. What the service provides</h2>
        <p>Revolution Invest POS is a software platform for restaurants, cafés, and bars, including (depending on your plan):</p>
        <ul>
          <li>POS register — orders, invoices, table management</li>
          <li>Owner panel — menu, staff, reports</li>
          <li>Kitchen KDS, waiter tablet, QR kiosk</li>
          <li>Public restaurant page and add-on modules (mobile, delivery, etc.)</li>
        </ul>
        <p>Exact features depend on the selected plan. The current list is shown on the “Pricing” page.</p>

        <h2>2. Account & your responsibilities</h2>
        <ul>
          <li>You are responsible for the accuracy of your business information.</li>
          <li>Protecting passwords and staff access is your duty.</li>
          <li>Inform staff about proper use of the system and customer data.</li>
          <li>Use of the service for unlawful activities is not permitted.</li>
        </ul>

        <h2>3. Free trial & subscription</h2>
        <ul>
          <li>We offer a <strong>1-month free trial</strong> for new plans, unless otherwise stated in the offer.</li>
          <li>After the trial, the service continues only with an active subscription.</li>
          <li>Pricing and included modules are communicated during signup or renewal.</li>
        </ul>

        <h2>4. Payments</h2>
        <ul>
          <li>Payments follow the agreed billing cycle (weekly, monthly, or annual).</li>
          <li>Late payment may result in temporary suspension until resolved.</li>
          <li>Prices may change with prior notice — not for already paid periods.</li>
        </ul>

        <h2>5. Cancellation & termination</h2>
        <ul>
          <li>You may cancel by contacting us via email or WhatsApp.</li>
          <li>Cancellation takes effect at the end of the paid period, unless otherwise agreed.</li>
          <li>We may suspend or close accounts for terms violations, persistent non-payment, or misuse.</li>
          <li>After closure, you may export your reports within a reasonable time; data is then handled per the privacy policy.</li>
        </ul>

        <h2>6. Software license</h2>
        <p>Revolution Invest POS remains the property of Revolution Invest. You receive a <strong>non-exclusive, non-transferable license</strong> to use it during your subscription, only for your registered business.</p>
        <p>You may not:</p>
        <ul>
          <li>Copy, distribute, or resell the software without written permission</li>
          <li>Modify source code or attempt to breach security</li>
          <li>Use one license for multiple locations without an additional agreement</li>
        </ul>

        <h2>7. Availability & support</h2>
        <p>We strive for high uptime but do not guarantee 100% uninterrupted service. Planned maintenance is announced in advance when possible.</p>
        <p>Support is provided via email, WhatsApp, and online documentation (manual).</p>

        <h2>8. Liability</h2>
        <ul>
          <li>Revolution Invest is not liable for indirect losses (lost profit, reputation) except where required by law.</li>
          <li>Our total liability for any claim does not exceed fees paid by the client in the last 3 months of service.</li>
          <li>You remain responsible for the fiscal accuracy of invoices and reports you generate in the system.</li>
        </ul>

        <h2>9. Data & privacy</h2>
        <p>Data processing is governed by our <a href="/privacy" data-navigate>Privacy Policy</a>. By using the service, you also accept that policy.</p>

        <h2>10. Changes to terms</h2>
        <p>We may update these terms. Material changes are notified by email or in the panel. Use after notification constitutes acceptance.</p>

        <h2>11. Governing law & disputes</h2>
        <p>These terms are governed by the laws of the Republic of Kosovo, unless a written agreement states otherwise. Disputes are first resolved through good-faith negotiation; if that fails, courts in Kosovo have jurisdiction.</p>

        <h2>12. Contact</h2>
        <p>Email: <a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a><br />Contact: <a href="/#kontakt" data-navigate>revolution-pos.com/#kontakt</a></p>
      `,
    },
  },
};

export function getLegalPage(slug) {
  const page = legalPages[slug];
  if (!page) return null;
  const lang = getLang();
  return page[lang] ?? page.sq;
}
