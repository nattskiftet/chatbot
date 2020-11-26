import React, {useCallback} from 'react';

import {BoostConversation, BoostResponse} from '../contexts/session';
import Obscured from './obscurer';
import TypingIndicator from './typing-indicator';
import ResponseElement, {ResponseElementProperties} from './response-element';
import Message, {GroupElement} from './message';

import {
    botResponseRevealDelay,
    botResponseRevealDelayBuffer
} from '../configuration';

const BotTypingIndicator = (properties: {response?: BoostResponse}) => (
    <Message isThinking avatarUrl={properties.response?.avatar_url}>
        <TypingIndicator />
    </Message>
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
            <GroupElement lang={response.language}>
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
            </GroupElement>
        </Obscured>
    );
};

export {ResponseProperties};
export default Response;
