import React, {useState} from 'react';
import styled from 'styled-components';
import {Textarea, RadioGruppe, Radio} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import useSession from '../contexts/session';
import Modal, {ModalProperties, ModalTitle, ModalText} from './modal';

const EvaluationModalActions = styled.div`
    margin-top: 20px;
    display: flex;
`;

const EvaluationModalSpacer = styled.div`
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
                    <ModalTitle>Chatten er avsluttet.</ModalTitle>
                    <ModalText>
                        Hvis du har tid, ønsker vi gjerne å lære av opplevelsen
                        din.
                    </ModalText>

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

                    <EvaluationModalActions>
                        <EvaluationModalSpacer />
                        <Knapp kompakt mini htmlType='submit'>
                            Send inn
                        </Knapp>
                    </EvaluationModalActions>
                </form>
            )}
        </Modal>
    );
};

export default EvaluationModal;
