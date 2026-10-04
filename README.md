# Mobiilirakenduste_arendamine
Ionic 8.8, Capacitor 8.5, TypeScript, Web Components (non-React)

## Paigaldus juhis
Kloonimine ja kõigi sõltuvuste installimine ühe käsuga:

npm install

npm install loeb package.json ja package-lock.json failid ning installib automaatselt kõik projektis kasutatavad paketid (Ionic, Capacitor, kõnetuvastuse plugin, jne)

## Brauseris käivitamine
npm run dev

## Build ja Capacitor'i sünkroonimine

Enne natiivsete platvormide käivitamist tuleb projekt build'ida ja Capacitor'iga sünkroonida:

npm run build
npx cap sync android
npx cap run android

Seda tuleb korrata iga kord, kui teed muudatusi src/ kaustas ja tahad neid natiivses äpis näha (v.a. kui kasutad live-reload'i, vt Capacitor'i dokumentatsiooni).

## Käivitamine Android emulaatoris

npx cap open android

See avab projekti Android Studios. Vali ülevalt AVD (Android Virtual Device) ripploendist ja vajuta Run.

Kui AVD-d pole veel loodud: Android Studio → Device Manager → Create Device → vali seadmemudel ja Android-versioon.

Käivitamine Android pärisseadmes
Telefonis: Settings → About phone → vajuta 7 korda Build number peale, et aktiveerida Developer options
Settings → Developer options → luba USB debugging
Ühenda telefon arvutiga USB kaabliga
npx cap open android → vali oma telefon seadmete nimekirjast → Run

## Käivitamine iOS pärisseadmes (ainult macOS)
Ühenda iPhone Maciga
Xcode's vali projekt → Signing & Capabilities → vali oma Apple Developer konto (Team)
Vali seadmete ripploendist oma telefon
Vajuta Run

Esimesel korral tuleb telefonis kinnitada usaldus arendaja sertifikaadi vastu: Settings → General → VPN & Device Management.

## Mida algmallis muudeti
* Eemaldati Vite vaikimisi genereeritud demo-sisu (counter.ts, style.css, assets/ kaust)
* Lisatud @ionic/core ja ionicons sõltuvused
* Lisatud vite.config.ts konfiguratsioon, mis parandab Ionic'u lazy-loaded komponentide bundlemise Capacitor'i jaoks (ilma selleta äpp töötab brauseris, aga puruneb pärisseadmes)
* main.ts kirjutatakse kogu rakenduse UI otse <ion-app> sisse innerHTML kaudu, ilma eraldi lehekomponentideta
* Lisatud Capacitor natiivsed platvormid (Android, iOS)
* Lisatud kõnetuvastuse nupp ja funktsionaalsus (@capacitor-community/speech-recognition)
* Lisatud märkmete püsiv salvestamine (@capacitor/preferences)

## Teadaolevad piirangud
* Eesti keele tugi kõnetuvastuses on ebakindel — testitud [täienda: mis keel töötas / ei töötanud]
* Kõnetuvastus vajab tavaliselt internetiühendust (Android saadab heli Google'i pilveteenusesse töötlemiseks)
* Emulaatoris/simulaatoris kõnetuvastus üldiselt ei tööta korralikult puuduva või piiratud mikrofoni sisendi tõttu soovitatud testida pärisseadmel
