# Self-hosted deployment en herstel

Er is geen publieke deployment uitgevoerd. De Compose-configuratie is een lokale stagingopstelling. Gebruik voor productie een afzonderlijke VPS-configuratie en een eigen domein; gebruik nooit de bestaande bronwebsite als importdoel.

## Inrichting

1. Gebruik een ondersteunde Linux-VPS met Docker/Compose en een reverse proxy, bijvoorbeeld Caddy. De voorbeeldroutes staan in `deploy/Caddyfile.example`. Alleen de proxy publiceert 80/443; frontend, WordPress en MariaDB blijven op het interne netwerk. De database heeft in Compose geen gepubliceerde poort.
2. Gebruik TLS voor de frontend én CMS-host. Beperk `/wp-admin` waar mogelijk tot de bevoegde beheerders. Gebruik unieke wachtwoorden en application passwords, geen ontwikkelwachtwoorden.
3. Wijzig WordPress home/siteurl naar de eigen HTTPS-CMS-host en voer een gecontroleerde WordPress `search-replace` uit voor lokale media-URL’s. Neem eerst een databasebackup. De bronwebsite blijft uitgesloten. De opgeslagen logo-URL moet eveneens de eigen CMS-host gebruiken.
4. Stel `SITE_URL` en `WORDPRESS_PUBLIC_URL` op de publieke HTTPS-hosts in, en `WORDPRESS_URL` op de vaste interne WordPress-service. Stel `RWA_FRONTEND_URL` in op de interne frontend-URL en `RWA_PUBLIC_FRONTEND_URL` op de publieke frontend-host. Dit zijn vaste serverconfiguraties, geen door bezoekers te kiezen fetchdoelen.
5. Neem `RWA_PREVIEW_SECRET`/`PREVIEW_SECRET` en `RWA_REVALIDATE_SECRET`/`REVALIDATE_SECRET` als overeenkomende, unieke servergeheimen op. Deel ze niet met clientbundels, Git of logs.
6. Verander `WP_ENVIRONMENT_TYPE` in de WordPress-configuratie van `local` naar `production`. Laat `DISALLOW_FILE_EDIT` ingeschakeld. Gebruik HTTPS en de juiste reverse-proxyheaders; de officiële WordPress-container ondersteunt `X-Forwarded-Proto`.
7. Laat de stichting essentiële gegevens en juridische tekst beoordelen. Voer `npm run release:check` uit met de bedoelde CMS-omgeving. Doe dit vóór iedere release; een geslaagde technische build betekent geen inhoudelijke goedkeuring.
8. Bouw de container met de productie-URL’s als buildomgeving voor vaste securityheaders; laat `SITE_STAGE=production` ook tijdens runtime gelden. Robots wordt per verzoek berekend. Controleer canonical/hreflang, CSP-mediahost, preview, webhook en echte downloads op staging vóór de omschakeling.

Bij schaalvergroting: de huidige SSR gebruikt geen blijvende contentcache. Een gedeelde cache vergt expliciete invalidatie en afgeschermde previews. Gebruik een enkele frontendinstantie of voeg een gedeelde nonceopslag toe wanneer strikte webhook-replaydetectie over meerdere instanties vereist is. Een herhaalde webhook mag hoogstens cacheverversing veroorzaken.

## Duurzame opslag

- `database`: MariaDB-data.
- `wordpress`: WordPress-media, instellingenbestanden en overige persistente bestanden. Pluginbron is een afzonderlijke, alleen-lezen mount uit Git.
- `frontend-cache`: Next-cache; inhoud is herstelbaar en mag nooit de enige bron van actuele contactgegevens zijn.
- Geheimen: in een afzonderlijke beveiligde secretstore of beschermd env-bestand; herstelmateriaal buiten Git.

## Backup

Maak dagelijks en vóór migratie/updates een consistente MariaDB-dump en een backup van `wp-content/uploads`, de relevante WordPress-configuratie en de toegepaste commit. Gebruik een beschermd clientconfiguratiebestand of secretmechanisme voor databasecredentials; zet wachtwoorden niet in shellargumenten of openbare logs.

Versleutel backups, bewaar een kopie buiten de VPS, beperk toegang en stel een passende bewaartermijn in. Test periodiek herstel in een afgeschermde omgeving. Een geslaagde backupopdracht zonder hersteltest is onvoldoende bewijs dat herstel werkt.

## Herstel

1. Maak nieuwe lege volumes op een afgeschermde staginghost.
2. Zet de database terug met dezelfde ondersteunde MariaDB-versie.
3. Zet media en beschermde configuratie terug; herstel de plugin en frontend uit de geregistreerde commit en lockfile.
4. Pas eigen staging-URL’s aan, houd staging op noindex en controleer inloggen, media, contentstatussen en contactgegevens.
5. Controleer CMS-verbinding, preview en webhook, voer de releasecontrole uit en inspecteer de kernroutes.
6. Schakel pas na een geslaagde controle over. Dit document verleent geen toestemming voor deployment of DNS-wijzigingen.

De Windows-ontwikkelruntime gebruikt `.runtime/db` en `.runtime/wp/wordpress`. Stop deze netjes vóór een offline bestandscopy; gebruik een consistente dump voor een draaiende database. `docker compose down -v` of het verwijderen van `.runtime` wist duurzame lokale data en is geen normale herstart.
