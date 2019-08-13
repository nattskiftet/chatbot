import styled from 'styled-components';
import tema from '../../tema/tema';
import valgtIkon from '../../assets/valgt.svg';

export const ValgContainer = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

export const Valg = styled.li`
    border: 1px solid #000;
    padding: 10px;
    font-family: ${tema.tekstFamilie};
    font-size: ${tema.storrelser.tekst.generell};
    margin: 0;
    border-radius: 3px;
    cursor: pointer;
    padding-left: 50px;
    position: relative;

    &:before {
        content: '';
        position: absolute;
        height: 20px;
        width: 20px;
        border: 1px solid #000;
        left: 10px;
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

    & + & {
        margin-top: 10px;
    }
    
    /*

    &:last-child {
        border-color: ${tema.farger.valgtInteraksjon};
        background: ${tema.farger.valgtInteraksjon};

        &:before {
            border-color: ${tema.farger.interaksjon};
            background: transparent url('data:image/svg+xml;base64, ${window.btoa(
                valgtIkon
            )}') no-repeat center center;
        }
        
        &:hover{
            box-shadow: none;
            color: #000;
        }
    }
    */
`;
