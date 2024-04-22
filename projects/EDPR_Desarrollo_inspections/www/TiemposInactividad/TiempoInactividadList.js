var FS = FS || {};

var MensajeOperacion = "";
var MensajeTotal = "";
var error = false;

FS.TiempoInactividadList = {
	
	
   TiempoInactividadListOnLoad: function () {
		
		 // se coge el idioma
        MobileCRM.Localization.getLoadedLangId(
            function (loadedLangId) {
                FS.CommonEDPR.localization(loadedLangId);
				
            },
            FS.CommonEDPR.onError,
            null
        );
		
	
		
        MobileCRM.UI.EntityList.onCommand(
           "custom_clonar",
           function (entityList) {
			   error = false;
			   MensajeTotal = "";
		       for (var i in entityList.context.entities) {
					var tiempoInactividad = entityList.context.entities[i];
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					FS.TiempoInactividadList.ClonarTiempoInactividad(tiempoInactividad,ultimo);
			   }
           },
           true, null
       );
	   
        MobileCRM.UI.EntityList.onCommand(
           "Delete",
           function (entityList) {
		       for (var i in entityList.context.entities) {
					var tiempoInactividad = entityList.context.entities[i];
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					FS.TiempoInactividadList.DeleteTiempoInactividad(tiempoInactividad,ultimo);
			   }
           },
           true, null
       );



    },
	
	
	
	
	ClonarTiempoInactividad: function (entity,ultimo) {
		try {
			
			
				// tiempo de inactividad
				var newTiempoInactividad = new MobileCRM.DynamicEntity.createNew("atos_tiempoinactividad");
				var props = newTiempoInactividad.properties;
				if (entity.properties.atos_avisoid != null)
					props.atos_avisoid = entity.properties.atos_avisoid;
				if (entity.properties.atos_ordendetrabajoid != null)
					props.atos_ordendetrabajoid = entity.properties.atos_ordendetrabajoid;
				props.atos_ubicaciontecnicaid = entity.properties.atos_ubicaciontecnicaid;
				props.atos_fechainicio = new Date();
				props.atos_fechafin = new Date();
				props.atos_name = entity.properties.atos_name;
				props.atos_horastotalesinactividad =0;
			
				
				newTiempoInactividad.save(
					function (err) {
						if (err) {
							//MobileCRM.UI.MessageBox.sayText(err);
						}
						else {
							// guardamos los valores  cambiados de los checks
							MobileCRM.UI.EntityList.reload();
							

						}
					}
				);
			
			
            
        } catch (error) {

            console.log("**ERROR Metodo: ClonarTiempoInactividad");
            Atos.Helper.GetErrorCollectionByCode('JS_001');
        }
    },


	DeleteTiempoInactividad: function (entity,ultimo) {
		try {
			
				
				MobileCRM.DynamicEntity.deleteById("atos_tiempoinactividad", entity.id,
						function (res) {
							MobileCRM.UI.EntityList.reload();
							FS.TiempoInactividadList.ComprobarTiemposInactividad(entity);

						},
						function (err) {
						alert("An Error has occurred \n" + err);
						},
				null);
            
        } catch (error) {

            console.log("**ERROR Metodo: DeleteTiempoInactividad");
            Atos.Helper.GetErrorCollectionByCode('JS_001');
        }
    },
	
	
	
	ComprobarTiemposInactividad: function (entity) {
		
		if  (entity.properties.atos_avisoid != null){
			
			
			var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
						   "<entity name='atos_tiempoinactividad'>" +
						   "<attribute name='atos_tiempoinactividadid'/>" +
						   "<filter type='and'>" +
						   "<condition attribute='atos_avisoid' operator='eq' value='" + entity.properties.atos_avisoid.id + "'/>" +
						   "</filter>" +
						   "</entity>" +
						   "</fetch>";		
	 
			
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
				function (result) {
					if (result.length ==0){
										
					// tiempo de inactividad
						var Aviso = new MobileCRM.DynamicEntity.createNew("atos_aviso");
						Aviso.id = entity.properties.atos_avisoid.id;
						Aviso.isNew = false;
						var props = Aviso.properties;
						props.atos_subestacion = false;
						props.atos_lineademt = false;
						props.atos_aerogenerador = false;
					
						Aviso.save(
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
					
					
				 },
				function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				null
			);
			
			
			
		}
		if (entity.properties.atos_ordendetrabajoid != null) {
		
			var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
						   "<entity name='atos_tiempoinactividad'>" +
						   "<attribute name='atos_tiempoinactividadid'/>" +
						   "<filter type='and'>" +
						   "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + entity.properties.atos_ordendetrabajoid.id + "'/>" +
						   "</filter>" +
						   "</entity>" +
						   "</fetch>";		
	 
			
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
				function (result) {
					if (result.length ==0){
										
					// tiempo de inactividad
						var OrdenDeTrabajo = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
						OrdenDeTrabajo.id = entity.properties.atos_ordendetrabajoid.id;
						OrdenDeTrabajo.isNew = false;
						var props = OrdenDeTrabajo.properties;
						props.atos_subestacion = false;
						props.atos_lineademt = false;
						props.atos_aerogenerador = false;
					
						OrdenDeTrabajo.save(
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
					
					
				 },
				function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				null
			);
		}		
	},
	
};

