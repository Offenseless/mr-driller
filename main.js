// HTML5 Mr. Driller
// Authors:
//   Nathan Hamal <nhamal@andrew.cmu.edu>
//   Dylan Mikus <dmikus@andrew.cmu.edu>

// Global variables

//colors used for blocks.
// Everything in this array can be drilled.
var colors= ["red","blue","green","purple"];
function canDrill(block) {
    return (colors.indexOf(block.type) > -1);
}

//maximum rows of blocks stored
//blocks dissappear if they are 15 above the bottom of the screen
var numRows = 15;
// The number of columns of blocks (x width)
var numColumns = 7;

// variables so keycodes are more transparent
var downarrow = 40;
var uparrow = 38;
var leftarrow = 37;
var rightarrow = 39;
var spacebar = 32;
var rKey     = 82;
var inGame = false;
var introScreen = true;
var worldWidth = 420;
var score = 0;
var driller;
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var infoScreen = new Image();
infoScreen.src = "infoScreen.jpg";
infoScreen.onload = function(){
    drawIntroScreen();
    }



// A 2D array of blocks. Block at pos (0,0) is one below canvas display on
// left side. This is like cartesian plane coordinates
var blocks = [];
for(i=0;i<numColumns;i++){
    blocks.push([]); // add second dimensional arrays to each index
}

// Sets up the world and draws objects on canvas
function main() {
    // adding listeners to control driller
    // Focusing canvas so it can register events
    canvas.setAttribute('tabindex','0');
    canvas.focus();
    canvas.addEventListener('keydown', onKeyDown, false);

    intro();
    //setUpWorld();  // does not handle drawings of objects

    // Creating timer to draw screen
    var timerDelay = 50;

    var intervalId = setInterval(onTimer, timerDelay);
}

function intro(){
    window.introScreen= true;
}


function setUpWorld() {
    addEmptyBlocks(2);  // add empty blocks at the bottom of the screen
    addBottomBlocks(5,0,0); // add blocks to bottom of screen, pushing them up
    fillEmpty();        // fill the rest of the grid with empty blocks
    driller = new Driller(3,5);
}

function gameOver(){
    window.inGame=false;
    drawGameOver();
}

// Stuff that happens every time the timer fires
function onTimer() {
    if(window.inGame=== true){
        drawDisplay(); // draws objects on screen
        gravity();
        if(driller.alive === true){
            driller.breathe();
        }else{
            driller.deathTime();
        }
        blocks = animate(blocks);
        // Check if Mr. Driller is in an air pocket
        if (blocks[driller.column][driller.row].type==="air") {
            blocks[driller.column][driller.row].type= "empty";
            driller.airPocket();
        }
        blocks = animate(blocks);
    }
}

//checks all things that can fall to see if they should be falling,
//then makes them fall
function gravity() {
    //check if the driller should fall
    if(blocks[driller.column][driller.row-1].type === "empty" ||
        blocks[driller.column][driller.row-1].type === "air"){
        if (driller.countdown === 0) {
            addBottomBlocks(1,
                .015,
                //this argument is the probability of a durable block
                //essentially this is the function from depth to
                //difficulty, since durable blocks make it harder
                Math.pow(driller.depth/100,2)/
                (5*Math.pow((driller.depth+300)/100,2)));
            driller.depth+=5;
            if(window.blocks[driller.column][driller.row].type === "air"){
                driller.airPocket();
                blocks[driller.column][driller.row].type = "empty";
            }
            driller.resetCountdown();
        } else {
            driller.countdown -= 1;
        }
    }

    var fallObj = blockGravity(blocks);
    blocks = fallObj.blockGrid;
    //check if driller was crushed
    if(window.blocks[driller.column][driller.row].type !== "empty"
       && window.blocks[driller.column][driller.row].type !== "air"
        && driller.alive===true){
        driller.kill();
    }
}

function animate(blocks) {
    var x = 0;
    var y = 0;

    // If block is in middle, shake left
    // If block is left, shake right
    function shakeBlock(block) {
        blockOffset = 5;

        if (block.xOffset >= 0) {
            block.xOffset = -blockOffset;
        } else if (block.xOffset < 0) {
            block.xOffset = blockOffset;
        }

        return block;
    }

    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            if (blocks[x][y].state === "shaking") {
                if (blocks[x][y].countdown % 2 === 0) {
                    blocks[x][y] = shakeBlock(blocks[x][y]);
                }
            } else {
                blocks[x][y].xOffset = 0;
            }
        }
    }

    return blocks;
}



// The player's dude
function Driller(column,row) {
    var countdownFactor = 4;

    this.countdown = countdownFactor;
    this.column = column;
    this.row = row;
    this.lives = 2;
    this.alive = true;
    this.depth = 0;
    this.air = 100;
    this.timeDead = 0;
    // Possibilities: left, right, up, down
    this.drillDirection = "down";

    // Receives input to move around digger
    // Also does object collision detection
    // Pretty sure this will only be called with dx or dy non-zero. Not both
    this.move = function (dx, dy) {
        if(this.alive === false){//prevent moving while driller is dead
            return;
        }
        // Checks for object collision for moving
        if(this.column+dx>=0 && this.column+dx<numColumns
            && this.row+dy>0 && this.row+dy < blocks[this.column].length
            && (blocks[this.column+dx][this.row+dy].type==="empty"
                || blocks[this.column+dx][this.row+dy].type==="air")){
            this.column += dx;
            if(blocks[this.column][this.row].type==="air"){
                blocks[this.column][this.row].type="empty";
                this.airPocket();
            }
        }

        if (dx < 0) this.drillDirection = "left";
        else if (dx > 0) this.drillDirection = "right";
        else if (dy < 0) this.drillDirection = "down";
        else if (dy > 0) this.drillDirection = "up";
    }

    this.airPocket = function(){
        this.air = Math.min(this.air+30,100);
    }

    this.deathTime = function(){
        this.timeDead +=1;
        if(this.timeDead > 30){
            this.timeDead =0;
            this.revive();
        }
    }

    this.breathe = function(){
        this.air -= .07;

        if(this.air<0) {
            this.kill();
        }
    }

    this.kill = function(){//kills the driller
        this.alive= false;
        this.lives--;
        if(this.lives<0){
            gameOver();
        }
    }

    this.revive = function(){
        for(var i= this.column-1;i<=this.column+1;i++){
            if(i<0 || i>=numColumns)
                continue;
            for(var j = this.row; j<numRows;j++){
                blocks[i][j].type="empty";
            }
        this.air =100;
        this.alive=true;
        }
    }

    this.fall = function(){
        this.row--;
    }

    this.drill = function () {
        var pos;
        if(this.alive===false){
            return;
        }
        if (this.drillDirection === "left")
            pos = [this.column - 1, this.row];
        else if (this.drillDirection === "right")
            pos = [this.column + 1, this.row];
        else if (this.drillDirection === "up")
            pos = [this.column, this.row + 1];
        else if (this.drillDirection === "down")
            pos = [this.column, this.row - 1];


        // Check that block is within the bounds of the grid,
        // and disable player from drilling blocks that are currently falling
        if (pos[0] >= 0 && pos[0] < numColumns
            && pos[1] >= 0 && pos[1] < numRows
            && blocks[pos[0]][pos[1]].state !== "falling") {
            var toDrill = blocks[pos[0]][pos[1]];

            // Checks if the thing we are drilling is a drillable block.
            // Everything in colors can be drilled.
            if (canDrill(toDrill)) {
                // Get the group of blocks to be drilled
                var drillGroup = getBlockGroup(blocks,
                                               pos[0], pos[1], toDrill.type);

                // Drill that group of blocks
                drillGroup.forEach(function (point) {
                    blocks[point.x][point.y] = new Block("empty");
                    window.score+=1;
                });
            }else if(toDrill.type==="durable"){
                toDrill.health--;
                if(toDrill.health===0){
                    blocks[pos[0]][pos[1]] = new Block("empty");
                    this.air-= 10;
                }
            }
        }
    }

    this.resetCountdown = function () {
        this.countdown = countdownFactor;
    }
}

//adds a line of empty blocks at the bottom
//used for initiating the screen
function addEmptyBlocks(depth){
    for(var d=0; d<window.depth; d++){
        for(var x=0; x<window.numColumns;x++){
            // pushes a new item onto the beginning of the array
            window.blocks[x].unshift(new Block("empty"));
        }
        if(blocks[x].length>numRows){
            blocks[x].pop();
        }
    }
    return blocks;
}


// Called whenever Mr. Driller moves down or whenever we want to add a new row
// of blocks to the bottom of the array
function addBottomBlocks(depth, airProbability, durableProbability){
    var d;
    for(d=0; d<depth; d++){
        var x;
        for(x=0; x<numColumns;x++){
            // pushes a new item onto the beginning of the array
            window.blocks[x].unshift(new Block(colors[Math.floor(Math.random()*colors.length)]));
            if(Math.random()<airProbability){
                blocks[x][0].type = "air";
            }else if(Math.random()<durableProbability){
                blocks[x][0].type = "durable";
            }
            if(blocks[x].length>numRows){
                blocks[x].pop();
            }
        }
    }
    return blocks;
}

function fillEmpty() {
    var x;
    for (x=0; x < numColumns; x++) {
        var y;
        while (blocks[x].length < numRows) {
            blocks[x].push(new Block("empty"));
        }
    }
}

function onKeyDown(event) {
    var keycode = event.keyCode;

    // Variables for where Mr. Driller moves
    var dx = 0;
    var dy = 0;

    if (keycode === leftarrow) dx--
    else if (keycode === rightarrow) dx++;
    else if (keycode === downarrow) dy--;
    else if (keycode === uparrow) dy++;

    // Shouldn't be able to move up or down by keypresses.

    if (dx !== 0 || dy !== 0) {
        driller.move(dx, dy); // TODO: this is probably messed up
    }

    // Drilling stuff
    if (keycode === spacebar && introScreen ===false) {
        driller.drill();
    }
    if (keycode === spacebar && introScreen ===true) {
        setUpWorld();
        introScreen = false;
        inGame= true;
    }


    // Restart
    if (keycode === rKey
        && window.inGame ===false){
        restartGame();
    }
}

function restartGame(){
    window.blocks = [[],[],[],[],[],[],[]];
    setUpWorld();
    window.score = 0;
    window.depth = 0;
    window.inGame = true;
}



///////// graphics and drawing stuff /////////

function drawScoreboard(width, height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,worldWidth,canvas.height);
    ctx.fillRect(canvas.width - width,0,width,height);
    ctx.fillStyle = "green";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.font = "35px Arial";
    ctx.fillText("LIVES ",
        canvas.width - width + 10 , height/9);
    ctx.textAlign="right";
    ctx.fillText(""+driller.lives,
        canvas.width - 10 , 2*height/9);
    ctx.textAlign= "left";
    ctx.fillStyle = "red";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        3*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("DEPTH: ",
        canvas.width - width + 10 , 3*height/9);
    ctx.textAlign="right";
    ctx.fillText(""+driller.depth+"ft",
        canvas.width -10  , 4*height/9);
    ctx.textAlign= "left";
    ctx.fillStyle = "blue";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        5*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("AIR: ",
        canvas.width - width + 10 , 5*height/9);
    drawRoundedRectangle(ctx,canvas.width - width + 10,
        5.7*height/9,
        width-20,20,5);
    ctx.fillStyle= "blue";
    drawRoundedRectangle(ctx,
        (canvas.width - width + 15)+(1-driller.air/100)*(width - 30),
        5.7*height/9 +5,
        (width-30)*(driller.air/100),10,1);
    ctx.fillStyle= "purple";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        7*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("SCORE: ",
        canvas.width - width + 10, 7*height/9);
    ctx.textAlign="right";
    ctx.fillText(""+window.score+"",
        canvas.width -10  , 8*height/9);
    ctx.textAlign= "left";
}


function drawGameOver(){
    ctx.textAlign="left";
    ctx.fillStyle= "rgba(0,0,0,.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fill();
    ctx.fillStyle= "rgba(255,255,255,.5)";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
    ctx.font = "40px Arial";
    ctx.fillText("Press R to play again", canvas.width/2, canvas.height/2 + 70);
}

function drawDriller(){
    // Draws Mr. Driller body
    ctx.beginPath();
    ctx.fillStyle = "pink";
    ctx.arc(driller.column*60+30,
        canvas.height - driller.row*60+15, 15, 0, 2*Math.PI, true);
    ctx.fill()
    drawRoundedRectangle(ctx, driller.column*60+24,
                        canvas.height-driller.row*60+25,12,20,2);
    ctx.strokeStyle = "pink";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(driller.column*60+14,
                canvas.height-driller.row*60+60);
    ctx.lineTo(driller.column*60+30,
                canvas.height-driller.row*60+33);
    ctx.lineTo(driller.column*60+46,
                canvas.height-driller.row*60+60);
    ctx.stroke();
    ctx.closePath();
    if(driller.alive === false){
        ctx.strokeStyle  = "black";
        ctx.lineWidth    = 4;
        ctx.beginPath();
        ctx.moveTo(driller.column*60+20,
                canvas.height - driller.row*60+10);
        ctx.lineTo(driller.column*60+40,
                canvas.height - driller.row*60+20);
        ctx.stroke();
        ctx.moveTo(driller.column*60+20,
                canvas.height - driller.row*60+20);
        ctx.lineTo(driller.column*60+40,
                canvas.height - driller.row*60+10);
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = "pink";
    }


    // Draw Mr. Driller's drill
    ctx.fillStyle = "#E01B6A";
    var drillOffset = 15;
    if (driller.drillDirection === "down") {
        ctx.beginPath();
        ctx.moveTo(driller.column*60+25,
                    canvas.height-driller.row*60+45);
        ctx.lineTo(driller.column*60+30,
                    canvas.height-driller.row*60+60);
        ctx.lineTo(driller.column*60+35,
                    canvas.height-driller.row*60+45);
        ctx.fill();
    }
    else if (driller.drillDirection === "up") {
        ctx.beginPath();
        ctx.moveTo(driller.column*60+25,
                    canvas.height-driller.row*60+15);
        ctx.lineTo(driller.column*60+30,
                    canvas.height-driller.row*60);
        ctx.lineTo(driller.column*60+35,
                    canvas.height-driller.row*60+15);
        ctx.fill();
    }
    else if (driller.drillDirection === "left") {
        ctx.beginPath();
        ctx.moveTo(driller.column*60+15,
                    canvas.height-driller.row*60+25);
        ctx.lineTo(driller.column*60,
                    canvas.height-driller.row*60+30);
        ctx.lineTo(driller.column*60+15,
                    canvas.height-driller.row*60+35);
        ctx.fill();
    }
    else if (driller.drillDirection === "right") {
        ctx.beginPath();
        ctx.moveTo(driller.column*60+45,
                    canvas.height-driller.row*60+25);
        ctx.lineTo(driller.column*60+60,
                    canvas.height-driller.row*60+30);
        ctx.lineTo(driller.column*60+45,
                    canvas.height-driller.row*60+35);
        ctx.fill();    }
}

function drawWorld() {
    reset();
    drawBlocks();
    drawDriller();
}


// This is the drawing function that happens every time
function drawDisplay() {
    if( window.introScreen){
        drawIntroScreen();
    }else{
    drawScoreboard(canvas.width - worldWidth, canvas.height);
    drawWorld();
    }
}

function drawIntroScreen(){
    ctx.drawImage(window.infoScreen, 0, 0, 600, 600, 0, 0, 600, 600);
}

// Just offshores (to China) the drawing of blocks and figuring out whether to
// connect blocks visually
function drawBlocks(){
    for(column=0; column<numColumns; column++){
        for(index=0; index<blocks[column].length;index++){
            drawBlock(column,index,blocks[column][index].type);
        }
    }
}

// If blocks are adjacent and same color, connects them
function drawBlock(column,row,type){
    function drawNormal(fillStyle) {
        ctx.fillStyle = fillStyle;

        var hasAdjacent = false;

        //detects overlap
        if(column>0 && blocks[column-1][row].type===type) {
            drawRoundedRectangle(ctx,
                                 (column-1)*60+5 + blocks[column][row].xOffset,
                                 canvas.height-row*60+5,
                                 110, 50, 5);
            hasAdjacent = true;
        }
        if(row>0 && blocks[column][row-1].type===type) {
            drawRoundedRectangle(ctx,
                                 column*60+5 + blocks[column][row].xOffset,
                                 canvas.height-row*60+5,
                                 50, 110, 5);
            hasAdjacent = true;
        }
        if(hasAdjacent===false) {
            drawRoundedRectangle(ctx,
                                 column*60+5 + blocks[column][row].xOffset,
                                 canvas.height-row*60+5,
                                 50, 50, 5);
        }
    }

    function drawAir() {
        ctx.fillStyle = "lightblue";
        var radius = 12;
        circle(ctx,
               column*60 + (1.5 * radius) + blocks[column][row].xOffset,
               canvas.height - (row-1)*60 - (1.5 * radius),
               radius);

        circle(ctx,
               (column)*60 + 30 + blocks[column][row].xOffset,
               canvas.height - (row)*60 + 30,
               radius);

        circle(ctx,
               (column+1)*60 - (1.5 * radius) + blocks[column][row].xOffset,
               canvas.height - (row)*60 + (1.5 * radius),
               radius);
    }

    function drawDurable(block) {
        var r = 122;
        var g = 71;
        var b = 20;
        var a = 1 - (3 - block.health)*0.25;

        ctx.fillStyle = rgbToString(r,g,b,a);
        drawRoundedRectangle(ctx,
                             column*60+5 + blocks[column][row].xOffset,
                             canvas.height-row*60+5,
                             50, 50, 5);

        var innerTopLeft = {"x": column*60+10 + blocks[column][row].xOffset,
                            "y": canvas.height-row*60+10};
        ctx.fillStyle = rgbToString(r-20,g-20,b-20, a);
        drawRoundedRectangle(ctx,
                             innerTopLeft.x,
                             innerTopLeft.y,
                             40, 40, 5);

        var oldWidth = ctx.lineWidth;
        ctx.fillStyle = rgbToString(r+10, g+10, b+10, a);
        ctx.lineWidth = 5;
        drawLine(innerTopLeft.x+5, innerTopLeft.y+5,
                 innerTopLeft.x + 35, innerTopLeft.y + 35);
        drawLine(innerTopLeft.x+5, innerTopLeft.y + 35,
                 innerTopLeft.x + 35, innerTopLeft.y+5);
        ctx.lineWidth = oldWidth;
    }

    //dont draw anything for empty blocks
    if(type ==="empty")
        return;
    if(type==="blue") {
        drawNormal("blue");
//        drawDurable();
    }
    else if(type==="green") {
        drawNormal("green");
    }
    else if(type==="red") {
        drawNormal("red");
    }
    else if(type==="purple") {
        drawNormal("purple");
    }
    // drawing air and durables should be different
    // they don't connect
    else if(type==="air") {
        // ctx.fillStyle = "lightblue";
        drawAir();
    }
    else if(type==="durable") {
        drawDurable(blocks[column][row]);
    }
}

function reset(){
    ctx.fillStyle= "black";
    ctx.fillRect(0,0,worldWidth,canvas.height);
}

function drawRoundedRectangle(ctx,x,y,width,height,radius){
    ctx.beginPath();
    ctx.moveTo(x,y+radius);
    ctx.lineTo(x,y+height-radius);
    ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
    ctx.lineTo(x+width-radius,y+height);
    ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    ctx.lineTo(x+width,y+radius);
    ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
    ctx.lineTo(x+radius,y);
    ctx.quadraticCurveTo(x,y,x,y+radius);
    ctx.fill();
}

function circle(ctx, cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    ctx.fill();
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function rgbToString(r, g, b,a) {
    var retStr;

    if (a === undefined) {
        retStr = ("rgb(" + String(r) + ","
                  + String(g) + ","
                  + String(b) + ")");
    } else {
        retStr = ("rgba(" + String(r) + ","
                  + String(g) + ","
                  + String(b) + ","
                  + String(a) + ")");
    }
    return retStr;
}

main();
