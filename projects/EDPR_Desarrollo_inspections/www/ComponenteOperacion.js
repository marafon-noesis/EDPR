if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (ComponenteOperacion) == "undefined") { ComponenteOperacion = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
//#endregion
var UTname = "";
var liberada = false;
var enviarOT_A_SAP = false;
///AAC-2020-05-11
/// REDMMINE: 21808
/// FUNCIONALIDAD DE  NO PART USED
var sinComponentes = false;

FS.ComponenteOperacion = {
    // funci?n  que se lanza cuando se carga la pantalla de  componente de operaciones  y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    ComponenteOperacionOnLoad: function () {
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
    // funci?n  que se lanza cuando se carga el componente de operaciones 
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var componente = entityForm.entity;
		
		
			 // creamos la definicion del confirmar horas
        MobileCRM.UI.EntityForm.onCommand(
            "custom_confirmacionComponentes",
            function (entityForm) {
				
				FS.ComponenteOperacion.tienePermisosJefeParque(entityForm,1); 
            },
            true
        );
		// creamos la definicion del cancelar horas
		 MobileCRM.UI.EntityForm.onCommand(
            "custom_cancelacionComponentes",
            function (entityForm) {
				FS.ComponenteOperacion.tienePermisosJefeParque(entityForm,2);
				
            },
            true
        );
		
		//AAC MM-780 2021-09-16 añadir a Resco el borrado de componentes
		// Borrado logico del componente
		 MobileCRM.UI.EntityForm.onCommand(
            "custom_borrarComponentes",
            function (entityForm) {
				FS.ComponenteOperacion.borrarComponente(entityForm);
				
            },
            true
        );
		
		
		
		
		var dv = entityForm.getDetailView("General");
		//dv.getItemByName("atos_ordendetrabajoid").isEnabled = false;
		
        if (componente.isNew) {
			enviarOT_A_SAP = true;
			FS.ComponenteOperacion.ActivarConfirmacion(entityForm,true);	
			
			self.completarCentroplanificacion(entityForm);
			 self.changeOperacion(entityForm);
            ///obtenemos el valor de la OT y se  la asignamos si podemos
			if (entityForm.entity.properties.atos_operacionid != null) {
				var operacionId = entityForm.entity.properties.atos_operacionid.id;
				var varFetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
                " <entity name='msdyn_workorderservicetask'>" +
                "   <attribute name='msdyn_workorder'/>" +
				"   <attribute name='atos_ubicaciontecnicaid'/>" +
				"   <attribute name='atos_centroplanificacionid'/>" +
                "       <filter type='and'>" +
                "           <condition attribute='msdyn_workorderservicetaskid' value='" +  operacionId +" ' operator='eq'/> " +
                "       </filter>  " +
                " </entity>  " +
                "</fetch>";
			
			    MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
                function (result) {
                    for (var i in result) {
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
							 entityForm.entity.properties.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorder", result[i][0].id, result[i][0].primaryName );
							 self.completarCentroplanificacion(entityForm);
							///AAC-2020-05-11
							/// REDMMINE: 21808
							/// FUNCIONALIDAD DE  NO PART USED
							self.ComprobarNoPartUsed(entityForm);
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
	  
        }
        else {
			//miramos si esta confirmada
			if (entityForm.entity.properties.atos_estatusconfirmacion != null &&
				entityForm.entity.properties.atos_estatusconfirmacion == 300000001)  {
				FS.ComponenteOperacion.ActivarConfirmacion(entityForm,false);	
			}
			else {
				FS.ComponenteOperacion.ActivarConfirmacion(entityForm,true);	
			}		
        }
	///AAC-2020-05-11
	/// REDMMINE: 21808
	/// FUNCIONALIDAD DE  NO PART USED
    self.ComprobarNoPartUsed(entityForm);
    self.RellenarTipoMovimiento(entityForm);
	self.completarUTyLiberada(entityForm);
	
	
    },
    // función  que se lanza cuando se guarda el componente de operaciones 
    //...
	
	    // AAC 07-11-2018
    onSave: function (entityForm) {
        var self = this;
		///AAC-2020-05-11
		/// REDMMINE: 21808
		/// FUNCIONALIDAD DE  NO PART USED
		if (sinComponentes){
			MostrarMensajePopUpError('10219_026', IdiomaUsuario, null);
			entityForm.cancelValidation(null);
		}
		
		
	},
	
    // AAC 07-11-2018
    onPostSave: function (entityForm) {
        var self = this;
       
	    var sincronizando = 3;
        var noEnviado = 2;
        try {
            if (enviarOT_A_SAP) {  
				var ordenTrabajo = entityForm.entity.properties.atos_ordendetrabajoid;
				FS.ComponenteOperacion.actualizarOTEnvioSAP(ordenTrabajo.id,entityForm );			
               
            }

        }
        catch (err) {
           	FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
        }
	
    },
	ActivarConfirmacion: function (entityForm,confirmarActivo) {
        
	MobileCRM.UI.EntityForm.enableCommand("custom_confirmacionComponentes", confirmarActivo);
	MobileCRM.UI.EntityForm.enableCommand("custom_cancelacionComponentes", !confirmarActivo);
	
	//var dv = entityForm.getDetailView("Componente");
	//dv.getItemByName("atos_cantidad").isEnabled = confirmarActivo;
	var dv2 = entityForm.getDetailView("Confirmacion");
	dv2.getItemByName("atos_documentodeconfirmacion").isEnabled = confirmarActivo;
	dv2.getItemByName("atos_aniodocumentoconfirmacion").isEnabled = confirmarActivo;
	dv2.getItemByName("atos_documentodecancelacion").isEnabled = !confirmarActivo;
		
    },
	
	
	///AAC-2020-05-11
	/// REDMMINE: 21808
	/// FUNCIONALIDAD DE  NO PART USED
    ComprobarNoPartUsed: function (entityForm) {
        if (entityForm.entity.properties.atos_ordendetrabajoid != null) {
			var ordenId = entityForm.entity.properties.atos_ordendetrabajoid.id;
			var varFetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
							" <entity name='msdyn_workorder'>" +
							"   <attribute name='msdyn_serviceaccount'/>" +
							"   <attribute name='atos_nopartsused'/>" +
							"       <filter type='and'>" +
							"           <condition attribute='msdyn_workorderid' value='" +  ordenId +" ' operator='eq'/> " +
							"       </filter>  " +
							" </entity>  " +
							"</fetch>";
		
		 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
				function (result) {
					var UTname = result[0][0].primaryName;
					var noPartUsed	= result[0][1];
					if (noPartUsed== "True" && FS.ComponenteOperacion.EsUbicacionAmericana(UTname)== true){
					   sinComponentes = true;
					}
				},
				function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
					entityForm
			);
        }
    },
	
	
	
	//En la creacion del componente es necesario informar a SAP inmediatamente la creacion del registro
    actualizarOTEnvioSAP: function (ordenTrabajoId, entityForm) {
		var SAP = 1;
		var OrdeTrabajo = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
		OrdeTrabajo.id =  ordenTrabajoId;
		OrdeTrabajo.isNew =false;
		OrdeTrabajo.properties.atos_enintegracion = false;
		OrdeTrabajo.properties.atos_origen = SAP;
		var postSuspend = entityForm.suspendPostSave();
		
		OrdeTrabajo.save(
			function (err) {
				if (err) {
				  FS.CommonEDPR.GetErrorCollectionByCode('JS_001'); 
				  postSuspend.resumePostSave();
				}
				else {
				 
					var OrdeTrabajo = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
					OrdeTrabajo.id =  ordenTrabajoId;
					OrdeTrabajo.isNew = false;
					OrdeTrabajo.properties.atos_enintegracion = true;
					OrdeTrabajo.properties.atos_origen = SAP;				 
				 
				 	OrdeTrabajo.save(
						function (err) {
							if (err) {
								FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
							}
							else {
					
							}
							postSuspend.resumePostSave();
						}
					);
				 
				}
			}
		);		
    },
	
	
    // función  que se encarga de rediriguir todos los onchange de los  componente de operaciones 
    // AAC 07-11-2018
    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;
		var aprobado = false;
	   if (entityForm.entity.properties.atos_estatusconfirmacion != null &&
  		   entityForm.entity.properties.atos_estatusconfirmacion == 300000001)  {
				aprobado = true ;					
		}
		
       switch (changedItem) {
		    //Ha cambiado la clase de orden
            case "atos_operacionid":
                    self.changeOperacion(entityForm);
                    break;  
			case "atos_materialid":
			        if (!aprobado)
						self.OnChangeMateriales(entityForm);
                    break;  		
			case "atos_cantidad":
					if (!aprobado)
						self.onChangeCantidad(entityForm);
                    break;  
			case "atos_cantidadadconfirmacion":
					if (!aprobado)
						self.onChangeCantidadConfirmacion(entityForm);
                    break;  					
			case "atos_centrocomponenteid":
					if (!aprobado)
						self.onChangeCentro(entityForm);
                    break; 
			case "atos_almacenid":
					if (!aprobado)
						self.onChangeAlmacen(entityForm);
                    break; 					
	   }
	   
	   	if (!entityForm.entity.isNew) {
		   if (entityForm.entity.properties.atos_estatusconfirmacion != null &&
					entityForm.entity.properties.atos_estatusconfirmacion == 300000001)  {
					FS.ComponenteOperacion.ActivarConfirmacion(entityForm,false);
				}
			else {
					FS.ComponenteOperacion.ActivarConfirmacion(entityForm,true);	
						
				}	
		}		
	   
	   
	
	   
    },
	onChangeCantidad: function (entityForm)
    {
		var unidadMedidaId = null;
		
		if (entityForm.entity.properties.atos_unidademedidaid != null){
			unidadMedidaId = entityForm.entity.properties.atos_unidademedidaid.id;
		}
		if (unidadMedidaId == null){
				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						if (entityForm.entity.properties.atos_cantidad  != null){
							 entityForm.entity.properties.atos_cantidadadconfirmacion  = entityForm.entity.properties.atos_cantidad;
						}
						else {
							entityForm.entity.properties.atos_cantidadadconfirmacion = null ;
						}
					},
					FS.CommonEDPR.onError,
					null
				);
		}	

		if (unidadMedidaId != null){
			var fetchXml =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
							"<entity name='atos_unidaddemedida'>" +
							"<attribute name='atos_numerodecimalespermitido' />" +
							"<filter type='and'>" + 
							"<condition attribute='atos_unidaddemedidaid' operator='eq' value='" + unidadMedidaId + "' />" +
							"</filter>" +
							"</entity>" +
							"</fetch>";	
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
					var cantidad = entityForm.entity.properties.atos_cantidad;
					var numDecimales = null;
                    for (var i in result) {
						numDecimales = result[0][0];
						
						if (numDecimales != null && entityForm.entity.properties.atos_cantidad != null){
							cantidad = cantidad.toFixed(numDecimales);
						}
						else {
							if (entityForm.entity.properties.atos_cantidad  != null){
								 entityForm.entity.properties.atos_cantidadadconfirmacion  = entityForm.entity.properties.atos_cantidad;
							}
							else {
								entityForm.entity.properties.atos_cantidadadconfirmacion = null ;
							}							
						}
										
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
								entityForm.entity.properties.atos_cantidad = cantidad;
								if (entityForm.entity.properties.atos_cantidad  != null){
									 entityForm.entity.properties.atos_cantidadadconfirmacion  = entityForm.entity.properties.atos_cantidad;
								}
								else {
									entityForm.entity.properties.atos_cantidadadconfirmacion = null ;
								}
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
	
	onChangeCantidadConfirmacion: function (entityForm)
    {
		var unidadMedidaId = null;
		
		if (entityForm.entity.properties.atos_unidademedidaid != null){
			unidadMedidaId = entityForm.entity.properties.atos_unidademedidaid.id;
		}


		if (unidadMedidaId != null){
			var fetchXml =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
							"<entity name='atos_unidaddemedida'>" +
							"<attribute name='atos_numerodecimalespermitido' />" +
							"<filter type='and'>" + 
							"<condition attribute='atos_unidaddemedidaid' operator='eq' value='" + unidadMedidaId + "' />" +
							"</filter>" +
							"</entity>" +
							"</fetch>";	
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
					var cantidad = entityForm.entity.properties.atos_cantidadadconfirmacion;
					var numDecimales = null;
                    for (var i in result) {
						numDecimales = result[0][0];
						
						if (numDecimales != null && entityForm.entity.properties.atos_cantidadadconfirmacion != null){
							cantidad = cantidad.toFixed(numDecimales);
						}
										
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
								entityForm.entity.properties.atos_cantidadadconfirmacion = cantidad;
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
	onChangeCentro: function (entityForm)
    {
		MobileCRM.UI.EntityForm.requestObject(
			function (entityForm) {

			if (entityForm.entity.properties.atos_centrocomponenteid  !=null){
				entityForm.entity.properties.atos_centroid = entityForm.entity.properties.atos_centrocomponenteid;
			}
			else {
				entityForm.entity.properties.atos_centroid = null ;
			}
			},
			FS.CommonEDPR.onError,
			null
		);		
    },
	onChangeAlmacen: function (entityForm)
    {
		
		MobileCRM.UI.EntityForm.requestObject(
			function (entityForm) {

			if (entityForm.entity.properties.atos_almacenid  !=null){
				entityForm.entity.properties.atos_almacenconfirmacionid = entityForm.entity.properties.atos_almacenid ;
			}
			else {
				entityForm.entity.properties.atos_almacenconfirmacionid = null ;
			}
			},
			FS.CommonEDPR.onError,
			null
		);	
    },
	OnChangeMateriales: function (entityForm) {
		 var self = this;    
        self.InicializarValoresMateriales(entityForm);
        self.CamposPorDefectoMaterial(entityForm);
        self.SetValorGrupoCompras(entityForm);
    },
	 // inicializamoslos valores a null
	 InicializarValoresMateriales: function (entityForm) {
		MobileCRM.UI.EntityForm.requestObject(
			function (entityForm) {
				entityForm.entity.properties.atos_unidademedidaid =null;
				entityForm.entity.properties.atos_unidadconfirmacionid = null;
				entityForm.entity.properties.atos_grupodearticulosid =null;
				entityForm.entity.properties.atos_grupodecomprasid =null;
			},
			FS.CommonEDPR.onError,
			null
		);		 
    },
	
	
    CamposPorDefectoMaterial: function (entityForm) {
        
        if (entityForm.entity.properties.atos_materialid != null) {
            var materialId = entityForm.entity.properties.atos_materialid.id;
			var varFetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
								" <entity name='product'>" +
								"   <attribute name='atos_unidaddemedidaid'/>" +
								"   <attribute name='atos_grupodearticulosid'/>" +
								"       <filter type='and'>" +
								"           <condition attribute='productid' value='" +  materialId +" ' operator='eq'/> " +
								"       </filter>  " +
								" </entity>  " +
								"</fetch>";
			
			 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
					function (result) {
						for (var i in result) {
							MobileCRM.UI.EntityForm.requestObject(
								function (entityForm) {
									entityForm.entity.properties.atos_unidademedidaid = result[i][0];
									entityForm.entity.properties.atos_grupodearticulosid = result[i][1];
									// confirmacion
									entityForm.entity.properties.atos_unidadconfirmacionid = entityForm.entity.properties.atos_unidademedidaid ;
									
									
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
        else {
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					entityForm.entity.properties.atos_unidademedidaid = null;
					entityForm.entity.properties.atos_grupodearticulosid = null;
					
				},
				FS.CommonEDPR.onError,
				null
			);
        }

    },
	
	 SetValorGrupoCompras: function (entityForm) {
        var materialValue = entityForm.entity.properties.atos_materialid;
        var centroPlanificacion =  entityForm.entity.properties.atos_centrodeplanificacionid;
        if (materialValue != null && centroPlanificacion != null) {
            var materialValueId = materialValue.id;
            var centroPlanificacionId = centroPlanificacion.id;
            var varFetchXml = "<fetch distinct='true' mapping='logical' output-format='xml-platform' version='1.0'>" +
                "<entity name='atos_grupodecompras'>" +
                "<attribute name='atos_name'/>" +
                "<attribute name='atos_codigo'/>" +
                "<attribute name='atos_grupodecomprasid'/>" +
                "<order descending='false' attribute='atos_name'/>" +
                "<link-entity name='atos_materialenplanta' alias='ap' link-type='inner' to='atos_grupodecomprasid' from='atos_grupodecomprasid'>" +
                "<filter type='and'>" +
                "<condition attribute='atos_materialid' value='" + materialValueId + "' operator='eq'/>" +
                "</filter>" +
                "<link-entity name='atos_centrodeemplazamiento' alias='aq' link-type='inner' to='atos_plantaid' from='atos_centrodeemplazamientoid'>" +
                "<link-entity name='atos_centrodeplanificacion' alias='ar' link-type='inner' to='atos_centrodeemplazamientoid' from='atos_emplazamientoid'>" +
                "<filter type='and'>" +
                "<condition attribute='atos_centrodeplanificacionid' value='" + centroPlanificacionId + "' uitype='atos_centrodeplanificacion' uiname='100A: EDP Renewables N. America LLC' operator='eq'/>" +
                "</filter>" +
                "</link-entity>" +
                "</link-entity>" +
                "</link-entity>" +
                "</entity>" +
                "</fetch>";

				
				
		 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
				function (result) {
					for (var i in result) {
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
								entityForm.entity.properties.atos_grupodecomprasid = new MobileCRM.Reference("atos_grupodecompras", resul[i][2], resul[i][0]);
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
        else {
			
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					entityForm.entity.properties.atos_grupodecomprasid = null;
				},
				FS.CommonEDPR.onError,
				null
			);			
		
        }
    },
	
	
	changeOperacion: function (entityForm) {
        var self = this;
       
	        ///obtenemos el valor de la OT y se  la asignamos si podemos
			if (entityForm.entity.properties.atos_operacionid != null) {
			var operacionId = entityForm.entity.properties.atos_operacionid.id;
			
			var varFetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
					" <entity name='msdyn_workorderservicetask'>" +
					"   <attribute name='msdyn_workorder'/>" +
					"   <attribute name='atos_centroid'/>" +
					"   <attribute name='atos_centroplanificacionid'/>" +
					"       <filter type='and'>" +
					"           <condition attribute='msdyn_workorderservicetaskid' value='" +  operacionId +" ' operator='eq'/> " +
					"       </filter>  " +
					" </entity>  " +
					"</fetch>";
			
			
			MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
            function (result1) {
			        var operacion;
					for (var i in result1) {
					  if (result1[i][0]!=null){	
						  operacion= result1[i];
						  centroId = result1[i][1].id;
					  }
					  else {
						 return;
					  }
					}
					
					var varFetchXmlUbicacion ="<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
											"  <entity name='account'>" +
											"    <attribute name='atos_centrodeplanificacionid' />" +
											"    <attribute name='atos_centrodecosteid' />" +
											"    <attribute name='accountid' />" +
											"    <attribute name='name' />" +											
											"    <link-entity name='msdyn_workorderservicetask' from='atos_ubicaciontecnicaid' to='accountid' link-type='inner' alias='ac'>" +
											"      <filter type='and'>" +
											"        <condition attribute='msdyn_workorderservicetaskid' operator='eq' uitype='msdyn_workorderservicetask' value='" + operacionId + "' />" +
											"      </filter>" +
											"    </link-entity>" +
											"  </entity>" +
											"</fetch>";
						
					MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXmlUbicacion,
					function (result) {
						if (result.length >0){
							var ubicacion = result[0];
							
							var filterPlanif = "";
                            var filterCoste = "";
							 var filterHR = "";
							var UTname = "";
							if (result[0][3] != null) {
								UTname =  ubicacion[3];
							}
							
								                            
                            var hrorigen = entityForm.entity.properties.atos_hojarutaorigen;
                            if (hrorigen != null && hrorigen != "") {
                                filterHR += "<condition attribute='atos_indicadorboq' operator='eq' value='1'/>";
                            }
                            else {
                                filterHR += "<condition attribute='atos_indicadorboq' operator='ne' value='1'/>";
                            }
							
							
							
							
							if (result1[0][1] != null) {
                                filterPlanif += "<condition attribute='atos_centroid' operator='eq' value='" + centroId + "' />"
                            }
                            if (ubicacion[1] != null) {
                                filterCoste += "<condition attribute='atos_centrodecosteid' operator='eq' value='" + ubicacion[1].id + "'/>";
                            }							
							
						    var fetchAlmacen1 ="<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='true'>" +
											   "  <entity name='atos_almacenesot'>" +
											   "    <attribute name='atos_centrodeplanificacionid' />" +
											   "    <attribute name='atos_almacenid' />" +
											   "    <attribute name='atos_centrocomponenteid' />" +
											   "    <filter type='and'>" + filterPlanif + filterCoste +  filterHR +
											   "    </filter>" +
											   "<link-entity name='msdyn_warehouse' alias='a_almacen' link-type='outer' visible='false' to='atos_almacenid' from='msdyn_warehouseid'>" +
                                               "<attribute name='atos_name_en'/>" +
                                               "<attribute name='atos_name_es'/>" +
                                               "</link-entity>" +
                                               "<link-entity name='atos_centro' alias='a_centro' link-type='outer' visible='false' to='atos_centrocomponenteid' from='atos_centroid'>" +
                                               "<attribute name='atos_name_es'/>" +
                                               "<attribute name='atos_name_en'/>" +
                                               "</link-entity>" +											   
											   "  </entity>" +
											   "</fetch>";
							
								MobileCRM.FetchXml.Fetch.executeFromXML(fetchAlmacen1,
									function (resultAlmacen) {
									
										if (resultAlmacen.length >0){
											var almacen = resultAlmacen[0];

                                          //Poner en Centro componente
                                            if (almacen[2] != null) {
												MobileCRM.UI.EntityForm.requestObject(
													function (entityForm) {
													entityForm.entity.properties.atos_centrocomponenteid  =  new MobileCRM.Reference(almacen[2].entityName, almacen[2].id, almacen[2].primaryName);				
													entityForm.entity.properties.atos_centroid = entityForm.entity.properties.atos_centrocomponenteid;
												},
													FS.CommonEDPR.onError,
													null
												);
                                           }
										//Poner en Almacen
                                            if (almacen[1] != null) {
												MobileCRM.UI.EntityForm.requestObject(
													function (entityForm) {
													entityForm.entity.properties.atos_almacenid  =  new MobileCRM.Reference(almacen[1].entityName, almacen[1].id, almacen[1].primaryName);
													entityForm.entity.properties.atos_almacenconfirmadoid = entityForm.entity.properties.atos_almacenid ;
													
												},
													FS.CommonEDPR.onError,
													null
												);												
                                           }
										}
										else 
										{
											// si no tiene 
												
											var fetchAlmacen1 =	"<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='true'>" +
																"  <entity name='atos_almacenesot'>" +
																"    <attribute name='atos_centrodeplanificacionid' />" +
																"    <attribute name='atos_almacenid' />" +
																"    <attribute name='atos_centrocomponenteid' />" +
																"    <filter type='and'>" + filterPlanif  + filterHR +
																"    </filter>" +
															    "<link-entity name='msdyn_warehouse' alias='a_almacen' link-type='outer' visible='false' to='atos_almacenid' from='msdyn_warehouseid'>"+
															    "<attribute name='atos_name_en'/>" +
															    "<attribute name='atos_name_es'/>" +
															    "</link-entity>" +
															    "<link-entity name='atos_centro' alias='a_centro' link-type='outer' visible='false' to='atos_centrocomponenteid' from='atos_centroid'>" +
															    "<attribute name='atos_name_es'/>" +
															    "<attribute name='atos_name_en'/>" +
															    "</link-entity>" +																
																"  </entity>"+
																"</fetch>";
											
											MobileCRM.FetchXml.Fetch.executeFromXML(fetchAlmacen1,
												function (resultAlmacen1) {
													if (resultAlmacen1.length >0){
															var almacen = resultAlmacen1[0];
															
															if (almacen[2] != null) {
																MobileCRM.UI.EntityForm.requestObject(
																	function (entityForm) {
																		entityForm.entity.properties.atos_centrocomponenteid  =  new MobileCRM.Reference(almacen[2].entityName, almacen[2].id, almacen[2].primaryName);
																		entityForm.entity.properties.atos_centroid = entityForm.entity.properties.atos_centrocomponenteid;
																		
																		
																	},
																	FS.CommonEDPR.onError,
																	null
																);
															}
															//Poner en Almacen
															if (almacen[1] != null) {
																MobileCRM.UI.EntityForm.requestObject(
																	function (entityForm) {
																		entityForm.entity.properties.atos_almacenid  =  new MobileCRM.Reference(almacen[1].entityName, almacen[1].id, almacen[1].primaryName);
																		entityForm.entity.properties.atos_almacenconfirmadoid = entityForm.entity.properties.atos_almacenid;
																	},
																	FS.CommonEDPR.onError,
																	null
																);
															}
													}
												    else{
														 if (FS.ComponenteOperacion.EsUbicacionAmericana(UTname) == true){
															 // centro de planficacion USA se coge le codigo  y se busca con ese codigo en la tabla centro
															    var centroBuscar = operacion[2].primaryName.split(':')[0];
																var fetchXmlCentro = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                                                                    "  <entity name='atos_centro'>" +
                                                                    "    <attribute name='atos_name' />" +
                                                                    "    <attribute name='atos_codigo' />" +
                                                                    "    <attribute name='atos_centroid' />" +
                                                                    "    <attribute name='atos_name_es' />" +
                                                                    "    <attribute name='atos_name_en' />" +
                                                                    "    <order attribute='atos_name' descending='false' />" +
                                                                    "    <filter type='and'>" +
                                                                    "      <condition attribute='atos_codigo' operator='eq' value='" + centroBuscar + "' />" +
                                                                    "    </filter>" +
                                                                    "  </entity>" +
                                                                    "</fetch>";
																	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlCentro,
																		function (resultCentro) {
																			
																			MobileCRM.UI.EntityForm.requestObject(
																				function (entityForm) {
																					entityForm.entity.properties.atos_centrocomponenteid  =  new MobileCRM.Reference("atos_centro", resultCentro[0][2], resultCentro[0][0]);
																					entityForm.entity.properties.atos_centroid  = new MobileCRM.Reference("atos_centro", resultCentro[0][2], resultCentro[0][0]);
																				},
																				FS.CommonEDPR.onError,
																				null
																			);

															 
																		},
																		 function (err) {
																			FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
																		},
																			entityForm
																	);	
															 
														 }
														 else {
															 // centro de la operacion para europa
															 
															 	MobileCRM.UI.EntityForm.requestObject(
																	function (entityForm) {
																			entityForm.entity.properties.atos_centrocomponenteid  = entityForm.entity.properties.atos_centrocomponenteid  =  new MobileCRM.Reference("atos_centro",operacion[1].id,operacion[1].primaryName);
																			entityForm.entity.properties.atos_centroid = entityForm.entity.properties.atos_centrocomponenteid  =  new MobileCRM.Reference("atos_centro",operacion[1].id,operacion[1].primaryName);
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
			},
              function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
              },
               entityForm
            );
			
			
			}
			
    },
	
	completarCentroplanificacion: function (entityForm) {
        var self = this;
		if (entityForm.entity.properties.atos_ordendetrabajoid != null) {
			 var OTId = entityForm.entity.properties.atos_ordendetrabajoid.id;
			 
			    var varFetchXml ="<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
								 "  <entity name='msdyn_workorder'>" +
								 "    <attribute name='atos_centrodeplanificacinid' />" +
								 "      <filter type='and'>" +
								 "        <condition attribute='msdyn_workorderid' operator='eq' value='" + OTId + "' />" +
								 "      </filter>" +
								 "  </entity>" +
								 "</fetch>";
			 
			 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
                function (result) {
                    for (var i in result) {
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
								if (result[i][0]!= null )
								entityForm.entity.properties.atos_centrodeplanificacionid = result[i][0];
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
	
	RellenarTipoMovimiento: function (entityForm) {
        var self = this;
		var codigo = "261";
		if (entityForm.entity.properties.atos_tipodemovimientoid == null) {
			 
			    var varFetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'> " +
									"  <entity name='atos_tipodemovimiento'>" +
									"    <attribute name='atos_tipodemovimientoid' />" +
									"    <attribute name='atos_name' />" +
									"    <attribute name='atos_codigo' />" +
									"      <filter type='and'>" +
									"        <condition attribute='atos_codigo' operator='eq' value='" + codigo + "' />" +
									"      </filter>" +
									"  </entity>" +
									"</fetch>";
			 
			 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
                function (result) {
                    for (var i in result) {
						
						 MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
							entityForm.entity.properties.atos_tipodemovimientoid = new MobileCRM.Reference("atos_tipodemovimiento", result[i][0], result[i][1]);
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
	
	
	completarUTyLiberada: function (entityForm) {
        var self = this;
		if (entityForm.entity.properties.atos_ordendetrabajoid != null) {
			 var OTId = entityForm.entity.properties.atos_ordendetrabajoid.id;
			 
			    var varFetchXml ="<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
								 "  <entity name='msdyn_workorder'>" +
								 "    <attribute name='atos_liberarorden' />" +
								 "    <attribute name='msdyn_serviceaccount' />" +
								 "      <filter type='and'>" +
								 "        <condition attribute='msdyn_workorderid' operator='eq' value='" + OTId + "' />" +
								 "      </filter>" +
								 "  </entity>" +
								 "</fetch>";
			 
			 	MobileCRM.FetchXml.Fetch.executeFromXML(varFetchXml,
                function (result) {
                    for (var i in result) {
							if (result[i][1]!= null )
								UTname = result[i][1].primaryName;
							if (result[i][1]!= null )
								liberada = result[i][0];
                    }
                },
                function (err) {
                    FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                },
					entityForm
				);
		}
		
		
    },

    tienePermisosJefeParque: function(entityForm,tipo){

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
					if (tipo == 1){
						FS.ComponenteOperacion.IntegrarConfirmacionComponentesConSAP(entityForm); 
					}
					if (tipo == 2){
						FS.ComponenteOperacion.IntegrarCancelacionComponentesConSAP(entityForm);	
					}
				}
				else {
					// lanzar mensaje de que no se tiene permiso
					MostrarMensajePopUpError('10219_022', IdiomaUsuario, null);
				}
            },
            function (err) {
					// lanzar mensaje de que no se tiene permiso
					MostrarMensajePopUpError('10219_022', IdiomaUsuario, null);
            },
            entityForm
        );   

   },
	
	//AAC MM-780 2021-09-16 añadir a Resco el borrado de componentes
	borrarComponente: function(entityForm){
		   var idMsjeInfo = "10219_001";
		   var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
		   MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
			function success(result) {
				var popup;
				if (IdiomaUsuario == Idioma.ingles) {
					/// Add the buttons for message box
					popup = new MobileCRM.UI.MessageBox(result[0][1]);
					popup.items = ["Yes", "No"];
				}
				else {
					popup = new MobileCRM.UI.MessageBox(result[0][2]);
					popup.items = ["Si", "No"];

				}
				popup.multiLine = true;		
				var literales = Literales(IdiomaUsuario);
				
				
				popup.show(
					function (button) {
						if (button == "Yes" || button == "Si") {
							
							var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
							componente.id = entityForm.entity.id;
							componente.isNew =false;
							componente.properties.statuscode = 2;
							componente.properties.atos_borradoensap = true;
							
							componente.properties.atos_origen = 300000002;
							
							
							componente.save(
								function (err) {
									if (err) {
										MobileCRM.UI.MessageBox.sayText(err);
									}
									else {
										MobileCRM.UI.MessageBox.sayText(literales.componenteBorrado);
										MobileCRM.bridge.closeForm();
									}
								}
							);
						}
						else {
							return;
						}
					});							
			},
			function (error) {
			   FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
			});

	},
	
	EsUbicacionAmericana:function(UTname){
		if (UTname.split("-").length > 2 && ( UTname.split("-")[1] != "US" &&   UTname.split("-")[1] != "CA" &&  UTname.split("-")[1] != "MX"))
		{
			return false;
		}
		else{
			return true;
		}
	},
	
	estaAutorizada: function (resultadoAut) {
        var codigoPermisoAutorizado = "A";
        var esAutorizada = false;
		 for (var i in resultadoAut) {
			if (resultadoAut[i][5] == codigoPermisoAutorizado && resultadoAut[i][4] != null) {
				esAutorizada = true;
			}
		 }
		 
        return esAutorizada;
    },


    IntegrarConfirmacionComponentesConSAP: function (entityForm) {
        
        var guidOperacion = entityForm.entity.properties.atos_operacionid.id;
        var idMsjeInfo = "10219_003";
		var listadoTipo_L = 300000001;
		var integradoConSAP = 300000001;
        var activo = "0";
        var codigoPermisoAutorizado = "A";
		
		  var tipoListadoMaterial = entityForm.entity.properties.atos_listadematerial;
          if (tipoListadoMaterial != listadoTipo_L)
          {
              MostrarMensajePopUpError('10219_017', IdiomaUsuario, null);
              return;
          }
		
        var validacionOK = ValidarCamposObligatoriosComponente(IdiomaUsuario,entityForm);
        if (validacionOK != "") {
            MostrarMensajePopUpError('10219_004', IdiomaUsuario, validacionOK);
            return;
        }
		
		
        var ordenTrabajo = entityForm.entity.properties.atos_ordendetrabajoid;
		
		var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
        
        	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
			  function success(resultOT) {
				  if (resultOT[0][1] != integradoConSAP) {
					//La orden de trabajo no está integrada con SAP
					MostrarMensajePopUpError('10111_021', IdiomaUsuario, null);
					return;
				  }
				 var fetchAutoriz = ObtenerFetchDeMensajeAutorizacionesOT(ordenTrabajo.id, activo);
				//Comprobamos si tiene autorizacion
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
					function success(resultadoAut) {
						
						
						//AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
						//if ((FS.ComponenteOperacion.estaAutorizada(resultadoAut)|| FS.ComponenteOperacion.EsUbicacionAmericana(UTname) == true) && liberada ) {
						if (liberada){
							//Si encontró alguno quiere decir que está Autorizada

						   var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
						   MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
								function success(result) {
									var popup;
									if (IdiomaUsuario == Idioma.ingles) {
										/// Add the buttons for message box
										popup = new MobileCRM.UI.MessageBox(result[0][1]);
										popup.items = ["Yes", "No"];
									}
									else {
										popup = new MobileCRM.UI.MessageBox(result[0][2]);
										popup.items = ["Si", "No"];

									}
									popup.multiLine = true;		
									var literales = Literales(IdiomaUsuario);
									
									
									popup.show(
										function (button) {
											if (button == "Yes" || button == "Si") {
												
												var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
												componente.id = entityForm.entity.id;
												componente.isNew =false;
												componente.properties.atos_estatusconfirmacion = 300000001;
												componente.properties.atos_enviarasap = true;
												componente.properties.atos_fechacontabilidad = new Date();
												componente.properties.atos_origen = 300000002;
												
												MobileCRM.UI.EntityForm.requestObject(
													function (entityForm) {
														entityForm.entity.properties.atos_estatusconfirmacion = 300000001;
														FS.ComponenteOperacion.ActivarConfirmacion(entityForm,false);
													},
													FS.CommonEDPR.onError,
													null
												);
												
												componente.save(
													function (err) {
														if (err) {
															MobileCRM.UI.MessageBox.sayText(err);
														}
														else {
															MobileCRM.UI.MessageBox.sayText( literales.confirmacionEnviada);
														}
													}
												);
											}
											else {
												return;
											}
										});							
								},
								function (error) {
								   FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
								});
						} else {
							//mensaje por si no tiene autorizaciones o no esta liberada
							MostrarMensajePopUpError('10219_007', IdiomaUsuario, null);
						}
					},
					function (error) {
						  FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					});
			},
			function (error) {
                
            });
    },	
	
	IntegrarCancelacionComponentesConSAP: function (entityForm) {
		var guidOperacion = entityForm.entity.properties.atos_operacionid.id;
        var idMsjeInfo = "10219_009";
		 var listadoTipo_L = 300000001;
		 var integradoConSAP = 300000001;
        var activo = "0";
        var codigoPermisoAutorizado = "A";
		
		var tipoListadoMaterial = entityForm.entity.properties.atos_listadematerial;
		if (tipoListadoMaterial != listadoTipo_L)
		{
			MostrarMensajePopUpError('10219_017', IdiomaUsuario, null);
			return;
		}        

        var validacionOK = ValidarCamposObligatoriosComponenteCancelacion(IdiomaUsuario,entityForm);
        if (validacionOK != "") {
            MostrarMensajePopUpError('10219_004', IdiomaUsuario, validacionOK);
            return;
        }
		
		var ordenTrabajo = entityForm.entity.properties.atos_ordendetrabajoid;
		var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
      

		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
				function success(resultOT) {	
				  if (resultOT[0][1] != integradoConSAP) {
					//La orden de trabajo no está integrada con SAP
					MostrarMensajePopUpError('10111_021', IdiomaUsuario, null);
					return;
				  }			
				var fetchAutoriz = ObtenerFetchDeMensajeAutorizacionesOT(ordenTrabajo.id, activo);			
				//Comprobamos si tiene autorizacion
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
					function success(resultadoAut) {
					   //AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
					   //if ((FS.ComponenteOperacion.estaAutorizada(resultadoAut) || FS.ComponenteOperacion.EsUbicacionAmericana(UTname) == true) && liberada ) {
					   if (liberada){
							//Si encontró alguno quiere decir que está Autorizada
							var literales = Literales(IdiomaUsuario);
							var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
							MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
								function success(result) {
									var popup;
									if (IdiomaUsuario == Idioma.ingles) {
										/// Add the buttons for message box
										popup = new MobileCRM.UI.MessageBox(result[0][1]);
										popup.items = ["Yes", "No"];
									}
									else {
										popup = new MobileCRM.UI.MessageBox(result[0][2]);
										popup.items = ["Si", "No"];

									}
									popup.multiLine = true;		
									var literales = Literales(IdiomaUsuario);
									
									
									popup.show(
										function (button) {
											if (button == "Yes" || button == "Si") {
												
												var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
												componente.id = entityForm.entity.id;
												componente.isNew =false;
												componente.properties.atos_estatusconfirmacion = 300000002;
												componente.properties.atos_enviarasap = true;
												componente.properties.atos_origen = 300000002;
												
												MobileCRM.UI.EntityForm.requestObject(
													function (entityForm) {
														entityForm.entity.properties.atos_estatusconfirmacion = 300000002;
														FS.ComponenteOperacion.ActivarConfirmacion(entityForm,true);
													},
													FS.CommonEDPR.onError,
													null
												);
												
												componente.save(
													function (err) {
														if (err) {
															MobileCRM.UI.MessageBox.sayText(err);
														}
														else {
															MobileCRM.UI.MessageBox.sayText( literales.cancelacionEnviada);
														}
													}
												);
											}
											else {
												return;
											}
										});		                           

								},

								function (error) {
									
										FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
								});
						} else {
							//mensaje por si no tiene autorizaciones
							MostrarMensajePopUpError('10219_007', IdiomaUsuario, null);
						}
					},

					function (error) {
						
					});
            },

            function (error) {
                
            });			

    },	
	
}

function Literales(idioma) {
     if (idioma != Idioma.ingles) {
        return {
            confirmacionEnviada: " Confirmación de componentes enviadas a SAP",
			componenteBorrado: " Componente borrado",
            confirmacion: "Confirmación",
            cancelacionEnviada: " Cancelación de componentes enviadas a SAP",
            cancelacion: "Cancelación",
            campoObligatorio: "*Campos obligatorios*",
            fechaRealMayorFecha: "*FechaFinReal mayor Fecha actual*",
            fechaConfirmacion: "*FechaConfirmación mayor Fecha actual*",
            autorizaLiberacion: "*Compruebe autorización y liberación de OT*",
            errorOperacion: "--Error en Componente:",
            noExisteEntorno: "No Existe Entorno",
            errorSerializacion: "Error al serializar",
            contacteAdministrador: "Contacte con administrador",
            errorObtenerAutorizacion: "*Error al obtener autorización*",
			liberacion: "*La OT no está liberada*",
            ListadoDeMateriales: "*Tipo de posision no es: L en lista, quite esta operación*"

        }
    } else {
        return {
            confirmacionEnviada: " Confirmation good movement send to SAP",
			componenteBorrado: " Deleted component",
            confirmacion: "Confirmation",
            cancelacionEnviada: " Cancelation good movement send to SAP",
            cancelacion: "Cancelation",
            campoObligatorio: "*Mandatory fields*",
            fechaRealMayorFecha: "*actual date is lower than real end date*",
            fechaConfirmacion: "*actual date is lower than confirmation date*",
            autorizaLiberacion: "*Check the authorization or release of WO*",
            errorOperacion: "--Error, component:",
            noExisteEntorno: "doesn't exist environment",
            errorSerializacion: "serialization Error",
            contacteAdministrador: "Contact the administrator",
            errorObtenerAutorizacion: "*Error to get the authorization*",
			liberacion: "*The work order isn't released*",
            ListadoDeMateriales: "*Item category isn't: L Stock item-*"
        }
    }

}

function ObtenerFetchDeMensajeAMostrar(idMsjeInfo) {
    var fetchXml =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
					"<entity name='atos_coleccionerrores'>" +
					"<attribute name='atos_coleccionerroresid' />" +
					"<attribute name='atos_descripcion_en' />" +
					"<attribute name='atos_descripcion_es' />" +
					"<attribute name='atos_tipoerror' />" +
					"<order attribute='atos_codigo' descending='false' />" +
					"<filter type='and'>" +
					"<condition attribute='atos_codigo' operator='eq' value='" + idMsjeInfo + "' />" +
					"</filter>" +
					"</entity>"+
					 "</fetch>";
    return fetchXml;
}

function ObtenerFetchDeMensajeAutorizaciones(idOrdenTrabajo, activo, codigoPermisoAutorizado) {
    
    var fetchXml =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
					"<entity name='atos_autorizacion'>" +
					"<attribute name='atos_name' />" +
					"<attribute name='createdon' />" +
					"<attribute name='atos_autorizacionid' />" +
					"<attribute name='atos_ordendetrabajoid' />" +
					"<order attribute='atos_name' descending='false' />" +
					"<filter type='and'>" +
					"<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + idOrdenTrabajo + "' />" +
					"<condition attribute='statecode' operator='eq' value='" + activo + "' />" +
					"<condition attribute='atos_autorizadoporid' operator='not-null' />" +
					"</filter>" +
					"<link-entity name='atos_tipodepermiso' from='atos_tipodepermisoid' to='atos_tipodepermisoid' link-type='inner' alias='ag'>" +
					"<filter type='and'>" +
					"<condition attribute='atos_codigo' operator='eq' value='" + codigoPermisoAutorizado + "' />" +
					"</filter>" +
					"</link-entity>" +
					"<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' visible='false' link-type='inner' alias='OT'>" +
					"<attribute name='atos_liberarorden' />" +
					"</link-entity>" +
					"</entity>"+
					"</fetch>";					
    return fetchXml;
}

function ObtenerFetchDeMensajeAutorizacionesOT(idOrdenTrabajo, activo) {
    debugger;
    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
					"<entity name='atos_autorizacion'>" +
					"<attribute name='atos_name' />" +
					"<attribute name='createdon' />" +
					"<attribute name='atos_autorizacionid' />" +
					"<attribute name='atos_ordendetrabajoid' />" +
					"<attribute name='atos_autorizadoporid' />" +
					"<order attribute='atos_name' descending='false' />" +
					"<filter type='and'>" +
					"<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + idOrdenTrabajo + "' />" +
					"<condition attribute='statecode' operator='eq' value='" + activo + "' />" +
					"</filter>" +
					"<link-entity name='atos_tipodepermiso' from='atos_tipodepermisoid' to='atos_tipodepermisoid' link-type='inner' alias='Permiso'>" +
					"<attribute name='atos_codigo' />" +
					"</link-entity>" +
					"<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' visible='false' link-type='inner' alias='OT'>" +
					"<attribute name='atos_liberarorden' />" +
					"<link-entity name='account' from='accountid' to='msdyn_serviceaccount' visible='false' link-type='outer' alias='UT' >" +
					"<attribute name='name' />" +
					"</link-entity>" +
					"</link-entity>" +
					"</entity>" +
					"</fetch>";
    
    return fetchXml;
}

function FetchDeMensajePendienteIntegrar(idOrdenTrabajo) {
    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
					"<entity name='atos_pendienteintegrarconsap'>" +
					"<attribute name='atos_operacion' />" +
					"<attribute name='atos_guidobjeto' />" +
					"<attribute name='atos_estadointegracion' />" +
					"<attribute name='atos_pendienteintegrarconsapid' />" +
					"<order attribute='atos_guidobjeto' descending='false' />" +
					"<filter type='and'>" +
					"<condition attribute='atos_guidobjeto' operator='eq' value='" + idOrdenTrabajo + "' />" +
					"</filter>" +
					"</entity>" +
					"</fetch>";
   
    return fetchXml;
}

function ObtenerFetchOT(OTid) {
    var fetchXml =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
					"<entity name='msdyn_workorder'>" +
					"<attribute name='atos_liberarorden' />" +
					"<attribute name='atos_estadosintegracionsap' />" +
					"<filter type='and'>" +
					"<condition attribute='msdyn_workorderid' operator='eq' value='" + OTid + "' />" +
					"</filter>" +
					"</entity>" +
					"</fetch>"; 
   
    return fetchXml;
}


function MostrarMensajePopUpError(idMsjeInfo, idioma, restoMensaje) {
    IdiomaFormulario = idioma;
    var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
    	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
        function success(result) {
            var texto;
            if (IdiomaFormulario == Idioma.espanol) {
                if (restoMensaje == null)
                    texto = result[0][2];
                else
                    texto = result[0][2].replace('{0}',restoMensaje);
            }
            else {
                           if (restoMensaje == null)
                    texto = result[0][1];
                else
                    texto = result[0][1].replace('{0}',restoMensaje);
            }
			MobileCRM.UI.MessageBox.sayText(texto);
        },
        function (error) { 
			FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
		});
}

function ValidarCamposObligatoriosComponente(IdiomaFormulario,entityForm) {
    var respuesta = "";
	var confirmado = 300000001;
	
    try {
        if (entityForm.entity.properties.atos_ordendetrabajoid  == null ) {
            if (IdiomaFormulario == 3082)
                respuesta = "Orden de trabajo";
            else
                respuesta = "Work order";
        }

        if ( entityForm.entity.properties.atos_operacionid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Operación";
                else
                    respuesta = "Operation";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Operación";
                else
                    respuesta = respuesta + ", Operation";
        }

        if ( entityForm.entity.properties.atos_materialid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Material";
                else
                    respuesta = "Material";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Material";
                else
                    respuesta = respuesta + ", Material";
        }

        if (entityForm.entity.properties.atos_posicion  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Posición";
                else
                    respuesta = "Position";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Posición";
                else
                    respuesta = respuesta + ", Position";
        }

        if (entityForm.entity.properties.atos_cantidad == null ) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Cantidad";
                else
                    respuesta = "Quantity";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Cantidad";
                else
                    respuesta = respuesta + ", Quantity";
        }

        if (entityForm.entity.properties.atos_unidademedidaid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Unidad de medida";
                else
                    respuesta = "Unity of measure";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Unidad de medida";
                else
                    respuesta = respuesta + ", Unity of measure";
        }

        if (entityForm.entity.properties.atos_centroid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Centro confirmación";
                else
                    respuesta = "Center confirmation";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Centro confirmación";
                else
                    respuesta = respuesta + ", Center confirmation";
        }

        if (entityForm.entity.properties.atos_almacenid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Almacén";
                else
                    respuesta = "Storage location";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Almacén";
                else
                    respuesta = respuesta + ", Storage location";
        }

//        if (entityForm.entity.properties.atos_fechacontabilidad == null) {
//            if (respuesta == "")
//                if (IdiomaFormulario == 3082)
//                    respuesta = "Fecha contabilidad conf.";
//                else
//                    respuesta = "ConfirmationAccounting date";
//            else
//                if (IdiomaFormulario == 3082)
//                    respuesta = respuesta + ", Fecha contabilidad conf.";
//                else
//                    respuesta = respuesta + ", ConfirmationAccounting date";
//        }

        if (entityForm.entity.properties.atos_listadematerial == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Tipo de posición";
                else
                    respuesta = "Item category";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Tipo de posición";
                else
                    respuesta = respuesta + ", Item category";
        }
		
		
		if (entityForm.entity.properties.atos_cantidadadconfirmacion == null ||  entityForm.entity.properties.atos_cantidadadconfirmacion < 0) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Cantidad confirmación (debe ser mayor que cero)";
                else
                    respuesta = "Quantity confirmation (must to be greater than cero)";
            else
                if (IdiomaFormulario == 3082)
                   respuesta = respuesta + ", Cantidad confirmación";
                else
                   respuesta = respuesta + ", Quantity confirmation";
        }
		

        return respuesta;
    } catch (e) {
        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
    }
}

function ValidarCamposObligatoriosComponenteCancelacion(IdiomaFormulario,entityForm) {
    var respuesta = "";
    try {
		
		   var confirmado = 300000001;
		   
        if (entityForm.entity.properties.atos_ordendetrabajoid  == null) {
            if (IdiomaFormulario == 3082)
                respuesta = "Orden de trabajo";
            else
                respuesta = "Work order";
        }

        if (entityForm.entity.properties.atos_operacionid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Operación";
                else
                    respuesta = "Operation";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Operación";
                else
                    respuesta = respuesta + ", Operation";
        }

        if (entityForm.entity.properties.atos_materialid  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Material";
                else
                    respuesta = "Material";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Material";
                else
                    respuesta = respuesta + ", Material";
        }

        if (entityForm.entity.properties.atos_posicion  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Posición";
                else
                    respuesta = "Position";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Posición";
                else
                    respuesta = respuesta + ", Position";
        }

        if (entityForm.entity.properties.atos_fechacontabilidad  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Fecha contabilidad conf.";
                else
                    respuesta = "ConfirmationAccounting date";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Fecha contabilidad conf.";
                else
                    respuesta = respuesta + ", ConfirmationAccounting date";

        }

        if (entityForm.entity.properties.atos_documentodeconfirmacion  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Documento de confirmación";
                else
                    respuesta = "Document confirmation";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Documento de confirmación";
                else
                    respuesta = respuesta + ", Document confirmation";
        }

        if (entityForm.entity.properties.atos_aniodocumentoconfirmacion  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Año del documento de Confirmación";
                else
                    respuesta = "Year of the confirmation document";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Año del documento de Confirmación";
                else
                    respuesta = respuesta + ", Year of the confirmation document";
        }

        if (entityForm.entity.properties.atos_flagcancelado  == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "Cancelado";
                else
                    respuesta = "Cancelled";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + ", Cancelado";
                else
                    respuesta = respuesta + ", Cancelled";
        }

		
		  if ( entityForm.entity.properties.atos_estatusconfirmacion == null ||entityForm.entity.properties.atos_estatusconfirmacion != confirmado) {

            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "--El componente no está confirmado-- ";
                else
                    respuesta = "--The component isn't confirmed-- ";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + " *--El componente no está confirmado--*";
                else
                    respuesta = respuesta + " *--The component isn't confirmed--*";
        }
		
		
		
 //       if (entityForm.entity.properties.atos_documentodecancelacion == null) {
 //           if (respuesta == "")
 //               if (IdiomaFormulario == 3082)
 //                   respuesta = "Documento de cancelación";
 //               else
 //                   respuesta = "Cancelled document";
 //           else
 //               if (IdiomaFormulario == 3082)
 //                   respuesta = respuesta + ", Documento de cancelación";
 //               else
 //                   respuesta = respuesta + ", Cancelled document";
 //       }

        return respuesta;
    } catch (e) {
        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
    }
}






      


