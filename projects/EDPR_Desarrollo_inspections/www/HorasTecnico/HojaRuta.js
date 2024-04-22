if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (HojaRuta) == "undefined") { HojaRuta = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
// variablers globales para el guardado
var saveHandler;
var operaciones = 0;
var servicios = 0;
var componentes = 0;
// variables globakles para la desactivacion
var operacionesBorrado = 0;
var serviciosBorrado = 0;
var componentesBorrado = 0;
var horasTecnicoBorrado = 0;
var guardar = true;
var almacenOT;
var operacionInsertada = 0;
//#endregion


FS.HojaRuta = {

    HojaRutaOnLoad: function () {
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
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var HojaRuta = entityForm.entity;
		
		 if (HojaRuta.isNew) {
			guardar = true; 
		 }
		 else {
			guardar = false; 
			var dv = entityForm.getDetailView("General");
			dv.getItemByName("atos_hojaderutaid").isEnabled = false;
		 }
		
    },
    
   
    onSave: function (entityForm) {
        var self = this;
		var transaccionClonacion = 2;
			if (guardar){
			guardar=false;
			saveHandler = entityForm.suspendSave();
			
			entityForm.entity.properties.atos_origen = 300000002;
			entityForm.entity.properties.atos_origendetransaccion = transaccionClonacion;
			
			if (entityForm.entity.properties.atos_ordendetrabajoid!=null)
			FS.HojaRuta.ClonarHojaRutaOT(entityForm);
		}
		
    },
	onPostSave: function (entityForm) {
        var self = this;

	},

    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;
		
		
		MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
					entityForm.entity.properties.atos_name = entityForm.entity.properties.atos_hojaderutaid.primaryName;
                },
                FS.CommonEDPR.onError,
                null
            );			
		
    },
	
	DesasignarHojasExistentes: function (entityForm) {
		var ordenId =	entityForm.entity.properties.atos_ordendetrabajoid.id;
		var hojaRutaId =	entityForm.entity.properties.atos_hojaderutaid.id;
		var fetchXml =  "<fetch version='1.0'>" +
						"<entity name='atos_hojaderutadeordendetrabajo'>" +
						 "<attribute name='atos_hojaderutadeordendetrabajoid' />" +
						"<attribute name='atos_hojaderutaid' />" +
						"<attribute name='atos_ordendetrabajoid' />" +
						"<filter type='and'>" +
						"<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + ordenId + "'/>" +
						"<condition attribute='atos_hojaderutaid' operator='eq' value='" + hojaRutaId + "'/>" +
						"</filter>" +
						"</entity>" +
						"</fetch>";
						

		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
			function (resultHojas) {
				for (var i in resultHojas) {
					
					var hojaRuta = new MobileCRM.DynamicEntity.createNew("atos_hojaderutadeordendetrabajo");
					hojaRuta.id = resultHojas[i][0];
					hojaRuta.isNew =false;
					var props = hojaRuta.properties;
					// CAMPOS DE LO OPERACION DE HOJA DE RUTA
					props.atos_ordendetrabajoid = null;

					hojaRuta.save(
						 function (err) {
							 if (err) {
								 MobileCRM.UI.MessageBox.sayText(err);
								saveHandler.resumeSave();
							 }
							 else {
								 // Hecho
							 }
						}
					);
				}
				
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				saveHandler.resumeSave();
			},
			null
		);					
	},
	
	
	 ClonarHojaRutaOT: function (entityForm) {
		if (entityForm== null)
			entityForm = formulario;
		var self = this;		 
		var HojaRuta = entityForm.entity;
		try {
			 var popup;
			 var errorEstado;
            if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box
                popup = new MobileCRM.UI.MessageBox("Do you like to delete all operations existens and create operations from the task list selected?");
                popup.items = ["Yes", "No"];
				
            }
            else {
                popup = new MobileCRM.UI.MessageBox("¿Desea borrar todas la operaciones existentes y crear operaciones a partir de la Hoja de Ruta seleccionada?");
                popup.items = ["Si", "No"];
				errorEstado = "la orden no se encuentra en estado abierto."
            }

			 
		var fetchXmlOrden =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
								"  <entity name='msdyn_workorder'>" +
								"    <attribute name='msdyn_workorderid' />" +
								"    <attribute name='statuscode' />" +
								"    <attribute name='msdyn_serviceaccount' />" +
								"    <attribute name='msdyn_customerasset' />" +
								"    <attribute name='msdyn_name' />" +
								"    <filter type='and'>" +
								"      <condition attribute='msdyn_workorderid' operator='eq' value='" + HojaRuta.properties.atos_ordendetrabajoid.id +"' />" +
								"    </filter>" +
								"  </entity>" +
								"</fetch>";

		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOrden,
			function (resultOT) {	
				// comprobamos que este en estado abierta la OT
				if (resultOT[0][1]!= 1){
					FS.HojaRuta.crearDatosHojaRutaOT( entityForm,resultOT,entityForm.entity.properties.atos_hojaderutaid.id);
					
				}
				else {
					popup.multiLine = true;
					popup.show(
						function (button) {
							if (button == "Yes" || button == "Si") {
								// obtengo las operaciones  de la OT
								FS.HojaRuta.DesactivarOperacionesOT( entityForm,resultOT );
							}
							else {
							   // creamos la hoja de ruta
								FS.HojaRuta.crearDatosHojaRutaOT( entityForm,resultOT,entityForm.entity.properties.atos_hojaderutaid.id);
							}
							FS.HojaRuta.DesasignarHojasExistentes(entityForm);
						}
					);
				}
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				saveHandler.resumeSave();
			},
			null
		 );		
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
        }
	},
	
	 crearDatosHojaRutaOT: function (entityForm,orden,hojaRutaId) {
		 
		var fetchXmlTipoMovimiento =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
										"  <entity name='atos_tipodemovimiento'>" +
										"    <attribute name='atos_tipodemovimientoid' />" +
										"    <order attribute='atos_name' descending='false' />" +
										"    <filter type='and'>" +
										"      <condition attribute='atos_codigo' operator='eq' value='261' />" +
										"    </filter>" +
										"  </entity>" +
										"</fetch>";
										
		var fetchXmlUbicacion =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
								"  <entity name='account'>" +
								"    <attribute name='atos_centrodecosteid' />" +
								"    <attribute name='atos_sociedadcoid' />" +
								"    <attribute name='atos_centroid' />" +
								"    <attribute name='atos_centrodeplanificacionid' />" +
								"    <attribute name='atos_puestodetrabajoresponsableid' />" +
								"    <attribute name='accountid' />" +
								"    <filter type='and'>" +
								"      <condition attribute='accountid' operator='eq' value='"+ orden[0][2].id +"' />" +
								"    </filter>" +
								"  </entity>" +
								"</fetch>";										
								
		// cogemos el tipo de movimiento 256								
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlTipoMovimiento,
			function (resultTipoMovimiento) {
				var tipoMovimiento = null;
				if (resultTipoMovimiento.length >0){
						tipoMovimiento = resultTipoMovimiento[0][0];
				}
				// obtenemos datos de la ubicacion de la orden
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlUbicacion,
					function (resultUbicacion) {
						var ubicacion;
						if (resultUbicacion.length >0){
							ubicacion = resultUbicacion[0];
							FS.HojaRuta.obtenerAlmacenOTdeUbicacion(entityForm,orden,ubicacion);
							FS.HojaRuta.crearOperacionesRutaOT(entityForm,orden,hojaRutaId,ubicacion,tipoMovimiento);
						}
						else {
							// error no tiene ubicacion asignada
							FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
							saveHandler.resumeSave();
						}
					},
					 function (err) {
						FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
						saveHandler.resumeSave();
					},
					null
				);		
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				saveHandler.resumeSave();
			},
			null
		 );		
	 },
	
	obtenerAlmacenOTdeUbicacion: function(entityForm,orden,ubicacion){
	if (ubicacion == null || ubicacion[2] == null ){
		return;
	}
	 var fetchXml ="<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
					"  <entity name='atos_almacenesot'>" +
					"    <attribute name='atos_name' />" +
					"    <attribute name='atos_centrodecosteid' />" +
					"    <attribute name='atos_almacenid' />" +
					"    <attribute name='atos_almacenesotid' />" +
					"    <attribute name='atos_centroid' />" +
					"    <attribute name='atos_centrocomponenteid' />" +
					"    <order attribute='atos_name' descending='false' />" +
					"    <filter type='and'>" +
					"      <condition attribute='atos_centroid' operator='eq'  uitype='atos_centrodecoste' value='"+ ubicacion[2].id +"' />" +
					"    </filter>" +
					"  </entity>" +
					"</fetch>";		


		// cogemos el tipo de movimiento 256								
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
			function (resultAlmacenOT) {
				for (var i in resultAlmacenOT) {
					almacenOT = resultAlmacenOT[0];
				}
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				saveHandler.resumeSave();
			},
			null
		);	
		
	},
	
	crearOperacionesRutaOT: function (entityForm,orden,hojaRutaId,ubicacion,tipoMovimiento) {
		var operacion = 0; 
		
		var transaccionHojaRuta = 1;
		var fetchXmlOperaciones =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
									"  <entity name='atos_operaciondehojaderuta'>" +
									"    <attribute name='atos_textobreve' />" +
									"    <attribute name='atos_puestodetrabajoid' />" +
									"    <attribute name='atos_clavedecontrolid' />" +
									"    <attribute name='atos_grupodecomprasid' />" +
									"    <attribute name='atos_clasedecosteid' />" +
									"    <attribute name='atos_grupodearticulosid' />" +
									"    <attribute name='atos_duracionnormal' />" +
									"    <attribute name='atos_unidadduracionnormalid' />" +
									"    <attribute name='atos_capacidad' />" +
									"    <attribute name='atos_trabajo' />" +
									"    <attribute name='atos_porcentajetrabajo' />" +
									"    <attribute name='atos_clavedecalculo' />" +
									"    <attribute name='atos_distribucionnecesidadid' />" +
									"    <attribute name='atos_hojaderutaid' />" +
									"    <attribute name='atos_operaciondehojaderutaid' />" +
									"    <attribute name='atos_clasedeactividadid' />" +
									"    <filter type='and'>" +
									"      <condition attribute='atos_hojaderutaid' operator='eq' value='"+ hojaRutaId +"' />" +
									"      <condition attribute='atos_flagdeborrado' operator='eq' value='0' />" +
									"    </filter>" +
									"  </entity>" +
									"</fetch>";
		 
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperaciones,
			function (resultOperaciones) {
				operaciones =  resultOperaciones.length;
				for (var i in resultOperaciones) {
 					    operacion = operacion + 1;
					    var numOperacion = zeroPad(operacion * 10, 4);
                        var newOperacionOT = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
                        var props = newOperacionOT.properties;
						// CAMPOS DE LO OPERACION DE HOJA DE RUTA
						props.msdyn_workorder = new MobileCRM.Reference("msdyn_workorderservice", orden[0][0], "")
						props.atos_descripcion =  resultOperaciones[i][0];
						if (resultOperaciones[i][1]!=null)
							props.atos_puestotrabajoprincipalid = new MobileCRM.Reference("atos_puestodetrabajo",  resultOperaciones[i][1].id, "");
						if (resultOperaciones[i][2]!=null)
                        props.atos_clavedecontrolid = new MobileCRM.Reference("atos_clavedecontrol",  resultOperaciones[i][2].id, "");
						if (resultOperaciones[i][3]!=null)
							props.atos_grupodecomprasid = new MobileCRM.Reference("atos_grupodecompras",  resultOperaciones[i][3].id, "");
						if (resultOperaciones[i][4]!=null)
							props.atos_clasedecosteid = new MobileCRM.Reference("atos_clasedecoste",  resultOperaciones[i][4].id, "");
						if (resultOperaciones[i][5]!=null)
							props.atos_grupodearticulosid = new MobileCRM.Reference("atos_grupodearticulos",  resultOperaciones[i][5].id, "");
                        props.atos_duracionnormalhoras = resultOperaciones[i][6];
						if (resultOperaciones[i][7]!=null)
							props.atos_unidaddemedidadid = new MobileCRM.Reference("atos_unidaddemedida",  resultOperaciones[i][7].id, "");
                        props.atos_numerodetecnicos = resultOperaciones[i][8];
                        props.atos_trabajo = resultOperaciones[i][9];
                        props.atos_porcentajetrabajo =  resultOperaciones[i][10];
						if (resultOperaciones[i][11]!= ("-1"))
							props.atos_clavecalculo =  resultOperaciones[i][11];
						if (resultOperaciones[i][12]!=null)
							props.atos_distribucionnecesidadid = new MobileCRM.Reference("atos_distribucioncapacidad",  resultOperaciones[i][12].id, "");
						if (resultOperaciones[i][13]!=null)
							props.atos_hojaderutaid = new MobileCRM.Reference("atos_hojaderuta",  resultOperaciones[i][13].id, "");
                     						
						
						// CAMPOS DE LO OPERACION DE LA ORDEN
						if(orden[0][2] != null)
							props.atos_ubicaciontecnicaid = new MobileCRM.Reference("account", orden[0][2].id, "");
						if(orden[0][3] != null)
							props.atos_equipoid = new MobileCRM.Reference("msdyn_customerasset", orden[0][3].id, "");
						
						if (orden[0][2]!=null){

							if (ubicacion[2]!=null)
								props.atos_centroid = new MobileCRM.Reference("atos_centro",  ubicacion[2].id, "");
							if (ubicacion[3]!=null)
								props.atos_centroplanificacionid = new MobileCRM.Reference("atos_centrodeplanificacion",  ubicacion[3].id, "");
							if (ubicacion[4]!=null)
								props.atos_puestotrabajoprincipalid = new MobileCRM.Reference("atos_puestodetrabajo",  ubicacion[4].id, "");
						}
						
						props.atos_origendetransaccion = transaccionHojaRuta;
						//props.atos_numerooperacioncrm = numOperacion;
						// decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
						props.atos_origen = 300000002;

						if (resultOperaciones[i][15]!=null){
							props.atos_clasedeactividadid = new MobileCRM.Reference("atos_clasedeactividad2",  resultOperaciones[i][15].id, "");
							
							newOperacionOT.save(
								function (err) {
									operacionInsertada = operacionInsertada +1;
									if (err) {
										MobileCRM.UI.MessageBox.sayText(err);
										saveHandler.resumeSave();										
									}
									else {
										var ultimaOperacion = false;
										if (operacionInsertada == resultOperaciones.length)
											ultimaOperacion = true;
										FS.HojaRuta.crearServiciosRutaOT(entityForm,orden,hojaRutaId,resultOperaciones[operacionInsertada -1], this,ubicacion,ultimaOperacion,tipoMovimiento); 
									}
								}
							);
						}
                        else {
							// obtengo el codigo de clase como se hace en operacion
							FS.HojaRuta.filterClaseActividad(entityForm,orden,hojaRutaId,resultOperaciones, newOperacionOT,ubicacion,tipoMovimiento); 
						}
                           


				}
				// si no tiene operaciones cierro el proceso
				if (resultOperaciones.length == 0 ){
				   // TERMINA
				   saveHandler.resumeSave();
				   MobileCRM.UI.EntityForm.saveAndClose();
				   
				}
			
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		 );		
	 },
	 
	GuardarOperacion: function (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento){
		
		operacion.save(
			function (err) {
				operacionInsertada = operacionInsertada +1;
				if (err) {
						MobileCRM.UI.MessageBox.sayText(err);
						saveHandler.resumeSave();										
				}
				else {
					var ultimaOperacion = false;
					if (operacionInsertada == resultOperaciones.length)
						ultimaOperacion = true;
						FS.HojaRuta.crearServiciosRutaOT(entityForm,orden,hojaRutaId,resultOperaciones[operacionInsertada -1], this,ubicacion,ultimaOperacion,tipoMovimiento); 
					}
				}
		);
	},
	
	
	 crearServiciosRutaOT: function (entityForm,orden,hojaRutaId,operacionPlantilla,operacion, ubicacion, ultima,tipoMovimiento){
		var servicioInsertado = 0;
		var transaccionHojaRuta = 2;
		var operacionPlantillaId = operacionPlantilla[14];
	 	var fetchXmlServicio =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
									"  <entity name='atos_serviciodehojaderuta'>" +
									"    <attribute name='atos_serviciodehojaderutaid' />" +
									"    <attribute name='atos_servicioid' />" +
									"    <attribute name='atos_unidaddemedidaid' />" +
									"    <attribute name='atos_cantidad' />" +
									"    <attribute name='atos_precio' />" +
									"    <filter type='and'>" +
									"      <condition attribute='atos_operaciondehojaderutaid' operator='eq' value='"+ operacionPlantillaId +"' />" +
									"      <condition attribute='atos_flagdeborrado' operator='eq' value='0' />" +
									"    </filter>" +
									"  </entity>" +
									"</fetch>";
									
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlServicio,
			function (resultServicios) {
				servicios = servicios + resultServicios.length;
				for (var i in resultServicios) {
					
                        var newServicioOT = new MobileCRM.DynamicEntity.createNew("atos_serviciooperacion");
                        var props = newServicioOT.properties;
						// CAMPOS DE LO OPERACION DE HOJA DE RUTA
						props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorderservice",orden[0][0], "");
						props.atos_operacionid = new MobileCRM.Reference("msdyn_workorderservicetask", operacion.id, "");
						
						
						if (resultServicios[i][1]!=null)
							props.atos_servicioid = new MobileCRM.Reference("atos_servicio",  resultServicios[i][1].id, "");
						if (resultServicios[i][2]!=null)
                        props.atos_unidadmedidaid = new MobileCRM.Reference("atos_unidaddemedida",  resultServicios[i][2].id, "");
                        props.atos_cantidad = resultServicios[i][3];
                        props.atos_precio = resultServicios[i][4];
						
						props.atos_origendetransaccion = transaccionHojaRuta;
						// decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
						props.atos_origen = 300000002;

                        newServicioOT.save(
                            function (err) {
								servicios = servicios - 1;
								servicioInsertado = servicioInsertado +1;
                                if (err) {
                                    MobileCRM.UI.MessageBox.sayText(err);
									saveHandler.resumeSave();
                                }
                                else {
									var ultimaOperacion = false;
									if (servicioInsertado == resultServicios.length && ultima)
										ultimaOperacion = true;
									if (servicioInsertado == resultServicios.length)
										FS.HojaRuta.crearComponentesRutaOT(entityForm,orden,hojaRutaId,operacionPlantilla,operacion,ubicacion,ultimaOperacion,tipoMovimiento); 
                                }
							}
						);
				}
				// si no tiene operaciones cierro el proceso
				if (resultServicios.length == 0 ){
					FS.HojaRuta.crearComponentesRutaOT(entityForm,orden,hojaRutaId,operacionPlantilla,operacion,ubicacion,ultima,tipoMovimiento); 			
				}
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
				saveHandler.resumeSave();
			},
			null
		 );		 
	 	 
	 },
	
	 crearComponentesRutaOT: function (entityForm,orden,hojaRutaId,operacionPlantilla,operacion,ubicacion,ultima,tipoMovimiento ){
		 
		var componenteInsertado = 0;
		var transaccionHojaRuta = 2;
		var operacionPlantillaId = operacionPlantilla[14];
		
		var finMensaje;
        if (IdiomaUsuario == Idioma.ingles) {
			finMensaje = "Task list has been assigned.";
        }
        else {
			finMensaje = "La ruta ha sido asignada.";
        }
		
	 	var fetchXmlComponente =   "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
									"  <entity name='atos_componentedehojaderuta'>" +
									"    <attribute name='atos_materialid' />" +
									"    <attribute name='atos_cantidad' />" +
									"    <attribute name='atos_unidaddemedidaid' />" +
									"    <attribute name='atos_listadematerial' />" +
									"    <filter type='and'>" +
									"      <condition attribute='atos_operaciondehojaderutaid' operator='eq' value='"+ operacionPlantillaId +"' />" +
									"      <condition attribute='atos_flagdeborrado' operator='eq' value='0' />" +
									"    </filter>" +
									"<link-entity name='product' from='productid' to='atos_materialid' link-type='outer' alias='ac'>" +
									"<attribute name='atos_grupodearticulosid' />" +
									"</link-entity>" +
									"  </entity>" +
									"</fetch>";
									
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlComponente,
			function (resultComponentes) {
				componentes = componentes + resultComponentes.length; 
				operaciones = operaciones - 1;
				for (var i in resultComponentes) {
                        var newComponenteOT = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
                        var props = newComponenteOT.properties;
						props.atos_ordendetrabajoid = new MobileCRM.Reference("msdyn_workorderservice", orden[0][0], "");
						props.atos_operacionid = new MobileCRM.Reference("msdyn_workorderservicetask", operacion.id, "");
						
						
						if (resultComponentes[i][0]!=null)
							props.atos_materialid = new MobileCRM.Reference("product", resultComponentes[i][0].id, "");
						props.atos_cantidad = resultComponentes[i][1];
						props.atos_cantidadadconfirmacion = resultComponentes[i][1];
						if (resultComponentes[i][2]!=null)
							props.atos_unidademedidaid = new MobileCRM.Reference("atos_unidaddemedida", resultComponentes[i][2].id, "");
						if (resultComponentes[i][2]!=null)
							props.atos_unidadconfirmacionid = new MobileCRM.Reference("atos_unidaddemedida", resultComponentes[i][2].id, "");						
						if (resultComponentes[i][4]!=null)
							props.atos_grupodearticulosid = new MobileCRM.Reference("atos_grupodearticulos", resultComponentes[i][4].id, "");						
						props.atos_listadematerial = resultComponentes[i][3];
						if (tipoMovimiento!=null)
							props.atos_tipodemovimientoid = new MobileCRM.Reference("atos_tipodemovimiento", tipoMovimiento, "");
					
					    // ALMACEN Y CENTRO 	
						if (almacenOT== null){
							if (operacion.properties.atos_centroid!=null){
								props.atos_centrocomponenteid = new MobileCRM.Reference("atos_centro", operacion.properties.atos_centroid.id, "");
								props.atos_centroid = new MobileCRM.Reference("atos_centro", operacion.properties.atos_centroid.id, "");
							}
						}
						else {
							// centro 
							if (almacenOT[4]!=null)
								props.atos_centroid = new MobileCRM.Reference("atos_centro", almacenOT[4].id, "");
							if (almacenOT[5]!=null)
								props.atos_centrocomponenteid = new MobileCRM.Reference("atos_centro", almacenOT[5].id, "");
								if (almacenOT[2]!=null){
									props.atos_almacenid = new MobileCRM.Reference("msdyn_warehouse", almacenOT[2].id, "");
									props.atos_almacenconfirmacionid = new MobileCRM.Reference("msdyn_warehouse", almacenOT[2].id, "");
								}
						}
						
						props.atos_origendetransaccion = transaccionHojaRuta;
						// decimos que la creacion se ha realizado desde el movil para que no se dupliquen los campos
						props.atos_origen = 300000002;

                        newComponenteOT.save(
                            function (err) {
								componenteInsertado = componenteInsertado +1;
								componentes = componentes - 1; 
                                if (err) {
                                    MobileCRM.UI.MessageBox.sayText(err);
										 saveHandler.resumeSave();
                                }
                                else {
									if (componenteInsertado == resultComponentes.length && operaciones == 0 && componentes == 0 && servicios == 0){
										// TERMINADO
										//MobileCRM.UI.MessageBox.sayText(finMensaje);
										saveHandler.resumeSave();
										MobileCRM.UI.EntityForm.saveAndClose();

										
									}
                                }
							}
						);
				}
				// si no tiene operaciones cierro el proceso
				if (resultComponentes.length == 0  && operaciones == 0 && componentes == 0 && servicios == 0){
                     // TERMINADO
					//MobileCRM.UI.MessageBox.sayText(finMensaje);
					saveHandler.resumeSave();
					MobileCRM.UI.EntityForm.saveAndClose();
				}
			},
			 function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		 );		 		 
		 
		 
		 
		 
	 },
	
	DesactivarOperacionesOT: function (entityForm,orden) {
		
		// Desactivamos operaciones
		var operacionConfirmado = "300000001";
		var fetchXmlOperacionesBorrado =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
						"<entity name='msdyn_workorderservicetask'>" +
						"<attribute name='msdyn_workorderservicetaskid' />" +
						"<attribute name='atos_indicadorborrado' />" +
						"<attribute name='statuscode' />" +
						"<attribute name='statecode' />" +
						"<attribute name='atos_estadodelusuario' />" +
						"<attribute name='atos_numerooperacioncrm' />" +
						"<attribute name='atos_hojaderutaid' />" +
						"<order attribute='atos_indicadorborrado' descending='false' />"+
						"<filter type='and'>"+
						"<condition attribute='msdyn_workorder' operator='eq' value='" + orden[0][0] + "' />"+
						"<condition attribute='atos_estatusconfirmacion' operator='ne' value='" + operacionConfirmado + "' />" +
						"<condition attribute='statecode' operator='eq' value='0' />"+
						"</filter>" +
						"<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' link-type='inner' alias='ab'>" +
						"<filter type='and'>" +
						"<condition attribute='statuscode' operator='not-in'>" +
						"<value>300000017</value>" +
						"<value>2</value > " +
						"<value>300000015</value>" +
						"<value>300000016</value>" +
						"</condition>" +
						"</filter>" +
						"</link-entity>" +
						"</entity>"+
						"</fetch>";
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperacionesBorrado,
			function (resultOperacionesBorrado) {		
				operacionesBorrado = resultOperacionesBorrado.length;
				operacionesBorradoInsertada = 0;
				for (var i in resultOperacionesBorrado) {
					
					var operacionOT = new MobileCRM.DynamicEntity.createNew("msdyn_workorderservicetask");
					operacionOT.id = resultOperacionesBorrado[i][0]; 
					hojaDeRuta = resultOperacionesBorrado[i][6]; 
					operacionOT.isNew =false;
                    var props = operacionOT.properties;
					
					// CAMPOS DE LO OPERACION DE HOJA DE RUTA
					props.atos_indicadorborrado = 1;
					props.atos_origen = 1;
					props.statuscode = 2;
					props.statecode = 1; //SAP
                       operacionOT.save(
							function (err) {
								operacionesBorradoInsertada = operacionesBorradoInsertada + 1;
								if (err) {
                                   MobileCRM.UI.MessageBox.sayText(err);
								}
								else { 
									if (hojaDeRuta!=null)
											FS.HojaRuta.DesactivarHojaDeRuta( entityForm,this.id,orden,hojaDeRuta);
									FS.HojaRuta.DesactivarServiciosOT( entityForm,this.id,orden);
									FS.HojaRuta.DesactivarHorasTecnicoOT( entityForm,this.id,orden);
								}
						}
					);					
				}
				if (resultOperacionesBorrado.length == 0){
					// llamamos al copiado de ruta
					FS.HojaRuta.crearDatosHojaRutaOT( entityForm,orden,entityForm.entity.properties.atos_hojaderutaid.id);
				}
				
			},
			function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		);		 	
					
	},
	
	
	DesactivarHojaDeRuta: function (entityForm,operacionId,orden,hojaDeRuta) {
		var hojaDeRutaId = hojaDeRuta.id;
		var fetchXmlOperaciones = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
								"<entity name='msdyn_workorderservicetask'>" +
								"<attribute name='msdyn_workorderservicetaskid' />" +
								"<attribute name='atos_indicadorborrado' />" +
								"<attribute name='statuscode' />" +
								"<attribute name='statecode' />" +
								"<attribute name='atos_estadodelusuario' />" +
								"<attribute name='atos_numerooperacioncrm' />" +
								"<order attribute='atos_indicadorborrado' descending='false' />" +
								"<filter type='and'>" +
								"<condition attribute='msdyn_workorder' operator='eq' value='" + orden + "' />"+ 
								"<condition attribute='atos_hojaderutaid' operator='eq' value='"+ hojaDeRutaId +"' />" + 
								"<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" + 
								"</filter>" +
								"</entity>" +
								"</fetch>";
	
	MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlOperaciones,
		function success(result) {
			if (result.length >0){
				
			}
			else {
				
				var fetchXml =  "<fetch version='1.0'>" +
								"<entity name='atos_hojaderutadeordendetrabajo'>" +
								"<attribute name='atos_hojaderutadeordendetrabajoid' />" +
								"<attribute name='atos_hojaderutaid' />" +
								"<attribute name='atos_ordendetrabajoid' />" +
								"<filter type='and'>" +
								"<condition attribute='atos_ordendetrabajoid' operator='eq' value='" + orden[0][0] + "'/>" +
								"<condition attribute='atos_hojaderutaid' operator='eq' value='" + hojaDeRutaId + "'/>" +
								"</filter>" +
								"</entity>" +
								"</fetch>";
								

				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
					function (resultHojas) {
						for (var i in resultHojas) {
							
							var hojaDeRuta = new MobileCRM.DynamicEntity.createNew("atos_hojaderutadeordendetrabajo");
							
							hojaDeRuta.id = resultHojas[0][0];
							hojaDeRuta.isNew =false;
							hojaDeRuta.properties.atos_ordendetrabajoid = null;
							hojaDeRuta.properties.atos_hojaderutaborradaot = orden[0][4] + '-' + Date(Date.now()).substring(0, 39);
							hojaDeRuta.properties.atos_peticiondeborrado = 1;
							hojaDeRuta.properties.statuscode = 2;
							hojaDeRuta.properties.statecode = 1; //SAP
							hojaDeRuta.properties.atos_origen = 1;
							
							hojaDeRuta.save(
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
						FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
						saveHandler.resumeSave();
					},
					null
				);				
			}
		},
		function (error) {
			  FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
		});			
	},
	
	DesactivarHorasTecnicoOT: function (entityForm,operacionId,orden) {
		
		// Desactivamos horas tecnicos
		var fetchXmlHorasTecnicoBorrado ="<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
										"<entity name='atos_horastecnicooperacion'>" +
										"<attribute name='atos_horastecnicooperacionid' />" +
										"<order attribute='atos_name' descending='false' />" +
										"<filter type='and'>" +
										"<condition attribute='atos_operacionid' operator='eq' value='" + operacionId + "' />" +
										"</filter>" +
										"</entity>" +
										"</fetch>";
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlHorasTecnicoBorrado,
			function (resultHorasTecnicoBorrado) {		
				horasTecnicoBorrado = horasTecnicoBorrado + resultHorasTecnicoBorrado.length;
				for (var i in resultHorasTecnicoBorrado) {
					var horaTecnicoOT = new MobileCRM.DynamicEntity.createNew("atos_horastecnicooperacion");
					horaTecnicoOT.id = resultHorasTecnicoBorrado[i][0]; 
					horaTecnicoOT.isNew =false;
                    var props = horaTecnicoOT.properties;
					
					// CAMPOS DE HORAS RUTA
					props.atos_tecnicaid = null;
					props.atos_fechainicio = null;
					props.atos_fechafin = null;
					props.atos_trabajoreal = null;
					props.atos_duracionnormal = null;
					props.atos_particionnotificadaparcialmente = 0;
					props.atos_particionplanificada = 0;
					props.atos_porcentajeaptitud = null;
					props.atos_unidadduracionnormalid = null;
					props.atos_tecnicosap = null;
					props.atos_unidadtrabajorealid = null;
					props.atos_origen = 1;
                       horaTecnicoOT.save(
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
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		);		 	
	},	
	
	DesactivarServiciosOT: function (entityForm,operacionId,orden) {
		
		// Desactivamos operaciones
		var fetchXmlServiciosBorrado =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
										"<entity name='atos_serviciooperacion'>"+
										"<attribute name='atos_serviciooperacionid' />"+
										"<attribute name='atos_posicion' />"+
										"<attribute name='atos_operacionid' />"+
										"<attribute name='statecode' />"+
										"<order attribute='atos_posicion' descending='false' />"+
										"<filter type='and'>"+
										"<condition attribute='atos_operacionid' operator='eq'  value='" + operacionId + "' />"+
										"<condition attribute='statecode' operator='eq' value='0' />" +
										"</filter>" +
										"</entity>" +
										"</fetch>";
										
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlServiciosBorrado,
			function (resultServiciosBorrado) {		
				serviciosBorrado = serviciosBorrado + resultServiciosBorrado.length;
				servicioBorradoInsertado = 0;
				for (var i in resultServiciosBorrado) {
					
					var servicioOT = new MobileCRM.DynamicEntity.createNew("atos_serviciooperacion");
					servicioOT.id = resultServiciosBorrado[i][0]; 
					servicioOT.isNew =false;
                    var props = servicioOT.properties;
					
					// CAMPOS DE LO OPERACION DE HOJA DE RUTA
					props.atos_indicadorborrado = 1;
					props.atos_origen = 1;
					props.statuscode = 2;
					props.statecode = 1; //SAP
                       servicioOT.save(
							function (err) {
								servicioBorradoInsertado = servicioBorradoInsertado + 1;
								serviciosBorrado = serviciosBorrado -1;
								if (err) {
                                   MobileCRM.UI.MessageBox.sayText(err);
								}
								else {
								if (servicioBorradoInsertado == resultServiciosBorrado.length)
									FS.HojaRuta.DesactivarComponetesOT( entityForm,operacionId,orden );
								}
						}
					);					
				}
				if (resultServiciosBorrado.length == 0){
					// llamamos al copiado de ruta
					FS.HojaRuta.DesactivarComponetesOT( entityForm,operacionId,orden);
				}				
	
			},
			function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		);		 	
	},	
	
	DesactivarComponetesOT: function (entityForm,operacionId,orden) {
		
		// Desactivamos operaciones
		var operacionConfirmado = "300000001";
		var fetchXmlComponentesBorrado =  "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
											"<entity name='atos_componenteoperacion'>" +
											"<attribute name='atos_componenteoperacionid' />" +
											"<attribute name='atos_name' />" +
											"<attribute name='atos_ordendetrabajoid' />" +
											"<attribute name='atos_operacionid' />" +
											"<order attribute='atos_name' descending='false' />" +
											"<filter type='and'>" +
											"<condition attribute='statecode' operator='eq' value='0' />" +
											"<condition attribute='atos_operacionid' operator='eq' value='" + operacionId + "' />" +
											"</filter>" +
											"</entity>" +
											"</fetch>";
											
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlComponentesBorrado,
			function (resultComponentesBorrado) {	
			componentesBorrado = componentesBorrado + resultComponentesBorrado.length;
			operacionesBorrado = operacionesBorrado - 1;
			var componenteBorradoInsertado = 0;
			for (var i in resultComponentesBorrado) {
					
					var componenteOT = new MobileCRM.DynamicEntity.createNew("atos_componenteoperacion");
					componenteOT.id = resultComponentesBorrado[i][0]; 
					componenteOT.isNew =false;
                    var props = componenteOT.properties;
					
					// CAMPOS DE LO OPERACION DE HOJA DE RUTA
					props.atos_indicadorborrado = 1;
					props.atos_origen = 1;
					props.statuscode = 2;
					props.statecode = 1; //SAP
                       componenteOT.save(
							function (err) {
							    componenteBorradoInsertado = componenteBorradoInsertado + 1;
								componentesBorrado = componentesBorrado -1;
								if (err) {
                                   MobileCRM.UI.MessageBox.sayText(err);
								}
								else {
								if (componenteBorradoInsertado == resultComponentesBorrado.length && componentesBorrado == 0 && serviciosBorrado == 0 && operacionesBorrado == 0 )
									//MobileCRM.UI.MessageBox.sayText("deshabilitado");
									//saveHandler.resumeSave();
									//MobileCRM.UI.EntityForm.saveAndClose();
									FS.HojaRuta.crearDatosHojaRutaOT( entityForm,orden,entityForm.entity.properties.atos_hojaderutaid.id);
								}
						}
					);					
				}
				if (resultComponentesBorrado.length == 0 && componentesBorrado == 0 && serviciosBorrado == 0 && operacionesBorrado == 0 ){
					// llamamos al copiado de ruta
					//MobileCRM.UI.MessageBox.sayText("deshabilitado");
					//saveHandler.resumeSave();
					//MobileCRM.UI.EntityForm.saveAndClose();
					FS.HojaRuta.crearDatosHojaRutaOT( entityForm,orden,entityForm.entity.properties.atos_hojaderutaid.id);
				}				

			
				
			},
			function (err) {
				FS.CommonEDPR.GetErrorCollectionByCode('JS_001', entityForm);
			},
			null
		);		 	
	},		
	
	filterClaseActividad: function (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion,tipoMovimiento) {        
        //Se informa la clase de actividad por el valor que tenga en la entidad Centro Coste x Puesto de Trabajo
        var puestoDeTrabajo = ubicacion[4];
        var ubicacionTecnica = ubicacion[5] ;

        if ((puestoDeTrabajo != null) && (ubicacionTecnica != null)) {
            var puestoDeTrabajoId = ubicacion[4].id;
            var ubicacionTecnicaId = ubicacion[5];
			//primaryName

			 var fetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
			"<entity name='account'>"+ 
			"<attribute name='atos_centrodecosteid'/>" +
			"<attribute name='atos_sociedadcoid'/>" +
			"<filter type='and'>" +
			"<condition attribute='accountid' value='" + ubicacionTecnicaId + "' operator='eq'/>" +
			"</filter>" +
			"</entity>" +
			"</fetch>";
		
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
				function (result) {
					FS.HojaRuta.AsignarValorClaseActividad(entityForm,puestoDeTrabajoId,result[0][0], result[0][1],orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
				},
				function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				entityForm
			);


        } else {             
            if (ubicacionTecnica != null) {
                FS.HojaRuta.calcularClaseActividadNOPM_porUT(entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
            } 
			else {
				FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
			}
        } 
    },
	
    calcularClaseActividadNOPM_porUT: function (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento) {
        var ubicacionTecnicaId =ubicacion[5] ;
		var fetchXml =   "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
			"<entity name='account'>"+ 
			"<attribute name='atos_sociedadcoid'/>" +
			"<filter type='and'>" +
			"<condition attribute='accountid' value='" + ubicacionTecnicaId + "' operator='eq'/>" +
			"</filter>" +
			"</entity>" +
			"</fetch>";
		
		MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
			function (result) {
				if (result[0][0]!=null){
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
							 	if (result.length == 1){
									MobileCRM.UI.EntityForm.requestObject(
										function (entityForm) {
											operacion.properties.atos_clasedeactividadid  = new MobileCRM.Reference("atos_clasedeactividad2", result[0][0] ,result[0][1] );
											FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
										},
										FS.CommonEDPR.onError,
										null
									);									
								}
								else {
									FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
								}

						},
						function (err) {
							FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
						},
						entityForm
					);					 
	 
				}
				else {
					FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
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
	AsignarValorClaseActividad : function (entityForm,puestoTrabajoId, centroCoste, sociedadCO,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento) {
		//debugger;
		var fetchXml = "";
		var centroCte = false;
		var socCO = false;
		if (centroCoste != null) {
			centroCte = true;
			fetchXml =  "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
						"<entity name='atos_centrocoste_puestotrabajo'>" +
						"<attribute name='atos_centrocoste_puestotrabajoid'/>"+
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
	    if (fetchXml !="") {
			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
				function (result) {
					if (result.length > 0){
						if (result[0][3] != null) {
							MobileCRM.UI.EntityForm.requestObject(
								function (entityForm) {
									operacion.properties.atos_clasedeactividadid  = new MobileCRM.Reference("atos_clasedeactividad2", result[0][3].id ,result[0][3].primaryName );
									FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
								},
								FS.CommonEDPR.onError,
								null
							);						
						}
						else {
							FS.HojaRuta.calcularClaseActividadNOPM_porUT(entityForm,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
						}
					}
					else {
						//se llama al metodo nuevamente para buscar por otro valor
						if (centroCoste != null) {
							FS.HojaRuta.AsignarValorClaseActividad(entityForm,puestoTrabajoId, null, sociedadCO,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);

						} else if (sociedadCO != null) {
							FS.HojaRuta.AsignarValorClaseActividad(entityForm,puestoTrabajoId, centroCoste, null,orden,hojaRutaId,resultOperaciones,operacion, ubicacion, tipoMovimiento);
						}
					}
					
				},
				function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				entityForm
			);	
		}
		else {
			FS.HojaRuta.GuardarOperacion (entityForm,orden,hojaRutaId,operacionPlantilla,operacion, ubicacion, ultima,tipoMovimiento);
		}		
	},
	
	
	
}

function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}
      


