EP = window.EP || {};
EP.VersionModel = VIE.prototype.Entity.extend({
    LOG : Logger.get('VersionModel'),
    initialize: function(attributes, options ) {
        this.LOG.debug("initialize Version");
        if( !options) options = {};
        this.LOG.debug("options",options);
        this.LOG.debug("attributes",attributes);
        // kind of super constructor:
        VIE.prototype.Entity.prototype.initialize.call(this, attributes, options );
        this.set('@type', 'sss:Version');
        this.widgetCollection = options.widgetCollection || 
            new this.vie.Collection([], {
                'vie':this.vie,
                'predicate': this.vie.namespaces.uri('sss:Widget')
            });
        this.isVersion = true;
    }, 
    fetchWidgets: function(data) {
        if( !data ) data = {};
        if( !data.data ) data.data = {};
        data.data.version = this.getSubject();
        this.widgetCollection.fetch(data);
    },
    createWidget: function(object) {
        object.set('version', this.getSubject());
        this.LOG.debug("createWidget", this,object, this.widgetCollection);
        this.widgetCollection.create(object, {'wait': true});
    },
    clone: function() {
        var newAttr = _.clone(this.attributes);
        delete newAttr['@subject'];
        var newVersion = new EP.VersionModel(newAttr, {
            'widgetCollection' : new this.vie.Collection([], {
                'vie':this.vie,
                'predicate': this.widgetCollection.predicate
            })
        });
        
        return newVersion;
    }

});