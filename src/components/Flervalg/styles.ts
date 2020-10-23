import styled, {css} from 'styled-components';
import tema from '../../tema/tema';
import selectedIcon from '../../assets/selected.svg';
import {Indikator} from '../Skriveindikator/styles';
import {ValgProperties} from '.';

export const ValgBoks = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

export const Valg = styled.li`
    & + & {
        margin-top: 10px;
    }

    button {
        padding: 15px;
        font-family: ${tema.tekstFamilie};
        font-size: ${tema.storrelser.tekst.generell};
        background: none;
        border: 1px solid #000;
        margin: 0;
        border-radius: 5px;
        cursor: pointer;
        padding-left: 50px;
        position: relative;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;

        &:before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            border: 1px solid #000;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            border-radius: 50%;
        }

        &:hover {
            border-color: ${tema.farger.interaksjon};
            color: ${tema.farger.interaksjon};
            box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.23);

            &:before {
                border-color: ${tema.farger.valgtInteraksjon};
                background: ${tema.farger.valgtInteraksjon};
            }
        }

        ${(properties: ValgProperties) =>
            properties.isActive &&
            css`
                border-color: #707070;
                color: #707070;
                cursor: auto;

                &:before {
                    border-color: #707070;
                }

                &:hover {
                    border-color: #707070;
                    color: #707070;
                    cursor: auto;
                    box-shadow: none;

                    :before {
                        border-color: #707070;
                        background: #fff;
                    }
                }
            `}

        ${(properties: ValgProperties) =>
            properties.isChosen &&
            css`
            border-color: ${tema.farger.valgtInteraksjon};
            background: ${tema.farger.valgtInteraksjon};
            color: #000;

            &:before {
                border-color: ${tema.farger.interaksjon};
                background: transparent url('data:image/svg+xml;base64, ${window.btoa(
                    selectedIcon
                )}') no-repeat center center;
            }

            &:hover {
                box-shadow: none;
                color: #000;
                cursor: auto;
                border-color: ${tema.farger.valgtInteraksjon};

                &:before{
                  border-color: ${tema.farger.interaksjon};
                  background: transparent url('data:image/svg+xml;base64, ${window.btoa(
                      selectedIcon
                  )}') no-repeat center center;
                }
            }
        `}

        & span {
            flex: 1;
        }

        ${Indikator} {
            background-color: transparent;
            margin-left: 15px;
            margin-right: 5px;
            padding: 0;
        }
    }
`;

export const Boks = styled.div`
    margin-left: ${(properties: ValgProperties) =>
        properties.isCollapsed ? '60px' : null};
`;
