var FS = FS || {};

var MensajeOperacion = "";
var MensajeTotal = "";
var existeUsuario;
var usuarioSys;
var error = false;
var permiso = false; 

FS.OperacionList = {
	
	
    OperacionListOnLoad: function () {
		
		 // se coge el idioma
        MobileCRM.Localization.getLoadedLangId(
            function (loadedLangId) {
                FS.CommonEDPR.localization(loadedLangId);
				
            },
            FS.CommonEDPR.onError,
            null
        );
		
		MobileCRM.Configuration.requestObject(
            function (config) {
                usuarioSys = config.settings.systemUserId;
				FS.OperacionList.ObtenerUsuario(usuarioSys);
            },
            function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            },
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
					var operacion = entityList.context.entities[i];
					MensajeOperacion =="";// operacion.properties.atos_numerooperacioncrm; 
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					FS.OperacionList.IntegrarConfirmacionHorasConSAP(operacion,ultimo);
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
					var operacion = entityList.context.entities[i];
					var ultimo = false; 
					if (entityList.context.entities.length -1 == i)
						ultimo = true; 
					FS.OperacionList.IntegrarCancelacionHorasConSAP(operacion,ultimo);
			   }
           },
           true, null
       );
    },
	
	/// "Enviar a SAP" a yes, para que salte el plugin integración confirmación  de horas y se envie los
    ///  campos de la commfirmación de la entidad operaciones de ordendes de trabajo a SAP </summary>
    IntegrarConfirmacionHorasConSAP: function (entity, ultimo) {
        var guidOperacion = entity.id;
        var idMsjeInfo = "10111_005";
        var activo = "0";
		var integradoConSAP = 300000001;
		var statusConfirmado = 300000001;
		var UTname = "";
		
	    // CAMBIAR
		var statusConfirmacion = entity.properties.atos_estatusconfirmacion; 
		if (statusConfirmacion == statusConfirmado) {
			    if (IdiomaUsuario == 3082) 
						MobileCRM.UI.MessageBox.sayText("La operación ya está confirmada.");
				    else 
						MobileCRM.UI.MessageBox.sayText("The operation is already confirmed.");
					return;
			   return;
		}
		 
		if (entity.properties.atos_ubicaciontecnicaid != null)
			UTname = entity.properties.atos_ubicaciontecnicaid.primaryName ;

		var operacion_ZPM2 = "ZPM2";
		var claveControl = "";
		if (entity.properties.atos_clavedecontrolid != null)
			claveControl = entity.properties.atos_clavedecontrolid.primaryName.split(':')[0];
		
		if (claveControl ==  operacion_ZPM2 )
		{
			 MostrarMensajePopUpError('10111_023', IdiomaFormulario, entity.properties.atos_numerooperacioncrm, null, ultimo);
             return;
		}
		
        var codigoPermisoAutorizado = "A";
        var ordenTrabajo = entity.properties.msdyn_workorder;
        if (ordenTrabajo != null) {
            var trabajoReal = entity.properties.atos_trabajoreal;
			if (trabajoReal == null &&  FS.OperacionList.EsUbicacionAmericana(UTname)) 
				trabajoReal = 0;
            if (trabajoReal != null) {
				
			var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
				
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
                    function success(result) {
						// si la orden no esta integrada con SAP.
						if (result[0][1] == integradoConSAP) {
							//Si la orden de trabajo está liberada
							if (result[0][0] !="False") {
								var fetchAutoriz = FetchDeMensajeAutorizaciones(ordenTrabajo.id, activo, codigoPermisoAutorizado);
								//Comprobamos si tiene autorizacion
								MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
									function success(result) {
										//AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
										//if (result.length > 0 || FS.OperacionList.EsUbicacionAmericana(UTname)) {
											var validacionOK = ValidarCamposObligatorios(IdiomaUsuario,trabajoReal,entity);
											if (validacionOK != "") {
												MostrarMensajePopUpError('10111_012', IdiomaUsuario,entity.properties.atos_numerooperacioncrm , validacionOK , ultimo);
												return;
											}

											var fechaFinReal = entity.properties.atos_fechafinreal;
											var fechaHoy = new Date();

											if (fechaFinReal > fechaHoy) {
												MostrarMensajePopUpError('10111_013', IdiomaUsuario, entity.properties.atos_numerooperacioncrm ,null, ultimo);
												return;
											}

											var fechaConfirmacion = entity.properties.atos_fechaconfirmacion;

											if (fechaConfirmacion > fechaHoy) {
												MostrarMensajePopUpError('10111_014', IdiomaUsuario, entity.properties.atos_numerooperacioncrm ,null, ultimo);
												return;
											}
											var literales = Literales(IdiomaUsuario);

											var operacion = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
										   
											operacion.id = entity.id;
											operacion.isNew =false;
											operacion.properties.atos_estatusconfirmacion = 300000001;
											operacion.properties.atos_enviarasap = true;
											operacion.properties.atos_fechacreacionconfirmacion = new Date();
											operacion.properties.atos_fechamodificacionconfirmacion = new Date();
											operacion.properties.atos_fechaconfirmacion = new Date();
											operacion.properties.atos_origen = 300000002;
											
											
											
											 if (existeUsuario != null && existeUsuario.codigo != null) {
												operacion.properties.atos_confirmadoporsapid = new MobileCRM.Reference("atos_usuarios", existeUsuario.usuarioid , "");
												operacion.properties.atos_confirmacionmodificadaporsapid = new MobileCRM.Reference("atos_usuarios", existeUsuario.usuarioid , "");
												operacion.properties.atos_confirmadoporsap = existeUsuario.codigo;
												operacion.properties.atos_confirmacionmodificadaporsap = existeUsuario.codigo;
											 }

											operacion.save(
												function (err) {
													if (err) {
														 MensajeTotal = MensajeTotal + entity.properties.atos_numerooperacioncrm + ":"  + err + "\r\n";
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
										//}
										//else {
											//mensaje por si no tiene autorizaciones
										//	MostrarMensajePopUpError('10111_007', IdiomaUsuario, entity.properties.atos_numerooperacioncrm ,null, ultimo );
										//}
									},

									function (error) {
										  console.log("**Error al obtener autirzaciones: " + error);
										   MostrarMensajePopUpError('10111_007', IdiomaUsuario, entity.properties.atos_numerooperacioncrm ,null, ultimo );
									});
							}
							else {
								//La orden de trabajo no está liberada
								MostrarMensajePopUpError('10111_010', IdiomaUsuario, entity.properties.atos_numerooperacioncrm ,null, ultimo );
							}
						}
						else {
								//La orden de trabajo no está integrada con SAP
								MostrarMensajePopUpError('10111_021', IdiomaUsuario, entity.properties.atos_numerooperacioncrm,null, ultimo);
						}
                    },
                    function (error) {
                    });
            }
            else {
                //Mensaje que tiene que asignar valor a trabajo real
                MostrarMensajePopUpError('10111_008', IdiomaUsuario, entity.properties.atos_numerooperacioncrm,null, ultimo);
            }
        }
        else {
            //Mensaje que tiene que asociar a una OT
            MostrarMensajePopUpError('10111_009', IdiomaFormulario, entity.properties.atos_numerooperacioncrm,null, ultimo);
        }
    },
	/// <summary>Método que se invoca desde el botón de Confirmar horas y lo que hace es poner el campo oculto
    /// "Enviar a SAP" a yes, para que salte el plugin integración confirmación  de horas y se envie los
    ///  campos de la commfirmación de la entidad operaciones de ordendes de trabajo a SAP </summary>
    IntegrarCancelacionHorasConSAP: function (entity,ultimo) {
        var guidOperacion = entity.id;
        var idMsjeInfo = "10111_006";
        var activo = "0";
        var codigoPermisoAutorizado = "A";
		var integradoConSAP = 300000001;
        var statusConfirmado = 300000001;
		var UTname = "";
		
		if (entity.properties.atos_ubicaciontecnicaid != null)
			UTname = entity.properties.atos_ubicaciontecnicaid.primaryName;
		
		var operacion_ZPM2 = "ZPM2";
		var claveControl = "";
		if (entity.properties.atos_clavedecontrolid != null)
			claveControl = entity.properties.atos_ubicaciontecnicaid.primaryName.split(":")[0];
		
		if (claveControl ==  operacion_ZPM2 )
		{
			 MostrarMensajePopUpError('10111_023', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, null,ultimo);
             return;
		}
		
		
        var ordenTrabajo = entity.properties.msdyn_workorder;
		var statusConfirmacion = entity.properties.atos_estatusconfirmacion; 
		
		  if (statusConfirmacion == statusConfirmado) {
			if (ordenTrabajo != null) {
				var fetchXmlOT= ObtenerFetchOT(ordenTrabajo.id);
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOT,
					   function success(result) {
						   //Si la orden de trabajo está liberada
						   if (result[0][0]  !="False") {
							   var fetchAutoriz = FetchDeMensajeAutorizaciones(ordenTrabajo.id, activo, codigoPermisoAutorizado);
							   //Comprobamos si tiene autorizacion
							MobileCRM.FetchXml.Fetch.executeFromXML(fetchAutoriz,
								   function success(result) {
									   //AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
									   //if (result.length > 0 || FS.OperacionList.EsUbicacionAmericana(UTname)) {
										   var validacionOK = ValidarCamposObligatoriosCancelacion(IdiomaUsuario,entity);
										   if (validacionOK != "") {
											   MostrarMensajePopUpError('10111_015', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, validacionOK,ultimo);
											   return;
										   }
										 
											var literales = Literales(IdiomaUsuario);
										   
											var operacion = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
											operacion.id = entity.id;
											operacion.isNew =false;
											operacion.properties.atos_estatusconfirmacion = 300000002;
											operacion.properties.atos_cancelarhorasensap = true;
											
	
											
											operacion.save(
												function (err) {
													if (err) {
														 MensajeTotal = MensajeTotal + entity.properties.atos_numerooperacioncrm + ":" +  err + "\r\n";
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
									   //}
									   //else {
										   //mensaje por si no tiene autorizaciones
										//   MostrarMensajePopUpError('10111_007', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, null,ultimo);
									   //}
								   },

								   function (error) {
								   });
						   }
						   else {
							   //La orden de trabajo no está liberada
							   MostrarMensajePopUpError('10111_010', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, null,ultimo);
						   }
					   },
					   function (error) {
					   });
			}
			else {
				//Mensaje que tiene que asociar a una OT
				MostrarMensajePopUpError('10111_009', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, null,ultimo);
			}
		}
		else {
			   //la operacion no esta confirmada
               MostrarMensajePopUpError('10111_022', IdiomaUsuario,entity.properties.atos_numerooperacioncrm, null,ultimo);
		}
    },
	
	
	
	
	ObtenerUsuario: function (usuarioSistema) {
		try {
            var fetchXml = ObtenerUsuarioSystema(usuarioSistema)
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function success(result) {
					 for (var i in result) {
						existeUsuario = {
							usuarioid: result[i][1].id,
							codigo: result[0][2]
						};
					 }
                },
                function (err) {
                    return null;
                },
				null
			);
        } catch (error) {

            console.log("**ERROR Metodo: ObtenerUsuario");
            Atos.Helper.GetErrorCollectionByCode('JS_001');
        }
    },
	
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
	
};

function Literales(idioma) {
    if (idioma != Idioma.ingles) {
        return {
            confirmacionEnviada: " Confirmación(es) de Horas enviadas a SAP",
            confirmacion: "Confirmación",
            cancelacionEnviada: " Cancelación(es) de Horas enviadas a SAP",
            cancelacion: "Cancelación",
            campoObligatorio: "*Campos obligatorios*",
            fechaRealMayorFecha: "*FechaFinReal mayor Fecha actual*",
            fechaConfirmacion: "*FechaConfirmación mayor Fecha actual*",
            autorizaLiberacion: "*Compruebe autorización y liberación de OT*",
            errorOperacion: "--Error en operación:",
            noExisteEntorno: "No Existe Entorno",
            errorSerializacion: "Error al serializar",
            contacteAdministrador: "Contacte con administrador",
            errorObtenerAutorizacion: "*Error al obtener autorización*"


        }
    }
    else {
        return {
            confirmacionEnviada: " Confirmation(s) time send to SAP",
            confirmacion: "Confirmation",
            cancelacionEnviada: " Cancelation(s) time send to SAP",
            cancelacion: "Cancelation",
            campoObligatorio: "*Mandatory fields*",
            fechaRealMayorFecha: "*actual date is lower than real end date*",
            fechaConfirmacion: "*actual date is lower than confirmation date*",
            autorizaLiberacion: "*Check the authorization or release of WO*",
            errorOperacion: "--Error, operation:",
            noExisteEntorno: "doesn't exist environment",
            errorSerializacion: "serialization Error",
            contacteAdministrador: "Contact the administrator",
            errorObtenerAutorizacion: "*Error to get the authorization*"
        }
    }

}

function MostrarMensajePopUpError(idMsjeInfo, idioma,operacion, restoMensaje, ultimo) {
    IdiomaFormulario = idioma;
    var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
    	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
        function success(result) {
            var texto;
            if (IdiomaFormulario == 3082) {
                if (restoMensaje == null)
                     texto = operacion + ":" + result[0][2];
                else
                    texto =operacion + ":" + result[0][2].replace('{0}',restoMensaje);
            }
            else {
                           if (restoMensaje == null)
                    texto = operacion + ":" +result[0][1];
                else
                    texto = operacion + ":" + result[0][1].replace('{0}',restoMensaje);
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

function FetchDeMensajeAutorizaciones(idOrdenTrabajo, activo, codigoPermisoAutorizado) {
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
					"</entity>" +
					"</fetch>";
    
    return fetchXml;
}

function ValidarCamposObligatorios (IdiomaFormulario,trabajoReal,entity) {
    var respuesta = "";
    try {
        if (entity.properties.msdyn_workorder == null) {
            if (IdiomaFormulario == 3082) respuesta = "Orden de trabajo"; else respuesta = "Work order";
        }

        if (entity.properties.atos_numerooperacioncrm == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Número de operación"; else respuesta = "Operation Number";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Número de operación"; else respuesta = respuesta + ", Operation Number";
        }

        if (entity.properties.atos_centroid == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Centro"; else respuesta = "Plant";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Centro"; else respuesta = respuesta + ", Plant";
        }

        if (entity.properties.atos_puestotrabajoprincipalid == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Puesto trabajo"; else respuesta = "Work center";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Puesto trabajo"; else respuesta = respuesta + ", Work center";
        }

    //    if (entity.properties.atos_trabajo == null) {
    //        if (respuesta == "")
    //            if (IdiomaFormulario == 3082) respuesta = "Trabajo"; else respuesta = "Work";
    //        else
    //            if (IdiomaFormulario == 3082) respuesta = respuesta + ", Trabajo"; else respuesta = respuesta + ", Work";
    //    }

        if (entity.properties.atos_fechainicioreal == null ) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Fecha Inicio Real"; else respuesta = "Real start date";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Fecha Inicio Real"; else respuesta = respuesta + ", Real start date";
        }

        if (entity.properties.atos_fechafinreal == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Fecha Fin Real"; else respuesta = "Real end date";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Fecha Fin Real"; else respuesta = respuesta + ", Real end date";
        }

        if (entity.properties.atos_trabajoreal == null || trabajoReal < 0) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Trabajo Real"; else respuesta = "Real work";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Trabajo Real"; else respuesta = respuesta + ", Real work";
        }

    //    if (entity.properties.atos_fechaconfirmacion == null) {
    //        if (respuesta == "")
    //            if (IdiomaFormulario == 3082) respuesta = "Fecha de confirmación"; else respuesta = "Confirmation date";
    //        else
    //            if (IdiomaFormulario == 3082) respuesta = respuesta + ", Fecha de confirmación"; else respuesta = respuesta + ", Confirmation date";
    //    }
    //
        return respuesta;
    } catch (e) {
        console.log(e);
    }
}

function ValidarCamposObligatoriosCancelacion(IdiomaFormulario,entity) {
    try {
        var respuesta = "";
        if (entity.properties.msdyn_workorder == null ) {
            if (IdiomaFormulario == 3082) respuesta = "Orden de trabajo"; else respuesta = "Work order";
        }

        if (entity.properties.atos_numerooperacioncrm == null ) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Número de operación"; else respuesta = "Operation Number";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Número de operación"; else respuesta = respuesta + ", Operation Number";
        }
        //Confirmacion de SAP

        if ( entity.properties.atos_contadordeconfirmacion == null) {
            if (respuesta == "")
                if (IdiomaFormulario == 3082) respuesta = "Contador de confirmación"; else respuesta = "Confirmation counter";
            else
                if (IdiomaFormulario == 3082) respuesta = respuesta + ", Contador de confirmación"; else respuesta = respuesta + ", Confirmation counter";
        }
        //Descripcion Cancelacion

        return respuesta;
    } catch (e) {
        console.log(e);
    }
}




