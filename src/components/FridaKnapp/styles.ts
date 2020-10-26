import styled from 'styled-components';
import {liten} from '../../tema/mediaqueries';
import fridaIkon from '../../assets/frida.svg';
import defaultIkon from '../../assets/default.svg';

export const ikonSizePx = '64px';
export const ikonSizeMobilPx = '48px';

const tekstHeightPx = '42px';
const tekstHeightMobilPx = '32px';
const navGra20 = '#c6c2bf';
const navDypBla = '#005B82';

type Properties = {queueKey: string};

export const FridaTekst = styled.span`
    display: flex;
    align-items: center;
    align-self: center;
    padding: 0 calc(${ikonSizePx} / 2 + 8px) 0 calc(${tekstHeightPx} / 2);
    color: ${navDypBla};
    white-space: nowrap;
    height: ${tekstHeightPx};
    box-shadow: inset 0 0 0 2px ${navGra20};
    border-radius: ${tekstHeightPx} 0 0 ${tekstHeightPx};
    background-color: white;

    ${liten} {
        padding: 0 calc(${ikonSizeMobilPx} / 2 + 8px) 0
            calc(${tekstHeightMobilPx} / 2);
        height: ${tekstHeightMobilPx};
    }
`;

export const FridaIkon = styled.span`
    position: relative;
    align-self: center;
    right: calc(${ikonSizePx} * 0.5);
    margin-right: calc(${ikonSizePx} * -0.5);
    width: ${ikonSizePx};
    height: ${ikonSizePx};
    border-radius: ${ikonSizePx};
    transition: transform 100ms ease-out;

    ${liten} {
        right: calc(${ikonSizeMobilPx} * 0.5);
        margin-right: calc(${ikonSizeMobilPx} * -0.5);
        width: ${ikonSizeMobilPx};
        height: ${ikonSizeMobilPx};
        border-radius: ${ikonSizeMobilPx};
    }

    background: ${(properties: Properties) =>
        properties.queueKey === 'Q_CHAT_BOT'
            ? `transparent url('data:image/svg+xml;base64,${window.btoa(
                  fridaIkon
              )}') no-repeat center center`
            : `transparent url('data:image/svg+xml;base64,${window.btoa(
                  defaultIkon
              )}') no-repeat center center`};
`;

export const FridaKnapp = styled.button`
    display: flex;
    height: ${ikonSizePx};
    cursor: pointer;
    background-color: transparent;
    border: none;
    padding: 0;
    filter: drop-shadow(5px 3px 4px #666);

    ${liten} {
        height: ${ikonSizeMobilPx};
    }

    &:hover {
        ${FridaTekst} {
            color: white;
            background-color: ${navDypBla};
        }

        ${FridaIkon} {
            transform: scale(1.1);
        }
    }

    &:focus {
        outline: none;
        box-shadow: none !important;

        ${FridaTekst} {
            box-shadow: inset 0 0 0 3px ${navDypBla} !important;
        }

        ${FridaIkon} {
            box-shadow: 0 0 0 3px ${navDypBla};
        }
    }
`;
