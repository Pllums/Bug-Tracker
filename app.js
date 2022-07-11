
// App Dependencies
const express = require("express");
const _ = require("lodash");
const ejs = require("ejs");
const { default: mongoose, mongo } = require("mongoose");
const app = express();

// MongoDB integrate with Mongoose and schemas

mongoose.connect("mongodb://localhost:27017/bugFixDB", { useNewUrlParser: true });

const Bug = mongoose.model("Bug",{
	title: String,
	description: String,
	repeatable: String,
	status: String,
	changes: Array
});

const Employee = mongoose.model("Employee", {
	name : String,
	username: String,
	email: String,
	password: String

});

// Setting EJS, parsing and static folder
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Global Variables
const homeStartingContent =
	"Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
	"Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
	"Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


// App Logic
app.get("/", function(req, res){
	res.render("login")
	// $(".registerBtn").onClick(function(event) {
	// 	console.log(event);
	// });
});



app.post("/", function(req, res){
		
	let employee = new Employee( {
		name : _.capitalize(req.body.registerFirstName) + _.capitalize(req.body.registerLastName),
		username: req.body.registerUsername,
		email: _.lowerCase(req.body.registerEmail),
		password: req.body.registerPassword
	});
	employee.save().then(() => console.log("Employee Saved."));
});

app.get("/buglist", function (req, res) {
	Bug.find({},function (err, bugs){
		res.render("buglist", {
		homeStartingContent: homeStartingContent,
		bugs: bugs,
		});
	});
});

app.get("/about", function (req, res) {
	res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
	res.render("contact", { contactContent: contactContent });
});

app.get("/submit", function (req, res) {
	res.render("submit");
});

//Dynamically render a bug on its own page for futher reading using EJS.

app.get("/bugs/:topic", function (req, res) {
	const requestedTitle = _.lowerCase(req.params.topic);
 
	Bug.find({}, function(err, bugs){
		bugs.forEach(bug => {
			const storedTitle = _.lowerCase(bug.title);

			if (storedTitle === requestedTitle) {
				res.render("bugs", { bug: bug })

				app.post("/bugs/:topic", function(req,res){
					Bug.updateOne({title: bug.title}, {$push:{changes: (req.body.bugChanges)}, $set:{status:_.capitalize(req.body.statusSelect)}}, function(err){
						console.log(err);
					});
					res.redirect("/buglist");
				});
			};
		});
	});
});

//Adding a new bug to the database when using the post method.

app.post("/submit", function (req, res) {	
	console.log(req.body);
	let newBug = new Bug({
		title: _.capitalize(req.body.bugTitle),
		description: _.capitalize(req.body.bugDescription),
		repeatable: _.capitalize(req.body.repeatable),
		status: "Queued",
		});
		newBug.save().then(() => console.log("Bug submitted."));
	
	res.redirect("/buglist");
	
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
