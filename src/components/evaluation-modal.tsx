import React, {useState, useMemo} from 'react';
import styled from 'styled-components';
import {Knapp} from 'nav-frontend-knapper';

import {
    Textarea,
    RadioGruppe,
    Radio,
    CheckboxGruppe,
    Checkbox
} from 'nav-frontend-skjema';

import useLanguage from '../contexts/language';
import useSession from '../contexts/session';
import TextareaCounter from './textarea-counter';

import Modal, {
    ModalProperties,
    BoxElement,
    TitleElement,
    TextElement
} from './modal';

const ActionsElement = styled.div`
    margin-top: 20px;
    display: flex;
`;

const ActionsSpacerElement = styled.div`
    flex: 1;
`;

const translations = {
    chat_evaluation: {
        en: 'Chat evaluation',
        no: 'Evaluering av chat'
    },
    chat_has_ended: {
        en: 'The chat has ended.',
        no: 'Chatten er avsluttet.'
    },
    consider_evaluating: {
        en: 'If you have time, please consider evaluating your experience.',
        no: 'Hvis du har tid, ønsker vi gjerne å lære av opplevelsen din.'
    },
    your_rating: {
        en: 'Were your questions answered?',
        no: 'Fikk du svar på det du lurte på?'
    },
    yes: {
        en: 'Yes',
        no: 'Ja'
    },
    no: {
        en: 'No',
        no: 'Nei'
    },
    partly: {
        en: 'Partly',
        no: 'Delvis'
    },
    what_did_you_come_to_do: {
        en: 'What did you come here to do?',
        no: 'Hva kom du hit for å gjøre?'
    },
    submit_sick_leave: {
        en: 'Submit sick leave',
        no: 'Levere sykemelding'
    },
    check_or_update_sick_leave: {
        en: 'Check or update sick leave',
        no: 'Sjekke status eller følge opp sykemelding'
    },
    check_or_update_activity_plan: {
        en: 'Check or update activity plan',
        no: 'Sjekke eller oppdatere aktivitetsplanen'
    },
    check_application_or_case_status: {
        en: 'Check the status of my case/application',
        no: 'Sjekke status på søknad eller sak'
    },
    check_payout_status: {
        en: 'Check the status of my payouts',
        no: 'Sjekke status på utbetalinger'
    },
    submit_report_card: {
        en: 'Submit report card',
        no: 'Sende meldekort'
    },
    submit_form_or_application: {
        en: 'Submit form or application',
        no: 'Sende skjema eller søknad'
    },
    contact_or_respond_to_nav: {
        en: 'Contact or respond to NAV',
        no: 'Sende melding eller svar til NAV'
    },
    read_messages_from_nav: {
        en: 'Read messages from NAV',
        no: 'Lese meldinger fra NAV'
    },
    find_information_and_understand_rights: {
        en: 'Find information and understand my rights',
        no: 'Finne informasjon og forstå mine rettigheter'
    },
    look_for_or_apply_to_jobs: {
        en: 'Look for or apply to jobs',
        no: 'Finne ledige stillinger eller søke jobb'
    },
    find_statistics_analyses_or_research: {
        en: 'Find statistics, analyses, or research',
        no: 'Finne statistikk, analyse, eller forskning'
    },
    check_or_update_follow_up_plan: {
        en: 'Check or update follow up-plan',
        no: 'Sjekke eller oppdatere oppfølgningsplanen'
    },
    something_else: {
        en: 'Something else',
        no: 'Annet'
    },
    are_you_satisfied: {
        en: 'Are you satisfied with the help you recieved?',
        no: 'Er du fornøyd med hjelpen du fikk?'
    },
    very_satisfied: {
        en: 'I am very satisfied',
        no: 'Jeg er veldig fornøyd'
    },
    satisfied: {
        en: 'I am satisfied',
        no: 'Jeg er fornøyd'
    },
    dissatisfied: {
        en: 'I am dissatisfied',
        no: 'Jeg er misfornøyd'
    },
    very_dissatisfied: {
        en: 'I am very dissatisfied',
        no: 'Jeg er veldig misfornøyd'
    },
    your_feedback: {
        en: 'Your feedback',
        no: 'Din tilbakemelding'
    },
    submit: {
        en: 'Submit',
        no: 'Send inn'
    }
};

interface EvaluationModalProperties extends ModalProperties {
    onFeedback?: (key: string, data: Record<string, unknown>) => void;
}

interface InputProperties {
    label: string;
    value: string;
}

interface RatingRadioProperties extends InputProperties {}
interface ReasonCheckboxProperties extends InputProperties {}
interface SatisfactionRadioProperties extends InputProperties {}

const EvaluationModal = ({
    isOpen,
    onFeedback,
    onConfirm,
    ...properties
}: EvaluationModalProperties) => {
    const {language, translate} = useLanguage();
    const {sendFeedback} = useSession();
    const [rating, setRating] = useState<string>();
    const [areas, setAreas] = useState<string[]>([]);
    const [satisfaction, setSatisfaction] = useState<string>();
    const [message, setMessage] = useState<string>('');
    const localizations = useMemo(() => translate(translations), [translate]);

    function handleRatingClick(event: React.MouseEvent) {
        const target = event.target as HTMLInputElement;

        if (target.checked) {
            setRating(target.value);
        }
    }

    function handleReasonClick(event: React.MouseEvent) {
        const target = event.target as HTMLInputElement;

        if (target.checked) {
            setAreas((previousState) => previousState.concat(target.value));
        } else {
            setAreas((previousState) =>
                previousState.filter((value) => value !== target.value)
            );
        }
    }

    function handleSatisfactionClick(event: React.MouseEvent) {
        const target = event.target as HTMLInputElement;

        if (target.checked) {
            setSatisfaction(target.value);
        }
    }

    function handleMessageChange(
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) {
        setMessage(event.target.value);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (rating) {
            void sendFeedback!(
                Math.round(Number.parseInt(rating, 10)),
                message
            );
        }

        if (onFeedback) {
            onFeedback('tilbakemelding', {
                komponent: 'chatbot',
                english: language === 'en',
                responses: {rating, areas, satisfaction}
            });
        }

        onConfirm!();
    }

    const RatingRadio = ({label, value}: RatingRadioProperties) => (
        <Radio
            readOnly
            {...{label, value}}
            name={label}
            checked={rating === value}
            onClick={handleRatingClick}
        />
    );

    const ReasonCheckbox = ({label, value}: ReasonCheckboxProperties) => (
        <Checkbox
            readOnly
            {...{label, value}}
            checked={areas.includes(value)}
            onClick={handleReasonClick}
        />
    );

    const SatisfactionRadio = ({label, value}: SatisfactionRadioProperties) => (
        <Radio
            readOnly
            {...{label, value}}
            name={label}
            checked={satisfaction === value}
            onClick={handleSatisfactionClick}
        />
    );

    return (
        <Modal {...{isOpen, onConfirm}} {...properties}>
            {isOpen && (
                <BoxElement>
                    <form onSubmit={handleSubmit}>
                        <TitleElement>
                            {localizations.chat_has_ended}
                        </TitleElement>
                        <TextElement>
                            {localizations.consider_evaluating}
                        </TextElement>

                        <RadioGruppe legend={localizations.your_rating}>
                            <RatingRadio label={localizations.yes} value='1' />
                            <RatingRadio label={localizations.no} value='0' />
                            <RatingRadio
                                label={localizations.partly}
                                value='0.5'
                            />
                        </RadioGruppe>

                        {onFeedback && (
                            <CheckboxGruppe
                                legend={localizations.what_did_you_come_to_do}
                            >
                                <ReasonCheckbox
                                    label={localizations.submit_sick_leave}
                                    value={translations.submit_sick_leave.no}
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.check_or_update_sick_leave
                                    }
                                    value={
                                        translations.check_or_update_sick_leave
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.check_or_update_activity_plan
                                    }
                                    value={
                                        translations
                                            .check_or_update_activity_plan.no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.check_application_or_case_status
                                    }
                                    value={
                                        translations
                                            .check_application_or_case_status.no
                                    }
                                />
                                <ReasonCheckbox
                                    label={localizations.check_payout_status}
                                    value={translations.check_payout_status.no}
                                />
                                <ReasonCheckbox
                                    label={localizations.submit_report_card}
                                    value={translations.submit_report_card.no}
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.submit_form_or_application
                                    }
                                    value={
                                        translations.submit_form_or_application
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.contact_or_respond_to_nav
                                    }
                                    value={
                                        translations.contact_or_respond_to_nav
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={localizations.read_messages_from_nav}
                                    value={
                                        translations.read_messages_from_nav.no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.find_information_and_understand_rights
                                    }
                                    value={
                                        translations
                                            .find_information_and_understand_rights
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.look_for_or_apply_to_jobs
                                    }
                                    value={
                                        translations.look_for_or_apply_to_jobs
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.find_statistics_analyses_or_research
                                    }
                                    value={
                                        translations
                                            .find_statistics_analyses_or_research
                                            .no
                                    }
                                />
                                <ReasonCheckbox
                                    label={
                                        localizations.check_or_update_follow_up_plan
                                    }
                                    value={
                                        translations
                                            .check_or_update_follow_up_plan.no
                                    }
                                />
                                <ReasonCheckbox
                                    label={localizations.something_else}
                                    value={translations.something_else.no}
                                />
                            </CheckboxGruppe>
                        )}

                        {onFeedback && (
                            <RadioGruppe
                                legend={localizations.are_you_satisfied}
                            >
                                <SatisfactionRadio
                                    label={localizations.very_satisfied}
                                    value={translations.very_satisfied.no}
                                />
                                <SatisfactionRadio
                                    label={localizations.satisfied}
                                    value={translations.satisfied.no}
                                />
                                <SatisfactionRadio
                                    label={localizations.dissatisfied}
                                    value={translations.dissatisfied.no}
                                />
                                <SatisfactionRadio
                                    label={localizations.very_dissatisfied}
                                    value={translations.very_dissatisfied.no}
                                />
                            </RadioGruppe>
                        )}

                        <Textarea
                            value={message}
                            label={localizations.your_feedback}
                            tellerTekst={(count, maxCount) => (
                                <TextareaCounter {...{count, maxCount}} />
                            )}
                            onChange={handleMessageChange}
                        />

                        <ActionsElement>
                            <ActionsSpacerElement />
                            <Knapp kompakt mini htmlType='submit' type='hoved'>
                                {localizations.submit}
                            </Knapp>
                        </ActionsElement>
                    </form>
                </BoxElement>
            )}
        </Modal>
    );
};

export default EvaluationModal;
