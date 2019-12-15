class Obj {
    constructor(x, y, r, c, cID){ // x, y, radius, color, categoryID
        this.x = x;
        this.y = y;
        this.r = r;

        if(c == null)
            this.c = "red";
        else
            this.c = c;

        this.id = INC_ID; // object ID
        INC_ID++;

        this.cID = cID; // category ID
        if(cID == null)
            alert("ERROR: cID null");

        // CLONE OBJ VARS ->

        // own category
        for(var key in world.getCategory(cID).obj_vars){
            if(world.getCategory(cID).obj_vars.hasOwnProperty(key)){
                this[key] = world.getCategory(cID).obj_vars[key];
            }
        }

        // inherited categories
        for(var i = 0; i < world.getCategory(this.cID).inherited.length; i++){
            if(world.getCategory(this.cID).inherited[i] == -1 || world.getCategory(this.cID).inherited[i] == this.cID) // "choose" option and can't inherit from itself
                continue;

            var categ = world.getCategory(world.getCategory(this.cID).inherited[i]);

            if(categ == null) // probably got deleted
                continue;
        
            for(var key in categ.obj_vars){
                if(categ.obj_vars.hasOwnProperty(key)){
                    this[key] = categ.obj_vars[key];
                }
            }
        }

        // CLONE COMPONENTS ->

        this.components = [];

        for(var i = 0; i < world.getCategory(this.cID).components.length; i++){
            this.components.push(_.cloneDeep(world.getCategory(this.cID).components[i]));

            if(world.getCategory(this.cID).components[i].constructor.name === "AI"){ // AI in obj INIT
                this.components[i].initWeights();
                this.components[i].initOutputWeights();
            }
        }

        // inherited categories
        // ...
    }

    draw(){
        s.ctx.beginPath();
        s.ctx.arc(this.x * s.camera.p - s.camera.x + s.w/2, this.y * s.camera.p - s.camera.y+s.h/2, this.r * s.camera.p, 0, 2 * Math.PI);
        s.ctx.fillStyle = this.c;
        s.ctx.fill();

        var lw = this.r * s.camera.p / 10;
        if(lw < 1.5)
            lw = 1.5;
        s.ctx.lineWidth = lw;

        s.ctx.strokeStyle = "white";
        s.ctx.stroke();
    }

    update(){
        if(this.r < 0)
            this.r = 0;

        this.draw();

        if(world.getCategory(this.cID) == null){ // probably category was deleted
            this.del();
            return false;
        }

        // LAWS ->

        // own category
        for(var key in world.getCategory(this.cID).laws){
            if(world.getCategory(this.cID).laws.hasOwnProperty(key)){
                try{
                    world.getCategory(this.cID).laws[key](this);
                }
                catch(e){
                    console.log("Error in the law '" + key + "' in category '" + world.getCategory(this.cID).name + "': " + e);
                }
            }
        }

        // inherited categories
        for(var i = 0; i < world.getCategory(this.cID).inherited.length; i++){
            if(world.getCategory(this.cID).inherited[i] == -1 || world.getCategory(this.cID).inherited[i] == this.cID) // "choose" option and can't inherit from itself
                continue;
            
            var categ = world.getCategory(world.getCategory(this.cID).inherited[i]);

            if(categ == null) // probably got deleted
                continue;

            for(var key in categ.laws){
                if(categ.laws.hasOwnProperty(key)){
                    try{
                        categ.laws[key](this);
                    }
                    catch(e){
                        console.log("Error in the law '" + key + "' in category '" + categ.name + "': " + e);
                    }
                }
            }
        }

        this.update_components();
    }

    update_components(){
        for(var i = 0; i < this.components.length; i++){
            this.components[i].update(this);

            // AI
            if(this.components[i].constructor.name === "AI"){
                // OUTPUTS
                for(var o = 0; o < this.components[i].outputs.length; o++){
                    if(this.components[i].outputs[o].ref[0] === "_"){
                        // CUSTOM
                        var key = customVars[this.components[i].outputs[o].ref];
                        this[key] = this.components[i].outputs[o].val;
                    }
                    else if(this.components[i].outputs[o].ref[0] === "@"){
                        // VARS
                        let key = this.components[i].outputs[o].ref.substr(1); // remove @
                        this[key] = this.components[i].outputs[o].val;
                    }
                }
            }
        }
    }

    collide(r, cID){
        var a, x, y;

        if(r == null)
            r = this.r;

        for(var i = 0; i < world.objects.length; i++){
            if(this.id == world.objects[i].id)
                continue; // skip itself
            if(world.objects.length <= 1)
                break;

            a = r + world.objects[i].r;
            x = this.x - world.objects[i].x;
            y = this.y - world.objects[i].y;

            if(a > Math.sqrt((x * x) + (y * y))) {
                if(cID != null){ // collide only with a specific category
                    if(cID != world.objects[i].cID)
                        continue;
                }
                return world.objects[i]; // return collided object
            }
        }

        return false;
    }

    repel(vx1, vy1, vx2, vy2, obj, mult1, mult2){  
        var cx1 = this.x;
        var cx2 = obj.x;
        var cy1 = this.y;
        var cy2 = obj.y;

        if(mult1 == null)
            mult1 = 1;
        if(mult2 == null)
            mult2 = 1;
        
        var d = Math.sqrt(Math.pow(cx1 - cx2, 2) + Math.pow(cy1 - cy2, 2)); 
        var nx = (cx2 - cx1) / d; 
        var ny = (cy2 - cy1) / d; 
        var p = 2 * (vx1 * nx + vy1 * ny - vx2 * nx - vy2 * ny) / 
                (mult1 + mult2);
        vx1 = vx1 - p * mult1 * nx;
        vy1 = vy1 - p * mult1 * ny;
        vx2 = vx2 + p * mult2 * nx;
        vy2 = vy2 + p * mult2 * ny;

        return {vx1: vx1, vx2: vx2, vy1: vy1, vy2: vy2};
    }

    move(vX, vY, angle){
        if(angle == null)
            angle = 45; // it's like without angle

        var dx = Math.cos(angle * Math.PI / 180) * vX;
        var dy = Math.sin(angle * Math.PI / 180) * vY;

        this.x += dx;
        this.y += dy;
    }

    range(r){
        if(r == null)
            return false;

        var obj = this;
        
        return {
            count: function(cond){
                var a, x, y;
                var count = 0;

                for(var i = 0; i < world.objects.length; i++){
                    if(obj.id == world.objects[i].id)
                        continue; // skip itself
                    if(world.objects.length <= 1)
                        break;

                    a = r + world.objects[i].r;

                    if(a > distance(world.objects[i], obj)){
                        if(cond != null){
                            if(cond(world.objects[i]) === false){
                                continue;
                            }
                        }

                        count++;
                    }
                }
                return count;
            },
            mass_center: function(){

            }
        }
    }

    nearest(cIDs){
        var res = {dist: 1, x: 0, y: 0, obj: null};

        if(cIDs.length == null){ // not a list
            cIDs = [cIDs];
        }
        
        for(const cID of cIDs){
            var minDist = Infinity;
            var min = 0;

            for(var i = 0; i < world.objects.length; i++){
                if(this.id == world.objects[i].id)
                    continue; // skip itself
                if(world.objects.length <= 1)
                    break;
                
                if(cID != null){
                    if(world.objects[i].cID != cID) // skip other than cID
                        continue;
                }

                var dist = distance(world.objects[i], this);

                if(dist < minDist){ // find smallest distance
                    minDist = dist;
                    min = i;
                }
            }

            if(minDist == Infinity)
                return res;

            res.dist = minDist;

            var x = world.objects[min].x - this.x;
            var y = world.objects[min].y - this.y;
            res.x = x;
            res.y = y;
            res.obj = world.objects[min];
        }

        return res;
    }

    del(){
       world.delObj(this.id);
    }
}