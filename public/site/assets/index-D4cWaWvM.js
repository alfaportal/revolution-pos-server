(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(o){if(o.ep)return;o.ep=!0;const r=a(o);fetch(o.href,r)}})();const q=[];function R(e,t){const a=[],n=new RegExp("^"+e.replace(/\//g,"\\/").replace(/:([a-zA-Z]+)/g,(o,r)=>(a.push(r),"([^/]+)"))+"$");q.push({regex:n,keys:a,handler:t})}function V(e){const t=e.indexOf("#"),a=t>=0?e.slice(t+1):"",n=t>=0?e.slice(0,t)||"/":e;window.history.pushState({},"",a?`${n}#${a}`:n),P(),a&&requestAnimationFrame(()=>{var o;(o=document.getElementById(a))==null||o.scrollIntoView({behavior:"smooth"})})}function g(){return window.location.pathname.replace(/\/+$/,"")||"/"}function P(){var t;const e=g();for(const a of q){const n=e.match(a.regex);if(!n)continue;const o={};a.keys.forEach((r,s)=>{o[r]=decodeURIComponent(n[s+1])}),a.handler(o);return}(t=q.find(a=>a.regex.source==="^\\/$"))==null||t.handler({})}function U(){document.addEventListener("click",e=>{const t=e.target.closest("a[data-navigate]");t&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(e.preventDefault(),V(t.getAttribute("href"))))}),window.addEventListener("popstate",P),P()}const F={sq:{navLabel:"Kryesore",langLabel:"Gjuha",features:"Veçoritë",howItWorks:"Si funksionon",packages:"Paketat",faq:"FAQ",blog:"Blog",backToTop:"Kthehu lart",blogBadge:"Blog",heroTitle:"Këshilla & Njohuri për",heroAccent:"Restorante Moderne",heroSubtitle:"Artikuj praktikë për menaxhimin e restorantit, teknologjinë POS dhe eficiencën operacionale.",readMore:"Lexo →",backToBlog:"← Kthehu në ballina",pageTitle:"Revolution Invest POS — Restorante & Kafene",metaDescription:"Këshilla dhe njohuri për restorante moderne — menaxhim, POS, teknologji dhe eficiencë operacionale."},en:{navLabel:"Main navigation",langLabel:"Language",features:"Features",howItWorks:"How it works",packages:"Pricing",faq:"FAQ",blog:"Blog",backToTop:"Back to top",blogBadge:"Blog",heroTitle:"Tips & Insights for",heroAccent:"Modern Restaurants",heroSubtitle:"Practical articles on restaurant management, POS technology, and operational efficiency.",readMore:"Read →",backToBlog:"← Back to home",pageTitle:"Revolution Invest POS — Restaurants & Cafés",metaDescription:"Tips and insights for modern restaurants — management, POS, technology, and operational efficiency."}},S={sq:{"meta.title":"Revolution Invest POS — Sistemi POS për Restorantet, Kafenetë & Dyqanet","meta.description":"Revolution Invest POS — platformë e plotë për restorante, kafene dhe dyqane. POS, kuzhinë, kamarier, stok me AI, faqe publike /r/ & /s/, porosi online dhe offline me sync.","brand.subtitle":"Restorant · Kafene · Dyqan","nav.home":"Ballina","nav.howItWorks":"Si funksionon","nav.packages":"Pakot","nav.blog":"Blog","nav.manual":"Manuali","nav.contact":"Kontakti","nav.openMenu":"Hap menunë","cta.startFree":"Fillo Falas","cta.choosePackage":"Zgjidh Pakon","cta.contactUs":"Na Kontaktoni","cta.sendRequest":"Dërgo kërkesën","expand.more":"Lexo më shumë","expand.less":"Më pak","hero.badge":"Provë Falas 1 Muaj","hero.title":"Kontrollo çdo Porosi. Çdo Tavolinë. Çdo Ditë.","hero.subtitle":"Nga kasa te kuzhina, nga kamarieri te pronari — plus stok, fatura, skanim AI, faqe publike për restorante & dyqane, porosi online dhe punë offline. Gjithçka në një platformë.","hero.cta.primary":"Fillo 1 Muaj Falas","hero.cta.secondary":"Shiko veçoritë →","hero.stats.restaurants":"500+ Restorante","hero.stats.support":"24/7 Mbështetje","hero.stats.cloud":"Cloud & Offline","spotlight.title":"Çfarë përfshin programi","spotlight.subtitle":"Module profesionale që punojnë së bashku — nga operimi ditor te prezenca digjitale e biznesit tuaj.","spotlight.card1.category":"MENAXHIM","spotlight.card1.title":"Stoku, Faturat dhe Skanimi me AI","spotlight.card1.desc":"Inventar me përbërës dhe alarme stoku, fatura fiskale termike, raporte Z dhe skanim i menusë me AI — nga fletë letre te produkt digjital në minuta.","spotlight.card1.link":"Lexo →","spotlight.card2.category":"PLATFORMË","spotlight.card2.title":"Restorant, Kafene & Dyqan — Faqe Publike për Çdo Lokal","spotlight.card2.desc":"Menu digjitale /r/ për restorante, vitrinë produktesh /s/ për dyqane, porosi online, rezervime tavolinash, offline me sync dhe panel pronari nga telefoni.","spotlight.card2.link":"Shiko pakot →","how.title":"Si funksionon sistemi","how.subtitle":"Katër module të lidhura — porosia shkon nga tavolina te kuzhina, pronari sheh gjithçka live, klienti gjen lokalin tuaj online.","how.pos.title":"POS Kasa","how.pos.desc":"Shitje të shpejta, tavolina, pagesa, fatura fiskale dhe printim termik — qendra e operimit të restorantit ose dyqanit tuaj.","how.waiter.title":"Kamarieri","how.waiter.desc":"Tablet ose telefon — merr porosi nga tavolina, punon edhe offline dhe i dërgon automatikisht në kuzhinë kur kthehet interneti.","how.kds.title":"KDS Kuzhina","how.kds.desc":"Ekran dixhital — porositë shfaqen live, stafi konfirmon gatishmërinë dhe servimi bëhet pa gabime.","how.owner.title":"Pronari","how.owner.desc":"Panel online — menu, stok, stafi, rezervime, faqja publike, raporte dhe QR — menaxhim i plotë nga kudo.","how.readManual":"Lexo në manual →","packages.title":"Pakot fleksibile për çdo madhësi biznesi","packages.subtitle":"Nga kafene e vogla deri te restorant ose dyqan me shumë lokale — zgjidh paketën që përshtatet. Çdo nivel shton module; 1 muaj provë falas.","packages.badge":"1 muaj falas","packages.perWeek":"/javë","packages.p1.name":"Pako 1 — Fillore","packages.p1.tagline":"Fillim i thjeshtë për kafene & restorante të vogla","packages.p1.summary":"Kasa digjitale, panel pronari, faqe publike me menu dhe raporte ditore — mjaftueshëm për të digitalizuar shitjet pa kompleksitet.","packages.p1.f1":"POS Kasa — shitje, pagesa & fatura termike","packages.p1.f2":"Panel pronari — menu, çmime, kategori & stafi","packages.p1.f3":"Faqja publike — menu /r/ ose vitrinë dyqani /s/ (info & logo)","packages.p1.f4":"Raportet & Z-Report — mbyllje ditor & arkë","packages.p1.f5":"Printim fatura — termik & format A4","packages.p1.f6":"1 muaj provë falas — aktivizo pa pagesë","packages.p2.name":"Pako 2 — Në rritje","packages.p2.tagline":"Kuzhina e lidhur & porosi direkt nga tavolina","packages.p2.summary":"Për lokale me kuzhinë aktive: porositë shkojnë live te ekrani i kuzhinës, klienti skanon QR-në e tavolinës dhe kamarieri merr porosi me tablet.","packages.p2.incl":"Përfshin të gjitha nga Pako Fillore","packages.p2.f1":"KDS Kuzhina — porosi live te ekrani i kuzhinës","packages.p2.f2":"Kiosk QR — klienti skanon & porosit nga tavolina","packages.p2.f3":"Terminal kamarier — merr porosi me tablet ose telefon","packages.p2.f4":"Menaxhim tavolinash — zona, numra & status","packages.p2.f5":"Sinkronizim kuzhinë–kasë në kohë reale","packages.p2.f6":"Faqe publike me menu interaktive për klientët","packages.p3.name":"Pako 3 — Profesionale","packages.p3.tagline":"Mobile, cloud & kontroll i plotë i operacioneve","packages.p3.summary":"Për ekipa më të mëdha: aplikacion mobile për stafin, menaxhim pajisjesh, backup në cloud dhe raporte të thelluara për vendime më të mira.","packages.p3.incl":"Përfshin të gjitha nga Pako në Rritje","packages.p3.f1":"Aplikacion mobile & offline — stafi punon pa internet, sync automatik","packages.p3.f2":"Menaxhim telefonash & pajisjeve të autorizuara","packages.p3.f3":"Backup cloud & përditësime automatike të sistemit","packages.p3.f4":"Rezervime tavolinash, raporte të avancuara & analitikë shitjesh","packages.p3.f5":"Multi-përdorues — role & leje të detajuara për stafin","packages.p3.f6":"Mbështetje prioritet & onboarding i dedikuar","packages.p4.name":"Pako 4 — Premium","packages.p4.tagline":"Porosi online & prezencë digjitale e plotë","packages.p4.summary":"Paketa më e plotë: porosi online, faqe premium me galeri & vlerësime, vitrinë dyqani me grid produktesh, inventar me përbërës dhe multi-lokal.","packages.p4.incl":"Përfshin të gjitha nga Pako Profesionale","packages.p4.f1":"Porosi online — klienti dërgon porosinë nga faqja publike","packages.p4.f2":"Faqe premium — cover, galeri, oferta & vitrinë dyqani /s/","packages.p4.f3":"Vlerësime klientësh — reputacion & feedback publik","packages.p4.f4":"WhatsApp, Instagram, Facebook & TikTok — një klik kontakt","packages.p4.f5":"Inventar & stok — përbërës, receta, alarme & zbritje automatik","packages.p4.f6":"Multi-lokal — menaxhim & raporte të konsoliduara","packages.clickHint":"Klikoni një paketë për të parë çfarë përfshin","packages.includes":"Çfarë përfshin kjo paketë:","packages.selected":"Zgjedhur","contact.title":"Filloni sot — provë 1 muaj falas","contact.subtitle":"Na kontaktoni për instalim, demo live dhe zgjedhjen e pakos së duhur për restorantin, kafenen ose dyqanin tuaj.","contact.direct":"Kontakt i drejtpërdrejtë","contact.email":"revolutioninvest05@gmail.com","contact.sendMessage":"Dërgo mesazh","form.name":"Emri","form.phone":"Telefoni","form.message":"Mesazhi","form.namePlaceholder":"Emri i biznesit","form.messagePlaceholder":"P.sh. Restorant me 15 tavolina ose dyqan me 200 produkte…","form.error":"Plotësoni të gjitha fushat.","form.success":"Faleminderit! Po ju hapim WhatsApp për të dërguar kërkesën.","footer.tagline":"Sistemi i plotë POS për restorante, kafene, bare dhe dyqane — porosi, kuzhinë, stok, faqe publike dhe menaxhim nga një vend.","footer.note":"Zhvilluar dhe mirëmbajtur nga ekipi ynë në Kosovë dhe rajon.","footer.col.platform":"Platforma","footer.col.support":"Ndihmë & kontakt","footer.link.howItWorks":"Si funksionon","footer.link.packages":"Pakot & modulet","footer.link.blog":"Artikuj & këshilla","footer.link.manual":"Manuali i përdorimit","footer.link.contact":"Na kontaktoni","footer.link.login":"Hyr në panel pronari","footer.link.trial":"Fillo provën falas","footer.legal.privacy":"Privatësia e të dhënave","footer.legal.terms":"Kushtet e shërbimit","footer.legal.notice":"Revolution Invest POS ofrohet me licencë të rregullt. Të dhënat e biznesit tuaj ruhen në mënyrë të sigurt sipas politikës sonë të privatësisë.","footer.rights":"Revolution Invest. Të gjitha të drejtat e rezervuara.","wa.trial":"Përshëndetje, dëshiroj të provoj Revolution Invest POS.","wa.custom":"Përshëndetje, dëshiroj të diskutoj për zgjidhje të personalizuara.","wa.formIntro":"Përshëndetje, jam {name} ({phone}).","wa.formSuffix":"Dëshiroj Revolution Invest POS — 1 muaj falas.","legal.backHome":"← Kthehu në ballina","articles.heading":"Artikujt e fundit"},en:{"meta.title":"Revolution Invest POS — POS for Restaurants, Cafés & Shops","meta.description":"Revolution Invest POS — full platform for restaurants, cafés and retail. POS, kitchen, waiter, AI inventory, public pages /r/ & /s/, online orders and offline sync.","brand.subtitle":"Restaurant · Café · Shop","nav.home":"Home","nav.howItWorks":"How it works","nav.packages":"Pricing","nav.blog":"Blog","nav.manual":"Manual","nav.contact":"Contact","nav.openMenu":"Open menu","cta.startFree":"Start Free","cta.choosePackage":"Choose Plan","cta.contactUs":"Contact Us","cta.sendRequest":"Send request","expand.more":"Read more","expand.less":"Show less","hero.badge":"1 Month Free Trial","hero.title":"Control Every Order. Every Table. Every Day.","hero.subtitle":"From register to kitchen, waiter to owner — plus stock, invoices, AI menu scan, public pages for restaurants & shops, online orders and offline work. All in one platform.","hero.cta.primary":"Start 1 Month Free","hero.cta.secondary":"See features →","hero.stats.restaurants":"500+ Restaurants","hero.stats.support":"24/7 Support","hero.stats.cloud":"Cloud & Offline","spotlight.title":"What's inside the platform","spotlight.subtitle":"Professional modules that work together — from daily operations to your business's digital presence.","spotlight.card1.category":"MANAGEMENT","spotlight.card1.title":"Inventory, Invoices & AI Scanning","spotlight.card1.desc":"Ingredient inventory with stock alerts, fiscal receipts, Z-reports and AI menu scanning — from paper sheet to digital catalog in minutes.","spotlight.card1.link":"Read →","spotlight.card2.category":"PLATFORM","spotlight.card2.title":"Restaurant, Café & Shop — A Public Page for Every Venue","spotlight.card2.desc":"Digital menu /r/ for restaurants, product storefront /s/ for shops, online orders, table reservations, offline sync and owner panel from your phone.","spotlight.card2.link":"View plans →","how.title":"How the system works","how.subtitle":"Four connected modules — orders flow from table to kitchen, the owner sees everything live, guests find you online.","how.pos.title":"POS Register","how.pos.desc":"Take orders, issue fiscal invoices, and manage tables — the hub of your restaurant operations.","how.waiter.title":"Waiter","how.waiter.desc":"Tablet or phone — take orders directly from the table and send them automatically to the kitchen.","how.kds.title":"Kitchen KDS","how.kds.desc":"Digital screen — see orders in real time and confirm when a dish is ready to serve.","how.owner.title":"Owner","how.owner.desc":"Online panel — view reports, manage menu and staff from anywhere, even your phone.","how.readManual":"Read in manual →","packages.title":"Flexible plans for every business size","packages.subtitle":"From a small café to a multi-location restaurant — pick the tier that fits. Each level adds modules on top of the previous one. Every plan starts with a 1-month free trial.","packages.badge":"1 month free","packages.perWeek":"/week","packages.p1.name":"Plan 1 — Starter","packages.p1.tagline":"Simple start for small cafés & restaurants","packages.p1.summary":"Digital register, owner panel, public menu page and daily reports — enough to digitize sales without complexity.","packages.p1.f1":"POS register — sales, payments & thermal receipts","packages.p1.f2":"Owner panel — menu, prices, categories & staff","packages.p1.f3":"Public page — menu /r/ or shop storefront /s/ (info & logo)","packages.p1.f4":"Reports & Z-Report — daily close & cash drawer","packages.p1.f5":"Receipt printing — thermal & A4 formats","packages.p1.f6":"1 month free trial — activate at no cost","packages.p2.name":"Plan 2 — Growing","packages.p2.tagline":"Connected kitchen & table-side ordering","packages.p2.summary":"For venues with an active kitchen: orders go live to the kitchen screen, guests scan the table QR, and waiters take orders on tablet.","packages.p2.incl":"Includes everything in Starter","packages.p2.f1":"Kitchen Display (KDS) — live orders on the kitchen screen","packages.p2.f2":"QR kiosk — guests scan & order from the table","packages.p2.f3":"Waiter terminal — take orders on tablet or phone","packages.p2.f4":"Table management — zones, numbers & live status","packages.p2.f5":"Real-time kitchen–register sync","packages.p2.f6":"Interactive public menu page for guests","packages.p3.name":"Plan 3 — Professional","packages.p3.tagline":"Mobile, cloud & full operational control","packages.p3.summary":"For larger teams: mobile app for staff, device management, cloud backup and in-depth reports for better decisions.","packages.p3.incl":"Includes everything in Growing","packages.p3.f1":"Mobile & offline app — staff work without internet, auto sync","packages.p3.f2":"Phone & authorized device management","packages.p3.f3":"Cloud backup & automatic system updates","packages.p3.f4":"Table reservations, advanced reports & sales analytics","packages.p3.f5":"Multi-user — detailed roles & permissions","packages.p3.f6":"Priority support & dedicated onboarding","packages.p4.name":"Plan 4 — Premium","packages.p4.tagline":"Online orders & a complete digital presence","packages.p4.summary":"The full package: online orders, premium public page with gallery & reviews, shop storefront with product grid, ingredient inventory and multi-location.","packages.p4.incl":"Includes everything in Professional","packages.p4.f1":"Online orders — customers submit orders from the public page","packages.p4.f2":"Premium page — cover, gallery, offers & shop storefront /s/","packages.p4.f3":"Customer reviews — reputation & public feedback","packages.p4.f4":"WhatsApp, Instagram, Facebook & TikTok — one-click contact","packages.p4.f5":"Inventory & stock — ingredients, recipes, alerts & auto deduct","packages.p4.f6":"Multi-location — consolidated management & reports","packages.clickHint":"Click a plan to see what's included","packages.includes":"What's included in this plan:","packages.selected":"Selected","contact.title":"Start today — 1 month free trial","contact.subtitle":"Contact us for installation, a live demo, and choosing the right plan for your restaurant or café.","contact.direct":"Direct contact","contact.email":"revolutioninvest05@gmail.com","contact.sendMessage":"Send a message","form.name":"Name","form.phone":"Phone","form.message":"Message","form.namePlaceholder":"Business name","form.messagePlaceholder":"E.g. Restaurant with 15 tables in Pristina…","form.error":"Please fill in all fields.","form.success":"Thank you! Opening WhatsApp so you can send your request.","footer.tagline":"The complete POS system for restaurants, cafés, and bars — orders, kitchen, reports, and management from one place.","footer.note":"Developed and maintained by our team in Kosovo and the region.","footer.col.platform":"Platform","footer.col.support":"Help & contact","footer.link.howItWorks":"How it works","footer.link.packages":"Plans & modules","footer.link.blog":"Articles & tips","footer.link.manual":"User manual","footer.link.contact":"Contact us","footer.link.login":"Owner panel login","footer.link.trial":"Start free trial","footer.legal.privacy":"Data privacy","footer.legal.terms":"Terms of service","footer.legal.notice":"Revolution Invest POS is provided under a standard license. Your business data is stored securely in line with our privacy policy.","footer.rights":"Revolution Invest. All rights reserved.","wa.trial":"Hello, I would like to try Revolution Invest POS.","wa.custom":"Hello, I would like to discuss a tailored solution.","wa.formIntro":"Hello, I'm {name} ({phone}).","wa.formSuffix":"I want Revolution Invest POS — 1 month free.","legal.backHome":"← Back to home","articles.heading":"Latest articles"}},L="revolution-pos-lang";let c=localStorage.getItem(L)||"sq";function k(){return c}function Y(e){e!=="sq"&&e!=="en"||(c=e,localStorage.setItem(L,c),document.documentElement.lang=c==="en"?"en":"sq")}function i(e){var t,a;return((t=F[c])==null?void 0:t[e])??((a=S[c])==null?void 0:a[e])??F.sq[e]??S.sq[e]??e}document.documentElement.lang=c==="en"?"en":"sq";function z(){return"/"}function Z(){return"/blog"}function C(e){return`${Z()}/${e}`.replace(/\/+/g,"/")}function f(e){return`/${e.replace(/^\//,"")}`}function A(e){return g()==="/"?`#${e}`:`/#${e}`}function y(e,t,a,n){const o=g()==="/";return`<a href="${A(e)}"${o?"":" data-navigate"} class="${a===n?"active":""}">${t}</a>`}function O({activeNav:e="home"}={}){const t=k(),a=[{id:"home",label:i("nav.home"),section:"ballina"},{id:"how-it-works",label:i("nav.howItWorks"),section:"si-funksionon"},{id:"packages",label:i("nav.packages"),section:"pakot"},{id:"blog",label:i("nav.blog"),section:"artikuj"}];return`
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="${z()}" ${g()==="/"?"":"data-navigate"} aria-label="Revolution Invest POS">
          <span class="brand-mark" aria-hidden="true">
            <img src="${f("logo-source.png")}" width="40" height="40" alt="" />
          </span>
          <span class="brand-text">
            Revolution Invest POS
            <small>${i("brand.subtitle")}</small>
          </span>
        </a>

        <nav class="nav nav-desktop" aria-label="${i("navLabel")}">
          ${a.map(n=>y(n.section,n.label,e,n.id)).join("")}
          <a href="/website/manual.html">${i("nav.manual")}</a>
          ${y("kontakt",i("nav.contact"),e,"contact")}
        </nav>

        <div class="header-actions">
          <div class="lang-switch" aria-label="${i("langLabel")}">
            <button type="button" data-lang="sq" class="${t==="sq"?"active":""}">SQ</button>
            <button type="button" data-lang="en" class="${t==="en"?"active":""}">EN</button>
          </div>
          <a class="btn btn-primary header-cta-desktop" href="${A("kontakt")}">${i("cta.startFree")}</a>
          <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-mobile" aria-label="${i("nav.openMenu")}">☰</button>
        </div>
      </div>

      <nav class="nav-mobile" id="nav-mobile" aria-label="${i("navLabel")}">
        ${a.map(n=>y(n.section,n.label,e,n.id)).join("")}
        <a href="/website/manual.html">${i("nav.manual")}</a>
        ${y("kontakt",i("nav.contact"),e,"contact")}
        <a class="btn btn-primary" href="${A("kontakt")}">${i("cta.startFree")}</a>
      </nav>
    </header>
  `}function j(e,t){const a=g()==="/";return`<li><a href="${a?`#${e}`:`/#${e}`}"${a?"":" data-navigate"}>${t}</a></li>`}function I(){const t=g()==="/"?"":" data-navigate";return`
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <a class="footer-logo" href="${z()}"${t} aria-label="Revolution Invest POS">
            <span class="brand-mark" aria-hidden="true">
              <img src="${f("logo-source.png")}" width="40" height="40" alt="" />
            </span>
            <span class="footer-logo-text">Revolution Invest POS</span>
          </a>
          <p class="footer-tagline">${i("footer.tagline")}</p>
          <p class="footer-note">${i("footer.note")}</p>
        </div>

        <div class="footer-col">
          <h4>${i("footer.col.platform")}</h4>
          <ul>
            ${j("si-funksionon",i("footer.link.howItWorks"))}
            ${j("pakot",i("footer.link.packages"))}
            ${j("artikuj",i("footer.link.blog"))}
            <li><a href="/website/manual.html">${i("footer.link.manual")}</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>${i("footer.col.support")}</h4>
          <ul>
            ${j("kontakt",i("footer.link.contact"))}
            ${j("kontakt",i("footer.link.trial"))}
            <li><a href="/owner/login">${i("footer.link.login")}</a></li>
            <li><a id="footer-whatsapp" href="#" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="mailto:${i("contact.email")}">${i("contact.email")}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p class="footer-copy">© ${new Date().getFullYear()} ${i("footer.rights")}</p>
          <p class="footer-legal-notice">${i("footer.legal.notice")}</p>
          <div class="footer-legal-links">
            <a href="/privacy" data-navigate>${i("footer.legal.privacy")}</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" data-navigate>${i("footer.legal.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  `}function T(){const e=document.getElementById("footer-whatsapp");if(!e)return;async function t(){try{const a=await fetch("/api/public/config"),n=await a.json();if(!a.ok||!n.ok)return;const o=n.support_phone||"+383 44 123 456",r=n.support_phone_digits||"38344123456";e.textContent=`WhatsApp — ${o}`,e.href=`https://wa.me/${r}?text=${encodeURIComponent(i("wa.trial"))}`}catch{e.textContent="WhatsApp",e.href=`https://wa.me/38344123456?text=${encodeURIComponent(i("wa.trial"))}`}}t()}function K(){return`<button id="back-to-top" class="back-to-top" type="button" aria-label="${i("backToTop")}">↑</button>`}function M(){const e=document.querySelector("#back-to-top");if(!e)return;const t=()=>{e.classList.toggle("visible",window.scrollY>400)};window.removeEventListener("scroll",t),window.addEventListener("scroll",t),t(),e.onclick=()=>{window.scrollTo({top:0,behavior:"smooth"})}}function x(){document.querySelectorAll(".lang-switch button[data-lang]").forEach(e=>{e.onclick=()=>{const t=e.dataset.lang;t!==k()&&(Y(t),P())}})}function $(){const e=document.getElementById("menu-toggle"),t=document.getElementById("nav-mobile");e==null||e.addEventListener("click",()=>{const a=t.classList.toggle("open");e.setAttribute("aria-expanded",a?"true":"false")}),t==null||t.querySelectorAll("a").forEach(a=>{a.addEventListener("click",()=>t.classList.remove("open"))})}function _(){const e=document.getElementById("contact-form"),t=document.getElementById("form-msg");if(!e)return;let a="38344123456",n="+383 44 123 456";async function o(){try{const r=await fetch("/api/public/config"),s=await r.json();if(!r.ok||!s.ok)return;s.support_phone&&(n=s.support_phone),s.support_phone_digits&&(a=s.support_phone_digits);const h=document.getElementById("contact-whatsapp-label"),m=document.getElementById("contact-tel-label"),l=document.getElementById("contact-tel"),p=document.getElementById("contact-whatsapp"),u=document.getElementById("contact-phone");h&&(h.textContent=`WhatsApp — ${n}`),m&&(m.textContent=n),l&&(l.href=`tel:${n.replace(/\s/g,"")}`),u&&(u.placeholder=n),p&&(p.href=`https://wa.me/${a}?text=${encodeURIComponent(i("wa.trial"))}`)}catch{}}o(),e.addEventListener("submit",r=>{var v;r.preventDefault();const s=document.getElementById("contact-name").value.trim(),h=document.getElementById("contact-phone").value.trim(),m=document.getElementById("contact-message").value.trim(),l=((v=document.getElementById("contact-package"))==null?void 0:v.value.trim())||"";if(!s||!h||!m){t.textContent=i("form.error"),t.className="form-msg err";return}const p=i("wa.formIntro").replace("{name}",s).replace("{phone}",h),u=l?`

Pako: ${l}`:"",d=encodeURIComponent(`${p}${u}

${m}

${i("wa.formSuffix")}`);window.open(`https://wa.me/${a}?text=${d}`,"_blank","noopener,noreferrer"),t.textContent=i("form.success"),t.className="form-msg ok",e.reset()})}const J={"stoku-faturat-dhe-skanimi-me-ai":`
    <p>Në restorantet e Kosovës, Shqipërisë dhe Maqedonisë së Veriut, menaxhimi i stokut dhe faturave mbetet një nga sfidat më të mëdha operative. Shumë biznese ende mbështeten në fletore, Excel ose regjistrime manuale që krijojnë gabime, humbje produktesh dhe vonesa në raportim. Revolution POS ofron një qasje moderne që kombinon menaxhimin e stokut, faturave dhe skanimin me inteligjencë artificiale — gjithçka në një platformë të vetme.</p>

    <h2>Pse stoku dhe faturat janë të lidhura ngusht</h2>
    <p>Çdo faturë hyrëse që merrni nga furnizuesi lokal — qoftë në Prishtinë, Tiranë apo Shkup — duhet të reflektohet automatikisht në stok. Kur këto dy procese punojnë veçmas, shpesh ndodh që produktet hyjnë në depo por nuk shfaqen në sistem, ose anasjelltas. Kjo çon në mungesa të papritura gjatë orarit të ngrënies dhe porosi të refuzuara ndaj klientëve.</p>
    <p>Me Revolution POS, faturat skanohen ose futen direkt në sistem dhe stoku përditësohet automatikisht. Nuk keni nevojë të numëroni manualisht çdo artikull pas çdo dërgese. Sistemi regjistron sasinë, çmimin e blerjes dhe furnizuesin — informacion kritik për kontabilitetin dhe planifikimin e blerjeve.</p>

    <h2>Skanimi me AI: nga fletë letre te produkt digital</h2>
    <p>Funksionaliteti i skanimit me AI është veçanërisht i dobishëm për restorantet që marrin fatura të printuara nga furnizuesit tradicionalë. Thjesht fotografoni faturën me tablet ose telefon, dhe sistemi njeh automatikisht produktet, sasinë dhe çmimin. Kjo kursen orë pune çdo javë — veçanërisht për restorante me menu të gjera dhe shumë furnizues.</p>
    <p>Edhe menuja e restorantit mund të skanohet me AI. Në vend që të futni manualisht 50 ose 100 produkte, skanoni menynë tuaj ekzistuese dhe sistemi krijon artikujt automatikisht. Kjo është ideale për restorante që po kalojnë nga menaxhimi manual te POS-i digital.</p>

    <h2>Kontroll i plotë pa kompleksitet</h2>
    <p>Paneli i stokut ju tregon në kohë reale çfarë keni në depo, çfarë po mbaron dhe çfarë duhet porositur. Alarmet automatike ju njoftojnë kur një produkt arrin nivelin minimal — p.sh. kur miellit, vajit ose pijeve u mbaron stoku. Kjo redukton humbjet nga produktet e skaduara dhe porositë e tepërta.</p>
    <ul>
      <li>Regjistrim automatik i stokut nga faturat e skanuara</li>
      <li>Alarme për nivele minimale të produkteve</li>
      <li>Histori e plotë e lëvizjeve të stokut</li>
      <li>Raporte për humbjet dhe konsumin ditor</li>
      <li>Integrim me shitjet — stoku zbritet automatikisht me çdo porosi</li>
    </ul>

    <h2>Përfitimet për bizneset shqipfolëse</h2>
    <p>Restorantet në rajonin tonë kanë nevojë për zgjidhje që funksionojnë me realitetin lokal: fatura të printuara, furnizues të shumtë, staf me orar të ndryshueshëm dhe kërkesa për raportim ndaj ATK-së. Revolution POS i adreson të gjitha këto nevojëra pa kërkuar njohuri teknike të avancuara.</p>
    <p>Investimi në menaxhimin e stokut dhe faturave nuk është luks — është themeli i një restoranti fitimprurës. Me skanimin me AI dhe sinkronizimin automatik, kurseni kohë, reduktoni gabimet dhe merrni kontroll të plotë mbi inventarin tuaj. Filloni sot dhe shihni ndryshimin në operacionet tuaja ditore.</p>
  `,"aplikacion-offline-me-sync":`
    <p>Interneti në restorante nuk është gjithmonë i qëndrueshëm. Në Kosovë, Shqipëri dhe Maqedoni, shumë lokacione përballen me ndërprerje të shkurtra të lidhjes — veçanërisht në orët e pikut ose në zona me infrastrukturë të dobët. Pa një sistem që funksionon offline, restoranti juaj ndalon së punuari, porositë humbasin dhe klientët largohen të pakënaqur. Revolution POS zgjidh këtë problem me aplikacion offline që sinkronizon automatikisht kur interneti kthehet.</p>

    <h2>Si funksionon modi offline</h2>
    <p>Kur lidhja me internetin humbet, Revolution POS vazhdon të punojë normalisht. Stafi mund të marrë porosi, të printojë fatura, të aplikojë zbritje dhe të menaxhojë tavolina — të gjitha pa ndërprerje. Të dhënat ruhen lokalisht në pajisjen tuaj (tablet, telefon ose kompjuter) dhe janë të sigurta edhe pa internet.</p>
    <p>Kjo është thelbësore për restorantet që operojnë në kate të shumta, tarraca ose zona ku sinjali Wi-Fi është i dobët. Në vend që stafi të presë ose të shkruajë porosi në letër, sistemi vazhdon si zakonisht.</p>

    <h2>Sinkronizimi automatik</h2>
    <p>Sapo interneti kthehet, Revolution POS fillon sinkronizimin automatik. Të gjitha porositë, pagesat, ndryshimet e stokut dhe modifikimet e menusë dërgohen në cloud pa ndërhyrje manuale. Nuk ka rrezik humbjeje të të dhënave — çdo transaksion i regjistruar offline ruhet dhe transferohet kur lidhja stabilizohet.</p>
    <p>Sinkronizimi funksionon edhe midis pajisjeve të shumta. Nëse keni dy tableta — një në bar dhe një në kuzhinë — të dyja punojnë offline dhe sinkronizohen kur lidhen me internet. Kjo garanton që kuzhina dhe sala janë gjithmonë të përditësuara.</p>

    <h2>Scenarë praktikë në terren</h2>
    <ul>
      <li><strong>Restorant në qendër të Prishtinës:</strong> Ndërprerje e internetit gjatë drekës — porositë vazhdojnë, klientët shërbehen normalisht</li>
      <li><strong>Kafene bregdetare në Durrës:</strong> Sinjal i dobët Wi-Fi — stafi përdor tabletin offline pa stres</li>
      <li><strong>Fast food në Shkup:</strong> Orë piku me trafik të lartë — sistemi nuk ngadalësohet nga varësia e internetit</li>
      <li><strong>Restorant me tarracë:</strong> Zona e jashtme pa mbulim Wi-Fi — porositë regjistrohen lokalisht dhe sinkronizohen brenda sekondave</li>
    </ul>

    <h2>Siguria e të dhënave offline</h2>
    <p>Shumë pronarë restorantesh shqetësohen: a janë të sigurta të dhënat kur ruhen lokalisht? Revolution POS përdor enkriptim dhe backup automatik. Edhe nëse pajisja dështon, të dhënat e fundit të sinkronizuara janë të ruajtura në cloud. Për transaksionet offline, sistemi ruan një kopje të plotë deri sa sinkronizimi të përfundojë me sukses.</p>

    <h2>Pse offline + sync është standardi i ri</h2>
    <p>Restorantet moderne nuk mund të lejojnë që biznesi të varet 100% nga interneti. Klientët presin shërbim të shpejtë dhe të vazhdueshëm — pa marrë parasysh problemet teknike. Me Revolution POS, fitoni qetësi mendore: sistemi punon gjithmonë, dhe ju fokusoheni te klientët, jo te lidhja Wi-Fi.</p>
    <p>Nëse restoranti juaj ka pësuar ndonjëherë humbje porosish ose vonesa për shkak të internetit, modi offline me sync automatik është zgjidhja që ju nevojitet. Provoni Revolution POS dhe vazhdoni të punoni — me ose pa internet.</p>
  `,"program-pos-falas":`
    <p>Kërkimi për "program POS falas për restorante" është shumë i zakonshëm midis pronarëve të bizneseve në Kosovë, Shqipëri dhe Maqedoni. Fillimi me kosto zero tingëllon tërheqës, por jo çdo ofertë "falas" është e barabartë. Disa sisteme kufizojnë funksionalitetet thelbësore, të tjerat fshehin tarifa pas provës fillestare, dhe shumë nuk janë adaptuar për nevojat e restoranteve shqipfolëse. Ky artikull ju ndihmon të dalloni ofertat e vërteta nga marketingu mashtrues.</p>

    <h2>Çfarë duhet të përfshijë një POS falas i vërtetë</h2>
    <p>Një program POS falas i dobishëm duhet të ofrojë minimumin e nevojshëm për të operuar një restorant:</p>
    <ul>
      <li>Regjistrim porosish dhe menaxhim tavolinash</li>
      <li>Printim faturash dhe kuponash fiskalë</li>
      <li>Meny me kategori dhe produkte të pakufizuara</li>
      <li>Raporte bazë ditore të shitjeve</li>
      <li>Funksionim offline me sync</li>
      <li>Mbështetje për shqipen dhe monedhat lokale (EUR, ALL, MKD)</li>
    </ul>
    <p>Revolution POS ofron një plan fillestar falas që përfshin këto funksionalitete bazë — pa kërkuar kartë krediti dhe pa kufizim artificial 14-ditor që ju detyron të paguani menjëherë.</p>

    <h2>Kostot e fshehura që duhet t'i keni parasysh</h2>
    <p>Shumë "POS falas" në treg kthehen shpejt në të paguara. Këto janë kostot e zakonshme të fshehura:</p>
    <ul>
      <li><strong>Tarifa për pajisje:</strong> Kërkojnë blerjen e hardware të shtrenjtë të tyre</li>
      <li><strong>Komision mbi transaksionet:</strong> Përqindje nga çdo pagesë me kartë</li>
      <li><strong>Funksionalitete të mbyllura:</strong> Stoku, analitika, raportet ATK — vetëm me plan premium</li>
      <li><strong>Kufizim i stafit:</strong> Vetëm 1-2 përdorues falas, çdo tjetër me pagesë</li>
      <li><strong>Support i kufizuar:</strong> Ndihmë vetëm me email, pa mbështetje në shqip</li>
    </ul>
    <p>Para se të zgjidhni, lexoni me kujdes termat dhe pyesni drejtpërdrejt: çfarë kushton pas 3, 6 dhe 12 muajsh?</p>

    <h2>Pse restorantet shqipfolëse kanë nevojë të veçanta</h2>
    <p>Programet POS të importuara nga SHBA ose Europa Perëndimore shpesh nuk mbështesin:</p>
    <ul>
      <li>Raportimin ndaj ATK-së (Kosovë) ose organeve tatimore lokale</li>
      <li>Monedhat dhe formatet e faturës lokale</li>
      <li>Menyra tradicionale shqiptare me porosi komplekse</li>
      <li>Integrim me furnizuesit dhe distributorët lokalë</li>
    </ul>
    <p>Revolution POS është ndërtuar duke e pasur parasysh këtë kontekst. Gjuha shqipe, formatet e faturës dhe raportet për organet tatimore janë pjesë e platformës — jo shtesë me pagesë.</p>

    <h2>Kur ka vlerë të kalosh në plan të paguar</h2>
    <p>Plani falas është ideal për të filluar: kafene të vogla, food truck, restorante me 1-2 tavolina. Kur biznesi rritet, planet e paguara shtojnë analitikë të avancuar, menaxhim multi-lokacion, integrime me delivery dhe raporte të personalizuara. Kalimi është i qetë — të dhënat tuaja migrohen automatikisht, pa humbje.</p>

    <h2>Si të filloni falas me Revolution POS</h2>
    <p>Regjistrimi zgjat më pak se 5 minuta. Krijoni llogarinë, shtoni menynë (ose skanoni me AI), dhe filloni të merrni porosi të sotme. Nuk keni nevojë për instalim kompleks — funksionon në tablet, telefon dhe kompjuter. Nëse keni pyetje, ekipi ynë ofron mbështetje në shqip.</p>
    <p>POS falas nuk do të thotë POS i dobët. Me Revolution POS, merrni një sistem profesional pa rrezik financiar — dhe rriteni kur jeni gati. Provoni sot dhe shihni ndryshimin në operacionet e restorantit tuaj.</p>
  `,"5-arsye-pos":`
    <p>Nëse drejtoni një restorant, kafene ose bar në Kosovë, Shqipëri ose Maqedoni dhe ende nuk përdorni sistem POS, po humbisni kohë, para dhe klientë çdo ditë. Shumë pronarë mendojnë se POS-i është vetëm për biznese të mëdha, por realiteti është kundërt: restorantet e vogla dhe mesme përfitojnë më shumë nga automatizimi. Ja pesë arsyet kryesore pse çdo restorant ka nevojë për POS — edhe ai me tre tavolina.</p>

    <h2>1. Shpejtësi dhe saktësi në porosi</h2>
    <p>Porositë e shkruara me dorë ose thënë me gojë krijojnë gabime: produkte të harruara, alergji të injoruara, porosi të dyfishta. Me Revolution POS, stafi zgjedh produktet me prekje, shton shënime (pa qepë, ekstra djathë) dhe porosia shkon direkt në kuzhinë. Koha mesatare e marrjes së porosisë bie nga 3-4 minuta në më pak se 30 sekonda.</p>
    <p>Për restorantet me fluks të lartë — si ato në qendër të Prishtinës, bulevardin e Tiranës ose pazarit e Shkupit — kjo do të thotë shumë më shumë klientë të shërbyer në të njëjtin orar.</p>

    <h2>2. Kontroll i stokut dhe reduktim i humbjeve</h2>
    <p>Pa sistem, nuk e dini saktësisht sa produkte keni, sa shitet çdo ditë dhe ku humbasin paratë. POS-i regjistron çdo shitje dhe zbrit stokun automatikisht. Shihni në kohë reale kur mbaron mielli, kafeja ose pijet — para se të refuzoni klientë.</p>
    <p>Restorantet që kalojnë në POS zakonisht reduktojnë humbjet e stokut me 15-25% në muajt e parë. Kjo është kursim i drejtpërdrejtë që paguan koston e sistemit.</p>

    <h2>3. Raporte dhe vendime bazuar në të dhëna</h2>
    <p>Çfarë shet më shumë? Cili staf ka performancën më të mirë? Cilat orë janë më fitimprurëse? Pa POS, këto janë supozime. Me Revolution POS, raportet ditore, javore dhe mujore ju tregojnë numrat e vërtetë.</p>
    <ul>
      <li>Produktet më të shitura dhe më pak të shitura</li>
      <li>Shitjet sipas orës, ditës dhe stafit</li>
      <li>Marzhi i fitimit sipas kategorisë</li>
      <li>Krahasimi i performancës mes periudhave</li>
    </ul>
    <p>Këto të dhëna ju ndihmojnë të optimizoni menynë, orarin e stafit dhe promovimet.</p>

    <h2>4. Përputhshmëri fiskale dhe raportim ATK</h2>
    <p>Restorantet në Kosovë duhet të raportojnë ndaj ATK-së. Faturat manuale ose regjistrimet e paplota krijojnë rrezik auditimi dhe gjoba. Revolution POS gjeneron fatura fiskale, librat kontabël dhe raportet e nevojshme automatikisht — duke ju kursyer orë pune dhe duke reduktuar rrezikun ligjor.</p>
    <p>Në Shqipëri dhe Maqedoni, sistemi adapt adaptohet për kërkesat lokale të faturimit dhe tatimit — pa nevojë për softuer të veçantë kontabiliteti.</p>

    <h2>5. Përvojë më e mirë për klientin</h2>
    <p>Klientët modernë presin shërbim të shpejtë, fatura të qarta dhe mundësi pagese fleksibël (kartë, cash, split bill). POS-i mundëson të gjitha këto. Porositë e klientëve direkt nga telefoni, meny digjitale me QR, dhe ndarja e faturës pa konfuzion — janë funksionalitete që rrisin kënaqësinë dhe kthimin e klientëve.</p>
    <p>Restorantet që investojnë në teknologji janë ato që mbijetojnë dhe rriten. POS-i nuk është shpenzim — është investim në eficiencë, saktësi dhe rritje afatgjatë.</p>

    <h2>Filloni sot me Revolution POS</h2>
    <p>Nuk keni nevojë të prisni sezoni i ri ose renovim. Revolution POS instalohet në minuta, funksionon offline, dhe ka plan fillestar falas. Nëse drejtoni një restorant në rajonin shqipfolës, tani është koha e duhur për të kaluar nga menaxhimi manual te sistemi modern. Kontaktoni ekipin tonë ose regjistrohuni online — transformimi i restorantit tuaj fillon me një klik.</p>
  `,"porosite-klienteve":`
    <p>Scenari i njohur: klienti thërret kamarierin tre herë për të porositur, kamarieri harron një pjatë, kuzhina merr porosi të gabuar, dhe klienti pret 20 minuta më shumë. Në restorantet e Kosovës, Shqipërisë dhe Maqedonisë, ku shërbimi personal është i rëndësishëm, kjo nuk është vetëm shqetësim operativ — është humbje klientësh dhe reputacioni. Zgjidhja? Lërini klientët të porosisin direkt nga telefoni i tyre.</p>

    <h2>Si funksionon porosia nga telefoni i klientit</h2>
    <p>Me Revolution POS, çdo tavolinë ka një QR code unik. Klienti skanon kodin me telefonin, hap menynë digjitale të restorantit dhe zgjedh produktet — pa aplikacion, pa regjistrim. Porosia shkon direkt në sistem: kuzhina e sheh menjëherë, kamarieri merr njoftim, dhe stoku përditësohet automatikisht.</p>
    <p>Klienti mund të shtojë shënime (pa speca, ekstra salcë), të shohë çmimin total në kohë reale dhe të dërgojë porosinë me një klik. Nuk ka nevojë të presë kamarierin — veçanërisht e dobishme në orët e pikut.</p>

    <h2>Përfitimet për restorantin</h2>
    <ul>
      <li><strong>Më pak gabime:</strong> Porosia shkruhet nga klienti — nuk ka keqkuptim verbal</li>
      <li><strong>Staf i fokusuar:</strong> Kamarierët fokusohen te shërbimi dhe prezantimi, jo te marrja e porosive</li>
      <li><strong>Shpejtësi:</strong> Porositë arrijnë në kuzhinë 40-60% më shpejt</li>
      <li><strong>Upselling:</strong> Meny digjitale sugjeron produkte shtesë (pije, ëmbëlsira) automatikisht</li>
      <li><strong>Statistika:</strong> Shihni cilat produkte porosisin më shumë klientët direkt</li>
    </ul>

    <h2>Përfitimet për klientin</h2>
    <p>Klientët modernë — veçanërisht brezat më të rinj në Prishtinë, Tiranë dhe Shkup — preferojnë autonomi. Ata duan të shohin menynë me foto, çmime të qarta dhe të porosisin pa presion. Porosia nga telefoni u jep këtë kontroll, ndërkohë që ruajnë përvojën e ngrënies në restorant (jo delivery).</p>
    <p>Funksionaliteti është ideal edhe për klientë me alergji ose kufizime dietike — shënimet specifike shkruhen qartë, pa rrezik keqkuptimi.</p>

    <h2>Implementimi praktik</h2>
    <p>Revolution POS e bën implementimin të thjeshtë:</p>
    <ol>
      <li>Printoni QR code për çdo tavolinë (ose vendosni stendë në tavolinë)</li>
      <li>Meny digjitale krijohet automatikisht nga menuja ekzistuese në POS</li>
      <li>Stafi trajnohet për 15 minuta — sistemi është intuitiv</li>
      <li>Klientët skanojnë dhe porosisin — pa asnjë hap shtesë</li>
    </ol>
    <p>Nuk keni nevojë për Wi-Fi të shpejtë — menyja ngarkohet shpejt edhe me lidhje mobile. Porositë funksionojnë edhe offline dhe sinkronizohen automatikisht.</p>

    <h2>Restorante që fitojnë më shumë</h2>
    <p>Restorantet me self-service të pjesshëm (porosi nga klienti + shërbim kamarieri) raportojnë rritje mesatare 12-18% në vlerën e porosisë. Klientët porosisin më shpesh pije dhe ëmbëlsira kur shohin menynë digjitale me foto — pa u ndjerë sikur po u "sheset" nga stafi.</p>
    <p>Në tarraca dhe zona me shumë tavolina, kjo redukton ngarkesën e stafit ndjeshëm. Një kamarier mund të mbulojë 6-8 tavolina në vend të 4-5, pa ulur cilësinë e shërbimit.</p>

    <h2>Filloni me Revolution POS</h2>
    <p>Porositë e klientëve direkt nga telefoni nuk janë luks — janë standardi i ri për restorantet që duan të rriten. Revolution POS e ofron këtë funksionalitet të integruar, pa kosto shtesë për aplikacion të veçantë klienti. Aktivizoni sot dhe jepuni klientëve tuaj kontrollin që kërkojnë — ndërkohë që optimizoni operacionet e restorantit.</p>
  `},X={"meny-digjitale-qr":`
    <p>Menytë e printuara po bëhen të kaluara. Në Kosovë, Shqipëri dhe Maqedoni, restorantet po kalojnë në meny digjitale me QR code — një zgjidhje e thjeshtë, ekonomike dhe higjienike që klientët e kanë adoptuar shpejt pas pandemisë. Në vend që të printoni menu të re çdo muaj kur ndryshojnë çmimet, një QR code në tavolinë hap menynë e përditësuar automatikisht në telefonin e klientit.</p>

    <h2>Çfarë është meny digjitale me QR code</h2>
    <p>QR code është një kod katror që klienti skanon me kamerën e telefonit. Pa aplikacion, pa regjistrim — hapet menjëherë menuja e restorantit në browser. Menyja përfshin kategori, produkte, përshkrime, çmime dhe foto. Kur ndryshoni një çmim ose shtoni produkt të ri në Revolution POS, meny digjitale përditësohet automatikisht — pa riprintim.</p>

    <h2>Përfitimet për restorantin</h2>
    <ul>
      <li><strong>Kursim kostosh:</strong> Nuk paguani printim menu çdo muaj — veçanërisht kur çmimet ndryshojnë shpesh</li>
      <li><strong>Përditësim i menjëhershëm:</strong> Produkt i ri sot? Shfaqet në meny brenda minutave</li>
      <li><strong>Foto produktesh:</strong> Klientët shohin çfarë porosisin — rrit shitjet 15-20%</li>
      <li><strong>Multi-gjuhë:</strong> Meny në shqip, anglisht, maqedonisht — me një klik</li>
      <li><strong>Higjienë:</strong> Pa menu fizike që preken nga shumë klientë</li>
      <li><strong>Mjedis:</strong> Më pak letër, më pak mbeturina</li>
    </ul>

    <h2>Përfitimet për klientin</h2>
    <p>Klientët në Prishtinë, Tiranë, Shkup dhe qytete të tjera janë të familiarizuar me QR code. Ata e vlerësojnë:</p>
    <ul>
      <li>Shpejtësinë — menuja hapet në 2 sekonda</li>
      <li>Qartësinë — çmime të dukshme, pa surpriza</li>
      <li>Fotot — shohin pjatën para se të porosisin</li>
      <li>Autonominë — lexojnë me qetësi, pa presion nga stafi</li>
    </ul>

    <h2>Si ta implementoni në 30 minuta</h2>
    <ol>
      <li>Krijoni menynë në Revolution POS (ose skanoni menynë ekzistuese me AI)</li>
      <li>Sistemi gjeneron QR code unik për restorantin tuaj</li>
      <li>Printoni QR code në stendë tavoline ose ngjitni në tavolinë</li>
      <li>Testoni me telefonin tuaj — menuja duhet të hapet menjëherë</li>
    </ol>
    <p>Revolution POS ofron edhe QR code për tavolina individuale — kështu porositë lidhen automatikisht me numrin e tavolinës.</p>

    <h2>Meny + porosi direkte</h2>
    <p>Meny digjitale nuk është vetëm për lexim. Me Revolution POS, klienti skanon QR, shikon menynë dhe porosit direkt — porosia shkon në kuzhinë pa ndërhyrje kamarieri. Kjo kombinon rehatinë e menusë digjitale me eficiencën e porosive automatike.</p>
    <p>Për restorante që preferojnë shërbim tradicional, meny digjitale funksionon edhe si "menu vetëm lexim" — klienti shikon, porosit me gojë te kamarieri. Fleksibiliteti është në duar tuaja.</p>

    <h2>Rastet më të mira përdorimi</h2>
    <p>Meny digjitale me QR është ideale për:</p>
    <ul>
      <li>Restorante me menu sezonale që ndryshon shpesh</li>
      <li>Kafene me shumë variante pijesh dhe ëmbëlsirash</li>
      <li>Bare me menu të gjata koktejsh</li>
      <li>Restorante turistike me nevojë multi-gjuhë</li>
      <li>Fast food me combo dhe opsione personalizimi</li>
    </ul>

    <h2>Filloni sot</h2>
    <p>Revolution POS e përfshin menynë digjitale me QR code si pjesë e platformës — pa kosto shtesë, pa aplikacion të veçantë. Krijoni menynë, printoni QR code, dhe jeni gati. Nëse restoranti juaj ende printon menu çdo muaj, koha për të kaluar në digital është tani.</p>
  `,"skanoni-menyne-me-ai":`
    <p>Shtimi manual i produkteve në sistem POS është një nga proceset më të lodhshme për pronarët e restoranteve. Imagjinoni: 80 produkte, secili me emër, çmim, kategori dhe përshkrim — futje një e njëshme që zgjat orë. Revolution POS e zgjidh këtë me skanim AI: fotografoni menynë tuaj të printuar dhe sistemi krijon automatikisht produktet — 50 artikuj në 2 minuta.</p>

    <h2>Si funksionon skanimi me AI</h2>
    <p>Procesi është i thjeshtë:</p>
    <ol>
      <li>Hapni Revolution POS dhe zgjidhni "Skano Menynë"</li>
      <li>Fotografoni menynë tuaj — faqe letre, libër menu, ose ekran</li>
      <li>AI lexon tekstin, njeh produktet, çmimet dhe kategoritë</li>
      <li>Rishikoni listën e krijuar — korrigjoni nëse nevojitet</li>
      <li>Konfirmoni — produktet shtohen në sistem automatikisht</li>
    </ol>
    <p>Teknologjia e njohjes optike (OCR) e kombinuar me AI kupton edhe formatet e menusë shqiptare — p.sh. "Pleskavicë me pomfrit — 4.50€" ose "Kafe americano 150 ALL".</p>

    <h2>Kur është veçanërisht i dobishëm</h2>
    <ul>
      <li><strong>Migrimi nga POS i vjetër:</strong> Kaloni në Revolution pa futje manuale</li>
      <li><strong>Restorante të reja:</strong> Filloni shpejt me menu ekzistuese pa orë futjeje manuale</li>
      <li><strong>Menu sezonale:</strong> Skanoni menynë e re çdo sezon</li>
      <li><strong>Multi-lokacion:</strong> Kopjoni menu nga një degë tjetër me skanim</li>
      <li><strong>Furnizues me katalog:</strong> Skanoni listën e çmimeve nga furnizuesi</li>
    </ul>

    <h2>Saktësia dhe kontrolli</h2>
    <p>AI nuk zëvendëson kontrollin tuaj — e përshpejton. Pas skanimit, shfaqet lista e produkteve të njohura me mundësi për të:</p>
    <ul>
      <li>Korrigjuar emra ose çmime</li>
      <li>Shtuar foto produktesh</li>
      <li>Grupuar në kategori (pjata kryesore, pije, ëmbëlsira)</li>
      <li>Fshirë artikuj të gabuar</li>
    </ul>
    <p>Shumica e restoranteve konfirmojnë 90%+ të produkteve pa ndryshime. Kurseni orë pune dhe filloni të shisni të sotmen.</p>

    <h2>Skanim faturash dhe stok</h2>
    <p>E njëjta teknologji funksionon edhe për faturat e furnizuesve. Skanoni faturën hyrëse — AI njeh produktet, sasinë dhe çmimin, dhe përditëson stokun automatikisht. Kjo eliminon futjen manuale të faturave që zakonisht zgjat 30-60 minuta çdo ditë.</p>

    <h2>Për restorantet shqipfolëse</h2>
    <p>Revolution POS mbështet skanimin e menusë në shqip — me karaktere speciale (ë, ç), formate çmimesh lokale (€, ALL, MKD) dhe struktura tipike të menusë shqiptare. Nuk keni nevojë të adapt menu për sistem të huaj — sistemi adapt adaptohet për ju.</p>
    <p>Restorantet në Kosovë, Shqipëri dhe Maqedoni që kanë kaluar në Revolution POS raportojnë se setup-i i menusë zgjat 10-15 minuta në vend të 4-6 orëve me futje manuale.</p>

    <h2>Provoni skanimin me AI sot</h2>
    <p>Nëse po shtyni migrimin në POS për shkak të lodhjes së setup-it, skanimi me AI e eliminon këtë pengesë. Regjistrohuni në Revolution POS, skanoni menynë tuaj, dhe filloni të merrni porosi brenda minutave. Teknologjia punon për ju — ju fokusoheni te restoranti.</p>
  `,"stoku-menaxhimi-inventarit":`
    <p>Humbja e produkteve, mungesat e papritura dhe stoku i tepërt janë probleme kronike në restorantet e Kosovës, Shqipërisë dhe Maqedonisë. Pa sistem të strukturuar inventari, pronarët zbulojnë humbjet vetëm në fund të muajit — kur është shumë vonë. Menaxhimi i duhur i stokut nuk kërkon magji — kërkon proces, të dhëna dhe mjete të duhura. Revolution POS ju jep të treja.</p>

    <h2>Pse humbasin restorantet para në stok</h2>
    <p>Arsyet më të zakonshme të humbjes së inventarit:</p>
    <ul>
      <li><strong>Mungesa regjistrimi:</strong> Produktet hyjnë por nuk regjistrohen në sistem</li>
      <li><strong>Skadim:</strong> Porosi tepër e madhe — produktet skadojnë para se të shiten</li>
      <li><strong>Vjedhje e brendshme:</strong> Pa tracking, humbjet nuk identifikohen</li>
      <li><strong>Receta të pasakta:</strong> Nuk e dini saktësisht sa lëndë duhet për çdo pjatë</li>
      <li><strong>Numërim i rrallë:</strong> Inventari fizik bëhet vetëm një herë në vit</li>
    </ul>
    <p>Çdo problem zgjidhet me sistem POS që regjistron lëvizjet automatikisht dhe ju alarmon kur diçka nuk shkon.</p>

    <h2>Praktika efektive të menaxhimit</h2>
    <h3>1. Vendosni nivele minimale</h3>
    <p>Për çdo produkt kritik (miell, vaj, mish, pije), vendosni nivel minimal. Kur stoku bie nën këtë nivel, Revolution POS ju njofton automatikisht — para se të mbaroni gjatë orarit të ngrënies.</p>

    <h3>2. Lidhni stokun me shitjet</h3>
    <p>Çdo porosi e regjistruar zbrit automatikisht lëndët e para sipas recetës. Nëse shet 10 hamburgerë, sistemi zbrit 10 bukë, 10 mish, 10 djathë — pa numërim manual.</p>

    <h3>3. Regjistroni faturat hyrëse</h3>
    <p>Skanoni ose futni faturat e furnizuesve — stoku përditësohet automatikisht. Kjo garanton që numrat në sistem përputhen me realitetin në depo.</p>

    <h3>4. Bëni inventar të rregullt</h3>
    <p>Numërimi javor ose ditor i produkteve kryesore zbulon mospërputhjet herët. Revolution POS krahaso stokun e regjistruar me numërimin fizik dhe raporton diferencat.</p>

    <h2>Raportet që duhet t'i monitoroni</h2>
    <ul>
      <li><strong>Konsumi ditor:</strong> Sa shitet çdo produkt — identifikoni trendet</li>
      <li><strong>Produktet me rotacion të ulët:</strong> Çfarë mbetet në stok shumë kohë</li>
      <li><strong>Humbjet:</strong> Diferenca mes stokut të regjistruar dhe fizik</li>
      <li><strong>Kostoja e lëndëve:</strong> Sa ju kushton çdo pjatë — marzhi real i fitimit</li>
    </ul>

    <h2>Stoku për restorante me menu të ndryshme</h2>
    <p>Restorantet shqiptare kanë shpesh menu të gjera — qoftë tradicionale (tavë kosi, flija, pleskavicë) apo internacionale. Revolution POS mbështet receta komplekse: një pjatë mund të përbëhet nga 15+ lëndë të para, secila me njësi matjeje të ndryshme (gram, litër, copë).</p>
    <p>Për restorante me sezonalitet (turistë verorë, festa), raportet historike ju ndihmojnë të planifikoni stokun për periudhat e ardhshme — bazuar në të dhëna, jo supozime.</p>

    <h2>Rezultatet e pritshme</h2>
    <p>Restorantet që implementojnë menaxhim të strukturuar të stokut zakonisht:</p>
    <ul>
      <li>Reduktojnë humbjet me 15-30% në 3 muaj</li>
      <li>Eliminojnë mungesat e papritura gjatë orarit të pikut</li>
      <li>Optimizojnë porositë ndaj furnizuesve — jo më tepricë ose mungesë</li>
      <li>Kuptojnë marzhin real të fitimit për çdo pjatë</li>
    </ul>

    <h2>Filloni me Revolution POS</h2>
    <p>Menaxhimi i stokut pa humbje fillon me regjistrim automatik dhe raporte të qarta. Revolution POS integron stokun me shitjet, faturat dhe recetat — gjithçka në një vend. Nëse restoranti juaj ende numëron stokun me dorë ose e zbulon humbjen në fund të muajit, koha për ndryshim është tani.</p>
  `,"zbritjet-ne-restorante":`
    <p>Zbritjet dhe ofertat janë armë të dyfishtë: ose rrisin shitjet dhe tërheqin klientë të rinj, ose ulin marzhin pa asnjë përfitim. Shumë restorante në Kosovë, Shqipri dhe Maqedoni aplikojnë zbritje pa strategji — "10% ulje" pa plan, pa matje, pa limit. Rezultati? Fitim më i ulët dhe klientë që vijnë vetëm kur ka ofertë. Si të përdorni zbritjet në mënyrë të zgjuar?</p>

    <h2>Llojet e zbritjeve që funksionojnë</h2>
    <ul>
      <li><strong>Happy hour:</strong> Zbritje në orë me fluks të ulët (15:00-17:00) — mbushni tavolinat</li>
      <li><strong>Combo / menu ditore:</strong> Pjata + pije me çmim të preferuar — rrit vlerën e porosisë</li>
      <li><strong>Zbritje për stok:</strong> Produktet që skadojnë së shpejti — shitni me çmim të reduktuar</li>
      <li><strong>Program besnikërie:</strong> Klientët e rregullt marrin zbritje — jo të gjithë</li>
      <li><strong>Oferta sezonale:</strong> Menu verore, oferta iftari, promovime festive</li>
    </ul>

    <h2>Gabimet që duhen shmangur</h2>
    <p><strong>Zbritje e përgjithshme pa limit:</strong> "20% ulje për të gjithë" ulet marzhin për klientët që do të paguanin çmim të plotë. Përdorni kode ose kushte specifike.</p>
    <p><strong>Zbritje pa matje:</strong> Nëse nuk e dini sa shitje solli oferta, nuk e dini nëse funksionoi. Revolution POS regjistron çdo zbritje me arsye — raportoni efektin.</p>
    <p><strong>Zbritje të përhershme:</strong> Klientët e mësojnë çmimin e ulët si "normal" — e vështirë të ktheheni te çmimi i plotë.</p>

    <h2>Si të aplikoni zbritje me Revolution POS</h2>
    <p>Sistemi ofron fleksibilitet të plotë:</p>
    <ul>
      <li>Zbritje përqindje ose shumë fikse për produkt, kategori ose porosi totale</li>
      <li>Happy hour automatik — zbritja aktivizohet vetëm në orët e caktuara</li>
      <li>Kupon kodi — klienti fut kodin për zbritje</li>
      <li>Autorizim menaxheri — zbritje mbi limit kërkojnë aprovim</li>
      <li>Raport zbritjesh — shihni sa u zbrit, nga kush, për çfarë</li>
    </ul>

    <h2>Strategji për restorante shqipfolëse</h2>
    <p><strong>Menu ditore:</strong> Tradita e "gjellës së ditës" me çmim preferencial — e njohur dhe e vlerësuar. Regjistroni si combo në POS për tracking.</p>
    <p><strong>Oferta familjare:</strong> Tavolina të mëdha me menu për 4-6 persona — rrit vlerën mesatare të porosisë.</p>
    <p><strong>Promovime festive:</strong> Bajram, Viti i Ri, 8 Mars — oferta tematike me kohë të kufizuar.</p>
    <p><strong>Partneritete lokale:</strong> Zbritje për punonjës të kompanive fqinje — rrit klientelën në ditët e javës.</p>

    <h2>Matja e suksesit</h2>
    <p>Para se të lançoni ofertë, vendosni objektivin: rritje e fluksit? Shitje produktesh specifike? Tërheqje klientësh të rinj? Pas kampanjës, analizoni:</p>
    <ul>
      <li>Sa porosi u bënë me zbritje</li>
      <li>Vlera mesatare e porosisë me vs pa zbritje</li>
      <li>A u rrit numri total i klientëve</li>
      <li>Marzhi neto pas zbritjes</li>
    </ul>
    <p>Revolution POS ju jep këto raporte automatikisht — vendime bazuar në numra, jo ndjenja.</p>

    <h2>Zbritje të zgjuara, fitim i qëndrueshëm</h2>
    <p>Zbritjet nuk janë armë e fundit — janë mjet marketingu. Përdorini me strategji, matini rezultatet, dhe optimizoni. Me Revolution POS, keni kontroll të plotë mbi ofertat — pa chaos, pa humbje marzhi. Filloni me një happy hour ose menu ditore, matni efektin, dhe rriteni nga aty.</p>
  `,"analitika-ne-restorante":`
    <p>Shumë pronarë restorantesh në Kosovë, Shqipëri dhe Maqedoni marrin vendime bazuar në ndjenja: "Duket se sot shitem mirë" ose "Kjo pjatë nuk shitet". Pa të dhëna, këto janë supozime — dhe supozimet kushtojnë para. Analitika në restorante transformon operacionet nga reaktive në proaktive: shihni çfarë ndodh, ku humbasin paratë, dhe çfarë duhet ndryshuar.</p>

    <h2>Çfarë është analitika e restorantit</h2>
    <p>Analitika do të thotë mbledhja, analiza dhe vizualizimi i të dhënave të biznesit tuaj: shitje, kosto, stok, staf, klientë. Revolution POS regjistron automatikisht çdo transaksion dhe ju ofron raporte të gatshme — pa Excel, pa llogaritje manuale.</p>

    <h2>Raportet kryesore që duhet t'i monitoroni</h2>
    <h3>1. Shitjet ditore dhe javore</h3>
    <p>Sa fituat sot? Krahasuar me të mërkurën e kaluar? Me të njëjtën ditë vitin e kaluar? Trendet ju tregojnë nëse biznesi rritet apo bie.</p>

    <h3>2. Produktet më të shitura</h3>
    <p>Cilat pjata, pije dhe ëmbëlsira sjellin më shumë të ardhura? Fokusoni stokun dhe promovimin te produktet fitimprurëse. Identifikoni edhe produktet që nuk shiten — ndoshta duhen hequr nga menuja.</p>

    <h3>3. Orët e pikut</h3>
    <p>Kur vijnë më shumë klientë? Planifikoni stafin dhe stokun sipas këtyre orareve. Nëse dreka është e mbushur por darka e zbrazët, investoni në marketing për orën e darkës.</p>

    <h3>4. Performanca e stafit</h3>
    <p>Kush shet më shumë? Kush ka vlerën mesatare më të lartë të porosisë? Këto të dhëna ndihmojnë në trajnim, bonuse dhe planifikim turnesh — jo për të ndëshkuar, por për të optimizuar.</p>

    <h3>5. Marzhi i fitimit</h3>
    <p>Çmimi i shitjes minus kostoja e lëndëve — marzhi real për çdo pjatë. Disa pjata shiten shumë por fitojnë pak; të tjera kanë marzh të lartë por shiten rrallë. Analitika ju tregon ku të fokusoheni.</p>

    <h2>Nga të dhënat te vendime</h2>
    <p>Shembuj praktikë:</p>
    <ul>
      <li><strong>Menu:</strong> Heqni produktet me shitje &lt;5% — thjeshtoni operacionet</li>
      <li><strong>Çmime:</strong> Rritni çmimin e produkteve me kërkesë të lartë dhe marzh të mirë</li>
      <li><strong>Stok:</strong> Porositni më shumë të produkteve që shiten në fundjavë</li>
      <li><strong>Staf:</strong> Shtoni kamarier në të shtunë 19:00-21:00 — ora me fluks maksimal</li>
      <li><strong>Promovime:</strong> Oferta happy hour në orën 15:00-17:00 — mbushni tavolinat e zbrazëta</li>
    </ul>

    <h2>Analitika për restorante multi-lokacion</h2>
    <p>Nëse keni më shumë se një degë — p.sh. në Prishtinë dhe Prizren, ose Tiranë dhe Durrës — Revolution POS ju lejon të krahasoni performancën mes lokacioneve. Cila degë shet më shumë? Ku janë kostot më të larta? Vendime centralizuar me të dhëna lokale.</p>

    <h2>Privatësia dhe siguria</h2>
    <p>Të dhënat tuaja janë tuajat. Revolution POS i ruan të enkriptuara dhe nuk i ndan me palë të treta. Raportet janë të aksesueshme vetëm për ju dhe menaxherët e autorizuar — me nivele të ndryshme aksesi sipas rolit.</p>

    <h2>Filloni të merrni vendime me numra</h2>
    <p>Analitika nuk kërkon ekspertizë teknike. Revolution POS e bën të thjeshtë: hapni panelin, zgjidhni raportin, shihni grafikët. Nëse restoranti juaj ende merr vendime "me sy", koha për të kaluar te të dhënat është tani. Regjistrimi juaj fillon të mbledhë informacion që ditën e parë — çdo porosi, çdo pagesë, çdo zbritje. Pas një jave, do të keni insight që më parë nuk i kishit.</p>
  `},ee={"bashko-tavolina":`
    <p>Grupet e mëdha — familje, kolegë, festa — janë klientë me vlerë të lartë për restorantet. Por kur duhet të kombinohen dy ose tre tavolina, ose kur klientët kalojnë nga një tavolinë në tjetrën, porositë shpesh bëhen kaotike. Kuzhina merr porosi të ndara, faturat ndahen gabim, dhe stafi humbet kohë duke koordinuar manualisht. Funksionaliteti "Bashko Tavolina" i Revolution POS e zgjidh këtë — pa ndërprerje, pa konfuzion.</p>

    <h2>Çfarë do të thotë bashkimi i tavolinave</h2>
    <p>Bashkimi i tavolinave nënkupton që dy ose më shumë tavolina trajtohen si një e vetme për porosi dhe faturim. Porositë nga të gjitha tavolinat e bashkuara shfaqen në një listë të unifikuar — kuzhina i sheh si një porosi grupi, jo si porosi të shpërndara. Në fund, fatura mund të ndahet (split bill) ose të paguhet si e vetme.</p>

    <h2>Kur përdoret</h2>
    <ul>
      <li><strong>Grup familjar:</strong> 12 persona në dy tavolina — një porosi, një faturë (ose split)</li>
      <li><strong>Event korporativ:</strong> Kompania rezervon 4 tavolina — menaxhim i centralizuar</li>
      <li><strong>Festa:</strong> Ditelindje, fejesa — porosi të vazhdueshme pa humbje</li>
      <li><strong>Klient që zgjeron:</strong> Tavolina 5 bashkohet me tavolinën 6 kur vijnë miqtë</li>
    </ul>

    <h2>Si funksionon në Revolution POS</h2>
    <ol>
      <li>Zgjidhni tavolinat që dëshironi të bashkoni (p.sh. Tavolina 3 + 4)</li>
      <li>Sistemi krijon një "grup tavolinash" — porositë regjistrohen nën të njëjtin grup</li>
      <li>Kuzhina merr porosi të unifikuara me numrin e tavolinës së origjinës</li>
      <li>Në fund, zgjidhni: faturë e vetme ose ndarje (split bill) sipas nevojës</li>
      <li>Kur grupi largohet, ndani tavolinat — secila kthehet në status normal</li>
    </ol>

    <h2>Përfitimet operacionale</h2>
    <p><strong>Për kuzhinën:</strong> Porosi të qarta, pa dyfishime, pa porosi të harruara. Shefi i kuzhinës sheh grupin si një porosi — prioritet i qartë.</p>
    <p><strong>Për kamarierin:</strong> Një ekran për të gjithë grupin — nuk lëviz mes tavolinave me fletore. Shton porosi, shikon totalin, printon faturë — gjithçka nga një vend.</p>
    <p><strong>Për klientin:</strong> Shërbim më i shpejtë, faturë e qartë, ndarje e lehtë kur paguajnë veç e veç.</p>

    <h2>Bashko + Split Bill</h2>
    <p>Kombinimi i bashkimit të tavolinave me split bill është i fuqishëm. Grupi porosit së bashku, por në fund secili paguan pjesën e vet — pa llogaritje manuale, pa debate. Revolution POS ndan faturën automatikisht sipas produkteve ose përqindjes.</p>

    <h2>Scenarë në restorante shqipfolëse</h2>
    <p>Restorantet tradicionale shqiptare shpesh marrin grupe të mëdha — familje për drekë të dielës, dasma, fejesa. Pa sistem, koordinimi është stresues. Me Bashko Tavolina, stafi fokusohet te shërbimi, jo te logjistika. Në Prishtinë, Tiranë dhe Shkup, restorantet me kapacitet 80+ vende e konsiderojnë këtë funksionalitet thelbësor.</p>

    <h2>Provoni sot</h2>
    <p>Bashko Tavolina është i integruar në Revolution POS — pa modul shtesë, pa konfigurim kompleks. Hapni planin e tavolinave, zgjidhni tavolinat, dhe bashkoni. Grupi juaj i ardhshëm do të shërbehet pa stres — për stafin dhe klientët.</p>
  `,"identifikim-stafi":`
    <p>Kur stafi hyn në sistem POS, duhet të dihet kush po vepron — për raporte, për siguri, për përgjegjësi. Por metoda e identifikimit ndryshon: PIN i shpejtë, kartë RFID, apo fjalëkalim i plotë? Secila ka avantazhe dhe disavantazhe. Ky artikull ju ndihmon të zgjidhni metodën e duhur për restorantin tuaj në Kosovë, Shqipëri ose Maqedoni.</p>

    <h2>PIN — shpejtësi dhe thjeshtësi</h2>
    <p>PIN (numër personal 4-6 shifror) është metoda më e zakonshme në restorante. Stafi fut kodin në tablet ose terminal — hyrje në 2-3 sekonda. Ideal për:</p>
    <ul>
      <li>Staf me rotacion të shpejtë (kamarier, barista)</li>
      <li>Orë piku — hyrje/dalje të shpeshta</li>
      <li>Restorante me shumë punonjës</li>
    </ul>
    <p><strong>Avantazhet:</strong> Shpejt, pa hardware shtesë, lehtë për t'u mësuar.</p>
    <p><strong>Disavantazhet:</strong> PIN mund të ndahet — rrezik nëse dikush tjetër e përdor. Zgjidhja: PIN unik për person, ndryshim periodik, raport i veprimeve sipas përdoruesit.</p>

    <h2>RFID — kartë ose byzylyk</h2>
    <p>RFID përdor kartë ose byzylyk që stafi prek terminalin — identifikim pa futje. Ideal për:</p>
    <ul>
      <li>Restorante me staf të qëndrueshëm</li>
      <li>Kuzhinë me duar të lira (byzylyk RFID)</li>
      <li>Kontroll më i rreptë i aksesit</li>
    </ul>
    <p><strong>Avantazhet:</strong> Shumë i shpejtë, PIN nuk ndahet, kartë e personalizuar.</p>
    <p><strong>Disavantazhet:</strong> Kërkon blerje kartash/byzylykësh, rrezik humbje kartë. Revolution POS mbështet RFID nëse keni lexues të pajtueshëm.</p>

    <h2>Fjalëkalim — siguri maksimale</h2>
    <p>Fjalëkalim i plotë (8+ karaktere) ofron siguri më të lartë. Përdoret për:</p>
    <ul>
      <li>Menaxher dhe pronar — akses në raporte, zbritje, konfigurim</li>
      <li>Operacione sensitive — fshirje porosie, ndryshim çmimesh</li>
    </ul>
    <p><strong>Avantazhet:</strong> Siguri e lartë, vështirë për t'u ndarë.</p>
    <p><strong>Disavantazhet:</strong> Më i ngadaltë — jo praktik për kamarier në orë piku.</p>

    <h2>Cila metodë për çfarë roli</h2>
    <table class="article-table">
      <thead>
        <tr><th>Roli</th><th>Metoda e rekomanduar</th><th>Arsyeja</th></tr>
      </thead>
      <tbody>
        <tr><td>Kamarier / Barista</td><td>PIN</td><td>Shpejtësi, shumë hyrje/dalje</td></tr>
        <tr><td>Kuzhinier</td><td>PIN ose RFID byzylyk</td><td>Duar të lira, mjedis i lagësht</td></tr>
        <tr><td>Menaxher</td><td>Fjalëkalim + PIN</td><td>Siguri për raporte dhe zbritje</td></tr>
        <tr><td>Pronar</td><td>Fjalëkalim</td><td>Akses i plotë, audit trail</td></tr>
      </tbody>
    </table>

    <h2>Audit trail — kush bëri çfarë</h2>
    <p>Pavarësisht metodës, Revolution POS regjistron çdo veprim me identitetin e përdoruesit: kush mori porosinë, kush aplikoi zbritjen, kush fshiu artikullin. Kjo është thelbësore për:</p>
    <ul>
      <li>Zbulimin e gabimeve dhe vjedhjeve</li>
      <li>Trajnimin e stafit — kush ka nevojë për ndihmë</li>
      <li>Përputhshmëri fiskale — gjurmim i plotë i transaksioneve</li>
    </ul>

    <h2>Rekomandimi për restorante shqipfolëse</h2>
    <p>Për shumicën e restoranteve: <strong>PIN për staf operativ, fjalëkalim për menaxher.</strong> Kjo balancë shpejtësi dhe siguri. Nëse keni staf 20+ ose shqetësim për ndarjen e PIN-ave, konsideroni RFID për kuzhinë dhe PIN për salë.</p>
    <p>Revolution POS mbështet të tre metodat — zgjidhni atë që përshtatet me madhësinë dhe stilin e restorantit tuaj. Konfigurimi zgjat minuta, dhe stafi trajnohet brenda ditës së parë.</p>
  `,"librat-kontabel-atk":`
    <p>Restorantet në Kosovë që operojnë si subjekte tregtare duhet të mbajnë libra kontabël dhe të raportojnë ndaj Administratës Tatimore të Kosovës (ATK). Procesi manual — regjistrim faturash, llogaritje TVSH, përgatitje raportesh — zgjat orë çdo muaj dhe krijon rrezik gabimesh. Revolution POS gjeneron librat kontabël automatikisht — duke ju kursyer kohë dhe duke garantuar përputhshmëri.</p>

    <h2>Çfarë janë librat kontabël</h2>
    <p>Librat kontabël janë regjistrime zyrtare të të gjitha transaksioneve financiare të biznesit: shitje, blerje, pagesa, TVSH. ATK kërkon që këto libra të mbahen të saktë, të përditësuara dhe të disponueshme për auditim. Për restorante, kjo përfshin çdo faturë shitjeje dhe blerjeje.</p>

    <h2>Si i gjeneron Revolution POS automatikisht</h2>
    <p>Çdo transaksion i regjistruar në POS — porosi, pagesë, zbritje, faturë hyrëse — krijohet automatikisht në librat kontabël. Nuk keni nevojë të kopjoni manualisht nga fletore ose Excel. Sistemi:</p>
    <ul>
      <li>Regjistron çdo shitje me datë, shumë, TVSH dhe metodë pagese</li>
      <li>Regjistron faturat hyrëse (blerje) me skanim ose futje manuale</li>
      <li>Llogarit TVSH-në automatikisht sipas normës së aplikueshme</li>
      <li>Gjeneron raporte periodike (ditore, javore, mujore)</li>
      <li>Eksporton në format të përshtatshëm për ATK ose kontabilist</li>
    </ul>

    <h2>Përfitimet për pronarin e restorantit</h2>
    <p><strong>Kursim kohe:</strong> Orë pune mujore që shkon te regjistrimi manual — tani automatike.</p>
    <p><strong>Saktësi:</strong> Pa gabime llogaritjeje, pa mospërputhje mes POS dhe librave.</p>
    <p><strong>Audit i lehtë:</strong> Kur ATK kërkon dokumentacion, eksportoni raportin — gati për dorëzim.</p>
    <p><strong>Integrim me kontabilist:</strong> Kontabilisti juaj merr të dhëna të strukturuara — jo fletore të shpërndara.</p>

    <h2>TVSH dhe faturat fiskale</h2>
    <p>Revolution POS llogarit TVSH-në për çdo shitje dhe e regjistron në librat kontabël. Faturat fiskale printohen me të gjitha elementet e kërkuara — numër fiskal, TVSH, total. Për restorante që shesin me TVSH 18% (ose normë tjetër), sistemi e menaxhon automatikisht.</p>

    <h2>Për restorante në Shqipëri dhe Maqedoni</h2>
    <p>Edhe pse kërkesat e ATK-së janë specifike për Kosovën, koncepti i librit kontabël është i njëjtë kudo. Revolution POS adapt raportet për kërkesat lokale — format faturash, norma TVSH, periudha raportimi. Kontaktoni ekipin tonë për detaje specifike për vendin tuaj.</p>

    <h2>Filloni me raportim të saktë</h2>
    <p>Libra kontabël të saktë nuk janë opsion — janë detyrim ligjor. Me Revolution POS, detyra bëhet e lehtë: vazhdoni të punoni normalisht, sistemi regjistron gjithçka. Në fund të muajit, eksportoni raportin dhe dorëzoni te ATK ose kontabilisti. Pa stres, pa gabime, pa orë ekstra.</p>
  `,"raportet-e-restorantit":`
    <p>Numrat tregojnë historinë e vërtetë të restorantit tuaj. Por pa raporte të qarta, ato numra mbeten të fshehura në fletore, kuponë fiskalë dhe mendje. Raportet e restorantit ju japin pamje të plotë mbi shitjet, kostot, stokun dhe performancën — në format të lexueshëm, jo tabela të gjata Excel. Revolution POS ofron raporte të gatshme që çdo pronar mund t'i kuptojë.</p>

    <h2>Raportet thelbësore</h2>
    <h3>1. Raporti ditor i shitjeve</h3>
    <p>Çfarë fituat sot? Sa porosi? Vlera mesatare e porosisë? Metodat e pagesës (cash vs kartë)? Ky raport është i pari që duhet të shihni çdo mbrëmje — 2 minuta që ju tregojnë nëse dita shkoi mirë.</p>

    <h3>2. Raporti i produkteve</h3>
    <p>Cilat pjata, pije dhe ëmbëlsira shiten më shumë? Cilat mbeten në stok? Identifikoni yjet e menusë dhe produktet që duhen hequr ose promovuar.</p>

    <h3>3. Raporti i stokut</h3>
    <p>Çfarë keni në depo? Çfarë po mbaron? Çfarë ka skaduar? Planifikoni blerjet dhe reduktoni humbjet.</p>

    <h3>4. Raporti i stafit</h3>
    <p>Kush shet më shumë? Kush ka vlerën mesatare më të lartë të porosisë? Përdoreni për trajnim dhe bonuse — jo për ndëshkim, por për optimizim.</p>

    <h3>5. Raporti i zbritjeve</h3>
    <p>Sa u zbrit? Nga kush? Për çfarë? Matni efektin e ofertave dhe happy hour.</p>

    <h2>Si t'i lexoni raportet</h2>
    <p>Mos u fokusoni vetëm te totali. Krahasoni:</p>
    <ul>
      <li><strong>Dita e sotme vs e marta e kaluar</strong> — trendi ditor</li>
      <li><strong>Ky muaj vs muaji i kaluar</strong> — rritje apo rënie</li>
      <li><strong>E shtuna vs e diela</strong> — cila ditë fiton më shumë</li>
      <li><strong>Dreka vs darka</strong> — kur planifikoni stafin</li>
    </ul>
    <p>Revolution POS e bën këtë krahasim automatik — grafikë vizualë, jo vetëm numra.</p>

    <h2>Vendime bazuar në raporte</h2>
    <p>Shembuj praktikë nga restorante shqipfolëse:</p>
    <ul>
      <li><strong>Menu:</strong> Raporti tregon që "Tavë kosi" shitet 3x më shumë se "Fli" — rritni stokun e tavë kosit</li>
      <li><strong>Orari:</strong> Shitjet pik në 13:00 dhe 20:00 — shtoni staf 30 min para</li>
      <li><strong>Çmime:</strong> Marzhi i "Pleskavicë" është 45%, i "Sallatës" vetëm 20% — promovoni pleskavicën</li>
      <li><strong>Stok:</strong> "Kafe" mbaron çdo të premte — porositni të enjten</li>
    </ul>

    <h2>Raportet për ATK dhe kontabilitet</h2>
    <p>Përveç raporteve operative, Revolution POS gjeneron raporte për ATK dhe kontabilist: libra kontabël, TVSH, fatura hyrëse/dalëse. Eksportoni me një klik — pa kopjim manual.</p>

    <h2>Filloni të kuptoni biznesin tuaj</h2>
    <p>Raportet nuk janë për ekspertë — janë për pronarë që duan të dinë ku shkojnë paratë. Revolution POS i thjeshton: hapni panelin, zgjidhni raportin, shihni grafikun. Nëse restoranti juaj ende "ndjen" në vend që të "di", koha për raporte është tani. Çdo porosi që regjistroni sot shton të dhëna për raportin e nesërm — filloni të mbledhni, filloni të kuptoni.</p>
  `,"split-bill":`
    <p>Scenari i njohur: tavolinë me 6 persona, secili porosit ndryshe, dhe në fund duhet të ndahet fatura. Pa sistem, kjo bëhet me llogaritje manuale, debate ("unë nuk piva alkool!"), dhe vonesa. Split bill — ndarja e faturës — është funksionalitet thelbësor për restorante që shërbejnë grupe. Revolution POS e bën të thjeshtë, të shpejtë dhe pa konfuzion.</p>

    <h2>Çfarë është split bill</h2>
    <p>Split bill do të thotë ndarja e faturës totale në pjesë të veçanta — secila person ose grup paguan vetëm për atë që ka porositur (ose sipas një ndarjeje të caktuar). Sistemi llogarit automatikisht — pa kalkulator, pa letër.</p>

    <h2>Mënyrat e ndarjes</h2>
    <h3>1. Ndarje sipas produkteve</h3>
    <p>Çdo person paguan për produktet e veta. Personi A: pleskavicë + pije. Personi B: sallatë + kafe. Sistemi ndan automatikisht — ideal kur secili porosit veç e veç.</p>

    <h3>2. Ndarje e barabartë</h3>
    <p>6 persona, faturë 120€ — secili paguan 20€. E shpejtë kur porositë janë të ngjashme ose grupi preferon ndarje të barabartë.</p>

    <h3>3. Ndarje me përqindje</h3>
    <p>Personi A paguan 40%, personi B 60% — për raste specifike (p.sh. dikush ftoi të tjerët).</p>

    <h3>4. Ndarje me shumë fikse</h3>
    <p>Personi A paguan 50€, personi B paguan pjesën tjetër — fleksibilitet i plotë.</p>

    <h2>Si funksionon në Revolution POS</h2>
    <ol>
      <li>Porositë regjistrohen normalisht — secili produkt i lidhur me tavolinën (ose me emër nëse keni porosi individuale)</li>
      <li>Kur klientët kërkojnë faturë, zgjidhni "Nda faturën" (Split Bill)</li>
      <li>Zgjidhni metodën: sipas produkteve, e barabartë, përqindje ose shumë fikse</li>
      <li>Sistemi gjeneron fatura të veçanta — secila me totalin e duhur</li>
      <li>Pagesa: cash, kartë, ose kombinim — secila faturë veç e veç</li>
    </ol>

    <h2>Përfitimet</h2>
    <ul>
      <li><strong>Shpejtësi:</strong> Ndarja zgjat 30 sekonda, jo 10 minuta</li>
      <li><strong>Saktësi:</strong> Pa gabime llogaritjeje — sistemi llogarit</li>
      <li><strong>Pa debate:</strong> Faturat janë të qarta — secili sheh çfarë paguan</li>
      <li><strong>Pagesa me kartë:</strong> Secili paguan me kartën e vet — pa "kush ka cash?"</li>
    </ul>

    <h2>Scenarë tipik në restorante shqipfolëse</h2>
    <p>Grup kolegësh pas punës — secili porosit ndryshe, në fund ndajnë faturën sipas produkteve. Familje me fëmijë — prindërit paguajnë për fëmijët. Festë — organizatori paguan pjesën e madhe, të tjerët pjesën e tyre. Me Revolution POS, të gjitha këto zgjidhen pa stres për stafin dhe klientët.</p>

    <h2>Kombinim me Bashko Tavolina</h2>
    <p>Kur keni bashkuar tavolina për grup të madh, split bill bëhet edhe më i rëndësishëm. Porositë e të gjitha tavolinave janë në një listë — ndani faturën sipas nevojës. Grupi i madh, faturë e qartë, pagesa e shpejtë.</p>

    <h2>Filloni pa konfuzion</h2>
    <p>Split bill është standard në Revolution POS — pa modul shtesë. Stafi trajnohet për 5 minuta: zgjidh porosi, kliko "Nda faturën", zgjidh metodën, printo. Klientët tuaj do ta vlerësojnë — dhe stafi do të kursen orë çdo javë që më parë shkonte te llogaritjet manuale.</p>
  `},te={...J,...X,...ee},ie={"stoku-faturat-dhe-skanimi-me-ai":`
    <p>In restaurants across Kosovo, Albania, and North Macedonia, stock management and supplier invoices remain among the biggest operational challenges. Many businesses still rely on notebooks, Excel spreadsheets, or manual entries that create errors, product loss, and reporting delays. Revolution POS offers a modern approach that combines inventory management, invoicing, and AI-powered scanning — all in a single platform built for the realities of the Albanian-speaking market.</p>

    <h2>Why stock and invoices are closely linked</h2>
    <p>Every incoming invoice from a local supplier — whether in Pristina, Tirana, or Skopje — should automatically reflect in your stock levels. When these two processes run separately, products often arrive in the warehouse but never appear in the system, or vice versa. This leads to unexpected shortages during peak dining hours and orders that must be refused to customers.</p>
    <p>With Revolution POS, invoices are scanned or entered directly into the system and stock updates automatically. You no longer need to manually count every item after each delivery. The system records quantity, purchase price, and supplier — critical information for accounting and purchase planning.</p>

    <h2>AI scanning: from paper to digital product</h2>
    <p>The AI scanning feature is especially useful for restaurants that receive printed invoices from traditional suppliers. Simply photograph the invoice with a tablet or phone, and the system automatically recognizes products, quantities, and prices. This saves hours of work every week — particularly for restaurants with extensive menus and multiple suppliers.</p>
    <p>Your restaurant menu can be scanned with AI as well. Instead of manually entering 50 or 100 products, scan your existing menu and the system creates items automatically. This is ideal for restaurants transitioning from manual management to a digital POS system.</p>

    <h2>Full control without complexity</h2>
    <p>The stock dashboard shows you in real time what you have in storage, what is running low, and what needs to be ordered. Automatic alerts notify you when a product reaches its minimum level — for example, when flour, oil, or beverages are nearly out. This reduces losses from expired products and over-ordering.</p>
    <ul>
      <li>Automatic stock registration from scanned invoices</li>
      <li>Alerts for minimum product levels</li>
      <li>Complete history of stock movements</li>
      <li>Reports on losses and daily consumption</li>
      <li>Integration with sales — stock deducts automatically with every order</li>
    </ul>

    <h2>Benefits for Albanian-speaking businesses</h2>
    <p>Restaurants in our region need solutions that work with local realities: printed invoices, multiple suppliers, staff with variable schedules, and requirements for reporting to tax authorities such as ATK in Kosovo. Revolution POS addresses all these needs without requiring advanced technical knowledge.</p>
    <p>Investing in stock and invoice management is not a luxury — it is the foundation of a profitable restaurant. With AI scanning and automatic synchronization, you save time, reduce errors, and gain full control over your inventory. Start today and see the difference in your daily operations.</p>
  `,"aplikacion-offline-me-sync":`
    <p>Internet connectivity in restaurants is not always reliable. In Kosovo, Albania, and North Macedonia, many locations face brief connection interruptions — especially during peak hours or in areas with weak infrastructure. Without a system that works offline, your restaurant stops operating, orders are lost, and customers leave dissatisfied. Revolution POS solves this problem with an offline application that automatically synchronizes when the internet returns.</p>

    <h2>How offline mode works</h2>
    <p>When the internet connection drops, Revolution POS continues to work normally. Staff can take orders, print receipts, apply discounts, and manage tables — all without interruption. Data is stored locally on your device (tablet, phone, or computer) and remains secure even without internet access.</p>
    <p>This is essential for restaurants operating across multiple floors, terraces, or zones where Wi-Fi signal is weak. Instead of staff waiting or writing orders on paper, the system continues as usual.</p>

    <h2>Automatic synchronization</h2>
    <p>As soon as the internet returns, Revolution POS begins automatic synchronization. All orders, payments, stock changes, and menu modifications are sent to the cloud without manual intervention. There is no risk of data loss — every transaction recorded offline is saved and transferred when the connection stabilizes.</p>
    <p>Synchronization also works across multiple devices. If you have two tablets — one at the bar and one in the kitchen — both work offline and sync when connected. This ensures the kitchen and dining room are always up to date.</p>

    <h2>Practical scenarios in the field</h2>
    <ul>
      <li><strong>Restaurant in central Pristina:</strong> Internet outage during lunch — orders continue, customers are served normally</li>
      <li><strong>Coastal café in Durrës:</strong> Weak Wi-Fi signal — staff uses the tablet offline without stress</li>
      <li><strong>Fast food in Skopje:</strong> Peak hours with high traffic — the system does not slow down due to internet dependency</li>
      <li><strong>Restaurant with terrace:</strong> Outdoor area without Wi-Fi coverage — orders are recorded locally and sync within seconds</li>
    </ul>

    <h2>Offline data security</h2>
    <p>Many restaurant owners worry: is data safe when stored locally? Revolution POS uses encryption and automatic backup. Even if a device fails, the last synchronized data is preserved in the cloud. For offline transactions, the system keeps a complete copy until synchronization completes successfully.</p>

    <h2>Why offline + sync is the new standard</h2>
    <p>Modern restaurants cannot allow their business to depend 100% on the internet. Customers expect fast, continuous service — regardless of technical problems. With Revolution POS, you gain peace of mind: the system always works, and you focus on customers, not the Wi-Fi connection.</p>
    <p>If your restaurant has ever lost orders or experienced delays due to internet issues, offline mode with automatic sync is the solution you need. Try Revolution POS and keep working — with or without internet.</p>
  `,"program-pos-falas":`
    <p>Searching for "free POS software for restaurants" is very common among business owners in Kosovo, Albania, and North Macedonia. Starting at zero cost sounds attractive, but not every "free" offer is equal. Some systems limit essential features, others hide fees after an initial trial, and many are not adapted to the needs of Albanian-speaking restaurants. This article helps you distinguish genuine offers from misleading marketing.</p>

    <h2>What a truly free POS should include</h2>
    <p>A useful free POS program should offer the minimum necessary to operate a restaurant:</p>
    <ul>
      <li>Order entry and table management</li>
      <li>Receipt and fiscal invoice printing</li>
      <li>Menu with unlimited categories and products</li>
      <li>Basic daily sales reports</li>
      <li>Offline operation with sync</li>
      <li>Support for Albanian and local currencies (EUR, ALL, MKD)</li>
    </ul>
    <p>Revolution POS offers a free starter plan that includes these core features — without requiring a credit card and without an artificial 14-day limit that forces you to pay immediately.</p>

    <h2>Hidden costs to watch for</h2>
    <p>Many "free POS" systems in the market quickly become paid. These are the common hidden costs:</p>
    <ul>
      <li><strong>Hardware fees:</strong> Requiring purchase of expensive proprietary hardware</li>
      <li><strong>Transaction commissions:</strong> Percentage taken from every card payment</li>
      <li><strong>Locked features:</strong> Stock, analytics, ATK reports — only with premium plan</li>
      <li><strong>Staff limits:</strong> Only 1-2 free users, every additional user at extra cost</li>
      <li><strong>Limited support:</strong> Email-only help, no support in Albanian</li>
    </ul>
    <p>Before choosing, read the terms carefully and ask directly: what does it cost after 3, 6, and 12 months?</p>

    <h2>Why Albanian-speaking restaurants have special needs</h2>
    <p>POS programs imported from the USA or Western Europe often do not support:</p>
    <ul>
      <li>Reporting to ATK (Kosovo) or local tax authorities</li>
      <li>Local currencies and invoice formats</li>
      <li>Traditional Albanian menus with complex orders</li>
      <li>Integration with local suppliers and distributors</li>
    </ul>
    <p>Revolution POS is built with this context in mind. Albanian language, local invoice formats, and reports for tax authorities are part of the platform — not paid add-ons.</p>

    <h2>When it makes sense to upgrade to a paid plan</h2>
    <p>The free plan is ideal for getting started: small cafés, food trucks, restaurants with 1-2 tables. As the business grows, paid plans add advanced analytics, multi-location management, delivery integrations, and customized reports. The transition is smooth — your data migrates automatically, without loss.</p>

    <h2>How to start free with Revolution POS</h2>
    <p>Registration takes less than 5 minutes. Create your account, add your menu (or scan it with AI), and start taking orders today. No complex installation required — it works on tablet, phone, and computer. If you have questions, our team offers support in Albanian.</p>
    <p>Free POS does not mean weak POS. With Revolution POS, you get a professional system without financial risk — and grow when you are ready. Try it today and see the difference in your restaurant operations.</p>
  `,"5-arsye-pos":`
    <p>If you run a restaurant, café, or bar in Kosovo, Albania, or North Macedonia and still do not use a POS system, you are losing time, money, and customers every day. Many owners think POS is only for large businesses, but the reality is the opposite: small and medium restaurants benefit most from automation. Here are five key reasons why every restaurant needs POS — even one with just three tables.</p>

    <h2>1. Speed and accuracy in orders</h2>
    <p>Handwritten or verbally communicated orders create mistakes: forgotten items, ignored allergies, duplicate orders. With Revolution POS, staff select products with a tap, add notes (no onions, extra cheese), and the order goes directly to the kitchen. Average order-taking time drops from 3-4 minutes to less than 30 seconds.</p>
    <p>For high-traffic restaurants — such as those in central Pristina, Tirana's boulevard, or Skopje's bazaar — this means serving significantly more customers in the same time slot.</p>

    <h2>2. Stock control and reduced losses</h2>
    <p>Without a system, you do not know exactly how much product you have, what sells each day, or where money is lost. POS records every sale and deducts stock automatically. See in real time when flour, coffee, or beverages run out — before you have to turn customers away.</p>
    <p>Restaurants that switch to POS typically reduce stock losses by 15-25% in the first months. That is direct savings that pays for the system itself.</p>

    <h2>3. Reports and data-driven decisions</h2>
    <p>What sells most? Which staff member performs best? Which hours are most profitable? Without POS, these are guesses. With Revolution POS, daily, weekly, and monthly reports show you the real numbers.</p>
    <ul>
      <li>Best-selling and least-selling products</li>
      <li>Sales by hour, day, and staff member</li>
      <li>Profit margin by category</li>
      <li>Performance comparison across periods</li>
    </ul>
    <p>This data helps you optimize the menu, staff schedules, and promotions.</p>

    <h2>4. Fiscal compliance and ATK reporting</h2>
    <p>Restaurants in Kosovo must report to ATK (Tax Administration of Kosovo). Manual receipts or incomplete records create audit risk and fines. Revolution POS generates fiscal invoices, accounting books, and required reports automatically — saving you hours of work and reducing legal risk.</p>
    <p>In Albania and North Macedonia, the system adapts to local invoicing and tax requirements — without needing separate accounting software.</p>

    <h2>5. Better customer experience</h2>
    <p>Modern customers expect fast service, clear receipts, and flexible payment options (card, cash, split bill). POS enables all of this. Customer orders directly from their phone, digital menus with QR codes, and bill splitting without confusion — these features increase satisfaction and repeat visits.</p>
    <p>Restaurants that invest in technology are the ones that survive and grow. POS is not an expense — it is an investment in efficiency, accuracy, and long-term growth.</p>

    <h2>Start today with Revolution POS</h2>
    <p>You do not need to wait for a new season or renovation. Revolution POS installs in minutes, works offline, and has a free starter plan. If you run a restaurant in the Albanian-speaking region, now is the right time to move from manual management to a modern system. Contact our team or register online — transforming your restaurant starts with one click.</p>
  `,"porosite-klienteve":`
    <p>The familiar scenario: a customer calls the waiter three times to order, the waiter forgets a dish, the kitchen receives the wrong order, and the customer waits 20 minutes longer. In restaurants across Kosovo, Albania, and North Macedonia, where personal service matters, this is not just an operational annoyance — it is lost customers and damaged reputation. The solution? Let customers order directly from their own phone.</p>

    <h2>How ordering from the customer's phone works</h2>
    <p>With Revolution POS, each table has a unique QR code. The customer scans the code with their phone, opens the restaurant's digital menu, and selects products — no app, no registration required. The order goes directly into the system: the kitchen sees it immediately, the waiter receives a notification, and stock updates automatically.</p>
    <p>The customer can add notes (no spice, extra sauce), see the total price in real time, and submit the order with one click. There is no need to wait for the waiter — especially useful during peak hours.</p>

    <h2>Benefits for the restaurant</h2>
    <ul>
      <li><strong>Fewer errors:</strong> The order is written by the customer — no verbal misunderstanding</li>
      <li><strong>Focused staff:</strong> Waiters focus on service and presentation, not order-taking</li>
      <li><strong>Speed:</strong> Orders reach the kitchen 40-60% faster</li>
      <li><strong>Upselling:</strong> Digital menu automatically suggests add-ons (drinks, desserts)</li>
      <li><strong>Statistics:</strong> See which products customers order most when ordering directly</li>
    </ul>

    <h2>Benefits for the customer</h2>
    <p>Modern customers — especially younger generations in Pristina, Tirana, and Skopje — prefer autonomy. They want to see the menu with photos, clear prices, and order without pressure. Ordering from their phone gives them this control while preserving the dine-in restaurant experience (not delivery).</p>
    <p>The feature is also ideal for customers with allergies or dietary restrictions — specific notes are written clearly, without risk of misunderstanding.</p>

    <h2>Practical implementation</h2>
    <p>Revolution POS makes implementation simple:</p>
    <ol>
      <li>Print a QR code for each table (or place a stand on the table)</li>
      <li>Digital menu is created automatically from the existing menu in POS</li>
      <li>Staff training takes 15 minutes — the system is intuitive</li>
      <li>Customers scan and order — no extra steps required</li>
    </ol>
    <p>You do not need fast Wi-Fi — the menu loads quickly even on mobile connections. Orders work offline and sync automatically.</p>

    <h2>Restaurants that earn more</h2>
    <p>Restaurants with partial self-service (customer ordering + waiter service) report an average 12-18% increase in order value. Customers order drinks and desserts more often when they see the digital menu with photos — without feeling like they are being sold to by staff.</p>
    <p>On terraces and areas with many tables, this significantly reduces staff workload. One waiter can cover 6-8 tables instead of 4-5, without lowering service quality.</p>

    <h2>Get started with Revolution POS</h2>
    <p>Customer orders directly from their phone are not a luxury — they are the new standard for restaurants that want to grow. Revolution POS offers this functionality integrated, without extra cost for a separate customer app. Activate it today and give your customers the control they want — while optimizing your restaurant operations.</p>
  `},ae={"meny-digjitale-qr":`
    <p>Printed menus are becoming a thing of the past. In Kosovo, Albania, and North Macedonia, restaurants are switching to digital menus with QR codes — a simple, cost-effective, and hygienic solution that customers adopted quickly after the pandemic. Instead of printing a new menu every month when prices change, a QR code on the table opens an automatically updated menu on the customer's phone.</p>

    <h2>What is a digital menu with QR code</h2>
    <p>A QR code is a square barcode that the customer scans with their phone camera. No app, no registration — the restaurant menu opens immediately in the browser. The menu includes categories, products, descriptions, prices, and photos. When you change a price or add a new product in Revolution POS, the digital menu updates automatically — no reprinting required.</p>

    <h2>Benefits for the restaurant</h2>
    <ul>
      <li><strong>Cost savings:</strong> No monthly menu printing — especially when prices change frequently</li>
      <li><strong>Instant updates:</strong> New product today? It appears in the menu within minutes</li>
      <li><strong>Product photos:</strong> Customers see what they order — increases sales by 15-20%</li>
      <li><strong>Multi-language:</strong> Menu in Albanian, English, Macedonian — with one click</li>
      <li><strong>Hygiene:</strong> No physical menus touched by many customers</li>
      <li><strong>Environment:</strong> Less paper, less waste</li>
    </ul>

    <h2>Benefits for the customer</h2>
    <p>Customers in Pristina, Tirana, Skopje, and other cities are familiar with QR codes. They appreciate:</p>
    <ul>
      <li>Speed — the menu opens in 2 seconds</li>
      <li>Clarity — visible prices, no surprises</li>
      <li>Photos — they see the dish before ordering</li>
      <li>Autonomy — they read at their own pace, without pressure from staff</li>
    </ul>

    <h2>How to implement in 30 minutes</h2>
    <ol>
      <li>Create your menu in Revolution POS (or scan your existing menu with AI)</li>
      <li>The system generates a unique QR code for your restaurant</li>
      <li>Print the QR code on a table stand or attach it to the table</li>
      <li>Test with your phone — the menu should open immediately</li>
    </ol>
    <p>Revolution POS also offers QR codes for individual tables — so orders are automatically linked to the table number.</p>

    <h2>Menu + direct ordering</h2>
    <p>A digital menu is not just for reading. With Revolution POS, the customer scans the QR code, views the menu, and orders directly — the order goes to the kitchen without waiter intervention. This combines the convenience of a digital menu with the efficiency of automatic ordering.</p>
    <p>For restaurants that prefer traditional service, the digital menu also works as a "view-only menu" — the customer browses and orders verbally with the waiter. Flexibility is in your hands.</p>

    <h2>Best use cases</h2>
    <p>Digital menus with QR codes are ideal for:</p>
    <ul>
      <li>Restaurants with seasonal menus that change frequently</li>
      <li>Cafés with many drink and dessert variations</li>
      <li>Bars with long cocktail menus</li>
      <li>Tourist restaurants needing multi-language support</li>
      <li>Fast food with combos and customization options</li>
    </ul>

    <h2>Start today</h2>
    <p>Revolution POS includes the digital menu with QR code as part of the platform — no extra cost, no separate app. Create your menu, print the QR code, and you are ready. If your restaurant still prints menus every month, the time to go digital is now.</p>
  `,"skanoni-menyne-me-ai":`
    <p>Manually adding products to a POS system is one of the most tedious processes for restaurant owners. Imagine: 80 products, each with a name, price, category, and description — entered one by one over hours. Revolution POS solves this with AI scanning: photograph your printed menu and the system automatically creates the products — 50 items in 2 minutes.</p>

    <h2>How AI scanning works</h2>
    <p>The process is simple:</p>
    <ol>
      <li>Open Revolution POS and select "Scan Menu"</li>
      <li>Photograph your menu — paper page, menu book, or screen</li>
      <li>AI reads the text, recognizes products, prices, and categories</li>
      <li>Review the created list — correct if needed</li>
      <li>Confirm — products are added to the system automatically</li>
    </ol>
    <p>Optical character recognition (OCR) combined with AI also understands Albanian menu formats — for example, "Pljeskavica with fries — €4.50" or "Americano coffee 150 ALL".</p>

    <h2>When it is especially useful</h2>
    <ul>
      <li><strong>Migration from old POS:</strong> Switch to Revolution without manual entry</li>
      <li><strong>New restaurants:</strong> Start quickly with an existing menu without hours of data entry</li>
      <li><strong>Seasonal menus:</strong> Scan the new menu each season</li>
      <li><strong>Multi-location:</strong> Copy a menu from another branch via scanning</li>
      <li><strong>Supplier catalogs:</strong> Scan price lists from suppliers</li>
    </ul>

    <h2>Accuracy and control</h2>
    <p>AI does not replace your control — it accelerates it. After scanning, a list of recognized products appears with options to:</p>
    <ul>
      <li>Correct names or prices</li>
      <li>Add product photos</li>
      <li>Group into categories (main dishes, drinks, desserts)</li>
      <li>Delete incorrect items</li>
    </ul>
    <p>Most restaurants confirm 90%+ of products without changes. Save hours of work and start selling today.</p>

    <h2>Invoice and stock scanning</h2>
    <p>The same technology works for supplier invoices too. Scan an incoming invoice — AI recognizes products, quantity, and price, and updates stock automatically. This eliminates manual invoice entry that typically takes 30-60 minutes every day.</p>

    <h2>For Albanian-speaking restaurants</h2>
    <p>Revolution POS supports menu scanning in Albanian — with special characters (ë, ç), local price formats (€, ALL, MKD), and typical Albanian menu structures. You do not need to adapt your menu for a foreign system — the system adapts to you.</p>
    <p>Restaurants in Kosovo, Albania, and North Macedonia that switched to Revolution POS report that menu setup takes 10-15 minutes instead of 4-6 hours with manual entry.</p>

    <h2>Try AI scanning today</h2>
    <p>If you have been delaying POS migration because of setup fatigue, AI scanning removes that barrier. Register on Revolution POS, scan your menu, and start taking orders within minutes. Technology works for you — you focus on the restaurant.</p>
    <p>Whether you run a traditional grill in Prizren, a seaside restaurant in Vlorë, or a modern café in Tetovo, AI menu scanning cuts setup time from a full day to a single coffee break. Combined with digital QR menus and automatic stock updates, it is the fastest path from paper-based operations to a fully digital restaurant.</p>
  `,"stoku-menaxhimi-inventarit":`
    <p>Product loss, unexpected shortages, and excess stock are chronic problems in restaurants across Kosovo, Albania, and North Macedonia. Without structured inventory management, owners discover losses only at month-end — when it is too late. Proper stock management does not require magic — it requires process, data, and the right tools. Revolution POS gives you all three.</p>

    <h2>Why restaurants lose money on stock</h2>
    <p>The most common reasons for inventory loss:</p>
    <ul>
      <li><strong>Missing registration:</strong> Products arrive but are not recorded in the system</li>
      <li><strong>Expiration:</strong> Over-ordering — products expire before they sell</li>
      <li><strong>Internal theft:</strong> Without tracking, losses are not identified</li>
      <li><strong>Inaccurate recipes:</strong> You do not know exactly how much ingredient each dish requires</li>
      <li><strong>Infrequent counting:</strong> Physical inventory is done only once a year</li>
    </ul>
    <p>Each problem is solved with a POS system that records movements automatically and alerts you when something is wrong.</p>

    <h2>Effective management practices</h2>
    <h3>1. Set minimum levels</h3>
    <p>For every critical product (flour, oil, meat, beverages), set a minimum level. When stock falls below this level, Revolution POS notifies you automatically — before you run out during peak dining hours.</p>

    <h3>2. Link stock to sales</h3>
    <p>Every recorded order automatically deducts raw ingredients according to the recipe. If you sell 10 hamburgers, the system deducts 10 buns, 10 portions of meat, 10 slices of cheese — no manual counting.</p>

    <h3>3. Record incoming invoices</h3>
    <p>Scan or enter supplier invoices — stock updates automatically. This ensures numbers in the system match reality in the warehouse.</p>

    <h3>4. Conduct regular inventory counts</h3>
    <p>Weekly or daily counting of key products reveals discrepancies early. Revolution POS compares recorded stock with physical counts and reports differences.</p>

    <h2>Reports you should monitor</h2>
    <ul>
      <li><strong>Daily consumption:</strong> How much each product sells — identify trends</li>
      <li><strong>Slow-moving products:</strong> What stays in stock too long</li>
      <li><strong>Losses:</strong> Difference between recorded and physical stock</li>
      <li><strong>Ingredient cost:</strong> What each dish costs you — real profit margin</li>
    </ul>

    <h2>Stock for restaurants with diverse menus</h2>
    <p>Albanian restaurants often have extensive menus — whether traditional (tavë kosi, flija, pljeskavica) or international. Revolution POS supports complex recipes: one dish can consist of 15+ raw ingredients, each with different units of measure (grams, liters, pieces).</p>
    <p>For restaurants with seasonality (summer tourists, holidays), historical reports help you plan stock for upcoming periods — based on data, not guesses.</p>

    <h2>Expected results</h2>
    <p>Restaurants that implement structured stock management typically:</p>
    <ul>
      <li>Reduce losses by 15-30% within 3 months</li>
      <li>Eliminate unexpected shortages during peak hours</li>
      <li>Optimize supplier orders — no more excess or shortage</li>
      <li>Understand the real profit margin for each dish</li>
    </ul>

    <h2>Start with Revolution POS</h2>
    <p>Stock management without loss starts with automatic recording and clear reports. Revolution POS integrates stock with sales, invoices, and recipes — everything in one place. If your restaurant still counts stock by hand or discovers losses at month-end, the time for change is now.</p>
  `,"zbritjet-ne-restorante":`
    <p>Discounts and promotions are a double-edged sword: they either increase sales and attract new customers, or they cut margin with no benefit. Many restaurants in Kosovo, Albania, and North Macedonia apply discounts without strategy — "10% off" with no plan, no measurement, no limits. The result? Lower profit and customers who only come when there is an offer. How do you use discounts smartly?</p>

    <h2>Types of discounts that work</h2>
    <ul>
      <li><strong>Happy hour:</strong> Discounts during low-traffic hours (3:00-5:00 PM) — fill empty tables</li>
      <li><strong>Combo / daily menu:</strong> Dish + drink at a preferred price — increases order value</li>
      <li><strong>Stock clearance:</strong> Products nearing expiration — sell at reduced price</li>
      <li><strong>Loyalty program:</strong> Regular customers get discounts — not everyone</li>
      <li><strong>Seasonal offers:</strong> Summer menu, holiday promotions, festive deals</li>
    </ul>

    <h2>Mistakes to avoid</h2>
    <p><strong>Unlimited general discounts:</strong> "20% off for everyone" lowers margin for customers who would have paid full price. Use codes or specific conditions.</p>
    <p><strong>Discounts without measurement:</strong> If you do not know how many sales the offer generated, you do not know if it worked. Revolution POS records every discount with a reason — report the effect.</p>
    <p><strong>Permanent discounts:</strong> Customers learn the lower price as "normal" — it is hard to return to full price.</p>

    <h2>How to apply discounts with Revolution POS</h2>
    <p>The system offers full flexibility:</p>
    <ul>
      <li>Percentage or fixed-amount discounts for product, category, or total order</li>
      <li>Automatic happy hour — discount activates only during set hours</li>
      <li>Coupon codes — customer enters code for discount</li>
      <li>Manager authorization — discounts above limit require approval</li>
      <li>Discount reports — see how much was discounted, by whom, and for what</li>
    </ul>

    <h2>Strategy for Albanian-speaking restaurants</h2>
    <p><strong>Daily menu:</strong> The tradition of "dish of the day" at a preferential price — familiar and valued. Register it as a combo in POS for tracking.</p>
    <p><strong>Family offers:</strong> Large tables with menus for 4-6 people — increases average order value.</p>
    <p><strong>Holiday promotions:</strong> Eid, New Year, March 8 — themed offers for a limited time.</p>
    <p><strong>Local partnerships:</strong> Discounts for employees of nearby companies — grows weekday clientele.</p>

    <h2>Measuring success</h2>
    <p>Before launching an offer, set the objective: increase traffic? Sell specific products? Attract new customers? After the campaign, analyze:</p>
    <ul>
      <li>How many orders used the discount</li>
      <li>Average order value with vs without discount</li>
      <li>Whether total customer count increased</li>
      <li>Net margin after discount</li>
    </ul>
    <p>Revolution POS gives you these reports automatically — decisions based on numbers, not feelings.</p>

    <h2>Smart discounts, sustainable profit</h2>
    <p>Discounts are not a last resort — they are a marketing tool. Use them with strategy, measure results, and optimize. With Revolution POS, you have full control over offers — no chaos, no margin loss. Start with a happy hour or daily menu, measure the effect, and grow from there.</p>
  `,"analitika-ne-restorante":`
    <p>Many restaurant owners in Kosovo, Albania, and North Macedonia make decisions based on feelings: "It seems like we sold well today" or "This dish is not selling." Without data, these are assumptions — and assumptions cost money. Restaurant analytics transforms operations from reactive to proactive: see what is happening, where money is lost, and what needs to change.</p>

    <h2>What is restaurant analytics</h2>
    <p>Analytics means collecting, analyzing, and visualizing your business data: sales, costs, stock, staff, customers. Revolution POS automatically records every transaction and offers ready-made reports — no Excel, no manual calculations.</p>

    <h2>Key reports you should monitor</h2>
    <h3>1. Daily and weekly sales</h3>
    <p>How much did you earn today? Compared to last Wednesday? Same day last year? Trends tell you whether the business is growing or declining.</p>

    <h3>2. Best-selling products</h3>
    <p>Which dishes, drinks, and desserts bring the most revenue? Focus stock and promotion on profitable products. Also identify products that do not sell — perhaps they should be removed from the menu.</p>

    <h3>3. Peak hours</h3>
    <p>When do most customers arrive? Plan staff and stock according to these hours. If lunch is packed but dinner is empty, invest in marketing for the evening slot.</p>

    <h3>4. Staff performance</h3>
    <p>Who sells the most? Who has the highest average order value? This data helps with training, bonuses, and shift planning — not to punish, but to optimize.</p>

    <h3>5. Profit margin</h3>
    <p>Selling price minus ingredient cost — real margin for each dish. Some dishes sell a lot but earn little; others have high margin but sell rarely. Analytics shows you where to focus.</p>

    <h2>From data to decisions</h2>
    <p>Practical examples:</p>
    <ul>
      <li><strong>Menu:</strong> Remove products with sales below 5% — simplify operations</li>
      <li><strong>Pricing:</strong> Raise prices on high-demand products with good margin</li>
      <li><strong>Stock:</strong> Order more of products that sell on weekends</li>
      <li><strong>Staff:</strong> Add a waiter on Saturday 7:00-9:00 PM — peak traffic hour</li>
      <li><strong>Promotions:</strong> Happy hour offer at 3:00-5:00 PM — fill empty tables</li>
    </ul>

    <h2>Analytics for multi-location restaurants</h2>
    <p>If you have more than one branch — for example in Pristina and Prizren, or Tirana and Durrës — Revolution POS lets you compare performance across locations. Which branch sells more? Where are costs higher? Centralized decisions with local data.</p>

    <h2>Privacy and security</h2>
    <p>Your data belongs to you. Revolution POS stores it encrypted and does not share it with third parties. Reports are accessible only to you and authorized managers — with different access levels by role.</p>

    <h2>Start making decisions with numbers</h2>
    <p>Analytics does not require technical expertise. Revolution POS makes it simple: open the dashboard, select the report, view the charts. If your restaurant still makes decisions "by eye," the time to switch to data is now. Your registration starts collecting information from day one — every order, every payment, every discount. After one week, you will have insights you never had before.</p>
  `},oe={"bashko-tavolina":`
    <p>Large groups — families, colleagues, celebrations — are high-value customers for restaurants. But when two or three tables need to be combined, or when customers move from one table to another, orders often become chaotic. The kitchen receives split orders, bills are divided incorrectly, and staff waste time coordinating manually. The "Merge Tables" feature in Revolution POS solves this — without interruption, without confusion.</p>

    <h2>What merging tables means</h2>
    <p>Merging tables means two or more tables are treated as one for ordering and billing. Orders from all merged tables appear in a unified list — the kitchen sees them as one group order, not scattered individual orders. At the end, the bill can be split (split bill) or paid as one.</p>

    <h2>When it is used</h2>
    <ul>
      <li><strong>Family group:</strong> 12 people at two tables — one order, one bill (or split)</li>
      <li><strong>Corporate event:</strong> Company reserves 4 tables — centralized management</li>
      <li><strong>Celebration:</strong> Birthday, engagement — continuous orders without loss</li>
      <li><strong>Expanding party:</strong> Table 5 merges with table 6 when friends arrive</li>
    </ul>

    <h2>How it works in Revolution POS</h2>
    <ol>
      <li>Select the tables you want to merge (e.g., Table 3 + 4)</li>
      <li>The system creates a "table group" — orders are recorded under the same group</li>
      <li>The kitchen receives unified orders with the originating table number</li>
      <li>At the end, choose: single bill or split bill as needed</li>
      <li>When the group leaves, unmerge the tables — each returns to normal status</li>
    </ol>

    <h2>Operational benefits</h2>
    <p><strong>For the kitchen:</strong> Clear orders, no duplicates, no forgotten items. The head chef sees the group as one order — clear priority.</p>
    <p><strong>For the waiter:</strong> One screen for the entire group — no moving between tables with a notepad. Add orders, view total, print bill — everything from one place.</p>
    <p><strong>For the customer:</strong> Faster service, clear bill, easy splitting when paying separately.</p>

    <h2>Merge + Split Bill</h2>
    <p>Combining table merge with split bill is powerful. The group orders together, but at the end each person pays their share — no manual calculation, no arguments. Revolution POS splits the bill automatically by products or percentage.</p>

    <h2>Scenarios in Albanian-speaking restaurants</h2>
    <p>Traditional Albanian restaurants often host large groups — families for Sunday lunch, weddings, engagements. Without a system, coordination is stressful. With Merge Tables, staff focus on service, not logistics. In Pristina, Tirana, and Skopje, restaurants with 80+ seats consider this feature essential.</p>

    <h2>Try it today</h2>
    <p>Merge Tables is integrated into Revolution POS — no extra module, no complex configuration. Open the table plan, select tables, and merge. Your next large group will be served without stress — for staff and customers alike.</p>
  `,"identifikim-stafi":`
    <p>When staff log into the POS system, it must be clear who is acting — for reports, security, and accountability. But identification methods vary: quick PIN, RFID card, or full password? Each has advantages and disadvantages. This article helps you choose the right method for your restaurant in Kosovo, Albania, or North Macedonia.</p>

    <h2>PIN — speed and simplicity</h2>
    <p>A PIN (4-6 digit personal number) is the most common method in restaurants. Staff enter the code on a tablet or terminal — login in 2-3 seconds. Ideal for:</p>
    <ul>
      <li>Staff with fast rotation (waiters, baristas)</li>
      <li>Peak hours — frequent login and logout</li>
      <li>Restaurants with many employees</li>
    </ul>
    <p><strong>Advantages:</strong> Fast, no extra hardware, easy to learn.</p>
    <p><strong>Disadvantages:</strong> PINs can be shared — risk if someone else uses it. Solution: unique PIN per person, periodic changes, action reports by user.</p>

    <h2>RFID — card or wristband</h2>
    <p>RFID uses a card or wristband that staff tap on the terminal — identification without typing. Ideal for:</p>
    <ul>
      <li>Restaurants with stable staff</li>
      <li>Kitchen with hands-free needs (RFID wristband)</li>
      <li>Stricter access control</li>
    </ul>
    <p><strong>Advantages:</strong> Very fast, PIN cannot be shared, personalized card.</p>
    <p><strong>Disadvantages:</strong> Requires purchasing cards/wristbands, risk of lost card. Revolution POS supports RFID if you have a compatible reader.</p>

    <h2>Password — maximum security</h2>
    <p>A full password (8+ characters) offers higher security. Used for:</p>
    <ul>
      <li>Manager and owner — access to reports, discounts, configuration</li>
      <li>Sensitive operations — deleting orders, changing prices</li>
    </ul>
    <p><strong>Advantages:</strong> High security, difficult to share.</p>
    <p><strong>Disadvantages:</strong> Slower — not practical for waiters during peak hours.</p>

    <h2>Which method for which role</h2>
    <table class="article-table">
      <thead>
        <tr><th>Role</th><th>Recommended method</th><th>Reason</th></tr>
      </thead>
      <tbody>
        <tr><td>Waiter / Barista</td><td>PIN</td><td>Speed, many logins per shift</td></tr>
        <tr><td>Chef</td><td>PIN or RFID wristband</td><td>Free hands, wet environment</td></tr>
        <tr><td>Manager</td><td>Password + PIN</td><td>Security for reports and discounts</td></tr>
        <tr><td>Owner</td><td>Password</td><td>Full access, audit trail</td></tr>
      </tbody>
    </table>

    <h2>Audit trail — who did what</h2>
    <p>Regardless of method, Revolution POS records every action with the user's identity: who took the order, who applied the discount, who deleted an item. This is essential for:</p>
    <ul>
      <li>Detecting errors and theft</li>
      <li>Staff training — who needs help</li>
      <li>Fiscal compliance — complete transaction tracking</li>
    </ul>

    <h2>Recommendation for Albanian-speaking restaurants</h2>
    <p>For most restaurants: <strong>PIN for operational staff, password for manager.</strong> This balances speed and security. If you have 20+ staff or concerns about PIN sharing, consider RFID for the kitchen and PIN for the dining room.</p>
    <p>Revolution POS supports all three methods — choose what fits your restaurant's size and style. Configuration takes minutes, and staff are trained within the first day.</p>
  `,"librat-kontabel-atk":`
    <p>Restaurants in Kosovo operating as commercial entities must maintain accounting books and report to the Tax Administration of Kosovo (ATK). The manual process — recording invoices, calculating VAT, preparing reports — takes hours every month and creates error risk. Revolution POS generates accounting books automatically — saving you time and ensuring compliance.</p>

    <h2>What are accounting books</h2>
    <p>Accounting books are official records of all financial transactions of the business: sales, purchases, payments, VAT. ATK requires these books to be accurate, up to date, and available for audit. For restaurants, this includes every sales and purchase invoice.</p>

    <h2>How Revolution POS generates them automatically</h2>
    <p>Every transaction recorded in POS — order, payment, discount, incoming invoice — is automatically created in the accounting books. You do not need to copy manually from notebooks or Excel. The system:</p>
    <ul>
      <li>Records every sale with date, amount, VAT, and payment method</li>
      <li>Records incoming invoices (purchases) via scanning or manual entry</li>
      <li>Calculates VAT automatically according to the applicable rate</li>
      <li>Generates periodic reports (daily, weekly, monthly)</li>
      <li>Exports in formats suitable for ATK or your accountant</li>
    </ul>

    <h2>Benefits for the restaurant owner</h2>
    <p><strong>Time savings:</strong> Monthly hours spent on manual recording — now automatic.</p>
    <p><strong>Accuracy:</strong> No calculation errors, no mismatch between POS and books.</p>
    <p><strong>Easy audit:</strong> When ATK requests documentation, export the report — ready for submission.</p>
    <p><strong>Accountant integration:</strong> Your accountant receives structured data — not scattered notebooks.</p>

    <h2>VAT and fiscal invoices</h2>
    <p>Revolution POS calculates VAT for every sale and records it in the accounting books. Fiscal invoices are printed with all required elements — fiscal number, VAT, total. For restaurants selling with 18% VAT (or another rate), the system handles it automatically.</p>

    <h2>For restaurants in Albania and North Macedonia</h2>
    <p>Although ATK requirements are specific to Kosovo, the concept of accounting books is the same everywhere. Revolution POS adapts reports to local requirements — invoice formats, VAT rates, reporting periods. Contact our team for details specific to your country.</p>

    <h2>Start with accurate reporting</h2>
    <p>Accurate accounting books are not optional — they are a legal obligation. With Revolution POS, the task becomes easy: continue working normally, the system records everything. At month-end, export the report and submit to ATK or your accountant. No stress, no errors, no extra hours.</p>
    <p>Many restaurant owners in Pristina and across Kosovo previously relied on separate spreadsheets for sales and purchases, then spent weekends reconciling numbers before tax deadlines. Revolution POS eliminates that double work: every fiscal receipt, supplier invoice, and payment method is logged once and reflected everywhere it needs to be — in daily sales reports, stock levels, and ATK-ready accounting exports.</p>
  `,"raportet-e-restorantit":`
    <p>Numbers tell the true story of your restaurant. But without clear reports, those numbers remain hidden in notebooks, fiscal receipts, and memory. Restaurant reports give you a complete view of sales, costs, stock, and performance — in readable format, not long Excel tables. Revolution POS offers ready-made reports that every owner can understand.</p>

    <h2>Essential reports</h2>
    <h3>1. Daily sales report</h3>
    <p>What did you earn today? How many orders? Average order value? Payment methods (cash vs card)? This is the first report you should check every evening — 2 minutes that tell you whether the day went well.</p>

    <h3>2. Product report</h3>
    <p>Which dishes, drinks, and desserts sell most? Which remain in stock? Identify menu stars and products that should be removed or promoted.</p>

    <h3>3. Stock report</h3>
    <p>What do you have in storage? What is running out? What has expired? Plan purchases and reduce losses.</p>

    <h3>4. Staff report</h3>
    <p>Who sells the most? Who has the highest average order value? Use this for training and bonuses — not punishment, but optimization.</p>

    <h3>5. Discount report</h3>
    <p>How much was discounted? By whom? For what? Measure the effect of offers and happy hour.</p>

    <h2>How to read the reports</h2>
    <p>Do not focus only on the total. Compare:</p>
    <ul>
      <li><strong>Today vs last Tuesday</strong> — daily trend</li>
      <li><strong>This month vs last month</strong> — growth or decline</li>
      <li><strong>Saturday vs Sunday</strong> — which day earns more</li>
      <li><strong>Lunch vs dinner</strong> — when to plan staff</li>
    </ul>
    <p>Revolution POS makes this comparison automatic — visual charts, not just numbers.</p>

    <h2>Decisions based on reports</h2>
    <p>Practical examples from Albanian-speaking restaurants:</p>
    <ul>
      <li><strong>Menu:</strong> Report shows "Tavë kosi" sells 3x more than "Fli" — increase tavë kosi stock</li>
      <li><strong>Schedule:</strong> Sales peak at 1:00 PM and 8:00 PM — add staff 30 minutes before</li>
      <li><strong>Pricing:</strong> "Pljeskavica" margin is 45%, "Salad" only 20% — promote pljeskavica</li>
      <li><strong>Stock:</strong> "Coffee" runs out every Friday — order on Thursday</li>
    </ul>

    <h2>Reports for ATK and accounting</h2>
    <p>Beyond operational reports, Revolution POS generates reports for ATK and accountants: accounting books, VAT, incoming/outgoing invoices. Export with one click — no manual copying.</p>

    <h2>Start understanding your business</h2>
    <p>Reports are not for experts — they are for owners who want to know where the money goes. Revolution POS simplifies it: open the dashboard, select the report, view the chart. If your restaurant still "feels" instead of "knows," the time for reports is now. Every order you record today adds data for tomorrow's report — start collecting, start understanding.</p>
    <p>Over time, patterns emerge that no notebook can reveal: which weekdays underperform, which menu categories drive the highest margin, and whether your last promotion actually brought new customers or only discounted existing ones. These insights help you plan staffing, negotiate with suppliers, and invest in what truly works — turning daily operations into a restaurant that grows on purpose, not by luck.</p>
  `,"split-bill":`
    <p>The familiar scenario: a table with 6 people, each ordering differently, and at the end the bill must be split. Without a system, this involves manual calculation, arguments ("I did not drink alcohol!"), and delays. Split bill — dividing the check — is an essential feature for restaurants serving groups. Revolution POS makes it simple, fast, and confusion-free.</p>

    <h2>What is split bill</h2>
    <p>Split bill means dividing the total check into separate portions — each person or group pays only for what they ordered (or according to a set division). The system calculates automatically — no calculator, no paper.</p>

    <h2>Splitting methods</h2>
    <h3>1. Split by products</h3>
    <p>Each person pays for their own items. Person A: pljeskavica + drink. Person B: salad + coffee. The system splits automatically — ideal when everyone orders separately.</p>

    <h3>2. Equal split</h3>
    <p>6 people, €120 bill — each pays €20. Fast when orders are similar or the group prefers equal division.</p>

    <h3>3. Percentage split</h3>
    <p>Person A pays 40%, person B 60% — for specific cases (e.g., someone treating the others).</p>

    <h3>4. Fixed amount split</h3>
    <p>Person A pays €50, person B pays the rest — full flexibility.</p>

    <h2>How it works in Revolution POS</h2>
    <ol>
      <li>Orders are recorded normally — each product linked to the table (or to a name if you have individual orders)</li>
      <li>When customers request the bill, select "Split Bill"</li>
      <li>Choose the method: by products, equal, percentage, or fixed amount</li>
      <li>The system generates separate receipts — each with the correct total</li>
      <li>Payment: cash, card, or combination — each receipt separately</li>
    </ol>

    <h2>Benefits</h2>
    <ul>
      <li><strong>Speed:</strong> Splitting takes 30 seconds, not 10 minutes</li>
      <li><strong>Accuracy:</strong> No calculation errors — the system calculates</li>
      <li><strong>No arguments:</strong> Receipts are clear — everyone sees what they pay</li>
      <li><strong>Card payments:</strong> Each person pays with their own card — no "who has cash?"</li>
    </ul>

    <h2>Typical scenarios in Albanian-speaking restaurants</h2>
    <p>Colleagues after work — each orders differently, at the end they split by products. Family with children — parents pay for the kids. Celebration — organizer pays the larger share, others pay their portion. With Revolution POS, all of these are resolved without stress for staff and customers.</p>

    <h2>Combination with Merge Tables</h2>
    <p>When you have merged tables for a large group, split bill becomes even more important. Orders from all tables are in one list — split the bill as needed. Large group, clear bill, fast payment.</p>

    <h2>Start without confusion</h2>
    <p>Split bill is standard in Revolution POS — no extra module. Staff training takes 5 minutes: select order, click "Split Bill", choose method, print. Your customers will appreciate it — and staff will save hours every week that previously went to manual calculations.</p>
  `},ne={...ie,...ae,...oe},D=[{slug:"stoku-faturat-dhe-skanimi-me-ai",variant:"dashboard",sq:{category:"MENAXHIM",title:"Stoku, Faturat dhe Skanimi me AI: Kontroll më i Lehtë për Restorantin",date:"06 maj 2026"},en:{category:"MANAGEMENT",title:"Inventory, Invoices & AI Scanning: Easier Control for Your Restaurant",date:"06 May 2026"}},{slug:"aplikacion-offline-me-sync",variant:"mobile",sq:{category:"POS & TEKNOLOGJI",title:"Aplikacion Offline me Sync për Restorante",date:"06 maj 2026"},en:{category:"POS & TECHNOLOGY",title:"Offline App with Sync for Restaurants",date:"06 May 2026"}},{slug:"program-pos-falas",variant:"pos",sq:{category:"POS & TEKNOLOGJI",title:"Program POS Falas për Restorante",date:"06 maj 2026"},en:{category:"POS & TECHNOLOGY",title:"Free POS Software for Restaurants",date:"06 May 2026"}},{slug:"5-arsye-pos",variant:"analytics",sq:{category:"MENAXHIM",title:"5 Arsye pse çdo restorant ka nevojë për POS",date:"05 maj 2026"},en:{category:"MANAGEMENT",title:"5 Reasons Every Restaurant Needs a POS System",date:"05 May 2026"}},{slug:"porosite-klienteve",variant:"mobile",sq:{category:"FUNKSIONALITETE",title:"Porositë e Klientëve: Klientët porosisin direkt nga telefoni",date:"04 maj 2026"},en:{category:"FEATURES",title:"Customer Orders: Guests Order Directly from Their Phone",date:"04 May 2026"}},{slug:"meny-digjitale-qr",variant:"qr",sq:{category:"TEKNOLOGJI",title:"Meny Digjitale me QR Code",date:"03 maj 2026"},en:{category:"TECHNOLOGY",title:"Digital Menu with QR Code",date:"03 May 2026"}},{slug:"skanoni-menyne-me-ai",variant:"scan",sq:{category:"TEKNOLOGJI",title:"Skanoni Menunë me AI: Shtoni 50 Produkte në 2 Minuta",date:"28 mars 2026"},en:{category:"TECHNOLOGY",title:"Scan Your Menu with AI: Add 50 Products in 2 Minutes",date:"28 March 2026"}},{slug:"stoku-menaxhimi-inventarit",variant:"dashboard",sq:{category:"MENAXHIM",title:"Stoku: Si të Menaxhoni Inventarin e Restorantit pa Humbje",date:"28 mars 2026"},en:{category:"MANAGEMENT",title:"Inventory: How to Manage Restaurant Stock Without Losses",date:"28 March 2026"}},{slug:"zbritjet-ne-restorante",variant:"pos",sq:{category:"MENAXHIM",title:"Zbritjet në Restorante: Si të Rrisni Shitjet me Oferta të Zgjuara",date:"28 mars 2026"},en:{category:"MANAGEMENT",title:"Restaurant Discounts: Grow Sales with Smart Offers",date:"28 March 2026"}},{slug:"analitika-ne-restorante",variant:"analytics",sq:{category:"ANALITIKË",title:"Analitika në Restorante: Nga të Dhënat te Vendime më të Mira",date:"27 mars 2026"},en:{category:"ANALYTICS",title:"Restaurant Analytics: From Data to Better Decisions",date:"27 March 2026"}},{slug:"bashko-tavolina",variant:"tables",sq:{category:"VEÇORI",title:"Bashko Tavolina: Si të Kombinosh Porositë pa Ndërprerje",date:"27 mars 2026"},en:{category:"FEATURES",title:"Merge Tables: Combine Orders Without Disruption",date:"27 March 2026"}},{slug:"identifikim-stafi",variant:"login",sq:{category:"VEÇORI",title:"Identifikim Stafi: PIN, RFID apo Fjalëkalim — Cila Metodë për Çfarë?",date:"27 mars 2026"},en:{category:"FEATURES",title:"Staff Login: PIN, RFID or Password — Which Method for What?",date:"27 March 2026"}},{slug:"librat-kontabel-atk",variant:"brand",sq:{category:"KONTABILITET",title:"Librat Kontabël për ATK: Si i Gjeneron Revolution Automatikisht",date:"27 mars 2026"},en:{category:"ACCOUNTING",title:"Accounting Books for Tax Authorities: How Revolution Generates Them Automatically",date:"27 March 2026"}},{slug:"raportet-e-restorantit",variant:"dashboard",sq:{category:"MENAXHIM",title:"Raportet e Restorantit: Si të Kuptosh Biznesin Tënd me Numra",date:"27 mars 2026"},en:{category:"MANAGEMENT",title:"Restaurant Reports: Understand Your Business by the Numbers",date:"27 March 2026"}},{slug:"split-bill",variant:"pos",sq:{category:"UDHËZUES",title:"Split Bill: Si të Ndash Faturën pa Konfuzion",date:"27 mars 2026"},en:{category:"GUIDE",title:"Split Bill: Divide the Check Without Confusion",date:"27 March 2026"}}];function re(e){return e==="en"?ne:te}function B(e,t){const a=e[t]??e.sq,n=re(t)[e.slug];return n?{slug:e.slug,variant:e.variant,category:a.category,title:a.title,date:a.date,content:n}:null}function se(e,t=k()){const a=D.find(n=>n.slug===e);return a?B(a,t):null}function le(e=k()){return D.map(t=>B(t,e)).filter(Boolean)}const he=f("images/articles/program-pos-falas.jpg");function pe(e){return f(`images/articles/${e}.jpg`)}function N(e,{alt:t="",loading:a="lazy",className:n="article-photo"}={}){const o=t.replace(/"/g,"&quot;");return`<img src="${pe(e)}" alt="${o}" class="${n}" loading="${a}" onerror="this.onerror=null;this.src='${he}';" />`}const ue=f("images/hero.jpg"),de=["p1","p2","p3","p4"],H={p1:["f1","f2","f3","f4","f5","f6"],p2:["incl","f1","f2","f3","f4","f5","f6"],p3:["incl","f1","f2","f3","f4","f5","f6"],p4:["incl","f1","f2","f3","f4","f5","f6"]},me={p1:["f1","f2","f3","f4","f5"],p2:["incl","f1","f2","f3","f4"],p3:["incl","f1","f2","f3","f4"],p4:["incl","f1","f2","f3","f4"]};function G(e,{keys:t}={}){const a=`packages.${e}`;return(t??H[e]??[]).map(o=>i(`${a}.${o}`)).filter(Boolean).map(o=>`<li>${o}</li>`).join("")}function b(e){const t=`packages.${e}`,a=i(`${t}.tagline`);return`
    <article
      class="package-card"
      data-package="${e}"
      role="button"
      tabindex="0"
      aria-pressed="false"
      aria-label="${i(`${t}.name`)}"
    >
      <span class="package-badge">${i("packages.badge")}</span>
      <h3 class="package-name">${i(`${t}.name`)}</h3>
      ${a?`<p class="package-tagline">${a}</p>`:""}
      <ul class="package-list">${G(e,{keys:me[e]})}</ul>
      <span class="btn btn-ghost package-select-btn">${i("cta.choosePackage")}</span>
    </article>
  `}function w(e,t,a,n){const o=i(t);return`
    <article class="how-card">
      <div class="how-card-photo">
        <img src="${f(e)}" alt="${o}" loading="lazy" />
      </div>
      <h3>${o}</h3>
      <div class="how-card-desc-wrap">
        <p class="how-card-desc">${i(a)}</p>
      </div>
      <a class="how-card-link" href="${n}">${i("how.readManual")}</a>
    </article>
  `}function ce(e){return e==="ai"?`
      <div class="spotlight-mock spotlight-mock-ai" aria-hidden="true">
        <div class="sm-top">
          <span class="sm-dot"></span><span class="sm-dot"></span><span class="sm-dot"></span>
        </div>
        <div class="sm-kpis">
          <div class="sm-kpi"><strong>98%</strong><span>Stok OK</span></div>
          <div class="sm-kpi"><strong>AI</strong><span>Menu scan</span></div>
          <div class="sm-kpi"><strong>€</strong><span>Fatura</span></div>
        </div>
        <div class="sm-bars">
          <span style="--h:72%"></span><span style="--h:48%"></span><span style="--h:88%"></span><span style="--h:56%"></span>
        </div>
      </div>`:`
    <div class="spotlight-mock spotlight-mock-platform" aria-hidden="true">
      <div class="sm-phone">
        <div class="sm-phone-screen">
          <span class="sm-badge">/r/</span>
          <span class="sm-line"></span><span class="sm-line sm-short"></span>
          <div class="sm-grid-mini"><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <div class="sm-phone sm-phone-alt">
        <div class="sm-phone-screen">
          <span class="sm-badge sm-badge-shop">/s/</span>
          <div class="sm-grid-mini sm-grid-shop"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </div>`}function W({variant:e,categoryKey:t,titleKey:a,descKey:n,linkKey:o,href:r,imageSlug:s=""}){const h=s?`<div class="spotlight-photo-fallback">${N(s,{className:"spotlight-img"})}</div>`:"";return`
    <a class="spotlight-card spotlight-card-${e}" href="${r}" data-navigate>
      <div class="spotlight-photo">
        ${ce(e)}
        ${h}
      </div>
      <div class="spotlight-body">
        <div class="spotlight-category">${i(t)}</div>
        <h3 class="spotlight-title">${i(a)}</h3>
        <p class="spotlight-desc">${i(n)}</p>
        <span class="spotlight-link">${i(o)}</span>
      </div>
    </a>
  `}function ge(){const e=window.matchMedia("(max-width: 640px)");document.querySelectorAll(".how-card").forEach(t=>{const a=t.querySelector(".how-card-desc-wrap"),n=t.querySelector(".how-card-desc");if(!a||!n)return;let o=t.querySelector(".card-toggle[data-how-toggle]");o||(o=document.createElement("button"),o.type="button",o.className="card-toggle",o.dataset.howToggle="1",a.insertAdjacentElement("afterend",o));const r=()=>{const s=a.classList.contains("is-expanded"),h=e.matches&&(s||n.textContent.trim().length>85);o.hidden=!h,o.setAttribute("aria-expanded",s?"true":"false"),o.textContent=i(s?"expand.less":"expand.more"),e.matches||a.classList.remove("is-expanded")};o.addEventListener("click",()=>{a.classList.toggle("is-expanded"),r()}),r(),e.addEventListener("change",r),window.addEventListener("resize",r,{passive:!0})}),document.querySelectorAll(".package-card[data-package]").forEach(t=>{const a=t.querySelector(".package-list");if(!a)return;a.classList.add("package-list--foldable");let n=t.querySelector(".card-toggle[data-package-toggle]");n||(n=document.createElement("button"),n.type="button",n.className="card-toggle",n.dataset.packageToggle="1",a.insertAdjacentElement("afterend",n));const o=()=>{const r=a.querySelectorAll("li"),s=a.classList.contains("is-expanded"),h=e.matches&&r.length>3;n.hidden=!h,n.setAttribute("aria-expanded",s?"true":"false"),n.textContent=i(s?"expand.less":"expand.more"),e.matches||a.classList.remove("is-expanded")};n.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),a.classList.toggle("is-expanded"),o()}),o(),e.addEventListener("change",o)})}function ke(){var m;const e=document.querySelectorAll(".package-card[data-package]"),t=document.getElementById("package-detail"),a=document.getElementById("package-detail-name"),n=document.getElementById("package-detail-summary"),o=document.getElementById("package-detail-list"),r=document.getElementById("contact-package");if(!e.length||!t)return;const s=l=>{const p=`packages.${l}`;if(e.forEach(u=>{const d=u.dataset.package===l;u.classList.toggle("selected",d),u.setAttribute("aria-pressed",d?"true":"false")}),a.textContent=i(`${p}.name`),n){const u=i(`${p}.summary`);n.textContent=u,n.hidden=!u}o.innerHTML=G(l,{keys:H[l]}),t.hidden=!1,r&&(r.value=i(`${p}.name`)),sessionStorage.setItem("selectedPackage",l)};e.forEach(l=>{const p=l.dataset.package,u=d=>{var v;(v=d==null?void 0:d.target)!=null&&v.closest(".how-card-link")||s(p)};l.addEventListener("click",u),l.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),s(p))})}),(m=document.getElementById("package-detail-cta"))==null||m.addEventListener("click",()=>{var l,p;(l=document.getElementById("kontakt"))==null||l.scrollIntoView({behavior:"smooth"}),(p=document.getElementById("contact-message"))==null||p.focus()});const h=sessionStorage.getItem("selectedPackage");h&&de.includes(h)&&s(h)}function E(){var a,n;const e=le(),t=k();document.title=i("meta.title"),(n=document.querySelector('meta[name="description"]'))==null||n.setAttribute("content",((a=S[t])==null?void 0:a["meta.description"])??S.sq["meta.description"]),document.getElementById("app").innerHTML=`
    ${O({activeNav:"home"})}
    <main>
      <section class="hero hero-with-image hero-home" id="ballina" style="--hero-image: url('${ue}')">
        <div class="hero-overlay hero-overlay-dark"></div>
        <div class="container hero-content hero-home-content">
          <div class="hero-badge hero-home-badge">
            <span aria-hidden="true">🔥</span>
            ${i("hero.badge")}
          </div>
          <h1>${i("hero.title")}</h1>
          <p class="hero-home-subtitle">${i("hero.subtitle")}</p>
          <div class="hero-actions">
            <a class="btn btn-hero-primary" href="#kontakt">${i("hero.cta.primary")}</a>
            <a class="btn btn-hero-secondary" href="#veçorite">${i("hero.cta.secondary")}</a>
          </div>
          <div class="hero-stats" aria-label="Statistika">
            <span>${i("hero.stats.restaurants")}</span>
            <span class="hero-stats-sep" aria-hidden="true">·</span>
            <span>${i("hero.stats.support")}</span>
            <span class="hero-stats-sep" aria-hidden="true">·</span>
            <span>${i("hero.stats.cloud")}</span>
          </div>
        </div>
      </section>

      <section class="site-section spotlight-section" id="veçorite">
        <div class="container">
          <div class="section-head">
            <h2>${i("spotlight.title")}</h2>
            <p>${i("spotlight.subtitle")}</p>
          </div>
          <div class="spotlight-grid">
            ${W({variant:"ai",categoryKey:"spotlight.card1.category",titleKey:"spotlight.card1.title",descKey:"spotlight.card1.desc",linkKey:"spotlight.card1.link",href:C("stoku-faturat-dhe-skanimi-me-ai"),imageSlug:"stoku-faturat-dhe-skanimi-me-ai"})}
            ${W({variant:"platform",categoryKey:"spotlight.card2.category",titleKey:"spotlight.card2.title",descKey:"spotlight.card2.desc",linkKey:"spotlight.card2.link",href:"#pakot"})}
          </div>
        </div>
      </section>

      <section class="articles" id="artikuj">
        <div class="container">
          <div class="section-head">
            <h2>${i("articles.heading")}</h2>
          </div>
          <div class="article-grid">
            ${e.map(o=>`
                  <a class="article-card" href="${C(o.slug)}" data-navigate>
                    <div class="article-thumb">
                      ${N(o.slug,{alt:o.title})}
                    </div>
                    <div class="article-body">
                      <div class="article-category">${o.category}</div>
                      <h2 class="article-title">${o.title}</h2>
                      <div class="article-footer">
                        <span class="article-link">${i("readMore")}</span>
                      </div>
                    </div>
                  </a>
                `).join("")}
          </div>
        </div>
      </section>

      <section class="site-section" id="si-funksionon">
        <div class="container">
          <div class="section-head">
            <h2>${i("how.title")}</h2>
            <p>${i("how.subtitle")}</p>
          </div>
          <div class="how-grid">
            ${w("images/modules/pos-kasa.jpg","how.pos.title","how.pos.desc","/website/manual.html#menuja")}
            ${w("images/modules/kamarieri.jpg","how.waiter.title","how.waiter.desc","/website/manual.html#kamarieri")}
            ${w("images/modules/kds-kuzhina.jpg","how.kds.title","how.kds.desc","/website/manual.html#kuzhina")}
            ${w("images/modules/pronari.jpg","how.owner.title","how.owner.desc","/website/manual.html#hyrja")}
          </div>
        </div>
      </section>

      <section class="site-section site-section-muted" id="pakot">
        <div class="container">
          <div class="section-head">
            <h2>${i("packages.title")}</h2>
            <p>${i("packages.subtitle")}</p>
            <p class="packages-hint">${i("packages.clickHint")}</p>
          </div>
          <div class="packages-grid">
            ${b("p1")}
            ${b("p2")}
            ${b("p3")}
            ${b("p4")}
          </div>
          <div class="package-detail-panel" id="package-detail" hidden>
            <div class="package-detail-head">
              <span class="package-detail-badge">${i("packages.selected")}</span>
              <h3 id="package-detail-name"></h3>
            </div>
            <p class="package-detail-summary" id="package-detail-summary" hidden></p>
            <p class="package-detail-label">${i("packages.includes")}</p>
            <ul class="package-detail-list" id="package-detail-list"></ul>
            <button class="btn btn-primary" type="button" id="package-detail-cta">${i("cta.choosePackage")}</button>
          </div>
        </div>
      </section>

      <section class="site-section" id="kontakt">
        <div class="container">
          <div class="section-head">
            <h2>${i("contact.title")}</h2>
            <p>${i("contact.subtitle")}</p>
          </div>
          <div class="contact-grid">
            <div class="contact-card">
              <h3>${i("contact.direct")}</h3>
              <div class="contact-links">
                <a class="contact-link whatsapp" id="contact-whatsapp" href="#" target="_blank" rel="noopener noreferrer">
                  <span aria-hidden="true">💬</span>
                  <span id="contact-whatsapp-label">WhatsApp</span>
                </a>
                <a class="contact-link" id="contact-tel" href="#">
                  <span aria-hidden="true">📞</span>
                  <span id="contact-tel-label">+383 44 123 456</span>
                </a>
                <a class="contact-link" href="mailto:${i("contact.email")}">
                  <span aria-hidden="true">✉️</span>
                  <span>${i("contact.email")}</span>
                </a>
              </div>
            </div>
            <div class="contact-card">
              <h3>${i("contact.sendMessage")}</h3>
              <form class="contact-form" id="contact-form">
                <input type="hidden" id="contact-package" name="package" value="">
                <div class="field">
                  <label for="contact-name">${i("form.name")}</label>
                  <input type="text" id="contact-name" name="name" required placeholder="${i("form.namePlaceholder")}">
                </div>
                <div class="field">
                  <label for="contact-phone">${i("form.phone")}</label>
                  <input type="tel" id="contact-phone" name="phone" required placeholder="+383 44 123 456">
                </div>
                <div class="field">
                  <label for="contact-message">${i("form.message")}</label>
                  <textarea id="contact-message" name="message" required placeholder="${i("form.messagePlaceholder")}"></textarea>
                </div>
                <button class="btn btn-primary" type="submit">${i("cta.sendRequest")}</button>
                <p class="form-msg" id="form-msg" role="status"></p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${I()}
    ${K()}
  `,M(),x(),$(),_(),T(),ke(),ge(),window.location.hash?requestAnimationFrame(()=>{var o;(o=document.querySelector(window.location.hash))==null||o.scrollIntoView({behavior:"smooth"})}):window.scrollTo(0,0)}function fe(e){const t=se(e);if(!t){E();return}document.title=`${t.title} — Revolution POS`,document.getElementById("app").innerHTML=`
    ${O({activeNav:"blog"})}
    <main class="article-page">
      <div class="container">
        <a class="article-back" href="${z()}" data-navigate>${i("backToBlog")}</a>

        <article class="article-full">
          <header class="article-full-header">
            <div class="article-category">${t.category}</div>
            <h1>${t.title}</h1>
          </header>

          <div class="article-full-image">
            ${N(t.slug,{alt:t.title,loading:"eager"})}
          </div>

          <div class="article-content">
            ${t.content}
          </div>
        </article>
      </div>
    </main>
    ${I()}
    ${K()}
  `,M(),x(),$(),T(),window.scrollTo(0,0)}const ve={privacy:{sq:{title:"Privatësia e të dhënave",updated:"Përditësuar: qershor 2026",content:`
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
      `},en:{title:"Privacy Policy",updated:"Last updated: June 2026",content:`
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
      `}},terms:{sq:{title:"Kushtet e shërbimit",updated:"Përditësuar: qershor 2026",content:`
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
      `},en:{title:"Terms of Service",updated:"Last updated: June 2026",content:`
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
      `}}};function je(e){const t=ve[e];if(!t)return null;const a=k();return t[a]??t.sq}function Q(e){const t=je(e);if(!t){E();return}document.title=`${t.title} — Revolution Invest POS`,document.getElementById("app").innerHTML=`
    ${O({activeNav:"home"})}
    <main class="legal-page">
      <div class="container">
        <a class="article-back" href="${z()}" data-navigate>${i("legal.backHome")}</a>
        <article class="legal-doc">
          <header class="legal-doc-header">
            <p class="legal-doc-meta">${t.updated}</p>
            <h1>${t.title}</h1>
          </header>
          <div class="legal-doc-body article-content">
            ${t.content}
          </div>
        </article>
      </div>
    </main>
    ${I()}
    ${K()}
  `,M(),x(),$(),T(),window.scrollTo(0,0)}R("/",()=>E());R("/privacy",()=>Q("privacy"));R("/terms",()=>Q("terms"));R("/blog/:slug",({slug:e})=>fe(e));U();
