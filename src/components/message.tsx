import React, {useMemo} from 'react';
import styled, {css} from 'styled-components';
import {Normaltekst} from 'nav-frontend-typografi';
import useLanguage from '../contexts/language';

const avatarSize = '36px';
const conversationSideWidth = '90%';

const GroupElement = styled.div`
    margin-top: 10px;

    &:first-child {
        margin-top: 0;
    }
`;

const ContainerElement = styled.div`
    width: 100%;
    display: flex;
`;

const AvatarElement = styled.div`
    background-color: #d8d8d8;
    width: ${avatarSize};
    height: ${avatarSize};
    margin-right: 8px;
    border-radius: 30px;
    position: relative;
    top: 1px;
    overflow: hidden;
    visibility: hidden;

    ${GroupElement} ${ContainerElement}:first-child & {
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

interface MessageBubbleProperties {
    isThinking?: boolean;
}

const MessageBubble = styled.div`
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

    &:focus {
        outline: none;
        box-shadow: 0 0 0 3px #005b82;
    }

    ${(properties: MessageBubbleProperties) =>
        properties.isThinking &&
        css`
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
        `};
`;

const BubbleLeftElement = styled(MessageBubble)`
    margin-top: 3px;
    margin-left: 0;
    border-radius: 4px 18px 18px 4px;

    ${GroupElement} ${ContainerElement}:first-child & {
        margin-top: 0;
        border-radius: 18px 18px 18px 4px;
    }

    ${GroupElement} ${ContainerElement}:last-child & {
        border-radius: 4px 18px 18px 18px;
    }

    ${GroupElement} ${ContainerElement}:first-child:last-child & {
        border-radius: 18px 18px 18px 18px;
    }
`;

const BubbleRightElement = styled(MessageBubble)`
    background-color: #e0f5fb;
    margin-top: 3px;
    margin-right: 0;
    border-radius: 18px 18px 18px 18px;
`;

const TextElement = styled(Normaltekst)``;

const translations = {
    you_say: {
        en: 'You say',
        no: 'Du sier'
    },
    nav_says: {
        en: 'NAV says',
        no: 'NAV sier'
    }
};

interface MessageProperties {
    avatarUrl?: string;
    alignment?: 'left' | 'right';
    isThinking?: boolean;
    tabIndex?: number;
    children?: React.ReactNode;
}

const Message = ({
    avatarUrl,
    alignment,
    isThinking,
    tabIndex,
    children,
    ...properties
}: MessageProperties) => {
    const {translate} = useLanguage();
    const localizations = useMemo(() => translate(translations), [translate]);
    const BubbleElement =
        alignment === 'right' ? BubbleRightElement : BubbleLeftElement;
    const label =
        alignment === 'right'
            ? `${localizations.you_say}:`
            : `${localizations.nav_says}:`;

    return (
        <ContainerElement {...properties}>
            <AvatarElement aria-label={label}>
                {avatarUrl && <img src={avatarUrl} alt='' />}
            </AvatarElement>

            <BubbleElement
                {...{isThinking}}
                tabIndex={isThinking ? undefined : tabIndex ?? 0}
            >
                <TextElement>{children}</TextElement>
            </BubbleElement>
        </ContainerElement>
    );
};

export {
    avatarSize,
    conversationSideWidth,
    GroupElement,
    ContainerElement,
    AvatarElement
};

export default Message;
