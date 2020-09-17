const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

var rects = []
var position;
var src=null, dst=null;
const size = 15;

var slider = document.getElementById("rate");
var output = document.getElementById("rate-text");
output.innerHTML = "wall rate: "  + slider.value + "%"
var randomRate = parseInt(slider.value, 10) / 100;

slider.oninput = function() {
    output.innerHTML = "wall rate: "  + this.value + "%";
    randomRate = parseInt(this.value, 10) / 100;
}

$("#src").prop("checked", true);

class Node {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.fill = false;
        this.index = index;
        this.needReset = false;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }

    draw(){
        if(this.fill){
            ctx.fillRect(this.x, this.y, size, size);
        }
        else {
            ctx.strokeRect(this.x, this.y, size, size);
        }
        ctx.fillStyle = 'rgb(192,192,192)';
    }

    changeColor(color, needReset=false){
        this.needReset = needReset;
        this.fill = true;
        ctx.fillStyle = color;
        this.draw();
    }

    deactive(){
        this.active = false;
        this.changeColor('rgb(0, 0, 0)');
    }

    reset(){
        this.active = true;
        this.changeColor('rgb(192,192,192)')
        this.fill = false;
        this.draw();
    }

    makeSrc(){
        this.active = true;
        this.changeColor('rgb(0, 0, 255)');
    }

    makeDst(){
        this.active = true;
        this.changeColor('rgb(255, 0, 0)');
    }

    
}

function findNode(x, y){
    for(let i=0; i<rects.length; ++i){
        if(x >= rects[i].x && x <= rects[i].x + size){
            if(y >= rects[i].y && y <= rects[i].y + size){
                return rects[i];
            }
        }
    }
    return null;
}

function neighbors(node){
    result = [];
    let left = findNode(node.x-size-1, node.y);
    if(left && left.active){
        result.push(left.index);
    }
    let right = findNode(node.x+size+1, node.y);
    if(right && right.active){
        result.push(right.index);
    }
    let up = findNode(node.x, node.y-size-1);
    if(up && up.active){
        result.push(up.index);
    }
    let down = findNode(node.x, node.y+size+1);
    if(down && down.active){
        result.push(down.index);
    }
    return result
}

for(let i=0; i<canvas.width; i+=size+1){
    for(let j=0; j<canvas.height; j+=size+1){
        let node = new Node(i, j, rects.length);
        rects.push(node);
        node.draw();
    }
}

function randomSrcDst(){
    if(src === null){
        src = rects[Math.floor(Math.random()*rects.length)];
        src.makeSrc();
    }
    if(dst === null){
        dst = rects[Math.floor(Math.random()*rects.length)];
        while(dst === src){
            dst = rects[Math.floor(Math.random()*rects.length)];
        }
        dst.makeDst();
    }
}

randomSrcDst();

function random(){
    for(let i=0; i<rects.length; ++i){
        if(rects[i] != src && rects[i] != dst){
            rects[i].reset();
            let random = Math.random();
            if(random < randomRate){
                rects[i].deactive();
            }
        }
    }
    randomSrcDst();
}


$("#random").click(random);

$("#reset").click(function(){
    rects.forEach(element=>element.reset())
    src = null;
    dst = null;
});

function getMousePosition(canvas, event){
    let rect = canvas.getBoundingClientRect(); 
    let x = event.clientX - rect.left; 
    let y = event.clientY - rect.top;
    return findNode(x, y);
}

canvas.addEventListener("mousedown", function(event){
    let tmp = $("#astar").prop("disabled");
    if(!tmp){
        if($('#src').is(':checked')){
            if(src){
                src.reset();
            }
            src = getMousePosition(canvas, event);
            src.makeSrc();
            if(src === dst){
                dst = null;
            }
        }
        else if($('#dst').is(':checked')){
            if(dst){
                dst.reset();
            }
            dst = getMousePosition(canvas, event);
            dst.makeDst();
            if(dst === src){
                src = null;
            }
        }
        else if($('#wall').is(':checked')){
            let rect = getMousePosition(canvas, event);
            if(rect != src && rect != dst){
                rect.deactive();
            }
        }
        else if($('#del').is(':checked')){
            let rect = getMousePosition(canvas, event);
            if(rect === src){
                src = null;
            }
            else if(rect === dst){
                dst = null;
            }
            rect.reset();
        }
    }
});

function start(algo){
    if(!src || !dst){
        alert("please set up source and destinatin nodes");
    }
    else {
        $("#distance").text("Distance: 0");
        $(".my-input").prop("disabled", true);
        $("#time").text("Time: 0");
        rects.forEach((element)=>{
            if(element.needReset){
                element.reset();
            }
        })
        if(algo === "greedy" || algo === "astar" || algo === "dijkstra"){
            pathFiding(algo);
        }
        else if(algo === "dfs"){
            dfs();
        }
    }
}

$(".algo-btn").click(function () {
    start(this.id);
})


$(document).keypress(function(event){
    if(event.keyCode === 13){
        start();
    }
    if(event.keyCode === 8){
        rects.forEach(element=>element.reset())
    }
    if(event.keyCode === 32){
        random();
    }
})

function getMin(queue, visited, distances){
    let min = Infinity;
    let result = null;
    queue.forEach((element)=>{
        if(!visited.includes(element) && distances[element] < min){
            min = distances[element];
            result = element;
        }
    });
    return result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function delayChangeColor(current, delay,color="rgb(122,122,12)"){
    await sleep(delay);
    rects[current].changeColor(color, true);
}

async function updateVisited(delay, visited){
    await sleep(delay);
    $("#visited").text("Visited: " + visited);
}

async function updateTime(start, delay=1000){
    await sleep(delay);
    let x = Math.floor((new Date().getTime() - start)/1000);
    $("#time").text("Time: " + x);
}

function pathFiding(algo){
    let start = new Date().getTime();
    let counting = true;
    setInterval(function(){
        if(counting){
            updateTime(start);
        }
    });

    let distances = {};
    let prev = {};
    let result = [];
    let greedy = {};

    rects.forEach((element) =>{
        distances[element.index] = Infinity;
        if(algo === "greedy" || algo === "astar"){
            greedy[element.index] = Infinity;
        }
    });
    distances[src.index] = 0;
    greedy[src.index] = 0;

    prev[src.index] = null;
    prev[dst.index] = null;

    let visited = [];
    let myQueue = [];
    myQueue.push(src.index);

    let current = getMin(myQueue, visited, distances);

    let delay = 10;
    while(current != null){
        visited.push(current);
        if(current != src.index){
            delayChangeColor(current, delay);
        }
        updateVisited(delay, visited.length);
        delay += 10;
        let n = neighbors(rects[current]);
        n.forEach((element)=>{
            let d = distances[current] + Math.sqrt(Math.pow(rects[element].x - rects[current].x, 2) + Math.pow(rects[element].y - rects[current].y, 2));
            if(d<distances[element]){
                rects[element].g = rects[current].g + 1;
                rects[element].h = d;
                rects[element].f = rects[element].g + rects[element].h;
                prev[element] = current;
                distances[element] = d;
                if(algo === "greedy"){
                    greedy[element] = distances[element] + Math.pow(rects[element].x - rects[dst.index].x, 2) + Math.pow(rects[element].y - rects[dst.index].y, 2);
                }
                else if(algo === "astar"){
                    greedy[element] = rects[element].f + Math.sqrt(Math.pow(rects[element].x - rects[dst.index].x, 2) + Math.pow(rects[element].y - rects[dst.index].y, 2));
                }
                myQueue.push(element);
            }
        });
        current = getMin(myQueue, visited, distances);
        if(algo === "greedy" || algo === "astar"){
            current = getMin(myQueue, visited, greedy);
        }
        if(current == dst.index){
            break;
        }
    }

    let node = prev[dst.index];
    while(node != null){
        result.push(node);
        node = prev[node];
    }

    setTimeout(function(){
        counting = false;
        let delayMs = 10;
        for(let i = result.length - 2; i >= 0; --i){
            delayChangeColor(result[i], delayMs, "rgb(0, 255, 0)");
            delayMs += 10;
        }
    }, visited.length * 10);

    setTimeout(function(){
        $(".my-input").prop("disabled", false);
        $("#distance").text("Distance: " + (result.length-1));
    }, visited.length * 10 + result.length * 10)
}

function dfs(){
    let start = new Date().getTime();
    let counting = true;
    setInterval(function(){
        if(counting){
            updateTime(start);
        }
    });

    let s = new Stack();
    let delay = 100;
    neighbors(src).forEach((element)=>{
        s.push(element);
    })
    let visited = [];
    let found = false;
    while(!s.isEmpty()){
        let w = s.pop();
        visited.push(w);
        neighbors(rects[w]).forEach((element)=>{
            if(!(visited.includes(element) || s.data.includes(element))){
                s.push(element);
            }
        })
        if(w === dst.index){
            found = true;
            break;
        }
        else if(w != src.index){
            delayChangeColor(w, delay, "rgb(122,122,12)")
            updateVisited(delay, visited.length);
            delay += 10;
        }
    }

    setTimeout(function(){
        $(".my-input").prop("disabled", false);
        counting = false;
        if(visited.includes(dst.index)){
            $("#distance").text("Distance: " + (visited.length-1));
        }
        else {
            $("#distance").text("Distance: -1");
        }
    }, visited.length * 10);
}

class Stack {
    constructor(){
        this.data = [];
        this.top = 0;
    }

    push(element) {
      this.data[this.top] = element;
      this.top = this.top + 1;
    }

   length() {
      return this.top;
   }

   peek() {
      return this.data[this.top-1];
   }

   isEmpty() {
     return this.top === 0;
   }

   pop() {
    if( this.isEmpty() === false ) {
       this.top = this.top -1;
       return this.data.pop(); 
     }
   }

   print() {
      var top = this.top - 1;
      while(top >= 0) { 
          console.log(this.data[top]);
           top--;
       }
    }

    reverse() {
       this._reverse(this.top - 1 );
    }

    _reverse(index) {
       if(index != 0) {
          this._reverse(index-1);
       }
       console.log(this.data[index]);
    }
}