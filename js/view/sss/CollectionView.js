define(['view/sss/EntityView', 'logger', 'voc', 'underscore', 'jquery'], function(EntityView, Logger, Voc, _, $){
    return EntityView.extend({
        LOG: Logger.get('CollectionView'),
        type: "",
        initialize: function() {
            this.LOG.debug("init CollectionView");
            this.listenTo(this.model, 'change', this.changeEntity);
        },
        changeEntity: function(model, options) {
            if( this.model !== model ) return;
            this.LOG.debug("model changeEntity");
            this.render();
        },
        getIcon : function() {
            return "img/sss/collection.png";
        },
        defer : function() {
            // do nothing, just overwrite EntityView's defer
        }
    });
});

