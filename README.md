# WorkPulse (PunaIme) - Dokumentacioni Teknik & Arkitektura e Platformës

**WorkPulse (PunaIme)** është një platformë bashkëkohore për rekrutimin dhe menaxhimin e punësimit në Kosovë dhe rajon. Platforma u mundëson punëkërkuesve të gjejnë dhe aplikojnë për punë, punëdhënësve të menaxhojnë njoftimet për vende të lira pune dhe aplikantët (ATS), si dhe administratorëve të kenë kontroll të plotë mbi platformën.

---

## 1. Përmbledhje e Projektit & Arkitektura

Platforma është ndërtuar me një arkitekturë modulare:
- **Frontend**: Ndërfaqe e pasur me Vanilla HTML5, CSS3 të avancuar (variabla CSS, mbështetje për temën Light/Dark, dizajne responsive) dhe JavaScript modular (`script/`).
- **Backend**: Node.js & Express (ES Modules) me arkitekturë të shtresëzuar (Routes -> Middleware -> Controllers / Services -> DB Client / Migrations).
- **Baza e të Dhënave**: SQLite me `sql.js` me migrime automatike dhe ruajtje të vazhdueshme në disk (`backend/punaime.db`).
- **Autentikimi & Siguria**:
  - Hashing i fjalëkalimeve me `bcryptjs`.
  - Sesione të sigurta me cookies HTTP-only (`platforma_session`) dhe mbështetje për Bearer tokens.
  - Integrim me Google Sign-In (`google-auth-library`).
  - Kontroll i qasjes me role (RBAC): `admin`, `employer`, `jobseeker`.
  - Mbrojtje me `helmet` (CSP, CORS me origjinë të kufizuar, parandalim sniffing).
  - Kufizim i shpejtësisë së kërkesave (`express-rate-limit`) për të parandaluar sulmet brute-force.
  - Ngarkim i sigurt i skedarëve me `multer` (CV/Rezume të mbrojtura me validim lloji dhe qasje të autorizuar).

---

## 2. Struktura e Plotë e Skedarëve në Projekt

```text
Platforma/
├── .gitignore                         # Rregullat për përjashtimin e skedarëve të ndjeshëm/build
├── README.md                          # Ky dokumentacion teknik
├── LOGO-PunaIme.png                   # Logoja zyrtare e platformës
├── Platforma_Plan.md                  # Plani i arkitekturës dhe specifikimet
├── Implement_Platforma_Plan.md        # Udhëzuesi i implementimit dhe verifikimit
├── temp-start-backend.js              # Skript ndihmës për nisjen e shpejtë
│
├── Faqet Kryesore (Frontend HTML):
│   ├── index.html                     # Faqja kryesore (Landing page, statistika, partnerë, kontakt)
│   ├── apply.html                     # Shfletimi i vendeve të punës, filtrimi dhe formulari i aplikimit
│   ├── signin.html                    # Kyçja & Regjistrimi (Punëkërkues / Punëdhënës, Google OAuth)
│   ├── reset-password.html            # Rivendosja e fjalëkalimit me token të sigurt
│   ├── pricing.html                   # Planet dhe çmimet për punëdhënës (Falas, Standard, Premium, Ndërmarrje)
│   ├── employer-dashboard.html        # Paneli kryesor i punëdhënësit (Metrika, aplikantë të fundit)
│   ├── employer-jobs.html             # Menaxhimi i vendeve të punës nga punëdhënësi (CRUD)
│   ├── employer-applications.html     # Shqyrtimi i kandidatëve (ATS), shkarkimi i CV-ve, ndryshimi i statusit
│   ├── employer-company-settings.html # Konfigurimi i profilit dhe të dhënave të kompanisë
│   ├── jobseeker-dashboard.html       # Paneli i punëkërkuesit (Statusi i aplikimeve, rekomandime)
│   ├── jobseeker-applications.html    # Historia e aplikimeve të punëkërkuesit
│   ├── admin.html                     # Paneli i administratorit (Statistika, menaxhimi i përdoruesve dhe punëve)
│   ├── privacy.html                   # Politika e privatësisë
│   └── terms.html                     # Kushtet e përdorimit
│
├── script/                            # Logjika e Frontend-it (JavaScript)
│   ├── admin.js                       # Paneli i administratorit dhe raportet
│   ├── apply.js                       # Filtrimi, kërkimi, modali i detajeve dhe ngarkimi i CV-së
│   ├── config.js                      # Konfigurimi global i frontend-it (API Base URL)
│   ├── pricing.js                     # Përzgjedhja e planeve të çmimeve dhe kalkulimi
│   ├── reset-password.js              # Menaxhimi i kërkesës dhe vendosjes së fjalëkalimit të ri
│   ├── scripts.js                     # Ndërveprimet e faqes kryesore, navigimi mobil, modali i kontaktit
│   ├── signin.js                      # Autentikimi, validimi i formularëve, Google Sign-In
│   ├── employer/
│   │   ├── applications.js            # Menaxhimi i kandidatëve për punëdhënësin
│   │   ├── company-settings.js        # Ruajtja e të dhënave të kompanisë
│   │   ├── dashboard.js               # Ngarkimi i të dhënave analitike të punëdhënësit
│   │   └── jobs.js                    # Shtimi, editimi dhe fshirja e njoftimeve për punë
│   ├── jobseeker/
│   │   ├── applications.js            # Lista dhe gjurmimi i aplikimeve të kandidatit
│   │   └── dashboard.js               # Statistikat dhe aplikimet e fundit të kandidatit
│   └── shared/
│       ├── api.js                     # Klient i centralizuar HTTP me mbështetje për cookies & tokens
│       ├── auth.js                    # Gjendja e sesionit, kontrolli i roleve dhe shkyçja
│       ├── modern-animations.js       # Animacionet e ndërfaqes dhe efektet vizuale
│       ├── partners-section.js        # Karuseli dhe shfaqja e partnerëve
│       ├── stats-counter.js           # Numëruesi i animuar i statistikave
│       ├── theme-manager.js           # Menaxheri i temave (Dark Mode / Light Mode me localStorage)
│       └── toast.js                   # Njoftimet moderne (Toast alerts)
│
├── styles/                            # Stilizimi (CSS)
│   ├── modern-sections.css            # Seksionet moderne të faqeve kryesore
│   ├── partner-section.css            # Stilizimi i seksionit të partnerëve
│   ├── pricing.css                    # Dizajni i tabelave të çmimeve dhe kartave
│   ├── signin.css                     # Dizajni i formularëve të kyçjes dhe regjistrimit
│   ├── style.css                      # Stilet bazë të përgjithshme
│   ├── styles.css                     # Stilet plotësuese
│   └── theme.css                      # Sistemi i variablave të temës (Dark/Light mode)
│
└── backend/                           # Serveri dhe Shërbimet e Backend-it (Node.js/Express)
    ├── package.json                   # Varësitë dhe skriptat e projektit (v2.0.0)
    ├── package-lock.json              # Versionet e fiksuara të varësive
    ├── .env.example                   # Shembull i sigurt i variablave të mjedisit
    ├── schema.sql                     # Skema SQL
    ├── add_jobs.sql                   # Shembuj të të dhënave fillestare
    ├── database.js                    # Wrapper i vjetër i bazës së të dhënave
    ├── init-db.js                     # Skript fillestar i bazës së të dhënave
    ├── server.js                      # Entrypoint i mëparshëm i thjeshtë
    ├── scripts/
    │   ├── migrate.js                 # Ekzekutimi i migrimeve të bazës së të dhënave
    │   ├── seed.js                    # Mbushja me të dhëna fillestare (seed)
    │   ├── seed-lib.js                # Biblioteka e gjenerimit të të dhënave fillestare
    │   └── add_medical_education_jobs.js # Shtimi i kategorive specifike të punëve
    ├── tests/
    │   └── smoke.test.js              # Teste automatike (Health check, mbrojtja e rrugëve)
    ├── uploads/
    │   └── cv/
    │       └── .gitkeep               # Ruan dosjen në git (skedarët PDF përjashtohen në .gitignore)
    └── src/                           # Arkitektura Modulare v2.0
        ├── app.js                     # Express app factory, middlewares, rrugët, siguria
        ├── server.js                  # Nisja e serverit HTTP dhe inicializimi i DB
        ├── config/
        │   ├── constants.js           # Rolet (ADMIN, EMPLOYER, JOBSEEKER), planet, statuset
        │   └── env.js                 # Ngarkimi dhe validimi i variablave të mjedisit
        ├── db/
        │   ├── client.js              # Klienti i bazës së të dhënave (sql.js me auto-save)
        │   └── migrations/
        │       ├── index.js           # Përkufizimi i migrimeve të skemës
        │       └── runner.js          # Ekzekutuesi i migrimeve me versionim
        ├── middleware/
        │   ├── auth.js                # Bashkëngjitja e përdoruesit dhe kërkesa e autentikimit
        │   ├── error-handler.js       # Trajtimi i gabimeve dhe 404
        │   ├── request-id.js          # Gjenerimi i X-Request-Id për auditim
        │   ├── roles.js               # Kontrolli i roleve (RBAC)
        │   ├── upload.js              # Konfigurimi i sigurt i Multer për CV (PDF, DOC, DOCX)
        │   └── validate.js            # Middleware validues me express-validator
        ├── routes/
        │   ├── admin.routes.js        # Rrugët administrative
        │   ├── applications.routes.js # Rrugët e aplikimeve dhe shkarkimit të CV-ve
        │   ├── auth.routes.js         # Rrugët e autentikimit dhe Google OAuth
        │   ├── contact.routes.js      # Rruga e mesazheve të kontaktit
        │   ├── employer.routes.js     # Rrugët e menaxhimit nga punëdhënësi
        │   ├── jobs.routes.js         # Rrugët publike të vendeve të punës
        │   ├── jobseeker.routes.js    # Rrugët e profilit dhe aplikimeve të punëkërkuesit
        │   └── reports.routes.js      # Rrugët e raporteve dhe analitikës
        ├── services/
        │   ├── analytics.service.js   # Përmbledhja e të dhënave për panelet
        │   ├── auth.service.js        # Regjistrimi, krahasimi i bcrypt, krijimi i sesioneve
        │   ├── email.service.js       # Dërgimi i email-eve me Nodemailer
        │   └── token.service.js       # Gjenerimi dhe validimi i token-ave të sesionit
        ├── utils/
        │   ├── async-handler.js       # Wrapper për trajtimin e gabimeve asinkrone
        │   └── sanitize.js            # Pastrimi i të dhënave nga sulmet XSS
        └── validators/
            ├── admin.validators.js    # Rregullat e validimit për admin
            ├── application.validators.js # Rregullat e validimit për aplikime
            ├── auth.validators.js     # Rregullat e validimit për login/register
            ├── employer.validators.js # Rregullat e validimit për punëdhënës
            └── job.validators.js      # Rregullat e validimit për postimin e punëve
```

---

## 3. Siguria dhe Konfidencialiteti (.gitignore)

Projekti përmban një skedar `.gitignore` gjithëpërfshirës për të garantuar që **asnjë e dhënë konfidenciale ose private nuk publikohet në Git**:
- **Variablat e mjedisit**: `.env`, `backend/.env`, `*.env` janë të përjashtuara rreptësisht (përfshirë fjalëkalimet e email-it dhe çelësat e Google OAuth). Vetëm `.env.example` ruhet si shabllon.
- **Skedarët e ngarkuar nga përdoruesit**: Të gjitha CV-të dhe rezumetë në `backend/uploads/cv/*` përjashtohen plotësisht nga repo për mbrojtjen e të dhënave personale (GDPR / privatësi). Ruhet vetëm skedari struktural `.gitkeep`.
- **Baza e të dhënave**: Skedarët SQLite `backend/punaime.db`, `*.db`, `*.sqlite3` përjashtohen nga versionimi për të mos ekspozuar të dhëna reale të llogarive.
- **Varësitë dhe Log-et**: Dosjet `node_modules/`, `logs/`, dhe skedarët e skanimit `.scannerwork/` / `sonar-project.properties` janë të injoruara.

---

## 4. Variablat e Mjedisit (Environment Variables)

Për të konfiguruar mjedisin lokal, kopjoni skedarin `.env.example` në `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variabla | Vlera e Parazgjedhur | Përshkrimi |
|---|---|---|
| `NODE_ENV` | `development` | Mjedisi i ekzekutimit (`development` ose `production`) |
| `PORT` | `3000` | Porta ku dëgjon serveri Express |
| `APP_ORIGIN` | `http://localhost:3000` | Origjina e lejuar për CORS dhe sesione |
| `SESSION_SECRET` | `ndrysho-kete-ne-produksion` | Çelësi sekret për nënshkrimin e sesioneve |
| `SESSION_COOKIE_NAME` | `platforma_session` | Emri i cookie-t të sesionit |
| `SESSION_TTL_SECONDS` | `604800` (7 ditë) | Kohëzgjatja e vlefshmërisë së sesionit në sekonda |
| `EMAIL_USER` | `""` | Adresa e postës elektronike për dërgimin e email-eve me Nodemailer |
| `EMAIL_PASS` | `""` | Fjalëkalimi i aplikacionit (App Password) për SMTP |
| `ADMIN_EMAIL` | `""` | Adresa e administratorit për pranimin e njoftimeve |
| `DEFAULT_FROM_EMAIL` | `""` | Dërguesi i parazgjedhur i email-eve |
| `GOOGLE_CLIENT_ID` | `""` | Client ID nga Google Cloud Console për Google Sign-In |
| `DB_FILE` | `backend/punaime.db` | Shtegu drejt skedarit të bazës së të dhënave SQLite |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 minuta) | Dritarja kohore për kufizuesin e kërkesave |
| `RATE_LIMIT_MAX_REQUESTS` | `10000` | Maksimumi i kërkesave të lejuara për dritare kohore |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `1000` | Maksimumi i kërkesave të lejuara për rrugët e autentikimit |
| `APPLY_RATE_LIMIT_MAX_REQUESTS` | `30` | Maksimumi i aplikimeve të lejuara për dritare kohore |

> [!WARNING]
> Mos e ngarkoni asnjëherë skedarin `backend/.env` me fjalëkalime ose kredenciale reale në Git.

---

## 5. Si të Nisni Projektin Lokalisht

### Parakushtet
- **Node.js**: Versioni 18 ose më i ri (testuar me sukses në Node 22).
- **npm**: Versioni 9 ose më i ri.

### Instalimi dhe Inicializimi i Backend-it

```bash
# Kaloni në dosjen e backend-it
cd backend

# Instaloni varësitë
npm install

# Ekzekutoni migrimet dhe mbushjen me të dhëna fillestare (seed)
npm run setup-db

# Nisni serverin në modalitet zhvillimi
npm run dev
```

Serveri do të nisë në `http://localhost:3000`.

### Ekzekutimi i Testeve Automatike

```bash
cd backend
npm test
```

Testet e përfshira verifikojnë endpoint-in e shëndetit (`GET /api/health`) dhe sigurinë e shkarkimit të CV-ve pa autentikim (`GET /api/applications/:id/cv`).

---

## 6. Lidhjet e Faqeve (Frontend Navigation)

| Faqja | URL Lokale | Roli Kryesor |
|---|---|---|
| Ballina | `http://localhost:3000/index.html` | Publik |
| Shfletimi i Punëve | `http://localhost:3000/apply.html` | Publik / Punëkërkues |
| Kyçja / Regjistrimi | `http://localhost:3000/signin.html` | Publik |
| Rivendosja e Fjalëkalimit | `http://localhost:3000/reset-password.html` | Publik |
| Planet dhe Çmimet | `http://localhost:3000/pricing.html` | Publik / Punëdhënës |
| Paneli i Punëdhënësit | `http://localhost:3000/employer-dashboard.html` | Punëdhënës |
| Menaxhimi i Punëve | `http://localhost:3000/employer-jobs.html` | Punëdhënës |
| Kandidatët e Punëdhënësit | `http://localhost:3000/employer-applications.html` | Punëdhënës |
| Profili i Kompanisë | `http://localhost:3000/employer-company-settings.html` | Punëdhënës |
| Paneli i Punëkërkuesit | `http://localhost:3000/jobseeker-dashboard.html` | Punëkërkues |
| Aplikimet e Mia | `http://localhost:3000/jobseeker-applications.html` | Punëkërkues |
| Paneli Administrativ | `http://localhost:3000/admin.html` | Administrator |
| Politika e Privatësisë | `http://localhost:3000/privacy.html` | Publik |
| Kushtet e Përdorimit | `http://localhost:3000/terms.html` | Publik |

---

## 7. Pasqyra e Plotë e API-ve (Endpoints)

Të gjitha rrugët e prapavijës shërbehen nën parashtesën `/api`.

### Autentikimi (`/api/auth`)
- `POST /api/auth/register` - Regjistrimi i përdoruesit të ri me rol (`jobseeker` ose `employer`). Validon fjalëkalimin dhe bën hash me `bcrypt`.
- `POST /api/auth/login` - Kyçja me email dhe fjalëkalim; gjeneron sesionin dhe cookie-n e sigurt.
- `POST /api/auth/google` - Verifikon token-in e Google OAuth dhe kyç/regjistron llogarinë.
- `GET /api/auth/google/config` - Kthen Client ID publik për Google Sign-In në frontend.
- `POST /api/auth/forgot-password` - Dërgon email me linkun dhe token-in për rivendosjen e fjalëkalimit.
- `POST /api/auth/reset-password` - Përditëson fjalëkalimin duke përdorur token-in e vlefshëm.
- `GET /api/auth/me` - Kthen profilin e përdoruesit të kyçur aktualisht.
- `POST /api/auth/logout` - Pastron cookie-n e sesionit dhe shkyç përdoruesin.

### Vendet e Punës (`/api/jobs`)
- `GET /api/jobs` - Kërkim publik me filtra (kategori, lloji i punës, lokacioni, orari) dhe faqosje (pagination).
- `GET /api/jobs/:id` - Detajet e plota të një vendi pune specifik.
- `GET /api/jobs/categories` - Lista e të gjitha kategorive të disponueshme.

### Aplikimet & CV (`/api/applications`)
- `POST /api/applications` - Dorëzimi i aplikimit të ri me ngarkim skedari (CV në format PDF/DOC/DOCX përmes Multer).
- `GET /api/applications/my` - Lista e aplikimeve të dorëzuara nga punëkërkuesi i kyçur.
- `GET /api/applications/:id` - Detajet e një aplikimi specifik.
- `GET /api/applications/:id/cv` - Shkarkimi i sigurt i skedarit të CV-së (i qasshëm vetëm nga punëdhënësi pronar ose administratori).

### Portali i Punëdhënësit (`/api/employer`) - *Kërkon rolin `employer`*
- `GET /api/employer/dashboard` - Statistikat e punëdhënësit (numri i shpalljeve aktive, aplikantëve, shikimeve).
- `GET /api/employer/jobs` - Lista e të gjitha shpalljeve të krijuara nga kompania.
- `POST /api/employer/jobs` - Krijimi i një shpalljeje të re pune.
- `PUT /api/employer/jobs/:id` - Përditësimi i të dhënave të një shpalljeje ekzistuese.
- `PATCH /api/employer/jobs/:id/status` - Aktivizimi/çaktivizimi i shpalljes së punës.
- `DELETE /api/employer/jobs/:id` - Fshirja e shpalljes së punës.
- `GET /api/employer/applications` - Lista e kandidatëve që kanë aplikuar në shpalljet e këtij punëdhënësi.
- `PATCH /api/employer/applications/:id/status` - Ndryshimi i statusit të aplikantit (`shqyrtim`, `intervistë`, `pranuar`, `refuzuar`).
- `GET /api/employer/company` - Marrja e të dhënave të profilit të kompanisë.
- `PUT /api/employer/company` - Përditësimi i logos, përshkrimit, faqes së internetit dhe vendndodhjes së kompanisë.
- `GET /api/employer/plans` - Pasqyra e planeve të abonimit dhe planit aktual të kompanisë.
- `POST /api/employer/plans/upgrade` - Kërkesë për kalim në plan më të lartë (Standard, Premium, Enterprise).

### Portali i Punëkërkuesit (`/api/jobseeker`) - *Kërkon rolin `jobseeker`*
- `GET /api/jobseeker/dashboard` - Pasqyra e shpejtë e aktivitetit dhe rekomandimeve.
- `GET /api/jobseeker/applications` - Historia e detajuar e të gjitha aplikimeve me statuset e tyre përkatëse.
- `GET /api/jobseeker/profile` - Të dhënat e profilit personal të kandidatit.
- `PUT /api/jobseeker/profile` - Përditësimi i profilit të kandidatit.

### Paneli Administrativ (`/api/admin`) - *Kërkon rolin `admin`*
- `GET /api/admin/stats` - Metrika të plota globale mbi platformën (përdorues total, punë aktive, aplikime).
- `GET /api/admin/users` - Lista e të gjithë përdoruesve me filtrime sipas rolit.
- `PATCH /api/admin/users/:id/role` - Ndryshimi i rolit të një përdoruesi.
- `DELETE /api/admin/users/:id` - Çregjistrimi ose fshirja e një llogarie përdoruesi.
- `GET /api/admin/jobs` - Mbikëqyrja dhe moderimi i të gjitha vendeve të punës në platformë.
- `DELETE /api/admin/jobs/:id` - Fshirja administrative e një vendi pune.
- `GET /api/admin/applications` - Pasqyra globale e të gjitha aplikimeve.

### Shërbimet e Sistemit & Kontaktit
- `GET /api/health` - Kontrolli i gjendjes së funksionimit të serverit (Health check).
- `POST /api/contact` - Dërgimi i formularit të kontaktit dhe njoftimi me email i administratorit.
- `GET /api/reports/jobs-summary` - Raporte të përmbledhura të vendeve të punës.

---

## 8. Përmirësimet e Implementuara në Versionin 2.0

Në versionin aktual të platformës janë adresuar dhe zgjidhur të gjitha gjetjet e mëparshme:
1. **Hashing i Fjalëkalimeve**: Të gjitha fjalëkalimet enkriptohen me `bcryptjs` me kosto të lartë kripe. Asnjë fjalëkalim nuk ruhet në tekst të thjeshtë.
2. **Autorizim i Plotë në Server**: Të gjitha rrugët e ndjeshme administrative dhe të punëdhënësit kontrollohen nga middleware-t `requireAuth` dhe `requireRole`.
3. **Mbrojtje e Integritetit të të Dhënave (XSS & Validim)**: Të gjitha të dhënat që futen filtrohen me `express-validator` dhe pastrohen me sanitize utilitar për të eleminuar sulmet XSS.
4. **Mbrojtje e Dokumenteve Private**: CV-të ruhen në dosje të mbrojtur ku qasja e drejtpërdrejtë nga shfletuesi kthen 404; shkarkimi realizohet vetëm përmes rrugës së autorizuar `/api/applications/:id/cv`.
5. **Kufizim i Shpejtësisë (Rate Limiting)**: Implementuar me `express-rate-limit` për mbrojtje ndaj sulmeve brute-force dhe spam kërkesave.
6. **Teste Automatike**: Skriptat e testeve ekzekutohen me `npm test` duke ofruar siguri në ndryshimet e ardhshme.
