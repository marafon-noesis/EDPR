if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (Aviso) == "undefined") { Aviso = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
var clonar;
//#endregion
//#region ENUMERADOS
var StateCodeEnum = {
    StateCodeEnum_Activo: 0,
    StateCodeEnum_Inactivo: 1
}

var StatusCode = {
    MensajeAbierto: 1,
    MensajeCerrado: 2,
    PeticionBorrado: 300000002,
    OrdenAsignada: 300000001,
    MensajeEnTratamiento: 300000000
}
var EstadoIntegracionSAP = {
    PendienteEnvioSAP: 1,
    EnviadoASAP: 2,
    SincronizadoConSAP: 3,
    Cerrado: 4,
    ErrorSincronizacion: 5
}
var CategoriaProceso = {
    Proceso_Abierto: 1,
    Proceso_EnTratamiento: 3,
    Proceso_OTAsignada: 4, 
    Proceso_Cerrado: 5,
    Proceso_Borrado: 6,
    Proceso_Investigar: 7,
    Proceso_Resolver: 8,
    Proceso_Aprobar: 9,
}
var PROP_CON_CLASIFICA = 0;

var numIntentos = 0;

var estadoUsuarioInicialId ;
var estadoSistemaInicialId ;
var esNuevo =false ;

//catalogs inciales
var catalogoAid;
var catalogoBid;
var catalogo5id;
// var de control cde clonado
TotalCatalogos = 0;
TotalCatalogosB = 0;
contParte =0;
var arrayParteObjeto = [];


// FECHA: 14/04/2020
// AAC REDMINE: 21749 Controlar cambio de UT en avisos.
// lo primero que se comprueba es que se pueda modificar la ubicacion tecnica
var CreadaDespacho = false;
var UbicacionSeleccionada;
var jefeDeParque = false;



FS.Aviso = {
    // funci?n  que se lanza cuando se carga la pantalla de  aviso y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    AvisoOnLoad: function () {
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
                self.onLoad(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );

        // evento on change
        MobileCRM.UI.EntityForm.onChange(
            function (entityForm) {
                self.onChange(entityForm);
            },
            FS.CommonEDPR.onError,
            null
        );
        // evento on save
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
		
    },
	 AvisoOnLoadClonacion: function () {
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
				self.CargarEstadoUsuarioInicial(entityForm);
				self.CalcularEstadoSistemaInicial(entityForm);
				self.CargarUbicacionesClonacion(entityForm,1);
				
            },
            FS.CommonEDPR.onError,
            null
        );

      
		
    },
    // funci?n  que se lanza cuando se carga el aviso
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var aviso = entityForm.entity;

        // creamos la definicion del comando clonar
        MobileCRM.UI.EntityForm.onCommand(
            "custom_clonar",
            function (entityForm) {
                //self.ClonarAviso(entityForm);
				MobileCRM.UI.EntityForm.enableCommand("custom_clonar", false);
				MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonar", true);
				if (entityForm.entity.properties.statecode != 1 && jefeDeParque){
					MobileCRM.UI.EntityForm.enableCommand("custom_flagBorrado", false);
					MobileCRM.UI.EntityForm.enableCommand("custom_OT", false);
					MobileCRM.UI.EntityForm.enableCommand("custom_parada", false);
				}


            },
            true
        );

		 MobileCRM.UI.EntityForm.onCommand(
            "custom_cancelClonar",
            function (entityForm) {
				MobileCRM.UI.EntityForm.enableCommand("custom_clonar", true);
				if (entityForm.entity.properties.statecode != 1 && jefeDeParque){
					MobileCRM.UI.EntityForm.enableCommand("custom_flagBorrado", true);
					MobileCRM.UI.EntityForm.enableCommand("custom_OT", true);
					MobileCRM.UI.EntityForm.enableCommand("custom_parada", true);

				}
				MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonar", false);
            },
            true
        );
		
		
        // creamos la definicion del comando FlagDeBorrado
        MobileCRM.UI.EntityForm.onCommand(
            "custom_flagBorrado",
            function (entityForm) {
                self.DeleteFlag(entityForm);
            },
            true
        );

		// creamos la definicion del comando para crear un OT desde Aviso
        MobileCRM.UI.EntityForm.onCommand(
            "custom_OT",
            function (entityForm) {
                self.CrearOT(entityForm);
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
		if (entityForm.entity.properties.statecode == 1){
			MobileCRM.UI.EntityForm.enableCommand("custom_clonar", true);
		}
		
		MobileCRM.UI.EntityForm.enableCommand("custom_cancelClonar", false);
        // bloqueamos ciertos campos 
        var dv = entityForm.getDetailView("Cabecera");
		var dv2 = entityForm.getDetailView("Inf_Gestion");
		var dv3 = entityForm.getDetailView("General");
		if (dv3.getItemByName("atos_codigosid")!=null){
			dv3 = dv;
		}
			
        dv.getItemByName("atos_estadousuario").isEnabled = false;
        dv2.getItemByName("atos_indicadorborrado").isEnabled = false;
		dv.getItemByName("atos_descripcionut").isEnabled = false;
		if (dv2.getItemByName("atos_grupocodigoscatalogoid")!=null)
			dv2.getItemByName("atos_grupocodigoscatalogoid").isEnabled = false;
		
		
        if (aviso.isNew) {
			MobileCRM.UI.EntityForm.enableCommand("custom_clonar", false);
            ///Inicializa los campos de formulario.
			esNuevo = true;
            entityForm.entity.properties.atos_fechanotificacion = new Date();
			entityForm.entity.properties.atos_origen = 300000002;
            //entityForm.entity.properties.atos_fechainicioaveria = new Date();
            ///Deshabilita campos FASE 1 
            //Atos.Avisos.lockCampoProceso("atos_enintegracion", true);
            //Atos.Avisos.lockCampoProceso("atos_peticionborrado", true);
            //Atos.Avisos.lockCampoProceso("atos_liberaraviso", true);
            //formContext.getControl("atos_codigosid").addPreSearch(Atos.Avisos.filterAlarma);
            //Por defecto codigo de alarma no debe mostrarse al crear
             self.ObtenerCatalogo(entityForm,"A"); 
			 self.ObtenerCatalogo(entityForm,"B"); 
             self.ObtenerCatalogo(entityForm,"5"); 
			 
            // ocultamos el iframe de estados por que de la inicializacion del estado de usuario se encarga un plugin
            entityForm.setTabVisibility("Estado de usuario", false);

            dv3.getItemByName("atos_codigosid").isEnabled = false;
			//dv3.getItemByName("atos_grupocodigoscatalogoid").isEnabled = false;
			
           
        }
        else {
			UbicacionSeleccionada = entityForm.entity.properties.atos_ubicaciontecnicaid;
            esNuevo = false;
            self.esJefeDeParque(entityForm); 
		    // miramos si es Z5 para activar  el campo aviso parada
            self.verCampoParada(entityForm);
			
			
			
            ///Establece valores de fechas
            if (entityForm.entity.properties.atos_fechanotificacion == null) {
                entityForm.entity.properties.atos_fechanotificacion = entityForm.entity.properties.createdon;
            }
            //if (entityForm.entity.properties.atos_fechainicioaveria == null) {
            //    entityForm.entity.properties.atos_fechainicioaveria = entityForm.entity.properties.createdon;
            //}
			
			if (entityForm.entity.properties.atos_creadorensap  != null && (entityForm.entity.properties.atos_creadorensap.trim().toUpperCase() == "RFCTARGET" || entityForm.entity.properties.atos_creadorensap.trim().toUpperCase() == "RFCUSERQ38 ")) {
				if (dv3.getItemByName("atos_fechainicioaveria"))
					dv3.getItemByName("atos_fechainicioaveria").isEnabled = false;
					// FECHA: 28/05/2020
                    //AAC REDMINE: 21766 Cambios en fechas Dynamics de avisos y ordenes de trabajo
				if (dv.getItemByName("atos_fechanotificacion"))
					dv.getItemByName("atos_fechanotificacion").isEnabled = false;
					// FECHA: 14/04/2020
					//AAC REDMINE: 21749 Controlar cambio de UT en avisos.
					// lo primero que se comprueba es que se pueda modificar la ubicacion tecnica
					CreadaDespacho = true;
            }
			
			
            //formContext.getControl("atos_codigosid").addPreSearch(Atos.Avisos.filterAlarma);
            self.setCamposProcceso(entityForm)
            self.BloquearCamposSiEnviadoSAP(entityForm);
            self.ComprobarDescripcionUT(entityForm);
		
        }
        self.CargarEstadosUsuario(entityForm);
		self.tienePermisosJefeParque(entityForm);
    },
    // funci?n  que se lanza cuando se guarda el aviso
    //...
    // AAC 07-11-2018
	
	onSave: function (entityForm) {
        var self = this;
			entityForm.entity.properties.atos_origen = 300000002;
			// cambio el texto de status de usuario 
				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm2) {
						if (esNuevo) {
							self.CargarEstadoUsuarioInicial(entityForm);
							MobileCRM.UI.EntityForm.enableCommand("custom_clonar", true);
							if (IdiomaUsuario == Idioma.ingles)
								entityForm2.entity.properties.atos_estadousuario = "NAPR";
							else 
								entityForm2.entity.properties.atos_estadousuario = "EAPR";
							
							entityForm.entity.properties.atos_estadousuarioes = "EAPR";
							entityForm.entity.properties.atos_estadousuarioen = "NAPR";
							// actualizo el registro de atos_logestado
							var avisoSave = entityForm.entity;
							avisoSave.save(
								function (err) {
									if (err) {
										//MobileCRM.UI.MessageBox.sayText(err);
									}
									else {
										if (IdiomaUsuario == Idioma.ingles)
											MobileCRM.UI.MessageBox.sayText("User status has changed to " + textoStatusUsuario + " .");
										else
											MobileCRM.UI.MessageBox.sayText("El estado usuario del aviso ha cambiado a " + textoStatusUsuario + " .");
										
										FS.Aviso.CargarEstadosUsuario(entityForm);
									}
								}
							);
						}
						UbicacionSeleccionada = entityForm.entity.properties.atos_ubicaciontecnicaid;
					},
					FS.CommonEDPR.onError,
					null
				); 
		
    },
    onPostSave: function (entityForm) {
        var self = this;
	
		self.onSaveNewAviso(entityForm.entity,false,entityForm );
    
		
    },
    // funci?n  que se encarga de rediriguir todos los onchange de los avisos
    // AAC 07-11-2018
    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;


        if (changedItem == "atos_ubicaciontecnicaid") {
			
			if (!self.ComprobarCambioUbicacion(entityForm)){
				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {			
						entityForm.entity.properties.atos_ubicaciontecnicaid = UbicacionSeleccionada;
					},
					FS.CommonEDPR.onError,
					null
				);			
				return;
			}
            self.onChangeUbicacion(entityForm);
			self.onChangeDescripcion(entityForm);
			self.onChangeClaseAviso(entityForm);
			
        }
        if (changedItem == "atos_fechainicioaveria") {
            self.onChangeInicioFinAveria(entityForm,changedItem);
			self.onChangePriorityDeadLine(entityForm);
        }
        if (changedItem == "atos_fechafinaveria") {
            self.onChangeInicioFinAveria(entityForm,changedItem);
            self.onChangeFechaFinAveria(entityForm);
        }
		if (changedItem == "atos_fechalimiteejecucion") {
            self.onChangeInicioFinAveria(entityForm, changedItem);
        }
        if (changedItem == "atos_prioridadid") {
            self.onChangePriorityDeadLine(entityForm);
        }

                //#region MM-5185
        if (changedItem == "edprdyn_turbineentranceandexit") {

            self.onChangeTurbineEntranceOrExit(entityForm);

        }
        //#endregiom MM-5185

        if (changedItem == "atos_clasedeavisoid") {
            self.onChangeDescripcion(entityForm);
			self.onChangeClaseAviso(entityForm);
			
        }
		
		if (changedItem == "atos_codigosid") {
            
			self.onChangeCodigoAlarma(entityForm);
			
        }
		
		if (changedItem == "atos_grupocodigoscatalogoid") {
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
							 entityForm.entity.properties.atos_codigosid = null; // cambia
							},
							FS.CommonEDPR.onError,
							null
						);			
        }
		//
		if (changedItem == "atos_ordendetrabajoid"){
			if (entityForm.entity.properties.atos_ordendetrabajoid == null){
				entityForm.entity.properties.atos_ordenasignada = false;
			}
			else {
				entityForm.entity.properties.atos_ordenasignada = true;
			}
        }
		// FECHA: 28/05/2020
        //AAC REDMINE: 21766 Cambios en fechas Dynamics de avisos y ordenes de trabajo
		// cerrarAviso
		if (changedItem == "atos_cierreavisobool"){
			if (entityForm.entity.properties.atos_cierreavisobool == true){
			 entityForm.entity.properties.atos_cierredeaviso = new Date();
			 self.CerrarAvisoParadaDespacho(entityForm);
			}
			else {
				 entityForm.entity.properties.atos_cierredeaviso = null;
			}
		}
    },
    // funci?n  que se lanza cuando se cambia la fecha de inicio de la  averia
    // Comprueba que no tenga fecha fin averia si no hay fecha inicio averia, 
    //  Que si hay fecha de fin averia sea mayor que la fecha de inicio averia
    // luego asigna la fecha inicio del avisoa la fecha de inicio de la averia si se cumplen las anteriores condiciones
    // AAC 07-11-2018
    onChangeInicioFinAveria: function (entityForm,changedItem) {
        var self = this;
        try {
            var fechaInicio = entityForm.entity.properties.atos_fechainicioaveria;
            var fechaFin = entityForm.entity.properties.atos_fechafinaveria;
			var fechaLimiteEjecucion = entityForm.entity.properties.atos_fechalimiteejecucion;

			//FECHA FIN 
            if (fechaInicio == null && fechaFin != null) {
                var idMsjeError = "10175_004";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
				 entityForm.entity.properties.atos_fechafinaveria = null;
				return;
            }
            else if (fechaInicio != null && fechaFin != null && fechaInicio > fechaFin) {
                var idMsjeError = "10175_005";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
				entityForm.entity.properties.atos_fechafinaveria = null;
				return;
            }
            else {
				if ( entityForm.entity.properties.atos_fechafinaviso == null || fechaInicio <= entityForm.entity.properties.atos_fechafinaviso){
						entityForm.entity.properties.atos_fechainicioaviso == fechaInicio;
				}
				else {
					//if (entityForm.entity.properties.atos_fechafinaviso!=null){
					//	entityForm.entity.properties.atos_fechainicioaviso == entityForm.entity.properties.atos_fechafinaviso;
					//}
				}
            }
			
			//FECHA LIMITE
			if (fechaInicio == null && fechaLimiteEjecucion != null) {
                var idMsjeError = "10175_004";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
				entityForm.entity.properties.fechaLimiteEjecucion = null;
				return;
            }
            else if (fechaInicio != null && fechaLimiteEjecucion != null && fechaInicio > fechaLimiteEjecucion) {
                var idMsjeError = "10175_019";
                FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
				entityForm.entity.properties.fechaLimiteEjecucion = null;
				return;
            }
            else {
                if ( entityForm.entity.properties.atos_fechafinaviso == null || fechaInicio <= entityForm.entity.properties.atos_fechafinaviso){
						entityForm.entity.properties.atos_fechainicioaviso == fechaInicio;
				}
				else {
					//if (entityForm.entity.properties.atos_fechafinaviso!=null){
					//	entityForm.entity.properties.atos_fechainicioaviso == entityForm.entity.properties.atos_fechafinaviso;
					//}
				}
            }
			
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 1--> " +  err);	
        }
    },

    // funci?n  que se lanza cuando se cambia la ubicacion del Aviso
    // iguala los  campos de aviso con los de la ubicacion , estos campos son:
    // Indicador ABC
	// denominacion
	// centro de planificacion
	// puesto de trabajo responsable
	// centro de planificacion
	//sociedad
    //...
    // AAC 07-11-2018
    onChangeUbicacion: function (entityForm) {
			var self = this;
			try {
                



				
				jefeParque = false;
				if (entityForm.entity.properties.atos_ubicaciontecnicaid== null)
					return;
				
				self.esJefeDeParque(entityForm); 
			
			var props = entityForm;
            var aviso = entityForm.entity;
            var ubicacionId = entityForm.entity.properties.atos_ubicaciontecnicaid.id;
			
			var varFetchBuscar =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'> " +
			"  <entity name='account'> " +
			"    <attribute name='atos_indicadorabcid' /> " +
			"    <attribute name='atos_denominacion' /> " +
			"    <attribute name='atos_centrodeplanificacionid' /> " +
			"    <attribute name='atos_puestodetrabajoresponsableid' /> " +
			"    <attribute name='atos_centroid' /> " + 
			"    <attribute name='atos_sociedadid' /> " + 
			"    <attribute name='atos_grupoplanificadorid' /> " + 
			"	<filter type='and'> " +                                 
			"        <condition attribute='accountid' value='" + ubicacionId + "' operator='eq'/>  " +
			"   </filter>  " +
			"  </entity> " +
			"</fetch> ";
			
			MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                   
					for (var i in result) {
						var results = result[i]
						if (result[0][0] != null) {
							props.getDetailView("Inf_Gestion").getItemByName("atos_indicadorabcid").value = new MobileCRM.Reference(result[0][0].entityName, result[0][0].id, result[0][0].primaryName);
							aviso.properties["atos_indicadorabcid"] = new MobileCRM.Reference(result[0][0].entityName, result[0][0].id, result[0][0].primaryName);
						}
					}

                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
							
                            if (result[0][0]!=null)
							entityForm.entity.properties.atos_indicadorabcid = new MobileCRM.Reference(result[0][0].entityName, result[0][0].id, result[0][0].primaryName);
						else 
							entityForm.entity.properties.atos_indicadorabcid =null;
						
						if (result[0][1]!=null)
							entityForm.entity.properties.atos_descripcionut = result[0][1];
						else 
							entityForm.entity.properties.atos_descripcionut =null;
					
						if (result[0][2]!=null)
							entityForm.entity.properties.atos_centrodeplanificacinid = new MobileCRM.Reference(result[0][2].entityName, result[0][2].id, result[0][2].primaryName);
						else 
							entityForm.entity.properties.atos_centrodeplanificacinid =null;
						
						if (result[0][3]!=null)
							entityForm.entity.properties.atos_puestotrabajoprincipalid = new MobileCRM.Reference(result[0][3].entityName, result[0][3].id, result[0][3].primaryName);
						else 
							entityForm.entity.properties.atos_puestotrabajoprincipalid =null;
						
						if (result[0][4]!=null)
							entityForm.entity.properties.atos_centroid = new MobileCRM.Reference(result[0][4].entityName, result[0][4].id, result[0][4].primaryName);
						else 
							entityForm.entity.properties.atos_centroid =null;
						
						if (result[0][5]!=null)
							entityForm.entity.properties.atos_sociedadid = new MobileCRM.Reference(result[0][5].entityName, result[0][5].id, result[0][5].primaryName);
						else 
							entityForm.entity.properties.atos_sociedadid =null;
						
						if (result[0][6]!=null)
							entityForm.entity.properties.atos_grupoplanificadorid = new MobileCRM.Reference(result[0][6].entityName, result[0][6].id, result[0][6].primaryName);
						else 
							entityForm.entity.properties.atos_grupoplanificadorid =null;
						
						var UTname = "";
						if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null){
							UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName ;
						}

						if ( !self.EsUbicacionAmericana(UTname) && !jefeDeParque) {
							self.ObtenerGrupoSubcontrata(entityForm);
						}
						
						
                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 2--> " +  err);	
                },
                entityForm
            );
			

			// miramos si  tienes equipo asociados la UT  y si no tiene deshabilito el campo
			
			var equipos = new MobileCRM.FetchXml.Entity("msdyn_customerasset");
			equipos.addAttribute("atos_ultimonumerodeserie");
			equipos.addAttribute("msdyn_customerassetid");


			var filterEquipo = new MobileCRM.FetchXml.Filter();
			filterEquipo.where("msdyn_account", "eq", ubicacionId);
			equipos.filter = filterEquipo;
			var fetchEquipo = new MobileCRM.FetchXml.Fetch(equipos);
		
		
			fetchEquipo.execute("Array", function (resultEquipos) {

				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						var dv = entityForm.getDetailView("Cabecera");
						entityForm.entity.properties.atos_equipoid = null;
						if (resultEquipos.length > 0)	{
							dv.getItemByName("atos_equipoid").isEnabled = true;
						}
						else {
						dv.getItemByName("atos_equipoid").isEnabled = false;	
						}
								
					},
					FS.CommonEDPR.onError,
					null
					);
				}, function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 3--> " +  err);	
				},
				null);
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 4--> " +  err);	
        }
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
									"          <condition attribute='systemuserid' operator='eq' value='"+ userId +"' />" +
									"        </filter>" +
									"      </link-entity>" +
									"    </link-entity>" +
									"  </entity> " +
									"</fetch>";
				
				
				

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlGrupo,
                    function (result) {
                        for (var i in result) {
                            if (result[i][2] != null) {
                                
								if (entityForm.entity.properties.atos_centrodeplanificacinid != null ){
									var codigoSubcontrata = result[i][2];
									var fetchXml =	"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
													"  <entity name='atos_grupoplanificador'>" +
													"    <attribute name='atos_grupoplanificadorid' />" +
													"    <attribute name='atos_name' />" +
													"    <attribute name='atos_descripcion' />" +
													"    <attribute name='atos_codigo' />" +
													"    <attribute name='atos_centroplanificacionid' />" +
													"    <order attribute='atos_name' descending='false' />" +
													"    <filter type='and'>" +
													"      <condition attribute='atos_codigo' operator='eq' value='"+ codigoSubcontrata +"' />" +
													"      <condition attribute='atos_centroplanificacionid' operator='eq'  uitype='atos_centrodeplanificacion' value='" + entityForm.entity.properties.atos_centrodeplanificacinid.id + "' />" +
													"    </filter>" +
													"  </entity>" +
													"</fetch>";
									MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
										   function (result) {
											   for (var i in result) {
													MobileCRM.UI.EntityForm.requestObject(
														function (entityForm) {
															entityForm.entity.properties.atos_grupoplanificadorid =  new MobileCRM.Reference("atos_grupoplanificador", result[i][0], result[i][1]);
														},
														FS.CommonEDPR.onError,
														null
													);
												}
										   },
										   function (err) {
											   FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
										if (debug == true)
											MobileCRM.UI.MessageBox.sayText("Error 5--> " +  err);						
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
 			                MobileCRM.UI.MessageBox.sayText("Error 6--> " +  err);		
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				if (debug == true)
					MobileCRM.UI.MessageBox.sayText("Error 7--> " +  err);						
            },
            null
        );
	},



// FECHA: 28/05/2020
//AAC REDMINE: 21766 Cambios en fechas Dynamics de avisos y ordenes de trabajo
 CerrarAvisoParadaDespacho: function (entityForm) {
    try {
        var CAid = entityForm.entity.properties.atos_clasedeavisoid.id;
		var claseDeAviso = new MobileCRM.FetchXml.Entity("atos_clasedeaviso");
        claseDeAviso.addAttribute("atos_codigo");
        claseDeAviso.addAttribute("atos_name");
        claseDeAviso.addAttribute("atos_name_es");
        claseDeAviso.addAttribute("atos_name_en");
        var filter = new MobileCRM.FetchXml.Filter();
        filter.where("atos_clasedeavisoid", "eq", CAid);
        claseDeAviso.filter = filter;
        var fetch = new MobileCRM.FetchXml.Fetch(claseDeAviso);

        fetch.execute("Array", function (result) {
			for (var i in result) {
                var results = result[i]
					if (result[i][0] == "Z5" &&  CreadaDespacho && entityForm.entity.properties.atos_ordendetrabajoid == null && entityForm.entity.properties.atos_avisoparada == true ) {
						FS.Aviso.GetFechaPuestaMarcha(entityForm);
                   }
            }
        },
		function (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 8--> " +  err);	
        },
		null);
    }
    catch (err) {
        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
		MobileCRM.UI.MessageBox.sayText("Error 9--> " +  err);	
    }
},
   


// FECHA: 28/05/2020
//AAC REDMINE: 21766 Cambios en fechas Dynamics de avisos y ordenes de trabajo
// <summary> Al realizar el cierre obtiene la puesta en marcha  </summary>    
 GetFechaPuestaMarcha: function (entityForm) {
   try {
            //BUSCA LOS TI Del AVISO RELACIONADOS
            var id = entityForm.entity.id;
            var fetchXml = "<fetch top='1' version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_tiempoinactividad'>" +
                "<attribute name='atos_fechafin'/>" +
                "<order attribute='atos_fechafin' descending='true'/>" +
                "<filter type='and'>" +
                "<condition attribute='atos_avisoid' operator='eq' value='" + id + "'/>" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
                            var ms = result[i][0];
							var fecha = new Date(ms);
							if (entityForm.entity.properties.atos_fechafinaveria == null){
								MobileCRM.UI.EntityForm.requestObject(
									function (entityForm) {
										entityForm.entity.properties.atos_fechafinaveria = fecha;
									},
									FS.CommonEDPR.onError,
									null
								);
							}
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						MobileCRM.UI.MessageBox.sayText("Error 10--> " +  err);	
                    },
                    entityForm
                );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 11--> " +  err);	
        }
    },




	// FECHA: 14/04/2020
	// AAC REDMINE: 21749 Controlar cambio de UT en avisos.
	// lo primero que se comprueba es que se pueda modificar la ubicacion tecnica
	ComprobarCambioUbicacion: function(entityForm){
	  var aviso = entityForm.entity;
	 if (!aviso.isNew) {
	    var ut = entityForm.entity.properties.atos_ubicaciontecnicaid  ;
		var ot =  entityForm.entity.properties.atos_ordendetrabajoid;
		var utNameAnterior = UbicacionSeleccionada.primaryName;
		
		if (ut == null){
			return true;
		}
		
        if (CreadaDespacho){
			if (ut!=null && ut.primaryName.indexOf(utNameAnterior.substring(0,16)) > -1) {
				return true;
			}
			else {
				var idMsjeError = "10175_029";
				FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
				return false;	
			}
		}
		else {
			if (ot!=null){
				if (ut!=null && ut.primaryName.indexOf(utNameAnterior.substring(0,16)) > -1) {
					return true;
				}
				else {
					// error de solo puede colgar de la existente 
					var idMsjeError = "10175_029";
					FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
					return false;	
				}
			}
			else {
				if (ut!=null && ut.primaryName.indexOf(utNameAnterior.substring(0,8)) > -1) {
					return true;
				}
				else {
					// error de solo puede colgar de la existente 
					var idMsjeError = "10175_030";
					FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
					return false;	
				}						
			}
		}
	 }
      return true;
	},



    // funci?n  que se lanza cuando se cambia la fecha de fin de la  averia
    // Se asigna la fecha inicio de la averiaa la fecha de fin del aviso
    // AAC 07-11-2018
    onChangeFechaFinAveria: function (entityForm) {
		//AAC 22122 18/11/2020 en NA no se relacion la fecha de fin de averia con la fecha de fin 
		var UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
		if(!this.EsUbicacionAmericana(UTname)){
			var fechaFin = entityForm.entity.properties.atos_fechafinaveria;
			entityForm.entity.properties.atos_fechafinaviso == fechaFin;
		}
    },

    // funci?n  que se lanza cuando se cambia la priridad 
    // y calcula la nueva fexha de limite de ejecucion depediendo de la prioridad.
    // AAC 07-11-2018
    onChangePriorityDeadLine: function (entityForm) {
        //Obtener el estado del sistema
        var self = this;
        var status = entityForm.entity.properties.statuscode;
        var priority = entityForm.entity.properties.atos_prioridadid;
        var dateset = entityForm.entity.properties.atos_fechainicioaveria;


        var numberOfDays;
        if (status == StatusCode.MensajeAbierto & priority != null) {
            try {
                switch (priority.primaryName) {
                    case "Very High":
                    case "Muy Alta":
                        numberOfDays = 1
                        break;
                    case "High":
                    case "Alta":
                        numberOfDays = 16
                        break;
                    case "Medium":
                    case "Media":
                        numberOfDays = 45
                        break;
                    case "Low":
                    case "Baja":
                        numberOfDays = 225
                        break;
                }
				if (dateset != null)
				{
                    dateset = new Date(dateset.getTime() + (  numberOfDays * 24 * 60 * 60 * 1000));
				}

				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						entityForm.entity.properties.atos_fechalimiteejecucion = dateset;
					},
					FS.CommonEDPR.onError,
					null
				);
				
                
            }
            catch (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('10175_010', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 13--> " +  err);	
            }
        }
    },
    onChangeCodigoAlarma: function (entityForm) {
       
        if (entityForm.entity.properties.atos_codigosid != null) {
            var id = entityForm.entity.properties.atos_codigosid.id;
            var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='atos_codigos'>"+ 
                "<attribute name='atos_name'/>" +
                "<attribute name='atos_grupocodigosid'/>" +
                "<attribute name='atos_codigo'/>" +
                "<attribute name='atos_catalogoid'/>" +
                "<attribute name='atos_codigosid'/>" +
                "<order descending='false' attribute='atos_name'/>" +
                "<filter type='and'>" +
                "<condition attribute='atos_codigosid' value='" + id + "' operator='eq'/>" +
                "</filter>" +
                "<link-entity name='atos_grupocodigoscatalogo' alias='aa' link-type='inner' to='atos_grupocodigosid' from='atos_grupocodigoscatalogoid'>" +
                "<attribute name='atos_codigodelgrupo' />" +
                "</link-entity>" +
                "</entity>" +
                "</fetch>";
			
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
							
							
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
							 entityForm.entity.properties.atos_grupocodigoscatalogoid = new MobileCRM.Reference(result[i][1].entityName, result[i][1].id, result[i][1].primaryName);
							},
							FS.CommonEDPR.onError,
							null
						);
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						MobileCRM.UI.MessageBox.sayText("Error 14--> " +  err);	
                    },
                    entityForm
                );
        }
        else {
            entityForm.entity.properties.atos_grupocodigoscatalogoid == null;
        }

    },
	// obtiene el identificador del catalogo y lo mete en una variable
	ObtenerCatalogo: function (entityForm,catalogo) {
       
       
            var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='atos_catalog'>"+ 
                "<attribute name='atos_catalogid'/>" +
                "<filter type='and'>" +
                "<condition attribute='atos_codigo' value='" + catalogo + "' operator='eq'/>" +
                "</filter>" +
                "</entity>" +
                "</fetch>";
			
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
							
							if (catalogo =="A"){
							 	catalogoAid = result[i][0];
							}
							if (catalogo =="B"){
								catalogoBid = result[i][0];
							}
							if (catalogo =="5"){
								catalogo5id = result[i][0];
							}
						}
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						MobileCRM.UI.MessageBox.sayText("Error 15--> " +  err);	
                    },
                    entityForm
                );


    },
	/// devuelve true si es una ubicacion americana
	EsUbicacionAmericana:function(UTname)
	{
		if (UTname.split("-").length > 2 && ( UTname.split("-")[1] != "US" &&   UTname.split("-")[1] != "CA" &&  UTname.split("-")[1] != "MX"))
		{
			return false;
		}
		else{
			return true;
		}
	},
    ///Calcula el titulo del aviso de forma autom?tica para Z1 y Z5
    //  AAC 07-11-2018
    onChangeDescripcion: function (entityForm) {
        var self = this;
        try {

            // entityForm.entity.properties.atos_descripcioncorta =null;
            if (entityForm.entity.properties.atos_clasedeavisoid != null && entityForm.entity.properties.atos_ubicaciontecnicaid != null) {
                var CAid = entityForm.entity.properties.atos_clasedeavisoid.id;
                var UTid = entityForm.entity.properties.atos_ubicaciontecnicaid.id;
                var UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
				
				if(self.EsUbicacionAmericana(UTname)){
					return;
				}
				

                var claseDeAviso = new MobileCRM.FetchXml.Entity("atos_clasedeaviso");
                claseDeAviso.addAttribute("atos_codigo");
                claseDeAviso.addAttribute("atos_name");
                claseDeAviso.addAttribute("atos_name_es");
                claseDeAviso.addAttribute("atos_name_en");
                var filter = new MobileCRM.FetchXml.Filter();
                filter.where("atos_clasedeavisoid", "eq", CAid);
                claseDeAviso.filter = filter;
                var fetch = new MobileCRM.FetchXml.Fetch(claseDeAviso);


                fetch.execute("Array", function (result) {

                    var codeTurbine = "";
                    var tmp = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName.split("-");
                    if (tmp.length > 5) {
                        codeTurbine = tmp[5] + "_";
                    }
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {

                            for (var i in result) {
                                var results = result[i]

                                if (result[i][0] == "Z1") {
                                    if (IdiomaUsuario == Idioma.ingles)
                                        entityForm.entity.properties.atos_descripcioncorta = "PEND_" + codeTurbine;
                                    else
                                        entityForm.entity.properties.atos_descripcioncorta = "PEND_" + codeTurbine;
									var dv = entityForm.getDetailView("General");
									dv.getItemByName("atos_avisoparada").isVisible = false;

                                }
                                else if (result[i][0] == "Z5") {
                                    if (IdiomaUsuario == Idioma.ingles)
                                        entityForm.entity.properties.atos_descripcioncorta = "FAILURE_" + codeTurbine;
                                    else
                                        entityForm.entity.properties.atos_descripcioncorta = "FALLO_" + codeTurbine;
									var dv = entityForm.getDetailView("General");
									dv.getItemByName("atos_avisoparada").isVisible = true;
                                }
                                else {
                                    entityForm.entity.properties.atos_descripcioncorta = null;
									var dv = entityForm.getDetailView("General");
									dv.getItemByName("atos_avisoparada").isVisible = false;
                                }
                            }

                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                }, function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 16--> " +  err);	
                },
                    null);

            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 17--> " +  err);	
        }
    },
	onChangeClaseAviso: function (entityForm) {
        var self = this;
        try {
            if (entityForm.entity.properties.atos_clasedeavisoid != null ) {
                var CAid = entityForm.entity.properties.atos_clasedeavisoid.id;
                    
                self.CalcularEstadoSistemaInicial(entityForm);
				
				var UTname = null;
				if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null) {
					UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
				}
				
                var claseDeAviso = new MobileCRM.FetchXml.Entity("atos_clasedeaviso");
                claseDeAviso.addAttribute("atos_codigo");
                claseDeAviso.addAttribute("atos_name");
                claseDeAviso.addAttribute("atos_name_es");
                claseDeAviso.addAttribute("atos_name_en");
                var filter = new MobileCRM.FetchXml.Filter();
                filter.where("atos_clasedeavisoid", "eq", CAid);
                claseDeAviso.filter = filter;
                var fetch = new MobileCRM.FetchXml.Fetch(claseDeAviso);


                fetch.execute("Array", function (result) {
                    
                    MobileCRM.UI.EntityForm.requestObject(
					
                        function (entityForm) {
							var dv = entityForm.getDetailView("General");
							 if (dv.getItemByName("atos_codigosid") ==null){
								 dv = entityForm.getDetailView("Cabecera");
							var dv3 = entityForm.getDetailView("General");
							 }
							 dv.getItemByName("atos_codigosid").isEnabled = false;
							if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null){
								var UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
								if(self.EsUbicacionAmericana(UTname)){
									
									 dv.getItemByName("atos_codigosid").isEnabled = true;
									 if (dv.getItemByName("atos_grupocodigoscatalogoid") !=null)
										dv.getItemByName("atos_grupocodigoscatalogoid").isEnabled = true;
									 dv3.getItemByName("atos_avisoparada").isVisible = true;
									//return;
								}
							}
							 
							 
							 
                            for (var i in result) {
                                var results = result[i]

                                if (result[i][0] == "Z1" ) {
									entityForm.entity.properties.atos_prioridadid = null;
									
									if (!self.EsUbicacionAmericana(UTname)){
										dv3.getItemByName("atos_avisoparada").isVisible = false;
									}
									else{
										dv3.getItemByName("atos_avisoparada").isVisible = true;
									}
                                }
                                else if (result[i][0] == "Z5") {
									
									dv3.getItemByName("atos_avisoparada").isVisible = true;
									if (entityForm.entity.isNew){
											MobileCRM.UI.EntityForm.requestObject(
											function (entityForm) {
												entityForm.entity.properties.atos_avisoparada = true;
												entityForm.entity.properties.atos_estadodespuesdeaviso = 3;
												},
												FS.CommonEDPR.onError,
												null
											);										
									}
									
									if (dv.getItemByName("atos_grupocodigoscatalogoid") !=null)
										dv.getItemByName("atos_grupocodigoscatalogoid").isEnabled = true;
								    dv.getItemByName("atos_codigosid").isEnabled = true;
									// obtengo la prioridad alta y lo asigno
									if (entityForm.entity.properties.atos_ubicaciontecnicaid != null){
										var prioridad = new MobileCRM.FetchXml.Entity("msdyn_priority");
										prioridad.addAttribute("msdyn_priorityid");
										prioridad.addAttribute("msdyn_levelofimportance");
										prioridad.addAttribute("atos_name_en");
										prioridad.addAttribute("atos_name_es");
										
										var UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
										var UTAmericana = self.EsUbicacionAmericana(UTname);
										var filter = new MobileCRM.FetchXml.Filter();
										filter.where("msdyn_levelofimportance", "eq", 1);
										if ( UTAmericana)
											filter.where("atos_codigo_en", "not-null");
										else 
											filter.where("atos_codigo_es", "not-null");
										
										prioridad.filter = filter;
										var fetch = new MobileCRM.FetchXml.Fetch(prioridad);
										
										fetch.execute("Array", function (resultPri) {
											
												if (IdiomaUsuario == Idioma.ingles)
													entityForm.entity.properties.atos_prioridadid =  new MobileCRM.Reference("msdyn_priority", resultPri[0][0], resultPri[0][2]);
												else 
													entityForm.entity.properties.atos_prioridadid =  new MobileCRM.Reference("msdyn_priority", resultPri[0][0], resultPri[0][3]);
											
											
											MobileCRM.UI.EntityForm.requestObject(
											function (entityForm) {
												if (IdiomaUsuario == Idioma.ingles)
													entityForm.entity.properties.atos_prioridadid =  new MobileCRM.Reference("msdyn_priority", resultPri[0][0], resultPri[0][2]);
												else 
													entityForm.entity.properties.atos_prioridadid =  new MobileCRM.Reference("msdyn_priority", resultPri[0][0], resultPri[0][3]);
												},
												FS.CommonEDPR.onError,
												null
											);
											
										}, function (err) {
											FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
											MobileCRM.UI.MessageBox.sayText("Error 18--> " +  err);	
										},
										null);
									
									}
									
                                }
                                else {
									entityForm.entity.properties.atos_prioridadid = null;
									var dv = entityForm.getDetailView("General");
									if (!self.EsUbicacionAmericana(UTname)){
									   dv3.getItemByName("atos_avisoparada").isVisible = false;
									}
									else{
									   dv3.getItemByName("atos_avisoparada").isVisible = true;
									}
                                }
                            }

                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                }, function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 19--> " +  err);	
                },
                    null);

            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 20--> " +  err);	
        }
    },
	CalcularEstadoSistemaInicial: function (entityForm) {
        var CAid = entityForm.entity.properties.atos_clasedeavisoid.id;
		
        var fetchXmlEstadoAvisoPerfil = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'> " +
										"  <entity name='atos_perfilestatus'> " +
										"    <attribute name='atos_codigo' /> " +
										"    <filter type='and'>" +
										"      <condition attribute='statecode' operator='eq' value='0' />" +
										"    </filter>" +
										"    <link-entity name='atos_perfilestatus_atos_clasedeaviso' from='atos_perfilestatusid' to='atos_perfilestatusid' visible='false' intersect='true'>" +
										"      <link-entity name='atos_clasedeaviso' from='atos_clasedeavisoid' to='atos_clasedeavisoid' alias='ao'>" +
										"        <filter type='and'>" +
										"          <condition attribute='atos_clasedeavisoid' operator='eq'  uitype='atos_clasedeaviso' value='{" + CAid + "}' />" +
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
                        for (var i in result) {
                           estadoSistemaInicialId = result[i][1];
                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						MobileCRM.UI.MessageBox.sayText("Error 21--> " +  err);	
                    },
                    entityForm
                );
		
		
		
    },
	
	verCampoParada: function (entityForm) {
        var self = this;
        try {
			var UTname = null;
			if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null) {
				UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
			}
			if (self.EsUbicacionAmericana(UTname)){
				var dv = entityForm.getDetailView("General");
				dv.getItemByName("atos_avisoparada").isVisible = true;
				return;
			}
            if (entityForm.entity.properties.atos_clasedeavisoid != null ) {
                var CAid = entityForm.entity.properties.atos_clasedeavisoid.id;


                var claseDeAviso = new MobileCRM.FetchXml.Entity("atos_clasedeaviso");
                claseDeAviso.addAttribute("atos_codigo");
                claseDeAviso.addAttribute("atos_name");
                claseDeAviso.addAttribute("atos_name_es");
                claseDeAviso.addAttribute("atos_name_en");
                var filter = new MobileCRM.FetchXml.Filter();
                filter.where("atos_clasedeavisoid", "eq", CAid);
                claseDeAviso.filter = filter;
                var fetch = new MobileCRM.FetchXml.Fetch(claseDeAviso);


                fetch.execute("Array", function (result) {
                    
                    MobileCRM.UI.EntityForm.requestObject(
					
                        function (entityForm) {

                            for (var i in result) {
                                var results = result[i]

                                if (result[i][0] == "Z1") {
									var dv = entityForm.getDetailView("General");
									dv.getItemByName("atos_avisoparada").isVisible = false;
                                }
                                else if (result[i][0] == "Z5") {
									var dv = entityForm.getDetailView("General");
									
									dv.getItemByName("atos_avisoparada").isVisible = true;
									// obtengo la prioridad alta y lo asigno
                                }
                                else {
									var dv = entityForm.getDetailView("General");
									dv.getItemByName("atos_avisoparada").isVisible = false;
                                }
                            }

                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                }, function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 22--> " +  err);	
                },
                    null);

            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 23--> " +  err);	
        }
    },
	
	
    ///Limpiar campos de mapeo UT     
    LimpiarCamposUT: function (entityForm) {
		var aviso = entityForm.entity;
        entityForm.entity.properties.atos_sociedadid = null;
        entityForm.entity.properties.atos_indicadorabcid = null;
        entityForm.entity.properties.atos_centroid = null;
        entityForm.entity.properties.atos_puestotrabajoprincipalid = null;
        entityForm.entity.properties.atos_centrodeplanificacinid = null;
        entityForm.entity.properties.atos_grupoplanificadorid = null;
		if (aviso.isNew) {
			// FECHA: 14/04/2020
			// AAC REDMINE: 21749 Controlar cambio de UT en avisos.
			// solo se limpia si la OT no ha sido creada des de despacho
			if (!CreadaDespacho){		
				entityForm.entity.properties.atos_grupocodigoscatalogoid = null;
				entityForm.entity.properties.atos_codigosid = null;
			}
		}
    },

    /// Bloquear campos de envio SAP
    ///DE MOMENTO NO EXISTE ESTE BLOQUE
    BloquearCamposSiEnviadoSAP: function (entityForm) {
        var self = this;
        try {
            var claseDeAviso = entityForm.entity.properties.atos_clasedeavisoid;
            if (claseDeAviso != null) {

                if (entityForm.entity.properties.atos_estadosintegracionsap != null) {
                    var estadoSincroSAP = entityForm.entity.properties.atos_estadosintegracionsap;
                    if (estadoSincroSAP == EstadoIntegracionSAP.SincronizadoConSAP) //Poner estado de enviado a sap cuando este definido 
                    {

                        var dv = entityForm.getDetailView("Cabecera");
                        dv.getItemByName("atos_clasedeavisoid").isEnabled = true;
                    }
                    else {
                        var dv = entityForm.getDetailView("Cabecera");
                        dv.getItemByName("atos_clasedeavisoid").isEnabled = true;

                    }
                }
            }
            else {
                if (entityForm.entity.properties.atos_estadosintegracionsap != null && entityForm.entity.properties.atos_name != null) {
                    var idMsjeError = "10175_006";
                    entityForm.entity.properties.atos_estadosintegracionsap = null;
                    FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
                }
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 24--> " +  err);	
        }
    },

    ///al crear un nuevo aviso "Form_Crear" 
    ///se a?adir? en "atos_estadousuario" 
    ///en primer el estado 
    onSaveEstadoUsuario: function (entityForm) {
        var self = this;
        try {
            // atos_clasedeavisoid
            var varFetchBuscar = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                " <entity name='atos_estatusdeaviso'>                    " +
                "   <attribute name='atos_codigo'/>                        " +
                "       <order descending='false' attribute='atos_name'/>      " +
                "       <filter type='and'>                                 " +
                "           <condition attribute='atos_esinicial' value='1' operator='eq'/> " +
                "           <condition attribute='atos_tipoestado' value='2' operator='eq'/> " +
                "       </filter>  " +
                "       <link-entity name='atos_perfilestatus' alias='ac' link-type='inner' to='atos_perfilestatusid' from='atos_perfilestatusid'> " +
                "           <attribute name='atos_objeto'/>                        " +
                "           <attribute name='statecode'/>                          " +
                "       <filter type='and'>                                    " +
                "           <condition attribute='atos_objeto' value='1' operator='eq'  />   " +
                "           <condition attribute='statecode'   value='0' operator='eq'  />   " +
                "       </filter>                                              " +
                "   </link-entity>                                         " +
                " </entity>                                       " +
                "</fetch>";


            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {
                        var props = result[i];
                        entityForm.entity.properties.atos_estadousuario = result[i][0];

                    }

                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            entityForm.entity.properties.atos_estadousuario = result[i][0];
                        },
                        FS.CommonEDPR.onError,
                        null
                    );

                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 25--> " +  err);	
                },
                entityForm
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 26--> " +  err);	
        }
    },

    /// Inicializa los campos del formulario y del proceso con valores por defecto
    setCamposProcceso: function (entityForm) {
        var self = this;
        try {
            if (!entityForm.entity.isNew) {
                var status = entityForm.entity.properties.statuscode;
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 27--> " +  err);	
        }
    },

    ComprobarDescripcionUT: function (entityForm) {
        var self = this;
        if (entityForm.entity.properties.atos_ubicaciontecnicaid != null) {
            var ubicacionId = entityForm.entity.properties.atos_ubicaciontecnicaid.id;
            var ubicacion = new MobileCRM.FetchXml.Entity("account");
            ubicacion.addAttribute("atos_denominacion");
            var filter = new MobileCRM.FetchXml.Filter();
            filter.where("accountid", "eq", ubicacionId);
            ubicacion.filter = filter;
            var fetch = new MobileCRM.FetchXml.Fetch(ubicacion);

            var props = entityForm;
            var aviso = entityForm.entity;

            fetch.execute("Array", function (result) {

                for (var i in result) {
                    var results = result[i];
					if (result[i][0]!=null){
						entityForm.entity.properties.atos_descripcionut = result[i][0].split(",")[0];
					}
                }

                MobileCRM.UI.EntityForm.requestObject(
                    function (entityForm) {
						if (result[i][0]!=null){
							entityForm.entity.properties.atos_descripcionut = result[i][0];
						}
                    },
                    FS.CommonEDPR.onError,
                    null
                );



            }, function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				MobileCRM.UI.MessageBox.sayText("Error 28-> " +  err);	
            },
                null);

        }
    },

    /// <summary> Obtiene la regi?n a partir del campo pais de la cuenta del usuario</summary>
    ObtenerRegionUsuario: function () {
        try {
            var self = this;

            MobileCRM.Configuration.requestObject(
                function (config) {
                    if (config.isOnline) {
                        var settings = config.settings;
                        var userId = config.settings.systemUserId;

                        var usuario = new MobileCRM.FetchXml.Entity("systemuser");
                        usuario.addAttribute("address1_country");
                        var filter = new MobileCRM.FetchXml.Filter();
                        filter.where("systemuserid", "eq", userId);
                        usuario.filter = filter;
                        var fetch = new MobileCRM.FetchXml.Fetch(usuario);


                        fetch.execute("Array", function (result) {

                            for (var i in result) {
                                var results = result[i];
                                region = result[i][0];
                            }

                        }, function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
							MobileCRM.UI.MessageBox.sayText("Error 29--> " +  err);	
                        },
                            null);



                    }
                    return false;
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 30--> " +  err);	
                },
                null
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 31--> " +  err);	
        }
    },
     /// se encarga de crear los estados iniciales del aviso.
    onSaveNewAviso: function (entity,esClonacion,entityForm) {
        var self = this;
	  var aviso = entity;
	 
	;	 
        try {
            if (esNuevo || esClonacion) {
				var postSuspend = entityForm.suspendPostSave();
  var fetchXmlEstadoAvisoPerfil = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
            " <entity name='atos_estatusdeaviso'> " +
            " <attribute name='atos_name'/>" +
            " <attribute name='atos_estatusdeavisoid'/>" +
            " <attribute name='atos_tipoestado'/>" +
            " <attribute name='atos_numeroclasificacionsuperior'/>" +
            " <attribute name='atos_numeroclasificacioninferior'/>" +
            " <attribute name='atos_numeroclasificacion'/> " +
            " <attribute name='atos_codigo_en'/>" +
            " <attribute name='atos_codigo_es'/> " +
            " <attribute name='atos_perfilestatusid'/>" +
			" <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_es'/>" +
            " <attribute name='statuscode'/>" +
            " <attribute name='ownerid'/>" +
            " <attribute name='atos_prioridad'/>" +
            " <attribute name='atos_posicion'/>" +
            " <attribute name='modifiedonbehalfby'/>" +
            " <attribute name='modifiedby'/> " +
            " <attribute name='atos_identificador'/>" +
            " <attribute name='modifiedon'/>" +
            " <attribute name='overriddencreatedon'/>" +
            " <attribute name='createdon'/>" +
            " <attribute name='statecode'/>" +
            " <attribute name='atos_esinicial'/>" +
            " <link-entity name='atos_perfilestatus' alias='Perfil' link-type='inner' to='atos_perfilestatusid' from='atos_perfilestatusid' > " +
            "       <attribute name='atos_objeto' />" +
            "       <attribute name='statecode' />" +
            "       <attribute name='atos_codigo' />" +
            "         <filter type='and'>" +
            "           <condition attribute='atos_codigo' value='ZPM001' operator='eq'/>" +
            "          </filter>" +
            " </link-entity> " +
            " <order descending='false' attribute='atos_numeroclasificacion'/>" +
            " <order descending='false' attribute='atos_codigo_en'/>" +
            " <filter type='and'>" +
            "         <condition attribute='atos_tipoestado' value='2' operator='eq'/>" +
            "  </filter>" +
            " </entity>" +
            "</fetch>";

        // cuando se obtiene los estados se cargan
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEstadoAvisoPerfil,
            function (result) {
				for (var i in result) {
					// comprobamso que n? clasificacion no sea nula y este entre los estados 1 y 5
					if (result[i][5] != "undefined" &&
						result[i][5] != "null" &&
						result[i][5] > 0) {
						var varLong = result[i][5].toString().length;									
						var varNumeroclasificacion;
						var varClasificaciOn = result[i][5];// atos_numeroclasificacion
						var varEstatusdeAvisoid = result[i][1]; //atos_estatusdeavisoid
						// siempre tiene 2 digitos el n?mero de calsificacion si es 1 se pone 01
						if (varLong === 1) {
							varNumeroclasificacion = "0" + varClasificaciOn;
						}
						else {
							varNumeroclasificacion = varClasificaciOn;
						}
	
	
						if (varNumeroclasificacion=="01"){
							estadoUsuarioInicialId = varEstatusdeAvisoid;
						}
					}
				}
				// creamos los estados iniciales
				esNuevo = false;
				// Estatus de usuario
				var newLogEstadoUsuario = new MobileCRM.DynamicEntity.createNew("atos_logestado");
				var props = newLogEstadoUsuario.properties;
				props.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
				props.atos_identificador = "E0002";
				// en ingles NAPR
				props.atos_name = "EAPR";
				props.atos_numerocambio = 1;
				props.atos_objeto = 1;
				props.atos_indicadorcambio = 1;
				props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", estadoUsuarioInicialId, "");
				
				newLogEstadoUsuario.save(
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
				
				// A PARTIR DE AHORA SE HARA DESDE PLUGIN TODO LO QUE TIENE QUE VER CON ESTADO SISTEMA
				//	// estatus de sistema
				//	var newLogEstadoSistema = new MobileCRM.DynamicEntity.createNew("atos_logestado");
				//	var props = newLogEstadoUsuario.properties;
				//	props.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
				//	props.atos_identificador = "I0068";
				//	// en ingles OSNC
				//	props.atos_name = "MEAB";
				//	props.atos_numerocambio = 1;
				//	props.atos_objeto = 1;
				//	props.atos_indicadorcambio = 1;
				//	props.atos_estadoavisoid = new MobileCRM.Reference("atos_estatusdeaviso", estadoSistemaInicialId, "");
				//	
				//
				//	newLogEstadoUsuario.save(
				//		function (err) {
				//			if (err) {
				//				//MobileCRM.UI.MessageBox.sayText(err);
				//			}
				//			else {
				//				
				//			}
				//		}
				//	);
				//			
				
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 37--> " +  err);	
				postSuspend.resumePostSave();
            },
            null
        );







									
     
				if (!esClonacion) {
				  //**********************************************************************************************************  	
				  // creamos los catalogos de inicio 	
				  //**********************************************************************************************************
				  //CATALOGO A
					var newCatalogoA = new MobileCRM.DynamicEntity.createNew("atos_catalogoaviso");
					var propsCatalogoA = newCatalogoA.properties;
					propsCatalogoA.atos_name = "A";
					propsCatalogoA.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
					propsCatalogoA.atos_catalogoid = new MobileCRM.Reference("atos_catalog", catalogoAid, "");
					
					newCatalogoA.save(
						function (err) {
							if (err) {
								//MobileCRM.UI.MessageBox.sayText(err);
							}
							else {

							}
						}
					);
					//CATALOGO B
					var newCatalogoB = new MobileCRM.DynamicEntity.createNew("atos_catalogoaviso");
					var propsCatalogoB = newCatalogoB.properties;
					propsCatalogoB.atos_name = "B";
					propsCatalogoB.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
					propsCatalogoB.atos_catalogoid = new MobileCRM.Reference("atos_catalog", catalogoBid, "");
					
					newCatalogoB.save(
						function (err) {
							if (err) {
								//MobileCRM.UI.MessageBox.sayText(err);
							}
							else {

							}
						}
					);
					//CATALOGO 5
					var newCatalogo5 = new MobileCRM.DynamicEntity.createNew("atos_catalogoaviso");
					var propsCatalogo5 = newCatalogo5.properties;
					propsCatalogo5.atos_name = "5";
					propsCatalogo5.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
					propsCatalogo5.atos_catalogoid = new MobileCRM.Reference("atos_catalog", catalogo5id, "");
					
					newCatalogo5.save(
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
			MobileCRM.UI.MessageBox.sayText("Error 32--> " +  err);	
        }
    },
    /// <summary>Crea una copia del aviso que se recibe por par?metro, copiando los campos definidos en la Acci?n
    /// atos_clonaraviso (Acci?n de copia de registro de aviso) </summary>
    /// <param name="idAviso">guid del aviso</param>   
    ClonarAviso: function (entityForm) {
		contParte =0;
		arrayParteObjeto = [];
		if (entityForm== null)
			entityForm = formulario;
		
        var self = this;
        try {
            var idAviso;
            var aviso = entityForm.entity;

            var popup;
            if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box
                popup = new MobileCRM.UI.MessageBox("do you want to clone this/these notifications?");
                popup.items = ["Yes", "No"];
            }
            else {
                popup = new MobileCRM.UI.MessageBox("¿Desea Clonar este/estos aviso/s?");
                popup.items = ["Si", "No"];

            }

            popup.multiLine = true;
            popup.show(
                function (button) {
                    if (button == "Yes" || button == "Si") {
						
					var numElemento = 1;
					var numTotalElementos =  statusInsertarClonacion.length ;						
					if (numTotalElementos>0){
						var textoCargando ="";
						 // ponemos el idioma al botn de guardar
                        if (IdiomaUsuario == Idioma.ingles)
                             textoCargando = "Loading...";
                        else
                             textoCargando = "Cargando...";
						
						wait = MobileCRM.UI.EntityForm.showPleaseWait(textoCargando);
					}
					statusInsertarClonacion.forEach( function(valor, indice, array) {  
							if( valor.trim()!="") {
								
								var newAviso = new MobileCRM.DynamicEntity.createNew("atos_aviso");
								var props = newAviso.properties;
								var esZ5 = false;
								if (aviso.properties.atos_clasedeavisoid.primaryName.indexOf("Z5")>-1)
									esZ5 = true;
								props.atos_clasedeavisoid = aviso.properties.atos_clasedeavisoid;
								props.atos_descripcioncorta = aviso.properties.atos_descripcioncorta;
								props.atos_prioridadid = aviso.properties.atos_prioridadid;
								props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", valor, "");  
								
								props.atos_fechanotificacion = new Date();
								if (aviso.properties.atos_fechainicioaveria != null) {
									
									var UTname = "";
									if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null){
										UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName ;
									}

									if ((self.EsUbicacionAmericana(UTname) && (esZ5 || props.atos_avisoparada)) ||
										(!self.EsUbicacionAmericana(UTname))) {
											props.atos_fechainicioaveria = new Date();
									}
								}
								props.atos_fechainicioaviso = new Date();
								
								props.atos_descripcionut = aviso.properties.atos_descripcionut;
								//props.atos_fechafinaveria = aviso.properties.atos_fechafinaveria;
								props.atos_equipoid = aviso.properties.atos_equipoid;
								props.atos_grupocodigoscatalogoid = aviso.properties.atos_grupocodigoscatalogoid;
								props.atos_codigosid = aviso.properties.atos_codigosid;
								if (esZ5)
									props.atos_avisoparada = true;
								else 
									props.atos_avisoparada = aviso.properties.atos_avisoparada;
								if (esZ5)
									props.atos_estadodespuesdeaviso = 3;
								else 
									props.atos_estadodespuesdeaviso = aviso.properties.atos_estadodespuesdeaviso;
								//props.atos_ordendetrabajoid = aviso.properties.atos_ordendetrabajoid;
								//props.atos_tieneordenasociada = aviso.properties.atos_tieneordenasociada;
								//props.atos_ordenasignada = aviso.properties.atos_ordenasignada;
								props.atos_esprincipal = aviso.properties.atos_esprincipal;
								props.atos_descripcionlarga = aviso.properties.atos_descripcionlarga;
								
								//props.atos_estadousuario = aviso.properties.atos_estadousuarioes + "@-@" + atos_estadousuarioen ;
								//props.atos_estadousuarioes = aviso.properties.atos_estadousuarioes;
								//props.atos_estadousuarioen = aviso.properties.atos_estadousuarioen;
								
								props.atos_grupocodigoscatalogoid = aviso.properties.atos_grupocodigoscatalogoid;
								props.atos_grupoplanificadorid = aviso.properties.atos_grupoplanificadorid;
								props.atos_puestotrabajoprincipalid = aviso.properties.atos_puestotrabajoprincipalid;
								props.atos_sociedadid = aviso.properties.atos_sociedadid;
								props.atos_centroid = aviso.properties.atos_centroid;
								props.atos_centrodeplanificacinid = aviso.properties.atos_centrodeplanificacinid;
								props.atos_origenclonacion = aviso.properties.atos_name;
								props.atos_esclonacion = true;
								// decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
								props.atos_origen = 300000002;

								newAviso.save(
									function (err) {
										if (err) {
											MobileCRM.UI.MessageBox.sayText(err);
											wait.close();
										}
										else {
											
											// actualizo el estadode usuario que ha sifo pisado en la creacion
											var updateAviso = new MobileCRM.DynamicEntity.createNew("atos_aviso");
											var propsUpd = updateAviso.properties;
											updateAviso.id = this.id;
											updateAviso.isNew =false;
											self.onSaveNewAviso(this,true,entityForm);
											updateAviso.save(
											function (err) {
												if (err) {
													MobileCRM.UI.MessageBox.sayText(err);
													wait.close();
												}
												else {
													
													
													
													// creamos las relaciones con sus Anexos
													//ELIMINADA POR EL CLIENTE
													//FS.Aviso.CrearAdjuntosDeAvisoClonado(entityForm, this.id);
													// creamos las relaciones con sus tiempos de inactividad									
													FS.Aviso.CrearTiempoInactividadDeAvisoClonado(entityForm, this.id,numElemento, numTotalElementos );
													// creamos las relaciones con sus Catalogos 
													FS.Aviso.CrearCatalogosAvisoClonado(entityForm, this.id,numElemento, numTotalElementos, "B");
													// creamos el historico de usuarios con el que tiene este aviso , pero antes borramos
													//ELIMNADO POR EL CLIENTE
													// el que genera automaticamente en la creacion 
													//FS.Aviso.BorrarHistoricoEstatusUsuarioDeAvisoClonado(entityForm , this.id);
													numElemento = numElemento + 1;
													
													
												}
											}
											);
										}
									}
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
			MobileCRM.UI.MessageBox.sayText("Error 33--> " +  err);	
        }
    },
    /// <summary>Crea una copia del aviso que se recibe por par?metro, copiando los campos definidos en la Acci?n
    /// atos_clonaraviso (Acci?n de copia de registro de aviso) </summary>
    /// <param name="idAviso">guid del aviso</param>   
    DeleteFlag: function (entityForm) {
        var self = this;
        try {
            var idAviso;
            var aviso = entityForm.entity;
            //23515:AAC:2022-01-24:Mejorar el formularios de RESCO USA para evitar errores con SAP
            if (aviso.properties.atos_codigosap == null) {
                if (IdiomaUsuario == Idioma.ingles) {
                    MobileCRM.UI.MessageBox.sayText("You can not update delete flag in Notification without SAP code.");
                }
                else {
                    MobileCRM.UI.MessageBox.sayText("No puedes actualizar el flag de borrado de un aviso sin código SAP.");
                }
                return;
            }


			
            if (aviso.properties.statecode == 1) {
                if (IdiomaUsuario == Idioma.ingles) {
                    MobileCRM.UI.MessageBox.sayText("You can not update delete flag in inactive notification.");
                }
                else {
                    MobileCRM.UI.MessageBox.sayText("No puedes actualizar el flag de borrado de un aviso inactivo.");
                }
                return;
            }
			
			  if (aviso.properties.atos_ordendetrabajoid != null) {
			    FS.CommonEDPR.GetErrorCollectionByCode('10175_033', entityForm);
                return;
            }
			
			
            var popup;
            if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box
                popup = new MobileCRM.UI.MessageBox("do you want update the delete flag?");
                popup.items = ["Yes", "No"];
            }
            else {
                popup = new MobileCRM.UI.MessageBox("¿Desea actualizar el indicador de borrado?");
                popup.items = ["Si", "No"];

            }

            /// If title is too long set the 'multi-line' to true
            popup.multiLine = true;
            popup.show(
                function (button) {
                    if (button == "Yes" || button == "Si") {

                        MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                                entityForm.entity.properties.atos_indicadorborrado = 1;
                                entityForm.entity.properties.atos_peticionborrado = 1;

								MobileCRM.UI.EntityForm.saveAndClose();		
                                //entityForm.entity.save(
                                //    function (err) {
                                //        if (err) {
                                //            MobileCRM.UI.MessageBox.sayText(err);
                                //        }
                                //        else {
                                //        }
                                //    }
                                //);
                            },
                            FS.CommonEDPR.onError,
                            null
                        );
                    }
                    else {
                        return;
                    }
                }
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			MobileCRM.UI.MessageBox.sayText("Error 34--> " +  err);	

        }
    },
    UpdateNotification: function (entityForm) {
        var turbineEntranceAndExit = entityForm.entity.properties.edprdyn_turbineentranceandexit;
        if (turbineEntranceAndExit !== true) {
            return;
        }

        var id = entityForm.entity.id;
        var updAviso = new MobileCRM.DynamicEntity("atos_aviso", id);
        var props = updAviso.properties;
        props.edprdyn_turbineentranceandexit = false;

        updAviso.save(
            function (error) {
                if (error) {
                    MobileCRM.bridge.alert("An error occurred: " + error);
                }
                else {
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                            // The name of the tab, and true to show or false to hide
                        },
                        MobileCRM.bridge.alert,
                        null
                    );
                }
            }//function
        );
    },
	CrearOT: function (entityForm) {
        var self = this;
        try {
            if (entityForm.entity.properties.atos_ordendetrabajoid != null) {
                if (IdiomaUsuario === Idioma.ingles) {
                    MobileCRM.UI.MessageBox.sayText(" Notification has assign a work order.");
                }
                else {
                    MobileCRM.UI.MessageBox.sayText("El aviso tiene asignado ya una orden de trabajo.");
                }
                return;
            }
            //validate if it's in Europe or NA
var checkListCode = entityForm.entity.properties.edprdyn_checklistcode;
            
            var UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
            var turbineEntranceAndExit;
            var isEurope = !self.EsUbicacionAmericana(UTname);
            if (isEurope) {
                turbineEntranceAndExit = entityForm.entity.properties.edprdyn_turbineentranceandexit;
                //self.UpdateNotification(entityForm);
            }
            else {
                turbineEntranceAndExit = false;
            }

            MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {                    
                    var aviso = entityForm.entity;
                    var avisoId = entityForm.entity.id;
                    var avisoName = entityForm.entity.primaryName;
                    var new_aviso = new MobileCRM.Reference(entityForm.entity.entityName, avisoId, avisoName);                    
                    var target = new MobileCRM.Reference(entityForm.entity.entityName, entityForm.entity.entityName.id);
                    var relationShip = new MobileCRM.Relationship(entityForm.entity.entityName, target, null, null);

                    MobileCRM.UI.FormManager.showNewDialog(
                        "msdyn_workorder",
                        relationShip, {
                            "@initialize": {
                                atos_indicadordeentradaaturbina: turbineEntranceAndExit,
								edprdyn_checklistcode: checkListCode,
                            },
                            iFrameOptions: {
                                aviso: new_aviso,
                                msdyn_name: entityForm.entity.entityName,                                
                            }
                        }
                    );
                    // cerramos y lo guardamos
                    MobileCRM.UI.EntityForm.saveAndClose();                    
                },
                MobileCRM.bridge.alert
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
            MobileCRM.UI.MessageBox.sayText("Error 35--> " + err);
        }
    },
    /// se encarga de cargar las ubicaciones  que se pueden clonar();
	CargarUbicacionesClonacion: function (entityForm, pagina) {
		var self = this;
		var aviso = entityForm.entity;
		var ubicacion = null; 
		var turbina;
		
		if (entityForm.entity.properties.atos_ubicaciontecnicaid != null) {
             ubicacion = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
		}
			 
		var numComponentes = ubicacion.split("-").length;
		if (numComponentes> 4) 
		turbina = ubicacion.split("-")[4];
		
		var ubicacionComodin;
		if (numComponentes> 4)
		{
			var ubicacionComodin = ubicacion.replace(turbina, turbina.substring(0, 1) +  "%") ;
		}
		else{
			ubicacionComodin= "XXXXXXXXX";
		}	
			 
		fetchXmlRegistro = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'  page='"+ pagina +"' paging-cookie='' > " +
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
						"</fetch>" ;

		
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlRegistro,
            function (result) {
				if (pagina==1){
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
					var descripcion="";
					   if (IdiomaUsuario == Idioma.ingles) {
						  descripcion = result[i][2];
					   }
					   else {
						  descripcion = result[i][3];
					   }
					   if (numComponentes == numComponentesTmp ) {
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
				if (result.length == 500){
					self.CargarUbicacionesClonacion(entityForm, pagina + 1 );
				}
			},
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 36--> " +  err);	
            },
            null
        );
		
		
	},
		/// cargamos el dato de estado de usuario inicial para la clonacion
	 CargarEstadoUsuarioInicial: function (entityForm) {
        var self = this;
        var aviso = entityForm.entity;
        var fetchXmlEstadoAvisoPerfil = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
            " <entity name='atos_estatusdeaviso'> " +
            " <attribute name='atos_name'/>" +
            " <attribute name='atos_estatusdeavisoid'/>" +
            " <attribute name='atos_tipoestado'/>" +
            " <attribute name='atos_numeroclasificacionsuperior'/>" +
            " <attribute name='atos_numeroclasificacioninferior'/>" +
            " <attribute name='atos_numeroclasificacion'/> " +
            " <attribute name='atos_codigo_en'/>" +
            " <attribute name='atos_codigo_es'/> " +
            " <attribute name='atos_perfilestatusid'/>" +
			" <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_es'/>" +
            " <attribute name='statuscode'/>" +
            " <attribute name='ownerid'/>" +
            " <attribute name='atos_prioridad'/>" +
            " <attribute name='atos_posicion'/>" +
            " <attribute name='modifiedonbehalfby'/>" +
            " <attribute name='modifiedby'/> " +
            " <attribute name='atos_identificador'/>" +
            " <attribute name='modifiedon'/>" +
            " <attribute name='overriddencreatedon'/>" +
            " <attribute name='createdon'/>" +
            " <attribute name='statecode'/>" +
            " <attribute name='atos_esinicial'/>" +
            " <link-entity name='atos_perfilestatus' alias='Perfil' link-type='inner' to='atos_perfilestatusid' from='atos_perfilestatusid' > " +
            "       <attribute name='atos_objeto' />" +
            "       <attribute name='statecode' />" +
            "       <attribute name='atos_codigo' />" +
            "         <filter type='and'>" +
            "           <condition attribute='atos_codigo' value='ZPM001' operator='eq'/>" +
            "          </filter>" +
            " </link-entity> " +
            " <order descending='false' attribute='atos_numeroclasificacion'/>" +
            " <order descending='false' attribute='atos_codigo_en'/>" +
            " <filter type='and'>" +
            "         <condition attribute='atos_tipoestado' value='2' operator='eq'/>" +
            "  </filter>" +
            " </entity>" +
            "</fetch>";

        // cuando se obtiene los estados se cargan
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEstadoAvisoPerfil,
            function (result) {
				for (var i in result) {
					// comprobamso que n? clasificacion no sea nula y este entre los estados 1 y 5
					if (result[i][5] != "undefined" &&
						result[i][5] != "null" &&
						result[i][5] > 0) {
						var varLong = result[i][5].toString().length;									
						var varNumeroclasificacion;
						var varClasificaciOn = result[i][5];// atos_numeroclasificacion
						var varEstatusdeAvisoid = result[i][1]; //atos_estatusdeavisoid
						// siempre tiene 2 digitos el n?mero de calsificacion si es 1 se pone 01
						if (varLong === 1) {
							varNumeroclasificacion = "0" + varClasificaciOn;
						}
						else {
							varNumeroclasificacion = varClasificaciOn;
						}
	
	
						if (varNumeroclasificacion=="01"){
							estadoUsuarioInicialId = varEstatusdeAvisoid;
						}
					}
				}
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 37--> " +  err);	
            },
            null
        );

    },
	/// Se encarga de cambiar el estado del usuario y meter un log hisdtorico de los cambios realizados en este campo 
    CargarEstadosUsuario: function (entityForm) {
        var self = this;
        var aviso = entityForm.entity;
        var fetchXmlEstadoAvisoPerfil = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
            " <entity name='atos_estatusdeaviso'> " +
            " <attribute name='atos_name'/>" +
            " <attribute name='atos_estatusdeavisoid'/>" +
            " <attribute name='atos_tipoestado'/>" +
            " <attribute name='atos_numeroclasificacionsuperior'/>" +
            " <attribute name='atos_numeroclasificacioninferior'/>" +
            " <attribute name='atos_numeroclasificacion'/> " +
            " <attribute name='atos_codigo_en'/>" +
            " <attribute name='atos_codigo_es'/> " +
            " <attribute name='atos_perfilestatusid'/>" +
			" <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_en'/>" +
            " <attribute name='atos_name_es'/>" +
            " <attribute name='statuscode'/>" +
            " <attribute name='ownerid'/>" +
            " <attribute name='atos_prioridad'/>" +
            " <attribute name='atos_posicion'/>" +
            " <attribute name='modifiedonbehalfby'/>" +
            " <attribute name='modifiedby'/> " +
            " <attribute name='atos_identificador'/>" +
            " <attribute name='modifiedon'/>" +
            " <attribute name='overriddencreatedon'/>" +
            " <attribute name='createdon'/>" +
            " <attribute name='statecode'/>" +
            " <attribute name='atos_esinicial'/>" +
            " <link-entity name='atos_perfilestatus' alias='Perfil' link-type='inner' to='atos_perfilestatusid' from='atos_perfilestatusid' > " +
            "       <attribute name='atos_objeto' />" +
            "       <attribute name='statecode' />" +
            "       <attribute name='atos_codigo' />" +
            "         <filter type='and'>" +
            "           <condition attribute='atos_codigo' value='ZPM001' operator='eq'/>" +
            "          </filter>" +
            " </link-entity> " +
            " <order descending='false' attribute='atos_numeroclasificacion'/>" +
            " <order descending='false' attribute='atos_codigo_en'/>" +
            " <filter type='and'>" +
            "         <condition attribute='atos_tipoestado' value='2' operator='eq'/>" +
            "  </filter>" +
            " </entity>" +
            "</fetch>";

        // cuando se obtiene los estados se cargan
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEstadoAvisoPerfil,
            function (result) {

                var fetchXmlLogAviso = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
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
                    "         <condition attribute='atos_avisoid' value='" + entityForm.entity.id + "' operator='eq'/>" +
                    "     </filter>" +
                    "     </entity>" +
                    "     </fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlLogAviso,
                    function (resultAviso) {
                        // guardo el resultado en una variable global para tenerlo en cuenta la guardar;
                        historicoEstadoUsuario = resultAviso;

						if (resultAviso.length == 0 & numIntentos <5)
						{
							FS.Aviso.CargarEstadosUsuario(entityForm);
							numIntentos = numIntentos +1;
						}
						else 
						{
							numIntentos = 0;
						}
						
                        // ponemos el idioma al botn de guardar
                        if (IdiomaUsuario == Idioma.ingles)
                            $("#btnSave")[0].innerText = "Save";
                        else
                            $("#btnSave")[0].innerText = "Guardar";

						// desasociamos el evento para que no salte mas deuna vez
						$("#btnSave").unbind('click');
                        // asociamos el evento de guardar 
                        $("#btnSave").click(function () {
                            FS.Aviso.CambiarEstadoUsuario(formulario);
                        });

                        // limpiamos la tabla de  num clasificados
                        $("#tblNumClasificados").empty();
                        varFila = " <tr> id='cabecera' " +
                            "     <th>Sel</th>  " +
                            "     <th>N?</th>   " +
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
                            // comprobamso que n? clasificacion no sea nula y este entre los estados 1 y 5
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
                                // siempre tiene 2 digitos el n?mero de calsificacion si es 1 se pone 01
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
								if (varNumeroclasificacion=="01"){
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
								var disabled="";
								if (varCodigoParaTabla.toUpperCase() == "COPE"){
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
						 MobileCRM.UI.MessageBox.sayText("Error 38--> " +  err);	
                    },
                    null
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 39--> " +  err);	
            },
            null
        );

    },
    /// Se encarga de cambiar el estado del usuario y meter un log hisdtorico de los cambios realizados en este campo 
    CambiarEstadoUsuario: function (entityForm) {
        var aviso = entityForm.entity;

        // recogo el elemento Clasificado
        var idioma = IdiomaUsuario;
        var tipoRegistro = "AVISO";
        var modificado = false;

        // insertamos los nuevos registros creados 
        statusInsertar.forEach(function (valor, indice, array) {
            if (valor.trim() != "") {
                modificado = true
                FS.Aviso.insertarLogEstado(valor, indice, array, aviso, tipoRegistro, 2);
            }
        });

        // insertamos los nuevos registros borrados
        statusBorrar.forEach(function (valor, indice, array) {
            if (valor.trim() != "") {
                modificado = true
                FS.Aviso.insertarLogEstado(valor, indice, array, aviso, tipoRegistro, 1);
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
								setTimeout(function(){
								FS.Aviso.CargarEstadosUsuario(entityForm);
							}, 2000);
                              

                                if (IdiomaUsuario == Idioma.ingles)
                                    MobileCRM.UI.MessageBox.sayText("User status has changed to " + textoStatusUsuario + " .");
                                else
                                    MobileCRM.UI.MessageBox.sayText("El estado usuario del aviso ha cambiado a " + textoStatusUsuario + " .");
                            }
                        }
                    );
                },
                FS.CommonEDPR.onError,
                null
            );
        }
    },
    yaExiste: function (ClasificaSin, NuevoCodigo) {
        var varRetorno = 0;
        ClasificaSin.split('_').forEach(function (item) {
            if (item === NuevoCodigo) {
                varRetorno = 1;
            }
        });
        return varRetorno;
    },
	
	obtenerPosicionAsciada : function (tipoEntidad, catalogoId ,catalogoNombre,avisoId , array) {
	
		for (h = 0; h < array.length; h++) {
			if (array[h].IdentificadorParteObjeto == catalogoId && array[h].idParteObjeto == avisoId) {
				return  new MobileCRM.Reference(tipoEntidad, array[h].idCatalogoAviso , catalogoNombre);
			}
        }

		return null;
	},
	
    // clona los catalogos que tiene asociado un aviso  para el aviso que va a ser clonado;
    CrearCatalogosAvisoClonado: function (entityForm, guidAvisoClonado ,numElemento,numTotalElementos, tipo ) {
        try {
            var guidAvisoOrigen = entityForm.entity.id;
            var guidAvisoClonado = guidAvisoClonado;
			var varFetchBuscar ="";
		
			// AAC/20/08/2020 quitamos los catalogos cuchos cidodigos tenga el marcador de borrado = Si
			varFetchBuscar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
            "<entity name='atos_catalogoaviso'>" +
            "<attribute name='atos_catalogoavisoid' />" +
            "<attribute name='atos_name' />" +
            "<attribute name='atos_posicionasociadaid' />" +
            "<attribute name='atos_grcodigosid' />" +
            "<attribute name='atos_codigoid' />" +
            "<attribute name='atos_catalogoid' />" +
            "<attribute name='atos_descripcion' />" +
            "<attribute name='atos_dao' />" +
            "<attribute name='atos_avisoid' />" +
            "<attribute name='atos_grupodecodigosdedaosid' />" +
			"<attribute name='atos_catalogodao' />" +
            "<order attribute='atos_name' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_avisoid' operator='eq' value='" + guidAvisoOrigen + "' />" ;
			if (tipo =="B" ){
			 varFetchBuscar = varFetchBuscar + "<condition attribute='atos_dao' operator='not-null'/>" ;	
			}
			else {
			 varFetchBuscar = varFetchBuscar + "<condition attribute='atos_dao' operator='null'  />" ;	
			}
            varFetchBuscar = varFetchBuscar + "</filter>" +
            "<link-entity name='atos_codigos' alias='ac' link-type='inner' to='atos_codigoid' from='atos_codigosid' >" +
            "<filter type='and' >" +
            "<condition attribute='atos_indicadordeborrado' value='1' operator='ne' />" +
            "</filter>" +
            "</link-entity>" +
            "</entity>" +
            "</fetch>";


            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {
                        var newCatalogoAviso = new MobileCRM.DynamicEntity.createNew("atos_catalogoaviso");
                        var props = newCatalogoAviso.properties;
                        if (result[i][1] != null)
                            props.atos_name = result[i][1];
                        if (result[i][2] != null)
                            props.atos_posicionasociadaid = FS.Aviso.obtenerPosicionAsciada(result[i][2].entityName, result[i][2].id, result[i][2].primaryName,guidAvisoOrigen,arrayParteObjeto );
                        if (result[i][3] != null)
                            props.atos_grcodigosid = new MobileCRM.Reference(result[i][3].entityName, result[i][3].id, result[i][3].primaryName);
                        if (result[i][4] != null)
                            props.atos_codigoid = new MobileCRM.Reference(result[i][4].entityName, result[i][4].id, result[i][4].primaryName);
                        if (result[i][5] != null)
                            props.atos_catalogoid = new MobileCRM.Reference(result[i][5].entityName, result[i][5].id, result[i][5].primaryName);
                        if (result[i][6] != null)
                            props.atos_descripcion = result[i][6];
                        if (result[i][7] != null)
                            props.atos_dao = result[i][7];
                        props.atos_avisoid = new MobileCRM.Reference(entityForm.entity.entityName, guidAvisoClonado, "");
                        if (result[i][9] != null)
                            props.atos_grupodecodigosdedaosid = new MobileCRM.Reference(result[i][9].entityName, result[i][9].id, result[i][9].primaryName);
						if (result[i][10] != null)
                            props.atos_catalogodao = new MobileCRM.Reference(result[i][10].entityName, result[i][10].id, result[i][10].primaryName);
						
						 // si no tiene codido de daño guardamos normalmente
						if (result[i][7] == null){
								newCatalogoAviso.save(
									function (err) {
										if (err) {
											MobileCRM.UI.MessageBox.sayText(err);
										}
										else {
												if (numElemento == numTotalElementos)
													{
													TotalCatalogos = TotalCatalogos +  1;
													if (TotalCatalogos == result.length) {
														
														wait.close();	
														TotalCatalogos = 0;
														
														if (IdiomaUsuario == Idioma.ingles)
															MobileCRM.UI.MessageBox.sayText("Notification has been clone.");
														else
															MobileCRM.UI.MessageBox.sayText("El aviso ha sido clonado.");
														
														MobileCRM.UI.EntityForm.executeCommandByName(
															"custom_cancelClonar",
															function (entityForm) {
																/// <param name='entityForm' type='MobileCRM.UI.EntityForm'/>
																
																
															},
															function (err) {
																FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
																MobileCRM.UI.MessageBox.sayText("Error 40--> " +  err);	
															}
														);
														if (numTotalElementos ==1){
															MobileCRM.UI.FormManager.showDetailDialog("atos_aviso", guidAvisoClonado);
														}
													
												}
											}


											
										}
									}
								);
						}
						// si tiene codigo de daño comprueba que su cosigo de daño no este borrado 
						else {
							 // meto en el array el elmento creado
							arrayParteObjeto[contParte] =
								{
									"IdentificadorParteObjeto": result[i][0],
									"idCatalogoAviso": null,
									"idParteObjeto": guidAvisoOrigen,
								};
								contParte = contParte+ 1
							var codigoId = result[i][7].id;
							var fetchXmlDanyo = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
												"  <entity name='atos_codigos'>" +
												"    <attribute name='atos_indicadordeborrado' />" +
												"    <filter type='and'>" +
												"      <condition attribute='atos_codigosid' operator='eq' value='"+  codigoId  +"' />" +
												"    </filter>" +
												"  </entity>" +
												"</fetch>";
							MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlDanyo,
								function (resultDanyo) {	
								
									if (resultDanyo[0][0] != 1 ){
										newCatalogoAviso.save(
											function (err) {
												if (err) {
													MobileCRM.UI.MessageBox.sayText(err);
												}
												else {
												    // meto en el array el elmento creado
													arrayParteObjeto[TotalCatalogosB].idCatalogoAviso = newCatalogoAviso.id;
												

													TotalCatalogosB = TotalCatalogosB +  1;
													if (TotalCatalogosB == result.length) {
														TotalCatalogosB = 0;
														contParte = 0;
														FS.Aviso.CrearCatalogosAvisoClonado(entityForm, guidAvisoClonado,numElemento, numTotalElementos, "C");
													}
												}
											}
										);
									}									
									else {
										if (numElemento == numTotalElementos){
											TotalCatalogosB = TotalCatalogosB +  1;
											if (TotalCatalogosB == result.length) {
												wait.close();	
												TotalCatalogosB = 0;
												FS.Aviso.CrearCatalogosAvisoClonado(entityForm, guidAvisoClonado,numElemento, numTotalElementos, "C");
											}												
										}
									}
								},
								function (err) {
									FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
									MobileCRM.UI.MessageBox.sayText("Error 43--> " +  err);										
								},
								entityForm
							);							
						}
                    }
					// sino se encuentran catalogos
					if (numElemento == numTotalElementos && result.length == 0){
						
						if (tipo =="B"){
							FS.Aviso.CrearCatalogosAvisoClonado(entityForm, guidAvisoClonado,numElemento, numTotalElementos, "C");
						}
						else {
						
							wait.close();	
							if (IdiomaUsuario == Idioma.ingles)
								MobileCRM.UI.MessageBox.sayText("Notification has been clone.");
							else
								MobileCRM.UI.MessageBox.sayText("El aviso ha sido clonado.");
							
							MobileCRM.UI.EntityForm.executeCommandByName(
								"custom_cancelClonar",
								function (entityForm) {
									/// <param name='entityForm' type='MobileCRM.UI.EntityForm'/>
									
									
								},
								function (err) {
									FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
									MobileCRM.UI.MessageBox.sayText("Error 44--> " +  err);	
								}
							);
							if (numTotalElementos ==1){
								MobileCRM.UI.FormManager.showDetailDialog("atos_aviso", guidAvisoClonado);
							}
						}
					}
					
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 45-> " +  err);	
                },
                entityForm
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			MobileCRM.UI.MessageBox.sayText("Error 46--> " +  err);	
        }

    },
    // clona los anexos que tiene asociado un aviso  para el aviso que va a ser clonado;
    CrearAdjuntosDeAvisoClonado: function (entityForm, guidAvisoClonado,numElemento, numTotalElementos) {
        try {
            var guidAvisoOrigen = entityForm.entity.id;
            var guidAvisoClonado = guidAvisoClonado;
            var varFetchBuscar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='annotation'>" +
                "<attribute name='objectid' />" +
                "<attribute name='notetext' />" +
                "<attribute name='filename' />" +
                "<attribute name='filesize' />" +
                "<attribute name='isdocument' />" +
                "<filter type='and'>" +
                "<condition attribute='objectid' operator='eq' value='" + guidAvisoOrigen + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {
                        var newAnexoAviso = new MobileCRM.DynamicEntity.createNew("annotation");
                        var props = newAnexoAviso.properties;
                        if (result[i][1] != null)
                            props.notetext = result[i][1];
                        if (result[i][2] != null)
                            props.filename = result[i][2];
                        if (result[i][3] != null)
                            props.filesize = result[i][3];
                        if (result[i][4] != null) {
                            if (result[i][4] == "True")
                                props.isdocument = 1;
                            else
                                props.isdocument = 0;
                        }
                        props.objectid = new MobileCRM.Reference(entityForm.entity.entityName, guidAvisoClonado, "");

                        newAnexoAviso.save(
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
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001')
					MobileCRM.UI.MessageBox.sayText("Error 47--> " +  err);	; 
                },
                entityForm
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			MobileCRM.UI.MessageBox.sayText("Error 48--> " +  err);	
        }

    },
    // clona los anexos que tiene asociado un aviso  para el aviso que va a ser clonado;
    CrearTiempoInactividadDeAvisoClonado: function (entityForm, guidAvisoClonado, numElemento, numTotalElementos) {
        try {
            var guidAvisoOrigen = entityForm.entity.id;
            var guidAvisoClonado = guidAvisoClonado;
            var varFetchBuscar = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_tiempoinactividad'>" +
                "<attribute name='atos_ubicaciontecnicaid' />" +
                "<attribute name='atos_fechainicio' />" +
                "<attribute name='atos_fechafin' />" +
                "<attribute name='atos_energia' />" +
                "<attribute name='atos_coste' />" +
                "<attribute name='atos_flag' />" +
                "<attribute name='atos_horastotalesinactividad' />" +
                "<attribute name='atos_ordendetrabajoid' />" +
                "<order attribute='atos_ubicaciontecnicaid' descending='false' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_avisoid' operator='eq' value='" + guidAvisoOrigen + "' />" +
                "</filter>" +
                "</entity>" +
                "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
                    for (var i in result) {
                        var newTiempoInactividadAviso = new MobileCRM.DynamicEntity.createNew("atos_tiempoinactividad");
                        var props = newTiempoInactividadAviso.properties;
                        if (result[i][0] != null)
                            props.atos_ubicaciontecnicaid = new MobileCRM.Reference(result[i][0].entityName, result[i][0].id, result[i][0].primaryName);
						//ELIMINADO POR EL CLIENTE
                        //if (result[i][1] != null)
                        //    props.atos_fechainicio = new Date(result[i][1]);
                        //if (result[i][2] != null)
                        //    props.atos_fechafin = new Date(result[i][2]);
                        if (result[i][3] != null)
                            props.atos_energia = result[i][3];
                        if (result[i][4] != null)
                            props.atos_coste = result[i][4];
                        if (result[i][5] != null) {
                            if (result[i][5] == "True")
                                props.atos_flag = 0;
                            else
                                props.atos_flag = 1;
                        }
                        if (result[i][6] != null)
                            props.atos_horastotalesinactividad = result[i][6];
                        props.atos_avisoid = new MobileCRM.Reference(entityForm.entity.entityName, guidAvisoClonado, "");
                        if (result[i][7] != null)
                            props.atos_ordendetrabajoid = new MobileCRM.Reference(result[i][7].entityName, result[i][7].id, result[i][7].primaryName);

                        newTiempoInactividadAviso.save(
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
                },
                entityForm
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			MobileCRM.UI.MessageBox.sayText("Error 49--> " +  err);	
        }
    },
	  BorrarHistoricoEstatusUsuarioDeAvisoClonado: function (entityForm, guidAvisoClonado) {
		  var guidAvisoOrigen = entityForm.entity.id;
		  var aviso = entityForm;
          var guidAvisoClonado = guidAvisoClonado;
			
			
			   var varFetchBorrar = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                    "<entity name='atos_logestado'> " +
					"     <attribute name='atos_logestadoid'/> " +
                    "     <attribute name='atos_name'/> " +
					"     <attribute name='atos_objeto'/> " +
                    "     <attribute name='atos_estadoavisoid'/> " +
                    "     <attribute name='atos_identificador'/> " +
					"     <attribute name='atos_indicadorcambio'/> " +
                    "     <attribute name='atos_indicadorborrado'/> " +
                    "     <attribute name='atos_numerocambio'/> " +
                    "     <order descending='false' attribute='atos_name'  /> " +
                    "     <order descending='true' attribute='atos_numerocambio'  /> " +
                    "     <filter type='and'>" +
                    "         <condition attribute='atos_avisoid' value='" + guidAvisoClonado + "' operator='eq'/>" +
                    "     </filter>" +
                    "     </entity>" +
                    "     </fetch>";
			
				MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBorrar,
                function (result) {
                    for (var i in result) {
						MobileCRM.DynamicEntity.deleteById(
								"atos_logestado",
								result[i][0],
								function () {
								},
								function (error) {

								}
							);
                    }
				 FS.Aviso.CrearHistoricoEstatusUsuarioDeAvisoClonado(aviso,guidAvisoClonado);
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 50--> " +  err);	
                },
                entityForm
            );			  
	},
	  // clona los historicos de avisos que tiene ese aviso
    CrearHistoricoEstatusUsuarioDeAvisoClonado: function (entityForm, guidAvisoClonado) {
        try {
            var guidAvisoOrigen = entityForm.entity.id;
            var guidAvisoClonado = guidAvisoClonado;
			
            var varFetchBuscar = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                    "<entity name='atos_logestado'> " +
                    "     <attribute name='atos_name'/> " +
					"     <attribute name='atos_objeto'/> " +
                    "     <attribute name='atos_estadoavisoid'/> " +
                    "     <attribute name='atos_identificador'/> " +
					"     <attribute name='atos_indicadorcambio'/> " +
                    "     <attribute name='atos_indicadorborrado'/> " +
                    "     <attribute name='atos_numerocambio'/> " +
                    "     <order descending='false' attribute='atos_name'  /> " +
                    "     <order descending='true' attribute='atos_numerocambio'  /> " +
                    "     <filter type='and'>" +
                    "         <condition attribute='atos_avisoid' value='" + guidAvisoOrigen + "' operator='eq'/>" +
                    "     </filter>" +
                    "     </entity>" +
                    "     </fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(varFetchBuscar,
                function (result) {
			
                    for (var i in result) {
					
                        var newStatusUsuarioAviso = new MobileCRM.DynamicEntity.createNew("atos_logestado");
                        var props = newStatusUsuarioAviso.properties;
						if (result[i][0] != null)
                            props.atos_name = result[i][0];
						if (result[i][1] != null)
                            props.atos_objeto = result[i][1];
                        if (result[i][2] != null)
                            props.atos_estadoavisoid = new MobileCRM.Reference(result[i][2].entityName, result[i][2].id, result[i][2].primaryName);
                        if (result[i][3] != null)
                            props.atos_identificador = result[i][3];
                        if (result[i][4] != null)
                            props.atos_indicadorcambio = result[i][4];
                        if (result[i][5] != null) {
                            props.atos_indicadorborrado = result[i][5];
                        }
                        if (result[i][6] != null)
                            props.atos_numerocambio = result[i][6];
						
                        props.atos_avisoid = new MobileCRM.Reference(entityForm.entity.entityName, guidAvisoClonado, "");

                        newStatusUsuarioAviso.save(
                            function (err) {
								
                                if (err) {
                                    //MobileCRM.UI.MessageBox.sayText(err);
                                }
                                else {
										
                                }
                            }
                        );
                    }
					//wait.close();
					//MobileCRM.UI.FormManager.showDetailDialog("atos_aviso", guidAvisoClonado);
					// if (IdiomaUsuario == Idioma.ingles)
					//						MobileCRM.UI.MessageBox.sayText("Notification has been clone.");
					//					 else
					//						MobileCRM.UI.MessageBox.sayText("El aviso ha sido clonado.");
					
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					MobileCRM.UI.MessageBox.sayText("Error 51--> " +  err);	
                },
                entityForm
            );
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			MobileCRM.UI.MessageBox.sayText("Error 52--> " +  err);	
        }
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
                            if (entityForm.entity.properties.atos_ubicaciontecnicaid != null) {
                                var ubicacionId = entityForm.entity.properties.atos_ubicaciontecnicaid.id;
                                // obtengo la ubicacion y llamo a la funcion recursivo;
                                self.esJefeDeParqueRecursivo(ubicacionId, SAPUser);
                            }

                        }
                    },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						MobileCRM.UI.MessageBox.sayText("Error 53--> " +  err);	
                    },
                    entityForm
                );
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				MobileCRM.UI.MessageBox.sayText("Error 54--> " +  err);	
            },
            null
        );

    },
    // esta funcion se llama recursivamente para buscar en todos los padres.
    //	funcion que mira si un usuario esta como caracteristica "0000013247" para ver si es el jefed e parque
    esJefeDeParqueRecursivo: function (ubicacionId, userId) {
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
            "		<condition attribute='atos_codigo' value='0000013247' operator='eq'/>" +
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
                        encontrado = true;
                        jefeParque = true;
                        return;
                    }
                }
                // si no lo encuentro busco en su padre si tiene 
                if (!encontrado) {
                    var fetchXmlUbicacionPadre = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                        "<entity name='account'>" +
                        "<attribute name='name' />" +
                        "<attribute name='accountid' />" +
                        "<attribute name='parentaccountid'/>" +
                        "<filter type='and'>" +
                        "<condition attribute='accountid' operator='eq' value='" + ubicacionId + "' />" +
                        "</filter>" +
                        "</entity>" +
                        "</fetch>";

                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlUbicacionPadre,
                        function (result) {
                            for (var i in result) {
                                if (result[0][2] != null) {
                                    var ubicacionPadreId = result[i][2].id;
                                    self.esJefeDeParqueRecursivo(ubicacionPadreId, userId);
                                }
                            }
                        },
                        function (err) {
                            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
							MobileCRM.UI.MessageBox.sayText("Error 55--> " +  err);	
                        },
                        null
                    );
                }
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				MobileCRM.UI.MessageBox.sayText("Error 56--> " +  err);	
            },
            null
        );
    },
    insertarLogEstado: function (valor, indice, array, aviso, tipoRegistro, operacion) {

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
        props.atos_avisoid = new MobileCRM.Reference("atos_aviso", aviso.id, aviso.atos_name);
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
	
	//************************************* 	REGION TIEMPOS DE INACTIVIDAD ********************************************************//
	
	CrearParada:function (entityForm) {
     
        var idAviso;
        var aviso = entityForm.entity;
        // compromar que tiene asociada una ubicacion  y que es a nivel de turbina  o mayor 
		if (entityForm.entity.properties.atos_ubicaciontecnicaid == null )
		{
			 var idMsjeError = "10175_023";
			  FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
			return;	
		}
		
		if (entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName.length < 13)
		{
			 var idMsjeError = "10175_024";
			  FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
			return;
		}
		
		// comprobar que le aviso no tiene asociada una orden
		if (entityForm.entity.properties.atos_ordendetrabajoid !=null)
		{
			 var idMsjeError = "10175_025";
			  FS.CommonEDPR.GetErrorCollectionByCode(idMsjeError, entityForm);
			return;
		}
		
		
		
		
		
		

		
        var popup;
        if (IdiomaUsuario == Idioma.ingles) {
            /// Add the buttons for message box
            popup = new MobileCRM.UI.MessageBox("Do you want to create Inactive times?.Previous inactive times will be deleted.");
            popup.items = ["Substation" , "MT Line","Wind turbine","Cancel"];
        }
        else {
            popup = new MobileCRM.UI.MessageBox("¿Desea crear los tiempos de inactividad?.Los tiempos de inactividad anteriores serán borrados.");
            popup.items = ["Subestación","Linea M.T.","Aerogenerador","Cancelar"];

        }

        popup.multiLine = true;
        popup.show(
            function (button) {
                if (button == "Substation" || button == "Subestación") {
					FS.Aviso.SeleccionAvisoForm(entityForm,1);
                }
				else if (button == "MT Line" || button == "Linea M.T.") {
					FS.Aviso.SeleccionAvisoForm(entityForm,2);
				}
				else if (button == "Wind turbine" || button == "Aerogenerador") {
					FS.Aviso.SeleccionAvisoForm(entityForm,3);
				}				
                else {
                    return;
                }
            }
        );	 
    },
     /// <summary>Función que se llama desde los OnChage declarados antes</summary>
    /// <param name="tipo">1-subestación, 2-Línea MT, 3-Aerogeneraador</param>
    SeleccionAvisoForm: function (entityForm,tipo) {

        try {
			if (entityForm.entity.properties.atos_ubicaciontecnicaid == null){
				  FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				return
			}
				
            var codeUT = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
            _textobusqueda = "";
            switch (tipo) {
                case 1:
                    FS.Aviso.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                case 2:
                    FS.Aviso.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                case 3:
                    FS.Aviso.ConfirmarGestion(entityForm, tipo, codeUT);
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			MobileCRM.UI.MessageBox.sayText("Error 58-> " +  err);	
        }
    },
	
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

				//BUSCA LOS TI Del AVISO RELACIONADOS
				var id = entityForm.entity.id;
				var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
					"<entity name='atos_tiempoinactividad'>" +
					"<attribute name='atos_tiempoinactividadid'/>" +
					"<filter type='and'>" +
					"<condition attribute='atos_avisoid' operator='eq' value='" + id + "'/>" +
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
							 FS.Aviso.CreaGestionparada(entityForm,id, tipo, codeUT);
						},
						function (err) {
							FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
							MobileCRM.UI.MessageBox.sayText("Error 59--> " +  err);	
						},
						null
					);
            },
            FS.CommonEDPR.onError,
            null
        );
	},
	
	CreaGestionparada: function (entityForm,id, tipo, codeUT) {
     
      switch (tipo) {
            case 1:
                FS.Aviso.CreaTiemposInactividad(entityForm, codeUT,"SUBESTACION");
                break;
            case 2:
                 FS.Aviso.CreaTiemposInactividad(entityForm, codeUT,"LINEAS_COLECTORAS");
                break;
            case 3:
               FS.Aviso.CreaTiemposInactividadGenerador(entityForm, codeUT);
                break;
            case 4:
				// guardamos los valores  cambiados de los checks
				MobileCRM.UI.EntityForm.save();

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
						"<condition attribute='name' operator='eq' value='"+ turbina +"'/>" +
						"<condition attribute='statecode' operator='eq' value='0' />" +
						"</filter>" +
						"<link-entity name='atos_valorcaracteristica' from='atos_ubicaciontecnicaid' to='accountid' link-type='inner' alias='af'>" +
						"<attribute name='atos_valor'/>" +
						"<filter type='and'>" +
						"<condition attribute='atos_caracteristicaidname' operator='like' value='%"+caracteristica +"%'/>" +
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
							for (var i in resultTurbinas) {
							 // creamos los tiempos de inactividad para esas turbinas
							 
							 	// tiempo de inactividad
								var newTiempoInactividad = new MobileCRM.DynamicEntity.createNew("atos_tiempoinactividad");
								var props = newTiempoInactividad.properties;
								props.atos_avisoid = new MobileCRM.Reference("atos_aviso", entityForm.entity.id, "");
								props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", resultTurbinas[i][2], resultTurbinas[i][2]);
								props.atos_fechainicio = new Date();
								props.atos_fechafin = new Date();
								props.atos_name = resultTurbinas[i][0];
								props.atos_horastotalesinactividad =0;
							
								
								newTiempoInactividad.save(
									function (err) {
										if (err) {
											//MobileCRM.UI.MessageBox.sayText(err);
										}
										else {
											// para el ultimo refrescamos
											if (i == resultTurbinas.length -1){
												MobileCRM.UI.EntityForm.refreshForm();
											}
										}
									}
								);
							}
							
							MobileCRM.UI.EntityForm.save();
						},
						function (err) {
							FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
							MobileCRM.UI.MessageBox.sayText("Error 60--> " +  err);	
						},
						null
					);		
                }
             },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				MobileCRM.UI.MessageBox.sayText("Error 61--> " +  err);	
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
				props.atos_avisoid = new MobileCRM.Reference("atos_aviso", entityForm.entity.id, "");
				props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", result[i][1], result[i][0]);
				props.atos_fechainicio = new Date();
				props.atos_fechafin = new Date();
				props.atos_name = codeUT;
				props.atos_horastotalesinactividad =0;
			
				
				newTiempoInactividad.save(
					function (err) {
						if (err) {
							//MobileCRM.UI.MessageBox.sayText(err);
						}
						else {
							// guardamos los valores  cambiados de los checks
							MobileCRM.UI.EntityForm.refreshForm();
							

						}
					}
				);
					
                }
				
				MobileCRM.UI.EntityForm.save();
             },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				MobileCRM.UI.MessageBox.sayText("Error 62--> " +  err);	
            },
			null
        );		

		
	},
	
	tienePermisosJefeParque: function(entityForm){

	
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
              	if (result.length >0){
					jefeDeParque = true;
				}
				else {
					MobileCRM.UI.EntityForm.requestObject(
						
						function (entityForm) {
							jefeDeParque = false;
							MobileCRM.UI.EntityForm.enableCommand("custom_flagBorrado", false);
							
						},
						FS.CommonEDPR.onError,
						null
					);	
				}
			},
			function (err) {
				// lanzar mensaje de que no se tiene permiso
				FS.CommonEDPR.GetErrorCollectionByCode('10111_032', entityForm);
				MobileCRM.UI.MessageBox.sayText("Error 63--> " +  err);	
            },
            entityForm
        );   

   },

//#region MM-5185
    onChangeTurbineEntranceOrExit: function (entityForm) {

        var entraceExit = entityForm.entity.properties.edprdyn_turbineentranceandexit;
        if (entraceExit == true) {
            MobileCRM.UI.EntityForm.requestObject(
                function (avisoForm) {
                        avisoForm.entity.properties.edprdyn_stoppedturbine = null;
                },
                FS.CommonEDPR.onError,
                null
            );
            return;
        }

        var popup;
        if (IdiomaUsuario == Idioma.ingles) {
            popup = new MobileCRM.UI.MessageBox("How would you like to leave the turbine?");
            popup.items = ["Off", "On"];
        }
        else {
            popup = new MobileCRM.UI.MessageBox("¿Como desea dejar la turbina?");
            popup.items = ["Apagada", "En marcha"];
        }


        popup.show(
            function (button) {
                MobileCRM.UI.EntityForm.requestObject(
                    function (avisoForm) {
                        if (button == "Off" || button == "Apagada") {


                            avisoForm.entity.properties.edprdyn_stoppedturbine = true;
                            //   MobileCRM.UI.EntityForm.save();

                        }
                        else {
                            avisoForm.entity.properties.edprdyn_stoppedturbine = false;
                            // MobileCRM.UI.EntityForm.save();
                        }
                    },
                    FS.CommonEDPR.onError,
                    null
                );
            }
        );
    },
    //#endregion region MM-5185   
   


}

