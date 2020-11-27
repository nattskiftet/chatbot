import React, {useMemo} from 'react';
import styled from 'styled-components';
import {Knapp} from 'nav-frontend-knapper';
import useLanguage from '../contexts/language';
import Modal, {ModalProperties, TextElement, ActionsElement} from './modal';

const ButtonElement = styled(Knapp)`
    margin-left: 5px;
`;

const translations = {
    confirm_chat_termination: {
        en: 'Confirm chat termination',
        no: 'Bekreft avslutning av chat'
    },
    are_you_sure_you_want_to_end: {
        en: 'Are you sure you want to end this conversation?',
        no: 'Er du sikker på at du vil avslutte samtalen?'
    },
    cancel_termination: {
        en: 'Cancel termination',
        no: 'Avbryt avslutning'
    },
    cancel: {
        en: 'Cancel',
        no: 'Avbryt'
    },
    yes_end_conversation: {
        en: 'Yes, end conversation',
        no: 'Ja, avslutt'
    }
};

interface FinishModalProperties extends ModalProperties {
    onCancel?: () => void;
}

const FinishModal = ({
    isOpen,
    onConfirm,
    onCancel,
    ...properties
}: FinishModalProperties) => {
    const {translate} = useLanguage();
    const localizations = useMemo(() => translate(translations), [translate]);

    return (
        <Modal
            aria-label={localizations.confirm_chat_termination}
            {...{isOpen, onConfirm}}
            {...properties}
        >
            <TextElement>
                {localizations.are_you_sure_you_want_to_end}
            </TextElement>

            <ActionsElement>
                <ButtonElement
                    mini
                    kompakt
                    tabIndex={isOpen ? undefined : -1}
                    htmlType='button'
                    type='flat'
                    aria-label={localizations.cancel_termination}
                    onClick={onCancel}
                >
                    {localizations.cancel}
                </ButtonElement>

                <ButtonElement
                    mini
                    kompakt
                    tabIndex={isOpen ? undefined : -1}
                    htmlType='button'
                    type='hoved'
                    aria-label={localizations.confirm_chat_termination}
                    onClick={onConfirm}
                >
                    {localizations.yes_end_conversation}
                </ButtonElement>
            </ActionsElement>
        </Modal>
    );
};

export default FinishModal;
