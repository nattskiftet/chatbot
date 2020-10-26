import styled, {css} from 'styled-components';
import tema from '../../tema/tema';
import {liten} from '../../tema/mediaqueries';
import {ikonSizeMobilPx, ikonSizePx} from '../FridaKnapp/styles';

interface Props {
    erApen: boolean;
}

const bottomOffset = '50px';
const rightOffset = '50px';
const smallBottomOffset = '25px';
const smallRightOffset = '25px';

export const Container = styled.div`
    width: fit-content;
    height: ${ikonSizePx};
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 1px solid transparent;
    box-shadow: 6px 6px 6px 0 rgba(0, 0, 0, 0);
    transition: all 300ms cubic-bezier(0.86, 0, 0.07, 1);
    box-sizing: border-box;
    font-family: ${tema.tekstFamilie};
    font-size: ${tema.storrelser.tekst.generell};

    &:focus {
        outline: none;
    }

    *:focus {
        outline: none;
        box-shadow: 0 0 0 3px ${tema.farger.fokus};
    }

    ${liten} {
        width: fit-content;
        height: ${ikonSizeMobilPx};
        box-shadow: none;
        border: none;
    }

    ${(props: Props) =>
        props.erApen &&
        css`
            width: ${tema.bredde};
            height: ${tema.hoyde};
            background: #fff;
            border: 1px solid #b5b5b5;
            box-shadow: 6px 6px 6px 0 rgba(0, 0, 0, 0.16);
            position: fixed;
            bottom: 1px;
            right: 1px;

            *,
            *:before,
            *:after {
                box-sizing: inherit;
            }

            @media (min-height: calc(${tema.hoyde} + ${smallBottomOffset})) {
                bottom: ${smallBottomOffset};
                right: ${smallRightOffset};
            }

            @media (min-height: calc(${tema.hoyde} + ${bottomOffset} + ${bottomOffset})) {
                bottom: ${bottomOffset};
                right: ${rightOffset};
            }

            ${liten} {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0;
            }
        `};
`;
