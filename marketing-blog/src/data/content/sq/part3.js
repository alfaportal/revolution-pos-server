export const part3 = {
  "bashko-tavolina": `
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
  `,

  "identifikim-stafi": `
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
  `,

  "librat-kontabel-atk": `
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
  `,

  "raportet-e-restorantit": `
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
  `,

  "split-bill": `
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
  `,
};
