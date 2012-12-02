var Game = function (el) {
  var game = this;
  
  game.el = el;
  game.GRAVITY = 100;
  game.STAGE_SCALE = 10;
  game.currentLevel = 0;
  game.levels = [];
  game.globalRestitution = 0.2;
  game.mouseX = 0;
  game.mouseY = 0;
  game.mousePVec = null;
  game.isMouseDown = null;
  game.selectedBody = null;
  game.mouseJoint = null;
}

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
  fixDef.friction = 0.9;
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
  
  function onMouseMove (e) {
    game.onMouseMove(e);
  }
  document.addEventListener("mousedown", function(e) {
    game.isMouseDown = true;
    game.onMouseMove(e);
    document.addEventListener("mousemove", onMouseMove, true);
  }, true);
         
  document.addEventListener("mouseup", function() {
    document.removeEventListener("mousemove", onMouseMove, true);
    game.isMouseDown = false;
    game.mouseX = null;
    game.mouseY = null;
  }, true);
  
  $("#gravityRight").click(function () {
     game.setGravity("RIGHT");
  });
  $("#gravityLeft").click(function () {
     game.setGravity("LEFT");
  });
  $("#gravityUp").click(function () {
     game.setGravity("UP");
  });
  $("#gravityDown").click(function () {
     game.setGravity("DOWN");
  });
  
  $(document).bind("keydown"+Keys.W, function () {
    game.setGravityAngle(-Math.PI/2);
    game.wakeAllBody();
  });
  $(document).bind("keydown"+Keys.A, function () {
    game.setGravityAngle(Math.PI);
    game.wakeAllBody();
  });
  $(document).bind("keydown"+Keys.S, function () {
    game.setGravityAngle(Math.PI/2);
    game.wakeAllBody();
  });
  $(document).bind("keydown"+Keys.D, function () {
    game.setGravityAngle(0);
    game.wakeAllBody();
  });
  
  game.drawLevel();
  requestAnimFrame(function () { game.update(); });
}

Game.prototype.update = function () {
  var game = this;
  //game.player.process();
  
  if (keyIsDown(Keys.LEFT)) {
    game.player.move("left");
  } else
  if (keyIsDown(Keys.RIGHT)) {
    game.player.move("right");
  }
  
  if(game.isMouseDown && (!game.mouseJoint)) {
    var body = game.getBodyAtMouse();
    if(body) {
      var md = new b2MouseJointDef();
      md.bodyA = game.world.GetGroundBody();
      md.bodyB = body;
      md.target.Set(game.mouseX, game.mouseY);
      md.collideConnected = true;
      md.maxForce = 500.0 * body.GetMass();
      game.mouseJoint = game.world.CreateJoint(md);
      body.SetAwake(true);
    }
  }
  
  if (game.mouseJoint) {
    if (game.isMouseDown) {
      game.mouseJoint.SetTarget(new b2Vec2(game.mouseX, game.mouseY));
    } else {
      game.world.DestroyJoint(game.mouseJoint);
      game.mouseJoint = null;
    }
  }
  
  game.world.Step(1 / 60, 10, 10);
  game.world.DrawDebugData();
  game.world.ClearForces();
  
  game.context.clearRect(0, 0, game.canvasWidth*game.STAGE_SCALE+1, game.canvasHeight*game.STAGE_SCALE+1);
  
  game.levels[game.currentLevel].render();
  
  for (b = game.world.GetBodyList(); b; b = b.GetNext()) {
    if (b.GetType() == b2Body.b2_dynamicBody) {
      var pos = b.GetPosition();
      
      var data = b.GetUserData();
      if (data && data.image && !data.isPlayer) {
        game.context.save();
        game.context.translate(pos.x*game.STAGE_SCALE, pos.y*game.STAGE_SCALE);
        game.context.rotate(b.GetAngle());
        game.context.drawImage(data.image, -data.width*game.STAGE_SCALE/2, -data.height*game.STAGE_SCALE/2, data.width*game.STAGE_SCALE, data.height*game.STAGE_SCALE);
        game.context.restore();
      }
    }
  }
  game.player.render();
  
  requestAnimFrame(function () { game.update(); });
}


// Defines the direction of gravity
Game.prototype.setGravity = function (direction) {
  var game = this;
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


Game.prototype.setGravityAngle = function (r) {
  var game = this;
  
  game.gravityAngle = r;
  game.gravity.x = Math.cos(r) * game.GRAVITY;
  game.gravity.y = Math.sin(r) * game.GRAVITY;
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
      player: {x: 900, y: 950},
      goal: {x: 100, y: 100}
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



Game.prototype.onMouseMove = function (e) {
  var game = this;
  game.mouseX = (e.clientX - game.canvasPosition.x) / game.STAGE_SCALE;
  game.mouseY = (e.clientY - game.canvasPosition.y) / game.STAGE_SCALE;
}

Game.prototype.getBodyAtMouse = function () {
  var game = this;
  
  game.mousePVec = new b2Vec2(game.mouseX, game.mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(game.mouseX - 0.01, game.mouseY - 0.01);
  aabb.upperBound.Set(game.mouseX + 0.01, game.mouseY + 0.01);
    
  // Query the world for overlapping shapes.
    
  game.selectedBody = null;
  game.world.QueryAABB(game.getBodyCB, aabb);
  return game.selectedBody;
}

Game.prototype.getBodyCB = function (fixture) {
  var game = this;
    
  if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
    if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), game.mousePVec)) {
      game.selectedBody = fixture.GetBody();
      return false;
    }
  }
  return true;
}


captureKey(Keys.UP);
captureKey(Keys.DOWN);
captureKey(Keys.LEFT);
captureKey(Keys.RIGHT);
captureKey(Keys.BACKSPACE);
