import React from 'react';
import styled from 'styled-components';
import {Normaltekst, Undertekst} from 'nav-frontend-typografi';
import fridaIcon from '../assets/frida.svg';

const openButtonAvatarSizeNumber = 60;
const openButtonAvatarSize = `${openButtonAvatarSizeNumber}px`;

interface ButtonProperties {
    isVisible?: boolean;
}

const Button = styled.button`
    appearance: none;
    background: #fff;
    margin-right: ${openButtonAvatarSizeNumber / 2}px;
    margin-bottom: ${openButtonAvatarSizeNumber / 5}px;
    padding: 8px 15px;
    position: fixed;
    bottom: 25px;
    right: 25px;
    border: 0;
    cursor: pointer;
    border-radius: 30px;
    transform: ${(properties: ButtonProperties) =>
        properties.isVisible
            ? 'scale(1)'
            : `scale(0.8) translate3d(0,${
                  openButtonAvatarSizeNumber * 2
              }px,0)`};

    opacity: ${(properties: ButtonProperties) =>
        properties.isVisible ? '1' : '0'};

    transition: ${(properties: ButtonProperties) =>
        properties.isVisible
            ? 'transform 0.5s, opacity 0.2s 0.3s'
            : 'transform 0.2s, opacity 0.1s'};

    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4),
        0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.5),
        0 4px 10px rgba(0, 0, 0, 0.2);

    &:hover {
        background-color: #005b82;
    }

    &:focus {
        background: #005b82;
        outline: none;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3), 0 0 0 4px #005b82;
    }
`;

const ButtonText = styled(Normaltekst)`
    padding-right: ${openButtonAvatarSizeNumber / 2 - 4}px;
    display: inline-block;
    vertical-align: top;

    ${Button}:focus &, ${Button}:hover & {
        color: #fff;
    }
`;

const ButtonAvatar = styled.div`
    width: ${openButtonAvatarSize};
    height: ${openButtonAvatarSize};
    position: absolute;
    top: 50%;
    right: -${openButtonAvatarSizeNumber / 2}px;
    transform: translateY(-50%);
    transition: transform 0.2s;
    display: inline-block;
    vertical-align: top;

    ${Button}:hover & {
        transform: translateY(-50%) scale(1.1);
    }

    svg {
        width: 100%;
        height: 100%;
    }

    &:before {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3);
        border-radius: ${openButtonAvatarSize};
    }

    ${Button}:focus &:before {
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(255, 255, 255, 1), 0 1px 4px rgba(0, 0, 0, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.3), 0 0 0 4px #005b82;
    }
`;

const ButtonUnreadCount = styled(Undertekst)`
    background: #c30000;
    width: 21px;
    height: 21px;
    text-align: center;
    color: #fff;
    border-radius: 21px;
    position: absolute;
    top: 50%;
    right: -${openButtonAvatarSizeNumber / 2}px;
    transform: translateY(-${openButtonAvatarSizeNumber / 2}px);
    transition: transform 0.2s;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3),
        0 0 0 2px rgba(255, 255, 255, 1);
    pointer-events: none;

    &:empty {
        transform: translateY(-${openButtonAvatarSizeNumber / 2}px) scale(0);
    }
`;

interface OpenButtonProperties {
    isOpen: boolean;
    isOpening: boolean;
    unreadCount: number;
    onClick: () => void;
}

const OpenButton = ({
    isOpen,
    isOpening,
    unreadCount,
    onClick
}: OpenButtonProperties) => {
    const openButtonLabelPrefix =
        status === 'connected' ? 'Åpne chat' : 'Chat med oss';
    let openButtonLabel = openButtonLabelPrefix;

    if (unreadCount > 0) {
        openButtonLabel +=
            unreadCount > 1
                ? ` (${unreadCount} uleste meldinger)`
                : ` (${unreadCount} ulest melding)`;
    }

    return (
        <Button
            type='button'
            aria-label={openButtonLabel}
            isVisible={!isOpen && !isOpening}
            tabIndex={isOpen ? -1 : 0}
            {...{onClick}}
        >
            <ButtonText>{openButtonLabelPrefix}</ButtonText>

            <ButtonAvatar
                dangerouslySetInnerHTML={{
                    __html: fridaIcon
                }}
            />

            <ButtonUnreadCount>
                {unreadCount > 0
                    ? `${unreadCount > 9 ? '9' : unreadCount}`
                    : ''}
            </ButtonUnreadCount>
        </Button>
    );
};

export {ButtonProperties, ButtonAvatar, ButtonText};
export default OpenButton;