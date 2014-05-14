Bits and Pieces
===============

Bits and Pieces is a user interface framework for sensemaking based on a design idea introduced in the strand of the EU project [Learning Layers](http://learning-layers.eu/). In its current implementation it comes with a timeline and an organizing widget. You can use the timeline to review your collection of bits and pieces (eg. notes) and drag and drop them from there to the organize widget in the lower part of the application. The bits and pieces are retrieved from the [Social Semantic Server](https://github.com/learning-layers/SocialSemanticServer).

Getting it to run
-----------------

You may also want to have an instance of the [Social Semantic Server](https://github.com/learning-layers/SocialSemanticServer) running. Once you have it you need to adapt the `sss_url` variable in `js/main.js` to match your installation location.

If you don't want to install SSS and just want test Bits and Pieces quickly you can activate the mockup data contained by uncommenting the respective lines in the `paths` configuration object of `js/main.js`. Nevertheless, you need to download the SSS client-side library from [Social Semantic Server Client Side](https://github.com/learning-layers/SocialSemanticServerClientSide) and install it somewhere in your local environment. Please adapt `sss_url` in `js/main.js` respectively.

Now open a web browser (Firefox or Chrome are recommended) and head to the root of the location where you checked out Bits and Pieces and append a questionmark and the username on SSS, for instance `localhost/BitsAndPieces/?peter`. If you decided to use the mockup data, use `peter` as this is a valid mockup user.

