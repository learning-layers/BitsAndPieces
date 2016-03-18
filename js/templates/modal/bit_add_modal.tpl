<div class="modal fade" id="bitAddModal" tabindex="-1" role="dialog" aria-labelledby="bitAddModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="bitAddModalLabel">Add New Bit</h4>
            </div>
            <div class="modal-body">
                <div class="localMessages">
                </div>
                <form role="form">
                    <div class="form-group">
                        <label for="bitLabel">Label:</label>
                        <input type="text" class="form-control" id="bitLabel" value="" />
                    </div>
                    
                    <div class="form-group">
                        <label for="bitDescription">Description:</label>
                        <textarea class="form-control" rows="<%= rows %>" id="bitDescription"></textarea>
                        <p class="help-block">Allows input of up to <%= descriptionMaxLength %> characters. </p>
                    </div>

                    <div class="form-group">
                        <label for="bitFile">File:</label>
                        <input type="file" id="bitFile" />
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">
                    <i class="fa fa-spinner fa-spin" style="display:none;"></i>
                    Create
                </button>
            </div>
        </div>
    </div>
</div>
