window.MANUAL_EN_SECTIONS = {
  hyrja: `<span class="section-num">Section 1</span>
        <h2>GETTING STARTED</h2>
        <p>Revolution Invest POS consists of several modules: the <strong>POS application</strong> on the computer (fiscal register), the <strong>owner panel</strong> on the web (<code>/owner/login</code>), the <strong>waiter module</strong> on tablet, the <strong>kitchen display (KDS)</strong>, <strong>table QR kiosk</strong>, and the restaurant <strong>public page</strong>.</p>

        <h3 id="hyrja-telefon">How to sign in to the panel from your phone</h3>
        <ol class="steps">
          <li>Open your browser (Chrome, Safari) and go to the panel address: <code>https://revolution-pos.com/owner/login</code> (or the link provided by your administrator).</li>
          <li>Enter the <strong>owner email</strong> and <strong>password</strong>.</li>
          <li>Tap <strong>«Sign in to panel»</strong>. After signing in, the panel appears with live tables, menu, waiters, reports, and more.</li>
          <li>For faster access, add the page to your home screen:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>iPhone/iPad:</strong> Share (□↑) → <em>Add to Home Screen</em></li>
              <li><strong>Android:</strong> Menu (3 dots) → <em>Add to Home Screen</em></li>
            </ul>
          </li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>The owner panel works as a web app (PWA). After installing it on your home screen, it opens without a long URL and with the Revolution Invest POS icon.</p>
        </div>

        <h3 id="hyrja-pc">How to sign in from a computer / touchscreen</h3>
        <ol class="steps">
          <li><strong>Owner panel (web):</strong> Open your browser and go to <code>/owner/login</code>. Use the same email and password as on your phone. Ideal for managing the menu, reports, and public page.</li>
          <li><strong>POS application (register):</strong> Open the Revolution Invest POS program on the register computer. Activate the license under <strong>Admin → License</strong> with the key provided by your administrator (format: <code>XXXX-XXXX-XXXX-XXXX</code>).</li>
          <li><strong>Waiter module (tablet):</strong> Open the waiter link from the panel (<em>Venue links → Waiters</em>). Format: <code>/waiter/[slug]?key=...</code>. Set it as the home page on the tablet.</li>
          <li><strong>Kitchen display:</strong> Open the KDS link on the kitchen screen: <code>/kitchen/[slug]?key=...</code>. Leave it open — orders refresh automatically.</li>
          <li><strong>Table kiosk:</strong> Customers scan the table QR code (see section 4). Link: <code>/kiosk/[slug]?key=...&amp;table=N</code>.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>The owner email (<code>/owner/login</code>) is <strong>not</strong> the same as Super Admin sign-in. Waiters <strong>do not</strong> use email — they sign in only with a 4-digit PIN on the tablet.</p>
        </div>

        <h3 id="hyrja-harruar">Forgot password</h3>
        <ol class="steps">
          <li>Go to <code>/owner/login</code>.</li>
          <li>Enter the owner email in the email field.</li>
          <li>Click <strong>«Forgot password?»</strong>.</li>
          <li>Check your inbox (and spam) for an email with a <strong>6-digit reset code</strong>.</li>
          <li>Enter the code, set a <strong>new password</strong> (min. 6 characters), and confirm.</li>
          <li>Tap <strong>«Save and sign in»</strong> — you will be signed in to the panel automatically.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>If you do not receive the email, check that you entered the correct owner email. If the problem continues, contact Revolution Invest support — the administrator can send a password reset from the Super Admin panel.</p>
        </div>`,

  menuja: `<span class="section-num">Section 2</span>
        <h2>MENU MANAGEMENT</h2>
        <p>Menu management is done from the owner panel, <strong>«Menu»</strong> tab. Changes sync to waiter tablets, the kiosk, and the public page within ~15 seconds.</p>

        <h3>How to add new items</h3>
        <ol class="steps">
          <li>Sign in to the owner panel and select the <strong>Menu</strong> tab.</li>
          <li>On the <strong>«Add item»</strong> card, fill in:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Name</strong> — e.g. «Cappuccino», «Pizza Margherita»</li>
              <li><strong>Category</strong> — e.g. «Hot drinks», «Pizza». Choose from the existing list or enter a new one.</li>
              <li><strong>Price (€)</strong> — with two decimals, e.g. 2.50</li>
            </ul>
          </li>
          <li>Click <strong>«Add»</strong>. The item appears in the list immediately and becomes available on POS/tablet.</li>
        </ol>

        <h3>How to change prices</h3>
        <ol class="steps">
          <li>On the <strong>Menu</strong> tab, find the item in the <strong>«Menu list»</strong> table.</li>
          <li>Change the value in the <strong>Price</strong> column directly in the input field.</li>
          <li>Click <strong>«Save»</strong> on that item's row.</li>
          <li>Wait for the confirmation message — the new price applies across all modules.</li>
        </ol>
        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Remember to click <strong>Save</strong> after every change. Unsaved changes are lost when you refresh the page.</p>
        </div>

        <h3>How to add photos for items</h3>
        <ol class="steps">
          <li>In the menu list, find the <strong>Photo</strong> column for the item.</li>
          <li>Click <strong>«Upload»</strong> (or the photo icon) and choose a <strong>PNG</strong> or <strong>JPG</strong> image (max <strong>500 KB</strong>).</li>
          <li>The preview appears immediately. Click <strong>«Save»</strong> to store it.</li>
          <li>Photos appear on the restaurant <strong>public page</strong> (<code>/r/:slug</code>) when customers browse the menu online.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Use square or landscape photos with the product centered. To remove a photo, click <strong>«Remove»</strong> then <strong>«Save»</strong>.</p>
        </div>

        <h3>How to hide / activate items</h3>
        <ol class="steps">
          <li>Find the item in the list. The <strong>Status</strong> column shows «Active» or «Inactive».</li>
          <li>To hide it from tablets and the kiosk (e.g. out of stock): click <strong>«Hide»</strong>. Status becomes «Inactive».</li>
          <li>To reactivate: click <strong>«Activate»</strong>.</li>
          <li>To delete permanently: click <strong>«Delete»</strong> and confirm. This action cannot be undone.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Hidden items (<em>Inactive</em>) do not appear for waiters and the kiosk, but remain in past order history. Permanent deletion removes them completely.</p>
        </div>`,

  kamarieri: `<span class="section-num">Section 3</span>
        <h2>WAITER MODULE</h2>
        <p>The waiter module lets staff take orders from tables on a tablet, without waiting at the register. Each waiter is identified by a <strong>4-digit PIN</strong>. Requires <strong>Plan 2</strong> or higher (Waiter module).</p>

        <h3>How to add waiters with PIN</h3>
        <ol class="steps">
          <li>Sign in to the owner panel → <strong>Waiters</strong> tab.</li>
          <li>Under <strong>«Waiters with PIN»</strong>, fill in:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Name</strong> — e.g. «Arben», «Elira»</li>
              <li><strong>PIN (4 digits)</strong> — e.g. 1234 (do not use overly simple PINs)</li>
            </ul>
          </li>
          <li>Click <strong>«Add waiter»</strong>.</li>
          <li>The waiter appears in the list with status «Active». You can reset the PIN anytime with the <strong>«Reset PIN»</strong> button.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Copy the waiter link from <em>Venue links → Waiters (phone)</em> and send it to the tablets. The link contains <code>?key=</code> — do not share it publicly.</p>
        </div>

        <h3>How the waiter signs in with PIN</h3>
        <ol class="steps">
          <li>Open the waiter link on the tablet: <code>/waiter/[slug]?key=...</code></li>
          <li>The sign-in screen appears with a numeric keypad.</li>
          <li>The waiter enters their <strong>4-digit PIN</strong>. After 4 digits, sign-in happens automatically.</li>
          <li>The table list appears (T1, T2, …) according to the areas you configured (Dining room, Terrace, etc.).</li>
          <li>After an order or receipt, the screen <strong>locks automatically after 5 seconds</strong> — the next waiter must enter their own PIN.</li>
        </ol>

        <h3>How to place an order from the tablet</h3>
        <ol class="steps">
          <li>After signing in with PIN, the waiter selects the <strong>table</strong> (e.g. T3).</li>
          <li>The menu appears with categories (tabs at the top). Choose the right category.</li>
          <li>Tap items to add them to the cart. Quantity increases with each tap.</li>
          <li>Check the cart — the total is calculated automatically.</li>
          <li>Tap <strong>«Send order»</strong> (or equivalent). The order goes to the <strong>kitchen (KDS)</strong> and/or <strong>bar</strong>.</li>
          <li>You can add more items to the same table without closing it — just send additional orders.</li>
        </ol>

        <h3>How to close a table and print the receipt</h3>
        <ol class="steps">
          <li>When the customer asks for the bill, the waiter opens the occupied table from the list.</li>
          <li>Check the items and total in the cart.</li>
          <li>Tap <strong>«Close table + Print receipt»</strong>.</li>
          <li>Confirm the dialog: <em>«Close table T[X] and print receipt?»</em></li>
          <li>The system closes the order, generates the receipt, and opens the browser print dialog.</li>
          <li>Choose the printer (58mm or 80mm thermal) and print. The table becomes <strong>available</strong> for new customers.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>If the ATK fiscal register is enabled, the receipt is also recorded fiscally. Make sure the connection to the register (COM Port) works before closing the table.</p>
        </div>`,

  kiosk: `<span class="section-num">Section 4</span>
        <h2>KIOSK / TABLE (Self-order)</h2>
        <p>With the Kiosk module, customers scan a <strong>QR code</strong> on the table and order from their phone. The order goes to the <strong>bar</strong> for preparation — the kiosk does not generate a receipt automatically.</p>

        <h3>How to place the QR code on the table</h3>
        <ol class="steps">
          <li>Sign in to the panel → <strong>Venue &amp; Staff</strong> tab.</li>
          <li>Make sure you have configured <strong>areas and tables</strong> (e.g. Dining room with 10 tables).</li>
          <li>Below, on the <strong>«Table QR codes (Kiosk)»</strong> card, QR codes appear for each table (T1, T2, …).</li>
          <li>Click <strong>«Print QR codes»</strong> to print all codes on one page.</li>
          <li>Cut and place each QR on the corresponding table (elastic band, table holder, sticker).</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Each QR links to a specific URL: <code>/kiosk/[slug]?key=SECRET&amp;table=N</code>. Table N must match the physical number (T5 → table=5).</p>
        </div>

        <h3>How the customer orders by themselves</h3>
        <ol class="steps">
          <li>The customer scans the QR code with their phone camera.</li>
          <li>The kiosk page opens with the restaurant name and table number (e.g. <strong>T5</strong>).</li>
          <li>The customer chooses a category, taps items, and adds them to the cart.</li>
          <li>They review the order and tap <strong>«Send order»</strong>.</li>
          <li>The order goes to the bar/kitchen. Staff brings it to the correct table.</li>
          <li>Payment and receipt are usually handled at the end by the waiter or at the register — the kiosk only takes the order.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>The kiosk requires internet. If the menu is empty, the owner must add items on the Menu tab or sync the menu from the local POS.</p>
        </div>`,

  kuzhina: `<span class="section-num">Section 5</span>
        <h2>KITCHEN KDS (Kitchen Display)</h2>
        <p>The kitchen display (Kitchen Display System) shows new orders in real time. Ideal for a tablet or monitor on the kitchen wall.</p>

        <h3>How the kitchen display works</h3>
        <ol class="steps">
          <li>Open the kitchen link: <code>/kitchen/[slug]?key=...</code> (copied from the panel → <em>Links → Kitchen KDS</em>).</li>
          <li>Leave the page open on the kitchen screen — it refreshes automatically.</li>
          <li>Each order appears as a <strong>ticket</strong> with: table number (T3), time, waiter name, and item list.</li>
          <li>The source is shown with an icon: 📱 Waiter, 🪑 Table (kiosk), 🛵 Delivery, 🥡 Takeaway.</li>
          <li>New orders are highlighted visually until you read them.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Set the tablet to «keep screen on» mode and use a stable Wi‑Fi connection. The link with <code>?key=</code> should be kept private.</p>
        </div>

        <h3>How to mark an order «Ready»</h3>
        <ol class="steps">
          <li>When the kitchen finishes preparing an order, find the corresponding ticket.</li>
          <li>Click the <strong>«Ready ✅»</strong> button at the bottom of the ticket.</li>
          <li>The order is removed from the active order list — the waiter/staff knows it can be brought to the table.</li>
          <li>Repeat for each completed order.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Marking «Ready» removes the order from the kitchen screen, but <strong>does not</strong> close the table and <strong>does not</strong> print a receipt. Closing and payment are done from the waiter module or POS.</p>
        </div>`,

  raportet: `<span class="section-num">Section 6</span>
        <h2>REPORTS</h2>
        <p>Reports help you monitor sales, VAT, and venue performance. All are found in the owner panel.</p>

        <h3>How to view daily sales</h3>
        <ol class="steps">
          <li>Sign in to the panel → <strong>Reports</strong> tab.</li>
          <li>Under <strong>«Revenue»</strong>, select the <strong>From</strong> and <strong>To</strong> dates (for a single day, use the same date for both).</li>
          <li>Click <strong>«Show»</strong>.</li>
          <li>You see: total revenue, chart by day, and a table of each transaction (time, table, waiter, total).</li>
          <li>For a quick daily view, also check the statistics at the top of the panel (after sign-in).</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>The <strong>Live Tables</strong> tab shows the current state of tables (available / occupied) and refreshes every 15 seconds — useful during a shift.</p>
        </div>

        <h3>How to run a Z-Report</h3>
        <ol class="steps">
          <li>Go to the <strong>Daily Report</strong> tab (Z-Report).</li>
          <li>Select the date from the calendar (<code>zreport-date</code>) — default is today.</li>
          <li>Click <strong>«Refresh»</strong> to load data: fiscal receipts, daily turnover, VAT (A–E), register balance, Cash/Card payments.</li>
          <li>At end of day, click <strong>«Close day»</strong> to finalize the daily report (Z-Report).</li>
          <li>View <strong>Daily history</strong> below for past days' reports.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Z-Report is linked to the ATK fiscal register. Make sure fiscal settings (the <strong>Fiscal</strong> tab) are correct: Fiscal No., COM Port, operator. Day close should be done once per day, usually after closing the venue.</p>
        </div>

        <h3>How to export the report</h3>
        <ol class="steps">
          <li>On the <strong>Daily Report</strong> tab, select the desired date.</li>
          <li>Use the export buttons:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Print Z-Report</strong> — opens the print version</li>
              <li><strong>Export Excel (CSV)</strong> — downloads file <code>z-report-YYYY-MM-DD.csv</code> for Excel</li>
              <li><strong>Export PDF (HTML)</strong> — downloads the report as HTML (opens in browser, can be printed as PDF)</li>
            </ul>
          </li>
          <li>Save the file on your computer or send it to your accountant.</li>
        </ol>`,

  faqja: `<span class="section-num">Section 7</span>
        <h2>PUBLIC PAGE</h2>
        <p>Every customer with a package that includes the public page has a website at <code>/r/[slug]</code> — with menu, logo, hours, and info. Online takeaway/delivery ordering is available on <strong>Plan 3</strong> only.</p>

        <h3>How to upload a logo</h3>
        <ol class="steps">
          <li>Sign in to the panel → <strong>Public page</strong> tab.</li>
          <li>In the logo section, click <strong>«Upload logo»</strong>.</li>
          <li>Choose a <strong>PNG</strong> or <strong>JPG</strong> image (max <strong>500 KB</strong>).</li>
          <li>The preview appears immediately. Click <strong>«Save public page»</strong> at the bottom of the form.</li>
          <li>The logo appears on the public page and as an icon when customers add the page to their phone (PWA).</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>To remove the logo, click <strong>«Remove logo»</strong> then <strong>«Save public page»</strong>. Use the <strong>«View page»</strong> button to see the live result.</p>
        </div>

        <h3>How to change opening hours</h3>
        <ol class="steps">
          <li>On the <strong>Public page</strong> tab, find the <strong>«Opening hours»</strong> section.</li>
          <li>For each day of the week (Monday – Sunday), set opening and closing times, or mark the day as <strong>closed</strong>.</li>
          <li>Add a short description and the main theme color if you wish.</li>
          <li>Click <strong>«Save public page»</strong>.</li>
          <li>Hours appear on the public page in the <em>«Opening hours»</em> section.</li>
        </ol>

        <h3>How to enable online delivery</h3>
        <ol class="steps">
          <li>Make sure your package is <strong>Plan 3</strong> (online takeaway &amp; delivery orders).</li>
          <li>On the <strong>Public page</strong> tab, enable the checkbox <strong>«Public page is active»</strong>.</li>
          <li>Fill in the business <strong>address</strong> and <strong>phone</strong> (taken from venue settings or Super Admin).</li>
          <li>Add active items on the <strong>Menu</strong> tab — the public menu is read from the same list.</li>
          <li>Click <strong>«Save public page»</strong>. On the public page, the <strong>«Order now»</strong> button appears, leading to <code>/r/[slug]/order</code>.</li>
          <li>Customers choose <strong>Delivery</strong> or <strong>Takeaway</strong>, fill in name, phone, and (for delivery) address.</li>
          <li>The order goes automatically to the <strong>bar</strong> and <strong>kitchen</strong> with the Delivery/Takeaway label.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Online orders do not process payment automatically — staff confirm and handle the order manually. For delivery, the customer's address is required.</p>
        </div>`,

  siguria: `<span class="section-num">Section 8</span>
        <h2>PASSWORDS &amp; SECURITY</h2>
        <p>Account security and emergency access are essential for smooth venue operations.</p>

        <h3>How to change the owner password</h3>
        <ol class="steps">
          <li><strong>Method 1 — Self-reset:</strong> Go to <code>/owner/login</code> → <strong>«Forgot password?»</strong> → receive the code by email → set a new password (min. 6 characters).</li>
          <li><strong>Method 2 — With administrator help:</strong> Contact Revolution Invest support. The administrator sends a reset email from the Super Admin panel (Owners tab → Reset Password).</li>
          <li>After changing, sign out and sign in again with the new password on all devices.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Use a strong password (min. 6 characters, with letters and numbers). Do not share the owner email with waiters — they use PIN only.</p>
        </div>

        <h3>Emergency code (POS offline)</h3>
        <p>When the POS application cannot verify the license online (no internet or server issue), you can use the <strong>daily emergency code</strong> or <strong>Master PIN</strong> to continue working.</p>
        <ol class="steps">
          <li>The <strong>administrator</strong> (Super Admin) opens the admin panel and views <strong>«Daily emergency code (POS offline)»</strong> — the code changes every day.</li>
          <li>On the POS computer, when the emergency unlock prompt appears, choose the <strong>Emergency</strong> option.</li>
          <li>Enter the <strong>Master PIN</strong> (if configured on the server) <strong>or</strong> the <strong>daily code</strong> provided by the administrator.</li>
          <li>After verification, POS continues in emergency mode until the server connection is restored.</li>
          <li>Restore internet as soon as possible and verify the license normally — emergency mode is logged in the activity log.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>The emergency code is <strong>sensitive</strong> — do not distribute it publicly. Use it only when POS cannot connect online. Master PIN is configured by the administrator in the server variable <code>MASTER_EMERGENCY_PIN</code>.</p>
        </div>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Each waiter has their own PIN — reset it immediately if an employee leaves. Links with <code>?key=</code> (kitchen, waiter, kiosk) should stay inside the venue.</p>
        </div>`,

  stoku: `<span class="section-num">Section 9</span>
        <h2>INVENTORY MANAGEMENT</h2>
        <p>The inventory module lets you track quantities for menu items. When stock reaches zero, the item is automatically hidden from the menu on POS, tablet, and kiosk — no need to hide it manually.</p>

        <h3 id="stoku-aktivizo">How to enable stock tracking for an item</h3>
        <ol class="steps">
          <li>Sign in to the owner panel → <strong>Inventory</strong> tab.</li>
          <li>In the items table, find the product you want to track (e.g. «Cappuccino», «Pizza Margherita»).</li>
          <li>In the <strong>Track stock</strong> column, enable the checkbox (<strong>Yes</strong>).</li>
          <li>The <strong>Quantity</strong> and <strong>Alert threshold</strong> fields become editable.</li>
          <li>Click <strong>«Save»</strong> on that item's row to save the change.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Enable stock only for items with limited quantity (e.g. seasonal products). Items without stock tracking work as before — always available on the menu.</p>
        </div>

        <h3 id="stoku-sasia">How to set quantity and alert threshold</h3>
        <ol class="steps">
          <li>On the <strong>Inventory</strong> tab, for an item with tracking enabled:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Quantity</strong> — current number of units in stock (e.g. 50)</li>
              <li><strong>Alert threshold</strong> — when quantity falls to this value or below, the item is marked «Low stock» (e.g. 10)</li>
            </ul>
          </li>
          <li>The summary above the table shows: items in stock, low stock, and out-of-stock items.</li>
          <li>Click <strong>«Save»</strong> after every change.</li>
          <li>Changes sync to POS and tablets within ~15 seconds.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Every sale (POS, waiter, kiosk) automatically deducts stock for items with tracking enabled. Make sure the starting quantity is correct before the shift begins.</p>
        </div>

        <h3 id="stoku-rimbush">How to restock inventory</h3>
        <ol class="steps">
          <li>On the <strong>Inventory</strong> tab, find the item you want to restock.</li>
          <li>Click the <strong>«Restock»</strong> button on that item's row.</li>
          <li>Enter the new total quantity (e.g. 100 units) in the dialog that appears.</li>
          <li>Confirm — quantity updates and status changes (e.g. from «Out of stock» to «OK»).</li>
          <li>The item returns automatically to the menu on POS and tablet.</li>
        </ol>

        <h3>What happens when stock reaches zero</h3>
        <ol class="steps">
          <li>When quantity falls to <strong>0</strong>, status becomes <strong>«Out of stock»</strong> (row highlighted in red).</li>
          <li>The item is <strong>automatically hidden</strong> from the menu on:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li>POS application (register)</li>
              <li>Waiter tablet</li>
              <li>Table QR kiosk</li>
            </ul>
          </li>
          <li>Customers and staff <strong>do not see</strong> the item until you restock.</li>
          <li>After restocking, the item returns without needing to activate it manually on the Menu tab.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Zero stock only changes availability on the menu — it <strong>does not</strong> delete the item from the menu list in the panel. Past order history remains untouched.</p>
        </div>

        <h3>Email notifications for low stock</h3>
        <ol class="steps">
          <li>When quantity falls below the alert threshold or reaches zero, the system automatically sends an <strong>email to the owner</strong>.</li>
          <li>The email contains the item name, current quantity, and status (low stock or out of stock).</li>
          <li>The email is sent to the registered owner address (<code>/owner/login</code>) or business email.</li>
          <li>The <strong>Inventory</strong> tab shows a badge if there are items on alert — check the panel daily.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>Set the alert threshold a few units above zero (e.g. 5–10) so you receive email before the product runs out completely and have time to restock.</p>
        </div>`,

  terminalet: `<span class="section-num">Section 10</span>
        <h2>TERMINALS (Multi-terminal)</h2>
        <p>Every Revolution Invest POS license supports one or more <strong>terminals</strong> — meaning computers or devices where the POS application is installed and activated.</p>

        <h3>What is a terminal?</h3>
        <p><strong>1 terminal = 1 computer / POS device</strong> where you installed the program and activated the license key. For example:</p>
        <ul style="margin:0 0 1rem;padding-left:1.25rem;color:#cbd5e1">
          <li>Main register in the dining room = <strong>1 terminal</strong></li>
          <li>Second register at the bar = <strong>1 terminal</strong></li>
          <li>Backup computer with POS installed = <strong>1 terminal</strong></li>
        </ul>
        <p>Waiter tablets, the kitchen display, and the kiosk <strong>do not</strong> count as terminals — only the desktop POS application.</p>

        <h3 id="terminalet-shiko">How to view active terminals</h3>
        <ol class="steps">
          <li>Sign in to the owner panel → <strong>License</strong> tab.</li>
          <li>In the terminals section you see: <strong>«Active terminals: X / Y allowed»</strong>.</li>
          <li>The list shows each device with:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Device ID</strong> — unique 12-digit installation code</li>
              <li><strong>Computer</strong> — host name (e.g. KASA-1)</li>
              <li><strong>Last seen</strong> — when POS last connected to the server</li>
            </ul>
          </li>
          <li>The device ID also appears under <strong>Admin → License</strong> on the POS computer after activation.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>If you buy a new POS computer, activate the license there — the new terminal appears automatically in the list after the first internet connection.</p>
        </div>

        <h3 id="terminalet-limit">What happens when the terminal limit is reached</h3>
        <ol class="steps">
          <li>Each license has a maximum number of terminals (usually <strong>1</strong>, but can be 2, 3, 4, 5+).</li>
          <li>When you try to activate POS on a device <strong>above the limit</strong>:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>24-hour grace:</strong> POS continues to work with a warning message</li>
              <li><strong>After 24 hours:</strong> activation is blocked — message shown: <em>«Contact Revolution Invest to add terminals»</em></li>
            </ul>
          </li>
          <li>The owner panel shows the warning: <strong>«You have reached the terminal limit»</strong>.</li>
          <li>Existing POS units (within the limit) continue to work normally — only the extra terminal is blocked.</li>
        </ol>

        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>The 24-hour trial period starts when you first exceed the limit. Do not delay — contact Revolution Invest as soon as possible to add terminals and avoid blocking.</p>
        </div>

        <h3>How to add extra terminals</h3>
        <ol class="steps">
          <li>Contact <strong>Revolution Invest</strong> to increase the number of terminals on your license.</li>
          <li>You can reach us via:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Phone / WhatsApp:</strong> <a href="tel:+38343555294" style="color:#7dd3fc;text-decoration:underline">+383 43 555 294</a> · <a href="https://wa.me/38343555294" target="_blank" rel="noopener noreferrer" style="color:#7dd3fc;text-decoration:underline">WhatsApp</a> · page <a href="/#kontakt" style="color:#7dd3fc;text-decoration:underline">revolution-pos.com/#kontakt</a></li>
              <li><strong>Email:</strong> <a href="mailto:revolutioninvest05@gmail.com" style="color:#7dd3fc;text-decoration:underline">revolutioninvest05@gmail.com</a></li>
            </ul>
          </li>
          <li>Provide the venue name and how many extra terminals you need (e.g. «I want 2 terminals instead of 1»).</li>
          <li>The administrator updates the license — after refresh, you can activate POS on the new device without blocking.</li>
        </ol>

        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>License price = base price + (extra terminals × price per terminal). Package details are discussed with the Revolution Invest team before activation.</p>
        </div>`,

  kontabilisti: `<span class="section-num">Section 11</span>
        <h2>ACCOUNTANT BOOKS</h2>
        <p>The <strong>Accountant</strong> module (Full package) opens from the POS admin panel. There you manage the sales ledger, expenses, VAT report, and export for your accountant. In the owner web panel (<code>/owner/login</code> → <strong>Reports</strong> tab) you also find daily petty expenses and the audit log.</p>

        <h3 id="kontabilisti-hap">How to open accountant books from the admin panel</h3>
        <ol class="steps">
          <li>Open the <strong>Revolution Invest POS</strong> app on the register computer.</li>
          <li>Sign in to <strong>Admin</strong> (with administrator rights).</li>
          <li>In the left menu / top tabs, select <strong>«Accountant»</strong> (Kontabilisti).</li>
          <li>You will see three blocks: <strong>Sales ledger</strong>, <strong>Purchases/expenses ledger</strong>, and <strong>VAT report</strong>.</li>
        </ol>
        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>If you do not see the «Accountant» tab, your package does not include it (Full only). Contact Revolution Invest for an upgrade.</p>
        </div>

        <h3 id="kontabilisti-shpenzim">How to record expenses</h3>
        <ol class="steps">
          <li>Under <strong>Purchases/expenses ledger</strong>, click <strong>«+ New expense»</strong>.</li>
          <li>Fill in:
            <ul style="margin:0.5rem 0 0;padding-left:1.1rem;color:#cbd5e1">
              <li><strong>Date</strong></li>
              <li><strong>Company name</strong></li>
              <li><strong>Description</strong></li>
              <li><strong>Category</strong> — Rent, Cleaning, Services, Payroll, Unexpected, Other</li>
              <li><strong>Amount (€)</strong></li>
            </ul>
          </li>
          <li>Click <strong>«Save expense»</strong>. The row appears with who recorded it.</li>
          <li><em>Web alternative:</em> <code>https://revolution-pos.com/owner/login</code> → <strong>Reports</strong> → <strong>Daily petty expenses</strong>.</li>
        </ol>

        <h3 id="kontabilisti-raport">How to view income and expense reports</h3>
        <ol class="steps">
          <li><strong>Income (sales ledger):</strong> set the date range → <strong>Filter</strong>. See date, invoice no., items, amount, VAT rate, VAT, and payment method.</li>
          <li><strong>Expenses:</strong> filter the same period in the purchases/expenses ledger.</li>
          <li><strong>On the web:</strong> owner panel → <strong>Reports</strong> → «Revenue» with date filter → <strong>Show</strong>.</li>
        </ol>

        <h3 id="kontabilisti-audit">How to view the audit trail</h3>
        <ol class="steps">
          <li><strong>On POS:</strong> Admin → <strong>Journal</strong> (Ditari) → <strong>«Activity register (who used the program)»</strong>. Choose the period and click <strong>Search</strong>.</li>
          <li><strong>On the web:</strong> <code>/owner/login</code> → <strong>Reports</strong> → <strong>Activity register (Audit log)</strong> → <strong>Refresh</strong>.</li>
          <li>You see price changes, voided invoices, expenses, and other actions — with time, action, details, and who did it.</li>
        </ol>

        <h3 id="kontabilisti-tvsh">How to generate a fiscal VAT report</h3>
        <ol class="steps">
          <li>Under <strong>VAT report</strong>, select the <strong>month</strong>.</li>
          <li>Click <strong>Filter</strong>.</li>
          <li>See rates (e.g. <strong>0%</strong>, <strong>8%</strong>, <strong>18%</strong>) with net sales, VAT collected, and gross sales.</li>
          <li>Use <strong>Export PDF</strong> or <strong>Export CSV</strong> for a ready document.</li>
        </ol>

        <h3 id="kontabilisti-eksport">How to export data for your accountant</h3>
        <ol class="steps">
          <li><strong>Sales ledger:</strong> filter the period → <strong>Export CSV</strong> or <strong>Export PDF</strong>.</li>
          <li><strong>Purchases/expenses:</strong> same — CSV or PDF.</li>
          <li><strong>VAT report:</strong> CSV or PDF for the selected month.</li>
          <li>Send the files to your accountant.</li>
        </ol>
        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>CSV opens easily in Excel. PDF is ready to print or archive.</p>
        </div>`,

  ndihma: `<span class="section-num">Section 12</span>
        <h2>HELP &amp; SUPPORT</h2>
        <p>We are available <strong>24 hours a day, 7 days a week</strong>. Any technical issue, install, printer, sync, or license — contact us and we fix it, with no extra charge for standard support.</p>

        <h3 id="ndihma-kontakt">How to contact us: phone, WhatsApp, email</h3>
        <ol class="steps">
          <li><strong>Phone:</strong> <a href="tel:+38343555294" style="color:#7dd3fc;text-decoration:underline">+383 43 555 294</a></li>
          <li><strong>WhatsApp:</strong> <a href="https://wa.me/38343555294" target="_blank" rel="noopener noreferrer" style="color:#7dd3fc;text-decoration:underline">wa.me/38343555294</a> — send a screenshot of the error.</li>
          <li><strong>Email:</strong> <a href="mailto:revolutioninvest05@gmail.com" style="color:#7dd3fc;text-decoration:underline">revolutioninvest05@gmail.com</a></li>
          <li><strong>Website:</strong> <a href="/#kontakt" style="color:#7dd3fc;text-decoration:underline">revolution-pos.com/#kontakt</a> or the <strong>24/7 Support</strong> section on the home page.</li>
          <li>Owner panel: <a href="https://revolution-pos.com/owner/login" style="color:#7dd3fc;text-decoration:underline">https://revolution-pos.com/owner/login</a></li>
        </ol>

        <h3 id="ndihma-anydesk">Remote support with AnyDesk — how it works</h3>
        <ol class="steps">
          <li>Download and open <strong>AnyDesk</strong> on the POS computer (from <a href="https://anydesk.com" target="_blank" rel="noopener noreferrer" style="color:#7dd3fc;text-decoration:underline">anydesk.com</a>).</li>
          <li>Send us your AnyDesk ID via WhatsApp or phone.</li>
          <li>Accept the connection request when it appears on screen.</li>
          <li>Our technician connects remotely, fixes the issue, and explains what was done.</li>
        </ol>
        <div class="box box-warning">
          <div class="box-title">⚠️ Warning</div>
          <p>Do not accept AnyDesk requests from unknown people. Connect only with the Revolution Invest team.</p>
        </div>

        <h3 id="ndihma-update">Automatic updates</h3>
        <ol class="steps">
          <li>The POS app checks for a new version when online.</li>
          <li>When an update is available, a notification appears — download and install (usually a few clicks).</li>
          <li>After install, reopen the app. Local data is kept; you do not need to re-enter the menu or tables.</li>
          <li>If the update fails, contact us — we can install it remotely via AnyDesk.</li>
        </ol>

        <h3 id="ndihma-bug">How to report a problem or bug</h3>
        <ol class="steps">
          <li>Write briefly: <em>what you were doing</em>, <em>what you expected</em>, <em>what happened</em>.</li>
          <li>Add a <strong>screenshot</strong> of the error or screen.</li>
          <li>Include: venue name, POS version (if known), and whether it happens on phone, web panel, or register.</li>
          <li>Send via WhatsApp <a href="https://wa.me/38343555294" target="_blank" rel="noopener noreferrer" style="color:#7dd3fc;text-decoration:underline">+383 43 555 294</a> or email <a href="mailto:revolutioninvest05@gmail.com" style="color:#7dd3fc;text-decoration:underline">revolutioninvest05@gmail.com</a>.</li>
          <li>We confirm receipt and notify you when it is fixed.</li>
        </ol>
        <div class="box box-tip">
          <div class="box-title">💡 Tip</div>
          <p>More detail (step by step + photo) means we find and fix the issue faster.</p>
        </div>`

};
