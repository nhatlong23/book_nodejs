const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const winston = require("winston");
const fs = require("fs");
var cookieParser = require("cookie-parser");
dotenv.config({ path: ".env" });

const easyPath = require("./utils/easyPath")(__dirname);
const bookRoute = require("./routes/book");
const userRoute = require("./routes/user");

const app = express();

// Create logs directory if not exists
const logDir = easyPath("./logs");
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

// Initialize Winston logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: easyPath("./logs/error.log"), level: "error" }),
		new winston.transports.File({ filename: easyPath("./logs/combined.log") })
	]
});

if (process.env.NODE_ENV !== "production") {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}));
}

//setting view engine
app.set("view engine", "pug");
app.set("views", easyPath("./views"));
//serving static files
app.use(express.static(easyPath("./public")));
//parsing json and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// cookie parse
app.use(cookieParser());

//routes
app.use(bookRoute);
app.use(userRoute);

app.use((req, res, next) => {
	res.status(404).render("error", { msg: "Page Doesn't Exist!" });
});

// error handler
app.use((err, req, res, next) => {
	logger.error(`Error occurred: ${err.stack}`);
	res.status(500).render("error", { msg: "Something went wrong!" });
});

// connect to db and start the server
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	.then(() => {
		logger.info("Connected to MongoDB");
		app.listen(process.env.PORT || 3000, () => {
			logger.info(`Server started on port ${process.env.PORT || 3000}`);
		});
	})
	.catch((error) => {
		logger.error(`Error connecting to MongoDB: ${error.message}`);
		// Handle MongoDB connection error here
	});
