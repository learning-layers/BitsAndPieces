SSS = window.SSS || {};
SSS.UserEventView = SSS.EntityView.extend({
    LOG: Logger.get('UserEventView'),
    type: "",
    initialize: function() {
        //this.template = _.template("<span><%= sss:name %></span>");
        this.listenTo(this.model, 'change', this.changeEntity);
        this.type = this.model.get('@type');
        this.LOG.debug("type of usereventview entity: " + this.type.id)
        this.resource = this.model.get('sss:resource');
        this.LOG.debug("this.resource", this.resource);
        this.resource.fetch(); // fetching here correct?
        this.resView = new SSS.EntityView({model:this.resource});
        this.resource.on('change', this.render, this);
    },
    changeEntity: function(model, options) {
        if( this.model !== model ) return;
        this.LOG.debug("model changeEntity");
        this.render();
    },
    render: function() {
        this.$el.attr({
          'class' : 'entity',
          'resource' : this.model.getSubject()
        });
        var label = this.resource.get('sss:label');
        if( label && label.isEntity ) label = label.getSubject();
        var content = this.resource.get('sss:content');
        if( content ){
            if( content.isEntity ) content = content.getSubject();
            var l = content.length;
            var s = 30;
            content = content.substring(0, l>s? s : l) + (l>s ? "..." : "");
        } else content = "";
        this.$el.html(//"<div class=\"entity\" resource=\""+this.model.getSubject()+"\">"+
                "<div class=\"labelable\">"+
                "<img class=\"icon\" src=\""+this.getIcon()+"\" "+ 
                "alt=\"" + this.type + "\"/>"+
                (label ? 
                    "<label class=\"withlabel\">" +
                    "<strong>"+label+"</strong><br/>"+content:"<label class=\"nolabel\">no label")+
                    "</label>"+
                "</div>");
        this.draggable();
        return this;
    }
});
