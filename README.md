# Bug-Tracker
Squash-It is a bug tracker project I created using NodeJs and EJS that allowsan "employee" to register with the service or log in if there account already exists to check on the status of any submitted bugs. 
Any users is able to submit a bug through the appropriate form on the site, however only authenticated users are able to view the entire buglist and any changes that are made to them.

Authentication is handled with PassportJs and will pass the users name as a "currentUser" var throughout the site. This allows "employees" to assign themselves bugs and then later see which ones they have specifically assigned to themselves on their dashboard.
Each bug renders its own dynamic page when clicked from the bugslist and will have a status assigned to it, along with a changelog that updates based on what a user submits through the appropriate form below.

MongoDB handles the storage of bugs as well as users and passport salts and hashes passwords for added security.
