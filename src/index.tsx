import React, {useRef, useState, useEffect, useCallback} from 'react';
import styled from 'styled-components';
import cookies from 'js-cookie';
import {Textarea} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import delay from './utilities/delay';
import {LanguageProvider} from './contexts/language';
import useSession, {SessionProvider} from './contexts/session';
import useDebouncedEffect from './hooks/use-debounced-effect';
import Header from './components/header';
import TypingIndicator from './components/typing-indicator';
import OpenButton from './components/open-button';
import StatusStrip from './components/status-strip';

import ConversationElement, {
    ConversationGroup
} from './components/conversation';

import Response from './components/response';
import FinishModal from './components/finish-modal';
import EvaluationModal from './components/evaluation-modal';

import {
    containerWidth,
    containerHeight,
    fullscreenMediaQuery,
    cookieDomain,
    openCookieName,
    unreadCookieName
} from './configuration';

interface ContainerProperties {
    isFullscreen?: boolean;
    isClosing?: boolean;
    isOpening?: boolean;
}

const Container = styled.div`
    background-color: #fff;
    width: ${containerWidth};
    height: ${containerHeight};
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
    transition: width 0.37s, height 0.37s, transform 0.37s;
    transform-origin: 100% 100%;
    touch-action: manipulation;

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

const Strip = styled.div`
    &:empty {
        display: none;
    }
`;

const StatusStripContainer = styled.div`
    position: sticky;
    bottom: 10px;

    margin-top: 15px;

    &:first-child {
        margin-top: 0;
    }
`;

const Conversation = styled.div`
    overflow: auto;
    scroll-snap-type: y proximity;
    flex: 1;
    position: relative;
`;

const ConversationFiller = styled.div`
    min-height: ${containerHeight};
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

interface ChatProperties {
    analyticsCallback?: () => void;
}

const Chat = ({analyticsCallback}: ChatProperties) => {
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
    } = useSession();

    const reference = useRef<HTMLDivElement>();
    const anchor = useRef<HTMLDivElement>();
    const [message, setMessage] = useState<string>('');
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [isOpening, setIsOpening] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(
        () => cookies.get(openCookieName) === 'true'
    );

    const [isFinishing, setIsFinishing] = useState<boolean>(false);
    const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
    const [updateCount, setUpdateCount] = useState<number>(0);
    const [unreadCount, setUnreadCount] = useState<number>(
        () => Number.parseInt(String(cookies.get(unreadCookieName)), 10) || 0
    );

    const responsesLength = responses?.length;
    const conversationStatus = conversation?.state.chat_status;
    const messageMaxCharacters = conversation?.state.max_input_chars ?? 110;

    const scrollToBottom = useCallback((options?: ScrollIntoViewOptions) => {
        if (anchor.current) {
            anchor.current.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
                ...options
            });
        }
    }, []);

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value);
    }

    const handleAction = useCallback(
        async (id: string) => {
            await sendAction!(id);
            scrollToBottom();
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
        scrollToBottom({behavior: 'auto'});

        if (reference.current) {
            reference.current.focus();
        }
    }, [status, start, scrollToBottom]);

    function toggleFullscreen() {
        setIsFullscreen((previousState) => !previousState);
    }

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
        let shouldFinish = false;

        if ((responsesLength || 0) < 2) {
            shouldFinish = true;
        } else if (isEvaluating) {
            shouldFinish = true;
        } else if (isFinishing) {
            if (!analyticsCallback) {
                shouldFinish = true;
            }
        }

        if (shouldFinish) {
            await handleClose();
            void finish!();
            setIsFinishing(false);
            setIsEvaluating(false);
        } else if (isFinishing) {
            setIsEvaluating(true);
        } else {
            setIsFinishing(true);
        }
    }, [
        isFinishing,
        isEvaluating,
        analyticsCallback,
        responsesLength,
        finish,
        handleClose
    ]);

    function handleCancelFinish() {
        setIsFinishing(false);
    }

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
        if (status === 'connected') {
            setUpdateCount((number) => number + 1);
        }
    }, [status, responses]);

    useEffect(() => {
        if (updateCount > 1) {
            setUnreadCount((number) => number + 1);
        }
    }, [updateCount]);

    useEffect(() => {
        scrollToBottom();
    }, [status, queue, scrollToBottom]);

    useEffect(() => {
        cookies.set(unreadCookieName, String(unreadCount), {
            domain: cookieDomain
        });
    }, [unreadCount]);

    useEffect(() => {
        const isHumanTyping = Boolean(conversation?.state.human_is_typing);

        if (isHumanTyping) {
            setIsAgentTyping(isHumanTyping);
        } else {
            const timeout = setTimeout(() => {
                setIsAgentTyping(isHumanTyping);
            }, 1000);

            return () => {
                clearTimeout(timeout);
            };
        }

        return undefined;
    }, [conversation?.state.human_is_typing]);

    useEffect(() => {
        setIsAgentTyping(false);
    }, [responses]);

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
    const isModalOpen = isFinishing || isEvaluating;

    return (
        <>
            <OpenButton
                {...{isOpen, isOpening, unreadCount}}
                onClick={handleOpen}
            />

            {isConsideredOpen && (
                <Container
                    ref={reference as any}
                    {...{isFullscreen, isClosing, isOpening}}
                >
                    <Header
                        {...{isFullscreen}}
                        isObscured={isModalOpen}
                        onClose={handleClose}
                        onToggleFullscreen={toggleFullscreen}
                        onFinish={handleFinish}
                    />

                    <Conversation>
                        <Padding>
                            {(status === 'connecting' ||
                                status === 'restarting') && (
                                <ConversationFiller />
                            )}

                            {responses?.map((response, index) => (
                                <Response
                                    key={response.id}
                                    {...{conversation, response, responses}}
                                    responseIndex={index}
                                    responsesLength={responsesLength}
                                    isObscured={isModalOpen}
                                    onAction={handleAction}
                                    onReveal={scrollToBottom}
                                />
                            ))}

                            {isAgentTyping && (
                                <ConversationGroup>
                                    <ConversationElement isThinking>
                                        <TypingIndicator />
                                    </ConversationElement>
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
                                aria-label='Din melding'
                                name='message'
                                value={message}
                                maxLength={messageMaxCharacters}
                                tabIndex={isModalOpen ? -1 : undefined}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />

                            <Actions>
                                <Knapp
                                    aria-label='Send melding'
                                    htmlType='submit'
                                    tabIndex={isModalOpen ? -1 : undefined}
                                >
                                    Send
                                </Knapp>

                                {conversationStatus === 'virtual_agent' && (
                                    <RestartKnapp
                                        mini
                                        aria-label='Start chat på nytt'
                                        htmlType='button'
                                        type='flat'
                                        tabIndex={isModalOpen ? -1 : undefined}
                                        onClick={handleRestart}
                                    >
                                        Start på nytt
                                    </RestartKnapp>
                                )}
                            </Actions>
                        </Padding>
                    </Form>

                    <FinishModal
                        isOpen={isFinishing && !isEvaluating}
                        onConfirm={handleFinish}
                        onCancel={handleCancelFinish}
                    />

                    <EvaluationModal
                        isOpen={isEvaluating}
                        onConfirm={handleFinish}
                    />
                </Container>
            )}
        </>
    );
};

const Chatbot = ({...properties}) => (
    <LanguageProvider>
        <SessionProvider>
            <Chat {...properties} />
        </SessionProvider>
    </LanguageProvider>
);

export default Chatbot;
