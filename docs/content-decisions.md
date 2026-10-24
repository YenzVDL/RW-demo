# Contentbesluiten en openstaande bevestigingen

Brononderzoek: 24 oktober 2026. De live REST-export bevestigt de inhoudelijke controlepunten uit de opdracht. Zie `content/raw/fetch.json` voor het exacte tijdstip. De bronwebsite is uitsluitend gelezen; er is niets gewijzigd.

| Onderwerp | Bevinding / keuze | Nog nodig |
|---|---|---|
| Telefoon en adres | Nummer en adres zijn teruggevonden op de NL/EN-bronnen. Eén centraal contactrecord levert telefoonlinks, adres en e-mail. Dit is bronverificatie, geen redactionele goedkeuring. | Bevestig de huidige bereikbaarheid en locatie. |
| Tijden | NL: telefonisch werkdagen 10–18; dinsdag inloop 19–21; vervolgafspraak woensdag/donderdag 18–20. EN noemt alleen afspraken. | Bevestig per kanaal doel, tijden en afspraakregel; lever consistente Engelse tekst. |
| Tijdelijke sluiting | Hero: 28 juni–31 augustus zonder jaar. Inloop hervat “dinsdag 27 oktober”, eveneens zonder jaar. | Niet als actuele melding geïmporteerd. Bevestig jaar, begin, einde en contactkanaal. |
| Werving | Home: januari 2027, deadline 7 december zonder jaar; losse pagina: 2024 en andere eisen. | Wervingsrecord staat op `review`, deadline is leeg. De homepagebron blijft als te controleren tekst zichtbaar in staging. Bevestig status, eisen, inzetduur, start en deadline. |
| Studentenaantal | NL 32, EN 46. | Geen aantal in nieuwe organisatie-intro. Volledige bronversies blijven bewaard. |
| Bestuur | Medewerkers en ANBI noemen verschillende bestuursleden. | Beide sets staan als inactieve concepten onder Team en bestuur. Kies bevoegde, actuele records en perioden. Geen bestuur is zelfstandig als actueel gekozen. |
| Partners | NL en EN verschillen in naamgeving en links. | Nederlandse logo’s/naamgeving als `needs_confirmation`; geen tegenstrijdige externe links toegevoegd. Bevestig namen, sponsoring en URL’s. |
| Juridische vragen | 12 huidige antwoorden opgeschoond en naar eigen routes verplaatst. | Inhoudelijke juridische actualiteitscontrole. De bron is geen bewijs van huidig recht. |
| Oude kennisvragen | Aanvullende vragen uit `/home-oud/` en het bericht “Non-conformiteit bij koop” gevonden. | Alleen conceptkandidaten. Geen uitbreiding van het gepubliceerde hulpaanbod. |
| Privacy en voorwaarden | Bestaande tekst en versiedata behouden. | Bevoegde inhoudelijke en juridische beoordeling; geen fictieve nieuwe versiedatum. |
| Documenten | Bestaande overzicht bevat stukken t/m 2024; statuten uit de ANBI-pagina ook gedownload. | Geen later verslag toegevoegd. Controleer volledigheid en publiceer goedgekeurde bestanden. |
| Engels | Alleen beschikbare teksten gebruikt: home, contact en SVRA. | Geen nieuwe vertalingen geschreven. Niet-beschikbare taalparen tonen een duidelijke melding. |
| Voorbeeldpagina’s | `/sample-page/`, `/service/`, `/team-profile/` zijn themavoorbeelden. | Niet migreren; HTTP 410. `/home-oud/` ook 410 op de nieuwe website. |
| Praktische FAQ | Geen aparte nieuwe vraag/antwoordcombinaties nodig voor de wegwijzer. | Optioneel: stichting kan brononderbouwde praktische vragen aanleveren. |

## Redactionele verwerking

- `source_imported` betekent uitsluitend bronimport; `needs_confirmation` markeert conflicten. `proposed` is beschikbaar voor nieuwe redactionele tekst. Niets is automatisch `approved`.
- Korte bronextracten vormen de organisatie-intro. Aantallen, verlopen meldingen en conflicterende bestuurssamenstellingen zijn daaruit weggelaten, niet herschreven naar nieuwe feiten.
- Tijden zijn mechanisch uitgesplitst naar kanaalvelden; het telefoonnummer wordt uit het centrale contactrecord gelezen. De oorspronkelijke volledige pagina is bewaard, naast de extracten en importhashes.
- Dubbele contactgegevens en conflicterende bestuursnamen zijn uit de ANBI-weergave gehaald. Een gedeelde contactcomponent en gedeeld bestuursmodel vervangen die duplicatie. De originele brontekst staat in het manifest en CMS-bronpaneel.
- Shortcodes, scripts, inline stijlen, carouselcode en kaart-embeds zijn verwijderd. Gewone documentstructuur, lijsten en inhoudelijke zinnen blijven behouden. Oude interne links zijn naar nieuwe bestemmingen omgezet.
- De UI-koppen en navigatielabels ordenen de broninhoud. Ze introduceren geen nieuwe diensten of uitkomstbeloften.
- Importconflicten bewaren de lokale versie en slaan de nieuwe bronversie apart op. Een schemawijziging vergelijkt tegen de veldset van de eerdere import, zodat een nieuw leeg veld geen redactioneel conflict veroorzaakt.

## Productieblokkade

`npm run release:check` faalt zolang essentiële inhoud niet door een bevoegde gebruiker is goedgekeurd. Ook de frontend controleert deze voorwaarden per verzoek in productiemodus. Goedkeuring vereist een redactionele status én een echte goedkeurder/datumregistratie door het CMS. Ontbrekende contactgegevens, kanaaltijden en een bevestigd gedeeld bestuur blokkeren eveneens. Optionele ongekeurde inhoud wordt niet in productie getoond.

Deze repository bevat bewust geen goedkeuringen namens de stichting.
