
// App Dependencies
const md5 = require("md5");
const express = require("express");
const _ = require("lodash");
const ejs = require("ejs");
const { default: mongoose, mongo } = require("mongoose");
const { event } = require("jquery");
const app = express();

// MongoDB integrate with Mongoose and schemas

mongoose.connect("mongodb://localhost:27017/bugFixDB", {
	useNewUrlParser: true,
});

const Bug = mongoose.model("Bug", {
	title: String,
	description: String,
	repeatable: String,
	status: String,
	changes: Array,
});

const Employee = mongoose.model("Employee", {
	name: String,
	username: String,
	email: String,
	password: String,
});

// Setting EJS, parsing and static folder
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Global Variables
const aboutContent =
	"I built this project using ExpressJS and EJS to provide a dynamicly changing site where end users of the 'software' are able to log bugs and then the employees are able to log in and assign themselves a bug to work on. They are able to make notes on each individual bug page and the pages will be updated with the status and changelog notes for each bug. I handle all the submitted bugs and list of registered employees through MongoDB for this project.";

// App Logic
app.get("/", function (req, res) {
	res.render("login");
});

app.post("/register", function (req, res) {
	if (md5(req.body.registerPassword) === md5(req.body.registerRepeatPassword)) {
		let employee = new Employee({
			name:
				_.capitalize(req.body.registerFirstName) +
				" " +
				_.capitalize(req.body.registerLastName),
			username: _.toLower(req.body.registerUsername),
			email: _.toLower(req.body.registerEmail),
			password: md5(req.body.registerPassword),
		});

		employee.save().then(() => console.log("Employee Saved."));
	} else {
		console.log("Passwords don't match");
	}
});

app.post("/login", function (req, res) {
	const enteredUsername = _.toLower(req.body.loginUsername);
	const enteredPassword = md5(req.body.loginUserPassword);

	Employee.findOne({ username: enteredUsername }, function (err, employee) {
		if (employee.password === enteredPassword) {
			console.log("Thanks for logging in");
			res.redirect("/buglist");
		} else {
			console.log("Please try again");
		}
	});

	// Employee.find({}, function (err, employees) {
	// 	employees.forEach((employee) => {
	// 		const storedUsername = _.toLower(employee.username);
	// 		const storedPassword = employee.password;
	// 		const loginDetails = {
	// 			username: enteredUsername,
	// 			password: enteredPassword,
	// 		};
	// 		const storedDetails = {
	// 			username: storedUsername,
	// 			password: storedPassword,
	// 		};
	// 		if (_.isEqual(loginDetails, storedDetails)) {
	// 			console.log("Thanks for logging in");
	// 			res.redirect("/buglist");
	// 		} else {
	// 			console.log("Invalid username or password. Please try again.");
	// 		}
	// 	});
	// });
	// if ("registerEmail" in req.body) {
	// 	if (req.body.registerPassword === req.body.registerRepeatPassword) {
	// 		let employee = new Employee({
	// 			name:
	// 				_.capitalize(req.body.registerFirstName) +
	// 				" " +
	// 				_.capitalize(req.body.registerLastName),
	// 			username: req.body.registerUsername,
	// 			email: _.toLower(req.body.registerEmail),
	// 			password: req.body.registerPassword,
	// 		});

	// 		employee.save().then(() => console.log("Employee Saved."));
	// 	} else {
	// 		window.alert("Passwords don't match");
	// 	}
	// } else if ("loginUsername" in req.body) {
	// 	const enteredUsername = _.toLower(req.body.loginUsername);
	// 	const enteredPassword = req.body.loginUserPassword;

	// 	Employee.find({}, function (err, employees) {
	// 		employees.forEach((employee) => {
	// 			const storedUsername = _.toLower(employee.username);
	// 			const storedPassword = employee.password;
	// 			const loginDetails = {
	// 				username: enteredUsername,
	// 				password: enteredPassword,
	// 			};
	// 			const storedDetails = {
	// 				username: storedUsername,
	// 				password: storedPassword,
	// 			};
	// 			if (_.isEqual(loginDetails, storedDetails)) {
	// 				console.log("Thanks for logging in");
	// 				res.redirect("/buglist");
	// 			} else {
	// 			}
	// 		});
	// 	});
	// }
});

app.get("/buglist", function (req, res) {
	Bug.find({}, function (err, bugs) {
		res.render("buglist", {
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

	Bug.find({}, function (err, bugs) {
		bugs.forEach((bug) => {
			const storedTitle = _.lowerCase(bug.title);

			if (storedTitle === requestedTitle) {
				res.render("bugs", { bug: bug });

				app.post("/bugs/:topic", function (req, res) {
					Bug.updateOne(
						{ title: bug.title },
						{
							$push: { changes: req.body.bugChanges },
							$set: { status: _.capitalize(req.body.statusSelect) },
						},
						function (err) {
							console.log(err);
						}
					);
					res.redirect("/buglist");
				});
			}
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
