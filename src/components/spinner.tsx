import React from 'react';
import styled from 'styled-components';
import NavFrontendSpinner from 'nav-frontend-spinner';

const SpinnerElement = styled.span`
    width: 0.8em;
    height: 0.8em;
    margin: auto;
    margin-left: 4px;
    display: inline-block;
    vertical-align: top;

    svg {
        width: 100%;
        height: 100%;
    }
`;

const Spinner = () => (
    <SpinnerElement>
        <NavFrontendSpinner />
    </SpinnerElement>
);

export {SpinnerElement};
export default Spinner;
