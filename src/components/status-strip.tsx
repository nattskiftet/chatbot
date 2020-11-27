import React, {useMemo} from 'react';
import styled from 'styled-components';
import AlertStripe from 'nav-frontend-alertstriper';
import useSession from '../contexts/session';
import Spinner, {SpinnerElement} from './spinner';
import useLanguage from '../contexts/language';

const Element = styled(AlertStripe)`
    backdrop-filter: blur(2px);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

    ${SpinnerElement} {
        position: relative;
        top: -3px;

        svg circle {
            stroke: rgba(0, 0, 0, 0.1);
        }

        svg circle:last-child {
            stroke: rgba(0, 0, 0, 0.5);
        }
    }
`;

const ContentsElement = styled.div`
    display: flex;
`;

const TextElement = styled.span`
    flex: 1;
`;

const translations = {
    connecting: {
        en: 'Connecting...',
        no: 'Kobler til...'
    },
    restarting: {
        en: 'Restarting...',
        no: 'Starter på nytt...'
    },
    conversation_ended: {
        en: 'The conversation has ended.',
        no: 'Samtalen er avsluttet.'
    },
    network_error: {
        en:
            'We are having connection issues. Please check your network settings, and try again.',
        no:
            'Vi får ikke kontakt. Vennligst sjekk internettilkoblingen din og prøv igjen.'
    },
    error: {
        en: 'Something went wrong.',
        no: 'Det har skjedd en feil.'
    },
    waiting_for_human: {
        en: 'Waiting for an available agent...',
        no: 'Venter på ledig kundebehandler...'
    }
};

const StatusStrip = () => {
    const {translate} = useLanguage();
    const {conversation, error, status} = useSession();
    const localizations = useMemo(() => translate(translations), [translate]);
    const conversationStatus = conversation?.state.chat_status;

    switch (status) {
        case 'connecting': {
            return (
                <Element type='info'>
                    <ContentsElement>
                        <TextElement>{localizations.connecting}</TextElement>
                        <Spinner />
                    </ContentsElement>
                </Element>
            );
        }

        case 'restarting': {
            return (
                <Element type='advarsel'>
                    <ContentsElement>
                        <TextElement>{localizations.restarting}</TextElement>
                        <Spinner />
                    </ContentsElement>
                </Element>
            );
        }

        case 'ended': {
            return (
                <Element type='suksess'>
                    {localizations.conversation_ended}
                </Element>
            );
        }

        case 'error': {
            if (error?.code === 'network_error') {
                return (
                    <Element type='feil'>{localizations.network_error}</Element>
                );
            }

            return <Element type='feil'>{localizations.error}</Element>;
        }

        default: {
            if (conversationStatus === 'in_human_chat_queue') {
                return (
                    <Element type='info'>
                        <ContentsElement>
                            <TextElement>
                                {localizations.waiting_for_human}
                            </TextElement>

                            <Spinner />
                        </ContentsElement>
                    </Element>
                );
            }

            return null;
        }
    }
};

export default StatusStrip;
