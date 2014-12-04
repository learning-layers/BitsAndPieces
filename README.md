Bits and Pieces
===============

Bits and Pieces is a user interface framework for sensemaking based on a design idea introduced in the strand of the EU project [Learning Layers](http://learning-layers.eu/). In its current implementation it comes with a timeline and an organizing widget. You can use the timeline to review your collection of bits and pieces (eg. notes) and drag and drop them from there to the organize widget in the lower part of the application. The bits and pieces are retrieved from the [Social Semantic Server](https://github.com/learning-layers/SocialSemanticServer).


Getting it to run
-----------------

You would need to have an instance of the [Social Semantic Server](https://github.com/learning-layers/SocialSemanticServer) running. In order to be able to use the Service API one would need to deploy the Social Semantic Server REST Adapter onto the server, [Apache Tomcat](http://tomcat.apache.org/) is assumed by the installation instructions. After having all of the required components running you need to adapt the `sssHostREST` variable in `js/main.js` to match your installation location.

It is also possible to setup authentication with [OpenID Connect](http://openid.net/connect/), provided that [SocialSemanticServer](https://github.com/learning-layers/SocialSemanticServer) is configured accordingly. Layers [OpenID Connect Instance](https://api.learning-layers.eu/o/oauth2/) could be used for that purpose. Please go to `js/main.js` and fill in the `oidcAuthorizationUrl` and `oidcClientID` with appropriate values. This should disable normal authentication, only one authentication scheme could be used at the same time. In case one is using Layers Infrastructure the `oidcAuthorizationUrl` should be https://api.learning-layers.eu/o/oauth2/authorize

Now open a web browser (Firefox or Chrome are recommended) and head to the root of the location where you checked out Bits and Pieces. Log in with your user credentials to start using the application, for instance `localhost/BitsAndPieces/`.

If you have not created any Learning Episodes yet, please use the menu on the top left to create at least one. Click the icon and press button `Create new Episode from scratch`. After the first episode has been created, a Timeline and Organize canvas should appear.

Service version requirements
----------------------------

* SocialSemanticServer: v7.0.3-alpha

