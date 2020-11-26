import React, {useCallback, useState} from 'react';
import styled from 'styled-components';
import {Textarea} from 'nav-frontend-skjema';
import {Knapp as Button} from 'nav-frontend-knapper';
import useDebouncedEffect from '../hooks/use-debounced-effect';
import useSession from '../contexts/session';

const FormElement = styled.form`
    background: #f4f4f4;
    border-top: 1px solid #78706a;
    box-shadow: inset 0 1px 0 #fff;
`;

const PaddingElement = styled.div`
    padding: 14px 12px;
    box-sizing: border-box;
`;

const ActionsElement = styled.div`
    margin-top: 10px;
    display: flex;
    flex-direction: row-reverse;
`;

const RestartButtonElement = styled(Button)`
    padding: 0 15px;
    margin-right: 10px;
`;

interface FormProperties {
    isObscured?: boolean;
    onSubmit?: (message: string) => void;
    onRestart?: () => void;
}

const Form = ({isObscured, onSubmit, onRestart}: FormProperties) => {
    const {id, conversation, sendPing} = useSession();
    const [message, setMessage] = useState<string>('');
    const conversationStatus = conversation?.state.chat_status;
    const messageMaxCharacters = conversation?.state.max_input_chars ?? 110;

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value);
    }

    const handleSubmit = useCallback(
        (event?: React.FormEvent<HTMLFormElement>) => {
            event?.preventDefault();

            if (message) {
                if (message.length < messageMaxCharacters) {
                    setMessage('');
                    void onSubmit!(message);
                }
            }
        },
        [message, messageMaxCharacters, onSubmit]
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

    useDebouncedEffect(
        2000,
        () => {
            if (id && message) {
                void sendPing!();
            }
        },
        [message]
    );

    return (
        <FormElement onSubmit={handleSubmit}>
            <PaddingElement>
                <Textarea
                    aria-label='Din melding'
                    name='message'
                    value={message}
                    maxLength={messageMaxCharacters}
                    tabIndex={isObscured ? -1 : undefined}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />

                <ActionsElement>
                    <Button
                        aria-label='Send melding'
                        htmlType='submit'
                        tabIndex={isObscured ? -1 : undefined}
                    >
                        Send
                    </Button>

                    {conversationStatus === 'virtual_agent' && (
                        <RestartButtonElement
                            mini
                            aria-label='Start chat på nytt'
                            htmlType='button'
                            type='flat'
                            tabIndex={isObscured ? -1 : undefined}
                            onClick={onRestart}
                        >
                            Start på nytt
                        </RestartButtonElement>
                    )}
                </ActionsElement>
            </PaddingElement>
        </FormElement>
    );
};

export default Form;
