define(['logger', 'voc', 'underscore', 'data/Data'], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize CollectionData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasEntry, Voc.THING, Voc.belongsToCollection);
    };
    m.LOG = Logger.get('CollectionData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.COLLECTION)){
            this.checkIntegrity(model, options);
            if( !model.isNew() ) {
                this.fetchContents(model);
            } else {
                this.LOG.debug("new collection added", model);
            }
        }
    };
    m.fetchContents= function(collection) {
        var that = this;
        this.LOG.debug("fetching contents for ", collection);
        this.vie.load({
            'service' : 'collWithEntries',
            'data' : {
                'coll' : collection.getSubject(),
            }
        }).from('sss').execute().success(
            function(collectionWithEntries) {
                that.LOG.debug("success fetchContents");
                that.LOG.debug("entities", collectionWithEntries);
                that.addCollectionWithEntries(collectionWithEntries);
            }
        );

    };
    m.addCollectionWithEntries= function(collectionWithEntries) {
        var entryUris = [],
            that = this;
        _.each(collectionWithEntries[Voc.hasEntry], function(entry) {
            entryUris.push(entry[that.vie.Entity.prototype.idAttribute]);
        });
        that.vie.entities.addOrUpdate(collectionWithEntries[Voc.hasEntry]);
        collectionWithEntries[Voc.hasEntry] = entryUris;
        that.vie.entities.addOrUpdate(collectionWithEntries);
    };
    return m;
});
