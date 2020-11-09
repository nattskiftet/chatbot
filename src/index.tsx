import React, {useRef, useState, useMemo, useEffect, useCallback} from 'react';

import styled from 'styled-components';
import cookies from 'js-cookie';

import {
    Innholdstittel,
    Ingress,
    Normaltekst,
    Undertekst
} from 'nav-frontend-typografi';

import {Textarea, RadioPanelGruppe} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import {LenkepanelBase} from 'nav-frontend-lenkepanel';

import finishIcon from './assets/finish.svg';
import minimizeIcon from './assets/minimize.svg';
import fullscreenIcon from './assets/maximize.svg';
import contractIcon from './assets/contract.svg';
import idPortenIcon from './assets/id-porten.svg';

import delay from './utilities/delay';

import {LanguageProvider} from './contexts/language';

import useSession, {
    BoostConversation,
    BoostResponse,
    BoostResponseElement,
    BoostResponseElementLinksItem,
    Session,
    SessionProvider
} from './contexts/session';

import useLoader from './hooks/use-loader';
import useDebouncedEffect from './hooks/use-debounced-effect';

import TypingIndicator from './components/typing-indicator';
import Obscured from './components/obscurer';
import OpenButton from './components/open-button';
import Spinner, {SpinnerContainer} from './components/spinner';
import StatusStrip from './components/status-strip';

import ConversationElement, {
    avatarSize,
    conversationSideWidth,
    ConversationGroup,
    ConversationElementContainer,
    ConversationElementAvatar
} from './components/conversation';

import {
    containerWidth,
    containerHeight,
    fullscreenMediaQuery,
    botResponseRevealDelay,
    botResponseRevealDelayBuffer,
    linkDisableTimeout,
    cookieDomain,
    openCookieName,
    unreadCookieName
} from './configuration';

interface ResponseElementLinkProperties {
    response: BoostResponse;
    link: BoostResponseElementLinksItem;
    onAction?: Session['sendAction'];
}

const ResponseElementLink = ({
    response,
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
            <ConversationElement avatarUrl={response.avatar_url}>
                <a href={link.url}>{link.text}</a>
            </ConversationElement>
        );
    }

    return (
        <ConversationElementContainer onKeyPress={handleKeyPress}>
            <ConversationElementAvatar />
            <ConversationButton
                name={link.text}
                radios={[
                    {
                        id: link.text,
                        value: link.text,
                        label: (
                            <>
                                {isLoading && <Spinner />}
                                {link.text}
                            </>
                        )
                    }
                ]}
                checked={isSelected || isLoading ? link.text : undefined}
                onChange={handleAction}
            />
        </ConversationElementContainer>
    );
};

interface ResponseElementProperties
    extends Omit<ResponseElementLinkProperties, 'link'> {
    responseIndex?: number;
    element: BoostResponseElement;
    responses?: BoostResponse[];
    responsesLength?: number;
}

const ResponseElement = ({
    response,
    responseIndex,
    element,
    responses,
    responsesLength,
    ...properties
}: ResponseElementProperties) => {
    const mostRecentClientMessageIndex = useMemo(
        () =>
            (responsesLength ?? 0) -
            (responses
                ?.slice()
                .reverse()
                .findIndex((response) => response.source === 'client') ?? 0) -
            1,
        [responses, responsesLength]
    );

    if (element.type === 'text') {
        if (response.source === 'local') {
            return (
                <div style={{opacity: 0.7}}>
                    <ConversationElement alignment='right'>
                        {element.payload.text}
                    </ConversationElement>

                    <ConversationBubbleSubtext>
                        Sender... <Spinner />
                    </ConversationBubbleSubtext>
                </div>
            );
        }

        if (response.source === 'client') {
            const displaySentIndicator = Boolean(
                mostRecentClientMessageIndex === undefined ||
                    responseIndex === mostRecentClientMessageIndex
            );

            return (
                <>
                    <ConversationElement alignment='right'>
                        {element.payload.text}
                    </ConversationElement>

                    {displaySentIndicator && (
                        <ConversationBubbleSubtext>
                            Sendt
                        </ConversationBubbleSubtext>
                    )}
                </>
            );
        }

        return (
            <ConversationElement avatarUrl={response.avatar_url}>
                {element.payload.text}
            </ConversationElement>
        );
    }

    if (element.type === 'html') {
        if (String(element.payload.html).startsWith('Init:Auth:')) {
            const [, authenticationUrl] = element.payload.html.split(
                'Init:Auth:'
            );

            return (
                <LinkPanel border href={authenticationUrl} target='_blank'>
                    <LinkPanelIcon
                        dangerouslySetInnerHTML={{
                            __html: idPortenIcon
                        }}
                    />

                    <LinkPanelText>
                        <Ingress>Elektronisk autentisering</Ingress>
                        <Normaltekst>
                            Vennligst logg inn så vi kan hjelpe deg.
                        </Normaltekst>
                    </LinkPanelText>
                </LinkPanel>
            );
        }

        return (
            <ConversationElement avatarUrl={response.avatar_url}>
                <ConversationBubbleContents
                    dangerouslySetInnerHTML={{
                        __html: String(element.payload.html)
                    }}
                />
            </ConversationElement>
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
    <ConversationElement isThinking avatarUrl={properties.response?.avatar_url}>
        <TypingIndicator />
    </ConversationElement>
);

interface ResponseProperties
    extends Omit<ResponseElementProperties, 'element'> {
    conversation?: BoostConversation;
    onReveal?: () => void;
}

const Response = ({
    conversation,
    response,
    responseIndex,
    responsesLength,
    onReveal,
    ...properties
}: ResponseProperties) => {
    const isHuman = conversation?.state.chat_status === 'assigned_to_human';
    const responseDate = new Date(response.date_created);
    const responseTimestamp = responseDate.getTime();
    let typingRevealTimestamp = 0;
    let revealTimestamp = 0;

    const shouldObscure =
        !isHuman &&
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
                                        {...{
                                            conversation,
                                            response,
                                            responseIndex,
                                            responsesLength,
                                            element
                                        }}
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

const ConversationBubbleContents = styled.span`
    p {
        margin: 0;
        padding: 0;
    }
`;

const ConversationFiller = styled.div`
    min-height: ${containerHeight};
`;

const ConversationBubbleSubtext = styled(Undertekst)`
    text-align: right;
    color: #444;
`;

const ConversationButton = styled(RadioPanelGruppe)`
    max-width: ${conversationSideWidth};
    max-width: calc(${conversationSideWidth} - ${avatarSize} - 8px);
    margin-top: 3px;
    position: relative;

    ${SpinnerContainer} {
        transform: translate(0.5px, 0.5px);
        position: absolute;
        top: 19px;
        left: 19px;

        svg circle {
            stroke: rgba(255, 255, 255, 0.1);
        }

        svg circle:last-child {
            stroke: rgba(255, 255, 255, 1);
        }
    }
`;

const LinkPanel = styled(LenkepanelBase)`
    margin-top: 15px;
    margin-bottom: 15px;

    ${ConversationGroup}:nth-last-child(3) & {
        margin-bottom: 0;
    }
`;

const LinkPanelIcon = styled.div`
    background: #d0d2cf;
    width: 36px;
    height: 36px;
    margin-left: 5px;
    fill: #2d3033;
    border-radius: 2px;
`;

const LinkPanelText = styled.div`
    margin-left: 20px;
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

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(event.target.value);
        },
        []
    );

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
    }, [scrollToBottom, status, queue]);

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
    const isHuman = conversationStatus === 'assigned_to_human';

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
