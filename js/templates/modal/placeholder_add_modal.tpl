<div class="modal fade" id="placeholderAddModal" tabindex="-1" role="dialog" aria-labelledby="placeholderAddModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="placeholderAddModalLabel">Add New Placeholder</h4>
            </div>
            <div class="modal-body">
                <div class="localMessages">
                </div>
                <form role="form">
                    <div class="form-group">
                        <label for="placeholderLabel">Label:</label>
                        <input type="text" class="form-control" id="placeholderLabel" value="" />
                    </div>
                    
                    <div class="form-group">
                        <label for="placeholderDescription">Description:</label>
                        <textarea class="form-control" rows="<%= rows %>" id="placeholderDescription"></textarea>
                        <p class="help-block">Allows input of up to <%= descriptionMaxLength %> characters. </p>
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
