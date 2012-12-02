var Player = function (game) {
  this.game = game;
  //this.imgUrl = "8bit-stache.jpg";
  this.imgUrl = "img/samus_fullsheet.png";
  this.imgUrl = "img/sprites.png";
  this.img = new Image();
  this.img.src = this.imgUrl;
  this.direction = "left"; // left or right
  this.state = "run"; // standleft, standright, runleft, runright, jumpleft, jumpright
  this.frameIndex = 0;
  this.width = 8;
  this.height = 11;
  this.index = 0;
  this.lastMove = 0;
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
  f.SetRestitution(0);
  f.SetUserData(data);
  
  this.obj = bd;
}

Player.prototype.move = function (dir) {
  this.lastMove = Date.now();
  var obj = this.obj;
  var game = this.game;
  
  if (dir == "left") {
    this.direction = dir;
  } else
  if (dir == "right") {
    this.direction = dir;
  }
  
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
  
  if (this.isTouching()) {
    if (this.lastMove > Date.now() - 200) {
      this.state = "run";
    } else {
      this.state = "stand";
    }
  } else {
    if (this.state != "jump") {
      this.state = "jump";
      this.animationStart = Date.now();
    }
  }
  
  game.context.save();
  game.context.translate(pos.x*game.STAGE_SCALE, pos.y*game.STAGE_SCALE);
  game.context.rotate(obj.GetAngle());
  
	frameCount = 10;
	srcx = 0;
	srcy = 88;
	srcw = 49;
	srch = 48;
  noRepeat = false;
  
	switch(this.state + this.direction){
		case "standleft" :
			srcx = 0;
			srcy = 0;
			srcw = 35;
			srch = 44;
			frameCount = 4;
			break;
		case "standright" :
  		srcx = 0;
  		srcy = 44;
  		srcw = 35;
  		srch = 44;
      frameCount = 4;
			break;
		case "runleft" :
			srcx = 0;
			srcy = 88;
			srcw = 35;
			srch = 44;
			frameCount = 10;
			break;
		case "runright" :
			srcx = 0;
			srcy = 132;			
			srcw = 35;
			srch = 44;
			frameCount = 10;
			break;
		case "jumpleft" :
			srcx = 0;
			srcy = 176;
      srcw = 35;
      srch = 47;
			frameCount = 4;
      noRepeat = true;
			break;
		case "jumpright" :
  		srcx = 0;
  		srcy = 223;
      srcw = 35;
      srch = 47;
  		frameCount = 4;
      noRepeat = true;
			break;
	}
  if (noRepeat) {
    currentFrame = Math.floor((d-this.animationStart)/framerate);
    if (currentFrame >= frameCount) {
      currentFrame = frameCount - 1;
    }
  } else {
    currentFrame = Math.floor(d/framerate) % frameCount;
  }
	//console.log(currentFrame);
	
  if (1==1) {
  	game.context.drawImage(this.img, 
    	srcx + srcw*currentFrame,  	srcy,
    	srcw,  	srch,
      -width*game.STAGE_SCALE/2, 
      -height*game.STAGE_SCALE/2, 
      width*game.STAGE_SCALE, 
      height*game.STAGE_SCALE
    );
  }

  game.context.restore();
}

function AnimatePlayer(state){
  
	var game = this.game;

  
}

Player.prototype.isTouching = function () {
  this.getContacts();
  return this.lastContact > Date.now()-300;
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



