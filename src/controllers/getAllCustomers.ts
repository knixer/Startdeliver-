import { Request, Response, NextFunction } from "express";
import customer from "../types/customer.type";
import updateFiles from "../helperFunctions/updateFiles";

async function getAllCustomers(req: Request, res: Response) {
  //Get all the customers from API 1
  let customersResponse = await fetch(
    "https://api1.example.com/api/v1/customer",
    {
      method: "GET",
      mode: "cors",
      headers: { Authorization: "example-api-key-1" },
    }
  );
  let customers: customer[] = await customersResponse.json();
  //Finns ingen som postar flera kunder
  //https://stackoverflow.com/questions/44166445/how-to-use-fetch-api-to-get-an-array-back

  /**
   * Due to the POST call only can take a single variable according to the description I will
   * have to loop through the result from the GET call. This will of course not scale well if
   * the array returned by the GET call gets too large. The 2:nd API need to have a POST call that
   * can take an array.
   **/

  //Send all the customers from API 1 to API2 one by one...
  let acceptedCustomers: customer[] = [];

  //I just assume that it is a SQL database with timestamp structure: yyyy-mm-dd hh:mm:ss
  let latestUpdate: Date = new Date(1); // 1970 + 1 millisecond
  let customerIdList: string = "";

  for (let i = 0; customers.length; i++) {
    const customerPostResponse = await fetch(
      "https://api2.example.com/api/v1/customer",
      {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: "example-api-key-2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customers[i]),
      }
    );

    let acceptedCustomer: customer = await customerPostResponse.json();

    //Get the latest update date for later use.
    if (acceptedCustomer.updated_at > latestUpdate) {
      latestUpdate = acceptedCustomer.updated_at;
    }

    //Save customer ID in order to check for deleted customers
    customerIdList += acceptedCustomer.id + "\n";

    acceptedCustomers.push(acceptedCustomer);
  }

  //Saving the latest update date to disk in order to use it when looking for updated customers.
  updateFiles(latestUpdate, customerIdList);

  res.status(200).send(acceptedCustomers);
}

export default getAllCustomers;
