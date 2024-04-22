if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (CatalogoAviso) == "undefined") { CatalogoAviso = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
//#endregion


FS.CatalogoAviso = {
    // funci?n  que se lanza cuando se carga la pantalla de  catalogo Aviso y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    CatalogoAvisoOnLoad: function () {
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
    // funci?n  que se lanza cuando se carga el catalogo aviso
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var aviso = entityForm.entity;
		
		self.obtenerPosicionAsociada(entityForm);
		self.mostrarSeccion(entityForm);
    },
    // función  que se lanza cuando se guarda el catalogo aviso 
    //...
    // AAC 07-11-2018
    onSave: function (entityForm) {
        var self = this;
       // Validamos que la fecha de inicio sea menor que la fecha de fin  si es del tipo "object parts"
       
		if (entityForm.entity.properties.atos_fechainicio != null &&  entityForm.entity.properties.atos_fechafin !=null)
		{
			var fechaInicio = entityForm.entity.properties.atos_fechainicio;
			var fechaFin = entityForm.entity.properties.atos_fechafin;
			
			
			var mesajeErr ="";
			if (IdiomaUsuario == Idioma.ingles)
				mesajeErr ="Initial date cant  be less than Final date.";
			else 
				mesajeErr ="La fecha inicial no puede ser mayor que la fecha final.";
			
			if (fechaInicio > fechaFin){
				 entityForm.cancelValidation(mesajeErr);
			}
		
		}
		// asignamos el campo atos origen
		entityForm.entity.properties.atos_origen = 300000002;
    },
    // funci?n  que se encarga de rediriguir todos los onchange de los  catalogos de avisos
    // AAC 07-11-2018
    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;

        if (changedItem == "atos_catalogoid") {
           // ponemos las seccion que corresponda;
		   self.obtenerPosicionAsociada(entityForm);
		   self.mostrarSeccion(entityForm);
		   self.limpiarCampoCodigoGrupo(entityForm);
		   self.limpiarCampoCodigo(entityForm);
        } 
		
		if (changedItem == "atos_grcodigosid") {
           // ponemos las seccion que corresponda;
		   self.limpiarCampoCodigo(entityForm);
        }
		
		if (changedItem == "atos_codigoid") {
           // ponemos las seccion que corresponda;
		   self.autoCompletarCatalogoGrupo(entityForm);
        }
		
		if (changedItem == "atos_grupodecodigosdedaosid") {
           // ponemos las seccion que corresponda;
		   self.limpiarCampoCodigoDao(entityForm);
        }
		
		if (changedItem == "atos_dao") {
           // ponemos las seccion que corresponda;
		   self.autoCompletarCatalogoGrupoDao(entityForm);
        }
		
		
    },
	mostrarSeccion: function (entityForm) {

		entityForm.getDetailView("General").isVisible = true;
		entityForm.getDetailView("Texto").isVisible = false;
		entityForm.getDetailView("Fechas").isVisible = false;
		entityForm.getDetailView("Posicion Asociada").isVisible = false;
		entityForm.detailViews[4].isVisible = false;
		
		if (entityForm.entity.properties.atos_catalogoid != null){
		  var Catid = entityForm.entity.properties.atos_catalogoid.id;
		  //obtenemos el catalogo y segun el valor seleccionaremos lo que se ve
		  
		    var catalogo = new MobileCRM.FetchXml.Entity("atos_catalog");
                catalogo.addAttribute("atos_codigo");
                catalogo.addAttribute("atos_palabraclave");
                catalogo.addAttribute("atos_name_es");
                catalogo.addAttribute("atos_name_en");
                var filter = new MobileCRM.FetchXml.Filter();
                filter.where("atos_catalogid", "eq", Catid);
                catalogo.filter = filter;
                var fetch = new MobileCRM.FetchXml.Fetch(catalogo);
				
				fetch.execute("Array", function (result) {
					MobileCRM.UI.EntityForm.requestObject(
					function (entityForm) {
						for (var i in result) {
							var results = result[i]
		
							if (results[1] == "Causes") {
								entityForm.getDetailView("Texto").isVisible = false;
								entityForm.getDetailView("Fechas").isVisible = false;
								entityForm.getDetailView("Posicion Asociada").isVisible = true;
								entityForm.detailViews[4].isVisible = false;
							} 
							else if (results[1] == "Object Parts") {
								entityForm.getDetailView("Texto").isVisible = false;
								entityForm.getDetailView("Fechas").isVisible = false;
								entityForm.getDetailView("Posicion Asociada").isVisible = false;
								entityForm.detailViews[4].isVisible = true;	
							}
							else if (results[1] == "Activity PM") {
								entityForm.getDetailView("Texto").isVisible = true;
								entityForm.getDetailView("Fechas").isVisible = true;
								entityForm.getDetailView("Posicion Asociada").isVisible = false;
								entityForm.detailViews[4].isVisible = false;
								
									if (entityForm.entity.isNew){
									 FS.CatalogoAviso.InicializarFechaInicio(entityForm);	
									}
									else {
										if ( entityForm.entity.properties.atos_grcodigosid == null  && entityForm.entity.properties.atos_codigoid == null &&  entityForm.entity.properties.atos_fechainicio == null ){
											 FS.CatalogoAviso.InicializarFechaInicio(entityForm);	
										}
									}
							}
						} 
						},
						FS.CommonEDPR.onError,
						null
					);
					
				}, function (err) {
					FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				null);				
		}  
	},
	/// <summary>Para los catálogos de tipo Causas, obtiene en el campo posición asociada con información
	/// de los catálogos "parte de objetos" que tenga el aviso</summary>
	obtenerPosicionAsociada: function (entityForm) {
        var self = this;
		var catalogoId =  entityForm.entity.properties.atos_catalogoid ;
        var codigoCatalogo = "";
		 if (catalogoId != null) {
			var avisoId = entityForm.entity.properties.atos_avisoid ;
			if (avisoId != null) {			  
				
				
			}
		 }
		 else {
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					entityForm.entity.properties.atos_codigoid = null;				
					entityForm.entity.properties.atos_grcodigosid = null;	
					entityForm.entity.properties.atos_posicionasociadaid = null;	
				},
				FS.CommonEDPR.onError,
				null
			);
		 }

    },
	/// <summary>Si el campo grupo Código es null se borra el datos que tenga el campo Código</summary>
	limpiarCampoCodigo: function (entityForm) {
		//if (entityForm.entity.properties.atos_grcodigosid == null) {
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					if (entityForm.entity.properties.atos_codigoid != null){
						entityForm.entity.properties.atos_codigoid = null;		
					}					
				},
				FS.CommonEDPR.onError,
				null
				);
		//}
    },
	
	
	
		/// <summary>Si el campo grupo Código es null se borra el datos que tenga el campo Código</summary>
	limpiarCampoCodigoGrupo: function (entityForm) {
		//if (entityForm.entity.properties.atos_grcodigosid == null) {
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					if (entityForm.entity.properties.atos_grcodigosid != null){
						entityForm.entity.properties.atos_grcodigosid = null;
					}					
					
				},
				
				FS.CommonEDPR.onError,
				null
				);
		//}
    },
	
	
	limpiarCampoCodigoDao: function (entityForm) {
		//if (entityForm.entity.properties.atos_grupodecodigosdedaosid == null) {
			MobileCRM.UI.EntityForm.requestObject(
				function (entityForm) {
					entityForm.entity.properties.atos_dao = null;				
				},
				FS.CommonEDPR.onError,
				null
				);
		//}
    },
	
	
	autoCompletarCatalogoGrupo: function (entityForm) {
		if (entityForm.entity.properties.atos_codigoid != null) {
			var id = entityForm.entity.properties.atos_codigoid.id;
			var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_codigos'>" +
                "<attribute name='atos_codigosid' />" +
                "<attribute name='atos_name' />" +
                "<attribute name='atos_grupocodigosid' />" + 
                "<attribute name='atos_catalogoid' />" +
                "<order attribute='atos_name' descending='false' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_codigosid' operator='eq' value='" + id + "' />" +
                "</filter>" +
                "<link-entity name='atos_grupocodigoscatalogo' from='atos_grupocodigoscatalogoid' to='atos_grupocodigosid' visible='false' link-type='outer' alias='aa'>" +
                "<attribute name='atos_codigodelgrupo' />" +
                "</link-entity>" +
                "<link-entity name='atos_catalog' from='atos_catalogid' to='atos_catalogoid' visible='false' link-type='outer' alias='bb'>" +
                "<attribute name='atos_name' />" +
                "</link-entity>" + 
                "</entity>" +
                "</fetch>";
				
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
							
                        if (result[0][3]!=null)
							entityForm.entity.properties.atos_catalogoid = new MobileCRM.Reference(result[0][3].entityName, result[0][3].id, result[0][3].primaryName);
						else 
							entityForm.entity.properties.atos_catalogoid = null;
						
						if (result[0][2]!=null)
							entityForm.entity.properties.atos_grcodigosid = new MobileCRM.Reference(result[0][2].entityName, result[0][2].id, result[0][2].primaryName);
						else 
							entityForm.entity.properties.atos_grcodigosid =null;
					
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
    },
	
	
	autoCompletarCatalogoGrupoDao: function (entityForm) {
		if (entityForm.entity.properties.atos_dao != null) {
			var id = entityForm.entity.properties.atos_dao.id;
			var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
                "<entity name='atos_codigos'>" +
                "<attribute name='atos_codigosid' />" +
                "<attribute name='atos_name' />" +
                "<attribute name='atos_grupocodigosid' />" + 
                "<attribute name='atos_catalogoid' />" +
                "<order attribute='atos_name' descending='false' />" +
                "<filter type='and'>" +
                "<condition attribute='atos_codigosid' operator='eq' value='" + id + "' />" +
                "</filter>" +
                "<link-entity name='atos_grupocodigoscatalogo' from='atos_grupocodigoscatalogoid' to='atos_grupocodigosid' visible='false' link-type='outer' alias='aa'>" +
                "<attribute name='atos_codigodelgrupo' />" +
                "</link-entity>" +
                "<link-entity name='atos_catalog' from='atos_catalogid' to='atos_catalogoid' visible='false' link-type='outer' alias='bb'>" +
                "<attribute name='atos_name' />" +
                "</link-entity>" + 
                "</entity>" +
                "</fetch>";
				
				MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                function (result) {
                    
                    MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {

						if (result[0][2]!=null)
							entityForm.entity.properties.atos_grupodecodigosdedaosid = new MobileCRM.Reference(result[0][2].entityName, result[0][2].id, result[0][2].primaryName);
						else 
							entityForm.entity.properties.atos_grupodecodigosdedaosid =null;
					
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
    },
	
	
	InicializarFechaInicio: function (entityForm) {	
	    var aviso =  entityForm.entity.properties.atos_avisoid;
		if (aviso != null) {
			var avisoId =  entityForm.entity.properties.atos_avisoid.id;
			var fetchXml = "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
							"<entity name='atos_aviso'>" +
							"<attribute name='atos_fechainicioaveria'/>" +
							"<filter type='and'>" +
							"<condition attribute='atos_avisoid' value='" + avisoId + "' operator='eq'/>" +
							"</filter>" +
							"</entity>" +
							"</fetch>";
		  

			MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
				function success(result) {
					   for (var i in result) {
						   if (result[i][0] != null) {
							   entityForm.entity.properties.atos_fechainicio = result[i][0];
						   }
					   }
					if ((result.entities != null) && (result.entities.length > 0)) {
						var fechaInicio = result.entities[0]["atos_fechainicioaveria"];
						
					}
				},

				function (err) {
					  FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
				},
				entityForm
				);
		}
	}
}


      


