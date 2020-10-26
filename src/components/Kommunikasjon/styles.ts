import styled from 'styled-components';
import {userTypeConstants} from '../../constants';
import fridaIkon from '../../assets/frida.svg';
import tema from '../../tema/tema';
import {Indikator} from '../Skriveindikator/styles';

type Properties = {
    side?: 'VENSTRE' | 'HOYRE';
    brukerBilde?: string;
    brukerType?: 'HUMAN' | 'BOT' | string | undefined;
};

export const Boks = styled.div`
    display: flex;
    flex-direction: column;
    margin: 10px 0;
`;

export const Innhold = styled.div`
    display: flex;
`;

export const Venstre = styled.div`
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    margin-right: 10px;
`;

export const Hoyre = styled.div`
    margin-left: ${(properties: Properties) =>
        properties.side === 'VENSTRE' ? undefined : 'auto'};
`;

export const Brukerbilde = styled.div`
    width: 50px;
    height: 50px;
    ${(properties: Properties) =>
        properties.brukerBilde
            ? `background: transparent url('${properties.brukerBilde.trim()}') no-repeat center center`
            : `background: transparent url('data:image/svg+xml;base64, ${window.btoa(
                  fridaIkon
              )}') no-repeat center center`};
`;

export const Snakkeboble = styled.div`
    font-family: ${tema.tekstFamilie};
    font-size: ${tema.storrelser.tekst.generell};
    padding: 15px;
    background: ${(properties: Properties) => {
        if (properties.brukerType === userTypeConstants.bot) {
            return tema.farger.snakkebobler.bot;
        }

        if (properties.brukerType === userTypeConstants.human) {
            return tema.farger.snakkebobler.agent;
        }

        return tema.farger.snakkebobler.bruker;
    }};

    border-radius: ${(properties: Properties) =>
        properties.side === 'VENSTRE' ? '0 7px 7px 7px' : '7px 0 7px 7px'};
    word-break: break-word;

    svg {
        height: 30px;
        width: 30px;
    }

    a,
    a:visited,
    :link {
        color: ${tema.farger.interaksjon};
        text-decoration: underline;
    }
`;
