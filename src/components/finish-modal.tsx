import React from 'react';
import styled from 'styled-components';
import {Knapp} from 'nav-frontend-knapper';

import Modal, {ModalProperties, TextElement, ActionsElement} from './modal';

const ButtonElement = styled(Knapp)`
    margin-left: 5px;
`;

interface FinishModalProperties extends ModalProperties {
    onCancel?: () => void;
}

const FinishModal = ({
    isOpen,
    onConfirm,
    onCancel,
    ...properties
}: FinishModalProperties) => (
    <Modal
        aria-label='Bekreft avslutning av chat'
        {...{isOpen, onConfirm}}
        {...properties}
    >
        <TextElement>Er du sikker på at du vil avslutte samtalen?</TextElement>

        <ActionsElement>
            <ButtonElement
                mini
                kompakt
                tabIndex={isOpen ? undefined : -1}
                htmlType='button'
                type='flat'
                aria-label='Avbryt avslutning'
                onClick={onCancel}
            >
                Avbryt
            </ButtonElement>

            <ButtonElement
                mini
                kompakt
                tabIndex={isOpen ? undefined : -1}
                htmlType='button'
                type='hoved'
                aria-label='Bekreft avslutning av chat'
                onClick={onConfirm}
            >
                Ja, avslutt
            </ButtonElement>
        </ActionsElement>
    </Modal>
);

export default FinishModal;
