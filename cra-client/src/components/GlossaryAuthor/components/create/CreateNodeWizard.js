/* SPDX-License-Identifier: Apache-2.0 */
/* Copyright Contributors to the ODPi Egeria project. */
import React, { useState} from "react";
import {
  ProgressIndicator,
  ProgressStep,
  Button,
} from "carbon-components-react";
import StartingNodeNavigation from "../navigations/StartingNodeNavigation";
import CreateNodePage from "./CreateNodePage";
export default function CreateNodeWizard(props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [glossaryGuid, setGlossaryGuid] = useState();
  const [nodeCreated, setNodeCreated] = useState();
  console.log("CreateNodeWizard props = " + JSON.stringify(props));

  const handleChoseGlossaryOnClick = (e) => {
    e.preventDefault();
    if (currentStepIndex === 0) {
      setCurrentStepIndex(1);
    }
  };
  const handleReChooseGlossaryOnClick = (e) => {
    e.preventDefault();
    if (currentStepIndex === 1) {
      setCurrentStepIndex(0);
    }
  };
  const validateGlossaryForm = () => {
    let isValid = false;
    if (glossaryGuid) {
      isValid = true;
    }
    return isValid;
  };
  const onGlossarySelect = (guid) => {
    setGlossaryGuid(guid);
  };
  const onCreate = () => {
    setNodeCreated(true);
  };
  const getTitle = () => {
    return "Create " + props.currentNodeType.typeName + " Wizard";
  };
  const step1Title = () => {
    return "Choose a Glossary that you want the " + props.currentNodeType.typeName + " to be created in.";
  };
  const getStep1Description = () => {
    return "Step 1: A glossary needs to be chosen before a " +props.currentNodeType.key + " can be created";
  };
  const step2Title = () => {
    return "Create the " + props.currentNodeType.typeName + " in the chosen Glossary.";
  };
  const getStep2Label = () => {
    return "Create " + props.currentNodeType.typeName;
  };
  const getStep2Description = () => {
    return "Step2:  Create " + props.currentNodeType.typeName + " in the chosen Glossary"
  };

  return (
    <div>
      <h1>{getTitle()}</h1> 
      <ProgressIndicator currentIndex={currentStepIndex}>
        <ProgressStep
          label="Set Glossary"
          description={getStep1Description()}
        />
        <ProgressStep
          disabled={!validateGlossaryForm()}
          label={getStep2Label()}
          description={getStep2Description()}
        />
      </ProgressIndicator>
      <div>
        {currentStepIndex === 0 && (
          <Button
            kind="secondary"
            onClick={handleChoseGlossaryOnClick}
            disabled={!validateGlossaryForm()}
          >
            Next
          </Button>
        )}
        {currentStepIndex  ===  0 && !nodeCreated && (
          <h3 className="create-wizard-page-title">{step1Title()}</h3>
        )}
        {currentStepIndex === 0 && (
          <StartingNodeNavigation
            match={props.match}
            nodeTypeName="glossary"
            onSelectCallback={onGlossarySelect}
          />
        )}
        {currentStepIndex === 1 && !nodeCreated && (
          <div>
            <Button kind="secondary" onClick={handleReChooseGlossaryOnClick}>
              Previous
            </Button>
             <h3 className="create-wizard-page-title">{step2Title()}</h3>
          </div>
        )}
        {currentStepIndex === 1 && (
          <div>
            <CreateNodePage
              currentNodeType={props.currentNodeType}
              glossaryGuid={glossaryGuid}
              parentCategoryGuid={props.parentCategoryGuid}
              onCreateCallback={onCreate}
            />
          </div>
        )}
      </div>
    </div>
  );
}