import styled, { keyframes } from 'styled-components';
import tema from '../../tema/tema';

const blink = keyframes`
50% {
    background: ${tema.farger.skriveIndikator.dot.aktiv};
  }
`;

export const Container = styled.div`
    font-style: normal;
`;

export const Indikator = styled.div`
    padding: 10px;
    margin: 5px 0 10px 10px;
    border-radius: 10px;
    background: ${tema.farger.skriveIndikator.bakgrunn};
    display: inline-flex;
`;

export const IndikatorDot = styled.span`
    height: 10px;
    width: 10px;
    background: ${tema.farger.skriveIndikator.dot.inaktiv};
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
    }
`;