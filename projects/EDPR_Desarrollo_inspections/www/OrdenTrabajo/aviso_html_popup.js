var formulario;
var workOrderId;
var notificationId;
var breakdownStartDate;
var breakdownFormatStartDate
var breakdownEndDate;
var breakdownFormatEndDate;

function onPageLoad(entityForm) {
    try {
        MobileCRM.UI.EntityForm.onCommand("custom_NotificationDates",
            function (entityForm) {
                if (entityForm) {

                    // -------------------------- Get ID's -----------------------------
                    workOrderId = entityForm.entity.properties.msdyn_workorderid;
                    if (workOrderId === null && workOrderId === undefined) {
                        return;
                    }
                    window.sessionStorage.setItem("workOrderId", workOrderId);

                    notificationId = entityForm.entity.properties.atos_avisoid.id;
                    if (notificationId === null || notificationId === undefined) {
                        return;
                    }
                    window.sessionStorage.setItem("notificationId", notificationId);

                    // -------------------------- Retrieve Notification/Aviso from Work Order -----------------------------
                    var fetchXML_NotificationInWO = getFetchXMLtoGetNotificationInWO(notificationId);

                    MobileCRM.FetchXml.Fetch.executeFromXML(fetchXML_NotificationInWO,
                        function (result) {
                            for (var i in result) {
                                MobileCRM.UI.EntityForm.requestObject(
                                    function (entityForm) {
                                        formulario = entityForm;
                                        // -------------------------- Get date fields -----------------------------
                                        for (var i in result) {
                                            breakdownStartDate = result[0][1];
                                            breakdownFormatStartDate = convertDates(breakdownStartDate);
                                            breakdownEndDate = result[0][2];
                                            breakdownFormatEndDate = convertDates(breakdownEndDate);
                                        } //for                                                                                               

                                        // -------------------------- prepare date data -----------------------------
                                        window.sessionStorage.setItem("checkBox", true);

                                        if (breakdownFormatStartDate !== null && breakdownFormatStartDate !== undefined) {
                                            document.getElementById("fechaInicioInput").setAttribute("value", breakdownFormatStartDate);
                                            window.sessionStorage.setItem("fechaInicioInput", breakdownFormatStartDate);
                                            window.sessionStorage.setItem("fechaInicioInputNotification", breakdownFormatStartDate);
                                        }
                                        if (breakdownFormatEndDate !== null && breakdownFormatEndDate !== undefined) {
                                            document.getElementById("fechaFinInput").setAttribute("value", breakdownFormatEndDate);
                                            window.sessionStorage.setItem("fechaFinInput", breakdownFormatEndDate);
                                            window.sessionStorage.setItem("fechaFinInputNotification", breakdownFormatEndDate);
                                        }

                                        // --------------------------

                                    },
                                    FS.CommonEDPR.onError,
                                    null
                                );
                            }
                        },
                        function (err) {
                            MobileCRM.UI.MessageBox.sayText("Error fetch: " + err);
                        },
                        null
                    ); //executeFromXML
                } //if
            }, //function
            true,
            null
        ); //onCommand
    } //try
    catch (err) {
        MobileCRM.UI.MessageBox.sayText("Error try: " + err);
    } //catch



    var okButton = document.getElementById("btnOK");
    var cancelButton = document.getElementById("btnCancel");
    new fabric['Button'](cancelButton, function () {
        window.close();
    });

    new fabric['Button'](okButton, function () {
        if (workOrderId === null || workOrderId === undefined) {
            return;
        }
        var fetchXML_AllNotificationInWO = getFetchXMLtoGetAllNotificationInWO(workOrderId);
        //Put any logic you want here
        if (window.sessionStorage.fechaInicioInput < window.sessionStorage.fechaFinInput) {
            if (window.sessionStorage.checkBox === "true") {
                checkbox = true;
            }
            else {
                checkbox = false;
            }

            MobileCRM.FetchXml.Fetch.executeFromXML(fetchXML_AllNotificationInWO,
                function (result) {
                    for (var i in result) {
                        debugger;
                        var id = result[i][0];
                        var updAviso = new MobileCRM.DynamicEntity("atos_aviso", id);
                        var props = updAviso.properties;
                        props.atos_fechainicioaveria = fechaInicioInput.value + ":00Z";
                        props.atos_fechafinaveria = fechaFinInput.value + ":00Z";

                        updAviso.save(
                            function (error) {
                                if (error) {
                                    MobileCRM.bridge.alert("An error occurred: " + error);
                                }
                                else {
                                    MobileCRM.UI.EntityForm.requestObject(
                                    function (entityForm) {
                                        // The name of the tab, and true to show or false to hide
                                        entityForm.setTabVisibility("Notification Dates", false);
                                        MobileCRM.UI.EntityForm.enableCommand("custom_NotificationDates", false);
                                    },
                                    MobileCRM.bridge.alert,
                                    null
                                );
                                    //MobileCRM.bridge.alert("Updated Notification: " + id);
                                    //formulario.setTabVisibility("Notification Dates", true);
                                    //MobileCRM.UI.EntityForm.enableCommand("custom_NotificationDates", false);

                                    //MobileCRM.UI.EntityForm.requestObject(
                                    //    function (entityForm) {
                                    //        // The name of the tab, and true to show or false to hide
                                    //        entityForm.setTabVisibility("General", true);
                                    //        entityForm.setTabVisibility("Avisos Date", true);
                                    //    },
                                    //    MobileCRM.bridge.alert,
                                    //    null
                                    //);

                                }
                            }//function
                        );
                    }//for
                },
                function (err) {
                    MobileCRM.bridge.alert("Error fetching accounts: " + err);
                },
                null
            );            

            window.returnValue = "Put the data you want to return here";
            window.close();
        }
        else
            alertInput();
    });

} //onPageLoad

function onError(error) {
    alert(error);
}

function getFetchXMLtoGetNotificationInWO(notificationId) {
    if (notificationId === null || notificationId === undefined) {
        notificationId = window.sessionStorage.notificationId;
    }
    return "<fetch>" +
        "  <entity name='atos_aviso'>" +
        "    <attribute name='atos_avisoid'/>" +
        "    <attribute name='atos_fechainicioaveria'/>" +
        "    <attribute name='atos_fechafinaveria'/>" +
        "    <filter type='and'>" +
        "      <condition attribute='atos_avisoid' operator='eq' value='" + notificationId + "'/>" +
        "    </filter>" +
        "  </entity>" +
        "</fetch>";
}

function getFetchXMLtoGetAllNotificationInWO(workOrderId) {
    if (workOrderId === null || workOrderId === undefined) {
        workOrderId = window.sessionStorage.workOrderId;
    }
    return "<fetch>" +
        "  <entity name='atos_aviso'>" +
        "    <attribute name='atos_avisoid'/>" +
        "    <attribute name='atos_fechainicioaveria'/>" +
        "    <attribute name='atos_fechafinaveria'/>" +
        "    <filter type='and'>" +
        "      <condition attribute='atos_ordendetrabajoid' operator='eq' value='" + workOrderId + "'/>" +
        "    </filter>" +
        "  </entity>" +
        "</fetch>";
}

function showHide() {
    var checkBox = document.getElementById("checkboxNotification");
    var textfechaInicio = document.getElementById("fechaInicio");
    var textfechaFin = document.getElementById("fechaFin");
    var tableAll = document.getElementById("tableAll");
    debugger;
    if (checkBox.checked == true) {
        tableAll.style.display = "block";
        document.getElementById("fechaInicioInput").value = window.sessionStorage.fechaInicioInputNotification;
        document.getElementById("fechaFinInput").value = window.sessionStorage.fechaFinInputNotification;
        window.sessionStorage.setItem("checkBox", true);

    } else {
        tableAll.style.display = "none";
        document.getElementById("fechaInicioInput").value = window.sessionStorage.fechaInicioInputNotification;
        document.getElementById("fechaFinInput").value = window.sessionStorage.fechaFinInputNotification;
        window.sessionStorage.setItem("fechaInicioInput", window.sessionStorage.fechaInicioInputNotification);
        window.sessionStorage.setItem("fechaFinInput", window.sessionStorage.fechaFinInputNotification);
        window.sessionStorage.setItem("checkBox", false);
    }
}

function convertDates(breakdown) {
    if (breakdown === null || breakdown === undefined) return;
    var parts = breakdown.split(" ");
    var dateParts = parts[0].split("/");
    var timeParts = parts[1].split(":");

    var year = dateParts[2];
    var month = dateParts[0];
    var day = dateParts[1];
    var hour = timeParts[0];
    var min = timeParts[1];

    // Combine the date and time components
    var datetime = year + '-' + month + '-' + day + 'T' + hour + ':' + min;

    return datetime;
}

function seleccionarInicio() {
    var input = document.getElementById("fechaInicioInput").value;
    window.sessionStorage.setItem("fechaInicioInput", input);
}

function seleccionarFin() {
    var input = document.getElementById("fechaFinInput").value;
    if (window.sessionStorage.fechaInicioInput < input)
        window.sessionStorage.setItem("fechaFinInput", input);
    else
        alertInput();
}

function alertInput() {
    alert("Fecha fin averia <= Fecha Inicio averia");
}