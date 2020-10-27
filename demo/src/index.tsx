import React from 'react';
import styled from 'styled-components';
import {render} from 'react-dom';
import Chat from '../../src';

const Outer = styled.div`
    padding: 0;
    margin: 0;
`;

const Demo = () => (
    <Outer>
        <Chat />
    </Outer>
);

render(<Demo />, document.querySelector('#demo'));
