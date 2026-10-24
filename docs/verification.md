# Uitgevoerde verificatie

Datum: **24 oktober 2026**, Europe/Amsterdam. Dit rapport maakt onderscheid tussen uitgevoerde controles en voorbereide configuratie.

## Werkelijk uitgevoerd

| Controle | Resultaat en bewijs |
|---|---|
| Live brononderzoek | Gerenderde homepage met Chromium gelezen; 14 pagina’s, 228 mediarecords over drie API-pagina’s, drie berichten, sitemap en huisstijl-CSS opgehaald. Zie `content/raw/` en `docs/qa/source-render.json`. De sliderhero tekende in headless deels zwart; onderliggende DOM/REST-inhoud is wel beschikbaar. |
| Nieuwe lokale installatie | PHP 8.4.27 en MariaDB 11.4.10 uit officiële downloads gestart zonder systeemservice. Lege database geïnitialiseerd, WordPress 7.1.3 geïnstalleerd, plugin geactiveerd en Nederlandse taal geïnstalleerd. Frontend, CMS en database communiceren echt. |
| Import en assets | 92 echte bronrecords, waarvan 67 gepubliceerd in staging en 25 concepten. 38 oorspronkelijke assets in de mediabibliotheek geïmporteerd. Bestaande medewerkersfoto’s hebben passende responsive varianten met behoud van verhouding. |
| Idempotentie | Herhaalde imports: `unchanged: 92`, geen dubbele inhoud of media. Een afzonderlijke mutatietest veranderde een concept en importeerde een nieuwe bronversie: `conflict_preserved`, lokale tekst bleef behouden. Verslagen onder `content/import-reports/` (buiten Git). |
| CMS-wijziging | Tijdelijk andere schrijfwijze van hetzelfde echte telefoonnummer via WordPress REST gewijzigd; SSR-header, homepage en footer namen de wijziging over. Oorspronkelijke waarde hersteld. |
| Rechten en privacy | Niet-geauthenticeerde mutatie: 401. Redacteur kan geen goedkeuring of beheerimport uitvoeren: 403. Concept ontbreekt in publieke site-API en is niet rechtstreeks publiek leesbaar. Publieke gebruikers-API: 401. Interne notities en persoonlijke goedkeurdersgegevens ontbreken in site-responses. |
| Preview en webhook | Ongeldige/verlopen preview afgewezen; geldige signed preview toont echt concept. Private/no-store headers gecontroleerd. Ondertekende webhook: 200; herhaling: 409; ontbrekende signature: 401. |
| Tijdgedrag | Unitcontroles voor Amsterdamse zomer-/wintertijd en de teruggaande klok; melding/deadline verloopt op de grens. Browsertest laat een melding verschijnen en verdwijnen met de klok, zonder publicatieactie. Testmeldingen zijn naar de prullenbak verplaatst. |
| Productiebeleid | `release:check` faalt met exitcode 1 en 34 gerapporteerde blokkerende punten op de huidige ongekeurde import. Los gestarte productiefrontend toont de reviewblokkade, geen telefoondata, noindex en een lege sitemap. Niets is namens de stichting goedgekeurd. |
| CMS-uitval | Losse frontend tegen onbereikbaar CMS getest: begrijpelijke fouttoestand, geen snapshotnummer of oude tijden. Expliciete offlinepreview is apart getest en toont modus plus brondatum. |
| Desktop en mobiel | Volledige suite: **10 geslaagd, 2 bewust overgeslagen** (de twee CMS-desktoptests worden niet dubbel op mobiel uitgevoerd). Navigatie, juridische routes, taalparen, ontbrekende vertaling, echte tel-links, echte PDF-download, noindex, beschermde endpoints, oude ankers en 308/410-gedrag gecontroleerd. |
| Tablet | Gerichte Chromium-test op iPad Mini: homepage, menu, juridische navigatie, overflow en axe-controle geslaagd. |
| Laatste headeraanpassing | Homepage-/navigatie-/overflow-/axe-test op desktop en mobiel opnieuw geslaagd na het zichtbaar houden van de belactie in de sticky header. |
| Ontbrekend beeld | Geblokkeerde mediaverzoeken leveren echte naam/alt-context op, zonder vervangbeeld. Ook fouten vóór React-hydratatie worden opgevangen. |
| Native CMS | Ingelogd in de echte Nederlandse WordPress-interface. Direct zichtbare centrale contactvelden en de signed previewlink gecontroleerd. Screenshot: `docs/qa/cms-editor-desktop.png`. |
| Toegankelijkheid | Axe met WCAG 2 A/AA, 2.1 AA en 2.2 AA-tags op de homepage: geen geconstateerde overtredingen op desktop, mobiel en tablet. Semantiek, skiplink en focusstijlen aanwezig. Dit is geen volledige WCAG-audit of certificering. |
| Technische checks | TypeScript-typecheck, ESLint, vier Node-tests voor contentbeleid/sanitizing, één CMS-integratietest, PHP-syntaxcontrole en Next-productiebuild geslaagd. Containerimage-tags en bijbehorende digests zijn tegen de officiële registry gecontroleerd. |

De browsertests en CMS-test herstellen hun tijdelijke wijzigingen. De bronwebsite is niet gewijzigd. Screenshots van de nieuwe site staan onder `docs/qa/`; volledige traces en tijdelijke testresultaten zijn genegeerd door Git.

## Grenzen van de verificatie

- **Docker/WSL ontbreekt op de bouwmachine.** Compose, het Linux-containerbootstrapcommando en een volledige schone Docker-installatie zijn daarom voorbereid maar niet uitgevoerd. De echte integratie is met lokale PHP/MariaDB-processen getest. Containerimagebestaan/digests zijn wel gecontroleerd.
- Geen publieke hosting, TLS- of DNS-omschakeling uitgevoerd. De reverse-proxyconfiguratie en backup-/herstelprocedure zijn gedocumenteerd, niet op een publieke VPS toegepast of hersteld.
- Geen volledige schermlezeraudit, ieder mogelijk apparaat of gemeten prestatiedoel geclaimd. Visuele QA omvat desktop, mobiel en de gerichte tabletweergave.
- Geen inhoudelijke juridische beoordeling of goedkeuring door de stichting. Actuele contacttijden, werving, bestuur, partnerdetails en de juridische/privacyteksten blijven expliciete contentbesluiten; zie `content-decisions.md`.

## Lokaal gebruiken

Frontend: `http://127.0.0.1:3000/`. WordPress: `http://localhost:8080/wp-admin/`. Lokale credentials staan uitsluitend in genegeerde env-bestanden. De Windows-runtime bewaart database en media onder `.runtime/`.

## Visuele herziening op verzoek

De homepage is herzien met een drukwerkcompositie, een rode belstrook, ongenummerde onderwerpen, uitklapbare bezoekroutes en drie bestaande afzonderlijke medewerkersportretten. Bestaande inhoud en CMS-statussen zijn behouden. De gebruikscontext van die portretten is in het assetmanifest uitgebreid.

Na deze wijziging zijn typecheck, lint en productiebuild geslaagd. De bestaande homepage-/navigatie-/axe-test is op desktop, mobiel en tablet uitgevoerd: drie geslaagd. Een extra controle op 320 px bevestigt geen horizontale overflow en een header van 88 px. Openen en sluiten van de nieuwe bezoekroute met Enter is apart gecontroleerd. De actuele homepagebeelden staan onder `docs/qa/`.
