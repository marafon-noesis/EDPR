/**
 * Shows a native alert message.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the optional callback parameter.
 *
 * ### Example
 * Show alert message without callback:
 *     alert("Alert without callback");
 *
 * Show alert message with callback:
 *     function onAlertCompleted(res) {
 *         if (res.error) {
 *     			throw new Error(res.error);
 *         }
 *         else {
 *            alert("Alert result: '" + res.result);
 *         }
 *      }
 *     alert('Alert with callback', onAlertCompleted);
 *
 * @since 5.1.10.0
 * @static
 * @param {String} msg The alert message to display.
 * @param {Function} [callback] Optional callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {Object} callback.res.result The result of the method, the string representation of the requested resource or null.
 * @returns {void}
 */
window.alert = function (msg, callback) {
    var message;

    // calllback must be a function.
    callback = callback === undefined ? null : callback;
    if (callback != null && Object.prototype.toString.call(callback) != "[object Function]") {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage("alert", callback, message);

        throw new Error(message);
    }

    Mobile.Sdk.core.execute("ShowAlert", msg, callback);
};


/**
 * Shows a native confirm message.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 *
 * ### Example
 * Show confirm message:
 *     function onConfirmCompleted(res) {
 *         if (res.error) {
 *     			throw new Error(res.error);
 *         }
 *         else {
 *            alert("Confirm result: '" + res.result);
 *         }
 *      }
 *     alert('Confirm message', onConfirmCompleted);
 *
 * @since 5.1.10.0
 * @static
 * @param {String} msg The alert message to display.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {Object} callback.res.result The result of the method, the string representation of the requested resource or null.
 * @returns {void}
 */
window.confirm = function (msg, callback) {
    var message;

    // calllback parameter is mandatory.
    if (typeof callback === "undefined" || callback === null) {
        message = "Missing mandatory Callback parameter.";
        Mobile.Sdk.device.logValidationMessage("confirm", callback, message);

        throw new Error(message);
    }
    // calllback must be a function.
    if (Object.prototype.toString.call(callback) != "[object Function]") {
        message = "Callback is not a Function.";
        Mobile.Sdk.device.logValidationMessage("confirm", callback, message);

        throw new Error(message);
    }

    Mobile.Sdk.core.execute("ShowConfirm", msg, callback);
};


/**
 * Loads a resource file from the '\sdk\resources' folder and returns the contents as a string or an error if it does not exist.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 *
 * ### Example
 * Load the contents of a text file:
 *     function onGetResourceAsyncCompleted(res) {
 *         if (res.error) {
 *     			throw new Error(res.error);
 *         }
 *         else {
 *            alert("File '" + res.userState.resourceName +  "' contents is " + res.result);
 *         }
 *      }
 *     var userState = {};
 *     userState.resourceName = 'mytextfile.txt';
 *     Mobile.Sdk.core.resources.getResourceAsync({ "resourceName": userState.resourceName, "userState": userState }, onGetResourceAsyncCompleted);
 *
 * @since 5.1.10.0
 * @static
 * @param {Object} options The Get Resource options.
 * @param {String} options.resourceName The full name of the resource including its extension.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {Object} callback.res.result The result of the method, the string representation of the requested resource or null.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.resources.getResourceAsync = function (options, callback) {
    var message;

    // calllback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = 'Missing mandatory callback parameter.';
        Mobile.Sdk.core.logValidationMessage('core.resources.getResourceAsync', callback, message);

        throw new Error(message);
    }
    // calllback must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('core.resources.getResourceAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('core.resources.getResourceAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be an Object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not an Object.';
        Mobile.Sdk.core.logValidationMessage('core.resources.getResourceAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.resourceName property is mandatory and cannot be null.
    if (typeof options.resourceName === 'undefined' || options.resourceName === null) {
        message = "Missing mandatory options.resourceName parameter.";
        Mobile.Sdk.core.logValidationMessage("core.resources.getResourceAsync", options, message);

        callback({ error: message, userState: options.userState });
        return;
    }
    // options.resourceName must be a string.
    if (Object.prototype.toString.call(options.resourceName) != "[object String]") {
        message = "options.resourceName is not a String.";
        Mobile.Sdk.core.logValidationMessage("core.resources.getResourceAsync", options, message);

        callback({ error: message, userState: options.userState });
        return;
    }
    // options.resourceName may not be an empty string.
    if (options.resourceName.trim() === "") {
        message = "Missing mandatory options.resourceName parameter.";
        Mobile.Sdk.core.logValidationMessage("core.resources.getResourceAsync", options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Get Resource Async.
    try {
        var req = new XMLHttpRequest();
        req.open("GET", "ms-local-stream://" + window.location.host + "/sdk/resources/" + options.resourceName, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 200 || req.status == 0) {
                    callback({ result: req.responseText, userState: options.userState });
                }
                else {
                    message = "Problem while getting the resource. Status: " + req.status + " - " + req.responseText;
                    Mobile.Sdk.core.logValidationMessage("core.resources.getResourceAsync", options, message);
                    callback({ error: message, userState: options.userState });
                }
            }
        }
        req.send();
    }
    catch (e) {
        Mobile.Sdk.core.logValidationMessage("core.resources.getResourceAsync", options, e.message);
        callback({ error: e.message, userState: options.userState });
    }
};


/**
 * Creates an entity record using the application business logic. Depending on the Mobile.Sdk.core.entitymanager.ExecutionOptions parameter the record is created **locally and synchronized**,
 * created **only on the server** or created **only locally** (never in CRM). It is recommended to use the Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT option so that the native client
 * can determine how to process the request. This way, if the entity you are trying to create is configured as an online only entity, the native client will know to create it directly and
 * only on the server. Only use one of the other values of the Mobile.Sdk.core.entitymanager.ExecutionLocation in specific cases and if you know exactly what you're doing.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + The entity cannot contain a *statecode* field.
 * + The entitymanager will generate a primary key. When passed, it will be ignored.
 * + If the entity contains a *statuscode* field, the value should belong to the default *statecode*.
 * + The following fields will be automatically set if not provided: *ownerid, organizer and from*.
 * + For DateTime fields the value should be a Date object. E.g.
 *       appointment.scheduledstart = new Date();
 * is a valid value, but:
 *       appointment.scheduledstart = Date.now();
 * is not. In this case you should use:
 *       appointment.scheduledstart = new Date(Date.now());
 *
 * ### <a id='CreateAttachment'></a>Creating Notes or Salesliterature Items with Attachments
 * A number of special rules apply:
 *
 * + When the field *documentbody* is passed, the field *filename* is also mandatory.
 * + Field *documentbody* can be passed as a **base64 string** or a **file uri** (such as returned from the Mobile.Sdk.device.camera.getPicture method).
 * + Field *mimetype* is optional.
 * + Field *filesize* will be calculated by the entitymanager. When passed, it will be ignored.
 * + Field *isdocument* (for Notes only) will be set by the entitymanager. When passed, it will be ignored.
 *
 * ### Examples
 * Creating an Account with the default execution options and showing the id of the created record. 
 *     var account = {};
 *     account.name = "Created by Mobile Sdk";
 *     account.creditonhold = false;
 *     account.revenue = 250000;
 *
 *     var options = {};
 *     options.entity = account;
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *
 *     try {
 *         new Mobile.Sdk.core.entitymanager("account").createAsync(options, function (res) {
 *             if (res.error)
 *                 alert(res.error);
 *             else
 *                 alert(res.result);
 *             });
 *     }
 *     catch {error} {
 *         alert(error.Description);
 *     }
 *
 * Creating a Contact with the primary key prefilled and the parentcustomerid filled. The execution options passed will create the record
 * only on the server. Depending on synchronization filters and if the entity is online only or not, the record will be available offline after the
 * next synchronzation.
 *     var contact = {};
 *     contact.contactid = "4FAC90E7-8CF1-4180-B47B-09C3A246CB67";
 *     contact.firstname = "Joe";
 *     contact.lastname = "Jones";
 *     contact.parentcustomerid = {id: "294fa2d4-9322-e211-a2ea-00155d00a107", entityType: "account", name: "Acme Inc."};
 *
 *     var options = {};
 *     options.entity = contact;
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions(Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY);
 *     
 *     new Mobile.Sdk.core.entitymanager("contact").createAsync(options, function (res) {
 *         if (res.error)
 *             alert(res.error);
 *         else
 *             alert(res.result);
 *     });
 *
 * Creating a Contact, passing a user state and showing the user state. The execution options are local and remote, meaning the contact will be
 * created in the local database and a request will be sent to the server. If the contact entity is configured as an online only entity the request
 * will fail.
 *     var contact = {};
 *     contact.contactid = "4FAC90E7-8CF1-4180-B47B-09C3A246CB67";
 *     contact.firstname = "Joe";
 *     contact.lastname = "Jones";
 *     contact.parentcustomerid = {id: "294fa2d4-9322-e211-a2ea-00155d00a107", entityType: "account", name: "Acme Inc."};
 *
 *     var options = {};
 *     options.entity = contact;
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions(Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_AND_REMOTE);
 *     options.userState = {timestamp: new Date(), entityName: 'contact'};
 *     
 *     new Mobile.Sdk.core.entitymanager("contact").createAsync(options, function (res) {
 *         if (res.error)
 *             alert(res.error);
 *         else
 *             alert(res.userState);
 *     });
 *
 * Creating an Appointment with 2 activity parties and default execution options:
 *     var appt = {};
 *     appt.subject = "Demo with customer";
 *     
 *     var parties = [];
 *     var party1 = {};
 *     party1.id = "294fa2d4-9322-e211-a2ea-00155d00a107";
 *     party1.entityType = "contact";
 *     party1.name = "Susan Burk";
 *     parties[0] = party1;
 *
 *     var party2 = {};
 *     party2.id = "148fa1d5-8412-a621-a2ca-00155d00a203";
 *     party2.entityType = "account";
 *     party2.name = "Contoso Corporation";
 *     parties[1] = party2;
 *     
 *     appt.requiredattendees = parties;
 *     appt.scheduledstart = new Date(2013, 4, 10, 14, 0, 0);
 *
 *     var options = {};
 *     options.entity = appt;
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *     
 *     new Mobile.Sdk.core.entitymanager("appointment").createAsync(options, function (res) {
 *         if (res.error)
 *             alert(res.error);
 *         else
 *             alert(res.result);
 *     });
 *
 * Updated since: **5.1.10.0**
 * 
 * @param {Object} options The Create options.
 * @param {Object} options.entity An entity object that has one or more properties set to be created for the record
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {String} callback.res.result The id of the created record.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.createAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be an Object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not an Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.entity parameter is mandatory.
    if (typeof options.entity === 'undefined' || options.entity === null) {
        message = "Missing mandatory options.entity parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity must be an object.
    if (Object.prototype.toString.call(options.entity) != '[object Object]') {
        message = "options.entity is not an Object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity should NOT contain statecode field.
    if (typeof options.entity.statecode !== 'undefined') {
        message = "options.entity should not contain field 'statecode'.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check for existence for required fields.
    var requiredEntities = ['appointment',
    'contract',
    'contractdetail',
    'contracttemplate',
    'customeraddress',
    'customerrelationship',
    'equipment',
    'incident',
    'kbarticle',
    'kbarticlecomment',
    'opportunity',
    'quote',
    'salesliteratureitem',
    'salesorder',
    'service',
    'serviceappointment',
    'site',
    'territory'];

    var requiredAttributes = [['scheduledstart', 'scheduledend'],
    ['contracttemplateid', 'customerid', 'billingcustomerid', 'activeon', 'expireson', 'billingstarton', 'billingendon'],
    ['contractid', 'activeon', 'expireson', 'price'],
    ['abbreviation', 'name'],
    ['parentid'],
    ['customerid', 'partnerid'],
    ['name', 'businessunitid', 'timezonecode'],
    ['customerid'],
    ['kbarticletemplateid', 'subjectid'],
    ['kbarticleid'],
    ['customerid'],
    ['customerid'],
    ['salesliteratureid'],
    ['customerid'],
    ['name', 'granularity', 'resourcespecid', 'initialstatuscode', 'duration'],
    ['scheduledstart', 'scheduledend'],
    ['name', 'timezonecode'],
    ['name']];

    var entityIndex = requiredEntities.indexOf(this.objecttypename);
    if (entityIndex > -1) {
        var attributes = requiredAttributes[entityIndex];

        for (i = 0; i < attributes.length; i++) {
            if (typeof options.entity[attributes[i]] === 'undefined' || options.entity[attributes[i]] === null) {
                message = "Missing required attribute '" + attributes[i] + "'.";
                Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

                callback({ error: message, userState: options.userState });
                return;
            }
        }
    }

    // Remove attributes with null values, they don't make sense in a Create.
    for (var att in options.entity) {
        if (typeof options.entity[att] === 'undefined' || options.entity[att] === null) {
            delete options.entity[att];
        }
    }

    // Default options.executionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // options.executionOptions must be a valid ExecutionOptions object.
    if (!options.executionOptions.hasOwnProperty("executionLocation")) {
        message = "options.executionOptions is not a valid Mobile.Sdk.core.entitymanager.ExecutionOptions object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check options.executionOptions.executionLocation value.
    if (options.executionOptions.executionLocation < 1 || options.executionOptions.executionLocation > 4) {
        message = "options.executionOptions.executionLocation should be value between 1 and 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'createEntity' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagercreateEntityAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('createEntity', this.objecttypename, options.entity, callback, options.executionOptions, options.userState);
}


/**
 * Updates an entity record using the application business logic. The result of this method depends on values set for Mobile.Sdk.core.entitymanager.ExecutionOptions 
 * parameter, the data set available on the client and whether the entity being updated is configured as an online only entity or not. It is recommended to use the 
 * Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT option and let the native client determine the correct way to process the request. It will do so based on the
 * online only entity flag and whether the record is available offline or not. If the entity is online only or if the record is not available offline the execution will
 * be Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY. If the record is available offline the execution will be Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_AND_REMOTE.
 * Explicitly using Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_ONLY or Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_AND_REMOTE for a record that is not available offline
 * will fail.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + The entity __has to__ contain the entity id, e.g. accountid for an account entity or contactid for a contact entity.
 *       account.accountid = "{7051502C-1BFB-E011-B7AF-00219BFAD36C}";
 * + The entity cannot contain a statecode field.
 * + The entity cannot contain an ownerid field.
 * + If the entity contains a statuscode field, the value should belong to the current statecode.
 * + An Inactive record cannot be updated.
 * + For DateTime fields the value should be a Date object, e.g:
 *       appointment.scheduledstart = new Date();
 * is a valid value, but:
 *       appointment.scheduledstart = Date.now();
 * is not. In this case you should use:
 *       appointment.scheduledstart = new Date(Date.now());
 * + When updating an ActivityParty field (e.g. requiredattendees) the complete ActivityParty array should be passed.
 * You cannot ADD parties to an existing ActivityParty field, so if you want to update an ActivityParty field, you first
 * need to retrieve the existing value, then update that array and pass the new complete array to the update method.
 * + To clear a field, set the value to null, e.g.:
 *       account.numberofemployees = null;
 *
 * ### Updating Notes or Salesliterature Items with Attachments
 * When deleting an attachment, it's enough to set the field *documentbody* to null. This will set *isdocument* to false and *filename, filesize and mimetype* to null.
 * When the field *documentbody* is set to null, the field *filename* should be either null or not present in the update.
 *
 * For adding or updating attachments, see the rules in [Creating Notes or Salesliterature Items with Attachments](#CreateAttachment)
 *
 * ### Examples
 * See examples for Mobile.Sdk.core.entitymanager.create.
 *
 * Updated since: **5.1.10.0**
 *
 * @param {Object} options The Update options.
 * @param {Object} options.entity An entity object that has one or more properties set to be created or updated for the record.
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {String} callback.res.result The id of the created record.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.updateAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be an Object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not an Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.entity parameter is mandatory.
    if (typeof options.entity === 'undefined' || options.entity === null) {
        message = "Missing mandatory options.entity parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity must be an object.
    if (Object.prototype.toString.call(options.entity) != '[object Object]') {
        message = "options.entity is not an Object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity should contain at least 2 attributes (primary key).
    var attCount = 0;
    for (var att in options.entity) {
        if (options.entity.hasOwnProperty(att)) attCount++;
        if (attCount === 2) break;
    }
    if (attCount < 2) {
        message = "options.entity should contain at least 2 attribute (primary key and any other attribute).";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity should NOT contain statecode field.
    if (typeof options.entity.statecode !== 'undefined') {
        message = "options.entity cannot contain field 'statecode'.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.Entity should NOT contain ownerid field.
    if (typeof options.entity.ownerid !== 'undefined') {
        message = "options.entity cannot contain field 'ownerid'.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.entity should NOT contain statuscode field with value null.
    if (options.entity.statuscode === null) {
        message = "options.entity cannot contain field 'statuscode' with value null.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // If entity contains documentbody=null, then also set filename=null.
    if (options.entity.documentbody === null && typeof options.entity.filename === 'undefined') {
        options.entity.filename = null;
    }

    // Default options.executionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // options.executionOptions must be a valid ExecutionOptions object.
    if (!options.executionOptions.hasOwnProperty("executionLocation")) {
        message = "options.executionOptions is not a valid Mobile.Sdk.core.entitymanager.ExecutionOptions object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check options.executionOptions.executionLocation value.
    if (options.executionOptions.executionLocation < 1 || options.executionOptions.executionLocation > 4) {
        message = "options.executionOptions.executionLocation should be value between 1 and 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.updateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'updateEntity' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagerupdateEntityAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('updateEntity', this.objecttypename, options.entity, callback, options.executionOptions, options.userState);
}


/**
 * Deletes an entity record using the application business logic. Depending on the Mobile.Sdk.core.entitymanager.ExecutionOptions parameter the record will be
 * deleted **locally and synchronized**, deleted **only on the server** or deleted **only locally** (never in CRM). It is recommended to use the 
 * Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT option so that the native client can determine how to process the request. Only use one of the other 
 * values of the Mobile.Sdk.core.entitymanager.ExecutionLocation in specific cases and if you know exactly what you're doing.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + If the record to be deleted doesn't exist and the execution options are Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT, NO error will be thrown.
 *
 * ### Examples
 * Deleting an account with default execution options and showing the result:
 *     var options = {};
 *     options.id = '{B05EC7CE-5D51-DF11-97E0-00155DB232D0}';
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *
 *     Mobile.Sdk.core.entitymanager('account').deleteAsync(options, function (res) {
 *     if (res.error)
 *         alert(res.error);
 *     else
 *         alert(res.result);
 *     });
 *
 * Updated since: **5.1.10.0**
 *
 * @param {Object} options The Delete options.
 * @param {String} options.id Id of the record to be deleted.
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {String} callback.res.result The id of the deleted record.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.deleteAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be an Object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not an Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.id parameter is mandatory.
    if (typeof options.id === 'undefined' || options.id === null) {
        message = "Missing mandatory options.id parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id parameter must be a String.
    if (Object.prototype.toString.call(options.id) != '[object String]') {
        message = "options.id is not a String.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id must be a valid GUID.
    if (/^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/.test(options.id) === false) {
        message = "options.id doesn't seem to be a valid GUID.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Default options.executionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // options.executionOptions must be a valid ExecutionOptions object.
    if (!options.executionOptions.hasOwnProperty("executionLocation")) {
        message = "options.executionOptions is not a valid Mobile.Sdk.core.entitymanager.ExecutionOptions object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check options.executionOptions.executionLocation value
    if (options.executionOptions.executionLocation < 1 || options.executionOptions.executionLocation > 4) {
        message = "options.executionOptions.executionLocation should be value between 1 and 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.deleteAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'deleteEntity' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagerdeleteEntityAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('deleteEntity', this.objecttypename, options.id, callback, options.executionOptions, options.userState);
}


/**
 * Sets the state of an entity record using the application business logic. Depending on the Mobile.Sdk.core.entitymanager.ExecutionOptions parameter the 
 * change of state will be **locally and synchronized**, **only on the server** or **only locally** (never in CRM). It is recommended to use the 
 * Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT option so that the native client can determine how to process the request. Only use one of the other 
 * values of the Mobile.Sdk.core.entitymanager.ExecutionLocation in specific cases and if you know exactly what you're doing.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + If the passed statecode is equal to the current statecode of the record, the setState will be ignored.
 * + If you pass null or -1 for the statusCode, the default status for the passed state will be used.
 * + Entities Opportunity (opportunity) and Case (incident) can only be set to 0, i.e. Reactivated.
 * + SetState cannot be used on entity Email (email).
 *
 * ### Examples
 * Deactivating an account and use the default execution options then showing the result:
 *     var options = {};
 *     options.id = '{B05EC7CE-5D51-DF11-97E0-00155DB232D0}';
 *     options.state = 1; // Inactive
 *     options.status = 2; // Inactive
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *     
 *     Mobile.Sdk.core.entitymanager('account').setStateAsync(options, function (res) {
 *     if (res.error)
 *         alert(res.error);
 *     else
 *         alert(res.result);
 *     });
 *
 * Setting an appointment to "Scheduled" and use the default status code. The execution options are REMOTE_ONLY, meaning the change of state will be done 
 * directly on the server. The change will be available offline after the next synchronization if the synch filters allow it.
 *     var options = {};
 *     options.id = '{B05EC7CE-5D51-DF11-97E0-00155DB231A0}';
 *     options.state = 3; // Scheduled
 *     options.status = -1; // Use default status
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions(Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY;
 *     
 *     Mobile.Sdk.core.entitymanager('appointment').setStateAsync(options, function (res) {
 *     if (res.error)
 *         alert(res.error);
 *     else
 *         alert(res.result);
 *     });
 *
 * Updated since: **5.1.10.0**
 * 
 * @param {Object} options The SetState options.
 * @param {String} options.id Id of the record for which the state is being changed.
 * @param {Number} options.state Target state code of the record.
 * @param {Number} options.status Target status code of the record.
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {String} callback.res.result The id of the deleted record.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.setStateAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be an Object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not an Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.id parameter is mandatory.
    if (typeof options.id === 'undefined' || options.id === null) {
        message = "Missing mandatory options.id parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id parameter must be a String.
    if (Object.prototype.toString.call(options.id) != '[object String]') {
        message = "options.id is not a String.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id must be a valid GUID.
    if (/^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/.test(options.id) === false) {
        message = "options.id doesn't seem to be a valid GUID.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.state must be a Number.
    if (Object.prototype.toString.call(options.state) != '[object Number]' || isNaN(options.state)) {
        message = "options.state is not a Number.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Default options.status to -1 if needed.
    if (typeof options.status === 'undefined' || options.status === null) {
        options.status = -1;
    }

    // options.status must be a Number.
    if (Object.prototype.toString.call(options.status) != '[object Number]' || isNaN(options.status)) {
        message = "options.status is not a Number.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check valid entity/statecode combinations.
    if (this.objecttypename === 'opportunity' || this.objecttypename === 'incident') {
        if (options.state !== 0) {
            message = "Entities 'opportunity' and 'incident' can only be set to 0.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }
    }
    if (this.objecttypename === 'email') {
        message = "SetState is not valid for entity 'email'.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Default options.executionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // options.executionOptions must be a valid ExecutionOptions object.
    if (!options.executionOptions.hasOwnProperty("executionLocation")) {
        message = "options.executionOptions is not a valid Mobile.Sdk.core.entitymanager.ExecutionOptions object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check options.executionOptions.executionLocation value
    if (options.executionOptions.executionLocation < 1 || options.executionOptions.executionLocation > 4) {
        message = "options.executionOptions.executionLocation should be value between 1 and 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.setStateAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'setStateEntity' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagersetStateEntityAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('setStateEntity', this.objecttypename, options.id, options.state, options.status, callback, options.executionOptions, options.userState);
}


/**
 * Retrieves a entity record with the specified id using the application business logic. The Mobile.Sdk.core.entitymanager.ExecutionOptions parameter specifies
 * the location from where to retrieve the record. There can be only one source, therefore Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_AND_REMOTE is
 * not a valid option. Use Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY to get the record from the server or Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_ONLY
 * to retrieve it from the native client's database. Using Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT will let the native client decide the source
 * based on the entity's online only flag.
 *
 * ### Rules and Validations
 * The following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + If the record to be retrieved doesn't exist, res.result.entity will be null.
 * + Passing a null or empty array for the columnset will retrieve all attributes.
 * + Only attributes that have values will be returned.
 * + The primary key will always be returned, even if not specified in the columnset.
 *
 * ### Examples
 * Retrieving all attributes from an account and showing the name. Using the default execution options.
 *     var options = {};
 *     options.id = '{B05EC7CE-5D51-DF11-97E0-00155DB232D0}';
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *
 *     Mobile.Sdk.core.entitymanager('account').retrieve(options, function (res) {
 *     if (res.error)
 *         alert(res.error);
 *     else
 *         alert(res.result.entity.name);
 *     });
 *
 * Retrieving the subject, scheduledstart and scheduledend from an appointment and showing them. Retrieving the record from the server.
 *     var options = {};
 *     options.id = '{B05EC7CE-5D51-DF11-97E0-00155DB232D1}';
 *     options.columnset = ['subject', 'scheduledstart', 'scheduledend'];
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions(Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY);
 *
 *     Mobile.Sdk.core.entitymanager('appointment').retrieveAsync(options, function (res) {
 *     if (res.error)
 *         alert(res.error);
 *     else
 *         alert('Appointment: ' + res.result.entity.subject + ' starts at ' + res.result.entity.scheduledstart + 'and ends at ' + res.result.entity.scheduledend);
 *     });
 *
 * Updated since: **5.1.10.0**
 *
 * @param {Object} options The Retrieve options.
 * @param {String} options.id Id of the record to be retrieved.
 * @param {Array} options.columnset String Array of attributes to be retrieved.
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {Object} callback.res.result The result of the method.
 * @param {Object} callback.res.result.entity An entity object containing the filled properties that are specified by the passed columnset.
 * @param {Object} callback.res.result.entityName The entity name of the retrieved record.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.retrieveAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be a object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not a Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.id parameter is mandatory.
    if (typeof options.id === 'undefined' || options.id === null) {
        message = "Missing mandatory options.id parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id parameter must be a String.
    if (Object.prototype.toString.call(options.id) != '[object String]') {
        message = "options.id is not a String.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.id must be a valid GUID.
    if (/^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/.test(options.id) === false) {
        message = "options.id doesn't seem to be a valid GUID.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // If defined the options.columnset must be an Array.
    if (typeof options.columnset !== 'undefined' && options.columnset !== null) {
        if (Object.prototype.toString.call(options.columnset) != '[object Array]') {
            message = "options.columnset is not an Array.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        for (var i = 0; i < options.columnset.length; i++) {

            // Check if options.columnset[i] is defined/null.
            if (typeof options.columnset[i] === 'undefined' || options.columnset[i] === null) {
                message = "options.columnset[" + i + "] has no value.";
                Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

                callback({ error: message, userState: options.userState });
                return;
            }

            // options.columnset[i] should be a String.
            if (Object.prototype.toString.call(options.columnset[i]) != '[object String]') {
                message = "options.columnset[" + i + "] is not a String.";
                Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

                callback({ error: message, userState: options.userState });
                return;
            }
        }

        // If columnset is an empty array, set it to null
        if (options.columnset.length === 0) delete options.columnset;
    }

    // Default options.executionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // options.executionOptions must be a valid ExecutionOptions object.
    if (!options.executionOptions.hasOwnProperty("executionLocation")) {
        message = "options.executionOptions is not a valid Mobile.Sdk.core.entitymanager.ExecutionOptions object.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.createAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Check options.executionOptions.executionLocation value.
    if (options.executionOptions.executionLocation !== 1 && options.executionOptions.executionLocation !== 2 && options.executionOptions.executionLocation !== 4) {
        message = "options.executionOptions.executionLocation should be 1, 2 or 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'retrieveEntity' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagerretrieveEntityAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('retrieveEntity', this.objecttypename, options.id, (typeof options.columnset !== 'undefined') ? options.columnset : null, callback, options.executionOptions, options.userState);
}


/**
 * Retrieves a collection of entities based on a Fetch Xml query using the application business logic. The Mobile.Sdk.core.entitymanager.ExecutionOptions parameter specifies
 * the location from where collection will be retrieved. There can be only one source, therefore Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_AND_REMOTE is
 * not a valid option. Use Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY to get the collection from the server or Mobile.Sdk.core.entitymanager.ExecutionLocation.LOCAL_ONLY
 * to retrieve it from the native client's database. Using Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT will let the native client decide the source
 * based on the entity's online only flag.
 *
 * ### FetchXml Support
 * The CWR FetchXml supports a subset of the full Dynamics CRM FetchXml. A number of restrictions apply:
 *
 * + No support for aggregation.
 * + No support for complex operators such as fiscal date operators.
 * + No support for returning attributes from multiple entities, so only returning attributes from the main entity is supported.
 * + No support for linked entities deeper than one level. This means that currently it's not supported to query on many-to-many entities.
 * It is supported however to query on the intersect entity.
 *
 * In short, the subset of FetchXml that can also be generated by the View Editor in the CWR Mobile CRM Configurator is the supported subset
 * for retrieveMultiple.
 *
 * ### Rules and Validations
 * Furthermore, the following rules and validations apply:
 *
 * + This is an __asynchronous__ method and returns void. You need to get the result through the callback parameter.
 * + Only attributes that have values will be returned.
 * + The primary key will always be returned, even if not specified in the attribute list.
 * + If no page and count are provided, they will be defaulted to page=1 and count=20.
 * + If no \<attribute /\> or \</all-attributes\> are provides, the callback will return with res.error.
 * + Count=0 or page=0 will result in a callback with res.error.
 * + The entityName of the entitymanager should be the same as the entityname of the main entity in the fetch xml. E.g.:
 *   if you use 
 *       Mobile.Sdk.core.entitymanager('account').retrieveMultiple(...) 
 *   then the fetchxml should look like 
 *       <fetch><entity name='account'>...
 *
 * ### Examples
 * Retrieving Accounts where I am the owner:
 *     var options = {};
 *     options.fetchXml = "<fetch mapping='logical'> \
 *                            <entity name='account'> \
 *                               <attribute name='name'/> \
 *                               <filter> \
 *                                  <condition attribute='ownerid' operator='eq-userid' /> \
 *                               </filter> \
 *                            </entity> \
 *                         </fetch>";
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions();
 *
 *     try {
 *         Mobile.Sdk.core.entitymanager('account').retrieveMultipleAsync(options, onCallback);
 *     }
 *     catch (err) {
 *         alert("Err: " + err.description);
 *     }
 *
 *     function onCallback(res) {
 *         if (res.error) {
 *             Mobile.Sdk.core.logger.log('an error occurred.');
 *             alert('Err onCallback: ' + res.error); 
 *         }
 *         else {
 *             // Show the number of records retrieved
 *             alert(res.result.count);
 *
 *             // Show the name of the first account
 *             alert(res.result.entities[0].name);
 *
 *             // or with the other result properties
 *             // res.result.moreRecords
 *             // res.result.page
 *             // res.result.count
 *             // res.result.entityName
 *             // res.result.entities (array of entities)
 *         }
 *     }
 *
 * Instead of passing a callback function name you can also use an anonymous function:
 *     Mobile.Sdk.core.entitymanager('account').retrieveMultiple(options, function (res) {
 *         if (res.error)
 *             alert(res.error);
 *         else
 *             alert(JSON.stringify(res.result);
 *     });
 *
 * Because the retrieveMultiple method is asynchronous, it might be useful to pass a userState object to provide context in the callback:
 *     // This can be anything you want, it will be passed back to the callback
 *     options.userState = { timestamp: new Date() };
 *     
 *     Mobile.Sdk.core.entitymanager('account').retrieveMultiple(options, function (res) {
 *         alert('method called: ' + res.userState.timestamp);
 *         
 *         if (res.error)
 *             alert(res.error);
 *         else
 *             alert(JSON.stringify(res.result));
 *     });
 *
 * If res.result.moreRecords=true, you can request the next page. To do this you will have to alter your fetch xml to increment the page.
 * You can do a string replace on your fetch xml string, but you can also load your fetch xml into a XML DOM Document and perform you manipulation on that.
 * To do this you have to pass your Fetch Xml in the userState so that the callback has access to it and you can alter it for each subsequent request:
 *     var options = {};
 *     options.fetchXml = "<fetch mapping='logical'> \
 *                            <entity name='account'> \
 *                               <attribute name='name'/> \
 *                               <filter> \
 *                                  <condition attribute='ownerid' operator='eq-userid' /> \
 *                               </filter> \
 *                            </entity> \
 *                         </fetch>";
 *
 *     options.executionOptions = new Mobile.Sdk.core.entitymanager.ExecutionOptions(Mobile.Sdk.core.entitymanager.ExecutionLocation.REMOTE_ONLY);
 *     options.userState = fetch;
 *     
 *     try {
 *         Mobile.Sdk.core.entitymanager('account').retrieveMultiple(options, onCallback);
 *     }
 *     catch (err) {
 *         alert("Err: " + err.description);
 *     }
 *
 *     function onCallback(res) {
 *         if (res.error) {
 *             alert('Err onCallback: ' + res.error); 
 *         }
 *         else {
 *             // Do something with the result
 *             alert(res.result.count);
 *
 *             if(res.result.moreRecords === true) {
 *                 // Extract the fetch xml from the userState
 *                 var fetch = res.userState;
 *                 
 *                 if (window.DOMParser)
 *                 {
 *                     var parser = new DOMParser();
 *
 *                     try {
 *                         var fetchDoc = parser.parseFromString(fetch, "text/xml");
 *         
 *                         // IE will throw an error, other browsers we have to check the resulting document for a "parseerror" tag
 *                         if (fetchDoc.getElementsByTagName("parsererror").length > 0)
 *                         {
 *                             throw new Error(message);
 *                         }
 *
 *                         // Get the current page from the result
 *                         var currentPage = parseInt(fetchDoc.documentElement.getAttribute("page"));
 *                         var nextPage = currentPage++;
 *
 *                         // Set the next page to retrieve
 *                         fetchDoc.documentElement.setAttribute("page", nextPage);
 *
 *                         // Convert the XML Document back to a String
 *                         fetch = fetchDoc.xml ? fetchDoc.xml : (new XMLSerializer()).serializeToString(fetchDoc);
 *
 *                         // Retrieve the next page
 *                         try {
 *                             Mobile.Sdk.core.entitymanager('account').retrieveMultiple(fetch, onCallback, executionOptions, userState);
 *                         }
 *                         catch (err) {
 *                             alert("Err: " + err.description);
 *                         }
 *                     }
 *                     catch(err) {    
 *                         alert('FetchXml is not a valid XML document.');  
 *                     }
 *                 }
 *             }
 *         }
 *     }
 *
 * Updated since: **5.1.10.0**
 * 
 * @param {Object} options The Retrieve Multiple options.
 * @param {String} options.fetchXml A FetchXml query that determines what records to return.
 * @param {Object} options.executionOptions An execution options object that determines how the request will be executed.
 * @param {Mobile.Sdk.core.entitymanager.ExecutionLocation} [options.executionOptions.executionLocation = Mobile.Sdk.core.entitymanager.ExecutionLocation.DEFAULT] Sets the execution location of the request.
 * @param {Object} [options.userState] An optional user state object.
 * @param {Function} callback The callback function.
 * @param {Object} callback.res The result object.
 * @param {String} callback.res.error The error in case the method returned an error.
 * @param {Object} callback.res.result The result of the method.
 * @param {Boolean} callback.res.result.moreRecords Flag that indicates if there are more records to return (used for paging).
 * @param {Number} callback.res.result.page The page number of the retrieved records.
 * @param {Number} callback.res.result.count The number of records retrieved.
 * @param {String} callback.res.result.entityName The entity name of the retrieved records.
 * @param {Array} callback.res.result.entities An array of entity records.
 * @param {Object} callback.res.userState The user state object passed by the user. Null if no userState was passed.
 * @returns {void}
 */
Mobile.Sdk.core.entitymanager.prototype.retrieveMultipleAsync = function (options, callback) {
    var message;

    // callback parameter is mandatory.
    if (typeof callback === 'undefined' || callback === null) {
        message = "Missing mandatory callback parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', callback, message);

        throw new Error(message);
    }

    // callback parameter must be a function.
    if (Object.prototype.toString.call(callback) != '[object Function]') {
        message = "callback is not a Function.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', callback, message);

        throw new Error(message);
    }

    // options parameter is mandatory.
    if (typeof options === 'undefined' || options === null) {
        message = 'Missing mandatory options parameter.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message });
        return;
    }

    // options parameter must be a object.
    if (Object.prototype.toString.call(options) != '[object Object]') {
        message = 'options is not a Object.';
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message });
        return;
    }

    // options.fetchXml parameter is mandatory.
    if (typeof options.fetchXml === 'undefined' || options.fetchXml === null) {
        message = "Missing mandatory options.fetchXml parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.fetchXml must be a String
    if (Object.prototype.toString.call(options.fetchXml) != '[object String]') {
        message = "options.fetchXml is not a String.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.fetchXml may not be an empty string.
    if (options.fetchXml.trim() === '') {
        message = "Missing mandatory options.fetchXml parameter.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // Parse and validate fetchXml.
    if (window.DOMParser) {
        var parser = new DOMParser();
        var fetchDoc;

        try {
            fetchDoc = parser.parseFromString(options.fetchXml, "text/xml");

            // IE will throw an error, other browsers we have to check the resulting document for a "parseerror" tag.
            if (fetchDoc.getElementsByTagName("parsererror").length > 0)
            {
                throw new Error("options.fetchXml is not a valid XML document.");
            }
        }
        catch (err) {
            message = "options.fetchXml is not a valid XML document.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // Get link-entities.
        var linkEntities = fetchDoc.getElementsByTagName("link-entity");

        // link-entity should only be 1 level deep.
        for (i = 0; i < linkEntities.length; i++) {
            if (linkEntities[i].getElementsByTagName("link-entity").length > 0) {
                message = "options.fetchXml is not valid: Only one level of link-entity is supported.";
                Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

                callback({ error: message, userState: options.userState });
                return;
            }
        }

        // link-entity should not contain <attribute> or <all-attributes> child.
        for (i = 0; i < linkEntities.length; i++) {
            if (linkEntities[i].getElementsByTagName("attribute").length > 0 ||
                linkEntities[i].getElementsByTagName("all-attributes").length > 0) {
                message = "options.fetchXml is not valid: Link-entity cannot contain attributes.";
                Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

                callback({ error: message, userState: options.userState });
                return;
            }
        }

        // We don't support aggregates.
        if (fetchDoc.documentElement.getAttribute("aggregate")) {
            message = "options.etchXml is not valid: Aggregates are not supported.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // Default page count to 20 records if it's not present.
        if (!fetchDoc.documentElement.getAttribute("count")) {
            fetchDoc.documentElement.setAttribute("count", "20");
        }

        // Page count = 0 is not supported.
        if (fetchDoc.documentElement.getAttribute("count") == "0") {
            message = "options.etchXml is not valid: count=0 is not supported.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // Default page to 1 if it's not present.
        if (!fetchDoc.documentElement.getAttribute("page")) {
            fetchDoc.documentElement.setAttribute("page", "1");
        }

        // page = 0 is not supported.
        if (fetchDoc.documentElement.getAttribute("page") == "0") {
            message = "options.fetchXml is not valid: page=0 is not supported.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // Entity should contain an attribute list.
        var entity = fetchDoc.getElementsByTagName("entity")[0];
        if (entity.getElementsByTagName("attribute").length === 0 && entity.getElementsByTagName("all-attributes").length === 0) {
            message = "options.fetchXml is not valid: Missing attribute or all-attributes.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // EntityManager entityname should be equal to fetchxml entityname.
        var fetchEntityName = entity.getAttribute("name");
        if (this.objecttypename !== fetchEntityName) {
            message = "options.fetchXml is not valid: entitymanager entityname is not equal to fetch entityname.";
            Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

            callback({ error: message, userState: options.userState });
            return;
        }

        // Convert the XML Document back to a String.
        fetchXml = fetchDoc.xml ? fetchDoc.xml : (new XMLSerializer()).serializeToString(fetchDoc);
    }

    // Default ExecutionOptions.
    options.executionOptions = options.executionOptions || new Mobile.Sdk.core.entitymanager.ExecutionOptions();

    // Check options.executionOptions.executionLocation value.
    if (options.executionOptions.executionLocation !== 1 && options.executionOptions.executionLocation !== 2 && options.executionOptions.executionLocation !== 4) {
        message = "options.executionOptions.executionLocation should be 1, 2 or 4.";
        Mobile.Sdk.core.logValidationMessage('entitymanager.retrieveMultipleAsync', options, message);

        callback({ error: message, userState: options.userState });
        return;
    }

    // options.userState: iOS cannot handle undefined, so we need to convert it to null.
    if (typeof options.userState === 'undefined') options.userState = null;

    // TODO: For now, use the 'retrieveMultiple' method to call native.
    ////Mobile.Sdk.core.execute('coreentitymanagerretrieveMultipleAsync', this.objecttypename, options, callback);
    Mobile.Sdk.core.execute('retrieveMultiple', this.objecttypename, options.fetchXml, callback, options.executionOptions, options.userState);
}


/************************************************************************************************************************************************************/
/*
 *WP7 BRIDGE.
 */
var WP7Bridge = WP7Bridge || {};


// Call Native Method (window.extenal.notify).
WP7Bridge.callNative = function (args) {
    // Reset Native Return Value.
    WP7Bridge.nativeReturnValue = undefined;

    // Remove the first element from the args (Method Name). 
    var methodName = args.shift();

    // Capitalize the first letter of the method name. 
    methodName = methodName.charAt(0).toUpperCase() + methodName.slice(1);

    // Generate the Command.
    var command = methodName + "/" + JSON.stringify(args);

    // Call Native.
    try {
        if (window.external)
            window.external.notify(command);
        else
            console.log("window.external not available (command = " + command);
    }
    catch (e) {
        console.log("Exception calling native command '" + command + "'. " + e);
    }

    // Check for Native Error.
    if (typeof WP7Bridge.nativeReturnValue !== "undefined") {
        if (WP7Bridge.nativeReturnValue.error)
            throw new Error(WP7Bridge.nativeReturnValue.error);
        else
            return WP7Bridge.getReturnValue();
    }
};


// Native Return Value.
Object.defineProperty(WP7Bridge, "nativeReturnValue", {
    value: null,
    writable: true,
    enumerable: true,
    configurable: true
});


// Get Native Return Value.
WP7Bridge.getReturnValue = function () {
    try {
        // For some methods, the message is a JSON encoded string
        // and other times, it is just a string, the try/catch handles the
        // case where message was indeed, just a string.
        if (typeof WP7Bridge.nativeReturnValue === "undefined")
            return WP7Bridge.nativeReturnValue;

        // Date.
        if (typeof WP7Bridge.nativeReturnValue.result === "string" && WP7Bridge.nativeReturnValue.result.substr(0, 6) === "/Date(") {
            WP7Bridge.nativeReturnValue.result = new Date(parseInt(WP7Bridge.nativeReturnValue.result.replace(/\/+Date\(([\d+-]+)\)\/+/, '$1')));
        }
    }
    catch (ex) {
    }

    return WP7Bridge.nativeReturnValue.result;
};


// On Form Save.
WP7Bridge.onformsave = function () {
    if (typeof Mobile.Page.onformsave === "function") {
        var retVal = Mobile.Page.onformsave();
        if (retVal === false)
            WP7Bridge.callNative(['CancelSave']);
    }
};