import React from 'react';
import styled from 'styled-components';
import {Normaltekst} from 'nav-frontend-typografi';

const avatarSize = '36px';
const conversationSideWidth = '90%';

const ConversationGroup = styled.div`
    margin-top: 10px;

    &:first-child {
        margin-top: 0;
    }
`;

const ConversationElementContainer = styled.div`
    width: 100%;
    display: flex;
`;

const ConversationElementAvatar = styled.div`
    background-color: #d8d8d8;
    width: ${avatarSize};
    height: ${avatarSize};
    margin-right: 8px;
    border-radius: 30px;
    position: relative;
    top: 1px;
    overflow: hidden;
    visibility: hidden;

    ${ConversationGroup} ${ConversationElementContainer}:first-child & {
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

    ${ConversationGroup} ${ConversationElementContainer}:first-child & {
        margin-top: 0;
        border-radius: 18px 18px 18px 4px;
    }

    ${ConversationGroup} ${ConversationElementContainer}:last-child & {
        border-radius: 4px 18px 18px 18px;
    }

    ${ConversationGroup} ${ConversationElementContainer}:first-child:last-child & {
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

interface ConversationElementProperties {
    avatarUrl?: string;
    alignment?: 'left' | 'right';
    isThinking?: boolean;
    tabIndex?: number;
    children?: React.ReactNode;
}

const ConversationElement = ({
    avatarUrl,
    alignment,
    isThinking,
    tabIndex,
    children
}: ConversationElementProperties) => {
    const Bubble =
        alignment === 'right'
            ? ConversationBubbleRight
            : ConversationBubbleLeft;

    return (
        <ConversationElementContainer>
            <ConversationElementAvatar>
                {avatarUrl && <img src={avatarUrl} alt='NAV' />}
            </ConversationElementAvatar>

            <Bubble
                {...{isThinking}}
                tabIndex={isThinking ? undefined : tabIndex ?? 0}
            >
                <ConversationBubbleText>{children}</ConversationBubbleText>
            </Bubble>
        </ConversationElementContainer>
    );
};

export {
    avatarSize,
    conversationSideWidth,
    ConversationGroup,
    ConversationElementContainer,
    ConversationElementAvatar
};

export default ConversationElement;
