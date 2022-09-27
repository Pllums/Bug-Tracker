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
		secret: process.env.BUG_TRACKER_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB integrate with Mongoose and schemas

mongoose.connect(
	"mongodb+srv://burtonshredder:Alys5a12@bugfixcluster.xu9yunm.mongodb.net/bugFixDB",
	{
		useNewUrlParser: true,
	}
);

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

employeeSchema.plugin(passportLocalMongoose, { usernameLowerCase: true });

const Bug = mongoose.model("Bug", bugSchema);

const Employee = mongoose.model("Employee", employeeSchema);

passport.use(Employee.createStrategy());
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

// Global Variables
const aboutContent =
	"I built this project using ExpressJS and EJS to provide a dynamicly changing site where end users of the 'software' are able to log bugs and then the employees are able to log in and assign themselves a bug to work on. They are able to make notes on each individual bug page and the pages will be updated with the status and changelog notes for each bug. I handle all the submitted bugs and list of registered employees through MongoDB for this project.";
let currentUser = {};

// App Logic
app.get("/", function (req, res) {
	res.render("login");
	currentUser = {}; // resets the currentUser everytime the login page is rendered. This allows me to carry over the actual name of the user to show which bugs are assigned and grert them.
});

app.get("/buglist", function (req, res) {
	if (req.isAuthenticated()) {
		Bug.find({}, function (err, bugs) {
			res.render("buglist", {
				bugs: bugs,
				currentUser: currentUser,
			});
		});
	} else {
		res.redirect("/");
	}
});

app.get("/user-tasks", function (req, res) {
	if (req.isAuthenticated()) {
		Bug.find({}, function (err, bugs) {
			res.render("user-tasks", { bugs: bugs, currentUser: currentUser });
		});
	} else {
		console.log("You are not logged in.");
		res.redirect("/");
	}
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
	if (req.isAuthenticated()) {
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
	} else {
		console.log("You are not logged in.");
		res.redirect("/");
	}
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

app.post("/register", function (req, res) {
	if (req.body.password === req.body.registerRepeatPassword) {
		Employee.register(
			{
				username: req.body.username,
				name:
					_.capitalize(req.body.registerFirstName) +
					" " +
					_.capitalize(req.body.registerLastName),
				email: _.toLower(req.body.registerEmail),
			},
			req.body.password,
			function (err, employee) {
				if (err) {
					console.log(err);
					res.redirect("/");
				} else {
					passport.authenticate("local")(req, res, function () {
						currentUser = employee;
						res.redirect("/buglist");
					});
				}
			}
		);
	} else {
		console.log("Passwords don't match");
		res.redirect("/");
	}
});

app.post("/login", function (req, res) {
	const employee = new Employee({
		username: _.toLower(req.body.username),
		password: req.body.password,
	});
	req.login(employee, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				Employee.findOne(
					{ username: employee.username },
					function (err, result) {
						currentUser = result;
					}
				);
				res.redirect("/buglist");
			});
		}
	});
});

app.get("/logout", function (req, res) {
	req.logout(function (err) {
		if (err) {
			console.log(err);
		}
	});
	res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}

app.listen(port, function () {
	console.log("Server started on port 3000");
});
