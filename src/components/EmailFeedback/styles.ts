import styled from 'styled-components';
import tema from '../../tema/tema';
import { KnappElement } from '../Knapp/styles';

export const Form = styled.form`
    display: flex;
`;

export const Venstre = styled.div`
    width: 80%;
    margin-right: 10px;
`;

export const Hoyre = styled.div`
    flex: 1;
`;

export const EpostFelt = styled.input`
    border: 1px solid ${tema.farger.tekstfelt};
    padding: 0 15px;
    height: 45px;
    border-color: ${(props: { error: boolean }) =>
        props.error
            ? tema.farger.alertstripe.feil.bakgrunn
            : tema.farger.tekstfelt};
    width: 100%;
`;

export const SendKnapp = styled(KnappElement)`
    height: 45px;
    vertical-align: top;
    border-color: ${tema.farger.tekstfelt};
    color: ${tema.farger.tekstfelt};
    width: 100%;
`;

export const Feilmelding = styled.p`
    color: ${tema.farger.alertstripe.feil.bakgrunn};
    margin: 0;
`;

export const Suksessmelding = styled.p`
    color: ${tema.farger.alertstripe.suksess.bakgrunn};
    margin: 0;
`;