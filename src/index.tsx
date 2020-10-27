import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React, {createContext, useContext, useState, useEffect} from 'react';

import axios, {AxiosError} from 'axios';
import cookies from 'js-cookie';

const apiUrlBase = 'https://navtest.boost.ai/api/chat/v2';
const conversationIdCookieName = 'nav-chatbot:conversation';
const languageCookieName = 'nav-chatbot:language';
const botResponseRevealDelay = 2000;
const botResponseRevealDelayBuffer = botResponseRevealDelay / 2;

interface BoostConversation {
    id: string;
    reference: string;
    state: {
        chat_status: string;
        max_input_characters: number;
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
    let iteration = 0;

    function createLoader() {
        iteration += 1;

        const currentIteration = iteration;
        setLoaders((previousState) => previousState.concat(currentIteration));

        return () => {
            setLoaders((previousState) => {
                previousState.splice(
                    previousState.indexOf(currentIteration),
                    1
                );

                return previousState;
            });
        };
    }

    const isLoading: boolean = loaders.length !== 0;
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
    }, dependencies);
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
            cookies.set(languageCookieName, language);
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

interface Session {
    id?: string;
    status?:
        | 'initializing'
        | 'connected'
        | 'loading'
        | 'restarting'
        | 'error'
        | 'ended';
    queue?: BoostResponse;
    session?: {
        conversation: BoostConversation;
        responses: BoostResponse[];
    };
    isInitializing?: boolean;
    isLoading?: boolean;
    sendMessage?: (message: string) => Promise<void>;
    sendAction?: (actionId: string) => Promise<void>;
    sendPing?: () => Promise<void>;
    restart?: () => Promise<void>;
}

const SessionContext = createContext<Session>({});

const SessionProvider = (properties: Record<string, unknown>) => {
    const [status, setStatus] = useState<Session['status']>('initializing');
    const [isLoading, setIsLoading] = useLoader();
    const {language, setLanguage} = useLanguage();
    const [savedConversationId] = useState<string | undefined>(() =>
        cookies.get(conversationIdCookieName)
    );

    const [queue, setQueue] = useState<BoostResponse>();
    const [session, setSession] = useState<Session['session'] | undefined>();
    const conversationId = session?.conversation.id;

    function handleError(error: any) {
        if (error?.response) {
            if (error.response.data.error === 'session ended') {
                setStatus('ended');
                return;
            }
        }

        setStatus('error');
    }

    async function updateSession(updates: BoostRequestResponse) {
        const responses =
            'response' in updates ? [updates.response] : updates.responses;
        const [mostRecentResponse] = responses.slice(-1);

        if (mostRecentResponse.language) {
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

        setSession((previousSession) => {
            if (previousSession) {
                const updatedResponses = previousSession.responses;
                const currentResponseIds = new Set(
                    updatedResponses.map((index) => String(index.id))
                );

                responses.forEach((response) => {
                    if (!currentResponseIds.has(String(response.id))) {
                        updatedResponses.push(response);
                    }
                });

                updatedResponses.sort(
                    (a, b) =>
                        new Date(a.date_created).getTime() -
                        new Date(b.date_created).getTime()
                );

                return {
                    conversation: updates.conversation,
                    responses: updatedResponses
                };
            }

            if ('response' in updates) {
                return {
                    conversation: updates.conversation,
                    responses: [
                        {
                            ...updates.response,
                            // NOTE: 'START' request returns wrong creation date (shifted one hour back)
                            date_created: new Date().toISOString()
                        }
                    ]
                };
            }

            return updates;
        });
    }

    async function sendMessage(message: string) {
        if (session && conversationId) {
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
    }

    async function sendAction(id: string) {
        if (session && conversationId) {
            const finishLoading = setIsLoading();
            await postBoostSession(conversationId, {
                type: 'action_link',
                id
            }).catch((error) => {
                void handleError(error);
            });

            finishLoading();
        }
    }

    async function sendPing() {
        if (session && conversationId) {
            await pingBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }
    }

    async function restart() {
        setStatus('restarting');

        if (session && conversationId) {
            await deleteBoostSession(conversationId).catch((error) => {
                console.error(error);
            });
        }

        const finishLoading = setIsLoading();
        setSession(undefined);
        setQueue(undefined);

        try {
            const createdSession = await createBoostSession();

            cookies.set(
                conversationIdCookieName,
                createdSession.conversation.id
            );

            void updateSession(createdSession);
        } catch (error) {
            handleError(error);
        }

        finishLoading();
    }

    useEffect(() => {
        let shouldUpdate = true;
        const finishLoading = setIsLoading();

        if (savedConversationId) {
            void getBoostSession(savedConversationId, {language})
                .then((retrievedSession) => {
                    if (shouldUpdate) {
                        void updateSession(retrievedSession);
                    }

                    finishLoading();
                })
                .catch((error) => {
                    if (shouldUpdate) {
                        void handleError(error);
                    }

                    finishLoading();
                });
        } else {
            void createBoostSession()
                .then((createdSession) => {
                    if (shouldUpdate) {
                        cookies.set(
                            conversationIdCookieName,
                            createdSession.conversation.id
                        );

                        void updateSession(createdSession);
                    }

                    finishLoading();
                })
                .catch((error) => {
                    if (shouldUpdate) {
                        void handleError(error);
                    }

                    finishLoading();
                });
        }

        return () => {
            shouldUpdate = false;
            finishLoading();
        };
    }, [savedConversationId]);

    useEffect(() => {
        if (session && conversationId) {
            let timeout: number | undefined;
            let shouldUpdate = true;

            const poll = async () => {
                const [mostRecentResponse] = session.responses.slice(-1);
                const mostRecentResponseId = mostRecentResponse.id;

                await pollBoostSession(conversationId, {
                    mostRecentResponseId
                })
                    .then((updatedSession) => {
                        if (updatedSession.responses.length === 0) {
                            return;
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
    }, [session]);

    const isInitializing = isLoading && !session;

    useEffect(() => {
        if (isLoading) {
            if (session) {
                setStatus('loading');
            } else {
                setStatus('initializing');
            }
        } else if (session) {
            setStatus('connected');
        }
    }, [session, isLoading]);

    return (
        <SessionContext.Provider
            {...properties}
            value={{
                id: conversationId,
                status,
                queue,
                session,
                isInitializing,
                isLoading,
                sendMessage,
                sendAction,
                sendPing,
                restart
            }}
        />
    );
};

const useSession = () => useContext(SessionContext);

interface ObscuredProperties {
    untilTimestamp?: number;
    by?: React.ReactNode;
    children: React.ReactNode;
}

const Obscured = ({untilTimestamp, by, children}: ObscuredProperties) => {
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
    }, []);

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
    const [isLoading, setIsLoading] = useLoader();

    async function handleAction() {
        if (!isLoading && onAction) {
            const finishLoading = setIsLoading();
            await onAction(link.id);
            finishLoading();
            setIsSelected(true);
        }
    }

    useEffect(() => {
        if (isSelected) {
            const timeout = setTimeout(() => {
                setIsSelected(false);
            }, 5000);

            return () => {
                clearTimeout(timeout);
            };
        }

        return undefined;
    }, [isSelected]);

    return (
        <button
            type='submit'
            disabled={isLoading || isSelected}
            onClick={handleAction}
        >
            {isSelected && 'Yes: '} {link.text} {isLoading && '(loading...)'}
        </button>
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
                <div style={{opacity: 0.5}}>
                    {element.payload.text} (sender)
                </div>
            );
        }

        if (response.source === 'client') {
            return <div>{element.payload.text} (sendt)</div>;
        }

        return <div>{element.payload.text}</div>;
    }

    if (element.type === 'html') {
        return (
            <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: String(element.payload.html)
                }}
            />
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
}

const Response = ({
    response,
    responseIndex,
    responsesLength,
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

    return (
        <Obscured untilTimestamp={typingRevealTimestamp}>
            <li lang={response.language}>
                <Obscured untilTimestamp={revealTimestamp} by='(typing...)'>
                    {response.avatar_url && (
                        <img width={16} height={16} src={response.avatar_url} />
                    )}

                    <time dateTime={response.date_created}>
                        {response.date_created}
                    </time>

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
                                        ? elementTypingRevealTimestamp
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
                                    by='(typing...)'
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
            </li>
        </Obscured>
    );
};

const Chat = () => {
    const {
        id,
        status,
        session,
        queue,
        sendMessage,
        sendAction,
        sendPing,
        restart
    } = useSession();

    const {language} = useLanguage();
    const [message, setMessage] = useState('');

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value);
    }

    async function handleAction(id: string) {
        await sendAction!(id);
    }

    function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
        event?.preventDefault();

        if (message) {
            setMessage('');
            void sendMessage!(message);
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key.toLowerCase() === 'enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    }

    function handleRestart() {
        void restart!();
    }

    useDebouncedEffect(
        2000,
        () => {
            if (id && message) {
                void sendPing!();
            }
        },
        [message]
    );

    const responsesLength = session?.responses.length;

    return (
        <div>
            <p>
                {language
                    ? language === 'en-GB'
                        ? `Hello, ${language}`
                        : `Hei, ${language}`
                    : 'Hei!'}
                .
            </p>

            <ul>
                {status === 'initializing' && 'Kobler til...'}
                {(status === 'connected' || status === 'loading') &&
                    'Tilkoblet.'}
                {status === 'restarting' && 'Starter på nytt...'}
                {status === 'ended' && 'Samtalen er avsluttet.'}
                {status === 'error' && 'Feil.'}

                {session?.responses.map((response, index) => (
                    <Response
                        key={response.id}
                        {...{response}}
                        responseIndex={index}
                        responsesLength={responsesLength}
                        responses={session.responses}
                        onAction={handleAction}
                    />
                ))}

                {queue && <Response response={queue} />}
            </ul>

            <form onSubmit={handleSubmit}>
                <textarea
                    aria-label='Ditt spørsmål'
                    placeholder='Skriv spørsmålet ditt'
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />

                <button type='submit'>Send</button>
                <button type='button' onClick={handleRestart}>
                    Restart
                </button>
            </form>
        </div>
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
