if (typeof (OrdenTrabajo) == "undefined") { OrdenTrabajo = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;

//#region Variables GLOBALES
var _Contador = 0;
var _array = ["", "", "", "", "", "", "", ""];
var _NiteracionT = 0;
var _Texto_breve_ID = "";
var debug = true;
var j = 0;

var isWorkOrderNew = false;
var hojaRutaLK = null;
var workOrderClassCode = null;

var atos_region = null;
var isUserRegionNA = false;
var isUserRegionEU = false;
var isUserWithNoRegion = false;
var UserRegion = {
	EU: 300000000,
	NA: 300000001
}
//#endregion

//#region ENUMERADOS
var StatusCode = {
    OrdenAbierta: 1,
    OrdenCerrada: 2,
    OrdenLiberada: 300000000,
    OrdenCostes: 300000001,
    OrdenImpreso: 300000002,
    OrdenNotificada: 300000003,
    OrdenNotificadaParcial: 300000004,
    OrdenBorrada: 300000005,
    OrdenOfertacreada: 300000006,
    OrdenOfertaaceptada: 300000007,
    OrdenFacturado: 300000008,
    OrdenFacturadopracial: 300000009,
    OrdenSealizada: 300000010,
    OrdenEnEjecucion: 300000011,
    OrdenFinTrabajos: 300000012,
    OrdenListaRiesgos: 300000013,
    OrdenValorado: 300000014,
    OrdenCerradoTecnicamente: 300000015,
    OrdenBloquearTecnicamente: 300000016,
    OrdenBloquear: 300000017
}
var CategoriaProceso = {
    Proceso_Abierto: 0,
    Proceso_Liberado: 1,
    Proceso_Notificado: 2,
    Proceso_NotificadoParcial: 3,
    Proceso_Bloqueo: 4,
    Proceso_CerradoTecnico: 5,
    Proceso_Cerrado: 6,
    Proceso_Borrado: 7
}
//var ItemCategory = {
//    L_StockItem: 300000001,
//    Y_MaterialWithoutEDPRCode_RO: 300000002,
//    N_NonStockItem: 300000003,
//    R_VariableSizeItem: 300000004,
//    T_NoPartsUsed: 300000000
//}
//var Origin = {
//    Resco = 300000002
//}
var estadoUsuarioInicialId;
var estadoSistemaInicialId;
var esNuevo = false;
var claveZPM1;
var codigoCOPE = "E0017";
var estaProgramada = false;

// valores de autorizaciones para la creacion
var TipoPermisoAuthSite;
var PermisoAuthSiteId;
var TipoPermisoAuthRegional;
var PermisoAuthRegionalId;
// valores de autorizaciones para la creacion
var AutorizacionId;
var TipoAutorizacionId;

var avisoCodigoCRM = null;
var claveControlId = null;

var CodigoRegional = "";
var CodigoSite = "";

var lanzadoPuestaEnMarcha = false;

var enviadoASAP = false;

//VARIABLES DEL CAMBIO DE UBICACION
var ubicacionSelecionada = null;
var cancelUbicacionSelecionada = false;
var cambioUbicacion;
var cambioOperaciones;

var esJefeParque = false;
var jefeParque = false;
// VARIABLES DE CREACION DE CLASE DE ACTIVIDADES	
var claseActividad;
/// REDMMINE: 21808
/// FUNCIONALIDAD DE  NO PART USED
var CrearComponenteNoPartUsed = null;
var PadreSincronizado = true;
var esZPM0Padre = true;
var equipoInicial = null;
var equipoIdAntiguo;
//23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
var otsSinComponentes = "";

FS.OrdenTrabajo = {

    //#region LoadOrden

    /// <summary>
    /// Cuando se carga la pantalla de  orden de trabajo y asigna los eventos que se podran realizar
    /// </summary>
    OrdenTrabajoOnLoad: function () {
        var self = this;
        //debugger;

        //MM-3674
        MobileCRM.bridge.onGlobalEvent("EntityFormClosed", function (closedEntityForm) {
            if (closedEntityForm.entity.entityName === "atos_componenteoperacion") {
                MobileCRM.UI.EntityForm.refreshForm();
            }
        }, true);

        //MM-133
        //MobileCRM.bridge.onGlobalEvent("onChange", function (closedEntityForm) {
        //    if (closedEntityForm.entity.entityName === "resco_questionnaire") {
        //        MobileCRM.bridge.alert("i'm back from a questionnaire");
        //    }
        //}, true);

        MobileCRM.bridge.enableDebug();

        // se coge el idioma
        MobileCRM.Localization.getLoadedLangId(
            function (loadedLangId) {
                FS.CommonEDPR.localization(loadedLangId);
            },
            FS.CommonEDPR.onError,
            null
        );

        // se carga la region 
        FS.CommonEDPR.ObtenerRegionUsuario();
		
		self.set_atos_region();

        /// <summary>
        /// Evento load
        /// </summary>
        /// <param name='closedEntityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario que se ha cerrado.</param>
        MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
                isWorkOrderNew = entityForm.entity.isNew;
                formulario = entityForm;
                self.onLoad(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );

        /// <summary>
        /// Evento on change
        /// </summary>
        /// <param name='closedEntityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario que se ha cerrado.</param>
        MobileCRM.UI.EntityForm.onChange(
            function (entityForm) {
                self.onChange(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );

        /// <summary>
        /// Evento on save
        /// </summary>
        /// <param name='closedEntityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario que se ha cerrado.</param>
        MobileCRM.UI.EntityForm.onSave(
            function (entityForm) {
                self.onSave(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );

        MobileCRM.UI.EntityForm.onPostSave(
            function (entityForm) {
                self.onPostSave(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );

        /// <summary>
        /// Evento global, cuando se cierra un formulario
        /// </summary>
        /// <param name='closedEntityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario que se ha cerrado.</param>
        MobileCRM.bridge.onGlobalEvent("EntityFormClosed", function (closedEntityForm) {
            if (closedEntityForm.entity != null && closedEntityForm.entity.entityName == "atos_textobreve")
                FS.OrdenTrabajo.onClose_atostextobreve(closedEntityForm);
        }, true);


        //FS.OrdenTrabajo.onLoadSetPartsUsed();

    }, //OrdenTrabajoOnLoad

    OTOnLoadClonacion: function () {
        MobileCRM.bridge.enableDebug();
        var self = this;

        // se coge el idioma
        MobileCRM.Localization.getLoadedLangId(
            function (loadedLangId) {
                FS.CommonEDPR.localization(loadedLangId);
            },
            FS.CommonEDPR.onError,
            null
        );

        // se carga la region 
        FS.CommonEDPR.ObtenerRegionUsuario();

        // evento load;
        MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
                formulario = entityForm;
                self.CalcularEstadoUsuarioInicial(entityForm);
                self.CalcularEstadoSistemaInicial(entityForm);
                self.CargarUbicacionesClonacion(entityForm, 1);

            },
            FS.CommonEDPR.onError,
            null
        );

    },//OTOnLoadClonacion

    /// <summary>
    /// Cuando se carga el formulario, inicializa los campos
    /// </summary>
    /// <param name='entityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario</param>
    onLoad: function (entityForm) {
        var ordentrabajo = entityForm.entity;
        var self = this;


        // creamos la definicion del comando clonar
        MobileCRM.UI.EntityForm.onCommand(
            "custom_clonarOT",
            function (entityForm) {
                //16/11/2020 AAC
                // redmine :22083,22049 
                // si no se ha cancelado el clonado se ha ocultado las fechas TAB 1
                if (entityForm.detailViews[1].isVisible == false) {
                    MobileCRM.UI.EntityForm.enableCommand("custom_clonarOT", false);
                    MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonarOT", true);
                    if (entityForm.entity.properties.statecode != 1) {
                        MobileCRM.UI.EntityForm.enableCommand("custom_parada", false);
                        //if (esJefeParque &&  entityForm.entity.properties.atos_autorizada !=  true )
                        //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false);
                    }
                }

            },
            true
        );

        MobileCRM.UI.EntityForm.onCommand(
            "custom_cancelClonarOT",
            function (entityForm) {
                MobileCRM.UI.EntityForm.enableCommand("custom_clonarOT", true);
                MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonarOT", false);
                if (entityForm.entity.properties.statecode != 1) {
                    MobileCRM.UI.EntityForm.enableCommand("custom_parada", true);
                    //if (esJefeParque &&  entityForm.entity.properties.atos_autorizada !=  true)
                    //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", true);
                    //else 
                    //	MobileCRM.UI.EntityForm.enableCommand("custom_parada", false);
                }
                else {
                    //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false)
                }

            },
            true
        );

        // creamos la definicion del comando para crear tiempos de inactividad
        MobileCRM.UI.EntityForm.onCommand(
            "custom_parada",
            function (entityForm) {
                self.CrearParada(entityForm);
            },
            true
        );


        // creamos la definicion del autorizar
        MobileCRM.UI.EntityForm.onCommand(
            "custom_autorizar",
            function (entityForm) {
                self.AutorizarOrdenTrabajo(entityForm);

            },
            true
        );


        MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
                var dv = entityForm.getDetailView("Informacion_de_gestion");
                dv.getItemByName("atos_plandemantenimientoid").isEnabled = false;
                dv.getItemByName("atos_numerodetoma").isEnabled = false;
                dv.getItemByName("atos_posicionplandemantenimiento").isEnabled = false;
                dv.getItemByName("atos_fechaconclusiondelatoma").isEnabled = false;
            },
            FS.CommonEDPR.onError,
            null
        );

        // miramos si tiene numero de OP SAP si tiene se supone que esta programada
        if (entityForm.entity.properties.atos_identificador != null) {
            estaProgramada = true;
        }

        if (entityForm.entity.properties.atos_fechainicioprogramado != null && entityForm.entity.properties.atos_fechainicioprogramado != null) {
            fechasProgramacion = true;
        }

        // cargamos si tiene equipo asignado 
        if (entityForm.entity.properties.msdyn_customerasset != null) {
            equipoIdAntiguo = entityForm.entity.properties.msdyn_customerasset.id;
        }

        if (entityForm.entity.properties.msdyn_customerasset)
            equipoInicial = entityForm.entity.properties.msdyn_customerasset;

        if (ordentrabajo.isNew) {
            esNuevo = true;
            // miramos si el padre esta sincroniado
            if (entityForm.entity.properties.msdyn_parentworkorder != null) {
                self.ComprobarSincronizacionOTPadre(entityForm);
            }

            self.ObtenerPermiso(entityForm, "REGIONAL M");
            self.ObtenerPermiso(entityForm, "SITE M");

            //FS.OrdenTrabajo.onLoadCreate(entityForm);
            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                    var dv = entityForm.getDetailView("General");
                    entityForm.entity.properties.atos_origen = 300000002;
                    entityForm.entity.properties.atos_fechainicio = new Date();
                    // ocultamos el iframe de estados por que de la inicializacion del estado de usuario se encarga un plugin
                    entityForm.setTabVisibility("Estados_Usuario_NOTOCAR", false);
                    if (entityForm.iFrameOptions != null) {
                        entityForm.entity.properties.atos_avisoid = entityForm.iFrameOptions.aviso;
                        self.onChangeAviso(entityForm);
                    }
                },
                FS.CommonEDPR.onError,
                null
            );

            //
            var varFetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                " <entity name='atos_clavedecontrol'>" +
                "   <attribute name='atos_clavedecontrolid'/>" +
                "       <filter type='and'>" +
                "           <condition attribute='atos_codigo' value='ZPM1' operator='eq'/> " +
                "       </filter>  " +
                " </entity>  " +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
                function (result) {
                    for (var i in result) {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                for (var i in result) {
                                    claveZPM1 = result[i][0];
                                }
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                },
                function (err) {

                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 1 " + err);
                },
                entityForm
            );


        }
        else {
            //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
            //FS.OrdenTrabajo.CalcularTiemposDescuadradosUSA(entityForm);
            FS.OrdenTrabajo.CalcularOTSinComponentes(entityForm);
            //APP 22227 13/01/2020 Creación de o
            if (entityForm.entity.properties.statecode == 1) {
                MobileCRM.UI.EntityForm.enableCommand("custom_clonarOT", true);
            }
            // mostrar solo si es jefe
            if (entityForm.entity.properties.atos_autorizada == true) {
                //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false);
            }

            FS.OrdenTrabajo.ObtenerParametroEdpr(entityForm, "REGIONAL_M", 1);
            FS.OrdenTrabajo.ObtenerParametroEdpr(entityForm, "SITE_M", 2);
            MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonarOT", false);
            FS.OrdenTrabajo.onLoadCargarnombreAviso(entityForm);
            FS.OrdenTrabajo.onLoadActualizar(entityForm);
            FS.OrdenTrabajo.esJefeDeParque(entityForm);
            FS.OrdenTrabajo.ObtenerAutorizacionOrdenTrabajo(entityForm);
            ubicacionSelecionada = entityForm.entity.properties.msdyn_serviceaccount;
            FS.OrdenTrabajo.BloquearUTOperacionesConfirmadas(entityForm);

            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                    entityForm.form.caption = entityForm.entity.primaryName;
                },
                FS.CommonEDPR.onError,
                null
            );
        }
        FS.OrdenTrabajo.CargarEstadosUsuario(entityForm);
        FS.OrdenTrabajo.tienePermisosJefeParque(entityForm);
        FS.OrdenTrabajo.tienePermisosJefeRegional(entityForm);
        FS.OrdenTrabajo.esJefeRegional(entityForm);
        FS.OrdenTrabajo.ComprobarAvisoNoProgramable(entityForm);

    },//onLoad

    /// <summary>
    /// funciÃ³n  que se lanza cuando se guarda la orden de trabajo
    /// </summary>
    /// <param name='entityForm' type='MobileCRM.UI.EntityForm'>Objeto EntityForm, formulario</param>
    onSave: function (entityForm) {
        try {
            // el padre si tiene no esta sincronizado
            if (!PadreSincronizado) {
                entityForm.cancelValidation(null);
                var idMsjeError = "10104_100";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "004");
            }
            // 2021-08-10 AAC REDMINE:23207 Validar que otra OT tenga le mismo aviso
            // validar aviso
            FS.OrdenTrabajo.ValidarAviso(entityForm);


            FS.OrdenTrabajo.onSaveOrigen(entityForm, 1);
            FS.OrdenTrabajo.claseOT();
            var fechaInicio = entityForm.entity.properties.atos_fechainicioprogramado;
            var fechaFin = entityForm.entity.properties.atos_fechafinprogramado;
            if (fechaInicio != null && fechaFin != null && fechaInicio > fechaFin) {
                FS.OrdenTrabajo.onChangeValidaFechaInicioPlanif(entityForm);
                entityForm.cancelValidation(null);
            }
            else {
                FS.OrdenTrabajo.CambioUbicacionRealizado(entityForm);
                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm2) {
                        if (esNuevo) {
                            if (IdiomaUsuario == Idioma.ingles) {
                                entityForm2.entity.properties.atos_estadousuario = "WAPP";
                                entityForm.entity.properties.atos_estadousuario = "WAPP";
                            }
                            else {
                                entityForm2.entity.properties.atos_estadousuario = "ALIB";
                                entityForm.entity.properties.atos_estadousuario = "ALIB";
                            }


                            entityForm.entity.properties.atos_estadousuarioes = "ALIB";
                            entityForm.entity.properties.atos_estadousuarioen = "WAPP";

                        }
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }

            var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
            if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                FS.OrdenTrabajo.verificarEquipo(entityForm);
            }



            ///AAC-2020-05-11
            /// REDMMINE: 21808
            /// FUNCIONALIDAD DE  NO PART USED
            //if (entityForm.entity.properties.atos_nopartsused !== null &&
            //    entityForm.entity.properties.atos_nopartsused === false &&
            //    CrearComponenteNoPartUsed !== null) {
            //    try {
            //        FS.OrdenTrabajo.CrearComponenteNoPartUsed(entityForm, CrearComponenteNoPartUsed);
            //    }
            //    catch (err) {
            //        if (debug === true)
            //            MobileCRM.UI.MessageBox.sayText("Error PU--> " + err);
            //    }
            //}


        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 2--> " + err);

        }
    },

    onPostSave: function (entityForm) {
        var self = this;
        self.onSaveOrigen(entityForm, 300000002);
        self.onSaveNewOT(entityForm.entity, entityForm);
        self.onSaveNewAviso(entityForm);
        // 2021-08-11 AAC MM-437 VCreacion y modificacion de equipo
        // validar aviso
        //var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName ;
        //if(!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)){
        //	self.CrearActualizarEquipo(entityForm);
        //}
		        self.onPostSaveCreateComponentNoPartsUsed(entityForm);
        self.CreateWorkOrderTaskList(entityForm);
    },	

    onPostSaveCreateComponentNoPartsUsed: function (entityForm) {
        if (entityForm.entity.properties.atos_nopartsused !== null &&
            entityForm.entity.properties.atos_nopartsused === false &&
            CrearComponenteNoPartUsed !== null) {
            try {
                FS.OrdenTrabajo.CrearComponenteNoPartUsed(entityForm, CrearComponenteNoPartUsed);
            }
            catch (err) {
                if (debug === true)
                    MobileCRM.UI.MessageBox.sayText("Error PU--> " + err);
            }
        }
    },

    //MF: MM-3675 - "NA - Auto populate BOQ_LOG in ZPM1 WF Self (RESCO)"
    // >> onChange > case "atos_clasedeordenid"
    SetWorkOrderClassCode: function (entityForm) {
        if (isWorkOrderNew === false) {
            return;
        }//if
		
		if (!isUserRegionNA) {
			return;
		}

        var WO = entityForm.entity;
        var woType = WO.properties.atos_clasedeordenid;
        if (woType === null) {
            return;
        }//if

        var woTypeID = woType.id;

        var fetchXML_as = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "  <entity name='atos_clasedeorden'>" +
            "    <attribute name='atos_codigo' />" +           //[i][0]
            "    <filter type='and'>" +
            "      <condition attribute='atos_clasedeordenid' operator='eq'  value='" + woTypeID + "' />" +
            "    </filter>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXML_as,
            function (results) {
                if (results.length > 0) {
                    for (var i in results) {
                        workOrderClassCode = results[i][0];
                        break;
                    }//for
                }//if
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );//executeFromXML

    },//SetWorkOrderClassCode

    //MF: MM-3675 - "NA - Auto populate BOQ_LOG in ZPM1 WF Self (RESCO)"
    //[!] this function is required because onPostSave event (not in debug mode) executeFromXML did not run
    // >> onChange > case "msdyn_serviceaccount"
    SetHojaDeRuta: function (entityForm) {
        if (isWorkOrderNew === false) {
            return;
        }//if
	
		if (!isUserRegionNA) {
			return;
		}

        var WO = entityForm.entity;
        var functionalLocationName = WO.properties.msdyn_serviceaccount.primaryName;
        if (functionalLocationName === null) {
            return;
        }//if

        var fetchXML_as = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "  <entity name='edprdyn_autoservicio'>" +
            "    <attribute name='edprdyn_floc' />" +           //[i][0]
            "    <attribute name='edprdyn_hoja_rutaid' />" +    //[i][1]
            "    <filter type='and'>" +
            "      <condition attribute='statecode' operator='eq'  value='0' />" +
            "    </filter>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXML_as,
            function (results) {
                if (results.length > 0) {
                    for (var i in results) {
                        var isValid = functionalLocationName.startsWith(results[i][0]); //compare the Functional Location name with FLOC
                        if (isValid) {
                            hojaRutaLK = results[i][1];
                            if (hojaRutaLK !== null) {
                                //found a valid "Auto Servicio" (by FLOC)
                                break;
                            }//if
                        }//if isValid
                    }//for
                }//if
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );//executeFromXML
    },//SetHojaDeRuta

    //MF: MM-3675 - "NA - Auto populate BOQ_LOG in ZPM1 WF Self (RESCO)"
    //Creates a Wotk Order Task List / Hoja de ruta de orden de trabajo
    // >> onPostSave
    CreateWorkOrderTaskList: function (entityForm) {

        var WO = entityForm.entity;
        if (isWorkOrderNew === false) {
            return;
        }
		
		if (!isUserRegionNA) {
			return;
		}

        var functionalLocationLK = WO.properties.msdyn_serviceaccount;
        if (functionalLocationLK === null) {
            return;
        }

        //var woTypeName = WO.properties.atos_clasedeordenid.primaryName;
        if (workOrderClassCode === null) {
            return;
        }

        if (workOrderClassCode !== "ZPM1") {
            //this is not a WO ZPM1 Type, should not create a Work Order Task List
            return;
        }

        if (hojaRutaLK !== null) {
            //found a valid "Auto Servicio" (by FLOC) - function 'SetHojaDeRuta
            var newWorkOrderTaskList = new MobileCRM.DynamicEntity.createNew("atos_hojaderutadeordendetrabajo");
            newWorkOrderTaskList.isNew = true;
            var props = newWorkOrderTaskList.properties;
            props.atos_hojaderutaid = new MobileCRM.Reference(hojaRutaLK.entityName, hojaRutaLK.id, hojaRutaLK.primaryName);
            props.atos_ordendetrabajoid = new MobileCRM.Reference(WO.entityName, WO.id, "");

            newWorkOrderTaskList.save(
                function (err) {
                    if (err) {
                        MobileCRM.UI.MessageBox.sayText("Error 506--> " + err);
                    }
                    else {
                        //save done!
                    }
                }
            );//save
        }//if        

    },//CreateWorkOrderTaskList


    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
    CalcularOTSinComponentes: function (entityForm) {
        //debugger;
        try {
            var ordenId = entityForm.entity.id;
            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                "  <entity name='atos_componenteoperacion'>" +
                "    <attribute name='atos_name' />" +
                "    <filter type='and'>" +
                "       <condition attribute='atos_borradoensap' operator='ne' value='1' />" +
                "      <condition attribute='atos_ordendetrabajoid' operator='eq'  value='" + ordenId + "' />" +
                "      <condition attribute='atos_listadematerial' operator='ne'  value='300000000' />" +
                "    </filter>" +
                "  </entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {

                    if ((result.length == 0) && (entityForm.entity.properties.atos_nopartsused == null || entityForm.entity.properties.atos_nopartsused == false)) {
                        otsSinComponentes = "SI";
                    }
                    else {
                        otsSinComponentes = "";
                    }
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                },
                entityForm
            );
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
        }
    },
    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
    CalcularTiemposDescuadradosUSA: function (entityForm) {
        //debugger;
        numoperacion = 0;
        numoperacionHoraTecnico = 0;

        var Esamericana = false;
        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
            UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
            Esamericana = FS.OrdenTrabajo.EsUbicacionAmericana(UTname);
        }
        if (Esamericana) {
            var idMsjeError = "10104_117";
            var fetchXmlMensaje1 = ["<fetch version='1.0' output-format='xml-platform' mapping='logical'  no-lock='true' distinct='false'>",
                "<entity name='atos_coleccionerrores'>",
                "<attribute name='atos_descripcion_en' />",
                "<attribute name='atos_descripcion_es' />",
                "<order attribute='atos_codigo' descending='false' />",
                "<filter type='and'>",
                "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError + "' />",
                "</filter>",
                "</entity>",
                "</fetch>"].join(" ");

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlMensaje1,
                function (resultMensaje1) {
                    if (resultMensaje1.length > 0) {

                        var idMsjeError2 = "10104_118";
                        var fetchXmlMensaje2 = ["<fetch version='1.0' output-format='xml-platform' mapping='logical'  no-lock='true' distinct='false'>",
                            "<entity name='atos_coleccionerrores'>",
                            "<attribute name='atos_descripcion_en' />",
                            "<attribute name='atos_descripcion_es' />",
                            "<order attribute='atos_codigo' descending='false' />",
                            "<filter type='and'>",
                            "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError2 + "' />",
                            "</filter>",
                            "</entity>",
                            "</fetch>"].join(" ");
                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlMensaje2,
                            function (resultMensaje2) {
                                if (resultMensaje2.length > 0) {
                                    var ordenId = entityForm.entity.id;
                                    var fetchXmlOperaciones = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
                                        "  <entity name='msdyn_workorderservicetask'>" +
                                        "    <attribute name='msdyn_workorderservicetaskid'  />" +
                                        "    <attribute name='msdyn_name'  />" +
                                        "    <filter type='and'>" +
                                        "      <condition attribute='msdyn_workorder' operator='eq'  value='" + ordenId + "' />" +
                                        "    </filter>" +
                                        "  </entity>" +
                                        "</fetch>";
                                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperaciones,
                                        function (resultOperaciones) {
                                            for (var i in resultOperaciones) {
                                                var operacionId = resultOperaciones[i][0];
                                                var operacionName = resultOperaciones[i][1];
                                                var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' aggregate='true'>" +
                                                    "  <entity name='msdyn_workorderservicetask'>" +
                                                    "    <attribute name='atos_trabajoreal' aggregate='max' alias='estimatedvalue_sum' />" +
                                                    "    <filter type='and'>" +
                                                    "      <condition attribute='msdyn_workorderservicetaskid' operator='eq'  value='" + operacionId + "' />" +
                                                    "    </filter>" +
                                                    "  <link-entity name='atos_horastecnicooperacion' from='atos_operacionid' to='msdyn_workorderservicetaskid' link-type='outer' alias='ac' >" +
                                                    "	   <attribute name='atos_trabajoreal'  aggregate='sum' alias='estimatedvalue_sum2'  />" +
                                                    "	</link-entity>" +
                                                    "  </entity>" +
                                                    "</fetch>";

                                                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                                                    function (result) {

                                                        var fetchXmlHorasTecnicos = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                                                            "  <entity name='atos_horastecnicooperacion'>" +
                                                            "    <attribute name='atos_name' />" +
                                                            "    <filter type='and'>" +
                                                            "      <condition attribute='atos_operacionid' operator='eq'  value='" + resultOperaciones[numoperacionHoraTecnico][0] + "' />" +
                                                            "    </filter>" +
                                                            "  </entity>" +
                                                            "</fetch>";
                                                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlHorasTecnicos,
                                                            function (resultHorasTecnicos) {
                                                                var mensaje = "";
                                                                var sacarmensaje = false;

                                                                if (result.length > 0) {
                                                                    var mensajeError2 = "";
                                                                    var mensajeError1 = "";
                                                                    if (resultMensaje2.length > 0) {
                                                                        if (IdiomaUsuario == 1033) {
                                                                            mensajeError2 = resultMensaje2[0][0].replace('{0}', resultOperaciones[numoperacion][1]);
                                                                            mensajeError1 = resultMensaje1[0][0].replace('{0}', resultOperaciones[numoperacion][1]) + " \n \n ";
                                                                        } else {
                                                                            mensajeError2 = resultMensaje2[0][1].replace('{0}', resultOperaciones[numoperacion][1]);
                                                                            mensajeError1 = resultMensaje1[0][1].replace('{0}', resultOperaciones[numoperacion][1]) + " \n \n "; + " \n \n ";
                                                                        }
                                                                    }
                                                                    var mensaje = "";
                                                                    var total = result[0][0];
                                                                    if (total == 0) {
                                                                        mensaje = mensajeError1;
                                                                        sacarmensaje = true;
                                                                    }
                                                                    if (resultHorasTecnicos.length > 0) {
                                                                        if ((total != null || result[0][1] != null) && total != result[0][1]) {
                                                                            mensaje = mensaje + mensajeError2;
                                                                            sacarmensaje = true;
                                                                        }
                                                                    }
                                                                    if (sacarmensaje) {
                                                                        MobileCRM.UI.MessageBox.sayText(mensaje);
                                                                    }
                                                                    numoperacion = numoperacion + 1;
                                                                }
                                                            },
                                                            function (err) {
                                                                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                                            },
                                                            entityForm
                                                        );
                                                        numoperacionHoraTecnico = numoperacionHoraTecnico + 1;
                                                    },
                                                    function (err) {
                                                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                                    },
                                                    entityForm
                                                );
                                            }
                                        },
                                        function (err) {
                                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                        },
                                        entityForm
                                    );
                                }
                            },
                            function (err) {
                                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                            },
                            entityForm
                        );
                    }
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                },
                entityForm
            );
        }
    },


    //MM-437 2021-10-20 AAC Creacion y modificacion de equipo
    verificarEquipo: function (entityForm) {
        var equipo = null;
        var idEquipoInicial = null;
        equipo = entityForm.entity.properties.msdyn_customerasset;
        if (equipoIdAntiguo != null) {
            var equipoId = null;
            if (equipo != null) {
                equipoId = equipo.id;
            }
            if (equipoIdAntiguo != equipoId) {
                var saveHandler = entityForm.suspendSave();
                var idMsjeError = "10121_002";
                var fetchXml = ["<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>",
                    "<entity name='atos_coleccionerrores'>",
                    "<attribute name='atos_coleccionerroresid' />",
                    "<attribute name='atos_descripcion_en' />",
                    "<attribute name='atos_descripcion_es' />",
                    "<attribute name='atos_tipoerror' />",
                    "<order attribute='atos_codigo' descending='false' />",
                    "<filter type='and'>",
                    "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError + "' />",
                    "</filter>",
                    "</entity>",
                    "</fetch>"].join(" ");

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function success(result) {
                        var mensaje = "";
                        if (result.length > 0) {
                            if (IdiomaUsuario == 1033) {
                                mensaje = result[0][1];
                            }
                            else {
                                mensaje = result[0][2];
                            }

                            var popup;
                            if (IdiomaUsuario == Idioma.ingles) {
                                /// Add the buttons for message box
                                popup = new MobileCRM.UI.MessageBox(mensaje + " Continue?");
                                popup.items = ["Yes", "No"];
                            }
                            else {
                                popup = new MobileCRM.UI.MessageBox(mensaje + "¿Continuar?");
                                popup.items = ["Si", "No"];
                            }

                            popup.multiLine = true;
                            popup.show(
                                function (button) {
                                    if (button == "Yes" || button == "Si") {
                                        var fetchObjetosRef = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                                            "<entity name='atos_objetoorden'>" +
                                            "<attribute name='atos_name' />" +
                                            "<attribute name='atos_objetoordenid' />" +
                                            "<filter type='and'>" +
                                            "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + entityForm.entity.id + "' />" +
                                            "<condition attribute='atos_equipoid' operator='eq' value='" + equipoIdAntiguo + "' />" +
                                            "</filter>" +
                                            "</entity>" +
                                            "</fetch>";
                                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchObjetosRef,
                                            function (resultObjetoRef) {

                                                for (var i in resultObjetoRef) {
                                                    var updObjetoRef = new MobileCRM.DynamicEntity.createNew("atos_objetoorden");
                                                    updObjetoRef.id = resultObjetoRef[i][1];
                                                    updObjetoRef.isNew = false;
                                                    var props = updObjetoRef.properties;
                                                    props.atos_indicadordeborrado = 1;
                                                    //props.statecode = 1 ;
                                                    //props.statusecode = 1 ;
                                                    //props.atos_origen = 300000002;

                                                    updObjetoRef.save(
                                                        function (err) {
                                                            if (err) {
                                                                MobileCRM.UI.MessageBox.sayText("Error 206--> " + err);
                                                            }
                                                            else {
                                                            }
                                                            if (parseInt(i) + 1 == resultObjetoRef.length) {
                                                                saveHandler.resumeSave();
                                                            }
                                                        }
                                                    );
                                                }
                                                if (resultObjetoRef.length == 0) {
                                                    saveHandler.resumeSave();
                                                }

                                            },
                                            function (err) {
                                                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                                MobileCRM.UI.MessageBox.sayText("Error 205--> " + err);
                                            },
                                            entityForm
                                        );
                                    }
                                    else {
                                        saveHandler.resumeSave();
                                    }

                                }
                            );
                        }
                    },
                    function (error) {
                    });
            }
        }
        equipoInicial = entityForm.entity.properties.msdyn_customerasset
        //if (entityForm.entity.properties.msdyn_customerasset!= null){

    },
    /// <summary>
    /// Al modificar algún campo del formulario, se encarga de rediriguir todos los onchange de las ordenes de trabajo
    /// </summary>
    /// <param name="entityForm">formulario actual</param>
    onChange: function (entityForm) {
        try {
            var changedItem = entityForm.context.changedItem;
            var self = this;
            switch (changedItem) {

                //Ha cambiado la clase de orden
                case "atos_clasedeordenid":
                    self.SugerirAbrirSuborden(entityForm);
                    self.onChangeClaseOT(entityForm);
                    FS.OrdenTrabajo.tienePermisosJefeRegional(entityForm);
                    FS.OrdenTrabajo.esJefeRegional(entityForm);
                    self.SetWorkOrderClassCode(entityForm);
                    break;

                //Ha cambiado la ubicacion tecnica
                case "msdyn_serviceaccount":
                    self.ChangeTextoBreve(entityForm);
                    self.BloquearUT(entityForm);
                    FS.OrdenTrabajo.esJefeRegional(entityForm);
                    self.SetHojaDeRuta(entityForm);
                    break;

                //Ha cambiado el equipo
                case "msdyn_customerasset":
                    self.RecomendarEquipo();
                    var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                    if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                        self.ComprobarFechasEquipo(entityForm);
                    }

                    break;

                //Ha cambiado la orden superior
                case "msdyn_parentworkorder":
                    self.SugerirAbrirSuborden(entityForm);
                    break;

                //Ha cambiado la prioridad
                case "msdyn_priority":
                    self.onChangePriorityDeadLine(entityForm);
                    break;

                //Ha cambiado el aviso
                case "atos_avisoid":
                    if (entityForm.entity.isNew) {
                        self.onChangeAviso(entityForm);
                    }
                    break;

                //Ha cambiado la fecha Inicio 1ª planificación
                case "atos_fechainicioprogramado":
                    self.onChangeFechaInicio1Planif(entityForm);
                    self.onChangeRetraso(entityForm);
                    break;

                //Ha cambiado la fecha fin 1ª planificación
                case "atos_fechainicio":
                    self.onChangeFechaInicioFin(entityForm);
                    self.onChangePriorityDeadLine(entityForm);
                    break;
                //Ha cambiado la fecha de inicio de replanificación
                case "atos_fechafin":
                    self.onChangeFechaInicioFin(entityForm);
                    break;


                //Ha cambiado la fecha fin 1ª planificación
                case "atos_fechafinprogramado":
                    self.onChangeFechaFin1Planif(entityForm);
                    break;
                ///AAC-2020-05-11
                /// REDMMINE: 21808
                /// FUNCIONALIDAD DE  NO PART USED
                //Ha cambiado la fecha de inicio de replanificación
                case "atos_nopartsused":
                    self.onChangeNoPartUsed(entityForm);
                    break;

                //Ha cambiado No part Used
                case "atos_inicextr":
                    self.onChangeValidaFechaInicioRepro(entityForm);
                    self.onChangeRetraso(entityForm);
                    break;

                //Ha cambiado la fecha de fin de replanificación
                case "atos_finextr":
                    self.onChangeValidaFechaInicioRepro(entityForm);
                    break;

                //Ha cambiado la fecha de fin de replanificación
                case "atos_fechainicioreal":
                    self.onChangeRetraso(entityForm);
                    break;
                //Ha cambiado la fecha de fin de replanificación
                case "atos_indicadordeentradaaturbina":
                    self.onChangeEntradaTurbina(entityForm);
                    break;

                // cambioa el puesto de trabajo principal	
                case "atos_puestotrabajoprincipalid":
                    self.onChangePuestoTrabajoPricipal(entityForm);
                    if (entityForm.entity.isNew) {
                        self.filterClaseActividad(entityForm);
                    }
                    break;
                // cambiamos puesta en marcha 
                case "atos_puestaenmarcha":
                    self.PuestaEnMarcha(entityForm);
                    break;
                case "atos_cierretecnicodeorden":

                    var cierre = entityForm.entity.properties.atos_cierretecnicodeorden;
                    if (entityForm.entity.properties.msdyn_name == null) {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                FS.CommonEDPR.GetErrorCollectionByCode("10120_008", "004");
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                        return;
                    }
                    var UTname = "";
                    if (entityForm.entity.properties.msdyn_serviceaccount != null) {
                        UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                    }
                    // si no tiene cierre cope
                    var marcha = entityForm.entity.properties.atos_puestaenmarcha;
                    if (!marcha && !FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                FS.CommonEDPR.GetErrorCollectionByCode("10120_001", "004");
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                        return;
                    }
                    // si no esta integrada
                    if (cierre && entityForm.entity.properties.atos_estadosintegracionsap == 5) {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                FS.CommonEDPR.GetErrorCollectionByCode("10120_002", "004");
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                        return;
                    }
                    var ordenId = entityForm.entity.id;
                    // 21491 AAC 17/11/2020-->mensaje informativo al cerrar la O.T. sin confirmación.
                    var mensajeSinConfirmar = "";
                 debugger;
                    //#region MM-5656
                    if (FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {

                        var controle = 0;
                        var controleOp = [];
                        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>"
                            + "  <entity name='msdyn_workorderservicetask'>"
                            + "    <attribute name='atos_capacidadreal' />"
                            + "    <attribute name='atos_numerooperacioncrm' />"
                            + "    <attribute name='msdyn_workorderservicetaskid' />"
                            + "    <order attribute='atos_numerooperacioncrm' descending='false' />"
                            + "    <filter type='and'>"
                            + "      <condition attribute='atos_indicadorborrado' operator='ne' value='1' />"
                            + "      <condition attribute='msdyn_workorder' operator='eq' value='" + ordenId + "' />"
                            + "    </filter>"
                            + "    <link-entity name='atos_puestodetrabajo' from='atos_puestodetrabajoid' to='atos_puestotrabajoprincipalid' link-type='inner' alias='ab'>"
                            + "      <filter type='and'>"
                            + "        <condition attribute='atos_codigopuestodetrabajo' operator='ne' value='E0000000' />"
                            + "        <condition attribute='atos_codigopuestodetrabajo' operator='ne' value='ET000000' />"
                            + "      </filter>"
                            + "    </link-entity>"
                            + "  </entity>"
                            + "</fetch>"

                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                            function (resultOp) {
                                if (resultOp.length > 0) {
                                    for (var j in resultOp) {
                                        var capacidade = resultOp[j][0];
                                        var numOp = resultOp[j][1];
                                        var operacaoId = resultOp[j][2];

                                        var fetchHoras =
                                            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>"
                                            + "  <entity name='atos_horastecnicooperacion'>"
                                            + "    <attribute name='atos_horastecnicooperacionid' />"
                                            + "    <attribute name='atos_operacionid' />"
                                            + "    <filter type='and'>"
                                            + "      <condition attribute='atos_operacionid' operator='eq' value='" + operacaoId + "' />"
                                            + "      <condition attribute='atos_tecnicoid' operator='not-null' />"
                                            //+ "      <condition attribute='atos_trabajoreal' operator='gt' value='0' />"
                                            + "    </filter>"
                                            + "  </entity>"
                                            + "</fetch>";

                                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchHoras,
                                            function success(resultHoras) {
                                                if (resultHoras.length == 0 || resultHoras.length != capacidade) {

                                                    var popup;


                                                    if (IdiomaUsuario == Idioma.ingles) {
                                                        popup = new MobileCRM.UI.MessageBox("Operation " + numOp + ", has no technical names, do you want to continue?");
                                                        popup.items = ["Yes", "Cancel"];
                                                    } else {
                                                        popup = new MobileCRM.UI.MessageBox("Operación " + numOp + ", no tiene nombres técnicos, ¿quieres continuar?");
                                                        popup.items = ["Sí", "Cancelar"];
                                                    }

                                                    popup.multiLine = true;
                                                    popup.show(
                                                        function (button) {
                                                            if (button == "Cancel" || button == "Cancelar") {
                                                                //Si es 4 entonces es Aranque
                                                                MobileCRM.UI.EntityForm.requestObject(
                                                                    function (entityForm) {
                                                                        entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                                                        return;
                                                                    },
                                                                    FS.CommonEDPR.onError,
                                                                    null
                                                                );
                                                            } else if (resultOp.length == controleOp.length || resultOp.length == 1) {
                                                                self.validarOP(entityForm)
                                                            }
                                                            else {
                                                                if (controleOp.length == 0 || !controleOp.contains(resultHoras[0][1]))
                                                                    controleOp.push(resultHoras[0][1]);
                                                            }
                                                        }
                                                    );
                                                }

                                                else if (resultOp.length == controleOp.length || resultOp.length == 1) {
                                                    self.validarOP(entityForm)
                                                }
                                                else {
                                                    if (controleOp.length == 0 || !controleOp.contains(resultHoras[0][1]))
                                                        controleOp.push(resultHoras[0][1]);
                                                }
                                            },
                                            function (error) {

                                            }
                                        );
                                    }
                                } else {
                                    FS.OrdenTrabajo.validarOP(entityForm)
                                }
                            }
                        );
                    }
                    else {
                        FS.OrdenTrabajo.validarOP(entityForm)
                    }
                    //#endregion

                    break;



            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 6--> " + err);
        }
    },

    ComprobarSincronizacionOTPadre: function (entityForm) {

        var ordenPadreId = entityForm.entity.properties.msdyn_parentworkorder.id;	//Operaciones que tienen los datos de confirmación rellenos pero que no estan confirmados
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'> " +
            "  <entity name='msdyn_workorder'>" +
            "    <attribute name='msdyn_workorderid' />" +
            "    <attribute name='atos_estadosintegracionsap' />" +
            "    <filter type='and'>" +
            "      <condition attribute='msdyn_workorderid' operator='eq' uiname='0000002750' uitype='msdyn_workorder' value='" + ordenPadreId + "' />" +
            "    </filter>" +
            "    <link-entity name='atos_clasedeorden' from='atos_clasedeordenid' to='atos_clasedeordenid' link-type='inner' alias='ad'>" +
            "      <attribute name='atos_codigo' />" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                if (result[0][1] == 300000001) {
                    PadreSincronizado = true;
                }
                else {
                    PadreSincronizado = false;
                }

                if (result[0][2] != "ZPM0") {
                    PadreSincronizado = true;
                }
                else {
                    PadreSincronizado = true;
                }



            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                MobileCRM.UI.MessageBox.sayText("Error 5--> " + err);
            },
            entityForm
        );




        var claseOT = "";
        if (entityForm.entity.properties.atos_clasedeordenid != null)
            claseOT = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
        if (claseOT != "ZPM0" && claseOT != "ZPM1") {
            return;
        }




    },



    CierreAvisoConParada: function (entityForm) {
        var self = this;
        var cierre = entityForm.entity.properties.atos_cierretecnicodeorden;
        if (cierre) {
            self.ComprobarAdjuntosComponentesNA(entityForm);

            // si tiene avisos con parada pero sin fecha fin averia
            // FECHA: 14/05/2020
            //AAC REDMINE: 21799 Malfunctional End mandatory when Breakdown set.
            var ordenId = entityForm.entity.id;

            var fetchXmlAvisosParados = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                "  <entity name='atos_aviso'>" +
                "    <attribute name='atos_name' />" +
                "    <attribute name='atos_avisoid' />" +
                "    <order attribute='atos_name' descending='true' />" +
                "    <filter type='and'>" +
                "      <condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
                "      <condition attribute='atos_avisoparada' operator='eq' value='1' />" +
                "      <condition attribute='atos_fechafinaveria' operator='null' />" +
                "    </filter>" +
                "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' link-type='inner' alias='ab'>" +
                "      <filter type='and'>" +
                "        <condition attribute='msdyn_workorderid' operator='eq' value='" + ordenId + "' />" +
                "      </filter>" +
                "    </link-entity>" +
                "  </entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlAvisosParados,
                function (result) {
                    if (result.length > 0 && FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                        var avisos = "";
                        if (IdiomaUsuario == Idioma.ingles) {
                            avisos = "You have to complete the malfunction end date in the following notifications: ";
                        }
                        else {
                            avisos = "Debe completar la fecha de fin de avería en las siguientes notificaciones: ";
                        }
                        for (var i in result) {
                            avisos = avisos + result[i][0] + " ";
                        }
                        if (IdiomaUsuario == Idioma.ingles) {
                            avisos = avisos + ".";
                        }
                        else {
                            avisos = avisos + ".";
                        }
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                //entityForm.entity.properties.statuscode = StatusCode.OrdenCerradoTecnicamente;
                                MobileCRM.UI.MessageBox.sayText(avisos);
                                entityForm.entity.properties.atos_cierretecnicodeorden = false;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                    else {
                        if (cierre != null & cierre) {
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    //entityForm.entity.properties.statuscode = StatusCode.OrdenCerradoTecnicamente;
                                    entityForm.entity.properties.atos_puestaenmarcha = true;
                                },
                                FS.CommonEDPR.onError,
                                null
                            );
                        }
                    }
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    MobileCRM.UI.MessageBox.sayText("Error 5--> " + err);
                },
                entityForm
            );
        }

    },
    //21491 AAC 19/11/2020 Mensaje informativo al cerrar la O.T. sin confirmación.
    ComprobarAdjuntosComponentesNA: function (entityForm) {

        var claseOT = "";
        if (entityForm.entity.properties.atos_clasedeordenid != null)
            claseOT = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
        if (claseOT != "ZPM0" && claseOT != "ZPM1" && otsSinComponentes == "") {
            return;
        }

        var ordenId = entityForm.entity.id;
        var UTname = "";
        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
            UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
        }

        if (FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {

            //Operaciones que tienen los datos de confirmación rellenos pero que no estan confirmados
            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>" +
                "<entity name='annotation'>" +
                "<attribute name='subject' />" +
                "<attribute name='notetext' />" +
                "<attribute name='filename' />" +
                "<attribute name='annotationid' />" +
                "<attribute name='filesize' />" +
                "<attribute name='isdocument' />" +
                "<order attribute='subject' descending='false' />" +
                "<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='objectid' link-type='inner' alias='ADJ'>" +
                "<attribute name='msdyn_name' />" +
                "<filter type='and'>" +
                "<condition attribute='msdyn_workorderid' operator='eq' value='" + ordenId + "' />" +
                "</filter>" +
                "</link-entity>" +
                "</entity>" +
                "</fetch>";


            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    var NoAdjuntosNoComments = "";
                    if (result.length == 0) {
                        if (claseOT == "ZPM0" || claseOT == "ZPM1") {
                            if (IdiomaUsuario == Idioma.ingles) {
                                NoAdjuntosNoComments = NoAdjuntosNoComments + "\n Documents missing in the attachments. ";
                            }
                            else {
                                NoAdjuntosNoComments = NoAdjuntosNoComments + "\n La OT no tiene documentos adjuntos. ";
                            }
                        }
                    }
                    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
                    if (otsSinComponentes != "") {
                        if (IdiomaUsuario == Idioma.ingles) {
                            NoAdjuntosNoComments = NoAdjuntosNoComments + " \n Please verify components tab, you are trying to close the WO without components. If no component has been used , please flag the box in general tab No spare Used. ";
                        }
                        else {
                            NoAdjuntosNoComments = NoAdjuntosNoComments + "\n Verifica la pestaña de componentes. Esta intentando cerrar una OT sin componentes. Si  algún componente ha sido usado, Por favor marque  el check de No part Used. ";
                        }
                    }


                    if (entityForm.entity.properties.msdyn_primaryincidentdescription == null || entityForm.entity.properties.msdyn_primaryincidentdescription == "") {
                        if (claseOT == "ZPM0" || claseOT == "ZPM1") {
                            if (IdiomaUsuario == Idioma.ingles) {
                                NoAdjuntosNoComments = NoAdjuntosNoComments + "\n  Comments missing in the long text section. ";
                            }
                            else {
                                NoAdjuntosNoComments = NoAdjuntosNoComments + "\n La OT no tiene descripción larga. ";
                            }
                        }
                    }

                    if (NoAdjuntosNoComments != "") {
                        var popup;
                        if (IdiomaUsuario == Idioma.ingles) {
                            /// Add the buttons for message box 
                            popup = new MobileCRM.UI.MessageBox(NoAdjuntosNoComments + "Continue?");
                            popup.items = ["Yes", "No"];
                        }
                        else {
                            popup = new MobileCRM.UI.MessageBox(NoAdjuntosNoComments + "¿Continuar?");
                            popup.items = ["Si", "No"];
                        }
                        popup.multiLine = true;
                        popup.show(
                            function (button) {
                                if (button == "No" || button == "No") {
                                    //Si es 4 entonces es Aranque
                                    MobileCRM.UI.EntityForm.requestObject(
                                        function (entityForm) {
                                            entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                        },
                                        FS.CommonEDPR.onError,
                                        null
                                    );
                                }
                            }
                        );
                    }


                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    MobileCRM.UI.MessageBox.sayText("Error 5--> " + err);
                },
                entityForm
            );



        }
    },

    onSaveNewOT: function (entity, entityForm) {
        var self = this;
        var OT = entity;

        try {
            if (esNuevo) {
                // creamos los estados iniciales
                esNuevo = false;

                // Estatus de usuario
                var newLogEstadoUsuario = new MobileCRM.DynamicEntity.createNew("atos_logestado");
                var props = newLogEstadoUsuario.properties;
                props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", OT.id, OT.atos_name);
                props.atos_identificador = "E0001";
                // en ingles NAPR
                props.atos_name = "ALIB";
                props.atos_numerocambio = 1;
                props.atos_objeto = 1;
                props.atos_indicadorcambio = 1;
                props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", estadoUsuarioInicialId, "");


                newLogEstadoUsuario.save(
                    function (err) {
                        if (err) {
                            //MobileCRM.UI.MessageBox.sayText(err);
                        }
                        else {

                        }
                    }
                );


                // MM-863 AAC 2021-09-16  si es de clase ZPM8 no crear operacio por defecto
                var claseOT = "";
                if (entityForm.entity.properties.atos_clasedeordenid != null)
                    claseOT = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
               
//#region MM-5271 2024-01- EUR-ORDENES ZPM0-CREACIÓN DE OPERACIONES POR DEFAULT- RESCO
				var floc = "";
				if (entityForm.entity.properties.msdyn_serviceaccount != null)
					floc = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
				//#endregion

				if (claseOT != "ZPM8" && claseOT != "ZPM0" || (claseOT == "ZPM0" && (floc.startsWith("0-US") || floc.startsWith("0-CA") || floc.startsWith("0-MX")))) {
				                    // creamos su  primera operacion

                    var newOperacion = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
                    var props = newOperacion.properties;
                    props.msdyn_name = OT.properties.atos_titulo.substr(0, 40);
                    props.msdyn_workorder = new MobileCRM.Reference("msdyn_workorder", OT.id, "");
                    props.atos_descripcion = OT.properties.atos_titulo.substr(0, 40);
                    props.atos_ubicaciontecnicaid = new MobileCRM.Reference(OT.properties.msdyn_serviceaccount.entityName, OT.properties.msdyn_serviceaccount.id, OT.properties.msdyn_serviceaccount.primaryName);
                    props.atos_centroid = new MobileCRM.Reference(OT.properties.atos_centroid.entityName, OT.properties.atos_centroid.id, OT.properties.atos_centroid.primaryName);;
                    props.atos_puestotrabajoprincipalid = new MobileCRM.Reference(OT.properties.atos_puestotrabajoprincipalid.entityName, OT.properties.atos_puestotrabajoprincipalid.id, OT.properties.atos_puestotrabajoprincipalid.primaryName);
                    props.atos_centroplanificacionid = new MobileCRM.Reference(OT.properties.atos_centrodeplanificacinid.entityName, OT.properties.atos_centrodeplanificacinid.id, OT.properties.atos_centrodeplanificacinid.primaryName);
                    if (claseActividad != null) {
                        props.atos_clasedeactividadid = claseActividad;
                    }

                    if (claveControlId == null) {
                        props.atos_clavedecontrolid = new MobileCRM.Reference("atos_clavedecontrol", claveZPM1, "ZPM1: Mantenimiento - Interno");
                    }
                    else {
                        props.atos_clavedecontrolid = new MobileCRM.Reference("atos_clavedecontrol", claveControlId, "");
                    }
                    newOperacion.save(
                        function (err) {
                            if (err) {
                                //MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {

                            }
                        }
                    );
                }
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 7--> " + err);

        }
    },


    onSaveNewAviso: function (entityForm) {
        var self = this;
        try {

            if (entityForm.entity.properties.atos_avisoid != null && avisoCodigoCRM != null) {
                var postSuspend = entityForm.suspendPostSave();
                // creamos su  primera operacion
                var updAviso = new MobileCRM.DynamicEntity.createNew("atos_aviso");
                updAviso.id = entityForm.entity.properties.atos_avisoid.id;
                updAviso.isNew = false;
                var props = updAviso.properties;
                props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", entityForm.entity.id, "");
                props.atos_ordenasignada = true;


                updAviso.save(
                    function (err) {
                        if (err) {
                            //MobileCRM.UI.MessageBox.sayText(err);
                            postSuspend.resumePostSave();
                        }
                        else {
                            postSuspend.resumePostSave();

                        }

                    }
                );
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 8--> " + err);
        }
    },


    // funci?n  que se lanza cuando se cambia la priridad 
    // y calcula la nueva fexha de limite de ejecucion depediendo de la prioridad.
    // AAC 07-11-2018
    onChangePriorityDeadLine: function (entityForm) {
        //debugger;
        //Obtener el estado del sistema
        var self = this;
        //debugger;
        if (entityForm.entity.properties.msdyn_serviceaccount == null) {
            return;
        }
        var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
        if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
            return;
        }
        var priority = entityForm.entity.properties.msdyn_priority;
        var dateset = entityForm.entity.properties.atos_fechainicio;

        var numberOfDays = 0;
        if (priority != null && entityForm.entity.properties.atos_fechainicio != null) {
            try {
                switch (priority.primaryName) {
                    case "PM Cycle C (US only)":
                    case "PM Cycle C (US only)":
                        numberOfDays = 365;
                        break;
                    case "Very High":
                    case "Muy Alta":
                        numberOfDays = 7;
                        break;
                    case "High (US only)":
                    case "Alta (US only)":
                        numberOfDays = 14;
                        break;
                    case "Medium (US only)":
                    case "Media (US only)":
                        numberOfDays = 30;
                        break;
                    case "Low (US only)":
                    case "Baja (US only)":
                        numberOfDays = 90;
                        break;
                    case "PM Cycle (US only)":
                    case "PM Cycle (US only)":
                        numberOfDays = 120;
                        break;
                    case "Projects (US only)":
                    case "Projects (US only)":
                        numberOfDays = 365;
                        break;
                    case "Standing WO (US only)":
                    case "Standing WO (US only)":
                        numberOfDays = 365;
                        break;
                    case "PM Cycle A (US only)":
                    case "PM Cycle A (US only)":
                        numberOfDays = 60;
                        break;
                    case "PM Cycle B (US only)":
                    case "PM Cycle B (US only)":
                        numberOfDays = 180;
                        break;
                    case "HV 6 month":
                    case "HV 6 Meses":
                        numberOfDays = 45;
                        break;
                    case "HV 5 years":
                    case "HV 5 Años":
                        numberOfDays = 450;
                        break;
                    case "HV 10 years":
                    case "HV 10 Años":
                        numberOfDays = 720;
                        break;
                }
                if (dateset != null) {
                    dateset = new Date(
                        dateset.getFullYear(),
                        dateset.getMonth(),
                        dateset.getDate() + numberOfDays,
                        dateset.getHours(),
                        dateset.getMinutes(),
                        dateset.getSeconds());
                }

                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_fechafin = dateset;
                    },
                    FS.CommonEDPR.onError,
                    null
                );


            }
            catch (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('10175_010', entityForm);
            }
        }
    },


    //AAC 
    //21935 : IMPORTANTE ESTE CAMBVIO GUARDA DOS VECES PARA QUE SE LLEVE EL CAMBIO DE ORIGEN A CRM
    onSaveOrigen: function (entityForm, estado) {

        var updOrden = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
        updOrden.id = entityForm.entity.id;
        updOrden.isNew = false;
        var props = updOrden.properties;
        props.atos_origen = estado;


        updOrden.save(
            function (err) {
                if (err) {
                    //MobileCRM.UI.MessageBox.sayText(err);
                }
                else {

                }
            }
        );
    },


    //  obtiene un parametro de edpr
    ObtenerParametroEdpr: function (entityForm, codigo, variable) {

        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='atos_parametrosedpr'>" +
            "<attribute name='atos_parametro'/>" +
            "<attribute name='atos_valor'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_parametro' value='" + codigo + "' operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    if (variable == 1) {
                        CodigoRegional = result[i][1];
                    }
                    if (variable == 2) {
                        CodigoSite = result[i][1];
                    }
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                MobileCRM.UI.MessageBox.sayText("Error 9--> " + err);
            },
            entityForm
        );
    },


    /// se encarga de cargar las ubicaciones  que se pueden clonar();
    CargarUbicacionesClonacion: function (entityForm, pagina) {
        var self = this;
        var OT = entityForm.entity;
        var ubicacion = null;
        var turbina;

        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
            ubicacion = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
        }

        var numComponentes = ubicacion.split("-").length;
        if (numComponentes > 4)
            turbina = ubicacion.split("-")[4];

        var ubicacionComodin;
        if (numComponentes > 4) {
            var ubicacionComodin = ubicacion.replace(turbina, turbina.substring(0, 1) + "%");
        }
        else {
            ubicacionComodin = "XXXXXXXXX";
        }

        fetchXmlRegistro = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'  page='" + pagina + "' paging-cookie='' > " +
            "<entity name='account'> " +
            "<attribute name='name'/>" +
            "<attribute name='accountid'/>" +
            "<attribute name='atos_name_en'/>" +
            "<attribute name='atos_name_es'/>" +
            "    <order descending='false' attribute='name'/>          " +
            "<filter type='and'>" +
            "<condition value='0' operator='eq' attribute='statecode'/>" +
            "	<condition attribute='name' value='" + ubicacionComodin + "' operator='like'/>  " +
            "</filter>" +
            "</entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlRegistro,
            function (result) {
                if (pagina == 1) {
                    // creamos la cabecera 
                    $("#tblClonacion").empty();

                    varFila = " <tr> id='cabecera' " +
                        "     <th>Sel</th>  " +
                        "     <th>Cod. </th>   " +
                        "     <th>Descrip.</th> " +
                        "</tr>";

                    $("#tblClonacion").append(varFila);
                }

                statusInsertarClonacion = [];
                statusBorrarClonacion = [];

                for (var i in result) {
                    var ubicacionId = result[i][1];
                    var nombre = result[i][0];

                    var numComponentesTmp = nombre.split("-").length;
                    var descripcion = "";
                    if (IdiomaUsuario == Idioma.ingles) {
                        descripcion = result[i][2];
                    }
                    else {
                        descripcion = result[i][3];
                    }
                    if (numComponentes == numComponentesTmp) {
                        var id = "chk_" + i;
                        var jsChange = " javascript:seleccionar( this,\"" + id + "\",\"" + ubicacionId + "\"  )  ";

                        varFila = "<tr> " +
                            " <td> " +
                            " <input id=" + id +
                            " name=" + i +
                            " onchange='" + jsChange + "'" +
                            " identificador='" + ubicacionId + "'   " +
                            " type='checkbox'" +
                            " />" +
                            "</td>  " +
                            "<td>" + nombre + "</td>  " +
                            "<td>" + descripcion + "</td>  " +
                            "</tr>";

                        $("#tblClonacion").append(varFila);
                    }
                }
                if (result.length == 500) {
                    self.CargarUbicacionesClonacion(entityForm, pagina + 1);
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
            },
            null
        );


    },
    /// <summary>Crea una copia de la OT que se recibe por parametro, copiando los campos definidos en la Acción
    ClonarOT: function (entityForm) {

        if (entityForm == null)
            entityForm = formulario;

        var self = this;
        try {
            var idAviso;
            var OT = entityForm.entity;

            var popup;
            if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box
                popup = new MobileCRM.UI.MessageBox("do you want to clone this/these work order/s?");
                popup.items = ["Yes", "No"];
            }
            else {
                popup = new MobileCRM.UI.MessageBox("¿Desea Clonar esta/s  orden/es de trabajo?");
                popup.items = ["Si", "No"];

            }

            popup.multiLine = true;
            popup.show(
                function (button) {
                    if (button == "Yes" || button == "Si") {

                        var numElemento = 1;
                        var numTotalElementos = statusInsertarClonacion.length;
                        if (numTotalElementos > 0) {
                            // ponemos el idioma al botn de guardar
                            if (IdiomaUsuario == Idioma.ingles)
                                textoCargando = "Loading...";
                            else
                                textoCargando = "Cargando...";
                            wait = MobileCRM.UI.EntityForm.showPleaseWait(textoCargando);
                        }
                        statusInsertarClonacion.forEach(function (valor, indice, array) {
                            if (valor.trim() != "") {


                                var fetchXmlUbicacion = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                                    "<entity name='account'>" +
                                    "<attribute name='atos_centrodeplanificacionid' />" +
                                    "<attribute name='atos_centroid' />" +
                                    "<attribute name='atos_puestodetrabajoresponsableid'/>" +
                                    "<attribute name='atos_indicadorabcid'/>" +
                                    "<attribute name='atos_centrodeemplazamientoid'/>" +
                                    "<attribute name='atos_grupoplanificadorid'/>" +
                                    "<filter type='and'>" +
                                    "<condition attribute='accountid' operator='eq' value='" + valor + "' />" +
                                    "</filter>" +
                                    "</entity>" +
                                    "</fetch>";

                                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlUbicacion,
                                    function (result) {
                                        var newOT = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
                                        var props = newOT.properties;
                                        props.msdyn_serviceaccount = new MobileCRM.Reference("account", valor, "");
                                        // SACARLOS DE UBICACION 
                                        if (result[0][0] != null)
                                            props.atos_centrodeplanificacinid = new MobileCRM.Reference("atos_centrodeplanificacion", result[0][0].id, "");
                                        if (result[0][1] != null)
                                            props.atos_centroid = new MobileCRM.Reference("atos_centro", result[0][1].id, "");
                                        if (OT.properties.atos_puestotrabajoprincipalid == null && result[0][2] != null) {
                                            props.atos_puestotrabajoprincipalid = new MobileCRM.Reference("atos_puestodetrabajo", result[0][2].id, "");
                                        }
                                        else {
                                            props.atos_puestotrabajoprincipalid = OT.properties.atos_puestotrabajoprincipalid;
                                        }
                                        if (result[0][3] != null)
                                            props.atos_indicadorabcid = new MobileCRM.Reference("atos_indicadorabc", result[0][3].id, "");
                                        if (result[0][4] != null)
                                            props.atos_centrodeemplazamientoid = new MobileCRM.Reference("atos_centrodeemplazamiento", result[0][4].id, "");

                                        if (OT.properties.atos_grupoplanificadorid == null && result[0][5] != null) {
                                            props.atos_grupoplanificadorid = new MobileCRM.Reference("atos_grupoplanificador", result[0][5].id, "");
                                        }
                                        else {
                                            props.atos_grupoplanificadorid = OT.properties.atos_grupoplanificadorid;
                                        }

                                        props.atos_clasedeordenid = OT.properties.atos_clasedeordenid;
                                        props.atos_claseactividadpmid = OT.properties.atos_claseactividadpmid;
                                        props.atos_titulo = OT.properties.atos_titulo.substr(0, 40);
                                        props.atos_clasedeordenid = OT.properties.atos_clasedeordenid;
                                        props.msdyn_priority = OT.properties.msdyn_priority;
                                        props.atos_fase = OT.properties.msdyn_name;
                                        props.atos_fechainicio = new Date();
                                        props.atos_fechafin = new Date();
                                        props.atos_esclonacion = true;


                                        // decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
                                        props.atos_origen = 300000002;

                                        newOT.save(
                                            function (err) {
                                                if (err) {
                                                    MobileCRM.UI.MessageBox.sayText(err);
                                                    wait.close();
                                                }
                                                else {
                                                    // crear estado inicial 
                                                    // Estatus de usuario
                                                    var newLogEstadoUsuario = new MobileCRM.DynamicEntity.createNew("atos_logestado");
                                                    var props = newLogEstadoUsuario.properties;
                                                    props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", newOT.id, "");
                                                    props.atos_identificador = "E0001";
                                                    // en ingles NAPR
                                                    props.atos_name = "ALIB";
                                                    props.atos_numerocambio = 1;
                                                    props.atos_objeto = 1;
                                                    props.atos_indicadorcambio = 1;
                                                    props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", estadoUsuarioInicialId, "");


                                                    newLogEstadoUsuario.save(
                                                        function (err) {
                                                            if (err) {
                                                                //MobileCRM.UI.MessageBox.sayText(err);
                                                            }
                                                            else {

                                                            }
                                                        }
                                                    );



                                                    // creo las operaciones que hay que clonar
                                                    FS.OrdenTrabajo.CrearHojasDeRutaOTClonado(entityForm, newOT);
                                                    FS.OrdenTrabajo.CrearOperacionesOTClonado(entityForm, newOT, numElemento, numTotalElementos);
                                                    numElemento = numElemento + 1;
                                                }
                                            }
                                        );
                                    },
                                    function (err) {
                                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                        if (debug == true)
                                            MobileCRM.UI.MessageBox.sayText("Error 10--> " + err);
                                    },
                                    null
                                );

                            }
                        });
                    }
                    else {
                        return;
                    }
                }
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
        }
    },
    // clona las hojas de ruta  que tiene asociado una OT  para la OT que va a ser clonado;
    CrearHojasDeRutaOTClonado: function (entityForm, newOT) {
        try {
            var guidOTOrigen = entityForm.entity.id;
            var guidOTClonado = newOT.id;
            var transaccionClonacion = 2;
            var varFetchBuscar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_hojaderutadeordendetrabajo'>" +
                "<attribute name='atos_name' />" +
                "<attribute name='atos_hojaderutaid' />" +
                "<attribute name='atos_ordendetrabajoid' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + guidOTOrigen + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {

                        var newHojaDeRutaOT = new MobileCRM.DynamicEntity.createNew("atos_hojaderutadeordendetrabajo");
                        var props = newHojaDeRutaOT.properties;
                        props.atos_name = result[i][0];
                        props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", newOT.id, "");
                        if (result[i][1] != null)
                            props.atos_hojaderutaid = new MobileCRM.Reference("atos_hojaderuta", result[i][1].id, "");
                        props.atos_origendetransaccion = transaccionClonacion;

                        // decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
                        props.atos_origen = 300000002;

                        newHojaDeRutaOT.save(
                            function (err) {
                                if (err) {

                                }
                                else {
                                }
                            }
                        );
                    }
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    MobileCRM.UI.MessageBox.sayText("Error 11--> " + err);
                },
                entityForm
            );


        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
        }
    },

    // clona las operaciones que tiene asociado una OT  para la OT que va a ser clonado;
    CrearOperacionesOTClonado: function (entityForm, newOT, numElemento, numTotalElementos) {
        try {
            var operacion = 0;
            var operacionInsertada = 0;
            var transaccionClonacion = 2;
            var guidOTOrigen = entityForm.entity.id;
            var guidOTClonado = newOT.id;
            var varFetchBuscar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='msdyn_workorderservicetask'>" +
                "<attribute name='msdyn_workorderservicetaskid' />" +
                "<attribute name='atos_descripcion' />" +
                "<attribute name='atos_clavedecontrolid' />" +
                "<attribute name='atos_clasedeactividadid' />" +
                "<attribute name='atos_hojaderutaid' />" +
                "<attribute name='atos_hojaderutaordendetrabajoid' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
                "<condition attribute='msdyn_workorder' operator='eq' value='" + guidOTOrigen + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {
                        operacion = operacion + 1;
                        var numOperacion = zeroPad(operacion * 10, 4);
                        var newOperacionOT = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
                        var props = newOperacionOT.properties;
                        props.msdyn_name = newOT.properties.atos_titulo.substr(0, 40);
                        props.msdyn_workorder = new MobileCRM.Reference("msdyn_workorder", newOT.id, "");
                        props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", newOT.properties.msdyn_serviceaccount.id, "");
                        props.atos_centroid = newOT.properties.atos_centroid;
                        props.atos_puestotrabajoprincipalid = newOT.properties.atos_puestotrabajoprincipalid;
                        props.atos_centroplanificacionid = newOT.properties.atos_centrodeplanificacinid;

                        if (result[i][2] != null)
                            props.atos_clavedecontrolid = new MobileCRM.Reference("atos_clavedecontrol", result[i][2].id, "");
                        if (result[i][3] != null)
                            props.atos_clasedeactividadid = new MobileCRM.Reference("atos_clasedeactividad2", result[i][3].id, "");
                        if (result[i][4] != null)
                            props.atos_hojaderutaid = new MobileCRM.Reference("atos_hojaderuta", result[i][4].id, "");
                        if (result[i][5] != null)
                            props.atos_hojaderutaordendetrabajoid = new MobileCRM.Reference("atos_hojaderutadeordendetrabajo", result[i][5].id, "");

                        if (result[i][1] != null)
                            props.atos_descripcion = result[i][1];

                        props.atos_origendetransaccion = transaccionClonacion;
                        props.atos_numerooperacioncrm = numOperacion;
                        // decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
                        props.atos_origen = 300000002;

                        newOperacionOT.save(
                            function (err) {
                                operacionInsertada = operacionInsertada + 1;
                                if (err) {
                                    MobileCRM.UI.MessageBox.sayText(err);
                                    wait.close();
                                }
                                else {

                                    var unico = false;
                                    if (numTotalElementos == 1) {
                                        unico = true;
                                    }
                                    var ultimaOperacion = false;
                                    if (operacionInsertada == result.length)
                                        ultimaOperacion = true;
                                    FS.OrdenTrabajo.CrearComponenteOperacionClonado(entityForm, result[operacionInsertada - 1][0], this.id, guidOTOrigen, guidOTClonado, numElemento, numTotalElementos, ultimaOperacion, unico);
                                }

                            }
                        );
                    }


                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    MobileCRM.UI.MessageBox.sayText("Error 12--> " + err);
                },
                entityForm
            );
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
        }
    },

    CrearComponenteOperacionClonado: function (entityForm, operacionIdOriginal, operacionIdClonado, ordenIdOriginal, ordenIdClonado, numElemento, numTotalElementos, ultimaOperacion, esUnico) {
        ///AAC 2021-06-03 MM-95 Lotes Fase II - Revisar y ampliar la clonación de orden de trabajo RESCO
        // obtenemos los servicios de esa operacion y los clonamos
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='atos_componenteoperacion'>" +
            "<attribute name='atos_ordendetrabajoid' />" +
            "<attribute name='atos_operacionid' />" +
            "<attribute name='atos_centrocomponenteid' />" +
            "<attribute name='atos_almacenid' />" +
            "<attribute name='atos_materialid' />" +
            "<attribute name='atos_descripcion' />" +
            "<attribute name='atos_unidademedidaid' />" +
            "<attribute name='atos_listadematerial' />" +
            "<attribute name='atos_tipodemovimientoid' />" +
            "<attribute name='atos_fechadelcomponente' />" +
            "<attribute name='atos_cantidadadconfirmacion' />" +
            "<attribute name='atos_cantidad' />" +
            "<attribute name='atos_unidadconfirmacionid' />" +
            "<attribute name='atos_centroid' />" +
            "<attribute name='atos_posicion' />" +
            "<attribute name='atos_almacenconfirmacionid' />" +
            "<attribute name='atos_grupodearticulosid' />" +
            "<attribute name='atos_loteid' />" +
            "<attribute name='atos_aplicanumseries' />" +
            "<attribute name='atos_hojarutaorigen' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
            "<condition attribute='atos_operacionid' operator='eq' value='" + operacionIdOriginal + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var i;
                var j = 0;
                var transaccionClonacion = 2;
                var componente = 0;
                var componenteInsertado = 0;
                for (var i in result) {
                    componente = componente + 1;
                    var numComponente = zeroPad(componente * 10, 4);


                    var newComponente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
                    var props = newComponente.properties;
                    props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenIdClonado, "");
                    props.atos_operacionid = new MobileCRM.Reference("msdyn_workorderservicetask", operacionIdClonado, "");
                    if (result[i][2] != null)
                        props.atos_centrocomponenteid = new MobileCRM.Reference("atos_centro", result[i][2].id, "");
                    if (result[i][3] != null)
                        props.atos_almacenid = new MobileCRM.Reference("msdyn_warehouse", result[i][3].id, "");
                    if (result[i][4] != null)
                        props.atos_materialid = new MobileCRM.Reference("product", result[i][4].id, "");
                    if (result[i][6] != null)
                        props.atos_unidademedidaid = new MobileCRM.Reference("atos_unidaddemedida", result[i][6].id, "");
                    if (result[i][8] != null)
                        props.atos_tipodemovimientoid = new MobileCRM.Reference("atos_tipodemovimiento", result[i][8].id, "");
                    if (result[i][12] != null)
                        props.atos_unidadconfirmacionid = new MobileCRM.Reference("atos_unidaddemedida", result[i][12].id, "");
                    if (result[i][13] != null)
                        props.atos_centroid = new MobileCRM.Reference("atos_centro", result[i][13].id, "");
                    if (result[i][15] != null)
                        props.atos_almacenconfirmacionid = new MobileCRM.Reference("msdyn_warehouse", result[i][15].id, "");
                    if (result[i][16] != null)
                        props.atos_grupodearticulosid = new MobileCRM.Reference("atos_grupodearticulos", result[i][16].id, "");
                    if (result[i][17] != null && (result[i][18] == null || result[i][18] == 0))
                        props.atos_loteid = new MobileCRM.Reference("atos_maestrolote", result[i][17].id, "");
                    if (result[i][19] != null)
                        props.atos_hojarutaorigen = new MobileCRM.Reference("atos_hojaderuta", result[i][19].id, "");


                    //AAC 2021-06-03 MM-95 Lotes Fase II - Revisar y ampliar la clonación de orden de trabajo RESCO


                    props.atos_cantidadadconfirmacion = result[i][10];
                    props.atos_cantidad = result[i][11];
                    props.atos_descripcion = result[i][5];
                    props.atos_fechadelcomponente = new Date();
                    props.atos_listadematerial = result[i][7];
                    props.atos_posicion = numComponente;

                    props.atos_origen = 300000002;

                    newComponente.save(
                        function (err) {
                            if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                                wait.close();
                            }
                            else {
                                componenteInsertado = componenteInsertado + 1;
                                if (componenteInsertado == result.length) {
                                    FS.OrdenTrabajo.CrearServicioOperacionClonado(entityForm, operacionIdOriginal, operacionIdClonado, ordenIdOriginal, ordenIdClonado, numElemento, numTotalElementos, ultimaOperacion, esUnico);
                                }
                            }
                        }
                    );
                }
                if (result.length == 0) {
                    FS.OrdenTrabajo.CrearServicioOperacionClonado(entityForm, operacionIdOriginal, operacionIdClonado, ordenIdOriginal, ordenIdClonado, numElemento, numTotalElementos, ultimaOperacion, esUnico);
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                MobileCRM.UI.MessageBox.sayText("Error 13--> " + err);
            },
            entityForm
        );
    },


    CrearServicioOperacionClonado: function (entityForm, operacionIdOriginal, operacionIdClonado, ordenIdOriginal, ordenIdClonado, numElemento, numTotalElementos, ultimaOperacion, esUnico) {
        // obtenemos los servicios de esa operacion y los clonamos
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='atos_serviciooperacion'>" +
            "<attribute name='atos_ordendetrabajoid' />" +
            "<attribute name='atos_operacionid' />" +
            "<attribute name='atos_servicioid' />" +
            "<attribute name='atos_textobreve' />" +
            "<attribute name='atos_unidadmedidaid' />" +
            "<attribute name='atos_precio' />" +
            "<attribute name='atos_clasedecosteid' />" +
            "<attribute name='atos_posicion' />" +
            "<attribute name='atos_cantidad' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
            "<condition attribute='atos_operacionid' operator='eq' value='" + operacionIdOriginal + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var i;
                var j = 0;
                var transaccionClonacion = 2;
                var servicio = 0
                var servicioInsertado = 0
                for (var i in result) {
                    servicio = servicio + 1;
                    var numServicio = zeroPad(servicio, 10);


                    var newServicio = new MobileCRM.DynamicEntity.createNew("atos_serviciooperacion");
                    var props = newServicio.properties;
                    props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenIdClonado, "");
                    props.atos_operacionid = new MobileCRM.Reference("msdyn_workorderservicetask", operacionIdClonado, "");
                    if (result[i][2] != null)
                        props.atos_servicioid = new MobileCRM.Reference("atos_servicio", result[i][2].id, "");
                    if (result[i][4] != null)
                        props.atos_unidadmedidaid = new MobileCRM.Reference("atos_unidaddemedida", result[i][4].id, "");
                    if (result[i][6] != null)
                        props.atos_clasedecosteid = new MobileCRM.Reference("atos_clasedecoste", result[i][6].id, "");

                    props.atos_textobreve = result[i][3];
                    props.atos_precio = result[i][5];
                    props.atos_posicion = numServicio;
                    props.atos_cantidad = result[i][8];
                    props.atos_origendetransaccion = transaccionClonacion;

                    props.atos_origen = 300000002;

                    newServicio.save(
                        function (err) {
                            if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                                wait.close();
                            }
                            else {
                                servicioInsertado = servicioInsertado + 1;
                                if (numElemento == numTotalElementos && result.length == servicioInsertado && ultimaOperacion) {
                                    if (IdiomaUsuario == Idioma.ingles) {
                                        MobileCRM.UI.MessageBox.sayText("Clone process has finished. ");
                                    }
                                    else {
                                        MobileCRM.UI.MessageBox.sayText("El proceso de clonado ha terminado. ");
                                    }
                                    wait.close();


                                    MobileCRM.UI.EntityForm.executeCommandByName("custom_cancelClonarOT",
                                        function (entityForm) {
                                            if (numTotalElementos == 1) {
                                                MobileCRM.UI.FormManager.showDetailDialog("msdyn_workorder", ordenIdClonado);
                                            }
                                        },
                                        function (err) {
                                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                            MobileCRM.UI.MessageBox.sayText("Error 14--> " + err);
                                        }
                                    );
                                }
                            }
                        }
                    );
                }

                if (result.length == 0 && numElemento == numTotalElementos && ultimaOperacion) {
                    if (IdiomaUsuario == Idioma.ingles) {
                        MobileCRM.UI.MessageBox.sayText("Clone process has finished. ");
                    }
                    else {
                        MobileCRM.UI.MessageBox.sayText("El proceso de clonado ha terminado. ");
                    }
                    wait.close();

                    MobileCRM.UI.EntityForm.executeCommandByName("custom_cancelClonarOT",
                        function (entityForm) {
                            if (numTotalElementos == 1 && ultimaOperacion) {
                                MobileCRM.UI.FormManager.showDetailDialog("msdyn_workorder", ordenIdClonado);

                            }
                        },
                        function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                            MobileCRM.UI.MessageBox.sayText("Error 15--> " + err);
                        }
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            entityForm
        );
    },


    onChangeClaseOT: function (entityForm) {
        var self = this;
        self.CalcularEstadoSistemaInicial(entityForm);
        self.CalcularEstadoUsuarioInicial(entityForm);
        self.ComprobarAvisoNoProgramable(entityForm);
    },

    CalcularEstadoUsuarioInicial: function (entityForm) {
        var self = this;
        if (entityForm.entity.properties.atos_clasedeordenid == null)
            return;

        var CAid = entityForm.entity.properties.atos_clasedeordenid.id;
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'> " +
            "  <entity name='atos_estatusdeaviso'>" +
            "	 <attribute name='atos_name'/>" +
            "	 <attribute name='atos_estatusdeavisoid'/>" +
            "	 <attribute name='atos_tipoestado'/>" +
            "	 <attribute name='atos_numeroclasificacionsuperior'/>" +
            "	 <attribute name='atos_numeroclasificacioninferior'/>" +
            "	 <attribute name='atos_numeroclasificacion'/> " +
            "	 <attribute name='atos_codigo_en'/>" +
            "	 <attribute name='atos_codigo_es'/> " +
            "	 <attribute name='atos_perfilestatusid'/>" +
            "	 <attribute name='atos_name_en'/>" +
            "	 <attribute name='atos_name_en'/>" +
            "	 <attribute name='atos_name_es'/>" +
            "	 <attribute name='statuscode'/>" +
            "	 <attribute name='ownerid'/>" +
            "	 <attribute name='atos_prioridad'/>" +
            "	 <attribute name='atos_posicion'/>" +
            "	 <attribute name='modifiedonbehalfby'/>" +
            "	 <attribute name='modifiedby'/> " +
            "	 <attribute name='atos_identificador'/>" +
            "	 <attribute name='modifiedon'/>" +
            "	 <attribute name='overriddencreatedon'/>" +
            "	 <attribute name='createdon'/>" +
            "	 <attribute name='statecode'/>" +
            "	 <attribute name='atos_esinicial'/>" +
            "	 <order descending='false' attribute='atos_numeroclasificacion'/>" +
            "	 <order descending='false' attribute='atos_codigo_en'/>" +
            "    <filter type='and'>" +
            "      <condition attribute='atos_tipoestado' operator='eq' value='2' />" +
            "    </filter> " +
            "    <link-entity name='atos_perfilestatus' from='atos_perfilestatusid' to='atos_perfilestatusid' link-type='inner' alias='am'>" +
            "      <link-entity name='atos_clasedeorden_atos_perfilestatus' from='atos_perfilestatusid' to='atos_perfilestatusid' visible='false' intersect='true'>" +
            "        <link-entity name='atos_clasedeorden' from='atos_clasedeordenid' to='atos_clasedeordenid' alias='an'>" +
            "        <filter type='and'>" +
            "          <condition attribute='atos_clasedeordenid' operator='eq'  uitype='atos_clasedeordenid' value='{" + CAid + "}' />" +
            "        </filter>" +
            "        </link-entity>" +
            "      </link-entity>" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    // comprobamso que nº clasificacion no sea nula y este entre los estados 1 y 5
                    if (result[i][5] != "undefined" &&
                        result[i][5] != "null" &&
                        result[i][5] == 1) {
                        estadoUsuarioInicialId = result[i][1];
                    }
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 8--> " + err);
            },
            entityForm
        );
    },


    CalcularEstadoSistemaInicial: function (entityForm) {

        if (entityForm.entity.properties.atos_clasedeordenid == null)
            return;

        var CAid = entityForm.entity.properties.atos_clasedeordenid.id;

        var fetchXmlEstadoAvisoPerfil = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'> " +
            "  <entity name='atos_perfilestatus'> " +
            "    <attribute name='atos_codigo' /> " +
            "    <filter type='and'>" +
            "      <condition attribute='statecode' operator='eq' value='0' />" +
            "    </filter>" +
            "    <link-entity name='atos_clasedeorden_atos_perfilestatus' from='atos_perfilestatusid' to='atos_perfilestatusid' visible='false' intersect='true'>" +
            "      <link-entity name='atos_clasedeorden' from='atos_clasedeordenid' to='atos_clasedeordenid' alias='ao'>" +
            "        <filter type='and'>" +
            "          <condition attribute='atos_clasedeordenid' operator='eq'  uitype='atos_clasedeordenid' value='{" + CAid + "}' />" +
            "        </filter>" +
            "      </link-entity>" +
            "    </link-entity> " +
            "    <link-entity name='atos_estatusdeaviso' from='atos_perfilestatusid' to='atos_perfilestatusid' link-type='inner' alias='ap'>" +
            "		  <attribute name='atos_estatusdeavisoid' />" +
            "		  <attribute name='atos_codigo' />" +
            "		  <attribute name='atos_codigo_es' />" +
            "		  <attribute name='atos_codigo_en' />" +
            "		  <attribute name='atos_codigo_en' />" +
            "		  <attribute name='atos_identificador' />" +
            "		  <attribute name='atos_statuscode' />" +
            "      <filter type='and'>" +
            "	    <condition attribute='atos_esinicial' operator='eq' value='0' />" +
            "        <condition attribute='atos_tipoestado' operator='eq' value='1' />" +
            "		<condition attribute='statecode' operator='eq' value='0' />" +
            "		<condition attribute='atos_statuscode' operator='eq' value='1' />" +
            "      </filter>" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEstadoAvisoPerfil,
            function (result) {
                //INC2439901:AAC:25-03-11: error  al  crear una OT
                if (result && result.length > 0) {
                    estadoSistemaInicialId = result[0][1];
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 9--> " + err);
            },
            entityForm
        );



    },

    // 2021-08-11 AAC MM-437 Creacion y modificacion de equipo
    CrearActualizarEquipo: function (entityForm) {
        var ordenId = entityForm.entity.id;
        if (entityForm.entity.isNew) {
            if (entityForm.entity.properties.msdyn_customerasset != null) {
                // creo el objeto de referencia
                var newoOjetoReferencia = new MobileCRM.DynamicEntity.createNew("atos_objetoorden");
                var props = newoOjetoReferencia.properties;
                props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenId, "");
                props.atos_equipoid = new MobileCRM.Reference("msdyn_customerasset", equipoId, "");
                props.atos_origen = 300000002;

                newoOjetoReferencia.save(
                    function (err) {
                        if (err) {
                            MobileCRM.UI.MessageBox.sayText(err);
                        }
                        else {
                            // creado objeto referencia  de equipo
                        }
                    }
                );

            }
        }
        else {
            if (entityForm.entity.properties.msdyn_customerasset != null) {
                // si el anterior es nulo  creo el objeto 
                var equipoId = entityForm.entity.properties.msdyn_customerasset.id;
                /// <summary>
                /// NÃºmero de objetos de aviso que tenga asignada una orden de trabajo
                /// </summary>
                var fetchEquipo = '<fetch resultformat="Array">' +
                    '	<entity name="atos_objetoorden">' +
                    '		<attribute name="atos_equipoid" />' +
                    '		<attribute name="statecode" />' +
                    '		<filter type="and">' +
                    '			<condition attribute="atos_equipoid" operator="eq" value="' + equipoId + '" />' +
                    '			<condition attribute="atos_ordendetrabajoid" operator="eq" value="' + entityForm.entity.id + '"/>' +
                    '		</filter>' +
                    '	</entity>' +
                    '</fetch>';
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchEquipo,
                    function (result) {
                        if (result && result.length > 0) {
                            // si esta inactivo lo activo
                            if (result[0][1] == 1) {
                                var updObjetoReferencia = new MobileCRM.DynamicEntity.createNew("atos_objetoorden");
                                updObjetoReferencia.id = result[0].id;
                                updObjetoReferencia.isNew = false;
                                var props = updObjetoReferencia.properties;
                                props.statecode = 0;
                                updObjetoReferencia.save(
                                    function (err) {
                                        if (err) {
                                            MobileCRM.UI.MessageBox.sayText(err);
                                        }
                                        else {
                                            // creado objeto referencia  de equipo
                                        }
                                    }
                                );


                            }
                        }
                        else {
                            // creo el objeto referencia
                            var newoOjetoReferencia = new MobileCRM.DynamicEntity.createNew("atos_objetoorden");
                            var props = newoOjetoReferencia.properties;
                            props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenId, "");
                            props.atos_equipoid = new MobileCRM.Reference("msdyn_customerasset", equipoId, "");
                            props.atos_origen = 300000002;

                            newoOjetoReferencia.save(
                                function (err) {
                                    if (err) {
                                        MobileCRM.UI.MessageBox.sayText(err);
                                    }
                                    else {
                                        // creado objeto referencia  de equipo
                                    }
                                }
                            );
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 109--> " + err);
                    },
                    entityForm
                );
                // si habia uno lo desactivo 
                if (equipoIdAntiguo != null && equipoIdAntiguo != equipoId) {
                    var fetchEquipoAntiguo = '<fetch resultformat="Array">' +
                        '	<entity name="atos_objetoorden">' +
                        '		<attribute name="atos_equipoid" />' +
                        '		<attribute name="statecode" />' +
                        '		<filter type="and">' +
                        '			<condition attribute="atos_equipoid" operator="eq" value="' + equipoIdAntiguo + '" />' +
                        '			<condition attribute="atos_ordendetrabajoid" operator="eq" value="' + entityForm.entity.id + '"/>' +
                        '		</filter>' +
                        '	</entity>' +
                        '</fetch>';
                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchEquipoAntiguo,
                        function (result) {
                            if (result && result.length > 0) {
                                // si esta inactivo lo activo
                                if (result[0][1] == 0) {
                                    var updObjetoReferencia = new MobileCRM.DynamicEntity.createNew("atos_objetoorden");
                                    updObjetoReferencia.id = result[0].id;
                                    updObjetoReferencia.isNew = false;
                                    var props = updObjetoReferencia.properties;
                                    props.statecode = 1;
                                    updObjetoReferencia.save(
                                        function (err) {
                                            if (err) {
                                                MobileCRM.UI.MessageBox.sayText(err);
                                            }
                                            else {
                                                // desactivado objeto referencia  de equipo
                                            }
                                        }
                                    );


                                }
                            }
                        },
                        function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                            if (debug == true)
                                MobileCRM.UI.MessageBox.sayText("Error 109--> " + err);
                        },
                        entityForm
                    );
                }
            }
        }
    },

    // 2021-08-10 AAC REDMINE:23207 Validar que otra OT tenga le mismo aviso
    // validar aviso
    ValidarAviso: function (entityForm) {
        if (entityForm.entity.properties.atos_avisoid != null) {
            var saveHandler = entityForm.suspendSave();
            var avisoId = entityForm.entity.properties.atos_avisoid.id;
            var ordenId = entityForm.entity.id;

            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                "  <entity name='msdyn_workorder'>" +
                "    <attribute name='msdyn_name' />" +
                "    <filter type='and'>" +
                "      <condition attribute='atos_avisoid' operator='eq' value='" + avisoId + "' />" +
                "      <condition attribute='msdyn_workorderid' operator='ne'  value='" + ordenId + "' />" +
                "    </filter>" +
                "  </entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    if (result && result.length > 0) {

                        if (IdiomaUsuario == 1033) {
                            mensaje = "Notification is asigned to other work order.";
                        }
                        else {
                            mensaje = "El aviso esta asignado a otra OT.";
                        }
                        saveHandler.resumeSave(mensaje);
                    }
                    else {
                        saveHandler.resumeSave();
                    }
                },
                function (err) {
                    saveHandler.resumeSave("OT fetch error: " + error);
                },
                entityForm
            );
        }
    },

    onLoadSetPartsUsed: function () {
        try {
            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                    var ordenId = entityForm.entity.id;
                    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                        "  <entity name='atos_componenteoperacion'>" +
                        "    <attribute name='atos_name' />" +
                        "    <attribute name='atos_listadematerial' />" +
                        "    <filter type='and'>" +
                        //"      <condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
                        //"      <condition attribute='atos_listadematerial' operator='ne' value='300000000' />" +
                        "      <condition attribute='atos_borradoensap' operator='ne' value='1' />" +
                        "      <condition attribute='atos_ordendetrabajoid' operator='eq' value='" + ordenId + "' />" +
                        "    </filter>" +
                        //"    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' link-type='inner' alias='ac'>" +
                        //"      <filter type='and'>" +
                        //"        <condition attribute='msdyn_workorderid' operator='eq' uiname='0000002361' uitype='msdyn_workorder' value='" + ordenId + "' />" +
                        //"      </filter>" +
                        //"    </link-entity>" +
                        "  </entity>" +
                        "</fetch>";
                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                        function (result) {
                            var noPartsUsed_Material = false;
                            if (result.length > 0) {
                                for (var i in result) {
                                    var atos_listadematerial = result[i][1];
                                    if (atos_listadematerial === '300000000') {
                                        noPartsUsed_Material = true;
                                    }
                                    //MobileCRM.UI.MessageBox.sayText("atos_listadematerial: " + atos_listadematerial);
                                    //
                                }//for

                                MobileCRM.UI.EntityForm.requestObject(
                                    function (entityForm) {
                                        if (noPartsUsed_Material === true) {
                                            //MobileCRM.UI.MessageBox.sayText("onLoadSetPartsUsed (if noPartsUsed_Material): false");
                                            entityForm.entity.properties.atos_nopartsused = false; //set Parts Used = True (exists componentes T assigned to the WO)
                                        }
                                        else {
                                            //MobileCRM.UI.MessageBox.sayText("onLoadSetPartsUsed (else): true");
                                            entityForm.entity.properties.atos_nopartsused = true; //set Parts Used = True (exists componentes not T assigned to the WO)
                                        }
                                    },
                                    FS.CommonEDPR.onError,
                                    null
                                );

                            }//if
                            //else {
                            //    //MobileCRM.UI.MessageBox.sayText("onLoadSetPartsUsed (else): false");
                            //    MobileCRM.UI.EntityForm.requestObject(
                            //        function (entityForm) {
                            //            entityForm.entity.properties.atos_nopartsused = false; //set Parts Used = False (no parts are used in the WO)
                            //        },
                            //        FS.CommonEDPR.onError,
                            //        null
                            //    );
                            //}//else
                        }//function
                    );//executeFromXML
                },//function entityForm
                function (err) {
                    MobileCRM.bridge.alert("An error occurred: " + err);
                },//function err
                null
            );//requestObject
        } catch (err) {
            if (debug === true)
                MobileCRM.UI.MessageBox.sayText("Error 5000 --> " + err);
        }
    },//onLoadSetPartsUsed

    onChangeNoPartUsed: function (entityForm) {
        try {
            CrearComponenteNoPartUsed = null;
            // comprobamos que se esta marcando el check 
            var noPartUsed = entityForm.entity.properties.atos_nopartsused;
            if (noPartUsed === false) {
                // comprobamos que no tiene componetes sino damos un error 
                var ordenId = entityForm.entity.id;
                var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                    "  <entity name='atos_componenteoperacion'>" +
                    "    <attribute name='atos_name' />" +
                    "    <filter type='and'>" +
                    //"      <condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
                    "      <condition attribute='atos_borradoensap' operator='ne' value='1' />" +
                    "      <condition attribute='atos_listadematerial' operator='eq' value='300000000' />" +
                    "    </filter>" +
                    "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' link-type='inner' alias='ac'>" +
                    "      <filter type='and'>" +
                    "        <condition attribute='msdyn_workorderid' operator='eq' value='" + ordenId + "' />" +
                    "      </filter>" +
                    "    </link-entity>" +
                    "  </entity>" +
                    "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        if (result.length == 0) {
                            // creamos el componete en la primera operacion  que tenga
                            //busco la operacion 
                            var fetchXmlOperacion = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                                "  <entity name='msdyn_workorderservicetask'>" +
                                "    <attribute name='msdyn_workorderservicetaskid' />" +
                                "	 <attribute name='msdyn_workorder' />" +
                                "    <attribute name='atos_numerooperacioncrm' />" +
                                "    <attribute name='atos_centroid' />" +
                                "    <attribute name='atos_clavedecontrolid' />" +
                                "    <order attribute='atos_numerooperacioncrm' descending='false' />" +
                                "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' link-type='inner' alias='ae'>" +
                                "      <filter type='and'>" +
                                "        <condition attribute='msdyn_workorderid' operator='eq'  value='" + ordenId + "' />" +
                                "      </filter>" +
                                "    </link-entity>" +
                                "  </entity>" +
                                "</fetch>";


                            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperacion,
                                function (resultOperacion) {
                                    if (resultOperacion.length > 0) {
                                        CrearComponenteNoPartUsed = resultOperacion[0];
                                    }
                                    else {
                                        var idMsjeError = "10104_041";
                                        FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "004");
                                        MobileCRM.UI.EntityForm.requestObject(
                                            function (entityForm) {
                                                //entityForm.entity.properties.atos_nopartsused = false;
                                            },
                                            FS.CommonEDPR.onError,
                                            null
                                        );
                                    }
                                },
                                function (err) {
                                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                    //if (debug == true)
                                    //entityForm.entity.properties.atos_nopartsused = false;
                                },
                                entityForm
                            );
                        }//if
                        else {
                            var idMsjeError = "10104_040";
                            //FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "004");
                            //MobileCRM.UI.EntityForm.requestObject(
                            //	function (entityForm) {
                            //		entityForm.entity.properties.atos_nopartsused = true;
                            //	},
                            //	FS.CommonEDPR.onError,
                            //	null
                            //);
                        }//else
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug === true)
                            MobileCRM.UI.MessageBox.sayText("Error 100--> " + err);
                        //entityForm.entity.properties.atos_nopartsused = false;
                    },
                    entityForm
                );

            }
        } catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            //entityForm.entity.properties.atos_nopartsused = false;
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 100--> " + err);
        }
    },

  ///AAC-2020-05-11
    /// REDMMINE: 21808
    /// FUNCIONALIDAD DE  NO PART USED
    ///  <summary> Funvion que se encarga de crear  la operacion de No PartUsed
    ///	</summary>
    CrearComponenteNoPartUsed: function (entityForm, operacion) {
        var saveHandler = entityForm.suspendSave();
        var postSuspend = entityForm.suspendPostSave();
        // obtengo el tipo de movimiento por defecto 
        var ordenId = entityForm.entity.id;
        var codigoTipoMovi = "261";
        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' no-lock='true' version='1.0'>" +
            "<entity name='atos_tipodemovimiento'>" +
            "<attribute name='atos_tipodemovimientoid'/>" +
            "<attribute name='atos_name'/>" +
            "<attribute name='createdon'/>" +
            "<order descending='false' attribute='atos_name'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_codigo' value='" + codigoTipoMovi + "' operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                if (result.length > 0) {
                    var operacionId = operacion[0];
                    var newComponente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
                    var props = newComponente.properties;
                    props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenId, "");
                    props.atos_operacionid = new MobileCRM.Reference("msdyn_workorderservicetask", operacionId, "");
                    if (operacion[3] !== null)
                        props.atos_centrocomponenteid = new MobileCRM.Reference("atos_centro", operacion[3].id, "");
                    if (result[0][0] !== null)
                        props.atos_tipodemovimientoid = new MobileCRM.Reference("atos_tipodemovimiento", result[0][0], "");
                    if (operacion[3] !== null)
                        props.atos_centroid = new MobileCRM.Reference("atos_centro", operacion[3].id, "");
                    props.atos_descripcion = "No Part Used";
                    props.atos_listadematerial = 300000000; // ItemCategory.T_NoPartsUsed;
                    props.atos_origen = 300000002; // Origin.Resco;

                    newComponente.save(
                        function (err) {
                            if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {
                                // creado componete tipo T
                            }
                        }
                    );
                }
                saveHandler.resumeSave();
                postSuspend.resumePostSave();
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 100--> " + err);
                saveHandler.resumeSave();
                postSuspend.resumePostSave();
            },
            entityForm
        );

        /*
        debugger;
        fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);
        Xrm.WebApi.retrieveMultipleRecords("atos_tipodemovimiento", fetchXml).then(
            function success(result) {
                debugger;
                if ((result.entities != null) && (result.entities.length > 0)) {
                    //creo el componete
                    var operacionId = operacion["msdyn_workorderservicetaskid"];
                    debugger;
                    var datoEntidadComponente = {
                        "atos_ordendetrabajoid@odata.bind": "/msdyn_workorders(" + ordenId + ")",
                        "atos_operacionid@odata.bind": "/msdyn_workorderservicetasks(" + operacionId + ")",
                        "atos_centrocomponenteid@odata.bind": operacion["_atos_centroid_value"] != null ? "/atos_centros(" + operacion["_atos_centroid_value"] + ")" : undefined,
                        "atos_tipodemovimientoid@odata.bind": result.entities[0]["atos_tipodemovimientoid"] != null ? "/atos_tipodemovimientos(" + result.entities[0]["atos_tipodemovimientoid"] + ")" : undefined,
                        "atos_centroid@odata.bind": operacion["_atos_centroid_value"] != null ? "/atos_centros(" + operacion["_atos_centroid_value"] + ")" : undefined,
                        "atos_descripcion": "No Parts Used",
                        "atos_listadematerial": "300000000"
                        //"atos_posicion": "10"
                    };

                // Xrm.WebApi.createRecord("atos_componenteoperacion", datoEntidadComponente).then(
                    function success(resultComponente) {
                        if(resultComponente!=null){
                        	
                        }
                	
                    },
                    function (error) {
                        console.log("**Error creacion CrearComponenteNoPartUsed de OT " + error);
                        Atos.Helper.GetErrorCollectionByCode('JS_001');
                    	
                    });
                }
            },
            function (error) {
                console.log("**Error CrearComponenteNoPartUsed " + error);
                Atos.Helper.GetErrorCollectionByCode('JS_001');
            }
        );*/
    },//CrearComponenteNoPartUsed




    /// <summary>
    ///Cuando se cambia la ubicación técnica, se modifican los campos de la orden msdyn_latitude, msdyn_longitude, atos_indicadorabcid, atos_centroid, 
    ///atos_puestotrabajoprincipalid, atos_centrodeplanificacinid y se llama al método ChangeTextoBreve
    /// </summary>
    /// <param name="result">Entidad con el resultado de la consulta de la ubicación técnica</param>
    onChangeUbicacionTecnica: function (result) {
        try {



            if (typeof (result) != "undefined" && result.length > 0) {
                dynamicEntity = result[0];
                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {


                        var ot = entityForm.entity;
                        var latitude = dynamicEntity[0];
                        var longitude = dynamicEntity[1];
                        var indicadorABC = dynamicEntity[2];
                        var centro = dynamicEntity[3];
                        var puestotrabajo = dynamicEntity[4];
                        var centroplanificacion = dynamicEntity[5];
                        var centrodeemplazamiento = dynamicEntity[6];
                        var grupoplanificacion = dynamicEntity[7];
                        FS.OrdenTrabajo.CambioDeDivisa(entityForm);
                        //Si hay latitud lo completamos
                        ot.properties.msdyn_latitude = latitude;
                        //Si hay indicadorABC lo completamos
                        ot.properties.msdyn_longitude = longitude;
                        //Si hay indicadorABC lo completamos
                        ot.properties.atos_indicadorabcid = (indicadorABC != null) ? new MobileCRM.Reference(indicadorABC.entityName, indicadorABC.id, indicadorABC.primaryName) : null;
                        //Si hay centro lo completamos
                        ot.properties.atos_centroid = (centro != null) ? new MobileCRM.Reference(centro.entityName, centro.id, centro.primaryName) : null;
                        //Si hay indicadorABC lo completamos
                        ot.properties.atos_puestotrabajoprincipalid = (puestotrabajo != null) ? new MobileCRM.Reference(puestotrabajo.entityName, puestotrabajo.id, puestotrabajo.primaryName) : null;
                        //Si hay indicadorABC lo completamos
                        ot.properties.atos_centrodeplanificacinid = (centroplanificacion != null) ? new MobileCRM.Reference(centroplanificacion.entityName, centroplanificacion.id, centroplanificacion.primaryName) : null;
                        //FS.OrdenTrabajo.ChangeTextoBreve(entityForm);
                        // centro de emplazamiento
                        ot.properties.atos_centrodeemplazamientoid = (centrodeemplazamiento != null) ? new MobileCRM.Reference(centrodeemplazamiento.entityName, centrodeemplazamiento.id, centrodeemplazamiento.primaryName) : null;
                        //grupo planificacion
                        ot.properties.atos_grupoplanificadorid = (grupoplanificacion != null) ? new MobileCRM.Reference(grupoplanificacion.entityName, grupoplanificacion.id, grupoplanificacion.primaryName) : null;
                        var UTname = "";
                        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
                            UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                        }

                        if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname) && !esJefeParque) {
                            FS.OrdenTrabajo.ObtenerGrupoSubcontrata(entityForm);
                        }


                        if (entityForm.entity.isNew) {
                            FS.OrdenTrabajo.filterClaseActividad(entityForm);
                        }

                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 10--> " + err);
        }
    },

    CambioDeDivisa: function (entityForm) {
        var UTname = "";
        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
            UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
        }
        var codigoDivisa = "EUR";
        // divisa

        if (UTname.split("-").length > 2 && (UTname.split("-")[1] == "US" || UTname.split("-")[1] == "MX")) {
            codigoDivisa = "USD";
        }
        if (UTname.split("-")[1] == "CA") {
            codigoDivisa = "CAD";
        }

        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "<entity name='transactioncurrency'>" +
            "<attribute name='transactioncurrencyid' />" +
            "<attribute name='currencyname' />" +
            "<attribute name='isocurrencycode' />" +
            "<attribute name='currencysymbol' />" +
            "<attribute name='exchangerate' />" +
            "<attribute name='currencyprecision' />" +
            "<order attribute='currencyname' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='isocurrencycode' operator='eq' value='" + codigoDivisa + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.transactioncurrencyid = new MobileCRM.Reference("transactioncurrency", result[i][0], result[i][1]);
                        },
                        FS.CommonEDPR.onError,
                        null
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 14.1--> " + err);
            },
            entityForm
        );



    },


    ObtenerGrupoSubcontrata: function (entityForm) {


        var self = this;
        var settings;
        var userId;


        MobileCRM.Configuration.requestObject(
            function (config) {

                settings = config.settings;
                userId = config.settings.systemUserId;

                var fetchXmlGrupo = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
                    "  <entity name='atos_grupoplanificador'>" +
                    "    <attribute name='atos_name' />" +
                    "    <attribute name='atos_descripcion' />" +
                    "    <attribute name='atos_codigo' />" +
                    "    <attribute name='atos_grupoplanificadorid' />" +
                    "    <attribute name='atos_centroplanificacionid' />" +
                    "    <order attribute='atos_name' descending='false' />" +
                    "    <link-entity name='businessunit' from='atos_grupoplanificadorid' to='atos_grupoplanificadorid' link-type='inner' alias='ah'>" +
                    "      <link-entity name='systemuser' from='businessunitid' to='businessunitid' link-type='inner' alias='ai'>" +
                    "        <filter type='and'>" +
                    "          <condition attribute='systemuserid' operator='eq' value='" + userId + "' />" +
                    "        </filter>" +
                    "      </link-entity>" +
                    "    </link-entity>" +
                    "  </entity> " +
                    "</fetch>";




                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlGrupo,
                    function (result) {
                        for (var i in result) {
                            if (result[i][2] != null) {

                                if (entityForm.entity.properties.atos_centrodeplanificacinid != null) {
                                    var codigoSubcontrata = result[i][2];
                                    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                                        "  <entity name='atos_grupoplanificador'>" +
                                        "    <attribute name='atos_grupoplanificadorid' />" +
                                        "    <attribute name='atos_name' />" +
                                        "    <attribute name='atos_descripcion' />" +
                                        "    <attribute name='atos_codigo' />" +
                                        "    <attribute name='atos_centroplanificacionid' />" +
                                        "    <order attribute='atos_name' descending='false' />" +
                                        "    <filter type='and'>" +
                                        "      <condition attribute='atos_codigo' operator='eq' value='" + codigoSubcontrata + "' />" +
                                        "      <condition attribute='atos_centroplanificacionid' operator='eq'  uitype='atos_centrodeplanificacion' value='" + entityForm.entity.properties.atos_centrodeplanificacinid.id + "' />" +
                                        "    </filter>" +
                                        "  </entity>" +
                                        "</fetch>";
                                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                                        function (result) {
                                            for (var i in result) {
                                                MobileCRM.UI.EntityForm.requestObject(
                                                    function (entityForm) {
                                                        entityForm.entity.properties.atos_grupoplanificadorid = new MobileCRM.Reference("atos_grupoplanificador", result[i][0], result[i][1]);
                                                    },
                                                    FS.CommonEDPR.onError,
                                                    null
                                                );
                                            }
                                        },
                                        function (err) {
                                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                            if (debug == true)
                                                MobileCRM.UI.MessageBox.sayText("Error 14.1--> " + err);
                                        },
                                        entityForm
                                    );
                                }
                            }
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 53--> " + err);
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
            },
            null
        );
    },
    ///  <summary> Las primera vez que se introducen las fechas y horas de 1ª planificación, Dynamics tiene que 
    ///  replicarlas automáticamente en las fecha de replanificación. Para posteriores planificaciones de la misma orden, 
    ///  las fechas de la primera planificación serán inamovibles, siendo posible editar tantas veces como sea necesario 
    /// las fechas de replanificación.</summary> 
    onChangeFechaInicio1Planif: function (entityForm) {
        try {
            FS.OrdenTrabajo.onChangeValidaFechaInicioPlanif(entityForm);
            var fechaInicio1Planif = entityForm.entity.properties.atos_fechainicioprogramado;
            if (fechaInicio1Planif != null) {
                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_inicextr = fechaInicio1Planif;
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 11--> " + error);
        }
    },

    ///  <summary> Las primera vez que se introducen las fechas y horas de 1Âª planificaciÃ³n, Dynamics tiene que 
    ///  replicarlas automÃ¡ticamente en las fecha de replanificaciÃ³n. Para posteriores planificaciones de la misma orden, 
    ///  las fechas de la primera planificaciÃ³n serÃ¡n inamovibles, siendo posible editar tantas veces como sea necesario 
    /// las fechas de replanificaciÃ³n.</summary> 
    onChangeFechaFin1Planif: function (entityForm) {
        try {
            FS.OrdenTrabajo.onChangeValidaFechaInicioPlanif(entityForm);
            var fechaFin1Planif = entityForm.entity.properties.atos_fechafinprogramado;
            if (fechaFin1Planif != null) {
                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_finextr = fechaFin1Planif;
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 12--> " + error);
        }
    },

    ///AAC:REDMINE23418:22-11-2021:MM-1011 RESCO - New button STOP 
    onChangeEntradaTurbina: function (entityForm) {
        try {
            if (entityForm.entity.properties.atos_puestaenmarcha == true) {
                return;
            }
            if (entityForm.entity.properties.atos_indicadordeentradaaturbina == 0) {

                var popup;
                if (IdiomaUsuario == Idioma.ingles) {
                    /// Add the buttons for message box 
                    popup = new MobileCRM.UI.MessageBox("How would you like to leave the turbine?");
                    popup.items = ["On", "Off"];
                }
                else {
                    popup = new MobileCRM.UI.MessageBox("¿Como desea dejar la turbina?");
                    popup.items = ["En marcha", "Apagada"];
                }
                popup.multiLine = true;
                popup.show(
                    function (button) {
                        if (button == "On" || button == "En marcha") {
                            //Si es 4 entonces es Aranque
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    entityForm.entity.properties.atos_stop = 300000000;
                                    FS.OrdenTrabajo.onChangeEntradaTurbinaCOPE(entityForm);
                                },
                                FS.CommonEDPR.onError,
                                null
                            );
                        }
                        else {
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    entityForm.entity.properties.atos_stop = 300000001;
                                    //FS.OrdenTrabajo.onChangeEntradaTurbinaCOPE(entityForm);
                                },
                                FS.CommonEDPR.onError,
                                null
                            );

                        }
                    }
                );


                entityForm.entity.properties.atos_indicadorderetraso = 300000000;
            }

        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 103--> " + error);
        }
    },

    ///AAC:REDMINE23418:22-11-2021:MM-1011 RESCO - New button STOP 
    onChangeEntradaTurbinaCOPE: function (entityForm) {
        if (entityForm.entity.properties.atos_indicadordeentradaaturbina == 0 && entityForm.entity.properties.atos_puestaenmarcha == false) {
            var idMsjeError = "10175_042";
            var fetchXml = ["<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>",
                "<entity name='atos_coleccionerrores'>",
                "<attribute name='atos_coleccionerroresid' />",
                "<attribute name='atos_descripcion_en' />",
                "<attribute name='atos_descripcion_es' />",
                "<attribute name='atos_tipoerror' />",
                "<order attribute='atos_codigo' descending='false' />",
                "<filter type='and'>",
                "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError + "' />",
                "</filter>",
                "</entity>",
                "</fetch>"].join(" ");

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
                    var mensaje = "";
                    if (result.length > 0) {
                        if (IdiomaUsuario == 1033) {
                            mensaje = result[0][1];
                        }
                        else {
                            mensaje = result[0][2];
                        }
                        MobileCRM.UI.MessageBox.sayText(mensaje);
                    }
                },

                function (error) {
                });


        }



    },


    /// <summary>Compara la fecha de la última planificación con la real o con la actual
    ///   y devuelva el número de días de retraso</summary>
    onChangeRetraso: function (entityForm) {
        try {
            var fechaI = entityForm.entity.properties.atos_fechainicioprogramado;
            var fechaF = entityForm.entity.properties.atos_fechainicioreal;
            var DayValue = 1000 * 60 * 60 * 24;


            if (fechaF == null) {
                fechaF = new Date();
            }

            if (fechaI != null && fechaF != null) {
                var dd = Math.ceil((fechaF.getTime() - fechaI.getTime()));
                if (dd > 0) {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.atos_indicadorderetraso = parseFloat(eval(dd / DayValue)).toFixed(0);
                        },
                        FS.CommonEDPR.onError,
                        null
                    );
                }
                else {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.atos_indicadorderetraso = 0;
                        },
                        FS.CommonEDPR.onError,
                        null
                    );
                }
            }
            else if (fechaI == null) {
                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_indicadorderetraso = 0;
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }

        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 13--> " + error);
        }
    },


    /// <summary> saber el valor de clave control del puesto principal si lo tiene
    onChangePuestoTrabajoPricipal: function (entityForm) {
        try {
            if (entityForm.entity.properties.atos_puestotrabajoprincipalid != null) {

                var puestoPrincipalId = entityForm.entity.properties.atos_puestotrabajoprincipalid.id;
                var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                    "<entity name='atos_puestodetrabajo'>" +
                    "<attribute name='atos_clavedecontrolid'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='atos_puestodetrabajoid' value='" + puestoPrincipalId + "' operator='eq'/>" +
                    "</filter>" +
                    "</entity>" +
                    "</fetch>";
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
                            if (result[i][0] != null) {
                                claveControlId = result[i][0].id;
                            }
                            else {
                                claveControlId = null;
                            }
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 14.1--> " + err);
                    },
                    entityForm
                );

            }
            else {
                claveControlId = null;
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 14.2--> " + error);
        }
    },

    /// <summary> Fecha inicio 1ª planificación <= Fecha Fin 1ª planificación</summary> 
    onChangeValidaFechaInicioPlanif: function (entityForm) {
        try {
            NumNot = "006";
            var fechaInicio1Planif = entityForm.entity.properties.atos_fechainicioprogramado;
            var fechaFin1Planif = entityForm.entity.properties.atos_fechafinprogramado;

            if (fechaInicio1Planif == null && fechaFin1Planif != null) {
                var idMsjeError = "10104_004";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "004");
            }
            else if (fechaInicio1Planif != null && fechaFin1Planif != null && fechaInicio1Planif > fechaFin1Planif) {
                var idMsjeError = "10104_005";
                FS.OrdenTrabajo.NotificacionCampo(idMsjeError);
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "005");
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 15--> " + error);
        }
    },
    /// <summary> Fecha inicio <= Fecha Fin </summary> 
    onChangeFechaInicioFin: function (entityForm) {
        try {
            NumNot = "006";
            var fechaInicio = entityForm.entity.properties.atos_fechainicio;
            var fechaFin = entityForm.entity.properties.atos_fechafin;

            if (fechaInicio == null && fechaFin != null) {
                var idMsjeError = "10104_004";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "004");

                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_fechafin = null;
                    },
                    FS.CommonEDPR.onError,
                    null
                );

            }
            else if (fechaInicio != null && fechaFin != null && fechaInicio > fechaFin) {
                var idMsjeError = "10104_005";
                FS.OrdenTrabajo.NotificacionCampo(idMsjeError);
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "005");

                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
                        entityForm.entity.properties.atos_fechafin = null;
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 15--> " + error);
        }
    },
    /// <summary> Fecha inicio reprogramación  <= Fecha Fin reprogramación</summary> 
    onChangeValidaFechaInicioRepro: function (entityForm) {
        try {
            NumNot = "007";
            var fechaInicioRepro = entityForm.entity.properties.atos_inicextr;
            var fechaFinRepro = entityForm.entity.properties.atos_finextr;

            if (fechaInicioRepro == null && fechaFinRepro != null) {
                var idMsjeError = "10104_002";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "002");
            }
            else if (fechaInicioRepro != null && fechaFinRepro != null && fechaInicioRepro > fechaFinRepro) {
                var idMsjeError = "10104_003";
                FS.OrdenTrabajo.NotificacionCampo(idMsjeError);
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, "003");
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 16--> " + error);
        }
    },

    /// <summary> Muestra un mensaje con la notificación de un campo</summary> 
    NotificacionCampo: function (idMsjeError) {
        try {
            var fetchXml = ["<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>",
                "<entity name='atos_coleccionerrores'>",
                "<attribute name='atos_coleccionerroresid' />",
                "<attribute name='atos_descripcion_en' />",
                "<attribute name='atos_descripcion_es' />",
                "<attribute name='atos_tipoerror' />",
                "<order attribute='atos_codigo' descending='false' />",
                "<filter type='and'>",
                "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError + "' />",
                "</filter>",
                "</entity>",
                "</fetch>"].join(" ");

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
                    var mensaje = "";
                    if (result.length > 0) {
                        if (IdiomaUsuario == 1033) {
                            mensaje = result[0][1];
                        }
                        else {
                            mensaje = result[0][2];
                        }
                        MobileCRM.UI.MessageBox.sayText(mensaje);
                    }
                },

                function (error) {
                });
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 17--> " + error);
        }
    },

    /// <summary>Validaciones en las órdenes de trabajo de nueva creación, las fechas de inicio y fin 
    /// han de ser editables, y en el caso de una OT que no provenga de aviso se le pondrá la clase ZPM1</summary>  
    onLoadCreate: function (entityForm) {
        try {
            if (entityForm.iFrameOptions != null) {
                entityForm.entity.properties.atos_avisoid = entityForm.iFrameOptions.aviso;
            }
            FS.OrdenTrabajo.onChangeAviso(entityForm);
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 18--> " + error);
        }
    },

    /// <summary>Onload del formulario de actualización de un registro</summary>
    onLoadActualizar: function (entityForm) {
        try {
            //FS.OrdenTrabajo.onChangeEstadoUsuario(entityForm);
            FS.OrdenTrabajo.SugerirAbrirSuborden();
            FS.OrdenTrabajo.Flagprogamado(entityForm);
            FS.OrdenTrabajo.claseOT();
            FS.OrdenTrabajo.RecomendarEquipo();
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('10104_001');
        }
    },
    /// <summary>Onload del formulario de actualización de un registro</summary>
    onLoadCargarnombreAviso: function (entityForm) {
        try {
            avisoCodigoCRM = null;
            if (entityForm.entity.properties.atos_avisoid != null) {
                var avisoId = entityForm.entity.properties.atos_avisoid.id;
                var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                    "<entity name='atos_aviso'>" +
                    "<attribute name='atos_name'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='atos_avisoid' value='" + avisoId + "' operator='eq'/>" +
                    "</filter>" +
                    "</entity>" +
                    "</fetch>";
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
                            avisoCodigoCRM = result[i][0];
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 19--> " + err);
                    },
                    entityForm
                );

            }
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('10104_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 20--> " + e);
        }
    },


    /// <summary>Gestiona la clase</summary>
    claseOT: function () {
        try {
            FS.OrdenTrabajo.SugerirAbrirSuborden();
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 21--> " + e);
        }
    },

    /// <summary>fechas de planificación quedan bloqueadas cuando el status el PGRM. 
    ///Cuando ese Status no está activado, el campo se puede editar</summary>    
    Flagprogamado: function (entityForm) {
        try {
            if (entityForm.entity.properties.atos_enprogramacion != null) {
                FS.OrdenTrabajo.FechasEstadoUsuario(!entityForm.entity.properties.atos_enprogramacion);
            }
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 22--> " + e);
        }
    },

    ///AAC 01-06-2020
    /// REDMINE: 21766 Cambios en fechas Dynamics de avisos y ordenes de trabajo
    /// <summary>Se encarga de ver si un aviso es averia para habilitar los campos . Se lanza cuando se le asocia un aviso o se carga</summary>
    ComprobarAvisoNoProgramable: function (entityForm) {

        // obtenemos el aviso y comprobamos que no tenga aviso asociado o sea diferente al tipo Z5
        // en ese caso el aviso es programable y podemos ponerle las fechas de programacion
        var ordenTrabajoId = entityForm.entity.id;
        var avisoId = null;
        var claseOT = "";
        if (entityForm.entity.properties.atos_clasedeordenid != null)
            claseOT = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
        var dv = formulario.getDetailView("Fechas");
        if (entityForm.entity.properties.atos_avisoid != null) {
            avisoId = entityForm.entity.properties.atos_avisoid.id;

            if (entityForm.entity.properties.atos_avisodeaveria == true && claseOT != "ZPM0") {

                if (dv.getItemByName("atos_fechainicioprogramado") != null)
                    dv.getItemByName("atos_fechainicioprogramado").isEnabled = false;

                if (dv.getItemByName("atos_fechafinprogramado") != null)
                    dv.getItemByName("atos_fechafinprogramado").isEnabled = false;

                //if ( dv.getItemByName("atos_inicextr")!=null)
                //	dv.getItemByName("atos	_inicextr").isEnabled = false;

                //if ( dv.getItemByName("atos_finextr")!=null)
                //	dv.getItemByName("atos_finextr").isEnabled = false;
            }
            else {

                //if ( dv.getItemByName("atos_inicextr")!=null)
                //	dv.getItemByName("atos_inicextr").isEnabled = true;

                //if ( dv.getItemByName("atos_finextr")!=null)
                //	dv.getItemByName("atos_finextr").isEnabled = true;
            }
        }
        else {
            //if ( dv.getItemByName("atos_inicextr")!=null)
            //	dv.getItemByName("atos_inicextr").isEnabled = false;

            //if ( dv.getItemByName("atos_finextr")!=null)
            //	dv.getItemByName("atos_finextr").isEnabled = false;
        }


        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='msdyn_workorderservicetask'>" +
            "<attribute name='atos_confirmacion'/>" +
            "<filter type='and'>" +
            "<condition attribute='msdyn_workorder' value='" + ordenTrabajoId + "'  operator='eq'/>" +
            "<condition attribute='atos_numeroconfirmacion' operator='not-null'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function success(result) {
                if (result.length > 0) {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            if (dv.getItemByName("atos_fechainicioreal") != null)
                                dv.getItemByName("atos_fechainicioreal").isEnabled = false;
                            if (dv.getItemByName("atos_fechafinreal") != null)
                                dv.getItemByName("atos_fechafinreal").isEnabled = false;
                        },
                        FS.CommonEDPR.onError,
                        entityForm
                    );
                }
                else {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            //entityForm.entity.properties.atos_enprogramacion = false; 
                            if (dv.getItemByName("atos_fechainicioreal") != null)
                                dv.getItemByName("atos_fechainicioreal").isEnabled = true;
                            if (dv.getItemByName("atos_fechafinreal") != null)
                                dv.getItemByName("atos_fechafinreal").isEnabled = true;
                        },
                        FS.CommonEDPR.onError,
                        entityForm
                    );
                }
            },
            function (error) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 87--> " + error);
            });

    },


    /// <summary>fechas de planificación quedan bloqueadas cuando el status el PGRM. 
    ///Cuando ese Status no está activado, el campo se puede editar</summary>    
    FechasEstadoUsuario: function (disabled) {
        try {

            var dv = formulario.getDetailView("Fechas");
            dv.getItemByName("atos_fechainicioprogramado").isEnabled = disabled;
            dv.getItemByName("atos_fechafinprogramado").isEnabled = disabled;
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 23--> " + e);
        }
    },

    /// <summary>fechas de planificación quedan bloqueadas cuando el status el PGRM. 
    ///Cuando ese Status no está activado, el campo se puede editar</summary>    
    onChangeEstadoUsuario: function (entityForm) {
        try {
            var esp = "NA";
            var en = "NA";
            var i = 0;
            var condESP = "<condition attribute='atos_codigo_es' value='%XX%' operator='like'/>";
            var condEN = "<condition attribute='atos_codigo_en' value='%XX%' operator='like'/>";
            if (entityForm.entity.properties.atos_estadousuario != null) {
                var tmp = entityForm.entity.properties.atos_estadousuario.split(" ");

                for (i = 0; i < tmp.length; i++) {
                    var langCode = IdiomaUsuario;
                    if (langCode == 1033) {
                        //en = tmp[i];
                        condEN = condEN + "<condition attribute='atos_codigo_en' value='%" + tmp[i] + "%' operator='like'/>";
                    }
                    else {
                        //esp = tmp[i];
                        condESP = condESP + "<condition attribute='atos_codigo_es' value='%" + tmp[i] + "%' operator='like'/>";
                    }
                }

                var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                    "<entity name='atos_estatusdeaviso'>" +
                    "<attribute name='atos_name'/>" +
                    "<attribute name='atos_estatusdeavisoid'/>" +
                    "<order descending='false' attribute='atos_name'/>" +
                    "<filter type='and'>" +
                    "<filter type='or'>" +
                    condESP +
                    condEN +
                    "</filter>" +
                    "<condition attribute='atos_name_es' value='%Orden Programada%' operator='like'/>" +
                    "</filter>" +
                    "</entity>" +
                    "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function success(result) {
                        if (typeof (result) != "undefined" && result.length > 0) {
                            FS.OrdenTrabajo.FechasEstadoUsuario(true);
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    entityForm.entity.properties.atos_enprogramacion = true;
                                },
                                FS.CommonEDPR.onError,
                                null
                            );
                        }
                        else {
                            FS.OrdenTrabajo.FechasEstadoUsuario(false);
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    entityForm.entity.properties.atos_enprogramacion = false;
                                },
                                FS.CommonEDPR.onError,
                                null
                            );
                        }
                    },
                    function (error) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 24--> " + error);
                    });
            }
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 25--> " + e);
        }
    },

    /// <summary>Si la ubicación técnica indicada en la ot tiene equipo ,
    ///  se sugiere al usuario cargar el número de equipo.</summary>    
    RecomendarEquipo: function () {
        try {


        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 26--> " + e);
        }
    },

    ComprobarFechasEquipo: function (entityForm) {
        try {
            if (entityForm.entity.properties.msdyn_customerasset != null) {
                var equipoId = entityForm.entity.properties.msdyn_customerasset.id;

                /// <summary>
                /// NÃºmero de objetos de aviso que tenga asignada una orden de trabajo
                /// </summary>
                var fetchEquipo = '<fetch resultformat="Array">' +
                    '	<entity name="msdyn_customerasset">' +
                    '		<attribute name="atos_validodesde" />' +
                    '		<attribute name="atos_validohasta" />' +
                    '		<filter type="and">' +
                    '			<condition attribute="msdyn_customerassetid" operator="eq" value="' + equipoId + '" />' +
                    '		</filter>' +
                    '	</entity>' +
                    '</fetch>';
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchEquipo,
                    function (result) {
                        if (result && result.length > 0) {
                            // si esta inactivo lo activo
                            if (result[0][1] < new Date()) {
                                var mensaje;
                                if (IdiomaUsuario == 1033) {
                                    mensaje = " Expiration date of the equipment is later than the current one.";
                                }
                                else {
                                    mensaje = "La fecha de fin de validez del equipo es mayor que la actual.";
                                }

                                MobileCRM.UI.MessageBox.sayText(mensaje);
                            }
                        }

                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 109--> " + err);
                    },
                    entityForm
                );

            }


        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 126--> " + e);
        }
    },



    /// <summary>Cuando se genere una OT de gran correctivo sugiera abrir la suborden 
    ///  de inspección qaqc (modelo de ot) y que quede con la información completada por 
    ///   defecto en caso de ser aceptada</summary>    
    SugerirAbrirSuborden: function () {
        try {

        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 27--> " + e);
        }
    },

    /// <summary>Mapeo de campo desde el aviso hacia la orden de trabajo</summary>  
    ///  Campos mapeados: Prioridad, UT, Equipo, Centro de planificación, Grupo planificador, Centro, Título, Puesto de trabajo
    ///  Al crear una ot desde el aviso el sistema debe definir:
    ///  a.               Aviso de Avería (Z5) -> Ot zpm1 por defecto siendo seleccionable y  con posibilidad de cambio.
    ///  b.               Aviso de pendiente (Z1) -> Ot ZPM1 por defecto siendo seleccionable y  con posibilidad de cambio.
    onChangeAviso: function (entityForm) {
        try {
            var formu = entityForm;
            FS.OrdenTrabajo.LimpiarCamposAviso(entityForm);
            FS.OrdenTrabajo.ComprobarAvisoNoProgramable(entityForm);
            avisoCodigoCRM = null;
            if (entityForm.entity.properties.atos_avisoid != null) {
                var avisoid = entityForm.entity.properties.atos_avisoid.id;
                var fields = "atos_clasedeavisoid,atos_latitude,atos_longitude,atos_prioridadid,atos_ubicaciontecnicaid,atos_equipoid,atos_centrodeplanificacinid,atos_grupoplanificadorid,atos_centroid,atos_descripcioncorta,atos_puestotrabajoprincipalid,atos_fechainicioaveria,atos_estadodespuesdeaviso,atos_name".split(",");
                var fetch = FS.CommonEDPR.getFetch("atos_aviso", fields, avisoid, "atos_avisoid");

                fetch.execute("Array", function (result) {
                    if (typeof (result) != "undefined" && result.length > 0) {
                        var atos_descripcioncorta = result[0][9];
                        var ubicaciontecnica = result[0][4];
                        var clase = result[0][0].primaryName;
                        var grupoplanificador = result[0][7].primaryName;
                        var atos_latitude = result[0][1];
                        var atos_longitude = result[0][2];
                        var atos_prioridad = result[0][3];
                        var atos_equipo = result[0][5];
                        var atos_centrodeplanificacin = result[0][6];
                        var atos_grupoplanificador = result[0][7];
                        var atos_centro = result[0][8];
                        var atos_puestotrabajoprincipal = result[0][10];
                        var atos_fechainiextr = result[0][11];
                        var atos_estadodepuesdeaviso = result[0][12];
                        avisoCodigoCRM = result[0][13];

                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm2) {
                                var ot = entityForm2.entity;
                                ot.properties.msdyn_serviceaccount = ubicaciontecnica;
                                formu.entity.properties.msdyn_serviceaccount = ubicaciontecnica;
                                if (entityForm.entity.isNew) {
                                    if (atos_descripcioncorta.length > 40) {
                                        var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                                        if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                                            ot.properties.atos_titulo = atos_descripcioncorta.substr(0, 40).toUpperCase();
                                            formu.entity.properties.atos_titulo = atos_descripcioncorta.substr(0, 40).toUpperCase();
                                        }
                                        else {
                                            ot.properties.atos_titulo = atos_descripcioncorta.substr(0, 40);
                                            formu.entity.properties.atos_titulo = atos_descripcioncorta.substr(0, 40);
                                        }

                                        ot.properties.msdyn_primaryincidentdescription = atos_descripcioncorta.substr(39, atos_descripcioncorta.length - 1);
                                        formu.entity.properties.msdyn_primaryincidentdescription = atos_descripcioncorta.substr(39, atos_descripcioncorta.length - 1);

                                    }
                                    else {
                                        var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                                        if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                                            ot.properties.atos_titulo = atos_descripcioncorta.toUpperCase().substr(0, 40);
                                            formu.entity.properties.atos_titulo = atos_descripcioncorta.toUpperCase().substr(0, 40);
                                        }
                                        else {
                                            ot.properties.atos_titulo = atos_descripcioncorta.substr(0, 40);
                                            formu.entity.properties.atos_titulo = atos_descripcioncorta.substr(0, 40);
                                        }
                                    }
                                }


                                //fecha inicio replanificacion
                                if (atos_fechainiextr != null)
                                    ot.properties.atos_inicextr = new Date(atos_fechainiextr);
                                else
                                    ot.properties.atos_inicextr = null;
                                //MM-73 AAC 2021-08-06 cuando se crean OT desdes avisos Z5 con grupo ZP6 o ZP5 se tiene poner clase de orden 101 o 102 repectivamente
                                if (clase.search("Z5") > -1 || clase.substr(clase, 2) == "Z5" || clase.search("Z1") > -1 || clase.substr(clase, 2) == "Z1") {
                                    if ((clase.search("Z5") > -1 || clase.substr(clase, 2) == "Z5") && (grupoplanificador.search("ZP5") > -1 || grupoplanificador.substr(clase, 3) == "ZP5" || grupoplanificador.search("ZP6") > -1 || grupoplanificador.substr(clase, 2) == "ZP6")) {
                                        FS.OrdenTrabajo.ChangeClaseZPM0(entityForm, grupoplanificador.substr(clase, 3));
                                    }
                                    else {
                                        FS.OrdenTrabajo.ChangeClaseZPM1(entityForm);
                                    }
                                }
                                // AAC REDMINE:21487 21-11-2020 la orden como avería (ver 21486). La orden se debe liberar y autorizar de forma automática.(SOLO EUROPA)
                                var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                                if (clase.search("Z5") > -1 && !FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                                    ot.properties.atos_avisodeaveria = true;
                                    ot.properties.atos_liberarorden = true;
                                    var dv = entityForm.getDetailView("General");
                                    dv.getItemByName("atos_liberarorden").isEnabled = false;
                                    dv.getItemByName("atos_enejecucion").isEnabled = true;
                                }
                                else {
                                    var dv = entityForm.getDetailView("General");
                                    dv.getItemByName("atos_liberarorden").isEnabled = true;
                                    dv.getItemByName("atos_enejecucion").isEnabled = false;
                                    ot.properties.atos_liberarorden = false;
                                    ot.properties.atos_enejecucion = false;
                                }
                                formu.entity
                                ot.properties.msdyn_latitude = atos_latitude;
                                ot.properties.msdyn_longitude = atos_longitude;
                                //prioridad
                                if (atos_prioridad != null)
                                    ot.properties.msdyn_priority = new MobileCRM.Reference(atos_prioridad.entityName, atos_prioridad.id, atos_prioridad.primaryName);
                                else
                                    ot.properties.msdyn_priority = null;
                                //equipo
                                if (atos_equipo != null)
                                    ot.properties.msdyn_customerasset = new MobileCRM.Reference(atos_equipo.entityName, atos_equipo.id, atos_equipo.primaryName);
                                else
                                    ot.properties.msdyn_customerasset = null;
                                //centro de planificacion
                                if (atos_centrodeplanificacin != null)
                                    ot.properties.atos_centrodeplanificacinid = new MobileCRM.Reference(atos_centrodeplanificacin.entityName, atos_centrodeplanificacin.id, atos_centrodeplanificacin.primaryName);
                                else
                                    ot.properties.atos_centrodeplanificacinid = null;
                                //grupo planificador
                                if (atos_grupoplanificador != null)
                                    ot.properties.atos_grupoplanificadorid = new MobileCRM.Reference(atos_grupoplanificador.entityName, atos_grupoplanificador.id, atos_grupoplanificador.primaryName);
                                else
                                    ot.properties.atos_grupoplanificadorid = null;

                                //centro
                                if (atos_centro != null)
                                    ot.properties.atos_centroid = new MobileCRM.Reference(atos_centro.entityName, atos_centro.id, atos_centro.primaryName);
                                else
                                    ot.properties.atos_centroid = null;
                                //puesto de trabajo principal
                                if (atos_puestotrabajoprincipal != null)
                                    ot.properties.atos_puestotrabajoprincipalid = new MobileCRM.Reference(atos_puestotrabajoprincipal.entityName, atos_puestotrabajoprincipal.id, atos_puestotrabajoprincipal.primaryName);
                                else
                                    ot.properties.atos_puestotrabajoprincipalid = null;
                                // llamamos para que se crge la clave de control de operaciones
                                FS.OrdenTrabajo.onChangePuestoTrabajoPricipal(entityForm2);

                                // estado despues de aviso
                                if (atos_estadodepuesdeaviso != null)
                                    ot.properties.atos_estdinstal = atos_estadodepuesdeaviso;
                                else
                                    ot.properties.atos_estdinstal = null;

                                var fields = ["address1_latitude", "address1_longitude", "atos_indicadorabcid", "atos_centroid", "atos_puestodetrabajoresponsableid", "atos_centrodeplanificacionid", "atos_centrodeemplazamientoid", "atos_grupoplanificadorid"];
                                FS.CommonEDPR.fetchEntity("account", fields, entityForm.entity.properties.msdyn_serviceaccount.id, "accountid", FS.OrdenTrabajo.onChangeUbicacionTecnica);

                                FS.OrdenTrabajo.RecomendarEquipo();
                            },
                            function (error) {
                                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                if (debug == true)
                                    MobileCRM.UI.MessageBox.sayText("Error 28--> " + error);
                            },
                            null
                        );
                        FS.OrdenTrabajo.ComprobarAvisoNoProgramable(entityForm);
                        //FS.OrdenTrabajo.ChangeTextoBreve(entityForm);
                    }
                },

                    function (error) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 29--> " + error);
                    });
            }

        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 30--> " + error);
        }
    },

    /// <summary>Texto breve para Ordenes ZPM1</summary>
    ChangeClaseZPM1: function (entityForm) {
        try {
            FS.OrdenTrabajo.SugerirAbrirSuborden();

            var fetch = FS.CommonEDPR.getFetch("atos_clasedeorden", ["atos_clasedeordenid", "atos_name"], 'ZPM1', "atos_codigo");
            fetch.execute("Array", function (result) {
                if (typeof (result) != "undefined" && result.length > 0) {
                    //MIRAR IPHONE

                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.atos_clasedeordenid = new MobileCRM.Reference("atos_clasedeorden", result[0][0], result[0][1]);
                            FS.OrdenTrabajo.onChangeClaseOT(entityForm);
                            FS.OrdenTrabajo.ChangeTextoBreve(entityForm);
                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                }
            },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 31--> " + error);
                });
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 32--> " + e);
        }
    },


    /// <summary>//MM-73 AAC 2021-08-06 cuando se crean OT desdes avisos Z5 con grupo ZP6 o ZP5 se tiene poner clase de orden 101 o 102 repectivamente</summary>
    ChangeClaseZPM0: function (entityForm, clase) {
        try {

            var fetch = FS.CommonEDPR.getFetch("atos_clasedeorden", ["atos_clasedeordenid", "atos_name"], 'ZPM0', "atos_codigo");
            fetch.execute("Array", function (result) {
                if (typeof (result) != "undefined" && result.length > 0) {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.atos_clasedeordenid = new MobileCRM.Reference("atos_clasedeorden", result[0][0], result[0][1]);
                            FS.OrdenTrabajo.onChangeClaseOT(entityForm);
                            //FS.OrdenTrabajo.ChangeTextoBreve(entityForm);
                            var codigoclase;
                            if (clase == "ZP5")
                                codigoclase = "101";
                            else
                                codigoclase = "102";

                            var fetchClase = FS.CommonEDPR.getFetch("atos_clasedeactividad", ["atos_clasedeactividadid", "atos_name", "atos_clasedeordenid"], codigoclase, "atos_codigo");
                            fetchClase.execute("Array", function (resultClase) {
                                if (typeof (resultClase) != "undefined" && resultClase.length > 0) {

                                    for (var i = 0; i < resultClase.length; i++) {
                                        if (resultClase[i][2].id == result[0][0]) {
                                            MobileCRM.UI.EntityForm.requestObject(
                                                function (entityForm) {
                                                    entityForm.entity.properties.atos_claseactividadpmid = new MobileCRM.Reference("atos_clasedeactividad", resultClase[0][0], resultClase[0][1]);
                                                },
                                                FS.CommonEDPR.onError,
                                                null
                                            );
                                        }
                                    }
                                }
                            },
                                function (error) {
                                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                    if (debug == true)
                                        MobileCRM.UI.MessageBox.sayText("Error 31--> " + error);
                                });



                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                }
            },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 31--> " + error);
                });
        }
        catch (e) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 32--> " + e);
        }
    },



    /// <summary>Limpiar campos de mapeo avisos </summary>     
    LimpiarCamposAviso: function (entityForm) {
        try {

            entityForm.entity.properties.msdyn_priority = null;
            entityForm.entity.properties.msdyn_serviceaccount = null;
            entityForm.entity.properties.msdyn_customerasset = null;
            entityForm.entity.properties.atos_centrodeplanificacinid = null;
            entityForm.entity.properties.atos_grupoplanificadorid = null;
            entityForm.entity.properties.atos_centroid = null;
            if (entityForm.entity.isNew) {
                entityForm.entity.properties.atos_titulo = null;
            }
            entityForm.entity.properties.atos_puestotrabajoprincipalid = null;
            entityForm.entity.properties.atos_clasedeordenid = null;

        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 33--> " + err);
        }
    },
    /// devuelve true si es una ubicacion americana
    EsUbicacionAmericana: function (UTname) {
        if (UTname.split("-").length > 2 && (UTname.split("-")[1] != "US" && UTname.split("-")[1] != "CA" && UTname.split("-")[1] != "MX")) {
            return false;
        }
        else {
            return true;
        }
    },
    ChangeTextoBreve: function (entityForm) {
        /// <summary>
        /// Modifica la descripciÃ³n corta de la orden
        /// </summary>
        try {
            _Texto_breve_ID = "";

            if (entityForm.entity.properties.atos_clasedeordenid != null && entityForm.entity.properties.msdyn_serviceaccount != null) {
                var claseordenid = entityForm.entity.properties.atos_clasedeordenid.id;
                var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;

                if (FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                    return;
                }

                _array = ["", "", "", "", "", "", "", ""];
                FS.OrdenTrabajo.SetRequiredField(entityForm);

                /// <summary>
                /// NÃºmero de objetos de aviso que tenga asignada una orden de trabajo
                /// </summary>
                var _fetchCountAvisos = '<fetch resultformat="Array">' +
                    '	<entity name="atos_objetoorden">' +
                    '		<attribute name="atos_avisoid" />' +
                    '		<filter type="and">' +
                    '			<condition attribute="atos_avisoid" operator="not-null" />' +
                    '			<condition attribute="atos_ordendetrabajoid" operator="eq" value="' + entityForm.entity.id + '" uitype="msdyn_workorder" uiname="0000000688"/>' +
                    '		</filter>' +
                    '	</entity>' +
                    '</fetch>';


                MobileCRM.FetchXml.Fetch.executeFromXML(_fetchCountAvisos,
                    function (result) {
                        var avisosCount = result.length;
                        if (entityForm.entity.properties.atos_avisoid != null)
                            avisosCount++;
                        var fetch = FS.CommonEDPR.getFetch("atos_clasedeorden", ["atos_codigo"], claseordenid, "atos_clasedeordenid");
                        fetch.execute("Array", function (result) {
                            if (typeof (result) != "undefined" && result.length > 0) {
                                var atos_codigo = result[0][0];
                                if (atos_codigo == "ZPM1" && avisosCount == 1) {
                                    FS.OrdenTrabajo.TextoBreve("ZPM1", entityForm);
                                }
                                else if (atos_codigo == "ZPM1" && avisosCount > 1) {
                                    if (IdiomaUsuario == Idioma.ingles) {
                                        MobileCRM.UI.EntityForm.requestObject(
                                            function (entityForm) {
                                                if (entityForm.entity.isNew) {
                                                    entityForm.entity.properties.atos_titulo = "PENDING WORKS";
                                                }
                                            },
                                            FS.CommonEDPR.onError,
                                            null
                                        );
                                    }
                                    else {
                                        MobileCRM.UI.EntityForm.requestObject(
                                            function (entityForm) {
                                                if (entityForm.entity.isNew) {
                                                    entityForm.entity.properties.atos_titulo = "TRABAJOS PENDIENTES";
                                                }
                                            },
                                            FS.CommonEDPR.onError,
                                            null
                                        );
                                    }
                                }
                                else if (atos_codigo == "ZPM0") {
                                    FS.OrdenTrabajo.TextoBreve("ZPM0", entityForm);
                                }
                            }
                        }, function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                            if (debug == true)
                                MobileCRM.UI.MessageBox.sayText("Error 34--> " + err);
                        }, null);
                    }, function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 35--> " + err);
                    }, null);
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 36--> " + err);
        }
    },

    onClose_atostextobreve: function (entityForm) {
        /// <summary>
        /// Al cerrar el formulario atostextobreve
        /// </summary>
        /// <param name="entityForm">Formulario</param>
        /// Inicializa los campos de formulario.
        _tipoRepara = entityForm.entity.properties.atos_tiporeparacinid;
        _tipoEstado = entityForm.entity.properties.atos_estadoid;
        _Texto_breve_ID = entityForm.entity.id;
        FS.OrdenTrabajo.ComponerTextoBreve("ZPM0", 1, entityForm);
    },

    /// <summary> Busca la configuración del texto breve</summary>
    /// <param name="tipo">Tipo de clase de orden</param>
    TextoBreve: function (tipo, entityForm) {
        try {
            _Contador = 0;
            _NiteracionT = 0;
            _Texto_breve_ID = "";

            if (tipo == "ZPM0") {
                if (entityForm.entity.isNew)
                    FS.OrdenTrabajo.AbrirFormTextoBreve(null, tipo);
            }
            else if (tipo == "ZPM1") {
                if (entityForm.entity.isNew)
                    FS.OrdenTrabajo.ComponerTextoBreve(tipo, 1, entityForm);
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 37--> " + error);
        }
    },

    ComponerTextoBreve: function (tipo, orden, entityForm) {
        try {

            var _fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_configuraciontexto'>" +
                "<attribute name='atos_texto' />" +
                "<attribute name='atos_orden' />" +
                "<filter type='and'>" +
                "<condition attribute='statecode' operator='eq' value='0' />" +
                "<condition attribute='atos_entidad' operator='eq' value='300000000' />" +
                "<condition attribute='atos_orden' operator='eq' value='" + orden + "' />" +
                "</filter>" +
                "<link-entity name='atos_clasedeorden' from='atos_clasedeordenid' to='atos_clasedeordenid' link-type='inner' alias='a_9a2082a15be6e811a972000d3a38c9f2'>" +
                "<attribute name='atos_codigo' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_codigo' operator='eq' value='" + tipo + "' />" +
                "</filter>" +
                "</link-entity>" +
                "</entity>" +
                "</fetch>";



            MobileCRM.FetchXml.Fetch.executeFromXML(_fetchXml,
                function success(result) {
                    _Contador = result.length;
                    var atos_texto;
                    var atos_orden;
                    for (var i = 0; i < result.length; i++) {
                        atos_texto = result[i][0];
                        atos_orden = result[i][1];
                        switch (atos_texto) {
                            case "300000000": //TEXTO CÓDIGO ACCIÓN DEL CATÁLOGO DE ACTIVIDADES  Ejemp. Reparar
                                if (entityForm.entity.properties.atos_avisoid != null) {
                                    var avisoid = entityForm.entity.properties.atos_avisoid.id;
                                    MobileCRM.FetchXml.Fetch.executeFromXML(_fetchCodigos.replace("#atos_avisoid#", avisoid),
                                        function success(result3) {
                                            if (result3.length > 0) {
                                                if (IdiomaUsuario == Idioma.ingles) {
                                                    var text = (result3[0][1]).split(":");
                                                }
                                                else {
                                                    var text = (result3[0][0]).split(":");
                                                }

                                                if (text.length == 1)
                                                    FS.OrdenTrabajo.Iteracion(text[0].trim() + "_", atos_orden, tipo, entityForm);
                                                else
                                                    FS.OrdenTrabajo.Iteracion(text[1].trim() + "_", atos_orden, tipo, entityForm);
                                            }
                                        },
                                        function (error) {
                                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                            if (debug == true)
                                                MobileCRM.UI.MessageBox.sayText("Error 38--> " + error);
                                        });
                                }
                                break;

                            case "300000001"://Tipo de reparaciÃ³n Ejm. REPL
                                if (tipo == "ZPM0") {
                                    FS.OrdenTrabajo.Iteracion(_tipoRepara + "_", result.entities[i].atos_orden, tipo, entityForm);
                                }
                                break;

                            case "300000002": //Fabricante  del equipo  0-ES-ARL-01-T001-GEN-SLR01
                                if (entityForm.entity.properties.msdyn_customerasset != null) {
                                    var equipoid = entityForm.entity.properties.msdyn_customerasset.id;
                                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchEquipo.replace("#equipoid#", equipoid),
                                        function success(result2) {
                                            var fabricante = result2[0][0];
                                            FS.OrdenTrabajo.Normaliza_fabricante(fabricante, atos_orden, tipo, entityForm);
                                        },
                                        function (error) {
                                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                            if (debug == true)
                                                MobileCRM.UI.MessageBox.sayText("Error 39--> " + error);
                                        });
                                }
                                else {
                                    dato = "OTH";
                                    FS.OrdenTrabajo.Iteracion(dato + "_", atos_orden, tipo, entityForm);
                                }
                                break;

                            case "300000003":  //Tecnología, es la característica modelo de la turbina
                                FS.OrdenTrabajo.Modelo(atos_orden, tipo, entityForm);
                                break;

                            case "300000004": //Componente afectado El componente tendrá que cogerlo automáticamente de la UT, 
                                if (entityForm.entity.properties.msdyn_serviceaccount != null) {
                                    var codeFuncionalLocation = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                                    var res = codeFuncionalLocation.split("-");
                                    var componente = res[5];
                                    FS.OrdenTrabajo.Iteracion(componente + "_", atos_orden, tipo, entityForm);
                                }
                                break;

                            case "300000005": //Estado del componente afectado
                                FS.OrdenTrabajo.Iteracion(_tipoEstado + "_", result.entities[i].atos_orden, tipo, entityForm);
                                break;

                            case "300000006": //NÂº de turbina  Xej. 0-ES-ARL-01-T001-GEN-SLR01
                                //es decir, a modo de ejemplo:    , tendría que coger la abreviatura de 
                                //3 caracteres que va siempre después del nº de turbina.   Ejmp GBX
                                if (entityForm.entity.properties.msdyn_serviceaccount != null) {
                                    var codeFuncionalLocation = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                                    var res = codeFuncionalLocation.split("-");
                                    var turbina = res[4];
                                    FS.OrdenTrabajo.Iteracion(turbina + "_", atos_orden, tipo, entityForm);
                                }
                                break;

                            default:
                                break;
                        }
                    }
                },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 40--> " + error);
                });
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 41--> " + error);
        }
    },

    /// <summary> abre formulairod e petición de datos para crear el texto breve</summary>
    AbrirFormTextoBreve: function (tipo) {
        try {
            MobileCRM.UI.FormManager.showNewDialog("atos_textobreve");
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 42--> " + error);
        }
    },

    Iteracion: function (array, orden, tipo, entityForm) {
        try {
            _array[orden] = array;
            var texto = "";
            for (var i = 0; i < parseInt(orden) + 1; i++) {
                texto = texto + _array[i];
            }
            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                    var UTname = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                    if (!FS.OrdenTrabajo.EsUbicacionAmericana(UTname)) {
                        entityForm.entity.properties.atos_titulo = texto.toUpperCase().substr(0, 40);
                    }
                    else {
                        entityForm.entity.properties.atos_titulo = texto.substr(0, 40);
                    }
                },
                FS.CommonEDPR.onError,
                null
            );
            FS.OrdenTrabajo.ComponerTextoBreve(tipo, parseInt(orden) + 1, entityForm);
            if (_Texto_breve_ID != "")
                FS.CommonEDPR.BorrarRegistro("atos_textobreve", _Texto_breve_ID);
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 43--> " + error);
        }
    },

    Normaliza_fabricante: function (fabricante, ord, tipo, entityForm) {
        /// <summary>
        /// Obtiene el código del fabricante y lo utiliza para componer el texto breve
        /// </summary>
        /// <param name="fabricante">Nombre del fabricante</param>
        /// <param name="ord">posicion en el array de textos que componen la orden</param>
        /// <returns></returns>
        try {
            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_fabricante'>" +
                "<attribute name='atos_fabricanteid' />" +
                "<attribute name='atos_codigo' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_name' operator='eq' value='" + fabricante + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
                    var dato = "OTH";
                    if (typeof (result) != "undefined" && result.length > 0) {
                        dato = result[0][0];
                    }
                    FS.CommonEDPR.Iteracion(dato + "_", ord, tipo, entityForm);
                },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 44--> " + error);
                });
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 45--> " + error);
        }
    },

    Modelo: function (ord, tipo, entityForm) {
        try {
            var UT = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
            var turbina = UT.substr(0, 16);
            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_valorcaracteristica'>" +
                "<attribute name='atos_valor' />" +
                "<link-entity name='account' from='accountid' to='atos_ubicaciontecnicaid' link-type='inner' alias='ad'>" +
                "<filter type='and'>" +
                "<condition attribute='name' operator='eq' value='" + turbina + "' />" +
                "</filter>" +
                "</link-entity>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
                    var dato = "OTH";
                    if (typeof (result) != "undefined" && result.length > 0) {
                        dato = result[0][0];
                    }
                    FS.CommonEDPR.Normaliza_modelo(dato + "_", ord, tipo);
                },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 46--> " + error);
                });
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 47--> " + error);
        }
    },

    Normaliza_modelo: function (modelo, ord, tipo) {
        try {
            var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_modelo'>" +
                "<attribute name='atos_codigo' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_name' operator='eq' value='" + modelo + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
                    var dato = "OTH";
                    if (typeof (result) != "undefined" && result.length > 0) {
                        dato = result[0][0];
                    }
                    FS.CommonEDPR.Iteracion(dato + "_", ord, tipo, entityForm);
                },
                function (error) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    if (debug == true)
                        MobileCRM.UI.MessageBox.sayText("Error 48--> " + error);
                });
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 49--> " + error);
        }
    },

    SetRequiredField: function (entityForm) {
        /// <summary>
        /// Establece el campo atos_grupoplanificadorid a requerido dependiendo de si existe el campo atos_clasedeordenid
        /// </summary>
        try {

            // if (entityForm.entity.properties.atos_clasedeordenid  == null)
            //Xrm2.Page.getAttribute("atos_grupoplanificadorid").setRequiredLevel("none");
            //else
            //Xrm2.Page.getAttribute("atos_grupoplanificadorid").setRequiredLevel("required");
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            if (debug == true)
                MobileCRM.UI.MessageBox.sayText("Error 50--> " + error);
        }
    },

    //#region Estados usuario

    /// Se encarga de cambiar el estado del usuario y meter un log hisdtorico de los cambios realizados en este campo 
    CargarEstadosUsuario: function (entityForm) {
        var self = this;
        var OT = entityForm.entity;
        var fetchXmlEstadoOTPerfil = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'> " +
            "  <entity name='atos_estatusdeaviso'>" +
            "	 <attribute name='atos_name'/>" +
            "	 <attribute name='atos_estatusdeavisoid'/>" +
            "	 <attribute name='atos_tipoestado'/>" +
            "	 <attribute name='atos_numeroclasificacionsuperior'/>" +
            "	 <attribute name='atos_numeroclasificacioninferior'/>" +
            "	 <attribute name='atos_numeroclasificacion'/> " +
            "	 <attribute name='atos_codigo_en'/>" +
            "	 <attribute name='atos_codigo_es'/> " +
            "	 <attribute name='atos_perfilestatusid'/>" +
            "	 <attribute name='atos_name_en'/>" +
            "	 <attribute name='atos_name_en'/>" +
            "	 <attribute name='atos_name_es'/>" +
            "	 <attribute name='statuscode'/>" +
            "	 <attribute name='ownerid'/>" +
            "	 <attribute name='atos_prioridad'/>" +
            "	 <attribute name='atos_posicion'/>" +
            "	 <attribute name='modifiedonbehalfby'/>" +
            "	 <attribute name='modifiedby'/> " +
            "	 <attribute name='atos_identificador'/>" +
            "	 <attribute name='modifiedon'/>" +
            "	 <attribute name='overriddencreatedon'/>" +
            "	 <attribute name='createdon'/>" +
            "	 <attribute name='statecode'/>" +
            "	 <attribute name='atos_esinicial'/>" +
            "	 <order descending='false' attribute='atos_numeroclasificacion'/>" +
            "	 <order descending='false' attribute='atos_codigo_en'/>" +
            "    <filter type='and'>" +
            "      <condition attribute='atos_tipoestado' operator='eq' value='2' />" +
            "    </filter> " +
            "    <link-entity name='atos_perfilestatus' from='atos_perfilestatusid' to='atos_perfilestatusid' link-type='inner' alias='am'>" +
            "      <link-entity name='atos_clasedeorden_atos_perfilestatus' from='atos_perfilestatusid' to='atos_perfilestatusid' visible='false' intersect='true'>" +
            "        <link-entity name='atos_clasedeorden' from='atos_clasedeordenid' to='atos_clasedeordenid' alias='an'>" +
            "          <link-entity name='msdyn_workorder' from='atos_clasedeordenid' to='atos_clasedeordenid' link-type='inner' alias='ao'>" +
            "            <filter type='and'>" +
            "              <condition attribute='msdyn_workorderid' operator='eq'  uitype='msdyn_workorder' value='{" + OT.id + "}' />" +
            "            </filter>" +
            "          </link-entity>" +
            "        </link-entity>" +
            "      </link-entity>" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";

        // cuando se obtiene los estados se cargan
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEstadoOTPerfil,
            function (result) {

                var fetchXmlLogOT = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                    "<entity name='atos_logestado'> " +
                    "     <attribute name='atos_logestadoid'/> " +
                    "     <attribute name='atos_name'/> " +
                    "     <attribute name='atos_estadoavisoid'/> " +
                    "     <attribute name='atos_identificador'/> " +
                    "     <attribute name='atos_indicadorborrado'/> " +
                    "     <attribute name='atos_numerocambio'/> " +
                    "     <attribute name='createdon'/> " +
                    "     <link-entity name='atos_estatusdeaviso' alias='Perfil' link-type='inner' from='atos_estatusdeavisoid' to='atos_estadoavisoid' > " +
                    "       <attribute name='atos_codigo' />" +
                    "       <attribute name='atos_codigo_en' />" +
                    "       <attribute name='atos_codigo_es' />" +
                    "		 <attribute name='atos_numeroclasificacionsuperior'/>" +
                    "		 <attribute name='atos_numeroclasificacioninferior'/>" +
                    "     </link-entity> " +
                    "     <order descending='false' attribute='atos_name'  /> " +
                    "     <order descending='true' attribute='atos_numerocambio'  /> " +
                    "     <filter type='and'>" +
                    "         <condition attribute='atos_ordendetrabajoid' value='" + entityForm.entity.id + "' operator='eq'/>" +
                    "     </filter>" +
                    "     </entity>" +
                    "     </fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlLogOT,
                    function (resultOT) {
                        // guardo el resultado en una variable global para tenerlo en cuenta la guardar;
                        historicoEstadoUsuario = resultOT;

                        // ponemos el idioma al botn de guardar
                        if (IdiomaUsuario == Idioma.ingles)
                            $("#btnSave")[0].innerText = "Save";
                        else
                            $("#btnSave")[0].innerText = "Guardar";
                        // desasociamos el evento para que no salte mas deuna vez
                        $("#btnSave").unbind('click');
                        // asociamos el evento de guardar 
                        $("#btnSave").click(function () {
                            FS.OrdenTrabajo.CambiarEstadoUsuario(formulario);
                        });

                        // limpiamos la tabla de  num clasificados
                        $("#tblNumClasificados").empty();
                        varFila = " <tr> id='cabecera' " +
                            "     <th>Sel</th>  " +
                            "     <th>Nº</th>   " +
                            "     <th>Stat</th> " +
                            "     <th>Txt.status</th> " +
                            "</tr>";
                        $("#tblNumClasificados").append(varFila);

                        // limpiamos la tabla de sin num clasificados
                        $("#tblSinNumClasificados").empty();
                        varFila = " <tr> id='cabecera' " +
                            "     <th>Sel</th>  " +
                            "     <th>Stat</th> " +
                            "     <th>Txt.status</th> " +
                            "</tr>";
                        $("#tblSinNumClasificados").append(varFila);

                        //******************************************************************************//
                        // cargamos todos los checks y radiobuttons


                        var sinClasificar = "";
                        for (var i in result) {
                            // comprobamso que nº clasificacion no sea nula y este entre los estados 1 y 5
                            if (result[i][5] != "undefined" &&
                                result[i][5] != "null" &&
                                result[i][5] > 0) {
                                var varNumeroclasificacion;
                                var varLong = result[i][5].toString().length;
                                var varIdentificadorSAP = result[i][18];
                                var varClasificaciOn = result[i][5];// atos_numeroclasificacion
                                var varClasificacionInferior = result[i][4];//atos_numeroclasificacioninferior
                                var varClasificacionSuperior = result[i][3]; //atos_numeroclasificacionsuperior
                                var varEstatusdeAvisoid = result[i][1]; //atos_estatusdeavisoid
                                // siempre tiene 2 digitos el número de calsificacion si es 1 se pone 01
                                if (varLong === 1) {
                                    varNumeroclasificacion = "0" + varClasificaciOn;
                                }
                                else {
                                    varNumeroclasificacion = varClasificaciOn;
                                }

                                // texto traducidos de los componentes
                                var varTextoParaTabla, varCodigoParaTabla;
                                if (IdiomaUsuario == Idioma.ingles) {
                                    varTextoParaTabla = result[i][10];
                                    varCodigoParaTabla = result[i][6];
                                }
                                else {
                                    varTextoParaTabla = result[i][11];
                                    varCodigoParaTabla = result[i][7];
                                }

                                // comprobamos si esta marcado en el historico como activo
                                var varCheck = "";
                                var identificadorAnterior = "";
                                var numCambio = 1;
                                for (var j in historicoEstadoUsuario) {
                                    if (historicoEstadoUsuario[j][3].trim() != identificadorAnterior) {
                                        identificadorAnterior = historicoEstadoUsuario[j][3].trim();
                                        if (result[i][18].trim() == historicoEstadoUsuario[j][3].trim()) {
                                            if (historicoEstadoUsuario[j][5] != null)
                                                numCambio = parseInt(historicoEstadoUsuario[j][5]) + 1;
                                            if (historicoEstadoUsuario[j][4] != 1) {
                                                varSup = varClasificacionSuperior;
                                                varInf = varClasificacionInferior;
                                                varCheck = "checked";
                                                inputSelected = "rd_" + varClasificaciOn;
                                                listCodigoConClasificacion.push(varIdentificadorSAP + "|" + varCodigoParaTabla + "|" + varEstatusdeAvisoid + "|" + numCambio);
                                            }
                                        }
                                    }
                                }
                                if (varNumeroclasificacion == "01") {
                                    estadoUsuarioInicialId = varEstatusdeAvisoid;
                                }

                                var varChang = " javascript:mRD_CON_CLASIFICACION ( this, \"" + varNumeroclasificacion +
                                    "\",  \"" + varCodigoParaTabla +
                                    "\",  \"rd_" + varClasificaciOn +
                                    "\", \"" + varClasificacionInferior +
                                    "\", \"" + varClasificacionSuperior +
                                    "\", \"" + IdiomaUsuario +
                                    "\"  )  ";

                                varFila = " <tr> " +
                                    " <td> " +
                                    "   <input id=rd_" + varClasificaciOn +
                                    " class='rdEstadoConClasif'                " +
                                    " type='radio' name='rd_Estado_Con_Clasif' " +
                                    " value='" + varTextoParaTabla + "'        " +
                                    " onchange='" + varChang + "'                 " +
                                    " codigo='" + varCodigoParaTabla + "'                 " +
                                    " codigo_es='" + result[i][7] + "'                 " +
                                    " codigo_en='" + result[i][6] + "'                 " +
                                    " numcambio='" + numCambio + "'           " +
                                    " estadoavisoid='" + varEstatusdeAvisoid + "'      " +
                                    " identificadorsap='" + varIdentificadorSAP + "'   " +
                                    " clasificacionSup='" + varClasificacionSuperior + "'   " +
                                    " clasificacionInf='" + varClasificacionInferior + "'   " +
                                    " codigoInf='" + varCodigoParaTabla + "'   " +
                                    " " + varCheck + "  />                     " +
                                    " </td>  " +
                                    " <td>" + varNumeroclasificacion + "</td>  " +
                                    " <td id=\"codNemotecnico\">" + varCodigoParaTabla + "</td>  " +
                                    " <td>" + varTextoParaTabla + "</td>  " +
                                    "</tr>";
                                //-++++++++++++++++++++

                                $("#tblNumClasificados").append(varFila);


                            }
                            //******************************************************************************//
                            // en el caso de que sea No Clasificado
                            else {
                                var varIdentificadorSAP = result[i][18];
                                var varTextoParaTabla, varCodigoParaTabla;

                                if (IdiomaUsuario == Idioma.ingles) {
                                    varTextoParaTabla = result[i][10];
                                    varCodigoParaTabla = result[i][6];
                                }
                                else {
                                    varTextoParaTabla = result[i][11];
                                    varCodigoParaTabla = result[i][7];
                                }

                                varCheck = "";
                                varCheckValue = "0";
                                var identificadorAnterior = "";
                                var numCambio = 1;
                                // marcar los seleccionados
                                for (var j in historicoEstadoUsuario) {
                                    if (historicoEstadoUsuario[j][3].trim() != identificadorAnterior) {
                                        identificadorAnterior = historicoEstadoUsuario[j][3].trim();
                                        if (result[i][18].trim() == historicoEstadoUsuario[j][3].trim()) {
                                            if (historicoEstadoUsuario[j][5] != null)
                                                numCambio = parseInt(historicoEstadoUsuario[j][5]) + 1;
                                            if (historicoEstadoUsuario[j][4] != 1) {
                                                varCheck = "checked";
                                                varCheckValue = "1";
                                            }
                                        }
                                    }
                                }

                                var disabled = "";
                                if (varCodigoParaTabla.toUpperCase() == "COPE") {
                                    disabled = "disabled";
                                }
                                var varEstatusdeAvisoid = result[i][1]; //atos_estatusdeavisoid
                                var varChang2 = " javascript:mRD_SIN_CLASIFICACION13(this, \"" + varCodigoParaTabla + "\", \"chk_" + i + "\", " + IdiomaUsuario + " ) ";
                                varFila = "<tr> " +
                                    " <td> " +
                                    " <input id=chk_" + i +
                                    "         name=chk_EstadoSinClasif_" + i +
                                    " onchange='" + varChang2 + "' " +
                                    " estadoavisoid='" + varEstatusdeAvisoid + "'     " +
                                    " codigo='" + varCodigoParaTabla + "'                 " +
                                    " codigo_es='" + result[i][7] + "'                 " +
                                    " codigo_en='" + result[i][6] + "'                 " +
                                    " numcambio='" + numCambio + "'                    " +
                                    " identificadorsap='" + varIdentificadorSAP + "'   " +
                                    " codigoInf='" + varCodigoParaTabla + "'   " +
                                    " type='checkbox'  class='chkEstadoSinClasif' " + varCheck +
                                    " " + disabled + // desabilita el checkbox si es cope
                                    " value=\"" + varCheckValue + "\" />" +
                                    "</td>  " +
                                    "<td>" + varCodigoParaTabla + "</td>  " +
                                    "<td>" + varTextoParaTabla + "</td>  " +
                                    "</tr>";
                                //               
                                $("#tblSinNumClasificados").append(varFila);
                            }
                        }
                        statusInsertar = [];
                        statusBorrar = [];
                        textoStatusUsuario = $("input[name=rd_Estado_Con_Clasif]:checked").attr("codigo");
                        textoStatusUsuario_es = $("input[name=rd_Estado_Con_Clasif]:checked").attr("codigo_es");
                        textoStatusUsuario_en = $("input[name=rd_Estado_Con_Clasif]:checked").attr("codigo_en");
                        $("input:checkbox:checked").each(function () {
                            textoStatusUsuario = textoStatusUsuario + " " + ($(this).attr("codigo"));
                            textoStatusUsuario_es = textoStatusUsuario_es + " " + ($(this).attr("codigo_es"));
                            textoStatusUsuario_en = textoStatusUsuario_en + " " + ($(this).attr("codigo_en"));
                        });
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 51--> " + err);
                    },
                    null
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 52--> " + err);
            },
            null
        );

    },
    /// Se encarga de cambiar el estado del usuario y meter un log hisdtorico de los cambios realizados en este campo 
    CambiarEstadoUsuario: function (entityForm) {
        var OT = entityForm.entity;

        // recogo el elemento Clasificado
        var idioma = IdiomaUsuario;
        var tipoRegistro = "OT";
        var modificado = false;

        // insertamos los nuevos registros creados 
        statusInsertar.forEach(function (valor, indice, array) {
            if (valor.trim() != "") {
                modificado = true
                FS.OrdenTrabajo.insertarLogEstado(valor, indice, array, OT, tipoRegistro, 2);
                // comprobamos que si es COPE("E0017")  se pasan los avisos a cerrados  y se les pone la fecha de fin de averia a la actual
                if (valor.split("|")[0] == codigoCOPE)
                    FS.OrdenTrabajo.cerrarAvisosDeOT(entityForm);
            }
        });

        // insertamos los nuevos registros borrados
        statusBorrar.forEach(function (valor, indice, array) {
            if (valor.trim() != "") {
                modificado = true
                FS.OrdenTrabajo.insertarLogEstado(valor, indice, array, OT, tipoRegistro, 1);
            }
        });

        // si hay al menos algun cambio 
        if (modificado) {
            // actualizo el campo en la pantalla
            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm2) {

                    $("input:checkbox:checked").each(function () {
                        textoStatusUsuario_es = textoStatusUsuario_es + " " + ($(this).attr("codigo_es"));
                        textoStatusUsuario_en = textoStatusUsuario_en + " " + ($(this).attr("codigo_en"));
                    });

                    entityForm.entity.properties.atos_estadousuarioes = textoStatusUsuario_es;
                    entityForm.entity.properties.atos_estadousuarioen = textoStatusUsuario_en;
                    entityForm.entity.properties.atos_estadousuario = textoStatusUsuario;
                    entityForm2.entity.properties.atos_estadousuarioes = textoStatusUsuario_es;
                    entityForm2.entity.properties.atos_estadousuarioen = textoStatusUsuario_en;
                    entityForm2.entity.properties.atos_estadousuario = textoStatusUsuario;
                    // actualizo el registro de atos_logestado
                    var avisoSave = entityForm.entity;
                    avisoSave.save(
                        function (err) {
                            if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {
                                FS.OrdenTrabajo.CargarEstadosUsuario(entityForm);

                                if (IdiomaUsuario == Idioma.ingles)
                                    MobileCRM.UI.MessageBox.sayText("User status has changed to " + textoStatusUsuario + " .");
                                else
                                    MobileCRM.UI.MessageBox.sayText("El estado usuario de la orden de trabajo ha cambiado a " + textoStatusUsuario + " .");
                            }
                        }
                    );
                },
                FS.CommonEDPR.onError,
                null
            );
        }
    },
    insertarLogEstado: function (valor, indice, array, ordenTrabajo, tipoRegistro, operacion) {

        var datosLogEstadoSinClasificaciOn;
        var identificador = valor.split("|")[0];
        var codigo = valor.split("|")[1];
        var statusAvisoId = valor.split("|")[2];
        var numCambio = valor.split("|")[3];
        var indicadorCambio = 1;

        if (numCambio == 1)
            indicadorCambio = 1;
        else
            indicadorCambio = 2;


        var newLogEstado = new MobileCRM.DynamicEntity.createNew("atos_logestado");
        var props = newLogEstado.properties;
        props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenTrabajo.id, ordenTrabajo.atos_name);
        props.atos_identificador = identificador;
        props.atos_name = codigo;
        props.atos_numerocambio = numCambio;
        props.atos_objeto = 1;
        props.atos_indicadorcambio = indicadorCambio;
        props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", statusAvisoId, "");
        props.atos_indicadorborrado = operacion; // 1--Si 2--No

        newLogEstado.save(
            function (err) {
                if (err) {
                    // MobileCRM.UI.MessageBox.sayText(err);
                }
                else {

                }
            }
        );
    },
    // asignamos el valor de si es jefe de parque de la ubicacion que tiene asignado el aviso;
    esJefeDeParque: function (entityForm) {
        // nombre de usuario con el que sabremos si este usuario es el jefe de parque de la ubicacion de este aviso.
        // el nombre del usuario se saca de la relacion que existe entre usuario CRM y usuario SAP( nos quedamos con el usuario de SAP)
        // Jefe de parque--> En una ubicacion tecnica dentro de caracteristicas tendr auna llamada "SAP_USER", si corresponde
        //con el usuario entonces este sera lefe de parque. Si no se existe esta caracteristica se mirara en su nivel superior 
        //jerarquicamente para ver quien es el jefe de parque.
        // Sino se encontrarse esta caracterisitica en niguno de sus superiores se considerara que este usuario no es jefe de parque.
        var self = this;
        var settings;
        var userId;


        MobileCRM.Configuration.requestObject(
            function (config) {

                settings = config.settings;
                userId = config.settings.systemUserId;
                var SAPUser;
                var ubicacionTecnica = "";
                ubicacionTecnica = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                    "<entity name='systemuser'>" +
                    "<attribute name='fullname'/>" +
                    "<order descending='false' attribute='fullname'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='systemuserid' value='" + userId + "' operator='eq'/>" +
                    "</filter>" +
                    "<link-entity name='atos_usuarios' alias='ac' link-type='inner' to='atos_usuariosapid' from='atos_usuariosid'>" +
                    "<attribute name='atos_codigo'/>" +
                    "</link-entity>" +
                    "</entity>" +
                    "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
                            if (result[i][0] == null) {
                                return;
                            }
                            SAPUser = result[i][1];
                            if (entityForm.entity.properties.msdyn_serviceaccount != null) {
                                var ubicacionId = entityForm.entity.properties.msdyn_serviceaccount.id;

                                var fetchXmlAutorizacion = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                                    "<entity name='atos_autorizacion'>" +
                                    "<attribute name='atos_autorizacionid'/>" +
                                    "<attribute name='atos_autorizadoporid'/>" +
                                    "<attribute name='atos_permisoid'/>" +
                                    "<attribute name='atos_tipodepermisoid'/>" +
                                    "<filter type='and'>" +
                                    "<condition attribute='atos_ordendetrabajoid' value='" + entityForm.entity.id + "' operator='eq'/>" +
                                    "<condition attribute='statecode' value='0' operator='eq'/>" +
                                    "</filter>" +
                                    "</entity>" +
                                    "</fetch>";


                                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlAutorizacion,
                                    function (resultAutorizacion) {
                                        var codigoJefe = "";
                                        for (var i in resultAutorizacion) {
                                            if (resultAutorizacion[i][2].primaryName == "REGIONAL M") {
                                                codigoJefe = CodigoRegional;
                                                ubicacionTecnica = ubicacionTecnica.substr(0, 8);
                                            }
                                            if (resultAutorizacion[i][2].primaryName == "SITE M") {
                                                codigoJefe = CodigoSite;
                                                ubicacionTecnica = ubicacionTecnica.substr(0, 11);
                                            }
                                        }

                                        var fetchXmlUbicacion = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'> " +
                                            "  <entity name='account'>" +
                                            "    <attribute name='name' />" +
                                            "    <attribute name='parentaccountid' />" +
                                            "    <attribute name='accountid' />" +
                                            "    <filter type='and'>" +
                                            "      <condition attribute='name' operator='eq' value='" + ubicacionTecnica + "' />" +
                                            "    </filter>" +
                                            "  </entity>" +
                                            "</fetch>";
                                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlUbicacion,
                                            function (resultUbicacion) {
                                                if (resultUbicacion.length > 0) {
                                                    ubicacionTecnicaId = resultUbicacion[0][2];
                                                    FS.OrdenTrabajo.esJefeDeParqueRecursivo(entityForm, ubicacionTecnicaId, SAPUser, codigoJefe);
                                                }

                                            },
                                            function (err) {
                                                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                                if (debug == true)
                                                    MobileCRM.UI.MessageBox.sayText("Error 53--> " + err);
                                            },
                                            entityForm
                                        );
                                    },
                                    function (err) {
                                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                        if (debug == true)
                                            MobileCRM.UI.MessageBox.sayText("Error 53--> " + err);
                                    },
                                    entityForm
                                );
                            }
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 53--> " + err);
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
            },
            null
        );

    },
    // esta funcion se llama recursivamente para buscar en todos los padres.
    //	funcion que mira si un usuario esta como caracteristica "0000013125" para ver si es el jefed e parque
    esJefeDeParqueRecursivo: function (entityForm, ubicacionId, userId, codigoJefe) {
        var self = this;
        // buscamos en sus caracteristicas  si tiene algunas de tipo buscado
        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "	<entity name='atos_valorcaracteristica'>" +
            "	<attribute name='atos_name'/>" +
            "	<attribute name='atos_ubicaciontecnicaid'/>" +
            "	<attribute name='atos_equipoid'/>" +
            "	<attribute name='atos_caracteristicaid'/>" +
            "	<attribute name='atos_valor'/>" +
            "	<attribute name='atos_valorcaracteristicaid'/>" +
            "   <filter type='and'>" +
            "		<condition attribute='statecode' value='0' operator='eq'/>" +
            "	</filter>" +
            "	<link-entity name='atos_caracteristicasclase' alias='ai' link-type='inner' to='atos_caracteristicaid' from='atos_caracteristicasclaseid'>" +
            "		<filter type='and'>" +
            "		<condition attribute='atos_codigo' value='" + codigoJefe + "' operator='eq'/>" +
            "		</filter>" +
            "	</link-entity>" +
            "	<link-entity name='account' alias='ag' link-type='inner' to='atos_ubicaciontecnicaid' from='accountid'>" +
            "		<attribute name='parentaccountid'/>" +
            "		<filter type='and'>" +
            "		<condition attribute='accountid' value='" + ubicacionId + "' operator='eq'/>" +
            "		</filter>" +
            "	</link-entity>" +
            "	</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var encontrado = false;
                for (var i in result) {
                    if (result[i][4] == userId) {
                        jefeParque = true;
                    }
                }
                //if (!esJefeParque ||  entityForm.entity.properties.atos_autorizada ==  true )
                //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false);

            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 56--> " + err);
            },
            null
        );
    },
    //#endregion

    cerrarAvisosDeOT: function (entityForm) {
        // obtenemos los avisos que esten vinculados 
        var varFetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
            " <entity name='atos_aviso'>                    " +
            "   <attribute name='atos_avisoid'/>                        " +
            "       <filter type='and'>                                 " +
            "           <condition attribute='atos_ordendetrabajoid' value='" + entityForm.entity.id + " ' operator='eq'/> " +
            "       </filter>  " +
            " </entity>                                       " +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
            function (result) {
                for (var i in result) {

                    var updAviso = new MobileCRM.DynamicEntity.createNew("atos_aviso");
                    updAviso.id = result[i][0];;
                    updAviso.isNew = false;
                    var props = updAviso.properties;

                    props.atos_indicadorborrado = 1;
                    props.atos_peticionborrado = 1;


                    updAviso.save(
                        function (err) {
                            if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {
                            }
                        }
                    );

                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 57--> " + err);
            },
            entityForm
        );


        // actualizamos su estado a cerrado	 
        MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {

            },
            FS.CommonEDPR.onError,
            null
        );

    },
    // obtiene el identificador del catalogo y lo mete en una variable
    ObtenerPermiso: function (entityForm, permiso) {


        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='atos_permiso'>" +
            "<attribute name='atos_permisoid'/>" +
            "<attribute name='atos_tipodepermisoid'/>" +
            "<attribute name='atos_codigo'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_codigo' value='" + permiso + "' operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {

                    if (permiso == "SITE M") {
                        TipoPermisoAuthSite = result[i][1];
                        PermisoAuthSiteId = result[i][0];
                    }
                    if (permiso == "REGIONAL M") {
                        TipoPermisoAuthRegional = result[i][1];
                        PermisoAuthRegionalId = result[i][0];
                    }
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 58--> " + error);
            },
            entityForm
        );


    },
    // obtiene el identificador del catalogo y lo mete en una variable
    ObtenerAutorizacionOrdenTrabajo: function (entityForm) {


        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='atos_autorizacion'>" +
            "<attribute name='atos_autorizacionid'/>" +
            "<attribute name='atos_permisoid'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_ordendetrabajoid' value='" + entityForm.entity.id + "' operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    AutorizacionId = result[i][0];
                    TipoAutorizacionId = result[i][1];
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 59--> " + err);
            },
            entityForm
        );


    },
    CrearParada: function (entityForm) {

        var OT;
        var OT = entityForm.entity;
        // compromar que tiene asociada una ubicacion  y que es a nivel de turbina  o mayor 
        if (entityForm.entity.properties.msdyn_serviceaccount == null) {
            var idMsjeError = "10104_030";
            FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
            return;
        }

        if (entityForm.entity.properties.msdyn_serviceaccount.primaryName.length < 13) {
            var idMsjeError = "10175_024";
            FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
            return;
        }




        var popup;
        if (IdiomaUsuario == Idioma.ingles) {
            /// Add the buttons for message box
            popup = new MobileCRM.UI.MessageBox("Do you want to create Inactive times?.Previous inactive times will be deleted.");
            popup.items = ["Substation", "MT Line", "Wind turbine", "Cancel"];
        }
        else {
            popup = new MobileCRM.UI.MessageBox("¿Desea crear los tiempos de inactividad?.Los tiempos de inactividad anteriores serán borrados.");
            popup.items = ["Subestación", "Linea M.T.", "Aerogenerador", "Cancelar"];

        }

        popup.multiLine = true;
        popup.show(
            function (button) {
                if (button == "Substation" || button == "Subestación") {
                    FS.OrdenTrabajo.SeleccionOTForm(entityForm, 1);
                }
                else if (button == "MT Line" || button == "Linea M.T.") {
                    FS.OrdenTrabajo.SeleccionOTForm(entityForm, 2);
                }
                else if (button == "Wind turbine" || button == "Aerogenerador") {
                    FS.OrdenTrabajo.SeleccionOTForm(entityForm, 3);
                }
                else {
                    return;
                }
            }
        );
    },

    /// <summary>Función que se llama desde los OnChage declarados antes</summary>
    /// <param name="tipo">1-subestación, 2-Línea MT, 3-Aerogeneraador</param>
    SeleccionOTForm: function (entityForm, tipo) {

        try {

            var codeUT = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
            _textobusqueda = "";
            switch (tipo) {
                case 1:
                    FS.OrdenTrabajo.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                case 2:
                    FS.OrdenTrabajo.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                case 3:
                    FS.OrdenTrabajo.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
        }
    },

    PuestaEnMarcha: function (entityForm) {
        //debugger;
        //[begin] MM-3855
        if (entityForm.entity.properties.atos_puestaenmarcha === true && entityForm.entity.properties.atos_indicadordeentradaaturbina === true) {
            var popupPuestaEnMarcha;
            if (IdiomaUsuario === Idioma.ingles) {
                /// Add the buttons for message box 
                popupPuestaEnMarcha = new MobileCRM.UI.MessageBox("If the work has been completed, you must mark the turbine exit.");
                popupPuestaEnMarcha.items = ["Exit with email", "Exit without email", "Don't mark COPE", "Cancel"];
            }
            else {
                popupPuestaEnMarcha = new MobileCRM.UI.MessageBox("Si han finalizado los trabajos, deben marcar la salida de turbina.");
                popupPuestaEnMarcha.items = ["Salida con email", "Salida sin email", "No marcar COPE", "Cancelar"];
            }
            lanzadoPuestaEnMarcha = false;
            popupPuestaEnMarcha.multiLine = true;
            popupPuestaEnMarcha.show(
                function (button) {
                    if (button === "Exit with email" || button === "Salida con email") {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_puestaenmarcha = true;
                                entityForm.entity.properties.edprdyn_preventturbineemail = true;
                                entityForm.entity.properties.atos_indicadordeentradaaturbina = false;
                                entityForm.entity.properties.atos_stop = 300000000;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                    else if (button === "Exit without email" || button === "Salida sin email") {
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_puestaenmarcha = true;
                                entityForm.entity.properties.edprdyn_preventturbineemail = false;
                                entityForm.entity.properties.atos_indicadordeentradaaturbina = false;
                                entityForm.entity.properties.atos_stop = 300000000;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                    else if (button === "Don't mark COPE" || button === "No marcar COPE" || button === "Cancel" || button === "Cancelar") {
                        //Si es 4 entonces es Aranque
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_puestaenmarcha = false;
                                entityForm.entity.properties.edprdyn_preventturbineemail = false;
                                entityForm.entity.properties.atos_indicadordeentradaaturbina = true;
                                entityForm.entity.properties.atos_stop = 300000001;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                        return;
                    }
                }
            );
        }//if
        //[end] MM-3855

        if (entityForm.entity.properties.atos_puestaenmarcha === false && lanzadoPuestaEnMarcha === false) {
            var popup;

            if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box 
                popup = new MobileCRM.UI.MessageBox("Are you sure  to lift COPE?");
                popup.items = ["Yes", "No"];
            }
            else {
                popup = new MobileCRM.UI.MessageBox("¿Esta seguro de levantar COPE?");
                popup.items = ["Si", "No"];
            }
            lanzadoPuestaEnMarcha = true;
            popup.multiLine = true;
            popup.show(
                function (button) {
                    if (button == "No" || button == "No") {
                        //Si es 4 entonces es Aranque
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_puestaenmarcha = true;

                                lanzadoPuestaEnMarcha = false;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                    else {
                        lanzadoPuestaEnMarcha = false;
                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_stop = 300000001;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                        return;
                    }
                }
            );
        }//if
        else {
            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                    entityForm.entity.properties.atos_stop = 300000000;
                },
                FS.CommonEDPR.onError,
                null
            );
        }//else
    },//function PuestaEnMarcha
    ConfirmarGestion: function (entityForm, tipo, codeUT) {


        MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
                //Eliminamos los tiempos de inactividad anteriores.

                if (tipo == 1) {
                    //Si es 1 es subestacion
                    entityForm.entity.properties.atos_subestacion = true;
                    entityForm.entity.properties.atos_lineademt = false;
                    entityForm.entity.properties.atos_aerogenerador = false;
                }
                else if (tipo == 2) {
                    //Si es 2 es Linea de M.T
                    entityForm.entity.properties.atos_subestacion = false;
                    entityForm.entity.properties.atos_lineademt = true;
                    entityForm.entity.properties.atos_aerogenerador = false;
                }
                else if (tipo == 3) {
                    //Si es 3 entonces es Aerogenerador
                    entityForm.entity.properties.atos_subestacion = false;
                    entityForm.entity.properties.atos_lineademt = false;
                    entityForm.entity.properties.atos_aerogenerador = true;
                }


                //BUSCA LOS TI De la OT RELACIONADOS
                var id = entityForm.entity.id;
                var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                    "<entity name='atos_tiempoinactividad'>" +
                    "<attribute name='atos_tiempoinactividadid'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + id + "'/>" +
                    "</filter>" +
                    "</entity>" +
                    "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
                            MobileCRM.DynamicEntity.deleteById(
                                "atos_tiempoinactividad",
                                result[i][0],
                                function () {

                                },
                                function (error) {
                                    MobileCRM.bridge.alert("An error occurred: " + error);
                                }
                            );
                        }
                        FS.OrdenTrabajo.CreaGestionparada(entityForm, id, tipo, codeUT);
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    },
                    null
                );
            },
            FS.CommonEDPR.onError,
            null
        );
    },
    CreaGestionparada: function (entityForm, id, tipo, codeUT) {

        switch (tipo) {
            case 1:
                FS.OrdenTrabajo.CreaTiemposInactividad(entityForm, codeUT, "SUBESTACION");
                break;
            case 2:
                FS.OrdenTrabajo.CreaTiemposInactividad(entityForm, codeUT, "LINEAS_COLECTORAS");
                break;
            case 3:
                FS.OrdenTrabajo.CreaTiemposInactividadGenerador(entityForm, codeUT);
                break;
                break;
            default:
                break;
        }

    },

    CreaTiemposInactividad: function (entityForm, codeUT, caracteristica) {

        var turbina = codeUT.substr(0, 16);

        // obtenmos el valor de la caracteristica 
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='true'>" +
            "<entity name='account'>" +
            "<attribute name='name'/>" +
            "<attribute name='primarycontactid'/>" +
            "<attribute name='accountid'/>" +
            "<order attribute='name' descending='false'/>" +
            "<filter type='and'>" +
            "<condition attribute='name' operator='eq' value='" + turbina + "'/>" +
            "<condition attribute='statecode' operator='eq' value='0' />" +
            "</filter>" +
            "<link-entity name='atos_valorcaracteristica' from='atos_ubicaciontecnicaid' to='accountid' link-type='inner' alias='af'>" +
            "<attribute name='atos_valor'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_caracteristicaidname' operator='like' value='%" + caracteristica + "%'/>" +
            "<condition attribute='statecode' operator='eq' value='0' />" +
            "</filter>" +
            "</link-entity>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    valor = result[i][3];

                    // obtenemos todas las ubicaciones que tiene este valor en caracteristica;
                    var textoturbina = codeUT.substr(0, 11) + "-T";

                    var fetchXmlTurbinas = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='true'>" +
                        "<entity name='account'>" +
                        "<attribute name='name'/>" +
                        "<attribute name='primarycontactid'/>" +
                        "<attribute name='accountid'/>" +
                        "<order attribute='name' descending='false'/>" +
                        "<filter type='and'>" +
                        "<condition attribute='name' operator='like' value='" + textoturbina + "%'/>" +
                        "<condition attribute='statecode' operator='eq' value='0' />" +
                        "</filter>" +
                        "<link-entity name='atos_valorcaracteristica' from='atos_ubicaciontecnicaid' to='accountid' link-type='inner' alias='af'>" +
                        "<filter type='and'>" +
                        "<condition attribute='atos_caracteristicaidname' operator='like' value='%" + caracteristica + "%'/>" +
                        "<condition attribute='atos_valor' operator='eq' value='" + valor + "'/>" +
                        "<condition attribute='statecode' operator='eq' value='0' />" +
                        "</filter>" +
                        "</link-entity>" +
                        "</entity>" +
                        "</fetch>";

                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlTurbinas,
                        function (resultTurbinas) {
                            j = 0;
                            for (var i in resultTurbinas) {
                                // creamos los tiempos de inactividad para esas turbinas

                                // tiempo de inactividad
                                var newTiempoInactividad = new MobileCRM.DynamicEntity.createNew("atos_tiempoinactividad");
                                var props = newTiempoInactividad.properties;
                                props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", entityForm.entity.id, "");
                                props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", resultTurbinas[i][2], resultTurbinas[i][2]);
                                props.atos_fechainicio = new Date();
                                props.atos_fechafin = new Date();
                                props.atos_name = resultTurbinas[i][0];
                                props.atos_horastotalesinactividad = 0;


                                newTiempoInactividad.save(
                                    function (err) {
                                        j = j + 1;
                                        if (err) {
                                            //MobileCRM.UI.MessageBox.sayText(err);
                                        }
                                        else {
                                            // para el ultimo refrescamos
                                            if (j == resultTurbinas.length) {
                                                MobileCRM.UI.EntityForm.save();
                                            }
                                        }
                                    }
                                );
                            }


                        },
                        function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        },
                        null
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );

    },
    CreaTiemposInactividadGenerador: function (entityForm, codeUT) {

        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='account'>" +
            "<attribute name='name'/>" +
            "<attribute name='accountid'/>" +
            "<order attribute='name' descending='false'/>" +
            "<filter type='and'>" +
            "<condition attribute='name' operator='eq' value='" + codeUT.substr(0, 16) + "'/>" +
            "<condition attribute='statecode' operator='eq' value='0' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    var ubicacionid = result[i][0];


                    // tiempo de inactividad
                    var newTiempoInactividad = new MobileCRM.DynamicEntity.createNew("atos_tiempoinactividad");
                    var props = newTiempoInactividad.properties;
                    props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", entityForm.entity.id, "");
                    props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", result[i][1], result[i][0]);
                    props.atos_fechainicio = new Date();
                    props.atos_fechafin = new Date();
                    props.atos_name = codeUT;
                    props.atos_horastotalesinactividad = 0;


                    newTiempoInactividad.save(
                        function (err) {
                            if (err) {
                                //MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {
                                // guardamos los valores  cambiados de los checks
                                MobileCRM.UI.EntityForm.save();
                            }
                        }
                    );

                }


            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );


    },
    AutorizarOrdenTrabajo: function (entityForm) {

        enviadoASAP = false;
        var self = this;
        var settings;
        var userId;


        MobileCRM.Configuration.requestObject(
            function (config) {

                settings = config.settings;
                userId = config.settings.systemUserId;
                var SAPUser;

                var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                    "<entity name='systemuser'>" +
                    "<attribute name='fullname'/>" +
                    "<attribute name='businessunitid'/>" +
                    "<attribute name='title'/>" +
                    "<attribute name='address1_telephone1'/>" +
                    "<attribute name='positionid'/>" +
                    "<attribute name='systemuserid'/>" +
                    "<order descending='false' attribute='fullname'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='systemuserid' value='" + userId + "' operator='eq'/>" +
                    "</filter>" +
                    "<link-entity name='atos_usuarios' link-type='inner' to='atos_usuariosapid' from='atos_usuariosid'>" +
                    "<attribute name='atos_usuariosid'/>" +
                    "<attribute name='atos_usuario'/>" +
                    "<attribute name='atos_nombre'/>" +
                    "<attribute name='atos_codigo'/>" +
                    "<attribute name='atos_name'/>" +
                    "</link-entity>" +
                    "</entity>" +
                    "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        if (result.length == 0 || result[0][9] == null) {
                            FS.CommonEDPR.GetErrorCollectionByCode('10104_025', "004");
                            return;
                        }


                        for (var i in result) {
                            SAPUser = result[i][9];
                            SAPUserId = result[i][6];
                            var OrdenTrabajoId = entityForm.entity.id;
                            var ubicacionTecnicaId = entityForm.entity.properties.msdyn_serviceaccount.id;
                            var codigoOrden = entityForm.entity.properties.msdyn_name;


                            var fetchXmlAutorizacion = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                                "<entity name='atos_autorizacion'>" +
                                "<attribute name='atos_autorizacionid'/>" +
                                "<attribute name='atos_autorizadoporid'/>" +
                                "<attribute name='atos_permisoid'/>" +
                                "<attribute name='atos_tipodepermisoid'/>" +
                                "<filter type='and'>" +
                                "<condition attribute='atos_ordendetrabajoid' value='" + OrdenTrabajoId + "' operator='eq'/>" +
                                "<condition attribute='statecode' value='0' operator='eq'/>" +
                                "</filter>" +
                                "</entity>" +
                                "</fetch>";

                            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlAutorizacion,
                                function (resultAutorizacion) {
                                    if (resultAutorizacion.length == 0) {
                                        FS.CommonEDPR.GetErrorCollectionByCode('10104_021', "004");
                                        return;
                                    }

                                    var estaAutorizado = true;
                                    for (var i in resultAutorizacion) {
                                        if (resultAutorizacion[i][1] == null) {
                                            estaAutorizado = false;
                                        }
                                    }
                                    // si ya esta autorizado
                                    if (estaAutorizado) {
                                        FS.CommonEDPR.GetErrorCollectionByCode('10104_022', "004");
                                        return;
                                    }
                                    else if (jefeParque) {
                                        var updAutorizacion = new MobileCRM.DynamicEntity.createNew("atos_autorizacion");
                                        updAutorizacion.id = resultAutorizacion[0][0];
                                        updAutorizacion.isNew = false;
                                        var props = updAutorizacion.properties;
                                        props.atos_autorizadoporid = new MobileCRM.Reference("atos_usuarios", SAPUserId, "");
                                        props.atos_creadoporsapid = new MobileCRM.Reference("atos_usuarios", SAPUserId, "");
                                        props.atos_autorizadopor = SAPUser;
                                        props.atos_creadoporsap = SAPUser;
                                        props.atos_fechadeautorizacion = new Date();
                                        props.atos_permisoconcedido = true;

                                        updAutorizacion.save(
                                            function (err) {
                                                if (err) {
                                                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');


                                                }
                                                else {

                                                    MobileCRM.UI.EntityForm.requestObject(

                                                        function (entityForm) {
                                                            entityForm.entity.properties.atos_autorizada = true;
                                                            //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false);
                                                            // guardar
                                                            MobileCRM.UI.EntityForm.save();
                                                        },
                                                        FS.CommonEDPR.onError,
                                                        null
                                                    );
                                                    FS.CommonEDPR.GetErrorCollectionByCode('10104_023', "004");

                                                    if (!enviadoASAP) {
                                                        enviadoASAP = true;
                                                        self.SincronizarOrdenTrabajoConSAP(entityForm);
                                                    }
                                                }

                                            }
                                        )
                                    }
                                    else {
                                        FS.CommonEDPR.GetErrorCollectionByCode('10104_024', "004");
                                    }
                                },
                                function (err) {
                                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                },
                                null
                            );


                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        if (debug == true)
                            MobileCRM.UI.MessageBox.sayText("Error 53--> " + err);
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
            },
            null
        );
    },
    SincronizarOrdenTrabajoConSAP: function (entityForm) {
        var ordenTrabajoId = entityForm.entity.id;
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical'  no-lock='true' distinct='false'>" +
            "<entity name='atos_pendienteintegrarconsap'>" +
            "<attribute name='atos_operacion' />" +
            "<attribute name='atos_guidobjeto' />" +
            "<attribute name='atos_estadointegracion' />" +
            "<attribute name='atos_pendienteintegrarconsapid' />" +
            "<order attribute='atos_guidobjeto' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_guidobjeto' operator='eq' value='" + ordenTrabajoId + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var encontrado = false;
                var sincronizando = 3;
                var noEnviado = 2;

                for (var i in result) {
                    if (result[i][2] == sincronizando && !encontrado) {
                        encontrado = true;

                        var updPendienteIntegracion = new MobileCRM.DynamicEntity.createNew("atos_pendienteintegrarconsap");
                        updPendienteIntegracion.id = result[0][3];
                        updPendienteIntegracion.isNew = false;
                        var props = updPendienteIntegracion.properties;
                        props.atos_estadointegracion = noEnviado;

                        updPendienteIntegracion.save(
                            function (err) {
                                if (err) {
                                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                                }
                                else {
                                    var SAP = 1;
                                    entityForm.entity.properties.atos_enintegracion = false;
                                    entityForm.entity.properties.atos_origen = SAP;
                                    MobileCRM.UI.EntityForm.save();

                                }

                            }
                        )
                    }
                }


            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );
    },

    tienePermisosJefeParque: function (entityForm) {


        var varFetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "  <entity name='atos_permisosjefedeparque'>" +
            "    <attribute name='atos_permisosjefedeparqueid' />" +
            "    <attribute name='atos_name' />" +
            "    <attribute name='createdon' />" +
            "    <order attribute='atos_name' descending='false' />" +
            "    <filter type='and'>" +
            "      <condition attribute='atos_name' operator='eq' value='US' />" +
            "    </filter>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
            function (result) {
                if (result.length > 0) {
                    esJefeParque = true;
                }
                else {
                    MobileCRM.UI.EntityForm.requestObject(

                        function (entityForm) {
                            var dv = entityForm.getDetailView("General");
                            dv.getItemByName("atos_liberarorden").isEnabled = false;
                            dv.getItemByName("atos_enejecucion").isEnabled = false;
                            dv.getItemByName("atos_cierretecnicodeorden").isEnabled = false;
                            esJefeParque = false;
                            //MobileCRM.UI.EntityForm.enableCommand("custom_autorizar", false);
                        },
                        FS.CommonEDPR.onError,
                        null
                    );
                }
            },
            function (err) {
                // lanzar mensaje de que no se tiene permiso
                MostrarMensajePopUpError('10111_032', IdiomaUsuario, null);
            },
            entityForm
        );

    },

    tienePermisosJefeRegional: function (entityForm) {
        var varFetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "  <entity name='atos_permisosjeferegional'>" +
            "    <attribute name='atos_permisosjeferegionalid' />" +
            "    <attribute name='atos_name' />" +
            "    <attribute name='createdon' />" +
            "    <order attribute='atos_name' descending='false' />" +
            "    <filter type='and'>" +
            "      <condition attribute='atos_name' operator='eq' value='US' />" +
            "    </filter>" +
            "  </entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
            function (result) {
                if (result.length > 0) {

                }
                else {
                    MobileCRM.UI.EntityForm.requestObject(

                        function (entityForm) {
                            var dv = entityForm.getDetailView("General");
                            if (entityForm.entity.properties.atos_clasedeordenid) {
                                var claseorden = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
                                if (claseorden == "ZPM0") {
                                    entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                    dv.getItemByName("atos_cierretecnicodeorden").isEnabled = false;
                                }
                            }
                        },
                        FS.CommonEDPR.onError,
                        null
                    );




                }
            },
            function (err) {
                // lanzar mensaje de que no se tiene permiso
                MostrarMensajePopUpError('10111_032', IdiomaUsuario, null);
            },
            entityForm
        );

    },



    esJefeRegional: function (entityForm) {


        MobileCRM.Configuration.requestObject(
            function (config) {

                if (entityForm.entity.properties.msdyn_serviceaccount == null)
                    return;
                if (entityForm.entity.properties.atos_clasedeordenid == null || entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0] != "ZPM0")
                    return;

                var claseorden = entityForm.entity.properties.atos_clasedeordenid.primaryName.split(":")[0];
                var ubicacionTecnica = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                ubicacionTecnica = ubicacionTecnica.substr(0, 8);


                var pJefeRegional = "JEFEREGIONAL";
                var userId = config.settings.systemUserId;
                var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                    "<entity name='systemuser'>" +
                    "<attribute name='fullname'/>" +
                    "<attribute name='businessunitid'/>" +
                    "<attribute name='title'/>" +
                    "<attribute name='address1_telephone1'/>" +
                    "<attribute name='positionid'/>" +
                    "<attribute name='systemuserid'/>" +
                    "<order descending='false' attribute='fullname'/>" +
                    "<filter type='and'>" +
                    "<condition attribute='systemuserid' value='" + userId + "' operator='eq'/>" +
                    "</filter>" +
                    "<link-entity name='atos_usuarios' alias='ac' link-type='inner' to='atos_usuariosapid' from='atos_usuariosid'>" +
                    "<attribute name='atos_usuariosid'/>" +
                    "<attribute name='atos_usuario'/>" +
                    "<attribute name='atos_nombre'/>" +
                    "<attribute name='atos_codigo'/>" +
                    "<attribute name='atos_name'/>" +
                    "</link-entity>" +
                    "</entity>" +
                    "</fetch>";

                var fetchParametros = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                    "<entity name='atos_parametrosedpr'>" +
                    "<attribute name='atos_parametrosedprid' />" +
                    "<attribute name='atos_parametro' />" +
                    "<attribute name='createdon' />" +
                    "<attribute name='atos_valor' />" +
                    "<order attribute='atos_parametro' descending='false' />" +
                    "<filter type='and'>" +
                    "<condition attribute='atos_parametro' operator='eq' value='" + pJefeRegional + "' />" +
                    "</filter>" +
                    "</entity>" +
                    "</fetch>";


                MobileCRM.FetchXml.Fetch.executeFromXML(fetchParametros,
                    function (resultParametros) {
                        if (resultParametros.length > 0) {

                            var valorParametro = resultParametros[0][3];
                            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                                function (resultUser) {
                                    if (resultUser.length > 0) {
                                        var SAPUser = resultUser[0][9];
                                        var fetchXmlCaracteristicas = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>" +
                                            "<entity name='atos_valorcaracteristica'>" +
                                            "<attribute name='atos_name' />" +
                                            "<attribute name='atos_ubicaciontecnicaid' />" +
                                            "<attribute name='atos_equipoid' />" +
                                            "<attribute name='atos_caracteristicaid' />" +
                                            "<attribute name='atos_valor' />" +
                                            "<attribute name='atos_claseid' />" +
                                            "<attribute name='atos_valorcaracteristicaid' />" +
                                            "<order attribute='atos_name' descending='false' />" +
                                            "<filter type='and'>" +
                                            "<condition attribute='atos_valor' operator='eq' value='" + SAPUser + "' />" +
                                            "<condition attribute='statecode' value='0' operator='eq'/>" +
                                            "</filter>" +
                                            "<link-entity name='account' from='accountid' to='atos_ubicaciontecnicaid' link-type='inner' alias='ae'>" +
                                            "<filter type='and'>" +
                                            "<condition attribute='name' operator='eq' value='" + ubicacionTecnica + "' />" +
                                            "</filter>" +
                                            "</link-entity>" +
                                            "<link-entity name='atos_caracteristicasclase' from='atos_caracteristicasclaseid' to='atos_caracteristicaid' visible='false' link-type='outer' alias='caracteristicaClase'>" +
                                            "<filter type='and'>" +
                                            "<condition attribute='atos_codigo' operator='eq' value='" + valorParametro + "' />" +
                                            "</filter>" +
                                            "</link-entity>" +
                                            "</entity>" +
                                            "</fetch>";

                                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlCaracteristicas,
                                            function (resultCaracteristica) {
                                                if (resultCaracteristica.length > 0) {
                                                    // es jefe Regional

                                                }
                                                else {
                                                    // no es jefe regional
                                                    MobileCRM.UI.EntityForm.requestObject(
                                                        function (entityForm) {
                                                            var dv = entityForm.getDetailView("General");
                                                            dv.getItemByName("atos_liberarorden").isEnabled = false;
                                                        },
                                                        FS.CommonEDPR.onError,
                                                        null
                                                    );
                                                }


                                            },
                                            function (err) {
                                                // lanzar mensaje de que no se tiene permiso
                                                MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
                                            },
                                            entityForm
                                        );
                                    }
                                    else {
                                        // no es jefe regional
                                        MobileCRM.UI.EntityForm.requestObject(
                                            function (entityForm) {
                                                var dv = entityForm.getDetailView("General");
                                                dv.getItemByName("atos_liberarorden").isEnabled = false;
                                            },
                                            FS.CommonEDPR.onError,
                                            null
                                        );
                                    }


                                },
                                function (err) {
                                    // lanzar mensaje de que no se tiene permiso
                                    MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
                                },
                                entityForm
                            );

                        }
                    },
                    function (err) {
                        // lanzar mensaje de que no se tiene permiso
                        MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                if (debug == true)
                    MobileCRM.UI.MessageBox.sayText("Error 54--> " + err);
            },
            null
        );
    },


    BloquearUT: function (entityForm) {

        if (!entityForm.entity.isNew && entityForm.entity.properties.msdyn_serviceaccount != null) {
            cambioOperaciones = true;
            var ubicacionTecnica = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
            ubicacionTecnica = ubicacionTecnica.substr(0, 11);

            if (ubicacionTecnica != ubicacionSelecionada.primaryName.substr(0, 11)) {
                // damos err
                cancelUbicacionSelecionada = true;
                cambioUbicacion = false;
                cambioOperaciones = false;
                FS.CommonEDPR.GetErrorCollectionByCode("10104_038", "005");
                entityForm.entity.properties.msdyn_serviceaccount = ubicacionSelecionada;
                return;
            }
            else {

                var ubicacionTecnica = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                ubicacionTecnica = ubicacionTecnica.substr(0, 16);
                if (ubicacionTecnica.indexOf(ubicacionSelecionada.primaryName.substr(0, 16)) > -1) {
                    cambioUbicacion = false;
                }
                else {
                    cambioUbicacion = true;
                }
            }
        }

        if (entityForm.entity.properties.msdyn_serviceaccount != null) {
            var self = this;
            var fields = ["address1_latitude", "address1_longitude", "atos_indicadorabcid", "atos_centroid", "atos_puestodetrabajoresponsableid", "atos_centrodeplanificacionid", "atos_centrodeemplazamientoid", "atos_grupoplanificadorid"];
            FS.CommonEDPR.fetchEntity("account", fields, entityForm.entity.properties.msdyn_serviceaccount.id, "accountid", self.onChangeUbicacionTecnica);
        }


    },

    CambioUbicacionRealizado: function (entityForm) {
        //debugger;
        if (cambioUbicacion) {
            ubicacionSelecionada = entityForm.entity.properties.msdyn_serviceaccount;
            cambioUbicacion = false;
            // obtenemos el codigo de status de OT  si tiene COPE lo quitamos y cerramos el estado de cierre COPE y eliminamos todos los tiempos de inactividad
            var estadoUsuario = entityForm.entity.properties.atos_estadousuario;

            if (estadoUsuario.indexOf(" COPE") > -1) {
                entityForm.entity.properties.atos_estadousuario = estadoUsuario.replace(" COPE", "");
                // añadimos el estado de usuario de cierre.				

                var ordenTrabajoId = entityForm.entity.id;
                // Obtener los historico de estados de COPE
                var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' top='1' no-lock='true'>" +
                    " <entity name='atos_logestado'>" +
                    "   <attribute name='atos_ordendetrabajoid'/>" +
                    "   <attribute name='atos_estadoavisoid'/>" +
                    "   <attribute name='atos_numerocambio'/>" +
                    "   <attribute name='atos_objeto'/>" +
                    "   <attribute name='atos_name'/>" +
                    "	<attribute name='atos_indicadorborrado'/>" +
                    "   <attribute name='atos_creadoensap'/>" +
                    "   <attribute name='atos_identificador'/>" +
                    "   <attribute name='atos_modificadoensap'/>" +
                    "   <order attribute='atos_numerocambio' descending='true'/>" +
                    "    <filter type='and'>" +
                    "      <condition attribute='atos_ordendetrabajoid' operator='eq' uitype='msdyn_workorder' value='" + ordenTrabajoId + "'/>" +
                    "      <condition attribute='atos_identificador' operator='eq' value='E0017'/>" +
                    "    </filter>" +
                    "    <link-entity name='atos_estatusdeaviso' from='atos_estatusdeavisoid' to='atos_estadoavisoid' visible='false' link-type='outer' alias='a_b6fa92eef2c7e811a965000d3a38cba7'/>" +
                    "  </entity>" +
                    "</fetch>";



                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        if (result.length > 0) {

                            // Estatus de usuario
                            var newLogEstadoUsuario = new MobileCRM.DynamicEntity.createNew("atos_logestado");
                            var props = newLogEstadoUsuario.properties;
                            props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", ordenTrabajoId, "");
                            props.atos_identificador = result[0][7];
                            // en ingles NAPR
                            props.atos_name = result[0][4];
                            props.atos_numerocambio = parseInt(result[0][2]) + 1;
                            props.atos_objeto = result[0][3];
                            props.atos_indicadorcambio = 2;
                            props.atos_indicadorborrado = 1;
                            props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", result[0][1].id, "");

                            newLogEstadoUsuario.save(
                                function (err) {
                                    if (err) {
                                        //MobileCRM.UI.MessageBox.sayText(err);
                                    }
                                    else {

                                    }
                                }
                            );
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    },
                    null
                );
            }
            // eliminar tiempos de inactividad
            FS.OrdenTrabajo.EliminarTiemposInactividad(entityForm);
            entityForm.entity.properties.atos_subestacion = false;
            entityForm.entity.properties.atos_puestaenmarcha = false;
            entityForm.entity.properties.atos_lineademt = false;
            entityForm.entity.properties.atos_editaraerogeneradoresparados = false;
            entityForm.entity.properties.atos_aerogenerador = false;
            entityForm.entity.properties.atos_aplicacoberturaseguro = false;
        }
        if (cambioOperaciones) {
            cambioOperaciones = false;
            // si se ha cambiado cambiamos la UT de todas las ordenes.
            FS.OrdenTrabajo.CambiarUbicacionOperaciones(entityForm);

        }
    },

    CambiarUbicacionOperaciones: function (entityForm) {
        // obtengo todas las operaciones que tiene y las cambio la ubicacion
        var ordenTrabajoId = entityForm.entity.id;
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='msdyn_workorderservicetask'>" +
            "<attribute name='msdyn_workorderservicetaskid' />" +
            "<filter type='and'>" +
            "<condition attribute='msdyn_workorder' operator='eq' value='" + ordenTrabajoId + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var ubicacionId = entityForm.entity.properties.msdyn_serviceaccount.id;
                for (var i in result) {
                    // Estatus de usuario
                    var updOperacion = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
                    updOperacion.id = result[i][0];
                    updOperacion.isNew = false;
                    var props = updOperacion.properties;
                    props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", ubicacionId, "");


                    updOperacion.save(
                        function (err) {
                            if (err) {
                                //MobileCRM.UI.MessageBox.sayText(err);
                            }
                            else {

                            }
                        }
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );
    },

    EliminarTiemposInactividad: function (entityForm) {
        // obtengo todas los tiempos de inactividad y los elimino
        var ordenTrabajoId = entityForm.entity.id;
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='atos_tiempoinactividad'>" +
            "<attribute name='atos_tiempoinactividadid'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + ordenTrabajoId + "'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                for (var i in result) {
                    MobileCRM.DynamicEntity.deleteById(
                        "atos_tiempoinactividad",
                        result[i][0],
                        function () {

                        },
                        function (error) {
                            MobileCRM.bridge.alert("An error occurred: " + error);
                        }
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );
    },

    BloquearUTOperacionesConfirmadas: function (entityForm) {
        // obtengo todas las operaciones que tiene y las cambio la ubicacion
        var ordenTrabajoId = entityForm.entity.id;
        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='msdyn_workorderservicetask'>" +
            "<attribute name='msdyn_workorderservicetaskid' />" +
            "<attribute name='atos_estatusconfirmacion' />" +
            "<filter type='and'>" +
            "<condition attribute='msdyn_workorder' operator='eq' value='" + ordenTrabajoId + "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";


        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                var ubicacionId = entityForm.entity.properties.msdyn_serviceaccount.primaryName;
                for (var i in result) {
                    if (result[i][1] == 300000001) {

                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                var dv = entityForm.getDetailView("General");
                                dv.getItemByName("msdyn_serviceaccount").isEnabled = false;
                            },
                            FS.CommonEDPR.onError,
                            null
                        );


                    }


                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            null
        );
    },


    filterClaseActividad: function (entityForm) {
        //Se informa la clase de actividad por el valor que tenga en la entidad Centro Coste x Puesto de Trabajo
        var puestoDeTrabajo = entityForm.entity.properties.atos_puestotrabajoprincipalid;
        var ubicacionTecnica = entityForm.entity.properties.msdyn_serviceaccount;

        if ((puestoDeTrabajo != null) && (ubicacionTecnica != null)) {
            var puestoDeTrabajoId = entityForm.entity.properties.atos_puestotrabajoprincipalid.id;
            var ubicacionTecnicaId = entityForm.entity.properties.msdyn_serviceaccount.id;
            //primaryName

            var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='account'>" +
                "<attribute name='atos_centrodecosteid'/>" +
                "<attribute name='atos_sociedadcoid'/>" +
                "<filter type='and'>" +
                "<condition attribute='accountid' value='" + ubicacionTecnicaId + "' operator='eq'/>" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    FS.OrdenTrabajo.AsignarValorClaseActividad(entityForm, puestoDeTrabajoId, result[0][0], result[0][1]);
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                },
                entityForm
            );


        } else {
            if (ubicacionTecnica != null) {
                FS.OrdenTrabajo.calcularClaseActividadNOPM_porUT(entityForm);
            }
        }
    },

    calcularClaseActividadNOPM_porUT: function (entityForm) {
        var ubicacionTecnicaId = entityForm.entity.properties.msdyn_serviceaccount.id;
        var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='account'>" +
            "<attribute name='atos_sociedadcoid'/>" +
            "<filter type='and'>" +
            "<condition attribute='accountid' value='" + ubicacionTecnicaId + "' operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
            function (result) {
                if (result[0][0] != null) {
                    sociedadCoId = result[0][0].id;
                    var fetchXmlClase = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                        "<entity name='atos_clasedeactividad2'>" +
                        "<attribute name='atos_clasedeactividad2id'/>" +
                        "<attribute name='atos_name'/>" +
                        "<attribute name='atos_codigo'/>" +
                        "<order descending='false' attribute='atos_name'/>" +
                        "<filter type='and'>" +
                        "<condition attribute='atos_sociedadcoid' value='" + sociedadCoId + "'  operator='eq'/>" +
                        "</filter>" +
                        "</entity>" +
                        "</fetch>";

                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlClase,
                        function (result) {
                            if (result.length == 1) {
                                MobileCRM.UI.EntityForm.requestObject(
                                    function (entityForm) {
                                        // entityForm.entity.properties.atos_clasedeactividadid = new MobileCRM.Reference("atos_clasedeactividad2", result[0][0] ,result[0][1] );
                                        claseActividad = new MobileCRM.Reference("atos_clasedeactividad2", result[0][0], result[0][1]);
                                    },
                                    FS.CommonEDPR.onError,
                                    null
                                );
                            }

                        },
                        function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        },
                        entityForm
                    );

                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
            entityForm
        );
    },

    /// <summary>Metodo que se encarga de buscar la clase actividad en la entidad Centro coste x Puesto de trabajo</summary>
    ///  Parametros Puesto de trabajo id, centroCoste y sociedadCO
    AsignarValorClaseActividad: function (entityForm, puestoTrabajoId, centroCoste, sociedadCO) {
        //debugger;
        var fetchXml = "";
        var centroCte = false;
        var socCO = false;
        if (centroCoste != null) {
            centroCte = true;
            fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='atos_centrocoste_puestotrabajo'>" +
                "<attribute name='atos_centrocoste_puestotrabajoid'/>" +
                "<attribute name='atos_name'/>" +
                "<attribute name='atos_puestodetrabajoid'/>" +
                "<attribute name='atos_claseactividadid'/>" +
                "<attribute name='atos_centrodecosteid'/>" +
                "<order descending='false' attribute='atos_name'/>" +
                "<filter type='and'>" +
                "<condition attribute='atos_puestodetrabajoid' value='" + puestoTrabajoId + "' operator='eq'/>" +
                "<condition attribute='atos_centrodecosteid' value='" + centroCoste.id + "' operator='eq'/>" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

        } else if (sociedadCO != null) {
            socCO = true;
            fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='atos_centrocoste_puestotrabajo'>" +
                "<attribute name='atos_centrocoste_puestotrabajoid'/>" +
                "<attribute name='atos_name'/>" +
                "<attribute name='atos_puestodetrabajoid'/>" +
                "<attribute name='atos_claseactividadid'/>" +
                "<attribute name='atos_centrodecosteid'/>" +
                "<order descending='false' attribute='atos_name'/>" +
                "<filter type='and'>" +
                "<condition attribute='atos_puestodetrabajoid' value='" + puestoTrabajoId + "' operator='eq'/>" +
                "<condition attribute='atos_sociedadcoid' value='" + sociedadCO.id + "' operator='eq'/>" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
        }
        if (fetchXml != "") {
            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    if (result.length > 0) {
                        if (result[0][3] != null) {
                            MobileCRM.UI.EntityForm.requestObject(
                                function (entityForm) {
                                    //entityForm.entity.properties.atos_clasedeactividadid = new MobileCRM.Reference("atos_clasedeactividad2", result[0][3].id ,result[0][3].primaryName );
                                    claseActividad = new MobileCRM.Reference("atos_clasedeactividad2", result[0][3].id, result[0][3].primaryName);
                                },
                                FS.CommonEDPR.onError,
                                null
                            );
                        }
                        else {
                            FS.OrdenTrabajo.calcularClaseActividadNOPM_porUT(entityForm);
                        }
                    }
                    else {
                        //se llama al metodo nuevamente para buscar por otro valor
                        if (centroCoste != null) {
                            FS.OrdenTrabajo.AsignarValorClaseActividad(entityForm, puestoTrabajoId, null, sociedadCO);

                        } else if (sociedadCO != null) {
                            FS.OrdenTrabajo.AsignarValorClaseActividad(entityForm, puestoTrabajoId, centroCoste, null);
                        }
                    }

                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                },
                entityForm
            );
        }
    },

	set_atos_region: function() {
		if (atos_region === null || atos_region === undefined) {
			this.GetUserRegion();
		}
	},//set_atos_region

	GetUserRegion: function () {
        try {
            MobileCRM.Configuration.requestObject(
                function (config) {
                    var userId = config.settings.systemUserId;

                    var systemuser = new MobileCRM.FetchXml.Entity("systemuser");
                    systemuser.addAttribute("atos_region");
                    var filter = new MobileCRM.FetchXml.Filter();
                    filter.where("systemuserid", "eq", userId);
                    systemuser.filter = filter;

                    var fetch = new MobileCRM.FetchXml.Fetch(systemuser);
                    fetch.execute("Array", function (result) {
                        for (var i in result) {
                            atos_region = result[i][0];
							FS.OrdenTrabajo.setUserRegion(atos_region);
                            return atos_region;
                        }//for
                    },
                    function (err) {
						MobileCRM.bridge.alert("(GetUserRegion) Error fetching: " + err);
					},
                    null);                    
                },
                function (err) {					
					MobileCRM.bridge.alert("(GetUserRegion) An error requestObject occurred: " + err);
				},
                null
            );//requestObject
        }//try
        catch (error) {
            MobileCRM.bridge.alert("(GetUserRegion) An error occurred: " + error);
        }//catch
    },//GetUserRegion
	
	setUserRegion: function(atosregion) {
		if (atosregion === null || atosregion === undefined) {
			isUserWithNoRegion = true;
			isUserRegionEU = false;
			isUserRegionNA = false;
		}//if
		else if (parseInt(atosregion) === UserRegion.NA) {
			isUserWithNoRegion = false;
			isUserRegionEU = false;
			isUserRegionNA = true;
		}//else if
		else if (parseInt(atosregion) === UserRegion.EU) {
			isUserWithNoRegion = false;
			isUserRegionEU = true;
			isUserRegionNA = false;
		}//else if
		else {
			isUserWithNoRegion = false;
			isUserRegionEU = false;
			isUserRegionNA = false;
		}//else
	},//setUserRegion	

  validarOP: function (entityForm) {

        var ordenId = entityForm.entity.id;
        // 21491 AAC 17/11/2020-->mensaje informativo al cerrar la O.T. sin confirmación.
        var mensajeSinConfirmar = "";

        var fetchXmlOperacionesSinConfirmar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>" +
            "<entity name='msdyn_workorderservicetask'>" +
            "<attribute name='msdyn_workorderservicetaskid' />" +
            "<attribute name='msdyn_workorder' />" +
            "<attribute name='msdyn_name' />" +
            "<order attribute='msdyn_name' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_capacidadreal' operator='not-null' />" +
            "<condition attribute='atos_fechainicioreal' operator='not-null' />" +
            "<condition attribute='atos_fechafinreal' operator='not-null' />" +
            "<condition attribute='atos_duracionrealhoras' operator='not-null' />" +
            "<condition attribute='atos_trabajoreal' operator='not-null' />" +
            "<condition attribute='atos_confirmacion' operator='ne' value='1' />" +
            "<condition attribute='msdyn_workorder' operator='eq' value='" + ordenId + "' />" +
            "</filter>" +
            "<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' visible='false' link-type='outer' alias='OT'>" +
            "<attribute name='msdyn_name' />" +
            "</link-entity>" +
            "<link-entity name='atos_clavedecontrol' from='atos_clavedecontrolid' to='atos_clavedecontrolid' link-type='inner' alias='bl'>" +
            "<filter type='and'>" +
            "<condition attribute='atos_codigo' operator='ne' value='ZPM2' />" +
            "</filter>" +
            "</link-entity>" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperacionesSinConfirmar,

            function (resultOperacionesSinConfirmar) {
                var fetchXmlComponentesSinConfirmar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>" +
                    "<entity name='atos_componenteoperacion'>" +
                    "<attribute name='atos_name' />" +
                    "<attribute name='atos_componenteoperacionid' />" +
                    "<attribute name='atos_ordendetrabajoid' />" +
                    "<order attribute='atos_name' descending='false' />" +
                    "<filter type='and'>" +
                    "<filter type='or'>" +
                    "<condition attribute='atos_documentodeconfirmacion' operator='null'/>" +
                    "<condition attribute='atos_flagcancelado' operator='ne' value='1'/>" +
                    "</filter>" +
                    "<condition attribute='atos_listadematerial' operator='eq' value='300000001' />" +
                    "<condition attribute='atos_borradoensap' operator='ne' value='1' />" +
                    "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + ordenId + "' />" +
                    "</filter>" +
                    "<link-entity name='msdyn_workorderservicetask' from='msdyn_workorderservicetaskid' to='atos_operacionid' link-type='inner' alias='bk'>" +
                    "<link-entity name='atos_clavedecontrol' from='atos_clavedecontrolid' to='atos_clavedecontrolid' link-type='inner' alias='bl'>" +
                    "<filter type='and'>" +
                    "<condition attribute='atos_codigo' operator='ne' value='ZPM2' />" +
                    "</filter>" +
                    "</link-entity>" +
                    "</link-entity>" +
                    "<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' visible='false' link-type='outer' alias='OT'>" +
                    "<attribute name='msdyn_name' />" +
                    "</link-entity>" +
                    "</entity>" +
                    "</fetch>";


                if (resultOperacionesSinConfirmar.length > 0) {
                    //mensajeSinConfirmar= ""; FS.CommonEDPR.GetErrorCollectionByCode("10104_070", "004"); 
                    if (IdiomaUsuario == Idioma.ingles) {
                        mensajeSinConfirmar = mensajeSinConfirmar + "The work order has operations without confirmation. ";
                    }
                    else {
                        mensajeSinConfirmar = mensajeSinConfirmar + "La orden de trabajo tiene operaciones sin confirmar. ";
                    }

                }



                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlComponentesSinConfirmar,
                    function (resultComponentesSinConfirmar) {
                        if (resultComponentesSinConfirmar.length > 0) {
                            //mensajeSinConfirmar= "";//  FS.CommonEDPR.GetErrorCollectionByCode("10104_071", "004"); 
                            if (IdiomaUsuario == Idioma.ingles) {
                                mensajeSinConfirmar = mensajeSinConfirmar + "The work order has components without confirmation. ";
                            }
                            else {
                                mensajeSinConfirmar = mensajeSinConfirmar + "La orden de trabajo tiene componentes sin confirmar. ";
                            }

                        }
                        if (mensajeSinConfirmar != "") {
                            var popup;
                            if (IdiomaUsuario == Idioma.ingles) {
                                /// Add the buttons for message box
                                popup = new MobileCRM.UI.MessageBox(mensajeSinConfirmar + " Continue?");
                                popup.items = ["Yes", "No"];
                            }
                            else {
                                popup = new MobileCRM.UI.MessageBox(mensajeSinConfirmar + "¿Continuar?");
                                popup.items = ["Si", "No"];

                            }

                            popup.multiLine = true;
                            popup.show(
                                function (button) {
                                    if (button == "Yes" || button == "Si") {
                                        FS.OrdenTrabajo.CierreAvisoConParada(entityForm);
                                    }
                                    else {
                                        MobileCRM.UI.EntityForm.requestObject(
                                            function (entityForm) {
                                                entityForm.entity.properties.atos_cierretecnicodeorden = false;
                                            },
                                            FS.CommonEDPR.onError,
                                            null
                                        );
                                        return;
                                    }
                                }
                            );
                        }
                        else {
                            FS.OrdenTrabajo.CierreAvisoConParada(entityForm);
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                        MobileCRM.UI.MessageBox.sayText("Error 3--> " + err);
                    },
                    entityForm
                );

            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                MobileCRM.UI.MessageBox.sayText("Error 4--> " + err);
            },
            entityForm
        );
    },


}//CLASS FS.OrdenTrabajo

//#region fetchs

function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}




var _fetchCodigos = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='atos_codigos'>" +
    "<attribute name='atos_name_es' />" +
    "<attribute name='atos_name_en' />" +
    "<link-entity name='atos_catalog' from='atos_catalogid' to='atos_catalogoid' link-type='inner' alias='af'>" +
    "<filter type='and'>" +
    "<condition attribute='atos_palabraclave' operator='eq' value='Activity PM' />" +
    "</filter>" +
    "</link-entity>" +
    "<link-entity name='atos_grupocodigoscatalogo' from='atos_grupocodigoscatalogoid' to='atos_grupocodigosid' link-type='inner' alias='ag'>" +
    "<filter type='and'>" +
    "<condition attribute='atos_codigodelgrupo' operator='like' value='%ACTIVITY%' />" +
    "</filter>" +
    "</link-entity>" +
    "<link-entity name='atos_catalogoaviso' from='atos_codigoid' to='atos_codigosid' link-type='inner' alias='ah'>" +
    "<filter type='and'>" +
    "<condition attribute='atos_avisoid' operator='eq' value='#atos_avisoid#' />" +
    "</filter>" +
    "</link-entity>" +
    "</entity>" +
    "</fetch>";

var fetchEquipo = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='msdyn_customerasset'>" +
    "<attribute name='atos_fabricante' />" +
    "<order attribute='createdon' descending='true' />" +
    "<filter type='and'>" +
    "<condition attribute='msdyn_customerassetid' operator='eq' value='{#equipoid#}' />" +
    "</filter>" +
    "</entity>" +
    "</fetch>";

//#endregion
