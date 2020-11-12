const cookieDomain =
    window.location.hostname === 'localhost' ? undefined : '.nav.no';

let internalClientLanguage = window.navigator.language;

if (internalClientLanguage.startsWith('en-')) {
    internalClientLanguage = 'en-US';
}

const clientLanguage = internalClientLanguage;
const apiUrlBase = 'https://navtest.boost.ai/api/chat/v2';
const conversationIdCookieName = 'nav-chatbot:conversation';
const languageCookieName = 'nav-chatbot:language';
const openCookieName = 'nav-chatbot:open';
const unreadCookieName = 'nav-chatbot:unread';
const containerWidthNumber = 400;
const containerWidth = `${containerWidthNumber}px`;
const containerHeightNumber = 568;
const containerHeight = `${containerHeightNumber}px`;
const linkDisableTimeout = 1000 * 10;
const botResponseRevealDelay = 1250;
const botResponseRevealDelayBuffer = botResponseRevealDelay / 2;
const minimumPollTimeout = 1000;
const maximumPollTimeout = 2500;

const fullscreenMediaQuery = `(max-width: ${
    containerWidthNumber + 100
}px), (max-height: ${containerHeightNumber + 50}px)`;

export {
    cookieDomain,
    clientLanguage,
    apiUrlBase,
    conversationIdCookieName,
    languageCookieName,
    openCookieName,
    unreadCookieName,
    containerWidthNumber,
    containerWidth,
    containerHeightNumber,
    containerHeight,
    linkDisableTimeout,
    botResponseRevealDelay,
    botResponseRevealDelayBuffer,
    minimumPollTimeout,
    maximumPollTimeout,
    fullscreenMediaQuery
};
