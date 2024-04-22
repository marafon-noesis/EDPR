if (typeof FS == "undefined") {
  FS = { __namespace: true };
}

if (typeof Operacion == "undefined") {
  Operacion = { __namespace: true };
}

//#region Variables GLOBALES
var formulario;
var wait;
var usuarioSys;
var existeUsuario;
var enviarOT_A_SAP = false;
var ordenNoSincronizada = true;
var mensajelanzado = false;
var popupNoDeleteOperation = false;
//#endregion
var esUbicacionAmericana = false;

FS.Operacion = {
  // funci?n  que se lanza cuando se carga la pantalla de   operaciones  y asigna los eventos que se podran realizar
  //...
  // AAC 07-11-2018
  OperacionOnLoad: function () {
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
  // funci?n  que se lanza cuando se cargan   operaciones
  //...
  // AAC 07-11-2018
  onLoad: function (entityForm) {
    var self = this;
    formulario = entityForm;
    var operacion = entityForm.entity;

    MobileCRM.Configuration.requestObject(
      function (config) {
        usuarioSys = config.settings.systemUserId;
        FS.Operacion.ObtenerUsuario(usuarioSys);
      },
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      null
    );

    MobileCRM.UI.EntityList.onCommand(
      "custom_aprobar",
      function (entityList) {
        var componente = entityList.context.entities[0];
      },
      true,
      null
    );

    // creamos la definicion del confirmar horas
    MobileCRM.UI.EntityForm.onCommand(
      "custom_confirmacionHoras",
      function (entityForm) {
        FS.Operacion.tienePermisosJefeParque(entityForm, 1);
      },
      true
    );
    // creamos la definicion del cancelar horas
    MobileCRM.UI.EntityForm.onCommand(
      "custom_cancelacionHoras",
      function (entityForm) {
        FS.Operacion.tienePermisosJefeParque(entityForm, 2);
      },
      true
    );

    // creamos la definicion del cancelar horas
    MobileCRM.UI.EntityForm.onCommand(
      "custom_delete",
      function (entityForm) {
        FS.Operacion.DeleteOperacion(entityForm);
      },
      true
    );

    if (operacion.isNew) {
      enviarOT_A_SAP = true;
    } else {
    }
    FS.Operacion.ValidarEstaEnSAP(entityForm);
    FS.Operacion.ActivarConfirmacion(entityForm);

    if (
      operacion.isNew ||
      operacion.properties.atos_ubicaciontecnicaid == null
    ) {
      ///obtenemos el valor de la OT y se  la asignamos si podemos
      self.onChangeOT(entityForm);
    } else {
      //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
      //FS.Operacion.CalcularEsUbicacionAmericana(null,entityForm);
      if (operacion.properties.atos_clasedeactividadid == null) {
        FS.Operacion.filterClaseActividad(entityForm);
      }
    }
    self.esJefeParque(entityForm);

    FS.Operacion.checkOperationToDelete(entityForm);
  },
  // función  que se lanza cuando se guardan operaciones
  //...
  // AAC 07-11-2018
  onSave: function (entityForm) {
    var self = this;
    //var saveHandler = entityForm.suspendSave();
    //FS.Operacion.CalcularEsUbicacionAmericana(saveHandler, entityForm);
  },

  // AAC 07-11-2018
  onPostSave: function (entityForm) {
    var self = this;

    var sincronizando = 3;
    var noEnviado = 2;
    try {
      if (enviarOT_A_SAP) {
        var ordenTrabajo = entityForm.entity.properties.msdyn_workorder;
        //FS.Operacion.actualizarOTEnvioSAP(ordenTrabajo.id,entityForm );
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
  CalcularEsUbicacionAmericana: function (saveHandler, entityForm) {
    debugger;
    var operacionId = entityForm.entity.id;
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
            if (saveHandler != null) {
              saveHandler.resumeSave();
            }
          } else {
            esUbicacionAmericana = true;
            FS.Operacion.CalcularTiempoZeroUSA(
              entityForm,
              entityForm.entity.properties.atos_trabajoreal
            );
            var operacionId = entityForm.entity.id;
            var fetchXmlHorasTecnicos =
              "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
              "  <entity name='atos_horastecnicooperacion'>" +
              "    <attribute name='atos_name' />" +
              "    <filter type='and'>" +
              "      <condition attribute='atos_operacionid' operator='eq'  value='" +
              operacionId +
              "' />" +
              "    </filter>" +
              "  </entity>" +
              "</fetch>";
            MobileCRM.FetchXml.Fetch.executeFromXML(
              fetchXmlHorasTecnicos,
              function (resultHorasTecnicos) {
                if (resultHorasTecnicos.length > 0) {
                  FS.Operacion.CalcularTiemposDescuadradosUSA(
                    saveHandler,
                    entityForm,
                    entityForm.entity.properties.atos_trabajoreal
                  );
                }
              },
              function (err) {
                FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
              },
              entityForm
            );
          }
        }
      },
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      entityForm
    );
  },

  //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
  CalcularTiempoZeroUSA: function (entityForm, total) {
    var UTname = "";

    if (entityForm.entity.properties.atos_ubicaciontecnicaid != null)
      UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;

    if (
      FS.Operacion.EsUbicacionAmericana(UTname) &&
      entityForm.entity.isNew &&
      mensajelanzado == false
    ) {
      if (total == 0) {
        mensajelanzado = true;
        var idMsjeError = "10104_115";
        var fetchXml = [
          "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>",
          "<entity name='atos_coleccionerrores'>",
          "<attribute name='atos_coleccionerroresid' />",
          "<attribute name='atos_descripcion_en' />",
          "<attribute name='atos_descripcion_es' />",
          "<attribute name='atos_tipoerror' />",
          "<order attribute='atos_codigo' descending='false' />",
          "<filter type='and'>",
          "<condition attribute='atos_codigo' operator='eq' value='" +
          idMsjeError +
          "' />",
          "</filter>",
          "</entity>",
          "</fetch>",
        ].join(" ");

        MobileCRM.FetchXml.Fetch.executeFromXML(
          fetchXml,
          function success(result) {
            var mensaje = "";
            if (result.length > 0) {
              if (IdiomaUsuario == 1033) {
                mensaje = result[0][1];
              } else {
                mensaje = result[0][2];
              }
              MobileCRM.UI.MessageBox.sayText(mensaje);
              mensajelanzado = false;
            }
          },

          function (error) { }
        );
      }
    }
  },

  //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
  CalcularTiemposDescuadradosUSA: function (saveHandler, entityForm, total) {
    debugger;
    if (esUbicacionAmericana) {
      var operacionId = entityForm.entity.id;
      var fetchXmlOperacion = [
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true' aggregate='true'>",
        "  <entity name='msdyn_workorderservicetask'>",
        "    <attribute name='atos_trabajoreal' aggregate='max' alias='estimatedvalue_sum' />",
        "    <filter type='and'>",
        "      <condition attribute='msdyn_workorderservicetaskid' operator='eq'  value='" +
        operacionId +
        "' />",
        "    </filter>",
        "  <link-entity name='atos_horastecnicooperacion' from='atos_operacionid' to='msdyn_workorderservicetaskid' link-type='inner' alias='ac' >",
        "	   <attribute name='atos_trabajoreal'  aggregate='sum' alias='estimatedvalue_sum2'  />",
        "	</link-entity>",
        "  </entity>",
        "</fetch>",
      ].join(" ");

      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXmlOperacion,
        function success(resultOperacion) {
          var mensaje = "";
          if (resultOperacion.length > 0) {
            if (
              (total != null || resultOperacion[0][1] != null) &&
              total != resultOperacion[0][1]
            ) {
              var idMsjeError = "10104_116";
              var fetchXml = [
                "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>",
                "<entity name='atos_coleccionerrores'>",
                "<attribute name='atos_coleccionerroresid' />",
                "<attribute name='atos_descripcion_en' />",
                "<attribute name='atos_descripcion_es' />",
                "<attribute name='atos_tipoerror' />",
                "<order attribute='atos_codigo' descending='false' />",
                "<filter type='and'>",
                "<condition attribute='atos_codigo' operator='eq' value='" +
                idMsjeError +
                "' />",
                "</filter>",
                "</entity>",
                "</fetch>",
              ].join(" ");

              MobileCRM.FetchXml.Fetch.executeFromXML(
                fetchXml,
                function success(result) {
                  var mensaje = "";
                  if (result.length > 0) {
                    if (IdiomaUsuario == 1033) {
                      mensaje = result[0][1];
                    } else {
                      mensaje = result[0][2];
                    }
                    MobileCRM.UI.MessageBox.sayText(mensaje);
                  }
                  if (saveHandler != null) {
                    saveHandler.resumeSave();
                  }
                },

                function (error) { }
              );
            }
          } else {
            if (saveHandler != null) {
              saveHandler.resumeSave();
            }
          }
        },

        function (error) { }
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
      //   var OrdeTrabajo = new MobileCRM.DynamicEntity.createNew(
      //     "msdyn_workorder"
      //   );
      //   OrdeTrabajo.id = ordenTrabajoId;
      //   OrdeTrabajo.isNew = false;
      //   OrdeTrabajo.properties.atos_enintegracion = true;
      //   OrdeTrabajo.properties.atos_origen = SAP;

      //   OrdeTrabajo.save(function (err) {
      //     if (err) {
      //       FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      //     } else {
      //     }
      //     postSuspend.resumePostSave();
      //   });
      // }
    });
  },

  ActivarConfirmacion: function (entityForm) {
    var confirmarActivo;
    if (
      entityForm.entity.properties.atos_estatusconfirmacion != null &&
      entityForm.entity.properties.atos_estatusconfirmacion == 300000001
    ) {
      confirmarActivo = false;
    } else {
      confirmarActivo = true;
    }

    MobileCRM.UI.EntityForm.enableCommand(
      "custom_confirmacionHoras",
      confirmarActivo
    );
    MobileCRM.UI.EntityForm.enableCommand(
      "custom_cancelacionHoras",
      !confirmarActivo
    );
    // return;

    var dv = entityForm.getDetailView("General");

    dv.getItemByName("atos_clavedecontrolid").isEnabled = confirmarActivo;
    dv.getItemByName("atos_capacidadreal").isEnabled = confirmarActivo;
    dv.getItemByName("atos_fechainicioreal").isEnabled = confirmarActivo;
    dv.getItemByName("atos_fechafinreal").isEnabled = confirmarActivo;
    dv.getItemByName("atos_motivodeanulacion").isEnabled = !confirmarActivo;
  },

  // función  que se encarga de rediriguir todos los onchange de las operaciones
  // AAC 07-11-2018
  onChange: function (entityForm) {
    var changedItem = entityForm.context.changedItem;
    var entity = entityForm.entity;
    var self = this;

    if (changedItem == "atos_numerodetecnicos") {
      self.OnchageTrabajo(entityForm);
    }
    // duracion de horas real
    if (changedItem == "atos_duracionnormalhoras") {
      self.OnchageTrabajo(entityForm);
    }
    // numero de tecnicos real
    if (changedItem == "atos_capacidadreal") {
      self.OnchageCapacidad(entityForm);
    }
    // fecha de inicio real
    if (changedItem == "atos_fechainicioreal") {
      self.ValidarFechasOPFI(entityForm);
    }
    // fecha de fin real
    if (changedItem == "atos_fechafinreal") {
      self.ValidarFechasOPFF(entityForm);
    }
    // orden de trabajo
    if (changedItem == "msdyn_workorder") {
      self.onLoad(entityForm);
    }
    // Ubicacion técnica
    if (changedItem == "atos_ubicaciontecnicaid") {
      self.onLoad(entityForm);
    }
    // Trabajo real
    //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
    if (changedItem == "atos_trabajoreal") {
      //FS.Operacion.CalcularTiempoZeroUSA(entityForm, entityForm.entity.properties.atos_trabajoreal);
    }

    // Puesto trabajo principal
    if (changedItem == "atos_puestotrabajoprincipalid") {
      self.filterClaseActividad(entityForm);
    }
    FS.Operacion.ActivarConfirmacion(entityForm);
  },

  /// <summary>Mapeo de campos desde la orden de trabajo hacia la Operación</summary>
  ///  Campos mapeados: Puesto de trabajo, clave de control, centro, clase de actividad(**No se mapea)
  onChangeOT: function (entityForm) {
    try {
      var self = this;
      self.LimpiarCamposOP(entityForm);
      if (entityForm.entity.properties.msdyn_workorder != null) {
        var OTId = entityForm.entity.properties.msdyn_workorder.id;
        var OTName = entityForm.entity.properties.msdyn_workorder.primaryName;

        var fetchXml =
          "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
          "<entity name='msdyn_workorder'>" +
          "<attribute name='atos_puestotrabajoprincipalid'/>" +
          "<attribute name='atos_centroid'/>" +
          "<attribute name='msdyn_serviceaccount'/>" +
          "<attribute name='msdyn_customerasset'/>" +
          "<attribute name='transactioncurrencyid'/>" +
          "<filter type='and'>" +
          "<condition attribute='msdyn_workorderid' value='" +
          OTId +
          "' operator='eq'/>" +
          "</filter>" +
          "</entity>" +
          "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(
          fetchXml,
          function (result) {
            for (var i in result) {
              //ELECCION DE MONEDA
              if (result[i][4] != null) {
                entityForm.entity.properties.transactioncurrencyid =
                  new MobileCRM.Reference(
                    result[i][4].entityName,
                    result[i][4].id,
                    result[i][4].primaryName
                  );
              }

              if (result[i][2] != null) {
                var UTid = result[i][2].id;
                // seleccionamos la UT
                MobileCRM.UI.EntityForm.requestObject(
                  function (entityForm) {
                    entityForm.entity.properties.atos_ubicaciontecnicaid =
                      new MobileCRM.Reference(
                        result[i][2].entityName,
                        result[i][2].id,
                        result[i][2].primaryName
                      );
                    if (result[i][3] != null)
                      entityForm.entity.properties.atos_equipoid =
                        new MobileCRM.Reference(
                          result[i][3].entityName,
                          result[i][3].id,
                          result[i][3].primaryName
                        );
                  },
                  FS.CommonEDPR.onError,
                  null
                );

                var fetchXmlUT =
                  "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                  "<entity name='account'>" +
                  "<attribute name='atos_puestodetrabajoresponsableid'/>" +
                  "<attribute name='atos_centroid'/>" +
                  "<attribute name='atos_centrodeplanificacionid'/>" +
                  "<filter type='and'>" +
                  "<condition attribute='accountid' value='" +
                  UTid +
                  "' operator='eq'/>" +
                  "</filter>" +
                  "</entity>" +
                  "</fetch>";

                MobileCRM.FetchXml.Fetch.executeFromXML(
                  fetchXmlUT,
                  function (result2) {
                    for (var i in result2) {
                      // centro
                      MobileCRM.UI.EntityForm.requestObject(
                        function (entityForm) {
                          if (result2[i][1] != null) {
                            entityForm.entity.properties.atos_centroid =
                              new MobileCRM.Reference(
                                result2[i][1].entityName,
                                result2[i][1].id,
                                result2[i][1].primaryName
                              );
                          } else {
                            entityForm.entity.properties.atos_centroid = null;
                          }
                          // centro de planificacion
                          if (result2[i][2] != null) {
                            entityForm.entity.properties.atos_centroplanificacionid =
                              new MobileCRM.Reference(
                                result2[i][2].entityName,
                                result2[i][2].id,
                                result2[i][2].primaryName
                              );
                          } else {
                            entityForm.entity.properties.atos_centroplanificacionid =
                              null;
                          }
                          // puesto responsable
                          if (result2[i][0] != null) {
                            entityForm.entity.properties.atos_puestotrabajoprincipalid =
                              new MobileCRM.Reference(
                                result2[i][0].entityName,
                                result2[i][0].id,
                                result2[i][0].primaryName
                              );

                            var puestoid = result2[i][0].id;

                            var fetchXmlPuesto =
                              "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
                              "<entity name='atos_puestodetrabajo'>" +
                              "<attribute name='atos_clavedecontrolid'/>" +
                              "<filter type='and'>" +
                              "<condition attribute='atos_puestodetrabajoid' value='" +
                              puestoid +
                              "' operator='eq'/>" +
                              "</filter>" +
                              "</entity>" +
                              "</fetch>";
                            MobileCRM.FetchXml.Fetch.executeFromXML(
                              fetchXmlPuesto,
                              function (result3) {
                                for (var i in result3) {
                                  MobileCRM.UI.EntityForm.requestObject(
                                    function (entityForm) {
                                      entityForm.entity.properties.atos_clavedecontrolid =
                                        new MobileCRM.Reference(
                                          result3[i][0].entityName,
                                          result3[i][0].id,
                                          result3[i][0].primaryName
                                        );
                                    },
                                    FS.CommonEDPR.onError,
                                    null
                                  );
                                }
                                FS.Operacion.filterClaseActividad(entityForm);
                              },
                              function (err) {
                                FS.CommonEDPR.GetErrorCollectionByCode(
                                  "JS_001"
                                );
                              },
                              entityForm
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
            }
          },
          function (err) {
            FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
          },
          entityForm
        );
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  LimpiarCamposOP: function (entityForm) {
    entityForm.entity.properties.atos_puestotrabajoprincipalid = null;
    entityForm.entity.properties.atos_clavedecontrolid = null;
    entityForm.entity.properties.atos_centroid = null;
  },

  ///  <summary>Validar que la fecha de inicio y fecha fin deben ser la misma;
  ///  Sin embargo, las horas de las fechas puede ser diferentes.</summary>
  ValidarFechasOPFI: function (entityForm) {
    try {
      var self = this;
      var FI = entityForm.entity.properties.atos_fechainicioreal;
      //var _FF = formContext.getAttribute("atos_fechafinreal").getValue();
      //            var DayValue = 1000 * 60 * 60 * 24;
      if (FI != null) {
        entityForm.entity.properties.atos_fechafinreal =
          entityForm.entity.properties.atos_fechainicioreal;
        self.ValidarFechasOPFF(entityForm);
        self.OnchageCapacidad(entityForm);
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  ///  <summary>Validar que la fecha de inicio y fecha fin deben ser la misma;
  ///  Sin embargo, las horas de las fechas puede ser diferentes.</summary>
  ValidarFechasOPFF: function (entityForm) {
    var self = this;
    try {
      var _FI = entityForm.entity.properties.atos_fechainicioreal;
      var _FF = entityForm.entity.properties.atos_fechafinreal;
      var DayValue = 1000 * 60 * 60 * 24;
      if (_FF != null && _FI != null) {
        FS.Operacion.ValidarVelocidadViento(entityForm);
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

        if (total < 0 || dateFormatfechaInicio != dateFormatfechaFin) {
          var idMsjeError = "10111_002";
          if (total < 0) idMsjeError = "10111_002";
          else idMsjeError = "10111_034";

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
                MobileCRM.UI.EntityForm.requestObject(
                  function (entityForm) {
                    entityForm.entity.properties.atos_fechafinreal = null;
                  },
                  FS.CommonEDPR.onError,
                  null
                );

                if (IdiomaUsuario == Idioma.ingles) {
                  mensaje = result[i][1];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                } else {
                  mensaje = result[i][2];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                }
              }
            },
            function (err) {
              FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
            },
            entityForm
          );
        }
        self.OnchageCapacidad(entityForm);
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  ///  <summary>Validar que la fecha de inicio y fecha fin deben ser la misma;
  ///  Sin embargo, las horas de las fechas puede ser diferentes.</summary>
  ValidarVelocidadViento: function (entityForm) {
    var self = this;
    try {
      UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
      if (FS.Operacion.EsUbicacionAmericana(UTname)) {
        return;
      }
      var _FI = entityForm.entity.properties.atos_fechainicioreal;
      var _FF = entityForm.entity.properties.atos_fechafinreal;
      var DayValue = 1000 * 60 * 60 * 24;
      if (_FF != null && _FI != null) {
        var velocidadInicial =
          entityForm.entity.properties.atos_velocidadvientoiniciooperacion;
        var velocidadFinal =
          entityForm.entity.properties.atos_velocidadvientofinoperacion;
        if ((velocidadInicial = null || velocidadFinal == null)) {
          var idMsjeError = "10104_111";
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
                entityForm.entity.properties.atos_fechafinreal = null;
                if (IdiomaUsuario == Idioma.ingles) {
                  mensaje = result[i][1];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                } else {
                  mensaje = result[i][2];
                  MobileCRM.UI.MessageBox.sayText(mensaje);
                }
              }
            },
            function (err) {
              FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
            },
            entityForm
          );
        }
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  ValidarEstaEnSAP: function (entityForm) {
    var ordenTrabajo = entityForm.entity.properties.msdyn_workorder;
    if (ordenTrabajo != null) {
      var fetchXmlOT = ObtenerFetchOT(ordenTrabajo.id);
      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXmlOT,
        function success(result) {
          //Si la orden de trabajo está liberada
          if (result[0][2] != null) {
            ordenNoSincronizada = false;
          } else {
            //La orden de trabajo no está liberada
            MostrarMensajePopUpError("10111_010", IdiomaUsuario, null);
          }
        },
        function (error) { }
      );
    }
  },

  ///  <summary>Validar que la fecha de inicio y fecha fin deben ser la misma;
  ///  Sin embargo, las horas de las fechas puede ser diferentes.</summary>
  OnchageCapacidad: function (entityForm) {
    try {
      var DayValue = 1000 * 60 * 60;
      var fechaInicio = entityForm.entity.properties.atos_fechainicioreal;
      var fechaFin = entityForm.entity.properties.atos_fechafinreal;
      if (fechaFin != null && fechaInicio != null) {
        var dd = Math.ceil(fechaFin.getTime() - fechaInicio.getTime());
        var total = parseFloat(eval(dd / DayValue));
        entityForm.entity.properties.atos_duracionrealhoras = total;
        entityForm.entity.properties.atos_trabajoreal = total;
        var capacidad = entityForm.entity.properties.atos_capacidadreal;
        if (capacidad != null) {
          entityForm.entity.properties.atos_duracionrealhoras = total;
          entityForm.entity.properties.atos_trabajoreal = total * capacidad;
        }
        //23523:AAC:2022-02-03:MM-1361 NA - Technicians Time new validation
        //FS.Operacion.CalcularTiempoZeroUSA(entityForm, entityForm.entity.properties.atos_trabajoreal);
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  OnchageTrabajo: function (entityForm) {
    try {
      var numTecnicos = entityForm.entity.properties.atos_numerodetecnicos;
      var horas = entityForm.entity.properties.atos_duracionnormalhoras;
      if (numTecnicos != null && horas != null) {
        var total = parseFloat(numTecnicos * horas);
        entityForm.entity.properties.atos_trabajo = total;
      } else {
        entityForm.entity.properties.atos_trabajo = null;
      }
    } catch (err) {
      FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
    }
  },

  filterClaseActividad: function (entityForm) {
    //Se informa la clase de actividad por el valor que tenga en la entidad Centro Coste x Puesto de Trabajo
    var puestoDeTrabajo =
      entityForm.entity.properties.atos_puestotrabajoprincipalid;
    var ubicacionTecnica = entityForm.entity.properties.atos_ubicaciontecnicaid;

    if (
      puestoDeTrabajo != null &&
      ubicacionTecnica != null &&
      entityForm.entity.properties.atos_clasedeactividadid == null
    ) {
      var puestoDeTrabajoId =
        entityForm.entity.properties.atos_puestotrabajoprincipalid.id;
      var ubicacionTecnicaId =
        entityForm.entity.properties.atos_ubicaciontecnicaid.id;
      //primaryName

      var fetchXml =
        "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
        "<entity name='account'>" +
        "<attribute name='atos_centrodecosteid'/>" +
        "<attribute name='atos_sociedadcoid'/>" +
        "<filter type='and'>" +
        "<condition attribute='accountid' value='" +
        ubicacionTecnicaId +
        "' operator='eq'/>" +
        "</filter>" +
        "</entity>" +
        "</fetch>";

      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXml,
        function (result) {
          FS.Operacion.AsignarValorClaseActividad(
            entityForm,
            puestoDeTrabajoId,
            result[0][0],
            result[0][1]
          );
        },
        function (err) {
          FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
        },
        entityForm
      );
    } else {
      if (ubicacionTecnica != null) {
        FS.Operacion.calcularClaseActividadNOPM_porUT(entityForm);
      }
    }
  },
  //AAC
  // REDMINE:21852 realiza el borrado logico de una Operacion
  DeleteOperacion: async function (entityForm) {
    // VALIDAR QUE LA ORDEN NO ESTA CONFIRMADA
    var confirmado = 300000001;
    var literales = Literales(IdiomaUsuario);
    var stop = false;

    // INC2702785 - Do not allow delete operations before work order is synced with SAP
    if (ordenNoSincronizada) {
      MobileCRM.UI.MessageBox.sayText(
        literales.TituloNoBorrado + " " + literales.notInSap
      );
      return;
    }

    if (
      entityForm.entity.properties.atos_numerooperacioncrm == null &&
      entityForm.entity.properties.atos_hojaderutaid != null
    ) {
      MobileCRM.UI.MessageBox.sayText(
        literales.TituloNoBorrado + " " + literales.notInSap
      );
      return;
    }

    if (entityForm.entity.properties.atos_estatusconfirmacion == confirmado) {
      MobileCRM.UI.MessageBox.sayText(
        literales.TituloNoBorrado + " " + literales.OperacionConfirmada
      );
      return;
    }

    if (
      (entityForm.entity.properties.atos_numerooperacioncrm == null &&
        ordenNoSincronizada) ||
      (entityForm.entity.properties.atos_numerooperacioncrm == "0010" &&
        ordenNoSincronizada)
    ) {
      MobileCRM.UI.MessageBox.sayText(
        literales.TituloNoBorrado + " " + literales.errorOperacio10
      );
      return;
    }

    var fetchXmlOperaciones =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
      "<entity name='msdyn_workorderservicetask'>" +
      "<attribute name='msdyn_workorderservicetaskid' />" +
      "<attribute name='atos_indicadorborrado' />" +
      "<attribute name='statuscode' />" +
      "<attribute name='statecode' />" +
      "<attribute name='atos_estadodelusuario' />" +
      "<attribute name='atos_numerooperacioncrm' />" +
      "<order attribute='atos_indicadorborrado' descending='false' />" +
      "<filter type='and'>" +
      "<condition attribute='msdyn_workorder' operator='eq' value='" +
      entityForm.entity.properties.msdyn_workorder.id +
      "' />" +
      "<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
      "</filter>" +
      "</entity>" +
      "</fetch>";
    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXmlOperaciones,
      function success(resultOperaciones) {
        if (resultOperaciones.length > 1) {
          // VALIDAR QUE SE TIENE MAS DE UNA OPERACION.
          var idMsjeInfo = "10111_026";
          var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
          MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml,
            function success(result) {
              var texto;



              var popup;
              if (IdiomaUsuario == Idioma.ingles) {
                /// Add the buttons for message box
                popup = new MobileCRM.UI.MessageBox(result[0][1]);
                popup.items = ["Yes", "No"];
              } else {
                popup = new MobileCRM.UI.MessageBox(result[0][2]);
                popup.items = ["Si", "No"];
              }
              popup.multiLine = true;

              popup.show(function (button) {
                if (button == "Yes" || button == "Si") {

                  //MM-5785

                  debugger;
                  if (popupNoDeleteOperation == true) {
                    // var popupNoDelete;
                    // popupNoDelete = new MobileCRM.UI.MessageBox("Unable to delete one or more operation lines due to Transfer Order.");
                    // popupNoDelete.items = ["Yes"];
                    // popupNoDelete.multiLine = true;

                    // popupNoDelete.show(function (NoDelete) {
                    //   if (NoDelete == "Yes") {
                    //     stop = true
                    //   }
                    // });

                    MobileCRM.UI.MessageBox.sayText("Unable to delete one or more operation lines due to Transfer Order.");
                    stop = true
                  }

                  if (stop == true)
                    return;
                  //MM-5785

                  var operacion = new MobileCRM.DynamicEntity.createNew(
                    "msdyn_workorderservicetask"
                  );

                  operacion.id = entityForm.entity.id;
                  operacion.isNew = false;
                  operacion.properties.atos_indicadorborrado = 1;
                  operacion.properties.atos_estadossap = "INBO";
                  operacion.properties.statuscode = 2;
                  operacion.properties.statecode = 1; //SAP
                  operacion.properties.atos_origen = 300000002;

                  operacion.save(function (err) {
                    if (err) {
                      MobileCRM.UI.MessageBox.sayText(err);
                    } else {
                      MobileCRM.UI.MessageBox.sayText(
                        literales.BorradoOperacion
                      );
                      //23655:AAC:19-04-2022:INC2459629 Work order # 130176996 will not sync from RESCO to SAP
                      FS.Operacion.DeleteComponentes(entityForm);
                      FS.Operacion.DeleteServicios(entityForm);
                      if (
                        entityForm.entity.properties.atos_hojaderutaid != null
                      ) {
                        FS.Operacion.DeleteHojaDeRuta(entityForm);
                      } else {
                        MobileCRM.UI.EntityForm.closeWithoutSaving();
                      }
                    }
                  });
                } else {
                  return;
                }
              });
            },

            function (error) {
              FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
            }
          );
        } else {
          MobileCRM.UI.MessageBox.sayText(
            literales.TituloNoBorrado + " " + literales.NoBorrarOperacion
          );
        }
      },
      function (error) {
        console.log("**Error al: " + err);
      }
    );
  },

  DeleteHojaDeRuta: function (entityForm) {
    var operacionId = entityForm.entity.id;
    var orderId = entityForm.entity.properties.msdyn_workorder.id;
    var orderName = entityForm.entity.properties.msdyn_workorder.primaryName;
    var hojaDeRutaId = entityForm.entity.properties.atos_hojaderutaid.id;
    var fetchXmlOperaciones =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
      "<entity name='msdyn_workorderservicetask'>" +
      "<attribute name='msdyn_workorderservicetaskid' />" +
      "<attribute name='atos_indicadorborrado' />" +
      "<attribute name='statuscode' />" +
      "<attribute name='statecode' />" +
      "<attribute name='atos_estadodelusuario' />" +
      "<attribute name='atos_numerooperacioncrm' />" +
      "<order attribute='atos_indicadorborrado' descending='false' />" +
      "<filter type='and'>" +
      "<condition attribute='msdyn_workorder' operator='eq' value='" +
      orderId +
      "' />" +
      "<condition attribute='atos_hojaderutaid' operator='eq' value='" +
      hojaDeRutaId +
      "' />" +
      "<condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
      "</filter>" +
      "</entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXmlOperaciones,
      function success(result) {
        if (result.length > 0) {
          MobileCRM.UI.EntityForm.closeWithoutSaving();
        } else {
          var fetchXml =
            "<fetch version='1.0'>" +
            "<entity name='atos_hojaderutadeordendetrabajo'>" +
            "<attribute name='atos_hojaderutadeordendetrabajoid' />" +
            "<attribute name='atos_hojaderutaid' />" +
            "<attribute name='atos_ordendetrabajoid' />" +
            "<filter type='and'>" +
            "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" +
            orderId +
            "'/>" +
            "<condition attribute='atos_hojaderutaid' operator='eq' value='" +
            hojaDeRutaId +
            "'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

          MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml,
            function (resultHojas) {
              for (var i in resultHojas) {
                var hojaDeRuta = new MobileCRM.DynamicEntity.createNew(
                  "atos_hojaderutadeordendetrabajo"
                );

                hojaDeRuta.id = resultHojas[0][0];
                hojaDeRuta.isNew = false;
                hojaDeRuta.properties.atos_ordendetrabajoid = null;
                hojaDeRuta.properties.atos_hojaderutaborradaot =
                  orderName + "-" + Date(Date.now()).substring(0, 39);
                hojaDeRuta.properties.atos_peticiondeborrado = 1;
                hojaDeRuta.properties.statuscode = 2;
                hojaDeRuta.properties.statecode = 1; //SAP
                hojaDeRuta.properties.atos_origen = 1;

                hojaDeRuta.save(function (err) {
                  if (err) {
                    MobileCRM.UI.MessageBox.sayText(err);
                  } else {
                    //MobileCRM.UI.EntityForm.closeWithoutSaving();
                  }
                });
              }
            },
            function (err) {
              FS.CommonEDPR.GetErrorCollectionByCode("JS_001", entityForm);
              saveHandler.resumeSave();
            },
            null
          );
        }
      },
      function (error) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      }
    );
  },
  //23655:AAC:19-04-2022:INC2459629 Work order # 130176996 will not sync from RESCO to SAP
  DeleteComponentes: function (entityForm) {
    var operacionId = entityForm.entity.id;
    var orderId = entityForm.entity.properties.msdyn_workorder.id;
    var fetchXmlComponentes =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
      "  <entity name='atos_componenteoperacion'>" +
      "    <attribute name='atos_componenteoperacionid' />" +
      "    <filter type='and'>" +
      "      <condition attribute='atos_borradoensap' operator='ne' value='1' />" +
      "      <condition attribute='atos_operacionid' operator='eq' value='" +
      operacionId +
      "' />" +
      "    </filter>" +
      "  </entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXmlComponentes,
      function success(result) {
        if (result.length > 0) {
          for (var i in result) {
            var componente = new MobileCRM.DynamicEntity.createNew(
              "atos_componenteoperacion"
            );
            componente.id = result[i][0];
            componente.isNew = false;
            componente.properties.atos_indicadorborrado = 1;
            componente.properties.statuscode = 2;
            componente.properties.statecode = 1;
            componente.properties.atos_origen = 1;

            componente.save(function (err) {
              if (err) {
                MobileCRM.UI.MessageBox.sayText(err);
              } else {
                //MobileCRM.UI.EntityForm.closeWithoutSaving();
              }
            });
          }
        } else {
          //MobileCRM.UI.EntityForm.closeWithoutSaving();
        }
      },
      function (error) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      }
    );
  },

  //23655:AAC:19-04-2022:INC2459629 Work order # 130176996 will not sync from RESCO to SAP
  DeleteServicios: function (entityForm) {
    var operacionId = entityForm.entity.id;
    var orderId = entityForm.entity.properties.msdyn_workorder.id;
    var fetchXmlServicios =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
      "  <entity name='atos_serviciooperacion'>" +
      "    <attribute name='atos_serviciooperacionid' />" +
      "     <filter type='and'>" +
      "      <condition attribute='atos_indicadorborrado' operator='ne' value='1' />" +
      "      <condition attribute='atos_operacionid' operator='eq' value='" +
      operacionId +
      "' />" +
      "    </filter>" +
      "  </entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXmlServicios,
      function success(result) {
        if (result.length > 0) {
          for (var i in result) {
            var servicio = new MobileCRM.DynamicEntity.createNew(
              "atos_serviciooperacion"
            );
            servicio.id = result[i][0];
            servicio.isNew = false;
            servicio.properties.atos_indicadorborrado = 1;
            servicio.properties.statuscode = 2;
            servicio.properties.statecode = 1;
            servicio.properties.atos_origen = 1;

            componente.save(function (err) {
              if (err) {
                MobileCRM.UI.MessageBox.sayText(err);
              } else {
                //MobileCRM.UI.EntityForm.closeWithoutSaving();
              }
            });
          }
        } else {
          //MobileCRM.UI.EntityForm.closeWithoutSaving();
        }
      },
      function (error) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      }
    );
  },

  calcularClaseActividadNOPM_porUT: function (entityForm) {
    var ubicacionTecnicaId =
      entityForm.entity.properties.atos_ubicaciontecnicaid.id;
    var fetchXml =
      "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
      "<entity name='account'>" +
      "<attribute name='atos_sociedadcoid'/>" +
      "<filter type='and'>" +
      "<condition attribute='accountid' value='" +
      ubicacionTecnicaId +
      "' operator='eq'/>" +
      "</filter>" +
      "</entity>" +
      "</fetch>";

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (result) {
        if (result[0][0] != null) {
          sociedadCoId = result[0][0].id;
          var fetchXmlClase =
            "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
            "<entity name='atos_clasedeactividad2'>" +
            "<attribute name='atos_clasedeactividad2id'/>" +
            "<attribute name='atos_name'/>" +
            "<attribute name='atos_codigo'/>" +
            "<order descending='false' attribute='atos_name'/>" +
            "<filter type='and'>" +
            "<condition attribute='atos_sociedadcoid' value='" +
            sociedadCoId +
            "'  operator='eq'/>" +
            "</filter>" +
            "</entity>" +
            "</fetch>";

          MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXmlClase,
            function (result) {
              if (result.length == 1) {
                MobileCRM.UI.EntityForm.requestObject(
                  function (entityForm) {
                    entityForm.entity.properties.atos_clasedeactividadid =
                      new MobileCRM.Reference(
                        "atos_clasedeactividad2",
                        result[0][0],
                        result[0][1]
                      );
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
      function (err) {
        FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
      },
      entityForm
    );
  },

  /// <summary>Metodo que se encarga de buscar la clase actividad en la entidad Centro coste x Puesto de trabajo</summary>
  ///  Parametros Puesto de trabajo id, centroCoste y sociedadCO
  AsignarValorClaseActividad: function (
    entityForm,
    puestoTrabajoId,
    centroCoste,
    sociedadCO
  ) {
    //debugger;
    var fetchXml = "";
    var centroCte = false;
    var socCO = false;
    if (centroCoste != null) {
      centroCte = true;
      fetchXml =
        "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
        "<entity name='atos_centrocoste_puestotrabajo'>" +
        "<attribute name='atos_centrocoste_puestotrabajoid'/>" +
        "<attribute name='atos_name'/>" +
        "<attribute name='atos_puestodetrabajoid'/>" +
        "<attribute name='atos_claseactividadid'/>" +
        "<attribute name='atos_centrodecosteid'/>" +
        "<order descending='false' attribute='atos_name'/>" +
        "<filter type='and'>" +
        "<condition attribute='atos_puestodetrabajoid' value='" +
        puestoTrabajoId +
        "' operator='eq'/>" +
        "<condition attribute='atos_centrodecosteid' value='" +
        centroCoste.id +
        "' operator='eq'/>" +
        "</filter>" +
        "</entity>" +
        "</fetch>";
    } else if (sociedadCO != null) {
      socCO = true;
      fetchXml =
        "<fetch distinct='false' mapping='logical' output-format='xml-platform' version='1.0'>" +
        "<entity name='atos_centrocoste_puestotrabajo'>" +
        "<attribute name='atos_centrocoste_puestotrabajoid'/>" +
        "<attribute name='atos_name'/>" +
        "<attribute name='atos_puestodetrabajoid'/>" +
        "<attribute name='atos_claseactividadid'/>" +
        "<attribute name='atos_centrodecosteid'/>" +
        "<order descending='false' attribute='atos_name'/>" +
        "<filter type='and'>" +
        "<condition attribute='atos_puestodetrabajoid' value='" +
        puestoTrabajoId +
        "' operator='eq'/>" +
        "<condition attribute='atos_sociedadcoid' value='" +
        sociedadCO.id +
        "' operator='eq'/>" +
        "</filter>" +
        "</entity>" +
        "</fetch>";
    }
    if (fetchXml != "") {
      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXml,
        function (result) {
          if (result.length > 0) {
            if (result[0][3] != null) {
              MobileCRM.UI.EntityForm.requestObject(
                function (entityForm) {
                  entityForm.entity.properties.atos_clasedeactividadid =
                    new MobileCRM.Reference(
                      "atos_clasedeactividad2",
                      result[0][3].id,
                      result[0][3].primaryName
                    );
                },
                FS.CommonEDPR.onError,
                null
              );
            } else {
              FS.Operacion.calcularClaseActividadNOPM_porUT(entityForm);
            }
          } else {
            //se llama al metodo nuevamente para buscar por otro valor
            if (centroCoste != null) {
              FS.Operacion.AsignarValorClaseActividad(
                entityForm,
                puestoTrabajoId,
                null,
                sociedadCO
              );
            } else if (sociedadCO != null) {
              FS.Operacion.AsignarValorClaseActividad(
                entityForm,
                puestoTrabajoId,
                centroCoste,
                null
              );
            }
          }
        },
        function (err) {
          FS.CommonEDPR.GetErrorCollectionByCode("JS_001");
        },
        entityForm
      );
    }
  },

  tienePermisosJefeParque: function (entityForm, tipo) {
    if (entityForm.isDirty) {
      MostrarMensajePopUpError("10111_033", IdiomaUsuario, null);
      return;
    }

    var varFetchXml =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
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

    MobileCRM.FetchXml.Fetch.executeFromXML(
      varFetchXml,
      function (result) {
        if (result.length > 0) {
          if (tipo == 1) {
            FS.Operacion.validarHorasTecnicas(entityForm);
            //FS.Operacion.IntegrarConfirmacionHorasConSAP(entityForm);//está chamando de dentro do validarHorasTecnicas
          }
          if (tipo == 2) {
            FS.Operacion.IntegrarCancelacionHorasConSAP(entityForm);
          }
        } else {
          // lanzar mensaje de que no se tiene permiso
          MostrarMensajePopUpError("10111_032", IdiomaUsuario, null);
        }
      },
      function (err) {
        // lanzar mensaje de que no se tiene permiso
        MostrarMensajePopUpError("10111_032", IdiomaUsuario, null);
      },
      entityForm
    );
  },

  esJefeParque: function (entityForm) {
    var operacion_ZPM2 = "ZPM2";
    var claveControl = "";
    if (entityForm.entity.properties.atos_clavedecontrolid != null)
      claveControl =
        entityForm.entity.properties.atos_clavedecontrolid.primaryName.split(
          ":"
        )[0];

    var varFetchXml =
      "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
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

    MobileCRM.FetchXml.Fetch.executeFromXML(
      varFetchXml,
      function (result) {
        if (result.length > 0) {
        } else {
          if (claveControl == operacion_ZPM2) {
            // deshabilito comandos
            MobileCRM.UI.EntityForm.enableCommand(
              "custom_confirmacionHoras",
              false
            );
            MobileCRM.UI.EntityForm.enableCommand(
              "custom_cancelacionHoras",
              false
            );
          }
        }
      },
      function (err) {
        // lanzar mensaje de que no se tiene permiso
        MostrarMensajePopUpError("10111_032", IdiomaUsuario, null);
      },
      entityForm
    );
  },

  EsUbicacionAmericana: function (UTname) {
    if (
      UTname.split("-").length > 2 &&
      UTname.split("-")[1] != "US" &&
      UTname.split("-")[1] != "CA" &&
      UTname.split("-")[1] != "MX"
    ) {
      return false;
    } else {
      return true;
    }
  },

  /// <summary>Método que se invoca desde el botón de Confirmar horas y lo que hace es poner el campo oculto
  /// "Enviar a SAP" a yes, para que salte el plugin integración confirmación  de horas y se envie los
  ///  campos de la commfirmación de la entidad operaciones de ordendes de trabajo a SAP </summary>
  IntegrarConfirmacionHorasConSAP: function (entityForm) {
    var guidOperacion = entityForm.entity.id;
    var idMsjeInfo = "10111_005";
    var activo = "0";
    var integradoConSAP = 300000001;
    var UTname = "";

    if (entityForm.entity.properties.atos_ubicaciontecnicaid != null)
      UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;

    var operacion_ZPM2 = "ZPM2";
    var claveControl = "";
    if (entityForm.entity.properties.atos_clavedecontrolid != null)
      claveControl =
        entityForm.entity.properties.atos_clavedecontrolid.primaryName.split(
          ":"
        )[0];

    if (claveControl == operacion_ZPM2) {
      MostrarMensajePopUpError("10111_023", IdiomaUsuario, null);
      return;
    }

    var codigoPermisoAutorizado = "A";
    var ordenTrabajo = entityForm.entity.properties.msdyn_workorder;
    if (ordenTrabajo != null) {
      var trabajoReal = entityForm.entity.properties.atos_trabajoreal;
      if (trabajoReal == null && FS.Operacion.EsUbicacionAmericana(UTname))
        trabajoReal = 0;
      if (trabajoReal != null) {
        var fetchXmlOT = ObtenerFetchOT(ordenTrabajo.id);

        MobileCRM.FetchXml.Fetch.executeFromXML(
          fetchXmlOT,
          function success(result) {
            // si la orden no esta integrada con SAP.
            if (result[0][1] == integradoConSAP) {
              //Si la orden de trabajo está liberada
              if (result[0][0] != "False") {
                var fetchAutoriz = FetchDeMensajeAutorizaciones(
                  ordenTrabajo.id,
                  activo,
                  codigoPermisoAutorizado
                );
                //Comprobamos si tiene autorizacion
                MobileCRM.FetchXml.Fetch.executeFromXML(
                  fetchAutoriz,
                  function success(result) {
                    //AAC : 16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
                    //if (result.length > 0 || FS.Operacion.EsUbicacionAmericana(UTname)) {
                    var validacionOK = ValidarCamposObligatorios(
                      IdiomaUsuario,
                      trabajoReal,
                      entityForm
                    );
                    if (validacionOK != "") {
                      MostrarMensajePopUpError(
                        "10111_012",
                        IdiomaUsuario,
                        validacionOK
                      );
                      return;
                    }

                    var fechaFinReal =
                      entityForm.entity.properties.atos_fechafinreal;
                    var fechaHoy = new Date();

                    if (fechaFinReal > fechaHoy) {
                      MostrarMensajePopUpError(
                        "10111_013",
                        IdiomaUsuario,
                        null
                      );
                      return;
                    }

                    var fechaConfirmacion =
                      entityForm.entity.properties.atos_fechaconfirmacion;

                    if (fechaConfirmacion > fechaHoy) {
                      MostrarMensajePopUpError(
                        "10111_014",
                        IdiomaUsuario,
                        null
                      );
                      return;
                    }
                    var literales = Literales(IdiomaUsuario);
                    var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
                    MobileCRM.FetchXml.Fetch.executeFromXML(
                      fetchXml,
                      function success(result) {
                        var texto;

                        var popup;
                        if (IdiomaUsuario == Idioma.ingles) {
                          /// Add the buttons for message box
                          popup = new MobileCRM.UI.MessageBox(result[0][1]);
                          popup.items = ["Yes", "No"];
                        } else {
                          popup = new MobileCRM.UI.MessageBox(result[0][2]);
                          popup.items = ["Si", "No"];
                        }
                        popup.multiLine = true;

                        popup.show(function (button) {
                          if (button == "Yes" || button == "Si") {
                            var operacion =
                              new MobileCRM.DynamicEntity.createNew(
                                "msdyn_workorderservicetask"
                              );

                            operacion.id = entityForm.entity.id;
                            operacion.isNew = false;
                            operacion.properties.atos_estatusconfirmacion = 300000001;
                            operacion.properties.atos_enviarasap = true;
                            operacion.properties.atos_fechacreacionconfirmacion =
                              new Date();
                            operacion.properties.atos_fechamodificacionconfirmacion =
                              new Date();
                            operacion.properties.atos_fechaconfirmacion =
                              new Date();
                            operacion.properties.atos_origen = 300000002;

                            MobileCRM.UI.EntityForm.requestObject(
                              function (entityForm) {
                                entityForm.entity.properties.atos_estatusconfirmacion = 300000001;
                                FS.Operacion.ActivarConfirmacion(entityForm);
                              },
                              FS.CommonEDPR.onError,
                              null
                            );

                            if (
                              existeUsuario != null &&
                              existeUsuario.codigo != null
                            ) {
                              operacion.properties.atos_confirmadoporsapid =
                                new MobileCRM.Reference(
                                  "atos_usuarios",
                                  existeUsuario.usuarioid,
                                  ""
                                );
                              operacion.properties.atos_confirmacionmodificadaporsapid =
                                new MobileCRM.Reference(
                                  "atos_usuarios",
                                  existeUsuario.usuarioid,
                                  ""
                                );
                              operacion.properties.atos_confirmadoporsap =
                                existeUsuario.codigo;
                              operacion.properties.atos_confirmacionmodificadaporsap =
                                existeUsuario.codigo;
                            }

                            operacion.save(function (err) {
                              if (err) {
                                MobileCRM.UI.MessageBox.sayText(err);
                              } else {
                                MobileCRM.UI.MessageBox.sayText(
                                  literales.confirmacionEnviada
                                );
                              }
                            });
                          } else {
                            return;
                          }
                        });
                      },

                      function (error) {
                        console.log(
                          "**Error al obtener el mensaje: " + idMsjeInfo
                        );
                      }
                    );
                    //}
                    //else {
                    //mensaje por si no tiene autorizaciones
                    //	MostrarMensajePopUpError('10111_007', IdiomaUsuario, null);
                    //}
                  },

                  function (error) {
                    console.log("**Error al obtener autirzaciones: " + error);
                    MostrarMensajePopUpError("10111_007", IdiomaUsuario, null);
                  }
                );
              } else {
                //La orden de trabajo no está liberada
                MostrarMensajePopUpError("10111_010", IdiomaUsuario, null);
              }
            } else {
              //La orden de trabajo no está integrada con SAP
              MostrarMensajePopUpError("10111_021", IdiomaUsuario, null);
            }
          },
          function (error) { }
        );
      } else {
        //Mensaje que tiene que asignar valor a trabajo real
        MostrarMensajePopUpError("10111_008", IdiomaUsuario, null);
      }
    } else {
      //Mensaje que tiene que asociar a una OT
      MostrarMensajePopUpError("10111_009", IdiomaFormulario, null);
    }
  },

  ObtenerUsuario: function (usuarioSistema) {
    try {
      var fetchXml = ObtenerUsuarioSystema(usuarioSistema);
      MobileCRM.FetchXml.Fetch.executeFromXML(
        fetchXml,
        function success(result) {
          for (var i in result) {
            existeUsuario = {
              usuarioid: result[i][1].id,
              codigo: result[0][2],
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
      Atos.Helper.GetErrorCollectionByCode("JS_001");
    }
  },

  checkOperationToDelete: function (entityForm) {
    //MM-5785
    debugger;
    if (entityForm.entity.properties.atos_ubicaciontecnicaid != null) {
      var esUbicacionAmericana = FS.Operacion.EsUbicacionAmericana(entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName);
      var WOId = entityForm.entity.properties.msdyn_workorder != null ? entityForm.entity.properties.msdyn_workorder.id : null;

      if (esUbicacionAmericana && WOId != null) {

        var fetchDataComponent = {
          atos_operacionid: entityForm.entity.id,
          statuscode: "1",
        };
        var fetchXmlComponent =
          "<fetch>" +
          "  <entity name='atos_componenteoperacion'>" +
          "    <attribute name='atos_confirmaciondyn'/>" +
          "    <attribute name='atos_confirmado'/>" +
          "    <attribute name='atos_componenteoperacionid'/>" +
          "    <attribute name='atos_cantidad'/>" +
          "    <attribute name='atos_materialid'/>" +
          "    <filter>" +
          "      <condition attribute='atos_operacionid' operator='eq' value='" +
          fetchDataComponent.atos_operacionid +
          "' uiname='0000019700-0030' uitype='msdyn_workorderservicetask'/>" +
          "      <condition attribute='statuscode' operator='eq' value='" +
          fetchDataComponent.statuscode +
          "'/>" +
          "    </filter>" +
          "  </entity>" +
          "</fetch>";
        MobileCRM.FetchXml.Fetch.executeFromXML(fetchXmlComponent,
          function success(resultComponent) {

            if (resultComponent != null && resultComponent.length > 0) {

              for (var i = 0; i < resultComponent.length; i++) {
                if (popupNoDeleteOperation == true)
                  break;
                var guidMaterial = resultComponent[i][4].id;
                var fetchXml = `
                            <fetch>
                                <entity name="edprdyn_transferorder">
                                <filter>
                                    <condition attribute="edprdyn_workorderid" operator="eq" value="${WOId}" />
                                    <condition attribute="edprdyn_sendtosapresponse" operator="eq" value="870280001" />
                                </filter>
                                <link-entity name="edprdyn_transferorderitem" from="edprdyn_transferorderid" to="edprdyn_transferorderid" alias="TO">
                                    <attribute name="edprdyn_transferorderitemid" />
                                    <filter>
                                        <condition attribute="edprdyn_product" operator="eq" value="${guidMaterial}" />
                                        <condition attribute="edprdyn_sourcetargetquantity" operator="eq" value="${resultComponent[i][3]}" />
                                    </filter>
                                </link-entity>
                                </entity>
                            </fetch>`;
                MobileCRM.FetchXml.Fetch.executeFromXML(fetchXml,
                  function success(resultTO) {
                    debugger;
                    if (resultTO != null && resultTO.length > 0) {
                      popupNoDeleteOperation = true;
                    }
                  },
                  function (error) {
                    debugger;
                    //console.log("**Error al: " + error);
                  },
                  null
                );
              }

            }
          },
          function (err) {
            debugger;
          },
          null
        );
      }
    }
    //MM-5785
  },

  /// <summary>Método que se invoca desde el botón de Confirmar horas y lo que hace es poner el campo oculto
  /// "Enviar a SAP" a yes, para que salte el plugin integración confirmación  de horas y se envie los
  ///  campos de la commfirmación de la entidad operaciones de ordendes de trabajo a SAP </summary>
  IntegrarCancelacionHorasConSAP: function (entityForm) {
    var guidOperacion = entityForm.entity.id;
    var idMsjeInfo = "10111_006";
    var activo = "0";
    var codigoPermisoAutorizado = "A";
    var integradoConSAP = 300000001;
    var statusConfirmado = 300000001;
    var UTname = "";

    if (entityForm.entity.properties.atos_ubicaciontecnicaid != null)
      UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;

    var operacion_ZPM2 = "ZPM2";
    var claveControl = "";
    if (entityForm.entity.properties.atos_clavedecontrolid != null)
      claveControl =
        entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName.split(
          ":"
        )[0];

    if (claveControl == operacion_ZPM2) {
      MostrarMensajePopUpError("10111_023", IdiomaUsuario, null);
      return;
    }

    var ordenTrabajo = entityForm.entity.properties.msdyn_workorder;
    var statusConfirmacion =
      entityForm.entity.properties.atos_estatusconfirmacion;

    if (statusConfirmacion == statusConfirmado) {
      if (ordenTrabajo != null) {
        var fetchXmlOT = ObtenerFetchOT(ordenTrabajo.id);
        MobileCRM.FetchXml.Fetch.executeFromXML(
          fetchXmlOT,
          function success(result) {
            //Si la orden de trabajo está liberada
            if (result[0][0] != "False") {
              var fetchAutoriz = FetchDeMensajeAutorizaciones(
                ordenTrabajo.id,
                activo,
                codigoPermisoAutorizado
              );
              //Comprobamos si tiene autorizacion
              MobileCRM.FetchXml.Fetch.executeFromXML(
                fetchAutoriz,
                function success(result) {
                  //AAC :16-10-2020 redmine 22082 adaptar Dynamics para poder eliminar las autorizaciones
                  //if (result.length > 0 || FS.Operacion.EsUbicacionAmericana(UTname)) {
                  var validacionOK = ValidarCamposObligatoriosCancelacion(
                    IdiomaUsuario,
                    entityForm
                  );
                  if (validacionOK != "") {
                    MostrarMensajePopUpError(
                      "10111_015",
                      IdiomaUsuario,
                      validacionOK
                    );
                    return;
                  }

                  var literales = Literales(IdiomaUsuario);
                  var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
                  MobileCRM.FetchXml.Fetch.executeFromXML(
                    fetchXml,
                    function success(result) {
                      var texto;

                      var popup;
                      if (IdiomaUsuario == Idioma.ingles) {
                        /// Add the buttons for message box
                        popup = new MobileCRM.UI.MessageBox(result[0][1]);
                        popup.items = ["Yes", "No"];
                      } else {
                        popup = new MobileCRM.UI.MessageBox(result[0][2]);
                        popup.items = ["Si", "No"];
                      }
                      popup.multiLine = true;

                      popup.show(function (button) {
                        if (button == "Yes" || button == "Si") {
                          var operacion = new MobileCRM.DynamicEntity.createNew(
                            "msdyn_workorderservicetask"
                          );
                          operacion.id = entityForm.entity.id;
                          operacion.isNew = false;
                          operacion.properties.atos_estatusconfirmacion = 300000002;
                          operacion.properties.atos_cancelarhorasensap = true;

                          MobileCRM.UI.EntityForm.requestObject(
                            function (entityForm) {
                              entityForm.entity.properties.atos_estatusconfirmacion = 300000002;
                              FS.Operacion.ActivarConfirmacion(entityForm);
                            },
                            FS.CommonEDPR.onError,
                            null
                          );

                          operacion.save(function (err) {
                            if (err) {
                              MobileCRM.UI.MessageBox.sayText(err);
                            } else {
                              MobileCRM.UI.MessageBox.sayText(
                                literales.cancelacionEnviada
                              );
                            }
                          });
                        } else {
                          return;
                        }
                      });
                    },

                    function (error) {
                      console.log(
                        "**Error al obtener el mensaje: " + idMsjeInfo
                      );
                    }
                  );
                  //}
                  //else {
                  //mensaje por si no tiene autorizaciones
                  //   MostrarMensajePopUpError('10111_007', IdiomaUsuario, null);
                  //}
                },

                function (error) { }
              );
            } else {
              //La orden de trabajo no está liberada
              MostrarMensajePopUpError("10111_010", IdiomaUsuario, null);
            }
          },
          function (error) { }
        );
      } else {
        //Mensaje que tiene que asociar a una OT
        MostrarMensajePopUpError("10111_009", IdiomaUsuario, null);
      }
    } else {
      //la operacion no esta confirmada
      MostrarMensajePopUpError("10111_022", IdiomaUsuario, null);
    }
  },

    //#region //MM-5656
    validarHorasTecnicas: function (entityForm) {
        var capacidadeReal = entityForm.entity.properties.atos_capacidadreal;
        var guidOperacion = entityForm.entity.id;
        var UTname = "";

        if (entityForm.entity.properties.atos_ubicaciontecnicaid != null)
            UTname = entityForm.entity.properties.atos_ubicaciontecnicaid.primaryName;
        debugger;

        var workCenter = entityForm.entity.properties.atos_puestotrabajoprincipalid;
        if (FS.Operacion.EsUbicacionAmericana(UTname) && workCenter != null) {

            var fetchWorkCenter = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>"
                + "  <entity name='atos_puestodetrabajo'>"
                + "    <attribute name='atos_codigopuestodetrabajo' />"
                + "    <attribute name='atos_puestodetrabajoid' />"
                + "    <filter type='and'>"
                + "      <condition attribute='atos_codigopuestodetrabajo' operator='ne' value='E0000000' />"
                + "      <condition attribute='atos_codigopuestodetrabajo' operator='ne' value='ET000000' />"
                + "      <condition attribute='atos_puestodetrabajoid' operator='eq' value='"+ workCenter.id +"'/>"
                + "    </filter>"
                + "  </entity>"
                + "</fetch>";

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchWorkCenter,
                function success(resultWorkCenter) {

                    if (resultWorkCenter.length > 0 ) {
                        var fetchHoras = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' no-lock='true'>"
                            + "  <entity name='atos_horastecnicooperacion'>"
                            + "    <attribute name='atos_horastecnicooperacionid' />"
                            + "    <filter type='and'>"
                            + "      <condition attribute='atos_operacionid' operator='eq' value='" + guidOperacion + "' />"
                            + "      <condition attribute='atos_tecnicoid' operator='not-null' />"
                            //+ "      <condition attribute='atos_trabajoreal' operator='gt' value='0' />"
                            + "    </filter>"
                            + "  </entity>"
                            + "</fetch>";

                        MobileCRM.FetchXml.Fetch.executeFromXML(fetchHoras,
                            function success(resultHoras) {

                                if (resultHoras.length > 0 && resultHoras.length == capacidadeReal) {
                                    FS.Operacion.IntegrarConfirmacionHorasConSAP(entityForm);
                                }
                                else {
                                    var popup;

                                    if (IdiomaUsuario == Idioma.ingles) {
                                        popup = new MobileCRM.UI.MessageBox("The Operation does not have a Technical Name, do you want to continue?");
                                        popup.items = ["Yes", "Cancel"];
                                    } else {
                                        popup = new MobileCRM.UI.MessageBox("La Operación no tiene Nombre Técnico, ¿quieres continuar ?");
                                        popup.items = ["Sí", "Cancelar"];
                                    }

                                    popup.multiLine = true;
                                    popup.show(
                                        function (button) {
                                            if (button == "Yes" || button == "Sí") {
                                                ////Si es 4 entonces es Aranque
                                                //MobileCRM.UI.EntityForm.requestObject(
                                                //    function (entityForm) {

                                                //    },
                                                //    FS.CommonEDPR.onError,
                                                //    null
                                                //);
                                                FS.Operacion.IntegrarConfirmacionHorasConSAP(entityForm);
                                            }
                                        }
                                    );
                                }
                            },
                            function (error) {

                            }
                        );
                    }
                    else {
                        FS.Operacion.IntegrarConfirmacionHorasConSAP(entityForm);
                    }
                },
                function (error) {

                }
            );

            
        }
        else 
            FS.Operacion.IntegrarConfirmacionHorasConSAP(entityForm);
    },
    //#endregion

};

function Literales(idioma) {
  if (idioma != Idioma.ingles) {
    return {
      TituloNoBorrado: "No se puede borrar la operacion.",
      BorradoOperacion: " Borrado de operacion realizada",
      NoBorrarOperacion: "La OT debe tener al menos una operacion",
      confirmacionEnviada: " Confirmación(es) de Horas enviadas a SAP",
      confirmacion: "Confirmacion",
      cancelacionEnviada: " Cancelación(es) de Horas enviadas a SAP",
      cancelacion: "Cancelacion",
      campoObligatorio: "*Campos obligatorios*",
      fechaRealMayorFecha: "*FechaFinReal mayor Fecha actual*",
      fechaConfirmacion: "*FechaConfirmacion mayor Fecha actual*",
      autorizaLiberacion: "*Compruebe autorizacion y liberacion de OT*",
      errorOperacion: "--Error en operacion:",
      noExisteEntorno: "No Existe Entorno",
      errorSerializacion: "Error al serializar",
      errorOperacio10:
        "No pueder borrar una operacion si la OT no esta en SAP o es la operacion 10.",
      contacteAdministrador: "Contacte con administrador",
      errorObtenerAutorizacion: "*Error al obtener autorizacion*",
      notInSap:
        "Las operaciones no pueden borrarse hasta que la orden de trabajo se sincronice con SAP.",
    };
  } else {
    return {
      TituloNoBorrado: "It is not possible to delete the operation.",
      BorradoOperacion: " Delete operation confirmed.",
      NoBorrarOperacion: "The WO must have at least one operation.",
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
      errorOperacio10:
        "You cannot delete an operation if the WO is not in SAP or is operation 10.",
      errorObtenerAutorizacion: "*Error to get the authorization*",
      notInSap:
        "Operations can not be deleted until work order is synced with SAP.",
    };
  }
}

function MostrarMensajePopUpError(idMsjeInfo, idioma, restoMensaje) {
  IdiomaFormulario = idioma;
  var fetchXml = ObtenerFetchDeMensajeAMostrar(idMsjeInfo);
  MobileCRM.FetchXml.Fetch.executeFromXML(
    fetchXml,
    function success(result) {
      var texto;
      if (IdiomaFormulario == Idioma.espanol) {
        if (restoMensaje == null) texto = result[0][2];
        else texto = result[0][2].replace("{0}", restoMensaje);
      } else {
        if (restoMensaje == null) texto = result[0][1];
        else texto = result[0][1].replace("{0}", restoMensaje);
      }
      MobileCRM.UI.MessageBox.sayText(texto);
    },
    function (error) { }
  );
}

function ObtenerUsuarioSystema(idUsuario) {
  var fetchXml =
    "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='systemuser'>" +
    "<attribute name='systemuserid' />" +
    "<attribute name='atos_usuariosapid' />" +
    "<order attribute='fullname' descending='false' />" +
    "<filter type='and'>" +
    "<condition attribute='systemuserid' operator='eq' value='" +
    idUsuario +
    "' />" +
    "</filter>" +
    "<link-entity name='atos_usuarios' from='atos_usuariosid' to='atos_usuariosapid' visible='false' link-type='outer' alias='usuario'>" +
    "<attribute name='atos_codigo' />" +
    "</link-entity>" +
    "</entity>" +
    "</fetch>";
  return fetchXml;
}

function ObtenerFetchDeMensajeAMostrar(idMsjeInfo) {
  var fetchXml =
    "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='atos_coleccionerrores'>" +
    "<attribute name='atos_coleccionerroresid' />" +
    "<attribute name='atos_descripcion_en' />" +
    "<attribute name='atos_descripcion_es' />" +
    "<attribute name='atos_tipoerror' />" +
    "<order attribute='atos_codigo' descending='false' />" +
    "<filter type='and'>" +
    "<condition attribute='atos_codigo' operator='eq' value='" +
    idMsjeInfo +
    "' />" +
    "</filter>" +
    "</entity>" +
    "</fetch>";

  return fetchXml;
}

function ObtenerFetchOT(OTid) {
  var fetchXml =
    "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='msdyn_workorder'>" +
    "<attribute name='atos_liberarorden' />" +
    "<attribute name='atos_estadosintegracionsap' />" +
    "<attribute name='atos_codigoordentrabajosap' />" +
    "<filter type='and'>" +
    "<condition attribute='msdyn_workorderid' operator='eq' value='" +
    OTid +
    "' />" +
    "</filter>" +
    "</entity>" +
    "</fetch>";

  return fetchXml;
}

function FetchDeMensajeAutorizaciones(
  idOrdenTrabajo,
  activo,
  codigoPermisoAutorizado
) {
  var fetchXml =
    "<fetch version='1.0' output-format='xml-platform' mapping='logical' no-lock='true' distinct='false'>" +
    "<entity name='atos_autorizacion'>" +
    "<attribute name='atos_name' />" +
    "<attribute name='createdon' />" +
    "<attribute name='atos_autorizacionid' />" +
    "<attribute name='atos_ordendetrabajoid' />" +
    "<order attribute='atos_name' descending='false' />" +
    "<filter type='and'>" +
    "<condition attribute='atos_ordendetrabajoid' operator='eq' value='" +
    idOrdenTrabajo +
    "' />" +
    "<condition attribute='statecode' operator='eq' value='" +
    activo +
    "' />" +
    "<condition attribute='atos_autorizadoporid' operator='not-null' />" +
    "</filter>" +
    "<link-entity name='atos_tipodepermiso' from='atos_tipodepermisoid' to='atos_tipodepermisoid' link-type='inner' alias='ag'>" +
    "<filter type='and'>" +
    "<condition attribute='atos_codigo' operator='eq' value='" +
    codigoPermisoAutorizado +
    "' />" +
    "</filter>" +
    "</link-entity>" +
    "<link-entity name='msdyn_workorder' from='msdyn_workorderid' to='atos_ordendetrabajoid' visible='false' link-type='inner' alias='OT'>" +
    "<attribute name='atos_liberarorden' />" +
    "</link-entity>" +
    "</entity>" +
    "</fetch>";

  return fetchXml;
}

function ValidarCamposObligatorios(IdiomaFormulario, trabajoReal, entityForm) {
  var respuesta = "";
  try {
    if (entityForm.entity.properties.msdyn_workorder == null) {
      if (IdiomaFormulario == 3082) respuesta = "Orden de trabajo";
      else respuesta = "Work order";
    }

    if (entityForm.entity.properties.atos_numerooperacioncrm == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Número de operación";
        else respuesta = "Operation Number";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Número de operación";
      else respuesta = respuesta + ", Operation Number";
    }

    if (entityForm.entity.properties.atos_centroid == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Centro";
        else respuesta = "Plant";
      else if (IdiomaFormulario == 3082) respuesta = respuesta + ", Centro";
      else respuesta = respuesta + ", Plant";
    }

    if (entityForm.entity.properties.atos_puestotrabajoprincipalid == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Puesto trabajo";
        else respuesta = "Work center";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Puesto trabajo";
      else respuesta = respuesta + ", Work center";
    }

    //    if (entityForm.entity.properties.atos_trabajo == null) {
    //        if (respuesta == "")
    //            if (IdiomaFormulario == 3082) respuesta = "Trabajo"; else respuesta = "Work";
    //        else
    //            if (IdiomaFormulario == 3082) respuesta = respuesta + ", Trabajo"; else respuesta = respuesta + ", Work";
    //    }

    if (entityForm.entity.properties.atos_fechainicioreal == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Fecha Inicio Real";
        else respuesta = "Real start date";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Fecha Inicio Real";
      else respuesta = respuesta + ", Real start date";
    }

    if (entityForm.entity.properties.atos_fechafinreal == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Fecha Fin Real";
        else respuesta = "Real end date";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Fecha Fin Real";
      else respuesta = respuesta + ", Real end date";
    }

    if (
      entityForm.entity.properties.atos_trabajoreal == null ||
      trabajoReal < 0
    ) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Trabajo Real";
        else respuesta = "Real work";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Trabajo Real";
      else respuesta = respuesta + ", Real work";
    }

    //    if (entityForm.entity.properties.atos_fechaconfirmacion == null) {
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

function ValidarCamposObligatoriosCancelacion(IdiomaFormulario, entityForm) {
  try {
    var respuesta = "";
    if (entityForm.entity.properties.msdyn_workorder == null) {
      if (IdiomaFormulario == 3082) respuesta = "Orden de trabajo";
      else respuesta = "Work order";
    }

    if (entityForm.entity.properties.atos_numerooperacioncrm == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Número de operación";
        else respuesta = "Operation Number";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Número de operación";
      else respuesta = respuesta + ", Operation Number";
    }
    //Confirmacion de SAP

    if (entityForm.entity.properties.atos_contadordeconfirmacion == null) {
      if (respuesta == "")
        if (IdiomaFormulario == 3082) respuesta = "Contador de confirmación";
        else respuesta = "Confirmation counter";
      else if (IdiomaFormulario == 3082)
        respuesta = respuesta + ", Contador de confirmación";
      else respuesta = respuesta + ", Confirmation counter";
    }
    //Descripcion Cancelacion

    return respuesta;
  } catch (e) {
    console.log(e);
  }
}

function ValidarCamposObligatoriosCancelacionEnEntidad(entityForm) {
  if (entityForm.entity.properties.msdyn_workorder == null) {
    return false;
  }
  if (entityForm.entity.properties.atos_trabajoreal == null) {
    return false;
  }
  if (entityForm.entity.properties.atos_numerooperacioncrm == null) {
    return false;
  }
  if (entityForm.entity.properties.atos_contadordeconfirmacion == null) {
    return false;
  }
  return true;
}
