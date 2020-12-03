import React, {useRef, useEffect} from 'react';
import styled, {css} from 'styled-components';
import {Systemtittel, Normaltekst} from 'nav-frontend-typografi';
import finishIcon from '../assets/finish.svg';

const Element = styled.dialog`
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    width: 100%;
    height: 100%;
    padding: 20px;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    border: 0;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    box-sizing: border-box;
    display: flex;

    ${(properties: {isOpen?: boolean}) =>
        properties.isOpen &&
        css`
            opacity: 1;
            pointer-events: all;
        `};
`;

const ButtonElement = styled.button`
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
    z-index: 10;

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

const ContentsElement = styled.div`
    height: 100%;
    margin: auto;
    transition: transform 0.2s, opacity 0.1s;
    transform: scale(0.8);
    opacity: 0;
    display: flex;

    ${(properties: {isOpen?: boolean}) =>
        properties.isOpen &&
        css`
            opacity: 1;
            transform: none;
        `};
`;

const BoxElement = styled.div`
    background: #fff;
    max-height: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: auto;
    padding: 0 20px;
    border-radius: 4px;
    margin: auto;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15),
        0 1px 10px rgba(0, 0, 0, 0.1);

    &::before,
    &::after {
        content: '';
        width: 100%;
        height: 20px;
        position: sticky;
        position: -webkit-sticky;
        z-index: 1;
        display: block;
    }

    &::before {
        background: linear-gradient(#fff 25%, rgba(255, 255, 255, 0) 100%);
        top: 0;
    }

    &::after {
        background: linear-gradient(rgba(255, 255, 255, 0) 0%, #fff 75%);
        bottom: 0;
    }
`;

const TitleElement = styled(Systemtittel)`
    font-size: 20px;
`;

const HeadingElement = styled(Systemtittel)`
    font-size: 17px;
    margin-top: 4px;
`;

const TextElement = styled(Normaltekst)`
    font-size: 17px;
    margin-bottom: 18px;
`;

const ActionsElement = styled.div`
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
    }, [isOpen]);

    return (
        <Element
            ref={reference as any}
            {...{isOpen}}
            aria-modal={isOpen}
            open={isOpen}
        >
            <ButtonElement
                aria-label={ariaLabel}
                type='button'
                tabIndex={isOpen ? undefined : -1}
                dangerouslySetInnerHTML={{
                    __html: finishIcon
                }}
                onClick={onConfirm}
            />

            <ContentsElement {...{isOpen}}>{children}</ContentsElement>
        </Element>
    );
};

export {
    ModalProperties,
    BoxElement,
    TitleElement,
    HeadingElement,
    TextElement,
    ActionsElement
};

export default Modal;
