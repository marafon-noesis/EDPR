if (typeof (FS) == "undefined")
{ FS = { __namespace: true }; }

//#region variables
    var Idioma = {
        espanol: 3082,
        ingles: 1033
    }
    var IdiomaUsuario = Idioma.espanol;
    var region;
//#endregion

FS.CommonEDPR = {
    __namespace: true,

//#region consultadatos
    fetchEntity: function (entityName, fields, id, fieldId, functionCallBack) {
        var self = this;
        try {
            var fetch = self.getFetch(entityName, fields, id, fieldId);
            fetch.execute("Array", function (result) {
                functionCallBack(result);
            }, function (err) {
                self.GetErrorCollectionByCode('JS_001'); //TODO: revisar que error debe dar
            },
                null);
        }
        catch (err) {
            self.GetErrorCollectionByCode('JS_001');
        }
    },

    getFetch: function (entityName, fields, id, fieldId) {
        var self = this;
        try {
            var entity = new MobileCRM.FetchXml.Entity(entityName);
            //Completamos con los campos que se quieran obtener
            for (i = 0; i < fields.length; i++) {
                entity.addAttribute(fields[i]);
            }
            var filter = new MobileCRM.FetchXml.Filter();
            filter.where(fieldId, "eq", id);
            entity.filter = filter;
            return new MobileCRM.FetchXml.Fetch(entity);
        }
        catch (err) {
            self.GetErrorCollectionByCode('JS_001');
        }
    },

    /// <summary>Funci�n gen�rica que borra un regsitro</summary>
    /// <param name="entityname">nombre de esquema de la entidad</param>
    /// <param name="id">Guid del registro a borrar</param>
    BorrarRegistro: function (entityname, id) {
        MobileCRM.DynamicEntity.deleteById(
            entityname,
            id,
            function () {
            },
            function (error) {
                FS.CommonEDPR.GetErrorCollectionByCode('JS_001');
            }
        );
    },
//#endregion

//#region errores
    // obtiene el error de la tabla de errores segun el idioma;
    GetErrorCollectionByCode: function (id) {

        try {
            var mensajes = new MobileCRM.FetchXml.Entity("atos_coleccionerrores");
            mensajes.addAttribute("atos_descripcion_en");
            mensajes.addAttribute("atos_descripcion_es");

            var filter = new MobileCRM.FetchXml.Filter();
            filter.where("atos_codigo", "eq", id);
            mensajes.filter = filter;
            var fetch = new MobileCRM.FetchXml.Fetch(mensajes);

            fetch.execute("Array", function (result) {

                for (var i in result) {
                    if (IdiomaUsuario == Idioma.ingles) {
                        mensaje = result[i][0];
                    }
                    else {
                        mensaje = result[i][1];
                    }
                    MobileCRM.UI.MessageBox.sayText(mensaje);
                }

            }, function (err) {

                MobileCRM.UI.MessageBox.sayText("Error during GetErrorCollectionByCode: " + err);
            },
                null);

        }
        catch (err) {
            
        }
    },

    onError: function () {

    },
//#endregion

//#region traducciones
    /// <summary> Obtiene la regi�n a partir del campo pais de la cuenta del usuario</summary>
    ObtenerRegionUsuario: function () {
        try {
            MobileCRM.Configuration.requestObject(
                function (config) {
                    if (config.isOnline) {
                        var settings = config.settings;
                        var userId = config.settings.systemUserId;

                        var usuario = new MobileCRM.FetchXml.Entity("systemuser");
                        usuario.addAttribute("address1_country");
                        var filter = new MobileCRM.FetchXml.Filter();
                        filter.where("systemuserid", "eq", userId);
                        usuario.filter = filter;
                        var fetch = new MobileCRM.FetchXml.Fetch(usuario);


                        fetch.execute("Array", function (result) {

                            for (var i in result) {
                                var results = result[i];
                                region = result[i][0];
                            }

                        }, function (err) {
                            this.GetErrorCollectionByCode('JS_001');
                        },
                            null);
                    }
                    return false;
                },
                function (err) {
                    this.GetErrorCollectionByCode('JS_001');
                },
                null
            );
        }
        catch (error) {
            this.GetErrorCollectionByCode('JS_001');
        }
    },

    localization: function startPointFn(loadedLangId) {
        /// <summary>
        /// Selecciona el idioma que tenga establecido 
        /// </summary>
        /// <param name="loadedLangId">Identificador del idioma</param>
        /// <returns></returns>
        if (loadedLangId == "es-ES")
            IdiomaUsuario = Idioma.espanol;
        else
            IdiomaUsuario = Idioma.ingles;

    },

//#endregion
}