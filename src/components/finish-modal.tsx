import React, {useCallback, useMemo} from 'react';
import styled from 'styled-components';
import {Knapp} from 'nav-frontend-knapper';
import downloadIcon from '../assets/file-download.svg';
import useLanguage from '../contexts/language';
import Modal, {
    ModalProperties,
    BoxElement,
    TextElement,
    ActionsElement
} from './modal';
import useSession from '../contexts/session';

const ContainerElement = styled.div`
    margin: auto;
`;

const ButtonElement = styled(Knapp)`
    margin-left: 5px;
`;

const SecondaryActions = styled.div`
    text-align: center;
    margin: auto;
    margin-top: 30px;
`;

const DownloadElement = styled.span`
    margin-right: 7px;
    position: relative;
    bottom: -3px;
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
    },
    download_conversation: {
        en: 'Download conversation',
        no: 'Last ned samtalen'
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
    const {download} = useSession();
    const localizations = useMemo(() => translate(translations), [translate]);

    const handleDownload = useCallback(() => {
        void download!();
    }, [download]);

    return (
        <Modal
            aria-label={localizations.confirm_chat_termination}
            {...{isOpen, onConfirm}}
            {...properties}
        >
            <ContainerElement>
                <BoxElement>
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
                </BoxElement>

                <SecondaryActions>
                    <ButtonElement
                        kompakt
                        tabIndex={isOpen ? undefined : -1}
                        htmlType='button'
                        aria-label={localizations.download_conversation}
                        onClick={handleDownload}
                    >
                        <DownloadElement
                            dangerouslySetInnerHTML={{__html: downloadIcon}}
                        />
                        <span>{localizations.download_conversation}</span>
                    </ButtonElement>
                </SecondaryActions>
            </ContainerElement>
        </Modal>
    );
};

export default FinishModal;
