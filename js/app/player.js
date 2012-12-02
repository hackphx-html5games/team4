var Player = function (game) {
  this.game = game;
  //this.imgUrl = "8bit-stache.jpg";
  this.imgUrl = "img/samus_fullsheet.png";
  this.img = new Image();
  this.img.src = this.imgUrl;
  this.direction = "left"; // left or right
  this.state = "runright"; // standleft, standright, runleft, runright, jumpleft, jumpright
  this.frameIndex = 0;
  this.width = 8;
  this.height = 11;
  this.index = 0;
}

Player.prototype.create = function () {
  var game = this.game;
  
  //var bodyDef = new b2BodyDef;
  //var fixDef = new b2FixtureDef;
  game.bodyDef.type = b2Body.b2_dynamicBody;
  
  game.fixDef.shape = new b2PolygonShape;
  game.fixDef.shape.SetAsBox(
      this.width/2 //half width
    , this.height/2 //half height
  );
  
  game.bodyDef.position.x = Math.random() * game.canvasWidth;
  game.bodyDef.position.y = game.canvasHeight*.1 + Math.random() * game.canvasHeight*.4;
  bd = game.world.CreateBody(game.bodyDef);
  
  var data = {
    image: this.img,
    imgUrl: this.imgUrl,
    width: this.width,
    height: this.height,
    isPlayer: true
  };
  
  bd.SetUserData(data);
  game.fixDef.restitution = 0;
  f = bd.CreateFixture(game.fixDef);
  f.SetUserData(data);
  
  this.obj = bd;
}

Player.prototype.move = function (dir) {
  var obj = this.obj;
  var game = this.game;
  
  this.process();
  
  if (!this.isTouching()) {
    return;
  }
  
  var pos = obj.GetPosition();
  var _x = pos.x;
  var x2 = 0;
  var _y = pos.y;
  var y2 = 0;
  
  var movementAmount = 2 * obj.GetMass();
  
  if (dir == "left") {
    angle = game.gravityAngle+Math.PI/2;
  } else
  if (dir == "right") {
    angle = game.gravityAngle-Math.PI/2;
  } else {
    return;
  }
  
  var _x = Math.cos(angle) * movementAmount;
  var _y = Math.sin(angle) * movementAmount;
  
  obj.ApplyImpulse({x: _x, y: _y}, obj.GetWorldCenter());
  this.process();
}


Player.prototype.process = function () {
  var game = this.game;
  
  this.obj.SetAngularVelocity(0);
  this.obj.SetAngle(game.gravityAngle-Math.PI/2);
}

Player.prototype.render = function () {
  var game = this.game;
  var obj = this.obj;
	var width = this.width;
  var height = this.height;
	var srcw = 50;
  var srch = 50;
  var srcx = 0;
  var srcy = 0;
  var pos = obj.GetPosition();
  
  var framerate = 100;
  var d = Date.now();
  this.process();
  
  game.context.save();
  game.context.translate(pos.x*game.STAGE_SCALE, pos.y*game.STAGE_SCALE);
  game.context.rotate(obj.GetAngle());
  
  
  frameCount = 9;
  
	switch(this.state){
		case "standleft" :
			srcx = 306;
			srcy = 359;
			w = 49;
			h = 48;
			frameCount = 9;
			break;
		case "standright" :
			srcx = 736;
			srcy = 1105;		
			break;
		case "runleft" :
			srcx = 13;
			srcy = 537;		
			break;
		case "runright" :
			srcx = 483 + (this.index * 49);
			srcy = 601;			
			w = 49;
			h = 48;
			frameCount = 9;
			break;
		case "jumpleft" :
			srcx = 29;
			srcy = 364;		
			break;
		case "jumpright" :
			srcx = 381;
			srcy = 363;		
			break;
	}
	currentFrame = Math.floor(d/framerate) % frameCount;
	console.log(currentFrame);
	
	
	game.context.drawImage(this.img, 
  	srcx + srcw*currentFrame,  	srcy,
  	srcw,  	srch,
    -width*game.STAGE_SCALE/2, 
    -height*game.STAGE_SCALE/2, 
    width*game.STAGE_SCALE, 
    height*game.STAGE_SCALE
  );

  game.context.restore();
}

function AnimatePlayer(state){
  
	var game = this.game;

  
}

Player.prototype.isTouching = function () {
  this.getContacts();
  return this.lastContact > Date.now()-200;
}

Player.prototype.getContacts = function () {
  var contacts = this.obj.GetContactList();
  if (!contacts) {
    return;
  }
  while (contacts) {
    if (contacts && contacts.contact && contacts.contact.IsTouching && contacts.contact.IsTouching()) {
      if (contacts.contact.IsTouching()) {
        this.lastContact = Date.now();
      }
    }
    contacts = contacts.next;
  }
}



