//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://AdminZeuz:test123456@todolist.bzp7v2o.mongodb.net/todolistDB");

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const itemsSchema = new mongoose.Schema({
  name : {
    type: String,
    require: true
  }
});

const Item = mongoose.model("Item", itemsSchema);
const item = new Item ({
  name: "Make breakfast"
});

const todoItem = new Item ({
  name: "Go to gym!"
});

const defaultArr = [item, todoItem];

const listSchema = new mongoose.Schema({
  name : String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
    .then((foundedItems) => {
      if (foundedItems.length === 0) {
        // Insert default items and wait for the promise to resolve
        Item.insertMany(defaultArr)
          .then(() => {
            res.redirect("/");
          })
          .catch((err) => {
            console.log("Error inserting default items: " + err);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundedItems });
      }
    })
    .catch((err) => {
      console.log("GET /" + err);
    });
});


app.get("/:customListName", function(req,res){
  const param = _.capitalize(req.params.customListName); //capitlize the first letter

  List.findOne({name: param}).then((result)=>{
    //do something
    if (!result) {
      //create a new list
      const list = new List({
        name: param,
        items: defaultArr
      });
       list.save();
       res.redirect("/" + param);
    } else {
      console.log("exist");
      //render existing list
      res.render("list", {listTitle: result.name, newListItems: result.items});
    }
  }).catch((error)=>{
    console.log("result " + error);
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(listName);

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    //show existing list
    newItem.save();
    res.redirect("/");
  } else {
    // create a new list
    List.findOne({name: listName}).then((foundedList)=>{
      foundedList.items.push(newItem);
      foundedList.save(); //save to db
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }

});

app.post("/delete", (req, res) => {
  const itemId = req.body.itemId;
  const listName = req.body.listName;


  if (listName === "Today") {
    Item.deleteOne({_id: itemId}).then((result) =>{
      console.log("Success!");
      res.redirect("/");
    }).catch(err => {
      console.log(err);
    });
  } else {
   List.findOneAndUpdate({name: listName}, {
    $pull: {
      items: {
        _id : itemId
      }
    }
   }).then(() =>{
    res.redirect("/" + listName);
   }).catch((err) => {
    console.log(err);
   });
   
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
