/// <reference path="../JSBridge.js" />
/// <reference path="../Schema.js" />
/// <reference path="../Enums.js" />
/// <reference path="../Common.js" />
/// <reference path="FollowUpWOHelper.js" />
var FS = FS || {}; 

var Idioma = {
    espanol: 3082,
    ingles: 1033
}
var TrabajosEspeciaes = {
    TrabajosenCaliente: 870280000,
    TrabajosenEspaciosConfinados: 870280001,
};
var IdiomaUsuario = Idioma.espanol;



FS.WorkOrder = {
    oldSystemStatus: null,
    isBillingAccountTaxExempt: false,
    salesTaxCode: null,
    isTaxableWorkType: false,
    originalServiceAccount: null,
    localization: null,

    workOrderOnLoad: function () {
        MobileCRM.UI.EntityForm.onCommand(FS.Common.CustomCommands.customFollowUp, FS.FollowUpWOHelper.FollowUpButton.onButtonClick, true, null);
        MobileCRM.Localization.initialize(FS.WorkOrder.storeLocalization, MobileCRM.bridge.alert);
        MobileCRM.UI.EntityForm.onChange(FS.WorkOrder.handleChange, true, null);
        MobileCRM.UI.EntityForm.onSave(FS.WorkOrder.handleSave, true, null);
        MobileCRM.UI.EntityForm.onPostSave(FS.WorkOrder.handlePostSave, true, null);
        MobileCRM.bridge.onGlobalEvent(FS.Common.Events.workOrderPrimaryIncidentTypeChanged, FS.WorkOrder.handlePrimaryIncidentTypeChange, true);
        FS.FollowUpWOHelper.FollowUpButton.setCanCreateWO(null, null);

        // set "System Status" field to "Open-Unscheduled" on newly created work orders
        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
            if (entityForm && entityForm.entity && entityForm.entity.properties && entityForm.entity.isNew) {
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_systemStatus] = FS.Enums.msdyn_workordermsdyn_SystemStatus.OpenUnscheduled;
            }
            else if (entityForm && entityForm.entity && entityForm.entity.properties) {
                FS.WorkOrder.originalServiceAccount = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount];

                var billingAccount = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_billingAccount];
                if (billingAccount) {
                    MobileCRM.DynamicEntity.loadById(FS.Schema.Account.name, billingAccount.id, function (retrievedBillingAccount) {
                        FS.WorkOrder.isBillingAccountTaxExempt = retrievedBillingAccount.properties[FS.Schema.Account.properties.msdyn_taxExempt] == null ? FS.WorkOrder.isBillingAccountTaxExempt : retrievedBillingAccount.properties[FS.Schema.Account.properties.msdyn_taxExempt];
                    },
                    MobileCRM.bridge.alert);
                }

                var woType = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_workOrderType];
                if (woType) {
                    MobileCRM.DynamicEntity.loadById(FS.Schema.WorkOrderType.name, woType.id, function (retrievedWOType) {
                        FS.WorkOrder.isTaxableWorkType = retrievedWOType.properties[FS.Schema.WorkOrderType.properties.msdyn_taxable] == null ? FS.WorkOrder.isTaxableWorkType : retrievedWOType.properties[FS.Schema.WorkOrderType.properties.msdyn_taxable];
                    },
                    MobileCRM.bridge.alert);
                }

                var taxCode = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxCode];
                if (taxCode) {
                    FS.WorkOrder.salesTaxCode = taxCode;
                }
                else {
                    var serviceAccount = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount];
                    if (serviceAccount) {
                        MobileCRM.DynamicEntity.loadById(FS.Schema.Account.name, serviceAccount.id, function (retrievedServiceAccount) {
                            if (retrievedServiceAccount && retrievedServiceAccount.properties) {
                                FS.WorkOrder.salesTaxCode = retrievedServiceAccount.properties[FS.Schema.Account.properties.msdyn_salesTaxCode] == null ? FS.WorkOrder.salesTaxCode : retrievedServiceAccount.properties[FS.Schema.Account.properties.msdyn_salesTaxCode];
                            }
                        },
                        MobileCRM.bridge.alert);
                    }
                }
            }
        }, MobileCRM.bridge.alert);
    },

    // To be called when a field is changed on the form
    handleChange: function (entityForm) {
        var changedItem = entityForm && entityForm.context && entityForm.context.changedItem;
        var editedEntity = entityForm && entityForm.entity;
        if (editedEntity && editedEntity.properties) {
            switch (changedItem) {
                case FS.Schema.WorkOrder.properties.msdyn_serviceAccount:
                    FS.WorkOrder.setDefaultValuesFromAccount(editedEntity);
                    break;

                case FS.Schema.WorkOrder.properties.msdyn_billingAccount:
                    FS.WorkOrder.billingAccountChanged(editedEntity);
                    break;

                case FS.Schema.WorkOrder.properties.msdyn_taxable:
                    var taxable = editedEntity.properties[FS.Schema.WorkOrder.properties.msdyn_taxable];
                    if (taxable) {
                        FS.WorkOrder.setTaxable(entityForm);
                    }
                    else {
                        editedEntity.properties[FS.Schema.WorkOrder.properties.msdyn_taxCode] = null;
                    }
                    break;

                case FS.Schema.WorkOrder.properties.msdyn_primaryIncidentType:
                    FS.WorkOrder.setIncidentFields(editedEntity);
                    break;
				case FS.Schema.WorkOrder.properties.edprdyn_trabajos_especiales:
                    FS.WorkOrder.onchangeTrabajosEspciales(editedEntity);
                    break;

                case FS.Schema.WorkOrder.properties.msdyn_workOrderType:
                    var woType = editedEntity.properties[FS.Schema.WorkOrder.properties.msdyn_workOrderType];
                    if (woType) {
                        MobileCRM.DynamicEntity.loadById(FS.Schema.WorkOrderType.name, woType.id, function (retrievedWOType) {
                            if (retrievedWOType && retrievedWOType.properties) {
                                FS.WorkOrder.isTaxableWorkType = retrievedWOType.properties[FS.Schema.WorkOrderType.properties.msdyn_taxable] == null ? FS.WorkOrder.isTaxableWorkType : retrievedWOType.properties[FS.Schema.WorkOrderType.properties.msdyn_taxable];
                                MobileCRM.UI.EntityForm.requestObject(function (entityForm2) {
                                    FS.WorkOrder.setTaxable(entityForm2);
                                }, MobileCRM.bridge.alert);
                            }
                        },
                        MobileCRM.bridge.alert);
                    }

                    var serviceAccount = editedEntity && editedEntity.properties && editedEntity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount];
                    if (serviceAccount) {
                        MobileCRM.DynamicEntity.loadById(FS.Schema.Account.name, serviceAccount.id, function (retrievedAccount) {
                            MobileCRM.UI.EntityForm.requestObject(function (entityForm2) {
                                FS.WorkOrder.setPriceList(entityForm2, retrievedAccount);
                            }, MobileCRM.bridge.alert);
                        },
                        MobileCRM.bridge.alert);
                    }
                    else {
                        FS.WorkOrder.setPriceList(entityForm, null);
                    }
                    break;

                default:
                    break;
            }
        }
    },

    handleSave: function (entityForm) {
        var entity = entityForm && entityForm.entity;
        var saveHandler = entityForm.suspendSave();

        if (entity && entity.properties && (entity.properties[FS.Schema.WorkOrder.properties.msdyn_primaryIncidentDescription] || entity.properties[FS.Schema.WorkOrder.properties.msdyn_customerAsset]) && !entity.properties[FS.Schema.WorkOrder.properties.msdyn_primaryIncidentType]) {
            FS.WorkOrder.checkRelatedIncidentExists(entity, saveHandler, FS.WorkOrder.checkRelatedEntitiesDoNotHaveCustomerAsset);
        }
        else {
            FS.WorkOrder.checkRelatedEntitiesDoNotHaveCustomerAsset(entity, saveHandler);
        }
    },

    handlePostSave: function (entityForm) {
        var entity = entityForm && entityForm.entity;
        //var saveHandler = entityForm.suspendPostSave();

//#region MM-4157 2023-08-31
    if (entity && entity.properties && (entity.properties.edprdyn_checklistcode != null && entity.properties.edprdyn_checklistcode != "undefined" || entity.properties.edprdyn_code_special_works != null && entity.properties.edprdyn_code_special_works != "undefined")) {
            var mensagem = "Wait! Generating the questionnaire";

            if (IdiomaUsuario == Idioma.espanol)
                mensagem = "¡Esperar! Generando el cuestionario";

            var wait = MobileCRM.UI.EntityForm.showPleaseWait(mensagem);
            var saveHandler = entityForm.suspendPostSave();
            FS.WorkOrder.createCheckListWorkOrder(entity, saveHandler, wait)
        }
        //#endregion
    },

    checkRelatedIncidentExists: function (entity, saveHandler, callback) {
        var fetchRelatedIncidents = new MobileCRM.FetchXml.Entity(FS.Schema.WorkOrderIncident.name);
        fetchRelatedIncidents.addAttribute(FS.Schema.WorkOrderIncident.properties.msdyn_workOrder);
        fetchRelatedIncidents.filter = new MobileCRM.FetchXml.Filter();
        fetchRelatedIncidents.filter.where(FS.Schema.WorkOrderIncident.properties.msdyn_workOrder, "eq", entity.id);

        var fetch = new MobileCRM.FetchXml.Fetch(fetchRelatedIncidents);
        fetch.execute("Array", function (results) {
            if (results && results.length > 0) {
                callback(entity, saveHandler);
            }
            else {
                saveHandler.resumeSave(FS.WorkOrder.localization.get("Alert.WorkOrder_IncidentTypeRequired"));
            }
        }, function (error) {
            saveHandler.resumeSave(error.message);
        });
    },

    checkRelatedEntitiesDoNotHaveCustomerAsset: function (entity, saveHandler) {
        if (entity && !entity.isNew && entity.properties && entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount] && FS.WorkOrder.originalServiceAccount && entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount].id != FS.WorkOrder.originalServiceAccount.id) {
            var woIncidentFetch = FS.WorkOrder.relatedEntityHasCustomerAsset(entity.id, FS.Schema.WorkOrderIncident);
            var woServiceTaskFetch = FS.WorkOrder.relatedEntityHasCustomerAsset(entity.id, FS.Schema.WorkOrderServiceTask);
            var woProductFetch = FS.WorkOrder.relatedEntityHasCustomerAsset(entity.id, FS.Schema.WorkOrderProduct);
            var woServiceFetch = FS.WorkOrder.relatedEntityHasCustomerAsset(entity.id, FS.Schema.WorkOrderService);

            var keepChecking = true;

            var handleResultOrCallback = function (callback, results) {
                if (keepChecking) {
                    if (results && results.length > 0) {
                        FS.WorkOrder.invalidateServiceAccountChange(saveHandler);
                        keepChecking = false;
                    }
                    else {
                        return callback();
                    }
                }
            };

            FS.Common.executeFetch(woIncidentFetch, "Array", null)
            .then(handleResultOrCallback.bind(null, FS.Common.executeFetch.bind(null, woServiceTaskFetch, "Array", null)))
            .then(handleResultOrCallback.bind(null, FS.Common.executeFetch.bind(null, woProductFetch, "Array", null)))
            .then(handleResultOrCallback.bind(null, FS.Common.executeFetch.bind(null, woServiceFetch, "Array", null)))
            .then(handleResultOrCallback.bind(null, saveHandler.resumeSave))
            .catch(function (error) {
                saveHandler.resumeSave(error.message);
            });
        }
        else {
            saveHandler.resumeSave();
        }
    },

    invalidateServiceAccountChange: function (saveHandler) {
        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
            if (entityForm && entityForm.entity && entityForm.entity.properties) {
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount] = FS.WorkOrder.originalServiceAccount;
                FS.WorkOrder.setDefaultValuesFromAccount(entityForm.entity);
            }
        }, MobileCRM.bridge.alert);
        saveHandler.resumeSave(FS.WorkOrder.localization.get("Alert.WorkOrder_ServiceAccount"));
    },

    relatedEntityHasCustomerAsset: function (workOrderId, relatedEntitySchema) {
        var fetchRelatedEntity = new MobileCRM.FetchXml.Entity(relatedEntitySchema.name);
        fetchRelatedEntity.addAttribute(relatedEntitySchema.properties.msdyn_workOrder);
        fetchRelatedEntity.filter = new MobileCRM.FetchXml.Filter();
        fetchRelatedEntity.filter.where(relatedEntitySchema.properties.msdyn_workOrder, "eq", workOrderId);
        fetchRelatedEntity.filter.where(relatedEntitySchema.properties.msdyn_customerAsset, "not-null");

        return new MobileCRM.FetchXml.Fetch(fetchRelatedEntity);
    },

    // Use the assigned Service Account to set corresponding fields on this Work Order
    setDefaultValuesFromAccount: function (editedEntity) {
        var serviceAccount = editedEntity && editedEntity.properties && editedEntity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceAccount];

        if (serviceAccount) {
            MobileCRM.DynamicEntity.loadById(FS.Schema.Account.name, serviceAccount.id, function (retrievedAccount) {
                if (retrievedAccount && retrievedAccount.properties) {
                    MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                        if (entityForm && entityForm.entity && entityForm.entity.properties) {
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_addressName] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Name] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_address1] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Line1] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_address2] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Line2] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_address3] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Line3] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_city] = retrievedAccount.properties[FS.Schema.Account.properties.address1_City] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_stateOrProvince] = retrievedAccount.properties[FS.Schema.Account.properties.address1_StateOrProvince] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_country] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Country] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_postalCode] = retrievedAccount.properties[FS.Schema.Account.properties.address1_PostalCode] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_longitude] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Longitude] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_latitude] = retrievedAccount.properties[FS.Schema.Account.properties.address1_Latitude] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_instructions] = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_workOrderInstructions] || null;

                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxCode] = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_salesTaxCode] || null;
                            FS.WorkOrder.salesTaxCode = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_salesTaxCode] || null;

                            FS.WorkOrder.setPriceList(entityForm, retrievedAccount);

                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_billingAccount] = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_billingAccount] || retrievedAccount;
                            FS.WorkOrder.billingAccountChanged(entityForm.entity);

                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.transactionCurrencyId] = retrievedAccount.properties[FS.Schema.Account.properties.transactionCurrencyId] || null;
                            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_serviceTerritory] = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_serviceTerritory] || null;
                        }
                    }, MobileCRM.bridge.alert);
                }
            },
            MobileCRM.bridge.alert);
        }
    },

    // Set the price list from the specified account or, if there is no default price level for that account, use the Work Order Type's price list
    setPriceList: function (entityForm, account) {
        if (account && account.properties && account.properties[FS.Schema.Account.properties.defaultPriceLevelId]) {
            entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_priceList] = account.properties[FS.Schema.Account.properties.defaultPriceLevelId];
        }
        else {
            var woType = entityForm && entityForm.entity && entityForm.entity.properties && entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_workOrderType];
            if (woType) {
                MobileCRM.DynamicEntity.loadById(FS.Schema.WorkOrderType.name, woType.id, function (retrievedWOType) {
                    if (retrievedWOType && retrievedWOType.properties) {
                        MobileCRM.UI.EntityForm.requestObject(function (entityForm2) {
                            if (entityForm2 && entityForm2.entity && entityForm2.entity.properties) {
                                entityForm2.entity.properties[FS.Schema.WorkOrder.properties.msdyn_priceList] = retrievedWOType.properties[FS.Schema.WorkOrderType.properties.msdyn_priceList] || null;
                            }
                        }, MobileCRM.bridge.alert);
                    }
                },
                MobileCRM.bridge.alert);
            }
        }
    },

    // Set the taxable and sales tax code fields based on if the billing account is tax exempt or not and if the work order type is taxable
    setTaxable: function (entityForm) {
        if (entityForm && entityForm.entity && entityForm.entity.properties) {
            var taxable = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxable];

            if (!FS.WorkOrder.isBillingAccountTaxExempt) {
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxable] = FS.WorkOrder.isTaxableWorkType;
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxCode] = FS.WorkOrder.isTaxableWorkType ? FS.WorkOrder.salesTaxCode : null;
            }
            else if (taxable) {
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxable] = false;
                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_taxCode] = null;
            }
        }
    },
    
    billingAccountChanged: function (entity) {
        if (entity && entity.properties) {
            var billingAccount = entity.properties[FS.Schema.WorkOrder.properties.msdyn_billingAccount];
            if (billingAccount) {
                MobileCRM.DynamicEntity.loadById(FS.Schema.Account.name, billingAccount.id, function (retrievedAccount) {
                    if (retrievedAccount && retrievedAccount.properties) {
                        FS.WorkOrder.isBillingAccountTaxExempt = retrievedAccount.properties[FS.Schema.Account.properties.msdyn_taxExempt] == null ? false : retrievedAccount.properties[FS.Schema.Account.properties.msdyn_taxExempt];
                        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                            FS.WorkOrder.setTaxable(entityForm);
                        }, MobileCRM.bridge.alert);
                    }
                },
                MobileCRM.bridge.alert);
            }
        }
    },

    // Set the primary incident related fields based on the specified primary incident type
    setIncidentFields: function (entity) {
        if (entity && entity.properties) {
            var primaryIncidentType = entity.properties[FS.Schema.WorkOrder.properties.msdyn_primaryIncidentType];
            if (primaryIncidentType) {
                MobileCRM.DynamicEntity.loadById(FS.Schema.IncidentType.name, primaryIncidentType.id, function (retrievedIncidentType) {
                    if (retrievedIncidentType && retrievedIncidentType.properties) {
                        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                            if (entityForm && entityForm.entity && entityForm.entity.properties) {
                                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_primaryIncidentEstimatedDuration] = retrievedIncidentType.properties[FS.Schema.IncidentType.properties.msdyn_estimatedDuration] || null;
                                entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_primaryIncidentDescription] = retrievedIncidentType.properties[FS.Schema.IncidentType.properties.msdyn_description] || null;

                                var currentType = entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_workOrderType];
                                if (!currentType) {
                                    entityForm.entity.properties[FS.Schema.WorkOrder.properties.msdyn_workOrderType] = retrievedIncidentType.properties[FS.Schema.IncidentType.properties.msdyn_defaultWorkOrderType];
                                }
                            }
                        }, MobileCRM.bridge.alert);
                    }
                },
                MobileCRM.bridge.alert);
            }
        }
    },

    handlePrimaryIncidentTypeChange: function () {
        MobileCRM.UI.EntityForm.refreshForm();
    },

    storeLocalization: function (localization) {
        FS.WorkOrder.localization = localization;

        MobileCRM.Localization.getLoadedLangId(
            function (loadedLangId) {
                FS.WorkOrder.getlocalization(loadedLangId);
            },
            FS.WorkOrder.onError,
            null
        );

    },
	
	
    onError: function () {

    },

    getlocalization: function startPointFn(loadedLangId) {
        /// <summary>
        /// Selecciona el idioma que tenga establecido 
        /// </summary>
        /// <param name="loadedLangId">Identificador del idioma</param>
        /// <returns></returns>
        if (loadedLangId == "es-ES")
            IdiomaUsuario = Idioma.espanol;
        else
            IdiomaUsuario = Idioma.ingles;

    },
  
     
    //#region MM-4157 2023-08-31
    createCheckListWorkOrder: async function (entity, saveHandler, wait) {

        await setTimeout(async () => {
            workOrderName = await FS.WorkOrder.getWorOrderName(entity, saveHandler, wait);
        }, 2000);
    },

        createCheckList: function (workOrderId, workOrderName, entity, saveHandler, wait) {
        var codCheckList = entity.properties.edprdyn_checklistcode;
        var numeroCobra = entity.properties.edprdyn_numerocasocobra;


        if (codCheckList != null) {
            var fetchSimonCheckList = FS.WorkOrder.fetchSimonCheckList(codCheckList);
            MobileCRM.FetchXml.Fetch.executeFromXML(
                fetchSimonCheckList,
                function (result) {
                    for (var i = 0; i < result.length; i++) {
                        //#region Checklist RESCO contém dados
                        if (result[i][0] != null) {
                            //[0] = edprdyn_checklistrescoid
                            var checkListRescodId = result[i][0].id;
                            var fetchQuestionnaire = FS.WorkOrder.fetchQuestionnaireTemplate(checkListRescodId);

                            MobileCRM.FetchXml.Fetch.executeFromXML(
                                fetchQuestionnaire,
                                function (resultQuestionnaire) {
                                    if (resultQuestionnaire.length > 0) {
                                        FS.WorkOrder.createQuestionnaire(resultQuestionnaire, workOrderId, workOrderName, checkListRescodId, saveHandler, wait);
                                    }
                                },
                                function (err) {
                                    wait.close();
                                    saveHandler.resumePostSave();
                                }
                            );

                        }
                        //#endregion

                        //#region Update Work Order
                        if (numeroCobra == null && result[i][2] != null) {
                            //[2] = edprdyn_numerocasocobra
                            var workOrder = new MobileCRM.DynamicEntity("msdyn_workorder", workOrderId);
                            var props = workOrder.properties;
                            props.edprdyn_numerocasocobra = result[i][2];

                            workOrder.save(
                                function (err) {
                                    if (err) {
                                        wait.close();
                                        MobileCRM.bridge.alert("An error occurred: " + err);
                                        saveHandler.resumePostSave();
                                    }
                                    else if (codSW == null) {
                                        wait.close();
                                        saveHandler.resumePostSave();
                                    }
                                }
                            );
                        }
                        //#endregion

                    }

                    if (result.length == 0 && codSW == null) {
                        wait.close();
                        saveHandler.resumePostSave();
                    }
                },
                function (err) {
                    wait.close();
                    saveHandler.resumePostSave();

                },
            );
        }
        //#region MM-6067 EUR- Trabajos en caliente-RESCO
        var codSW = entity.properties.edprdyn_code_special_works;
        if (codSW != null) {
            var fetchSimonCheckList = FS.WorkOrder.fetchSimonCheckList(codSW);

            MobileCRM.FetchXml.Fetch.executeFromXML(
                fetchSimonCheckList,
                function (result) {
                    for (var i = 0; i < result.length; i++) {
                        //#region Checklist RESCO contém dados
                        if (result[i][0] != null) {
                            //[0] = edprdyn_checklistrescoid
                            var checkListRescodId = result[i][0].id;
                            var fetchQuestionnaire = FS.WorkOrder.fetchQuestionnaireTemplate(checkListRescodId);

                            MobileCRM.FetchXml.Fetch.executeFromXML(
                                fetchQuestionnaire,
                                function (resultQuestionnaire) {
                                    if (resultQuestionnaire.length > 0) {
                                        FS.WorkOrder.createQuestionnaire(resultQuestionnaire, workOrderId, workOrderName, checkListRescodId, saveHandler, wait);
                                    }
                                },
                                function (err) {
                                    wait.close();
                                    saveHandler.resumePostSave();
                                }
                            );

                        } else {
                            wait.close();
                            saveHandler.resumePostSave();
                        }
                        //#endregion
                    }
                    if (result.length == 0) {
                        wait.close();
                        saveHandler.resumePostSave();
                    }
                },
                function (err) {
                    wait.close();
                    saveHandler.resumePostSave();

                },
            );
        }
        //#endregion

        if (codCheckList == null && codSW == null) {
            wait.close();
            saveHandler.resumePostSave();
        }
    },

    fetchSimonCheckList: function (codCheckList) {

        var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "  <entity name='edprdyn_simonchecklist'>"
            + "    <attribute name='edprdyn_checklistrescoid' />"
            + "    <attribute name='edprdyn_documento' />"
            + "    <attribute name='edprdyn_numerocasocobra' />"
            + "    <attribute name='edprdyn_simonchecklistid' />"
            + "    <filter type='and'>"
            + "      <condition attribute='edprdyn_checklistcode' operator='eq' value='" + codCheckList + "' />"
            + "      <condition attribute='statuscode' operator='eq' value='1' />"
            + "    </filter>"
            + "  </entity>"
            + "</fetch>";

        return fetchXml;
    },
    fetchQuestionnaireTemplate: function (checkListRescodId) {

        var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "  <entity name='resco_questionnaire'>"
            + "    <attribute name='resco_completionstatus' />"
            + "    <attribute name='resco_name' />"
            + "    <attribute name='resco_description' />"
            + "    <attribute name='resco_featureversion' />"
            + "    <attribute name='resco_folderid' />"
            + "    <attribute name='resco_layout' />"
            + "    <attribute name='resco_options' />"
            + "    <attribute name='resco_rules' />"
            + "    <attribute name='resco_autoreport' />"
            + "    <attribute name='resco_reportingproperties' />"
            + "    <attribute name='resco_script' />"
            + "    <attribute name='resco_styles' />"
            + "    <attribute name='resco_questionnaireid' />"
            + "    <attribute name='resco_version' />"
            + "    <attribute name='resco_versionname' />"
            + "    <filter type='and'>"
            + "      <condition attribute='resco_questionnaireid' operator='eq' value='" + checkListRescodId + "' />"
            + "    </filter>"
            + "  </entity>"
            + "</fetch>";

        return fetchXml;
    },
    createQuestionnaire: function (resultQuestionnaire, workOrderId, workOrderName, checkListRescodId, saveHandler, wait) {
        var questionnarieId = null;
        var newQuestionnarie = new MobileCRM.DynamicEntity.createNew("resco_questionnaire");
        var props = newQuestionnarie.properties;
        props.resco_issnippet = false;
        props.resco_istemplate = false;
        props.resco_templatedependent = false;

        props.atos_ordendetrabajoid = new MobileCRM.Reference(
            "msdyn_workorder",
            workOrderId,
            workOrderName
        );
        props.resco_regardingid = workOrderId;
        props.resco_regardingidlabel = workOrderName;
        props.resco_regardingidname = "msdyn_workorder";
        props.resco_reusefromprevious = 473220000;

        props.resco_completionstatus = resultQuestionnaire[0][0] || null;
        props.resco_name = resultQuestionnaire[0][1] || null;
        props.resco_description = resultQuestionnaire[0][2] || null;
        props.resco_featureversion = resultQuestionnaire[0][3] || null;
        props.resco_folderid = resultQuestionnaire[0][4] || null;
        props.resco_layout = resultQuestionnaire[0][5] || null;
        props.resco_options = resultQuestionnaire[0][6] || null;
        props.resco_rules = resultQuestionnaire[0][7] || null;
        props.resco_autoreport = resultQuestionnaire[0][8] || null;
        props.resco_reportingproperties = resultQuestionnaire[0][9] || null;
        props.resco_script = resultQuestionnaire[0][10] || null;
        props.resco_styles = resultQuestionnaire[0][11] || null;

        if (resultQuestionnaire[0][12] != null) {
            props.resco_templateid = new MobileCRM.Reference(
                "resco_questionnaire",
                checkListRescodId,
                resultQuestionnaire[0][1]
            );
        }
        props.resco_version = resultQuestionnaire[0][13] || null;
        props.resco_versionname = resultQuestionnaire[0][14] || null;

        newQuestionnarie.save(function (err) {
            if (err) {
                wait.close();
                MobileCRM.bridge.alert("An error occurred: " + err);
                saveHandler.resumePostSave();
            }
            else {
                questionnarieId = this.id;
                var questionnarieName = resultQuestionnaire[0][1] || null;

                //#region Question
                var fetchQuestion = FS.WorkOrder.fetchQuestion(checkListRescodId);
                MobileCRM.FetchXml.Fetch.executeFromXML(
                    fetchQuestion,
                    function (resultQuestion) {
                        FS.WorkOrder.createQuestion(resultQuestion, 0, questionnarieId, questionnarieName, null, null, checkListRescodId, workOrderId, workOrderName, saveHandler, wait);
                    },
                    function (err) {
                        wait.close();
                        saveHandler.resumePostSave();
                    },
                );
                //#endregion
            }
        });
    },
    fetchQuestion: function (questionnarie) {

        var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "<entity name='resco_question'>"
            + "    <attribute name='resco_displayformat' />"
            + "    <attribute name='resco_enabled' />"
            + "    <attribute name='resco_index' />"
            + "    <attribute name='resco_kind' />"
            + "    <attribute name='resco_name' />"
            + "    <attribute name='resco_required' />"
            + "    <attribute name='resco_isseparator' />"
            + "    <attribute name='resco_answerstorage' />"
            + "    <attribute name='resco_defaultvalue' />"
            + "    <attribute name='resco_description' />"
            + "    <attribute name='resco_label' />"
            + "    <attribute name='resco_layout' />"
            + "    <attribute name='resco_max' />"
            + "    <attribute name='resco_min' />"
            + "    <attribute name='resco_options' />"
            + "    <attribute name='resco_precision' />"
            + "    <attribute name='resco_reportingproperties' />"
            + "    <attribute name='resco_rules' />"
            + "    <attribute name='resco_showonreport' />"
            + "    <attribute name='resco_style' />"
            + "    <attribute name='resco_value' />"
            + "    <attribute name='resco_valuelabel' />"
            + "    <attribute name='resco_visible' />"
            + "    <filter type='and'>"
            + "      <condition attribute='resco_questionnaireid' operator='eq' value='" + questionnarie + "' />"
            + "      <condition attribute='resco_questiongroupid' operator='null' />"
            + "    </filter>"
            + "  </entity>"
            + "</fetch>";

        return fetchXml;
    },
    createQuestion: async function (resultQuestion, group, questionnarieId, questionnarieName, questionGroupId, questionGroupName, checkListRescodId, workOrderId, workOrderName, saveHandler, wait) {
        var controle = 0;
        var a = 0;
        var fetchQuestionGroup = FS.WorkOrder.fetchQuestionGroup(checkListRescodId);

        for (var i = 0; i < resultQuestion.length; i++) {

            var newQuestion = new MobileCRM.DynamicEntity.createNew("resco_question");
            var props = newQuestion.properties;

            props.resco_questionnaireid = new MobileCRM.Reference(
                "resco_questionnaire",
                questionnarieId,
                questionnarieName
            );

            if (group == 1) {
                props.resco_questiongroupid = new MobileCRM.Reference(
                    "resco_questiongroup",
                    questionGroupId,
                    questionGroupName
                );
            }

            props.resco_displayformat = resultQuestion[i][0] || null;

            if (resultQuestion[i][1] == "True")
                props.resco_enabled = true;
            else
                props.resco_enabled = false;

            if (resultQuestion[i][6] == "True")
                props.resco_isseparator = true;
            else
                props.resco_isseparator = false;

            if (resultQuestion[i][22] == "True")
                props.resco_visible = true;
            else
                props.resco_visible = false;

            if (resultQuestion[i][18] == "True")
                props.resco_showonreport = true;
            else
                props.resco_showonreport = false;


            var rescoName = resultQuestion[i][4] || null;

            props.resco_index = resultQuestion[i][2] || null;
            props.resco_kind = resultQuestion[i][3] || null;
            props.resco_name = rescoName;
            props.resco_required = resultQuestion[i][5] || null;
            props.resco_answerstorage = resultQuestion[i][7] || null;
            props.resco_defaultvalue = resultQuestion[i][8] || null;
            props.resco_description = resultQuestion[i][9] || null;
            props.resco_label = resultQuestion[i][10] || null;
            props.resco_layout = resultQuestion[i][11] || null;
            props.resco_max = resultQuestion[i][12] || null;
            props.resco_min = resultQuestion[i][13] || null;
            props.resco_options = resultQuestion[i][14] || null;
            props.resco_precision = resultQuestion[i][15] || null;
            props.resco_reportingproperties = resultQuestion[i][16] || null;
            props.resco_rules = resultQuestion[i][17] || null;
            props.resco_style = resultQuestion[i][19] || null;


            if (rescoName == "work-order" || rescoName == "work-order_1") {
                props.resco_value = "msdyn_workorder," + workOrderId + "," + workOrderName;
                props.resco_valuelabel = workOrderName;
                props.resco_rawidvalue = workOrderId;
            } else {
                props.resco_value = resultQuestion[i][20] || null;
                props.resco_valuelabel = resultQuestion[i][21] || null;
            }

            var questionId = null;
            newQuestion.save(function (err) {
                if (err) {
                    wait.close();
                    MobileCRM.bridge.alert("An error occurred: " + err);
                    saveHandler.resumePostSave();
                }
                else {
                    questionId = this.id;

                    if ((controle == resultQuestion.length - 1) && group == 0) {

                        MobileCRM.FetchXml.Fetch.executeFromXML(
                            fetchQuestionGroup,
                            function (resultQuestionGroup) {

                                FS.WorkOrder.createQuestionGroup(resultQuestionGroup, questionnarieId, questionnarieName, workOrderId, workOrderName, saveHandler, wait);

                            },
                            function (err) {
                                wait.close();
                                saveHandler.resumePostSave();
                            },
                        );
                    }
                    controle++;
                }

            });
        }

        if (resultQuestion.length == 0) {
            MobileCRM.FetchXml.Fetch.executeFromXML(
                fetchQuestionGroup,
                function (resultQuestionGroup) {

                    FS.WorkOrder.createQuestionGroup(resultQuestionGroup, questionnarieId, questionnarieName, workOrderId, workOrderName, saveHandler, wait);

                },
                function (err) {
                    wait.close();
                    saveHandler.resumePostSave();
                },
            );
        }
    },

    getWorOrderName: function (entity, saveHandler, wait) {

        var workOrderId = entity.properties.msdyn_workorderid;

        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
            MobileCRM.DynamicEntity.loadById(FS.Schema.WorkOrder.name, workOrderId, function (retrieveWorkOrder) {
                workOrderName = retrieveWorkOrder.properties[FS.Schema.WorkOrder.properties.msdyn_name] != null ? retrieveWorkOrder.properties[FS.Schema.WorkOrder.properties.msdyn_name] : null;
                FS.WorkOrder.createCheckList(workOrderId, workOrderName, entity, saveHandler, wait)

            });
        });

    },
    createFromGroupQuestion: function (questionnarieId, questionnarieName, questionGroupId, questionGroupName, resultQuestion, workOrderId, workOrderName, saveHandler, wait) {

        for (var x = 0; x < resultQuestion.length; x++) {

            var newQuestion = new MobileCRM.DynamicEntity.createNew("resco_question");
            var props = newQuestion.properties;

            props.resco_questionnaireid = new MobileCRM.Reference(
                "resco_questionnaire",
                questionnarieId,
                questionnarieName
            );


            props.resco_questiongroupid = new MobileCRM.Reference(
                "resco_questiongroup",
                questionGroupId,
                questionGroupName
            );


            props.resco_displayformat = resultQuestion[x][0] || null;

            if (resultQuestion[x][1] == "True")
                props.resco_enabled = true;
            else
                props.resco_enabled = false;

            if (resultQuestion[x][6] == "True")
                props.resco_isseparator = true;
            else
                props.resco_isseparator = false;

            if (resultQuestion[x][22] == "True")
                props.resco_visible = true;
            else
                props.resco_visible = false;

            if (resultQuestion[x][18] == "True")
                props.resco_showonreport = true;
            else
                props.resco_showonreport = false;

            var rescoName = resultQuestion[x][4] || null;

            props.resco_index = resultQuestion[x][2] || null;
            props.resco_kind = resultQuestion[x][3] || null;
            props.resco_name = rescoName;
            props.resco_required = resultQuestion[x][5] || null;
            props.resco_answerstorage = resultQuestion[x][7] || null;
            props.resco_defaultvalue = resultQuestion[x][8] || null;
            props.resco_description = resultQuestion[x][9] || null;
            props.resco_label = resultQuestion[x][10] || null;
            props.resco_layout = resultQuestion[x][11] || null;
            props.resco_max = resultQuestion[x][12] || null;
            props.resco_min = resultQuestion[x][13] || null;
            props.resco_options = resultQuestion[x][14] || null;
            props.resco_precision = resultQuestion[x][15] || null;
            props.resco_reportingproperties = resultQuestion[x][16] || null;
            props.resco_rules = resultQuestion[x][17] || null;
            props.resco_style = resultQuestion[x][19] || null;
            //   props.resco_value = resultQuestion[x][20] || null;
            //   props.resco_valuelabel = resultQuestion[x][21] || null;

            if (rescoName == "work-order" || rescoName == "work-order_1") {
                props.resco_value = "msdyn_workorder," + workOrderId + "," + workOrderName;
                props.resco_valuelabel = workOrderName;
                props.resco_rawidvalue = workOrderId;
            } else {
                props.resco_value = resultQuestion[x][20] || null;
                props.resco_valuelabel = resultQuestion[x][21] || null;
            }

            var questionId = null;
            newQuestion.save(function (err) {
                if (err) {
                    wait.close();
                    MobileCRM.bridge.alert("An error occurred: " + err);
                    saveHandler.resumePostSave();
                } else {
                    questionId = this.id;

                    console.log(resultQuestion.length + " ----- " + x)
                    if (x == resultQuestion.length) {
                        wait.close();
                        saveHandler.resumePostSave();
                    }
                }
            });
        }

        if (resultQuestion.length == 0) {
            wait.close();
            saveHandler.resumePostSave();
        }
    },
    fetchQuestionGroup: function (questionnarie) {

        var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "  <entity name='resco_questiongroup'>"
            + "    <attribute name='resco_name' />"
            + "    <attribute name='resco_expanded' />"
            + "    <attribute name='resco_index' />"
            + "    <attribute name='resco_label' />"
            + "    <attribute name='resco_layout' />"
            + "    <attribute name='resco_repeatconfig' />"
            + "    <attribute name='resco_repeatindex' />"
            + "    <attribute name='resco_reportingproperties' />"
            + "    <attribute name='resco_rules' />"
            + "    <attribute name='resco_visible' />"
            + "    <attribute name='resco_questiongroupid' />"
            + "    <filter type='and'>"
            + "      <condition attribute='resco_questionnaireid' operator='eq' value='" + questionnarie + "' />"
            + "    </filter>"
            + "  </entity>"
            + "</fetch>";

        return fetchXml;
    },
    createQuestionGroup: function (resultQuestionGroup, questionnarieId, questionnarieName, workOrderId, workOrderName, saveHandler, wait) {

        for (var a = 0; a < resultQuestionGroup.length; a++) {

            var newQuestionGroup = new MobileCRM.DynamicEntity.createNew("resco_questiongroup");
            var props = newQuestionGroup.properties;

            props.resco_questionnaireid = new MobileCRM.Reference(
                "resco_questionnaire",
                questionnarieId,
                questionnarieName
            );

            props.resco_name = resultQuestionGroup[a][0] || null;
            props.resco_index = resultQuestionGroup[a][2] || null;
            props.resco_label = resultQuestionGroup[a][3] || null;
            props.resco_layout = resultQuestionGroup[a][4] || null;
            props.resco_repeatconfig = resultQuestionGroup[a][5] || null;
            props.resco_repeatindex = resultQuestionGroup[a][6] || null;
            props.resco_reportingproperties = resultQuestionGroup[a][7] || null;
            props.resco_rules = resultQuestionGroup[a][8] || null;

            if (resultQuestionGroup[a][1] == "True")
                props.resco_expanded = true;
            else
                props.resco_expanded = false;

            if (resultQuestionGroup[a][9] == "True")
                props.resco_visible = true;
            else
                props.resco_visible = false;
            newQuestionGroup.save(function (err) {
                if (err) {
                    wait.close();
                    MobileCRM.bridge.alert("An error occurred: " + err);
                    saveHandler.resumePostSave();
                }
                else {
                    var newQuestionGroupId = this.id;
                    for (var i = 0; i < resultQuestionGroup.length; i++) {
                        var questionGroupName = resultQuestionGroup[i][0];

                        if (this.primaryName == questionGroupName) {
                            var questionGroupId = resultQuestionGroup[i][10];
                            var fetchQuestionGroup = FS.WorkOrder.fetchQuestionFromGroup(questionGroupId);

                            MobileCRM.FetchXml.Fetch.executeFromXML(
                                fetchQuestionGroup,
                                function (resultQuestion) {
                                    FS.WorkOrder.createFromGroupQuestion(questionnarieId, questionnarieName, newQuestionGroupId, questionGroupName, resultQuestion, workOrderId, workOrderName, saveHandler, wait);
                                },
                                function (err) {
                                    wait.close();
                                    MobileCRM.bridge.alert("An error occurred: " + err);
                                    saveHandler.resumePostSave();
                                },
                            );
                        }
                    }
                }
            });
        }

        if (resultQuestionGroup.length == 0) {
            wait.close();
            saveHandler.resumePostSave();
        }
    },
    fetchQuestionFromGroup: function (questionGruoId) {

        var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
            + "  <entity name='resco_question'>"
            + "    <attribute name='resco_displayformat' />"
            + "    <attribute name='resco_enabled' />"
            + "    <attribute name='resco_index' />"
            + "    <attribute name='resco_kind' />"
            + "    <attribute name='resco_name' />"
            + "    <attribute name='resco_required' />"
            + "    <attribute name='resco_isseparator' />"
            + "    <attribute name='resco_answerstorage' />"
            + "    <attribute name='resco_defaultvalue' />"
            + "    <attribute name='resco_description' />"
            + "    <attribute name='resco_label' />"
            + "    <attribute name='resco_layout' />"
            + "    <attribute name='resco_max' />"
            + "    <attribute name='resco_min' />"
            + "    <attribute name='resco_options' />"
            + "    <attribute name='resco_precision' />"
            + "    <attribute name='resco_reportingproperties' />"
            + "    <attribute name='resco_rules' />"
            + "    <attribute name='resco_showonreport' />"
            + "    <attribute name='resco_style' />"
            + "    <attribute name='resco_value' />"
            + "    <attribute name='resco_valuelabel' />"
            + "    <attribute name='resco_visible' />"
            + "    <filter type='and'>"
            + "      <condition attribute='resco_questiongroupid' operator='eq' value='" + questionGruoId + "' />"
            + "    </filter>"
            + "  </entity>"
            + "</fetch>";

        return fetchXml;
    },
    //#endregion

    //#region MM-6067 EUR- Trabajos en caliente-RESCO
    onchangeTrabajosEspciales: function (entity) {
        var cod = null;
        var trabajoEspeciales = entity.properties.edprdyn_trabajos_especiales;
        if (trabajoEspeciales != null) {
            switch (trabajoEspeciales) {
                case TrabajosEspeciaes.TrabajosenCaliente:
                    cod = "SW_Hot_Conditions";
                    break;
                case TrabajosEspeciaes.TrabajosenEspaciosConfinados:
                    cod = "SW_Confined_Spaces";
                    break;
            }
        }
        entity.properties.edprdyn_code_special_works = cod;
    },
    //#endregion

};