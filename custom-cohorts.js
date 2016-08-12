$(".property_filters").css('position', 'relative')
$(".property_filters").append("<input id='cohort_name' class='input' type='text' value='Cohort Name' style='position: absolute;bottom: 10px; right: 300px; width=80px; text-align: right;'></input>")
$(".property_filters").append("<a id='add_cohort_people' class='button' style='position: absolute;bottom: 10px; right: 10px;'>Create Cohort</button>")
$(".property_filters").append("<a id='remove_cohort_people' class='button' style='position: absolute;bottom: 10px; right: 150px;'>Remove Cohort</button>")

// Add users to cohorts once the Create Cohort button is clicked
$("#add_cohort_people").click(function() {

    // Disable button while cohorts are created
    $("#add_cohort_people").html('Creating Cohort...');
    $("#add_cohort_people").attr("disabled", "disabled");

    // Create Mixpanel API objects
    var api = new mp.api.Base().init();
    var records = mp.report.explore.models.records;

    // Remove default 10,000 record limit
    delete records.params.limit;

    // Remove pages if records have already been loaded
    records.params.page = 0;

    // Add as_of_timestamp if we are doing an ETN query
    if(records.params.behaviors !== undefined) {
        records.params.as_of_timestamp = Math.floor(new Date().getTime()/1000 - new Date().getTimezoneOffset()*60);
    }

    var breakloop = false;
    var batchSize = 50;

    var results = [];
    var deferred = $.Deferred();

    var url = "https://api.mixpanel.com/engage/";

    var filterCol = function(col){
        return col.indexOf('msgCount_') === -1;
    };

    var recursiveEngageQuery = function () {

        if (breakloop) { // end condition
            deferred.resolveWith(this); // resolve deferred
            return;
        }

        api.config.base_url = 'https://' + mp.report.globals.api_secret + '@mixpanel.com/api/2.0/';
        records.params.output_properties = ["$distinct_id"];

        api.query('engage', records.params, function(response, request) {

        if (response.error) {
            console.log(response.error);
            return;
        }

        if (response.results.length == 0) {
            breakloop = true;
        }

        _.each(response.results, function(item) {
            results.push(item.$distinct_id);
        })

        //results.push.apply(results, response.results);
        records.params.page = records.params.page + 1;
        recursiveEngageQuery()

        }, records);

        return deferred.promise(); // return deferred to $.when
    };

    var processResults = function(){

        var batch = [];
        var requests = 0;

        for(i=0; i<results.length; i++) {
            var current_json = {};
            current_json.token = mp.report.globals.project_token;
            current_json.$distinct_id = results[i];
            current_json.$union = {};
            current_json.$union.Cohort = [document.getElementById('cohort_name').value];
            current_json.$ignore_time = true;
            current_json.$ignore_alias = true;
            current_json.$ip = 0;
            batch.push(current_json);
        };

        sendRequests(batch);
    };

    var sendRequests = function(batch) {

        if(batch.length > batchSize) {
            var current_batch = batch.splice(0,batchSize);
            var current_url = url + '?data=' + btoa(JSON.stringify(current_batch)) + '&api_key=' + mp.report.globals.api_key;
            $.get(current_url, function(done) {
                sendRequests(batch);
            });
        } else {
            var current_url = url + '?data=' + btoa(JSON.stringify(batch)) + '&api_key=' + mp.report.globals.api_key;
            $.get(current_url, function(done) {
                $("#add_cohort_people").removeAttr("disabled", "disabled");
                $("#add_cohort_people").html('Create Cohort');
            });
        }
    }

  $.when(recursiveEngageQuery()).done(processResults);
});

// Remove users from cohorts once the Remove Cohort button is clicked
$("#remove_cohort_people").click(function() {

    // Disable button while cohorts are created
    $("#remove_cohort_people").html('Removing Cohort...');
    $("#remove_cohort_people").attr("disabled", "disabled");

    // Create Mixpanel API objects
    var api = new mp.api.Base().init();
    var records = mp.report.explore.models.records;

    // Remove default 10,000 record limit
    delete records.params.limit;

    // Remove pages if records have already been loaded
    records.params.page = 0;

    // Add as_of_timestamp if we are doing an ETN query
    if(records.params.behaviors !== undefined) {
        records.params.as_of_timestamp = Math.floor(new Date().getTime()/1000 - new Date().getTimezoneOffset()*60);
    }

    var breakloop = false;
    var batchSize = 50;

    var results = [];
    var deferred = $.Deferred();

    var url = "https://api.mixpanel.com/engage/";

    var filterCol = function(col){
        return col.indexOf('msgCount_') === -1;
    };

    var recursiveEngageQuery = function () {

        if (breakloop) { // end condition
            deferred.resolveWith(this); // resolve deferred
            return;
        }

        api.config.base_url = 'https://' + mp.report.globals.api_secret + '@mixpanel.com/api/2.0/';
        records.params.output_properties = ["$distinct_id"];

        api.query('engage', records.params, function(response, request) {

        if (response.error) {
            console.log(response.error);
            return;
        }

        if (response.results.length == 0) {
            breakloop = true;
        }

        _.each(response.results, function(item) {
            results.push(item.$distinct_id);
        })

        records.params.page = records.params.page + 1;
        recursiveEngageQuery()

        }, records);

        return deferred.promise(); // return deferred to $.when
    };

    var processResults = function(){

        var batch = [];
        var requests = 0;
        
        for(i=0; i<results.length; i++) {
            var current_json = {};
            current_json.token = mp.report.globals.project_token;
            current_json.$distinct_id = results[i];
            current_json.$remove = {};
            current_json.$remove.Cohort = document.getElementById('cohort_name').value;
            current_json.$ignore_time = true;
            current_json.$ignore_alias = true;
            current_json.$ip = 0;
            batch.push(current_json);
        };

        sendRequests(batch);
    };

    var sendRequests = function(batch) {

        if(batch.length > batchSize) {
            var current_batch = batch.splice(0,batchSize);
            var current_url = url + '?data=' + btoa(JSON.stringify(current_batch)) + '&api_key=' + mp.report.globals.api_key;
            $.get(current_url, function(done) {
                sendRequests(batch);
            });
        } else {
            var current_url = url + '?data=' + btoa(JSON.stringify(batch)) + '&api_key=' + mp.report.globals.api_key;
            $.get(current_url, function(done) {
                $("#remove_cohort_people").removeAttr("disabled", "disabled");
                $("#remove_cohort_people").html('Remove Cohort');
            });
        }
    }

  $.when(recursiveEngageQuery()).done(processResults);
});
