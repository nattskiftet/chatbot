import React from 'react';
import {render} from 'react-dom';
import Chat from '../../src';
const Demo = () => (
    <div>
        <style type='text/css'>
            {`
                html, body {
                    margin: 0;
                    padding: 0;
                }
            `}
        </style>

        <Chat />
    </div>
);

render(<Demo />, document.querySelector('#demo'));
