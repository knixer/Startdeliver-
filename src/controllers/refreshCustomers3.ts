import { NextFunction, Response, Request } from "express";
import customer from "../types/customer.type";
import fs, { promises as fsPromises } from "fs";
import path from "path";

async function refreshCustomers(req: Request, res: Response) {
  let latestUpdate: Date;
  let customerIdList: string;

  try {
    //Get the latest time a customer was updated.
    const date = await fsPromises.readFile(
      path.join(__dirname, "latest_Customer_Update.txt"),
      "utf8"
    );
    latestUpdate = new Date(date);

    //Get the customer Id list for later comparison
    customerIdList = await fsPromises.readFile(
      path.join(__dirname, "customer_Id_List.txt"),
      "utf8"
    );

    //Here I use the latest updated date for performance reasons. We do not need to get all customers. Only the updated ones. I assume here that the api1 endpoint is able to
    //use this parameter
    const updatedCustomersResponse = await fetch(
      `https://api1.example.com/api/v1/customer?latestUpdate=${latestUpdate}`,
      {
        method: "GET",
        mode: "cors",
        headers: {
          Authorization: "example-api-key-1",
        },
      }
    );

    let updatedCustomers: customer[] = await updatedCustomersResponse.json();

    for (var i = 0; updatedCustomers.length; i++) {
      let customerResponse = await fetch(
        "https://api2.example.com/api/v1/customer",
        {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: "example-api-key-2",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedCustomers[i]),
        }
      );

      let customer: customer = await customerResponse.json();
      //If the customer id is not in our customer Id list, then it is a new customer and needs to be added to our Id list.
      //Else, just continue.
      if (!customerIdList.includes(customer.id.toString())) {
        customerIdList += customer.id.toString() + "\n";
      }

      //Updating the latest update date for future refresh calls.
      if (customer.updated_at > latestUpdate) {
        latestUpdate = customer.updated_at;
      }
    } //End of for loop.

    //Save the latest customer update date.
    fs.writeFile(
      path.join(__dirname, "latest_Customer_Update.txt"),
      latestUpdate.toDateString(),
      (err) => {
        if (err) throw err;
      }
    );

    //Save new Id
    fs.writeFile(
      path.join(__dirname, "customer_Id_List.txt"),
      customerIdList,
      (err) => {
        if (err) throw err;
      }
    );

    //kolla igenom om id finns i idfilen och lägg till id om det inte finns.
  } catch (err) {
    console.log("refreshCustomers.ts :: error :: ", err);
  }

  //Use the latest time when getting possible updated customers.
}
