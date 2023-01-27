//New thing

//import required modules
const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

//Mongo stuff
const dbUrl = "mongodb://127.0.0.1:27017/testdb";
const client = new MongoClient(dbUrl);

//set up Express app
const app = express();
const port = process.env.PORT || 8888;

//define important folders
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//setup public folder
app.use(express.static(path.join(__dirname, "public")));

//In order to parse POST body data as JSON, do the following.
//The following lines will convert the form data from query string format to JSON format.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//test Express app
app.get("/", async (request, response) => {
  //response.status(200).send("Test page again");
  links = await getLinks();
  response.render("index", { title: "Home", menu: links });
});

app.get("/about", async (request, response) => {
  links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

app.get("/admin/menu", async (request, response) => {
  links = await getLinks();
  response.render("menu-list", { title: "Menu links admin", menu: links });
});

app.get("/admin/menu/add", async (request, response) => {
  links = await getLinks();
  response.render("menu-add", { title: "Add link", menu: links });
});

app.get("/admin/menu/edit", async (request, response) => {
  if (request.query.linkId) {
    let id = request.query.linkId;
    let linkToEdit = await getSingleLink(id);
    links = await getLinks();
    response.render("menu-edit", { title: "Edit link", editLink: linkToEdit, menu: links });
  }
  else 
  {
    response.redirect("/admin/menu"); 
  }
});


//FORM PROCESSING PATHS

//here we are getting the values that were added into the ADD A LINK FORM
app.post("/admin/menu/add/submit", async (request, response) => {
  //for a POST form, field values are passed in request.body.<field_name>
  //we can do this because of lines 23-24 above
  let weightVal = request.body.weight; //get the value for field with name="weight"
  let pathVal = request.body.path; //request.body is form POST data
  let nameVal = request.body.name;
  let newLink = {
    weight: weightVal,
    path: pathVal,
    name: nameVal
  };
  await addLink(newLink);
  response.redirect("/admin/menu"); //redirect back to admin page
});

app.get("/admin/menu/delete", async (request, response) => {
  //for a GET form, field values are passed in request.query.<field_name> because we're retrieving from a query string
  let id = request.query.linkId;
  await deleteLink(id);
  response.redirect("/admin/menu");
});


app.post("/admin/menu/edit/submit", async (request, response) => {
  
  //get the _id and set it as a JSON object to use this as a filter
  
  let id = request.body.linkId;
  const idFilter = { _id: new ObjectId(id) }; // IS THIS RIGHT? 

  //get weight/path/name form values and build a JSON object containing these (updated) values
  let weightVal = request.body.weight;
  let pathVal = request.body.path;
  let nameVal = request.body.name;
  let newLink = {
    weight: weightVal,
    path: pathVal,
    name: nameVal
  };

  //run the editLink() function below (awaiting the recieving of values from this POST)
  await editLink(idFilter, newLink);

  //redirect to the admin
  response.redirect("/admin/menu");
});

//SET UP SERVER LISTENING
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

//MONGO FUNCTIONS
async function connection() {
  await client.connect();
  db = client.db("testdb"); //select testdb database
  return db;
}

/* Async function to retrieve all links documents from menuLinks collection. */
async function getLinks() {
  db = await connection(); //await result of connection() and store the returned db
  var results = db.collection("menuLinks").find({}); //{} as the query means no filter, so select all
  res = await results.toArray();
  return res;
}
/* Async function to insert one document into menuLinks AFTER SUBMITTING THE ADD LINK FORM. */
async function addLink(link) {
  db = await connection();
  let status = await db.collection("menuLinks").insertOne(link);
  console.log("link added");
}
/* Async function to delete one document by _id. */
async function deleteLink(id) {
  db = await connection();
  const deleteIdFilter = { _id: new ObjectId(id) };
  const result = await db.collection("menuLinks").deleteOne(deleteIdFilter);
  if (result.deletedCount === 1)
    console.log("delete successful");
}

/* Async function to select one document by _id. */
async function getSingleLink(id) {
  db = await connection();
  const editIdFilter = { _id: new ObjectId(id) };
  const result = db.collection("menuLinks").findOne(editIdFilter);
  return result;
}

/* Async function to edit one document. */
async function editLink(filter, newLink) {
  //fill this out
  db = await connection();

  const updateLink = {
  $set: newLink}

  const result = await db.collection("menuLinks").updateOne(filter, updateLink);

  // log if the changes were updated
  if (result.matchedCount === 1) {
    console.log("link updated");
  } else {
    console.log("no updates");
  }

    return result;

  //https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/
}