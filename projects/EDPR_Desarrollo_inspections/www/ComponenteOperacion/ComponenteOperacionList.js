var FS = FS || {};

var MensajeComponente = "";
var MensajeTotal = "";
var usuarioSys;
var error = false;
var permiso = false; 



FS.ComponenteOperacionList = {
    ComponenteOperacionListOnLoad: function () {

					// se coge el idioma
		MobileCRM.Localization.getLoadedLangId(
			function (loadedLangId) {
				FS.CommonEDPR.localization(loadedLangId);
				
			},
			FS.CommonEDPR.onError,
			null
		);

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
				  permiso = true;
				}
				else{
				  permiso = false;
				}
            },
            function (err) {
					// lanzar mensaje de que no se tiene permiso
				  permiso = false;
            },
            null
        );   
	
        MobileCRM.UI.EntityList.onCommand(
           "custom_aprobar",
           function (entityList) {
			   error = false;
			   MensajeTotal = "";
			   
			   if (permiso == false){
				   if (IdiomaUsuario == 3082) 
						MobileCRM.UI.MessageBox.sayText("No tiene permisos para realizar esta operación.");
				    else 
						MobileCRM.UI.MessageBox.sayText("You do not have permissions to perform this action.");				   
				   return;
			   }
			   
  		       for (var i in entityList.context.entities) {
					var componente = entityList.context.entities[i];
					MensajeComponente =="";// operacion.properties.atos_numerooperacioncrm; 
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					 var OTId = componente.properties.atos_ordendetrabajoid.id;
			 
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
							    var liberada = false;  
								var Utname	="";							
								if (result[i][1]!= null )
									UTname = result[i][1].primaryName;
								if (result[i][1]!= null )
									liberada = result[i][0];
									FS.ComponenteOperacionList.IntegrarConfirmacionComponentesConSAP(componente,ultimo,liberada,UTname);
						}
					},
					function (err) {
						FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					},
						null
					);
			   }
           },
           true, null
       );
	   
	   MobileCRM.UI.EntityList.onCommand(
           "custom_cancelar",
           function (entityList) {
			   error = false;
			   MensajeTotal = "";
			   
			    if (permiso == false){
				   if (IdiomaUsuario == 3082) 
						MobileCRM.UI.MessageBox.sayText("No tiene permisos para realizar esta operación.");
				    else 
						MobileCRM.UI.MessageBox.sayText("You do not have permissions to perform this action.");
				   return;
			   }
			   
  		       for (var i in entityList.context.entities) {
					var componente = entityList.context.entities[i];
					MensajeComponente == "";// operacion.properties.atos_numerooperacioncrm; 
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					 var OTId = componente.properties.atos_ordendetrabajoid.id;
			 
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
							    var liberada = false;  
								var Utname	="";							
								if (result[i][1]!= null )
									UTname = result[i][1].primaryName;
								if (result[i][1]!= null )
									liberada = result[i][0];
									FS.ComponenteOperacionList.IntegrarCancelacionComponentesConSAP(componente,ultimo,liberada,UTname);
						}
					},
					function (err) {
						FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
					},
						null
					);					
			   }              
           },
           true, null
       );
	   
	   	   MobileCRM.UI.EntityList.onCommand(
           "custom_borrarComponentes",
           function (entityList) {
			   error = false;
			   MensajeTotal = "";
			   
			  
			   
  		       for (var i in entityList.context.entities) {
					var componente = entityList.context.entities[i];
					MensajeComponente == "";// operacion.properties.atos_numerooperacioncrm; 
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					 var OTId = componente.properties.atos_ordendetrabajoid.id;
					FS.ComponenteOperacionList.BorrarComponentes(componente,ultimo);
				
			   }              
           },
           true, null
       );
	   
	   
	   
	   
    },
	
	
	
	BorrarComponentes: function (entity ,ultimo  ) {
		var literales = Literales(IdiomaUsuario);
		var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
		componente.id = entity.id;
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
					if (ultimo){
						MobileCRM.UI.MessageBox.sayText(literales.componenteBorrado);
						MobileCRM.UI.EntityList.reload();
					}
				}
			}
		);
		
	},
	
	IntegrarConfirmacionComponentesConSAP: function (entity ,ultimo ,liberada ,UTname ) {
        
        var guidOperacion = entity.properties.atos_operacionid.id;
        var idMsjeInfo = "10219_003";
		var listadoTipo_L = 300000001;
		var integradoConSAP = 300000001;
        var activo = "0";
        var codigoPermisoAutorizado = "A";
		
		  var tipoListadoMaterial = entity.properties.atos_listadematerial;
          if (tipoListadoMaterial != listadoTipo_L)
          {
              MostrarMensajePopUpError('10219_017', IdiomaUsuario,entity.properties.atos_posicion, null,ultimo);
              return;
          }
		
        var validacionOK = ValidarCamposObligatoriosComponente(IdiomaUsuario,entity);
        if (validacionOK != "") {
            MostrarMensajePopUpError('10219_004', IdiomaUsuario,entity.properties.atos_posicion, validacionOK,ultimo);
            return;
        }
        var ordenTrabajo = entity.properties.atos_ordendetrabajoid;
		var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
            function success(resultOT) {
				if (resultOT[0][1] != integradoConSAP) {
					//La orden de trabajo no está integrada con SAP
					MostrarMensajePopUpError('10111_021', IdiomaUsuario,entity.properties.atos_posicion ,null,ultimo);
					return;
				}					
				var fetchAutoriz = ObtenerFetchDeMensajeAutorizacionesOT(ordenTrabajo.id, activo);
				//Comprobamos si tiene autorizacion
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
					function success(resultadoAut) {
						//AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
						//if ((FS.ComponenteOperacionList.estaAutorizada(resultadoAut)|| FS.ComponenteOperacionList.EsUbicacionAmericana(UTname) == true) && liberada ) {
						if (liberada){
							//Si encontró alguno quiere decir que está Autorizada
							var literales = Literales(IdiomaUsuario);
							var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
							componente.id = entity.id;
							componente.isNew =false;
							componente.properties.atos_estatusconfirmacion = 300000001;
							componente.properties.atos_enviarasap = true;
							componente.properties.atos_fechacontabilidad = new Date();
							componente.properties.atos_origen = 300000002;
							
							
							componente.save(
								function (err) {
									if (err) {
										MensajeTotal = MensajeTotal + entity.properties.atos_posicion + ":"  + err + "\r\n";
									}
									else {
										if (ultimo && error) {
											MobileCRM.UI.MessageBox.sayText(MensajeTotal);  
										}
										else {
											MobileCRM.UI.MessageBox.sayText( literales.confirmacionEnviada);
										}
										MobileCRM.UI.EntityList.reload();
									}							
								}
							);					
						} else {
							//mensaje por si no tiene autorizaciones o no esta liberada
							MostrarMensajePopUpError('10219_007', IdiomaUsuario,entity.properties.atos_posicion, null,ultimo);
						}
					},
					function (error) {
						
					});
            },
            function (error) {
                
            });			
    },	
	
	IntegrarCancelacionComponentesConSAP: function (entity ,ultimo ,liberada ,UTname ) {
		var guidOperacion = entity.properties.atos_operacionid.id;
        var idMsjeInfo = "10219_009";
		var listadoTipo_L = 300000001;
		var integradoConSAP = 300000001;
        var activo = "0";
        var codigoPermisoAutorizado = "A";
		
		var tipoListadoMaterial = entity.properties.atos_listadematerial;
		if (tipoListadoMaterial != listadoTipo_L)
		{
			MostrarMensajePopUpError('10219_017', IdiomaUsuario,entity.properties.atos_posicion, null,ultimo);
			return;
		}        

        var validacionOK = ValidarCamposObligatoriosComponenteCancelacion(IdiomaUsuario,entity);
        if (validacionOK != "") {
            MostrarMensajePopUpError('10219_004', IdiomaUsuario, entity.properties.atos_posicion,validacionOK,ultimo);
            return;
        }
		
		var ordenTrabajo = entity.properties.atos_ordendetrabajoid;
		var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
		    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
            function success(resultOT) {
				if (resultOT[0][1] != integradoConSAP) {
					//La orden de trabajo no está integrada con SAP
					MostrarMensajePopUpError('10111_021', IdiomaUsuario,entity.properties.atos_posicion ,null,ultimo);
					return;
				}					
				var fetchAutoriz = ObtenerFetchDeMensajeAutorizacionesOT(ordenTrabajo.id, activo);
				//Comprobamos si tiene autorizacion
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
					function success(resultadoAut) {
					   //if ((FS.ComponenteOperacionList.estaAutorizada(resultadoAut) || FS.ComponenteOperacionList.EsUbicacionAmericana(UTname) == true) && liberada ) {
						//AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones						   
						if (liberada ) {
							//Si encontró alguno quiere decir que está Autorizada
							var literales = Literales(IdiomaUsuario);
							var componente = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
							componente.id = entity.id;
							componente.isNew =false;
							componente.properties.atos_estatusconfirmacion = 300000002;
							componente.properties.atos_enviarasap = true;
							componente.properties.atos_origen = 300000002;
							
							
							componente.save(
								function (err) {
									if (err) {
										MensajeTotal = MensajeTotal + entity.properties.atos_posicion + ":"  + err + "\r\n";
									}
									else {
										if (ultimo && error) {
											MobileCRM.UI.MessageBox.sayText(MensajeTotal);  
										}
										else {
											MobileCRM.UI.MessageBox.sayText( literales.cancelacionEnviada);
										}
										MobileCRM.UI.EntityList.reload();
									}							
								}
							);
						} else {
							//mensaje por si no tiene autorizaciones
							MostrarMensajePopUpError('10219_007', IdiomaUsuario,entity.properties.atos_posicion ,null,ultimo);
						}
					},

					function (error) {
						
					});
            },

            function (error) {
                
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
	
};

function ObtenerUsuarioSystema(idUsuario) {
    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
        "<entity name='systemuser'>" +
        "<attribute name='systemuserid' />" +
        "<attribute name='atos_usuariosapid' />" +
        "<order attribute='fullname' descending='false' />" +
        "<filter type='and'>" +
        "<condition attribute='systemuserid' operator='eq' value='" + idUsuario + "' />" +
        "</filter>" +
        "<link-entity name='atos_usuarios' from='atos_usuariosid' to='atos_usuariosapid' visible='false' link-type='outer' alias='usuario'>" +
        "<attribute name='atos_codigo' />" +
        "</link-entity>" +
        "</entity>" +
        "</fetch>";
        return fetchXml;
}

function Literales(idioma) {
     if (idioma != Idioma.ingles) {
        return {
            confirmacionEnviada: " Confirmación de componentes enviadas a SAP",
			componenteBorrado: " Componentes borrados",
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
			componenteBorrado: " Deleted components",
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


function MostrarMensajePopUpError(idMsjeInfo, idioma,componente, restoMensaje, ultimo) {
    IdiomaFormulario = idioma;
    var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
    	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
        function success(result) {
            var texto;
            if (IdiomaFormulario == 3082) {
                if (restoMensaje == null)
                     texto = componente + ":" + result[0][2];
                else
                    texto =componente + ":" + result[0][2].replace('{0}',restoMensaje);
            }
            else {
                           if (restoMensaje == null)
                    texto = componente + ":" +result[0][1];
                else
                    texto = componente + ":" + result[0][1].replace('{0}',restoMensaje);
            }
		  error = true;
		  MensajeTotal = MensajeTotal +  texto + "\r\n";
		  if (ultimo && error)
		  {
			MobileCRM.UI.MessageBox.sayText(MensajeTotal);  
		  }
		  
        },
        function (error) { });
}

function ValidarCamposObligatoriosComponente(IdiomaFormulario,entity) {
    var respuesta = "";
	 var confirmado = 300000001;
    try {
        if (entity.properties.atos_ordendetrabajoid  == null ) {
            if (IdiomaFormulario == 3082)
                respuesta = "Orden de trabajo";
            else
                respuesta = "Work order";
        }

        if ( entity.properties.atos_operacionid  == null) {
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

        if ( entity.properties.atos_materialid  == null) {
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

        if (entity.properties.atos_posicion  == null) {
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

        if (entity.properties.atos_cantidad == null ) {
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

        if (entity.properties.atos_unidademedidaid  == null) {
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

        if (entity.properties.atos_centroid  == null) {
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

        if (entity.properties.atos_almacenid  == null) {
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

//        if (entity.properties.atos_fechacontabilidad == null) {
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

        if (entity.properties.atos_listadematerial == null) {
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
		
		
		if (entity.properties.atos_cantidadadconfirmacion == null ||  entity.properties.atos_cantidadadconfirmacion < 0) {
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
		
		if ( entity.properties.atos_estatusconfirmacion == confirmado) {

            if (respuesta == "")
                if (IdiomaFormulario == 3082)
                    respuesta = "--El componente ya está confirmado-- ";
                else
                    respuesta = "--The component is confirmed-- ";
            else
                if (IdiomaFormulario == 3082)
                    respuesta = respuesta + " *--El componente ya está confirmado--*";
                else
                    respuesta = respuesta + " *--The component is confirmed--*";
        }
		

        return respuesta;
    } catch (e) {
        FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
    }
}

function ValidarCamposObligatoriosComponenteCancelacion(IdiomaFormulario,entity) {
    var respuesta = "";
    try {
		
		   var confirmado = 300000001;
		   
        if (entity.properties.atos_ordendetrabajoid  == null) {
            if (IdiomaFormulario == 3082)
                respuesta = "Orden de trabajo";
            else
                respuesta = "Work order";
        }

        if (entity.properties.atos_operacionid  == null) {
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

        if (entity.properties.atos_materialid  == null) {
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

        if (entity.properties.atos_posicion  == null) {
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

        if (entity.properties.atos_fechacontabilidad  == null) {
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

        if (entity.properties.atos_documentodeconfirmacion  == null) {
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

        if (entity.properties.atos_aniodocumentoconfirmacion  == null) {
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

        if (entity.properties.atos_flagcancelado  == null) {
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

		
		  if ( entity.properties.atos_estatusconfirmacion == null ||entity.properties.atos_estatusconfirmacion != confirmado) {

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
		
		
		
 //       if (entity.properties.atos_documentodecancelacion == null) {
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

