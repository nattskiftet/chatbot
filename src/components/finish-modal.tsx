import React from 'react';
import styled from 'styled-components';
import {Knapp} from 'nav-frontend-knapper';
import Modal, {ModalProperties, ModalText, ModalActions} from './modal';

const ModalButton = styled(Knapp)`
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
        <ModalText>Er du sikker på at du vil avslutte samtalen?</ModalText>

        <ModalActions>
            <ModalButton
                mini
                kompakt
                tabIndex={isOpen ? undefined : -1}
                htmlType='button'
                type='flat'
                aria-label='Avbryt avslutning'
                onClick={onCancel}
            >
                Avbryt
            </ModalButton>

            <ModalButton
                mini
                kompakt
                tabIndex={isOpen ? undefined : -1}
                htmlType='button'
                type='hoved'
                aria-label='Bekreft avslutning av chat'
                onClick={onConfirm}
            >
                Ja, avslutt
            </ModalButton>
        </ModalActions>
    </Modal>
);

export default FinishModal;
