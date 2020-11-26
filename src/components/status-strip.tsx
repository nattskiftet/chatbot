import React from 'react';
import styled from 'styled-components';
import AlertStripe from 'nav-frontend-alertstriper';
import useSession from '../contexts/session';
import Spinner, {SpinnerElement} from './spinner';

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

const StatusStrip = () => {
    const {conversation, error, status} = useSession();
    const conversationStatus = conversation?.state.chat_status;

    switch (status) {
        case 'connecting': {
            return (
                <Element type='info'>
                    <ContentsElement>
                        <TextElement>Kobler til...</TextElement>
                        <Spinner />
                    </ContentsElement>
                </Element>
            );
        }

        case 'restarting': {
            return (
                <Element type='advarsel'>
                    <ContentsElement>
                        <TextElement>Starter på nytt...</TextElement>
                        <Spinner />
                    </ContentsElement>
                </Element>
            );
        }

        case 'ended': {
            return <Element type='suksess'>Samtalen er avsluttet.</Element>;
        }

        case 'error': {
            if (error?.code === 'network_error') {
                return (
                    <Element type='feil'>
                        Vi får ikke kontakt. Vennligst sjekk
                        internettilkoblingen din og prøv igjen.
                    </Element>
                );
            }

            return <Element type='feil'>Det har skjedd en feil.</Element>;
        }

        default: {
            if (conversationStatus === 'in_human_chat_queue') {
                return (
                    <Element type='info'>
                        <ContentsElement>
                            <TextElement>
                                Venter på ledig kundebehandler...
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
