import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React, {
    useRef,
    createContext,
    useContext,
    useState,
    useMemo,
    useEffect,
    useCallback
} from 'react';

import styled from 'styled-components';
import axios from 'axios';
import cookies from 'js-cookie';

import {Textarea} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import Snakkeboble from 'nav-frontend-snakkeboble';
import AlertStripe from 'nav-frontend-alertstriper';

const cookieDomain =
    window.location.hostname === 'localhost' ? undefined : '.nav.no';

const apiUrlBase = 'https://navtest.boost.ai/api/chat/v2';
const conversationIdCookieName = 'nav-chatbot:conversation';
const languageCookieName = 'nav-chatbot:language';
const openCookieName = 'nav-chatbot:open';
const unreadCookieName = 'nav-chatbot:unread';
const linkDisableTimeout = 1000 * 10;
const botResponseRevealDelay = 2000;
const botResponseRevealDelayBuffer = botResponseRevealDelay / 2;

interface BoostConversation {
    id: string;
    reference: string;
    state: {
        chat_status: string;
        allow_delete_conversation: boolean;
        human_is_typing: boolean;
        max_input_chars: number;
    };
}

interface BoostResponseElementText {
    type: 'text';
    payload: {
        text: string;
    };
}

interface BoostResponseElementHtml {
    type: 'html';
    payload: {
        html: string;
    };
}

interface BoostResponseElementLinksItem {
    id: string;
    text: string;
    type: string;
    url?: string;
}

interface BoostResponseElementLinks {
    type: 'links';
    payload: {
        links: BoostResponseElementLinksItem[];
    };
}

type BoostResponseElement =
    | BoostResponseElementText
    | BoostResponseElementHtml
    | BoostResponseElementLinks;

interface BoostResponse {
    id: string;
    language?: string;
    source: string;
    avatar_url?: string;
    date_created: string;
    elements: BoostResponseElement[];
    link_text?: string;
}

interface BoostStartRequestResponse {
    conversation: BoostConversation;
    response: BoostResponse;
}

async function createBoostSession(): Promise<BoostStartRequestResponse> {
    const response = await axios.post(apiUrlBase, {command: 'START'});
    return response.data;
}

interface BoostResumeRequestResponse {
    conversation: BoostConversation;
    responses: BoostResponse[];
}

interface BoostResumeRequestOptions {
    language: string | undefined;
}

async function getBoostSession(
    conversationId: string,
    options?: BoostResumeRequestOptions
): Promise<BoostResumeRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'RESUME',
        conversation_id: conversationId,
        language: options?.language
    });

    return response.data;
}

interface BoostPollRequestResponse {
    conversation: BoostConversation;
    responses: BoostResponse[];
}

interface BoostPollRequestOptions {
    mostRecentResponseId: string | undefined;
}

async function pollBoostSession(
    conversationId: string,
    options?: BoostPollRequestOptions
): Promise<BoostPollRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'POLL',
        conversation_id: conversationId,
        value: options?.mostRecentResponseId
    });

    return response.data;
}

interface BoostPostRequestResponse {
    conversation: BoostConversation;
    responses: BoostResponse[];
}

interface BoostPostRequestOptionsText {
    type: 'text';
    message: string;
}

interface BoostPostRequestOptionsLink {
    type: 'action_link';
    id: string;
}

interface BoostPostRequestOptions {
    type: string;
    id?: string;
    value?: string;
}

async function postBoostSession(
    conversationId: string,
    options: BoostPostRequestOptionsText | BoostPostRequestOptionsLink
): Promise<BoostPostRequestResponse> {
    const requestOptions: BoostPostRequestOptions = {type: options.type};

    if (options.type === 'text') {
        requestOptions.value = options.message;
    } else if (options.type === 'action_link') {
        requestOptions.id = options.id;
    }

    const response = await axios.post(apiUrlBase, {
        command: 'POST',
        conversation_id: conversationId,
        ...requestOptions
    });

    return response.data;
}

interface BoostPingRequestResponse {
    conversation: BoostConversation;
}

async function pingBoostSession(
    conversationId: string
): Promise<BoostPingRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'TYPING',
        conversation_id: conversationId
    });

    return response.data;
}

interface BoostDeleteRequestResponse {
    conversation: BoostConversation;
}

async function deleteBoostSession(
    conversationId: string
): Promise<BoostDeleteRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'DELETE',
        conversation_id: conversationId
    });

    return response.data;
}

type BoostRequestResponse =
    | BoostStartRequestResponse
    | BoostResumeRequestResponse
    | BoostPollRequestResponse;

function useLoader() {
    const [loaders, setLoaders] = useState<number[]>([]);
    const isLoading = useMemo<boolean>(() => loaders.length !== 0, [
        loaders.length
    ]);

    const iteration = useRef<number>(0);
    const createLoader = useCallback(() => {
        iteration.current += 1;
        const currentIteration = iteration.current;

        setLoaders((previousState) => previousState.concat(currentIteration));

        return () => {
            return setLoaders((previousState) => {
                previousState.splice(
                    previousState.indexOf(currentIteration),
                    1
                );

                return previousState.slice();
            });
        };
    }, [iteration]);

    return [isLoading, createLoader] as const;
}

function useDebouncedEffect(
    timeout: number,
    callback: React.EffectCallback,
    dependencies: React.DependencyList
) {
    const [previousTimestamp, setPreviousTimestamp] = useState(0);

    return useEffect(() => {
        const currentTimestamp = Date.now();

        if (previousTimestamp + timeout < currentTimestamp) {
            setPreviousTimestamp(currentTimestamp);
            callback();
        }
    }, [...dependencies, timeout, previousTimestamp, callback]);
}

interface Language {
    language?: string;
    setLanguage?: (language: string) => void;
}

const LanguageContext = createContext<Language>({});

const LanguageProvider = (properties: Record<string, unknown>) => {
    const [language, setLanguage] = useState<string | undefined>(() =>
        cookies.get(languageCookieName)
    );

    useEffect(() => {
        if (language) {
            cookies.set(languageCookieName, language, {domain: cookieDomain});
        }
    }, [language]);

    return (
        <LanguageContext.Provider
            {...properties}
            value={{language, setLanguage}}
        />
    );
};

const useLanguage = () => useContext(LanguageContext);

interface SessionError extends Error {
    code?: string;
}

interface Session {
    id?: string;
    status?:
        | 'disconnected'
        | 'connecting'
        | 'connected'
        | 'restarting'
        | 'error'
        | 'ended';
    error?: SessionError;
    conversation?: BoostConversation;
    responses?: BoostResponse[];
    queue?: BoostResponse;
    isLoading?: boolean;
    start?: () => Promise<void>;
    restart?: () => Promise<void>;
    finish?: () => Promise<void>;
    sendMessage?: (message: string) => Promise<void>;
    sendAction?: (actionId: string) => Promise<void>;
    sendPing?: () => Promise<void>;
}

const SessionContext = createContext<Session>({});

const SessionProvider = (properties: Record<string, unknown>) => {
    const [status, setStatus] = useState<Session['status']>('disconnected');
    const [error, setError] = useState<SessionError>();
    const [isLoading, setIsLoading] = useLoader();
    const {language, setLanguage} = useLanguage();
    const [savedConversationId, setSavedConversationId] = useState<
        string | undefined
    >(() => cookies.get(conversationIdCookieName));

    const [conversation, setConversation] = useState<
        BoostConversation | undefined
    >();

    const conversationId = conversation?.id;
    const conversationState = conversation?.state;
    const canDeleteConversation = conversationState?.allow_delete_conversation;

    const [responses, setResponses] = useState<BoostResponse[] | undefined>();
    const [queue, setQueue] = useState<BoostResponse>();

    const handleError = useCallback((error: any) => {
        if (error?.response) {
            if (error.response.data.error === 'session ended') {
                setStatus('ended');
                return;
            }
        }

        if (error.message.toLowerCase() === 'network error') {
            const error: SessionError = new Error('Network error');
            error.code = 'network_error';
            setError(error);
        }

        setStatus('error');
    }, []);

    const updateSession = useCallback(
        async (updates: BoostRequestResponse) => {
            const currentConversationState = JSON.stringify(conversationState);
            const updatedConversationState = JSON.stringify(
                updates.conversation.state
            );

            if (currentConversationState !== updatedConversationState) {
                setConversation(updates.conversation);
            }

            const responses =
                'response' in updates ? [updates.response] : updates.responses;

            if (responses.length === 0) {
                return;
            }

            const [mostRecentResponse] = responses.slice(-1);

            if (mostRecentResponse?.language) {
                setLanguage!(mostRecentResponse.language);
            }

            setQueue((previousQueue) => {
                if (previousQueue) {
                    const messages: string[] = [];

                    responses.forEach((response) => {
                        response.elements.forEach((element) => {
                            if (element.type === 'text') {
                                messages.push(element.payload.text);
                            }
                        });
                    });

                    const updatedElements = previousQueue.elements.filter(
                        (element) =>
                            element.type === 'text' &&
                            !messages.includes(element.payload.text)
                    );

                    if (updatedElements.length === 0) {
                        return undefined;
                    }

                    return {
                        ...previousQueue,
                        elements: updatedElements
                    };
                }

                return previousQueue;
            });

            setResponses((previousResponses) => {
                if (previousResponses) {
                    const currentResponseIds = new Set(
                        previousResponses.map((index) => String(index.id))
                    );

                    responses.forEach((response) => {
                        if (!currentResponseIds.has(String(response.id))) {
                            previousResponses.push(response);
                        }
                    });

                    previousResponses.sort(
                        (a, b) =>
                            new Date(a.date_created).getTime() -
                            new Date(b.date_created).getTime()
                    );

                    return previousResponses.slice();
                }

                if ('response' in updates) {
                    return [
                        {
                            ...updates.response,
                            // NOTE: 'START' request returns wrong creation date (shifted one hour back)
                            date_created: new Date().toISOString()
                        }
                    ];
                }

                return updates.responses;
            });
        },
        [conversationState, setLanguage]
    );

    const sendMessage = useCallback(
        async (message: string) => {
            if (conversationId) {
                const finishLoading = setIsLoading();

                setQueue((previousQueue) => {
                    if (!previousQueue) {
                        previousQueue = {
                            id: 'local',
                            source: 'local',
                            date_created: new Date().toISOString(),
                            elements: []
                        };
                    }

                    return {
                        ...previousQueue,
                        elements: previousQueue.elements.concat({
                            type: 'text',
                            payload: {text: message}
                        })
                    };
                });

                await postBoostSession(conversationId, {
                    type: 'text',
                    message
                }).catch((error) => {
                    void handleError(error);
                });

                finishLoading();
            }
        },
        [conversationId, setIsLoading, handleError]
    );

    const sendAction = useCallback(
        async (id: string) => {
            if (conversationId) {
                const finishLoading = setIsLoading();

                await postBoostSession(conversationId, {
                    type: 'action_link',
                    id
                }).catch((error) => {
                    void handleError(error);
                });

                finishLoading();
            }
        },
        [conversationId, setIsLoading, handleError]
    );

    const sendPing = useCallback(async () => {
        if (conversationId) {
            await pingBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }
    }, [conversationId]);

    const start = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('connecting');

        try {
            if (savedConversationId) {
                const session = await getBoostSession(savedConversationId, {
                    language
                }).catch(async (error) => {
                    if (error?.response) {
                        if (error.response.data.error === 'session ended') {
                            return createBoostSession();
                        }
                    }

                    throw error;
                });

                void updateSession(session);
            } else {
                const session = await createBoostSession();
                void updateSession(session);
            }

            setStatus('connected');
        } catch (error) {
            void handleError(error);
        }

        finishLoading();
    }, [
        savedConversationId,
        language,
        setIsLoading,
        updateSession,
        handleError
    ]);

    const restart = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('restarting');

        if (conversationId && canDeleteConversation) {
            await deleteBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }

        setSavedConversationId(undefined);
        setConversation(undefined);
        setResponses(undefined);
        setQueue(undefined);

        try {
            const createdSession = await createBoostSession();
            void updateSession(createdSession);
        } catch (error) {
            handleError(error);
        }

        finishLoading();
    }, [
        conversationId,
        canDeleteConversation,
        setIsLoading,
        updateSession,
        handleError
    ]);

    const finish = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('ended');

        if (conversationId && canDeleteConversation) {
            await deleteBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }

        setSavedConversationId(undefined);
        setConversation(undefined);
        setResponses(undefined);
        setQueue(undefined);
        finishLoading();
    }, [conversationId, canDeleteConversation, setIsLoading]);

    useEffect(() => {
        if (conversationId) {
            let timeout: number | undefined;
            let shouldUpdate = true;

            const poll = async () => {
                if (!conversationId || !shouldUpdate) {
                    return;
                }

                const [mostRecentResponse] = (responses ?? []).slice(-1);
                const mostRecentResponseId = mostRecentResponse.id;

                await pollBoostSession(conversationId, {
                    mostRecentResponseId
                })
                    .then((updatedSession) => {
                        if (status !== 'disconnected' && status !== 'ended') {
                            if (shouldUpdate) {
                                setStatus('connected');
                            }
                        }

                        if (shouldUpdate) {
                            void updateSession(updatedSession);
                        }
                    })
                    .catch((error) => {
                        if (shouldUpdate) {
                            void handleError(error);
                        }
                    });

                timeout = setTimeout(poll, 1000);
            };

            timeout = setTimeout(poll, 1000);

            return () => {
                shouldUpdate = false;

                if (timeout) {
                    clearTimeout(timeout);
                }
            };
        }

        return undefined;
    }, [status, conversationId, responses, updateSession, handleError]);

    useEffect(() => {
        if (conversationId) {
            setSavedConversationId(conversationId);
            cookies.set(conversationIdCookieName, conversationId, {
                domain: cookieDomain
            });
        }
    }, [conversationId]);

    return (
        <SessionContext.Provider
            {...properties}
            value={{
                id: conversationId,
                status,
                error,
                conversation,
                responses,
                queue,
                isLoading,
                sendMessage,
                sendAction,
                sendPing,
                start,
                restart,
                finish
            }}
        />
    );
};

const useSession = () => useContext(SessionContext);

const TypingIndicator = () => {
    const [iteration, setIteration] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIteration((number) => number + 1);
        }, 275);

        return () => {
            clearInterval(interval);
        };
    }, []);

    switch (iteration % 3) {
        default:
        case 0: {
            return <>&nbsp;.&nbsp;</>;
        }

        case 1: {
            return <>&nbsp;&nbsp;.</>;
        }

        case 2: {
            return <>.&nbsp;&nbsp;</>;
        }
    }
};

interface ObscuredProperties {
    untilTimestamp?: number;
    by?: React.ReactNode;
    children: React.ReactNode;
    onReveal?: () => void;
}

const Obscured = ({
    untilTimestamp,
    by,
    children,
    onReveal
}: ObscuredProperties) => {
    const [isVisible, setIsVisible] = useState(() => {
        const currentTimestamp = Date.now();

        if (untilTimestamp && currentTimestamp < untilTimestamp) {
            return false;
        }

        return true;
    });

    useEffect(() => {
        const currentTimestamp = Date.now();

        if (untilTimestamp && currentTimestamp < untilTimestamp) {
            const timeout = setTimeout(() => {
                setIsVisible(true);
            }, untilTimestamp - currentTimestamp);

            return () => {
                clearTimeout(timeout);
            };
        }

        setIsVisible(true);
        return undefined;
    }, [untilTimestamp]);

    useEffect(() => {
        if (isVisible && onReveal) {
            onReveal();
        }
    }, [isVisible, onReveal]);

    if (isVisible) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{children}</>;
    }

    if (by) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{by}</>;
    }

    return null;
};

interface ResponseElementLinkProperties {
    link: BoostResponseElementLinksItem;
    onAction?: Session['sendAction'];
}

const ResponseElementLink = ({
    link,
    onAction
}: ResponseElementLinkProperties) => {
    const [isSelected, setIsSelected] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isLoading, setIsLoading] = useLoader();

    const handleAction = useCallback(async () => {
        if (!isLoading && onAction) {
            const finishLoading = setIsLoading();
            await onAction(link.id);
            finishLoading();

            setIsSelected(true);
            setIsDisabled(true);
        }
    }, [link.id, isLoading, onAction, setIsLoading]);

    useEffect(() => {
        if (isDisabled) {
            const timeout = setTimeout(() => {
                setIsDisabled(false);
            }, linkDisableTimeout);

            return () => {
                clearTimeout(timeout);
            };
        }

        return undefined;
    }, [isDisabled]);

    if (link.url && link.type === 'external_link') {
        return <a href={link.url}>{link.text}</a>;
    }

    return (
        <button
            type='submit'
            disabled={isLoading || isDisabled}
            onClick={handleAction}
        >
            {isSelected && 'Yes: '} {link.text} {isLoading && '(loading...)'}
        </button>
    );
};

const SnakkebobleContents = styled.div`
    p {
        margin: 0;
        padding: 0;
    }
`;

interface ResponseElementProperties
    extends Omit<ResponseElementLinkProperties, 'link'> {
    response: BoostResponse;
    responseIndex?: number;
    element: BoostResponseElement;
    responses?: BoostResponse[];
}

const ResponseElement = ({
    response,
    responseIndex,
    element,
    responses,
    ...properties
}: ResponseElementProperties) => {
    if (element.type === 'text') {
        if (response.source === 'local') {
            return (
                <div style={{opacity: 0.5}}>
                    <Snakkeboble pilHoyre topp='Sender...'>
                        {element.payload.text}
                    </Snakkeboble>
                </div>
            );
        }

        if (response.source === 'client') {
            return (
                <Snakkeboble pilHoyre topp='Sendt'>
                    {element.payload.text}
                </Snakkeboble>
            );
        }

        return <Snakkeboble>{element.payload.text}</Snakkeboble>;
    }

    if (element.type === 'html') {
        return (
            <Snakkeboble>
                <SnakkebobleContents
                    dangerouslySetInnerHTML={{
                        __html: String(element.payload.html)
                    }}
                />
            </Snakkeboble>
        );
    }

    if (element.type === 'links') {
        return (
            <div>
                {element.payload.links.map((link, index) => (
                    <ResponseElementLink
                        key={index} // eslint-disable-line react/no-array-index-key
                        {...properties}
                        {...{link}}
                    />
                ))}
            </div>
        );
    }

    return null;
};

interface ResponseProperties
    extends Omit<ResponseElementProperties, 'element'> {
    responsesLength?: number;
    onReveal?: () => void;
}

const Response = ({
    response,
    responseIndex,
    responsesLength,
    onReveal,
    ...properties
}: ResponseProperties) => {
    const responseDate = new Date(response.date_created);
    const responseTimestamp = responseDate.getTime();
    let typingRevealTimestamp = 0;
    let revealTimestamp = 0;

    const shouldObscure =
        response.source === 'bot' &&
        responseIndex === (responsesLength ?? 1) - 1;

    if (shouldObscure) {
        typingRevealTimestamp =
            responseIndex === 0
                ? responseTimestamp
                : responseTimestamp + botResponseRevealDelay;
        revealTimestamp =
            typingRevealTimestamp +
            botResponseRevealDelayBuffer +
            botResponseRevealDelayBuffer * Math.random();
    }

    const handleReveal = useCallback(() => {
        if (onReveal) {
            onReveal();
        }
    }, [onReveal]);

    return (
        <Obscured untilTimestamp={typingRevealTimestamp}>
            <div lang={response.language}>
                <Obscured
                    untilTimestamp={revealTimestamp}
                    by={<TypingIndicator />}
                    onReveal={handleReveal}
                >
                    {response.elements.map((element, index) => {
                        let elementTypingRevealTimestamp = 0;
                        let elementRevealTimestamp = 0;

                        if (shouldObscure) {
                            if (index !== 0) {
                                elementTypingRevealTimestamp =
                                    revealTimestamp +
                                    botResponseRevealDelay * index;

                                elementRevealTimestamp =
                                    element.type === 'links'
                                        ? 0
                                        : elementTypingRevealTimestamp +
                                          botResponseRevealDelayBuffer +
                                          botResponseRevealDelayBuffer *
                                              Math.random();
                            }
                        }

                        return (
                            <Obscured
                                key={index} // eslint-disable-line react/no-array-index-key
                                untilTimestamp={elementTypingRevealTimestamp}
                            >
                                <Obscured
                                    untilTimestamp={elementRevealTimestamp}
                                    by={<TypingIndicator />}
                                    onReveal={handleReveal}
                                >
                                    <ResponseElement
                                        {...properties}
                                        {...{response, responseIndex, element}}
                                    />
                                </Obscured>
                            </Obscured>
                        );
                    })}
                </Obscured>
            </div>
        </Obscured>
    );
};

const IntroStripe = () => {
    const {status} = useSession();

    if (status === 'connecting') {
        return <AlertStripe type='info'>Kobler til...</AlertStripe>;
    }

    if (status === 'connected') {
        return <AlertStripe type='info'>Tilkoblet.</AlertStripe>;
    }

    return null;
};

const StatusStripe = () => {
    const {conversation, error, status} = useSession();
    const conversationStatus = conversation?.state.chat_status;

    switch (status) {
        case 'restarting': {
            return (
                <AlertStripe type='advarsel'>Starter på nytt...</AlertStripe>
            );
        }

        case 'ended': {
            return (
                <AlertStripe type='suksess'>Samtalen er avsluttet.</AlertStripe>
            );
        }

        case 'error': {
            if (error?.code === 'network_error') {
                return (
                    <AlertStripe type='feil'>
                        Vi får ikke kontakt. Vennligst sjekk
                        internettilkoblingen din og prøv igjen.
                    </AlertStripe>
                );
            }

            return (
                <AlertStripe type='feil'>Det har skjedd en feil.</AlertStripe>
            );
        }

        default: {
            if (conversationStatus === 'in_human_chat_queue') {
                return (
                    <AlertStripe type='info'>
                        Venter på ledig kundebehandler...
                    </AlertStripe>
                );
            }

            return null;
        }
    }
};

const Container = styled.div`
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-flow: column;
    position: fixed;
    right: 0;
    bottom: 0;
`;

const Padding = styled.div`
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
`;

const Header = styled.div`
    background: #eee;
    border-bottom: 1px solid #999;
`;

const Conversation = styled.div`
    overflow: auto;
    scroll-snap-type: y proximity;
    flex: 1;
    position: relative;
`;

const Stripe = styled.div`
    margin-top: 30px;
    margin-bottom: 30px;

    &:first-child {
        margin-top: 0;
    }

    &:last-child {
        margin-bottom: 0;
    }

    &:empty {
        display: none;
    }
`;

const StatusStripeContainer = styled.div`
    margin-top: 40px;
    position: sticky;
    bottom: 30px;

    ${Stripe}:empty + & {
        margin-top: 0;
    }
`;

const Anchor = styled.div`
    overflow-anchor: auto;
    scroll-snap-align: start;
`;

const Form = styled.form`
    border-top: 1px solid #999;
`;

const Actions = styled.div`
    margin-top: 10px;
    display: flex;
    flex-direction: row-reverse;
`;

const Separator = styled.div`
    flex: 1;
`;

const RestartKnapp = styled(Knapp)`
    padding: 0 15px;
    margin-right: 10px;
`;

const Chat = () => {
    const {
        id,
        status,
        conversation,
        responses,
        queue,
        start,
        restart,
        finish,
        sendMessage,
        sendAction,
        sendPing
    } = useContext(SessionContext);

    const anchor = useRef<HTMLDivElement>();
    const [message, setMessage] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(
        () => cookies.get(openCookieName) === 'true'
    );

    const [unreadCount, setUnreadCount] = useState<number>(
        () => Number.parseInt(String(cookies.get(unreadCookieName)), 10) || 0
    );

    const responsesLength = responses?.length;
    const conversationStatus = conversation?.state.chat_status;
    const messageMaxCharacters = conversation?.state.max_input_chars ?? 110;
    const isAgentTyping = conversation?.state.human_is_typing;

    const scrollToBottom = useCallback(() => {
        if (anchor.current) {
            anchor.current.scrollIntoView({block: 'start'});
        }
    }, []);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(event.target.value);
        },
        []
    );

    const handleAction = useCallback(
        async (id: string) => {
            await sendAction!(id);
        },
        [sendAction]
    );

    const handleSubmit = useCallback(
        (event?: React.FormEvent<HTMLFormElement>) => {
            event?.preventDefault();

            if (message) {
                if (message.length < messageMaxCharacters) {
                    setMessage('');
                    void sendMessage!(message);
                }
            }
        },
        [message, messageMaxCharacters, sendMessage]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key.toLowerCase() === 'enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit]
    );

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setUnreadCount(0);
        scrollToBottom();

        if (status === 'disconnected' || status === 'ended') {
            void start!();
        }
    }, [status, start, scrollToBottom]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setUnreadCount(0);
    }, []);

    const handleRestart = useCallback(() => {
        void restart!();
        setUnreadCount(0);
    }, [restart]);

    const handleFinish = useCallback(() => {
        void finish!();
        setIsOpen(false);
        setUnreadCount(0);
    }, [finish]);

    useEffect(() => {
        if (isOpen && (status === 'disconnected' || status === 'ended')) {
            void start!();
        }
    }, [start, isOpen, status]);

    useEffect(() => {
        cookies.set(openCookieName, String(isOpen), {domain: cookieDomain});
    }, [isOpen]);

    useEffect(() => {
        if (
            status === 'disconnected' ||
            status === 'ended' ||
            status === 'error'
        ) {
            setUnreadCount(0);
        } else if (status === 'connected') {
            setUnreadCount((number) => number + 1);
        }
    }, [status, responses]);

    useEffect(() => {
        scrollToBottom();
    }, [scrollToBottom, status, queue]);

    useEffect(() => {
        cookies.set(unreadCookieName, String(unreadCount), {
            domain: cookieDomain
        });
    }, [unreadCount]);

    useDebouncedEffect(
        2000,
        () => {
            if (id && message) {
                void sendPing!();
            }
        },
        [message]
    );

    return (
        <>
            {isOpen ? (
                <button type='button' onClick={handleClose}>
                    Lukk chat
                </button>
            ) : (
                <button type='button' onClick={handleOpen}>
                    Åpne chat{' '}
                    {unreadCount > 0 && `(${unreadCount} ulest melding)`}
                </button>
            )}

            {isOpen && (
                <Container>
                    <Header>
                        <Padding>
                            <button
                                aria-label='Minimer chatvindu'
                                type='button'
                                onClick={handleClose}
                            >
                                Minimer
                            </button>

                            <button
                                aria-label='Åpne chat i fullskjerm'
                                type='button'
                                onClick={handleClose}
                            >
                                Fullskjerm
                            </button>

                            <button
                                aria-label='Avslutt chat'
                                type='button'
                                onClick={handleFinish}
                            >
                                Avslutt
                            </button>
                        </Padding>
                    </Header>

                    <Conversation>
                        <Padding>
                            <Stripe>
                                <IntroStripe />
                            </Stripe>

                            {responses?.map((response, index) => (
                                <Response
                                    key={response.id}
                                    {...{response, responses}}
                                    responseIndex={index}
                                    responsesLength={responsesLength}
                                    onAction={handleAction}
                                    onReveal={scrollToBottom}
                                />
                            ))}

                            {isAgentTyping && <TypingIndicator />}

                            {queue && <Response response={queue} />}

                            <StatusStripeContainer>
                                <Stripe>
                                    <StatusStripe />
                                </Stripe>
                            </StatusStripeContainer>

                            <Anchor ref={anchor as any} />
                        </Padding>
                    </Conversation>

                    <Form onSubmit={handleSubmit}>
                        <Textarea
                            aria-label='Ditt spørsmål'
                            placeholder='Skriv spørsmålet ditt'
                            name='message'
                            value={message}
                            maxLength={messageMaxCharacters}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                        />

                        <Actions>
                            <Knapp aria-label='Send melding' htmlType='submit'>
                                Send
                            </Knapp>

                            {conversationStatus === 'virtual_agent' && (
                                <RestartKnapp
                                    aria-label='Start chat på nytt'
                                    htmlType='button'
                                    type='flat'
                                    onClick={handleRestart}
                                >
                                    Start på nytt
                                </RestartKnapp>
                            )}
                        </Actions>
                    </Form>
                </Container>
            )}
        </>
    );
};

const Chatbot = () => (
    <LanguageProvider>
        <SessionProvider>
            <Chat />
        </SessionProvider>
    </LanguageProvider>
);

export default Chatbot;
