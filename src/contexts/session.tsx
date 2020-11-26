import React, {
    createContext,
    useContext,
    useCallback,
    useState,
    useEffect
} from 'react';

import axios from 'axios';
import cookies from 'js-cookie';
import useLoader from '../hooks/use-loader';

import {
    boostApiUrlBase as defaultBoostApiUrlBase,
    cookieDomain,
    clientLanguage,
    conversationIdCookieName,
    minimumPollTimeout,
    maximumPollTimeout
} from '../configuration';

import useLanguage from './language';

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

async function createBoostSession(
    apiUrlBase: string
): Promise<BoostStartRequestResponse> {
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
    apiUrlBase: string,
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
    apiUrlBase: string,
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
    apiUrlBase: string,
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
    apiUrlBase: string,
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
    apiUrlBase: string,
    conversationId: string
): Promise<BoostDeleteRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'DELETE',
        conversation_id: conversationId
    });

    return response.data;
}

interface BoostRateRequestResponse {
    conversation: BoostConversation;
}

async function rateBoostSession(
    apiUrlBase: string,
    conversationId: string,
    data: {rating: number; message?: string}
): Promise<BoostRateRequestResponse> {
    const response = await axios.post(apiUrlBase, {
        command: 'FEEDBACK',
        conversation_id: conversationId,
        value: {
            rating: data.rating,
            text: data.message
        }
    });

    return response.data;
}

type BoostRequestResponse =
    | BoostStartRequestResponse
    | BoostResumeRequestResponse
    | BoostPollRequestResponse;

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
    sendFeedback?: (rating: number, message?: string) => Promise<void>;
}

const SessionContext = createContext<Session>({});

interface SessionProperties {
    boostApiUrlBase?: string;
}

const SessionProvider = (properties: SessionProperties) => {
    const boostApiUrlBase =
        properties.boostApiUrlBase ?? defaultBoostApiUrlBase;

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
    const [pollMultiplier, setPollMultiplier] = useState<number>(1);

    function handleError(error: any) {
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
    }

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

                await postBoostSession(boostApiUrlBase, conversationId, {
                    type: 'text',
                    message
                }).catch((error) => {
                    void handleError(error);
                });

                setPollMultiplier(0.1);
                finishLoading();
            }
        },
        [boostApiUrlBase, conversationId, setIsLoading]
    );

    const sendAction = useCallback(
        async (id: string) => {
            if (conversationId) {
                const finishLoading = setIsLoading();

                await postBoostSession(boostApiUrlBase, conversationId, {
                    type: 'action_link',
                    id
                }).catch((error) => {
                    void handleError(error);
                });

                setPollMultiplier(0.1);
                finishLoading();
            }
        },
        [boostApiUrlBase, conversationId, setIsLoading]
    );

    const sendPing = useCallback(async () => {
        if (conversationId) {
            await pingBoostSession(boostApiUrlBase, conversationId).catch(
                (error) => {
                    console.error(error);
                }
            );
        }
    }, [boostApiUrlBase, conversationId]);

    const sendFeedback = useCallback(
        async (rating: number, message?: string) => {
            if (conversationId) {
                await rateBoostSession(boostApiUrlBase, conversationId, {
                    rating,
                    message
                }).catch((error) => {
                    console.error(error);
                });
            }
        },
        [boostApiUrlBase, conversationId]
    );

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
                const session = await getBoostSession(
                    boostApiUrlBase,
                    savedConversationId,
                    {
                        language
                    }
                ).catch(async (error) => {
                    if (error?.response) {
                        if (error.response.data.error === 'session ended') {
                            return createBoostSession(boostApiUrlBase);
                        }
                    }

                    throw error;
                });

                update(session);
            } else {
                const session = await createBoostSession(boostApiUrlBase);
                update(session);
            }

            setStatus('connected');
        } catch (error) {
            void handleError(error);
        }

        finishLoading();
    }, [boostApiUrlBase, savedConversationId, language, setIsLoading, update]);

    const remove = useCallback(async () => {
        setSavedConversationId(undefined);
        setConversation(undefined);
        setResponses(undefined);
        setQueue(undefined);

        if (conversationId && canDeleteConversation) {
            await deleteBoostSession(boostApiUrlBase, conversationId).catch(
                (error) => {
                    console.error(error);
                }
            );
        }
    }, [boostApiUrlBase, conversationId, canDeleteConversation]);

    const restart = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('restarting');
        await remove();
        setStatus('connecting');

        try {
            const createdSession = await createBoostSession(boostApiUrlBase);
            update(createdSession);
            setStatus('connected');
        } catch (error) {
            handleError(error);
        }

        finishLoading();
    }, [boostApiUrlBase, remove, setIsLoading, update]);

    const finish = useCallback(async () => {
        const finishLoading = setIsLoading();
        setStatus('ended');
        await remove();
        finishLoading();
    }, [remove, setIsLoading]);

    useEffect(() => {
        if (conversationId) {
            let shouldUpdate = true;

            const poll = async () => {
                if (!conversationId || !shouldUpdate) {
                    return;
                }

                const [mostRecentResponse] = (responses ?? []).slice(-1);
                const mostRecentResponseId = mostRecentResponse.id;

                await pollBoostSession(boostApiUrlBase, conversationId, {
                    mostRecentResponseId
                })
                    .then((updatedSession) => {
                        if (status !== 'disconnected' && status !== 'ended') {
                            if (shouldUpdate) {
                                setStatus('connected');
                            }
                        }

                        if (updatedSession.responses.length === 0) {
                            setPollMultiplier((number) => number + 0.25);
                        } else {
                            setPollMultiplier(1);
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
            };

            const timeout = setTimeout(
                poll,
                Math.min(
                    maximumPollTimeout,
                    minimumPollTimeout * pollMultiplier
                )
            );

            return () => {
                shouldUpdate = false;

                if (timeout) {
                    clearTimeout(timeout);
                }
            };
        }

        return undefined;
    }, [
        boostApiUrlBase,
        status,
        conversationId,
        responses,
        pollMultiplier,
        update
    ]);

    useEffect(() => {
        setSavedConversationId(conversationId);

        if (conversationId) {
            cookies.set(conversationIdCookieName, conversationId, {
                domain: cookieDomain
            });
        } else {
            cookies.remove(conversationIdCookieName);
        }
    }, [conversationId]);

    useEffect(() => {
        if (status === 'disconnected' && savedConversationId) {
            void start();
        }
    }, [start, status, savedConversationId]);

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
                sendFeedback,
                start,
                restart,
                finish
            }}
        />
    );
};

const useSession = () => useContext(SessionContext);

export {
    BoostConversation,
    BoostResponse,
    BoostResponseElement,
    BoostResponseElementLinksItem,
    Session,
    SessionContext,
    SessionProvider
};

export default useSession;
