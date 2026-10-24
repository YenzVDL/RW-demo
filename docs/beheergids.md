# Beheergids Rechtswinkel Amsterdam

Open lokaal `http://localhost:8080/wp-admin/`. De lokale beheerdersnaam en het wachtwoord staan in het niet-gecommitte `.env`-bestand. Deel deze niet met bezoekers. Maak voor dagelijks werk een gebruiker met de rol **Rechtswinkel redacteur**. Alleen de bevoegde beheerder heeft `approve_rwa` en kan inhoud inhoudelijk goedkeuren.

## Teksten en navigatie

Open het passende Nederlandse menu, wijzig de titel of tekst en kies Bijwerken. De inhoud gebruikt vaste componenten en beperkte WordPress-blokken. Broncode, bronverwijzing en oorspronkelijke tekst blijven zichtbaar in het paneel **Inhoud, bron en controle**. Pas vaste broncodes niet aan.

Gestructureerde records zoals contact, tijden, meldingen en team gebruiken het native scherm met direct zichtbare velden. Bij pagina’s en juridische vragen gebruikt WordPress de blokeditor. Daar staan extra velden onder **Meta vakken** onderaan het bewerkingsgebied. Sluit de eenmalige welkomstuitleg om het volledige scherm te gebruiken.

**Pagina’s** beheert de inhoud van bestaande routes. Een nieuwe pagina heeft een uniek URL-pad nodig. **Navigatie** beheert menu-items: titel = menulabel, URL-pad = bestemming, taal = `nl` of `en`. De paginavolgorde bepaalt de volgorde van nieuwe menu-items. Zonder navigatierecords gebruikt de frontend de vier vaste wegwijzerlabels.

Een vertaling krijgt een eigen record met een eigen URL onder `/en`. Vul bij beide records de broncode van de andere taal in. Zonder taalrelatie wordt geen vertaling verzonnen; de taalkeuze meldt dat die ontbreekt.

## Contact en spreekuren

Onder **Centrale contactgegevens** staat het record met broncode `contact`. Wijzig hier telefoon, e-mail en adres. Header, homepage, zijbalken, contactgegevens en footer gebruiken deze centrale gegevens. Het Engelse contactrecord verwijst naar hetzelfde centrale record.

Onder **Spreekuren per kanaal** staan telefonie, inloop en vervolgafspraak. Wijzig tijden/dagen, doel, afspraakregel en eventuele tekst per kanaal. De tijdzone is **Europe/Amsterdam**. Het contactrecord bevat het adres; maak geen tweede los telefoonrecord. Na een wijziging moet de inhoud opnieuw worden gecontroleerd.

## Tijdelijke meldingen

Maak onder **Tijdelijke meldingen** een titel en tekst. Vul begin en einde volledig in, inclusief jaar en UTC-offset, bijvoorbeeld `2026-10-25T18:00:00+01:00`. Zomertijd gebruikt de toepasselijke `+02:00`. Vul het betreffende contactkanaal in bij “Contactroute”: `telephone`, `walkin` of `appointment`.

Zonder geldig begin/einde wordt de melding niet getoond. Geldige meldingen verschijnen en verdwijnen op basis van de klok, ook zonder nieuwe publicatie. De browser werkt begin/einde bij terwijl de pagina openstaat. Een bestaande losse sluitingszin zonder jaartal is geen geldige actuele melding.

## Juridische vragen en rechtsgebieden

Gebruik **Juridische vragen** voor de uitleg en **Rechtsgebieden** voor huurrecht, arbeidsrecht en consumentenrecht. Vul het rechtsgebied en een uniek URL-pad in. Beoordeel bestaande juridische teksten op actualiteit; een bronimport is geen inhoudelijke goedkeuring. Oudere extra vragen staan als concept onder **Historische kandidaten**.

## Werving

Onder **Werving** beheert u status (`review`, `open`, `closed`), eisen, inzetduur, startmoment, deadline en echte aanmeldroute. Een e-mailroute begint met `mailto:`. Een deadline gebruikt een volledig jaartal en offset. De bestaande deadline zonder jaartal moet eerst worden bevestigd. Na een verlopen deadline toont de wervingspagina dat de ronde is gesloten; de oude uitnodiging wordt niet als open ronde getoond.

## Team, bestuur en partners

Onder **Team en bestuur** staan naam, rol, periode, groep, actief-vlag en afbeelding. `board` is het gedeelde bestuur. De twee tegenstrijdige bronbesturen zijn inactieve concepten. Bevestig de actuele samenstelling, publiceer uitsluitend passende records en vink actief aan. Team en ANBI lezen hetzelfde bestuursmodel.

Upload foto’s en logo’s via **Media**. Gebruik het media-ID in het betreffende record. Naamkoppelingen en fotorechten moeten kloppen. Partners hebben een naam, bestaand logo, website en toelichting. Laat onbekende links leeg.

## Documenten

Upload een echt bestand via **Media**, maak een record onder **Documenten**, en vul titel, jaar, type en media-ID of echte download-URL in. Controleer de download in de frontend. Maak geen nieuw verslag zonder bronbestand. Documenten verschijnen op jaar onder Verantwoording.

## Controle, preview en publiceren

1. Redacteur bewerkt de inhoud en bewaart deze als concept of stagingpublicatie. De redactionele status blijft ongekeurd.
2. Gebruik **Beveiligde conceptpreview** in het bewerkingsscherm. De link is kort geldig, de preview gebruikt geen publieke cache en toont een aparte melding. Deel de link niet publiek.
3. Leg vragen in **Interne reviewnotities** vast. Deze staan buiten de openbare API.
4. De bevoegde beheerder beoordeelt de tekst en kiest bewust `approved`. Het CMS registreert de goedkeurder en datum; brondatum en oorspronkelijke tekst blijven behouden.
5. Inhoudelijke wijzigingen maken eerdere goedkeuring ongeldig. Laat de gewijzigde versie opnieuw beoordelen.
6. Voer vóór productie `npm run release:check` uit tegen het bedoelde CMS. De applicatie blokkeert ongekeurde essentiële inhoud ook tijdens productie.

Publiceren, wijzigen, naar de prullenbak verplaatsen en verwijderen sturen een ondertekende cachemelding. De frontend haalt per verzoek actuele inhoud op, zodat een mislukte melding geen oude tijden als fallback presenteert. Een waarschuwing in het CMS meldt een mislukte webhook.

Een herimport overschrijft redactionele wijzigingen niet. Het bronpaneel meldt een nieuwe bronversie; de ontwikkelaar kan de JSON-versies vergelijken en met de redacteur samenvoegen.
