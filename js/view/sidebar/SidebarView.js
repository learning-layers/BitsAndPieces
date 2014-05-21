define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'view/sidebar/BitSidebarView',
        'text!templates/sidebar/sidebar.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitSidebarView, Template){
    return Backbone.View.extend({
        subViews: {},
        tabMap : {
            'notification' : 0,
            'search' : 1,
            'bit' : 2,
            'episode' : 3
        },
        events: {
            'click .show-hide': 'showHide'
        },
        LOG: Logger.get('SidebarView'),
        initialize: function() {
        },
        showBit: function(entity) {
            this.subViews['bit'].setEntity(entity);
            this.$el.find('#tabs').tabs("option", "active", this.tabMap['bit']);
            if( this.isHidden() ) this.showHide();
        },
        render: function() {
            var tabs = _.template(Template, {});
            this.$el.html(tabs);
            this.$el.find('#tabs').tabs();
            this.subViews['bit'] = new BitSidebarView({
                el : this.getTabId('bit')
            });
            this.subViews['bit'].render();
        },
        showHide: function(e) {
            // XXX: rewrite the whole thing
            var width = this.$el.outerWidth();
            if (this.isHidden()) {
                width = 250;
            } else {
                width = 10;
            }
            this.$el.animate({ width: width }, 500);
        },
        isHidden: function() {
            var width = this.$el.outerWidth();
            return width < 250;
        },
        getTabId: function(key) {
            return '#tab-' + this.tabMap[key];
        }
    });
});
