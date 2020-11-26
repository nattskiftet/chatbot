# Chatbot Frida

## Bruk
**Nytt fra v.1.3.0**<br>
Chatbot Frida er nå implementert i [Nav-dekoratøren](https://github.com/navikt/nav-dekoratoren).
Chatbot'en kan aktiveres i appene via et parameter til dekoratøren. Se dekoratørens readme for hvordan dette gjøres.
Komponenten fra NPM-pakka skal ikke benyttes i apper som også benytter Nav-dekoratøren, da dette vil komme i konflikt med dekoratørens chatbot-instans.

## Installasjon
Apper uten Nav-dekoratøren kan ta i bruk Chatbot med NPM-pakka.
```sh
npm i @navikt/nav-chatbot
```
```javascript
import NAVChatBot from '@navikt/nav-chatbot';
<NAVChatBot/>
```

## Typescript
`index.d.ts` kan finnes i pakkerot. Pakken støtter ikke Typescript "out of the box".
Denne genereres via `npm run generate:types`, og vil også bli automatisk kjørt før `build`.
