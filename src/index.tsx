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

import {Innholdstittel, Normaltekst, Undertekst} from 'nav-frontend-typografi';
import {Textarea, RadioPanelGruppe} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import AlertStripe from 'nav-frontend-alertstriper';
import NavFrontendSpinner from 'nav-frontend-spinner';

import fridaIcon from './assets/frida.svg';
import finishIcon from './assets/finish.svg';
import minimizeIcon from './assets/minimize.svg';
import fullscreenIcon from './assets/maximize.svg';
import contractIcon from './assets/contract.svg';

const cookieDomain =
    window.location.hostname === 'localhost' ? undefined : '.nav.no';
const clientLanguage = window.navigator.language;

const apiUrlBase = 'https://navtest.boost.ai/api/chat/v2';
const conversationIdCookieName = 'nav-chatbot:conversation';
const languageCookieName = 'nav-chatbot:language';
const openCookieName = 'nav-chatbot:open';
const unreadCookieName = 'nav-chatbot:unread';
const linkDisableTimeout = 1000 * 10;
const botResponseRevealDelay = 1250;
const botResponseRevealDelayBuffer = botResponseRevealDelay / 2;
const fullscreenMediaQuery = '(max-width: 500px), (max-height: 630px)';

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
    const response = await axios.post(apiUrlBase, {
        command: 'START',
        language: clientLanguage
    });

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

async function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const update = useCallback(
        (updates: BoostRequestResponse) => {
            if (conversation) {
                if (conversationId === updates.conversation.id) {
                    const currentState = JSON.stringify(conversationState);
                    const updatedState = JSON.stringify(
                        updates.conversation.state
                    );

                    if (currentState !== updatedState) {
                        setConversation(updates.conversation);
                    }
                } else {
                    setConversation(updates.conversation);
                }
            } else {
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
                    const response = updates.response;
                    response.date_created = new Date().toISOString();
                    // NOTE: 'START' request returns wrong creation date (shifted one hour back)

                    return [response];
                }

                return updates.responses;
            });
        },
        [conversation, conversationId, conversationState, setLanguage]
    );

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

                update(session);
            } else {
                const session = await createBoostSession();
                update(session);
            }

            setStatus('connected');
        } catch (error) {
            void handleError(error);
        }

        finishLoading();
    }, [savedConversationId, language, setIsLoading, update, handleError]);

    const remove = useCallback(async () => {
        setSavedConversationId(undefined);
        setConversation(undefined);
        setResponses(undefined);
        setQueue(undefined);

        if (conversationId && canDeleteConversation) {
            await deleteBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }
    }, [conversationId, canDeleteConversation]);

    const restart = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('restarting');
        await remove();
        setStatus('connecting');

        try {
            const createdSession = await createBoostSession();
            update(createdSession);
            setStatus('connected');
        } catch (error) {
            handleError(error);
        }

        finishLoading();
    }, [remove, setIsLoading, update, handleError]);

    const finish = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('ended');
        await remove();
        finishLoading();
    }, [remove, setIsLoading]);

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
                            update(updatedSession);
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
    }, [status, conversationId, responses, update, handleError]);

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

const TypingIndicatorDot = styled.div`
    background: rgba(0, 0, 0, 0.4);
    width: 8px;
    height: 8px;
    border-radius: 8px;
    margin: 7px;
    margin-right: 0;
    margin-left: 5px;
    opacity: 0.5;
    position: relative;
    top: 2px;
    animation: animate 0.5s infinite alternate;
    display: inline-block;
    vertical-align: top;

    &:first-child {
        margin-left: 0;
    }

    &:nth-child(1) {
        animation-delay: 0.33s;
    }

    &:nth-child(2) {
        animation-delay: 0.66s;
    }

    @keyframes animate {
        0% {
            opacity: 0.5;
        }

        100% {
            opacity: 1;
            transform: translate3d(0, -40%, 0);
        }
    }
`;

const TypingIndicator = () => {
    return (
        <div>
            <TypingIndicatorDot />
            <TypingIndicatorDot />
            <TypingIndicatorDot />
        </div>
    );
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
    response: BoostResponse;
    onAction?: Session['sendAction'];
}

const ResponseElementLink = ({
    link,
    response,
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

    const handleKeyPress = useCallback(
        (event) => {
            if (event.key.toLowerCase() === 'enter') {
                void handleAction();
            }
        },
        [handleAction]
    );

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
        return (
            <ConversationBubbleContainer>
                <ConversationBubbleAvatar>
                    <img src={response.avatar_url} alt='' />
                </ConversationBubbleAvatar>

                <ConversationBubbleLeft>
                    <ConversationBubbleText>
                        <a href={link.url}>{link.text}</a>
                    </ConversationBubbleText>
                </ConversationBubbleLeft>
            </ConversationBubbleContainer>
        );
    }

    return (
        <ConversationBubbleContainer onKeyPress={handleKeyPress}>
            <ConversationBubbleAvatar />
            <ConversationButton
                name={link.text}
                radios={[{label: link.text, value: link.text, id: link.text}]}
                checked={isSelected || isLoading ? link.text : undefined}
                onChange={handleAction}
            />
        </ConversationBubbleContainer>
    );
};

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
                <div style={{opacity: 0.7}}>
                    <ConversationBubbleContainer>
                        <ConversationBubbleRight tabIndex={0}>
                            <ConversationBubbleText>
                                {element.payload.text}
                            </ConversationBubbleText>
                        </ConversationBubbleRight>
                    </ConversationBubbleContainer>

                    <ConversationBubbleSubtext>
                        Sender... <Spinner />
                    </ConversationBubbleSubtext>
                </div>
            );
        }

        if (response.source === 'client') {
            return (
                <>
                    <ConversationBubbleContainer>
                        <ConversationBubbleRight tabIndex={0}>
                            <ConversationBubbleText>
                                {element.payload.text}
                            </ConversationBubbleText>
                        </ConversationBubbleRight>
                    </ConversationBubbleContainer>

                    <ConversationBubbleSubtext>Sendt</ConversationBubbleSubtext>
                </>
            );
        }

        return (
            <ConversationBubbleContainer>
                <ConversationBubbleAvatar>
                    <img src={response.avatar_url} alt='' />
                </ConversationBubbleAvatar>

                <ConversationBubbleLeft tabIndex={0}>
                    <ConversationBubbleText>
                        {element.payload.text}
                    </ConversationBubbleText>
                </ConversationBubbleLeft>
            </ConversationBubbleContainer>
        );
    }

    if (element.type === 'html') {
        return (
            <ConversationBubbleContainer>
                <ConversationBubbleAvatar>
                    <img src={response.avatar_url} alt='' />
                </ConversationBubbleAvatar>

                <ConversationBubbleLeft tabIndex={0}>
                    <ConversationBubbleText>
                        <ConversationBubbleContents
                            dangerouslySetInnerHTML={{
                                __html: String(element.payload.html)
                            }}
                        />
                    </ConversationBubbleText>
                </ConversationBubbleLeft>
            </ConversationBubbleContainer>
        );
    }

    if (element.type === 'links') {
        return (
            <>
                {element.payload.links.map((link, index) => (
                    <ResponseElementLink
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        {...properties}
                        {...{response, link}}
                    />
                ))}
            </>
        );
    }

    return null;
};

const BotTypingIndicator = (properties: {response?: BoostResponse}) => (
    <ConversationBubbleContainer>
        <ConversationBubbleAvatar>
            {properties.response?.avatar_url && (
                <img src={properties.response.avatar_url} alt='' />
            )}
        </ConversationBubbleAvatar>

        <ConversationBubbleLeft isThinking>
            <TypingIndicator />
        </ConversationBubbleLeft>
    </ConversationBubbleContainer>
);

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
            <ConversationGroup lang={response.language}>
                <Obscured
                    untilTimestamp={revealTimestamp}
                    by={<BotTypingIndicator {...{response}} />}
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
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                untilTimestamp={elementTypingRevealTimestamp}
                            >
                                <Obscured
                                    untilTimestamp={elementRevealTimestamp}
                                    by={<BotTypingIndicator />}
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
            </ConversationGroup>
        </Obscured>
    );
};

const Spinner = () => (
    <SpinnerContainer>
        <NavFrontendSpinner />
    </SpinnerContainer>
);

const IntroStrip = () => {
    const {status} = useSession();

    if (status === 'connecting') {
        return (
            <AlertStrip type='info'>
                <AlertStripContainer>
                    <AlertStripText>Kobler til...</AlertStripText>

                    <Spinner />
                </AlertStripContainer>
            </AlertStrip>
        );
    }

    if (status === 'connected') {
        return <AlertStripe type='info'>Tilkoblet.</AlertStripe>;
    }

    return null;
};

const StatusStrip = () => {
    const {conversation, error, status} = useSession();
    const conversationStatus = conversation?.state.chat_status;

    switch (status) {
        case 'restarting': {
            return (
                <AlertStrip type='advarsel'>
                    <AlertStripContainer>
                        <AlertStripText>Starter på nytt...</AlertStripText>

                        <Spinner />
                    </AlertStripContainer>
                </AlertStrip>
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
                    <AlertStrip type='info'>
                        <AlertStripContainer>
                            <AlertStripText>
                                Venter på ledig kundebehandler...
                            </AlertStripText>

                            <Spinner />
                        </AlertStripContainer>
                    </AlertStrip>
                );
            }

            return null;
        }
    }
};

interface ContainerProperties {
    isFullscreen?: boolean;
    isClosing?: boolean;
    isOpening?: boolean;
}

const Container = styled.div`
    background-color: #fff;
    width: 400px;
    height: 568px;
    box-sizing: border-box;
    display: flex;
    flex-flow: column;
    position: fixed;
    right: 0;
    bottom: 0;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.1),
        0 5px 5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border-radius: 2px;
    transform: translate3d(-20px, -20px, 0);
    transition: all 0.3s;
    transition-properties: width, height, transform;
    transform-origin: 100% 100%;

    ${(properties: ContainerProperties) =>
        properties.isFullscreen
            ? `
                width: 100%;
                height: 100%;
                transform: translate3d(0,0,0);
            `
            : ''}

    @media ${fullscreenMediaQuery} {
        width: 100%;
        height: 100%;
        transform: translate3d(0, 0, 0);
    }

    ${(properties: ContainerProperties) =>
        properties.isClosing || properties.isOpening
            ? `
                @media screen {
                    height: 200px;

                    ${
                        properties.isFullscreen
                            ? 'transform: translate3d(0, 220px, 0);'
                            : 'transform: translate3d(-20px, 220px, 0);'
                    }
                }

                @media ${fullscreenMediaQuery} {
                    transform: translate3d(0, 220px, 0);
                }
            `
            : ''}
`;

const Padding = styled.div`
    padding: 14px 12px;
    box-sizing: border-box;
`;

const Tittel = styled(Innholdstittel)`
    font-size: 22px;
`;

interface HeaderProperties {
    isHuman?: boolean;
}

const Header = styled.div`
    background: #fff;
    border-bottom: 1px solid #78706a;
    box-shadow: inset 0 -1px 0 #fff, 0 1px 4px rgba(0, 0, 0, 0.15),
        0 2px 5px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
    border-radius: 2px 2px 0 0;
    padding: 2px 0;
    display: flex;
    transition: background-color 0.37s;

    ${(properties: HeaderProperties) =>
        properties.isHuman
            ? `
                background-color: #C6C2BF;
                box-shadow:
                    inset 0 -1px 0 rgba(255,255,255,0.3),
                    0 1px 4px rgba(0, 0, 0, 0.15),
                    0 2px 5px rgba(0, 0, 0, 0.1);
            `
            : ''}

    ${Tittel} {
        margin: auto;
        margin-left: 0;
        padding-left: 12px;
    }
`;

const HeaderActions = styled.div`
    margin: auto;
    margin-right: 0;
`;

const IconButton = styled.button`
    appearance: none;
    background: none;
    cursor: pointer;
    width: 48px;
    height: 48px;
    padding: 14px;
    border: 0;

    svg {
        width: 100%;
        height: 100%;
    }

    &:focus {
        outline: none;
        box-shadow: inset 0 0 0 3px #005b82;
        border-radius: 7px;
    }
`;

const FullscreenIconButton = styled(IconButton)`
    @media ${fullscreenMediaQuery} {
        display: none;
    }
`;

const Conversation = styled.div`
    overflow: auto;
    scroll-snap-type: y proximity;
    flex: 1;
    position: relative;
`;

const ConversationGroup = styled.div`
    margin-top: 10px;

    &:first-child {
        margin-top: 0;
    }
`;

const ConversationBubbleContainer = styled.div`
    width: 100%;
    display: flex;
`;

const avatarSize = '36px';
const conversationSideWidth = '90%';

const ConversationBubbleAvatar = styled.div`
    background-color: #d8d8d8;
    width: ${avatarSize};
    height: ${avatarSize};
    margin-right: 8px;
    border-radius: 30px;
    position: relative;
    top: 1px;
    overflow: hidden;
    visibility: hidden;

    ${ConversationGroup} ${ConversationBubbleContainer}:first-child & {
        visibility: visible;

        &:empty {
            visibility: hidden;
        }
    }

    img {
        width: 100%;
        height: auto;
    }

    &:after {
        content: '';
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
        position: absolute;
        border-radius: 30px;
    }
`;

interface ConversationBubbleProperties {
    isHuman?: boolean;
    isThinking?: boolean;
}

const ConversationBubble = styled.div`
    max-width: ${conversationSideWidth};
    max-width: calc(${conversationSideWidth} - ${avatarSize} - 8px);
    background: #e7e9e9;
    margin: auto;
    padding: 8px 12px;
    position: relative;
    overflow-wrap: break-word;
    box-sizing: border-box;
    display: inline-block;
    vertical-align: top;

    ${(properties: ConversationBubbleProperties) =>
        properties.isHuman ? `background-color: #CDE7D8;` : ''}

    &:focus {
        outline: none;
        box-shadow: 0 0 0 3px #005b82;
    }

    ${(properties: ConversationBubbleProperties) =>
        properties.isThinking
            ? `
                &:before {
                    content: '';
                    background-color: inherit;
                    width: 5px;
                    height: 5px;
                    border-radius: 5px;
                    position: absolute;
                    bottom: -2px;
                    left: -7px;
                }

                &:after {
                    content: '';
                    background-color: inherit;
                    width: 12px;
                    height: 12px;
                    border-radius: 12px;
                    position: absolute;
                    bottom: 1px;
                    left: -2px;
                }
            `
            : ''}
`;

const ConversationBubbleLeft = styled(ConversationBubble)`
    margin-top: 3px;
    margin-left: 0;
    border-radius: 4px 18px 18px 4px;

    ${ConversationGroup} ${ConversationBubbleContainer}:first-child & {
        margin-top: 0;
        border-radius: 18px 18px 18px 4px;
    }

    ${ConversationGroup} ${ConversationBubbleContainer}:last-child & {
        border-radius: 4px 18px 18px 18px;
    }

    ${ConversationGroup} ${ConversationBubbleContainer}:first-child:last-child & {
        border-radius: 18px 18px 18px 18px;
    }
`;

const ConversationBubbleRight = styled(ConversationBubble)`
    background-color: #e0f5fb;
    margin-top: 3px;
    margin-right: 0;
    border-radius: 18px 18px 18px 18px;
`;

const ConversationBubbleText = styled(Normaltekst)``;

const ConversationBubbleContents = styled.span`
    p {
        margin: 0;
        padding: 0;
    }
`;

const ConversationBubbleSubtext = styled(Undertekst)`
    text-align: right;
    color: #444;
`;

const ConversationButton = styled(RadioPanelGruppe)`
    max-width: ${conversationSideWidth};
    max-width: calc(${conversationSideWidth} - ${avatarSize} - 8px);
    margin-top: 3px;
`;

const SpinnerContainer = styled.span`
    width: 0.8em;
    height: 0.8em;
    margin: auto;
    margin-left: 4px;
    display: inline-block;
    vertical-align: top;

    svg {
        width: 100%;
        height: 100%;
    }
`;

const Strip = styled.div`
    margin-top: 15px;
    margin-bottom: 15px;

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

const StatusStripContainer = styled.div`
    position: sticky;
    bottom: 10px;

    ${Strip} {
        margin-top: 15px;
    }

    ${Strip}:empty + & ${Strip} {
        margin-top: 0;
    }
`;

const AlertStrip = styled(AlertStripe)`
    backdrop-filter: blur(2px);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

    ${SpinnerContainer} {
        position: relative;
        top: -3px;

        svg circle {
            stroke: rgba(0, 0, 0, 0.1);
        }

        svg circle:last-child {
            stroke: #5690a2;
        }
    }
`;

const AlertStripContainer = styled.div`
    display: flex;
`;

const AlertStripText = styled.span`
    flex: 1;
`;

const Anchor = styled.div`
    overflow-anchor: auto;
    scroll-snap-align: start;
`;

const Form = styled.form`
    background: #f4f4f4;
    border-top: 1px solid #78706a;
    box-shadow: inset 0 1px 0 #fff;
`;

const Actions = styled.div`
    margin-top: 10px;
    display: flex;
    flex-direction: row-reverse;
`;

const RestartKnapp = styled(Knapp)`
    padding: 0 15px;
    margin-right: 10px;
`;

const openButtonAvatarSizeNumber = 60;
const openButtonAvatarSize = `${openButtonAvatarSizeNumber}px`;

interface OpenButtonProperties {
    isVisible?: boolean;
}

const OpenButton = styled.button`
    appearance: none;
    background: #fff;
    margin-right: ${openButtonAvatarSizeNumber / 2}px;
    margin-bottom: ${openButtonAvatarSizeNumber / 5}px;
    padding: 8px 15px;
    position: fixed;
    bottom: 25px;
    right: 25px;
    border: 0;
    cursor: pointer;
    border-radius: 30px;
    transform: ${(properties: OpenButtonProperties) =>
        properties.isVisible ? 'scale(1)' : 'scale(0)'};

    opacity: ${(properties: OpenButtonProperties) =>
        properties.isVisible ? '1' : '0'};

    transition: ${(properties: OpenButtonProperties) =>
        properties.isVisible
            ? 'transform 0.37s, opacity 0.1s 0.2s'
            : 'transform 0.2s, opacity 0.1s'};

    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4),
        0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.5),
        0 4px 10px rgba(0, 0, 0, 0.2);

    &:hover {
        background-color: #005b82;
    }

    &:focus {
        background: #005b82;
        outline: none;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3), 0 0 0 4px #005b82;
    }
`;

const OpenButtonText = styled(Normaltekst)`
    padding-right: ${openButtonAvatarSizeNumber / 2 - 4}px;
    display: inline-block;
    vertical-align: top;

    ${OpenButton}:focus &, ${OpenButton}:hover & {
        color: #fff;
    }
`;

const OpenButtonAvatar = styled.div`
    width: ${openButtonAvatarSize};
    height: ${openButtonAvatarSize};
    position: absolute;
    top: 50%;
    right: -${openButtonAvatarSizeNumber / 2}px;
    transform: translateY(-50%);
    transition: transform 0.2s;
    display: inline-block;
    vertical-align: top;

    ${OpenButton}:hover & {
        transform: translateY(-50%) scale(1.1);
    }

    svg {
        width: 100%;
        height: 100%;
    }

    &:before {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3);
        border-radius: ${openButtonAvatarSize};
    }

    ${OpenButton}:focus &:before {
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3), 0 0 0 4px #005b82;
    }
`;

const OpenButtonUnreadCount = styled(Undertekst)`
    background: #c30000;
    width: 21px;
    height: 21px;
    text-align: center;
    color: #fff;
    border-radius: 21px;
    position: absolute;
    top: 50%;
    right: -${openButtonAvatarSizeNumber / 2}px;
    transform: translateY(-${openButtonAvatarSizeNumber / 2}px);
    transition: transform 0.2s;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
        0 0 0 2px rgba(255, 255, 255, 1);
    pointer-events: none;

    &:empty {
        transform: translateY(-${openButtonAvatarSizeNumber / 2}px) scale(0);
    }
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

    const reference = useRef<HTMLDivElement>();
    const anchor = useRef<HTMLDivElement>();
    const [message, setMessage] = useState<string>('');
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [isOpening, setIsOpening] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

    const scrollToBottom = useCallback((options?: ScrollIntoViewOptions) => {
        if (anchor.current) {
            anchor.current.scrollIntoView({block: 'start', ...options});
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
            scrollToBottom({behavior: 'smooth'});
        },
        [sendAction, scrollToBottom]
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

    const handleOpen = useCallback(async () => {
        setIsOpening(true);
        setIsOpen(true);

        if (status === 'disconnected' || status === 'ended') {
            void start!();
        }

        setUnreadCount(0);
        scrollToBottom();

        if (reference.current) {
            reference.current.focus();
        }
    }, [status, start, scrollToBottom]);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((previousState) => !previousState);
    }, []);

    const handleClose = useCallback(async () => {
        setIsClosing(true);
        await delay(370);
        setIsOpen(false);
        setIsFullscreen(false);
        setUnreadCount(0);
    }, [setIsClosing]);

    const handleRestart = useCallback(() => {
        void restart!();
        setUnreadCount(0);
    }, [restart]);

    const handleFinish = useCallback(async () => {
        await handleClose();
        void finish!();
    }, [finish, handleClose]);

    useEffect(() => {
        if (isOpen && (status === 'disconnected' || status === 'ended')) {
            void start!();
        }
    }, [start, isOpen, status]);

    useEffect(() => {
        if (isOpen && isOpening) {
            setIsOpening(false);
        } else if (!isOpen && isClosing) {
            setIsClosing(false);
        }
    }, [isOpen, isOpening, isClosing]);

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

    const isConsideredOpen = isOpen || isOpening;
    const isHuman = conversationStatus === 'assigned_to_human';
    let openButtonLabel = status === 'connected' ? 'Åpne chat' : 'Chat med oss';

    if (unreadCount > 0) {
        openButtonLabel +=
            unreadCount > 1
                ? ` (${unreadCount} uleste meldinger)`
                : ` (${unreadCount} ulest melding)`;
    }

    return (
        <>
            <OpenButton
                type='button'
                aria-label={openButtonLabel}
                isVisible={!isOpen && !isOpening}
                onClick={handleOpen}
            >
                <OpenButtonText>Chat med oss</OpenButtonText>

                <OpenButtonAvatar
                    dangerouslySetInnerHTML={{
                        __html: fridaIcon
                    }}
                />

                <OpenButtonUnreadCount>
                    {unreadCount > 0 ? `${unreadCount}` : ''}
                </OpenButtonUnreadCount>
            </OpenButton>

            {isConsideredOpen && (
                <Container
                    ref={reference as any}
                    {...{isFullscreen, isClosing, isOpening}}
                >
                    <Header {...{isHuman}}>
                        {isHuman ? (
                            <Tittel>Chat med NAV</Tittel>
                        ) : (
                            <Tittel>Chatbot Frida</Tittel>
                        )}

                        <HeaderActions>
                            <IconButton
                                aria-label='Minimer chatvindu'
                                type='button'
                                dangerouslySetInnerHTML={{
                                    __html: minimizeIcon
                                }}
                                onClick={handleClose}
                            />

                            {isFullscreen ? (
                                <FullscreenIconButton
                                    aria-label='Bruk mindre chatvindu'
                                    type='button'
                                    dangerouslySetInnerHTML={{
                                        __html: contractIcon
                                    }}
                                    onClick={toggleFullscreen}
                                />
                            ) : (
                                <FullscreenIconButton
                                    aria-label='Åpne chat i fullskjerm'
                                    type='button'
                                    dangerouslySetInnerHTML={{
                                        __html: fullscreenIcon
                                    }}
                                    onClick={toggleFullscreen}
                                />
                            )}

                            <IconButton
                                aria-label='Avslutt chat'
                                type='button'
                                dangerouslySetInnerHTML={{
                                    __html: finishIcon
                                }}
                                onClick={handleFinish}
                            />
                        </HeaderActions>
                    </Header>

                    <Conversation>
                        <Padding>
                            <Strip>
                                <IntroStrip />
                            </Strip>

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

                            {isAgentTyping && (
                                <ConversationGroup>
                                    <ConversationBubbleContainer>
                                        <ConversationBubbleAvatar />

                                        <ConversationBubbleLeft
                                            isThinking
                                            isHuman
                                        >
                                            <TypingIndicator />
                                        </ConversationBubbleLeft>
                                    </ConversationBubbleContainer>
                                </ConversationGroup>
                            )}

                            {queue && <Response response={queue} />}

                            <StatusStripContainer>
                                <Strip>
                                    <StatusStrip />
                                </Strip>
                            </StatusStripContainer>

                            <Anchor ref={anchor as any} />
                        </Padding>
                    </Conversation>

                    <Form onSubmit={handleSubmit}>
                        <Padding>
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
                                <Knapp
                                    aria-label='Send melding'
                                    htmlType='submit'
                                >
                                    Send
                                </Knapp>

                                {conversationStatus === 'virtual_agent' && (
                                    <RestartKnapp
                                        mini
                                        aria-label='Start chat på nytt'
                                        htmlType='button'
                                        type='flat'
                                        onClick={handleRestart}
                                    >
                                        Start på nytt
                                    </RestartKnapp>
                                )}
                            </Actions>
                        </Padding>
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
