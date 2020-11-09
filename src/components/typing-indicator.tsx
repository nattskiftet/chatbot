import React from 'react';
import styled from 'styled-components';

const TypingIndicatorDot = styled.span`
    background: rgba(0, 0, 0, 0.4);
    width: 8px;
    height: 8px;
    border-radius: 8px;
    margin: 7px;
    margin-right: 0;
    margin-left: 5px;
    opacity: 0.5;
    position: relative;
    top: 2px;
    animation: animate 0.5s infinite alternate;
    display: inline-block;
    vertical-align: top;

    &:first-child {
        margin-left: 0;
    }

    &:nth-child(1) {
        animation-delay: 0.33s;
    }

    &:nth-child(2) {
        animation-delay: 0.66s;
    }

    @keyframes animate {
        0% {
            opacity: 0.5;
        }

        100% {
            opacity: 1;
            transform: translate3d(0, -40%, 0);
        }
    }
`;

const TypingIndicator = () => {
    return (
        <span>
            <TypingIndicatorDot />
            <TypingIndicatorDot />
            <TypingIndicatorDot />
        </span>
    );
};

export {TypingIndicatorDot};
export default TypingIndicator;
