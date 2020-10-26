import styled, {keyframes} from 'styled-components';
import tema from '../../tema/tema';

const blink = keyframes`
    50% {
        opacity: 0.2;
    }
`;

const visAnimasjon = keyframes`
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const Boks = styled.div`
    font-style: normal;
`;

export const Indikator = styled.div`
    padding: 10px;
    border-radius: 10px;
    border-radius: 0 10px 10px 10px;
    background: ${tema.farger.skriveIndikator.bakgrunn};
    display: inline-flex;
    animation: ${visAnimasjon} 300ms;
`;

export const IndikatorPrikk = styled.span`
    height: 10px;
    width: 10px;
    background: ${tema.farger.skriveIndikator.dot};
    border-radius: 50%;
    margin-right: 10px;

    &:nth-of-type(1) {
        animation: ${blink} 1s infinite ${0.3333}s;
    }

    &:nth-of-type(2) {
        animation: ${blink} 1s infinite ${2 * 0.3333}s;
    }

    &:nth-of-type(3) {
        animation: ${blink} 1s infinite ${3 * 0.3333}s;
        margin-right: 0;
    }
`;
