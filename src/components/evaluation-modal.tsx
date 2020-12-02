import React, {useState, useMemo} from 'react';
import styled from 'styled-components';
import {Textarea, RadioGruppe, Radio} from 'nav-frontend-skjema';
import {Knapp} from 'nav-frontend-knapper';
import useLanguage from '../contexts/language';
import useSession from '../contexts/session';
import Modal, {
    ModalProperties,
    BoxElement,
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

const translations = {
    chat_evaluation: {
        en: 'Chat evaluation',
        no: 'Evaluering av chat'
    },
    chat_has_ended: {
        en: 'The chat has ended.',
        no: 'Chatten er avsluttet.'
    },
    consider_evaluating: {
        en: 'If you have time, please consider evaluating your experience.',
        no: 'Hvis du har tid, ønsker vi gjerne å lære av opplevelsen din.'
    },
    your_rating: {
        en: 'Were your questions answered?',
        no: 'Fikk du svar på det du lurte på?'
    },
    your_feedback: {
        en: 'Your feedback',
        no: 'Din tilbakemelding'
    },
    yes: {
        en: 'Yes',
        no: 'Ja'
    },
    no: {
        en: 'No',
        no: 'Nei'
    },
    submit: {
        en: 'Submit',
        no: 'Send inn'
    }
};

const EvaluationModal = ({
    isOpen,
    onConfirm,
    ...properties
}: ModalProperties) => {
    const {translate} = useLanguage();
    const {sendFeedback} = useSession();
    const [rating, setRating] = useState<string>();
    const [message, setMessage] = useState<string>('');
    const localizations = useMemo(() => translate(translations), [translate]);

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
            aria-label={localizations.chat_evaluation}
            {...{isOpen, onConfirm}}
            {...properties}
        >
            {isOpen && (
                <BoxElement>
                    <form onSubmit={handleSubmit}>
                        <TitleElement>
                            {localizations.chat_has_ended}
                        </TitleElement>
                        <TextElement>
                            {localizations.consider_evaluating}
                        </TextElement>

                        <RadioGruppe legend={localizations.your_rating}>
                            <Radio
                                readOnly
                                label={localizations.yes}
                                name='yes'
                                value='1'
                                checked={rating === '1'}
                                onClick={handleRatingClick}
                            />
                            <Radio
                                readOnly
                                label={localizations.no}
                                name='no'
                                value='0'
                                checked={rating === '0'}
                                onClick={handleRatingClick}
                            />
                        </RadioGruppe>

                        <Textarea
                            value={message}
                            label={localizations.your_feedback}
                            tellerTekst={(count, maxCount) =>
                                `${count}/${maxCount}`
                            }
                            onChange={handleMessageChange}
                        />

                        <ActionsElement>
                            <ActionsSpacerElement />
                            <Knapp kompakt mini htmlType='submit'>
                                {localizations.submit}
                            </Knapp>
                        </ActionsElement>
                    </form>
                </BoxElement>
            )}
        </Modal>
    );
};

export default EvaluationModal;
