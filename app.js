
// App Dependencies
require("dotenv").config();
const express = require("express");
const _ = require("lodash");
const ejs = require("ejs");
const { default: mongoose, mongo } = require("mongoose");
const app = express();
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");

// Setting EJS, parsing and static folder
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//Setting Authentication
app.use(
	session({
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB integrate with Mongoose and schemas

mongoose.connect("mongodb://localhost:27017/bugFixDB", {
	useNewUrlParser: true,
});

const bugSchema = new mongoose.Schema({
	title: String,
	description: String,
	repeatable: String,
	status: String,
	changes: Array,
	assignedTo: "",
});

const employeeSchema = new mongoose.Schema({
	name: String,
	username: String,
	email: String,
	password: String,
});

employeeSchema.plugin(passportLocalMongoose);

const Bug = mongoose.model("Bug", bugSchema);

const Employee = mongoose.model("Employee", employeeSchema);

passport.use(Employee.createStrategy());
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

// Global Variables
const aboutContent =
	"I built this project using ExpressJS and EJS to provide a dynamicly changing site where end users of the 'software' are able to log bugs and then the employees are able to log in and assign themselves a bug to work on. They are able to make notes on each individual bug page and the pages will be updated with the status and changelog notes for each bug. I handle all the submitted bugs and list of registered employees through MongoDB for this project.";
var currentUser = {};
// App Logic
app.get("/", function (req, res) {
	res.render("login");
	currentUser = {};
});

app.post("/register", function (req, res) {
	if (req.body.registerPassword === req.body.registerRepeatPassword) {
		let employee = new Employee({
			name:
				_.capitalize(req.body.registerFirstName) +
				" " +
				_.capitalize(req.body.registerLastName),
			username: _.toLower(req.body.registerUsername),
			email: _.toLower(req.body.registerEmail),
			password: req.body.registerPassword,
		});

		employee.save().then(() => console.log("Employee Saved."));
	} else {
		console.log("Passwords don't match");
		res.redirect("/");
	}
});

app.post("/login", function (req, res) {
	const enteredUsername = _.toLower(req.body.loginUsername);
	const enteredPassword = req.body.loginUserPassword;

	Employee.findOne({ username: enteredUsername }, function (err, employee) {
		if (employee.password === enteredPassword) {
			currentUser = employee;
			console.log("Thanks for logging in" + currentUser.name);
			res.redirect("/buglist");
		} else {
			console.log("Please try again");
			res.redirect("/");
		}
	});
});

app.get("/buglist", function (req, res) {
	Bug.find({}, function (err, bugs) {
		res.render("buglist", {
			bugs: bugs,
			currentUser: currentUser,
		});
	});
});

app.get("/user-tasks", function (req, res) {
	Bug.find({}, function (err, bugs) {
		res.render("user-tasks", { bugs: bugs, currentUser: currentUser });
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
	console.log(requestedTitle);

	Bug.findOne({ title: req.params.topic }, function (err, bug) {
		console.log(bug);
		res.render("bugs", { bug: bug, currentUser: currentUser });

		app.post("/bugs/:topic", function (req, response) {
			Bug.findOneAndUpdate(
				{ title: req.params.topic },
				{
					$set: {
						status: _.capitalize(req.body.statusSelect),
						assignedTo: req.body.assignedTo,
					},
					$push: { changes: req.body.bugChanges },
				},
				function (err) {
					console.log(err);
				}
			);
			response.redirect("/buglist");
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
