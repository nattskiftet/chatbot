import React, {useState} from 'react';
import styled from 'styled-components';
import {Textarea, RadioGruppe, Radio} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import useSession from '../contexts/session';

import Modal, {
    ModalProperties,
    TitleElement,
    TextElement
} from './modal';

const ActionsElement = styled.div`
    margin-top: 20px;
    display: flex;
`;

const ActionsSpacerElement = styled.div`
    flex: 1;
`;

const EvaluationModal = ({
    isOpen,
    onConfirm,
    ...properties
}: ModalProperties) => {
    const {sendFeedback} = useSession();
    const [rating, setRating] = useState<string>();
    const [message, setMessage] = useState<string>('');

    function handleRatingClick(event: React.MouseEvent) {
        const target = event.target as HTMLInputElement;

        if (target.checked) {
            setRating(target.value);
        }
    }

    function handleMessageChange(
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) {
        setMessage(event.target.value);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (rating) {
            void sendFeedback!(Number.parseInt(rating, 10), message);
        }

        onConfirm!();
    }

    return (
        <Modal
            aria-label='Evaluering av chat'
            {...{isOpen, onConfirm}}
            {...properties}
        >
            {isOpen && (
                <form onSubmit={handleSubmit}>
                    <TitleElement>Chatten er avsluttet.</TitleElement>
                    <TextElement>
                        Hvis du har tid, ønsker vi gjerne å lære av opplevelsen
                        din.
                    </TextElement>

                    <RadioGruppe legend='Fikk du svar på det du lurte på?'>
                        <Radio
                            readOnly
                            label='Ja'
                            name='yes'
                            value='1'
                            checked={rating === '1'}
                            onClick={handleRatingClick}
                        />
                        <Radio
                            readOnly
                            label='Nei'
                            name='no'
                            value='0'
                            checked={rating === '0'}
                            onClick={handleRatingClick}
                        />
                    </RadioGruppe>

                    <Textarea
                        value={message}
                        label='Din tilbakemelding'
                        onChange={handleMessageChange}
                    />

                    <ActionsElement>
                        <ActionsSpacerElement />
                        <Knapp kompakt mini htmlType='submit'>
                            Send inn
                        </Knapp>
                    </ActionsElement>
                </form>
            )}
        </Modal>
    );
};

export default EvaluationModal;
