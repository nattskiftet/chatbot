import React from 'react';
import styled from 'styled-components';
import AlertStripe from 'nav-frontend-alertstriper';
import useSession from '../contexts/session';
import Spinner, {SpinnerContainer} from './spinner';

const AlertStrip = styled(AlertStripe)`
    backdrop-filter: blur(2px);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

    ${SpinnerContainer} {
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

const AlertStripContainer = styled.div`
    display: flex;
`;

const AlertStripText = styled.span`
    flex: 1;
`;

const StatusStrip = () => {
    const {conversation, error, status} = useSession();
    const conversationStatus = conversation?.state.chat_status;

    switch (status) {
        case 'connecting': {
            return (
                <AlertStrip type='info'>
                    <AlertStripContainer>
                        <AlertStripText>Kobler til...</AlertStripText>
                        <Spinner />
                    </AlertStripContainer>
                </AlertStrip>
            );
        }

        case 'restarting': {
            return (
                <AlertStrip type='advarsel'>
                    <AlertStripContainer>
                        <AlertStripText>Starter på nytt...</AlertStripText>
                        <Spinner />
                    </AlertStripContainer>
                </AlertStrip>
            );
        }

        case 'ended': {
            return (
                <AlertStrip type='suksess'>Samtalen er avsluttet.</AlertStrip>
            );
        }

        case 'error': {
            if (error?.code === 'network_error') {
                return (
                    <AlertStrip type='feil'>
                        Vi får ikke kontakt. Vennligst sjekk
                        internettilkoblingen din og prøv igjen.
                    </AlertStrip>
                );
            }

            return <AlertStrip type='feil'>Det har skjedd en feil.</AlertStrip>;
        }

        default: {
            if (conversationStatus === 'in_human_chat_queue') {
                return (
                    <AlertStrip type='info'>
                        <AlertStripContainer>
                            <AlertStripText>
                                Venter på ledig kundebehandler...
                            </AlertStripText>

                            <Spinner />
                        </AlertStripContainer>
                    </AlertStrip>
                );
            }

            return null;
        }
    }
};

export default StatusStrip;
