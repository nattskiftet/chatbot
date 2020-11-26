import React, {useMemo} from 'react';
import styled from 'styled-components';
import {LenkepanelBase} from 'nav-frontend-lenkepanel';

import {Ingress, Normaltekst, Undertekst} from 'nav-frontend-typografi';

import idPortenIcon from '../assets/id-porten.svg';
import {BoostResponse, BoostResponseElement} from '../contexts/session';
import Spinner from './spinner';
import Conversation, {GroupElement} from './message';

import ResponseElementLink, {
    ResponseElementLinkProperties
} from './response-link';

import {authenticationPrefix} from '../configuration';

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

const LinkPanel = styled(LenkepanelBase)`
    margin-top: 15px;
    margin-bottom: 15px;

    ${GroupElement}:nth-last-child(3) & {
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

interface ResponseElementProperties
    extends Omit<ResponseElementLinkProperties, 'link'> {
    responseIndex?: number;
    element: BoostResponseElement;
    responses?: BoostResponse[];
    responsesLength?: number;
    isObscured?: boolean;
}

const ResponseElement = ({
    response,
    responseIndex,
    element,
    responses,
    responsesLength,
    isObscured,
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
                    <Conversation
                        tabIndex={isObscured ? -1 : 0}
                        alignment='right'
                    >
                        {element.payload.text}
                    </Conversation>

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
                    <Conversation
                        tabIndex={isObscured ? -1 : 0}
                        alignment='right'
                    >
                        {element.payload.text}
                    </Conversation>

                    {displaySentIndicator && (
                        <ConversationBubbleSubtext>
                            Sendt
                        </ConversationBubbleSubtext>
                    )}
                </>
            );
        }

        return (
            <Conversation
                tabIndex={isObscured ? -1 : 0}
                avatarUrl={response.avatar_url}
            >
                {element.payload.text}
            </Conversation>
        );
    }

    if (element.type === 'html') {
        const html = String(element.payload.html);

        if (html.startsWith(authenticationPrefix)) {
            const [, authenticationUrl] = html.split(authenticationPrefix);

            return (
                <LinkPanel
                    border
                    href={authenticationUrl}
                    tabIndex={isObscured ? -1 : 0}
                    target='_blank'
                >
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
            <Conversation
                tabIndex={isObscured ? -1 : 0}
                avatarUrl={response.avatar_url}
            >
                <ConversationBubbleContents
                    dangerouslySetInnerHTML={{__html: html}}
                />
            </Conversation>
        );
    }

    if (element.type === 'links') {
        return (
            <>
                {element.payload.links.map((link, index) => (
                    <ResponseElementLink
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        tabIndex={isObscured ? -1 : 0}
                        {...properties}
                        {...{response, link}}
                    />
                ))}
            </>
        );
    }

    return null;
};

export {ResponseElementProperties};
export default ResponseElement;
