var formContext = null;
var stateCode = {
	Ative: 0,
	Inactive: 1
};
var statusCode = {
	Ative: 1,
	Failed: 870280001,
	Inactive: 2,
	Cancelled: 870280000
};
var purchaseOrderType = {
	Warehouse: 870280000,
	WorkOrder: 870280001
};
var dummyWarehouse = new MobileCRM.Reference("msdyn_warehouse", "cfe6151d-c288-eb11-a812-000d3adb33da", "Dummy");
//	new Array();
//dummyWarehouse[0] = new Object();
//dummyWarehouse[0].id = "cfe6151d-c288-eb11-a812-000d3adb33da";
//dummyWarehouse[0].name = "Dummy";
//dummyWarehouse[0].entityType = "msdyn_warehouse";
var purchaseOrderTypes = {
	Warehouse: 870280000,
	WorkOrder: 870280001
};

var isAssociatetoWarehouseRequired = false;

function onLoad() {
	SetRequiredFields();
	//AllowedWarehouses(executionContext);
	//onChangePurchaseOrder_SetProveedor(executionContext);
	//SetCurrency(executionContext);
}

function SetRequiredFields() {
	SetWarehouse();
	SetBatchNumber_and_ValuationType_Requirement(formContext);
	//SetBatchNumber_byProduct(formContext);
	//ShowHideSerialNumberSection(formContext);
}

function SetWarehouse() {
	MobileCRM.UI.EntityForm.requestObject(

		function (entityForm) {
			var entity = entityForm.entity;
			if (entity.properties["msdyn_purchaseorder"] == null) {
				return;
			}
			var entity = entityForm.entity;
			//MobileCRM.bridge.alert("Json is = " + JSON.stringify(entityForm))
			var warehouse = entity.properties.msdyn_associatetowarehouse;
			//MobileCRM.bridge.alert("Notificationid is " + notificationId);
			var purchaseOrderId = entity.properties.msdyn_purchaseorder;
			//MobileCRM.bridge.alert("Relationshipid is " + relationship);

			// query for relationship id
			var casesByRelationship = new MobileCRM.FetchXml.Entity("msdyn_purchaseorder");
			casesByRelationship.addAttribute("edprdyn_type");
			casesByRelationship.filter = new MobileCRM.FetchXml.Filter();
			casesByRelationship.filter.where("msdyn_purchaseorderid", "eq", purchaseOrderId.id);
			var fetch = new MobileCRM.FetchXml.Fetch(casesByRelationship);

			fetch.execute("Array", function (result) {
				var edprdyn_type = result[0][0];
				if (edprdyn_type === null || edprdyn_type === undefined) {
					MobileCRM.bridge.alert("Purchaseorders does not have data.");
					return;
				}
				isAssociatetoWarehouseRequired = false;
				//formContext.getAttribute("msdyn_associatetowarehouse").setRequiredLevel("none");
				//var result = JSON.parse(this.response);
				//var edprdyn_type = result["edprdyn_type"];
				if (edprdyn_type == purchaseOrderTypes.WorkOrder && warehouse == null) {
					//	formContext.getAttribute("msdyn_associatetowarehouse").setValue(dummyWarehouse);
					//entity.properties.msdyn_associatetowarehouse = dummyWarehouse;
					entityForm.entity.properties["msdyn_associatetowarehouse"] = dummyWarehouse;
					//	formContext.getAttribute("msdyn_associatetowarehouse").setRequiredLevel("none");
					isAssociatetoWarehouseRequired = false;
				}
				else if (edprdyn_type == purchaseOrderTypes.Warehouse) {
					isAssociatetoWarehouseRequired = true;
					//	//Clear warehouse if Dummy
					var warehouse = entity.properties.msdyn_associatetowarehouse;
					if (warehouse[0].id.includes(dummyWarehouse[0].id)) {
						formContext.getAttribute("msdyn_associatetowarehouse").setValue(null);
					}
				}

			}, function (error) {
				MobileCRM.bridge.alert("Error SetWarehouse fetching notification!! Error is " + error);
			});

		},
		function (err) {
			MobileCRM.bridge.alert("An error occurred in SetWarehouse : " + err);
		},
		null
	);

}



function SetBatchNumber_and_ValuationType_Requirement() {
	MobileCRM.UI.EntityForm.requestObject(

		function (entityForm) {
			var entity = entityForm.entity;

			//var material = formContext.getAttribute("edprdyn_product").getValue();
			var material = entity.properties.edprdyn_product;
			//var planta = formContext.getAttribute("edprdyn_plant").getValue();
			var planta = entity.properties.edprdyn_plant;
			if (material === null || planta === null) {
				return;
			}

			var xmlData = '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">' +
				'<entity name = "atos_materialenplanta" >' +
				'<attribute name="atos_sujetolote" />' +
				'<attribute name="atos_categoriavaloracion" />' +
				'<attribute name="atos_materialenplantaid" />' +
				'<order descending="false" attribute="atos_plantaid" />' +
				'<filter type="and">' +
				'<condition attribute="atos_materialid" operator="eq" uitype="product" value="{4B12A3C3-2952-EA11-A812-000D3AB55EFB}" />' +
				'<condition attribute="atos_plantaid" operator="eq" uitype="atos_centrodeemplazamiento" value="{9AEBDFC2-D7CC-E911-A977-000D3ABA09FA}" />' +
				'</filter>' +
				'</entity>' +
				'</fetch>';

			MobileCRM.FetchXml.Fetch.executeFromXML(
				xmlData,
				function (result) {
					if (result.length != 1) {
						return;
					}
					for (var i in result) {
						var props = result[i];
						MobileCRM.bridge.alert("fetching atos_materialenplanta: " + props[0]);
						//processAccount(props[0], props[1]);
					}
				},
				function (err) {
					MobileCRM.bridge.alert("Error in SetBatchNumber_and_ValuationType_Requirement fetching accounts: " + err);
				},
				null
			);

		},
		function (err) {
			MobileCRM.bridge.alert("An error occurred in SetBatchNumber_and_ValuationType_Requirement: " + err);
		},
		null
	);



	//req.open("GET", Xrm.Page.context.getClientUrl() + "/api/data/v9.2/atos_materialenplantas?$select=atos_sujetolote,atos_categoriavaloracion&$filter=(_atos_materialid_value eq " + materialId + " and _atos_plantaid_value eq " + plantaId + ")", true);
	//req.setRequestHeader("OData-MaxVersion", "4.0");
	//req.setRequestHeader("OData-Version", "4.0");
	//req.setRequestHeader("Accept", "application/json");
	//req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
	//req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
	//req.onreadystatechange = function () {
	//	if (this.readyState === 4) {
	//		req.onreadystatechange = null;
	//		if (this.status === 200) {
	//			var result = JSON.parse(this.response);
	//			if (result.value.length !== 1) {
	//				return;
	//			}
	//			else {
	//				//					debugger;
	//				if (result.value[0].atos_sujetolote === true) {
	//					formContext.getAttribute("edprdyn_batchnumber").setRequiredLevel("required");
	//					formContext.getControl("edprdyn_batchnumber").setVisible(true);
	//				}
	//				else {
	//					formContext.getAttribute("edprdyn_batchnumber").setRequiredLevel("none");
	//					formContext.getControl("edprdyn_batchnumber").setVisible(false);
	//					//formContext.getAttribute("edprdyn_batchnumber").setValue(null);
	//				}
	//				if (result.value[0].atos_categoriavaloracion !== null) {
	//					formContext.getAttribute("edprdyn_valuationtype").setRequiredLevel("required");
	//					formContext.getControl("edprdyn_valuationtype").setVisible(true);
	//				}
	//				else {
	//					formContext.getAttribute("edprdyn_valuationtype").setRequiredLevel("none");
	//					formContext.getControl("edprdyn_valuationtype").setVisible(false);
	//				}
	//			}
	//		}
	//		else {
	//			console.error(JSON.parse(this.response).error.message);
	//		}
	//	}
	//};
	//req.send();
}

