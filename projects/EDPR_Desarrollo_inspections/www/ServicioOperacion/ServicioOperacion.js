if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (ServicioOperacion) == "undefined") { ServicioOperacion = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
var enviarOT_A_SAP = false;
//#endregion


FS.ServicioOperacion = {
    // funci?n  que se lanza cuando se carga la pantalla de  servicio de operaciones  y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    ServicioOperacionOnLoad: function () {
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
    // funci?n  que se lanza cuando se carga el servicio de operaciones 
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var servicio = entityForm.entity;
		
		var dv = entityForm.getDetailView("General");
		//dv.getItemByName("atos_ordendetrabajoid").isEnabled = false;
		
        if (servicio.isNew) {
			enviarOT_A_SAP = true;
			FS.ServicioOperacion.CreateServicio(entityForm);
            ///obtenemos el valor de la OT y se  la asignamos si podemos
			if (entityForm.entity.properties.atos_operacionid != null) {
				var operacionId = entityForm.entity.properties.atos_operacionid.id;
				var varFetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'> " +
					" <entity name='msdyn_workorderservicetask'>" +
					"   <attribute name='msdyn_workorder'/>" +
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

           
        }
	
    },
	
	 CreateServicio: function (entityForm) {
		  var OTId = entityForm.entity.properties.atos_ordendetrabajoid.id;
		 
		  var fetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
								"<entity name='msdyn_workorder'>"+ 
								"<attribute name='atos_puestotrabajoprincipalid'/>" +
								"<attribute name='atos_centroid'/>" +
								"<attribute name='msdyn_serviceaccount'/>" +
								"<attribute name='msdyn_customerasset'/>" +
								"<attribute name='transactioncurrencyid'/>" +
								"<filter type='and'>" +
								"<condition attribute='msdyn_workorderid' value='" + OTId + "' operator='eq'/>" +
								"</filter>" +
								"</entity>" +
								"</fetch>";
		     MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                    function (result) {
                        for (var i in result) {
							//SELECCION DE MONEDA
							if (result[i][4] != null) {
								 entityForm.entity.properties.transactioncurrencyid = new MobileCRM.Reference(result[i][4].entityName, result[i][4].id, result[i][4].primaryName);
							}
						}
						 },
                    function (err) {
                        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
                    },
                    entityForm
                );
								
		 
	 },
	
    // función  que se lanza cuando se guarda el servicio de operaciones 
    //...
    // AAC 07-11-2018
    onSave: function (entityForm) {
        var self = this;
		entityForm.entity.properties.atos_origen = 300000002;
       
		
    },
	onPostSave: function (entityForm) {
        var self = this;
		//this.CalcularHorasTotales(entityForm);	

		var sincronizando = 3;
        var noEnviado = 2;
        try {
            if (enviarOT_A_SAP) {  
				var ordenTrabajo = entityForm.entity.properties.atos_ordendetrabajoid;
				//FS.ServicioOperacion.actualizarOTEnvioSAP(ordenTrabajo.id,entityForm );			
               
            }
        }
        catch (err) {
           	FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
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

      
    },
		
}


      


