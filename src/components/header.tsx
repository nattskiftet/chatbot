import React, {useMemo} from 'react';
import styled from 'styled-components';
import {Innholdstittel} from 'nav-frontend-typografi';
import finishIcon from '../assets/finish.svg';
import minimizeIcon from '../assets/minimize.svg';
import fullscreenIcon from '../assets/maximize.svg';
import contractIcon from '../assets/contract.svg';
import useSession from '../contexts/session';
import {fullscreenMediaQuery} from '../configuration';
import useLanguage from '../contexts/language';

const TitleElement = styled(Innholdstittel)``;

interface HeaderElementProperties {
    isHumanChat?: boolean;
}

const HeaderElement = styled.div`
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

    ${(properties: HeaderElementProperties) =>
        properties.isHumanChat
            ? `
                background-color: #C6C2BF;
                box-shadow:
                    inset 0 -1px 0 rgba(255,255,255,0.3),
                    0 1px 4px rgba(0, 0, 0, 0.15),
                    0 2px 5px rgba(0, 0, 0, 0.1);
            `
            : ''}

    &&& ${TitleElement} {
        font-size: 22px;
        line-height: 1em;
        margin: auto;
        margin-left: 0;
        padding-left: 12px;
    }
`;

const HeaderActionsElement = styled.div`
    margin: auto;
    margin-right: 0;
`;

const IconButtonElement = styled.button`
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

const FullscreenIconButtonElement = styled(IconButtonElement)`
    @media ${fullscreenMediaQuery} {
        display: none;
    }
`;

const translations = {
    chat_with_nav: {
        en: 'Chat with NAV',
        no: 'Chat med NAV'
    },
    minimize_chat_window: {
        en: 'Minimize chat window',
        no: 'Minimer chatvindu'
    },
    smaller_chat_window: {
        en: 'Use smaller chat window',
        no: 'Bruk mindre chatvindu'
    },
    open_in_fullscreen: {
        en: 'Open chat in fullscreen',
        no: 'Åpne chat i fullskjerm'
    },
    end_chat: {
        en: 'End chat',
        no: 'Avslutt chat'
    }
};

interface HeaderProperties {
    isFullscreen?: boolean;
    isObscured?: boolean;
    onClose?: () => void;
    onToggleFullscreen?: () => void;
    onFinish?: () => void;
}

const Header = ({
    isFullscreen,
    isObscured,
    onClose,
    onToggleFullscreen,
    onFinish,
    ...properties
}: HeaderProperties) => {
    const {translate} = useLanguage();
    const {conversation} = useSession();
    const localizations = useMemo(() => translate(translations), [translate]);
    const isHumanChat = conversation?.state.chat_status === 'assigned_to_human';

    return (
        <HeaderElement {...{isHumanChat}} {...properties}>
            {isHumanChat ? (
                <TitleElement>{localizations.chat_with_nav}</TitleElement>
            ) : (
                <TitleElement>Chatbot Frida</TitleElement>
            )}

            <HeaderActionsElement>
                <IconButtonElement
                    aria-label={localizations.minimize_chat_window}
                    type='button'
                    tabIndex={isObscured ? -1 : 0}
                    dangerouslySetInnerHTML={{
                        __html: minimizeIcon
                    }}
                    onClick={onClose}
                />

                {isFullscreen ? (
                    <FullscreenIconButtonElement
                        aria-label={localizations.smaller_chat_window}
                        type='button'
                        tabIndex={isObscured ? -1 : 0}
                        dangerouslySetInnerHTML={{
                            __html: contractIcon
                        }}
                        onClick={onToggleFullscreen}
                    />
                ) : (
                    <FullscreenIconButtonElement
                        aria-label={localizations.open_in_fullscreen}
                        type='button'
                        tabIndex={isObscured ? -1 : 0}
                        dangerouslySetInnerHTML={{
                            __html: fullscreenIcon
                        }}
                        onClick={onToggleFullscreen}
                    />
                )}

                <IconButtonElement
                    aria-label={localizations.end_chat}
                    type='button'
                    tabIndex={isObscured ? -1 : 0}
                    dangerouslySetInnerHTML={{
                        __html: finishIcon
                    }}
                    onClick={onFinish}
                />
            </HeaderActionsElement>
        </HeaderElement>
    );
};

export {HeaderProperties};
export default Header;
