SSS = window.SSS || {};
SSS.Entity = VIE.prototype.Entity.extend({
    // --- SAVE ENTITIES TO SERVER ---//
    sync : function(method,model, options) {
        console.debug("sync entity: " + method);
        console.debug(options);
        console.debug(model);
        var type = model.get('@type');

        var typename = model.vie.namespaces.curie(type.id);
        switch(method) {
            case 'create':
                this.vie.save({
                    'connector' : typename + "Create",
                    'entity': model
                }).to('sss').execute().success(function(savedEntity){
                    console.debug("entity created");
                    console.debug(savedEntity);
                    model.set('@subject', savedEntity['uri'], {'silent':true});
                });
                break;
            case 'read':
                this.vie.load({
                    'connector' : 'ResourceGet',
                    'resource' : model.getSubject()
                }).from('sss').execute().success(function(readEntity){
                    console.debug("entity was read");
                    console.debug(readEntity);
                    model.set(readEntity)
                })
                break;
            case 'update':
                this.vie.save({
                    'connector' : typename + "Update",
                    'entity': model
                }).to('sss').execute().success(function(savedEntity){
                    console.debug("entity updated");
                    console.debug(savedEntity);
                });
                break;
            case 'delete':
                this.vie.save({
                    'connector' : typename + "Remove",
                    'entity': model
                }).from('sss').execute().success(function(savedEntity){
                    console.debug("entity removed");
                    console.debug(savedEntity);
                });
                break;
        }
    }

});