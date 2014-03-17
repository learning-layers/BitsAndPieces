ORGANIZE = window.ORGANIZE || {};
ORGANIZE.Entity = VIE.prototype.Entity.extend({
    // --- SAVE ENTITIES TO SERVER ---//
    sync : function(method,model, options) {
        console.debug("sync organizeThing: " + method);
        console.debug("options",options);
        console.debug("model",model);
        var type = model.get('@type');

        var typename = model.vie.namespaces.curie(type.id);
        switch(method) {
            case 'create':
                // do nothing
                // create is handled by VersionCollection
                // MAY LEAD TO INCONSISTENCY
                break;
            case 'read':
                // not available
                // circles and entities are fetched by Version
                break;
            case 'update':
                this.vie.save({
                    'connector' : "LearnEpVersionUpdate" + typename,
                    'entity': model
                }).to('sss').execute().success(function(savedEntity){
                    console.debug("entity updated");
                    console.debug("savedEntity",savedEntity);
                });
                break;
            case 'delete':
                this.vie.save({
                    'connector' : "LearnEpVersionRemove" + typename,
                    'entity': model
                }).from('sss').execute().success(function(savedEntity){
                    console.debug("entity removed");
                    console.debug("savedEntity",savedEntity);
                });
                break;
        }
    }

});
