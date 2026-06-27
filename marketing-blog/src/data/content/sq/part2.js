export const part2 = {
  "meny-digjitale-qr": `
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
  `,

  "skanoni-menyne-me-ai": `
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
  `,

  "stoku-menaxhimi-inventarit": `
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
  `,

  "zbritjet-ne-restorante": `
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
  `,

  "analitika-ne-restorante": `
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
  `,
};
