import React, {useState, useEffect, useCallback} from 'react';
import styled from 'styled-components';
import {RadioPanelGruppe} from 'nav-frontend-skjema';
import useLoader from '../hooks/use-loader';

import {
    Session,
    BoostResponse,
    BoostResponseElementLinksItem
} from '../contexts/session';

import Message, {
    avatarSize,
    conversationSideWidth,
    ContainerElement,
    AvatarElement
} from './message';

import {linkDisableTimeout} from '../configuration';
import Spinner, {SpinnerElement} from './spinner';

const LinkButtonElement = styled(RadioPanelGruppe)`
    max-width: ${conversationSideWidth};
    max-width: calc(${conversationSideWidth} - ${avatarSize} - 8px);
    margin-top: 3px;
    position: relative;

    ${SpinnerElement} {
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

interface ResponseLinkProperties {
    response: BoostResponse;
    link: BoostResponseElementLinksItem;
    tabIndex?: number;
    onAction?: Session['sendAction'];
}

const ResponseLink = ({
    response,
    link,
    tabIndex,
    onAction
}: ResponseLinkProperties) => {
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
            <Message tabIndex={-1} avatarUrl={response.avatar_url}>
                <a href={link.url} {...{tabIndex}}>
                    {link.text}
                </a>
            </Message>
        );
    }

    return (
        <ContainerElement onKeyPress={handleKeyPress}>
            <AvatarElement />
            <LinkButtonElement
                name={link.text}
                radios={[
                    {
                        id: link.text,
                        value: link.text,
                        disabled: tabIndex === -1,
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
        </ContainerElement>
    );
};

export {ResponseLinkProperties};
export default ResponseLink;
