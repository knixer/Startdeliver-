import express, { Request, Response, NextFunction } from "express";
import routes from "./routes";
import helmet from "helmet";

const app = express();

//Security
app.use(helmet());
//Able to use json
app.use(express.json());

//CORS, you never know when you will get CORS problems...
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//My routes
routes(app);

//Start the application
app.listen(3000, () => {
  console.log(`Application listening at http://localhost:3000`);
});
