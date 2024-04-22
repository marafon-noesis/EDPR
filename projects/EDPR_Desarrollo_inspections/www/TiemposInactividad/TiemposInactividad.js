if (typeof (FS) == "undefined") { FS = { __namespace: true }; }

if (typeof (TiemposInactividad) == "undefined") { TiemposInactividad = { __namespace: true }; }

//#region Variables GLOBALES
var formulario;
var wait;
var enviarOT_A_SAP = false;
var ordenTrabajoId = null;
var statusConfirmacionOperacion = null;
//#endregion


FS.TiemposInactividad = {
    // funci?n  que se lanza cuando se carga la pantalla de  tiempos de  inactividad  y asigna los eventos que se podran realizar 
    //... 
    // AAC 07-11-2018
    TiemposInactividadOnLoad: function () {
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
    // función  que se lanza cuando se carga 
    //...
    // AAC 07-11-2018
    onLoad: function (entityForm) {
        var self = this;
        formulario = entityForm;
        var servicio = entityForm.entity;
       	
    },
    // función  que se lanza cuando se guarda 
    //...
    // AAC 07-11-2018
    onSave: function (entityForm) {
        var self = this;
    },
	onPostSave: function (entityForm) {
        var self = this;

		
    },
	
 // función  que se encarga de rediriguir todos los onchange de los  componente de una hora tecnico
    // AAC 08-10-2019
    onChange: function (entityForm) {
        var changedItem = entityForm.context.changedItem;
        var entity = entityForm.entity;
        var self = this;

      	if (changedItem == "atos_fechainicio") {
            self.ValidarFechasFI(entityForm);
        }	
         // duracion de horas real		
		if (changedItem == "atos_fechafin") {
            self.ValidarFechasFF(entityForm);
        }	
		
    },
	
    ValidarFechasFI: function (entityForm) {
        try {
			var self = this;
            var FI = entityForm.entity.properties.atos_fechainicio ;
       
            if (FI != null) {
                self.ValidarFechasFF(entityForm);
            }
        }
        catch (err) {
            FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
        }
    },
	
	ValidarFechasFF: function (entityForm) {
        var self = this;
        try {
            var _FI = entityForm.entity.properties.atos_fechainicio;
            var _FF = entityForm.entity.properties.atos_fechafin;
            var DayValue = 1000 * 60 * 60 * 24;
            if (_FF != null && _FI != null) {
                var dd = Math.ceil((_FF.getTime() - _FI.getTime()));
                var total = parseFloat(eval(dd / DayValue));

                var yearFI = _FI.getFullYear() + "";
                var monthFI = (_FI.getMonth() + 1) + "";
                var dayFI = _FI.getDate() + "";
                var dateFormatfechaInicio = yearFI + "-" + monthFI + "-" + dayFI;
                var yearFF = _FF.getFullYear() + "";
                var monthFF = (_FF.getMonth() + 1) + "";
                var dayFF = _FF.getDate() + "";
                var dateFormatfechaFin = yearFF + "-" + monthFF + "-" + dayFF;

                if (total < 0 ) {

                    var idMsjeError = "10111_002";
                    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                        "<entity name='atos_coleccionerrores'>" +
                        "<attribute name='atos_coleccionerroresid' />" +
                        "<attribute name='atos_descripcion_en' />" +
                        "<attribute name='atos_descripcion_es' />" +
                        "<attribute name='atos_tipoerror' />" +
                        "<order attribute='atos_codigo' descending='false' />" +
                        "<filter type='and'>" +
                        "<condition attribute='atos_codigo' operator='eq' value='" + idMsjeError + "' />" +
                        "</filter>" +
                        "</entity>" +
                        "</fetch>";
						
				    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
					function (result) {
						for (var i in result) {
							var mensaje = "";
                            var tipo = "";
							if (IdiomaUsuario == Idioma.ingles) {
								 mensaje = result[i][1];
								 MobileCRM.UI.MessageBox.sayText(mensaje);
							}
							else 
							{
								 mensaje = result[i][2];
								 MobileCRM.UI.MessageBox.sayText(mensaje);
							}
						}
						MobileCRM.UI.EntityForm.requestObject(
							function (entityForm) {
								entityForm.entity.properties.atos_horastotalesinactividad = null;
								entityForm.entity.properties.atos_fechafin = null;
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
					entityForm.entity.properties.atos_horastotalesinactividad = total * 24;
				}
            }
			else 
			{
					entityForm.entity.properties.atos_horastotalesinactividad = null;
			}
        }
        catch (err) {
             FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
        }

    },
	
}


      


