/* SPDX-License-Identifier: Apache-2.0 */
/* Copyright Contributors to the ODPi Egeria project. */

import React, { useContext, useState }         from "react";

import { ResourcesContext }                    from "../../contexts/ResourcesContext";
import { RequestContext }                      from "../../contexts/RequestContext";

import ServerConfigServicesDisplay             from "./ServerConfigServicesDisplay";
import ServerConfigEventBusDisplay             from "./ServerConfigEventBusDisplay";
import ServerConfigRepositoryServicesDisplay   from "./ServerConfigRepositoryServicesDisplay";
import ServerServicesDisplay                   from "./ServerServicesDisplay";
import ServerCohortsDisplay                    from "./ServerCohortsDisplay";
import ServerStatusDisplay                     from "./ServerStatusDisplay";
import AuditLogHandler                         from "./AuditLogHandler";
import ConfigLogHandler                        from "./ConfigLogHandler";

import "./details-panel.scss";



export default function ServerDisplay() {


  const resourcesContext = useContext(ResourcesContext);
  const requestContext   = useContext(RequestContext);

  
  const [displayMode, setDisplayMode] = useState("active");

  const changeDisplayMode = (evt) => {

    let mode = evt.target.id;

    switch (mode) {
      case "modeStored":
        setDisplayMode("stored");
        break;
      case "modeActive":
        setDisplayMode("active");
        break;
      case "modeDiffs":
        setDisplayMode("diffs");
        break;
      default:
        console.log("Unknown display mode: "+mode);
        break;

    }
  }

  const [incAuditTrailOption, setIncAuditTrailOption] = useState(false);
  

  const [auditLogStatus, setAuditLogStatus] = useState("idle");
  const [auditLog, setAuditLog]             = useState({});


  const [configLogStatus, setConfigLogStatus] = useState("idle");
  const [configLog, setConfigLog]             = useState({});

  /*
   * Handler for flopping a collapsible
   */
  const flipSection = (evt) => {
    /*
     * Use currentTarget (not target) - because we need to operate relative to the button,
     * which is where the handler is defined, in order for the content section to be the sibling.
     */
    const element = evt.currentTarget;
    element.classList.toggle("active");
    const content = element.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    }
    else {
      content.style.display = "block";
    }
  };


   /*
    * The server configuration is large - too large to want to store in the graph. So it does not get
    * passed back in the ServerOverview. It can be fetched on demand (by button press or expansion of a 
    * collapsible), or it could be fetched in smaller chunks by separate buttons or collapsibles. It seems 
    * to make most sense to display it split across separate collapsibles, but it would be inefficient to 
    * retrieve each of them separately (because each would retrieve the whole server configuration). So the
    * best approach seems to be to retrieve it once and then cherry-pick it. It therefore needs to be stored
    * somewhere - we can keep it in memory and reload it when ServerDisplay renders. If it is not set it 
    * can trigger a fetch.
    */
  


  /*
   * This function will actually retrieve two copies of the configuration, so that they can 
   * be compared, and any differences highlighted.
   * The primary configuration that is displayed in the details panel is the (running) instance
   * configuration. 
   * The function also retrieves the stored configuration (from the platform) and performs a comparison.
   */

  /*
   * state manahement to ensure that the config is loaded immediately when the section is first expanded
   * or when the user right-clicks on the server and explicitly asks for the config to be loaded...
   * When the collapsible is expanded:
   *   state init --> loading and request config from resourcesContext
   *   state loading --> do nothing (wait for existing request to complete)
   *   state loaded --> display it, and include an explicit refresh button that will re-request and set state --> loading
   * When collapsible is collapsed leave the state as-is.
   * When the diagram right-click occurs it does not matter what state loading is in; the config will be requested. This
   * is a good way for the user to refresh the config after it has already been loaded.
   */
  const flipConfigSection = (evt) => {

    /*
     * Use currentTarget (not target) - because we need to operate relative to the button,
     * which is where the handler is defined, in order for the content section to be the sibling.
     */
    let requestConfig = false;

    const element = evt.currentTarget;
    element.classList.toggle("active");
    const content = element.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    }
    else {
      content.style.display = "block";
      if (resourcesContext.serverConfig.loading === "init")
        requestConfig = true;
    }

    if (requestConfig) {
      resourcesContext.loadServerConfiguration();
    }
  };

  /*
   * Ensure the config section is visible, without issuing a request
   */
  const makeVisibleConfigSection = () => {

    /*
     * Find the section using its DOM id
     */
    const element = document.getElementById("configSection");
    const content = element.nextElementSibling;
    if (content.style.display !== "block") {
      content.style.display = "block";
      element.classList.toggle("active");
    }
  };


  /*
   * Handler for change to includeAuditTrail checkbox
   */
  const updateIncAuditTrailOption = () => {
    setIncAuditTrailOption(!incAuditTrailOption);
  }



  const getServerAuditLog = () => {
    let server = resourcesContext.getFocusServer();
    let serverName = server.serverName;
    let platformName = server.platformName;

    requestContext.callPOST("server-instance", serverName,  "server/"+serverName+"/audit-log",
        { serverName : serverName, platformName : platformName }, _getServerAuditLog);
    setAuditLogStatus("pending");
  };

  const _getServerAuditLog = (json) => {
    if (json !== null) {
      if (json.relatedHTTPCode === 200 ) {
        if (auditLog) {
          let auditLog = json.auditLog;
          setAuditLog(auditLog);
          setAuditLogStatus("complete");
          return;
        }
      }
    }
    /*
     * On failure ... json could be null or contain a bad relatedHTTPCode
     */
    reportFailedOperation("getServerAuditLog",json);
  }

  /*
   * Always accept the operation name because operation name is needed even in the case where json is null
   */
  const reportFailedOperation = (operation, json) => {
    if (json !== null) {
      const relatedHTTPCode = json.relatedHTTPCode;
      const exceptionMessage = json.exceptionErrorMessage;
      /*
       * TODO - could be changed to cross-UI means of user notification... for now rely on alerts
       */
      alert("Operation "+operation+" failed with status "+relatedHTTPCode+" and message "+exceptionMessage);
    }
    else {
      alert("Operation "+operation+" did not get a response from the view server");
    }
  }






  const cancelAuditLogModal = () => {
    setAuditLogStatus("idle");
  };

  const submitAuditLogModal = () => {
    setAuditLogStatus("idle");
  };



  /*
   * Handler to render sevrer config audit trail in portal
   */
  const displayServerConfigLog = (serverName, configAuditTrail) => {
    setConfigLog({"serverName" : serverName , "configAuditTrail" : configAuditTrail });
    setConfigLogStatus("complete");
  }

  const cancelConfigLogModal = () => {
    setConfigLogStatus("idle");
  };

  const submitConfigLogModal = () => {
    setConfigLogStatus("idle");
  };

  /*
   * It would be possible to specialize the display of a server depending on its server type.
   * 
   * A View Server can host view-services
   * A Metadata Access Point can host access-services
   * A Metadata Server can host repository-services, access-services
   * etc
   */



  let focus = resourcesContext.focus;
  let serverDetails;
  if (focus.category === "server-instance") {
    serverDetails = resourcesContext.getFocusServer();
    if (!serverDetails) {
      return null;
    }
  }
  else {
    /*
     * The focus is not a server, so do nothing...
     */
    return null;
  }

  /*
   * "loading" will be one of { "init" | "loading" | "loaded"}
   * There should always either be:
   *   no stored config and nothing is loading 
   *   no stored config but it should be loading 
   *   storedConfig is present (although may not be what you ware displaying)
   * There may not be active config (the server may be stopped)
   * There may or may not be differences.
   * The above 3 states are mutually exclusive and are used to dictate what is displayed.
   */

  let storedConfig;
  let activeConfig;
  let matchingConfigs;
  let differences;
  let loading      = resourcesContext.serverConfig.loading;
  if (loading === "loaded") {
    /*
     * Configuration has been loaded, set up the display variables
     */
    storedConfig = resourcesContext.serverConfig.stored;
    activeConfig = resourcesContext.serverConfig.active;
    matchingConfigs = resourcesContext.serverConfig.matching;
    differences  = resourcesContext.serverConfig.diffs;
  }
  else {
    storedConfig = null;
    activeConfig = null;
    matchingConfigs = true;
    differences = null;
  }
  if (loading === "loading") {
    /*
     * A request has been been made to load the configuration - this
     * might have come from the twistie and flipConfigSection or it
     * might have come from the diagram (a right-click menu item).
     * In either case, make sure the config section is visible.
     */
    makeVisibleConfigSection();
  }

  
  /*
   * DisplayMode is initialized to active, but if the server is stopped then when config
   * has been retrieved (not before), there will only be stored config, so override the 
   * initial setting if not already overridden.
   */
  if (loading === "loaded") {
    if (storedConfig && !activeConfig && displayMode !== "stored") {
      /*
       * There is no active config, so despite this being the preferred display
       * revert to stored config instead.
       */
      setDisplayMode("stored");
      
    }
  }
  
  
  let displayedConfig;
  switch (displayMode) {
    case "stored":
      displayedConfig = storedConfig;
      break;
    case "active":
      displayedConfig = activeConfig;
      break;
    case "diffs":
      displayedConfig = null;
      break;
    default:
      console.log("Unknown displayMode: "+displayMode);
      break;
  }

  let serverTypeName        = serverDetails.serverClassification.serverTypeName;
  let serverTypeDescription = serverDetails.serverClassification.serverTypeDescription;

  return (

    <div className="type-details-container">
      <div className="type-details-item-bold">ServerName : {serverDetails.serverName}</div>
      <div className="type-details-item-bold">Description : </div>
      <div className="type-details-item">{serverDetails.description}</div>
      <div className="type-details-item-bold">ServerRootURL : </div>
      <div className="type-details-item">{serverDetails.platformRootURL}</div>
      <div className="type-details-item-bold">Server Origin : </div>
      <div className="type-details-item">{serverDetails.serverOrigin}</div>
      <div className="type-details-item-bold">Server Type : </div>
      <div className="type-details-item">{serverTypeName}</div>
      <div className="type-details-item">{serverTypeDescription}</div>

      <div>
      { (serverTypeName === "Integration Daemon") &&
        <div>
          <button className="collapsible" onClick={flipSection}> Integration Services: </button>
          <div className="content">
            <ServerServicesDisplay serverName={serverDetails.serverName}
                                   platformName={serverDetails.platformName}
                                   qualifiedServerName={serverDetails.qualifiedServerName}
                                   serviceCat="IntegrationService"
                                   serviceList={serverDetails.integrationServices}></ServerServicesDisplay>
          </div>
          <br/>
        </div>
      }
      </div>

      <div>
      { (serverTypeName === "Engine Host Server") &&
        <div>
          <button className="collapsible" onClick={flipSection}> Engine Services: </button>
          <div className="content">
            <ServerServicesDisplay serverName={serverDetails.serverName}
                                   platformName={serverDetails.platformName}
                                   qualifiedServerName={serverDetails.qualifiedServerName}
                                   serviceCat="EngineService"
                                   serviceList={serverDetails.engineServices}></ServerServicesDisplay>
        </div>
        <br/>
      </div>
      }
      </div>

      <div>
      { (serverTypeName === "Metadata Server" || serverTypeName === "Metadata Access Point") &&
        <div>
          <button className="collapsible" onClick={flipSection}> Access Services: </button>
          <div className="content">
              <ServerServicesDisplay serverName={serverDetails.serverName}
                                     platformName={serverDetails.platformName}
                                     qualifiedServerName={serverDetails.qualifiedServerName}
                                     serviceCat="AccessService"
                                     serviceList={serverDetails.accessServices}></ServerServicesDisplay>
          </div>
          <br/>
        </div>
      }
      </div>

      <div>
      { (serverTypeName === "View Server") &&
        <div>
          <button className="collapsible" onClick={flipSection}> View Services: </button>
          <div className="content">
            <ServerServicesDisplay serverName={serverDetails.serverName}
                                   platformName={serverDetails.platformName}
                                   qualifiedServerName={serverDetails.qualifiedServerName}
                                   serviceCat="ViewService"
                                   serviceList={serverDetails.viewServices}></ServerServicesDisplay>
          </div>
          <br/>
        </div>
      }
      </div>

      <div>
      { ( serverTypeName === "Metadata Access Point"   ||
          serverTypeName === "Repository Proxy"        ||
          serverTypeName === "Metadata Server"         ||
          serverTypeName === "Conformance Test Server"   ) &&
        <div>
          <button className="collapsible" onClick={flipSection}> Cohorts: </button>
          <div className="content">
            <ServerCohortsDisplay serverName={serverDetails.serverName}
                                  platformName={serverDetails.platformName}
                                  cohortDetails={serverDetails.cohortDetails}></ServerCohortsDisplay>
          </div>
          <br/>
        </div>
      }
      </div>



      <div>
      <button className="collapsible" id="configSection" onClick={flipConfigSection}> Server Configuration: </button>
        <div className="content">
          <div>
           { (loading === "loading") && <div>Loading...</div>}
          </div>
          <div>
           { (loading === "loaded") &&
            <div>

              <label htmlFor="layoutMode">Display : </label>
                 <input type="radio"
                 className="button-padded"
                 id="modeStored"
                 name="displayMode"
                 value="Stored"
                 checked={displayMode === "stored"}
                 onChange={changeDisplayMode}/>
              <label htmlFor="modeStored">Stored Config</label>

                 <input type="radio"
                 className="button-padded"
                 id="modeActive"
                 name="displayMode"
                 value="Active"
                 checked={displayMode === "active"}
                 disabled={activeConfig === undefined}
                 onChange={changeDisplayMode} />
              <label htmlFor="modeActive">Active Config</label>

                 <input type="radio"
                 className="button-padded"
                 id="modeDiffs"
                 name="displayMode"
                 value="Diffs"
                 checked={displayMode === "diffs"}
                 disabled={activeConfig === undefined}
                 onChange={changeDisplayMode} />
              <label htmlFor="modeDiffs">Differences</label>

              <br/>
              <br/>

              {
              displayedConfig && (displayMode === "stored" || displayMode === "active") &&
              <ul className="details-sublist">

                <li>
                  <div className="type-details-item-bold">Local Server Name : </div>
                  <div className="type-details-item">{
                    displayedConfig && displayedConfig.localServerName} </div>
                </li>

                <li>
                  <div className="type-details-item-bold">Local Server UserId : </div>
                  <div className="type-details-item">{
                    displayedConfig && displayedConfig.localServerUserId}</div>
                </li>

                <li>
                  <div className="type-details-item-bold">Local Server Password : </div>
                  <div className="type-details-item">{
                    displayedConfig && displayedConfig.localServerPassword}</div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> Access Services Configuration: </button>
                  <div className="content">
                    <ServerConfigServicesDisplay services={
                    displayedConfig && displayedConfig.accessServicesConfig}></ServerConfigServicesDisplay>
                  </div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> Common Services Configuration: </button>
                  <div className="content">
                    <ServerConfigServicesDisplay services={
                    displayedConfig && displayedConfig.commonServicesConfig}></ServerConfigServicesDisplay>
                  </div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> Governance Services Configuration: </button>
                  <div className="content">
                    <ServerConfigServicesDisplay services={
                    displayedConfig && displayedConfig.governanceServicesConfig}></ServerConfigServicesDisplay>
                  </div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> View Services Configuration: </button>
                  <div className="content">
                    <ServerConfigServicesDisplay services={
                    displayedConfig && displayedConfig.viewServicesConfig}></ServerConfigServicesDisplay>
                  </div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> Repository Services Configuration: </button>
                  <div className="content">
                    <ServerConfigRepositoryServicesDisplay serverName={serverDetails.serverName} config={
                    displayedConfig && displayedConfig.repositoryServicesConfig}></ServerConfigRepositoryServicesDisplay>
                  </div>
                </li>

                <li>
                  <button className="collapsible" onClick={flipSection}> Event Bus Configuration: </button>
                  <div className="content">
                    <ServerConfigEventBusDisplay config={
                    displayedConfig && displayedConfig.eventBusConfig}></ServerConfigEventBusDisplay>
                  </div>
                </li>

                <li>
                  <button onClick = { () => displayServerConfigLog(serverDetails.serverName, displayedConfig.auditTrail) }>
                    Server Configuration Audit Trail:
                  </button>

                  <ConfigLogHandler   status                = { configLogStatus }
                                      configLog             = { configLog }
                                      onCancel              = { cancelConfigLogModal }
                                      onSubmit              = { submitConfigLogModal } />
                </li>

              </ul>
              }

              {
                (displayMode === "diffs") &&
                <div>

                  {
                    (matchingConfigs === "true") &&
                    <div className="details-message">
                    The active and stored configuration properties match.
                    </div>
                    }

                  {
                    (matchingConfigs === "false") &&
                    <div>

                      <div className="details-message">
                      The active configuration and stored configuration differ as follows:
                      </div>

                      <label htmlFor="incAuditTrail">Include Config Audit Trail entries </label>
                      <input type="checkbox"
                        id="cbIncAuditTrail"
                        name="cbIncAuditTrail"
                        onChange={updateIncAuditTrailOption}
                        checked={ incAuditTrailOption }
                        value={ incAuditTrailOption }  />


                      <ul className="type-details-list">
                        {
                          Object.keys(differences).map( diff =>
                            (incAuditTrailOption || diff.split('.')[0] !== "auditTrail") &&
                            <li className="type-details-item" key={diff}>
                              <div className="div-bold">{diff}</div>
                              <div>Active: {differences[diff].active ? differences[diff].active : <i>blank</i>}</div>
                              <div>Stored: {differences[diff].stored ? differences[diff].stored : <i>blank</i>}</div>
                            </li>
                          )
                        }
                      </ul>
                    </div>
                  }
                </div>
              }

            </div>}
          </div>
        </div>
      </div>

      <button className="collapsible" onClick={flipSection}> Server Status: </button>
      <div className="content">
        <ServerStatusDisplay serverName={serverDetails.serverName} serverStatus={serverDetails.serverStatus}>
        </ServerStatusDisplay>
      </div>
      <br/>

      <button className="collapsible" onClick={flipSection}> Server Audit Log: </button>
      <div className="content">
        <button onClick = { () => getServerAuditLog(serverDetails.guid) }  >
          Get Server Audit Log
        </button>
      </div>

      <AuditLogHandler   status                = { auditLogStatus }
                         auditLog              = { auditLog }
                         onCancel              = { cancelAuditLogModal }
                         onSubmit              = { submitAuditLogModal } />



    </div>
  );


}



ServerDisplay.propTypes = {
  
};


