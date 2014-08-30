define(['logger', 'underscore', 'jquery', 'backbone', 'view/sss/UserView', 'view/sss/EntityView', 'view/sss/CollectionView', 'voc'], 
    function(Logger, _, $, Backbone, UserView, EntityView, CollectionView, Voc){
    return Backbone.View.extend({
        LOG: Logger.get('CollectionBrowser'),
        currentColl : null, 
        user : null,
        breadcrumbs : [],
        events: {
            'bnp:dblclickEntity' : 'open',
            'click span.breadcrumb' : 'switchBreadcrumb'
        },
        initialize: function() {
            this.LOG.debug("initialize CollBrowser");
            var that = this;
            this.breadcrumbs = [];

            this.user = this.model.get(Voc.belongsToUser);
            this.currentColl = this.user.get(Voc.hasRootCollection);
            if( !this.currentColl ) {
                this.user.on('change:' + this.user.vie.namespaces.uri(Voc.hasRootCollection), function(model) {
                    that.setCurrentColl(model.get(Voc.hasRootCollection));
                } );
            } else {
                this.currentColl.on('change', this.render, this);
            }
        },
        setCurrentColl : function(coll) {
            this.LOG.debug('setCurrentColl', coll);
            var i = _.indexOf(this.breadcrumbs, coll);
            if( i !== -1 ) {
                if( i > 0 ) {
                    this.breadcrumbs = _.first(this.breadcrumbs, i);
                } else {
                    this.breadcrumbs = [];
                }
            } else {
                if( this.currentColl ) {
                    this.breadcrumbs.push(this.currentColl);
                }
            }
            if( this.currentColl ) {
                this.currentColl.off('change', this.render, this);
            }
            this.currentColl = coll;
            this.currentColl.on('change', this.render, this);
            this.render();
        },
        render: function() {
            if( !this.currentColl) return;
            var that = this;
            this.$el.empty();
            this.LOG.debug('render', this.currentColl );
            if( !this.currentColl.isof(Voc.COLLECTION) ) {
                // show loading indicator?
                this.currentColl.once('change', this.render, this);
                return;
            }
            this.renderBreadcrumbs();
            var entries = this.currentColl.get(Voc.hasEntry) || [];
            if( !_.isArray(entries) ) entries = [entries];
            this.LOG.debug('entries', entries);
            _.each(entries, function(entry) {
                var viewType = entry.isof(Voc.COLLECTION) ? CollectionView : EntityView;
                that.$el.append(new viewType({
                    'model' : entry
                }).render().$el);
            });
        },
        renderBreadcrumbs: function() {
            var bc = $("<div class=\"breadcrumbs\"></div>");
            _.each(this.breadcrumbs, function(b) {
                bc.append("<span class=\"breadcrumb\" about=\""+b.getSubject()+"\">"+b.get(Voc.label)+"</span>&nbsp;");
            });
            bc.append("<span class=\"breadcrumb\" about=\""+this.currentColl.getSubject()+"\">"+this.currentColl.get(Voc.label)+"</span>");
            this.$el.prepend(bc);
        },
        getCollData : function() {
            return this.currentColl;
        },
        open : function(e) {
            this.setCurrentColl(e.entity);
        },
        switchBreadcrumb : function(e) {
            var coll = $(e.currentTarget).attr('about');
            this.LOG.debug('coll', coll, this.breadcrumbs);
            coll = _.find(this.breadcrumbs, function(bc) {
                return bc.getSubject() === coll;
            });
            this.LOG.debug('coll', coll);
            this.setCurrentColl(coll);
        }
    });
});
