<div class="modal fade" id="linkAddModal" tabindex="-1" role="dialog" aria-labelledby="linkAddModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="linkAddModalLabel">Add New Link</h4>
            </div>
            <div class="modal-body">
                <div class="localMessages">
                </div>
                <form role="form">
                    <div class="form-group">
                        <label for="linkUri">URL:</label>
                        <input type="url" class="form-control" id="linkUri" value="" />
                    </div>

                    <div class="form-group">
                        <label for="linkLabel">Label:</label>
                        <input type="text" class="form-control" id="linkLabel" value="" />
                    </div>
                    
                    <div class="form-group">
                        <label for="linkDescription">Description:</label>
                        <textarea class="form-control" rows="<%= rows %>" id="linkDescription"></textarea>
                        <p class="help-block">Allows input of up to <%= descriptionMaxLength %> characters. </p>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create</button>
            </div>
        </div>
    </div>
</div>
