import React, {useMemo} from 'react';
import styled from 'styled-components';
import {LenkepanelBase} from 'nav-frontend-lenkepanel';
import {Ingress, Normaltekst, Undertekst} from 'nav-frontend-typografi';
import idPortenIcon from '../assets/id-porten.svg';
import {BoostResponse, BoostResponseElement} from '../contexts/session';
import Spinner from './spinner';
import Conversation, {GroupElement} from './message';
import ResponseLink, {ResponseLinkProperties} from './response-link';
import {authenticationPrefix} from '../configuration';

const ContentsElement = styled.span`
    p {
        margin: 0;
        padding: 0;
    }
`;

const SubtextElement = styled(Undertekst)`
    text-align: right;
    color: #444;
`;

const LinkPanelElement = styled(LenkepanelBase)`
    margin-top: 15px;
    margin-bottom: 15px;

    ${GroupElement}:nth-last-child(3) & {
        margin-bottom: 0;
    }
`;

const LinkPanelIconElement = styled.div`
    background: #d0d2cf;
    width: 36px;
    height: 36px;
    margin-left: 5px;
    fill: #2d3033;
    border-radius: 2px;
`;

const LinkPanelTextElement = styled.div`
    margin-left: 20px;
    flex: 1;
`;

interface ResponseItemProperties extends Omit<ResponseLinkProperties, 'link'> {
    responseIndex?: number;
    element: BoostResponseElement;
    responses?: BoostResponse[];
    responsesLength?: number;
    isObscured?: boolean;
}

const ResponseItem = ({
    response,
    responseIndex,
    element,
    responses,
    responsesLength,
    isObscured,
    ...properties
}: ResponseItemProperties) => {
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
        const {text} = element.payload;

        if (response.source === 'local') {
            return (
                <div style={{opacity: 0.7}}>
                    <Conversation
                        tabIndex={isObscured ? -1 : 0}
                        alignment='right'
                    >
                        {text}
                    </Conversation>

                    <SubtextElement>
                        Sender... <Spinner />
                    </SubtextElement>
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
                        {text}
                    </Conversation>

                    {displaySentIndicator && (
                        <SubtextElement>Sendt</SubtextElement>
                    )}
                </>
            );
        }

        return (
            <Conversation
                tabIndex={isObscured ? -1 : 0}
                avatarUrl={response.avatar_url}
            >
                {text}
            </Conversation>
        );
    }

    if (element.type === 'html') {
        const html = String(element.payload.html);

        if (html.startsWith(authenticationPrefix)) {
            const [, authenticationUrl] = html.split(authenticationPrefix);

            return (
                <LinkPanelElement
                    border
                    href={authenticationUrl}
                    tabIndex={isObscured ? -1 : 0}
                    target='_blank'
                >
                    <LinkPanelIconElement
                        dangerouslySetInnerHTML={{
                            __html: idPortenIcon
                        }}
                    />

                    <LinkPanelTextElement>
                        <Ingress>Elektronisk autentisering</Ingress>
                        <Normaltekst>
                            Vennligst logg inn så vi kan hjelpe deg.
                        </Normaltekst>
                    </LinkPanelTextElement>
                </LinkPanelElement>
            );
        }

        return (
            <Conversation
                tabIndex={isObscured ? -1 : 0}
                avatarUrl={response.avatar_url}
            >
                <ContentsElement dangerouslySetInnerHTML={{__html: html}} />
            </Conversation>
        );
    }

    if (element.type === 'links') {
        return (
            <>
                {element.payload.links.map((link, index) => (
                    <ResponseLink
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

export {ResponseItemProperties};
export default ResponseItem;
