import React, {useRef, useEffect} from 'react';
import styled from 'styled-components';
import {Normaltekst} from 'nav-frontend-typografi';
import finishIcon from '../assets/finish.svg';

const ModalContainer = styled.div`
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    width: 100%;
    height: 100%;
    padding: 30px;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    box-sizing: border-box;
    display: flex;

    ${(properties: {isOpen?: boolean}) =>
        properties.isOpen &&
        `
            opacity: 1;
            pointer-events: all;
        `}
`;

const CloseButton = styled.button`
    appearance: none;
    background: #fff;
    cursor: pointer;
    width: 48px;
    height: 52px;
    padding: 16px 14px;
    border: 0;
    border-radius: 0 0 0 6px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    position: absolute;
    top: 0;
    right: 0;

    svg {
        width: 100%;
        height: 100%;
    }

    &:focus {
        outline: none;
        box-shadow: inset 0 0 0 3px #005b82;
        border-radius: 7px;
    }
`;

const ModalContents = styled.div`
    background: #fff;
    padding: 20px 20px;
    border-radius: 4px;
    margin: auto;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15),
        0 1px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, opacity 0.1s;
    transform: scale(0.8);
    opacity: 0;

    ${(properties: {isOpen?: boolean}) =>
        properties.isOpen &&
        `
            opacity: 1;
            transform: none;
        `}
`;

const ModalText = styled(Normaltekst)`
    font-size: 17px;
`;

const ModalActions = styled.div`
    width: 100%;
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
`;

interface ModalProperties {
    isOpen?: boolean;
    'aria-label'?: string;
    children?: React.ReactNode;
    onConfirm?: () => void;
}

const Modal = ({
    isOpen,
    'aria-label': ariaLabel,
    onConfirm,
    children
}: ModalProperties) => {
    const reference = useRef<HTMLDivElement>();

    useEffect(() => {
        if (isOpen && reference.current) {
            reference.current.focus();
        }
    }, [isOpen, reference.current]);

    return (
        <ModalContainer ref={reference as any} {...{isOpen}}>
            <CloseButton
                aria-label={ariaLabel}
                type='button'
                dangerouslySetInnerHTML={{
                    __html: finishIcon
                }}
                onClick={onConfirm}
            />

            <ModalContents {...{isOpen}}>{children}</ModalContents>
        </ModalContainer>
    );
};

export {ModalText, ModalActions, ModalContents, ModalContainer};
export default Modal;
