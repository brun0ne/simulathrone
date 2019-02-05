class World {
    constructor(){
        this.objects = [];
        this.laws = {}; // table of functions
        this.obj_vars = {}; // vars in all objects

        this.edited_law = ""; // law currently in edit

        this.time = 1;

        this.spawn = {
            amount: 1,
            range: false, // false -- on screen 
            minX: -100, 
            maxX: 100,
            minY: -100,
            maxY: 100,
            minSize: 15,
            maxSize: 25
        };
    }

    start(){
        this.addLaw("1", Function("obj", "// obj.x += 1"));
    }

    update(){
        for(var i = 0; i < this.objects.length; i++){
            this.objects[i].update();
        }
    }

    /* --------- TIME --------- */

    togglePause(){
        if(this.time)
            this.speed(0);
        else
            this.speed(1);
    }

    speed(v){
        this.time = v;
        if(v != 0)
            $("#pause").html("pause");
        else
            $("#pause").html("play");
    }

    /* --------- OBJECTS --------- */

    addObj(obj){
        if(obj == null){ // spawn
            var minX = this.spawn.minX;
            var maxX = this.spawn.maxX;
            var minY = this.spawn.minY;
            var maxY = this.spawn.maxY;

            if(this.spawn.range === false){ // on screen
                minX = (-s.w/2 + s.camera.x) / s.camera.p;
                maxX = (s.w/2 + s.camera.x) / s.camera.p;
                minY = (-s.h/2 + s.camera.y) / s.camera.p;
                maxY = (s.h/2 + s.camera.y) / s.camera.p;
            }

            for(var i = 0; i < this.spawn.amount; i++){
                var r = random(this.spawn.minSize, this.spawn.maxSize);

                var x = random(minX + r, maxX - r);
                var y = random(minY + r, maxY - r);

                this.objects.push(new Obj(x, y, r));
            }
        }
        else{
            // push obj
            this.objects.push(obj);
        }
    }

    delObj(id, notID){
        if(this.objects.length == 0)
            return false;

        if(id == null){
            var r = random(0, this.objects.length - 1);

            this.objects.splice(r, 1); // random index
        }
        else{
            if(notID !== true){ // find ID and splice with index
                for(var i = 0; i < this.objects.length; i++){
                    if(this.objects[i].id === id){
                        this.objects.splice(i, 1);
                        break;
                    }
                }
            }
            else{ // splice with index
                this.objects.splice(id, 1);
            }
        }
    }

    delAll(){
        this.objects = [];
    }

    lastObj(){
        return this.objects[this.objects.length-1];
    }

    toggleSpawnOpt(){
        var display = $("#spawn_options").css("display");

        if(display === "none"){
            $("#spawn_amount").val(this.spawn.amount);

            if(this.spawn.range === false){
                $("#spawn_range_1").attr("selected", true); // on screen

                $("#spawn_custom_range_box").css("display", "none");
            }
            else{
                $("#spawn_range_2").attr("selected", true); // custom

                $("#spawn_custom_range_box").css("display", "block");

                $("#spawn_range_x_min").val(this.spawn.minX);
                $("#spawn_range_x_max").val(this.spawn.maxX);
                $("#spawn_range_y_min").val(this.spawn.minY);
                $("#spawn_range_y_max").val(this.spawn.maxY);
            }

            $("#spawn_size_min").val(this.spawn.minSize);
            $("#spawn_size_max").val(this.spawn.maxSize);

            $("#spawn_options").css("display", "block");
        }else{
            $("#spawn_options").css("display", "none");
        }
    }

    setSpawnOpt(opt, val){
        if(opt === "range"){
            if(val === "on_screen"){ // on screen
                $("#spawn_custom_range_box").css("display", "none");
                this.spawn.range = false;
            }else{
                $("#spawn_custom_range_box").css("display", "block");
                
                $("#spawn_range_x_min").val(this.spawn.minX);
                $("#spawn_range_x_max").val(this.spawn.maxX);
                $("#spawn_range_y_min").val(this.spawn.minY);
                $("#spawn_range_y_max").val(this.spawn.maxY);

                this.spawn.range = true;
            }

            return false;
        }

        if(isNaN(val)) // not a number
            return false;

        this.spawn[opt] = +val;
    }

    /* --------- LAWS --------- */
    
    addLaw(name, f){
        if(name == null){
            name = prompt("Enter law's name");
            if(!name)
                return false; // cancel

            f = Function("obj", "// ...");
            this.laws[name] = f;
        }
        else
            this.laws[name] = f;

        this.updateLaws();
    }

    updateLaws(){
        $("#laws_list").html("");
        
        for(var key in this.laws){ // for each in this.laws
            if(this.laws.hasOwnProperty(key)){
                var x = "";

                if(key === this.edited_law)
                    x += "text-decoration: underline;";

                $("#laws_list").append("<li style='" + x + "' id='" + key + "'><span class='noselect clickable2' onclick='world.editLaw(`" + key + "`)'>" + key + "</span></li>");
            }
        }
    }

    editLaw(key){
        if(this.edited_law == key){ // if it's already opened, close
            this.editClose();
            return false;
        }
        if(this.edited_law !== ""){ // close previous one if it is
            this.editClose();
        }

        $("#" + key).css("text-decoration", "underline");
    
        var regex = /\{(([^\0]*).*?([^\0]*))\}/; // only text between { }
        var matched = regex.exec(this.laws[key].toString())[1];
        var trim = matched.replace(/^\s+|\s+$/g, ''); // without line breaks at the start and end
    
        $("#text_editor").val(trim);
        $("#text_editor_wrapper").css("display", "initial");

        this.edited_law = key;
    }

    editClose(){
        $("li").css("text-decoration", "none");
        $("#text_editor").val("");
        $("#text_editor_wrapper").css("display", "none");

        this.edited_law = "";
    }

    editSave(){
        var val = $("#text_editor").val();

        try{
            this.laws[this.edited_law] = Function("obj", val);
        }
        catch(e){
            alert("Error in the law '" + this.edited_law + "': " + e);
        }
    }

    renameLaw(){
        var name = prompt("New law's name", this.edited_law);
        if(!name){ // cancel
            return false;
        }

        this.laws[name] = this.laws[this.edited_law];
        delete(this.laws[this.edited_law]);
        this.edited_law = name;

        this.updateLaws();
    }

    deleteLaw(){
        delete(this.laws[this.edited_law]);
        this.editClose();
        this.updateLaws();
    }

    /* --------- VARIABLES --------- */

    addObjVar(name, sVal){
        if(name == null){
            name = prompt("Var name");

            if(!name)
                return false; // cancel
            
            var val = prompt("Default value");

            if(!val)
                return false; // cancel

            if(!isNaN(val)){ // if string is a number
                val = +val; // convert to a number
            }

            this.obj_vars[name] = val;

            for(var i = 0; i < this.objects.length; i++){
                this.objects[i][name] = val;
            }
        }
        else{
            this.obj_vars[name] = sVal;

            for(var i = 0; i < this.objects.length; i++){
                this.objects[i][name] = sVal;
            }
        }

        this.updateObjVars();
    }

    updateObjVars(){
        $("#vars_list").html("");
        
        for(var key in this.obj_vars){ // for each in this.obj_vars
            if(this.obj_vars.hasOwnProperty(key)){
                $("#vars_list").append("<li id='" + key + "'><span class='noselect clickable2' onclick='world.editVar(`" + key + "`)'>" + key + "</span> <span class='noselect clickable2' onclick='world.delVar(`" + key + "`)'>-</span></li>");
            }
        }
    }

    editVar(key){
        var newDef = prompt("New default for var '" + key + "' (will be set on new objects)", this.obj_vars[key]);

        if(!newDef)
            return false; // cancel

        if(!isNaN(newDef)){ // if string is a number
            newDef = +newDef; // convert to a number
        }
        
        this.obj_vars[key] = newDef;
    }

    delVar(key){
        delete(this.obj_vars[key]);

        for(var i = 0; i < this.objects.length; i++){
            delete(this.objects[i][key]);
        }

        this.updateObjVars();
    }
}
