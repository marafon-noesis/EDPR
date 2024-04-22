if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (ComponenteOperacion) == "undefined") { ObjetoOrdenTrabajo = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
//#endregion
 

FS.ObjetoOrdenTrabajo = {
    // funci?n  que se lanza cuando se carga la pantalla de  objeto de referencia de orden de trabajo y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    ObjetoOrdenTrabajoOnLoad: function () {
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
    },
    // funci?n  que se lanza cuando se carga el objeto de referencia de orden de trabajo
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var objetoOT = entityForm.entity;
		
			
		 // creamos la definicion del confirmar horas
        MobileCRM.UI.EntityForm.onCommand(
            "custom_delete",
            function (entityForm) {
				FS.ObjetoOrdenTrabajo.BorradoObjetoOrdenDeTrabajo(entityForm);              
				
            },
            true
        );
		
		
    },
    // función  que se lanza cuando se guarda el componente de operaciones 
    //...
    // AAC 07-11-2018
    onSave: function (entityForm) {
        var self = this;
       
		
    },
    // función  que se encarga de rediriguir todos los onchange de los  componente de operaciones 
    // AAC 07-11-2018
    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;

      	
		// AVISO
		if (changedItem == "atos_avisoid") {
			if (entityForm.entity.properties.atos_avisoid!=null){
				self.OnchageAviso(entityForm);
			}
			else {
				self.LimpiarForm(entityForm);	
			}
        }	
         // UBICACION EQUIPO
		if (changedItem == "atos_ubicaciontecnicaid") {
			if (entityForm.entity.properties.atos_ubicaciontecnicaid!=null){
				self.OnchageUbicacion(entityForm);
			}
			else {
				self.LimpiarForm(entityForm);	
			}
        }	
	    // 
		if (changedItem == "atos_equipoid") {
		if (entityForm.entity.properties.atos_equipoid!=null){	
				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						var dv = entityForm.getDetailView("General");
						dv.getItemByName("atos_avisoid").isEnabled = false;
						dv.getItemByName("atos_ubicaciontecnicaid").isEnabled = false;
						dv.getItemByName("atos_equipoid").isEnabled = true;
						entityForm.entity.properties.atos_avisoid = null;
						entityForm.entity.properties.atos_ubicaciontecnicaid = null;
				
					},
					FS.CommonEDPR.onError,
					null
				);
			}
			else {
				self.LimpiarForm(entityForm);	
			}
        }
        
		
    },
	
	OnchageAviso: function (entityForm) {
		
		var fetchXmlAviso;
		var avisoId = entityForm.entity.properties.atos_avisoid.id;
	    fetchXmlAviso = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>  " +
                "<entity name='atos_aviso'>                                 " +
                "    <attribute name='atos_name'/>                          " +
				"    <attribute name='atos_ubicaciontecnicaid'/>            " +
				"    <attribute name='atos_equipoid'/>                       " +
                "    <attribute name='atos_avisoid'/>                       " +
    			"<filter type='and'>										" +
				"	<condition attribute='atos_avisoid' operator='eq' value='" + avisoId +"' />" +
				"</filter>													" +	
                "</entity>                                                  " +
                "</fetch>";

		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlAviso,
			function (result) {

				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						var dv = entityForm.getDetailView("General");
						dv.getItemByName("atos_avisoid").isEnabled = true;
						dv.getItemByName("atos_ubicaciontecnicaid").isEnabled = false;
						dv.getItemByName("atos_equipoid").isEnabled = false;
						entityForm.entity.properties.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", result[0][1].id, result[0][1].primaryName);
						 var ubiId = result[0][1].id;
						if (result[0][2] != null)
						{
							entityForm.entity.properties.atos_equipoid = new MobileCRM.Reference("msdyn_customerasset", result[0][2].id, result[0][2].primaryName);
						}else 
						{
							entityForm.entity.properties.atos_equipoid = null;
						}
							
					},
					FS.CommonEDPR.onError,
					null
				);

			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		 );		
	},
	
	OnchageUbicacion: function (entityForm) {
		
		var fetchXmlEquipos;
		var ubicacionId = entityForm.entity.properties.atos_ubicaciontecnicaid.id;
		fetchXmlEquipos = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
								"  <entity name='msdyn_customerasset'>" +
								"    <attribute name='msdyn_customerassetid' />" +
								"    <attribute name='msdyn_product' />" +								
								"    <attribute name='msdyn_name' />" +								
								"    <filter type='and'>" +
								"      <condition attribute='msdyn_account' operator='eq' value='" + ubicacionId +"' />" +
								"    </filter>" +
								"  </entity>" +
								"</fetch> ";		

		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlEquipos,
			function (result) {

				MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						entityForm.entity.properties.atos_avisoid = null;
						
						var dv = entityForm.getDetailView("General");
						dv.getItemByName("atos_avisoid").isEnabled = false;
						dv.getItemByName("atos_ubicaciontecnicaid").isEnabled = true;
						dv.getItemByName("atos_equipoid").isEnabled = false;
						if (result.length != 1) {
							entityForm.entity.properties.atos_equipoid = null;
						}
						else {
							entityForm.entity.properties.atos_equipoid = new MobileCRM.Reference("msdyn_customerasset", result[0][1], result[0][2]);
						}

					},
					FS.CommonEDPR.onError,
					null
				);

			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		 );
	},
	// realiza el borrado logico del objeto de referencia
	BorradoObjetoOrdenDeTrabajo: function (entityForm) {
		try {
			var popup;
			if (IdiomaUsuario == Idioma.ingles) {
				/// Add the buttons for message box
				popup = new MobileCRM.UI.MessageBox("Do you like to delete object  reference selected?");
				popup.items = ["Yes", "No"];
				
			}
			else {
				popup = new MobileCRM.UI.MessageBox("¿Desea borrar el objeto de referencia seleccionado?");
				popup.items = ["Si", "No"];
			}
		
		
			popup.multiLine = true;
			popup.show(
				function (button) {
					if (button == "Yes" || button == "Si") {
						// realizamos el borrado logico de objeto de referencia
						entityForm.entity.properties.atos_indiciadordeborrado = true;
						entityForm.entity.properties.statecode = 1;
						entityForm.entity.properties.statuscode = 2;
						MobileCRM.UI.EntityForm.saveAndClose();
					}
				}
			);		
		}
		catch (err) {
			FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
		}		
	},
	LimpiarForm: function (entityForm){
		
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					var dv = entityForm.getDetailView("General");
					dv.getItemByName("atos_avisoid").isEnabled = true;
					dv.getItemByName("atos_ubicaciontecnicaid").isEnabled = true;
					dv.getItemByName("atos_equipoid").isEnabled = true;
					
					entityForm.entity.properties.atos_avisoid = null;
					entityForm.entity.properties.atos_ubicaciontecnicaid = null;
					entityForm.entity.properties.atos_equipoid = null;
			
				},
				FS.CommonEDPR.onError,
				null
			);
		
		
	} ,
	
}


      


