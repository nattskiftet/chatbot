import React, {useRef, useState, useEffect, useCallback} from 'react';
import styled, {css} from 'styled-components';
import cookies from 'js-cookie';
import delay from './utilities/delay';
import useLanguage, {LanguageProvider} from './contexts/language';

import useSession, {
    SessionProvider,
    BoostResponseElementLinksItem
} from './contexts/session';

import Header from './components/header';
import TypingIndicator from './components/typing-indicator';
import OpenButton from './components/open-button';
import StatusStrip from './components/status-strip';
import Message, {GroupElement} from './components/message';
import Form from './components/form';
import Response from './components/response';
import FinishModal from './components/finish-modal';
import EvaluationModal from './components/evaluation-modal';

import {
    englishButtonText,
    englishButtonResponse,
    containerWidth,
    containerHeight,
    fullscreenMediaQuery,
    cookieDomain,
    openCookieName,
    unreadCookieName
} from './configuration';

interface ContainerElement {
    isFullscreen?: boolean;
    isClosing?: boolean;
    isOpening?: boolean;
}

const ContainerElement = styled.div`
    background-color: #fff;
    width: ${containerWidth};
    height: ${containerHeight};
    box-sizing: border-box;
    display: flex;
    flex-flow: column;
    position: fixed;
    right: 0;
    bottom: 0;
    z-index: 999;
    z-index: 999999;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.1),
        0 5px 5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border-radius: 2px;
    transform: translate3d(-20px, -20px, 0);
    transition: width 0.37s, height 0.37s, transform 0.37s;
    transform-origin: 100% 100%;
    touch-action: manipulation;

    ${(properties: ContainerElement) =>
        properties.isFullscreen &&
        css`
            width: 100%;
            height: 100%;
            transform: translate3d(0, 0, 0);
        `};

    @media ${fullscreenMediaQuery} {
        width: 100%;
        height: 100%;
        transform: translate3d(0, 0, 0);
    }

    ${(properties: ContainerElement) =>
        (properties.isClosing || properties.isOpening) &&
        css`
            @media screen {
                height: 200px;

                ${properties.isFullscreen
                    ? 'transform: translate3d(0, 220px, 0);'
                    : 'transform: translate3d(-20px, 220px, 0);'}
            }

            @media ${fullscreenMediaQuery} {
                transform: translate3d(0, 220px, 0);
            }
        `};
`;

const PaddingElement = styled.div`
    padding: 14px 12px;
    box-sizing: border-box;
`;

const StatusElement = styled.div`
    &:empty {
        display: none;
    }
`;

const StatusContainerElement = styled.div`
    position: sticky;
    bottom: 10px;
    margin-top: 15px;

    &:first-child {
        margin-top: 0;
    }
`;

const ConversationElement = styled.div`
    overflow: auto;
    scroll-snap-type: y proximity;
    flex: 1;
    position: relative;
`;

const FillerElement = styled.div`
    height: 100%;
    min-height: ${containerHeight};
`;

const AnchorElement = styled.div`
    overflow-anchor: auto;
    scroll-snap-align: start;
`;

interface ChatProperties {
    analyticsCallback?: () => void;
}

const Chat = ({analyticsCallback}: ChatProperties) => {
    const {language} = useLanguage();
    const {
        status,
        conversation,
        responses,
        queue,
        start,
        restart,
        finish,
        sendMessage,
        sendAction
    } = useSession();

    const responsesLength = responses?.length;
    const reference = useRef<HTMLDivElement>();
    const anchor = useRef<HTMLDivElement>();
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

    const scrollToBottom = useCallback((options?: ScrollIntoViewOptions) => {
        if (anchor.current) {
            anchor.current.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
                ...options
            });
        }
    }, []);

    const handleAction = useCallback(
        async (link: BoostResponseElementLinksItem) => {
            await (link?.text === englishButtonText
                ? sendMessage!(englishButtonResponse)
                : sendAction!(link.id));

            scrollToBottom();
        },
        [sendMessage, sendAction, scrollToBottom]
    );

    const handleSubmit = useCallback(
        (message: string) => {
            void sendMessage!(message);
        },
        [sendMessage]
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
    }, [isFinishing, isEvaluating, responsesLength, finish, handleClose]);

    function handleCancelFinish() {
        setIsFinishing(false);
    }

    useEffect(() => {
        if (isOpen && (status === 'disconnected' || status === 'ended')) {
            void start!();
            setUnreadCount(0);
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
        if (!isOpen && updateCount > 1) {
            setUnreadCount((number) => number + 1);
        }
    }, [isOpen, updateCount]);

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

    const isConsideredOpen = isOpen || isOpening;
    const isModalOpen = isFinishing || isEvaluating;

    return (
        <div id='nav-chatbot'>
            <OpenButton
                {...{isOpen, isOpening, unreadCount}}
                onClick={handleOpen}
            />

            {isConsideredOpen && (
                <ContainerElement
                    ref={reference as any}
                    lang={language}
                    {...{isFullscreen, isClosing, isOpening}}
                >
                    <Header
                        {...{isFullscreen}}
                        isObscured={isModalOpen}
                        onClose={handleClose}
                        onToggleFullscreen={toggleFullscreen}
                        onFinish={handleFinish}
                    />

                    <ConversationElement>
                        <PaddingElement>
                            {(status === 'connecting' ||
                                status === 'restarting') && <FillerElement />}

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
                                <GroupElement>
                                    <Message isThinking>
                                        <TypingIndicator />
                                    </Message>
                                </GroupElement>
                            )}

                            {queue && <Response response={queue} />}

                            <StatusContainerElement>
                                <StatusElement>
                                    <StatusStrip />
                                </StatusElement>
                            </StatusContainerElement>

                            <AnchorElement ref={anchor as any} />
                        </PaddingElement>
                    </ConversationElement>

                    <Form
                        isObscured={isModalOpen}
                        onSubmit={handleSubmit}
                        onRestart={handleRestart}
                    />

                    <FinishModal
                        isOpen={isFinishing && !isEvaluating}
                        onConfirm={handleFinish}
                        onCancel={handleCancelFinish}
                    />

                    <EvaluationModal
                        isOpen={isEvaluating}
                        onFeedback={analyticsCallback}
                        onConfirm={handleFinish}
                    />
                </ContainerElement>
            )}
        </div>
    );
};

interface ChatbotProperties extends ChatProperties {
    boostApiUrlBase?: string;
}

const Chatbot = ({boostApiUrlBase, ...properties}: ChatbotProperties) => (
    <LanguageProvider>
        <SessionProvider {...{boostApiUrlBase}}>
            <Chat {...properties} />
        </SessionProvider>
    </LanguageProvider>
);

export {ChatbotProperties};
export default Chatbot;
