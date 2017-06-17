//<![CDATA[
window.onload=function(){
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////Text Wrap//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var line_y = null;
function wrapText(context, text, x, y, maxWidth, lineHeight, padding) {
	// context refers to canvas context
  // text is the source text you want to wrap
  // x and y correspond to start location of wrap box
  // max width largest width wrap goes
  // line height is the space taken for a single line of text
  // padding is a spacer 
	var words = text.split(' ');
	var line = '';

  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x+padding, y);
      line = words[n] + ' ';
      y += lineHeight;
  	}
    else {
    	line = testLine;
  	}
  }
  context.fillText(line, x+padding, y);
}

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////PAIRS////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Simple pair object prototype for further use
function pair(first, second) {
  this.first = first;
  this.second = second;
}

// Easy way to create new pair copy, instead of passing by reference
pair.prototype.copy = function() {
  return new pair(this.first, this.second);
}

// easy way to add and return a new pair
pair.prototype.add = function(that) {
  var first = this.first + that.first;
  var second = this.second + that.second;
  return new pair(first, second);
}
// easy way to subtract and return a new pair
pair.prototype.sub = function(that) {
  var first = this.first - that.first;
  var second = this.second - that.second;
  return new pair(first, second);
}

// comparing to see if a pair is the same
pair.prototype.compare = function(that) {
  if (this.first == that.first && this.second == that.second) return true;
  return false;
}
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////SCREENS////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// screen object for different screens
function screen(xyPair, whPair) {
  this.xy = xyPair;
  this.wh = whPair;
  this.center = whPair.sub(xyPair);
  this.background = null;
  this.objects = [];
  this.audio = null;
  this.firstTimeOnScreen = true;
  this.firstTimeFunction = null;
  this.anchorScreenTime = true;
}
// changes the background of the screen
screen.prototype.changeBackground = function(background) {
  var newBack = new Image();
  newBack.src = background;
  this.background = newBack;
}
// Inserts a new object to be shown in the screen
screen.prototype.insertObject = function(obj) {
  this.objects.push(obj);
}
// Inserts audio tag that will play on screen
screen.prototype.audioTag = function(aud) {
  this.audio = aud;
}
// Draws the screen and all objects inside of it
screen.prototype.draw = function(con) {
  //con.fillStyle = this.background.src;
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  for (var i = 0; i < this.objects.length; ++i) {
    this.objects[i].draw(con);
  }
}
// Runs Collision check function on all objects in the screen
screen.prototype.check = function() {
  if (this.firstTimeOnScreen && this.firstTimeFunction != null) {
    console.log('HELLO');
    this.firstTimeFunction();
    this.firstTimeOnScreen = false;
  }
  for (var i = 0; i < this.objects.length; ++i) {
    this.objects[i].collision();
  }
}

screen.prototype.firstTimeFunctionSet = function(fun) {
  console.log('WEEEE');
  this.firstTimeFunction = fun;
}
////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////BUTTONS////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Parent Button, don't make a button with this one
// Make a child button with this and use that
function buttonParent(xyPair, whPair, dr, col, owner) {
  this.xy = xyPair;
  this.wh = whPair;
  this.center = whPair.sub(xyPair);
  this.draw = dr;
  this.collision = col;
  this.owner = owner;
}

// Buttons used for moving from one menu to the other
function screenButton(dim, name, destination, src) {
  var dr = function(con) {
    var image = new Image();
    image.src = this.owner.source;
    con.drawImage(image, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
    con.fillStyle = 'black';
    //con.fillText(this.owner.name, this.xy.first + this.wh.first/4, this.xy.second + this.wh.second/2);
    wrapText(con, this.owner.name, this.xy.first, this.xy.second+22, this.wh.first, 20, 45);
  }
  
  var col = function() {
  if (mouseUI.xy.first > this.xy.first &&
      mouseUI.xy.first < this.wh.first + this.xy.first && 
      mouseUI.xy.second > this.xy.second && 
      mouseUI.xy.second < this.wh.second + this.xy.second) {
    this.owner.source = 'assets/buttonNonSelect.png';
    if (!this.owner.isSelected) {
      this.wh = new pair(this.wh.first * 1.1, this.wh.second * 1.1);
      this.owner.isSelected = true;
    }
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      mouseUI.canClick = false;
      for (var i = 0; i < screenArray.length; ++i) {
        if (screenArray[i].first == this.owner.destination) currentScreen = screenArray[i].second;
        }
      }
    }
    else {
      this.owner.source = this.owner.originalsrc;
      this.owner.isSelected = false;
      this.wh.first = this.owner.originalDim.second.first;
      this.wh.second = this.owner.originalDim.second.second;
    }
  }

  this.button = new buttonParent(dim.first, dim.second, dr, col, this);
  this.originalDim = dim;
  this.name = name;
  this.destination = destination;
  this.source = src;
  this.originalsrc = src;
  this.isSelected = false;
}

screenButton.prototype.draw = function(con) {
  return this.button.draw(con);
}

screenButton.prototype.collision = function() {
  return this.button.collision();
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////MOUSE////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// UI!
function mouse() {
    this.xy = new pair(0,0);
    this.mouseMoveAction = null;
    this.mouseDownAction = null;
    this.mouseUpAction = null;
    this.isMouseDown = false;
    this.canClick = true;
}

mouse.prototype.beginCapture = function (canvas) {
    var _this = this;
    canvas.addEventListener('mousemove', function (event) {
        _this.xy.first = event.pageX - canvas.offsetLeft;
        _this.xy.second = event.pageY - canvas.offsetTop;
        if (this.mouseMoveAction) return _this.mouseMoveAction(_this.mx, _this.my);
    });
    canvas.addEventListener('mousedown', function (event) {
        _this.isMouseDown = true;
        if (_this.mouseDownAction) return _this.mouseDownAction(event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop);
    });
    return canvas.addEventListener('mouseup', function () {
        _this.isMouseDown = false;
        _this.canClick = true;
        if (_this.mouseUpAction) return _this.mouseUpAction();
    });
}
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////RATINGS///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//Ratings Peopticle System
function people(worth) {
  this.likes = [];
  this.dislikes = [];
  this.worthiness = worth;
  this.loyalty = 0;
}

people.prototype.addLike = function(like) {
  this.likes.push(like);
}

people.prototype.addDislike = function(dislike) {
  this.dislikes.push(dislike);
}

// Generates and returns an array of people, all it needs is the number of people and a list of subjects
// The return is the array, do not insert the whole object into a variable
function peopleGenerator(numOfPeople, sub, dissub) {
  var peopleArray = [];
  for (var i = 0; i < numOfPeople; ++i) {
    // Creates a new person
    peopleArray[i] = new people(Math.ceil(Math.random()*5));
    //Adds likes, currently set to 3 likes
    while (peopleArray[i].likes.length < 3) {
      var subject = sub[Math.floor(Math.random()*sub.length)];
      // prevents doubles
      var double = false;
      //adds likes
      for (var j = 0; j < peopleArray[i].likes.length; ++j) {
        if (peopleArray[i].likes[j] == subject) double = true;
      }
      if (!double) peopleArray[i].likes.push(subject);
    }
    // Adds dislikes, currently set to 1 dislike
    while (peopleArray[i].dislikes.length < 1) {
      var subject = dissub[Math.floor(Math.random()*dissub.length)];
      //Prevents doubles
      var double = false;
      // Prevents having a love-hate situation
      for (var j = 0; j < peopleArray[i].likes.length; ++j) {
        if (peopleArray[i].likes[j] == subject) double = true;
      }
      // adds dislikes
      for (var j = 0; j < peopleArray[i].dislikes.length; ++j) {
        if (peopleArray[i].dislikes[j] == subject) double = true;
      }
      if (!double) peopleArray[i].dislikes.push(subject);
    }
  }
   
  return peopleArray;
}

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////SMALL NEWS STORIES//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var COLORS = ['#ffffff', '#ffe6e6', '#ffcccc', '#ffb3b3', '#ff9999', '#ff8080', '#ff6666', '#ff4d4d', '#ff3333', '#ff1a1a', '#ff0000']

// News Stories
function newsStorySmall(worthiness, headline, sub, tar, subEmo, tarEmo) {
  this.headline = headline;
  this.subject = sub;
  this.target = tar;
  this.worthiness = worthiness;
  this.subjectEmotional = subEmo;
  this.targetEmotional = tarEmo;
  this.upArrow = new Image();
  this.upArrow.src = 'assets/LastWeek-_0001_UpArrow.png';
  this.downArrow = new Image();
  this.downArrow.src = 'assets/LastWeek-_0000_DownArrow.png';
}
//wrapText(context, text, x, y, maxWidth, lineHeight, padding)
newsStorySmall.prototype.draw = function(xyPair, whPair, con) {
  con.fillStyle = COLORS[Math.abs(this.worthiness - 1)];
  con.fillRect(xyPair.first, xyPair.second, whPair.first - 55, whPair.second);
  con.fillStyle = 'black';
  wrapText(con, this.headline, xyPair.first, xyPair.second + whPair.second * 1/2, whPair.first - 65, 15, 5);
  if (this.subjectEmotional > 0) con.drawImage(this.upArrow, xyPair.first + whPair.first - 50, xyPair.second + 10, 25, 25);
  else con.drawImage(this.downArrow, xyPair.first + whPair.first - 50, xyPair.second + 10, 25, 25);
  if (this.targetEmotional > 0) con.drawImage(this.upArrow, xyPair.first + whPair.first - 25, xyPair.second + 10, 25, 25);
  else con.drawImage(this.downArrow, xyPair.first + whPair.first - 25, xyPair.second + 10, 25, 25);
}

function generatePossibleStories(newsArray) {
  var result = [];
  var counter = 0;
  var subjectCount = 0;
  var subjects = [];
  for (var i = 0; i < newsArray.length; ++i) {
    if (subjects.indexOf(newsArray[i].subject) == -1) {
      subjects.push(newsArray[i].subject);
      subjectCount++;
    } 
  }
  while (result.length < subjectCount && counter < newsArray.length) {
    var story = newsArray[Math.floor(Math.random()*newsArray.length)];
    var double = false;
    for (var i = 0; i < result.length; ++i) {
      if (result[i].subject == story.subject) double = true;
    }
    if (!double) result.push(story);
    if (newsArray.length < 4) counter++;
  }
  // Adds a story per beat reporter
  for (var i = 0; i < scoreScreen.upgradesBox.beatReporters.length; ++i) { //Every Reporter
    var story;
    for (var j = 0; j < newsArray.length; ++j) { // Every news story
      if (newsArray[j].worthiness <= 5) {
        if (scoreScreen.upgradesBox.beatReporters[i].subject == newsArray[j].subject) { // Check if it is subject
          var double = false;
          for (var k = 0; k < result.length; ++k) { // check results for double
            if (result[k].headline == newsArray[j].headline) double = true;
          }
          if (!double) story = newsArray[j];
        }
      }
    }
    if (story != null) result.push(story);
  }
  // Adds a story per investigative journalist
  for (var i = 0; i < scoreScreen.upgradesBox.investReporters.length; ++i) { //Every Reporter
    var story = null;
    for (var j = 0; j < newsArray.length; ++j) { // Every news story
      if (newsArray[j].worthiness > 5) {
        if (scoreScreen.upgradesBox.investReporters[i].subject == newsArray[j].subject) { // Check if it is subject
          var double = false;
          for (var k = 0; k < result.length; ++k) { // check results for double
            if (result[k].headline == newsArray[j].headline) double = true;
          }
          if (!double) story = newsArray[j];
        }
      }
    }
    if (story != null) result.push(story);
  }
  return result;
}

function smallStoriesBox(stories, target) {
  this.target = target;
  this.stories = stories;
  this.xy = new pair(100, 130);
  this.wh = new pair(500, 40);
  this.displayed = [0, 1, 2, 3];
  this.timer = 0;
  this.background = new Image();
  this.background.src = 'assets/NewsScreen-_0007_Scrolling-Window.png';
  
}

smallStoriesBox.prototype.draw = function(con) {
  con.drawImage(this.background, this.xy.first - 15, this.xy.second - 15, this.wh.first + 40, this.wh.second * 4 + 30)
  for (var i = 0; i < this.displayed.length; ++i) {
    this.stories[this.displayed[i]].draw(this.xy.add(new pair(0, this.wh.second * i)), this.wh, con);
  }
  this.timer++;
  if (this.timer == 100) {
    for (var i = 0; i < this.displayed.length; ++i) {
      this.displayed[i]++;
      if (this.displayed[i] == this.stories.length) this.displayed[i] = 0;
    }
    this.timer = 0;
  }
}

smallStoriesBox.prototype.collision = function() {
  for (var i = 0; i < this.displayed.length; ++i) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      var newHeight = i + 1;
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second + this.wh.second * i && 
          mouseUI.xy.second < this.xy.second + this.wh.second * newHeight) {
        mouseUI.canClick = false;
        this.target.insert(this.stories[this.displayed[i]]);
      }
    }
  }
}

function selectedStoriesBox() {
  this.stories = [];
  this.xy = new pair(100, 325);
  this.wh = new pair(500, 40);
  this.background = new Image();
  this.background.src = 'assets/NewsScreen-_0003_Selected-Stories.png';
  
}

selectedStoriesBox.prototype.insert = function(story) {
  if (this.stories.length < scoreScreen.upgradesBox.airTime) this.stories.push(story);
}

selectedStoriesBox.prototype.draw = function(con) {
  con.drawImage(this.background, this.xy.first - 15, this.xy.second - 15, this.wh.first + 40, this.wh.second * 4 + 30);
  for (var i = 0; i < this.stories.length; ++i) {
    var sizeTest = this.xy.second + this.wh.second * i + this.wh.second;
    if (sizeTest <= canvas.width) this.stories[i].draw(this.xy.add(new pair(0, this.wh.second * i)), this.wh, con);
  }
}

selectedStoriesBox.prototype.collision = function() {
  for (var i = 0; i < this.stories.length; ++i) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      var newHeight = i + 1;
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second + this.wh.second * i && 
          mouseUI.xy.second < this.xy.second + this.wh.second * newHeight) {
        mouseUI.canClick = false;
        this.stories.splice(i, 1);
      }
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////News Score Screen///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function stationScoreScreen() {
  this.regionRatings = [0, 0, 0, 0];
  this.funding = 0;
  this.averagePercentViewers = 0;
  this.turn = 0;
  this.AdReputations = [];
  this.sponsers = 0;
  this.sponserFunding = 0;
  //'Business', 'Democrat', 'Kaiju', 'Medical', 'Republican', 'Sports'
  this.AdReputations.push(new pair('Business', 0));
  this.AdReputations.push(new pair('Democrat', 0));
  this.AdReputations.push(new pair('Kaiju', 0));
  this.AdReputations.push(new pair('Medical', 0));
  this.AdReputations.push(new pair('Republican', 0));
  this.AdReputations.push(new pair('Sports', 0));
  
  this.upgradesBox = new upgradeBox();
}

stationScoreScreen.prototype.draw = function(con) {
  con.fillStyle = 'yellow';
  con.fillText(Math.floor(this.regionRatings[0] * 100 / 300) + '% viewership', 150, 300);
  con.fillText(Math.floor(this.regionRatings[1] * 100 / 100) + '% viewership', 550, 225);
  con.fillText(Math.floor(this.regionRatings[2] * 100 / 150) + '% viewership', 300, 475);
  con.fillText(Math.floor(this.regionRatings[3] * 100 / 200) + '% viewership', 465, 350);
  var totalRatings = this.regionRatings[0] + this.regionRatings[1] + this.regionRatings[2] + this.regionRatings[3];
  con.fillText(Math.floor((totalRatings / 750) * 100) + '% viewership this week.', 125, 120);
  
  con.fillText('Average viewership overall weeks: ' + this.averagePercentViewers + '%', 375, 120);
  
     week = this.turn;
  	 money = this.funding * 1000;
  	 ratings = this.averagePercentViewers;
     
  /*for (var i = 0; i < this.AdReputations.length; ++i) {
    con.fillText(this.AdReputations[i].first + ': ' + this.AdReputations[i].second, 70 + i * 120, 560);
  }*/
}

stationScoreScreen.prototype.collision = function() {

}

stationScoreScreen.prototype.calculateAverage = function(total) {
  this.averagePercentViewers = this.averagePercentViewers / 100;
  this.averagePercentViewers = this.averagePercentViewers * this.turn;
  this.averagePercentViewers += total;
  this.averagePercentViewers = Math.floor((this.averagePercentViewers / (this.turn + 1)) * 100);
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////Owner Object///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function ownerObject() {
  this.funding = 5;
  this.happiness = 50;
  this.politicalStanding = 0;
  this.companies = [];
}

ownerObject.prototype.draw = function(con) {
  /*con.fillStyle = 'black';
  con.fillRect(200, 50, 300, 100);
  context.fillStyle = 'white';
  context.fillText('Happiness is:' + this.happiness, 210, 60);
  context.fillText('The owners have investments in these companies:', 210, 70);
  for (var i = 0; i < this.companies.length; i++) {
    context.fillText(this.companies[i], 210, 70 + (i + 1) * 10);
  }*/
}

ownerObject.prototype.setFunding = function(score) {
  score.funding += this.funding;
}

ownerObject.prototype.collision = function() {

}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////Advertiser///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function advertiserObject(xyPair, whPair,name, funding, req, standing, scoreSc, sub, gr, cl, cla) {
  this.xy = xyPair;
  this.wh = whPair;
  this.name = name;
  this.funding = funding;
  this.strikes = 0;
  this.reqReputation = standing;
  this.ratingsReq = req;
  this.isAvailable = false;
  this.scorePointer = scoreSc;
  this.wasClicked = false;
  this.subject = sub;
  this.background = new Image();
  this.grey = gr;
  this.clicked = cl;
  this.clickable = cla;
  this.background.src = this.grey;
}

advertiserObject.prototype.draw = function(con) {
  
  
  if (this.isAvailable && mouseUI.canClick == false) this.background.src = this.clicked;
  else if (this.isAvailable) this.background.src = this.clickable;
  else this.background.src = this.grey;
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  con.fillStyle = 'black';
  //wrapText(context, text, x, y, maxWidth, lineHeight, padding)
  var padding = 20;
  wrapText(con, this.name, this.xy.first, this.xy.second + 23, this.wh.first - padding * 2, 15, padding)
  con.fillText('$' + this.funding + '000', this.xy.first + 250, this.xy.second + 55);
  con.fillText('Ratings: ' + this.ratingsReq + '%', this.xy.first + 20, this.xy.second + 55);
  con.fillText(this.subject + ': ' + this.reqReputation, this.xy.first + 125, this.xy.second + 55);
  
}

advertiserObject.prototype.collision = function() {
  var tempstanding = NaN;
  for (var i = 0; i < this.scorePointer.AdReputations.length; i++) {
    if (this.scorePointer.AdReputations[i].first == this.subject) tempstanding = this.scorePointer.AdReputations[i].second;
  }
  
  if (this.isAvailable) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second && 
          mouseUI.xy.second < this.wh.second + this.xy.second) {
        mouseUI.canClick = false;
        
        confirmation("support", this);
        //this.scorePointer.funding += this.funding;
        //this.isAvailable = false;
      }
    }
  }
  else {
    if (this.scorePointer.averagePercentViewers >= this.ratingsReq && !this.wasClicked && tempstanding >= this.reqReputation) {
      this.isAvailable = true;
    }
  }
}


////////////////////////////////////////////////////////////////////////////////
/////////////////////////////Upgrades//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function upgradeBox() {
  this.beatReporters = [];
  this.investReporters = [];
  this.airTime = 2;
}

upgradeBox.prototype.insertBeatReporter = function(upg) {
  this.beatReporters.push(upg);
}

upgradeBox.prototype.insertInvestReporter = function(upg) {
  this.investReporters.push(upg);
}

// Reporter
function beatReporter(xyPair, whPair, reqFund, subj, scScreen) {
  this.funding = reqFund;
  this.subject = subj;
  this.xy = xyPair;
  this.wh = whPair;
  this.scorePointer = scScreen;
  this.background = new Image();
  this.grey = 'assets/UpgradeScreenDark-_0000s_0006_Shape-3-copy-17.png';
  this.clicked = 'assets/UpgradeScreen-_0001s_0006_Shape-3-copy-15.png';
  this.clickable = 'assets/UpgradeScreen-_0000s_0006_Shape-3-copy-13.png';
  this.background.src = this.grey;
}

beatReporter.prototype.draw = function(con) {
  if (this.scorePointer.funding >= this.funding && mouseUI.canClick == false) this.background.src = this.clicked;
  else if (this.scorePointer.funding >= this.funding) this.background.src = this.clickable;
  else this.background.src = this.grey;
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  con.fillStyle = 'black';
  con.fillText('Beat', this.xy.first + 10, this.xy.second + 15);
  con.fillText('Reporter', this.xy.first + 10, this.xy.second + 27);
  con.fillText('$' + this.funding + '000', this.xy.first + 95, this.xy.second + 42);
  con.fillText(this.subject, this.xy.first + 10, this.xy.second + 42);
}

beatReporter.prototype.collision = function() {
  if (this.scorePointer.funding >= this.funding) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second && 
          mouseUI.xy.second < this.wh.second + this.xy.second) {
        mouseUI.canClick = false;
        var arguments = ['assets/UpgradeScreen-_0000s_0006_Shape-3-copy-13.png']
        confirmation("breporter", this);
        //this.scorePointer.upgradesBox.insertBeatReporter(this);
        //this.scorePointer.funding -= this.funding;
      }
    }
  }
}
// Investigative journalist
function investReporter(xyPair, whPair, reqFund, subj, scScreen) {
  this.funding = reqFund;
  this.subject = subj;
  this.xy = xyPair;
  this.wh = whPair;
  this.scorePointer = scScreen;
  this.background = new Image();
  this.grey = 'assets/UpgradeScreenDark-_0000s_0007_Shape-3-copy-16.png';
  this.clicked = 'assets/UpgradeScreen-_0001s_0007_Shape-3-copy-14.png';
  this.clickable = 'assets/UpgradeScreen-_0000s_0007_Shape-3-copy-12.png';
  this.background.src = this.grey;
  
}

investReporter.prototype.draw = function(con) {
  if (this.scorePointer.funding >= this.funding && mouseUI.canClick == false) this.background.src = this.clicked;
  else if (this.scorePointer.funding >= this.funding) this.background.src = this.clickable;
  else this.background.src = this.grey;
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  con.fillStyle = 'black';
  con.fillText('Investigative', this.xy.first + 10, this.xy.second + 15);
  con.fillText('Reporter', this.xy.first + 10, this.xy.second + 27);
  con.fillText('$' + this.funding + '000', this.xy.first + 95, this.xy.second + 42);
  con.fillText(this.subject, this.xy.first + 10, this.xy.second + 42);
}

investReporter.prototype.collision = function() {
  if (this.scorePointer.funding >= this.funding) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second && 
          mouseUI.xy.second < this.wh.second + this.xy.second) {
        mouseUI.canClick = false;
        
        confirmation("ireporter", this);
        //this.scorePointer.upgradesBox.insertInvestReporter(this);
        //this.scorePointer.funding -= this.funding;
      }
    }
  }
}

//Air time
function airTimeButton(xyPair, whPair, reqFund, scScreen) {
  this.funding = reqFund;
  this.xy = xyPair;
  this.wh = whPair;
  this.scorePointer = scScreen;
  this.background = new Image();
  this.grey = 'assets/UpgradeScreenDark-_0002s_0009_Shape-3-copy-26.png';
  this.clicked = 'assets/UpgradeScreen-_0002s_0011_Shape-3-copy-24.png';
  this.clickable = 'assets/UpgradeScreen-_0002s_0010_Shape-3-copy-25.png';
  this.background.src = this.grey;
}

airTimeButton.prototype.draw = function(con) {
  if (this.scorePointer.funding >= this.funding && mouseUI.canClick == false) this.background.src = this.clicked;
  else if (this.scorePointer.funding >= this.funding) this.background.src = this.clickable;
  else this.background.src = this.grey;
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  con.fillStyle = 'black';
  con.fillText('Increase Air Time', this.xy.first + 10, this.xy.second + 20);
  con.fillText('$' + this.funding +'000', this.xy.first + 50, this.xy.second + 40);
}

airTimeButton.prototype.collision = function() {
  if (this.scorePointer.funding >= this.funding) {
    if (mouseUI.isMouseDown && mouseUI.canClick) {
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second && 
          mouseUI.xy.second < this.wh.second + this.xy.second) {
        mouseUI.canClick = false;
        if (this.scorePointer.upgradesBox.airTime < 4) {
          confirmation("airtime", this);
          //this.scorePointer.upgradesBox.airTime++;
          //this.scorePointer.funding -= this.funding;
        }
      }
    }
  }
}


/////////////////////////////////////////////////////////////////////////////////
///////////////////////Background Music and Sound////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// initiate Audio State
var audPrev = null; // stores previous track
function backgroundAudio(){
  var audioURL = [];
  audioURL.push('assets/World_Today_alt_mix_mp3.mp3'); // Main Theme
 	audioURL.push('assets/24_Hour_Coverage_full_mix_mp3.mp3');

  var backgroundAudio = [];
  this.init = function(){
    for(var i = 0; i < audioURL.length; i++) backgroundAudio[i] = new Audio(audioURL[i]);
  };
  
  this.stop = function(audPrev){
  	backgroundAudio[audPrev].pause();
  	backgroundAudio[audPrev].currentTime = 0;
  }
  
  this.start = function(aud){
    if ((audPrev != aud) && (aud != null)){
			if(audPrev != null) this.stop(audPrev);
			audPrev = aud;
      backgroundAudio[aud].loop = true;
      backgroundAudio[aud].volume = 0.25;
      backgroundAudio[aud].load();
      backgroundAudio[aud].play();
  	}
  };
}

// Soundbite creator code
function soundbite(src){
	var html5audio=new Audio(src);
		html5audio.load();
		html5audio.playclip=function(){
			html5audio.pause();
			html5audio.currentTime=0;
			html5audio.play();
		}
		return html5audio;
}

//Initialize sound clips
var hawksworth=soundbite("assets/hawksworth.mp3");

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////Characters//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Create a new character, takes in the size of the box around him or her, the source file
// And the link to the text box to open up when clicked
function character(xyPair, whPair, src, text, screen) {
  this.xy = xyPair;
  this.wh = whPair;
  var image = new Image();
  image.src = src;
  this.character = image;
  this.textBox = text;
  this.screen = screen;
}

character.prototype.draw = function(con) {
  con.drawImage(this.character, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
}

character.prototype.collision = function() {
  if (mouseUI.isMouseDown && mouseUI.canClick) {
    if (mouseUI.xy.first > this.xy.first &&
        mouseUI.xy.first < this.wh.first + this.xy.first && 
        mouseUI.xy.second > this.xy.second && 
        mouseUI.xy.second < this.wh.second + this.xy.second) {
      mouseUI.canClick = false;
      //Insert code to open up text box here.
      // Also set state to draw only until control is given
      // back to the canvas.
      talk(this.textBox);
      GAMESTATE = 'paused';
    }
  }
  if (this.screen.firstTimeOnScreen) {
    talk(this.textBox);
    GAMESTATE = 'paused';
    this.screen.firstTimeOnScreen = false;
  }
}

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////NonInteractableObj//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// For the addition for background objects that can't be clicked on
function nonObject(xyPair, whPair, src) {
  this.xy = xyPair;
  this.wh = whPair;
  var image = new Image();
  image.src = src;
  this.image = image;
}

nonObject.prototype.draw = function(con) {
  con.drawImage(this.image, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
}

nonObject.prototype.collision = function() {
  // DO NOT PUT ANYTHING HERE YOU GUUUUUYS
}

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////Textbox/Messagebox Code//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var currentText = "",
  current_j = 0,
  block_length = 0;

function talk(src) {
  var block = [],
    j = current_j,
    text = src;

  // Clears any previous text before proceeding
  this.cleartext = function() {
    // Theoretically clears box and then displays it
    document.getElementById('typewriter_inner').innerHTML = '';
    setTimeout(document.getElementById("text_box").style.display = "block", 200);
  }

  // Splits text into smaller 350 character snips
  this.lineSplitter = function() {

    var lines = text.split("~"),
      temp_block = "";
    //Character Blocks
    for (var i = 0; i <= lines.length;) {
      if ((temp_block + lines[i]).length <= 256) {
        temp_block += lines[i];
        i++;
      } else if ((temp_block + lines[i]).length > 256) {
        block.push(temp_block);
        temp_block = "";
      }
    }
    block.push(temp_block.slice(0, -9));
  };
  this.lineSplitter();



  var str = block[j],
    type_i = 0,
    isTag, stext;
  this.type = function() {
    // Runs through a recursive loop and displays str character by character
    // Uses setTimeout to delay letter printing by 60ms
    stext = str.slice(0, type_i++);
    document.getElementById('typewriter_inner').innerHTML = stext;
    var char = text.slice(-1);
    if (char === '<') isTag = true;
    if (char === '>') isTag = false;
    if (isTag) return this.type();
    setTimeout(this.type, 20);
    if (type_i >= str.length) document.getElementById('blink').style.display = "table-cell";
  }

  this.cleartext();
  if (document.getElementById('typewriter_inner').innerHTML === '') this.type();
  currentText = src, current_j = j, block_len = block.length;
}

function message(src) {
  var imgsrc = src;
  document.getElementById('note').src = src;
  setTimeout(document.getElementById("message_box").style.display = "block", 200);
}

var confirm_flag = 0,
  confirm_args = [];

function confirmation(flag, args) {
  document.getElementById("confirmation_box").style.display = "table-cell";
  confirm_flag = flag;
  confirm_args = args;
}

function clearTextBox(box) {
  document.getElementById(box).style.display = "none";
}

document.getElementById("text_box").onclick = function() {
  current_j++;
  if (current_j >= block_len) {
    clearTextBox("text_box");
    currentText = "", current_j = 0, block_length = 0;
    mouseUI.canClick = true;
    mouseUI.isMouseDown = false;
    if (currentScreen === NewsAnchorScreen) HAWKSWORTH_SCREEN_SLIDE = true;
    if ((currentScreen === NewsAnchorScreen) && (HAWKSWORTH_SCREEN_SLIDE = true)) hawksworth.playclip();
  } else {
    if (currentScreen === NewsAnchorScreen) {
      CHANGE_ANCHOR_ICON = true;
    }
    talk(currentText, current_j);
  }
  document.getElementById('blink').style.display = "none";
};

document.getElementById("message_box").onclick = function() {
  clearTextBox("message_box");
};

document.getElementById("confirm").onclick = function() {
  clearTextBox("confirmation_box");
  switch (confirm_flag) {
    case 'message':
      break;
   case 'ireporter':
      confirm_args.scorePointer.upgradesBox.insertInvestReporter(confirm_args);
      confirm_args.scorePointer.funding -= confirm_args.funding;
      break;
    case 'support':
      confirm_args.scorePointer.funding += confirm_args.funding;
      confirm_args.isAvailable = false;
      confirm_args.scorePointer.sponserFunding += confirm_args.funding;
      confirm_args.scorePointer.sponsers++;
      confirm_args.wasClicked = true;
      break;
    case 'breporter':
      confirm_args.scorePointer.upgradesBox.insertBeatReporter(confirm_args);
      confirm_args.scorePointer.funding -= confirm_args.funding;
      break;
    case 'airtime':
      confirm_args.scorePointer.upgradesBox.airTime++;
      confirm_args.scorePointer.funding -= confirm_args.funding;
      break;
    case 0:
      break;
  }
  mouseUI.canClick = true;
  mouseUI.isMouseDown = false;
};

document.getElementById("close").onclick = function() {
  clearTextBox("confirmation_box");
};




////////////////////////////////////////////////////////////////////////////////
//////////////////////// Heads Up Display (HUD) ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function adjuster() {
  if (money >= 10000) {
    document.getElementById("money").style.width = 220 + "px";
  } else if ((money < 10000) && (money >= 1000)) {
    document.getElementById("money").style.width = 170 + "px";
  } else if ((money < 1000) && (money >= 100)) {
    document.getElementById("money").style.width = 145 + "px";
  } else if ((money < 100) && (money >= 0)) {
    document.getElementById("money").style.width = 120 + "px";
  }

  document.getElementById("week").innerHTML = "<span>Week</span><br />" + scoreScreen.turn;
  document.getElementById("money").innerHTML = "<span>Money</span><br />$" + scoreScreen.funding *1000;
  document.getElementById("ratings").innerHTML = "<span>ratings</span><br />" + scoreScreen.averagePercentViewers;

}

////////////////////////////////////////////////////////////////////////////////
//////////////////////// ANCHOR CONTROL OBJECT ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var CHANGE_ANCHOR_ICON = false;
var HAWKSWORTH_SCREEN_SLIDE = false;

function anchorControl(storiesBox) {
  this.selectedStories = storiesBox;
  
  this.selectedIcon = 0;
  this.currentStory = 0;
  this.slideCounter = 0;
  this.pictures = [new pair('Kaiju', 'red'), new pair('Sports', 'blue'), new pair('Business', 'orange'), new pair('Democrat', 'green'), new pair('Republican', 'pink'), new pair('Medical', 'cyan')];
  this.prefix = ['We start tonight with our top story: ', 'Well isn\'t that something? Moving on: ', 'In other news: ', 'Wrapping up our section here tonight with our final story: '];
  this.Hawksworth = new Image();
  this.Hawksworth.src = 'assets/Hawksworth.png';
  this.HawksworthXY = new pair(1124, 0);
  this.pause = false;
}

anchorControl.prototype.addStories = function() {
  this.subjects = [];
  this.headlines = [];
  for (var i = 0; i < this.selectedStories.stories.length; ++i) {
    this.subjects.push(this.selectedStories.stories[i].subject);
    this.headlines.push(this.selectedStories.stories[i].headline);
  }
  for (var j = 0; j < this.pictures.length; ++j) {
    if (this.subjects[0] == this.pictures[j].first) this.selectedIcon = j;
  }
  this.currentStory = 0;
  
  var storyText = 'Good evening and welcome to WLTV News, I\'m Don DeNews and I\'ll be bringing you what\'s important today.                                       ~';
  for (var i = 0; i < this.headlines.length; ++i) {
    storyText = storyText + this.prefix[i] + this.headlines[i] + '                                        ~';
  }
  storyText = storyText + 'Now to Hawksworth with the weather.                      ~';
  this.slideCounter = 0;
  this.pause = false;
  talk(storyText);
}

anchorControl.prototype.draw = function(con) {
  con.fillStyle = this.pictures[this.selectedIcon].second;
  //con.fillRect(150,90,150,100);
  if (CHANGE_ANCHOR_ICON) {
    if (this.pause) this.currentStory++;
    for (var j = 0; j < this.pictures.length; ++j) {
      console.log(this.pause);
      if (this.subjects[this.currentStory] == this.pictures[j].first) this.selectedIcon = j;
    }
    console.log(this.selectedIcon);
    this.pause = true;
    console.log(this.pause);
  }
  CHANGE_ANCHOR_ICON = false;
// This is where hawksworth comes in
  if (HAWKSWORTH_SCREEN_SLIDE) {
    if (this.slideCounter == 25) currentScreen = RatingsScreen;
    this.slideCounter++;
    con.drawImage(this.Hawksworth, this.HawksworthXY.first, this.HawksworthXY.second, 300, 678);
    this.HawksworthXY.first -= 55;
  }
  if (this.slideCounter == 26) {
    HAWKSWORTH_SCREEN_SLIDE = false;
    this.HawksworthXY.first = 1124;
  }
}

anchorControl.prototype.collision = function() {

}

////////////////////////////////////////////////////////////////////////////////
//////////////////////// RatingsScreenPopUp ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function RatingsPopUp(xyPair, whPair,likes, dislikes, pop) {
  this.xy = xyPair;
  this.wh = whPair;
  this.likes = likes;
  this.dislikes = dislikes;
  this.pop = pop;
  this.mousedOver = false;
  this.background = new Image();
  this.background.src = 'assets/LastWeek-_0003s_0000_OverlayMap.png';
}

RatingsPopUp.prototype.draw = function(con) {
  if (this.mousedOver) {
    con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
    con.fillStyle = 'black';
    con.fillText('Likes:', this.xy.first + 5, this.xy.second + 15);
    for (var i = 0; i < this.likes.length; ++i) {
      con.fillText(this.likes[i], this.xy.first + 5 , this.xy.second + 15 + 12 * (i + 1));
    }
    con.fillText('Dislikes:', this.xy.first + 5 , this.xy.second + 25 + 11 * this.likes.length + 12);
    var counter = 12 * this.likes.length + 35;
    for (var i = 0; i < this.dislikes.length; ++i) {
      con.fillText(this.dislikes[i], this.xy.first + 5, this.xy.second + counter + 12 * (i + 1));
    }
    //con.fillText('Pop: ' + this.pop, this.xy.first + 5, this.xy.second + counter + this.dislikes.length * 12 + 22);
  }
}

RatingsPopUp.prototype.collision = function() {
  if (mouseUI.xy.first > this.xy.first &&
        mouseUI.xy.first < this.wh.first + this.xy.first && 
        mouseUI.xy.second > this.xy.second && 
        mouseUI.xy.second < this.wh.second + this.xy.second) {
       this.mousedOver = true;
    }
  else this.mousedOver = false;
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////// FactionBox ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function factionsBox(xyPair, whPair, scorePtr) {
  this.xy = xyPair;
  this.wh = whPair;
  this.scorePointer = scorePtr;
  this.background = new Image();
  this.background.src = 'assets/LastWeek-_0003s_0001_Factions.png';
}
//this.AdReputations
factionsBox.prototype.draw = function(con) {
  con.drawImage(this.background, this.xy.first, this.xy.second, this.wh.first, this.wh.second);
  con.fillStyle = 'yellow';
  con.fillText('Reputations with Factions', this.xy.first + this.wh.first/3 , this.xy.second + 14);
  for (var i = 0; i < 2; ++i) {
    con.fillText(this.scorePointer.AdReputations[i].first + ': ' + this.scorePointer.AdReputations[i].second, this.xy.first + 39 + i * 90, this.xy.second + 30);
  }
  for (var i = 2; i < 4; ++i) {
    con.fillText(this.scorePointer.AdReputations[i].first + ': ' + this.scorePointer.AdReputations[i].second, this.xy.first + 229 + (i - 2) * 63, this.xy.second + 30);
  }
  for (var i = 4; i < 6; ++i) {
    con.fillText(this.scorePointer.AdReputations[i].first + ': ' + this.scorePointer.AdReputations[i].second, this.xy.first + 375 + (i - 4) * 110, this.xy.second + 30);
  }
}

factionsBox.prototype.collision = function() {
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////



var canvas = document.getElementById("gamespace");
var context = canvas.getContext('2d');
context.font = '15px Montserrat';
var GAMESTATE = 'running';

var mouseUI = new mouse();
mouseUI.beginCapture(canvas);
// Initialize HUD
document.getElementById("HUD").style.display = "none";
document.getElementById("HUD").style.width = canvas.width + "px";

// Initialize textbox location
document.getElementById("text_box").style.width = canvas.width + "px";
document.getElementById("text_box").style.height = canvas.height + "px";
document.getElementById("text_box").style.display = "none";

// Initialize typewriter location
var type_top = canvas.height - (canvas.height/4 - 40);
document.getElementById("typewriter_outer").style.width = canvas.width * 0.95 + "px";
document.getElementById("typewriter_outer").style.height = canvas.height / 4 - 40 + "px";
document.getElementById("typewriter_outer").style.top = type_top + "px";

// Initialize next_arrow location
document.getElementById("next_arrow").style.width = canvas.width * 0.05 + "px";
document.getElementById("next_arrow").style.height = canvas.height / 4 - 40 + "px";
document.getElementById("next_arrow").style.top = type_top + "px";
document.getElementById("blink").style.display = "none";
document.getElementById("blink").style.height = canvas.height / 4 - 40 + "px";
document.getElementById("blink").style.width = canvas.width * 0.05 + "px";

// Initialize message 
var conf_cont_width = 600;
document.getElementById("message_box").style.width = canvas.width + "px";
document.getElementById("message_box").style.height = canvas.height + "px";
document.getElementById("confirmation_box").style.width = canvas.width + "px";
document.getElementById("confirmation_box").style.height = canvas.height + "px"
document.getElementById("button_container").style.paddingLeft = (conf_cont_width - 420) / 2 + "px";
document.getElementById("note").style.width = canvas.height + "px";
document.getElementById("note").style.height = canvas.height + "px";

// Creating buttons
var startGameButton = new screenButton(new pair(new pair(450, 400), new pair(150, 50)), 'Start', 'Main', 'assets/button.png');
var creditsButton = new screenButton(new pair(new pair(450, 475), new pair(150, 50)), 'Credits', 'Credits', 'assets/button.png');
var startReturn = new screenButton(new pair(new pair(900, 610), new pair(150, 50)), 'Quit', 'Start', 'assets/button.png');
var ratingsButton = new screenButton(new pair(new pair(-40, 123), new pair(168, 50)), 'Ratings', 'Score', 'assets/button.png');
var newsButton = new screenButton(new pair(new pair(-40, 50), new pair(168, 50)), 'News', 'News', 'assets/button.png');
var OAButton = new screenButton(new pair(new pair(-40, 200), new pair(168, 50)), 'Owners and Advertisers', 'OA', 'assets/button.png');
var startReturnButton = new screenButton(new pair(new pair(-40, 50), new pair(168, 50)), 'Return', 'Main', 'assets/button.png');
var upgradesButton = new screenButton(new pair(new pair(-40, 275), new pair(168, 50)), 'Upgrades', 'Upgrades', 'assets/button.png');

//Generating People
// Subjects for each coast, to skew a coast to a certain like or dislike, increase and decrease the amount of subjects
var nwSubjects = ['Business', 'Democrat', 'Democrat', 'Democrat', 'Kaiju', 'Kaiju', 'Medical', 'Sports'];
var nwdisSubjects = ['Business', 'Kaiju', 'Medical', 'Republican', 'Republican', 'Sports'];
var neSubjects = ['Business', 'Business', 'Kaiju', 'Medical', 'Republican', 'Republican', 'Republican', 'Sports'];
var nedisSubjects = ['Business', 'Democrat', 'Democrat', 'Kaiju', 'Medical', 'Sports'];
var swSubjects = ['Business', 'Democrat', 'Democrat', 'Medical', 'Republican', 'Sports', 'Sports', 'Sports'];
var swdisSubjects = ['Business', 'Democrat', 'Kaiju', 'Kaiju', 'Medical', 'Republican'];
var seSubjects = ['Business', 'Democrat', 'Kaiju', 'Medical', 'Medical', 'Medical', 'Republican', 'Republican', 'Sports'];
var sedisSubjects = ['Business', 'Democrat', 'Kaiju', 'Republican', 'Sports', 'Sports'];
// Change the first number to change the population skew per region
var nwCoast = peopleGenerator(300, nwSubjects, nwdisSubjects);
var neCoast = peopleGenerator(100, neSubjects, nedisSubjects);
var swCoast = peopleGenerator(150, swSubjects, swdisSubjects);
var seCoast = peopleGenerator(200, seSubjects, sedisSubjects);
var peoplePool = [nwCoast, neCoast, swCoast, seCoast];

//Generating News
//newsStorySmall(worthiness, headline, sub, tar, subEmo, tarEmo)
var fallStories = [];

var Subject1 = 'Business';
var Subject2 = 'Democrat';
var Subject3 = 'Kaiju';
var Subject4 = 'Medical';
var Subject5 = 'Republican';
var Subject6 = 'Sports';

var modp3 = 5;
var modp2 = 3;
var modp1 = 1;
var modn1 = -1;
var modn2 = -3;
var modn3 = -5;

fallStories.push(new newsStorySmall(6, 'Business Analyst saves Sports. Sports accepts this.', Subject1, Subject6, modp3, modp2));
fallStories.push(new newsStorySmall(6, 'Business Analyst saves Sports. Sports plots revenge.', Subject1, Subject6, modp3,modn3));
fallStories.push(new newsStorySmall(1, 'Business Chef accuses Republican. Republican responds in kind.', Subject1, Subject5, modn2, modp2));
fallStories.push(new newsStorySmall(3, 'Business Citizen admonishes Business. Business responds in kind.', Subject1, Subject1, modn2, modn2));
fallStories.push(new newsStorySmall(3, 'Business Citizen calls out Business. Business demands apology.', Subject1, Subject1, modp1, modn2));
fallStories.push(new newsStorySmall(3, 'Business Citizen complements Kaiju. Kaiju abstains, courteously.', Subject1, Subject3, modp3, modp1));
fallStories.push(new newsStorySmall(4, 'Business Fan complements Republican. Republican plots revenge.', Subject1, Subject5, modp2, modn3));
fallStories.push(new newsStorySmall(10, 'Business Insider accuses Sports. Sports demands apology.', Subject1, Subject6, modn2, modn2));
fallStories.push(new newsStorySmall(10, 'Business Insider insults Business. Business abstains, courteously.', Subject1, Subject1, modn1, modp1));
fallStories.push(new newsStorySmall(8, 'Business Maverick accuses Republican. Republican demands apology.', Subject1, Subject5, modn2,modn2));
fallStories.push(new newsStorySmall(5, 'Business Mayor admonishes Sports. Sports abstains, courteously.', Subject1, Subject6, -5, modp1));
fallStories.push(new newsStorySmall(5, 'Business Mayor attacks Sports. Sports proud of their actions.', Subject1, Subject6, modn3, modp3));
fallStories.push(new newsStorySmall(5, 'Business Mayor complements Kaiju. Kaiju plots revenge.', Subject1, Subject3, modp2, modn3));
fallStories.push(new newsStorySmall(5, 'Business Mayor saves Democrat. Democrat proud of their actions.', Subject1, Subject2, modp3, modp3));
fallStories.push(new newsStorySmall(2, 'Business Outsider accuses Republican. Republican proud of their actions.', Subject1, Subject5, modn2, modp3));
fallStories.push(new newsStorySmall(2, 'Business Outsider complements Medical. Medical accepts this.', Subject1, Subject4, modp2, modp2));
fallStories.push(new newsStorySmall(2, 'Business Outsider complements Republican. Republican plots revenge.', Subject1, Subject5, modp2, modn3));
fallStories.push(new newsStorySmall(9, 'Business Representative accuses Business. Business proud of their actions.', Subject1, Subject1, modn2, modp3));
fallStories.push(new newsStorySmall(9, 'Business Representative admonishes Sports. Sports demands apology.', Subject1, Subject6, -9, modn2));
fallStories.push(new newsStorySmall(1, 'Democrat Chef accuses Democrat. Democrat plots revenge.', Subject2, Subject2, modn2, modn3));
fallStories.push(new newsStorySmall(1, 'Democrat Chef admonishes Democrat. Democrat demands apology.', Subject2, Subject2, modn1, modn2));
fallStories.push(new newsStorySmall(3, 'Democrat Citizen insults Republican. Republican demands apology.', Subject2, Subject5, modn1, modn3));
fallStories.push(new newsStorySmall(7, 'Democrat Doctor attacks Democrat. Democrat confused.', Subject2, Subject2, modn3, modn1));;
fallStories.push(new newsStorySmall(7, 'Democrat Doctor complements Democrat. Democrat demands apology.', Subject2, Subject2, modp2, modn2));
fallStories.push(new newsStorySmall(7, 'Democrat Doctor insults Democrat. Democrat proud of their actions.', Subject2, Subject2, modn1, modp3));
fallStories.push(new newsStorySmall(7, 'Democrat Doctor saves Republican. Republican accepts this.', Subject2, Subject5, modp3, modp2));
fallStories.push(new newsStorySmall(4, 'Democrat Fan calls out Sports. Sports responds in kind.', Subject2, Subject6, modp1, modp1));
fallStories.push(new newsStorySmall(4, 'Democrat Fan insults Business. Business accepts this.', Subject2, Subject1, modn1, modp2));
fallStories.push(new newsStorySmall(10, 'Democrat Insider accuses Kaiju. Kaiju confused.', Subject2, Subject3, modn2, modn1));
fallStories.push(new newsStorySmall(10, 'Democrat Insider admonishes Business. Business responds in kind.', Subject2, Subject1, -10, 10));
fallStories.push(new newsStorySmall(5, 'Democrat Maverick accuses Kaiju. Kaiju demands apology.', Subject2, Subject3, modn2, modn2));
fallStories.push(new newsStorySmall(2, 'Democrat Outsider insults Democrat. Democrat responds in kind.', Subject2, Subject2, modn1, modp1));
fallStories.push(new newsStorySmall(9, 'Democrat Representative calls out Republican. Republican proud of their actions.', Subject2, Subject4, modp1, modp3));
fallStories.push(new newsStorySmall(6, 'Kaiju Analyst attacks Kaiju. Kaiju accepts this.', Subject3, Subject3, modn3, modp2));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion admonishes Democrat. Democrat accepts this.', Subject3, Subject2, -11, modp3));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion admonishes Democrat. Democrat plots revenge.', Subject3, Subject2, -11, modn3));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion calls out Medical. Medical demands apology.', Subject3, Subject4, modp1, modn2));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion insults Democrat. Democrat demands apology.', Subject3, Subject2, modn1, modn2));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion saves Business. Business proud of their actions.', Subject3, Subject1, modp3, modp3));
fallStories.push(new newsStorySmall(11, 'Kaiju Champion saves Kaiju. Kaiju accepts this.', Subject3, Subject3, modp3, modp2));
fallStories.push(new newsStorySmall(1, 'Kaiju Chef saves Republican. Republican proud of their actions.', Subject3, Subject5, modp3, modp3));
fallStories.push(new newsStorySmall(7, 'Kaiju Doctor accuses Sports. Sports confused.', Subject3, Subject6, modn2, modn1));
fallStories.push(new newsStorySmall(7, 'Kaiju Doctor saves Medical. Medical demands apology.', Subject3, Subject4, modp3, modn2));
fallStories.push(new newsStorySmall(4, 'Kaiju Fan accuses Republican. Republican accepts this.', Subject3, Subject5, modn2, modp2));
fallStories.push(new newsStorySmall(4, 'Kaiju Fan saves Medical. Medical accepts this.', Subject3, Subject4, modp3, modp2));
fallStories.push(new newsStorySmall(10, 'Kaiju Insider accuses Sports. Sports abstains, courteously.', Subject3, Subject6, modn2, modp1));
fallStories.push(new newsStorySmall(10, 'Kaiju Insider admonishes Business. Business accepts this.', Subject3, Subject1, -10, modp2));
fallStories.push(new newsStorySmall(10, 'Kaiju Insider admonishes Sports. Sports demands apology.', Subject3, Subject6, -10, modn2));
fallStories.push(new newsStorySmall(10, 'Kaiju Insider attacks Kaiju. Kaiju accepts this.', Subject3, Subject3, modn3, modp2));
fallStories.push(new newsStorySmall(8, 'Kaiju Maverick complements Business. Business confused.', Subject3, Subject1, modp2, modn1));
fallStories.push(new newsStorySmall(5, 'Kaiju Mayor accuses Republican. Republican accepts this.', Subject3, Subject5, modn2, modp2));
fallStories.push(new newsStorySmall(5, 'Kaiju Mayor admonishes Republican. Republican demands apology.', Subject3, Subject5, -5, modn2));
fallStories.push(new newsStorySmall(5, 'Kaiju Mayor attacks Sports. Sports demands apology.', Subject3, Subject6, modn3, modn2));
fallStories.push(new newsStorySmall(5, 'Kaiju Mayor calls out Republican. Republican accepts this.', Subject3, Subject5, modp1, modp2));
fallStories.push(new newsStorySmall(5, 'Kaiju Mayor insults Democrat. Democrat accepts this.', Subject3, Subject2, modn1, modp2));
fallStories.push(new newsStorySmall(2, 'Kaiju Outsider insults Business. Business proud of their actions.', Subject3, Subject1, modn1, modp3));
fallStories.push(new newsStorySmall(2, 'Kaiju Outsider saves Kaiju. Kaiju responds in kind.', Subject3, Subject3, modp3, modp3));
fallStories.push(new newsStorySmall(9, 'Kaiju Representative accuses Business. Business confused.', Subject3, Subject1, modn2, modn1));
fallStories.push(new newsStorySmall(9, 'Kaiju Representative attacks Medical. Medical plots revenge.', Subject3, Subject4, modn3, modn3));
fallStories.push(new newsStorySmall(9, 'Kaiju Representative saves Sports. Sports abstains, courteously.', Subject3, Subject6, modp3, modp1));
fallStories.push(new newsStorySmall(6, 'Medical Analyst attacks Kaiju. Kaiju confused.', Subject4, Subject3, modn3, modn1));
fallStories.push(new newsStorySmall(6, 'Medical Analyst calls out Business. Business abstains, courteously.', Subject4, Subject1, modp1, modp1));
fallStories.push(new newsStorySmall(6, 'Medical Analyst calls out Kaiju. Kaiju abstains, courteously.', Subject4, Subject3, modp1, modp1));
fallStories.push(new newsStorySmall(6, 'Medical Analyst insults Business. Business abstains, courteously.', Subject4, Subject1, modn1, modp1));
fallStories.push(new newsStorySmall(6, 'Medical Analyst saves Business. Business demands apology.', Subject4, Subject1, modp3, modn2));
fallStories.push(new newsStorySmall(1, 'Medical Chef calls out Sports. Sports abstains, courteously.', Subject4, Subject6, modp1, modp1));
fallStories.push(new newsStorySmall(1, 'Medical Chef saves Medical. Medical accepts this.', Subject4, Subject4, modp3, modp2));
fallStories.push(new newsStorySmall(3, 'Medical Citizen admonishes Democrat. Democrat demands apology.', Subject4, Subject2, modn2, modn2));
fallStories.push(new newsStorySmall(3, 'Medical Citizen insults Kaiju. Kaiju confused.', Subject4, Subject3, modn1, modn1));
fallStories.push(new newsStorySmall(7, 'Medical Doctor accuses Kaiju. Kaiju abstains, courteously.', Subject4, Subject3, modn2, modp1));
fallStories.push(new newsStorySmall(4, 'Medical Fan calls out Democrat. Democrat abstains, courteously.', Subject4, Subject2, modp1, modp1));
fallStories.push(new newsStorySmall(8, 'Medical Maverick admonishes Republican. Republican confused.', Subject4, Subject5, -8, modn1));
fallStories.push(new newsStorySmall(8, 'Medical Maverick admonishes Republican. Republican proud of their actions.', Subject4, Subject5, -8, modp3));
fallStories.push(new newsStorySmall(5, 'Medical Mayor saves Business. Business responds in kind.', Subject4, Subject1, modp3, modp3));
fallStories.push(new newsStorySmall(2, 'Medical Outsider accuses Democrat. Democrat abstains, courteously.', Subject4, Subject2, modn2, modp1));
fallStories.push(new newsStorySmall(2, 'Medical Outsider attacks Medical. Medical demands apology.', Subject4, Subject4, modn3, modn2));
fallStories.push(new newsStorySmall(2, 'Medical Outsider complements Kaiju. Kaiju responds in kind.', Subject4, Subject3, modp2, modp2));
fallStories.push(new newsStorySmall(9, 'Medical Representative calls out Business. Business responds in kind.', Subject4, Subject1, modp1, modp1));
fallStories.push(new newsStorySmall(9, 'Medical Representative complements Republican. Republican accepts this.', Subject4, Subject5, modp2, modp2));
fallStories.push(new newsStorySmall(9, 'Medical Representative insults Republican. Republican responds in kind.', Subject4, Subject5, modn1, modn1));
fallStories.push(new newsStorySmall(9, 'Medical Representative saves Sports. Sports accepts this.', Subject4, Subject6, modp3, modp2));
fallStories.push(new newsStorySmall(11, 'Republican Champion calls out Democrat. Democrat demands apology.', Subject5, Subject2, modp1, modn2));
fallStories.push(new newsStorySmall(1, 'Republican Chef accuses Sports. Sports demands apology.', Subject5, Subject6, modn2, modn2));
fallStories.push(new newsStorySmall(1, 'Republican Chef attacks Democrat. Democrat abstains, courteously.', Subject5, Subject2, modn3, modp1));
fallStories.push(new newsStorySmall(1, 'Republican Chef complements Business. Business responds in kind.', Subject5, Subject1, modp2, modp2));
fallStories.push(new newsStorySmall(3, 'Republican Citizen calls out Democrat. Democrat accepts this.', Subject5, Subject2, modp1, modp2));
fallStories.push(new newsStorySmall(7, 'Republican Doctor accuses Republican. Republican proud of their actions.', Subject5, Subject5, modn2, modp3));
fallStories.push(new newsStorySmall(10, 'Republican Insider calls out Sports. Sports proud of their actions.', Subject5, Subject6, modp1, modp3));
fallStories.push(new newsStorySmall(10, 'Republican Insider insults Kaiju. Kaiju confused.', Subject5, Subject3, modn1, modn1));
fallStories.push(new newsStorySmall(10, 'Republican Insider saves Democrat. Democrat proud of their actions.', Subject5, Subject2, modp3, modp3));
fallStories.push(new newsStorySmall(8, 'Republican Maverick admonishes Kaiju. Kaiju confused.', Subject5, Subject3, -8, modn1));
fallStories.push(new newsStorySmall(8, 'Republican Maverick complements Business. Business plots revenge.', Subject5, Subject1, modp2, modn3));
fallStories.push(new newsStorySmall(8, 'Republican Maverick complements Democrat. Democrat accepts this.', Subject5, Subject2, modp2, modp2));
fallStories.push(new newsStorySmall(2, 'Republican Outsider calls out Sports. Sports proud of their actions.', Subject5, Subject6, modp1, modp3));
fallStories.push(new newsStorySmall(2, 'Republican Outsider calls out Sports. Sports responds in kind.', Subject5, Subject6, modp1, modp1));
fallStories.push(new newsStorySmall(2, 'Republican Outsider saves Republican. Republican demands apology.', Subject5, Subject5, modp3, modn2));
fallStories.push(new newsStorySmall(9, 'Republican Representative complements Business. Business abstains, courteously.', Subject5, Subject1, modp2, modp1));
fallStories.push(new newsStorySmall(9, 'Republican Representative insults Democrat. Democrat responds in kind.', Subject5, Subject2, modn1, modp1));
fallStories.push(new newsStorySmall(11, 'Sports Champion accuses Medical. Medical confused.', Subject6, Subject4, modn2, modn1));
fallStories.push(new newsStorySmall(11, 'Sports Champion attacks Business. Business plots revenge.', Subject6, Subject1, modn3, modn3));
fallStories.push(new newsStorySmall(11, 'Sports Champion attacks Kaiju. Kaiju proud of their actions.', Subject6, Subject3, modn3, modp3));
fallStories.push(new newsStorySmall(11, 'Sports Champion saves Democrat. Democrat accepts this.', Subject6, Subject2, modp3, modp2));
fallStories.push(new newsStorySmall(1, 'Sports Chef accuses Medical. Medical demands apology.', Subject6, Subject4, modn2, modn2));
fallStories.push(new newsStorySmall(1, 'Sports Chef admonishes Democrat. Democrat proud of their actions.', Subject6, Subject2, modn1, modp3));
fallStories.push(new newsStorySmall(3, 'Sports Citizen accuses Sports. Sports abstains, courteously.', Subject6, Subject6, modn2, modp1));
fallStories.push(new newsStorySmall(3, 'Sports Citizen complements Democrat. Democrat proud of their actions.', Subject6, Subject2, modp2, modp3));
fallStories.push(new newsStorySmall(10, 'Sports Insider complements Democrat. Democrat plots revenge.', Subject6, Subject2, modp2, modn3));
fallStories.push(new newsStorySmall(10, 'Sports Insider saves Republican. Republican proud of their actions.', Subject6, Subject5, modp3, modp3));
fallStories.push(new newsStorySmall(8, 'Sports Maverick attacks Medical. Medical demands apology.', Subject6, Subject4, modn3, modn2));
fallStories.push(new newsStorySmall(8, 'Sports Maverick calls out Business. Business confused.', Subject6, Subject1, modp1, modn1));
fallStories.push(new newsStorySmall(5, 'Sports Mayor saves Republican. Republican plots revenge.', Subject6, Subject5, modp3, modn3));
fallStories.push(new newsStorySmall(2, 'Sports Outsider attacks Business. Business accepts this.', Subject6, Subject1, modp3, modp2));
fallStories.push(new newsStorySmall(2, 'Sports Outsider attacks Kaiju. Kaiju abstains, courteously.', Subject6, Subject3, modn3, modp1));
fallStories.push(new newsStorySmall(2, 'Sports Outsider insults Sports. Sports plots revenge.', Subject6, Subject6, modn1, modn3));

//Initialize Audio
var bga = new backgroundAudio;
bga.init();

// Creating Screen Array
var screenArray = [];
// Start Menu
var StartMenuScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height))
screenArray.push(new pair('Start',StartMenuScreen));
StartMenuScreen.changeBackground('assets/set2.png');
var frontLogo = new nonObject(new pair(375,100), new pair(300, 300), 'assets/TitleLogo.png');
StartMenuScreen.insertObject(frontLogo);
StartMenuScreen.insertObject(startGameButton);
StartMenuScreen.insertObject(creditsButton);
StartMenuScreen.audioTag(0);


// Main Game Screen
var MainMenuScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('Main', MainMenuScreen));
MainMenuScreen.changeBackground('assets/window.png');
MainMenuScreen.insertObject(ratingsButton);
MainMenuScreen.insertObject(newsButton);
MainMenuScreen.insertObject(OAButton);
MainMenuScreen.insertObject(upgradesButton);
MainMenuScreen.audioTag(1);
MainMenuScreen.firstTimeFunctionSet(StartLetter);

function StartLetter() {
  // message(img_src) calls up an overlay image using an image source provided
  var img = "assets/welcomeLetter.png";
  message(img);
  
  // Convenient place to initialize HUD
  document.getElementById("HUD").style.display = "table-cell";
}


//Credits Screeen
var CreditsScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('Credits', CreditsScreen));
CreditsScreen.changeBackground('assets/madness.png');
CreditsScreen.insertObject(startReturn);

// Ratings Screen
var RatingsScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('Score',RatingsScreen));
RatingsScreen.changeBackground('assets/graph.png');
var scoreScreen = new stationScoreScreen();
RatingsScreen.insertObject(startReturnButton);
var mapofworld = new nonObject(new pair(100,100), new pair(600, 450), 'assets/RatingsScreen-_0000_Layer-2-copy-2.png');
RatingsScreen.insertObject(mapofworld);
RatingsScreen.insertObject(scoreScreen);



//Ratings Advisor
var RatingsAdvisor = new character(new pair(700, 50), new pair(300, 678), 'assets/Jose_like_character.png', 'Hey, we will distribute a weekly report at the end of each show but, for a more indepth look at your perceptual trends, check this screen.        =           ~ Visit me here to see how your nationwide audience views the work we do and how different factions view us. This will be key in how you attract sponsors.         ~ Now a bit about attracting viewers! This is important so listen up!      ~ To learn more about your viewers, mouse over the different regions and they will tell you what they like and dislike.~ At the top of the screen, you can see your ratings for the week, and your ratings overall.                  ~ The latter is what is displayed in your top right hand head ups display! It\'s what you need to not get fired!~ Anyway\'s goodluck, and we\'re all counting on you! Oh, and click me if you need to see this again.', RatingsScreen);
RatingsScreen.insertObject(RatingsAdvisor);

//RatingsPopUp(xyPair, whPair,likes, dislikes, pop, src)
var FarLeft = new RatingsPopUp(new pair(160, 250), new pair(100, 100), ['Democrat', 'Kaiju'], ['Republican'], 300, 'essets/LastWeek-_0003s_0000_OverlayMap.png');
RatingsScreen.insertObject(FarLeft);
var FarRight = new RatingsPopUp(new pair(560, 175), new pair(100, 100), ['Republican', 'Business'], ['Democrat'], 100, 'assets/LastWeek-_0003s_0000_OverlayMap.png');
RatingsScreen.insertObject(FarRight);
var MidRight = new RatingsPopUp(new pair(465, 300), new pair(100, 100), ['Republican', 'Medical'], ['Sports'], 200, 'assets/LastWeek-_0003s_0000_OverlayMap.png');
RatingsScreen.insertObject(MidRight);
var MidLeft = new RatingsPopUp(new pair(290, 425), new pair(100, 100), ['Democrat', 'Sports'], ['Kaiju'], 150, 'assets/LastWeek-_0003s_0000_OverlayMap.png');
RatingsScreen.insertObject(MidLeft);

//AdRepScreen
//factionsBox(xyPair, whPair, scorePtr)
var AdRepBoxRatings = new factionsBox(new pair(100, 550), new pair(600, 50), scoreScreen);
RatingsScreen.insertObject(AdRepBoxRatings);

// News Selection Screen
var NewsSelectionScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('News',NewsSelectionScreen));
NewsSelectionScreen.changeBackground('assets/office1.png');
NewsSelectionScreen.insertObject(startReturnButton);

//News Advisor
var NewsAdvisor = new character(new pair(700, 50), new pair(300, 678), 'assets/Demon_Girl.png', 'Welcome the heart of the studio.                                               ~Here is your production planning screen with your list of available news to report this week. Click on stories from the list to the left to create a tentative program schedule, or Rundown, for this show.~ If you decide to change the message for the evening, click on the story in the Rundown to remove it. When you’re done, use the lock button to go that week’s broadcast.~ Now for the important part! The shades of red show how important a news story is, with darker being more important. You\'ll get more viewers with those, but the less important stories will give a higher reputation with factions.~ On the right of the stories are arrows which show how those stories impact the factions they are about. The left arrow is about the storeis subject, with the right being about it\'s target.~ You can always tell the subject because they are the first one\'s mentioned! Hm... that should be it for now. If you need help, just click me for tips.~', NewsSelectionScreen);
NewsSelectionScreen.insertObject(NewsAdvisor);

// Making boxes to show and select news
var selectedBox = new selectedStoriesBox();
var selectStories = generatePossibleStories(fallStories);
var STORIES_BOX = new smallStoriesBox(selectStories, selectedBox);
NewsSelectionScreen.insertObject(STORIES_BOX);
NewsSelectionScreen.insertObject(selectedBox);

// RATINGS GENERATOR
function ratingsGenerator() {
  var totalViewers = 0;
  for (var i = 0; i < peoplePool.length; ++i) {  // Each Region
    var regionViewers = 0;
    for (var j = 0; j < peoplePool[i].length; ++j) {  // Each Person
      var totalInterest = 0;
      for (var k = 0; k < selectedBox.stories.length; ++k) { // Each Story
          if (selectedBox.stories[k].worthiness >= peoplePool[i][j].worthiness) {
          for (var l = 0; l < peoplePool[i][j].likes.length; ++l) { // Each Like
            if (peoplePool[i][j].likes[l] == selectedBox.stories[k].subject) totalInterest += selectedBox.stories[k].subjectEmotional;
            if (peoplePool[i][j].likes[l] == selectedBox.stories[k].target) totalInterest += selectedBox.stories[k].targetEmotional;
          }
        
          for (var l = 0; l < peoplePool[i][j].likes.length; ++l) { // Each Dislike
            if (peoplePool[i][j].dislikes[l] == selectedBox.stories[k].subject) totalInterest -= selectedBox.stories[k].subjectEmotional;
            if (peoplePool[i][j].dislikes[l] == selectedBox.stories[k].target) totalInterest -= selectedBox.stories[k].targetEmotional;
          }
        }
      } // Each Story
      totalInterest += peoplePool[i][j].loyalty;
      
      
      if (totalInterest >= 5) {
        regionViewers++;
        totalViewers++;
        if (peoplePool[i][j].loyalty < 15) peoplePool[i][j].loyalty += 3;
      }
      else if (peoplePool[i][j].loyalty > 0) peoplePool[i][j].loyalty -= 1; 
    } // Each Person
    scoreScreen.regionRatings[i] = regionViewers;
  } // Each Region
  return totalViewers;
}

//Advertiser Reputation Changer
function AdRep(stories, advertisers) {
  for (var i = 0; i < stories.length; i++) {
    for (var j = 0; j < advertisers.length; j++) {
      if (stories[i].subject == advertisers[j].first) advertisers[j].second += stories[i].subjectEmotional;
      if (stories[i].target == advertisers[j].first) advertisers[j].second += stories[i].targetEmotional;
    }
  }
}

//Draw Function for Lock button
var grayLock = new Image();
grayLock.src = 'assets/NewsScreen-_0006_GreyLock.png';
var openLock = new Image();
openLock.src = 'assets/NewsScreen-_0005_UpLock.png';
function drawLock(con) {
  if (selectedBox.stories.length > 0) {
    con.drawImage(openLock, this.xy.first, this.xy.second, this.wh.first+10, this.wh.second+5);
  }
  else {
    con.fillStyle = 'purple';
    con.drawImage(grayLock, this.xy.first, this.xy.second, this.wh.first+10, this.wh.second+5);
  }  
}
// Collision Function for lock
function colLock() {
  if (mouseUI.isMouseDown && mouseUI.canClick && selectedBox.stories.length > 0) {
      if (mouseUI.xy.first > this.xy.first &&
          mouseUI.xy.first < this.wh.first + this.xy.first && 
          mouseUI.xy.second > this.xy.second && 
          mouseUI.xy.second < this.wh.second + this.xy.second) {
        mouseUI.canClick = false;
        scoreScreen.calculateAverage(ratingsGenerator() / 750);
        for (var i = 0; i < selectedBox.stories.length; ++i) {
          for (var j = 0; j < fallStories.length; ++j) {
            if (selectedBox.stories[i].headline == fallStories[j].headline) fallStories.splice(j, 1);
          }
        }
        STORIES_BOX.stories = generatePossibleStories(fallStories);
        AdRep(selectedBox.stories, scoreScreen.AdReputations);
        anchorBrain.addStories();
        selectedBox.stories = [];
        scoreScreen.turn++;
        currentScreen = screenArray[7].second;
      }
    }
}
// Adding Lock button to screen
var lockButton = new buttonParent(new pair(85, 480), new pair(530, 50), drawLock, colLock, null);
NewsSelectionScreen.insertObject(lockButton);

// Advertisers and Owner
var OwnerAndAdvertiserScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('OA',OwnerAndAdvertiserScreen));
OwnerAndAdvertiserScreen.changeBackground('assets/meeting1.png');
OwnerAndAdvertiserScreen.insertObject(startReturnButton);

//Owner Advisor
var OwnerAdvisor = new character(new pair(700, 50), new pair(300, 678), 'assets/Spenser_like_character.png', 'Hello, Glad to have you aboard… I will be your executive point of contact along with your connection.~ If you find yourself lacking in funding for those important new hires you can come here to sign advertising deals that will secure you additional funding.~ Remember, advertisers have high expectations though so you\'ll need both ratings and a reputation with their faction to get funding.                  ~ Each advertiser will tell you how high your ratings, the number in the upper right display, need to be and your faction reputation is displayed on the bottom of the screen.~ When you realize you weren\'t paying attention, click on me again and I\'ll repeat myself.', OwnerAndAdvertiserScreen);
OwnerAndAdvertiserScreen.insertObject(OwnerAdvisor);

var owner = new ownerObject();
owner.setFunding(scoreScreen);
OwnerAndAdvertiserScreen.insertObject(owner);
//advertiserObject(xyPair, whPair,name, funding, req, standing, scoreSc, sub, gr, cl, cla)
var Kaiju1 = new advertiserObject(new pair(10, 110), new pair(325, 75), 'Foundation For Not Shooting Kaiju in the Face', 2, 5, 7, scoreScreen, 'Kaiju', 'assets/UpgradeScreen-_0000s_0000_Shape-3-copy-11.png', 'assets/UpgradeScreen-_0000s_0000_Shape-3-copy-11.png', 'assets/UpgradeScreen-_0001s_0000_Shape-3-copy-5.png');

var Kaiju2 = new advertiserObject(new pair(345, 110), new pair(325, 75), 'Kaiju Support and Recovery Services', 4, 35, 20, scoreScreen, 'Kaiju', 'assets/UpgradeScreenDark-_0000s_0000_Shape-3-copy-23.png', 'assets/UpgradeScreen-_0000s_0000_Shape-3-copy-11.png', 'assets/UpgradeScreen-_0001s_0000_Shape-3-copy-5.png');

var Republican1 = new advertiserObject(new pair(10, 195), new pair(325, 75), 'Conservative Alliance For Avoiding Real Issues', 3, 15, 10, scoreScreen, 'Republican', 'assets/UpgradeScreenDark-_0000s_0001_Shape-3-copy-22.png', 'assets/UpgradeScreen-_0001s_0001_Shape-3-copy-4.png', 'assets/UpgradeScreen-_0000s_0001_Shape-3-copy-10.png');

var Republican2 = new advertiserObject(new pair(345, 195), new pair(325, 75), 'RNC', 5, 40, 25, scoreScreen, 'Republican', 'assets/UpgradeScreenDark-_0000s_0001_Shape-3-copy-22.png', 'assets/UpgradeScreen-_0001s_0001_Shape-3-copy-4.png', 'assets/UpgradeScreen-_0000s_0001_Shape-3-copy-10.png');

var Sports1 = new advertiserObject(new pair(10, 285), new pair(325, 75), 'Committee For Outdoor Sports Done Indoors', 4, 10, 20, scoreScreen, 'Sports', 'assets/UpgradeScreenDark-_0000s_0002_Shape-3-copy-21.png', 'assets/UpgradeScreen-_0001s_0002_Shape-3-copy-3.png', 'assets/UpgradeScreen-_0000s_0002_Shape-3-copy-9.png');

var Sports2 = new advertiserObject(new pair(345, 285), new pair(325, 75), 'Kaiju Bowl', 6, 75, 25, scoreScreen, 'Sports', 'assets/UpgradeScreenDark-_0000s_0002_Shape-3-copy-21.png', 'assets/UpgradeScreen-_0001s_0002_Shape-3-copy-3.png', 'assets/UpgradeScreen-_0000s_0002_Shape-3-copy-9.png');

var Democrat1 = new advertiserObject(new pair(10, 370), new pair(325, 75), 'Progressive Alliance For Not Staying the Same', 3, 5, 12, scoreScreen, 'Democrat', 'assets/UpgradeScreenDark-_0000s_0003_Shape-3-copy-20.png', 'assets/UpgradeScreen-_0001s_0003_Shape-3-copy.png', 'assets/UpgradeScreen-_0000s_0003_Shape-3-copy-8.png');

var Democrat2 = new advertiserObject(new pair(345, 370), new pair(325, 75), 'DNC', 5, 40, 21, scoreScreen, 'Democrat', 'assets/UpgradeScreenDark-_0000s_0003_Shape-3-copy-20.png', 'assets/UpgradeScreen-_0001s_0003_Shape-3-copy.png', 'assets/UpgradeScreen-_0000s_0003_Shape-3-copy-8.png');

var Medical1 = new advertiserObject(new pair(10, 455), new pair(325, 75), 'Doctors for Trying Really Hard Not to Kill People', 3, 15, 10, scoreScreen, 'Medical', 'assets/UpgradeScreenDark-_0000s_0004_Shape-3-copy-19.png', 'assets/UpgradeScreen-_0001s_0004_Shape-3-copy-2.png', 'assets/UpgradeScreen-_0000s_0004_Shape-3-copy-7.png');

var Medical2 = new advertiserObject(new pair(345, 455), new pair(325, 75), 'Pharmacists For Fancy New Pills', 6, 50, 20, scoreScreen, 'Medical', 'assets/UpgradeScreenDark-_0000s_0004_Shape-3-copy-19.png', 'assets/UpgradeScreen-_0001s_0004_Shape-3-copy-2.png', 'assets/UpgradeScreen-_0000s_0004_Shape-3-copy-7.png');

var Business1 = new advertiserObject(new pair(10, 540), new pair(325, 75), 'Financal Planing Options Through B. gass Bank', 3, 20, 7, scoreScreen, 'Business', 'assets/UpgradeScreenDark-_0000s_0005_Shape-3-copy-18.png', 'assets/UpgradeScreen-_0001s_0005_Shape-3.png', 'assets/UpgradeScreen-_0000s_0005_Shape-3-copy-6.png');

var Business2 = new advertiserObject(new pair(345, 540), new pair(325, 75), 'Dirty Deeds Done Dirt Cheap', 6, 70, 15, scoreScreen, 'Business', 'assets/UpgradeScreenDark-_0000s_0005_Shape-3-copy-18.png', 'assets/UpgradeScreen-_0001s_0005_Shape-3.png', 'assets/UpgradeScreen-_0000s_0005_Shape-3-copy-6.png');


OwnerAndAdvertiserScreen.insertObject(Kaiju1);
OwnerAndAdvertiserScreen.insertObject(Republican1);
OwnerAndAdvertiserScreen.insertObject(Sports1);
OwnerAndAdvertiserScreen.insertObject(Democrat1);
OwnerAndAdvertiserScreen.insertObject(Medical1);
OwnerAndAdvertiserScreen.insertObject(Business1);
OwnerAndAdvertiserScreen.insertObject(Kaiju2);
OwnerAndAdvertiserScreen.insertObject(Republican2);
OwnerAndAdvertiserScreen.insertObject(Sports2);
OwnerAndAdvertiserScreen.insertObject(Democrat2);
OwnerAndAdvertiserScreen.insertObject(Medical2);
OwnerAndAdvertiserScreen.insertObject(Business2);

//AdRepScreen
//factionsBox(xyPair, whPair, scorePtr)
var AdRepBoxOwners = new factionsBox(new pair(35, 620), new pair(600, 50), scoreScreen);
OwnerAndAdvertiserScreen.insertObject(AdRepBoxOwners);

//Upgrades Screen
var UpgradesScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('Upgrades', UpgradesScreen));
UpgradesScreen.changeBackground('assets/office2.png');
UpgradesScreen.insertObject(startReturnButton);
//reporter(xyPair, whPair, reqFund, subj, scScreen)
var KaijuBeatReporter = new beatReporter(new pair(200, 160), new pair(150, 50), 2, 'Kaiju', scoreScreen);
var SportsBeatReporter = new beatReporter(new pair(360, 160), new pair(150, 50), 2, 'Sports', scoreScreen);
var MedicalBeatReporter = new beatReporter(new pair(520, 160), new pair(150, 50), 2, 'Medical', scoreScreen);
var BusinessBeatReporter = new beatReporter(new pair(200, 270), new pair(150, 50), 2, 'Business', scoreScreen);
var RepublicanBeatReporter = new beatReporter(new pair(360, 270), new pair(150, 50), 2, 'Republican', scoreScreen);
var DemocratBeatReporter = new beatReporter(new pair(520, 270), new pair(150, 50), 2, 'Democrat', scoreScreen);
UpgradesScreen.insertObject(KaijuBeatReporter);
UpgradesScreen.insertObject(SportsBeatReporter);
UpgradesScreen.insertObject(MedicalBeatReporter);
UpgradesScreen.insertObject(BusinessBeatReporter);
UpgradesScreen.insertObject(RepublicanBeatReporter);
UpgradesScreen.insertObject(DemocratBeatReporter);
//investReporter(xyPair, whPair, reqFund, subj, scScreen)
var KaijuInvestReporter = new investReporter(new pair(200, 210), new pair(150, 50), 4, 'Kaiju', scoreScreen);
var SportsInvestReporter = new investReporter(new pair(360, 210), new pair(150, 50), 4, 'Sports', scoreScreen);
var MedicalInvestReporter = new investReporter(new pair(520, 210), new pair(150, 50), 4, 'Medical', scoreScreen);
var BusinessInvestReporter = new investReporter(new pair(200, 320), new pair(150, 50), 4, 'Business', scoreScreen);
var RepublicanInvestReporter = new investReporter(new pair(360, 320), new pair(150, 50), 4, 'Republican', scoreScreen);
var DemocratInvestReporter = new investReporter(new pair(520, 320), new pair(150, 50), 4, 'Democrat', scoreScreen);
UpgradesScreen.insertObject(KaijuInvestReporter);
UpgradesScreen.insertObject(SportsInvestReporter);
UpgradesScreen.insertObject(MedicalInvestReporter);
UpgradesScreen.insertObject(BusinessInvestReporter);
UpgradesScreen.insertObject(RepublicanInvestReporter);
UpgradesScreen.insertObject(DemocratInvestReporter);
//airTimeButton(xyPair, whPair, reqFund, scScreen)
var increaseAirTime = new airTimeButton(new pair (360, 100), new pair(150, 50), 8, scoreScreen);
UpgradesScreen.insertObject(increaseAirTime);

//Upgrades Advisor
var UpgradesAdvisor = new character(new pair(700, 50), new pair(300, 678), 'assets/Autumn_Standalone.png', 'Here you can use your funding to upgrade the production abilities of your station as well as hiring specialist reporters to increase the stories available to you.                   ~We run a pretty tight ship here but if you find you have some excess cash in your funding, drop by here and spread it around.~ Now for a bit about your options!                                              ~Beat reporters are great at getting highly emotional stories about the subject, but they aren\'t really important.~ Investigative reporters act the opposite way, always pressing issues but not always the most thrilling! ~And ofcourse, if you find yourself needing to cram more stories in, you can always increase airtime.                                                                                                                                                ~ If you want to talk again, just click on me.~', UpgradesScreen);
UpgradesScreen.insertObject(UpgradesAdvisor);


//News Anchor Page
var NewsAnchorScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('NewsAnchor',NewsAnchorScreen));
NewsAnchorScreen.changeBackground('assets/set1.png');


//NewsAnchor
var NewsAnchor = new character(new pair(700, 50), new pair(300, 678), 'assets/James_like_character.png', '', NewsAnchorScreen);
NewsAnchorScreen.insertObject(NewsAnchor);
NewsAnchorScreen.firstTimeOnScreen = false;
//anchorControl(storiesBox)
var anchorBrain = new anchorControl(selectedBox);
NewsAnchorScreen.insertObject(anchorBrain);

//Fired
var FiredScreen = new screen(new pair(0,0), new pair(canvas.width, canvas.height));
screenArray.push(new pair('Fired',FiredScreen));
FiredScreen.changeBackground('assets/firedscreen.png');

// Setting the main screen
var currentScreen = screenArray[0].second;

// Game Functions
function update() {
  currentScreen.check();
  adjuster();
}

function draw() {
  currentScreen.draw(context);
  bga.start(currentScreen.audio);
  if (document.getElementById("text_box").style.display == "none") GAMESTATE = 'running';
}

var reminder = "assets/ReminderLetter.png";
var reminded = false;
var firedLet = "assets/terminationLetter.png";
var fired = false;
var winLet = "assets/victoryLetter.png";
var won = false;
//GameLoop
function gameLoop() {
  if (scoreScreen.turn == 15 && scoreScreen.sponsers >= 3 && scoreScreen.sponserFunding >= 10 && currentScreen === RatingsScreen && !won && scoreScreen.averagePercentViewers >= 65) {
    message(winLet);
    won = true;
  }
  else if (scoreScreen.turn == 15 && currentScreen === RatingsScreen && !fired) {
    message(firedLet);
    currentScreen = FiredScreen;
    fired = true;
  }
  else if (scoreScreen.turn == 10 && currentScreen === RatingsScreen && !reminded) {
    message(reminder);
    reminded = true;
  }

  switch(GAMESTATE) {
    case 'running':
      update();
    case 'paused':
      draw();
      break;
  }
}

setInterval(gameLoop, 70);








}//]]> 
