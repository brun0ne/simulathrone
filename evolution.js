// TODO dynamically loaded scripts

var AI_CATEG = 1;

var AI_CATEG_LIST = [1,3];

var FOOD_CATEG = 2;

var AREA = 1000;

var FOOD_AMOUNT = 5;

var POPULATION_SIZE = 25;

var GEN_TIME = 5*1000; // ms

var MUTATION = 40; // divided by 100

var GENERATION = 0; // counter

function reset(){
    for(var i = 0; i < world.objects.length; i++){ // reset pos
        if(world.objects[i].cID != AI_CATEG)
            continue;

        //world.objects[i].x = 0;
        //world.objects[i].y = 0;

        world.objects[i].eaten = 0;
    }

    world.spawn.category = FOOD_CATEG; // spawn food

    for(var o = 0; o < FOOD_AMOUNT; o++){
        world.addObj(null, true);
    }
}

function cFitness(obj){ // = (what's wanted - what's not)
    //return obj.x - Math.abs(obj.y)*1.5;
    
    return obj.eaten;
}

function ai_mult_control(){ // multiple AI categories -- AI_CATEG_LIST
    if(document.hidden == true){
        setTimeout(ai_mult_control, GEN_TIME/world.time);
        return false;
    }

    for(var i = 0; i < AI_CATEG_LIST.length; i++){
        AI_CATEG = AI_CATEG_LIST[i];
        ai_control(false);
    }

    if(world.time != 0){
        setTimeout(ai_mult_control, GEN_TIME/world.time);
    }

    GENERATION -= AI_CATEG_LIST.length;
    GENERATION++;
    $("#ai_generation").html("Gen: " + GENERATION);
}

function ai_control(redo){
    if(document.hidden == true && redo){
        setTimeout(ai_control, GEN_TIME/world.time);
        return false;
    }

    world.spawn.range = true;
    world.spawn.minX = -AREA;
    world.spawn.maxX = AREA;
    world.spawn.minY = -AREA;
    world.spawn.maxY = AREA;

    var fitness = {}; // obj_id : <>

    for(var i = 0; i < world.objects.length; i++){
        if(world.objects[i].cID != AI_CATEG)
            continue;

        fitness[world.objects[i].id] = cFitness(world.objects[i]);
    }

    idsSorted = Object.keys(fitness).sort(function(a, b){ // from smaller to bigger
        return fitness[a]-fitness[b]
    });

    console.log(idsSorted);

    kill = Math.ceil(idsSorted.length / 2);

    for(var i = 0; i < kill; i++){ // kill the worse
        world.delObj(parseInt(idsSorted[i]));
    }

    rePopulate();

    reset();

    GENERATION++;
    $("#ai_generation").html("Gen: " + GENERATION);

    if(world.time != 0 && redo){
        setTimeout(ai_control, GEN_TIME/world.time);
    }
}

function resetGeneration(){
    GENERATION = 0;
    $("#ai_generation").html("");
}

function rePopulate(){
    var len = world.objects.length;

    world.spawn.category = AI_CATEG;

    var spawned = 0;

    var sum = 0;

    for(var i = 0; i < world.objects.length; i++){
        if(world.objects[i].cID == AI_CATEG)
            sum += 1;
    }

    if(sum == 0){ // if every object died, clone last deleted
        for(var i = 0; i < POPULATION_SIZE; i++){
            if(world.deletedObjs[world.deletedObjs.length-i-1] == null)
                break;
            if(world.deletedObjs[world.deletedObjs.length-i-1].cID != AI_CATEG){
                continue;
            }

            world.addObj(null, true);
    
            world.objects[world.objects.length-1].components[0].clone(world.deletedObjs[world.deletedObjs.length-i-1].components[0]);
            world.objects[world.objects.length-1].components[0].mutate(MUTATION);

            sum++;
            spawned++;
        }
    }

    len = world.objects.length;

    while(sum < POPULATION_SIZE && sum != 0){
        for(var i = 0; i < len; i++){
            if(world.objects[i].cID != AI_CATEG)
                continue;
    
            if(sum < POPULATION_SIZE){
                world.addObj(null, true);
                
                world.objects[world.objects.length-1].components[0].clone(world.objects[i].components[0]);
                world.objects[world.objects.length-1].components[0].mutate(MUTATION);
                
                sum++;

                spawned++;
            }
            else
                break;
        }
    }

    console.log(spawned);
    console.log("objs: " + sum);
}
