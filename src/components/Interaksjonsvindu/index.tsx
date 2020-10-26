import React, {useRef, useCallback, useEffect, useState, useMemo} from 'react';
import axios from 'axios';
import moment from 'moment';
import {Systemtittel} from 'nav-frontend-typografi';
import {AnalyticsCallback, ConnectionConfig} from '../..';
import {getCookie} from '../../utils/cookies';
import {Message} from '../../api/sessions';
import {chatStateKeys} from '../../utils/state-utils';
import {updateSelectionState} from '../../utils/eval-state-utils';
import {mobileMaxWidth} from '../../tema/mediaqueries';
import Evaluering, {SurveyQuestion} from '../Evaluering';
import {MessageWithIndicator} from '../ChatContainer';
import EmailFeedback from '../EmailFeedback';
import Bekreftelsesboks from '../Bekreftelsesboks';
import Kommunikasjon from '../Kommunikasjon';
import Eventviser from '../Eventviser';
import Flervalg from '../Flervalg';
import Knapp from '../Knapp';
import {
    Alertstripe,
    Avsluttet,
    AvsluttetHeader,
    Chatlog,
    Interaksjon,
    KoblerTil,
    SendKnappOgTeller,
    Tekstfelt,
    Tekstomrade,
    Teller
} from './styles';

export interface Bruker {
    userId: number;
    avatarUrl: string;
    userType: string;
    nickName: string;
    role: number;
    aktiv: boolean;
}

interface Properties extends Omit<ConnectionConfig, 'configId'> {
    skjulIndikator: (melding: MessageWithIndicator) => void;
    vis: boolean;
    baseUrl: string;
    historie: MessageWithIndicator[];
    brukere: Bruker[];
    iKo: boolean;
    avsluttet: boolean;
    config: Config;
    skriveindikatorTid: number;
    hentHistorie: () => void;
    visBekreftelse: 'OMSTART' | 'AVSLUTT' | undefined;
    confirmAvslutt: () => void;
    confirmCancel: () => void;
    confirmOmstart: () => void;
    lukk: () => void;
    feil: boolean;
    analyticsCallback?: AnalyticsCallback;
    analyticsSurvey?: SurveyQuestion[];
}

export interface Config {
    sessionId: string;
    sessionIdPure: string;
    requestId: number;
    lastActive: number;
}

export interface TidIgjen {
    formatert: string;
    tid: number;
}

function minimizeMobileOnLinkClick(
    event: React.MouseEvent,
    minimizeFunc: () => void
) {
    const isLink = (element: HTMLElement | null): boolean => {
        if (!element) {
            return false;
        }

        if (element.tagName?.toLowerCase() === 'a') {
            return true;
        }

        return isLink(element.parentElement);
    };

    if (
        window.innerWidth <= mobileMaxWidth &&
        isLink(event.target as HTMLElement)
    ) {
        minimizeFunc();
    }
}

const messageMaxLength = 110;

const Interaksjonsvindu = (properties: Properties) => {
    const reference = useRef<HTMLDivElement>();
    const [message, setMessage] = useState<string>('');
    const [isMessageSent, setIsMessageSent] = useState<boolean>(false);
    const [feedbackTime, setFeedbackTime] = useState<TidIgjen>();

    const {
        baseUrl,
        config,
        vis,
        visBekreftelse,
        lukk,
        confirmOmstart,
        confirmCancel,
        confirmAvslutt,
        avsluttet,
        iKo,
        brukere,
        historie,
        analyticsSurvey,
        analyticsCallback,
        feil
    } = properties;

    const harAktiveBrukere = useMemo(
        () => Boolean(brukere.find((bruker: Bruker) => bruker.aktiv)),
        [brukere]
    );

    function scrollToBottom(options?: ScrollIntoViewOptions) {
        const element = reference.current;

        if (element && !avsluttet) {
            element.scrollIntoView({block: 'start', ...options});
        }
    }

    function getUserType(userId: number): string | undefined {
        if (brukere) {
            const user = brukere.find((b: Bruker) => b.userId === userId);
            return user?.userType ? user.userType.toUpperCase() : undefined;
        }

        return undefined;
    }

    function getHistory(
        message: MessageWithIndicator,
        forrigeHistorieBrukerId: number | null
    ) {
        switch (message.type) {
            case 'Message':
                return (
                    <Kommunikasjon
                        key={`el-${message.id}`}
                        beskjed={message}
                        brukere={brukere}
                        sisteBrukerId={forrigeHistorieBrukerId}
                        skjulIndikator={(melding: MessageWithIndicator) =>
                            properties.skjulIndikator(melding)
                        }
                        hentBrukerType={getUserType}
                        skriveindikatorTid={properties.skriveindikatorTid}
                    />
                );

            case 'Event':
                return (
                    <Eventviser
                        key={message.id}
                        beskjed={message}
                        hentBrukerType={getUserType}
                    />
                );

            case 'Option': {
                const [lastMessageFromFrida] = historie
                    .filter((lastMessage) => lastMessage.role === 1)
                    .slice(-1);

                return (
                    <Flervalg
                        key={`el-${message.id}`}
                        beskjed={message}
                        harBlittBesvart={
                            message.content.find(
                                (b: {tekst: string; valgt: boolean}) => b.valgt
                            ) || avsluttet
                        }
                        velg={async (messageId: number, valg: string) =>
                            handleSelect(messageId, valg)
                        }
                        sisteBrukerId={forrigeHistorieBrukerId}
                        fridaHarSvart={lastMessageFromFrida.id !== message.id}
                    />
                );
            }

            default:
                return null;
        }
    }

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key.toLowerCase() === 'enter' && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
        }
    }

    async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
        event?.preventDefault();
        const trimmedMessage = message.trim();

        if (
            trimmedMessage &&
            trimmedMessage.length <= messageMaxLength &&
            !avsluttet
        ) {
            setIsMessageSent(true);

            try {
                await axios.post(
                    `${baseUrl}/sessions/${config.sessionId}/messages`,
                    {
                        nickName: 'Bruker',
                        content: trimmedMessage,
                        type: 'Message'
                    }
                );

                setMessage('');
                properties.hentHistorie();
                scrollToBottom();
            } catch (error) {
                console.error(error.response);
            }

            setIsMessageSent(false);
        }
    }

    async function handleSelect(messageId: number, valg: string) {
        await axios.post(`${baseUrl}/sessions/${config.sessionId}/messages`, {
            nickName: 'Bruker',
            type: 'OptionResult',
            content: {
                messageId,
                optionChoice: valg,
                cancelled: false
            }
        });

        updateSelectionState(messageId, valg, historie);
        scrollToBottom();
    }

    useEffect(() => {
        if (avsluttet) {
            const interval = setInterval(() => {
                setFeedbackTime({
                    formatert: moment().to(
                        getCookie(chatStateKeys.MAILTIMEOUT),
                        true
                    ),
                    tid: moment(getCookie(chatStateKeys.MAILTIMEOUT)).diff(
                        moment()
                    )
                });
            }, 1000);

            return () => {
                clearTimeout(interval);
            };
        }

        return undefined;
    }, [avsluttet]);

    const log = useMemo(
        () =>
            historie.map((item: MessageWithIndicator, index: number) => {
                const previousHistory: Message =
                    historie[index - 1] &&
                    historie[index - 1].content !== 'TYPE_MSG'
                        ? historie[index - 1]
                        : historie[index - 2];

                return getHistory(
                    item,
                    previousHistory &&
                        (previousHistory.type === 'Message' ||
                        previousHistory.type === 'Option' ||
                        previousHistory.type === 'Evaluation'
                            ? previousHistory.userId
                            : null)
                );
            }),
        [historie, brukere] // eslint-disable-line react-hooks/exhaustive-deps
    );

    useEffect(() => {
        scrollToBottom();
    }, [log, vis]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!vis) {
        return null;
    }

    return (
        <Interaksjon>
            {visBekreftelse === 'OMSTART' && (
                <Bekreftelsesboks
                    tekst='Er du sikker på at du vil starte samtalen på nytt?'
                    ja={() => confirmOmstart()}
                    nei={() => confirmCancel()}
                />
            )}

            {visBekreftelse === 'AVSLUTT' && (
                <Bekreftelsesboks
                    tekst='Er du sikker på at du vil avslutte samtalen?'
                    ja={() => confirmAvslutt()}
                    nei={() => confirmCancel()}
                />
            )}

            {iKo && !avsluttet && (
                <Alertstripe type='info'>
                    Du blir nå satt over til en veileder.
                </Alertstripe>
            )}

            {brukere.length > 0 && !iKo && !harAktiveBrukere && !avsluttet && (
                <Alertstripe type='advarsel'>
                    Det er ikke flere aktive brukere i kanalen.
                </Alertstripe>
            )}

            {historie.length > 0 &&
                historie.every(
                    (historie: MessageWithIndicator) =>
                        historie.type === 'Intro'
                ) && (
                    <KoblerTil type='info' form='inline'>
                        Kobler til Frida...
                    </KoblerTil>
                )}

            {avsluttet && (
                <Avsluttet>
                    <AvsluttetHeader type='info' form='inline'>
                        <Systemtittel>Chatten er avsluttet.</Systemtittel>
                    </AvsluttetHeader>

                    {analyticsSurvey && (
                        <Evaluering
                            analyticsCallback={analyticsCallback}
                            analyticsSurvey={analyticsSurvey}
                        />
                    )}

                    {feedbackTime && feedbackTime.tid >= 0 && (
                        <EmailFeedback
                            baseUrl={baseUrl}
                            config={config}
                            tidIgjen={feedbackTime}
                        />
                    )}
                </Avsluttet>
            )}

            {feil && (
                <Alertstripe type='feil'>En feil har oppstått.</Alertstripe>
            )}

            {!avsluttet && (
                <>
                    <Chatlog
                        role='log'
                        aria-live='polite'
                        aria-atomic='false'
                        aria-relevant='additions'
                        onClick={(event) =>
                            minimizeMobileOnLinkClick(event, lukk)
                        }
                    >
                        {log}
                        <div ref={reference as any} aria-hidden='true' />
                    </Chatlog>

                    <Tekstomrade onSubmit={handleSubmit}>
                        <Tekstfelt
                            aria-label="Ditt spørsmål"
                            placeholder='Skriv spørsmålet ditt'
                            disabled={avsluttet}
                            value={message}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                        />

                        <SendKnappOgTeller>
                            <Knapp
                                disabled={
                                    message.length > messageMaxLength ||
                                    avsluttet
                                }
                                aktiv={isMessageSent}
                            >
                                Send
                            </Knapp>

                            <Teller
                                aria-hidden
                                tabIndex={-1}
                                error={message.length > messageMaxLength}
                            >
                                {message.length} / {messageMaxLength}
                            </Teller>
                        </SendKnappOgTeller>
                    </Tekstomrade>
                </>
            )}
        </Interaksjon>
    );
};

export default Interaksjonsvindu;
