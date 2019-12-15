class Category{
    constructor(name){
        this.name = name;

        this.laws = {}; // table of functions
        this.obj_vars = {}; // vars in all objects
        this.components = []; // table of components

        this.inherited = [];

        this.id = INC_C_ID;
        INC_C_ID++;

        this.INC_COMPONENT_ID = 0;
    }

    addInheritance(id){
        if(id == null)
            id = -1; // -1 is "choose" option
        
        this.inherited.push(id);

        world.updateCategoryOpt();
    }

    delInheritance(index){
        if(index == null || index < 0)
            return false;

        this.inherited.splice(index, 1);

        world.updateCategoryOpt();
    }

    setInheritance(index, cID){
        for(var i = 0; i < this.inherited.length; i++){
            if(this.inherited[i] == cID){
                return false; // avoid duplicates
            }
        }

        if(cID != this.id)
            this.inherited[index] = +cID; // cID of inherited categ
    }

    changeName(name){
        if(name != null || name != ""){
            this.name = name;
            world.updateCategories();
        }
    }

    addComponent(sel){
        if(sel){
            this.components.push(new AI());
            this.components[this.components.length-1].ID = this.INC_COMPONENT_ID;
            this.INC_COMPONENT_ID++;
        }
    }
}