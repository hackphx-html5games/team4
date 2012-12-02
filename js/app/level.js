var Level = function (game, levelData) {
  this.game = game;
  this.level = levelData.level;
  this.playerPosition = levelData.player;
  this.goalPosition = levelData.goal;
}

Level.prototype.draw = function () {
  var game = this.game;
  var i;
  var level = this.level;
  var playerPosition = this.playerPosition;
  var goalPosition = this.goalPosition;
  
  game.bodyDef.type = b2Body.b2_staticBody;
  game.fixDef.shape = new b2PolygonShape;
  
  function getX (x) {
    return x/1000 * game.canvasWidth;
  }
  function getY (y) {
    return y/1000 * game.canvasHeight;
  }
  
  game.bodyDef.type = b2Body.b2_staticBody;
  for (i=0; i<level.length; i++) {
    game.fixDef.shape.SetAsBox(getX(level[i].w), getY(level[i].h));
    game.bodyDef.position.Set(getX(level[i].x), getY(level[i].y));
    game.world.CreateBody(game.bodyDef).CreateFixture(game.fixDef);
  }
  
  //create some objects
  game.bodyDef.type = b2Body.b2_dynamicBody;
  var objects = [];
  window.objects = objects;
  for(var i = 0; i < 10; ++i) {
    objWidth = Math.round(game.canvasWidth*.1 * (Math.random() + 0.1));
    objHeight = Math.round(game.canvasWidth*.1 * (Math.random() + 0.1));
    
    //console.log("game.canvasWidth: "+game.canvasWidth);
    //console.log("objWidth: "+objWidth);
    //console.log("objHeight: "+objHeight);
    if(Math.random() > 0.5) {
      game.fixDef.shape = new b2PolygonShape;
      game.fixDef.shape.SetAsBox(
          objWidth/2 //half width
        , objHeight/2 //half height
      );
    } else {
      game.fixDef.shape = new b2CircleShape(
        objWidth/2 //radius
      );
      objHeight = objWidth;
    }
    game.bodyDef.position.x = Math.random() * game.canvasWidth;
    game.bodyDef.position.y = game.canvasHeight*.1 + Math.random() * game.canvasHeight*.4;
    bd = game.world.CreateBody(game.bodyDef);
    
    var img = new Image();
    var imgUrl;
    imgUrl = "http://placehold.it/"+(objWidth*game.STAGE_SCALE)+"x"+(objHeight*game.STAGE_SCALE);
    img.src = imgUrl;
    var data = {
      id: i,
      image: img,
      imgUrl: imgUrl,
      width: objWidth,
      height: objHeight,
      isPlayer: false
    };
    (function (data, img) {
      img.onload = function () {
        data.loaded = true;
      }
    })(data, img);
    
    bd.SetUserData(data);
    objects.push(bd);
    f = bd.CreateFixture(game.fixDef);
    f.SetUserData(data);
    f.SetRestitution(globalRestitution);
  }
}