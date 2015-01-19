define(['logger', 'voc', 'underscore', 'jquery', 'data/Data' ], function(Logger, Voc, _, $, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize MessageData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
    };
    m.LOG = Logger.get('MessageData');
    /**
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.MESSAGE)){
            this.checkIntegrity(model, options);
            // TODO Not sure about this one
            if ( model.has(Voc.belongsToUser) ) {
                this.initUser(model);
            }
            // TODO Not sure about this one
            model.on('change:'+this.vie.namespaces.uri(Voc.belongsToUser), this.initUser, this);
        }
    };
    m.initUser = function(model, value, options) {
        var user = model.get(Voc.belongsToUser);
        if( user.isEntity ) {
            user.fetch();
        }
    };
    m.sendMessage = function(forUser, message) {
        var that = this,
            defer = $.Deferred();
        this.LOG.debug('sendMessage', forUser, message);
        this.vie.onUrisReady(
            function() {
                that.vie.save({
                    'service' : 'messageSend',
                    'data' : {
                        'forUser' : forUser,
                        'message' : message
                    }
                }).to('sss').execute().success(function(s){
                    that.LOG.debug('success messageSent', s);
                    defer.resolve(s);
                }).fail(function(f){
                    that.LOG.debug('error messageSent', f);
                    defer.reject(f);
                });
            }
        );
        return defer.promise();
    };
    m.getMessages = function(includeRead) {
        var that = this,
            defer = $.Deferred();
        this.vie.load({
            'service' : 'messagesGet',
            'data' : {
                'includeRead' : includeRead
            }
        }).using('sss').execute().success(function(messages) {
            that.LOG.debug('success messagesGet', messages);
            messages = that.vie.entities.addOrUpdate(messages);
            defer.resolve(messages);
        }).fail(function(f) {
            that.LOG.debug('error messagesGet', f);
            defer.reject(f);
        });

        return defer.promise();
    };
    m.markAsRead = function(model) {
        var that = this,
            defer = $.Deferred();
        this.vie.load({
            'service' : 'entityUpdate',
            'data' : {
                'entity' : model.getSubject(),
                'read' : true
            }
        }).using('sss').execute().success(function(data) {
            that.LOG.debug('success markAsRead', data);
            model.set(Voc.isRead, true);
            defer.resolve(data);
        }).fail(function(f) {
            that.LOG.debug('error markAsRead', f);
            defer.reject(f);
        });

        return defer.promise();
    };
    return m;

});
