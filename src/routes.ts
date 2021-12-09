import { Express } from "express";
import getAllCustomers from "./controllers/getAllCustomers";
import updateCustomers from "./controllers/updateCustomers";

function routes(app: Express) {
  app.get("http://localhost:3000/api/v1/customer", getAllCustomers);

  app.get("http://localhost:3000/api/v1/customer/update", updateCustomers);
}

export default routes;
