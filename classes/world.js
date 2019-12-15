class World {
    constructor(){
        this.name = "world_name";

        this.objects = [];

        this.edited_law = ""; // law currently in edit
        this.edited_category = 0; // ID of category opened in category_settings

        this.categories = []; // table of Category()
        this.actCategID = 0;
        this.actCateg = "";

        this.deletedObjs = []; // store 50 last deleted objs

        this.time = 1;

        this.spawn = {
            amount: 1,
            range: false, // false -- on screen 
            minX: -100, 
            maxX: 100,
            minY: -100,
            maxY: 100,
            minSize: 15,
            maxSize: 25,
            category: 0
        };

        this.cStart = function(){ world.background = "black"; };
        this.cUpdate = function(){
            // ...
        };
    }

    start(){
        this.cStart();
        this.updateInfo();

        this.addCategory("first");
    }

    update(){
        try{
            this.cUpdate();
        }
        catch(e){
            console.log("Error in world update() function: " + e);
        }

        if(this.background.constructor.name === "rgba")
            s.ctx.fillStyle = this.background.color();
        else
            s.ctx.fillStyle = this.background;

        s.ctx.fillRect(0, 0, s.w, s.h);

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

    /* --------- WORLD SETTINGS --------- */

    toggleSettings(){
        if($("#world_settings").css("display") === "none"){
            $("#world_change_name").val(this.name);
            this.updateTextareas();

            $("#world_settings").css("display", "block");
        }
        else
            $("#world_settings").css("display", "none");
    }

    updateTextareas(){
        // update cStart() and cUpdate() edit textareas inside world's settings

        var regex = /\{(([^\0]*).*?([^\0]*))\}/; // only text between { }
        var matched = regex.exec(this.cStart.toString())[1];
        var trimStart = matched.replace(/^\s+|\s+$/g, ''); // without line breaks at the start and end

        matched = regex.exec(this.cUpdate.toString())[1];
        var trimUpdate = matched.replace(/^\s+|\s+$/g, '');

        $("#world_set_start").val(trimStart);
        $("#world_set_update").val(trimUpdate);
    }

    changeFunction(key){
        // change cStart() or cUpdate()

        if(key === "start"){
            var val = $("#world_set_start").val();

            try{
                this.cStart = Function(val);
            }
            catch(e){
                alert("Error in the world's start() function: " + e);
                return false;
            }
        }
        else if(key === "update"){
            var val = $("#world_set_update").val();

            try{
                this.cUpdate = Function(val);
            }
            catch(e){
                alert("Error in the world's update() function: " + e);
                return false;
            }
        }
        else
            return false;
        
        return true;
    }

    changeSetting(key, val, int){
        if(int)
            val = +val;
        
        this[key] = val;

        this.updateInfo();
    }

    updateInfo(){
        $("#world_name").html(this.name);
    }

    /* --------- OBJECTS --------- */

    addObj(obj, ignCount){ // obj - specific obj to spawn; ignCount = true to spawn 1
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

            if(this.spawn.category == 0 || this.getCategory(this.spawn.category) == null){
                if(this.categories.length < 1){
                    alert("There must be at least one category");
                    return false;
                }
                else{
                    this.spawn.category = this.categories[0].id; // first
                }
            }

            var count = 1;
            if(ignCount !== true)
                count = this.spawn.amount;

            for(var i = 0; i < count; i++){
                var r = random(this.spawn.minSize, this.spawn.maxSize);

                var x = random(minX + r, maxX - r);
                var y = random(minY + r, maxY - r);

                this.objects.push(new Obj(x, y, r, "red", this.spawn.category));
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
                        // store deleted objs ->

                        var obj = this.objects[i];
                        this.deletedObjs.push(obj);

                        if(this.deletedObjs.length > 100){
                            this.deletedObjs.splice(0, 1);
                        }

                        // delete obj ->

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

    clone(obj){
        this.objects.push(new Obj(obj.x, obj.y, obj.r, obj.c, obj.cID));

        var cID = obj.cID;

        // CLONE OBJ VARS ->

        // own category
        for(var key in this.getCategory(cID).obj_vars){
            if(this.getCategory(cID).obj_vars.hasOwnProperty(key)){
                this.lastObj()[key] = obj[key];
            }
        }

        // inherited categories
        for(var i = 0; i < this.getCategory(this.lastObj().cID).inherited.length; i++){
            if(this.getCategory(this.lastObj().cID).inherited[i] == -1 || this.getCategory(this.lastObj().cID).inherited[i] == this.lastObj().cID) // "choose" option and can't inherit from itself
                continue;

            var categ = this.getCategory(this.getCategory(this.lastObj().cID).inherited[i]);

            if(categ == null) // propably got deleted
                continue;
        
            for(var key in categ.obj_vars){
                if(categ.obj_vars.hasOwnProperty(key)){
                    this.lastObj()[key] = obj[key];
                }
            }
        }

        // CLONE COMPONENTS ->

        this.lastObj().components = [];

        for(var i = 0; i < this.getCategory(this.lastObj().cID).components.length; i++){
            this.lastObj().components.push(_.cloneDeep(obj.components[i]));

            if(this.getCategory(this.lastObj().cID).components[i].constructor.name === "AI"){ // AI in obj INIT
                // ...
            }
        }

        return this.lastObj(); // return cloned object
    }

    /* --------- SPAWN --------- */ 

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

            // spawn category list is handled in this.updateCategories()

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

            return true;
        }

        if(isNaN(val)) // not a number
            return false;

        this.spawn[opt] = +val;
    }

    /* --------- LAWS --------- */
    
    addLaw(name, f){
        if(this.categories.length < 1){
            alert("There's no category to add a new law");
            return false;
        }
        if(this.actCategID === 0){
            alert("There's no selected category");
            return false;
        }

        if(name == null){
            name = prompt("Enter law's name");
            if(!name)
                return false; // cancel

            if(this.getCategory(this.actCategID).laws[name] != null){
                alert("There already is a law with that name");
                return false;
            }

            f = Function("obj", "// obj.x += 1");
            this.getCategory(this.actCategID).laws[name] = f;
        }
        else
            this.getCategory(this.actCategID).laws[name] = f;

        this.updateLaws();
    }

    updateLaws(){
        $("#laws_list").html("");

        if(this.actCategID == 0 || this.getCategory(this.actCategID) == null) // if category was deleted
            return false;

        var categ = this.getCategory(this.actCategID);
        
        for(var key in categ.laws){ // for each in this.laws
            if(categ.laws.hasOwnProperty(key)){
                var x = "";

                if(key === this.edited_law)
                    x += "text-decoration: underline;";

                $("#laws_list").append("<li style='" + x + "' id='law_" + key + "'><span class='noselect clickable2' onclick='world.editLaw(`" + key + "`)'>" + key + "</span></li>");
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

        $("#law_" + key).css("text-decoration", "underline");
    
        var regex = /\{(([^\0]*).*?([^\0]*))\}/; // only text between { }
        var matched = regex.exec(this.getCategory(this.actCategID).laws[key].toString())[1];
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
            this.getCategory(this.actCategID).laws[this.edited_law] = Function("obj", val);
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
        if(this.getCategory(this.actCategID).laws[name] != null)
            return false;

        this.getCategory(this.actCategID).laws[name] = this.getCategory(this.actCategID).laws[this.edited_law];
        delete(this.getCategory(this.actCategID).laws[this.edited_law]);
        this.edited_law = name;

        this.updateLaws();
    }

    deleteLaw(){
        delete(this.getCategory(this.actCategID).laws[this.edited_law]);
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

            if(this.actCategID == 0 || this.getCategory(this.actCategID) == null){
                alert("No selected category");
                return false;
            }

            this.getCategory(this.actCategID).obj_vars[name] = val;

            for(var i = 0; i < this.objects.length; i++){
                if(this.objects[i].cID == this.actCategID)
                    this.objects[i][name] = val;
            }
        }
        else{
            this.getCategory(this.actCategID).obj_vars[name] = sVal;

            for(var i = 0; i < this.objects.length; i++){
                if(this.objects[i].cID == this.actCategID)
                    this.objects[i][name] = sVal;
            }
        }

        this.updateObjVars();
    }

    updateObjVars(){
        $("#vars_list").html("");
        
        if(this.actCategID == 0 || this.getCategory(this.actCategID) == null) // if category was deleted
            return false;

        for(var key in this.getCategory(this.actCategID).obj_vars){ // for each in this.obj_vars
            if(this.getCategory(this.actCategID).obj_vars.hasOwnProperty(key)){
                $("#vars_list").append("<li id='var_" + key + "'><span class='noselect clickable2' onclick='world.editVar(`" + key + "`)'>" + key + "</span> <span class='noselect clickable2' onclick='world.delVar(`" + key + "`)'>-</span></li>");
            }
        }
    }

    editVar(key){
        var newDef = prompt("New default for var '" + key + "' (will be set on new objects)", this.getCategory(this.actCategID).obj_vars[key]);

        if(!newDef)
            return false; // cancel

        if(!isNaN(newDef)){ // if string is a number
            newDef = +newDef; // convert to a number
        }
        
        this.getCategory(this.actCategID).obj_vars[key] = newDef;
    }

    delVar(key){
        delete(this.getCategory(this.actCategID).obj_vars[key]);

        for(var i = 0; i < this.objects.length; i++){
            if(this.objects[i].cID == this.actCategID)
                delete(this.objects[i][key]);
        }

        this.updateObjVars();
    }

    /* --------- CATEGORIES --------- */

    addCategory(name){
        if(name == null){
            name = prompt("Enter category's name");

            if(!name || name === "")
                return false;
        }

        this.categories.push(new Category(name));

        if(this.categories.length == 1){ // if it's 1st category
            this.spawn.category = this.categories[0].id;
            this.selectCategory(this.categories[0].id);
        }

        this.updateCategories();
    }

    delCategory(name){
        if(confirm("Are you sure you want to delete the category *" + name + "* with all it's content?") === false)
            return false;

        for(var i = 0; i < world.categories.length; i++){
            if(world.categories[i].name === name){
                if(this.spawn.category == world.categories[i].id){
                    if(this.categories.length > 0){
                        this.spawn.category = this.categories[0].id;
                    }
                }

                if(this.actCategID != 0){
                    if(this.getCategory(this.actCategID).laws[this.edited_law] != null)
                        this.editClose();
                }

                if(this.actCateg === name){
                    this.actCategID = 0;
                    this.actCateg = "";
                }

                world.categories.splice(i, 1);
                
                this.updateLaws();
                this.updateObjVars();
                this.updateCategories();
                return true;
            }
        }
        return false;
    }

    selectCategory(id){
        if(id == null || id < 1)
            return false;

        var categ = this.getCategory(id);

        this.actCategID = id;
        this.actCateg = categ.name;

        this.updateCategories(true); // true for no recursion
        $("#categ_" + categ.name).css("font-weight", "bold");
        $("#categ_" + categ.name).css("color", "yellow");

        this.updateLaws();
        this.updateObjVars();
        this.updateComponents();
        this.editClose();
    }

    updateCategories(n){ // n prevents recursion
        $("#category_list").html("");
        
        for(var i = 0; i < this.categories.length; i++){
            var name = this.categories[i].name;

            var delSpan = "<span class='noselect clickable2' onclick='world.delCategory(`" + name + "`)'>-</span>";
            var optSpan = "<span class='noselect clickable2' onclick='world.toggleCategoryOpt(`" + name + "`)'>&#9881;</span>"; // &#9881; is GEAR

            $("#category_list").append("<li><span id='categ_" + name + "' class='noselect clickable2' onclick='world.selectCategory(" + this.categories[i].id + ")'>" + name + "</span> " + optSpan + " " + delSpan + "</li>");
        }

        // SPAWN OPTIONS ->

        var categList = "";
        var selected = "";
        for(var i = 0; i < this.categories.length; i++){
            if(this.categories[i].id == this.spawn.category)
                selected = 'selected="selected"';
            categList += '<option ' + selected + ' id="spawn_category_' + i + '" value="' + this.categories[i].id + '">' + this.categories[i].name; + '</option>';
            selected = "";
        }
        $("#spawn_category").html(categList);

        // <-

        if(this.edited_category != 0)
            this.updateCategoryOpt();

        if(this.actCategID != 0 && n == null){
            this.selectCategory(this.actCategID);
        }
    }

    getCategory(id){
        for(var i = 0; i < this.categories.length; i++){
            if(this.categories[i].id === id){
                return this.categories[i];
            }
        }
    }

    /* --------- CATEGORY SETTINGS --------- */

    toggleCategoryOpt(name){
        if(name != null && ((this.getCategory(this.edited_category) != null) ? (name != this.getCategory(this.edited_category).name) : true)){
            // if the name is given and isn't the same as opened
            
            $("#category_settings_name").html(name);
            $("#category_settings").css("display", "block");

            for(var i = 0; i < this.categories.length; i++){
                if(this.categories[i].name === name){
                    this.edited_category = this.categories[i].id;
                }
            }
            this.updateCategoryOpt();
        }
        else{
            $("#category_settings").css("display", "none");
            this.edited_category = 0;
        }
    }

    updateCategoryOpt(){
        var list = "";

        for(var i = 0; i < this.getCategory(this.edited_category).inherited.length; i++){
            var allCategories = "";
            allCategories += "<option value='-1'>choose</option>"; // "choose" (default) option
            
            for(let j = 0; j < this.categories.length; j++){
                if(this.categories[j].id == this.getCategory(this.edited_category).id) // can't inherit from itself
                    continue;

                var selected = "";
                if(this.getCategory(this.edited_category).inherited[i] == this.categories[j].id)
                    selected = "selected='selected'";

                allCategories += "<option " + selected + " value='" + this.categories[j].id + "'>" + this.categories[j].name + "</option>";
            }

            var delSpan = "<span class='clickable noselect' onclick='world.getCategory(world.edited_category).delInheritance(" + i + ")'>-</span>";

            list += "<li><select index='" + i + "' onchange='world.getCategory(world.edited_category).setInheritance(" + i + ", this.value)'>" + allCategories + "</select>&nbsp;" + delSpan + "</li><br />";
        }

        $("#category_inheritance_list").html(list);

        $("#category_change_name").val(this.getCategory(this.edited_category).name);
    }

    /* --------- COMPONENTS --------- */

    chooseComponent(){
        $("#component_choose_window").show();
    }

    addComponent(){
        var sel = $("#component_choose_select").find(":selected").text();

        this.getCategory(this.actCategID).addComponent(sel);
        this.updateComponents();
    }

    delComponent(ID){
        for(var i = 0; i < this.getCategory(this.actCategID).components.length; i++){
            if(this.getCategory(this.actCategID).components[i].ID == ID){
                this.getCategory(this.actCategID).components.splice(i, 1);
                break;
            }
        }
        this.updateComponents();
    }

    updateComponents(){
        var list = "";
        var count = [];

        for(var i = 0; i < this.getCategory(this.actCategID).components.length; i++){
            var name = this.getCategory(this.actCategID).components[i].constructor.name;
            var c = count[name];

            if(c == null){
                c = 0;
                count[name] = 0;
            }

            list += "<li class='noselect'><span class='clickable2' onclick='world.editComponent(" + this.getCategory(this.actCategID).components[i].ID + ")'>" + name + " (#" + c + ")</span> <span class='clickable noselect' onclick='world.delComponent(" + this.getCategory(this.actCategID).components[i].ID + ")'>-</span></li>";
            count[name]++;
        }

        $("#components_list").html(list);
    }

    editComponent(ID){
        var component;

        for(var i = 0; i < this.getCategory(this.actCategID).components.length; i++){
            if(this.getCategory(this.actCategID).components[i].ID == ID){
                component = this.getCategory(this.actCategID).components[i];
                break;
            }
        }

        this.edited_component = component;

        switch(component.constructor.name){
            case "AI": // AI EDIT
                $("#ai_edit_window").toggle();
                this.updateAIEditWindow();

                break;
        }
    }

    /* --------- COMP: AI --------- */

    updateAIEditWindow(){
        var input_list = "";
        var vars_list = "";

        var custom_list = ["CHOOSE", "COLOR", "POS_X", "POS_Y", "RADIUS"];

        // INPUTS

        for(var i = 0; i < this.edited_component.inputs.length; i++){
            // AVAILABLE VARS
            vars_list = "";

            // HARDCODED (CUSTOM)
            for(var j = 0; j < custom_list.length; j++){
                let x = "";
                if(this.edited_component.inputs[i].ref.substr(1) === custom_list[j]) // check if it's set
                    x = "selected";
                vars_list += "<option value='_" + custom_list[j] + "' " + x + ">" + custom_list[j].toLowerCase() + "</option>";
            }

            // OBJ_VARs
            for(var key in world.getCategory(this.actCategID).obj_vars){
                if(world.getCategory(this.actCategID).obj_vars.hasOwnProperty(key)){
                    let x = "";
                    if(this.edited_component.inputs[i].ref.substr(1) === key) // check if it's set
                        x = "selected";
                    
                    let varHTML = "<option " + x + " value='@" + key + "'>" + key + "</option>"; // @ at the beginning of user's vars
                    vars_list += varHTML;
                }
            }

            // <-

            let inputHTML = "<div><select id='ai_input_" + this.edited_component.inputs[i].ID + "' onchange='world.edited_component.setInput(" + this.edited_component.inputs[i].ID + ")'>" + vars_list + "</select> <span class='clickable noselect' onclick='world.edited_component.delInput(" + this.edited_component.inputs[i].ID + ")'>-</span></div>";
            input_list += inputHTML + "<br /><br />";
        }
        $("#ai_input_list").html(input_list);

        // LAYERS

        var layers = "";

        for(var i = 0; i < this.edited_component.layers.length; i++){
            let margin = i*20;
            let layerHTML = "<div style='position: absolute; left: calc(54% + " + margin + "px); top: 10%; height: 85%; display: flex; flex-direction: column; justify-content: space-between; align-items: center;'>";

            // NEURONS

            for(var j = 0; j < this.edited_component.layer_size; j++){
                layerHTML += "<span>N</span><br />"
            }

            layerHTML += "</div>"
            layers += layerHTML;
        }

        $("#layers_wrapper").html(layers);

        // OUTPUTS

        var outputs = "";
        var margin = this.edited_component.layers.length * 20;

        $("#ai_outputs_title").css("left", "calc(60% + " + margin + "px)");
        $("#ai_output_list").css("left", "calc(75% + " + margin + "px)");

        for(var i = 0; i < this.edited_component.outputs.length; i++){
            // AVAILABLE VARS
            vars_list = "";

            // HARDCODED (CUSTOM)
            for(var j = 0; j < custom_list.length; j++){
                let x = "";
                if(this.edited_component.outputs[i].ref.substr(1) === custom_list[j]) // check if it's set
                    x = "selected";
                vars_list += "<option value='_" + custom_list[j] + "' " + x + ">" + custom_list[j].toLowerCase() + "</option>";
            }

            for(var key in world.getCategory(this.actCategID).obj_vars){
                if(world.getCategory(this.actCategID).obj_vars.hasOwnProperty(key)){
                    let x = "";
                    if(this.edited_component.outputs[i].ref.substr(1) === key) // check if it's set
                        x = "selected";
                    
                    let varHTML = "<option " + x + " value='@" + key + "'>" + key + "</option>"; // @ at the beginning of user's vars
                    vars_list += varHTML;
                }
            }

            // <-

            let outputHTML = "<div><select id='ai_output_" + this.edited_component.outputs[i].ID + "' onchange='world.edited_component.setOutput(" + this.edited_component.outputs[i].ID + ")'>" + vars_list + "</select> <span class='clickable noselect' onclick='world.edited_component.delOutput(" + this.edited_component.outputs[i].ID + ")'>-</span></div>";
            outputs += outputHTML + "<br /><br />";;
        }
        $("#ai_output_list").html(outputs);
    }
}