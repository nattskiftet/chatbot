import styled from 'styled-components';
import AlertStripe from 'nav-frontend-alertstriper';
import tema from '../../tema/tema';

export const Interaksjon = styled.div`
    height: 100%;
    position: relative;
    overflow: auto;

    &:before {
        content: '';
        position: absolute;
        height: 10px;
        width: 100%;
        top: 0;
        display: block;
        box-shadow: inset 0 10px 5px -6px rgba(0, 0, 0, 0.16);
        transition: top 150ms ease-in-out;
    }
`;

export const Chatlog = styled.div`
    height: 80%;
    max-height: calc(100% - 85px);
    overflow-y: scroll;
    padding: 15px;
`;

export const Tekstomrade = styled.form`
    margin-top: auto;
    display: flex;
    border-top: 1px solid ${tema.farger.tekstfelt};
    height: 20%;
    width: 100%;
    padding: 14px;
    align-items: center;
    min-height: 85px;
    z-index: 10;
`;

export const Tekstfelt = styled.textarea`
    width: 100%;
    height: 100%;
    resize: none;
    margin-right: 5px;
    border: none;
    font-size: ${tema.storrelser.tekst.generell};
    font-family: ${tema.tekstFamilie};
    outline: none;

    ::placeholder {
        color: ${tema.farger.tekstfelt};
    }

    :disabled {
        opacity: 0.5;
        background: #fff;
    }
`;

export const SendKnappOgTeller = styled.div`
    margin-left: 12px;
    display: flex;
    flex-direction: column;
`;

export const Teller = styled.div`
    font-size: ${tema.storrelser.tekst.teller};
    font-family: ${tema.tekstFamilie};
    margin-top: 5px;
    color: ${(props: {error: boolean}) =>
        props.error ? 'red' : tema.farger.tekst.klokketekst};
`;

export const Alertstripe = styled(AlertStripe)`
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom-width: 2px !important;
    border-radius: 0 !important;
`;

export const Avsluttet = styled.div`
    padding: 1.5rem;
    border-bottom: 2px solid black;
`;

export const AvsluttetHeader = styled(AlertStripe)`
    border-bottom: 1px solid black !important;
    border-radius: 0 !important;
    padding-bottom: 1rem !important;
`;

export const KoblerTil = styled(AlertStripe)`
    position: absolute !important;
    z-index: 9 !important;
    border-radius: 0 !important;
    padding: 1.5rem !important;
    background-color: white !important;
    width: 100% !important;
`;
