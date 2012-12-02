var Game = function (el) {
  this.el = el;
  this.GRAVITY = 30;
  this.STAGE_SCALE = 10;
}


var globalRestitution = 0.2;
var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint, movementJoint;

Game.prototype.setup = function () {
  var game = this;
  
  game.player = new Player(game);
  
  game.canvasWidth = window.innerWidth - 10;
  game.canvasHeight = window.innerHeight - 10;
  //console.log("window.innerWidth - 10: "+String(window.innerWidth - 10));
  game.canvas = document.getElementById(game.el);
  game.context = game.canvas.getContext("2d");
  
  game.canvas.style.width = (game.canvasWidth+1) + "px";
  game.canvas.style.height = (game.canvasHeight+1) + "px";
    
  game.canvas.setAttribute("width", game.canvasWidth+1);
  game.canvas.setAttribute("height", game.canvasHeight+1);
  
  game.canvasWidth /= game.STAGE_SCALE;
  game.canvasHeight /= game.STAGE_SCALE;
  //console.log("game.canvasWidth: "+game.canvasWidth);
  
  //create world and gravity
  game.gravity = new b2Vec2(0, game.GRAVITY);
  game.world = new b2World(
    game.gravity    //gravity
    ,  true                 //allow sleep
  );
  
  var fixDef = new b2FixtureDef;
  fixDef.density = 10.0;
  fixDef.friction = 1.9;
  fixDef.restitution = globalRestitution;
    
  var bodyDef = new b2BodyDef;
    
  //create ground
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(game.canvasWidth, game.canvasHeight*.01);
  bodyDef.position.Set(game.canvasWidth*.01, game.canvasHeight);
  game.world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(game.canvasWidth, game.canvasHeight*.01);
  game.world.CreateBody(bodyDef).CreateFixture(fixDef);
  fixDef.shape.SetAsBox(game.canvasWidth*.01, game.canvasHeight);
  bodyDef.position.Set(game.canvasWidth*.01, game.canvasHeight);
  game.world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(game.canvasWidth, game.canvasHeight);
  game.world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  //create some objects
  bodyDef.type = b2Body.b2_dynamicBody;
  var objects = [];
  window.objects = objects;
  for(var i = 0; i < 10; ++i) {
    objWidth = Math.round(game.canvasWidth*.1 * (Math.random() + 0.1));
    objHeight = Math.round(game.canvasWidth*.1 * (Math.random() + 0.1));
    
    //console.log("game.canvasWidth: "+game.canvasWidth);
    //console.log("objWidth: "+objWidth);
    //console.log("objHeight: "+objHeight);
    if(Math.random() > 0.5) {
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(
          objWidth/2 //half width
        , objHeight/2 //half height
      );
    } else {
      fixDef.shape = new b2CircleShape(
        objWidth/2 //radius
      );
      objHeight = objWidth;
    }
    bodyDef.position.x = Math.random() * game.canvasWidth;
    bodyDef.position.y = game.canvasHeight*.1 + Math.random() * game.canvasHeight*.4;
    bd = game.world.CreateBody(bodyDef);
    
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
    f = bd.CreateFixture(fixDef);
    f.SetUserData(data);
    f.SetRestitution(globalRestitution);
  }
  
  game.player.create(bodyDef, fixDef);
  
  //setup debug draw
  var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(game.context);
	debugDraw.SetDrawScale(game.STAGE_SCALE);
	debugDraw.SetFillAlpha(0.5);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	game.world.SetDebugDraw(debugDraw);
  
  game.canvasPosition = getElementPosition(game.canvas);
  
  document.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    handleMouseMove(e);
    document.addEventListener("mousemove", handleMouseMove, true);
  }, true);
         
  document.addEventListener("mouseup", function() {
    document.removeEventListener("mousemove", handleMouseMove, true);
    isMouseDown = false;
    mouseX = undefined;
    mouseY = undefined;
  }, true);
  
  
  
  
  
  
  
  function handleMouseMove(e) {
    mouseX = (e.clientX - game.canvasPosition.x) / game.STAGE_SCALE;
    mouseY = (e.clientY - game.canvasPosition.y) / game.STAGE_SCALE;
  };
  
  function getBodyAtMouse() {
    mousePVec = new b2Vec2(mouseX, mouseY);
    var aabb = new b2AABB();
    aabb.lowerBound.Set(mouseX - 0.01, mouseY - 0.01);
    aabb.upperBound.Set(mouseX + 0.01, mouseY + 0.01);
    
    // Query the world for overlapping shapes.
    
    selectedBody = null;
    game.world.QueryAABB(getBodyCB, aabb);
    return selectedBody;
  }
  
  function getBodyCB(fixture) {
    if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
        selectedBody = fixture.GetBody();
        return false;
      }
    }
    return true;
  }
    
  function update() {
    //game.player.process();
    
    if (movementJoint) {
      game.world.DestroyJoint(movementJoint);
      movementJoint = null;
    }
    
    if (keyIsDown(Keys.LEFT)) {
      game.player.move("left");
    } else
    if (keyIsDown(Keys.RIGHT)) {
      game.player.move("right");
    } else {
      if (movementJoint) {
        game.world.DestroyJoint(movementJoint);
        movementJoint = null;
      }
    }
      
    if(isMouseDown && (!mouseJoint)) {
      var body = getBodyAtMouse();
      if(body) {
        var md = new b2MouseJointDef();
        md.bodyA = game.world.GetGroundBody();
        md.bodyB = body;
        md.target.Set(mouseX, mouseY);
        md.collideConnected = true;
        md.maxForce = 500.0 * body.GetMass();
        mouseJoint = game.world.CreateJoint(md);
        body.SetAwake(true);
      }
    }
      
    if (mouseJoint) {
      if (isMouseDown) {
        mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
      } else {
        game.world.DestroyJoint(mouseJoint);
        mouseJoint = null;
      }
    }
    
    game.world.Step(1 / 60, 10, 10);
    game.world.DrawDebugData();
    game.world.ClearForces();
    
    //context.clearRect(0, 0, game.canvasWidth*game.STAGE_SCALE+1, game.canvasHeight*game.STAGE_SCALE+1);
    for (b = game.world.GetBodyList(); b; b = b.GetNext()) {
      if (b.GetType() == b2Body.b2_dynamicBody) {
        var pos = b.GetPosition();
        
        /** /
        if (pos.x < -2 || pos.x > width) {
            
          b.SetLinearVelocity(new b2Vec2(0, 0));
          b.SetAngularVelocity(0);
            
          b.SetPositionAndAngle(new b2Vec2(38, 0), 0);

        }
        /**/
        
        var data = b.GetUserData();
        if (data && data.image) {
          game.context.save();
          game.context.translate(pos.x*game.STAGE_SCALE, pos.y*game.STAGE_SCALE);
          game.context.rotate(b.GetAngle());
          game.context.drawImage(data.image, -data.width*game.STAGE_SCALE/2, -data.height*game.STAGE_SCALE/2, data.width*game.STAGE_SCALE, data.height*game.STAGE_SCALE);
          game.context.restore();
        }
      }
    }
    game.player.render();
    
    requestAnimFrame(update);
  };
  
  //helpers
   
  function wakeAllBody() {
    for (b = game.world.GetBodyList() ; b; b = b.GetNext()) {
      if (b.GetType() == b2Body.b2_dynamicBody) {
        b.SetAwake(true);
      }
    }
  }
  // Defines the direction of gravity

  function setGravity(direction) {
      var gravity = game.gravity;

      if (direction === "UP") {
      gravity.y = -game.GRAVITY;
      gravity.x = 0;
    }
    else if (direction === "DOWN") {
      gravity.y = game.GRAVITY;
      gravity.x = 0;
    }
    else if (direction === "LEFT") {
      gravity.x = -game.GRAVITY;
      gravity.y = 0;
    }
    else if (direction === "RIGHT") {
      gravity.x = game.GRAVITY;
      gravity.y = 0;
    }
  }
  
  $("#gravityRight").click(function () {
     wakeAllBody();
     setGravity("RIGHT");
  });
  $("#gravityLeft").click(function () {
     wakeAllBody();
     setGravity("LEFT");
  });
  $("#gravityUp").click(function () {
     wakeAllBody();
     setGravity("UP");
  });
  $("#gravityDown").click(function () {
     wakeAllBody();
     setGravity("DOWN");
  });
  
  requestAnimFrame(update);
}










// $(document).bind("keydown", function (event) { console.log(event.keyCode); });
var Keys = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  SPACE: 32,
  ENTER: 13,
  COMMAND: 91,
  CONTROL: 17,
  SHIFT: 16,
  OPTION: 18,
  BACKSPACE: 8
};

var keysDown = {};
var captureKeys = {};
function onKeyDown (event) {
  keysDown[event.keyCode] = true;
  if (captureKeys.hasOwnProperty(event.keyCode) && captureKeys[event.keyCode] == true) {
    event.preventDefault();
    return false;
  }
}
function onKeyUp (event) {
  keysDown[event.keyCode] = false;
  if (captureKeys.hasOwnProperty(event.keyCode) && captureKeys[event.keyCode] == true) {
    event.preventDefault();
    return false;
  }
}
function captureKey (keyCode) {
  captureKeys[keyCode] = true;
}
function keyIsDown (keyCode) {
  return keysDown.hasOwnProperty(keyCode) && keysDown[keyCode] == true;
}
$(document).bind("keydown", onKeyDown);
$(document).bind("keyup", onKeyUp);

captureKey(Keys.UP);
captureKey(Keys.DOWN);
captureKey(Keys.LEFT);
captureKey(Keys.RIGHT);
captureKey(Keys.BACKSPACE);
