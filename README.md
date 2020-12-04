# Chatbot Frida

## Bruk
**Nytt fra v.1.3.0**<br>
Chatbot Frida er nå implementert i [nav-dekoratoren](https://github.com/navikt/nav-dekoratoren).

Chatbot-en kan aktiveres i appene via et parameter til dekoratøren. Se dekoratørens [`readme.md`](https://github.com/navikt/nav-dekoratoren/blob/master/README.md) for hvordan dette gjøres.

Komponenten fra npm-pakka skal ikke benyttes i apper som også benytter https://github.com/navikt/nav-dekoratoren, da dette vil komme i konflikt med dekoratørens chatbot-instans.

## Installasjon
Apper uten `nav-dekoratoren` kan ta i bruk Chatbot med npm-pakka.
```sh
npm i @navikt/nav-chatbot
```
```javascript
import Chatbot from '@navikt/nav-chatbot';
<Chatbot/>
// eller med options (defaults er definert nedenfor)
<Chatbot
    boostApiUrlBase='https://navtest.boost.ai/api/chat/v2'
    analyticsCallback={console.log}
/>
```

## Typescript
`index.d.ts` kan finnes i pakkerot. Pakken støtter ikke Typescript "out of the box".
Denne genereres via `npm run generate:types`, og vil også bli automatisk kjørt før `build`.
