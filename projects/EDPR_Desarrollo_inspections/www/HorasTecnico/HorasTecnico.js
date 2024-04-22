if (typeof FS == "undefined") {
  FS = { __namespace: true };
}

if (typeof HorasTecnico == "undefined") {
  HorasTecnico = { __namespace: true };
}

//#region Variables GLOBALES
var formulario;
var wait;
var enviarOT_A_SAP = false;
var ordenTrabajoId = null;
var statusConfirmacionOperacion = null;
//#endregion
//23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
var esUbicacionAmericana = false;

FS.HorasTecnico = {
  // funci?n  que se lanza cuando se carga la pantalla de  servicio de operaciones  y asigna los eventos que se podran realizar
  //...
  // AAC 07-11-2018
  HorasTecnicoOnLoad: function () {
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
  // funci?n  que se lanza cuando se carga una hora tecnico
  //...
  // AAC 07-11-2018
  onLoad: function (entityForm) {
    var self = this;
    formulario = entityForm;
    var servicio = entityForm.entity;
    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
    FS.HorasTecnico.CalcularEsUbicacionAmericana(entityForm);

    // creamos boton de borrar horas tecnico
    MobileCRM.UI.EntityForm.onCommand(
      "custom_BorrarHorasTecnico",
      function (entityForm) {
        FS.HorasTecnico.BorrarHorasTecnico(entityForm);
      },
      true
    );

    self.cargarOrdeDetrabajo(entityForm);

    if (servicio.isNew) {
      enviarOT_A_SAP = true;
      self.ValoresPorDefectoUnidad(entityForm);
      self.CalcularFechasoperacion(entityForm);
    }
  },
  // función  que se lanza cuando se guarda una hora tecnico
  //...
  // AAC 07-11-2018
  onSave: function (entityForm) {
    var self = this;
    var saveHandler = entityForm.suspendSave();
    this.CalcularHorasTotales(entityForm, saveHandler);
    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
    if (
      entityForm.entity.properties.atos_trabajoreal == 0 &&
      esUbicacionAmericana
    ) {
      FS.HorasTecnico.MensajeCeroHorasTotales(entityForm, saveHandler);
    }
  },
  onPostSave: function (entityForm) {
    var self = this;
    //this.CalcularHorasTotales(entityForm);

    var sincronizando = 3;
    var noEnviado = 2;
    try {
      if (enviarOT_A_SAP && ordenTrabajoId != null) {
        //FS.HorasTecnico.actualizarOTEnvioSAP(ordenTrabajoId ,entityForm );
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  cargarOrdeDetrabajo: function (entityForm) {
    if (entityForm.entity.properties.atos_operacionid != null) {
      var fetchXml =
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'> " +
        "  <entity name='msdyn_workorderservicetask'>" +
        "    <attribute name='msdyn_workorder' />" +
        "    <attribute name='atos_estatusconfirmacion' />" +
        "    <filter type='and'>" +
        "      <condition attribute='msdyn_workorderservicetaskid' operator='eq' value='" +
        entityForm.entity.properties.atos_operacionid.id +
        "' />" +
        "    </filter>" +
        "  </entity>" +
        "</fetch>";

      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXml,
        function (result) {
          for (var i in result) {
            ordenTrabajoId = result[i][0].id;
            statusConfirmacionOperacion = result[i][1];
            MobileCRM.UI.EntityForm.requestObject(
              function (entityForm) {
                var dv = entityForm.getDetailView("General");

                if (
                  statusConfirmacionOperacion != null &&
                  statusConfirmacionOperacion == 300000001
                ) {
                  dv.getItemByName("atos_tecnicoid").isEnabled = false;
                  dv.getItemByName("atos_fechainicio").isEnabled = false;
                  dv.getItemByName("atos_fechafin").isEnabled = false;
                  dv.getItemByName("atos_trabajoreal").isEnabled = false;
                  MobileCRM.UI.EntityForm.enableCommand(
                    "custom_BorrarHorasTecnico",
                    false
                  );
                } else {
                  dv.getItemByName("atos_tecnicoid").isEnabled = true;
                  dv.getItemByName("atos_fechainicio").isEnabled = true;
                  dv.getItemByName("atos_fechafin").isEnabled = true;
                  dv.getItemByName("atos_trabajoreal").isEnabled = true;
                  MobileCRM.UI.EntityForm.enableCommand(
                    "custom_BorrarHorasTecnico",
                    true
                  );
                }
              },
              FS.CommonEDPR.onError,
              null
            );
          }
        },
        function (err) {
          FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
        },
        entityForm
      );
    }
  },

  //En la creacion del componente es necesario informar a SAP inmediatamente la creacion del registro
  actualizarOTEnvioSAP: function (ordenTrabajoId, entityForm) {
    var SAP = 1;

    var OrdeTrabajo = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
    OrdeTrabajo.id = ordenTrabajoId;
    OrdeTrabajo.isNew = false;
    // OrdeTrabajo.properties.atos_enintegracion = false;
    OrdeTrabajo.properties.atos_origen = SAP;
    var postSuspend = entityForm.suspendPostSave();

    OrdeTrabajo.save(function (err) {
      if (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
        postSuspend.resumePostSave();
      }
      // else {

      // 	var OrdeTrabajo = new MobileCRM.DynamicEntity.createNew("msdyn_workorder");
      // 	OrdeTrabajo.id =  ordenTrabajoId;
      // 	OrdeTrabajo.isNew = false;
      // 	OrdeTrabajo.properties.atos_enintegracion = true;
      // 	OrdeTrabajo.properties.atos_origen = SAP;

      //  	OrdeTrabajo.save(
      // 		function (err) {
      // 			if (err) {
      // 				FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
      // 			}
      // 			else {

      // 			}
      // 			postSuspend.resumePostSave();
      // 		}
      // 	);

      // }
    });
  },

  // función  que se encarga de rediriguir todos los onchange de los  componente de una hora tecnico
  // AAC 07-11-2018
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

    // duracion de horas real
    if (changedItem == "atos_trabajoreal") {
      self.OnchageTrabajoReal(entityForm);
    }

    // duracion de horas real
    if (changedItem == "atos_tecnicoid") {
      self.OnchageTecnico(entityForm);
    }
  },

  OnchageTecnico: function (entityForm) {
    if (
      entityForm.entity.properties.atos_tecnicoid != null &&
      entityForm.entity.properties.atos_unidadtrabajorealid == null
    ) {
      FS.HorasTecnico.ValoresPorDefectoUnidad(entityForm);
    }
  },
  OnchageTrabajoReal: function (entityForm) {
    if (entityForm.entity.properties.atos_trabajoreal != null) {
      entityForm.entity.properties.atos_duracionnormal =
        entityForm.entity.properties.atos_trabajoreal;
    } else {
      entityForm.entity.properties.atos_duracionnormal = null;
    }
  },

  //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
  MensajeCeroHorasTotales: function (entityForm, saveHandler) {
    var idMsjeError = "10104_115";
    var fetchXml =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
      "<entity name='atos_coleccionerrores'>" +
      "<attribute name='atos_coleccionerroresid' />" +
      "<attribute name='atos_descripcion_en' />" +
      "<attribute name='atos_descripcion_es' />" +
      "<attribute name='atos_tipoerror' />" +
      "<order attribute='atos_codigo' descending='false' />" +
      "<filter type='and'>" +
      "<condition attribute='atos_codigo' operator='eq' value='" +
      idMsjeError +
      "' />" +
      "</filter>" +
      "</entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (result) {
        for (var i in result) {
          var mensaje = "";
          var tipo = "";
          if (IdiomaUsuario == Idioma.ingles) {
            mensaje = result[i][1];
            MobileCRM.UI.MessageBox.sayText(mensaje);
          } else {
            mensaje = result[i][2];
            MobileCRM.UI.MessageBox.sayText(mensaje);
          }
        }
        saveHandler.resumeSave();
      },
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      entityForm
    );
  },

  CalcularFechasoperacion: function (entityForm) {
    var operacionId = entityForm.entity.properties.atos_operacionid.id;
    var fetchXml =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
      "  <entity name='msdyn_workorderservicetask'>" +
      "    <attribute name='atos_fechainicioreal' />" +
      "    <attribute name='atos_fechafinreal' />" +
      "    <filter type='and'>" +
      "      <condition attribute='msdyn_workorderservicetaskid' operator='eq'  value='" +
      operacionId +
      "' />" +
      "    </filter>" +
      "  </entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (result) {
        for (var i in result) {
          var fechainicio = result[0][0];
          var fechafin = result[0][1];

          MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
              if (fechainicio != null)
                entityForm.entity.properties.atos_fechainicio = new Date(
                  fechainicio
                );
              if (fechafin != null)
                entityForm.entity.properties.atos_fechafin = new Date(fechafin);
              FS.HorasTecnico.ValidarFechasFI(entityForm);
            },
            FS.CommonEDPR.onError,
            null
          );
        }
      },
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      entityForm
    );
  },
  //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
  CalcularEsUbicacionAmericana: function (entityForm) {
    var operacionId = entityForm.entity.properties.atos_operacionid.id;
    var fetchXml =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'> " +
      "  <entity name='account'>" +
      "    <attribute name='name' />" +
      "    <link-entity name='msdyn_workorder' from='msdyn_serviceaccount' to='accountid' link-type='inner' alias='ac'>" +
      "      <link-entity name='msdyn_workorderservicetask' from='msdyn_workorder' to='msdyn_workorderid' link-type='inner' alias='ad'>" +
      "        <filter type='and'>" +
      "          <condition attribute='msdyn_workorderservicetaskid' operator='eq'  value='" +
      operacionId +
      "' />" +
      "        </filter>" +
      "      </link-entity>" +
      "    </link-entity>" +
      "  </entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (result) {
        for (var i in result) {
          var ubicacion = result[i][0];
          if (
            ubicacion.split("-").length > 2 &&
            ubicacion.split("-")[1] != "US" &&
            ubicacion.split("-")[1] != "CA" &&
            ubicacion.split("-")[1] != "MX"
          ) {
            esUbicacionAmericana = false;
          } else {
            esUbicacionAmericana = true;
          }
        }
      },
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      entityForm
    );
  },

  ValidarFechasFI: function (entityForm) {
    try {
      var self = this;
      var FI = entityForm.entity.properties.atos_fechainicio;

      if (FI != null) {
        self.ValidarFechasFF(entityForm);
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  ValidarFechasFF: function (entityForm) {
    var self = this;
    try {
      var _FI = entityForm.entity.properties.atos_fechainicio;
      var _FF = entityForm.entity.properties.atos_fechafin;
      var DayValue = 1000 * 60 * 60 * 24;
      if (_FF != null && _FI != null) {
        var dd = Math.ceil(_FF.getTime() - _FI.getTime());
        var total = parseFloat(eval(dd / DayValue));

        var yearFI = _FI.getFullYear() + "";
        var monthFI = _FI.getMonth() + 1 + "";
        var dayFI = _FI.getDate() + "";
        var dateFormatfechaInicio = yearFI + "-" + monthFI + "-" + dayFI;
        var yearFF = _FF.getFullYear() + "";
        var monthFF = _FF.getMonth() + 1 + "";
        var dayFF = _FF.getDate() + "";
        var dateFormatfechaFin = yearFF + "-" + monthFF + "-" + dayFF;

        if (total < 0) {
          var idMsjeError = "10111_002";
          var fetchXml =
            "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "<entity name='atos_coleccionerrores'>" +
            "<attribute name='atos_coleccionerroresid' />" +
            "<attribute name='atos_descripcion_en' />" +
            "<attribute name='atos_descripcion_es' />" +
            "<attribute name='atos_tipoerror' />" +
            "<order attribute='atos_codigo' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_codigo' operator='eq' value='" +
            idMsjeError +
            "' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

          MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml,
            function (result) {
              for (var i in result) {
                var mensaje = "";
                var tipo = "";
                if (IdiomaUsuario == Idioma.ingles) {
                  mensaje = result[i][1];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                } else {
                  mensaje = result[i][2];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                }
              }
              entityForm.entity.properties.atos_trabajoreal = null;
            },
            function (err) {
              FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
            },
            entityForm
          );
        } else {
          entityForm.entity.properties.atos_trabajoreal = total * 24;
          //this.CalcularHorasTotales(entityForm);
        }
      } else {
        entityForm.entity.properties.atos_trabajoreal = null;
      }
      self.OnchageTrabajoReal(entityForm);
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },
  CalcularHorasTotales: function (entityForm, saveHandler) {
    try {
      var horasTecnicoId = entityForm.entity.id;
      var operacionId = entityForm.entity.properties.atos_operacionid.id;
      //msdyn_workorderservicetask
      var fetchXml =
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
        "<entity name='atos_horastecnicooperacion'>" +
        "<attribute name='atos_fechainicio' />" +
        "<attribute name='atos_fechafin' />" +
        "<attribute name='atos_trabajoreal' />" +
        "<filter type='and'>" +
        "<condition attribute='atos_horastecnicooperacionid' operator='neq' value='" +
        horasTecnicoId +
        "' />" +
        "<condition attribute='atos_operacionid' operator='eq' value='" +
        operacionId +
        "' />" +
        "</filter>" +
        "</entity>" +
        "</fetch>";

      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXml,
        function (result) {
          var fechaInicio;
          var fechaFin;
          var TotalOperadores = 1 + result.length;
          var TotalHoras = 0;
          var HorasInicial = 0;
          if (result != null && result.length > 0) {
            var i;
            for (var i in result) {
              TotalHoras = TotalHoras + parseInt(result[i][2]);
              if (i == 0) {
                fechaInicio = new Date(result[i][0]);
                fechaFin = new Date(result[i][1]);
                HorasInicial = parseInt(TotalHoras);
              }
            }
            if (fechaInicio < new Date(result[i][0])) {
              fechaInicio = new Date(result[i][0]);
            }
            if (fechaFin < new Date(result[i][1])) {
              fechaFin = new Date(result[i][1]);
            }
          } else {
            fechaInicio = entityForm.entity.properties.atos_fechainicio;
            fechaFin = entityForm.entity.properties.atos_fechafin;
            HorasInicial = entityForm.entity.properties.atos_trabajoreal;
          }
          TotalHoras =
            TotalHoras + entityForm.entity.properties.atos_trabajoreal;

          var updateOperacion = new MobileCRM.DynamicEntity.createNew(
            "msdyn_workorderservicetask"
          );
          var propsUpd = updateOperacion.properties;
          updateOperacion.id = entityForm.entity.properties.atos_operacionid.id;
          updateOperacion.isNew = false;

          propsUpd.atos_fechainicioreal = fechaInicio;
          propsUpd.atos_fechafinreal = fechaFin;
          propsUpd.atos_capacidadreal = TotalOperadores;
          propsUpd.atos_duracionrealhoras = HorasInicial;
          propsUpd.atos_trabajoreal = TotalHoras;

          updateOperacion.save(function (err) {
            if (err) {
              MobileCRM.UI.MessageBox.sayText(err);
            } else {
              if (saveHandler != null) {
                saveHandler.resumeSave();
              }
            }
          });
        },
        function (err) {
          FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
        },
        entityForm
      );
    } catch (error) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },
  BorrarHorasTecnico: function (entityForm) {
    MobileCRM.UI.EntityForm.requestObject(
      function (entityForm) {
        entityForm.entity.properties.atos_fechainicio = null;
        entityForm.entity.properties.atos_fechafin = null;
        entityForm.entity.properties.atos_trabajoreal = null;
        entityForm.entity.properties.atos_tecnicoid = null;

        entityForm.entity.properties.atos_tecnicosap = null;
        entityForm.entity.properties.atos_duracionnormal = null;
        entityForm.entity.properties.atos_unidadtrabajorealid = null;
        entityForm.entity.properties.atos_unidadduracionnormalid = null;
        entityForm.entity.properties.atos_porcentajeaptitud = null;

        entityForm.entity.properties.atos_particionplanificada = false;
        entityForm.entity.properties.atos_particionnotificadaparcialmente = false;

        //MobileCRM.UI.EntityForm.save();
        MobileCRM.UI.EntityForm.saveAndClose();
      },
      FS.CommonEDPR.onError,
      null
    );
  },
  ValoresPorDefectoUnidad: function (entityForm) {
    var codigo = "H";
    var fetchXml =
      "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
      "<entity name='atos_unidaddemedida'>" +
      "<attribute name='atos_unidaddemedidaid'/>" +
      "<attribute name='atos_name'/>" +
      "<order descending='false' attribute='atos_name'/>" +
      "<filter type='and'>" +
      "<condition attribute='atos_codigo' value='" +
      codigo +
      "' operator='eq'/>" +
      "</filter>" +
      "</entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function success(result) {
        for (var i in result) {
          MobileCRM.UI.EntityForm.requestObject(
            function (entityForm) {
              entityForm.entity.properties.atos_unidadtrabajorealid =
                new MobileCRM.Reference(
                  "atos_unidaddemedida",
                  result[i][0],
                  result[i][1]
                );
              entityForm.entity.properties.atos_unidadduracionnormalid =
                new MobileCRM.Reference(
                  "atos_unidaddemedida",
                  result[i][0],
                  result[i][1]
                );
            },
            FS.CommonEDPR.onError,
            null
          );
        }
      },
      function (error) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      null
    );
  },
};
