import React from 'react';
import styled from 'styled-components';
import NavFrontendSpinner from 'nav-frontend-spinner';

const SpinnerContainer = styled.span`
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
    <SpinnerContainer>
        <NavFrontendSpinner />
    </SpinnerContainer>
);

export {SpinnerContainer};
export default Spinner;
