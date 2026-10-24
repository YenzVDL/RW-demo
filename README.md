# Rechtswinkel Amsterdam

Werkende Next.js-frontend met een afzonderlijk WordPress/PHP/MariaDB-CMS. De bronwebsite is alleen publiek gelezen. Er is niets gepubliceerd en er zijn geen DNS-wijzigingen uitgevoerd.

De lokale preview gebruikt **echte WordPress-content**, geen gesimuleerde CMS-verbinding. Alle broninhoud is nog ongekeurd. Staging toont reviewlabels en staat op noindex; productie is geblokkeerd totdat essentiële inhoud is goedgekeurd.

## Versies en project

Node **24.21.0 LTS**, Next.js **16.4.3** (App Router, SSR), React **19.3.1**, TypeScript **5.9.3**, WordPress **7.1.3**, PHP **8.4**, MariaDB **11.4.10**. De lokaal geteste Windows-PHP-versie is **8.4.27**. Npm-versies staan exact vast met `package-lock.json`; containerimages zijn op digest vastgezet. De officiële Node-releasepagina, Next-documentatie, WordPress REST-documentatie en officiële download-/registrymetadata zijn geraadpleegd op 24 oktober 2026.

```text
src/                         Next.js, componenten, CMS-client en contentbeleid
wordpress/plugins/rwa-headless/  eigen WordPress-plugin, geen betaalde plugins
scripts/                     bronexport, idempotente import en lokale inrichting
content/raw/                 ongewijzigde publieke API-/HTML-/CSS-exports
content/source-manifest.json inhoud, oorspronkelijke tekst, bron en reviewstatus
content/asset-manifest.json  bestaande beelden/documenten en lokale bestanden
content/snapshot.json        expliciete offline-preview van de bronexport
content/redirects.json       bestaande URL’s naar nieuwe bestemmingen
docs/                        inventaris, besluiten, beheergids, deployment en controles
tests/                       contentbeleid, CMS-integratie en browsertests
```

## Schone checkout met Docker Compose

Vereist: Node 24, npm, Docker Engine/Desktop met Compose v2 en bereikbare npm-/containerregistries. De uitvoering van Compose kon op de bouwmachine niet worden getest omdat Docker/WSL daar ontbreken. Dezelfde services zijn daar wel echt met PHP en MariaDB getest. Zie `docs/verification.md`.

```powershell
npm ci
npm run secrets:init
docker compose up --build -d db wordpress frontend
npm run cms:setup
```

`secrets:init` maakt een genegeerde `.env` met unieke lokale geheimen. `cms:setup` installeert WordPress, activeert de plugin, maakt tijdelijk een application password, importeert echte media/content en trekt dat tijdelijke wachtwoord weer in. Geheimen blijven tijdens deze flow in procesgeheugen. Voer de onderliggende `docker-app-password.php` niet rechtstreeks uit naar een terminal.

- Frontend: **http://localhost:3000**
- CMS: **http://localhost:8080/wp-admin/**
- Beheerdersnaam/wachtwoord: lokale `.env`, niet in Git.
- `docker compose stop` stopt de services; volumes blijven behouden. Gebruik geen `down -v` voor een gewone herstart.

Herhaal `npm run cms:setup` voor een herimport. Ongewijzigde records worden niet gedupliceerd. Gewijzigde redactionele inhoud blijft behouden; een bronconflict krijgt `conflict_preserved` en exitcode 2. Importverslagen staan in de genegeerde map `content/import-reports/`.

## Windows zonder Docker

De bouwmachine gebruikt deze optie. Dit wijzigt geen systeem-PATH, installeert geen service en bindt PHP en MariaDB alleen aan loopback. De officiële PHP- en MariaDB-downloads worden met SHA-256 gecontroleerd. Een bestaande Visual C++ x64-runtime is vereist voor PHP.

De onderstaande installatie voert u één keer uit. Stop een draaiende `npm run dev` eerst met **Ctrl+C**: Windows vergrendelt het Next.js-bestand zolang die preview draait, waardoor `npm ci` anders `EPERM` kan geven. Een bestaand `.env`-bestand en reeds uitgepakte runtimebestanden blijven bij opnieuw uitvoeren behouden.

```powershell
npm ci
npm run secrets:init
npm run runtime:setup
npm run runtime:windows
```

Laat de laatste opdracht draaien. In een tweede terminal:

```powershell
npm run cms:import
npm run dev
```

De runtime maakt `.env.local` met een application password voor het lokale test-CMS. MariaDB luistert op `127.0.0.1:3307`, WordPress op `127.0.0.1:8080`. De PHP-server is een ontwikkelserver. Stop de runtime met Ctrl+C. `runtime:setup` is bewust op PHP 8.4.27 vastgezet; als de officiële actuele download verandert, gebruik de officiële archieven of werk de pin en checksum bewust bij.

Voor een gewone herstart zijn alleen `npm run runtime:windows` en `npm run dev` nodig. De database, media en configuratie staan onder `.runtime/`, buiten Git. Gebruik deze runtime niet tegelijk met Compose op dezelfde poorten.

Als beide processen al draaien, kunt u direct **http://127.0.0.1:3000/** openen. U hoeft `npm ci` of de installatiecommando’s dan niet opnieuw uit te voeren.

## Brononderzoek en import

```powershell
npm run source:fetch
npm run source:build
npm run cms:import
```

`source:fetch` leest uitsluitend de publieke bronhost, verwerkt `X-WP-TotalPages` met een bovengrens en bewaart ruwe exports afzonderlijk. `source:build` reconstrueert de content uit deze exports en slaat gebruikte originele assets lokaal op; ontbrekende lokale assets worden alleen van de bronhost gehaald. De snapshot is gedateerd in `content/raw/fetch.json`.

Een directe CMS-import vereist `WORDPRESS_URL`, `WORDPRESS_USER` en `WORDPRESS_APP_PASSWORD` in de omgeving of een genegeerd env-bestand. Hij is standaard beperkt tot lokale hosts en weigert altijd de bestaande bronwebsite. Voor een eigen staginghost is een bewuste `ALLOW_CMS_IMPORT=1` nodig. Gebruik uitsluitend een eigen CMS. Publicatiegoedkeuring wordt nooit door een import aangemaakt.

De importer vergelijkt de vaste broncode, importhash en een fingerprint van de vorige geïmporteerde veldset. Hij overschrijft gewijzigde redactionele inhoud niet. Media worden op bron-URL herkend. Nieuwe bronversies bij een conflict staan privé in het CMS naast de lokale versie.

## Expliciete offline preview

Zet in `.env.local` `CONTENT_MODE=offline` en `SITE_STAGE=staging`, en start `npm run dev`. De bovenbalk vermeldt **Offline preview** en de datum van de echte bronexport. De actuele CMS-modus gebruikt `CONTENT_MODE=wordpress`.

Er is geen automatische fallback. Bij CMS-uitval toont de frontend een begrijpelijke melding zonder oude contacttijden. `CONTENT_MODE=offline` is verboden in productiemodus.

## Preview, cache en tijd

De WordPress-bewerkingsschermen bieden een **Beveiligde conceptpreview**. Een HMAC-link is vijf minuten geldig; de draftcookie is aan het record en een verloopdatum gebonden en is 30 minuten geldig. De frontend haalt het concept met een server-side signature op. Verzoeken en responses gebruiken geen publieke cache. Verkeerde of verlopen signatures geven 401. Interne notities, importconflicten en persoonlijke goedkeurdersgegevens staan niet in de publieke API.

Publiceren, wijzigen, prullenbak en verwijderen sturen een HMAC-webhook naar `/api/revalidate`. De frontend controleert tijdstempel/signature en weigert herhaling. Content wordt met `no-store` SSR opgehaald; de webhook vernieuwt tevens de routecache. Geen geheim heeft een `NEXT_PUBLIC_`-prefix.

WordPress gebruikt `Europe/Amsterdam`. Tijdgebonden meldingen hebben een volledig jaartal en een expliciete offset. SSR en een kleine browserklok laten ze op begin/einde verschijnen/verdwijnen zonder publicatieactie. Wervingsdeadlines sluiten een ronde bij het volgende verzoek; maak nooit een deadline uit een bronzin zonder jaartal.

## Controles

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run content:check
npm run release:check
```

`content:check` rapporteert open punten zonder staging te blokkeren. `release:check` hoort op deze ongekeurde import te falen. Het commando leest de ingestelde WordPress-bron en blokkeert bij essentiële ongekeurde inhoud, ontbrekende contactvelden/tijden en onbevestigd bestuur. De productiefrontend controleert dezelfde voorwaarden en toont uitsluitend goedgekeurde inhoud.

Met draaiend lokaal CMS/frontend:

```powershell
npx playwright install chromium
npm run test:cms
npm run test:browser
```

CMS-tests wijzigen tijdelijk lokale testcontent, herstellen contactvelden, ruimen concepten op en verwijderen hun eigen testgebruiker. Ze weigeren externe CMS-hosts. Browsertests gebruiken desktop en mobiel, controleren kernroutes, taalkeuze, telefoonlinks, echte PDF’s, noindex, afgeschermde endpoints en redirects. Screenshots/traces staan in `test-results/`. Dit is geen WCAG-certificering.

De CMS- en CMS-browsertests vereisen een lokaal application password in `.env.local` (de Windows-runtime maakt dit aan). Bij Compose kunt u dit voor testgebruik via het WordPress-gebruikersprofiel aanmaken en na de tests intrekken; `cms:setup` trekt zijn eigen importwachtwoord direct in. Met `node scripts/verify-runtime.mjs` controleert u na de build apart CMS-uitval, de productieblokkade en de expliciete offlinepreview.

## Zelfstandig beheer en deployment

Lees [de Nederlandse beheergids](docs/beheergids.md) voor teksten, kanalen, meldingen, artikelen, werving, team/bestuur, partners en documenten. De [contentbesluiten](docs/content-decisions.md) bevatten de concrete goedkeuringsvragen. [Deployment en herstel](docs/deployment.md) beschrijft TLS, volumes, backups en terugzetten.

Officiële technische referenties: [Next App Router](https://nextjs.org/docs/app), [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [WordPress REST API](https://developer.wordpress.org/rest-api/), [REST-ondersteuning voor contenttypen](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-rest-api-support-for-custom-content-types/), [Node-releases](https://nodejs.org/en/about/previous-releases).
