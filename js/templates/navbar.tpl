<nav class="navbar navbar-default navbar-fixed-top" role="navigation">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <p class="navbar-brand"><img src="img/logo48.png" width="24" height="24" alt="Learning Layers"/> Bits And Pieces</p>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown">Menu <span class="caret"></span></a>
          <ul class="dropdown-menu bnp-scrollable-menu" role="menu">
            <li><a href="#" id="createBlank">Create New Episode</a></li>
            <li><a href="#" id="createPlaceholder">Create New Placeholder / Quick Note</a></li>
            <li><a href="#" id="createBit">Create Bit (Upload File)</a></li>
            <li><a href="#" id="createLink">Create Link</a></li>
            <li class="divider"></li>
            <li><a href="#" id="logout"><i class="fa fa-sign-out"></i> Logout</a></li>
            <li class="divider"></li>
          </ul>
        </li>
      </ul>
      <p class="navbar-text currentEpisodeLabel"></p>
      <p class="navbar-text">
          |
          <span class="currentEpisodeVisibility"></span>
          <span class="currentEpisodeAuthor"></span>
          <span class="currentEpisodeSharedWith"></span>
          |
      </p>

      <% if ( discussionToolUrl ) { %>
      <button type="button" class="btn btn-default navbar-btn discussionToolButton" title="Open Discussion Tool">
          <i class="fa fa-comments"></i>
          <span class="count"></span>
      </button>
      <% } %>

      <p class="navbar-text navbar-right">
        <% if ( affectUrl ) { %>
          <a href="<%= affectUrl %>" title="Affect" target="_blank" class="navbar-link affectButton"><i class="fa fa-heart text-danger"></i></a>
        <% } %>

        <i class="fa fa-user"></i> <span class="currentUserLabel"><%= userLabel %></span>
        <a href="<%= helpUrl %>" class="navbar-link helpButton" target="_blank">
            <i class="fa fa-question-circle"></i>
        </a>
      </p>
    </div><!-- /.navbar-collapse -->
  </div><!-- /.container-fluid -->
</nav>
