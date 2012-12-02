var Game = function (el) {
  this.el = el;
  this.GRAVITY = 30;
  this.STAGE_SCALE = 10;
  this.currentLevel = 0;
  this.levels = [];
  this.globalRestitution = 0.2;
}


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
  
  game.gravityAngle = Math.PI/2;
  
  //create world and gravity
  game.gravity = new b2Vec2(0, game.GRAVITY);
  game.world = new b2World(
    game.gravity    //gravity
    ,  true                 //allow sleep
  );
  game.setGravityAngle(game.gravityAngle);
  
  var fixDef = new b2FixtureDef;
  fixDef.density = 10.0;
  fixDef.friction = 1.9;
  fixDef.restitution = game.globalRestitution;
  fixDef.shape = new b2PolygonShape;
  game.fixDef = fixDef;
  
  var bodyDef = new b2BodyDef;
  game.bodyDef = bodyDef;
  
  game.setupLevels();
  
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
    
    if (keyIsDown(Keys.W)) {
      game.setGravityAngle(-Math.PI/2);
      game.wakeAllBody();
    }
    if (keyIsDown(Keys.A)) {
      game.setGravityAngle(Math.PI);
      game.wakeAllBody();
    }
    if (keyIsDown(Keys.S)) {
      game.setGravityAngle(Math.PI/2);
      game.wakeAllBody();
    }
    if (keyIsDown(Keys.D)) {
      game.setGravityAngle(0);
      game.wakeAllBody();
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
   
  // Defines the direction of gravity

  function setGravity(direction) {
    var gravity = game.gravity;
    
    if (direction === "UP") {
      game.setGravityAngle(-Math.PI/2);
    }
    else if (direction === "DOWN") {
      game.setGravityAngle(Math.PI/2);
    }
    else if (direction === "LEFT") {
      game.setGravityAngle(Math.PI);
    }
    else if (direction === "RIGHT") {
      game.setGravityAngle(0);
    }
    game.wakeAllBody();
  }
  
  $("#gravityRight").click(function () {
     setGravity("RIGHT");
  });
  $("#gravityLeft").click(function () {
     setGravity("LEFT");
  });
  $("#gravityUp").click(function () {
     setGravity("UP");
  });
  $("#gravityDown").click(function () {
     setGravity("DOWN");
  });
  
  game.drawLevel();
  requestAnimFrame(update);
}


Game.prototype.setGravityAngle = function (r) {
  this.gravityAngle = r;
  this.gravity.x = Math.cos(r) * game.GRAVITY;
  this.gravity.y = Math.sin(r) * game.GRAVITY;
}
  
Game.prototype.wakeAllBody = function () {
  var game = this;
  
  for (b = game.world.GetBodyList(); b; b = b.GetNext()) {
    if (b.GetType() == b2Body.b2_dynamicBody) {
      b.SetAwake(true);
    }
  }
}

Game.prototype.setupLevels = function () {
  var game = this;
  
  var levelData = [
    {
      level: [
        {x: 0, y: 0, w: 1000, h: 10},
        {x: 0, y: 0, w: 10, h: 1000},
        {x: 1000, y: 0, w: 10, h: 1000},
        {x: 0, y: 1000, w: 1000, h: 10},
        {x: 0, y: 300, w: 800, h: 10},
        {x: 300, y: 600, w: 700, h: 10}
      ],
      player: {x: 100, y: 900},
      goal: {x: 900, y: 100}
    }, 
    {
      level: [
        {x: 0, y: 0, w: 1000, h: 10},
        {x: 0, y: 0, w: 10, h: 1000},
        {x: 1000, y: 0, w: 10, h: 1000},
        {x: 0, y: 1000, w: 1000, h: 10}
      ],
      player: {x: 100, y: 900},
      goal: {x: 900, y: 100}
    }
  ];
  
  for (var i=0; i<levelData.length; i++) {
    game.levels.push(new Level(game, levelData[i]));
  }
}

Game.prototype.drawLevel = function () {
  var game = this;
  
  game.currentLevel;
  for (var b = game.world.GetBodyList(); b; b = b.GetNext()) {
    game.world.DestroyBody(b);
  }
  
  game.levels[game.currentLevel].draw();
  
  game.player.create();
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
  BACKSPACE: 8,
  W: 87,
  A: 65,
  S: 83,
  D: 68
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
