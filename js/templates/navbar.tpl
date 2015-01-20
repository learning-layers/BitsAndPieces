<nav class="navbar navbar-default" role="navigation">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="#"><img src="img/logo48.png" width="24" height="24" alt="Learning Layers"/> Bits And Pieces</a>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown">Menu <span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#" id="createBlank">Create New Episode</a></li>
            <li><a href="#" id="logout">Logout</a></li>
            <li class="divider"></li>
          </ul>
        </li>
      </ul>
      <p class="navbar-text currentEpisodeLabel"></p>
      <p class="navbar-text">
          | <span class="currentEpisodeVisibility"></span>
          | <span class="currentEpisodeSharedWith"></span>
      </p>
      <p class="navbar-text navbar-right currentUserLabel"><span class="glyphicon glyphicon-user"></span> <span class="userLabel"><%= userLabel %></span></p>
    </div><!-- /.navbar-collapse -->
  </div><!-- /.container-fluid -->
</nav>
