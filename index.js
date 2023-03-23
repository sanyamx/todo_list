//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
//const date = require(__dirname + "/date.js");
const _ = require("lodash");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);

const connectDB = async ()=> {
  try{
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }
  catch (err){
    console.log(err);
    process.exit(1);
  }
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://sanyamx:dunksin33@cluster0.mbf7ter.mongodb.net/todolistDB');

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item({
  name: "Hit the + button to add new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete the item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema)

//Item.insertMany(defaultItems);

app.get("/", function (req, res) {

  //const day = date.getDate();
  Item.find({}).then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
    .catch(function (err) {
      console.log(err);
    });


});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);

  List.findOne({name:listName}).then(function(foundList){
    if(!foundList){
      const list = new List({
        name: listName,
        items: defaultItems
      });
      list.save();
      console.log("saved");
      res.redirect("/"+listName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }) .catch(function(err){
    console.log(err);
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === 'Today'){
    newItem.save();

  res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
  
  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(function(foundItem){Item.deleteOne({_id: checkedItemId})})
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}).then(function(foundList){
      res.redirect("/"+listName);
    }).catch(function(err){
      console.log(err);
    });
  }
  
});



app.get("/about", function (req, res) {
  res.render("about");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
  });
})
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
