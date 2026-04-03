# Plani i Zhvillimit dhe Dokumentimi i Platformës "WorkPulse"

## 1. Pasqyra e Platformës
**WorkPulse** është një platformë moderne e tregut të punës, e fokusuar specifikisht në tregun e Kosovës. Qëllimi kryesor është lidhja e shpejtë dhe transparente midis punëkërkuesve dhe punëdhënësve, duke ofruar një përvojë të thjeshtë, të sigurtë dhe profesionale.

### Vizioni dhe Qëllimet:
- **Për Punëkërkuesit:** Aplikim i shpejtë, ndjekje transparente e statusit të aplikimit dhe një profil profesional.
- **Për Punëdhënësit:** Menaxhim i lehtë i shpalljeve, filtër i kandidatëve dhe komunikim i automatizuar.
- **Teknologjia:** E ndërtuar me një "stack" modern dhe të lehtë: HTML/CSS/JS në frontend, Node.js/Express në backend, dhe SQLite si bazë të dhënash.

---

## 2. Strukturimi i Roleve në Platformë

Platforma bazohet në ndarjen e qartë të tre roleve kryesore:

1.  **Punëkërkuesi (Job Seeker):**
    - Mund të krijojë profilin (CV-në digjitale).
    - Shfleton dhe filtron punët sipas qytetit, kategorisë dhe llojit të punës.
    - Aplikon me një klik dhe ndjek historikun e aplikimeve.
    
2.  **Punëdhënësi (Employer/Company):**
    - Krijon profilin e kompanisë dhe e verifikon atë.
    - Publikon shpallje të reja pune.
    - Menaxhon kandidatët (Shortlist, Interview, Reject, Hire).
    - Merr njoftime automatike për aplikime të reja.

3.  **Administratori (Admin):**
    - Moderimi i shpalljeve për të evituar spam-in ose mashtrimet.
    - Menaxhimi i përdoruesve dhe mbështetja teknike.
    - Monitorimi i metrikave të platformës (numri i punëve aktive, aplikimet, etj.).

---

## 3. Arkitektura e Dokumenteve (Struktura e File-ave)

Ky seksion shpjegon secilin dokument në projekt dhe funksionin e tij:

### Faqet HTML (Frontend)
- **`index.html`**: Faqja kryesore (Landing Page). Prezantimi i platformës, statistikat publike dhe navigimi drejt kategorive kryesore.
- **`signin.html`**: Sistemi i kyçjes dhe regjistrimit. Këtu përdoruesi zgjedh rolin e tij (Punëkërkues apo Punëdhënës).
- **`apply.html`**: Portali i shpalljeve. Listimi i të gjitha vendeve të lira të punës dhe forma e aplikimit.
- **`jobseeker-dashboard.html`**: Paneli kryesor për punëkërkuesit. Shihen këtu pikat kyçe si profili dhe aktivitetet e fundit.
- **`jobseeker-applications.html`**: Menaxhimi i detajuar i aplikimeve të dërguara nga punëkërkuesi.
- **`employer-dashboard.html`**: Paneli operativ për kompanitë me statistikat e shpalljeve dhe aplikimeve.
- **`employer-jobs.html`**: Menaxhimi i shpalljeve të punës: krijimi, editimi, fshirja ose ndalimi i tyre (Pause).
- **`employer-applications.html`**: Sistemi i rishikimit të kandidatëve (Applicant Tracking System - ATS).
- **`employer-company-settings.html`**: Profili i kompanisë (Logo, përshkrimi, rrjetet sociale).
- **`admin.html`**: Qendra e moderimit për stafin e platformës.
- **`reset-password.html`**: Faqja për rivendosjen e fjalëkalimit përmes email-it.

### Stilet (CSS)
- **`styles/styles.css`**: Stilet globale që sigurojnë dizajnin premium, tipografinë dhe "layout-in" fiks.
- **`styles/theme.css`**: Menaxhimi i variablave të temës (Light & Dark Mode). Përmban paletat e ngjyrave dhe efektet "glassmorphism".
- **`styles/signin.css`**: Stile specifike për format e autentikimit.
- **`styles/modern-sections.css`**: Komponentët modernë si "Hero section", "Stats section", etj.

### Logjika (JavaScript)
- **`script/scripts.js`**: Menaxhon navigimin, menunë mobile dhe funksionet e përbashkëta në frontend.
- **`script/shared/theme-manager.js`**: Integrimi i sistemit që mban mend preferencën e përdoruesit për temën (Dark/Light).
- **`script/shared/api.js`**: Komunikimi me serverin (Axios/Fetch) për të marrë apo dërguar të dhëna.
- **`script/shared/auth.js`**: Kontrollon nëse përdoruesi është i kyçur dhe nëse ka qasje në faqe specifike sipas rolit.

### Backend & Baza e të Dhënave
- **`backend/server.js`**: "Zemra" e serverit tonë. Përmban rrugëtimet (routes) për API-n dhe nisjen e aplikacionit.
- **`backend/db/`**: Dosja ku ruhet baza e të dhënave SQLite (`database.sqlite`).
- **`backend/routes/`**: Ndarja e API-ve sipas funksionit (auth.js, jobs.js, applications.js).

---

## 4. Siguria dhe Standardet
- **Bcrypt.js**: Përdoret për enkriptimin e fjalëkalimeve. Asnjë fjalëkalim nuk ruhet tekst në databazë.
- **JWT (JSON Web Tokens)**: Përdoren për sesionet e sigurta të përdoruesve.
- **Validimi**: Çdo informatë e dërguar kontrollohet në server për të evituar sulmet si SQL Injection ose XSS.
- **Localization (Kosova)**: Qytetet janë të paracaktuara për Kosovën, monedha është Euro (€) dhe formati i telefonit është i standardizuar (+383).

---

## 5. Plani i Zhvillimit (Roadmap)

### Faza 1: Fondacioni (Java 1-2)
- Strukturimi i saktë i databazës.
- Implementimi i sistemit të regjistrimit me role.
- Krijimi i bazës vizuale me Light/Dark mode në të gjitha faqet.

### Faza 2: Funksionaliteti Kryesor (Java 3-4)
- Publikimi i punëve nga punëdhënësit.
- Sistemi i aplikimit për punëkërkuesit.
- Integrimi i email-e-ve për njoftime (Nodemailer).

### Faza 3: Polishing (Java 5)
- Optimizimi për mobile (Përgjegjshmëria).
- Sistemi i kërkimit (Search) dhe filtrimit të avancuar.
- Testimi i sigurisë dhe lëshimi në "Production".

---
**WorkPulse** - *Karriera juaj e ardhshme fillon këtu.*
